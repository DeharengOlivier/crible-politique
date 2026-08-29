import { LikertValue } from "@/types/positions";

// Whether a statement measures the same thing in both political systems.
//
// A questionnaire that mixes two countries rests on an assumption nobody
// usually states: that agreeing with a statement places a respondent at the
// same political spot in both. That assumption is testable. Correlate the
// party positions on the statement with an external placement of those same
// parties (CHES), once per country and once per axis, then compare the two
// orientations. If they point opposite ways on any axis, the statement is not
// one measurement, it is two that happen to share a wording.
//
// Checking every axis and not only left-right is what makes the test bite.
// Decentralisation is orthogonal to general left-right in France (rho -0.04)
// and mildly right-coded in Belgium (+0.45), which looks innocent; on the
// libertarian-authoritarian axis it is -0.35 in France and +0.36 in Belgium,
// which is the contradiction, and the reason it is now two statements.
//
// Pure functions over numbers: no data import, so a caller can run the check
// against historical values as easily as against the current corpus.

/** Below this, an orientation is too weak to contradict anything. */
export const SUBSTANTIAL_ORIENTATION = 0.3;

/**
 * Spearman rank correlation. Returns 0 rather than NaN when either side is
 * constant, because "no variation" is an absence of orientation, not an error.
 *
 * O(n log n) in the number of parties, which is at most a few dozen.
 */
export function spearman(xs: readonly number[], ys: readonly number[]): number {
    if (xs.length !== ys.length || xs.length < 2) return 0;

    const ranksOf = (values: readonly number[]): number[] => {
        // Average ranks for ties, so a scale with many equal values is not
        // given an arbitrary order.
        const sorted = values.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
        const ranks = new Array<number>(values.length);
        let i = 0;
        while (i < sorted.length) {
            let j = i;
            while (j + 1 < sorted.length && sorted[j + 1][0] === sorted[i][0]) j++;
            const averageRank = (i + j) / 2;
            for (let k = i; k <= j; k++) ranks[sorted[k][1]] = averageRank;
            i = j + 1;
        }
        return ranks;
    };

    const rx = ranksOf(xs);
    const ry = ranksOf(ys);
    const n = xs.length;
    const meanX = rx.reduce((a, b) => a + b, 0) / n;
    const meanY = ry.reduce((a, b) => a + b, 0) / n;

    let covariance = 0;
    let varianceX = 0;
    let varianceY = 0;
    for (let i = 0; i < n; i++) {
        covariance += (rx[i] - meanX) * (ry[i] - meanY);
        varianceX += (rx[i] - meanX) ** 2;
        varianceY += (ry[i] - meanY) ** 2;
    }
    const denominator = Math.sqrt(varianceX * varianceY);
    return denominator === 0 ? 0 : covariance / denominator;
}

/**
 * How strongly agreeing with a statement goes with sitting high on an external
 * axis. Positive: the parties placed higher on that axis agree more.
 */
export function orientationAgainstAxis(
    positions: readonly LikertValue[],
    axisPlacements: readonly number[]
): number {
    return spearman(positions, axisPlacements);
}

/** The CHES axes a common statement is checked against, all of them. */
export const INVARIANCE_AXES = [
    "position",
    "lrecon",
    "galtan",
    "eu_position",
    "immigrate_policy",
    "environment"
] as const;

export type InvarianceAxis = (typeof INVARIANCE_AXES)[number];

/**
 * Whether two country orientations of the same statement contradict each other.
 *
 * Only a substantial opposition counts. A statement orthogonal to left-right in
 * one country is not evidence of anything, and treating a near-zero orientation
 * as a contradiction would reject perfectly comparable statements.
 */
export function contradictsAcrossCountries(orientationA: number, orientationB: number): boolean {
    return (
        Math.abs(orientationA) >= SUBSTANTIAL_ORIENTATION &&
        Math.abs(orientationB) >= SUBSTANTIAL_ORIENTATION &&
        Math.sign(orientationA) !== Math.sign(orientationB)
    );
}
