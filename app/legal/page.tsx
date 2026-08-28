import Link from 'next/link';

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
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold">2. Politique de confidentialité (RGPD)</h2>

            <h3 className="mt-4 text-lg font-semibold">Données collectées</h3>
            <p className="text-sm">
              <strong>Aucune.</strong> Le site n&apos;a ni compte, ni base de données, ni API: il
              n&apos;existe aucun endroit où une réponse pourrait être enregistrée. Vos réponses sont
              calculées dans votre navigateur et restent sur votre appareil.
            </p>

            <h3 className="mt-4 text-lg font-semibold">Ce qui est stocké sur votre appareil</h3>
            <ul className="text-sm">
              <li><strong>Réponses en cours</strong> (<code>localStorage</code>, clé
              <code>crible_test_v1</code>) : pour reprendre un test interrompu et revoir vos
              résultats.</li>
              <li><strong>Invitation à comparer</strong> (<code>sessionStorage</code>) : le profil
              d&apos;un proche qui vous a envoyé un lien de comparaison, le temps de l&apos;onglet.</li>
              <li><strong>Pages hors ligne</strong> (Cache Storage) : une copie des pages ordinaires
              du site, pour qu&apos;il reste consultable sans connexion. Les profils partagés et les
              comparaisons ne sont jamais mis en cache.</li>
            </ul>
            <p className="text-sm">
              Le bouton &laquo;&nbsp;effacer mes données locales&nbsp;&raquo; de la page{' '}
              <Link href="/confidentialite" className="text-blue-600">confidentialité</Link> vide les
              trois d&apos;un coup.
            </p>

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
            <p className="text-sm">
              Sans collecte, il n&apos;y a pas de traitement de données personnelles au sens du RGPD,
              donc pas de base légale à invoquer. Les opinions politiques relèvent de
              l&apos;article&nbsp;9: la réponse de ce site est de ne pas les recueillir.
            </p>

            <h3 className="mt-4 text-lg font-semibold">Vos droits</h3>
            <p className="text-sm">
              Les droits d&apos;accès, de rectification, d&apos;effacement, de portabilité et
              d&apos;opposition (articles 15 à 22 du RGPD) portent sur des données détenues par un
              responsable de traitement. Il n&apos;y en a aucune ici: l&apos;effacement se fait
              entièrement de votre côté, avec le bouton de la page confidentialité ou en vidant les
              données du site dans votre navigateur. Pour toute question, le dépôt public du projet
              est le canal:{' '}
              <a
                href="https://github.com/DeharengOlivier/crible-politique/issues"
                className="text-blue-600"
              >
                github.com/DeharengOlivier/crible-politique
              </a>.
            </p>

            <h3 className="mt-4 text-lg font-semibold">Cookies</h3>
            <p className="text-sm">
              Ce site n&apos;utilise <strong>aucun cookie</strong>, aucun tracker publicitaire, aucun
              pixel de suivi. Le stockage local décrit plus haut n&apos;est pas un cookie et n&apos;est
              jamais transmis.
            </p>

            <h3 className="mt-4 text-lg font-semibold">Sous-traitants</h3>
            <table className="mt-2 w-full text-sm">
              <thead><tr className="border-b"><th className="py-2 text-left">Service</th><th className="py-2 text-left">Usage</th><th className="py-2 text-left">Localisation</th></tr></thead>
              <tbody>
                <tr className="border-b"><td className="py-2">Vercel</td><td>Hébergement</td><td>USA</td></tr>
                <tr><td className="py-2">Plausible</td><td>Mesure d&apos;audience sans cookie ni identifiant</td><td>UE</td></tr>
              </tbody>
            </table>
            <p className="text-sm">
              Il n&apos;y en a pas d&apos;autre. Le site n&apos;appelle aucune API, aucun modèle
              d&apos;IA et aucune base de données pendant votre visite.
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
