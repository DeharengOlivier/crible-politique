import { describe, expect, it } from "vitest";
import { computePartyMatches } from "../lib/scoringEngine";
import { statementsFor } from "../lib/electoralScope";
import { PARTY_POSITIONS } from "../data/partyPositions";
import type { AnswerRecord } from "../types/positions";

// Reported 2026-08-29 by a reader: only the UPR and Les Patriotes have actually
// written leaving the EU into their program (and, with LFI, leaving NATO), yet
// the corpus could not tell them from parties that merely want to reform from
// inside. On "reprendre des compétences à l'UE" the RN was coded +2 exactly
// like the UPR, so a Frexit respondent landed as close to a party that
// abandoned Frexit as to the party built on it.
//
// The fix is two France-scoped statements about the formulated exits
// themselves. No editorial overweighting: the separation comes from the
// documented positions being far apart (+2 against -1/-2), which the paired
// leading-group test then reads at full strength.

const EU_EXIT = "ge8_fr";
const NATO_EXIT = "ge9_fr";

describe("the French corpus asks about leaving, not only reforming", () => {
    it("carries a geopolitics statement on leaving the EU, France only", () => {
        const statement = statementsFor("FR").find((s) => s.id === EU_EXIT);
        expect(statement).toBeDefined();
        expect(statement!.dimension).toBe("geopolitics");
        expect(statement!.text).toMatch(/quitter l['’]Union européenne/);
        expect(statementsFor("BE").some((s) => s.id === EU_EXIT)).toBe(false);
    });

    it("carries a geopolitics statement on leaving NATO, France only", () => {
        const statement = statementsFor("FR").find((s) => s.id === NATO_EXIT);
        expect(statement).toBeDefined();
        expect(statement!.dimension).toBe("geopolitics");
        expect(statement!.text).toMatch(/quitter l['’]OTAN/);
        expect(statementsFor("BE").some((s) => s.id === NATO_EXIT)).toBe(false);
    });
});

describe("formulated exits are coded at full strength, with their source", () => {
    it("UPR and Les Patriotes stand at +2 on leaving the EU", () => {
        for (const partyId of ["fr_upr", "fr_patriotes"]) {
            const stance = PARTY_POSITIONS[EU_EXIT]?.[partyId];
            expect(stance?.value, partyId).toBe(2);
            expect(stance?.source?.label, `${partyId} needs its source`).toBeTruthy();
        }
    });

    it("UPR, Les Patriotes and LFI stand at +2 on leaving NATO", () => {
        for (const partyId of ["fr_upr", "fr_patriotes", "fr_lfi"]) {
            const stance = PARTY_POSITIONS[NATO_EXIT]?.[partyId];
            expect(stance?.value, partyId).toBe(2);
            expect(stance?.source?.label, `${partyId} needs its source`).toBeTruthy();
        }
    });

    it("a party that renounced the exit sits at least 3 points away", () => {
        // The whole point: reform-from-inside and leave are different answers.
        const rnOnExit = PARTY_POSITIONS[EU_EXIT]?.fr_rn;
        const uprOnExit = PARTY_POSITIONS[EU_EXIT]?.fr_upr;
        expect(rnOnExit?.value).toBeLessThanOrEqual(-1);
        expect(uprOnExit!.value - rnOnExit!.value).toBeGreaterThanOrEqual(3);
    });

    it("every French party is documented on both exit statements", () => {
        // A missing entry would silently drop the statement from that party's
        // comparison, which is how the confusion survived the first corpus.
        for (const id of [EU_EXIT, NATO_EXIT]) {
            const row = PARTY_POSITIONS[id] ?? {};
            const documented = Object.keys(row).filter((partyId) => partyId.startsWith("fr_"));
            expect(documented.length, id).toBe(12);
        }
    });
});

describe("what a sovereignist respondent now sees", () => {
    it("keeps the RN out of the leading group of a UPR clone", () => {
        const answers: AnswerRecord = {};
        for (const s of statementsFor("FR")) {
            const stance = PARTY_POSITIONS[s.id]?.fr_upr;
            if (stance && stance.status !== "non_documente") answers[s.id] = stance.value;
        }
        const matches = computePartyMatches(answers, { country: "FR" });
        const group = matches.filter((m) => m.inLeadingGroup).map((m) => m.party.id);
        expect(group).toContain("fr_upr");
        expect(group).not.toContain("fr_rn");
    });
});
