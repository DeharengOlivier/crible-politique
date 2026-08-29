import { createRemoteJWKSet, jwtVerify } from "jose";
import type { JWTVerifyGetKey } from "jose";
import type { IdentityVerifier } from "./ports";

// "Sign in with Google" hands the browser an ID token; this is the only place
// that decides whether to believe it. jose verifies the RS256 signature
// against Google's published JWKS (cached per isolate), and the audience and
// issuer checks pin the token to this exact application, so a token minted
// for any other Google client is refused.
//
// What comes out is deliberately not the Google subject but two values derived
// from it: the peppered SHA-256 that names the row, and the key that opens it.
// Handlers and the database only ever see the first, so a database dump alone
// names nobody, and the second is answered to the browser and forgotten.
//
// The two peppers are separate secrets and must stay separate: with a single
// one, whoever held the database would hold the key to every row in it. Both
// are server secrets, and rotating either orphans every vault (the first loses
// the rows, the second loses the ability to open them), which is documented in
// api/README.md.

const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
// Google historically emits both spellings of its issuer.
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export function googleIdentityVerifier(
    clientId: string,
    subjectPepper: string,
    keyPepper: string,
    resolveKey: JWTVerifyGetKey = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL))
): IdentityVerifier {
    // Fail closed on a deployment that forgot a secret. An unset binding would
    // otherwise pepper every hash and every key with the empty string, which
    // looks like a working deployment while being no secret at all.
    const configured = subjectPepper?.trim().length > 0 && keyPepper?.trim().length > 0;

    return async (authorization) => {
        if (!configured) return null;
        if (authorization === null || !authorization.startsWith("Bearer ")) return null;
        const token = authorization.slice("Bearer ".length);
        if (token.length === 0) return null;
        try {
            const { payload } = await jwtVerify(token, resolveKey, {
                issuer: GOOGLE_ISSUERS,
                audience: clientId
            });
            if (typeof payload.sub !== "string" || payload.sub.length === 0) return null;
            return {
                subHash: await sha256Hex(`${subjectPepper}:${payload.sub}`),
                vaultKey: await sha256Base64(`${keyPepper}:vault-key:${payload.sub}`)
            };
        } catch {
            return null; // fail closed: any verification defect is a refusal
        }
    };
}

/** The key material, in the form the browser feeds to AES-256-GCM. */
async function sha256Base64(text: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return btoa(String.fromCharCode(...new Uint8Array(digest)));
}

async function sha256Hex(text: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
