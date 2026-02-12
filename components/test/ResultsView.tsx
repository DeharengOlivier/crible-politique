'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnswerRecord, DIMENSION_LABELS, DIMENSION_ORDER, LIKERT_LABELS, SOURCE_STATUS_LABELS } from '@/types/positions';
import { computeProfile, computePartyMatches, PartyMatch } from '@/lib/scoringEngine';
import { encodeAnswers } from '@/lib/profileCode';
import { ProfileIcon } from '@/lib/icons';
import { Compass, Coins, Scale } from 'lucide-react';
import MftModule from './MftModule';
import ImpactModule from './ImpactModule';

// Layered results (progressive disclosure):
// 1. Identity (shareable synthetic profile)
// 2. 7-dimension compass
// 3. Parties, explained statement by statement with sourcing status
// 4. Opt-in modules (moral foundations, euro impact): never forced
// 5. Bridge to the observatory (fact sheets) plus transparency

const likertLabel = (v: number) => LIKERT_LABELS[String(v)] ?? String(v);

function PartyDetail({ match }: { match: PartyMatch }) {
    const sorted = [...match.comparisons].sort((a, b) => b.agreement - a.agreement);
    const agreements = sorted.filter((c) => c.agreement >= 0.75).slice(0, 3);
    const disagreements = sorted.filter((c) => c.agreement <= 0.25).slice(-3);

    return (
        <div className="space-y-4 px-1 pb-2 pt-1">
            <p className="text-xs text-[var(--color-text-muted)]">
                Calculé sur {match.answeredAndDocumented} énoncés où vous vous êtes positionné et où la
                position du parti est documentée.
                {match.party.program?.label ? ` Référence: ${match.party.program.label}.` : ''}
            </p>
            {agreements.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-emerald-700">Convergences principales</p>
                    {agreements.map((c) => (
                        <div key={c.statement.id} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm">
                            <p className="text-[var(--color-text)]">{c.statement.text}</p>
                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                Vous: {likertLabel(c.userValue)} · Parti: {likertLabel(c.partyValue)} ·{' '}
                                {SOURCE_STATUS_LABELS[c.status]}
                            </p>
                        </div>
                    ))}
                </div>
            )}
            {disagreements.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-red-700">Divergences principales</p>
                    {disagreements.map((c) => (
                        <div key={c.statement.id} className="rounded-lg bg-red-50 px-3 py-2 text-sm">
                            <p className="text-[var(--color-text)]">{c.statement.text}</p>
                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                Vous: {likertLabel(c.userValue)} · Parti: {likertLabel(c.partyValue)} ·{' '}
                                {SOURCE_STATUS_LABELS[c.status]}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

interface ResultsViewProps {
    answers: AnswerRecord;
    onRestart: () => void;
}

export default function ResultsView({ answers, onRestart }: ResultsViewProps) {
    const router = useRouter();
    const profile = useMemo(() => computeProfile(answers), [answers]);
    const matches = useMemo(() => computePartyMatches(answers), [answers]);
    const [activeModule, setActiveModule] = useState<'mft' | 'impact' | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [country, setCountry] = useState<'tous' | 'FR' | 'BE'>('tous');
    // Pending duo invitation (arrived via a /compare?a=... link). Read once
    // on initialization; this component only renders client-side.
    const [compareRef] = useState<string | null>(() => {
        try {
            return sessionStorage.getItem('crible_compare_ref');
        } catch {
            return null;
        }
    });

    const synth = profile.syntheticProfile;
    const filteredMatches =
        country === 'tous' ? matches : matches.filter((m) => m.party.country === country);

    const copy = async (url: string, key: string) => {
        await navigator.clipboard.writeText(url);
        setCopied(key);
        setTimeout(() => setCopied(null), 2500);
    };

    const code = encodeAnswers(answers);

    return (
        <div className="mx-auto w-full max-w-3xl space-y-10">
            {/* Pending duo invitation */}
            {compareRef && (
                <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border-2 border-[var(--color-accent)]/40 bg-[var(--color-accent-subtle)] p-5 sm:flex-row">
                    <p className="text-sm text-[var(--color-text)]">
                        Quelqu&apos;un vous a invité à comparer vos profils. Le vôtre est prêt.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            try {
                                sessionStorage.removeItem('crible_compare_ref');
                            } catch {
                                // ignore
                            }
                            router.push(`/compare?a=${compareRef}&b=${code}`);
                        }}
                        className="shrink-0 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-light)]"
                    >
                        Voir la comparaison
                    </button>
                </div>
            )}

            {/* LAYER 1: IDENTITY */}
            <section className="space-y-5 text-center">
                <div className="flex justify-center">
                    {synth ? (
                        <ProfileIcon name={synth.icon} className="h-16 w-16 text-[var(--color-primary)]" />
                    ) : (
                        <Compass className="h-16 w-16 text-[var(--color-primary)]" strokeWidth={1.5} aria-hidden="true" />
                    )}
                </div>
                <div>
                    <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">
                        {synth?.title ?? 'Profil singulier'}
                    </h2>
                    <p className="mt-2 text-lg italic text-[var(--color-text-secondary)]">
                        &quot;{synth?.tagline ?? 'Vous empruntez à plusieurs traditions politiques.'}&quot;
                    </p>
                </div>
                {synth && (
                    <div className="mx-auto grid max-w-2xl gap-3 text-left sm:grid-cols-2">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Leviers privilégiés</p>
                            <p className="mt-1 text-sm text-[var(--color-text)]">{synth.strategy}</p>
                        </div>
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Point de vigilance</p>
                            <p className="mt-1 text-sm text-[var(--color-text)]">{synth.weakness}</p>
                        </div>
                    </div>
                )}

                {/* Sharing: identity only, never the parties */}
                <div className="flex flex-wrap justify-center gap-3 pt-1">
                    <button
                        type="button"
                        onClick={async () => {
                            const url = `${window.location.origin}/p/${code}`;
                            if (navigator.share) {
                                try {
                                    await navigator.share({
                                        title: 'Mon profil politique',
                                        text: synth ? `Je suis "${synth.title}". Et toi ?` : 'Quel est ton profil politique ?',
                                        url
                                    });
                                    return;
                                } catch {
                                    // share cancelled: fall back to copy
                                }
                            }
                            copy(url, 'share');
                        }}
                        className="rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-light)]"
                    >
                        {copied === 'share' ? 'Lien copié !' : 'Partager mon profil'}
                    </button>
                    <button
                        type="button"
                        onClick={() => copy(`${window.location.origin}/compare?a=${code}`, 'duo')}
                        className="rounded-xl border-2 border-[var(--color-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/40"
                    >
                        {copied === 'duo' ? 'Lien copié !' : 'Comparer avec un proche'}
                    </button>
                    <button
                        type="button"
                        onClick={() => copy(`${window.location.origin}/test?p=${code}`, 'self')}
                        className="rounded-xl border-2 border-[var(--color-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/40"
                    >
                        {copied === 'self' ? 'Lien copié !' : 'Garder mes résultats'}
                    </button>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                    Le lien encode vos réponses localement: il n&apos;est stocké nulle part, ne le partagez
                    qu&apos;avec des personnes de confiance.
                </p>
            </section>

            {/* LAYER 2: 7-DIMENSION COMPASS */}
            <section>
                <h3 className="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
                    Votre boussole en 7 dimensions
                </h3>
                <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
                    Pour chaque dimension, le courant de pensée le plus proche de vos réponses.{' '}
                    <Link href="/concepts" className="font-semibold text-[var(--color-primary)] hover:underline">
                        Comprendre ces courants
                    </Link>
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {DIMENSION_ORDER.map((dim) => {
                        const archetype = profile.dimensionArchetypes[dim];
                        return (
                            <div key={dim} className="rounded-xl border border-[var(--color-border-light)] bg-white p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                                    {DIMENSION_LABELS[dim]}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                                    {archetype?.label ?? 'Non renseigné'}
                                </p>
                                {archetype && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
                                            <div
                                                className="h-full rounded-full bg-[var(--color-primary)]"
                                                style={{ width: `${archetype.score}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-[var(--color-text-muted)]">{archetype.score}%</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* LAYER 3: PARTIES EXPLAINED */}
            <section>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
                        Proximité avec les partis
                    </h3>
                    <div className="flex gap-1 rounded-lg border border-[var(--color-border-light)] bg-white p-1 text-xs font-semibold">
                        {(['tous', 'FR', 'BE'] as const).map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setCountry(c)}
                                className={`rounded-md px-3 py-1.5 transition-colors ${
                                    country === c
                                        ? 'bg-[var(--color-primary)] text-white'
                                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]'
                                }`}
                            >
                                {c === 'tous' ? 'Tous' : c}
                            </button>
                        ))}
                    </div>
                </div>
                <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
                    Proximité n&apos;est pas consigne de vote. Dépliez chaque parti pour voir exactement
                    pourquoi, énoncé par énoncé, avec le statut de sourçage de chaque position.
                </p>
                <div className="space-y-2">
                    {filteredMatches.map((match) => (
                        <details
                            key={match.party.id}
                            className="group rounded-xl border border-[var(--color-border-light)] bg-white px-4 py-3"
                        >
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                                <span className="flex min-w-0 items-center gap-2">
                                    <span className="truncate text-sm font-medium text-[var(--color-text)]">
                                        {match.party.name}
                                    </span>
                                    <span className="rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)]">
                                        {match.party.country}
                                    </span>
                                    {match.lowCoverage && (
                                        <span className="rounded border border-amber-400 px-1.5 py-0.5 text-[10px] text-amber-600">
                                            couverture faible
                                        </span>
                                    )}
                                </span>
                                <span className="flex shrink-0 items-center gap-3">
                                    <span className="hidden h-2 w-24 overflow-hidden rounded-full bg-[var(--color-bg-elevated)] sm:block">
                                        <span
                                            className="block h-full rounded-full bg-[var(--color-primary)]"
                                            style={{ width: `${match.score}%` }}
                                        />
                                    </span>
                                    <span className="w-11 text-right font-[family-name:var(--font-heading)] font-bold text-[var(--color-primary)]">
                                        {match.score}%
                                    </span>
                                </span>
                            </summary>
                            <PartyDetail match={match} />
                        </details>
                    ))}
                </div>
            </section>

            {/* LAYER 4: OPT-IN MODULES */}
            <section>
                <h3 className="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
                    Aller plus loin
                </h3>
                <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
                    Deux modules optionnels, locaux et anonymes comme le reste.
                </p>
                {activeModule === null ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => setActiveModule('mft')}
                            className="rounded-xl border-2 border-[var(--color-border-light)] bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40"
                        >
                            <Scale className="h-7 w-7 text-[var(--color-primary)]" strokeWidth={1.5} aria-hidden="true" />
                            <p className="mt-2 font-semibold text-[var(--color-text)]">Mes fondations morales</p>
                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                12 questions (~2 min) pour visualiser les valeurs qui structurent vos positions
                                (théorie de Haidt).
                            </p>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveModule('impact')}
                            className="rounded-xl border-2 border-[var(--color-border-light)] bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40"
                        >
                            <Coins className="h-7 w-7 text-[var(--color-primary)]" strokeWidth={1.5} aria-hidden="true" />
                            <p className="mt-2 font-semibold text-[var(--color-text)]">L&apos;impact sur mon portefeuille</p>
                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Estimation en €/mois des mesures phares selon votre situation (barèmes publiés,
                                données jamais transmises).
                            </p>
                        </button>
                    </div>
                ) : (
                    <div className="rounded-2xl border-2 border-[var(--color-border-light)] bg-white p-6">
                        {activeModule === 'mft' && <MftModule onClose={() => setActiveModule(null)} />}
                        {activeModule === 'impact' && <ImpactModule onClose={() => setActiveModule(null)} />}
                    </div>
                )}
            </section>

            {/* LAYER 5: BRIDGE TO THE OBSERVATORY + TRANSPARENCY */}
            <section className="rounded-2xl border-2 border-[var(--color-primary)]/15 bg-[var(--color-bg-hero)] p-6 text-center">
                <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)]">
                    Et ces idées, que dit le droit ?
                </h3>
                <p className="mx-auto mt-1 max-w-xl text-sm text-[var(--color-text-secondary)]">
                    Retraite à 60 ans, quotas d&apos;immigration, sortie de l&apos;OTAN, déficit sous 3%...
                    Les mesures phares du débat passées au crible: ce qui est établi, ce qui est débattu,
                    sans verdict.
                </p>
                <Link
                    href="/crible"
                    className="mt-4 inline-block rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-light)]"
                >
                    Explorer l&apos;observatoire
                </Link>
            </section>

            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-[var(--color-text-secondary)]">
                <strong className="text-[var(--color-text)]">Transparence:</strong> le positionnement des
                partis est un codage préliminaire d&apos;après leurs programmes, en attente de double codage
                contradictoire. Le calcul est une formule publique et déterministe: mêmes réponses, même
                résultat, recalculable à la main.{' '}
                <Link href="/methodology" className="font-semibold text-[var(--color-primary)] hover:underline">
                    Méthodologie complète
                </Link>
            </section>

            <div className="text-center">
                <button
                    type="button"
                    onClick={onRestart}
                    className="text-sm text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-primary)] hover:underline"
                >
                    Refaire le test
                </button>
            </div>
        </div>
    );
}
