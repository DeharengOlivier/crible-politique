'use client';

import { useState } from 'react';
import type { VaultProfile } from '@/lib/profileVault';
import { profileVaultEnabled } from '@/lib/optionalFeatures';
import { recallRecoveryCode, rememberRecoveryCode, restoreProfileFromVault } from '@/lib/vaultClient';
import GoogleSignInButton from '@/components/profile/GoogleSignInButton';

// The other side of the vault: sign in, fetch the sealed blob, decrypt it
// here. On the device that saved it the stored recovery code opens it
// silently; on a new device the user types the code they kept. A wrong code
// yields nothing, by construction rather than by policy.

type CardState =
    | { step: 'idle' }
    | { step: 'working' }
    | { step: 'needs_code'; idToken: string; rejected: boolean }
    | { step: 'empty' }
    | { step: 'failed' };

export default function RestoreProfileCard({
    onRestored
}: {
    onRestored: (profile: VaultProfile) => void;
}) {
    const [state, setState] = useState<CardState>({ step: 'idle' });
    const [typedCode, setTypedCode] = useState('');

    if (!profileVaultEnabled()) return null;

    const attemptRestore = async (idToken: string, code: string, typed: boolean) => {
        setState({ step: 'working' });
        const result = await restoreProfileFromVault(idToken, code);
        switch (result.outcome) {
            case 'restored':
                if (typed) rememberRecoveryCode(code);
                onRestored(result.profile);
                return;
            case 'empty':
                setState({ step: 'empty' });
                return;
            case 'wrong_code':
                setState({ step: 'needs_code', idToken, rejected: typed });
                return;
            default:
                setState({ step: 'failed' });
        }
    };

    const handleIdToken = (idToken: string) => {
        const storedCode = recallRecoveryCode();
        if (storedCode !== null) {
            void attemptRestore(idToken, storedCode, false);
        } else {
            setState({ step: 'needs_code', idToken, rejected: false });
        }
    };

    return (
        <div className="mx-auto max-w-md rounded-2xl border border-[var(--color-border-light)] bg-white p-5 text-center">
            <p className="text-sm font-semibold text-[var(--color-text)]">
                Déjà un profil sauvegardé ?
            </p>

            {state.step === 'idle' && (
                <div className="mt-3 space-y-3">
                    <p className="text-xs text-[var(--color-text-muted)]">
                        Connectez-vous pour récupérer votre profil chiffré et le déchiffrer
                        ici, dans votre navigateur.
                    </p>
                    <GoogleSignInButton onIdToken={handleIdToken} />
                </div>
            )}

            {state.step === 'working' && (
                <p className="mt-3 text-sm text-[var(--color-text-muted)]">Déchiffrement…</p>
            )}

            {state.step === 'needs_code' && (
                <form
                    className="mt-3 space-y-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void attemptRestore(state.idToken, typedCode, true);
                    }}
                >
                    <p className="text-xs text-[var(--color-text-muted)]">
                        {state.rejected
                            ? 'Ce code n’ouvre pas ce profil. Vérifiez-le caractère par caractère.'
                            : 'Entrez le code de récupération noté lors de la sauvegarde.'}
                    </p>
                    <input
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        spellCheck={false}
                        value={typedCode}
                        onChange={(event) => setTypedCode(event.target.value)}
                        placeholder="xxxxxx-xxxxxx-…"
                        aria-label="Code de récupération"
                        className="min-h-[44px] w-full rounded-xl border-2 border-[var(--color-border)] px-3 text-center font-mono text-sm"
                    />
                    <button
                        type="submit"
                        className="min-h-[44px] w-full rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-primary-light)]"
                    >
                        Déchiffrer mon profil
                    </button>
                </form>
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
