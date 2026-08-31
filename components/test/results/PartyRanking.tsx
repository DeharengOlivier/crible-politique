'use client';

import type { PartyMatch } from '@/lib/scoringEngine';
import PartyDetail from './PartyDetail';

// The ranked list itself. Every row carries its score, its confidence interval
// and its rank; the badge is reserved for the parties showing the very same
// percentage as the leader, which is a different claim from the leading group
// stated above the list.

export default function PartyRanking({ matches }: { matches: PartyMatch[] }) {
    const leaderScore = matches[0]?.score ?? 0;
    const tiedAtTop = matches.filter((match) => match.score === leaderScore);

    return (
        <div className="space-y-2">
            {matches.map((match) => (
                <details
                    key={match.party.id}
                    className="group rounded-xl border border-[var(--color-border-light)] bg-white px-4 py-3"
                >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2">
                            <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-[var(--color-text-muted)]">
                                {match.rank}
                            </span>
                            <span className="truncate text-sm font-medium text-[var(--color-text)]">
                                {match.party.name}
                            </span>
                            {tiedAtTop.length > 1 && match.score === leaderScore && (
                                <span className="rounded border border-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
                                    à égalité en tête
                                </span>
                            )}
                            {match.lowCoverage && (
                                <span className="rounded border border-amber-400 px-1.5 py-0.5 text-[10px] text-amber-600">
                                    couverture faible
                                </span>
                            )}
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                            <span className="hidden h-2 w-24 overflow-hidden rounded-full bg-[var(--color-bg-elevated)] sm:block">
                                <span
                                    className="block h-full rounded-full bg-[var(--color-primary)]"
                                    style={{ width: `${match.score}%` }}
                                />
                            </span>
                            <span className="text-right font-[family-name:var(--font-heading)] font-bold text-[var(--color-primary)]">
                                {match.score}%
                                <span className="ml-1 block text-[10px] font-normal tabular-nums text-[var(--color-text-muted)] sm:ml-2 sm:inline">
                                    {match.lowerBound}-{match.upperBound}
                                </span>
                            </span>
                        </span>
                    </summary>
                    <PartyDetail match={match} />
                </details>
            ))}
        </div>
    );
}
