'use client';

import Link from 'next/link';
import { DIMENSION_LABELS, DIMENSION_ORDER } from '@/types/positions';
import { DEFINITIONS } from '@/data/definitions';
import type { ProfileResult } from '@/lib/scoringEngine';

// The seven dimensions, each naming the current closest to the respondent's
// answers. When several currents fit equally well they are all named rather
// than arbitrated, and the definition of each is one click away: a label the
// reader cannot define is a label that means nothing to them.

export default function CompassSection({ profile }: { profile: ProfileResult }) {
    return (
        <section>
            <h3 className="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
                Votre boussole en 7 dimensions
            </h3>
            <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
                Pour chaque dimension, le courant de pensée le plus proche de vos réponses. Quand
                plusieurs courants collent également à vos réponses, ils sont tous nommés plutôt
                qu&apos;arbitrés.{' '}
                <Link href="/concepts" className="font-semibold text-[var(--color-primary)] hover:underline">
                    Comprendre ces courants
                </Link>
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {DIMENSION_ORDER.map((dimension) => {
                    const archetype = profile.dimensionArchetypes[dimension];
                    const tied = profile.dimensionTies[dimension] ?? [];
                    const definitions = DEFINITIONS[dimension] as Record<string, string>;
                    return (
                        <details
                            key={dimension}
                            className="rounded-xl border border-[var(--color-border-light)] bg-white p-4"
                        >
                            <summary className="min-h-[44px] cursor-pointer list-none sm:min-h-0">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                                    {DIMENSION_LABELS[dimension]}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                                    {archetype?.label ?? 'Non renseigné'}
                                </p>
                                {tied.length > 1 && (
                                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                        À égalité avec {tied.filter((l) => l !== archetype?.label).join(', ')}
                                        {' '}: vos réponses sur cette dimension ne les départagent pas.
                                    </p>
                                )}
                                {archetype && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
                                            <div
                                                className="h-full rounded-full bg-[var(--color-primary)]"
                                                style={{ width: `${archetype.score}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-[var(--color-text-muted)]">
                                            {archetype.score}%
                                        </span>
                                    </div>
                                )}
                                <p className="mt-2 text-[10px] font-semibold text-[var(--color-primary)]">
                                    Comprendre ce courant
                                </p>
                            </summary>
                            <div className="mt-2 space-y-1.5 border-t border-[var(--color-border-light)] pt-2">
                                {archetype && (
                                    <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                                        {definitions[archetype.label]}
                                    </p>
                                )}
                                {tied
                                    .filter((label) => label !== archetype?.label)
                                    .map((label) => (
                                        <p
                                            key={label}
                                            className="text-xs leading-relaxed text-[var(--color-text-secondary)]"
                                        >
                                            <span className="font-semibold">{label}:</span> {definitions[label]}
                                        </p>
                                    ))}
                                <Link
                                    href={`/concepts#${dimension}`}
                                    className="inline-block text-xs font-semibold text-[var(--color-primary)] hover:underline"
                                >
                                    Tous les courants de cette dimension
                                </Link>
                            </div>
                        </details>
                    );
                })}
            </div>
        </section>
    );
}
