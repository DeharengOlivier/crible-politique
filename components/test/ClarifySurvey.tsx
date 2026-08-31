'use client';

import { useEffect, useRef, useState } from 'react';
import { AnswerRecord, AnswerValue, DIMENSION_LABELS } from '@/types/positions';
import { nextClarifyingStatement } from '@/lib/adaptiveClarification';
import LikertScale from './LikertScale';
import { answersStayHereSentence } from '@/lib/resultsAccess';
import { profileVaultEnabled } from '@/lib/optionalFeatures';

// Adaptive tie-break stage, between the express test and the teaser: one
// statement at a time, each one chosen by nextClarifyingStatement because the
// answers so far leave several currents of a dimension tied. The tied
// archetypes are deliberately NOT named before the answer: naming them would
// tell the respondent what each answer "means" and steer the very measurement
// the statement exists to take.

interface ClarifySurveyProps {
    initialAnswers: AnswerRecord;
    /** Clarifications already answered, for a resumed session. */
    initialAsked: string[];
    onComplete: (answers: AnswerRecord) => void;
    onAnswer?: (answers: AnswerRecord, asked: string[]) => void;
}

export default function ClarifySurvey({
    initialAnswers,
    initialAsked,
    onComplete,
    onAnswer
}: ClarifySurveyProps) {
    const [answers, setAnswers] = useState<AnswerRecord>(initialAnswers);
    const [asked, setAsked] = useState<string[]>(initialAsked);

    const clarification = nextClarifyingStatement(answers, asked);

    // Completion has exactly one path: the effect below. Calling onComplete
    // from the click handler as well fired it twice, because the render that
    // follows finds nothing left to separate and runs the effect too.
    // A resumed session may also land here already settled, which the same
    // effect covers.
    const completed = useRef(false);
    const done = clarification === null;
    useEffect(() => {
        if (done && !completed.current) {
            completed.current = true;
            onComplete(answers);
        }
    }, [done, answers, onComplete]);

    if (clarification === null) return null;

    const { statement } = clarification;
    const dimensionLabel = DIMENSION_LABELS[statement.dimension];

    const handleSelect = (value: AnswerValue) => {
        const nextAnswers = { ...answers, [statement.id]: value };
        const nextAsked = [...asked, statement.id];
        setAnswers(nextAnswers);
        setAsked(nextAsked);
        onAnswer?.(nextAnswers, nextAsked);
    };

    const handleBack = () => {
        if (asked.length === 0) return;
        const lastId = asked[asked.length - 1];
        const nextAnswers = { ...answers };
        delete nextAnswers[lastId];
        const nextAsked = asked.slice(0, -1);
        setAnswers(nextAnswers);
        setAsked(nextAsked);
        onAnswer?.(nextAnswers, nextAsked);
    };

    return (
        <div className="mx-auto w-full max-w-2xl space-y-6">
            <div className="space-y-2 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                    Départage · {dimensionLabel}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                    Vos réponses laissent plusieurs courants à égalité sur cette dimension.
                    Un énoncé de plus pour les départager, deux au plus par dimension.
                </p>
            </div>

            <div className="rounded-2xl border-2 border-[var(--color-border-light)] bg-white p-6 shadow-sm sm:p-10">
                <p className="flex min-h-[7rem] items-center justify-center text-center text-xl font-medium leading-relaxed text-[var(--color-text)] sm:text-2xl">
                    {statement.text}
                </p>
                <div className="mt-6">
                    <LikertScale value={answers[statement.id]} onSelect={handleSelect} />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={handleBack}
                    disabled={asked.length === 0}
                    className="inline-flex min-h-[44px] items-center text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    ← Énoncé précédent
                </button>
                <p className="text-xs text-[var(--color-text-muted)]">
                    {answersStayHereSentence(profileVaultEnabled())}
                </p>
            </div>
        </div>
    );
}
