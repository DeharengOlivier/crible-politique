import Link from 'next/link';
import { analyticsDomain, profileVaultEnabled, publicStatisticsEnabled } from '@/lib/optionalFeatures';

// The one page whose entire purpose is to be exact, so it describes the
// deployment it is served from and nothing else.
//
// It said the opposite until 2026-08-31: "Données collectées: Aucune. Le site
// n'a ni compte, ni base de données, ni API", on a production build that signs
// readers in with Google, sends a Google ID token to a Cloudflare Worker and
// stores a sealed profile in a D1 database. The copy had been written for the
// client-only site and never followed the features that were added to it, and
// the error propagated into the conclusions that hang off it: no collection, so
// no processing, so no legal basis, so no rights to exercise. Its processor
// table also named an analytics service this deployment does not load, while
// omitting the two it does contact.
//
// So every claim here reads its flag. The default build genuinely collects
// nothing, and must not be made to apologise for a database it does not have;
// a build with the vault must not be allowed to keep the old sentence.

/** What the deployment can be made to collect, in the reader's own terms. */
function CollectedData() {
    if (!publicStatisticsEnabled()) {
        return (
            <p className="text-sm">
                <strong>Aucune.</strong> Ce déploiement n&apos;a ni compte, ni base de données, ni
                API: il n&apos;existe aucun endroit où une réponse pourrait être enregistrée. Vos
                réponses sont calculées dans votre navigateur et restent sur votre appareil.
            </p>
        );
    }
    return (
        <>
            <p className="text-sm">
                <strong>Jamais vos réponses.</strong> Le questionnaire, le profil et les proximités
                partisanes sont calculés dans votre navigateur. Aucune requête ne transporte ce que
                vous avez répondu, sauf si vous demandez explicitement une sauvegarde, et elle part
                alors chiffrée. Ce qui est réellement enregistré, exhaustivement:
            </p>
            <ul className="text-sm">
                <li>
                    <strong>Un compteur agrégé</strong>, à la fin de chaque analyse: le pays, le
                    nombre d&apos;énoncés répondus et le ou les partis arrivés en tête. Il est
                    ajouté à des totaux, sans ligne par événement, sans horodatage individuel et
                    sans identifiant, donc sans rien à recouper. Le résultat est public sur la page{' '}
                    <Link href="/statistiques" className="text-blue-600">statistiques</Link>: vous y
                    voyez la totalité de ce que nous voyons.
                </li>
                {profileVaultEnabled() && (
                    <li>
                        <strong>Votre profil sauvegardé, si vous le demandez</strong>: un bloc
                        chiffré (AES-256-GCM) que le serveur ne peut pas lire, rangé sous une
                        empreinte irréversible de votre identifiant Google. La base ne contient rien
                        d&apos;autre: ni votre nom, ni votre adresse e-mail, ni cet identifiant en
                        clair, ni aucune réponse lisible.
                    </li>
                )}
            </ul>
            <p className="text-sm">
                Le détail technique de chacun de ces flux, y compris ce que nous pourrions faire et
                ne faisons pas, est sur la page{' '}
                <Link href="/confidentialite" className="text-blue-600">confidentialité</Link>.
            </p>
        </>
    );
}

