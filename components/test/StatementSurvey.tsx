'use client';

import { useState } from 'react';
import { Statement, AnswerRecord, AnswerValue, DimensionKey, DIMENSION_LABELS } from '@/types/positions';
import LikertScale from './LikertScale';

// Statement flow: ONE statement per screen, auto-advance on answer,
// going back is possible. Mobile-first: time-to-value < 3 minutes in express mode.

// Color dot per dimension (presentation specific to this flow).
const DIMENSION_DOT: Record<DimensionKey, string> = {
    power: 'bg-blue-500',
    economy: 'bg-red-500',
    geopolitics: 'bg-indigo-500',
    social: 'bg-pink-500',
    environment: 'bg-green-500',
    knowledge: 'bg-purple-500',
    moral: 'bg-amber-500'
};

interface StatementSurveyProps {
    statements: Statement[];
    initialAnswers: AnswerRecord;
    // Progress display offset (refinement phase after the express run).
    progressOffset?: number;
    progressTotal?: number;
    onComplete: (answers: AnswerRecord) => void;
    onAnswer?: (answers: AnswerRecord, index: number) => void;
}

export default function StatementSurvey({
    statements,
    initialAnswers,
    progressOffset = 0,
    progressTotal,
    onComplete,
    onAnswer
}: StatementSurveyProps) {
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState<AnswerRecord>(initialAnswers);

    const statement = statements[index];
    const total = progressTotal ?? statements.length;
    const position = progressOffset + index + 1;
    const dimensionLabel = DIMENSION_LABELS[statement.dimension];
    const dimensionDot = DIMENSION_DOT[statement.dimension];

    const handleSelect = (value: AnswerValue) => {
        const next = { ...answers, [statement.id]: value };
        setAnswers(next);
        onAnswer?.(next, index);

        if (index + 1 < statements.length) {
            setIndex(index + 1);
        } else {
            onComplete(next);
        }
    };

    return (
        <div className="mx-auto w-full max-w-2xl space-y-6">
            {/* Progress */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                    <span>
                        Énoncé {position} / {total}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-light)] bg-white px-3 py-1 text-xs font-medium">
                        <span className={`h-2 w-2 rounded-full ${dimensionDot}`} />
                        {dimensionLabel}
                    </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
                    <div
                        className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
                        style={{ width: `${(position / total) * 100}%` }}
                    />
                </div>
            </div>

            {/* Statement */}
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
                    onClick={() => index > 0 && setIndex(index - 1)}
                    disabled={index === 0}
                    className="text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    ← Énoncé précédent
                </button>
                <p className="text-xs text-[var(--color-text-muted)]">
                    Vos réponses ne quittent jamais votre appareil.
                </p>
            </div>
        </div>
    );
}
