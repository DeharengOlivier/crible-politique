import { createRemoteJWKSet, jwtVerify } from "jose";
import type { JWTVerifyGetKey } from "jose";
import type { IdentityVerifier } from "./ports";

// "Sign in with Google" hands the browser an ID token; this is the only place
// that decides whether to believe it. jose verifies the RS256 signature
// against Google's published JWKS (cached per isolate), and the audience and
// issuer checks pin the token to this exact application, so a token minted
// for any other Google client is refused.
//
// What comes out is deliberately not the Google subject but its peppered
// SHA-256: handlers and the database only ever see the hash, so a database
// dump alone names nobody. The pepper is a server secret; rotating it orphans
// every vault, which is documented in api/README.md.

const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
// Google historically emits both spellings of its issuer.
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export function googleIdentityVerifier(
    clientId: string,
    subjectPepper: string,
    resolveKey: JWTVerifyGetKey = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL))
): IdentityVerifier {
    return async (authorization) => {
        if (authorization === null || !authorization.startsWith("Bearer ")) return null;
        const token = authorization.slice("Bearer ".length);
        if (token.length === 0) return null;
        try {
            const { payload } = await jwtVerify(token, resolveKey, {
                issuer: GOOGLE_ISSUERS,
                audience: clientId
            });
            if (typeof payload.sub !== "string" || payload.sub.length === 0) return null;
            return { subHash: await sha256Hex(`${subjectPepper}:${payload.sub}`) };
        } catch {
            return null; // fail closed: any verification defect is a refusal
        }
    };
}

async function sha256Hex(text: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
