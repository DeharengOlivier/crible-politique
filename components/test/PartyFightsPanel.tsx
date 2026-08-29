'use client';

import type { DimensionKey } from '@/types/positions';
import { DIMENSION_LABELS } from '@/types/positions';
import type { PoliticalParty } from '@/types/archetypes';
import { SALIENCE_THEME_LABELS } from '@/data/partySalience';
import { fightInPriorities, topDeclaredFights } from '@/lib/partyFights';

// The other half of "Vos combats prioritaires": what each party itself fights
// for. Salience is direction-neutral, so this panel never says which side a
// party takes, only how central a theme is in its own public stance. Measured
// values come from CHES 2024; the two parties CHES does not cover show their
// program's declared fight, marked as a documented estimate.

const CHES_URL = 'https://www.chesdata.eu/2024-chapel-hill-expert-survey-ches';

function frenchValue(value: number): string {
    return value.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

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
                Pour chaque parti, les trois thèmes les plus centraux de son discours public,
                mesurés par le panel d&apos;experts{' '}
                <a
                    href={CHES_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                >
                    CHES 2024
                </a>{' '}
                (saillance de 0 à 10). La saillance dit ce dont un parti parle, pas le camp
                qu&apos;il défend. Quand vous nommez vos combats ci-dessus, les thèmes qui y
                tombent sont marqués.
            </p>
            <div className="mt-3 space-y-2">
                {parties.map((party) => {
                    const fights = topDeclaredFights(party.id);
                    if (fights.length === 0) return null;
                    const estimated = fights[0].source === 'Estimation documentée';
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
                                {estimated && (
                                    <span className="rounded border border-amber-400 px-1.5 py-0.5 text-[10px] text-amber-600">
                                        Estimation documentée
                                    </span>
                                )}
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {fights.map((fight) => (
                                    <span
                                        key={fight.theme}
                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                                            fightInPriorities(fight.theme, priorities)
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                                : 'border-[var(--color-border-light)] text-[var(--color-text-secondary)]'
                                        }`}
                                    >
                                        <span>
                                            {fight.detail ?? SALIENCE_THEME_LABELS[fight.theme]}
                                        </span>
                                        {fight.value !== null && (
                                            <span className="font-semibold tabular-nums">
                                                {frenchValue(fight.value)}/10
                                            </span>
                                        )}
                                        {fightInPriorities(fight.theme, priorities) && (
                                            <span className="font-semibold">
                                                dans vos priorités
                                            </span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                Limite dite clairement&nbsp;: le CHES ne mesure aucune saillance pour les
                dimensions {DIMENSION_LABELS.knowledge} et {DIMENSION_LABELS.moral}. Un combat
                nommé dans ces deux dimensions ne peut donc marquer aucun thème ici, sans que
                cela dise quoi que ce soit des partis.
            </p>
        </details>
    );
}
