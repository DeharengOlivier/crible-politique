'use client';

import { useEffect, useRef } from 'react';
import { googleClientId } from '@/lib/optionalFeatures';

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
                window.google.accounts.id.renderButton(
                    containerRef.current,
                    variant === 'icon'
                        ? { type: 'icon', shape: 'circle', theme: 'outline', size: 'large', locale: 'fr' }
                        : { theme: 'outline', size: 'large', text: 'continue_with', locale: 'fr' }
                );
            })
            .catch(() => undefined); // offline: the card keeps its explanatory text
        return () => {
            disposed = true;
        };
    }, [variant]);

    return <div ref={containerRef} className="flex min-h-[44px] items-center justify-center" />;
}
