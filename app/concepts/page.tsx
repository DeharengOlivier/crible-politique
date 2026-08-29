import type { Metadata } from 'next';
import Link from 'next/link';
import { DIMENSIONS, DEFINITIONS } from '@/data/definitions';
import { SYNTHETIC_PROFILES } from '@/data/syntheticProfiles';
import { familyCompositionOf } from '@/lib/familyComposition';
import { ProfileIcon } from '@/lib/icons';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
    title: 'Comprendre les concepts - Le Crible Politique',
    description:
        'Glossaire des 7 dimensions, des courants de pensée et des profils synthétiques utilisés par Le Crible Politique. Chaque description est rédigée pour pouvoir être revendiquée par un partisan sincère du courant décrit.'
};

export default function ConceptsPage() {
    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <PageHeader title="Les concepts" />

            <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                <p className="mb-8 text-lg text-[var(--color-text-secondary)]">
                    Le glossaire des dimensions, courants de pensée et profils utilisés dans vos
                    résultats. Règle d&apos;écriture auditée: chaque description est rédigée à la voix
                    du partisan sincère du courant décrit; aucun label ne fonctionne comme une insulte
                    ou un diagnostic.
                </p>

                <h2 className="mb-5 font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-primary)]">
                    Les 7 dimensions et leurs courants
                </h2>
                <div className="space-y-8">
                    {(Object.keys(DIMENSIONS) as (keyof typeof DIMENSIONS)[]).map((key) => {
                        const dim = DIMENSIONS[key];
                        const defs = DEFINITIONS[key as keyof typeof DEFINITIONS] ?? {};
                        return (
                            <section key={key} id={key}>
                                <div className="mb-3 flex items-center gap-3">
                                    <span className={`h-8 w-1.5 rounded-full ${dim.color}`} />
                                    <div>
                                        <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-text)]">
                                            {dim.title}
                                        </h3>
                                        <p className="text-sm text-[var(--color-text-muted)]">{dim.description}</p>
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {Object.entries(defs).map(([label, description]) => (
                                        <div
                                            key={label}
                                            className="rounded-xl border border-[var(--color-border-light)] bg-white p-4"
                                        >
                                            <p className="text-sm font-semibold text-[var(--color-primary)]">{label}</p>
                                            <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                                                {description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                <h2 className="mb-5 mt-12 font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-primary)]">
                    Les profils synthétiques
                </h2>
                <p className="mb-5 text-sm text-[var(--color-text-secondary)]">
                    Le profil affiché en haut de vos résultats n&apos;est pas une huitième dimension:
                    chaque famille est une <strong className="text-[var(--color-text)]">combinaison</strong>{' '}
                    nommée de un à trois courants ci-dessus, et ne dit rien des autres dimensions. Sa
                    composition exacte figure sur chaque carte. Plusieurs familles peuvent coller
                    également à vos réponses: vos résultats les nomment toutes plutôt que d&apos;en
                    désigner une seule.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                    {SYNTHETIC_PROFILES.map((profile) => {
                        const composition = familyCompositionOf(profile);
                        return (
                        <div
                            key={profile.id}
                            id={profile.id}
                            className="scroll-mt-24 rounded-2xl border border-[var(--color-border-light)] bg-white p-5"
                        >
                            <div
                                className="flex h-11 w-11 items-center justify-center rounded-xl"
                                style={{ backgroundColor: `${profile.accent}14`, color: profile.accent }}
                            >
                                <ProfileIcon name={profile.icon} className="h-6 w-6" />
                            </div>
                            <p className="mt-2 font-[family-name:var(--font-heading)] font-semibold text-[var(--color-primary)]">
                                {profile.title}
                            </p>
                            <p className="text-xs italic text-[var(--color-text-muted)]">&quot;{profile.tagline}&quot;</p>
                            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                                {profile.description}
                            </p>
                            <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                                <span className="font-semibold text-emerald-700">Leviers:</span>{' '}
                                {profile.strategy}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                                <span className="font-semibold text-amber-700">Vigilance:</span>{' '}
                                {profile.weakness}
                            </p>
                            <div className="mt-3 space-y-1 border-t border-[var(--color-border-light)] pt-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                                    Composition
                                </p>
                                {composition.constrained.map((reading) => (
                                    <p key={reading.dimension} className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                                        <span className="font-semibold text-[var(--color-text)]">
                                            {DIMENSIONS[reading.dimension].title}:
                                        </span>{' '}
                                        {reading.expected.join(' ou ')}
                                    </p>
                                ))}
                                <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
                                    Ne dit rien sur:{' '}
                                    {composition.silent.map((d) => DIMENSIONS[d].title).join(', ')}.
                                </p>
                            </div>
                        </div>
                        );
                    })}
                </div>

                <div className="mt-10 text-center">
                    <Link
                        href="/test"
                        className="inline-block rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-light)]"
                    >
                        Découvrir mon profil (3 min)
                    </Link>
                </div>
            </main>
        </div>
    );
}
