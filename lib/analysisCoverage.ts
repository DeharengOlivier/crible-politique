import { statementsFor } from "@/lib/electoralScope";
import type { AnswerRecord, Country } from "@/types/positions";
import type { PartyMatch } from "@/lib/scoringEngine";

// How much of the corpus a result rests on, and how precise that makes it.
//
// The site offers two analyses and, until 2026-09-01, told the reader nothing
// about which one they were looking at. A result from fifteen statements and a
// result from all thirty-five were presented identically, with the same
// confidence in the same words, and nothing on the results screen offered to
// finish an analysis left half done. The express reader could not tell their
// ranking was provisional, and had no way to make it less so.
//
// Everything here is a pure function of the answers, so the numbers a reader
// sees are the numbers they can recompute from METHODOLOGY.md.

export interface AnalysisCoverage {
    /** Statements of this country's corpus answered with a position. */
    answered: number;
    /** Statements this country's corpus contains. */
    corpus: number;
    /** Statements left to answer; never negative. */
    remaining: number;
    complete: boolean;
}

/**
 * O(n) over the corpus of one country.
 *
 * Counts against that corpus rather than over the answer record: a profile can
 * carry ids this country does not ask (a link from across the border, an older
 * corpus), and those add nothing to what this ranking rests on. "No opinion" is
 * a null and does not count either, for the same reason it does not count in
 * the scoring: it contributed no information.
 */
export function analysisCoverage(country: Country, answers: AnswerRecord): AnalysisCoverage {
    const corpus = statementsFor(country);
    const answered = corpus.filter((statement) => {
        const value = answers[statement.id];
        return value !== null && value !== undefined;
    }).length;
    return {
        answered,
        corpus: corpus.length,
        remaining: corpus.length - answered,
        complete: answered >= corpus.length
    };
}

/**
 * The width, in points, of the confidence interval on the leading party: the
 * one number that says how precise this result is. Narrower is more precise.
 * Zero when there is nothing to rank.
 */
export function leadingIntervalWidth(matches: PartyMatch[]): number {
    const leader = matches[0];
    if (leader === undefined) return 0;
    return Math.max(0, leader.upperBound - leader.lowerBound);
}
