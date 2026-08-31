'use client';

import { DIMENSION_LABELS, DIMENSION_ORDER, type DimensionKey } from '@/types/positions';
import { MAX_PRIORITY_DIMENSIONS } from '@/lib/priorityWeights';

// The reader's own fights: the dimensions whose statements count double in the
// displayed ranking (METHODOLOGY.md 3.4). Display-only and session-local, and
// chosen after the anonymous statistics event was sent, so the public counters
// never see a weighted run.

export interface PriorityPickerProps {
    priorities: DimensionKey[];
    onToggle: (dimension: DimensionKey) => void;
}

export default function PriorityPicker({ priorities, onToggle }: PriorityPickerProps) {
    return (
        <div className="mb-4 rounded-xl border border-[var(--color-border-light)] bg-white p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">Vos combats prioritaires</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                Choisissez jusqu&apos;à {MAX_PRIORITY_DIMENSIONS} dimensions: leurs énoncés
                compteront double dans les scores affichés, pour voir quels partis vous
                rejoignent sur ce qui compte le plus pour vous.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
                {DIMENSION_ORDER.map((dimension) => {
                    const active = priorities.includes(dimension);
                    const saturated = !active && priorities.length >= MAX_PRIORITY_DIMENSIONS;
                    return (
                        <button
                            key={dimension}
                            type="button"
                            disabled={saturated}
                            onClick={() => onToggle(dimension)}
                            className={`min-h-[44px] rounded-full border px-4 py-1.5 text-sm font-medium transition-colors sm:min-h-0 ${
                                active
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                                    : saturated
                                      ? 'cursor-not-allowed border-[var(--color-border-light)] text-[var(--color-text-muted)] opacity-50'
                                      : 'border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-primary)]/40'
                            }`}
                        >
                            {DIMENSION_LABELS[dimension]}
                        </button>
                    );
                })}
            </div>
            {priorities.length > 0 && (
                <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
                    Les énoncés de{' '}
                    <span className="font-semibold">
                        {priorities.map((d) => DIMENSION_LABELS[d]).join(', ')}
                    </span>{' '}
                    comptent double dans les scores et le groupe de tête ci-dessous. La
                    formule reste la moyenne pondérée publiée dans la méthodologie.
                </p>
            )}
        </div>
    );
}
