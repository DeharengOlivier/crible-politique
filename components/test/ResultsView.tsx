'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    AnswerRecord,
    DIMENSION_LABELS,
    DIMENSION_ORDER,
    DimensionKey,
    LIKERT_LABELS,
    Respondent,
    SOURCE_STATUS_LABELS
} from '@/types/positions';
import { DEFINITIONS } from '@/data/definitions';
import FamilyCompositionCard from '@/components/FamilyCompositionCard';
import { COLLEGE_LABELS, COUNTRY_LABELS } from '@/lib/electoralScope';
import { rankedForReading, READINGS, READING_LABELS, Reading } from '@/lib/resultsReading';
import { computeProfile, computePartyMatches, PartyMatch } from '@/lib/scoringEngine';
import { encodeAnswers } from '@/lib/profileCode';
import { encodeBadge } from '@/lib/badgeCode';
import { shareFragment } from '@/lib/shareLink';
import SaveProfileCard from '@/components/profile/SaveProfileCard';
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
            <p className="text-sm text-[var(--color-text)]">
                Vous êtes du même côté que ce parti sur{' '}
                <span className="font-semibold">{match.sameSideCount}</span> énoncés et du côté opposé
                sur <span className="font-semibold">{match.oppositeSideCount}</span>, sur les{' '}
                {match.answeredAndDocumented} où vous vous êtes positionné et où sa position est
                documentée.
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
                Proximité {match.score}%, intervalle de confiance à 90% de {match.lowerBound} à{' '}
                {match.upperBound}%. Lecture directionnelle {match.directionalScore}%.
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
    respondent: Respondent;
    onRestart: () => void;
}

