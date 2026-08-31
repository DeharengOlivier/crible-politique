import type { AnalysisStatEvent } from "@/lib/analysisStatEvent";
import type { SealedProfile, VaultKey } from "@/lib/profileVault";
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

/**
 * How long any call to the API may take before it is given up on.
 *
 * A connection that hangs is worse than one that fails: the reader waits at a
 * spinner with nothing to cancel. Eight seconds leaves room for a phone on a
 * poor connection and is still short enough that someone is plausibly still
 * looking at the screen. Every call here is bounded by it (CODING-RULES.md 7).
 */
export const API_TIMEOUT_MS = 8000;

/**
 * fetch, with an end. Built on AbortController and setTimeout rather than
 * AbortSignal.timeout so the budget is on the ordinary clock, which tests can
 * advance instead of waiting out.
 */
async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const expiry = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(expiry);
    }
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
        void apiFetch(`${base}/analyses`, {
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
        const response = await apiFetch(`${base}/stats`);
        if (!response.ok) return null;
        return parsePublicStats(await response.json());
    } catch {
        return null;
    }
}

export type VaultKeyResult =
    | { outcome: "found"; key: VaultKey }
    | { outcome: "unauthorized" }
    | { outcome: "error" };

/**
 * The key that opens this account's vault, derived by the API from the Google
 * account behind the token. It is used to seal and open in the browser and is
 * never stored anywhere: a new device asks again after signing in.
 */
export async function fetchVaultKey(idToken: string): Promise<VaultKeyResult> {
    const base = cribleApiBaseUrl();
    if (base === null) return { outcome: "error" };
    try {
        const response = await apiFetch(`${base}/vault/key`, {
            headers: { authorization: `Bearer ${idToken}` }
        });
        if (response.status === 401) return { outcome: "unauthorized" };
        if (!response.ok) return { outcome: "error" };
        const body: unknown = await response.json();
        const key = vaultKeyFrom(body);
        return key === null ? { outcome: "error" } : { outcome: "found", key };
    } catch {
        return { outcome: "error" };
    }
}

/** Narrows the API's answer: 32 bytes of base64, or nothing. */
function vaultKeyFrom(raw: unknown): VaultKey | null {
    if (typeof raw !== "object" || raw === null) return null;
    const { key } = raw as Record<string, unknown>;
    if (typeof key !== "string" || key.length === 0) return null;
    try {
        const bytes = Uint8Array.from(atob(key), (character) => character.charCodeAt(0));
        return bytes.length === 32 ? { raw: bytes } : null;
    } catch {
        return null;
    }
}

export type VaultSaveOutcome = "saved" | "quota_exceeded" | "unauthorized" | "error";

export async function saveVault(idToken: string, sealed: SealedProfile): Promise<VaultSaveOutcome> {
    const base = cribleApiBaseUrl();
    if (base === null) return "error";
    try {
        const response = await apiFetch(`${base}/vault`, {
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
        const response = await apiFetch(`${base}/vault`, {
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
        const response = await apiFetch(`${base}/vault`, {
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
