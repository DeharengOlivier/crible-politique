'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeAnswers } from '@/lib/profileCode';
import { computeProfile } from '@/lib/scoringEngine';
import { STATEMENTS } from '@/data/statements';
import { AnswerRecord, DimensionKey, DIMENSION_LABELS, DIMENSION_ORDER, LIKERT_LABELS } from '@/types/positions';
import { ProfileIcon } from '@/lib/icons';

// Duo comparison, 100% client-side: both profiles live in the URL,
// nothing is stored. Central use case: couples, family, friends.


function compareAnswers(a: AnswerRecord, b: AnswerRecord) {
    const pairs = STATEMENTS.flatMap((s) => {
        const va = a[s.id];
        const vb = b[s.id];
        if (va === null || va === undefined || vb === null || vb === undefined) return [];
        return [{ statement: s, a: va, b: vb, agreement: 1 - Math.abs(va - vb) / 4 }];
    });

    const overall = pairs.length
        ? Math.round((pairs.reduce((s, p) => s + p.agreement, 0) / pairs.length) * 100)
        : null;

    const byDimension: Partial<Record<DimensionKey, number>> = {};
    for (const dim of DIMENSION_ORDER) {
        const list = pairs.filter((p) => p.statement.dimension === dim);
        if (list.length) {
            byDimension[dim] = Math.round(
                (list.reduce((s, p) => s + p.agreement, 0) / list.length) * 100
            );
        }
    }

    const sorted = [...pairs].sort((x, y) => y.agreement - x.agreement);
    return {
        overall,
        byDimension,
        agreements: sorted.filter((p) => p.agreement >= 0.75).slice(0, 3),
        disagreements: sorted.filter((p) => p.agreement <= 0.5).slice(-3).reverse(),
        count: pairs.length
    };
}

const likertLabel = (v: number) => LIKERT_LABELS[String(v)] ?? String(v);

function CompareContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const codeA = searchParams.get('a');
    const codeB = searchParams.get('b');
    const answersA = useMemo(() => (codeA ? decodeAnswers(codeA) : null), [codeA]);
    const answersB = useMemo(() => (codeB ? decodeAnswers(codeB) : null), [codeB]);
    const profileA = useMemo(() => (answersA ? computeProfile(answersA) : null), [answersA]);
    const profileB = useMemo(() => (answersB ? computeProfile(answersB) : null), [answersB]);
    const comparison = useMemo(
        () => (answersA && answersB ? compareAnswers(answersA, answersB) : null),
        [answersA, answersB]
    );

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
                    de convergence globale, sur {comparison.count} énoncés où vous vous êtes tous les deux positionnés.
                </p>
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
            <header className="sticky top-0 z-10 border-b border-[var(--color-border-light)] bg-white/95 backdrop-blur-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <Link
                        href="/"
                        className="text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
                    >
                        ← Le Crible Politique
                    </Link>
                    <h1 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)]">
                        Comparaison
                    </h1>
                    <div className="w-24" />
                </div>
            </header>
            <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                <Suspense fallback={null}>
                    <CompareContent />
                </Suspense>
            </main>
        </div>
    );
}
