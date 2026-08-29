import type { Country } from "@/types/positions";

// Boundary validation. Everything below parses untrusted JSON into a trusted
// type or returns null; past this file, handlers never re-check shapes.

/** Raw request bodies larger than this are refused before being parsed. */
export const MAX_BODY_BYTES = 32 * 1024;

/** Generous for a sealed 33-answer profile (~1 KB), still bounded. */
const MAX_CIPHERTEXT_CHARS = 24 * 1024;
const MAX_IV_CHARS = 64;
const MAX_LEADERS = 12;
const MAX_POSITIONS_TAKEN = 100;

export interface SealedProfileBody {
    ciphertext: string;
    iv: string;
    version: number;
}

export interface AnalysisEventBody {
    country: Country;
    positionsTaken: number;
    leaders: string[];
}

export function parseSealedProfileBody(raw: unknown): SealedProfileBody | null {
    if (typeof raw !== "object" || raw === null) return null;
    const fields = raw as Record<string, unknown>;
    const { ciphertext, iv, version } = fields;
    if (typeof ciphertext !== "string" || ciphertext.length === 0 || ciphertext.length > MAX_CIPHERTEXT_CHARS) {
        return null;
    }
    if (typeof iv !== "string" || iv.length === 0 || iv.length > MAX_IV_CHARS) return null;
    if (typeof version !== "number" || !Number.isInteger(version) || version < 1 || version > 100) {
        return null;
    }
    return { ciphertext, iv, version };
}

export function parseAnalysisEventBody(
    raw: unknown,
    partyIdsOf: (country: Country) => ReadonlySet<string>
): AnalysisEventBody | null {
    if (typeof raw !== "object" || raw === null) return null;
    const fields = raw as Record<string, unknown>;
    const country = fields.country;
    if (country !== "FR" && country !== "BE") return null;
    const positionsTaken = fields.positionsTaken;
    if (
        typeof positionsTaken !== "number" ||
        !Number.isInteger(positionsTaken) ||
        positionsTaken < 0 ||
        positionsTaken > MAX_POSITIONS_TAKEN
    ) {
        return null;
    }
    const leaders = fields.leaders;
    if (!Array.isArray(leaders) || leaders.length > MAX_LEADERS) return null;
    const knownIds = partyIdsOf(country);
    const seen = new Set<string>();
    for (const partyId of leaders) {
        if (typeof partyId !== "string" || !knownIds.has(partyId) || seen.has(partyId)) return null;
        seen.add(partyId);
    }
    return { country, positionsTaken, leaders: leaders as string[] };
}
