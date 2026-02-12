'use client';

import { useState } from 'react';
import { MORAL_FOUNDATION_QUESTIONS } from '@/data/moralFoundations';
import { calculateMoralFoundations, interpretMoralProfile } from '@/utils/analysis';
import MoralFoundationsRadar from './MoralFoundationsRadar';
import LikertScale from './LikertScale';
import { AnswerValue } from '@/types/positions';

// Opt-in "Moral foundations" module (Haidt, MFT): 12 items, ~2 minutes.
// Offered AFTER the results, never forced in the base test.

interface MftModuleProps {
    onClose: () => void;
}

export default function MftModule({ onClose }: MftModuleProps) {
    const mftQuestions = MORAL_FOUNDATION_QUESTIONS;
    const [index, setIndex] = useState(0);
    const [responses, setResponses] = useState<Record<string, number>>({});
    const [done, setDone] = useState(false);

    const question = mftQuestions[index];

    const handleSelect = (value: AnswerValue) => {
        const next = { ...responses };
        if (value !== null) {
            next[question.id] = value + 3; // MFQ scale 1..5
        } else {
            delete next[question.id];
        }
        setResponses(next);

        if (index + 1 < mftQuestions.length) {
            setIndex(index + 1);
        } else {
            setDone(true);
        }
    };

    if (done) {
        const foundations = calculateMoralFoundations(responses);
        return (
            <div className="space-y-4">
                <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
                    Vos fondations morales
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                    D&apos;après la théorie des fondations morales (Haidt). Il n&apos;y a pas de bon ou de
                    mauvais profil: chaque combinaison de valeurs est légitime.
                </p>
                <MoralFoundationsRadar foundations={foundations} />
                <p className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-elevated)] p-4 text-sm text-[var(--color-text-secondary)]">
                    {interpretMoralProfile(foundations)}
                </p>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
                >
                    ← Retour aux résultats
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                <span>
                    Valeur {index + 1} / {mftQuestions.length}
                </span>
                <button type="button" onClick={onClose} className="hover:text-[var(--color-primary)]">
                    Annuler
                </button>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
                <div
                    className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
                    style={{ width: `${((index + 1) / mftQuestions.length) * 100}%` }}
                />
            </div>
            <p className="flex min-h-[5rem] items-center justify-center text-center text-lg font-medium leading-relaxed text-[var(--color-text)]">
                {question.text}
            </p>
            <LikertScale
                value={
                    responses[question.id] !== undefined
                        ? ((responses[question.id] - 3) as AnswerValue)
                        : undefined
                }
                onSelect={handleSelect}
            />
        </div>
    );
}
