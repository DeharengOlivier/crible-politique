import { PARTY_POSITIONS } from "@/data/partyPositions";
import { statementsFor } from "@/lib/electoralScope";
import type { PartyMatch } from "@/lib/scoringEngine";
import type { PoliticalParty } from "@/types/archetypes";
import type { AnswerRecord, Country, LikertValue, Statement } from "@/types/positions";

// What actually separates two parties for one reader.
//
// A reader who answered the whole corpus asked for a clear-cut answer between
// the parties, and measurement on 2026-09-01 showed why the score alone cannot
// give it. The proximity is a mean over statements: answering 35 instead of 15
// converges it and narrows its confidence interval, but it does not widen the
// gap between the first and the second (measured 5.3 to 5.6 points on 300
// seeded coherent respondents). Adding statements of ordinary discriminating
// power cannot change that, and there is nothing to prune either: no statement
// of the 35 has a spread of party positions below 0.75.
//
// The gap is small because the parties are close on this corpus, not because
// the test is blunt. Renaissance and Horizons carry the same coded value on 26
// of 35 French statements; Ecolo and Groen on 33 of 33 Belgian ones.
//
// So this module does not try to manufacture separation. It shows where the
// separation actually is: the statements on which two parties genuinely
// diverge, and the side the reader took on each. That is decisive in the way a
// reader asked for, and it invents no data.

/**
 * The smallest party divergence this table is willing to call a divergence.
 *
 * Two full Likert steps, so "somewhat agree" against "somewhat disagree" or
 * "neutral" against "strongly agree". The whole position table is still at
 * status "a_verifier" (data/partyPositions.ts), coded by reading manifestos,
 * and a single step between two parties is inside what two honest coders
 * disagree about. Presenting a one-step gap as what separates two parties
 * would dress up coding noise as a political fact.
 */
export const SEPARATION_THRESHOLD = 2;

export interface SeparatingStatement {
    statement: Statement;
    firstPosition: LikertValue;
    secondPosition: LikertValue;
    answer: LikertValue;
    /** The party this answer sits closer to, or null when it is equidistant. */
    closerTo: "first" | "second" | null;
}

export interface PairSeparation {
    first: PoliticalParty;
    second: PoliticalParty;
    /** Statements far enough apart to be shown, widest party gap first. */
    separating: SeparatingStatement[];
    firstCount: number;
    secondCount: number;
    tiedCount: number;
    /** Answered statements where both parties are documented. */
    comparable: number;
    /** Of those, the ones where the two parties carry the same value. */
    identical: number;
}

function sideOf(answer: LikertValue, first: LikertValue, second: LikertValue) {
    const toFirst = Math.abs(answer - first);
    const toSecond = Math.abs(answer - second);
    if (toFirst < toSecond) return "first" as const;
    if (toSecond < toFirst) return "second" as const;
    return null;
}

/**
 * Where two parties diverge, for this reader.
 *
 * O(statements): one pass over the corpus of the country, then one sort of the
 * statements that survived the threshold.
 */
export function separateParties(
    first: PoliticalParty,
    second: PoliticalParty,
    answers: AnswerRecord,
    country: Country
): PairSeparation {
    const separating: SeparatingStatement[] = [];
    let comparable = 0;
    let identical = 0;

    for (const statement of statementsFor(country)) {
        const answer = answers[statement.id];
        if (answer === null || answer === undefined) continue;
        const firstStance = PARTY_POSITIONS[statement.id]?.[first.id];
        const secondStance = PARTY_POSITIONS[statement.id]?.[second.id];
        if (firstStance === undefined || secondStance === undefined) continue;

        comparable += 1;
        const gap = Math.abs(firstStance.value - secondStance.value);
        if (gap === 0) identical += 1;
        if (gap < SEPARATION_THRESHOLD) continue;

        separating.push({
            statement,
            firstPosition: firstStance.value,
            secondPosition: secondStance.value,
            answer,
            closerTo: sideOf(answer, firstStance.value, secondStance.value)
        });
    }

    // Widest divergence first: that is the statement a reader can most safely
    // read as a real difference between the two, and the one least likely to
    // be an artefact of the coding.
    separating.sort(
        (a, b) =>
            Math.abs(b.firstPosition - b.secondPosition) -
            Math.abs(a.firstPosition - a.secondPosition)
    );

    return {
        first,
        second,
        separating,
        firstCount: separating.filter((entry) => entry.closerTo === "first").length,
        secondCount: separating.filter((entry) => entry.closerTo === "second").length,
        tiedCount: separating.filter((entry) => entry.closerTo === null).length,
        comparable,
        identical
    };
}

/**
 * The two parties at the top of this ranking, and what divides them.
 *
 * Null when the ranking holds fewer than two parties, which happens for a
 * Belgian college that carries a single list.
 */
export function topPairSeparation(
    matches: PartyMatch[],
    answers: AnswerRecord,
    country: Country
): PairSeparation | null {
    if (matches.length < 2) return null;
    return separateParties(matches[0].party, matches[1].party, answers, country);
}
