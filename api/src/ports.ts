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
 * The only thing authentication yields: a peppered hash of the Google subject.
 * The raw subject never reaches a handler or a store, so a database dump names
 * nobody.
 */
export interface VerifiedIdentity {
    subHash: string;
}

export type IdentityVerifier = (authorization: string | null) => Promise<VerifiedIdentity | null>;

export interface ApiPorts {
    verifyIdentity: IdentityVerifier;
    vaults: VaultStore;
    stats: StatsStore;
    partyIdsOf(country: Country): ReadonlySet<string>;
    allowedOrigins: ReadonlySet<string>;
    now(): Date;
}
