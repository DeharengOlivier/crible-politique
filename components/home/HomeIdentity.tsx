'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { computeProfile } from '@/lib/scoringEngine';
import { statementsFor, parseBelgianCollege } from '@/lib/electoralScope';
import { profileVaultEnabled } from '@/lib/optionalFeatures';
import { restoreProfileFromVault } from '@/lib/vaultClient';
import {
    SavedSession,
    TEST_SESSION_STORAGE_KEY,
    loadSavedSession,
    saveSession
} from '@/lib/testSession';
import type { Respondent } from '@/types/positions';
import type { VaultProfile } from '@/lib/profileVault';
import GoogleSignInButton from '@/components/profile/GoogleSignInButton';
import { ProfileIcon } from '@/lib/icons';

// The home page recognising a returning respondent. A profile can already be
// here (this device ran the test) or one sign-in away (the vault); either way
// the funnel stops being generic: the reader sees their own family and the way
// back to their results, before anything invites them to start from zero.
//
// Everything stays client-side: the session is read from this browser, and
// the vault path is the same sealed-blob flow as on the results page.

function sessionWithProfile(): SavedSession | null {
    const session = loadSavedSession();
    if (session === null || session.respondent === null) return null;
    if (Object.keys(session.answers).length === 0) return null;
    return session;
}

function respondentOf(profile: VaultProfile): Respondent {
    // A vault profile travelled through a server and a foreign device: its
    // college is re-narrowed like any input.
    const college = profile.country === 'BE' ? parseBelgianCollege(profile.college) : null;
    return college === null ? { country: profile.country } : { country: profile.country, college };
}

// localStorage as the external store it is: the server snapshot is empty, and
// the client snapshot is the raw string, whose identity only changes when the
// stored session does. Hydration renders the server view, then React swaps in
// the client one without a mismatch.
function subscribeToNothing(): () => void {
    return () => {};
}
function rawStoredSession(): string | null {
    try {
        return localStorage.getItem(TEST_SESSION_STORAGE_KEY);
    } catch {
        return null;
    }
}

interface SignInResult {
    session: SavedSession | null;
    message: string | null;
}

export default function HomeIdentity() {
    const raw = useSyncExternalStore(subscribeToNothing, rawStoredSession, () => null);
    const stored = useMemo(() => (raw === null ? null : sessionWithProfile()), [raw]);
    const [signedIn, setSignedIn] = useState<SignInResult | null>(null);

    const session = signedIn?.session ?? stored;
    const message = signedIn?.message ?? null;

    const signIn = async (idToken: string) => {
        const result = await restoreProfileFromVault(idToken);
        if (result.outcome === 'restored') {
            const restored: SavedSession = {
                stage: 'results',
                answers: result.profile.answers,
                respondent: respondentOf(result.profile)
            };
            saveSession(restored);
            setSignedIn({ session: restored, message: null });
            return;
        }
        setSignedIn({
            session: null,
            message:
                result.outcome === 'empty'
                    ? 'Aucun profil sauvegardé sur ce compte. Faites le test, puis sauvegardez-le depuis vos résultats.'
                    : "La connexion n'a pas abouti. Réessayez dans un instant."
        });
    };

    if (session === null) {
        if (!profileVaultEnabled()) return null;
        return (
            <div className="mx-auto mb-8 flex max-w-md flex-col items-center gap-2">
                <GoogleSignInButton onIdToken={signIn} />
                <p className="text-center text-xs text-[var(--color-text-muted)]">
                    Déjà un profil sauvegardé&nbsp;? Reconnectez-vous pour le retrouver sur cet
                    appareil.
                </p>
                {message !== null && (
                    <p className="text-center text-xs text-[var(--color-text-secondary)]">
                        {message}
                    </p>
                )}
            </div>
        );
    }
    const answered = Object.keys(session.answers).length;
    const total = session.respondent
        ? statementsFor(session.respondent.country).length
        : answered;
    const family =
        session.stage === 'results'
            ? computeProfile(session.answers).syntheticProfileFit.family
            : null;

    return (
        <div className="mx-auto mb-8 flex max-w-xl flex-col items-center gap-3 rounded-2xl border border-[var(--color-border-accent)] bg-white/90 px-6 py-5 shadow-sm">
            {session.stage === 'results' ? (
                <>
                    <div className="flex items-center gap-3">
                        {family && (
                            <ProfileIcon
                                name={family.icon}
                                className="h-8 w-8 shrink-0 text-[var(--color-primary)]"
                            />
                        )}
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            Bon retour. Votre profil&nbsp;:{' '}
                            <span className="font-semibold text-[var(--color-text)]">
                                {family?.title ?? 'Profil singulier'}
                            </span>
                        </p>
                    </div>
                    <Link
                        href="/test?reprendre=1"
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-light)]"
                    >
                        Revoir mes résultats
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                </>
            ) : (
                <>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Un test est en cours sur cet appareil: {answered} réponse
                        {answered > 1 ? 's' : ''} sur {total}.
                    </p>
                    <Link
                        href="/test?reprendre=1"
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-light)]"
                    >
                        Reprendre mon test
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                </>
            )}
        </div>
    );
}
