import Link from 'next/link';
import ClearLocalDataButton from '@/components/ClearLocalDataButton';
import PageHeader from '@/components/PageHeader';
import { profileVaultEnabled, publicStatisticsEnabled } from '@/lib/optionalFeatures';

// Privacy as an architectural property, not as a promise.
// Political opinions are sensitive data (art. 9 GDPR):
// our answer is to not collect them at all. Page served server-side;
// only the clear button is a client island.
//
// This page describes the deployment it is served from, not the feature set
// the repository can build: a paragraph announcing a vault or a counter that
// this build never calls would be a declaration of a data flow that does not
// exist, which is the same defect as hiding one.

// The page invites the reader to open the network tab and count the calls, so
// the number it announces has to be the number this build can make. Promising
// two calls where none exist would fail the check it asks the reader to run.
function expectedApiCallsSentence(): string {
    if (profileVaultEnabled()) {
        return "Vous y verrez au plus deux appels vers notre API: le compteur anonyme de fin d'analyse (pays et partis en tête, jamais vos réponses) et, si vous sauvegardez votre profil, un bloc chiffré illisible.";
    }
    if (publicStatisticsEnabled()) {
        return "Vous y verrez au plus un appel vers notre API: le compteur anonyme de fin d'analyse (pays et partis en tête, jamais vos réponses).";
    }
    return "Vous n'y verrez aucun appel vers une API: ce déploiement n'en a aucune, le site n'est que des pages.";
}

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
                            RGPD. Notre réponse: ne jamais les collecter, et faire reposer cette
                            garantie sur l&apos;architecture plutôt que sur une promesse. Ce qui est
                            envoyé quand vous le demandez explicitement, et ce que cela implique,
                            est décrit ci-dessous sans arrondir les angles.
                        </p>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-[var(--color-border-light)] bg-white p-6 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:p-8">
                        <ul className="list-disc space-y-3 pl-5">
                            {profileVaultEnabled() ? (
                            <li>
                                <strong className="text-[var(--color-text)]">Un compte Google pour ouvrir vos résultats, aucune réponse transmise.</strong>{' '}
                                Vos réponses, votre profil, vos proximités partisanes: tout est calculé dans
                                votre navigateur, et rien n&apos;en sort: le serveur sert des pages et ne
                                reçoit jamais vos réponses. Depuis le 31 août 2026, ce déploiement demande
                                en revanche une connexion Google avant d&apos;afficher vos propres
                                résultats. Disons-le franchement: c&apos;est une décision de produit, pas
                                une protection. Le calcul est public et se fait chez vous, donc cette
                                connexion ne garde aucun secret et n&apos;empêche personne de recalculer la
                                même chose. Ce qu&apos;elle change: notre serveur apprend qu&apos;un compte
                                a demandé sa clé, jamais ce que vous avez répondu. Un profil que
                                quelqu&apos;un partage avec vous reste lisible sans aucun compte.
                            </li>
                            ) : (
                            <li>
                                <strong className="text-[var(--color-text)]">Aucun compte requis, aucune réponse transmise.</strong>{' '}
                                Vos réponses, votre profil, vos proximités partisanes: tout est calculé dans
                                votre navigateur. Par défaut, rien n&apos;en sort: le serveur sert des pages
                                et ne reçoit jamais vos réponses.
                            </li>
                            )}
                            {profileVaultEnabled() && (
                            <>
                            <li>
                                <strong className="text-[var(--color-text)]">La sauvegarde de profil est chiffrée avant de partir.</strong>{' '}
                                Si vous choisissez de sauvegarder votre profil avec votre compte Google, il
                                est chiffré dans votre navigateur (AES-256-GCM) avant l&apos;envoi et
                                déchiffré dans votre navigateur au retour: vos réponses en clair ne
                                circulent jamais sur le réseau. La base ne contient que deux choses: une
                                empreinte irréversible de votre compte, et un bloc chiffré. Sans votre nom,
                                sans votre adresse e-mail, sans votre identifiant Google en clair, et sans
                                aucune réponse lisible. Reconnectez-vous avec le même compte, sur
                                n&apos;importe quel appareil, et vous retrouvez votre profil:{' '}
                                <strong className="text-[var(--color-text)]">aucun code à conserver</strong>,
                                rien à perdre.
                            </li>
                            <li>
                                <strong className="text-[var(--color-text)]">Ce que la connexion laisse sur cet appareil.</strong>{' '}
                                Quand vous vous connectez depuis la bulle en haut à droite, votre
                                navigateur garde <strong className="text-[var(--color-text)]">votre prénom et votre photo Google</strong>,
                                pour que la bulle affiche votre visage plutôt qu&apos;un logo. Il ne
                                garde <strong className="text-[var(--color-text)]">jamais le jeton</strong>{' '}
                                de connexion, qui est ce qui donne accès à votre sauvegarde: il sert le
                                temps de l&apos;échange puis disparaît, y compris d&apos;un simple
                                rechargement de page. &quot;Se déconnecter&quot; efface le prénom et la
                                photo, et ne touche pas à vos réponses.
                            </li>
                            <li>
                                <strong className="text-[var(--color-text)]">Ce que nous pourrions faire, et que nous ne faisons pas.</strong>{' '}
                                La clé de votre sauvegarde est recalculée par notre API à partir de votre
                                compte Google et d&apos;un secret serveur, puis remise à votre navigateur.
                                Une personne qui détiendrait à la fois la base de données et les secrets du
                                serveur{' '}
                                <strong className="text-[var(--color-text)]">pourrait techniquement</strong>{' '}
                                déchiffrer un profil sauvegardé. Un vol de la seule base, lui, ne donne
                                rien, même en connaissant votre identifiant Google. Nous préférons
                                l&apos;écrire que promettre une impossibilité: le code qui fait tout cela
                                est public, ligne par ligne, et vous pouvez supprimer votre profil du
                                serveur à tout moment depuis vos résultats.
                            </li>
                            </>
                            )}
                            {publicStatisticsEnabled() && (
                            <li>
                                <strong className="text-[var(--color-text)]">Des statistiques publiques, anonymes par construction.</strong>{' '}
                                À la fin d&apos;une analyse, le site incrémente un compteur: le pays, le
                                nombre d&apos;énoncés répondus et le ou les partis arrivés en tête. Ni vos
                                réponses, ni votre identité, ni votre adresse IP ne sont enregistrées: le
                                serveur ne conserve que des totaux agrégés, sans ligne par événement ni
                                horodatage individuel, donc sans rien à recouper. Le résultat est public:
                                la page{' '}
                                <Link href="/statistiques" className="font-semibold text-[var(--color-primary)] hover:underline">
                                    statistiques
                                </Link>{' '}
                                montre à tout le monde, vous compris, la totalité de ce que nous voyons.
                            </li>
                            )}
                            <li>
                                <strong className="text-[var(--color-text)]">L&apos;IA n&apos;intervient jamais pendant l&apos;utilisation.</strong>{' '}
                                Le calcul est une formule déterministe publiée; aucune de vos réponses n&apos;est
                                envoyée à un modèle d&apos;IA. L&apos;usage de l&apos;IA dans la fabrication des
                                données du site est documenté publiquement (charte, prompts, registre).
                            </li>
                            <li>
                                <strong className="text-[var(--color-text)]">Le micro n&apos;est jamais utilisé.</strong>{' '}
                                Le mode entretien lit les énoncés à voix haute, avec la synthèse vocale de
                                votre navigateur, qui fonctionne sur l&apos;appareil. Il n&apos;écoute pas:
                                l&apos;application ne demande aucun accès au microphone, et l&apos;en-tête
                                Permissions-Policy du site en refuse un. Seule la position que vous validez
                                à l&apos;écran entre dans le calcul.
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
                            qu&apos;aucune requête ne transmet vos réponses. {expectedApiCallsSentence()}
                            {' '}N&apos;importe qui peut faire cette
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
