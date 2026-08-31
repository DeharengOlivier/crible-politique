import type { Country } from "@/types/positions";
import { partiesFor } from "@/lib/electoralScope";
import { handleApiRequest } from "./handlers";
import { googleIdentityVerifier } from "./googleIdentity";
import { d1OutcomeLog, d1StatsStore, d1VaultStore } from "./d1Stores";
import type { ApiPorts, RateLimitBucket, RateLimiter } from "./ports";

// Cloudflare Workers entry point. Everything testable lives behind
// handleApiRequest; this file only wires the real adapters to the bindings
// declared in wrangler.toml.

interface Env {
    DB: D1Database;
    GOOGLE_CLIENT_ID: string;
    /** Secret (wrangler secret put SUB_PEPPER): peppers the subject hashes. */
    SUB_PEPPER: string;
    /**
     * Secret (wrangler secret put VAULT_KEY_PEPPER): peppers the vault keys.
     * Separate from SUB_PEPPER on purpose: one names the rows, the other opens
     * them, and holding the database must not be holding both.
     */
    VAULT_KEY_PEPPER: string;
    /** Comma-separated list of origins allowed to call the writing endpoints. */
    ALLOWED_ORIGINS: string;
    /**
     * Rate limit bindings (wrangler.toml). Optional in the type and required
     * in practice: without them the bounded routes answer 503 rather than
     * serving unbounded, so a deployment that drops them notices immediately
     * instead of silently opening a write path.
     */
    ANALYSES_LIMIT?: RateLimit;
    AUTH_LIMIT?: RateLimit;
}

/**
 * Cloudflare's rate limiter, one binding per bucket. The binding counts in the
 * edge and stores nothing durable, so bounding by address costs no record of
 * anyone's address.
 */
function rateLimiterOf(env: Env): RateLimiter | null {
    const { ANALYSES_LIMIT, AUTH_LIMIT } = env;
    if (ANALYSES_LIMIT === undefined || AUTH_LIMIT === undefined) return null;
    const buckets: Record<RateLimitBucket, RateLimit> = {
        analyses: ANALYSES_LIMIT,
        authenticated: AUTH_LIMIT
    };
    return { allow: async (bucket, key) => (await buckets[bucket].limit({ key })).success };
}

// The party lists are the same single source of truth the site scores with,
// so a party added to data/ is accepted here on the next deploy, never before.
const PARTY_IDS: Record<Country, ReadonlySet<string>> = {
    FR: new Set(partiesFor("FR").map((party) => party.id)),
    BE: new Set(partiesFor("BE").map((party) => party.id))
};

let cachedPorts: ApiPorts | null = null;

// Bindings are stable for the life of an isolate, so the JWKS cache inside the
// verifier survives across requests instead of refetching Google's keys.
function portsOf(env: Env): ApiPorts {
    cachedPorts ??= {
        verifyIdentity: googleIdentityVerifier(
            env.GOOGLE_CLIENT_ID,
            env.SUB_PEPPER,
            env.VAULT_KEY_PEPPER
        ),
        vaults: d1VaultStore(env.DB),
        stats: d1StatsStore(env.DB),
        rateLimiter: rateLimiterOf(env),
        outcomes: d1OutcomeLog(env.DB),
        partyIdsOf: (country) => PARTY_IDS[country],
        allowedOrigins: new Set(
            env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter((origin) => origin.length > 0)
        ),
        now: () => new Date()
    };
    return cachedPorts;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        return handleApiRequest(request, portsOf(env));
    }
} satisfies ExportedHandler<Env>;
