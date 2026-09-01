'use client';

import { Scale } from 'lucide-react';
import type { PairSeparation } from '@/lib/partySeparation';
import { LIKERT_LABELS } from '@/types/positions';

// Why the first party is ahead of the second, on the statements where the two
// actually disagree.
//
// A reader who answered the whole corpus asked for a result that separates the
// parties more sharply. Measured on 2026-09-01, the percentage cannot do that:
// it is a mean over statements, so a longer analysis narrows its interval
// without widening the gap (5.3 to 5.6 points between the first and the second,
// on 300 seeded coherent respondents). The parties at the top are close because
// they are close in the coded table, not because the test is blunt.
//
// What the long analysis does buy is this panel: the statements on which the
// top two genuinely diverge, measured to grow from 2.3 to 3.8 in France and
// 2.2 to 4.4 in Belgium between the express run and the complete one. That is
// the clear-cut answer, and it is made of positions a reader can check rather
// than of a gap made to look bigger.

/** Two full Likert steps apart is the panel's own threshold; see lib/partySeparation.ts. */
const SHOWN = 6;

const likertLabel = (value: number) => LIKERT_LABELS[String(value)] ?? String(value);

export interface WhatSeparatesTheTopTwoProps {
    separation: PairSeparation;
}

export default function WhatSeparatesTheTopTwo({ separation }: WhatSeparatesTheTopTwoProps) {
    const { first, second, separating, firstCount, secondCount, tiedCount, comparable, identical } =
        separation;

    // Nothing was answered, so there is nothing to say about anybody. The
    // screen stays silent rather than drawing an empty frame.
    if (comparable === 0) return null;

    const drawn = separating.slice(0, SHOWN);
    const hidden = separating.length - drawn.length;

    return (
        <section className="mb-4 space-y-3 rounded-xl border border-[var(--color-border-light)] bg-white p-4 text-sm">
            <h3 className="flex items-start gap-2 font-semibold text-[var(--color-text)]">
                <Scale
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]"
                    strokeWidth={2}
                    aria-hidden="true"
                />
                <span>
                    Ce qui vous départage entre {first.name} et {second.name}
                </span>
            </h3>

            {separating.length === 0 ? (
                <p className="text-[var(--color-text-secondary)]">
                    Sur les {comparable} énoncés que vous avez tranchés et que les deux partis
                    documentent, <span className="font-semibold">aucun énoncé</span> ne les sépare
                    d&apos;au moins deux crans&nbsp;: leurs positions codées sont identiques sur{' '}
                    {identical} d&apos;entre eux. Ce questionnaire ne peut pas les départager, et
                    aucun énoncé ajouté ne le pourrait tant que leurs positions restent codées de
                    la même façon. Leur écart de pourcentage, s&apos;il y en a un, ne se lit pas.
                </p>
            ) : (
                <>
                    <p className="text-[var(--color-text-secondary)]">
                        Ils divergent vraiment sur{' '}
                        <span className="font-semibold">{separating.length} énoncés</span> parmi les{' '}
                        {comparable} que vous avez tranchés. Vous avez penché{' '}
                        <span className="font-semibold">{firstCount} fois</span> vers {first.name},{' '}
                        <span className="font-semibold">{secondCount} fois</span> vers {second.name}
                        {tiedCount > 0 && <>, et {tiedCount} fois à égale distance des deux</>}.
                    </p>

                    <ul className="space-y-2">
                        {drawn.map((entry) => {
                            const chosen =
                                entry.closerTo === 'first'
                                    ? first.name
                                    : entry.closerTo === 'second'
                                      ? second.name
                                      : null;
                            return (
                                <li
                                    key={entry.statement.id}
                                    className="rounded-lg bg-[var(--color-bg-elevated)] px-3 py-2"
                                >
                                    <p className="text-[var(--color-text)]">
                                        {entry.statement.text}
                                    </p>
                                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                        {first.name}&nbsp;: {likertLabel(entry.firstPosition)} ·{' '}
                                        {second.name}&nbsp;: {likertLabel(entry.secondPosition)}
                                    </p>
                                    <p className="mt-0.5 text-xs font-semibold text-[var(--color-primary)]">
                                        Vous&nbsp;: {likertLabel(entry.answer)}
                                        {chosen === null
                                            ? ', à égale distance des deux'
                                            : `, plus proche de ${chosen}`}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>

                    {hidden > 0 && (
                        <p className="text-xs text-[var(--color-text-muted)]">
                            Et {hidden} autres énoncés les séparent, visibles dans le détail de
                            chaque parti.
                        </p>
                    )}
                </>
            )}

            <p className="text-xs text-[var(--color-text-muted)]">
                Un énoncé n&apos;est retenu ici que si les deux partis sont codés à au moins deux
                crans d&apos;écart. Sous ce seuil, la différence est du même ordre que
                l&apos;incertitude du codage, qui est encore préliminaire.
            </p>
        </section>
    );
}