export default function ResultsView({ answers, respondent, onRestart }: ResultsViewProps) {
    const router = useRouter();
    const profile = useMemo(() => computeProfile(answers), [answers]);
    const matches = useMemo(() => computePartyMatches(answers, respondent), [answers, respondent]);
    const [activeModule, setActiveModule] = useState<'mft' | 'impact' | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [reading, setReading] = useState<Reading>('proximity');
    // Pending duo invitation (arrived via a /compare#a=... link). Read once
    // on initialization; this component only renders client-side.
    const [compareRef] = useState<string | null>(() => {
        try {
            return sessionStorage.getItem('crible_compare_ref');
        } catch {
            return null;
        }
    });

    const synth = profile.syntheticProfile;
    const fit = profile.syntheticProfileFit;
    // Everything the answers cannot separate from the family shown above them.
    const alsoInGroup = fit.leadingGroup.slice(1);
    // The respondent's dominant current per dimension, to lay against what
    // each family of the leading group expects.
    const heldCurrents = useMemo(() => {
        const held: Partial<Record<DimensionKey, string>> = {};
        for (const dim of DIMENSION_ORDER) {
            const archetype = profile.dimensionArchetypes[dim];
            if (archetype) held[dim] = archetype.label;
        }
        return held;
    }, [profile]);
    const leaders = matches.filter((m) => m.inLeadingGroup);
    const rankedMatches = useMemo(() => rankedForReading(matches, reading), [matches, reading]);
    const perimeter =
        respondent.college === undefined
            ? COUNTRY_LABELS[respondent.country]
            : `${COUNTRY_LABELS[respondent.country]}, ${COLLEGE_LABELS[respondent.college]}`;

    const copy = async (url: string, key: string) => {
        await navigator.clipboard.writeText(url);
        setCopied(key);
        setTimeout(() => setCopied(null), 2500);
    };

    // Two codes, and the difference between them is the whole privacy design.
    // `code` is the answers, and only ever travels in a fragment. `badge` is
    // the identity, and is the only thing allowed in a path the server sees.
    const code = encodeAnswers(answers, respondent.country);
    const badge = encodeBadge(profile);

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
                            router.push(`/compare${shareFragment({ a: compareRef, b: code })}`);
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
                    {alsoInGroup.length > 0 ? (
                        <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-text-secondary)]">
                            {alsoInGroup.length === 1 ? 'Une autre famille colle' : `${alsoInGroup.length} autres familles collent`}{' '}
                            autant à vos réponses:{' '}
                            {alsoInGroup.map((family, index) => (
                                <span key={family.id}>
                                    {index > 0 && (index === alsoInGroup.length - 1 ? ' et ' : ', ')}
                                    <span className="font-semibold text-[var(--color-text)]">
                                        {family.title}
                                    </span>
                                </span>
                            ))}
                            . L&apos;écart entre elles est plus petit que la précision du test: le
                            titre ci-dessus est la plus proche, pas un verdict.
                        </p>
                    ) : (
                        synth && (
                            <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-text-secondary)]">
                                Aucune autre famille du répertoire ne colle autant à vos réponses.
                            </p>
                        )
                    )}
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

                {/* The bridge between the two layers: what each named family is
                    made of, against the currents this respondent holds. */}
                {synth && (
                    <div className="mx-auto max-w-2xl space-y-3 text-left">
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            Une famille est une combinaison nommée de quelques courants de votre
                            boussole (détaillée plus bas): elle ne se prononce que sur les
                            dimensions qu&apos;elle liste, et ne dit rien des autres.
                        </p>
                        {fit.leadingGroup.map((family, index) => (
                            <FamilyCompositionCard
                                key={family.id}
                                family={family}
                                held={heldCurrents}
                                open={index === 0}
                            />
                        ))}
                    </div>
                )}

                {/* Sharing: identity only, never the parties */}
                <div className="flex flex-wrap justify-center gap-3 pt-1">
                    <button
                        type="button"
                        onClick={async () => {
                            const url = `${window.location.origin}/p/${badge}${shareFragment({ p: code })}`;
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
                        onClick={() =>
                            copy(`${window.location.origin}/compare${shareFragment({ a: code })}`, 'duo')
                        }
                        className="rounded-xl border-2 border-[var(--color-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/40"
                    >
                        {copied === 'duo' ? 'Lien copié !' : 'Comparer avec un proche'}
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            copy(`${window.location.origin}/test${shareFragment({ p: code })}`, 'self')
                        }
                        className="rounded-xl border-2 border-[var(--color-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/40"
                    >
                        {copied === 'self' ? 'Lien copié !' : 'Garder mes résultats'}
                    </button>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                    Le lien encode vos réponses après le «&nbsp;#&nbsp;», la partie de l&apos;adresse que le
                    navigateur ne transmet jamais: elles ne sont stockées nulle part et ne passent par aucun
                    serveur. Ne le partagez qu&apos;avec des personnes de confiance.
                </p>
            </section>

            {/* LAYER 2: 7-DIMENSION COMPASS */}
            <section>
                <h3 className="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
                    Votre boussole en 7 dimensions
                </h3>
                <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
                    Pour chaque dimension, le courant de pensée le plus proche de vos réponses. Quand
                    plusieurs courants collent également à vos réponses, ils sont tous nommés plutôt
                    qu&apos;arbitrés.{' '}
                    <Link href="/concepts" className="font-semibold text-[var(--color-primary)] hover:underline">
                        Comprendre ces courants
                    </Link>
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {DIMENSION_ORDER.map((dim) => {
                        const archetype = profile.dimensionArchetypes[dim];
                        const tied = profile.dimensionTies[dim] ?? [];
                        const definitions = DEFINITIONS[dim] as Record<string, string>;
                        return (
                            <details key={dim} className="rounded-xl border border-[var(--color-border-light)] bg-white p-4">
                                <summary className="min-h-[44px] cursor-pointer list-none sm:min-h-0">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                                        {DIMENSION_LABELS[dim]}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                                        {archetype?.label ?? 'Non renseigné'}
                                    </p>
                                    {tied.length > 1 && (
                                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                            À égalité avec {tied.filter((l) => l !== archetype?.label).join(', ')}
                                            {' '}: vos réponses sur cette dimension ne les départagent pas.
                                        </p>
                                    )}
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
                                    <p className="mt-2 text-[10px] font-semibold text-[var(--color-primary)]">
                                        Comprendre ce courant
                                    </p>
                                </summary>
                                <div className="mt-2 space-y-1.5 border-t border-[var(--color-border-light)] pt-2">
                                    {archetype && (
                                        <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                                            {definitions[archetype.label]}
                                        </p>
                                    )}
                                    {tied
                                        .filter((label) => label !== archetype?.label)
                                        .map((label) => (
                                            <p key={label} className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                                                <span className="font-semibold">{label}:</span> {definitions[label]}
                                            </p>
                                        ))}
                                    <Link
                                        href={`/concepts#${dim}`}
                                        className="inline-block text-xs font-semibold text-[var(--color-primary)] hover:underline"
                                    >
                                        Tous les courants de cette dimension
                                    </Link>
                                </div>
                            </details>
                        );
                    })}
                </div>
            </section>

            {/* LAYER 3: PARTIES EXPLAINED */}
            <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
                        Proximité avec les partis
                    </h3>
                    <div className="flex gap-1 rounded-lg border border-[var(--color-border-light)] bg-white p-1 text-xs font-semibold">
                        {READINGS.map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setReading(key)}
                                className={`min-h-[44px] rounded-md px-3 py-1.5 transition-colors sm:min-h-0 ${
                                    reading === key
                                        ? 'bg-[var(--color-primary)] text-white'
                                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]'
                                }`}
                            >
                                {READING_LABELS[key]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* What the leading group is, before any single name is read as a winner. */}
                <div className="mb-4 space-y-2 rounded-xl border border-[var(--color-border-light)] bg-white p-4 text-sm">
                    <p className="text-[var(--color-text)]">
                        Périmètre&nbsp;: <span className="font-semibold">{perimeter}</span>, {matches.length}{' '}
                        partis.{' '}
                        {leaders.length > 1 ? (
                            <>
                                <span className="font-semibold">
                                    {leaders.length} partis sont à égalité statistique
                                </span>{' '}
                                en tête ({leaders.map((m) => m.party.name).join(', ')}). Comparés énoncé
                                par énoncé sur vos réponses, aucun ne devance l&apos;autre assez
                                systématiquement&nbsp;: les départager serait lire du bruit, même si
                                leurs pourcentages diffèrent.
                            </>
                        ) : (
                            <>
                                <span className="font-semibold">{leaders[0]?.party.name}</span> est seul en
                                tête&nbsp;: énoncé par énoncé, vos réponses penchent systématiquement de
                                son côté face à chaque autre parti.
                            </>
                        )}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                        {reading === 'proximity'
                            ? "Lecture par proximité: la distance moyenne entre vos réponses et celles du parti. Elle favorise mécaniquement les partis codés au centre de chaque échelle. L'échelle utile va d'environ 40 à 100, pas de 0 à 100: même le pire adversaire d'un répondant parfaitement cohérent reste vers 40, car aucun parti réel n'est à l'opposé exact sur chaque énoncé. Des scores entre 50 et 80 sont donc des écarts réels, pas des quasi-égalités."
                            : "Lecture directionnelle: elle récompense l'accord intense dans le même sens plutôt que la faible distance. Les deux lectures peuvent diverger, et c'est l'information."}
                    </p>
                </div>

                <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
                    Proximité n&apos;est pas consigne de vote. Dépliez chaque parti pour voir exactement
                    pourquoi, énoncé par énoncé, avec le statut de sourçage de chaque position.
                </p>
                <div className="space-y-2">
                    {rankedMatches.map(({ match, displayRank }) => (
                        <details
                            key={match.party.id}
                            className="group rounded-xl border border-[var(--color-border-light)] bg-white px-4 py-3"
                        >
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                                <span className="flex min-w-0 items-center gap-2">
                                    <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-[var(--color-text-muted)]">
                                        {displayRank}
                                    </span>
                                    <span className="truncate text-sm font-medium text-[var(--color-text)]">
                                        {match.party.name}
                                    </span>
                                    {match.inLeadingGroup && leaders.length > 1 && (
                                        <span className="rounded border border-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
                                            à égalité en tête
                                        </span>
                                    )}
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
                                    <span className="text-right font-[family-name:var(--font-heading)] font-bold text-[var(--color-primary)]">
                                        {reading === 'proximity' ? (
                                            <>
                                                {match.score}%
                                                <span className="ml-1 block text-[10px] font-normal tabular-nums text-[var(--color-text-muted)] sm:inline sm:ml-2">
                                                    {match.lowerBound}-{match.upperBound}
                                                </span>
                                            </>
                                        ) : (
                                            <>{match.directionalScore}%</>
                                        )}
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
                    Les mesures phares du débat, examinées norme par norme: ce qui est établi, ce qui est débattu,
                    sans verdict.
                </p>
                <Link
                    href="/crible"
                    className="mt-4 inline-block rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-light)]"
                >
                    Explorer l&apos;observatoire
                </Link>
            </section>

            <SaveProfileCard answers={answers} respondent={respondent} />

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
