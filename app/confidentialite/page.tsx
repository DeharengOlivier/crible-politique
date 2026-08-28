import Link from 'next/link';
import ClearLocalDataButton from '@/components/ClearLocalDataButton';
import PageHeader from '@/components/PageHeader';

// Privacy as an architectural property, not as a promise.
// Political opinions are sensitive data (art. 9 GDPR):
// our answer is to not collect them at all. Page served server-side;
// only the clear button is a client island.

export default function ConfidentialitePage() {
    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <PageHeader title="Confidentialité" />

            <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
                <div className="space-y-8">
                    <div>
                        <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
                            Privé par construction, pas par promesse
                        </h2>
                        <p className="mt-2 text-lg text-[var(--color-text-secondary)]">
                            Les opinions politiques sont des données sensibles au sens de l&apos;article 9 du
                            RGPD. Notre réponse: ne pas les collecter du tout.
                        </p>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-[var(--color-border-light)] bg-white p-6 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:p-8">
                        <ul className="list-disc space-y-3 pl-5">
                            <li>
                                <strong className="text-[var(--color-text)]">Aucun compte, aucun serveur de données.</strong>{' '}
                                Vos réponses, votre profil, vos proximités partisanes: tout est calculé dans
                                votre navigateur et n&apos;en sort jamais. Il n&apos;existe pas de base de
                                données de profils, même anonymisés.
                            </li>
                            <li>
                                <strong className="text-[var(--color-text)]">L&apos;IA n&apos;intervient jamais pendant l&apos;utilisation.</strong>{' '}
                                Le calcul est une formule déterministe publiée; aucune de vos réponses n&apos;est
                                envoyée à un modèle d&apos;IA. L&apos;usage de l&apos;IA dans la fabrication des
                                données du site est documenté publiquement (charte, prompts, registre).
                            </li>
                            <li>
                                <strong className="text-[var(--color-text)]">La voix reste sur l&apos;appareil.</strong>{' '}
                                Le mode entretien utilise les capacités vocales de votre navigateur. Aucun
                                enregistrement n&apos;est transmis ni conservé, et votre voix n&apos;est jamais
                                interprétée: seule la position que vous validez compte.
                            </li>
                            <li>
                                <strong className="text-[var(--color-text)]">Le partage est un choix explicite.</strong>{' '}
                                Un lien de partage n&apos;est stocké nulle part et n&apos;existe que si vous
                                décidez de l&apos;envoyer. Il contient deux choses. L&apos;identité affichée,
                                dans le chemin de l&apos;adresse: c&apos;est tout ce que le serveur reçoit, et
                                elle ne permet pas de remonter à vos réponses. Vos réponses, après le
                                &laquo;&nbsp;#&nbsp;&raquo;: cette partie de l&apos;adresse n&apos;est jamais
                                transmise par le navigateur, elle n&apos;apparaît donc dans aucun journal de
                                serveur et n&apos;est lue que par le navigateur de votre destinataire. Ne
                                partagez le lien qu&apos;avec des personnes de confiance, comme une
                                conversation politique privée.
                            </li>
                            <li>
                                <strong className="text-[var(--color-text)]">Le simulateur d&apos;impact aussi.</strong>{' '}
                                Si vous utilisez le module &quot;impact sur mon portefeuille&quot;, votre
                                situation (revenu, patrimoine) est utilisée localement pour le calcul puis
                                oubliée. Elle n&apos;est ni transmise, ni stockée.
                            </li>
                            <li>
                                <strong className="text-[var(--color-text)]">Sauvegarde locale, effaçable.</strong>{' '}
                                Pour reprendre un test interrompu et revoir vos résultats, vos réponses sont
                                conservées dans le stockage local de votre navigateur, sur cet appareil
                                uniquement. Le site garde aussi une copie de ses pages ordinaires pour rester
                                consultable hors connexion, jamais celle d&apos;un profil partagé ni d&apos;une
                                comparaison. Le bouton efface les deux et désinstalle le mode hors ligne:
                            </li>
                        </ul>
                        <ClearLocalDataButton />
                    </div>

                    <div className="rounded-2xl border border-[var(--color-border-light)] bg-white p-6 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:p-8">
                        <h3 className="mb-3 font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)]">
                            Vérifiable sans nous croire sur parole
                        </h3>
                        <p>
                            Le code source est public, sous licence MIT:{' '}
                            <a
                                href="https://github.com/DeharengOlivier/crible-politique"
                                className="font-semibold text-[var(--color-primary)] hover:underline"
                            >
                                github.com/DeharengOlivier/crible-politique
                            </a>
                            . Vous pouvez y lire exactement ce que fait le site, et vous n&apos;avez même pas
                            besoin du code pour vérifier l&apos;essentiel: ouvrez les outils de développement de
                            votre navigateur (F12, onglet &quot;Réseau&quot;) pendant le test, et constatez
                            qu&apos;aucune requête ne transmet vos réponses. N&apos;importe qui peut faire cette
                            vérification, ou la demander à quelqu&apos;un de confiance. Et tout ce qui détermine
                            vos résultats (énoncés, positions des partis, formule) est publié:{' '}
                            <Link href="/methodology" className="font-semibold text-[var(--color-primary)] hover:underline">
                                méthodologie complète
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
