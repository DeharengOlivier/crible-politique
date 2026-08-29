import type { AnswerRecord, Country } from "@/types/positions";

// Client-side vault for a completed profile.
//
// The profile is sealed with AES-256-GCM in the browser before anything is sent
// anywhere, and opened in the browser too: the plaintext never crosses the
// network. The key comes from the API, which derives it from the Google account
// of the caller (api/src/googleIdentity.ts), so signing in is the whole
// credential and there is no second secret for a reader to keep or lose.
//
// No I/O in this module: it only transforms bytes, so it is testable without
// a network or a database.

export interface VaultKey {
    /** 256-bit AES key material. */
    raw: Uint8Array;
}

/** What is allowed to leave the browser: ciphertext and its nonce, nothing else. */
export interface SealedProfile {
    ciphertext: string; // base64
    iv: string; // base64, 96-bit GCM nonce
    version: number;
}

/** What the vault protects. Everything here is special-category data (GDPR art. 9). */
export interface VaultProfile {
    country: Country;
    college: string | null;
    answers: AnswerRecord;
    savedAt: string; // ISO 8601
}

// Version 2 since 2026-08-29: the key stopped being a locally generated secret
// written down by the reader and became a value derived from their Google
// account. A version-1 blob was sealed with a key nobody holds any more, so the
// number is what makes such a blob explicitly unreadable rather than silently
// wrong. Production held no vault at the time of the change.
export const SEALED_PROFILE_VERSION = 2;

export async function encryptProfile(profile: VaultProfile, key: VaultKey): Promise<SealedProfile> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipherBytes = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        await aesKeyOf(key),
        new TextEncoder().encode(JSON.stringify(profile))
    );
    return {
        ciphertext: toBase64(new Uint8Array(cipherBytes)),
        iv: toBase64(iv),
        version: SEALED_PROFILE_VERSION
    };
}

/**
 * Returns null for anything that is not an intact profile sealed with this
 * exact key: wrong key, tampered bytes (GCM authenticates), malformed base64,
 * or a decrypted payload that is not a profile. A vault is untrusted input.
 */
export async function decryptProfile(sealed: SealedProfile, key: VaultKey): Promise<VaultProfile | null> {
    try {
        const plainBytes = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: fromBase64(sealed.iv) },
            await aesKeyOf(key),
            fromBase64(sealed.ciphertext)
        );
        const parsed: unknown = JSON.parse(new TextDecoder().decode(plainBytes));
        return isVaultProfile(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function isVaultProfile(candidate: unknown): candidate is VaultProfile {
    if (typeof candidate !== "object" || candidate === null) return false;
    const fields = candidate as Record<string, unknown>;
    if (fields.country !== "FR" && fields.country !== "BE") return false;
    if (fields.college !== null && typeof fields.college !== "string") return false;
    if (typeof fields.savedAt !== "string") return false;
    const answers = fields.answers;
    if (typeof answers !== "object" || answers === null || Array.isArray(answers)) return false;
    return Object.values(answers).every(
        (value) => value === null || value === -2 || value === -1 || value === 0 || value === 1 || value === 2
    );
}

async function aesKeyOf(key: VaultKey): Promise<CryptoKey> {
    return crypto.subtle.importKey("raw", key.raw as BufferSource, "AES-GCM", false, [
        "encrypt",
        "decrypt"
    ]);
}

function toBase64(bytes: Uint8Array): string {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}

function fromBase64(encoded: string): Uint8Array<ArrayBuffer> {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
}
