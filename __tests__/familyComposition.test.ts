import { describe, expect, it } from "vitest";
import { familyCompositionOf } from "../lib/familyComposition";
import { SYNTHETIC_PROFILES } from "../data/syntheticProfiles";
import { ARCHETYPE_SIGNATURES } from "../data/archetypeSignatures";
import { DEFINITIONS } from "../data/definitions";
import { DIMENSION_ORDER, DimensionKey } from "../types/positions";

// A synthetic family is nothing but a named combination of currents on one to
// three of the seven dimensions. Until 2026-08-29 that mapping lived only in
// the data file and the scoring engine: the reader saw a family title above
// seven currents with no stated relationship between the two layers, and the
// families read as vague. This module is the mapping made displayable, and this
// battery is what keeps the displayed composition identical to the one the
// score is computed from.

describe("what a family is made of", () => {
    it("covers the seven dimensions exactly once, in reading order", () => {
        for (const family of SYNTHETIC_PROFILES) {
            const { constrained, silent } = familyCompositionOf(family);
            const covered = [...constrained.map((r) => r.dimension), ...silent];
            expect([...covered].sort()).toEqual([...DIMENSION_ORDER].sort());
            const order = (dim: DimensionKey) => DIMENSION_ORDER.indexOf(dim);
            expect(constrained.map((r) => order(r.dimension))).toEqual(
                constrained.map((r) => order(r.dimension)).sort((a, b) => a - b)
            );
        }
    });

    it("describes every one of the seven dimensions", () => {
        // Specification changed 2026-08-29 (night), at the reader's demand and
        // rightly: a family used to constrain one to three dimensions and stay
        // silent on the rest, and a "profile" that says nothing about five
        // dimensions of seven names very little. Silence also kept a median of
        // 4 families inseparable. Every family now takes a position everywhere;
        // wings of one family are expressed as alternatives per dimension.
        for (const family of SYNTHETIC_PROFILES) {
            const { constrained, silent } = familyCompositionOf(family);
            expect(constrained.length, family.id).toBe(7);
            expect(silent, family.id).toEqual([]);
        }
    });

    it("expects only currents that exist, with a published definition", () => {
        // The composition is shown to the reader with a definition per current;
        // an expected label without one would render an empty explanation.
        for (const family of SYNTHETIC_PROFILES) {
            for (const reading of familyCompositionOf(family).constrained) {
                expect(reading.expected.length).toBeGreaterThan(0);
                const definitions = DEFINITIONS[reading.dimension] as Record<string, string>;
                for (const label of reading.expected) {
                    expect(definitions[label], `${family.id} / ${label}`).toBeTruthy();
                }
            }
        }
    });

    it("expects only currents the scoring engine has a signature for", () => {
        // The display and the score must describe the same family: a label
        // without a signature would be shown as defining and silently ignored
        // by the similarity computation.
        for (const family of SYNTHETIC_PROFILES) {
            for (const reading of familyCompositionOf(family).constrained) {
                const { signatures } = ARCHETYPE_SIGNATURES.find(
                    (s) => s.dimension === reading.dimension
                )!;
                for (const label of reading.expected) {
                    expect(signatures[label], `${family.id} / ${label}`).toBeDefined();
                }
            }
        }
    });
});

describe("the respondent's currents laid against a family", () => {
    const family = SYNTHETIC_PROFILES.find(
        (p) => p.id === "souverainiste_republicain_securitaire"
    )!;

    it("marks a dimension as shared when the held current is one the family expects", () => {
        const composition = familyCompositionOf(family, {
            geopolitics: "Gaulliste souverainiste"
        });
        const geopolitics = composition.constrained.find((r) => r.dimension === "geopolitics")!;
        expect(geopolitics.held).toBe("Gaulliste souverainiste");
        expect(geopolitics.shared).toBe(true);
    });

    it("marks it as not shared when the held current is another one", () => {
        const composition = familyCompositionOf(family, {
            geopolitics: "Cosmopolite ouvert"
        });
        const geopolitics = composition.constrained.find((r) => r.dimension === "geopolitics")!;
        expect(geopolitics.held).toBe("Cosmopolite ouvert");
        expect(geopolitics.shared).toBe(false);
    });

    it("holds nothing on a dimension the respondent never answered", () => {
        const composition = familyCompositionOf(family, {});
        for (const reading of composition.constrained) {
            expect(reading.held).toBeNull();
            expect(reading.shared).toBe(false);
        }
    });
});
