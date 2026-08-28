import Link from 'next/link';

// Rendered for an unknown URL, and for the notFound() a shared profile raises
// when its code does not decode. That second case is the common one: a link
// truncated by a messaging app arrives here, so the page says so and offers
// the way forward rather than a bare "404".

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-16">
            <div className="w-full max-w-md space-y-6 text-center">
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                    Page introuvable
                </p>
                <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
                    Cette adresse ne mène nulle part
                </h1>
                <p className="text-[var(--color-text-secondary)]">
                    Si vous arrivez d&apos;un lien de profil partagé, il a probablement été coupé en
                    route: les messageries tronquent parfois les adresses longues. Demandez à la
                    personne de vous le renvoyer, ou faites le test à votre tour.
                </p>
                <div className="space-y-3">
                    <Link
                        href="/test"
                        className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-6 py-4 text-lg font-semibold text-white shadow-md transition-colors hover:bg-[var(--color-primary-light)]"
                    >
                        Faire le test (3 min)
                    </Link>
                    <Link
                        href="/"
                        className="flex min-h-[44px] w-full items-center justify-center rounded-xl border-2 border-[var(--color-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/40"
                    >
                        Retour à l&apos;accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}
