import { beforeEach, describe, expect, it } from "vitest";
import { handleApiRequest } from "../api/src/handlers";
import { MAX_BODY_BYTES } from "../api/src/contracts";
import type {
    ApiOutcome,
    ApiPorts,
    OutcomeLog,
    RateLimitBucket,
    RateLimiter,
    StatsSnapshot,
    StatsStore,
    StoredVault,
    VaultStore,
    VaultWriteOutcome
} from "../api/src/ports";
import type { Country } from "@/types/positions";

// Found 2026-08-30, auditing against SECURITY-CHECKLIST.md sections 9 and 18.
// Two holes, both of the same family: an operation anyone can trigger, with
// nothing bounding it, and nothing recording that it happened.
//
//   - POST /analyses took an unauthenticated write with no rate limit. The
//     Origin header is not a control (curl ignores CORS), so anyone could
//     inflate the public statistics the site presents as a measurement, and
//     write to D1 without limit. "A feature used exactly as designed one
//     million times is an incident."
//   - Every authenticated route ran an RS256 verification against Google's
//     JWKS before deciding anything, so a stream of garbage tokens was free
//     CPU to burn. The checklist puts rate limiting on authentication at P0.
//   - Nothing was logged anywhere: observability is off (deliberately, so no
//     token can reach a log), 500s answer an empty body, and a broken vault
//     would have been reported first by a user. A09 in the OWASP Top 10:2025.
//
// The invariants: every user-triggerable operation is bounded; a deployment
// that configured no limiter refuses the bounded operations rather than
// serving them unbounded; and refusals are counted in a form that identifies
// nobody.

const ORIGIN = "https://crible.eu";
const AUTH = { authorization: "Bearer valid-token" };

class MemoryVaultStore implements VaultStore {
    vaults = new Map<string, StoredVault>();

    async read(subHash: string): Promise<StoredVault | null> {
        return this.vaults.get(subHash) ?? null;
    }

    async upsert(
        subHash: string,
        sealed: { ciphertext: string; iv: string; version: number },
        nowIso: string
    ): Promise<VaultWriteOutcome> {
        this.vaults.set(subHash, { ...sealed, updatedAt: nowIso });
        return "stored";
    }

    async remove(subHash: string): Promise<void> {
        this.vaults.delete(subHash);
    }
}

class MemoryStatsStore implements StatsStore {
    recorded = 0;
    failing = false;

    async recordAnalysis(): Promise<void> {
        if (this.failing) throw new Error("db unreachable");
        this.recorded += 1;
    }

    async snapshot(): Promise<StatsSnapshot> {
        if (this.failing) throw new Error("db unreachable");
        return {
            totalAnalyses: this.recorded,
            countries: {
                FR: { analyses: this.recorded, weightSum: 0, leaders: [] },
                BE: { analyses: 0, weightSum: 0, leaders: [] }
            }
        };
    }
}

/** Counts calls per bucket and refuses past a budget, like the real binding. */
class CountingRateLimiter implements RateLimiter {
    calls: { bucket: RateLimitBucket; key: string }[] = [];
    budget = Infinity;

    async allow(bucket: RateLimitBucket, key: string): Promise<boolean> {
        this.calls.push({ bucket, key });
        return this.calls.filter((call) => call.bucket === bucket).length <= this.budget;
    }
}

class MemoryOutcomeLog implements OutcomeLog {
    entries: { day: string; route: string; outcome: ApiOutcome }[] = [];
    failing = false;

    async record(day: string, route: string, outcome: ApiOutcome): Promise<void> {
        if (this.failing) throw new Error("counter table missing");
        this.entries.push({ day, route, outcome });
    }
}

let vaults: MemoryVaultStore;
let stats: MemoryStatsStore;
let limiter: CountingRateLimiter;
let outcomes: MemoryOutcomeLog;

function portsWith(overrides: Partial<ApiPorts> = {}): ApiPorts {
    return {
        verifyIdentity: async (authorization) =>
            authorization === AUTH.authorization ? { subHash: "a".repeat(64), vaultKey: "k" } : null,
        vaults,
        stats,
        rateLimiter: limiter,
        outcomes,
        partyIdsOf: (country: Country) =>
            country === "FR" ? new Set(["fr_lfi"]) : new Set(["be_ptb"]),
        allowedOrigins: new Set([ORIGIN]),
        now: () => new Date("2026-08-31T09:30:00.000Z"),
        ...overrides
    };
}

