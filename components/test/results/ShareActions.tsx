'use client';

import { useState } from 'react';
import { shareFragment } from '@/lib/shareLink';
import type { SyntheticProfile } from '@/data/syntheticProfiles';

// Three ways to hand this profile to someone, and one rule they all obey: the
// answers travel only in the fragment of the address, the part a browser never
// sends to a server. The identity badge is the only thing allowed in a path.

const BUTTON =
    'rounded-xl border-2 border-[var(--color-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/40';

const COPIED_FEEDBACK_MS = 2500;

export interface ShareActionsProps {
    /** The answers, for the fragment. */
    code: string;
    /** The identity, for the path. */
    badge: string;
    family: SyntheticProfile | null;
}

export default function ShareActions({ code, badge, family }: ShareActionsProps) {
    const [copied, setCopied] = useState<string | null>(null);

    const copy = async (url: string, key: string) => {
        await navigator.clipboard.writeText(url);
        setCopied(key);
        setTimeout(() => setCopied(null), COPIED_FEEDBACK_MS);
    };

    const share = async () => {
        const url = `${window.location.origin}/p/${badge}${shareFragment({ p: code })}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Mon profil politique',
                    text: family ? `Je suis "${family.title}". Et toi ?` : 'Quel est ton profil politique ?',
                    url
                });
                return;
            } catch {
                // share cancelled: fall back to copy
            }
        }
        copy(url, 'share');
    };

    return (
        <>
            <div className="flex flex-wrap justify-center gap-3 pt-1">
                <button
                    type="button"
                    onClick={share}
                    className="rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-light)]"
                >
                    {copied === 'share' ? 'Lien copié !' : 'Partager mon profil'}
                </button>
                <button
                    type="button"
                    onClick={() =>
                        copy(`${window.location.origin}/compare${shareFragment({ a: code })}`, 'duo')
                    }
                    className={BUTTON}
                >
                    {copied === 'duo' ? 'Lien copié !' : 'Comparer avec un proche'}
                </button>
                <button
                    type="button"
                    onClick={() =>
                        copy(`${window.location.origin}/test${shareFragment({ p: code })}`, 'self')
                    }
                    className={BUTTON}
                >
                    {copied === 'self' ? 'Lien copié !' : 'Garder mes résultats'}
                </button>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
                Le lien encode vos réponses après le «&nbsp;#&nbsp;», la partie de l&apos;adresse que le
                navigateur ne transmet jamais: elles ne sont stockées nulle part et ne passent par aucun
                serveur. Ne le partagez qu&apos;avec des personnes de confiance.
            </p>
        </>
    );
}
