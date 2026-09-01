'use client';

import { LockKeyhole } from 'lucide-react';
import { answersKeptWhileGated } from '@/lib/resultsAccess';
import type { Country } from '@/types/positions';

// The last screen of an analysis, when the deployment offers profile accounts
// and nobody is signed in.
//
// It draws no Google button. The site has exactly one place to sign in since
// 2026-08-30, the bubble in the page corner, and a second button here would
// leave a reader unable to tell whether they are signing into two things. So
// this panel points at the bubble, which is on screen while it is read.
//
// It also states what the gate is not, because a wall that does not explain
// itself reads as a trick: the answers are computed and kept on this device,
// nothing was sent anywhere to produce them, and signing out gives them back.

// This card carried its own top margin to clear the two floating controls it
// shares its top edge with. It no longer needs one: the page reserves that
// strip for every screen it hosts (app/test/page.tsx), which is where the
// collision comes from and the only place that knows how tall the chrome is.
export default function SignInToSeeResults({ country }: { country: Country }) {
    return (
        <section className="mx-auto w-full max-w-xl space-y-5 rounded-2xl border-2 border-[var(--color-border)] bg-white p-6 text-center sm:p-8">
            <div className="flex justify-center">
                <LockKeyhole
                    className="h-12 w-12 text-[var(--color-primary)]"
                    strokeWidth={1.5}
                    aria-hidden="true"
                />
            </div>

            <div className="space-y-2">
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-primary)] sm:text-3xl">
                    Connectez-vous pour ouvrir vos résultats
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                    Votre analyse est terminée et calculée. Connectez-vous avec Google depuis la{' '}
                    <strong className="text-[var(--color-text)]">bulle en haut à droite</strong> de la
                    page pour l&apos;ouvrir, la retrouver sur un autre appareil et la comparer plus
                    tard. C&apos;est le seul endroit du site où l&apos;on se connecte.
                </p>
                {/* Two presses, and the first one has to be announced or it reads
                    as a dead button: our own control comes first because Google's
                    script is not fetched until someone asks for it. */}
                <p className="text-xs text-[var(--color-text-muted)]">
                    Deux appuis: la bulle d&apos;abord, puis le bouton Google qui s&apos;y affiche.
                    Nous ne chargeons le code de Google qu&apos;à ce moment-là, pour que votre visite
                    ici ne lui soit pas signalée si vous ne vous connectez pas.
                </p>
            </div>

            <div className="space-y-2 rounded-xl bg-[var(--color-bg-elevated)] p-4 text-left text-xs leading-relaxed text-[var(--color-text-secondary)]">
                <p>{answersKeptWhileGated(country)}</p>
                <p>
                    Se connecter n&apos;envoie <strong className="text-[var(--color-text)]">aucune
                    réponse</strong> à notre serveur: le calcul a déjà eu lieu dans ce navigateur, et
                    ce que le serveur apprend est qu&apos;un compte a demandé sa clé, jamais ce que
                    vous avez répondu.
                </p>
                <p>
                    Le calcul est public et déterministe: cette page vous demande un compte, elle ne
                    garde aucun secret. Vous pouvez refaire le calcul vous-même à partir de la{' '}
                    <a
                        href="/methodology"
                        className="font-semibold text-[var(--color-primary)] hover:underline"
                    >
                        méthodologie
                    </a>
                    .
                </p>
            </div>
        </section>
    );
}
