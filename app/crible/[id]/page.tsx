import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MEASURES } from '@/data/measures';
import FicheCard from '@/components/crible/FicheCard';

// One URL per sheet: the press and social format (one link = one analysis),
// server-rendered for SEO.

interface PageProps {
    params: Promise<{ id: string }>;
}

export function generateStaticParams() {
    return MEASURES.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const measure = MEASURES.find((m) => m.id === id);
    if (!measure) return { title: 'Analyse introuvable - Le Crible Politique' };
    return {
        title: `${measure.title} : que dit le droit ? - Le Crible Politique`,
        description: `${measure.claim} Ce qui est établi, ce qui est débattu, les obstacles et les voies possibles, sources à l'appui. Sans verdict.`
    };
}

export default async function FichePage({ params }: PageProps) {
    const { id } = await params;
    const measure = MEASURES.find((m) => m.id === id);
    if (!measure) notFound();

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <header className="sticky top-0 z-10 border-b border-[var(--color-border-light)] bg-white/95 backdrop-blur-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <Link
                        href="/crible"
                        className="text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
                    >
                        ← Toutes les analyses
                    </Link>
                    <h1 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)]">
                        L&apos;observatoire
                    </h1>
                    <div className="w-24" />
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                <FicheCard measure={measure} standalone />

                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-[var(--color-text-secondary)]">
                    Fiche préliminaire en attente de validation par des juristes extérieurs. Pour
                    contester un point, source à l&apos;appui: réponse motivée sous 14 jours.{' '}
                    <Link href="/methodology" className="font-semibold text-[var(--color-primary)] hover:underline">
                        Méthodologie
                    </Link>
                </div>

                <div className="mt-8 text-center">
                    <Link
                        href="/test"
                        className="inline-block rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-light)]"
                    >
                        Et vous, où vous situez-vous ? Faire le test (3 min)
                    </Link>
                </div>
            </main>
        </div>
    );
}
