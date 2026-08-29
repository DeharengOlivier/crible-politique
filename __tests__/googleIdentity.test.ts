import { beforeAll, describe, expect, it } from "vitest";
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from "jose";
import type { JWTVerifyGetKey } from "jose";
import { googleIdentityVerifier } from "../api/src/googleIdentity";

// The verifier is the whole authentication layer: whatever it accepts owns a
// vault. So the battery is written from the attacker's side: wrong audience,
// wrong issuer, expired token, forged signature, missing subject.

const CLIENT_ID = "12345.apps.googleusercontent.com";
const PEPPER = "test-pepper";

let jwks: JWTVerifyGetKey;
let signingKey: CryptoKey;
let foreignKey: CryptoKey;

beforeAll(async () => {
    const pair = await generateKeyPair("RS256", { extractable: true });
    signingKey = pair.privateKey as CryptoKey;
    jwks = createLocalJWKSet({ keys: [{ ...(await exportJWK(pair.publicKey)), alg: "RS256" }] });
    const foreignPair = await generateKeyPair("RS256", { extractable: true });
    foreignKey = foreignPair.privateKey as CryptoKey;
});

function googleToken(overrides: {
    audience?: string;
    issuer?: string;
    subject?: string | null;
    expiresIn?: string;
    key?: CryptoKey;
} = {}): Promise<string> {
    const jwt = new SignJWT({})
        .setProtectedHeader({ alg: "RS256" })
        .setIssuer(overrides.issuer ?? "https://accounts.google.com")
        .setAudience(overrides.audience ?? CLIENT_ID)
        .setIssuedAt("-2h")
        .setExpirationTime(overrides.expiresIn ?? "1h");
    if (overrides.subject !== null) jwt.setSubject(overrides.subject ?? "google-sub-1");
    return jwt.sign(overrides.key ?? signingKey);
}

function verifier(pepper: string = PEPPER) {
    return googleIdentityVerifier(CLIENT_ID, pepper, jwks);
}

describe("what the verifier accepts", () => {
    it("yields a stable peppered hash for a valid token, never the raw subject", async () => {
        const token = await googleToken();
        const first = await verifier()(`Bearer ${token}`);
        const second = await verifier()(`Bearer ${await googleToken()}`);
        expect(first).not.toBeNull();
        expect(first!.subHash).toMatch(/^[0-9a-f]{64}$/);
        expect(first!.subHash).not.toContain("google-sub-1");
        expect(second!.subHash).toBe(first!.subHash);
    });

    it("separates identities: another subject or another pepper, another hash", async () => {
        const same = await verifier()(`Bearer ${await googleToken()}`);
        const otherSubject = await verifier()(`Bearer ${await googleToken({ subject: "google-sub-2" })}`);
        const otherPepper = await verifier("other-pepper")(`Bearer ${await googleToken()}`);
        expect(otherSubject!.subHash).not.toBe(same!.subHash);
        expect(otherPepper!.subHash).not.toBe(same!.subHash);
    });

    it("accepts the bare 'accounts.google.com' issuer Google also emits", async () => {
        const token = await googleToken({ issuer: "accounts.google.com" });
        expect(await verifier()(`Bearer ${token}`)).not.toBeNull();
    });
});

describe("what the verifier refuses", () => {
    it("refuses an absent or malformed Authorization header", async () => {
        expect(await verifier()(null)).toBeNull();
        expect(await verifier()("")).toBeNull();
        expect(await verifier()("Basic abc")).toBeNull();
        expect(await verifier()("Bearer ")).toBeNull();
        expect(await verifier()("Bearer not-a-jwt")).toBeNull();
    });

    it("refuses a token minted for another application", async () => {
        const token = await googleToken({ audience: "other-app.apps.googleusercontent.com" });
        expect(await verifier()(`Bearer ${token}`)).toBeNull();
    });

    it("refuses a token from another issuer", async () => {
        const token = await googleToken({ issuer: "https://evil.example" });
        expect(await verifier()(`Bearer ${token}`)).toBeNull();
    });

    it("refuses an expired token", async () => {
        const token = await googleToken({ expiresIn: "-1h" });
        expect(await verifier()(`Bearer ${token}`)).toBeNull();
    });

    it("refuses a signature from a key outside the JWKS", async () => {
        const token = await googleToken({ key: foreignKey });
        expect(await verifier()(`Bearer ${token}`)).toBeNull();
    });

    it("refuses a token without a subject", async () => {
        const token = await googleToken({ subject: null });
        expect(await verifier()(`Bearer ${token}`)).toBeNull();
    });
});
