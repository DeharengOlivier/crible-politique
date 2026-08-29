import { describe, expect, it } from "vitest";
import { computePartyMatches } from "../lib/scoringEngine";
import { statementsFor, partiesFor } from "../lib/electoralScope";
import { PARTY_POSITIONS } from "../data/partyPositions";
import type { AnswerRecord, Country, LikertValue } from "../types/positions";

// Defect found 2026-08-29, reported by a reader of their own results: the party
// ranking showed 80 / 76 / 75 / 69 and called them all "à égalité en tête".
//
// The group was decided by overlap of independent confidence intervals, but the
// two scores are not independent: the same respondent judges both parties on
// the same statements. Measured with that rule on seeded random respondents,
// the median leading group was all 12 parties of the ballot, score gaps up to
// 20 points were called ties, and for some respondents the group was not even a
// prefix of the ranking (a party could be "tied with the leader" while a party
// ranked above it was not).
//
// The correct test is the paired one the family layer already uses: statement
// by statement, on the statements where both parties are documented. This
// battery froze the behavior measured with the paired rule the day of the fix.

const RANDOM_RUNS = 200;

function partyAnswers(country: Country, partyId: string): AnswerRecord {
    const answers: AnswerRecord = {};
    for (const s of statementsFor(country)) {
        const stance = PARTY_POSITIONS[s.id]?.[partyId];
        if (stance && stance.status !== "non_documente") answers[s.id] = stance.value;
    }
    return answers;
}

function randomAnswers(country: Country, seedStart: number): AnswerRecord {
    const values: LikertValue[] = [-2, -1, 0, 1, 2];
    const answers: AnswerRecord = {};
    let seed = seedStart;
    for (const s of statementsFor(country)) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        answers[s.id] = values[seed % 5];
    }
    return answers;
}

function noisyClone(
    country: Country,
    partyId: string,
    noiseShare: number,
    seedStart: number
): AnswerRecord {
    const answers = partyAnswers(country, partyId);
    const values: LikertValue[] = [-2, -1, 0, 1, 2];
    let seed = seedStart;
    for (const id of Object.keys(answers)) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        if ((seed % 1000) / 1000 < noiseShare) {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            answers[id] = values[seed % 5];
        }
    }
    return answers;
}

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
}

/**
 * Whether the corpus can tell two parties apart at all: false when they hold
 * the same value on every statement where both are documented. A statement
 * only one of them is documented on separates nothing, since no paired
 * comparison exists there.
 */
function inseparableOnPaper(country: Country, a: string, b: string): boolean {
    for (const s of statementsFor(country)) {
        const stanceA = PARTY_POSITIONS[s.id]?.[a];
        const stanceB = PARTY_POSITIONS[s.id]?.[b];
        if (!stanceA || stanceA.status === "non_documente") continue;
        if (!stanceB || stanceB.status === "non_documente") continue;
        if (stanceA.value !== stanceB.value) return false;
    }
    return true;
}

describe("who is allowed inside the party leading group", () => {
    it("a respondent echoing one party's positions leaves it alone in the lead, or with a party the corpus cannot separate from it", () => {
        for (const country of ["FR", "BE"] as const) {
            for (const party of partiesFor(country)) {
                const matches = computePartyMatches(partyAnswers(country, party.id), { country });
                const group = matches.filter((m) => m.inLeadingGroup);
                expect(group.some((m) => m.party.id === party.id)).toBe(true);
                for (const member of group) {
                    if (member.party.id === party.id) continue;
                    expect(
                        inseparableOnPaper(country, party.id, member.party.id),
                        `${member.party.id} tied with a clone of ${party.id} despite separable positions`
                    ).toBe(true);
                }
            }
        }
    });

    it("is always a prefix of the ranking", () => {
        // "À égalité en tête" is read as "the top of the list": a group that
        // skips rank 3 and includes rank 4 contradicts the ranking next to it.
        for (const country of ["FR", "BE"] as const) {
            for (let i = 0; i < RANDOM_RUNS; i += 1) {
                const flags = computePartyMatches(randomAnswers(country, i * 7 + 1), {
                    country
                }).map((m) => m.inLeadingGroup);
                const lastIn = flags.lastIndexOf(true);
                expect(flags.slice(0, lastIn + 1).every(Boolean)).toBe(true);
            }
        }
    });

    it("keeps a realistic respondent's group small: median 1, never above 5", () => {
        // A clone of each party with 20% of answers re-rolled stands in for a
        // sympathiser who agrees with their party most of the time. Measured
        // 2026-08-29 with the paired rule: median 1, max 3 (FR) and 5 (BE).
        // The interval-overlap rule gave a median of 2 and groups up to 10.
        for (const country of ["FR", "BE"] as const) {
            const sizes: number[] = [];
            for (const party of partiesFor(country)) {
                for (let i = 0; i < 20; i += 1) {
                    const matches = computePartyMatches(
                        noisyClone(country, party.id, 0.2, i * 13 + 5),
                        { country }
                    );
                    sizes.push(matches.filter((m) => m.inLeadingGroup).length);
                }
            }
            expect(median(sizes)).toBe(1);
            expect(Math.max(...sizes)).toBeLessThanOrEqual(5);
        }
    });

    it("keeps in-group gaps within the measured noise floor", () => {
        // The reported defect, frozen: 80/76/75/69 were all marked tied, and
        // gaps of 19 and 20 points were measured inside "ties" under the
        // interval rule. With the paired rule the widest in-group gap over 200
        // seeded random respondents per country is 16 points, reached only
        // when the answers side with neither party consistently; a realistic
        // respondent (the test above) never comes near it.
        for (const country of ["FR", "BE"] as const) {
            for (let i = 0; i < RANDOM_RUNS; i += 1) {
                const matches = computePartyMatches(randomAnswers(country, i * 7 + 1), { country });
                const group = matches.filter((m) => m.inLeadingGroup);
                const gap = matches[0].score - group[group.length - 1].score;
                expect(gap, `seed ${i} calls a ${gap}-point gap a tie`).toBeLessThanOrEqual(16);
            }
        }
    });

    it("never separates parties the corpus itself cannot separate", () => {
        // The fix must not buy small groups by inventing separations that are
        // not in the answers. Two parties holding the same documented value on
        // every shared statement produce paired differences of exactly zero,
        // whoever the respondent is: when one leads, the other belongs to the
        // group. Which pairs those are is read from the corpus, not hardcoded;
        // as of 2026-08-29 the Belgian corpus holds at least one such pair.
        let pairsChecked = 0;
        for (const country of ["FR", "BE"] as const) {
            const parties = partiesFor(country);
            for (const a of parties) {
                for (const b of parties) {
                    if (a.id >= b.id || !inseparableOnPaper(country, a.id, b.id)) continue;
                    pairsChecked += 1;
                    const matches = computePartyMatches(partyAnswers(country, a.id), { country });
                    const group = matches.filter((m) => m.inLeadingGroup);
                    expect(
                        group.some((m) => m.party.id === b.id),
                        `${b.id} split from ${a.id} despite identical shared positions`
                    ).toBe(true);
                }
            }
        }
        expect(pairsChecked).toBeGreaterThan(0);
    });
});
