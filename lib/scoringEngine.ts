import {
    AnswerRecord,
    ArchetypeLabelMap,
    DimensionKey,
    LikertValue,
    PartyStance,
    Respondent,
    SourceStatus,
    Statement,
    StanceSource
} from "@/types/positions";
import { STATEMENTS } from "@/data/statements";
import { PARTY_POSITIONS } from "@/data/partyPositions";
import { ARCHETYPE_SIGNATURES } from "@/data/archetypeSignatures";
import { SYNTHETIC_PROFILES, SyntheticProfile } from "@/data/syntheticProfiles";
import { PoliticalParty } from "@/types/archetypes";
import { partiesFor, statementsFor } from "@/lib/electoralScope";

// Deterministic, auditable scoring engine.
//
// Public formula (see METHODOLOGY.md):
//   agreement(statement) = 1 - |user_position - party_position| / 4
//   proximity(party)     = weighted mean of agreements over the statements where
//                          (a) the user took a position and (b) the party
//                          position is documented.
// "No opinion" answers and undocumented positions are excluded, never counted
// against the user nor against the party.
//
// Three things the previous version did not say, all of them measurable:
//   - a proximity is an estimate over a sample of statements, so it carries a
//     confidence interval, and two parties whose intervals overlap are tied,
//     not first and second;
//   - the proximity model rewards a party coded near the middle of every scale,
//     so a directional reading is published beside it;
//   - a respondent is only compared against parties they could vote for.
//
// No randomness, no clock, no I/O: same answers and same options always produce
// the same result, and every number is recomputable by hand.

export interface StatementComparison {
    statement: Statement;
    userValue: LikertValue;
    partyValue: LikertValue;
    agreement: number; // 0..1
    weight: number;
    status: SourceStatus;
    source?: StanceSource;
}

export interface PartyMatch {
    party: PoliticalParty;
    /** Proximity, 0..100: the weighted mean agreement, rounded. */
    score: number;
    /** Bounds of the 90% confidence interval around the proximity, 0..100. */
    lowerBound: number;
    upperBound: number;
    /** Competition rank, 1-based. Equal scores share a rank: 1, 2, 2, 4. */
    rank: number;
    /** Whether this party's interval reaches the leader's, i.e. it may be first. */
    inLeadingGroup: boolean;
    /**
     * Directional reading, 0..100, 50 meaning orthogonal. Rewards agreeing
     * intensely on the same side rather than sitting at a short distance, which
     * is what a proximity score cannot distinguish.
     */
    directionalScore: number;
    /** Statements where user and party are on the same side, neutrality excluded. */
    sameSideCount: number;
    oppositeSideCount: number;
    comparisons: StatementComparison[];
    answeredAndDocumented: number;
    totalStatements: number;
    dimensionScores: Partial<Record<DimensionKey, number>>;
    lowCoverage: boolean;
}

export interface ArchetypeScore {
    label: string;
    dimension: DimensionKey;
    score: number; // 0..100
    matchedStatements: number;
}

export interface ProfileResult {
    // Dominant archetype per dimension (absent if the dimension went unanswered).
    dimensionArchetypes: Partial<Record<DimensionKey, ArchetypeScore>>;
    /**
     * Every archetype scoring exactly what the dominant one scores, including
     * it. More than one name means the answers did not settle the dimension.
     *
     * This is not a corner case: on the express test each dimension is read
     * from 2 statements while signatures span 3 or 4, so distinct currents of
     * thought collapse onto the same partial pattern and cannot be told apart.
     * Returning the first of them as if it had won was the same defect as
     * announcing a single closest party inside the confidence interval.
     */
    dimensionTies: Partial<Record<DimensionKey, string[]>>;
    // All archetype scores, for the breakdown view.
    allArchetypeScores: ArchetypeScore[];
    // User's mean position per dimension (-2..+2), null if no answer.
    dimensionPositions: Partial<Record<DimensionKey, number>>;
    syntheticProfile: SyntheticProfile | null;
    answeredCount: number;
}

