import { describe, expect, it } from "vitest";
import {
    ANALYSIS_CORPUS_SIZE,
    analysisWeight,
    leaderShares,
    statEventOf
} from "@/lib/analysisStatEvent";
import type { PartyMatch } from "@/lib/scoringEngine";
import type { AnswerRecord } from "@/types/positions";

// The only thing an analysis is allowed to contribute to the public
// statistics: country, how many positions were taken, and who led. Never the
// answers, never an identity. An express run must weigh less than a full one.

function matchOf(partyId: string, rank: number): PartyMatch {
    return { party: { id: partyId }, rank } as unknown as PartyMatch;
}

const ANSWERS: AnswerRecord = { pw1: 2, ec1: -1, ge7: null, so1: 0 };

describe("statEventOf", () => {
    it("counts only the statements where a position was taken", () => {
        const event = statEventOf("FR", ANSWERS, [matchOf("fr_lfi", 1)]);
        expect(event.positionsTaken).toBe(3); // ge7 is "no opinion"
        expect(event.country).toBe("FR");
    });

    it("reports every party sharing rank 1, in a deterministic order", () => {
        const event = statEventOf("BE", ANSWERS, [
            matchOf("be_groen", 1),
            matchOf("be_ecolo", 1),
            matchOf("be_ptb", 2)
        ]);
        expect(event.leaders).toEqual(["be_ecolo", "be_groen"]);
    });

    it("carries no answer values, no ids of statements, no identity", () => {
        const event = statEventOf("FR", ANSWERS, [matchOf("fr_lfi", 1)]);
        expect(Object.keys(event).sort()).toEqual(["country", "leaders", "positionsTaken"]);
    });
});

describe("analysisWeight", () => {
    it("weighs a full run 1 and an express run by its share of the corpus", () => {
        expect(analysisWeight(ANALYSIS_CORPUS_SIZE)).toBe(1);
        expect(analysisWeight(15)).toBeCloseTo(15 / 33, 10);
    });

    it("is bounded on both sides whatever a client claims", () => {
        expect(analysisWeight(0)).toBe(0);
        expect(analysisWeight(-5)).toBe(0);
        expect(analysisWeight(1000)).toBe(1);
        expect(analysisWeight(Number.NaN)).toBe(0);
        expect(analysisWeight(2.7)).toBeCloseTo(2 / 33, 10); // fractions are not a thing
    });
});

describe("leaderShares", () => {
    it("splits the analysis weight equally among tied leaders", () => {
        const shares = leaderShares(["fr_lfi", "fr_eelv"], 33);
        expect(shares.get("fr_lfi")).toBeCloseTo(0.5, 10);
        expect(shares.get("fr_eelv")).toBeCloseTo(0.5, 10);
    });

    it("always sums to exactly the analysis weight", () => {
        const shares = leaderShares(["a", "b", "c"], 15);
        const total = [...shares.values()].reduce((sum, share) => sum + share, 0);
        expect(total).toBeCloseTo(analysisWeight(15), 10);
    });

    it("is empty when no party led, rather than inventing a winner", () => {
        expect(leaderShares([], 33).size).toBe(0);
    });
});
