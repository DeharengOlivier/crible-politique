'use client';

import { AnswerValue, LikertValue } from '@/types/positions';

// Button-based answer scale (no slider: a slider pre-positioned on "Neutral"
// creates a default-value bias and is imprecise with the thumb).
// "No opinion" is always available and never penalized.

interface LikertScaleProps {
    value?: AnswerValue;
    onSelect: (value: AnswerValue) => void;
}

const OPTIONS: { value: LikertValue; label: string; selected: string }[] = [
    { value: -2, label: "Pas du tout d'accord", selected: 'bg-red-600 border-red-600 text-white' },
    { value: -1, label: "Plutôt pas d'accord", selected: 'bg-orange-500 border-orange-500 text-white' },
    { value: 0, label: 'Neutre / partagé', selected: 'bg-slate-500 border-slate-500 text-white' },
    { value: 1, label: "Plutôt d'accord", selected: 'bg-emerald-500 border-emerald-500 text-white' },
    { value: 2, label: "Tout à fait d'accord", selected: 'bg-green-600 border-green-600 text-white' }
];

export default function LikertScale({ value, onSelect }: LikertScaleProps) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                {OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onSelect(option.value)}
                        className={`min-h-[3.25rem] rounded-xl border-2 px-2 py-3 text-xs font-semibold leading-tight transition-all sm:text-sm ${
                            value === option.value
                                ? option.selected
                                : 'border-[var(--color-border)] bg-white text-[var(--color-text)] hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
            <div className="text-center">
                <button
                    type="button"
                    onClick={() => onSelect(null)}
                    className={`text-sm text-[var(--color-text-muted)] underline-offset-4 transition-colors hover:text-[var(--color-primary)] hover:underline ${
                        value === null ? 'underline font-semibold' : ''
                    }`}
                >
                    Sans opinion / passer
                </button>
            </div>
        </div>
    );
}
