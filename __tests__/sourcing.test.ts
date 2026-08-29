import { describe, expect, it } from "vitest";
import { PARTY_POSITIONS } from "@/data/partyPositions";
import { STATEMENTS } from "@/data/statements";
import { PARTIES } from "@/data/parties";
import { statementsFor } from "@/lib/electoralScope";
import { computePartyMatches } from "@/lib/scoringEngine";
import type { AnswerRecord, Country } from "@/types/positions";

// The sourcing rule the project states about itself, enforced rather than
// promised. GOVERNANCE.md: "a position moves to status verifie only with a
// dated and linked citation". Nothing in the type system prevented writing
// status "verifie" with no source at all, so the promise lived in a comment.

const ALL_STANCES = Object.entries(PARTY_POSITIONS).flatMap(([statementId, byParty]) =>
    Object.entries(byParty).map(([partyId, stance]) => ({ statementId, partyId, stance }))
);

describe("sourcing status", () => {
    it("has stances to check at all", () => {
        expect(ALL_STANCES.length).toBeGreaterThan(500);
    });

    it("never claims verifie without a dated and linked citation", () => {
        const unsupported = ALL_STANCES.filter(
            ({ stance }) =>
                stance.status === "verifie" &&
                (!stance.source || !stance.source.url || !stance.source.date)
        ).map(({ statementId, partyId }) => `${statementId}/${partyId}`);
        expect(unsupported).toEqual([]);
    });

    it("only uses the three published status codes", () => {
        const known = new Set(["verifie", "a_verifier", "non_documente"]);
        const unknown = ALL_STANCES
            .filter(({ stance }) => !known.has(stance.status))
            .map(({ statementId, partyId }) => `${statementId}/${partyId}`);
        expect(unknown).toEqual([]);
    });

    it("carries a source label wherever a source object exists", () => {
        // A source with no label displays as an empty citation, which reads as
        // "sourced" while showing nothing.
        const unlabelled = ALL_STANCES
            .filter(({ stance }) => stance.source !== undefined && !stance.source.label?.trim())
            .map(({ statementId, partyId }) => `${statementId}/${partyId}`);
        expect(unlabelled).toEqual([]);
    });

    it("never documents a party outside its own country", () => {
        const countryOf = new Map(PARTIES.map((p) => [p.id, p.country]));
        const scopeOf = new Map(STATEMENTS.map((s) => [s.id, s.scope]));
        const foreign = ALL_STANCES
            .filter(({ statementId, partyId }) => {
                const scope = scopeOf.get(statementId);
                return scope !== undefined && scope !== "common" && countryOf.get(partyId) !== scope;
            })
            .map(({ statementId, partyId }) => `${statementId}/${partyId}`);
        expect(foreign).toEqual([]);
    });

    it("gives two parties with identical positions the same score and the same rank", () => {
        // Ecolo and Groen hold rigorously identical coded positions, and the
        // sources say that is correct: they published a single common vision
        // on state reform on 13 January 2024. A coding was briefly invented to
        // separate them, which was the wrong fix. What must hold instead is
        // that identical positions are never ranked one above the other.
        const belgianStatements = statementsFor("BE");
        const belgian = PARTIES.filter((p) => p.country === "BE");
        const answers: AnswerRecord = {};
        for (const statement of belgianStatements) answers[statement.id] = 1;
        // The engine returns the ranking itself since 2026-08-29 (night), the
        // reading selector having been removed: one score, one order, one rank.
        const ranked = computePartyMatches(answers, { country: "BE" });

        for (let i = 0; i < belgian.length; i++) {
            for (let j = i + 1; j < belgian.length; j++) {
                const a = belgian[i];
                const b = belgian[j];
                const identical = belgianStatements.every(
                    (s) => PARTY_POSITIONS[s.id]?.[a.id]?.value === PARTY_POSITIONS[s.id]?.[b.id]?.value
                );
                if (!identical) continue;
                const rankedA = ranked.find((r) => r.party.id === a.id)!;
                const rankedB = ranked.find((r) => r.party.id === b.id)!;
                expect(rankedA.score, `${a.id}/${b.id}`).toBe(rankedB.score);
                expect(rankedA.rank, `${a.id}/${b.id}`).toBe(rankedB.rank);
            }
        }
    });

    it("sources every position where two same-ballot parties are said to differ", () => {
        // A difference between two parties of the same ballot is exactly what
        // decides which one is ranked first, so it may never rest on an
        // undocumented guess. This is the test that caught the invented
        // Ecolo/Groen differentiation.
        const belgianStatements = statementsFor("BE");
        const belgian = PARTIES.filter((p) => p.country === "BE");
        const unsourced: string[] = [];
        for (let i = 0; i < belgian.length; i++) {
            for (let j = i + 1; j < belgian.length; j++) {
                const a = belgian[i];
                const b = belgian[j];
                const shareACollege = (a.colleges ?? []).some((c) => (b.colleges ?? []).includes(c));
                if (!shareACollege) continue;
                // Only the near-twins are held to this: two parties differing
                // everywhere are separated by their whole profile, not by one
                // contestable value.
                const differing = belgianStatements.filter(
                    (s) => PARTY_POSITIONS[s.id]?.[a.id]?.value !== PARTY_POSITIONS[s.id]?.[b.id]?.value
                );
                if (differing.length === 0 || differing.length > 2) continue;
                for (const statement of differing) {
                    for (const partyId of [a.id, b.id]) {
                        if (!PARTY_POSITIONS[statement.id][partyId]?.source?.label) {
                            unsourced.push(`${statement.id}/${partyId}`);
                        }
                    }
                }
            }
        }
        expect(unsourced).toEqual([]);
    });

    it("documents every party of a country on every statement it is asked", () => {
        const countries: Country[] = ["FR", "BE"];
        const missing: string[] = [];
        for (const country of countries) {
            for (const statement of statementsFor(country)) {
                for (const party of PARTIES.filter((p) => p.country === country)) {
                    if (PARTY_POSITIONS[statement.id]?.[party.id] === undefined) {
                        missing.push(`${statement.id}/${party.id}`);
                    }
                }
            }
        }
        expect(missing).toEqual([]);
    });
});
