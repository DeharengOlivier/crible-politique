'use client';

import Link from 'next/link';
import { shareFragment } from '@/lib/shareLink';
import { useShareCodes } from '@/lib/useShareCodes';

// The two actions offered on a shared profile page.
//
// Both need the sharer's answers, and the answers are in the fragment, which
// only the browser can read: the page itself is rendered by the server from
// the badge code in the path, which says nothing about them. When the fragment
// is absent (a link relayed through something that dropped it) the actions
// degrade to their unpersonalised form rather than disappearing.

const SHARE_KEYS = ['p'] as const;

export default function SharedProfileActions() {
    const shared = useShareCodes(SHARE_KEYS);
    const code = shared?.p ?? null;

    return (
        <div className="space-y-3">
            <Link
                href="/test"
                className="block w-full rounded-xl bg-[var(--color-primary)] px-6 py-4 text-lg font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[var(--color-primary-light)]"
            >
                Et toi, où te situes-tu ? Fais le test (3 min)
            </Link>
            <Link
                href={`/compare${shareFragment({ a: code ?? '' })}`}
                className="block w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-6 py-3.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/40"
            >
                Faire le test et comparer nos profils
            </Link>
            <Link
                href={`/test${shareFragment({ p: code ?? '' })}`}
                className="flex min-h-[44px] items-center justify-center text-xs text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-primary)] hover:underline"
            >
                C&apos;est mon profil: voir mes résultats complets
            </Link>
        </div>
    );
}
