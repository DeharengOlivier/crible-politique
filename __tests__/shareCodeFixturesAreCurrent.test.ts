import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decodeProfile } from "@/lib/profileCode";
import { statementsFor } from "@/lib/electoralScope";

// Found 2026-08-31: continuous integration had been failing since 2026-08-30 on
// two cases of the privacy check, both reading "the page did not render". The
// measurement: the French version 3 fixture decoded to null. It had been minted
// against the 33-statement French corpus, France now asks 35, and a version 3
// code is read against the CURRENT corpus (lib/profileCode.ts), so its length no
// longer matched and it was refused.
//
// Two separate things came out of that, and only the first is fixed here:
//
//   1. The fixtures had rotted, so the privacy check could no longer verify the
//      property it exists for. A check that cannot run is not a green check.
//      This battery ties the fixtures to the corpus so they cannot rot again in
//      silence: the day someone adds a statement, this fails and names why.
//
//   2. Underneath it, a real defect that is NOT fixed here because it is a
//      product decision, not a technical one: a version 3 share link dies when
//      the corpus changes. Versions 1 and 2 were deliberately frozen against
//      their own statement lists precisely so old links would keep working, and
//      version 3 did not carry that lesson forward. Anyone who used "Garder mes
//      résultats" or "Comparer avec un proche" before 2026-08-30 holds a dead
//      link. Reviving them means freezing a list per corpus generation and
//      deciding how many generations to carry.
//
//      DECIDED 2026-08-31, by the project owner: those links are let go. The
//      tool was days old and barely shared, and carrying a frozen list per
//      corpus generation is a permanent tax on every future statement added.
//      This is recorded so the question is not reopened as an oversight.
//      A version 3 code that no longer decodes is refused, which is the right
//      behaviour: it would otherwise be read against the wrong statements and
//      show a profile that was never computed. What is NOT accepted is the
//      failure being silent, which is what the battery below exists for.

const CHECK = "scripts/privacy-check.mjs";

function fixture(name: string): string {
    const source = readFileSync(CHECK, "utf8");
    const match = new RegExp(`const ${name} = '([^']+)'`).exec(source);
    if (match === null) throw new Error(`${CHECK} no longer defines ${name}`);
    return match[1];
}

describe("the privacy check drives codes that still decode", () => {
    it.each([
        ["ANSWERS", "FR"],
        ["ANSWERS_BE", "BE"]
    ] as const)("%s decodes to a complete %s profile", (name, country) => {
        const decoded = decodeProfile(fixture(name));
        expect(decoded, `${name} decodes`).not.toBeNull();
        expect(decoded!.country).toBe(country);
        // Complete, not merely non-empty: the check asserts a results page
        // renders, and a partial profile renders a different screen.
        expect(Object.keys(decoded!.answers)).toHaveLength(statementsFor(country).length);
    });

    it("keeps driving the older generations, which must never stop working", () => {
        // The whole point of freezing versions 1 and 2 against their own
        // statement lists: a link in someone's messages outlives a corpus.
        const legacyV2 = decodeProfile(fixture("LEGACY_ANSWERS_V2"));
        expect(legacyV2, "a version 2 link still opens").not.toBeNull();
        expect(legacyV2!.country).toBe("FR");

        const legacyV1 = decodeProfile(fixture("LEGACY_ANSWERS"));
        expect(legacyV1, "a version 1 link still opens").not.toBeNull();
        expect(legacyV1!.country).toBeNull();
    });

    it("still watches for the stale code in request lines, though it no longer renders", () => {
        // It is a real answer code someone may still hold, so a leak of it is
        // still a leak. It is kept in the leak list and out of the render list,
        // and this pins that distinction rather than leaving it to a comment.
        const stale = fixture("STALE_ANSWERS_V3");
        expect(decodeProfile(stale)).toBeNull();
        const source = readFileSync(CHECK, "utf8");
        expect(source).toMatch(/ANSWER_CODES = \[[^\]]*STALE_ANSWERS_V3/);
        expect(source).not.toMatch(new RegExp(`url: \`[^\`]*\\$\\{STALE_ANSWERS_V3\\}`));
    });
});
