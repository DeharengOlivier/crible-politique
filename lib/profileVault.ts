import type { AnswerRecord, Country } from "@/types/positions";

// Client-side vault for a completed profile.
//
// The profile is encrypted in the browser with AES-256-GCM before anything is
// sent anywhere. The key is generated locally, kept in the browser and shown
// once to the user as a recovery code; it is never transmitted. The server
// stores the sealed blob and can prove nothing about its content, which is the
// property the site advertises.
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

export const SEALED_PROFILE_VERSION = 1;

// Crockford-style base32, lowercase, without i/l/o/u so no character can be
// misread for another whatever the font. Same family as lib/profileCode.ts.
const RECOVERY_ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";
const KEY_BYTES = 32;
const DATA_CHARS = 52; // ceil(256 / 5)
const CHECK_CHARS = 2; // plain sum + position-weighted sum, both mod 32
const GROUP_SIZE = 6;
/** Length of a formatted recovery code, dashes included: 9 groups of 6. */
export const RECOVERY_CODE_LENGTH =
    DATA_CHARS + CHECK_CHARS + (DATA_CHARS + CHECK_CHARS) / GROUP_SIZE - 1;

export function generateVaultKey(): VaultKey {
    const raw = new Uint8Array(KEY_BYTES);
    crypto.getRandomValues(raw);
    return { raw };
}

/**
 * The recovery code is the key itself, written for a human hand: grouped,
 * unambiguous alphabet, two check characters. The plain sum catches every
 * single-character substitution; the weighted sum catches every adjacent swap.
 */
export function recoveryCodeFromKey(key: VaultKey): string {
    const encoded = base32Encode(key.raw);
    const grouped = (encoded + checkCharsOf(encoded)).match(/.{1,6}/g);
    return (grouped as string[]).join("-");
}

/** Returns null on any defect (length, alphabet, checksum) rather than a wrong key. */
export function keyFromRecoveryCode(code: string): VaultKey | null {
    const compact = code.trim().toLowerCase().replace(/-/g, "");
    if (compact.length !== DATA_CHARS + CHECK_CHARS) return null;
    for (const char of compact) {
        if (!RECOVERY_ALPHABET.includes(char)) return null;
    }
    const encoded = compact.slice(0, DATA_CHARS);
    if (checkCharsOf(encoded) !== compact.slice(DATA_CHARS)) return null;
    return base32Decode(encoded);
}

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

function checkCharsOf(encoded: string): string {
    let plainSum = 0;
    let weightedSum = 0;
    for (let index = 0; index < encoded.length; index += 1) {
        const value = RECOVERY_ALPHABET.indexOf(encoded[index]);
        plainSum = (plainSum + value) % 32;
        weightedSum = (weightedSum + (index + 1) * value) % 32;
    }
    return RECOVERY_ALPHABET[plainSum] + RECOVERY_ALPHABET[weightedSum];
}

// O(n) bit-buffer base32; 256 bits become 52 chars, the last carrying 4 zero
// padding bits, which decode verifies so a truncated code cannot round-trip.
function base32Encode(bytes: Uint8Array): string {
    let buffer = 0;
    let bitCount = 0;
    let out = "";
    for (const byte of bytes) {
        buffer = (buffer << 8) | byte;
        bitCount += 8;
        while (bitCount >= 5) {
            out += RECOVERY_ALPHABET[(buffer >> (bitCount - 5)) & 31];
            bitCount -= 5;
        }
    }
    if (bitCount > 0) {
        out += RECOVERY_ALPHABET[(buffer << (5 - bitCount)) & 31];
    }
    return out;
}

function base32Decode(encoded: string): VaultKey | null {
    const raw = new Uint8Array(KEY_BYTES);
    let buffer = 0;
    let bitCount = 0;
    let byteIndex = 0;
    for (const char of encoded) {
        buffer = (buffer << 5) | RECOVERY_ALPHABET.indexOf(char);
        bitCount += 5;
        if (bitCount >= 8) {
            raw[byteIndex] = (buffer >> (bitCount - 8)) & 0xff;
            byteIndex += 1;
            bitCount -= 8;
        }
    }
    const paddingBits = buffer & ((1 << bitCount) - 1);
    if (byteIndex !== KEY_BYTES || paddingBits !== 0) return null;
    return { raw };
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
