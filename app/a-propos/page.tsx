import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Qui sommes-nous - Le Crible Politique',
    description:
        "Qui porte Le Crible Politique, comment il est financé, et les engagements qui le rendent vérifiable: jamais de consigne de vote, méthodologie publique, zéro collecte de données."
};

// EDITOR NOTE: the fields in [brackets] must be filled in before any
// public launch. An anonymous political tool is indefensible: the identity
// of the publication director is a legal requirement (LCEN in France) and
// the first condition of trust.

export default function AProposPage() {
    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <header className="border-b border-[var(--color-border-light)] bg-white/95">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <Link
                        href="/"
                        className="text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
                    >
                        ← Le Crible Politique
                    </Link>
                    <h1 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)]">
                        Qui sommes-nous
                    </h1>
                    <div className="w-24" />
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
                <div className="space-y-6">
                    <p className="text-lg text-[var(--color-text-secondary)]">
                        Un outil politique qui ne dit pas qui le fait ne mérite pas votre confiance.
                        Voici qui nous sommes, comment nous travaillons et comment nous sommes financés.
                    </p>

                    <section className="rounded-2xl border border-[var(--color-border-light)] bg-white p-6 sm:p-8">
                        <h2 className="mb-3 font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
                            Le projet
                        </h2>
                        <div className="space-y-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                            <p>
                                Le Crible Politique est une initiative citoyenne indépendante, sans
                                affiliation partisane, couvrant la France et la Belgique. Son objet: aider
                                chacun à situer ses convictions et à vérifier ce que le droit permet, sans
                                jamais dire pour qui voter. Un miroir, pas un juge.
                            </p>
                            <p>
                                Le projet est porté par [VOTRE NOM], [une phrase: qui vous êtes, ce qui vous
                                qualifie, pourquoi ce projet]. Responsable de la publication: [VOTRE NOM ou
                                la structure].
                            </p>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-[var(--color-border-light)] bg-white p-6 sm:p-8">
                        <h2 className="mb-3 font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
                            Nos engagements
                        </h2>
                        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                            <li>Jamais de consigne de vote, explicite ou implicite.</li>
                            <li>
                                Aucun financement partisan, aucune publicité, aucune exploitation de données
                                (il n&apos;y a pas de données: tout se calcule dans votre navigateur).
                            </li>
                            <li>
                                Tout ce qui détermine vos résultats est public et contestable:{' '}
                                <Link href="/methodology" className="font-semibold text-[var(--color-primary)] hover:underline">
                                    méthodologie complète
                                </Link>
                                . L&apos;usage de l&apos;IA dans la fabrication des données est documenté
                                publiquement (charte, prompts, registre des usages).
                            </li>
                            <li>
                                Toute erreur signalée avec une source reçoit une réponse motivée sous 14
                                jours; les corrections sont consignées dans un journal public.
                            </li>
                        </ul>
                    </section>

                    <section className="rounded-2xl border border-[var(--color-border-light)] bg-white p-6 sm:p-8">
                        <h2 className="mb-3 font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
                            Financement
                        </h2>
                        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                            À ce jour, le projet est autofinancé par son fondateur, sans aucune source de
                            revenus. Sources acceptables à l&apos;avenir: dons individuels, subventions
                            publiques ou de fondations (publiées), partenariats médias limités à la
                            diffusion. Refusées par principe: acteurs partisans, exploitation de données,
                            publicité. Tout financement reçu sera publié sur cette page.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-[var(--color-border-light)] bg-white p-6 sm:p-8">
                        <h2 className="mb-3 font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
                            Contact et mentions légales
                        </h2>
                        <div className="space-y-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                            <p>
                                Contact (contestations, demandes d&apos;inclusion de partis, presse):
                                [ADRESSE EMAIL PUBLIQUE].
                            </p>
                            <p>
                                Éditeur: [NOM / STRUCTURE]. Directeur de la publication: [NOM]. Hébergeur:
                                [HÉBERGEUR, adresse]. Voir aussi les{' '}
                                <Link href="/legal" className="font-semibold text-[var(--color-primary)] hover:underline">
                                    mentions légales
                                </Link>
                                .
                            </p>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
