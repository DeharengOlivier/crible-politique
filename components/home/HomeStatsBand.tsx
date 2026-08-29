'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchPublicStats, PublicStats } from '@/lib/cribleApi';
import { COUNTRY_LABELS } from '@/lib/electoralScope';
import { partyLabelOf } from '@/lib/partyLabel';
import type { Country } from '@/types/positions';

// What the tool has measured about itself, on the home page: how many analyses
// it has run, and what those analyses concluded on average.
//
// Two rules hold this band together. Every figure is measured, so there is no
// visit counter here: reading the site sends nothing to us, and that promise is
// worth more than a number nobody can check. And an absence of measurement
// shows as an absence: no analyses yet reads as "none yet", and an unreachable
// API removes the band rather than printing a zero that looks like a result.

const TOP_PARTIES_SHOWN = 3;

export default function HomeStatsBand() {
    const [stats, setStats] = useState<PublicStats | null>(null);

    useEffect(() => {
        let disposed = false;
        void fetchPublicStats().then((snapshot) => {
            if (!disposed) setStats(snapshot);
        });
        return () => {
            disposed = true;
        };
    }, []);

    if (stats === null) return null;

    if (stats.totalAnalyses === 0) {
        return (
            <Band>
                <p className="text-lg text-[var(--color-text-secondary)]">
                    Aucune analyse enregistrée pour l&apos;instant. Le compteur est public et
                    démarre à la première.
                </p>
            </Band>
        );
    }

    return (
        <Band>
            <p className="font-[family-name:var(--font-heading)] text-6xl font-bold text-[var(--color-primary)] md:text-7xl">
                {stats.totalAnalyses.toLocaleString('fr-FR')}
            </p>
            <p className="mt-2 text-lg text-[var(--color-text-secondary)]">
                analyses réalisées avec l&apos;outil
            </p>

            <div className="mt-10 grid gap-6 text-left sm:grid-cols-2">
                {(['FR', 'BE'] as Country[]).map((country) => (
                    <CountryColumn key={country} country={country} stats={stats} />
                ))}
            </div>

            <p className="mt-8 text-sm text-[var(--color-text-muted)]">
                Ces compteurs sont agrégés et anonymes: le serveur ne garde ni réponse, ni
                adresse IP, ni horodatage individuel. Lire ce site ne déclenche aucune requête
                vers nous, et il n&apos;existe donc pas de compteur de visites.{' '}
                <Link href="/statistiques" className="font-semibold text-[var(--color-primary)] hover:underline">
                    Voir le détail
                </Link>
            </p>
        </Band>
    );
}

function Band({ children }: { children: React.ReactNode }) {
    return (
        <section
            aria-labelledby="numbers-title"
            className="rounded-3xl border border-[var(--color-border-light)] bg-white p-8 text-center shadow-sm md:p-12"
        >
            <h2
                id="numbers-title"
                className="mb-6 font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-primary)] md:text-3xl"
            >
                Ce que l&apos;outil a mesuré
            </h2>
            {children}
        </section>
    );
}

function CountryColumn({ country, stats }: { country: Country; stats: PublicStats }) {
    const countryStats = stats.countries[country];
    const ranked = [...countryStats.leaders]
        .sort((a, b) => b.weightSum - a.weightSum)
        .slice(0, TOP_PARTIES_SHOWN);

    return (
        <div className="rounded-2xl border border-[var(--color-border-light)] p-5">
            <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-[family-name:var(--font-heading)] font-semibold text-[var(--color-primary)]">
                    {COUNTRY_LABELS[country]}
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                    {countryStats.analyses.toLocaleString('fr-FR')} analyses
                </p>
            </div>

            {ranked.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--color-text-muted)]">
                    Pas encore d&apos;analyse de ce côté de la frontière.
                </p>
            ) : (
                <ul className="mt-4 space-y-3">
                    {ranked.map((leader) => {
                        const share =
                            countryStats.weightSum > 0 ? leader.weightSum / countryStats.weightSum : 0;
                        const percent = Math.round(share * 100);
                        return (
                            <li key={leader.partyId}>
                                <div className="flex items-baseline justify-between gap-3 text-sm">
                                    <span className="font-medium text-[var(--color-text)]">
                                        {partyLabelOf(leader.partyId)}
                                    </span>
                                    <span className="font-semibold text-[var(--color-primary)]">
                                        {percent} %
                                    </span>
                                </div>
                                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--color-border-light)]">
                                    <div
                                        className="h-full rounded-full bg-[var(--color-accent)]"
                                        style={{ width: `${Math.min(percent, 100)}%` }}
                                    />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
