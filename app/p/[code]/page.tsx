import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { identityFromShareCode } from '@/lib/badgeCode';
import { DIMENSION_LABELS, DIMENSION_ORDER } from '@/types/positions';
import { ProfileIcon } from '@/lib/icons';
import SharedProfileActions from '@/components/SharedProfileActions';

// Public page for a shared profile. Nothing is stored: the page and its
// dynamic OG image are rendered from the code in the URL.
//
// That code is a badge code, and it says only what this page displays: the
// dominant current per dimension, and the synthetic profile they imply. The
// answers behind it are not in the path, because a path is transmitted and
// they are special-category data. They travel in the fragment, which the
// browser keeps to itself, and only the client actions below ever read them.
//
// Deliberate choice: the page shows the identity (profile + dimensions),
// NEVER the party affinities (a badge is shared, an affiliation is
// exposed). The recipient is invited to take the test.


interface PageProps {
    params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { code } = await params;
    const identity = identityFromShareCode(code);
    if (!identity) return { title: 'Profil introuvable - Le Crible Politique' };
    const title = identity.syntheticProfile?.title ?? 'Profil singulier';
    return {
        title: `${title} - Le Crible Politique`,
        description: `"${identity.syntheticProfile?.tagline ?? 'Un profil qui ne rentre dans aucune case.'}" Et toi, où te situes-tu ? Fais le test en 3 minutes: tes réponses ne quittent jamais ton appareil.`
    };
}

export default async function SharedProfilePage({ params }: PageProps) {
    const { code } = await params;
    const identity = identityFromShareCode(code);
    if (!identity) notFound();

    const synth = identity.syntheticProfile;

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <header className="border-b border-[var(--color-border-light)] bg-white/95">
                <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-4">
                    <Link
                        href="/"
                        className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)]"
                    >
                        Le Crible Politique
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
                <div className="space-y-8 text-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                            Profil partagé
                        </p>
                        <div className="mt-4 flex justify-center">
                            <ProfileIcon name={synth?.icon} className="h-16 w-16 text-[var(--color-primary)]" />
                        </div>
                        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">
                            {synth?.title ?? 'Profil singulier'}
                        </h1>
                        <p className="mt-2 text-lg italic text-[var(--color-text-secondary)]">
                            &quot;{synth?.tagline ?? 'Un profil qui ne rentre dans aucune case.'}&quot;
                        </p>
                    </div>

                    <div className="grid gap-3 text-left sm:grid-cols-2">
                        {DIMENSION_ORDER.map((dim) => {
                            const label = identity.dimensionLabels[dim];
                            if (!label) return null;
                            return (
                                <div key={dim} className="rounded-xl border border-[var(--color-border-light)] bg-white p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                                        {DIMENSION_LABELS[dim]}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                                        {label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <SharedProfileActions />

                    <p className="text-xs text-[var(--color-text-muted)]">
                        Ce profil vit uniquement dans ce lien: rien n&apos;est stocké sur un serveur, et
                        les réponses qui l&apos;ont produit ne sont pas dans l&apos;adresse envoyée au
                        serveur. Méthodologie publique, calcul déterministe, jamais de consigne de vote.
                    </p>
                </div>
            </main>
        </div>
    );
}