function requestOf(
    method: string,
    path: string,
    body?: unknown,
    headers: Record<string, string> = {}
): Request {
    return new Request(`https://api.example${path}`, {
        method,
        headers: {
            origin: ORIGIN,
            "content-type": "application/json",
            "cf-connecting-ip": "203.0.113.7",
            ...headers
        },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
}

const EVENT = { country: "FR", positionsTaken: 30, leaders: ["fr_lfi"] };
const SEALED = { ciphertext: "YmxvYg==", iv: "aXZpdml2aXZpdg==", version: 1 };

beforeEach(() => {
    vaults = new MemoryVaultStore();
    stats = new MemoryStatsStore();
    limiter = new CountingRateLimiter();
    outcomes = new MemoryOutcomeLog();
});

describe("the anonymous counter is bounded", () => {
    it("asks the limiter before writing anything", async () => {
        const response = await handleApiRequest(requestOf("POST", "/analyses", EVENT), portsWith());
        expect(response.status).toBe(204);
        expect(limiter.calls).toEqual([{ bucket: "analyses", key: "203.0.113.7" }]);
        expect(stats.recorded).toBe(1);
    });

    it("answers 429 past the limit, and records nothing", async () => {
        limiter.budget = 2;
        const ports = portsWith();
        for (let attempt = 0; attempt < 2; attempt += 1) {
            expect((await handleApiRequest(requestOf("POST", "/analyses", EVENT), ports)).status).toBe(204);
        }
        const refused = await handleApiRequest(requestOf("POST", "/analyses", EVENT), ports);
        expect(refused.status).toBe(429);
        expect(stats.recorded).toBe(2);
    });

    it("puts callers with no address in one shared bucket rather than none", async () => {
        // Better one crowded bucket than an unbounded path opened by removing
        // a header. Local development lands here too.
        await handleApiRequest(
            new Request("https://api.example/analyses", {
                method: "POST",
                headers: { origin: ORIGIN, "content-type": "application/json" },
                body: JSON.stringify(EVENT)
            }),
            portsWith()
        );
        expect(limiter.calls[0].key).toBe("unknown");
    });

    it("refuses to serve the counter at all when no limiter is configured", async () => {
        // Fail closed: an unbounded write path is not the fallback for a
        // deployment that forgot a binding.
        const response = await handleApiRequest(
            requestOf("POST", "/analyses", EVENT),
            portsWith({ rateLimiter: null })
        );
        expect(response.status).toBe(503);
        expect(stats.recorded).toBe(0);
    });
});

describe("the authenticated routes are bounded too", () => {
    it.each([
        ["GET", "/vault"],
        ["PUT", "/vault"],
        ["DELETE", "/vault"],
        ["GET", "/vault/key"]
    ])("%s %s asks the limiter", async (method, path) => {
        await handleApiRequest(
            requestOf(method, path, method === "PUT" ? SEALED : undefined, AUTH),
            portsWith()
        );
        expect(limiter.calls).toEqual([{ bucket: "authenticated", key: "203.0.113.7" }]);
    });

    it("refuses past the limit before verifying anything", async () => {
        // The point of the bucket: signature verification is the expensive
        // part, so the limit is checked first or it protects nothing.
        limiter.budget = 0;
        let verified = 0;
        const response = await handleApiRequest(
            requestOf("GET", "/vault", undefined, AUTH),
            portsWith({
                verifyIdentity: async () => {
                    verified += 1;
                    return { subHash: "a".repeat(64), vaultKey: "k" };
                }
            })
        );
        expect(response.status).toBe(429);
        expect(verified).toBe(0);
    });

    it("refuses the whole vault when no limiter is configured", async () => {
        const response = await handleApiRequest(
            requestOf("GET", "/vault", undefined, AUTH),
            portsWith({ rateLimiter: null })
        );
        expect(response.status).toBe(503);
    });

    it("leaves the public read alone: it is cacheable and carries no cost", async () => {
        const response = await handleApiRequest(requestOf("GET", "/stats"), portsWith());
        expect(response.status).toBe(200);
        expect(limiter.calls).toHaveLength(0);
    });
});

describe("the body bound counts bytes, not characters", () => {
    it("refuses a body over the budget in bytes", async () => {
        // "é" is one character and two bytes: a body of MAX_BODY_BYTES such
        // characters passed a length check while weighing twice the budget.
        const oversized = { ciphertext: "é".repeat(MAX_BODY_BYTES - 100) };
        const response = await handleApiRequest(
            requestOf("PUT", "/vault", oversized, AUTH),
            portsWith()
        );
        expect(response.status).toBe(413);
    });

    it("still accepts a body that is genuinely within it", async () => {
        const response = await handleApiRequest(requestOf("PUT", "/vault", SEALED, AUTH), portsWith());
        expect(response.status).toBe(204);
    });
});

describe("refusals are counted, in a form that identifies nobody", () => {
    it("counts an unauthorized attempt", async () => {
        await handleApiRequest(requestOf("GET", "/vault", undefined, { authorization: "Bearer no" }), portsWith());
        expect(outcomes.entries).toEqual([
            { day: "2026-08-31", route: "/vault", outcome: "unauthorized" }
        ]);
    });

    it("counts a rate-limited attempt", async () => {
        limiter.budget = 0;
        await handleApiRequest(requestOf("POST", "/analyses", EVENT), portsWith());
        expect(outcomes.entries).toEqual([
            { day: "2026-08-31", route: "/analyses", outcome: "rate_limited" }
        ]);
    });

    it("counts a server failure, which is the one nobody would otherwise see", async () => {
        stats.failing = true;
        const response = await handleApiRequest(requestOf("POST", "/analyses", EVENT), portsWith());
        expect(response.status).toBe(500);
        expect(outcomes.entries).toEqual([
            { day: "2026-08-31", route: "/analyses", outcome: "server_error" }
        ]);
    });

    it("never writes a caller-controlled path into the counters", async () => {
        // A 404 on an arbitrary path would otherwise let anyone insert
        // arbitrary strings into the operator's own table.
        await handleApiRequest(requestOf("GET", "/../etc/passwd?x=<script>"), portsWith());
        for (const entry of outcomes.entries) {
            expect(["/vault", "/vault/key", "/analyses", "/stats", "unknown"]).toContain(entry.route);
        }
    });

    it("counts nothing on a request that succeeded", async () => {
        await handleApiRequest(requestOf("GET", "/stats"), portsWith());
        expect(outcomes.entries).toHaveLength(0);
    });

    it("never lets a broken counter break the request it was counting", async () => {
        // Observability is not allowed to become a new failure mode.
        outcomes.failing = true;
        const response = await handleApiRequest(requestOf("POST", "/analyses", EVENT), portsWith());
        expect(response.status).toBe(204);
    });

    it("serves the API when no counter is configured at all", async () => {
        // Unlike the limiter: not counting is a blind spot, not an open door.
        const response = await handleApiRequest(
            requestOf("POST", "/analyses", EVENT),
            portsWith({ outcomes: null })
        );
        expect(response.status).toBe(204);
    });
});
