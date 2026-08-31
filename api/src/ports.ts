import type { Country } from "@/types/positions";

// The seams of the API. Handlers depend on these interfaces only, so the
// whole authorization and validation logic is unit-tested against in-memory
// fakes, and the D1 adapters stay thin enough to be read in one pass.

/** A sealed profile as the server holds it: ciphertext it cannot open. */
export interface StoredVault {
    ciphertext: string;
    iv: string;
    version: number;
    updatedAt: string;
}

export type VaultWriteOutcome = "stored" | "quota_exceeded";

export interface VaultStore {
    read(subHash: string): Promise<StoredVault | null>;
    upsert(
        subHash: string,
        sealed: { ciphertext: string; iv: string; version: number },
        nowIso: string
    ): Promise<VaultWriteOutcome>;
    remove(subHash: string): Promise<void>;
}

export interface LeadingPartyAggregate {
    partyId: string;
    /** Sum of the weighted shares of the analyses this party led. */
    weightSum: number;
    /** Number of analyses where this party was (or tied for) first. */
    timesLed: number;
}

export interface CountryStats {
    analyses: number;
    weightSum: number;
    leaders: LeadingPartyAggregate[];
}

export interface StatsSnapshot {
    totalAnalyses: number;
    countries: Record<Country, CountryStats>;
}

export interface StatsStore {
    /** Must be atomic: totals and per-party shares move together or not at all. */
    recordAnalysis(country: Country, weight: number, shares: Map<string, number>): Promise<void>;
    snapshot(): Promise<StatsSnapshot>;
}

/**
 * What authentication yields: two values derived from the Google subject, which
 * itself never reaches a handler or a store, so a database dump names nobody.
 *
 * `subHash` names the row and is written to the database. `vaultKey` opens it
 * and is written nowhere: it is answered to the browser that proved it owns the
 * account, and forgotten. They come from two separate server secrets on
 * purpose, so that a stolen database, even alongside a known Google account id,
 * cannot be turned into a key.
 */
export interface VerifiedIdentity {
    subHash: string;
    /** 256-bit AES key material, base64. Never stored, never logged. */
    vaultKey: string;
}

export type IdentityVerifier = (authorization: string | null) => Promise<VerifiedIdentity | null>;

/**
 * The two things a caller can make this API do that cost something.
 *
 * `analyses` is an unauthenticated write: it must be bounded or the public
 * counters are whatever the loudest script says they are. `authenticated` is
 * every route that verifies a Google token, which is an RS256 signature check
 * per call and therefore free CPU for anyone sending garbage.
 */
export type RateLimitBucket = "analyses" | "authenticated";

export interface RateLimiter {
    /** false means over the limit. Never throws: a limiter that errors denies. */
    allow(bucket: RateLimitBucket, key: string): Promise<boolean>;
}

/**
 * A refusal worth counting. Successes are not counted: the point is to see
 * what is failing, not to build a traffic log.
 */
export type ApiOutcome = "server_error" | "unauthorized" | "rate_limited" | "quota_exceeded";

/**
 * Detection without collection. Workers observability is off on purpose (a
 * request body must never reach a log), so the operator's only view of the API
 * is this: a count per day, per route, per outcome. No address, no identity, no
 * body, no per-event row, so it stays as anonymous as the analysis counters
 * next to it, and a spike is still visible the next morning.
 */
export interface OutcomeLog {
    record(day: string, route: string, outcome: ApiOutcome): Promise<void>;
}

export interface ApiPorts {
    verifyIdentity: IdentityVerifier;
    vaults: VaultStore;
    stats: StatsStore;
    /**
     * null means this deployment configured none, and the bounded routes then
     * refuse (503) rather than serving unbounded. Secure by default: the safe
     * configuration is the one you get by doing nothing.
     */
    rateLimiter: RateLimiter | null;
    /** null means no counters: a blind spot, not an open door, so it serves. */
    outcomes: OutcomeLog | null;
    partyIdsOf(country: Country): ReadonlySet<string>;
    allowedOrigins: ReadonlySet<string>;
    now(): Date;
}
