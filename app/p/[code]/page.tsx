import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { decodeAnswers } from '@/lib/profileCode';
import { computeProfile } from '@/lib/scoringEngine';
import { DIMENSION_LABELS, DIMENSION_ORDER } from '@/types/positions';
import { ProfileIcon } from '@/lib/icons';

// Public page for a shared profile. The profile lives in the URL itself:
// no server storage, the dynamic OG image is generated from the code.
// Deliberate choice: the page shows the identity (profile + dimensions),
// NEVER the party affinities (a badge is shared, an affiliation is
// exposed). The recipient is invited to take the test.


interface PageProps {
    params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { code } = await params;
    const answers = decodeAnswers(code);
    if (!answers) return { title: 'Profil introuvable - Le Crible Politique' };
    const profile = computeProfile(answers);
    const title = profile.syntheticProfile?.title ?? 'Profil singulier';
    return {
        title: `${title} - Le Crible Politique`,
        description: `"${profile.syntheticProfile?.tagline ?? 'Un profil qui ne rentre dans aucune case.'}" Et toi, où te situes-tu ? Fais le test en 3 minutes: tes réponses ne quittent jamais ton appareil.`
    };
}

export default async function SharedProfilePage({ params }: PageProps) {
    const { code } = await params;
    const answers = decodeAnswers(code);
    if (!answers) notFound();

    const profile = computeProfile(answers);
    const synth = profile.syntheticProfile;

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
                            const archetype = profile.dimensionArchetypes[dim];
                            if (!archetype) return null;
                            return (
                                <div key={dim} className="rounded-xl border border-[var(--color-border-light)] bg-white p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                                        {DIMENSION_LABELS[dim]}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                                        {archetype.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="space-y-3">
                        <Link
                            href="/test"
                            className="block w-full rounded-xl bg-[var(--color-primary)] px-6 py-4 text-lg font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[var(--color-primary-light)]"
                        >
                            Et toi, où te situes-tu ? Fais le test (3 min)
                        </Link>
                        <Link
                            href={`/compare?a=${code}`}
                            className="block w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-6 py-3.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/40"
                        >
                            Faire le test et comparer nos profils
                        </Link>
                        <Link
                            href={`/test?p=${code}`}
                            className="block text-xs text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-primary)] hover:underline"
                        >
                            C&apos;est mon profil: voir mes résultats complets
                        </Link>
                    </div>

                    <p className="text-xs text-[var(--color-text-muted)]">
                        Ce profil vit uniquement dans ce lien: rien n&apos;est stocké sur un serveur.
                        Méthodologie publique, calcul déterministe, jamais de consigne de vote.
                    </p>
                </div>
            </main>
        </div>
    );
}
