'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { decodeProfile } from '@/lib/profileCode';
import { useShareCodes } from '@/lib/useShareCodes';
import { computeProfile } from '@/lib/scoringEngine';
import { compareAnswers, sharedStatementCount } from '@/lib/duoComparison';
import { COUNTRY_LABELS } from '@/lib/electoralScope';
import { DIMENSION_LABELS, DIMENSION_ORDER, LIKERT_LABELS } from '@/types/positions';
import { ProfileIcon } from '@/lib/icons';
import PageHeader from '@/components/PageHeader';

// Duo comparison, 100% client-side: both profiles live in the URL fragment,
// nothing is stored and nothing is transmitted. Central use case: couples,
// family, friends.

// The two codes this page reads, in the fragment: "#a=...&b=...".
const SHARE_KEYS = ['a', 'b'] as const;


const likertLabel = (v: number) => LIKERT_LABELS[String(v)] ?? String(v);

function CompareContent() {
    const router = useRouter();
    const shared = useShareCodes(SHARE_KEYS);

    const codeA = shared?.a ?? null;
    const codeB = shared?.b ?? null;
    const decodedA = useMemo(() => (codeA ? decodeProfile(codeA) : null), [codeA]);
    const decodedB = useMemo(() => (codeB ? decodeProfile(codeB) : null), [codeB]);
    const answersA = decodedA?.answers ?? null;
    const answersB = decodedB?.answers ?? null;
    // Two respondents of different countries only share the common corpus. The
    // comparison already runs on the intersection; this is what says so.
    const acrossTheBorder =
        decodedA !== null &&
        decodedB !== null &&
        decodedA.country !== null &&
        decodedB.country !== null &&
        decodedA.country !== decodedB.country;
    const profileA = useMemo(() => (answersA ? computeProfile(answersA) : null), [answersA]);
    const profileB = useMemo(() => (answersB ? computeProfile(answersB) : null), [answersB]);
    const comparison = useMemo(
        () => (answersA && answersB ? compareAnswers(answersA, answersB) : null),
        [answersA, answersB]
    );

    // The fragment is only readable after mount, so there is a first render
    // where no verdict is possible yet. Rendering the invalid-link message
    // then would flash an error over a perfectly good link.
    if (shared === null) return null;

    // Invitation: a single profile in the link -> take the test then compare.
    if (codeA && answersA && !answersB) {
        return (
            <div className="mx-auto max-w-xl space-y-6 text-center">
                <div className="flex justify-center">
                    <ProfileIcon
                        name={profileA?.syntheticProfile?.icon}
                        className="h-14 w-14 text-[var(--color-primary)]"
                    />
                </div>
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-primary)]">
                    On vous invite à comparer vos profils politiques
                </h2>
                <p className="text-[var(--color-text-secondary)]">
                    {profileA?.syntheticProfile
                        ? `Votre proche est "${profileA.syntheticProfile.title}".`
                        : 'Votre proche a complété son profil.'}{' '}
                    Faites le test (3 minutes) pour découvrir vos convergences et vos divergences.
                </p>
                <button
                    type="button"
                    onClick={() => {
                        try {
                            sessionStorage.setItem('crible_compare_ref', codeA);
                        } catch {
                            // ignore
                        }
                        router.push('/test');
                    }}
                    className="rounded-xl bg-[var(--color-primary)] px-8 py-4 font-semibold text-white transition-colors hover:bg-[var(--color-primary-light)]"
                >
                    Faire le test et comparer
                </button>
                <p className="text-xs text-[var(--color-text-muted)]">
                    Vos réponses restent sur votre appareil; la comparaison se calcule localement.
                </p>
            </div>
        );
    }

    if (!answersA || !answersB || !comparison) {
        return (
            <div className="mx-auto max-w-xl space-y-4 text-center">
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-primary)]">
                    Lien de comparaison invalide
                </h2>
                <p className="text-[var(--color-text-secondary)]">
                    Demandez à votre proche de régénérer son lien depuis ses résultats.
                </p>
                <Link
                    href="/test"
                    className="inline-block rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white"
                >
                    Faire le test
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl space-y-8">
            <div className="grid gap-4 sm:grid-cols-2">
                {[
                    { label: 'Profil 1', p: profileA },
                    { label: 'Profil 2', p: profileB }
                ].map(({ label, p }) => (
                    <div key={label} className="rounded-2xl border border-[var(--color-border-light)] bg-white p-5 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
                        <div className="mt-2 flex justify-center">
                            <ProfileIcon name={p?.syntheticProfile?.icon} className="h-10 w-10 text-[var(--color-primary)]" />
                        </div>
                        <p className="mt-1 font-semibold text-[var(--color-primary)]">
                            {p?.syntheticProfile?.title ?? 'Profil singulier'}
                        </p>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border-2 border-[var(--color-primary)]/20 bg-white p-6 text-center">
                <div className="font-[family-name:var(--font-heading)] text-6xl font-bold text-[var(--color-primary)]">
                    {comparison.overall}%
                </div>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    de convergence globale, sur {comparison.count} énoncés où vous vous êtes tous les
                    deux positionnés
                    {decodedA?.country && decodedB?.country
                        ? ` sur ${sharedStatementCount(decodedA.country, decodedB.country)} possibles`
                        : ''}
                    .
                </p>
                {acrossTheBorder && (
                    <p className="mt-3 rounded-lg bg-[var(--color-bg-elevated)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
                        Vous avez répondu dans deux pays différents (
                        {COUNTRY_LABELS[decodedA!.country!]} et {COUNTRY_LABELS[decodedB!.country!]}). La
                        comparaison ne porte que sur les énoncés communs aux deux&nbsp;: les clivages
                        propres à chaque pays, comme la réforme de l&apos;État en Belgique ou l&apos;âge
                        de la retraite en France, n&apos;ont pas d&apos;équivalent de l&apos;autre côté et
                        sont écartés.
                    </p>
                )}
            </div>

            <div className="rounded-2xl border border-[var(--color-border-light)] bg-white p-6">
                <h3 className="mb-4 font-[family-name:var(--font-heading)] font-semibold text-[var(--color-primary)]">
                    Convergence par dimension
                </h3>
                <div className="space-y-3">
                    {DIMENSION_ORDER.map((dim) => {
                        const score = comparison.byDimension[dim];
                        if (score === undefined) return null;
                        return (
                            <div key={dim}>
                                <div className="mb-1 flex justify-between text-sm">
                                    <span className="text-[var(--color-text)]">{DIMENSION_LABELS[dim]}</span>
                                    <span className="font-semibold text-[var(--color-primary)]">{score}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
                                    <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${score}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                    <h3 className="mb-3 text-sm font-bold text-emerald-700">Vous convergez sur</h3>
                    <div className="space-y-2 text-sm text-[var(--color-text)]">
                        {comparison.agreements.length === 0 && (
                            <p className="text-[var(--color-text-muted)]">Aucune convergence forte.</p>
                        )}
                        {comparison.agreements.map((p) => (
                            <p key={p.statement.id}>{p.statement.text}</p>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
                    <h3 className="mb-3 text-sm font-bold text-red-700">À débattre ensemble</h3>
                    <div className="space-y-3 text-sm">
                        {comparison.disagreements.length === 0 && (
                            <p className="text-[var(--color-text-muted)]">Aucune divergence majeure. Impressionnant.</p>
                        )}
                        {comparison.disagreements.map((p) => (
                            <div key={p.statement.id}>
                                <p className="text-[var(--color-text)]">{p.statement.text}</p>
                                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                                    Profil 1: {likertLabel(p.a)} · Profil 2: {likertLabel(p.b)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="text-center">
                <Link
                    href="/test"
                    className="inline-block rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-light)]"
                >
                    Faire le test à mon tour
                </Link>
            </div>
        </div>
    );
}

export default function ComparePage() {
    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <PageHeader title="Comparaison" sticky />
            <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                <CompareContent />
            </main>
        </div>
    );
}
