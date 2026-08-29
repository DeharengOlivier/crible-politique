import { describe, expect, it } from "vitest";
import {
    generateVaultKey,
    recoveryCodeFromKey,
    keyFromRecoveryCode,
    encryptProfile,
    decryptProfile,
    RECOVERY_CODE_LENGTH
} from "@/lib/profileVault";
import type { VaultProfile } from "@/lib/profileVault";

// The encrypted vault: what leaves the browser is ciphertext only, and the
// key never does. These tests are the proof the claims on the site rest on.

const PROFILE: VaultProfile = {
    country: "FR",
    college: null,
    answers: { pw1: 2, ge7: -2, ec1: null },
    savedAt: "2026-08-29T23:00:00.000Z"
};

describe("the vault key", () => {
    it("is 256 bits and never the same twice", async () => {
        const a = await generateVaultKey();
        const b = await generateVaultKey();
        expect(a.raw).toHaveLength(32);
        expect(Buffer.from(a.raw).equals(Buffer.from(b.raw))).toBe(false);
    });

    it("round-trips through the recovery code", async () => {
        const key = await generateVaultKey();
        const code = recoveryCodeFromKey(key);
        const restored = keyFromRecoveryCode(code);
        expect(restored).not.toBeNull();
        expect(Buffer.from(restored!.raw).equals(Buffer.from(key.raw))).toBe(true);
    });

    it("writes the recovery code in grouped, unambiguous characters", async () => {
        const code = recoveryCodeFromKey(await generateVaultKey());
        expect(code).toHaveLength(RECOVERY_CODE_LENGTH);
        // Crockford-style alphabet: no i, l, o, u, so a hand-copied code
        // cannot be wrong because of a font.
        expect(code).toMatch(/^[0-9a-hjkmnp-tv-z]+(-[0-9a-hjkmnp-tv-z]+)*$/);
    });

    it("rejects a mistyped recovery code rather than deriving a wrong key", async () => {
        const code = recoveryCodeFromKey(await generateVaultKey());
        const mangled = code.slice(0, -1) + (code.endsWith("2") ? "3" : "2");
        expect(keyFromRecoveryCode(mangled)).toBeNull();
        expect(keyFromRecoveryCode("")).toBeNull();
        expect(keyFromRecoveryCode("not-a-code")).toBeNull();
        expect(keyFromRecoveryCode(code.slice(1))).toBeNull();
    });
});

describe("encryption", () => {
    it("round-trips a profile", async () => {
        const key = await generateVaultKey();
        const sealed = await encryptProfile(PROFILE, key);
        const opened = await decryptProfile(sealed, key);
        expect(opened).toEqual(PROFILE);
    });

    it("produces ciphertext that reveals nothing readable", async () => {
        const key = await generateVaultKey();
        const sealed = await encryptProfile(PROFILE, key);
        const blob = Buffer.from(sealed.ciphertext, "base64").toString("latin1");
        for (const fragment of ["pw1", "answers", "country", "savedAt"]) {
            expect(blob).not.toContain(fragment);
        }
    });

    it("never encrypts twice to the same bytes, even the same profile", async () => {
        const key = await generateVaultKey();
        const a = await encryptProfile(PROFILE, key);
        const b = await encryptProfile(PROFILE, key);
        expect(a.ciphertext).not.toBe(b.ciphertext);
        expect(a.iv).not.toBe(b.iv);
    });

    it("refuses to open with the wrong key", async () => {
        const sealed = await encryptProfile(PROFILE, await generateVaultKey());
        const wrong = await generateVaultKey();
        await expect(decryptProfile(sealed, wrong)).resolves.toBeNull();
    });

    it("refuses a tampered ciphertext, GCM being authenticated", async () => {
        const key = await generateVaultKey();
        const sealed = await encryptProfile(PROFILE, key);
        const bytes = Buffer.from(sealed.ciphertext, "base64");
        bytes[Math.floor(bytes.length / 2)] ^= 0xff;
        const tampered = { ...sealed, ciphertext: bytes.toString("base64") };
        await expect(decryptProfile(tampered, key)).resolves.toBeNull();
    });

    it("refuses a garbage blob rather than throwing", async () => {
        const key = await generateVaultKey();
        await expect(
            decryptProfile({ ciphertext: "not base64!!!", iv: "xx", version: 1 }, key)
        ).resolves.toBeNull();
    });

    it("refuses a sealed profile whose decrypted shape is not a profile", async () => {
        // A vault written by a future or corrupted client must not crash the
        // reader; the boundary validates like any untrusted input.
        const key = await generateVaultKey();
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
