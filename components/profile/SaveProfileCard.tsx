'use client';

import { useState } from 'react';
import type { AnswerRecord, Respondent } from '@/types/positions';
import { cribleApiBaseUrl, deleteVault } from '@/lib/cribleApi';
import {
    forgetRecoveryCode,
    recallRecoveryCode,
    rememberRecoveryCode,
    saveProfileToVault
} from '@/lib/vaultClient';
import GoogleSignInButton, { googleClientId } from '@/components/profile/GoogleSignInButton';

// "Save my profile", 16personalities-style but with the opposite data deal:
// the profile is encrypted in this browser before upload, the key never
// leaves the user, and the card says exactly that. The recovery code is shown
// once and must be kept: without it (and without this device), the vault is
// unreadable by everyone, us included. That is the feature, not a bug.

type CardState =
    | { step: 'idle' }
    | { step: 'saving' }
    | { step: 'saved'; recoveryCode: string; newCode: boolean; idToken: string }
    | { step: 'deleted' }
    | { step: 'failed'; reason: 'quota_exceeded' | 'unauthorized' | 'error' };

export default function SaveProfileCard({
    answers,
    respondent
}: {
    answers: AnswerRecord;
    respondent: Respondent;
}) {
    const [state, setState] = useState<CardState>({ step: 'idle' });
    const [copied, setCopied] = useState(false);

    if (googleClientId() === null || cribleApiBaseUrl() === null) return null;

    const handleIdToken = async (idToken: string) => {
        setState({ step: 'saving' });
        const knownCode = recallRecoveryCode();
        const result = await saveProfileToVault(
            idToken,
            {
                country: respondent.country,
                college: respondent.college ?? null,
                answers,
                savedAt: new Date().toISOString()
            },
            knownCode
        );
        if (result.outcome !== 'saved') {
            setState({ step: 'failed', reason: result.outcome });
            return;
        }
        rememberRecoveryCode(result.recoveryCode);
        setState({
            step: 'saved',
            recoveryCode: result.recoveryCode,
            newCode: knownCode === null,
            idToken
        });
    };

    const handleDelete = async (idToken: string) => {
        if (await deleteVault(idToken)) {
            forgetRecoveryCode();
            setState({ step: 'deleted' });
        } else {
            setState({ step: 'failed', reason: 'error' });
        }
    };

    const copyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
        } catch {
            // the code stays selectable on screen
        }
    };

    return (
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
            <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)]">
                Sauvegarder mon profil
            </h3>

            {state.step === 'idle' && (
                <div className="mt-3 space-y-4">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Retrouvez ce profil plus tard ou sur un autre appareil. Il est chiffré
                        dans votre navigateur avant l&apos;envoi: le serveur ne stocke qu&apos;un
                        bloc illisible, et personne (nous compris) ne peut relier vos réponses
                        à votre compte.
                    </p>
                    <GoogleSignInButton onIdToken={(idToken) => void handleIdToken(idToken)} />
                </div>
            )}

            {state.step === 'saving' && (
                <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                    Chiffrement et envoi en cours…
                </p>
            )}

            {state.step === 'saved' && (
                <div className="mt-3 space-y-4">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Profil chiffré et sauvegardé.
                        {state.newCode
                            ? ' Voici votre code de récupération. Notez-le: il est la seule clé de ce profil, et nous ne pouvons pas le régénérer.'
                            : ' Votre code de récupération habituel reste valable.'}
                    </p>
                    {state.newCode && (
                        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                            <p className="break-all text-center font-mono text-sm tracking-wide text-[var(--color-text)]">
                                {state.recoveryCode}
                            </p>
                            <button
                                type="button"
                                onClick={() => void copyCode(state.recoveryCode)}
                                className="mt-3 min-h-[44px] w-full rounded-xl border-2 border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)]/40"
                            >
                                {copied ? 'Copié ✓' : 'Copier le code'}
                            </button>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => void handleDelete(state.idToken)}
                        className="min-h-[44px] text-xs text-[var(--color-text-muted)] underline underline-offset-4 hover:text-[var(--color-text)]"
                    >
                        Supprimer ce profil du serveur
                    </button>
                </div>
            )}

            {state.step === 'deleted' && (
                <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                    Profil supprimé du serveur. Rien d&apos;autre n&apos;y était stocké.
                </p>
            )}

            {state.step === 'failed' && (
                <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                    {state.reason === 'quota_exceeded' &&
                        'Trop de sauvegardes aujourd’hui pour ce compte. Réessayez demain.'}
                    {state.reason === 'unauthorized' &&
                        'La connexion Google n’a pas pu être vérifiée. Reconnectez-vous et réessayez.'}
                    {state.reason === 'error' &&
                        'La sauvegarde n’a pas abouti. Vos réponses restent dans ce navigateur; réessayez plus tard.'}
                </p>
            )}
        </section>
    );
}
