'use client';

import type { DimensionKey } from '@/types/positions';
import { SOURCE_STATUS_LABELS } from '@/types/positions';
import type { PoliticalParty } from '@/types/archetypes';
import { fightInPriorities, fightsFor } from '@/lib/partyFights';

// The other half of "Vos combats prioritaires": what each party says it fights
// for, read in its own programme and linked to it. A declared fight is not a
// position: it says what a party talks about, not which side it takes, and it
// never enters the score. Every party is shown the same way, from the same
// kind of document, which is the whole point of having replaced an expert
// panel that covered only twenty-two of them.

interface PartyFightsPanelProps {
    parties: PoliticalParty[];
    priorities: readonly DimensionKey[];
}

export default function PartyFightsPanel({ parties, priorities }: PartyFightsPanelProps) {
    return (
        <details
            data-fights-panel
            className="mb-4 rounded-xl border border-[var(--color-border-light)] bg-white px-4 py-3"
        >
            <summary className="min-h-[44px] cursor-pointer list-none py-1 text-sm font-semibold text-[var(--color-text)] sm:min-h-0">
                Les combats déclarés des partis
                <span className="ml-2 text-xs font-normal text-[var(--color-text-muted)]">
                    déplier
                </span>
            </summary>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                Pour chaque parti, ce qu&apos;il met lui-même en avant, dans l&apos;ordre où son
                programme le présente, avec le document en lien pour vérifier. Un combat déclaré dit
                de quoi un parti parle, jamais quel camp il défend, et n&apos;entre pas dans le
                calcul des scores. Quand vous nommez vos combats plus haut, ceux qui tombent dans
                les mêmes dimensions sont marqués.
            </p>
            <div className="mt-3 space-y-2">
                {parties.map((party) => {
                    const entry = fightsFor(party.id);
                    if (entry === null) return null;
                    return (
                        <div
                            key={party.id}
                            data-fights-row
                            className="rounded-lg border border-[var(--color-border-light)] px-3 py-2"
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-[var(--color-text)]">
                                    {party.name}
                                </span>
                                <span className="rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)]">
                                    {SOURCE_STATUS_LABELS[entry.status]}
                                </span>
                            </div>
                            <ul className="mt-2 space-y-2">
                                {entry.fights.map((fight) => {
                                    const named = fightInPriorities(fight, priorities);
                                    return (
                                        <li
                                            key={fight.theme}
                                            className={`rounded-lg border px-3 py-2 text-xs ${
                                                named
                                                    ? 'border-emerald-500 bg-emerald-50'
                                                    : 'border-[var(--color-border-light)]'
                                            }`}
                                        >
                                            <span className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-semibold text-[var(--color-text)]">
                                                    {fight.theme}
                                                </span>
                                                {named && (
                                                    <span className="rounded border border-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                                                        dans vos priorités
                                                    </span>
                                                )}
                                                {fight.dimensions.length === 0 && (
                                                    <span className="rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)]">
                                                        hors questionnaire
                                                    </span>
                                                )}
                                            </span>
                                            <p className="mt-1 text-[var(--color-text-secondary)]">
                                                {fight.claim}
                                            </p>
                                            {fight.quote !== undefined && (
                                                <p className="mt-1 border-l-2 border-[var(--color-border)] pl-2 italic text-[var(--color-text-muted)]">
                                                    «&nbsp;{fight.quote}&nbsp;»
                                                </p>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                            <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                                Source&nbsp;:{' '}
                                <a
                                    href={entry.source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"
                                >
                                    {entry.source.label}
                                </a>{' '}
                                ({entry.source.year})
                            </p>
                        </div>
                    );
                })}
            </div>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                Limite dite clairement&nbsp;: un combat marqué «&nbsp;hors questionnaire&nbsp;» est
                un sujet que le parti porte et sur lequel aucun des énoncés ne vous a interrogé. Il
                ne peut donc jamais rejoindre vos priorités, et cela ne dit rien du parti.
            </p>
        </details>
    );
}
