import { beforeEach, describe, expect, it } from "vitest";
import { handleApiRequest } from "../api/src/handlers";
import type {
    ApiPorts,
    StatsSnapshot,
    StatsStore,
    StoredVault,
    VaultStore,
    VaultWriteOutcome,
    VerifiedIdentity
} from "../api/src/ports";
import type { Country } from "@/types/positions";

// The API is the only server this project has, and it may only ever hold two
// things: sealed blobs it cannot read, and anonymous aggregate counters. This
// battery is the negative-permission proof: the wrong identity, the missing
// token, the forged field, the oversized body, the unknown party.

const ORIGIN = "https://crible.eu";

class MemoryVaultStore implements VaultStore {
    vaults = new Map<string, StoredVault>();
    quotaExhausted = false;

    async read(subHash: string): Promise<StoredVault | null> {
        return this.vaults.get(subHash) ?? null;
    }

    async upsert(
        subHash: string,
        sealed: { ciphertext: string; iv: string; version: number },
        nowIso: string
    ): Promise<VaultWriteOutcome> {
        if (this.quotaExhausted) return "quota_exceeded";
        this.vaults.set(subHash, { ...sealed, updatedAt: nowIso });
        return "stored";
    }

    async remove(subHash: string): Promise<void> {
        this.vaults.delete(subHash);
    }
}

class MemoryStatsStore implements StatsStore {
    analyses: Record<Country, number> = { FR: 0, BE: 0 };
    weightSums: Record<Country, number> = { FR: 0, BE: 0 };
    partyWeights = new Map<string, number>();
    partyLeadCounts = new Map<string, number>();
    failing = false;

    async recordAnalysis(country: Country, weight: number, shares: Map<string, number>): Promise<void> {
        if (this.failing) throw new Error("db unreachable");
        this.analyses[country] += 1;
        this.weightSums[country] += weight;
        for (const [partyId, share] of shares) {
            this.partyWeights.set(partyId, (this.partyWeights.get(partyId) ?? 0) + share);
            this.partyLeadCounts.set(partyId, (this.partyLeadCounts.get(partyId) ?? 0) + 1);
        }
    }

    async snapshot(): Promise<StatsSnapshot> {
        if (this.failing) throw new Error("db unreachable");
        const countryOf = (partyId: string): Country => (partyId.startsWith("fr_") ? "FR" : "BE");
        const leadersOf = (country: Country) =>
            [...this.partyWeights.entries()]
                .filter(([partyId]) => countryOf(partyId) === country)
                .map(([partyId, weightSum]) => ({
                    partyId,
                    weightSum,
                    timesLed: this.partyLeadCounts.get(partyId) ?? 0
                }));
        return {
            totalAnalyses: this.analyses.FR + this.analyses.BE,
            countries: {
                FR: { analyses: this.analyses.FR, weightSum: this.weightSums.FR, leaders: leadersOf("FR") },
                BE: { analyses: this.analyses.BE, weightSum: this.weightSums.BE, leaders: leadersOf("BE") }
            }
        };
    }
}

let vaults: MemoryVaultStore;
let stats: MemoryStatsStore;