/** Who the respondent is compared against, and how much each statement counts. */
export interface ScoringOptions extends Respondent {
    /**
     * Salience: how much a statement counts for this respondent, keyed by
     * statement id. Absent means 1. A weight must be a positive finite number,
     * checked here because this object crosses the boundary from stored UI
     * state, which can be anything.
     */
    weights?: Readonly<Record<string, number>>;
}

const MIN_COMPARISONS_FOR_CONFIDENCE = 10;

/** Two-sided 90% normal quantile. Published so the interval is recomputable. */
const CONFIDENCE_Z = 1.645;

/** The widest a Likert answer can be from a party position. */
const MAX_DISTANCE = 4;

function agreementBetween(a: LikertValue, b: LikertValue): number {
    return 1 - Math.abs(a - b) / MAX_DISTANCE;
}

function clampToUnit(value: number): number {
    return Math.min(1, Math.max(0, value));
}

function asPercentage(value: number): number {
    return Math.round(clampToUnit(value) * 100);
}

function weightOf(weights: ScoringOptions["weights"], statementId: string): number {
    const weight = weights?.[statementId];
    if (weight === undefined) return 1;
    if (!Number.isFinite(weight) || weight <= 0) {
        throw new RangeError(
            `Salience weight for "${statementId}" must be a positive finite number, received ${String(weight)}`
        );
    }
    return weight;
}

/**
 * Standard error of a weighted mean, under reliability weights.
 *
 * Reduces exactly to s / sqrt(n) when every weight is 1, which is the form
 * published in METHODOLOGY.md. Returns null below two statements, where a
 * dispersion cannot be estimated at all.
 */
function standardErrorOfWeightedMean(
    values: readonly number[],
    weights: readonly number[],
    mean: number
): number | null {
    if (values.length < 2) return null;

    const sumWeights = weights.reduce((sum, w) => sum + w, 0);
    const sumSquaredWeights = weights.reduce((sum, w) => sum + w * w, 0);
    const denominator = sumWeights - sumSquaredWeights / sumWeights;
    if (denominator <= 0) return null;

    const weightedVariance =
        values.reduce((sum, value, i) => sum + weights[i] * (value - mean) ** 2, 0) / denominator;

    return Math.sqrt(weightedVariance * sumSquaredWeights) / sumWeights;
}

interface ScoredParty {
    party: PoliticalParty;
    comparisons: StatementComparison[];
    proximity: number;
    lowerBound: number;
    upperBound: number;
    directionalScore: number;
    sameSideCount: number;
    oppositeSideCount: number;
    dimensionScores: Partial<Record<DimensionKey, number>>;
}

