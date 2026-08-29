'use client';

import { useState } from 'react';
import type { VaultProfile } from '@/lib/profileVault';
import { profileVaultEnabled } from '@/lib/optionalFeatures';
import { restoreProfileFromVault } from '@/lib/vaultClient';
import GoogleSignInButton from '@/components/profile/GoogleSignInButton';

// The other side of the vault: sign in, fetch the sealed blob, open it here.
// Signing in is the whole interaction. The key is derived from the Google
// account by the API, so the same account opens the same vault on any device
// and there is nothing to type, remember or lose.

type CardState = { step: 'idle' } | { step: 'working' } | { step: 'empty' } | { step: 'failed' };

export default function RestoreProfileCard({
    onRestored
}: {
    onRestored: (profile: VaultProfile) => void;
}) {
    const [state, setState] = useState<CardState>({ step: 'idle' });

    if (!profileVaultEnabled()) return null;

    const handleIdToken = async (idToken: string) => {
        setState({ step: 'working' });
        const result = await restoreProfileFromVault(idToken);
        if (result.outcome === 'restored') {
            onRestored(result.profile);
            return;
        }
        setState({ step: result.outcome === 'empty' ? 'empty' : 'failed' });
    };

    return (
        <div className="mx-auto max-w-md rounded-2xl border border-[var(--color-border-light)] bg-white p-5 text-center">
            <p className="text-sm font-semibold text-[var(--color-text)]">
                Déjà un profil sauvegardé ?
            </p>

            {state.step === 'idle' && (
                <div className="mt-3 space-y-3">
                    <p className="text-xs text-[var(--color-text-muted)]">
                        Connectez-vous avec Google: votre profil est récupéré chiffré et
                        déchiffré ici, dans votre navigateur. Rien d&apos;autre à retenir.
                    </p>
                    <GoogleSignInButton onIdToken={(idToken) => void handleIdToken(idToken)} />
                </div>
            )}

            {state.step === 'working' && (
                <p className="mt-3 text-sm text-[var(--color-text-muted)]">Déchiffrement…</p>
            )}

            {state.step === 'empty' && (
                <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                    Aucun profil sauvegardé sur ce compte. Faites le test, puis
                    sauvegardez-le depuis vos résultats.
                </p>
            )}

            {state.step === 'failed' && (
                <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                    La récupération n&apos;a pas abouti. Réessayez plus tard.
                </p>
            )}
        </div>
    );
}
