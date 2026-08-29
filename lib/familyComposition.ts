import { SyntheticProfile } from "@/data/syntheticProfiles";
import { DIMENSION_ORDER, DimensionKey } from "@/types/positions";

// The mapping between the two layers of a result, made displayable. A synthetic
// family is nothing but a named combination of currents on one to three of the
// seven dimensions; on every other dimension it says nothing, and the scoring
// engine reads that silence as the average of the dimension. Every surface that
// names a family renders this structure so the family never reads as an
// unexplained verdict.

/** One dimension a family commits to, laid against what the respondent holds. */
export interface FamilyDimensionReading {
    dimension: DimensionKey;
    /** The currents the family recognises itself in. Alternatives, never blended. */
    expected: string[];
    /** The respondent's dominant current there, when known. */
    held: string | null;
    /** Whether the held current is one of the expected ones. */
    shared: boolean;
}

export interface FamilyComposition {
    /** The dimensions that define the family, in canonical reading order. */
    constrained: FamilyDimensionReading[];
    /** The dimensions the family says nothing about, in the same order. */
    silent: DimensionKey[];
}

/**
 * What a synthetic family is made of, next to the currents a respondent holds.
 * Pass no currents to read the family's definition alone. O(dimensions).
 */
export function familyCompositionOf(
    family: SyntheticProfile,
    held: Partial<Record<DimensionKey, string>> = {}
): FamilyComposition {
    const constrained: FamilyDimensionReading[] = [];
    const silent: DimensionKey[] = [];
    for (const dimension of DIMENSION_ORDER) {
        const expected = family.expects[dimension] ?? [];
        if (expected.length === 0) {
            silent.push(dimension);
            continue;
        }
        const heldLabel = held[dimension] ?? null;
        constrained.push({
            dimension,
            expected,
            held: heldLabel,
            shared: heldLabel !== null && expected.includes(heldLabel)
        });
    }
    return { constrained, silent };
}
