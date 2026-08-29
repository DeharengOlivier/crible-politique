'use client';

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { computeProfile } from '@/lib/scoringEngine';
import { statementsFor } from '@/lib/electoralScope';
import { SavedSession, loadSavedSession, rawStoredSession, subscribeToSession } from '@/lib/testSession';
import { ProfileIcon } from '@/lib/icons';

// The home page recognising a returning respondent, in one line.
//
// Signing in moved to the account badge in the page corner on 2026-08-29
// (night), so this component no longer offers a door: it only says what this
// browser already knows. It used to be a bordered card that pushed the two
// hero doors below the fold on a phone, which is exactly what a reader who
// already has a profile does not need.
//
// It reads the session as the external store it is, so restoring a vault
// profile from the badge above shows up here without a reload.

function sessionWithProfile(): SavedSession | null {
    const session = loadSavedSession();
    if (session === null || session.respondent === null) return null;
    if (Object.keys(session.answers).length === 0) return null;
    return session;
}

export default function HomeIdentity() {
    const raw = useSyncExternalStore(subscribeToSession, rawStoredSession, () => null);
    const session = useMemo(() => (raw === null ? null : sessionWithProfile()), [raw]);

    if (session === null) return null;

    const answered = Object.keys(session.answers).length;
    const total = session.respondent
        ? statementsFor(session.respondent.country).length
        : answered;
    const family =
        session.stage === 'results'
            ? computeProfile(session.answers).syntheticProfileFit.family
            : null;

    return (
        <p className="mx-auto mb-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-[var(--color-text-secondary)]">
            {session.stage === 'results' ? (
                <>
                    {family && (
                        <ProfileIcon
                            name={family.icon}
                            className="h-5 w-5 shrink-0 text-[var(--color-primary)]"
                        />
                    )}
                    <span>
                        Bon retour. Votre profil&nbsp;:{' '}
                        <span className="font-semibold text-[var(--color-text)]">
                            {family?.title ?? 'Profil singulier'}
                        </span>
                        .
                    </span>
                    <Link
                        href="/test?reprendre=1"
                        className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-[var(--color-primary)] hover:underline sm:min-h-0"
                    >
                        Revoir mes résultats
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                </>
            ) : (
                <>
                    <span>
                        Un test est en cours sur cet appareil&nbsp;: {answered} réponse
                        {answered > 1 ? 's' : ''} sur {total}.
                    </span>
                    <Link
                        href="/test?reprendre=1"
                        className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-[var(--color-primary)] hover:underline sm:min-h-0"
                    >
                        Reprendre mon test
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                </>
            )}
        </p>
    );
}
