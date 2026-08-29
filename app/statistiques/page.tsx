import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import PublicStatsBoard from '@/components/stats/PublicStatsBoard';

export const metadata: Metadata = {
    title: 'Statistiques publiques | Le Crible Politique',
    description:
        "Combien d'analyses l'outil a réalisées et quels partis arrivent en tête, " +
        'en temps réel, à partir de compteurs anonymes agrégés.'
};

export default function StatistiquesPage() {
    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <PageHeader title="Statistiques publiques" />
            <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
                <p className="mb-8 text-center text-sm text-[var(--color-text-secondary)]">
                    Ce que l&apos;outil sait dire de lui-même, et rien de plus: le nombre
                    d&apos;analyses réalisées et les partis qui en sortent en tête. Ces compteurs
                    sont anonymes, agrégés et publics: la même page pour tout le monde,
                    y compris pour nous.
                </p>
                <PublicStatsBoard />
            </main>
        </div>
    );
}
