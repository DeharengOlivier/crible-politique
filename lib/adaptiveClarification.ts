import { ARCHETYPE_SIGNATURES } from "@/data/archetypeSignatures";
import { STATEMENTS } from "@/data/statements";
import { computeProfile } from "@/lib/scoringEngine";
import { AnswerRecord, LikertValue, Statement } from "@/types/positions";

// Adaptive tie-break after the express test.
//
// Why it exists: the express test asks two statements per dimension while the
// archetype signatures span three or four, so many currents can end tied.
// Measured on 2026-08-29 by exhaustive enumeration of express answers: 35 of
// the 79 archetypes in France and 52 in Belgium could never be the unique
// winner of their dimension, and the shared badge then fell back to the first
// tied archetype in declaration order, an arbitration by the data file rather
// than by the respondent.
//
// The remedy is one extra question at a time, chosen where it separates: when
// a dimension ends on a tie, ask the unanswered statement of that dimension
// over which the tied signatures disagree the most. Measured on respondents
// answering exactly a signature: every one of the 79 archetypes reaches a
// unique win within two extra questions per dimension (expected total +3.3
// questions in France, +4.7 in Belgium).
//
// The rule is deterministic and published (METHODOLOGY.md section 2.3): the
// next statement is a pure function of the answers already given, so the whole
// sequence stays recomputable by hand. Everything runs on the statements
// common to both countries, because signatures cover only those.

/**
 * After this many clarifying statements in one dimension, a persisting tie is
 * the honest result and is displayed as one. Two is the measured maximum a
 * consistent respondent ever needs; beyond it more questions measure
 * ambivalence, not resolution.
 */
export const MAX_CLARIFICATIONS_PER_DIMENSION = 2;

export interface Clarification {
    statement: Statement;
    /** The archetypes this statement is asked to separate, in display order. */
    tiedLabels: string[];
}

const STATEMENT_BY_ID = new Map(STATEMENTS.map((statement) => [statement.id, statement]));

/**
 * The next statement worth asking to break an archetype tie, or null when no
 * answered dimension is tied, every tied one has spent its budget, or no
 * remaining statement can separate the tied signatures.
 *
 * `asked` is the list of statement ids already asked as clarifications, in any
 * order; it is what enforces the budget. O(dimensions x archetypes x
 * statements) over constant-sized published data.
 */
export function nextClarifyingStatement(
    answers: AnswerRecord,
    asked: readonly string[]
): Clarification | null {
    const profile = computeProfile(answers);

    for (const { dimension, signatures } of ARCHETYPE_SIGNATURES) {
        const tied = profile.dimensionTies[dimension];
        if (!tied || tied.length < 2) continue;

        const items = Object.keys(Object.values(signatures)[0]);
        const spent = asked.filter((id) => items.includes(id)).length;
        if (spent >= MAX_CLARIFICATIONS_PER_DIMENSION) continue;

        // A statement answered "sans opinion" counts as asked and settled: it
        // is in `answers` with a null value and is never proposed again.
        const candidates = items.filter(
            (id) => answers[id] === undefined && !asked.includes(id)
        );

        let best: { id: string; distinctValues: number } | null = null;
        for (const id of candidates) {
            const distinctValues = new Set(
                tied.map((label) => (signatures[label] as Record<string, LikertValue>)[id])
            ).size;
            // A statement on which all tied signatures agree cannot separate
            // them, whatever the respondent answers.
            if (distinctValues > 1 && (!best || distinctValues > best.distinctValues)) {
                best = { id, distinctValues };
            }
        }
        if (!best) continue;

        return { statement: STATEMENT_BY_ID.get(best.id)!, tiedLabels: tied };
    }
    return null;
}
