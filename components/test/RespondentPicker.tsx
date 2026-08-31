'use client';

import { useState } from 'react';
import {
    BELGIAN_COLLEGES,
    COLLEGE_LABELS,
    nationalStatementsFor,
    partiesFor,
    statementsFor
} from '@/lib/electoralScope';
import type { BelgianCollege, Country, Respondent } from '@/types/positions';

// The first question, and the only one that is not political.
//
// It is asked before the test rather than offered as a filter afterwards,
// because it decides what the respondent is asked and not only what they are
// shown. The two corpora differ: state reform means the opposite thing in the
// two countries, and pension age and unemployment benefits have no shared
// wording at all. Mixing them also put a party the respondent cannot vote for
// at the top of their result roughly half the time.

// Counted from the corpus rather than written out, because the two countries
// do not have the same length and a hand-written copy said otherwise: the
// French row announced the Belgian numbers until 2026-08-30.
function detailFor(country: Country, debate: string): string {
    const national = nationalStatementsFor(country).length;
    return `${partiesFor(country).length} partis, ${statementsFor(country).length} énoncés dont ${national} propres au débat ${debate}`;
}

const CHOICES = [
    {
        country: 'FR' as const,
        title: 'France',
        detail: detailFor('FR', 'français')
    },
    {
        country: 'BE' as const,
        title: 'Belgique',
        detail: detailFor('BE', 'belge')
    }
];

const CARD =
    'w-full rounded-2xl border-2 border-[var(--color-border)] bg-white px-5 py-4 text-left transition-colors hover:border-[var(--color-primary)]/50 min-h-[44px]';

export default function RespondentPicker({ onChoose }: { onChoose: (r: Respondent) => void }) {
    const [step, setStep] = useState<'country' | 'college'>('country');

    if (step === 'college') {
        return (
            <div className="mx-auto w-full max-w-xl space-y-6">
                <div className="space-y-2 text-center">
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-primary)] sm:text-3xl">
                        Où votez-vous ?
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Les élections fédérales belges se tiennent dans trois collèges électoraux, et un
                        bulletin ne porte que les listes du sien. Un électeur wallon ne peut pas voter
                        N-VA.
                    </p>
                </div>

                <div className="space-y-3">
                    {BELGIAN_COLLEGES.map((college: BelgianCollege) => (
                        <button
                            key={college}
                            type="button"
                            onClick={() => onChoose({ country: 'BE', college })}
                            className={CARD}
                        >
                            <span className="block font-semibold text-[var(--color-text)]">
                                {COLLEGE_LABELS[college]}
                            </span>
                            <span className="mt-0.5 block text-sm text-[var(--color-text-secondary)]">
                                {partiesFor('BE', college).length} listes sur votre bulletin
                            </span>
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => onChoose({ country: 'BE' })}
                        className="inline-flex min-h-[44px] w-full items-center justify-center text-sm text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-primary)] hover:underline"
                    >
                        Je préfère voir les {partiesFor('BE').length} partis belges
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setStep('country')}
                    className="inline-flex min-h-[44px] items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                >
                    &larr; Changer de pays
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-xl space-y-6">
            <div className="space-y-2 text-center">
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-primary)] sm:text-3xl">
                    Dans quel pays votez-vous ?
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                    Le test n&apos;est pas le même des deux côtés de la frontière. Certains clivages
                    n&apos;existent que d&apos;un côté, et une même phrase peut y désigner le contraire.
                </p>
            </div>

            <div className="space-y-3">
                {CHOICES.map((choice) => (
                    <button
                        key={choice.country}
                        type="button"
                        onClick={() =>
                            choice.country === 'BE' ? setStep('college') : onChoose({ country: 'FR' })
                        }
                        className={CARD}
                    >
                        <span className="block text-lg font-semibold text-[var(--color-text)]">
                            {choice.title}
                        </span>
                        <span className="mt-0.5 block text-sm text-[var(--color-text-secondary)]">
                            {choice.detail}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
