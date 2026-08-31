import { beforeAll, describe, expect, it } from "vitest";
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from "jose";
import type { JWTVerifyGetKey } from "jose";
import { googleIdentityVerifier } from "../api/src/googleIdentity";
import { handleApiRequest } from "../api/src/handlers";
import type { ApiPorts, StoredVault, VaultStore, VaultWriteOutcome } from "../api/src/ports";

// Since 2026-08-29 the vault key comes from the Google account instead of a
// recovery code the reader had to keep. Signing in is the whole credential, on
// any device, and there is nothing else to lose.
//
// What that costs is stated rather than hidden: the server derives the key from
// the Google subject, so it could compute it. What it must never do is store
// it, or let it be derivable from the database alone. Two separate peppers keep
// those apart: the one that names the row and the one that opens it. A dump of
// the database, even with a known Google account id, opens nothing.

const CLIENT_ID = "12345.apps.googleusercontent.com";
const SUBJECT_PEPPER = "pepper-for-the-row-name";
const KEY_PEPPER = "pepper-for-the-key";
const ORIGIN = "https://crible.eu";

let jwks: JWTVerifyGetKey;
let signingKey: CryptoKey;

beforeAll(async () => {
    const pair = await generateKeyPair("RS256", { extractable: true });
    signingKey = pair.privateKey as CryptoKey;
    jwks = createLocalJWKSet({ keys: [{ ...(await exportJWK(pair.publicKey)), alg: "RS256" }] });
});

function googleToken(subject = "google-sub-1"): Promise<string> {
    return new SignJWT({})
        .setProtectedHeader({ alg: "RS256" })
        .setIssuer("https://accounts.google.com")
        .setAudience(CLIENT_ID)
        .setSubject(subject)
        .setIssuedAt("-2h")
        .setExpirationTime("1h")
        .sign(signingKey);
}

const verifier = (subjectPepper = SUBJECT_PEPPER, keyPepper = KEY_PEPPER) =>
    googleIdentityVerifier(CLIENT_ID, subjectPepper, keyPepper, jwks);

describe("the key the Google account yields", () => {
    it("is a 256-bit key, deterministic for one account", async () => {
        const token = await googleToken();
        const first = await verifier()(`Bearer ${token}`);
        const second = await verifier()(`Bearer ${token}`);

        expect(first?.vaultKey).toBe(second?.vaultKey);
        expect(Uint8Array.from(atob(first!.vaultKey), (c) => c.charCodeAt(0))).toHaveLength(32);
    });

    it("is never the value the database stores", async () => {
        const identity = await verifier()(`Bearer ${await googleToken()}`);
        expect(identity?.vaultKey).not.toBe(identity?.subHash);
    });

    it("cannot be derived from the row name, whoever holds the Google account id", async () => {
        // The threat this answers: a stolen database plus a known Google
        // account id. The two values come from separate secrets, so the dump
        // opens nothing without the second one.
        const token = await googleToken();
        const real = await verifier()(`Bearer ${token}`);
        const withOtherKeyPepper = await verifier(SUBJECT_PEPPER, "another-key-pepper")(
            `Bearer ${token}`
        );

        expect(withOtherKeyPepper?.subHash).toBe(real?.subHash);
        expect(withOtherKeyPepper?.vaultKey).not.toBe(real?.vaultKey);
    });

    it("differs from one account to another", async () => {
        const mine = await verifier()(`Bearer ${await googleToken("google-sub-1")}`);
        const theirs = await verifier()(`Bearer ${await googleToken("google-sub-2")}`);
        expect(mine?.vaultKey).not.toBe(theirs?.vaultKey);
    });
});

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

function ports(overrides: Partial<ApiPorts> = {}): ApiPorts {
    return {
        verifyIdentity: verifier(),
        vaults: new MemoryVaultStore(),
        // Wide open: this file is about what the verifier derives, not about
        // the bounds around it (apiAbuseBounds.test.ts).
        rateLimiter: { allow: async () => true },
        outcomes: null,
        stats: {
            recordAnalysis: async () => {},
            snapshot: async () => ({
                totalAnalyses: 0,
                countries: {
                    FR: { analyses: 0, weightSum: 0, leaders: [] },
                    BE: { analyses: 0, weightSum: 0, leaders: [] }
                }
            })
        },
        partyIdsOf: () => new Set<string>(),
        allowedOrigins: new Set([ORIGIN]),
        now: () => new Date("2026-08-29T12:00:00.000Z"),
        ...overrides
    };
}

function keyRequest(authorization?: string): Request {
    return new Request("https://api.crible.eu/vault/key", {
        headers: {
            origin: ORIGIN,
            ...(authorization === undefined ? {} : { authorization })
        }
    });
}

describe("GET /vault/key", () => {
    it("hands the key to the account that owns it", async () => {
        const response = await handleApiRequest(
            keyRequest(`Bearer ${await googleToken()}`),
            ports()
        );
        expect(response.status).toBe(200);
        const body = (await response.json()) as { key: string };
        const identity = await verifier()(`Bearer ${await googleToken()}`);
        expect(body.key).toBe(identity?.vaultKey);
    });

    it.each([
        ["no authorization at all", undefined],
        ["a token that is not one", "Bearer not-a-jwt"],
        ["an empty bearer", "Bearer "]
    ])("refuses %s", async (_case, authorization) => {
        const response = await handleApiRequest(keyRequest(authorization), ports());
        expect(response.status).toBe(401);
        expect(await response.text()).toBe("");
    });

    it("is the only method it answers", async () => {
        const request = new Request("https://api.crible.eu/vault/key", {
            method: "PUT",
            headers: { origin: ORIGIN, authorization: `Bearer ${await googleToken()}` }
        });
        expect((await handleApiRequest(request, ports())).status).toBe(405);
    });

    it("never lets the key reach a store", async () => {
        // The key is answered, never written: a vault row holds ciphertext and
        // nothing that opens it.
        const store = new MemoryVaultStore();
        const token = await googleToken();
        await handleApiRequest(keyRequest(`Bearer ${token}`), ports({ vaults: store }));

        const identity = await verifier()(`Bearer ${token}`);
        await store.upsert(identity!.subHash, { ciphertext: "c", iv: "i", version: 2 }, "now");
        const stored = JSON.stringify([...store.vaults.entries()]);
        expect(stored).not.toContain(identity!.vaultKey);
    });
});

describe("a Worker whose key pepper was never set", () => {
    it("refuses rather than deriving keys from an empty secret", async () => {
        // Fail closed. A missing binding would otherwise pepper every key with
        // the empty string, which is a weak secret that looks like a working
        // deployment: vaults would save, restore, and be openable by anyone who
        // guessed the scheme and knew a Google account id.
        const identity = await googleIdentityVerifier(CLIENT_ID, SUBJECT_PEPPER, "", jwks)(
            `Bearer ${await googleToken()}`
        );
        expect(identity).toBeNull();
    });

    it.each([undefined, null, "   "])("treats %p as never set", async (pepper) => {
        const identity = await googleIdentityVerifier(
            CLIENT_ID,
            SUBJECT_PEPPER,
            pepper as unknown as string,
            jwks
        )(`Bearer ${await googleToken()}`);
        expect(identity).toBeNull();
    });

    it("refuses the subject pepper just as firmly", async () => {
        const identity = await googleIdentityVerifier(CLIENT_ID, "", KEY_PEPPER, jwks)(
            `Bearer ${await googleToken()}`
        );
        expect(identity).toBeNull();
    });
});
