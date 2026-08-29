import { BelgianCollege, Country, Statement } from "@/types/positions";
import { PoliticalParty } from "@/types/archetypes";
import { EXPRESS_IDS_BY_COUNTRY, STATEMENTS, STATEMENTS_BY_ID } from "@/data/statements";
import { PARTIES } from "@/data/parties";

// What one respondent is asked, and who they are compared against.
//
// The tool covers two political systems, and mixing them is not a display
// detail: the same statement does not mean the same thing in both (see
// data/statements.ts on decentralisation), and half the parties on the list
// are ones the respondent cannot vote for. Scoping is therefore part of the
// measurement, not of the presentation, which is why it lives here rather
// than in a component.

export const COUNTRIES: readonly Country[] = ["FR", "BE"] as const;

export const BELGIAN_COLLEGES: readonly BelgianCollege[] = [
    "wallonie",
    "bruxelles",
    "flandre"
] as const;

export const COUNTRY_LABELS: Record<Country, string> = {
    FR: "France",
    BE: "Belgique"
};

export const COLLEGE_LABELS: Record<BelgianCollege, string> = {
    wallonie: "Wallonie",
    bruxelles: "Bruxelles",
    flandre: "Flandre"
};

// Static corpus, so the scoped views are computed once at module load rather
// than on every render. O(statements) and O(parties) once, O(1) per lookup.
const STATEMENTS_BY_COUNTRY: Record<Country, Statement[]> = {
    FR: STATEMENTS.filter((s) => s.scope === "common" || s.scope === "FR"),
    BE: STATEMENTS.filter((s) => s.scope === "common" || s.scope === "BE")
};

const EXPRESS_BY_COUNTRY: Record<Country, Statement[]> = {
    FR: EXPRESS_IDS_BY_COUNTRY.FR.map((id) => STATEMENTS_BY_ID[id]),
    BE: EXPRESS_IDS_BY_COUNTRY.BE.map((id) => STATEMENTS_BY_ID[id])
};

const PARTIES_BY_COUNTRY: Record<Country, PoliticalParty[]> = {
    FR: PARTIES.filter((p) => p.country === "FR"),
    BE: PARTIES.filter((p) => p.country === "BE")
};

/** The statements a respondent of this country answers, in corpus order. */
export function statementsFor(country: Country): Statement[] {
    return STATEMENTS_BY_COUNTRY[country];
}

/** The 14 express statements of this country: 2 per dimension, in corpus order. */
export function expressStatementsFor(country: Country): Statement[] {
    return EXPRESS_BY_COUNTRY[country];
}

/**
 * The parties a respondent is compared against.
 *
 * Belgium votes in three electoral colleges and a ballot only ever carries the
 * lists of one of them, so a chosen college narrows the comparison to the
 * parties the respondent could actually vote for. Without a college the whole
 * country is returned, which is the honest answer to "I would rather see them
 * all" and the only possible one for France.
 */
export function partiesFor(country: Country, college?: BelgianCollege): PoliticalParty[] {
    const all = PARTIES_BY_COUNTRY[country];
    if (country !== "BE" || college === undefined) return all;
    return all.filter((p) => p.colleges?.includes(college));
}

/** Narrows an untrusted string (URL, localStorage) to a country, or null. */
export function parseCountry(raw: unknown): Country | null {
    return typeof raw === "string" && (COUNTRIES as readonly string[]).includes(raw)
        ? (raw as Country)
        : null;
}

/** Narrows an untrusted string (URL, localStorage) to a Belgian college, or null. */
export function parseBelgianCollege(raw: unknown): BelgianCollege | null {
    return typeof raw === "string" && (BELGIAN_COLLEGES as readonly string[]).includes(raw)
        ? (raw as BelgianCollege)
        : null;
}