// The key an identity carries is irrelevant to authorization, which is what
// this file is about, so the fakes name it after the row they own. What the
// real verifier derives is in vaultKeyFromGoogle.test.ts.
function portsWith(identity: Omit<VerifiedIdentity, "vaultKey"> | null): ApiPorts {
    return {
        verifyIdentity: async (authorization) =>
            authorization === "Bearer valid-token" && identity !== null
                ? { ...identity, vaultKey: `key-of-${identity.subHash}` }
                : null,
        vaults,
        stats,
        // This file is about authorization and validation, so the bounds are
        // wide open here on purpose; what the limiter and the counters do is
        // in apiAbuseBounds.test.ts.
        rateLimiter: { allow: async () => true },
        outcomes: null,
        partyIdsOf: (country) =>
            country === "FR" ? new Set(["fr_lfi", "fr_rn", "fr_eelv"]) : new Set(["be_ptb", "be_ecolo", "be_groen"]),
        allowedOrigins: new Set([ORIGIN, "http://localhost:3000"]),
        now: () => new Date("2026-08-29T12:00:00.000Z")
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
        headers: { origin: ORIGIN, "content-type": "application/json", ...headers },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
}

const SEALED = { ciphertext: "YmxvYg==", iv: "aXZpdml2aXZpdg==", version: 1 };
const AUTH = { authorization: "Bearer valid-token" };

beforeEach(() => {
    vaults = new MemoryVaultStore();
    stats = new MemoryStatsStore();
});

describe("vault authorization", () => {
    it("refuses every vault operation without a token", async () => {
        const ports = portsWith({ subHash: "hash-a" });
        for (const method of ["GET", "PUT", "DELETE"]) {
            const body = method === "PUT" ? SEALED : undefined;
            const response = await handleApiRequest(requestOf(method, "/vault", body), ports);
            expect(response.status, method).toBe(401);
        }
        expect(vaults.vaults.size).toBe(0);
    });

    it("refuses a token the verifier rejects", async () => {
        const ports = portsWith(null);
        const response = await handleApiRequest(requestOf("PUT", "/vault", SEALED, AUTH), ports);
        expect(response.status).toBe(401);
    });

    it("never lets one identity read another's vault", async () => {
        await handleApiRequest(requestOf("PUT", "/vault", SEALED, AUTH), portsWith({ subHash: "hash-a" }));
        const asOther = await handleApiRequest(requestOf("GET", "/vault", undefined, AUTH), portsWith({ subHash: "hash-b" }));
        expect(asOther.status).toBe(404);
    });

    it("ignores any identity the body claims: the token decides, nothing else", async () => {
        const forged = { ...SEALED, subHash: "hash-victim", sub: "victim@example.com" };
        await handleApiRequest(requestOf("PUT", "/vault", forged, AUTH), portsWith({ subHash: "hash-a" }));
        expect([...vaults.vaults.keys()]).toEqual(["hash-a"]);
    });
});

describe("vault storage", () => {
    it("round-trips a sealed profile for its owner", async () => {
        const ports = portsWith({ subHash: "hash-a" });
        const put = await handleApiRequest(requestOf("PUT", "/vault", SEALED, AUTH), ports);
        expect(put.status).toBe(204);
        const get = await handleApiRequest(requestOf("GET", "/vault", undefined, AUTH), ports);
        expect(get.status).toBe(200);
        expect(await get.json()).toEqual({ ...SEALED, updatedAt: "2026-08-29T12:00:00.000Z" });
    });

    it("deletes on request and then has nothing to return", async () => {
        const ports = portsWith({ subHash: "hash-a" });
        await handleApiRequest(requestOf("PUT", "/vault", SEALED, AUTH), ports);
        const del = await handleApiRequest(requestOf("DELETE", "/vault", undefined, AUTH), ports);
        expect(del.status).toBe(204);
        const get = await handleApiRequest(requestOf("GET", "/vault", undefined, AUTH), ports);
        expect(get.status).toBe(404);
    });

    it("refuses malformed JSON with 400", async () => {
        const ports = portsWith({ subHash: "hash-a" });
        const request = new Request("https://api.example/vault", {
            method: "PUT",
            headers: { origin: ORIGIN, ...AUTH },
            body: "{not json"
        });
        expect((await handleApiRequest(request, ports)).status).toBe(400);
    });

    it("refuses a blob missing fields or with a wrong shape with 422", async () => {
        const ports = portsWith({ subHash: "hash-a" });
        for (const body of [
            {},
            { ciphertext: "YQ==" },
            { ciphertext: 3, iv: "YQ==", version: 1 },
            { ciphertext: "YQ==", iv: "YQ==", version: "1" },
            { ciphertext: "", iv: "YQ==", version: 1 }
        ]) {
            const response = await handleApiRequest(requestOf("PUT", "/vault", body, AUTH), ports);
            expect(response.status, JSON.stringify(body)).toBe(422);
        }
    });

    it("refuses an oversized body with 413 before parsing it", async () => {
        const ports = portsWith({ subHash: "hash-a" });
        const huge = { ciphertext: "a".repeat(64 * 1024), iv: "YQ==", version: 1 };
        expect((await handleApiRequest(requestOf("PUT", "/vault", huge, AUTH), ports)).status).toBe(413);
    });

    it("answers 429 when the daily write quota is exhausted", async () => {
        vaults.quotaExhausted = true;
        const ports = portsWith({ subHash: "hash-a" });
        expect((await handleApiRequest(requestOf("PUT", "/vault", SEALED, AUTH), ports)).status).toBe(429);
    });
});

describe("anonymous analysis events", () => {
    const ports = () => portsWith(null); // no identity needed, ever

    it("records a full run with weight 1 and no identity requirement", async () => {
        const event = { country: "FR", positionsTaken: 33, leaders: ["fr_lfi"] };
        const response = await handleApiRequest(requestOf("POST", "/analyses", event), ports());
        expect(response.status).toBe(204);
        expect(stats.analyses.FR).toBe(1);
        expect(stats.weightSums.FR).toBeCloseTo(1, 10);
        expect(stats.partyWeights.get("fr_lfi")).toBeCloseTo(1, 10);
    });

    it("weighs an express run by its share of the corpus", async () => {
        const event = { country: "BE", positionsTaken: 15, leaders: ["be_ptb"] };
        await handleApiRequest(requestOf("POST", "/analyses", event), ports());
        expect(stats.weightSums.BE).toBeCloseTo(15 / 33, 10);
    });

    it("splits the weight among tied leaders", async () => {
        const event = { country: "BE", positionsTaken: 33, leaders: ["be_ecolo", "be_groen"] };
        await handleApiRequest(requestOf("POST", "/analyses", event), ports());
        expect(stats.partyWeights.get("be_ecolo")).toBeCloseTo(0.5, 10);
        expect(stats.partyWeights.get("be_groen")).toBeCloseTo(0.5, 10);
    });

    it("counts an analysis that produced no leader without inventing one", async () => {
        const event = { country: "FR", positionsTaken: 0, leaders: [] };
        const response = await handleApiRequest(requestOf("POST", "/analyses", event), ports());
        expect(response.status).toBe(204);
        expect(stats.analyses.FR).toBe(1);
        expect(stats.partyWeights.size).toBe(0);
    });

    it("ignores any weight the client claims: the server computes it", async () => {
        const event = { country: "FR", positionsTaken: 15, leaders: ["fr_rn"], weight: 999 };
        await handleApiRequest(requestOf("POST", "/analyses", event), ports());
        expect(stats.weightSums.FR).toBeCloseTo(15 / 33, 10);
    });

    it("refuses every malformed event with 422", async () => {
        for (const event of [
            { country: "DE", positionsTaken: 33, leaders: [] },
            { country: "FR", positionsTaken: 33, leaders: ["fr_unknown"] },
            { country: "FR", positionsTaken: 33, leaders: ["be_ptb"] }, // wrong country
            { country: "FR", positionsTaken: 33, leaders: ["fr_lfi", "fr_lfi"] }, // duplicate
            { country: "FR", positionsTaken: -1, leaders: [] },
            { country: "FR", positionsTaken: 2.5, leaders: [] },
            { country: "FR", positionsTaken: 999, leaders: [] },
            { country: "FR", positionsTaken: 33, leaders: "fr_lfi" },
            { country: "FR", positionsTaken: 33 }
        ]) {
            const response = await handleApiRequest(requestOf("POST", "/analyses", event), ports());
            expect(response.status, JSON.stringify(event)).toBe(422);
        }
        expect(stats.analyses.FR + stats.analyses.BE).toBe(0);
    });
});

describe("public statistics", () => {
    it("serves the aggregate snapshot to anyone, cacheable, CORS-open", async () => {
        await handleApiRequest(
            requestOf("POST", "/analyses", { country: "FR", positionsTaken: 33, leaders: ["fr_lfi"] }),
            portsWith(null)
        );
        const response = await handleApiRequest(
            new Request("https://api.example/stats"),
            portsWith(null)
        );
        expect(response.status).toBe(200);
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
        expect(response.headers.get("cache-control")).toContain("max-age");
        const body = await response.json();
        expect(body.totalAnalyses).toBe(1);
        expect(body.countries.FR.leaders).toEqual([{ partyId: "fr_lfi", weightSum: 1, timesLed: 1 }]);
        expect(typeof body.generatedAt).toBe("string");
    });
});

describe("edges and failure", () => {
    it("answers the preflight for an allowed origin and refuses a foreign one", async () => {
        const allowed = await handleApiRequest(
            new Request("https://api.example/vault", { method: "OPTIONS", headers: { origin: ORIGIN } }),
            portsWith(null)
        );
        expect(allowed.status).toBe(204);
        expect(allowed.headers.get("access-control-allow-origin")).toBe(ORIGIN);
        const foreign = await handleApiRequest(
            new Request("https://api.example/vault", { method: "OPTIONS", headers: { origin: "https://evil.example" } }),
            portsWith(null)
        );
        expect(foreign.headers.get("access-control-allow-origin")).toBeNull();
    });

    it("knows neither unknown routes nor unknown methods", async () => {
        expect((await handleApiRequest(requestOf("GET", "/nope"), portsWith(null))).status).toBe(404);
        expect((await handleApiRequest(requestOf("PATCH", "/vault", SEALED, AUTH), portsWith({ subHash: "h" }))).status).toBe(405);
        expect((await handleApiRequest(requestOf("PUT", "/analyses", {}), portsWith(null))).status).toBe(405);
    });

    it("fails closed on a store failure: 500, no internals leaked", async () => {
        stats.failing = true;
        const response = await handleApiRequest(
            requestOf("POST", "/analyses", { country: "FR", positionsTaken: 33, leaders: [] }),
            portsWith(null)
        );
        expect(response.status).toBe(500);
        expect(await response.text()).not.toContain("unreachable");
    });
});
