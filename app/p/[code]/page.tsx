import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { identityFromShareCode } from '@/lib/badgeCode';
import { familyCompositionOf } from '@/lib/familyComposition';
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
        description: `"${identity.syntheticProfile?.tagline ?? 'Un profil qui ne rentre dans aucune case.'}" Et toi, où te situes-tu ? Fais le test en 3 minutes: le calcul se fait dans ton navigateur.`
    };
}

export default async function SharedProfilePage({ params }: PageProps) {
    const { code } = await params;
    const identity = identityFromShareCode(code);
    if (!identity) notFound();

    const synth = identity.syntheticProfile;
    // Everything these dominant currents do not separate from the family shown.
    const alsoInGroup = identity.leadingGroup.slice(1);
    // What the shown family is made of: the card must not display a title as if
    // it came from nowhere while the results page explains its composition.
    const composition = synth ? familyCompositionOf(synth) : null;

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <header className="border-b border-[var(--color-border-light)] bg-white/95">
                <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-4">
                    <Link
                        href="/"
                        className="inline-flex min-h-[44px] items-center font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)] sm:min-h-0"
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
                        {alsoInGroup.length > 0 && (
                            <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-text-secondary)]">
                                {alsoInGroup.length === 1
                                    ? 'Une autre famille colle'
                                    : `${alsoInGroup.length} autres familles collent`}{' '}
                                autant à ces réponses:{' '}
                                {alsoInGroup.map((family, index) => (
                                    <span key={family.id}>
                                        {index > 0 &&
                                            (index === alsoInGroup.length - 1 ? ' et ' : ', ')}
                                        <span className="font-semibold text-[var(--color-text)]">
                                            {family.title}
                                        </span>
                                    </span>
                                ))}
                                . Le titre ci-dessus est la plus proche, pas un verdict.
                            </p>
                        )}
                        {composition && (
                            <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-text-secondary)]">
                                Cette famille se définit par une combinaison de courants sur les 7
                                dimensions: chaque case ci-dessous montre le courant de ce profil
                                et, en dessous, ce que la famille attend là.
                            </p>
                        )}
                    </div>

                    <div className="grid gap-3 text-left sm:grid-cols-2">
                        {DIMENSION_ORDER.map((dim) => {
                            const label = identity.dimensionLabels[dim];
                            if (!label) return null;
                            const expected = composition?.constrained.find(
                                (reading) => reading.dimension === dim
                            )?.expected;
                            return (
                                <div key={dim} className="rounded-xl border border-[var(--color-border-light)] bg-white p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                                        {DIMENSION_LABELS[dim]}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                                        {label}
                                    </p>
                                    {expected && (
                                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                            La famille attend: {expected.join(' ou ')}
                                        </p>
                                    )}
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
