'use client';

import { LIKERT_LABELS, SOURCE_STATUS_LABELS } from '@/types/positions';
import type { PartyMatch } from '@/lib/scoringEngine';

// Why this party sits where it sits, statement by statement. The three
// strongest convergences and the three strongest divergences, each carrying the
// respondent's own answer, the party's coded position, and the sourcing status
// of that coding: a reader who disagrees with a line can see exactly which
// coded position produced it.

const likertLabel = (value: number) => LIKERT_LABELS[String(value)] ?? String(value);

const STRONG_AGREEMENT = 0.75;
const STRONG_DISAGREEMENT = 0.25;
const SHOWN_PER_SIDE = 3;

function ComparisonList({
    title,
    tone,
    comparisons
}: {
    title: string;
    tone: 'agreement' | 'divergence';
    comparisons: PartyMatch['comparisons'];
}) {
    if (comparisons.length === 0) return null;
    const heading = tone === 'agreement' ? 'text-emerald-700' : 'text-red-700';
    const card = tone === 'agreement' ? 'bg-emerald-50' : 'bg-red-50';
    return (
        <div className="space-y-2">
            <p className={`text-sm font-semibold ${heading}`}>{title}</p>
            {comparisons.map((comparison) => (
                <div key={comparison.statement.id} className={`rounded-lg px-3 py-2 text-sm ${card}`}>
                    <p className="text-[var(--color-text)]">{comparison.statement.text}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        Vous: {likertLabel(comparison.userValue)} · Parti:{' '}
                        {likertLabel(comparison.partyValue)} · {SOURCE_STATUS_LABELS[comparison.status]}
                    </p>
                </div>
            ))}
        </div>
    );
}

export default function PartyDetail({ match }: { match: PartyMatch }) {
    // O(n log n) on the comparisons of one party, n being the corpus length.
    const sorted = [...match.comparisons].sort((a, b) => b.agreement - a.agreement);

    return (
        <div className="space-y-4 px-1 pb-2 pt-1">
            <p className="text-sm text-[var(--color-text)]">
                Vous êtes du même côté que ce parti sur{' '}
                <span className="font-semibold">{match.sameSideCount}</span> énoncés et du côté opposé
                sur <span className="font-semibold">{match.oppositeSideCount}</span>, sur les{' '}
                {match.answeredAndDocumented} où vous vous êtes positionné et où sa position est
                documentée.
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
                Proximité {match.score}%, intervalle de confiance à 90% de {match.lowerBound} à{' '}
                {match.upperBound}%.
                {match.party.program?.label ? ` Référence: ${match.party.program.label}.` : ''}
            </p>
            <ComparisonList
                title="Convergences principales"
                tone="agreement"
                comparisons={sorted.filter((c) => c.agreement >= STRONG_AGREEMENT).slice(0, SHOWN_PER_SIDE)}
            />
            <ComparisonList
                title="Divergences principales"
                tone="divergence"
                comparisons={sorted.filter((c) => c.agreement <= STRONG_DISAGREEMENT).slice(-SHOWN_PER_SIDE)}
            />
        </div>
    );
}
