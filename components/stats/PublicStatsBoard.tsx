'use client';

import { useEffect, useState } from 'react';
import { fetchPublicStats, PublicStats } from '@/lib/cribleApi';
import { ANALYSIS_CORPUS_SIZE } from '@/lib/analysisStatEvent';
import { COUNTRY_LABELS } from '@/lib/electoralScope';
import { partyLabelOf } from '@/lib/partyLabel';
import type { Country } from '@/types/positions';

// The live public counters: how many analyses the tool has run, and which
// parties come out on top, weighted by how much of the corpus each run
// answered. Everything shown here is an aggregate the server keeps without
// per-event rows, which is why this board can be public at all.

const REFRESH_EVERY_MS = 30_000;

type Board =
    | { status: 'loading' }
    | { status: 'unavailable' }
    | { status: 'ready'; stats: PublicStats };

export default function PublicStatsBoard() {
    const [board, setBoard] = useState<Board>({ status: 'loading' });

    useEffect(() => {
        let disposed = false;
        const refresh = async () => {
            const stats = await fetchPublicStats();
            if (disposed) return;
            setBoard(stats === null ? { status: 'unavailable' } : { status: 'ready', stats });
        };
        void refresh();
        const timer = setInterval(() => void refresh(), REFRESH_EVERY_MS);
        return () => {
            disposed = true;
            clearInterval(timer);
        };
    }, []);

    if (board.status === 'loading') {
        return (
            <p className="text-center text-sm text-[var(--color-text-muted)]">
                Chargement des statistiques…
            </p>
        );
    }

    if (board.status === 'unavailable') {
        return (
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 text-center">
                <p className="text-sm text-[var(--color-text-secondary)]">
                    Les statistiques sont momentanément indisponibles. Elles reviendront
                    d&apos;elles-mêmes: rien n&apos;est perdu, les compteurs vivent côté serveur.
                </p>
            </div>
        );
    }

    const { stats } = board;
    return (
        <div className="space-y-8">
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 text-center">
                <p className="font-[family-name:var(--font-heading)] text-5xl font-bold text-[var(--color-primary)]">
                    {stats.totalAnalyses.toLocaleString('fr-FR')}
                </p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    analyses réalisées avec l&apos;outil
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Actualisé en continu · dernier relevé{' '}
                    {new Date(stats.generatedAt).toLocaleTimeString('fr-FR')}
                </p>
            </div>

            {(['FR', 'BE'] as Country[]).map((country) => (
                <CountryBoard key={country} country={country} stats={stats} />
            ))}

            <div className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-bg-subtle,#f8f8f8)] p-5 text-xs leading-relaxed text-[var(--color-text-muted)]">
                <p className="font-semibold text-[var(--color-text-secondary)]">Comment lire ces chiffres</p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                    <li>
                        Chaque analyse pèse sa part du corpus: une passe express (15 énoncés
                        sur {ANALYSIS_CORPUS_SIZE}) compte pour 15/{ANALYSIS_CORPUS_SIZE}
                        {' '}d&apos;une passe intégrale.
                    </li>
                    <li>
                        Quand plusieurs partis sont ex æquo en tête, le poids de l&apos;analyse
                        se partage entre eux: personne n&apos;est gonflé par une égalité.
                    </li>
                    <li>
                        Le serveur n&apos;enregistre que ces compteurs agrégés: aucune réponse,
                        aucune adresse IP, aucun horodatage individuel, aucun lien avec un compte.
                    </li>
                </ul>
            </div>
        </div>
    );
}

function CountryBoard({ country, stats }: { country: Country; stats: PublicStats }) {
    const countryStats = stats.countries[country];
    const ranked = [...countryStats.leaders].sort((a, b) => b.weightSum - a.weightSum);
    return (
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
            <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
                    {COUNTRY_LABELS[country]}
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                    {countryStats.analyses.toLocaleString('fr-FR')} analyses
                </p>
            </div>
            {ranked.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--color-text-muted)]">
                    Pas encore assez d&apos;analyses pour afficher une répartition.
                </p>
            ) : (
                <ul className="mt-5 space-y-4">
                    {ranked.map((leader) => (
                        <LeaderBar
                            key={leader.partyId}
                            name={partyLabelOf(leader.partyId)}
                            share={countryStats.weightSum > 0 ? leader.weightSum / countryStats.weightSum : 0}
                            timesLed={leader.timesLed}
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}

function LeaderBar({ name, share, timesLed }: { name: string; share: number; timesLed: number }) {
    const percent = Math.round(share * 100);
    return (
        <li>
            <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-[var(--color-text)]">{name}</span>
                <span className="font-semibold text-[var(--color-primary)]">{percent} %</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--color-border-light)]">
                <div
                    className="h-full rounded-full bg-[var(--color-accent)]"
                    style={{ width: `${Math.min(percent, 100)}%` }}
                />
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                en tête de {timesLed.toLocaleString('fr-FR')} analyses
            </p>
        </li>
    );
}
