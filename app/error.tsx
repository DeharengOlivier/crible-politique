'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h2 className="mb-2 text-xl font-bold text-gray-900">Une erreur est survenue</h2>
        <p className="mb-4 text-sm text-gray-600">
          {error.message || 'Erreur inattendue. Veuillez réessayer.'}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Réessayer
        </button>
        <p className="mt-4 text-xs text-gray-400">
          Si le problème persiste, rechargez la page.
        </p>
      </div>
    </div>
  );
}
