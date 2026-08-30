// Who is signed in, as far as this browser needs to show it.
//
// The Google ID token is a bearer credential for the vault API: it is used in
// the request that needs it and then dropped, never written to storage, so an
// injected script has nothing to steal from disk. What is kept here is the
// display identity alone (name, picture URL), because a reader checks they are
// connected by seeing their own face, and that costs no credential.
//
// The token's signature is verified server-side, in api/src/googleIdentity.ts.
// Reading the payload here is a display convenience and never a security
// decision: at worst a reader shows themselves a name they forged.

export const GOOGLE_IDENTITY_STORAGE_KEY = 'crible_google_identity_v1';

export interface GoogleDisplayIdentity {
    name: string;
    picture: string | null;
}

function decodeBase64Url(segment: string): string | null {
    try {
        const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
        const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        return new TextDecoder().decode(bytes);
    } catch {
        return null;
    }
}

/**
 * The display claims of a Google ID token, or null when there is nothing
 * displayable in it. O(size of the token).
 */
export function claimsFromIdToken(idToken: string): GoogleDisplayIdentity | null {
    const segments = idToken.split('.');
    if (segments.length !== 3) return null;
    const json = decodeBase64Url(segments[1]);
    if (json === null) return null;
    let payload: unknown;
    try {
        payload = JSON.parse(json);
    } catch {
        return null;
    }
    if (typeof payload !== 'object' || payload === null) return null;
    const claims = payload as Record<string, unknown>;
    const name = typeof claims.name === 'string' && claims.name.length > 0 ? claims.name : null;
    const picture =
        typeof claims.picture === 'string' && claims.picture.startsWith('https://')
            ? claims.picture
            : null;
    if (name === null && picture === null) return null;
    return { name: name ?? 'Mon compte Google', picture };
}

// The ID token of the current sign-in, in memory only.
//
// It is a bearer credential for the vault API, so it is never written to
// localStorage or sessionStorage: a reload loses it, and the reader signs in
// again from the bubble. That is the cost of not leaving a credential on disk,
// and it is the whole reason there is exactly one place to sign in: the token
// obtained there is the one every other screen uses.
let idTokenInMemory: string | null = null;

export function rememberIdToken(idToken: string): void {
    idTokenInMemory = idToken;
}

export function currentIdToken(): string | null {
    return idTokenInMemory;
}

const listeners = new Set<() => void>();

function notify(): void {
    for (const listener of listeners) listener();
}

/** Subscribes to sign-in and sign-out, in this tab and in the others. */
export function subscribeToGoogleIdentity(listener: () => void): () => void {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === GOOGLE_IDENTITY_STORAGE_KEY) listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
    };
}

/** The raw stored value, whose identity only changes when the identity does. */
export function rawGoogleIdentity(): string | null {
    try {
        return localStorage.getItem(GOOGLE_IDENTITY_STORAGE_KEY);
    } catch {
        return null;
    }
}

export function loadGoogleIdentity(): GoogleDisplayIdentity | null {
    const raw = rawGoogleIdentity();
    if (raw === null) return null;
    try {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return null;
        const stored = parsed as Record<string, unknown>;
        if (typeof stored.name !== 'string') return null;
        return {
            name: stored.name,
            picture: typeof stored.picture === 'string' ? stored.picture : null
        };
    } catch {
        return null;
    }
}

export function saveGoogleIdentity(identity: GoogleDisplayIdentity): void {
    try {
        localStorage.setItem(GOOGLE_IDENTITY_STORAGE_KEY, JSON.stringify(identity));
    } catch {
        // A browser refusing storage still gets the signed-in state in memory.
    }
    notify();
}

export function forgetGoogleIdentity(): void {
    idTokenInMemory = null;
    try {
        localStorage.removeItem(GOOGLE_IDENTITY_STORAGE_KEY);
    } catch {
        // Nothing to forget if nothing could be written.
    }
    notify();
}