/** Everything a browser on this site can be made to contact, and why. */
function Processors() {
    return (
        <table className="mt-2 w-full text-sm">
            <thead>
                <tr className="border-b">
                    <th className="py-2 text-left">Service</th>
                    <th className="py-2 text-left">Usage</th>
                    <th className="py-2 text-left">Localisation</th>
                </tr>
            </thead>
            <tbody>
                <tr className="border-b">
                    <td className="py-2">Vercel</td>
                    <td>Hébergement des pages</td>
                    <td>USA</td>
                </tr>
                {publicStatisticsEnabled() && (
                    <tr className="border-b">
                        <td className="py-2">Cloudflare</td>
                        <td>
                            API et base de données (compteurs
                            {profileVaultEnabled() ? ', profils chiffrés' : ''})
                        </td>
                        <td>UE et USA</td>
                    </tr>
                )}
                {profileVaultEnabled() && (
                    <tr className="border-b">
                        <td className="py-2">Google</td>
                        <td>Connexion au compte, seulement si vous la demandez</td>
                        <td>USA</td>
                    </tr>
                )}
                {analyticsDomain() !== null && (
                    <tr className="border-b">
                        <td className="py-2">Plausible</td>
                        <td>Mesure d&apos;audience sans cookie ni identifiant</td>
                        <td>UE</td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}

function LegalBasis() {
    if (!publicStatisticsEnabled()) {
        return (
            <p className="text-sm">
                Ce déploiement ne recueille aucune donnée personnelle, il n&apos;y a donc aucun
                traitement au sens du RGPD. Les opinions politiques relèvent de
                l&apos;article&nbsp;9: la réponse de ce site est de ne pas les recueillir.
            </p>
        );
    }
    return (
        <>
            <p className="text-sm">
                <strong>Le compteur</strong> ne produit que des totaux agrégés, sans identifiant ni
                horodatage individuel: il n&apos;y a rien à rattacher à une personne, donc pas de
                donnée personnelle à traiter.
            </p>
            {profileVaultEnabled() && (
                <p className="text-sm">
                    <strong>La sauvegarde de profil</strong>, elle, porte sur des opinions
                    politiques, qui sont des données sensibles au sens de l&apos;article&nbsp;9 du
                    RGPD. La base légale est votre{' '}
                    <strong>consentement explicite</strong> (article&nbsp;9.2.a): rien n&apos;est
                    sauvegardé tant que vous ne le demandez pas, chaque sauvegarde est un geste
                    séparé, et le contenu est chiffré avant de partir. Vous pouvez le retirer à tout
                    moment en supprimant votre profil, ce qui efface la ligne.
                </p>
            )}
            <p className="text-sm">
                <strong>Transferts hors UE.</strong> Vercel est une société américaine et Google
                aussi. Les pages que vous lisez transitent donc par une infrastructure américaine,
                comme sur la plus grande partie du web. Le contenu de vos réponses, lui, ne fait pas
                ce voyage: il ne quitte pas votre navigateur, et une sauvegarde ne part que
                chiffrée.
            </p>
        </>
    );
}

function Rights() {
    if (!publicStatisticsEnabled()) {
        return (
            <p className="text-sm">
                Les droits d&apos;accès, de rectification, d&apos;effacement, de portabilité et
                d&apos;opposition (articles 15 à 22 du RGPD) portent sur des données détenues par un
                responsable de traitement. Il n&apos;y en a aucune sur ce déploiement:
                l&apos;effacement se fait entièrement de votre côté, avec le bouton de la page
                confidentialité ou en vidant les données du site dans votre navigateur.
            </p>
        );
    }
    return (
        <>
            <ul className="text-sm">
                {profileVaultEnabled() && (
                    <>
                        <li>
                            <strong>Accès et portabilité.</strong> Votre profil sauvegardé
                            n&apos;est lisible que par votre navigateur: connectez-vous et il
                            revient déchiffré, sous la forme exacte où il a été rangé. Vous pouvez
                            aussi l&apos;exporter en lien de partage depuis vos résultats.
                        </li>
                        <li>
                            <strong>Effacement.</strong> Le bouton &laquo;&nbsp;supprimer mon profil
                            sauvegardé&nbsp;&raquo;, au bas de vos résultats, efface la ligne du
                            serveur. C&apos;est immédiat et cela n&apos;a besoin de personne.
                        </li>
                        <li>
                            <strong>Rectification.</strong> Refaire le test et sauvegarder à nouveau
                            remplace le contenu précédent.
                        </li>
                    </>
                )}
                <li>
                    <strong>Le compteur agrégé</strong> ne contient aucune donnée personnelle, donc
                    rien à extraire, corriger ni supprimer: une fois ajoutée à un total, une analyse
                    n&apos;existe plus en tant que telle. C&apos;est aussi pour cela qu&apos;elle ne
                    peut pas vous être retirée après coup.
                </li>
                <li>
                    <strong>Vos données locales</strong> s&apos;effacent avec le bouton de la page{' '}
                    <Link href="/confidentialite" className="text-blue-600">confidentialité</Link>.
                </li>
            </ul>
            <p className="text-sm">
                Pour toute question ou réclamation, le dépôt public du projet est le canal:{' '}
                <a
                    href="https://github.com/DeharengOlivier/crible-politique/issues"
                    className="text-blue-600"
                >
                    github.com/DeharengOlivier/crible-politique
                </a>
                .
            </p>
        </>
    );
}

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Link href="/" className="mb-4 inline-flex min-h-[44px] items-center text-sm text-blue-600 sm:min-h-0">&larr; Retour</Link>
          <h1 className="text-3xl font-extrabold">Mentions légales &amp; Politique de confidentialité</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="prose prose-gray max-w-none">

          <section className="mb-10">
            <h2 className="text-2xl font-bold">1. Éditeur du site</h2>
            <p>
              Le Crible Politique est un projet indépendant d&apos;éducation civique.
              Ce site n&apos;est affilié à aucun parti politique, syndicat, média ou institution.
            </p>
            <p>Hébergement : Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.</p>
            {publicStatisticsEnabled() && (
              <p>
                API et base de données : Cloudflare, Inc., 101 Townsend St, San Francisco,
                CA 94107, USA.
              </p>
            )}
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold">2. Politique de confidentialité (RGPD)</h2>

            <h3 className="mt-4 text-lg font-semibold">Données collectées</h3>
            <CollectedData />

            <h3 className="mt-4 text-lg font-semibold">Ce qui est stocké sur votre appareil</h3>
            <ul className="text-sm">
              <li><strong>Réponses en cours</strong> (<code>localStorage</code>, clé
              <code>crible_test_v1</code>) : pour reprendre un test interrompu et revoir vos
              résultats.</li>
              <li><strong>Invitation à comparer</strong> (<code>sessionStorage</code>) : le profil
              d&apos;un proche qui vous a envoyé un lien de comparaison, le temps de l&apos;onglet.</li>
              {profileVaultEnabled() && (
                <li><strong>Votre prénom et l&apos;adresse de votre photo Google</strong>{' '}
                (<code>localStorage</code>), une fois connecté, pour que la bulle de compte affiche
                votre visage. Le jeton de connexion, lui, n&apos;est jamais écrit sur le disque: il
                vit le temps de l&apos;échange et disparaît au rechargement.</li>
              )}
              <li><strong>Pages hors ligne</strong> (Cache Storage) : une copie des pages ordinaires
              du site, pour qu&apos;il reste consultable sans connexion. Les profils partagés et les
              comparaisons ne sont jamais mis en cache.</li>
            </ul>
            <p className="text-sm">
              Le bouton &laquo;&nbsp;effacer mes données locales&nbsp;&raquo; de la page{' '}
              <Link href="/confidentialite" className="text-blue-600">confidentialité</Link> vide le
              tout d&apos;un coup.
            </p>

            <h3 className="mt-4 text-lg font-semibold">Ce que voient nos hébergeurs</h3>
            <p className="text-sm">
              Comme tout site, celui-ci ne peut pas vous répondre sans recevoir votre adresse IP et
              l&apos;en-tête de votre navigateur. Vercel les voit pour servir les pages
              {publicStatisticsEnabled() ? ', Cloudflare pour répondre à l’API' : ''}. Nous
              n&apos;en gardons rien: les journaux de l&apos;API sont désactivés côté serveur
              (<code>observability.enabled = false</code>, visible dans le dépôt), précisément pour
              qu&apos;une adresse ou un jeton ne puisse pas s&apos;y retrouver. Nous ne les croisons
              avec rien et ne les utilisons pour aucune mesure d&apos;audience.
            </p>

            {profileVaultEnabled() && (
              <>
                <h3 className="mt-4 text-lg font-semibold">Ce que Google apprend</h3>
                <p className="text-sm">
                  Le script de connexion Google n&apos;est chargé qu&apos;au moment où vous appuyez
                  sur la bulle de compte. Tant que vous ne le faites pas, votre navigateur ne
                  contacte pas Google et Google n&apos;apprend pas que vous êtes ici: vous pouvez le
                  constater dans l&apos;onglet &quot;Réseau&quot;. À partir de ce clic, Google sait
                  que vous vous connectez à cette application, et sa propre politique de
                  confidentialité s&apos;applique à ce qu&apos;il dépose et envoie. Une fois
                  connecté, votre navigateur va chercher votre photo de profil chez Google, sans lui
                  transmettre la page où vous êtes (<code>referrerPolicy=&quot;no-referrer&quot;</code>).
                </p>
              </>
            )}

            <h3 className="mt-4 text-lg font-semibold">Ce qui circule quand vous partagez</h3>
            <p className="text-sm">
              Un lien de partage contient votre profil sous deux formes. L&apos;identité affichée (le
              nom du profil et les sept courants dominants) est dans le chemin de l&apos;adresse, et
              c&apos;est ce que le serveur reçoit: elle ne permet pas de retrouver vos réponses. Vos
              réponses elles-mêmes sont placées après le &laquo;&nbsp;#&nbsp;&raquo;, la partie de
              l&apos;adresse que le navigateur ne transmet jamais: elles n&apos;apparaissent dans aucun
              journal de serveur et ne sont lues que par le navigateur de la personne à qui vous avez
              envoyé le lien.
            </p>

            <h3 className="mt-4 text-lg font-semibold">Base légale</h3>
            <LegalBasis />

            <h3 className="mt-4 text-lg font-semibold">Durée de conservation</h3>
            <p className="text-sm">
              {profileVaultEnabled()
                ? 'Un profil sauvegardé reste jusqu’à ce que vous le supprimiez; il n’y a pas d’expiration automatique. Les totaux agrégés sont conservés sans limite, puisqu’ils ne se rapportent à personne. Vos données locales restent sur votre appareil tant que vous ne les effacez pas.'
                : 'Rien n’est conservé de notre côté. Vos données locales restent sur votre appareil tant que vous ne les effacez pas.'}
            </p>

            <h3 className="mt-4 text-lg font-semibold">Vos droits</h3>
            <Rights />

            <h3 className="mt-4 text-lg font-semibold">Cookies</h3>
            <p className="text-sm">
              Ce site ne dépose <strong>aucun cookie</strong>, aucun tracker publicitaire, aucun
              pixel de suivi. Le stockage local décrit plus haut n&apos;est pas un cookie et
              n&apos;est jamais transmis.
              {profileVaultEnabled() &&
                " Seule exception, et elle vous appartient: si vous appuyez sur la bulle de compte, le script de Google s’exécute dans la page et applique sa propre politique."}
            </p>

            <h3 className="mt-4 text-lg font-semibold">Sous-traitants</h3>
            <Processors />
            <p className="text-sm">
              Il n&apos;y en a pas d&apos;autre, et cette liste est vérifiable sans nous croire:
              ouvrez l&apos;onglet &quot;Réseau&quot; de votre navigateur et comparez les domaines
              appelés. Aucun modèle d&apos;IA n&apos;intervient pendant votre visite.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold">3. Avertissement</h2>
            <p>
              Cette application est un outil d&apos;information et d&apos;éducation civique.
              Elle ne constitue pas un conseil politique et ne recommande aucun candidat, parti ou vote.
              Les analyses présentées sont basées sur des modélisations simplifiées et des données publiques.
              Elles ne doivent pas être considérées comme des prédictions exactes.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold">4. Propriété intellectuelle</h2>
            <p>
              Le code de cette application est publié sous licence MIT, et les données qui
              déterminent les résultats sous licence CC BY 4.0:{' '}
              <a href="https://github.com/DeharengOlivier/crible-politique" className="text-blue-600">
                github.com/DeharengOlivier/crible-politique
              </a>. Les données INSEE, CHES et les programmes des partis sont des données publiques.
              Le Moral Foundations Questionnaire (MFQ) est libre de droits pour la recherche.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
