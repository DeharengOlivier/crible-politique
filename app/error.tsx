'use client';

import Link from 'next/link';

// Error boundary for the whole application. Next redacts a server-side error
// before it reaches the browser and replaces it with a digest, so the digest
// is the only thing worth showing: it is what identifies the occurrence, and
// the raw message is either already generic or a detail the reader cannot act
// on.
//
// Nothing is reported automatically, and that is not an omission. Sending a
// crash report would mean sending something about someone from a page whose
// whole premise is that nothing about them is sent anywhere, and the payload
// of a client-side error on this site can contain the very answers the rest
// of the application works to keep local. So the reader is the reporting
// channel: they get the digest and somewhere to send it.

export default function ErrorBoundary({
    error,
    reset
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-16">
            <div className="w-full max-w-md space-y-6 text-center">
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                    Erreur
                </p>
                <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
                    Quelque chose s&apos;est mal passé
                </h1>
                <p className="text-[var(--color-text-secondary)]">
                    Vos réponses sont enregistrées sur cet appareil: réessayer ne vous fera pas
                    recommencer le test.
                </p>
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={reset}
                        className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-6 py-4 text-lg font-semibold text-white shadow-md transition-colors hover:bg-[var(--color-primary-light)]"
                    >
                        Réessayer
                    </button>
                    <Link
                        href="/"
                        className="flex min-h-[44px] w-full items-center justify-center rounded-xl border-2 border-[var(--color-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/40"
                    >
                        Retour à l&apos;accueil
                    </Link>
                </div>
                {error.digest && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                        Référence de l&apos;incident: <code>{error.digest}</code>
                        <br />
                        Rien n&apos;est signalé automatiquement: ce site n&apos;envoie aucun rapport
                        d&apos;erreur. Si le problème persiste, cette référence nous aide à le
                        retrouver, sur{' '}
                        <a
                            href="https://github.com/DeharengOlivier/crible-politique/issues"
                            className="underline hover:text-[var(--color-primary)]"
                        >
                            le dépôt du projet
                        </a>
                        .
                    </p>
                )}
            </div>
        </div>
    );
}
