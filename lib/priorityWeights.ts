import { Country, DimensionKey } from "@/types/positions";
import { statementsFor } from "@/lib/electoralScope";

// The reader's fights turned into the per-statement salience weights the
// scoring engine has accepted since the start (METHODOLOGY.md 3.4): every
// statement of a named dimension counts double, everything else keeps weight
// 1 by omission. The formula stays a weighted mean, recomputable by hand.

export const MAX_PRIORITY_DIMENSIONS = 3;

/** Weights for the statements of the named dimensions. O(statements). */
export function weightsForPriorities(
    country: Country,
    priorities: readonly DimensionKey[]
): Record<string, number> {
    const named = new Set(priorities);
    const weights: Record<string, number> = {};
    for (const statement of statementsFor(country)) {
        if (named.has(statement.dimension)) weights[statement.id] = 2;
    }
    return weights;
}
