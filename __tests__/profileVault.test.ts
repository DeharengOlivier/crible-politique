import { describe, expect, it } from "vitest";
import { encryptProfile, decryptProfile } from "@/lib/profileVault";
import type { VaultKey, VaultProfile } from "@/lib/profileVault";

// The encrypted vault: what leaves the browser is ciphertext only, and the
// plaintext never does. These tests are the proof the claims on the site rest
// on.
//
// Since 2026-08-29 the key is no longer generated here and written down by the
// reader: it is derived from their Google account by the API
// (api/src/googleIdentity.ts, and __tests__/vaultKeyFromGoogle.test.ts for what
// that guarantees). This module only seals and opens, so a key is just 32
// bytes to it.

/** A key of this shape is what the API answers, byte for byte. */
function keyOf(fill: number): VaultKey {
    return { raw: new Uint8Array(32).fill(fill) };
}

const PROFILE: VaultProfile = {
    country: "FR",
    college: null,
    answers: { pw1: 2, ge7: -2, ec1: null },
    savedAt: "2026-08-29T23:00:00.000Z"
};

describe("encryption", () => {
    it("round-trips a profile", async () => {
        const key = keyOf(1);
        const sealed = await encryptProfile(PROFILE, key);
        const opened = await decryptProfile(sealed, key);
        expect(opened).toEqual(PROFILE);
    });

    it("produces ciphertext that reveals nothing readable", async () => {
        const key = keyOf(1);
        const sealed = await encryptProfile(PROFILE, key);
        const blob = Buffer.from(sealed.ciphertext, "base64").toString("latin1");
        for (const fragment of ["pw1", "answers", "country", "savedAt"]) {
            expect(blob).not.toContain(fragment);
        }
    });

    it("never encrypts twice to the same bytes, even the same profile", async () => {
        const key = keyOf(1);
        const a = await encryptProfile(PROFILE, key);
        const b = await encryptProfile(PROFILE, key);
        expect(a.ciphertext).not.toBe(b.ciphertext);
        expect(a.iv).not.toBe(b.iv);
    });

    it("refuses to open with the wrong key", async () => {
        const sealed = await encryptProfile(PROFILE, keyOf(1));
        const wrong = keyOf(2);
        await expect(decryptProfile(sealed, wrong)).resolves.toBeNull();
    });

    it("refuses a tampered ciphertext, GCM being authenticated", async () => {
        const key = keyOf(1);
        const sealed = await encryptProfile(PROFILE, key);
        const bytes = Buffer.from(sealed.ciphertext, "base64");
        bytes[Math.floor(bytes.length / 2)] ^= 0xff;
        const tampered = { ...sealed, ciphertext: bytes.toString("base64") };
        await expect(decryptProfile(tampered, key)).resolves.toBeNull();
    });

    it("refuses a garbage blob rather than throwing", async () => {
        const key = keyOf(1);
        await expect(
            decryptProfile({ ciphertext: "not base64!!!", iv: "xx", version: 1 }, key)
        ).resolves.toBeNull();
    });

    it("refuses a sealed profile whose decrypted shape is not a profile", async () => {
        // A vault written by a future or corrupted client must not crash the
        // reader; the boundary validates like any untrusted input.
        const key = keyOf(1);
        const encoder = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const cryptoKey = await crypto.subtle.importKey("raw", key.raw as BufferSource, "AES-GCM", false, ["encrypt"]);
        const ciphertext = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            cryptoKey,
            encoder.encode(JSON.stringify({ not: "a profile" }))
        );
        const sealed = {
            ciphertext: Buffer.from(new Uint8Array(ciphertext)).toString("base64"),
            iv: Buffer.from(iv).toString("base64"),
            version: 1
        };
        await expect(decryptProfile(sealed, key)).resolves.toBeNull();
    });
});
