import { STATEMENTS } from "@/data/statements";
import { statementsFor } from "@/lib/electoralScope";
import {
    AnswerRecord,
    Country,
    DimensionKey,
    DIMENSION_ORDER,
    LikertValue,
    Statement
} from "@/types/positions";

// Comparing two profiles, entirely client side: both live in the fragment of
// the link, nothing is stored and nothing is transmitted.
//
// Two people do not necessarily answer the same statements. Across the border
// they share the common corpus and nothing else, so the comparison runs on the
// intersection and says how large it was. A percentage computed over statements
// only one of them saw would be a number about nobody.

export interface AnswerPair {
    statement: Statement;
    a: LikertValue;
    b: LikertValue;
    agreement: number;
}

export interface DuoComparison {
    /** Mean agreement over the shared statements, or null when nothing is shared. */
    overall: number | null;
    byDimension: Partial<Record<DimensionKey, number>>;
    pairs: AnswerPair[];
    agreements: AnswerPair[];
    disagreements: AnswerPair[];
    count: number;
}

/** O(statements) in the corpus size. */
export function compareAnswers(a: AnswerRecord, b: AnswerRecord): DuoComparison {
    const pairs: AnswerPair[] = STATEMENTS.flatMap((statement) => {
        const valueA = a[statement.id];
        const valueB = b[statement.id];
        if (valueA === null || valueA === undefined || valueB === null || valueB === undefined) {
            return [];
        }
        return [{ statement, a: valueA, b: valueB, agreement: 1 - Math.abs(valueA - valueB) / 4 }];
    });

    const overall = pairs.length
        ? Math.round((pairs.reduce((sum, p) => sum + p.agreement, 0) / pairs.length) * 100)
        : null;

    const byDimension: Partial<Record<DimensionKey, number>> = {};
    for (const dimension of DIMENSION_ORDER) {
        const list = pairs.filter((p) => p.statement.dimension === dimension);
        if (list.length) {
            byDimension[dimension] = Math.round(
                (list.reduce((sum, p) => sum + p.agreement, 0) / list.length) * 100
            );
        }
    }

    const sorted = [...pairs].sort((x, y) => y.agreement - x.agreement);
    return {
        overall,
        byDimension,
        pairs,
        agreements: sorted.filter((p) => p.agreement >= 0.75).slice(0, 3),
        disagreements: sorted.filter((p) => p.agreement <= 0.5).slice(-3).reverse(),
        count: pairs.length
    };
}

/**
 * How many statements two respondents could possibly share.
 *
 * An unknown country (a link minted before countries existed) is read as
 * "common corpus only", which is the smallest honest claim.
 */
export function sharedStatementCount(a: Country | null, b: Country | null): number {
    if (a !== null && a === b) return statementsFor(a).length;
    return STATEMENTS.filter((s) => s.scope === "common").length;
}
