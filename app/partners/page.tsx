import Link from 'next/link';

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Link href="/" className="mb-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
            &larr; Retour
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Partenaires &amp; Intégration</h1>
          <p className="mt-2 text-gray-600">
            Intégrez Le Crible Politique dans votre média, site ou application.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Widget */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">Widget Embeddable</h2>
          <p className="mb-4 text-gray-600">
            Intégrez le quiz politique directement dans vos articles avec une simple balise iframe.
            Le widget est autonome, responsive, et ne nécessite aucune configuration backend.
          </p>
          <div className="rounded-xl border border-gray-200 bg-gray-900 p-6">
            <code className="text-sm text-green-400">
              {'<iframe'}<br />
              {'  src="https://votredomaine.fr/embed"'}<br />
              {'  width="100%"'}<br />
              {'  height="800"'}<br />
              {'  frameborder="0"'}<br />
              {'  allow="clipboard-write"'}<br />
              {'/>'}<br />
            </code>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-1 font-semibold">Responsive</h3>
              <p className="text-sm text-gray-600">S&apos;adapte automatiquement à la largeur du conteneur.</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-1 font-semibold">Zero config</h3>
              <p className="text-sm text-gray-600">Aucun backend requis. Le widget est autonome.</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-1 font-semibold">RGPD compliant</h3>
              <p className="text-sm text-gray-600">Aucune donnée personnelle collectée sans consentement.</p>
            </div>
          </div>
        </section>

        {/* Open data */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">Données ouvertes (CC BY 4.0)</h2>
          <p className="mb-4 text-gray-600">
            Tout ce qui détermine les résultats est public et réutilisable avec attribution:
            les énoncés du questionnaire, les positions des partis avec sources et statuts,
            la formule de calcul (recalculable à la main) et les fiches de faisabilité.
            Il n&apos;existe volontairement aucune API d&apos;analyse côté serveur: les calculs
            sont déterministes et s&apos;exécutent dans le navigateur de l&apos;utilisateur,
            sans collecte de données.
          </p>
          <p className="text-sm text-gray-600">
            Chercheurs et rédactions: contactez-nous pour les exports structurés et la
            méthodologie détaillée.
          </p>
        </section>

        {/* Contact */}
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-8">
          <h2 className="mb-2 text-xl font-bold text-gray-900">Devenir partenaire</h2>
          <p className="mb-4 text-gray-700">
            Vous êtes un média, une institution éducative ou une fondation ?
            Nous proposons des intégrations personnalisées, des widgets en marque blanche,
            et l&apos;accès aux données agrégées pour la recherche.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm text-gray-700">
              Widget en marque blanche
            </span>
            <span className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm text-gray-700">
              API dédiée
            </span>
            <span className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm text-gray-700">
              Données agrégées pour la recherche
            </span>
            <span className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm text-gray-700">
              Adaptation aux élections locales
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
