'use client';

import type { PartyMatch } from '@/lib/scoringEngine';

// What the top of the list means, said before any single name can be read as a
// winner.
//
// Two different things live here, and conflating them was a defect (2026-08-29):
// statistical inseparability is what the test says (these parties are not
// separated by these answers, whatever their percentages), while an identical
// displayed percentage is what the reader sees. They are stated separately
// because a reader reads a badge, not a test.

export interface LeadingGroupSummaryProps {
    matches: PartyMatch[];
    /** The country, and the Belgian college when one was chosen. */
    perimeter: string;
}

export default function LeadingGroupSummary({ matches, perimeter }: LeadingGroupSummaryProps) {
    const undecided = matches.filter((match) => match.inLeadingGroup);
    const leaderScore = matches[0]?.score ?? 0;
    const tiedAtTop = matches.filter((match) => match.score === leaderScore);

    return (
        <div className="mb-4 space-y-2 rounded-xl border border-[var(--color-border-light)] bg-white p-4 text-sm">
            <p className="text-[var(--color-text)]">
                Périmètre&nbsp;: <span className="font-semibold">{perimeter}</span>, {matches.length}{' '}
                partis.{' '}
                {undecided.length > 1 ? (
                    <>
                        Vos réponses{' '}
                        <span className="font-semibold">
                            ne départagent pas les {undecided.length} premiers
                        </span>{' '}
                        ({undecided.map((m) => m.party.name).join(', ')}). Comparés énoncé par
                        énoncé, aucun ne devance l&apos;autre assez systématiquement&nbsp;: les
                        classer entre eux serait lire du bruit, même si leurs pourcentages
                        diffèrent.
                    </>
                ) : (
                    <>
                        <span className="font-semibold">{matches[0]?.party.name}</span> est seul en
                        tête&nbsp;: énoncé par énoncé, vos réponses penchent systématiquement de
                        son côté face à chaque autre parti.
                    </>
                )}
                {tiedAtTop.length > 1 && (
                    <>
                        {' '}
                        {tiedAtTop.length} partis affichent{' '}
                        <span className="font-semibold">exactement le même score</span> (
                        {leaderScore}%)&nbsp;: {tiedAtTop.map((m) => m.party.name).join(', ')}.
                    </>
                )}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
                Le score est la distance moyenne entre vos réponses et celles du parti, énoncé
                par énoncé. Il favorise mécaniquement les partis codés au centre de chaque
                échelle. L&apos;échelle utile va d&apos;environ 40 à 100, pas de 0 à 100&nbsp;:
                même le pire adversaire d&apos;un répondant parfaitement cohérent reste vers 40,
                car aucun parti réel n&apos;est à l&apos;opposé exact sur chaque énoncé. Des
                scores entre 50 et 80 sont donc des écarts réels, pas des quasi-égalités.
            </p>
        </div>
    );
}
