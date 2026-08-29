'use client';

import { useState } from 'react';
import type { AnswerRecord, Respondent } from '@/types/positions';
import { deleteVault } from '@/lib/cribleApi';
import { profileVaultEnabled } from '@/lib/optionalFeatures';
import { saveProfileToVault } from '@/lib/vaultClient';
import GoogleSignInButton from '@/components/profile/GoogleSignInButton';

// "Save my profile", with the opposite data deal from the usual one: the
// profile is sealed in this browser before it is uploaded and opened in this
// browser when it comes back, so the plaintext never crosses the network and
// the database holds no name, no email and no readable answer.
//
// Signing in with Google is the whole credential. There is no code to write
// down: the key is derived from the account by the API, which means the same
// account opens the same vault on any device, and it also means our server
// could derive that key. The privacy page says so in those words rather than
// promising an impossibility.

type CardState =
    | { step: 'idle' }
    | { step: 'saving' }
    | { step: 'saved'; idToken: string }
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

    if (!profileVaultEnabled()) return null;

    const handleIdToken = async (idToken: string) => {
        setState({ step: 'saving' });
        const outcome = await saveProfileToVault(idToken, {
            country: respondent.country,
            college: respondent.college ?? null,
            answers,
            savedAt: new Date().toISOString()
        });
        setState(outcome === 'saved' ? { step: 'saved', idToken } : { step: 'failed', reason: outcome });
    };

    const handleDelete = async (idToken: string) => {
        setState(
            (await deleteVault(idToken)) ? { step: 'deleted' } : { step: 'failed', reason: 'error' }
        );
    };

    return (
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
            <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)]">
                Sauvegarder mon profil
            </h3>

            {state.step === 'idle' && (
                <div className="mt-3 space-y-4">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Retrouvez ce profil plus tard ou sur un autre appareil, en vous
                        reconnectant avec Google. Il est chiffré dans votre navigateur avant
                        l&apos;envoi: le serveur ne garde qu&apos;un bloc illisible, sans votre
                        nom, sans votre adresse e-mail et sans votre identifiant Google en clair.
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
                        Profil chiffré et sauvegardé. Reconnectez-vous avec ce compte Google,
                        depuis n&apos;importe quel appareil, pour le retrouver.
                    </p>
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
