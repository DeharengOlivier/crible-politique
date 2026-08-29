import { describe, expect, it } from "vitest";
import { weightsForPriorities } from "../lib/priorityWeights";
import { statementsFor } from "../lib/electoralScope";

// Requested 2026-08-29 (night): the reader can name the fights that matter
// most to them and see the ranking through that lens. METHODOLOGY.md 3.4 has
// promised the mechanism since the start (a statement can count double, the
// proximity becomes a weighted mean, recomputable by hand); this module is the
// mapping from "these dimensions are my fights" to those per-statement weights.

describe("what naming a fight weighs", () => {
    it("doubles every statement of the named dimension, in the right country", () => {
        const weights = weightsForPriorities("FR", ["economy"]);
        const economyIds = statementsFor("FR")
            .filter((s) => s.dimension === "economy")
            .map((s) => s.id);
        expect(economyIds.length).toBeGreaterThan(0);
        for (const id of economyIds) expect(weights[id]).toBe(2);
    });

    it("touches nothing outside the named dimensions", () => {
        const weights = weightsForPriorities("FR", ["economy"]);
        const otherIds = statementsFor("FR").filter((s) => s.dimension !== "economy");
        for (const { id } of otherIds) expect(weights[id]).toBeUndefined();
    });

    it("weighs nothing when no fight is named", () => {
        expect(weightsForPriorities("FR", [])).toEqual({});
    });

    it("combines several fights", () => {
        const weights = weightsForPriorities("BE", ["geopolitics", "environment"]);
        for (const s of statementsFor("BE")) {
            if (s.dimension === "geopolitics" || s.dimension === "environment") {
                expect(weights[s.id]).toBe(2);
            } else {
                expect(weights[s.id]).toBeUndefined();
            }
        }
    });

    it("never names a statement the country does not ask", () => {
        // The French EU-exit statements are geopolitics: a Belgian respondent
        // prioritising geopolitics must not carry weights for statements that
        // are not on their ballot.
        const weights = weightsForPriorities("BE", ["geopolitics"]);
        expect(weights.ge8_fr).toBeUndefined();
        expect(weights.ge9_fr).toBeUndefined();
    });
});
