'use client';

import { useEffect, useRef } from 'react';

// The official "Sign in with Google" button (Google Identity Services).
// Google's script draws it and hands back a signed ID token; nothing else of
// the Google session enters the app. The token is only ever forwarded to our
// own API as a Bearer header, where its signature is verified.

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

export function googleClientId(): string | null {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId === undefined || clientId.length === 0) return null;
    return clientId;
}

// One script tag for the whole app, whatever mounts first.
let gsiScript: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
    gsiScript ??= new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
            gsiScript = null; // a later mount may retry
            reject(new Error('Google Identity script failed to load'));
        };
        document.head.appendChild(script);
    });
    return gsiScript;
}

export default function GoogleSignInButton({ onIdToken }: { onIdToken: (idToken: string) => void }) {
    const containerRef = useRef<HTMLDivElement>(null);
    // The callback identity changes on every parent render; the ref keeps the
    // one Google holds pointing at the latest without re-initializing.
    const onIdTokenRef = useRef(onIdToken);
    useEffect(() => {
        onIdTokenRef.current = onIdToken;
    });

    useEffect(() => {
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
                window.google.accounts.id.renderButton(containerRef.current, {
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    locale: 'fr'
                });
            })
            .catch(() => undefined); // offline: the card keeps its explanatory text
        return () => {
            disposed = true;
        };
    }, []);

    return <div ref={containerRef} className="flex min-h-[44px] items-center justify-center" />;
}
