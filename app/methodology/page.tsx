import type { Metadata } from 'next';
import Link from 'next/link';
import { STATEMENTS } from '@/data/statements';
import { PARTIES } from '@/data/parties';
import { MEASURES } from '@/data/measures';
import { DATA_VERSIONS, DATA_LAST_REVIEW } from '@/data/versions';

export const metadata: Metadata = {
    title: 'Méthodologie - Le Crible Politique',
    description:
        "Comment fonctionne Le Crible Politique: énoncés audités, formule de calcul publique et recalculable à la main, positions de partis sourcées avec statuts, fiches juridiques sans verdict, place exacte de l'IA, limites connues."
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl border border-[var(--color-border-light)] bg-white p-6 sm:p-8">
            <h2 className="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
                {title}
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{children}</div>
        </section>
    );
}

export default function MethodologyPage() {
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
                        Méthodologie
                    </h1>
                    <div className="w-24" />
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
                <div className="space-y-6">
                    <p className="text-lg text-[var(--color-text-secondary)]">
                        Un outil politique n&apos;est crédible que si l&apos;on peut vérifier comment il
                        fonctionne et le contester point par point. Voici exactement comment celui-ci
                        fonctionne, ce qu&apos;il sait faire, et ce qu&apos;il ne sait pas faire.
                    </p>

                    <Section title="1. Ce que l'outil est, et n'est pas">
                        <p>
                            <strong className="text-[var(--color-text)]">Un miroir, pas un juge.</strong>{' '}
                            L&apos;outil reflète vos positions et les met en regard de positions documentées.
                            Il ne vous dit pas pour qui voter, ne qualifie jamais vos opinions de bonnes ou
                            mauvaises, et ne prétend pas connaître vos &quot;vrais intérêts&quot; mieux que
                            vous: voter selon ses valeurs plutôt que son intérêt matériel est un choix
                            parfaitement légitime (Sen, 1977; Haidt, 2012).
                        </p>
                        <p>
                            <strong className="text-[var(--color-text)]">Proximité n&apos;est pas consigne.</strong>{' '}
                            Un score de proximité mesure la distance entre vos réponses et les positions
                            documentées d&apos;un parti. Il ne capture ni la crédibilité, ni la compétence,
                            ni l&apos;importance que vous accordez à chaque sujet.
                        </p>
                    </Section>

                    <Section title="2. Les énoncés">
                        <p>
                            {STATEMENTS.length} énoncés couvrent 7 dimensions (pouvoir, économie,
                            géopolitique, société, environnement, connaissance, morale politique), dont un
                            sous-ensemble express de 12 couvrant les 7 dimensions. Trois règles
                            d&apos;écriture auditables, inspirées de la recherche sur les outils d&apos;aide
                            au vote (Garzia &amp; Marschall):
                        </p>
                        <ul className="list-disc space-y-1 pl-5">
                            <li>une seule proposition par énoncé (pas de question double);</li>
                            <li>
                                un vocabulaire neutre: chaque énoncé doit pouvoir être lu sans gêne par un
                                partisan comme par un opposant (test du &quot;Turing test idéologique&quot;);
                            </li>
                            <li>
                                un équilibre des polarités: être &quot;d&apos;accord&quot; ne correspond pas
                                systématiquement au même bord politique.
                            </li>
                        </ul>
                        <p>
                            Réponses sur 5 positions, ou &quot;sans opinion&quot; (exclu du calcul, jamais
                            pénalisé). Pas de slider pré-positionné: un curseur par défaut sur
                            &quot;neutre&quot; crée un biais de réponse documenté.
                        </p>
                    </Section>

                    <Section title="3. La formule de calcul (publique et recalculable à la main)">
                        <p>Positions sur une échelle de -2 à +2. Pour chaque parti:</p>
                        <pre className="overflow-x-auto rounded-xl bg-[var(--color-bg-elevated)] p-4 text-xs text-[var(--color-text)]">
{`accord(énoncé) = 1 - |votre position - position du parti| / 4
score(parti)   = moyenne des accords sur les énoncés où
                 (a) vous vous êtes positionné, et
                 (b) la position du parti est documentée`}
                        </pre>
                        <p>
                            Aucun aléatoire, aucun modèle opaque: mêmes réponses, même résultat. Exemple de
                            vérification: vous répondez +2, le parti est codé -1, l&apos;accord vaut
                            1 - 3/4 = 0,25. En dessous de 10 énoncés comparables, le score est marqué
                            &quot;couverture faible&quot;. Les archétypes par dimension utilisent la même
                            formule de similarité face à des &quot;signatures&quot; de courants de pensée,
                            publiées et contestables.
                        </p>
                    </Section>

                    <Section title="4. Le positionnement des partis">
                        <p>
                            {PARTIES.length} partis (France et Belgique, partis francophones et flamands)
                            sont positionnés sur chaque énoncé. Critère d&apos;inclusion publié: partis
                            disposant d&apos;au moins un élu au parlement national ou européen, plus deux
                            exceptions documentées (UPR, Les Patriotes) dont les propositions
                            institutionnelles singulières sont analysées dans l&apos;observatoire. Tout
                            parti non listé peut demander son inclusion; la demande et la réponse sont
                            publiées.
                        </p>
                        <p>Chaque position porte un statut visible dans les résultats:</p>
                        <ul className="list-disc space-y-1 pl-5">
                            <li>
                                <strong className="text-[var(--color-text)]">Source vérifiée</strong>: citation
                                précise, datée et reliée, relue par plusieurs codeurs;
                            </li>
                            <li>
                                <strong className="text-[var(--color-text)]">Codage préliminaire</strong>:
                                position attribuée d&apos;après les programmes et prises de position
                                publiques, en attente de double codage contradictoire;
                            </li>
                            <li>
                                <strong className="text-[var(--color-text)]">Non documenté</strong>: le parti
                                n&apos;est pas évalué sur cet énoncé (jamais de valeur inventée).
                            </li>
                        </ul>
                        <p>
                            <strong className="text-[var(--color-text)]">État actuel: l&apos;intégralité du
                            codage est préliminaire.</strong> La feuille de route de fiabilisation (double
                            codage par des relecteurs de sensibilités différentes, auto-positionnement
                            proposé aux partis, publication des écarts) est notre document de gouvernance.
                            En complément, le positionnement académique {DATA_VERSIONS.ches.label}{' '}
                            (Jolly et al., 609 politistes) sert de référence de validation externe.
                        </p>
                    </Section>

                    <Section title="5. Les fiches de faisabilité (l'observatoire)">
                        <p>
                            {MEASURES.length} fiches analysent les mesures phares du débat, des oppositions
                            comme du gouvernement. Jamais de verdict &quot;faisable / infaisable&quot;:
                            chaque fiche sépare ce qui est juridiquement établi de ce qui est débattu entre
                            juristes, cite ses normes et sources (EUR-Lex, Conseil constitutionnel...),
                            liste les voies de mise en œuvre identifiées, y compris celles défendues par
                            les partisans de la mesure, et affiche un niveau d&apos;incertitude.
                        </p>
                        <p>
                            Statut actuel: fiches préliminaires en attente de validation par des juristes
                            extérieurs nommés. En cas de désaccord entre relecteurs, le point bascule en
                            &quot;débattu&quot; avec les deux lectures: le désaccord d&apos;experts est un
                            contenu, pas un échec.
                        </p>
                    </Section>

                    <Section title="6. Les modules optionnels">
                        <p>
                            <strong className="text-[var(--color-text)]">Fondations morales</strong>: 12 items
                            adaptés du Moral Foundations Questionnaire (Haidt et al.). Il n&apos;y a pas de
                            bon ou de mauvais profil moral.
                        </p>
                        <p>
                            <strong className="text-[var(--color-text)]">Impact sur votre portefeuille</strong>:
                            estimation en €/mois des mesures phares selon votre situation, fondée sur les
                            barèmes publiés et les chiffrages {DATA_VERSIONS.insee.label} / IPP / OFCE. Ce
                            sont des estimations étiquetées comme telles, pas des prédictions. C&apos;est le
                            seul endroit du produit qui demande des données socio-économiques: utilisées
                            localement, jamais transmises, jamais requises pour le test.
                        </p>
                    </Section>

                    <Section title="7. La place de l'intelligence artificielle">
                        <p>
                            <strong className="text-[var(--color-text)]">L&apos;IA n&apos;intervient jamais dans
                            le calcul de vos résultats</strong>: il n&apos;existe aucun appel à un modèle
                            pendant l&apos;utilisation de l&apos;outil. Elle est utilisée en amont, comme
                            assistante de fabrication des données (brouillons de codage, brouillons de
                            fiches, audits de neutralité), toujours sous validation humaine et avec statut
                            visible. Nos prompts, notre charte d&apos;usage et le registre des usages réels
                            sont publiés dans un dépôt public dédié (&quot;transparence-ia&quot;). Le jeu de
                            données initial a été produit avec une assistance IA importante: c&apos;est dit,
                            daté et tracé.
                        </p>
                    </Section>

                    <Section title="8. Transparence et contestation">
                        <p>
                            Le code source n&apos;est pas public, et nous le disons clairement. En revanche,
                            tout ce qui détermine vos résultats l&apos;est: les énoncés, les positions des
                            partis avec sources et statuts, les signatures des courants, la formule (assez
                            simple pour être recalculée à la main) et le journal des modifications de
                            données. Toute position, énoncé ou fiche peut être contesté, source à
                            l&apos;appui: réponse motivée sous 14 jours, correction consignée publiquement.
                            Données et méthodologie sont publiées sous licence CC BY 4.0.
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                            Dernière revue éditoriale des données:{' '}
                            {new Date(DATA_LAST_REVIEW + 'T00:00:00').toLocaleDateString('fr-FR')}.
                        </p>
                    </Section>

                    <Section title="9. Limites connues">
                        <ul className="list-disc space-y-1 pl-5">
                            <li>{STATEMENTS.length} énoncés ne couvrent pas tout le champ politique.</li>
                            <li>
                                Les positions des partis évoluent; chaque codage référence un programme daté
                                et peut être périmé.
                            </li>
                            <li>
                                Le score ne pondère pas (encore) l&apos;importance que vous accordez à chaque
                                sujet.
                            </li>
                            <li>
                                Les profils synthétiques sont une simplification assumée, conçue pour la
                                discussion, pas pour l&apos;assignation; en cas de correspondances multiples,
                                l&apos;ordre de la liste publiée tranche.
                            </li>
                            <li>
                                Les estimations d&apos;impact en euros dépendent de barèmes simplifiés et
                                d&apos;hypothèses non modélisées.
                            </li>
                        </ul>
                    </Section>

                    <div className="text-center">
                        <Link
                            href="/test"
                            className="inline-block rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-light)]"
                        >
                            Faire le test (3 min)
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