function compareOneParty(
    party: PoliticalParty,
    answers: AnswerRecord,
    statements: readonly Statement[],
    weights: ScoringOptions["weights"]
): ScoredParty {
    const comparisons: StatementComparison[] = [];

    for (const statement of statements) {
        const userValue = answers[statement.id];
        if (userValue === null || userValue === undefined) continue;

        const stance: PartyStance | undefined = PARTY_POSITIONS[statement.id]?.[party.id];
        if (!stance || stance.status === "non_documente") continue;

        comparisons.push({
            statement,
            userValue,
            partyValue: stance.value,
            agreement: agreementBetween(userValue, stance.value),
            weight: weightOf(weights, statement.id),
            status: stance.status,
            source: stance.source
        });
    }

    const sumWeights = comparisons.reduce((sum, c) => sum + c.weight, 0);
    const proximity = sumWeights
        ? comparisons.reduce((sum, c) => sum + c.weight * c.agreement, 0) / sumWeights
        : 0;

    const standardError = standardErrorOfWeightedMean(
        comparisons.map((c) => c.agreement),
        comparisons.map((c) => c.weight),
        proximity
    );
    const margin = standardError === null ? Infinity : CONFIDENCE_Z * standardError;

    // Directional reading: the sum of signed products, normalised by the
    // strongest possible agreement. 0.5 is orthogonality, not indifference.
    const directional = sumWeights
        ? comparisons.reduce((sum, c) => sum + c.weight * c.userValue * c.partyValue, 0) /
          (MAX_DISTANCE * sumWeights)
        : 0;

    const sameSideCount = comparisons.filter(
        (c) => c.userValue !== 0 && c.partyValue !== 0 && Math.sign(c.userValue) === Math.sign(c.partyValue)
    ).length;
    const oppositeSideCount = comparisons.filter(
        (c) => c.userValue !== 0 && c.partyValue !== 0 && Math.sign(c.userValue) !== Math.sign(c.partyValue)
    ).length;

    const byDimension = new Map<DimensionKey, StatementComparison[]>();
    for (const comparison of comparisons) {
        const list = byDimension.get(comparison.statement.dimension) ?? [];
        list.push(comparison);
        byDimension.set(comparison.statement.dimension, list);
    }
    const dimensionScores: Partial<Record<DimensionKey, number>> = {};
    byDimension.forEach((list, dimension) => {
        const dimensionWeights = list.reduce((sum, c) => sum + c.weight, 0);
        dimensionScores[dimension] = asPercentage(
            list.reduce((sum, c) => sum + c.weight * c.agreement, 0) / dimensionWeights
        );
    });

    return {
        party,
        comparisons,
        proximity,
        lowerBound: asPercentage(proximity - margin),
        upperBound: asPercentage(proximity + margin),
        directionalScore: asPercentage(0.5 + directional / 2),
        sameSideCount,
        oppositeSideCount,
        dimensionScores
    };
}

/**
 * Proximity of the respondent to every party they could vote for, best first.
 *
 * O(parties x statements) comparisons, at most 12 x 30 here, plus one sort.
 */
export function computePartyMatches(answers: AnswerRecord, options: ScoringOptions): PartyMatch[] {
    const statements = statementsFor(options.country);
    const scored = partiesFor(options.country, options.college)
        .map((party) => compareOneParty(party, answers, statements, options.weights))
        .sort((a, b) => b.proximity - a.proximity);

    // A leader with no answers behind it leads nothing: the group is then every
    // party, which is the honest reading of "we cannot tell them apart".
    const leaderLowerBound = scored.length ? scored[0].lowerBound : 0;

    let rank = 0;
    let previousScore: number | null = null;
    return scored.map((entry, index) => {
        const score = asPercentage(entry.proximity);
        if (previousScore === null || score !== previousScore) {
            rank = index + 1;
            previousScore = score;
        }
        return {
            party: entry.party,
            score,
            lowerBound: entry.lowerBound,
            upperBound: entry.upperBound,
            rank,
            inLeadingGroup: entry.upperBound >= leaderLowerBound,
            directionalScore: entry.directionalScore,
            sameSideCount: entry.sameSideCount,
            oppositeSideCount: entry.oppositeSideCount,
            comparisons: entry.comparisons,
            answeredAndDocumented: entry.comparisons.length,
            totalStatements: statements.length,
            dimensionScores: entry.dimensionScores,
            lowCoverage: entry.comparisons.length < MIN_COMPARISONS_FOR_CONFIDENCE
        };
    });
}

/**
 * The respondent's own profile: dominant current per dimension, mean position
 * per dimension, and the synthetic profile they imply.
 *
 * Country-independent: archetypes are defined over the statements common to
 * both countries, and a statement the respondent never saw is simply absent
 * from their answers.
 */
