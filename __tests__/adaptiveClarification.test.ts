import { describe, expect, it } from "vitest";
import {
    MAX_CLARIFICATIONS_PER_DIMENSION,
    nextClarifyingStatement
} from "@/lib/adaptiveClarification";
import { ARCHETYPE_SIGNATURES } from "@/data/archetypeSignatures";
import { EXPRESS_IDS_BY_COUNTRY } from "@/data/statements";
import { computeProfile } from "@/lib/scoringEngine";
import type { AnswerRecord, Country, LikertValue } from "@/types/positions";

const COUNTRIES: Country[] = ["FR", "BE"];

/** Express answers of a respondent whose convictions are exactly `signature`. */
function expressAnswersOf(
    country: Country,
    signature: Record<string, LikertValue>
): AnswerRecord {
    const answers: AnswerRecord = {};
    for (const id of EXPRESS_IDS_BY_COUNTRY[country]) {
        if (id in signature) answers[id] = signature[id];
    }
    return answers;
}

describe("nextClarifyingStatement", () => {
    it("returns null when nothing was answered", () => {
        expect(nextClarifyingStatement({}, [])).toBeNull();
    });

    it("returns null when every answered dimension has a unique leader", () => {
        // Answering a full signature on every statement of its dimension
        // leaves that archetype alone at 100%.
        const answers: AnswerRecord = {};
        for (const { signatures } of ARCHETYPE_SIGNATURES) {
            const first = Object.values(signatures)[0] as Record<string, LikertValue>;
            for (const [id, value] of Object.entries(first)) answers[id] = value;
        }
        expect(nextClarifyingStatement(answers, [])).toBeNull();
    });

    it("proposes an unanswered statement of a tied dimension, never an answered one", () => {
        // One Belgian express answer on power (pw4 alone) always leaves a tie.
        const answers: AnswerRecord = { pw4: 2 };
        const clarification = nextClarifyingStatement(answers, []);
        expect(clarification).not.toBeNull();
        expect(clarification!.statement.dimension).toBe("power");
        expect(answers).not.toHaveProperty(clarification!.statement.id);
    });

    it("proposes a statement over which the tied archetypes actually disagree", () => {
        const answers: AnswerRecord = { pw4: 2 };
        const clarification = nextClarifyingStatement(answers, [])!;
        const tied = computeProfile(answers).dimensionTies.power!;
        const signatures = ARCHETYPE_SIGNATURES.find((d) => d.dimension === "power")!.signatures;
        const values = new Set(
            tied.map((label) => (signatures[label] as Record<string, LikertValue>)[clarification.statement.id])
        );
        expect(values.size).toBeGreaterThan(1);
    });

    it("is deterministic", () => {
        const answers: AnswerRecord = { pw4: 2, ec1: 0, so3: -1 };
        const first = nextClarifyingStatement(answers, []);
        const second = nextClarifyingStatement(answers, []);
        expect(first?.statement.id).toBe(second?.statement.id);
    });

    it("stops asking a dimension once its budget is spent, even if the tie persists", () => {
        // "Sans opinion" on every clarification never separates anything, so
        // after MAX asked statements the dimension must be left alone.
        let answers: AnswerRecord = { pw4: 0 };
        const asked: string[] = [];
        for (let i = 0; i < MAX_CLARIFICATIONS_PER_DIMENSION; i++) {
            const clarification = nextClarifyingStatement(answers, asked);
            if (!clarification || clarification.statement.dimension !== "power") break;
            answers = { ...answers, [clarification.statement.id]: null };
            asked.push(clarification.statement.id);
        }
        const after = nextClarifyingStatement(answers, asked);
        expect(after?.statement.dimension).not.toBe("power");
    });

    it("never proposes more than the budget for one dimension", () => {
        // A respondent who answers 0 everywhere is maximally ambivalent; the
        // loop must still terminate within the budget on every dimension.
        for (const country of COUNTRIES) {
            let answers: AnswerRecord = {};
            for (const id of EXPRESS_IDS_BY_COUNTRY[country]) answers[id] = 0;
            const asked: string[] = [];
            for (let guard = 0; guard < 50; guard++) {
                const clarification = nextClarifyingStatement(answers, asked);
                if (!clarification) break;
                answers = { ...answers, [clarification.statement.id]: 0 };
                asked.push(clarification.statement.id);
            }
            const perDimension = new Map<string, number>();
            for (const id of asked) {
                const dimension = ARCHETYPE_SIGNATURES.find((d) => id in Object.values(d.signatures)[0])!.dimension;
                perDimension.set(dimension, (perDimension.get(dimension) ?? 0) + 1);
            }
            for (const [dimension, count] of perDimension) {
                expect(count, `${country} ${dimension}`).toBeLessThanOrEqual(MAX_CLARIFICATIONS_PER_DIMENSION);
            }
        }
    });

    it("leads every one of the 79 archetypes to a unique win, in both countries", () => {
        // The reason this module exists: measured on 2026-08-29, 35 archetypes
        // in France and 52 in Belgium could never be the unique winner of the
        // fixed express test, and the badge fell back to declaration order.
        for (const country of COUNTRIES) {
            for (const { dimension, signatures } of ARCHETYPE_SIGNATURES) {
                for (const [label, signature] of Object.entries(signatures)) {
                    let answers = expressAnswersOf(country, signature as Record<string, LikertValue>);
                    const asked: string[] = [];
                    for (let guard = 0; guard < 20; guard++) {
                        const clarification = nextClarifyingStatement(answers, asked);
                        if (!clarification) break;
                        const id = clarification.statement.id;
                        asked.push(id);
                        answers = {
                            ...answers,
                            [id]: (signature as Record<string, LikertValue>)[id] ?? null
                        };
                    }
                    const ties = computeProfile(answers).dimensionTies[dimension];
                    expect(ties, `${country} ${label}`).toEqual([label]);
                }
            }
        }
    });
});
