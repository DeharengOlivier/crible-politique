'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, UserRound } from 'lucide-react';
import GoogleSignInButton from '@/components/profile/GoogleSignInButton';
import { profileVaultEnabled } from '@/lib/optionalFeatures';
import { restoreProfileFromVault } from '@/lib/vaultClient';
import { parseBelgianCollege } from '@/lib/electoralScope';
import { loadSavedSession, rawStoredSession, saveSession, subscribeToSession } from '@/lib/testSession';
import {
    claimsFromIdToken,
    forgetGoogleIdentity,
    loadGoogleIdentity,
    rawGoogleIdentity,
    rememberIdToken,
    saveGoogleIdentity,
    subscribeToGoogleIdentity
} from '@/lib/googleSession';
import type { Respondent } from '@/types/positions';
import type { VaultProfile } from '@/lib/profileVault';

// The corner of the page that says who you are: a small Google button when
// nobody is signed in, the reader's own picture once they are. Signing in here
// pulls the saved profile down into this browser, so the rest of the site can
// greet them without a second gesture.
//
// It is the ONLY place in the whole site where a reader signs in (2026-08-30):
// the save card on the results uses the sign-in made here rather than drawing a
// second Google button, because three buttons on three screens leave a reader
// unable to tell whether they are three accounts.
//
// It is absent from the questionnaire, which deliberately carries no chrome at
// all (a floating back button and nothing else), and comes back on the results
// screen of that same address, which is where saving is offered. That absence
// is also the reason no "see my profile" entry has to be hidden.

/** The address that carries both the questionnaire and the results. */
const TEST_PATH = '/test';

function respondentOf(profile: VaultProfile): Respondent {
    // A vault profile travelled through a server and a foreign device: its
    // college is re-narrowed like any input.
    const college = profile.country === 'BE' ? parseBelgianCollege(profile.college) : null;
    return college === null ? { country: profile.country } : { country: profile.country, college };
}

export default function AccountBadge() {
    const pathname = usePathname();
    // Storage is the single source of truth for who is signed in: signing in
    // and out write it and notify, and this reads it back. No local mirror to
    // keep in sync, and a sign-out in another tab lands here too.
    const raw = useSyncExternalStore(subscribeToGoogleIdentity, rawGoogleIdentity, () => null);
    const identity = useMemo(() => (raw === null ? null : loadGoogleIdentity()), [raw]);
    const rawSession = useSyncExternalStore(subscribeToSession, rawStoredSession, () => null);
    const savedStage = useMemo(
        () => (rawSession === null ? null : loadSavedSession()?.stage ?? null),
        [rawSession]
    );
    const [menuOpen, setMenuOpen] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const onPointerDown = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) setMenuOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMenuOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [menuOpen]);

    // On /test the badge is chrome the questionnaire refuses, except on the
    // results, the one screen of that address that offers to save.
    const onQuestionnaire = pathname === TEST_PATH && savedStage !== 'results';
    if (onQuestionnaire || !profileVaultEnabled()) return null;

    const signIn = async (idToken: string) => {
        rememberIdToken(idToken);
        const claims = claimsFromIdToken(idToken);
        if (claims !== null) saveGoogleIdentity(claims);
        const result = await restoreProfileFromVault(idToken);
        if (result.outcome === 'restored') {
            saveSession({
                stage: 'results',
                answers: result.profile.answers,
                respondent: respondentOf(result.profile)
            });
            setMessage(null);
            return;
        }
        if (result.outcome !== 'empty') {
            setMessage("La connexion n'a pas abouti. Réessayez dans un instant.");
            return;
        }
        // Nothing on the server is not nothing at all: this device may well
        // hold an analysis, and told a reader who had just finished one to go
        // and take it (reported 2026-08-31). The server and the device are two
        // different places, so the sentence names which one it is talking about.
        setMessage(
            savedStage === null
                ? 'Aucun profil sauvegardé sur ce compte, et aucune analyse sur cet appareil. Faites le test pour commencer.'
                : "Aucun profil n'était sauvegardé sur ce compte. Votre analyse sur cet appareil est intacte: sauvegardez-la depuis le bas de vos résultats pour la retrouver ailleurs."
        );
    };

    const signOut = () => {
        forgetGoogleIdentity();
        setMenuOpen(false);
        setMessage(null);
    };

    return (
        <div ref={containerRef} className="fixed right-3 top-3 z-30 flex flex-col items-end gap-2">
            {identity === null ? (
                <GoogleSignInButton onIdToken={signIn} variant="icon" />
            ) : (
                <>
                    <button
                        type="button"
                        onClick={() => setMenuOpen((open) => !open)}
                        aria-expanded={menuOpen}
                        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                    >
                        {identity.picture === null ? (
                            <UserRound
                                className="h-5 w-5 text-[var(--color-primary)]"
                                aria-label={`Compte de ${identity.name}`}
                            />
                        ) : (
                            /* eslint-disable-next-line @next/next/no-img-element --
                               a Google avatar URL is an external host with its own
                               sizing; the optimizer would proxy it for nothing. */
                            <img
                                src={identity.picture}
                                alt={`Compte de ${identity.name}`}
                                width={44}
                                height={44}
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-cover"
                            />
                        )}
                    </button>
                    {menuOpen && (
                        <div
                            className="w-60 rounded-xl border border-[var(--color-border-light)] bg-white p-2 shadow-lg"
                        >
                            <p className="truncate px-3 py-2 text-xs text-[var(--color-text-muted)]">
                                Connecté comme{' '}
                                <span className="font-semibold text-[var(--color-text)]">
                                    {identity.name}
                                </span>
                            </p>
                            <Link
                                href="/test?reprendre=1"
                                onClick={() => setMenuOpen(false)}
                                className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)]"
                            >
                                <UserRound className="h-4 w-4" aria-hidden="true" />
                                Voir mon profil
                            </Link>
                            <button
                                type="button"
                                onClick={signOut}
                                className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)]"
                            >
                                <LogOut className="h-4 w-4" aria-hidden="true" />
                                Se déconnecter
                            </button>
                            <p className="px-3 py-2 text-[11px] leading-snug text-[var(--color-text-muted)]">
                                Se déconnecter oublie le compte sur cet appareil. Vos réponses, elles,
                                restent ici jusqu&apos;à ce que vous les effaciez.
                            </p>
                        </div>
                    )}
                </>
            )}
            {message !== null && (
                <p className="max-w-[16rem] rounded-lg border border-[var(--color-border-light)] bg-white px-3 py-2 text-right text-[11px] leading-snug text-[var(--color-text-secondary)] shadow-sm">
                    {message}
                </p>
            )}
        </div>
    );
}