export function computeProfile(answers: AnswerRecord): ProfileResult {
    const allArchetypeScores: ArchetypeScore[] = [];
    const dimensionArchetypes: Partial<Record<DimensionKey, ArchetypeScore>> = {};
    const dimensionTies: Partial<Record<DimensionKey, string[]>> = {};
    const dimensionPositions: Partial<Record<DimensionKey, number>> = {};

    const byDimension = new Map<DimensionKey, LikertValue[]>();
    for (const statement of STATEMENTS) {
        const value = answers[statement.id];
        if (value === null || value === undefined) continue;
        const list = byDimension.get(statement.dimension) ?? [];
        list.push(value);
        byDimension.set(statement.dimension, list);
    }
    byDimension.forEach((values, dimension) => {
        dimensionPositions[dimension] =
            Math.round((values.reduce<number>((sum, v) => sum + v, 0) / values.length) * 100) / 100;
    });

    // Each archetype scores the similarity between the respondent's answers and
    // its signature. Every archetype of a dimension carries the same statements
    // (held by __tests__/archetypes.test.ts), so the comparison is between
    // equals and the shortest signature no longer wins.
    for (const { dimension, signatures } of ARCHETYPE_SIGNATURES) {
        let best: { score: ArchetypeScore; similarity: number } | undefined;
        const scoresOfDimension: { label: string; similarity: number }[] = [];

        for (const [label, signature] of Object.entries(signatures)) {
            const answered = Object.entries(signature).filter(
                ([statementId]) => answers[statementId] !== null && answers[statementId] !== undefined
            );
            if (answered.length === 0) continue;

            const similarity =
                answered.reduce(
                    (sum, [statementId, expected]) =>
                        sum + agreementBetween(answers[statementId] as LikertValue, expected),
                    0
                ) / answered.length;

            const archetypeScore: ArchetypeScore = {
                label,
                dimension,
                score: Math.round(similarity * 100),
                matchedStatements: answered.length
            };
            allArchetypeScores.push(archetypeScore);
            scoresOfDimension.push({ label, similarity });

            // Compared on the exact similarity, never on the rounded score: two
            // genuinely different archetypes must not be made equal by display.
            if (
                !best ||
                similarity > best.similarity ||
                (similarity === best.similarity &&
                    archetypeScore.matchedStatements > best.score.matchedStatements)
            ) {
                best = { score: archetypeScore, similarity };
            }
        }

        if (best) {
            dimensionArchetypes[dimension] = best.score;
            // Tied on the exact similarity, in declaration order, so the list
            // is the same for the same answers on every run. Exact rather than
            // rounded, and the two never disagree: every signature of a
            // dimension has the same length, so two similarities differ by at
            // least 1/(4n), which is 6.25 points at worst.
            dimensionTies[dimension] = scoresOfDimension
                .filter((entry) => entry.similarity === best!.similarity)
                .map((entry) => entry.label);
        }
    }

    const answeredCount = STATEMENTS.filter(
        (s) => answers[s.id] !== null && answers[s.id] !== undefined
    ).length;

    return {
        dimensionArchetypes,
        dimensionTies,
        allArchetypeScores,
        dimensionPositions,
        syntheticProfile: findSyntheticProfile(dimensionArchetypes),
        answeredCount
    };
}

/**
 * The synthetic profile matching a set of dominant archetype labels.
 *
 * Exported because it is the whole of what a shared profile page displays:
 * rendering one needs the labels, never the answers they were derived from.
 */
export function syntheticProfileFor(labels: ArchetypeLabelMap): SyntheticProfile | null {
    return SYNTHETIC_PROFILES.find((p) => p.matches(labels)) ?? null;
}

function findSyntheticProfile(
    dimensionArchetypes: Partial<Record<DimensionKey, ArchetypeScore>>
): SyntheticProfile | null {
    const labels: ArchetypeLabelMap = {
        power: dimensionArchetypes.power?.label ?? "",
        economy: dimensionArchetypes.economy?.label ?? "",
        geopolitics: dimensionArchetypes.geopolitics?.label ?? "",
        social: dimensionArchetypes.social?.label ?? "",
        environment: dimensionArchetypes.environment?.label ?? "",
        knowledge: dimensionArchetypes.knowledge?.label ?? "",
        moral: dimensionArchetypes.moral?.label ?? ""
    };

    return syntheticProfileFor(labels);
}
