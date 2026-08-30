'use client';

import { useState } from 'react';
import type { AnswerRecord, Respondent } from '@/types/positions';
import { deleteVault } from '@/lib/cribleApi';
import { profileVaultEnabled } from '@/lib/optionalFeatures';
import { currentIdToken } from '@/lib/googleSession';
import { saveProfileToVault } from '@/lib/vaultClient';

// "Save my profile", with the opposite data deal from the usual one: the
// profile is sealed in this browser before it is uploaded and opened in this
// browser when it comes back, so the plaintext never crosses the network and
// the database holds no name, no email and no readable answer.
//
// Signing in with Google is the whole credential, and since 2026-08-30 it
// happens in exactly one place: the bubble in the page corner. This card uses
// the sign-in already made and never draws a Google button of its own. Three
// Google buttons on three screens left a reader unable to tell whether they
// were signing into three different things.
//
// The token lives in memory only, so a hard reload loses it and the card asks
// for the bubble again. That is the price of keeping no credential on disk,
// and the card says it rather than failing silently.

type CardState =
    | { step: 'idle' }
    | { step: 'saving' }
    | { step: 'saved'; idToken: string }
    | { step: 'deleted' }
    | { step: 'failed'; reason: 'quota_exceeded' | 'unauthorized' | 'error' };

function SignInFirst() {
    return (
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Connectez-vous avec Google depuis la bulle en haut à droite de la page pour
            sauvegarder ce profil et le retrouver sur un autre appareil. C&apos;est le seul endroit
            du site où l&apos;on se connecte.
        </p>
    );
}

export default function SaveProfileCard({
    answers,
    respondent
}: {
    answers: AnswerRecord;
    respondent: Respondent;
}) {
    const [state, setState] = useState<CardState>({ step: 'idle' });

    if (!profileVaultEnabled()) return null;

    const idToken = currentIdToken();

    const handleSave = async (token: string) => {
        setState({ step: 'saving' });
        const outcome = await saveProfileToVault(token, {
            country: respondent.country,
            college: respondent.college ?? null,
            answers,
            savedAt: new Date().toISOString()
        });
        setState(
            outcome === 'saved' ? { step: 'saved', idToken: token } : { step: 'failed', reason: outcome }
        );
    };

    const handleDelete = async (token: string) => {
        setState(
            (await deleteVault(token)) ? { step: 'deleted' } : { step: 'failed', reason: 'error' }
        );
    };

    return (
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
            <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)]">
                Sauvegarder mon profil
            </h3>

            {state.step === 'idle' &&
                (idToken === null ? (
                    <SignInFirst />
                ) : (
                    <div className="mt-3 space-y-4">
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            Retrouvez ce profil plus tard ou sur un autre appareil, en vous
                            reconnectant avec Google. Il est chiffré dans votre navigateur avant
                            l&apos;envoi: le serveur ne garde qu&apos;un bloc illisible, sans votre
                            nom, sans votre adresse e-mail et sans votre identifiant Google en clair.
                        </p>
                        <button
                            type="button"
                            onClick={() => void handleSave(idToken)}
                            className="min-h-[44px] rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-light)]"
                        >
                            Sauvegarder ce profil
                        </button>
                    </div>
                ))}

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
                <>
                    {state.reason === 'unauthorized' ? (
                        <>
                            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                                La connexion Google n&apos;a pas pu être vérifiée, ou elle a expiré.
                            </p>
                            <SignInFirst />
                        </>
                    ) : (
                        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                            {state.reason === 'quota_exceeded'
                                ? 'Trop de sauvegardes aujourd’hui pour ce compte. Réessayez demain.'
                                : 'La sauvegarde n’a pas abouti. Vos réponses restent dans ce navigateur; réessayez plus tard.'}
                        </p>
                    )}
                </>
            )}
        </section>
    );
}
