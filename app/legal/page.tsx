import Link from 'next/link';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Link href="/" className="mb-4 inline-block text-sm text-blue-600">&larr; Retour</Link>
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
            <ul className="text-sm">
              <li><strong>Mode anonyme (par défaut)</strong> : Aucune donnée personnelle n&apos;est collectée.
              Vos réponses au questionnaire sont traitées localement dans votre navigateur (localStorage)
              et ne sont jamais envoyées à un serveur, sauf si vous utilisez l&apos;enrichissement IA.</li>
              <li><strong>Enrichissement IA</strong> : Vos réponses anonymisées sont envoyées au modèle IA
              (OpenAI ou Anthropic) pour générer l&apos;interprétation sociologique. Ces données ne sont pas
              stockées par notre serveur après le traitement.</li>
              <li><strong>Opt-in statistiques</strong> : Si vous acceptez de contribuer aux statistiques,
              un profil anonymisé (classe sociale, idéologie, fondations morales, territoire — PAS votre nom,
              email, adresse ou revenus exacts) est stocké dans notre base de données.</li>
              <li><strong>Compte utilisateur</strong> : Si vous créez un compte, votre adresse email est stockée
              par Supabase Auth pour l&apos;authentification uniquement. Votre historique d&apos;analyses est lié à
              votre compte.</li>
            </ul>

            <h3 className="mt-4 text-lg font-semibold">Base légale</h3>
            <p className="text-sm">
              Le traitement des données repose sur votre <strong>consentement explicite</strong> (art. 6§1a RGPD)
              pour les statistiques et le compte, et sur l&apos;<strong>intérêt légitime</strong> (art. 6§1f RGPD)
              pour le fonctionnement technique du site.
            </p>

            <h3 className="mt-4 text-lg font-semibold">Vos droits</h3>
            <p className="text-sm">
              Conformément au RGPD (articles 15 à 22), vous disposez des droits suivants :
            </p>
            <ul className="text-sm">
              <li>Droit d&apos;accès, de rectification et d&apos;effacement de vos données</li>
              <li>Droit à la portabilité de vos données</li>
              <li>Droit d&apos;opposition et de limitation du traitement</li>
              <li>Droit de retirer votre consentement à tout moment</li>
            </ul>
            <p className="text-sm">
              Pour exercer ces droits, contactez-nous par email (adresse à ajouter).
            </p>

            <h3 className="mt-4 text-lg font-semibold">Cookies</h3>
            <p className="text-sm">
              Ce site n&apos;utilise <strong>aucun cookie tiers</strong>, aucun tracker publicitaire,
              aucun pixel de suivi. Le seul stockage local est le localStorage utilisé par l&apos;application
              pour sauvegarder vos réponses pendant votre session.
            </p>
            {/* Plausible is cookie-free and doesn't require consent */}

            <h3 className="mt-4 text-lg font-semibold">Sous-traitants</h3>
            <table className="mt-2 w-full text-sm">
              <thead><tr className="border-b"><th className="py-2 text-left">Service</th><th className="py-2 text-left">Usage</th><th className="py-2 text-left">Localisation</th></tr></thead>
              <tbody>
                <tr className="border-b"><td className="py-2">Vercel</td><td>Hébergement</td><td>USA (Privacy Shield)</td></tr>
                <tr className="border-b"><td className="py-2">Supabase</td><td>Base de données, authentification</td><td>EU (Francfort)</td></tr>
                <tr className="border-b"><td className="py-2">OpenAI / Anthropic</td><td>Enrichissement IA (opt-in)</td><td>USA</td></tr>
                <tr><td className="py-2">Plausible</td><td>Analytics (sans cookies)</td><td>EU</td></tr>
              </tbody>
            </table>
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
              Le code source de cette application est disponible sous licence ouverte.
              Les données INSEE, CHES et les programmes des partis sont des données publiques.
              Le Moral Foundations Questionnaire (MFQ) est libre de droits pour la recherche.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
