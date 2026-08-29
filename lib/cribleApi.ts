import type { AnalysisStatEvent } from "@/lib/analysisStatEvent";
import type { SealedProfile } from "@/lib/profileVault";
import type { Country } from "@/types/positions";

// The only client this site has for its only server (api/, a Cloudflare
// Worker). Three rules govern every call here:
//   - the API is optional: without NEXT_PUBLIC_CRIBLE_API_URL the site runs
//     exactly as before, and nothing here throws into a caller;
//   - what leaves is bounded and known: an anonymous aggregate event, or a
//     sealed blob the server cannot read;
//   - what comes back is untrusted input, parsed at this boundary.

export interface LeadingPartyStat {
    partyId: string;
    weightSum: number;
    timesLed: number;
}

export interface CountryPublicStats {
    analyses: number;
    weightSum: number;
    leaders: LeadingPartyStat[];
}

export interface PublicStats {
    totalAnalyses: number;
    generatedAt: string;
    countries: Record<Country, CountryPublicStats>;
}

export function cribleApiBaseUrl(): string | null {
    const url = process.env.NEXT_PUBLIC_CRIBLE_API_URL;
    if (url === undefined || url.length === 0) return null;
    return url.replace(/\/+$/, "");
}

/**
 * Fire-and-forget: a statistics counter must never delay, block or break the
 * results screen, so failures of any kind are swallowed here and nowhere else.
 */
export function reportAnalysis(event: AnalysisStatEvent): void {
    const base = cribleApiBaseUrl();
    if (base === null) return;
    try {
        void fetch(`${base}/analyses`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(event),
            keepalive: true
        }).catch(() => undefined);
    } catch {
        // a counter is never worth an error surface
    }
}

export async function fetchPublicStats(): Promise<PublicStats | null> {
    const base = cribleApiBaseUrl();
    if (base === null) return null;
    try {
        const response = await fetch(`${base}/stats`);
        if (!response.ok) return null;
        return parsePublicStats(await response.json());
    } catch {
        return null;
    }
}

export type VaultSaveOutcome = "saved" | "quota_exceeded" | "unauthorized" | "error";

export async function saveVault(idToken: string, sealed: SealedProfile): Promise<VaultSaveOutcome> {
    const base = cribleApiBaseUrl();
    if (base === null) return "error";
    try {
        const response = await fetch(`${base}/vault`, {
            method: "PUT",
            headers: { authorization: `Bearer ${idToken}`, "content-type": "application/json" },
            body: JSON.stringify(sealed)
        });
        if (response.status === 204) return "saved";
        if (response.status === 429) return "quota_exceeded";
        if (response.status === 401) return "unauthorized";
        return "error";
    } catch {
        return "error";
    }
}

export type VaultLoadResult =
    | { outcome: "found"; sealed: SealedProfile }
    | { outcome: "empty" }
    | { outcome: "unauthorized" }
    | { outcome: "error" };

export async function loadVault(idToken: string): Promise<VaultLoadResult> {
    const base = cribleApiBaseUrl();
    if (base === null) return { outcome: "error" };
    try {
        const response = await fetch(`${base}/vault`, {
            headers: { authorization: `Bearer ${idToken}` }
        });
        if (response.status === 404) return { outcome: "empty" };
        if (response.status === 401) return { outcome: "unauthorized" };
        if (!response.ok) return { outcome: "error" };
        const sealed = parseSealedProfile(await response.json());
        return sealed === null ? { outcome: "error" } : { outcome: "found", sealed };
    } catch {
        return { outcome: "error" };
    }
}

export async function deleteVault(idToken: string): Promise<boolean> {
    const base = cribleApiBaseUrl();
    if (base === null) return false;
    try {
        const response = await fetch(`${base}/vault`, {
            method: "DELETE",
            headers: { authorization: `Bearer ${idToken}` }
        });
        return response.status === 204;
    } catch {
        return false;
    }
}

export function parsePublicStats(raw: unknown): PublicStats | null {
    if (typeof raw !== "object" || raw === null) return null;
    const fields = raw as Record<string, unknown>;
    if (!isCount(fields.totalAnalyses) || typeof fields.generatedAt !== "string") return null;
    const countries = fields.countries;
    if (typeof countries !== "object" || countries === null) return null;
    const fr = parseCountryStats((countries as Record<string, unknown>).FR);
    const be = parseCountryStats((countries as Record<string, unknown>).BE);
    if (fr === null || be === null) return null;
    return {
        totalAnalyses: fields.totalAnalyses,
        generatedAt: fields.generatedAt,
        countries: { FR: fr, BE: be }
    };
}

function parseCountryStats(raw: unknown): CountryPublicStats | null {
    if (typeof raw !== "object" || raw === null) return null;
    const fields = raw as Record<string, unknown>;
    if (!isCount(fields.analyses) || !isNonNegative(fields.weightSum)) return null;
    if (!Array.isArray(fields.leaders)) return null;
    const leaders: LeadingPartyStat[] = [];
    for (const entry of fields.leaders) {
        if (typeof entry !== "object" || entry === null) return null;
        const { partyId, weightSum, timesLed } = entry as Record<string, unknown>;
        if (typeof partyId !== "string" || !isNonNegative(weightSum) || !isCount(timesLed)) return null;
        leaders.push({ partyId, weightSum, timesLed });
    }
    return { analyses: fields.analyses, weightSum: fields.weightSum, leaders };
}

function isCount(value: unknown): value is number {
    return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isNonNegative(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function parseSealedProfile(raw: unknown): SealedProfile | null {
    if (typeof raw !== "object" || raw === null) return null;
    const { ciphertext, iv, version } = raw as Record<string, unknown>;
    if (typeof ciphertext !== "string" || typeof iv !== "string" || typeof version !== "number") {
        return null;
    }
    return { ciphertext, iv, version };
}
