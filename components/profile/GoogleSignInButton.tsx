'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { LogIn } from 'lucide-react';
import { googleClientId } from '@/lib/optionalFeatures';

// The official "Sign in with Google" button (Google Identity Services).
// Google's script draws it and hands back a signed ID token; nothing else of
// the Google session enters the app. The token is only ever forwarded to our
// own API as a Bearer header, where its signature is verified.
//
// Google is contacted only once the reader asks for it (2026-08-31). Loading
// their script on mount announced every visitor to Google, through the referer
// of a request the visitor never made, on a site about their own politics.
// Measured on the live home page: two requests to accounts.google.com before a
// single click. So this component draws a control of its own first and fetches
// Google's script when that control is pressed, which is the moment the reader
// decided to involve Google. What they press next is Google's own button, as
// their branding rules require.

const GSI_SRC = 'https://accounts.google.com/gsi/client';

interface GoogleCredentialResponse {
    credential: string;
}

interface GoogleAccountsId {
    initialize(config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
    }): void;
    renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
}

declare global {
    interface Window {
        google?: { accounts: { id: GoogleAccountsId } };
    }
}

/**
 * The script tag itself is the record of whether Google has been contacted.
 * A module-level flag would be a second copy of that fact, and the two drift:
 * the document is what the reader can inspect in their own network panel, so
 * it is what the component reads.
 */
function existingScript(): HTMLScriptElement | null {
    return document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
}

// The document read as an external store, so a button mounting after Google
// has already been fetched draws straight away instead of asking for a second
// press: the request this component exists to avoid has already left. The
// server snapshot is false, which is what makes the prerendered markup and the
// browser's first render agree.
const scriptListeners = new Set<() => void>();

function subscribeToGsiScript(onChange: () => void): () => void {
    scriptListeners.add(onChange);
    return () => {
        scriptListeners.delete(onChange);
    };
}

function gsiScriptPresent(): boolean {
    return existingScript() !== null;
}

function announceScriptChange(): void {
    for (const listener of scriptListeners) listener();
}

/** Resolves when the Google script is loaded, fetching it at most once per page. */
function loadGsiScript(): Promise<void> {
    const already = existingScript();
    if (already !== null) {
        // Loaded by an earlier press, or still in flight for a sibling button.
        if (window.google !== undefined) return Promise.resolve();
        return new Promise((resolve, reject) => {
            already.addEventListener('load', () => resolve());
            already.addEventListener('error', () => reject(new Error('Google Identity script failed to load')));
        });
    }
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = GSI_SRC;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
            // Leave no tag behind, so a later press is a genuine retry rather
            // than a wait on a request that already failed.
            script.remove();
            announceScriptChange();
            reject(new Error('Google Identity script failed to load'));
        };
        document.head.appendChild(script);
        announceScriptChange();
    });
}

interface GoogleSignInButtonProps {
    onIdToken: (idToken: string) => void;
    /**
     * "icon" draws Google's own icon-sized button, for the account corner
     * where a 200-pixel bar would cover the page title on a phone. Google's
     * branding rules forbid drawing our own, so the size is asked of theirs.
     */
    variant?: 'standard' | 'icon';
}

export default function GoogleSignInButton({ onIdToken, variant = 'standard' }: GoogleSignInButtonProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    // The callback identity changes on every parent render; the ref keeps the
    // one Google holds pointing at the latest without re-initializing.
    const onIdTokenRef = useRef(onIdToken);
    useEffect(() => {
        onIdTokenRef.current = onIdToken;
    });

    // 0 means this button has not asked for Google. Every press increments, so
    // a retry after a failure re-runs the effect below instead of resting on a
    // value that did not change.
    const [attempt, setAttempt] = useState(0);
    const [failed, setFailed] = useState(false);
    const scriptPresent = useSyncExternalStore(subscribeToGsiScript, gsiScriptPresent, () => false);
    const requested = attempt > 0 || scriptPresent;

    useEffect(() => {
        if (!requested) return;
        const clientId = googleClientId();
        if (clientId === null) return;
        let disposed = false;
        loadGsiScript()
            .then(() => {
                if (disposed || containerRef.current === null || window.google === undefined) return;
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: (response) => onIdTokenRef.current(response.credential)
                });
                window.google.accounts.id.renderButton(
                    containerRef.current,
                    variant === 'icon'
                        ? { type: 'icon', shape: 'circle', theme: 'outline', size: 'large', locale: 'fr' }
                        : { theme: 'outline', size: 'large', text: 'continue_with', locale: 'fr' }
                );
            })
            .catch(() => {
                if (!disposed) setFailed(true);
            });
        return () => {
            disposed = true;
        };
        // attempt is in the list so a retry after a failure re-runs this: the
        // press that follows one leaves `requested` already true.
    }, [requested, attempt, variant]);

    if (requested && !failed) {
        // Google's own button is drawn in here. Ours is gone, so the reader is
        // never offered two sign-in controls side by side.
        return <div ref={containerRef} className="flex min-h-[44px] items-center justify-center" />;
    }

    const label = failed
        ? 'Google est injoignable. Réessayer de se connecter avec Google'
        : "Se connecter avec Google. Google n'est contacté qu'à partir de ce clic";

    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={() => {
                setFailed(false);
                setAttempt((count) => count + 1);
            }}
            className={
                variant === 'icon'
                    ? 'flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]'
                    : 'flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]'
            }
        >
            <LogIn className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={1.75} aria-hidden="true" />
            {variant === 'standard' && <span>Continuer avec Google</span>}
        </button>
    );
}
