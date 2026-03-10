import type { Metadata } from 'next';
import Link from 'next/link';
import { MEASURES } from '@/data/measures';
import FicheCard from '@/components/crible/FicheCard';

export const metadata: Metadata = {
    title: "L'observatoire - Le Crible Politique",
    description:
        "Les mesures phares du débat politique au crible du droit: ce qui est établi, ce qui est débattu, les obstacles norme par norme et les voies possibles. Jamais de verdict."
};

export default function CriblePage() {
    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <header className="sticky top-0 z-10 border-b border-[var(--color-border-light)] bg-white/95 backdrop-blur-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <Link
                        href="/"
                        className="text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
                    >
                        ← Le Crible Politique
                    </Link>
                    <h1 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)]">
                        L&apos;observatoire
                    </h1>
                    <div className="w-24" />
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                <div className="mb-8 space-y-3 text-center">
                    <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
                        {MEASURES.length} mesures phares au crible du droit
                    </h2>
                    <p className="mx-auto max-w-2xl text-[var(--color-text-secondary)]">
                        Pour chaque mesure emblématique, des oppositions comme du gouvernement: ce qui est
                        juridiquement établi, ce qui est débattu entre juristes, les obstacles norme par
                        norme et les voies possibles. Jamais de verdict &quot;faisable / infaisable&quot;.
                    </p>
                </div>

                <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-[var(--color-text-secondary)]">
                    <strong className="text-[var(--color-text)]">Statut:</strong> fiches préliminaires
                    rédigées à partir des textes et jurisprudences citées, en attente de validation par des
                    juristes extérieurs nommés. Chaque point peut être contesté, source à l&apos;appui
                    (réponse motivée sous 14 jours), et chaque correction est consignée publiquement.{' '}
                    <Link href="/methodology" className="font-semibold text-[var(--color-primary)] hover:underline">
                        Méthodologie
                    </Link>
                </div>

                <div className="space-y-6">
                    {MEASURES.map((measure) => (
                        <FicheCard key={measure.id} measure={measure} />
                    ))}
                </div>

                <div className="mt-12 rounded-2xl border-2 border-[var(--color-primary)]/15 bg-[var(--color-bg-hero)] p-6 text-center">
                    <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)]">
                        Et vous, où vous situez-vous ?
                    </h3>
                    <Link
                        href="/test"
                        className="mt-3 inline-block rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-light)]"
                    >
                        Faire le test (3 min)
                    </Link>
                </div>
            </main>
        </div>
    );
}
