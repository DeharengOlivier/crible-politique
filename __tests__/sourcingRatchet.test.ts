import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PARTY_POSITIONS } from "@/data/partyPositions";
import { PARTY_FIGHTS } from "@/data/partyFights";
import type { PartyStance } from "@/types/positions";

// Added 2026-08-30, from the audit's central measurement: 816 coded positions
// carry the whole application, 53 of them named a source and 8 linked one.
// Everything the site computes rests on that matrix, and the site is scrupulous
// about saying so, which is not the same as fixing it.
//
// This file is a ratchet, not a target. It cannot make anyone source a
// position; it can make sure the number never goes down, so that a refactor, a
// merge or a bulk edit cannot quietly undo the work. Raise the floors in the
// same commit that raises the coverage, and never lower them: a lowered floor
// is a specification change and needs to be an explicit decision.

const stances = (): PartyStance[] => Object.values(PARTY_POSITIONS).flatMap((row) => Object.values(row));

/** Measured 2026-08-30, exactly. Only ever revised upwards. */
const FLOOR = {
    cells: 816,
    labelled: 55,
    linked: 8,
    fightsWithSource: 24,
    fightsWithQuote: 23
};

describe("the sourcing of the position matrix only improves", () => {
    it("keeps at least as many coded positions as it had", () => {
        expect(stances().length).toBeGreaterThanOrEqual(FLOOR.cells);
    });

    it("keeps at least as many positions naming a source", () => {
        const labelled = stances().filter((stance) => stance.source !== undefined);
        expect(labelled.length).toBeGreaterThanOrEqual(FLOOR.labelled);
    });

    it("keeps at least as many positions linking one", () => {
        const linked = stances().filter((stance) => stance.source?.url !== undefined);
        expect(linked.length).toBeGreaterThanOrEqual(FLOOR.linked);
    });

    it("never lets a source be an empty gesture", () => {
        // A label of three characters is not a source, and would pass the
        // counters above while sourcing nothing.
        for (const stance of stances()) {
            if (stance.source === undefined) continue;
            expect(stance.source.label.trim().length).toBeGreaterThan(10);
            if (stance.source.url !== undefined) {
                expect(stance.source.url.startsWith("https://")).toBe(true);
            }
        }
    });

    it("never promotes a position to verified without a citation", () => {
        // The status vocabulary is the promise: "verifie" means a citation was
        // read, so it may not exist without one.
        for (const stance of stances()) {
            if (stance.status !== "verifie") continue;
            expect(stance.source?.url ?? stance.source?.quote).toBeDefined();
        }
    });
});

describe("the declared fights keep their documents", () => {
    it("keeps every party's fights attached to a read document", () => {
        const withSource = Object.values(PARTY_FIGHTS).filter(
            // The year is a four-digit string in the data, not a number: this
            // asserts the shape the sourcing rules already require.
            (entry) => entry.source.url.startsWith("https://") && /^\d{4}$/.test(entry.source.year)
        );
        expect(withSource.length).toBeGreaterThanOrEqual(FLOOR.fightsWithSource);
    });

    it("keeps at least as many fights quoting the document they come from", () => {
        const quoted = Object.values(PARTY_FIGHTS).filter((entry) =>
            entry.fights.some((fight) => fight.quote !== undefined)
        );
        expect(quoted.length).toBeGreaterThanOrEqual(FLOOR.fightsWithQuote);
    });
});

describe("the external validation reference stays a reference", () => {
    // data/ches.ts holds the Chapel Hill Expert Survey placements, which exist
    // in this repository for one purpose: measuring our own hand coding against
    // an independent one (convergent validity, __tests__/measurementInvariance).
    // The day it feeds a score instead, the test stops being independent of the
    // thing it tests, and the site would be scoring readers against a dataset
    // its methodology does not describe. This test is the boundary.
    const PRODUCTION_DIRECTORIES = ["app", "components", "lib", "api/src"];

    function sourceFilesIn(directory: string): string[] {
        const entries = readdirSync(directory).map((name) => join(directory, name));
        return entries.flatMap((path) =>
            statSync(path).isDirectory()
                ? sourceFilesIn(path)
                : /\.tsx?$/.test(path)
                  ? [path]
                  : []
        );
    }

    it("is imported by no module the application ships", () => {
        const importers = PRODUCTION_DIRECTORIES.flatMap(sourceFilesIn).filter((path) =>
            /from ["']@\/data\/ches["']/.test(readFileSync(path, "utf8"))
        );
        expect(importers).toEqual([]);
    });
});
