'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Measure, Uncertainty } from '@/data/measures';

// Feasibility sheet in the "established / debated / obstacles / pathways"
// format: never a verdict. The law states the constraints, voters decide.

const UNCERTAINTY_STYLES: Record<Uncertainty, string> = {
    faible: 'border-green-600 text-green-700 bg-green-50',
    moyenne: 'border-amber-500 text-amber-700 bg-amber-50',
    'élevée': 'border-red-500 text-red-700 bg-red-50'
};

const NORM_COLORS: Record<string, string> = {
    Constitution: 'bg-blue-100 text-blue-800',
    "Droit de l'UE": 'bg-indigo-100 text-indigo-800',
    'Traités internationaux': 'bg-purple-100 text-purple-800',
    Jurisprudence: 'bg-slate-100 text-slate-800',
    'Budgétaire / économique': 'bg-amber-100 text-amber-800'
};

interface FicheCardProps {
    measure: Measure;
    standalone?: boolean;
}

export default function FicheCard({ measure, standalone = false }: FicheCardProps) {
    const [copied, setCopied] = useState(false);

    const copyLink = async () => {
        await navigator.clipboard.writeText(`${window.location.origin}/crible/${measure.id}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <article className="rounded-2xl border-2 border-[var(--color-border-light)] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
                        {standalone ? (
                            measure.title
                        ) : (
                            <Link href={`/crible/${measure.id}`} className="hover:underline">
                                {measure.title}
                            </Link>
                        )}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">{measure.proposedBy}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${UNCERTAINTY_STYLES[measure.uncertainty]}`}>
                        Incertitude {measure.uncertainty}
                    </span>
                    <span className="rounded-full border border-amber-400 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Préliminaire
                    </span>
                    <button
                        type="button"
                        onClick={copyLink}
                        title="Copier le lien de cette analyse"
                        className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
                    >
                        {copied ? 'Copié !' : 'Lien'}
                    </button>
                </div>
            </div>
            <p className="mb-5 text-sm italic text-[var(--color-text-secondary)]">&quot;{measure.claim}&quot;</p>

            <div className="mb-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-emerald-700">Ce qui est établi</p>
                    <p className="text-sm leading-relaxed text-[var(--color-text)]">{measure.established}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-amber-700">Ce qui est débattu</p>
                    <p className="text-sm leading-relaxed text-[var(--color-text)]">{measure.debated}</p>
                </div>
            </div>

            <details open={standalone} className="group border-t border-[var(--color-border-light)] pt-3">
                <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--color-text)]">
                    Obstacles juridiques identifiés ({measure.obstacles.length}) ▾
                </summary>
                <div className="mt-3 space-y-4">
                    {measure.obstacles.map((o, idx) => (
                        <div key={idx} className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${NORM_COLORS[o.norm]}`}>
                                    {o.norm}
                                </span>
                                <span className="text-sm font-medium text-[var(--color-text)]">{o.title}</span>
                            </div>
                            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{o.detail}</p>
                            <div className="flex flex-wrap gap-2">
                                {o.sources.map((s, i) =>
                                    s.url ? (
                                        <a
                                            key={i}
                                            href={s.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-[var(--color-primary)] hover:underline"
                                        >
                                            {s.label}
                                        </a>
                                    ) : (
                                        <span key={i} className="text-xs italic text-[var(--color-text-muted)]">
                                            {s.label}
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </details>

            <details open={standalone} className="border-t border-[var(--color-border-light)] pt-3">
                <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--color-text)]">
                    Voies possibles identifiées par les juristes ({measure.pathways.length}) ▾
                </summary>
                <div className="mt-3 space-y-3">
                    {measure.pathways.map((p, idx) => (
                        <div key={idx} className="rounded-lg bg-[var(--color-bg-elevated)] p-3">
                            <p className="text-sm font-medium text-[var(--color-text)]">{p.title}</p>
                            <p className="mt-0.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">{p.detail}</p>
                        </div>
                    ))}
                </div>
            </details>
        </article>
    );
}
