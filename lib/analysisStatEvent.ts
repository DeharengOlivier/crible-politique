import type { AnswerRecord, Country } from "@/types/positions";
import type { PartyMatch } from "@/lib/scoringEngine";

// The anonymous contribution of one completed analysis to the public
// statistics. This is the ONLY thing the statistics pipeline is allowed to
// know about a run: which country, how many statements got a real position,
// and which parties shared the first rank. No answers, no statement ids, no
// account, no timestamp. The server aggregates these into counters and keeps
// no per-event row, so nothing can ever be traced back.

export interface AnalysisStatEvent {
    country: Country;
    /** Statements answered with a position; "no opinion" does not count. */
    positionsTaken: number;
    /** Party ids at shared rank 1, sorted so equal runs produce equal events. */
    leaders: string[];
}

/**
 * The reference length one analysis is measured against, so that an express run
 * (15 statements) counts for 15/33 of a complete one and adaptive
 * clarifications raise the weight of the run they refine.
 *
 * It is a fixed reference, deliberately NOT "the size of the corpus": the two
 * corpora stopped being the same size when France went to 35 statements on
 * 2026-08-30, and a per-country divisor would make an express analysis worth
 * less in France than in Belgium, which is exactly the comparison the public
 * counters exist to support. With one reference and the clamp in
 * analysisWeight, a complete run counts for one analysis on either side of the
 * border; France simply reaches 1 two statements early.
 *
 * Published in METHODOLOGY.md; changing it is a methodology change, not a
 * tweak. Pinned by __tests__/analysisStatEvent.test.ts.
 */
export const ANALYSIS_CORPUS_SIZE = 33;

export function statEventOf(
    country: Country,
    answers: AnswerRecord,
    matches: PartyMatch[]
): AnalysisStatEvent {
    return {
        country,
        positionsTaken: Object.values(answers).filter((value) => value !== null).length,
        leaders: matches
            .filter((match) => match.rank === 1)
            .map((match) => match.party.id)
            .sort()
    };
}

/** Bounded whatever the input claims: an integer clamped to [0, corpus] over corpus. */
export function analysisWeight(positionsTaken: number): number {
    if (!Number.isFinite(positionsTaken)) return 0;
    const bounded = Math.min(Math.max(Math.floor(positionsTaken), 0), ANALYSIS_CORPUS_SIZE);
    return bounded / ANALYSIS_CORPUS_SIZE;
}

/**
 * Tied leaders split the analysis weight equally, so one analysis always
 * contributes exactly its weight to the leading-party distribution and a tie
 * (the Ecolo/Groen case) inflates nobody.
 */
export function leaderShares(leaders: string[], positionsTaken: number): Map<string, number> {
    const shares = new Map<string, number>();
    if (leaders.length === 0) return shares;
    const shareEach = analysisWeight(positionsTaken) / leaders.length;
    for (const partyId of leaders) {
        shares.set(partyId, shareEach);
    }
    return shares;
}
