/**
 * What actually separates the parties at the top of a reader's ranking.
 *
 * Measured on 2026-09-01, on 300 seeded respondents per country: answering the
 * whole corpus instead of the express fifteen shrinks the group of parties the
 * answers cannot separate (3.7 to 2.0 for a coherent respondent) but leaves the
 * gap between the first and the second almost where it was (5.3 to 5.6 points).
 * That is arithmetic, not a defect: the score is a mean over statements, so
 * more statements converge it and narrow its interval without widening it.
 *
 * So the long analysis cannot be made "more clear-cut" by adding statements of
 * ordinary discriminating power, and the corpus has none to prune either (no
 * statement of the 35 has a party spread below 0.75). What a reader still
 * lacks after answering everything is the concrete reason two close parties
 * rank the way they do. This module answers that from the coded table alone:
 * the statements where the two parties really diverge, and the side the reader
 * took on each.
 */
import { describe, expect, it } from "vitest";
import {
    SEPARATION_THRESHOLD,
    separateParties,
    topPairSeparation
} from "@/lib/partySeparation";
import { PARTIES_BY_ID } from "@/data/parties";
import { PARTY_POSITIONS } from "@/data/partyPositions";
import { statementsFor } from "@/lib/electoralScope";
import { computePartyMatches } from "@/lib/scoringEngine";
import type { AnswerRecord, LikertValue } from "@/types/positions";

const LFI = PARTIES_BY_ID["fr_lfi"];
const RN = PARTIES_BY_ID["fr_rn"];
const ECOLO = PARTIES_BY_ID["be_ecolo"];
const GROEN = PARTIES_BY_ID["be_groen"];

/** Answers every French statement with the same value. */
function everyStatement(value: LikertValue): AnswerRecord {
    return Object.fromEntries(statementsFor("FR").map((s) => [s.id, value]));
}

describe("which statements separate two parties", () => {
    it("keeps only statements where the two parties are at least two Likert steps apart", () => {
        const separation = separateParties(LFI, RN, everyStatement(0), "FR");

        expect(separation.separating.length).toBeGreaterThan(0);
        for (const entry of separation.separating) {
            const gap = Math.abs(entry.firstPosition - entry.secondPosition);
            expect(gap).toBeGreaterThanOrEqual(SEPARATION_THRESHOLD);
        }
    });

    it("drops statements where the two parties agree, whatever the reader answered", () => {
        const separation = separateParties(LFI, RN, everyStatement(2), "FR");
        const kept = new Set(separation.separating.map((entry) => entry.statement.id));

        for (const statement of statementsFor("FR")) {
            const first = PARTY_POSITIONS[statement.id]?.[LFI.id];
            const second = PARTY_POSITIONS[statement.id]?.[RN.id];
            if (first === undefined || second === undefined) continue;
            if (Math.abs(first.value - second.value) < SEPARATION_THRESHOLD) {
                expect(kept.has(statement.id)).toBe(false);
            }
        }
    });

    it("orders the statements by how far apart the two parties are, widest first", () => {
        const { separating } = separateParties(LFI, RN, everyStatement(0), "FR");
        const gaps = separating.map((e) => Math.abs(e.firstPosition - e.secondPosition));

        expect(gaps).toEqual([...gaps].sort((a, b) => b - a));
    });

    it("credits each separating statement to the party the answer is closer to", () => {
        const separation = separateParties(LFI, RN, everyStatement(0), "FR");

        for (const entry of separation.separating) {
            const toFirst = Math.abs(entry.answer - entry.firstPosition);
            const toSecond = Math.abs(entry.answer - entry.secondPosition);
            if (toFirst < toSecond) expect(entry.closerTo).toBe("first");
            else if (toSecond < toFirst) expect(entry.closerTo).toBe("second");
            else expect(entry.closerTo).toBeNull();
        }
        expect(separation.firstCount + separation.secondCount + separation.tiedCount).toBe(
            separation.separating.length
        );
    });

    it("answering exactly like a party puts every separating statement on its side", () => {
        const answers: AnswerRecord = {};
        for (const statement of statementsFor("FR")) {
            const coded = PARTY_POSITIONS[statement.id]?.[LFI.id];
            if (coded !== undefined) answers[statement.id] = coded.value;
        }

        const separation = separateParties(LFI, RN, answers, "FR");

        expect(separation.separating.length).toBeGreaterThan(0);
        expect(separation.secondCount).toBe(0);
        expect(separation.tiedCount).toBe(0);
        expect(separation.firstCount).toBe(separation.separating.length);
    });

    it("is symmetric: swapping the parties swaps the counts and nothing else", () => {
        const answers = everyStatement(1);
        const forward = separateParties(LFI, RN, answers, "FR");
        const backward = separateParties(RN, LFI, answers, "FR");

        expect(backward.separating.length).toBe(forward.separating.length);
        expect(backward.firstCount).toBe(forward.secondCount);
        expect(backward.secondCount).toBe(forward.firstCount);
        expect(backward.tiedCount).toBe(forward.tiedCount);
    });
});

describe("parties this corpus cannot separate", () => {
    // Measured 2026-09-01: Ecolo and Groen carry the same coded value on all 33
    // Belgian statements, and they account for 50 of the 66 ties on a panel of
    // 300. No statement added to this corpus can ever separate them, so the
    // screen has to say that rather than leave a reader reading a suspicious
    // tie.
    it("reports zero separating statements for two identically coded parties", () => {
        const answers: AnswerRecord = Object.fromEntries(
            statementsFor("BE").map((s) => [s.id, 1 as LikertValue])
        );

        const separation = separateParties(ECOLO, GROEN, answers, "BE");

        expect(separation.separating).toHaveLength(0);
        expect(separation.identical).toBe(separation.comparable);
        expect(separation.comparable).toBeGreaterThan(0);
    });

    it("counts as comparable only the statements the reader answered and both parties document", () => {
        const answers: AnswerRecord = { pw1: 2, pw2: null };

        const separation = separateParties(LFI, RN, answers, "FR");

        expect(separation.comparable).toBe(1);
    });

    it("survives a reader who answered nothing", () => {
        const separation = separateParties(LFI, RN, {}, "FR");

        expect(separation.separating).toHaveLength(0);
        expect(separation.comparable).toBe(0);
        expect(separation.identical).toBe(0);
    });
});

describe("the pair worth showing at the top of a ranking", () => {
    it("takes the first two of the ranking", () => {
        const answers = everyStatement(1);
        const matches = computePartyMatches(answers, { country: "FR" });

        const separation = topPairSeparation(matches, answers, "FR");

        expect(separation).not.toBeNull();
        expect(separation?.first.id).toBe(matches[0].party.id);
        expect(separation?.second.id).toBe(matches[1].party.id);
    });

    it("returns null when the ranking holds fewer than two parties", () => {
        expect(topPairSeparation([], {}, "FR")).toBeNull();
    });
});
