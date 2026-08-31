'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { shareFragment } from '@/lib/shareLink';

// Someone sent a "compare with me" link before this respondent had a profile.
// Their code waited in session storage; now that a profile exists, the
// comparison is one click away rather than a link to find again.

const COMPARE_REF_KEY = 'crible_compare_ref';

function pendingInvitation(): string | null {
    try {
        return sessionStorage.getItem(COMPARE_REF_KEY);
    } catch {
        return null;
    }
}

export default function DuoInvitationBanner({ code }: { code: string }) {
    // Read once at initialization: this component only ever renders in the
    // browser, and the invitation cannot appear while the reader is on this
    // screen.
    const [invitation] = useState<string | null>(pendingInvitation);
    const router = useRouter();

    if (invitation === null) return null;

    return (
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border-2 border-[var(--color-accent)]/40 bg-[var(--color-accent-subtle)] p-5 sm:flex-row">
            <p className="text-sm text-[var(--color-text)]">
                Quelqu&apos;un vous a invité à comparer vos profils. Le vôtre est prêt.
            </p>
            <button
                type="button"
                onClick={() => {
                    try {
                        sessionStorage.removeItem(COMPARE_REF_KEY);
                    } catch {
                        // ignore
                    }
                    router.push(`/compare${shareFragment({ a: invitation, b: code })}`);
                }}
                className="shrink-0 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-light)]"
            >
                Voir la comparaison
            </button>
        </div>
    );
}
