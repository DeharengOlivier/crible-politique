'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { STATEMENTS, EXPRESS_STATEMENTS } from '@/data/statements';
import { AnswerRecord } from '@/types/positions';
import { computeProfile, computePartyMatches } from '@/lib/scoringEngine';
import { decodeAnswers, sanitizeAnswers } from '@/lib/profileCode';
import StatementSurvey from '@/components/test/StatementSurvey';
import VoiceSurvey from '@/components/test/VoiceSurvey';
import ResultsView from '@/components/test/ResultsView';
import { ProfileIcon } from '@/lib/icons';
import { Compass, Check, Mic } from 'lucide-react';

// Time-to-value optimized flow:
// intro (1 screen) → express (12 statements, ~3 min) → teaser (profile reveal)
// → opt-in refinement (16 statements) → full layered results.
// Socio-economic situation is NEVER asked here: it lives in the
// opt-in "euro impact" module after the results.

const STAGES = ['intro', 'express', 'teaser', 'refine', 'voice', 'results'] as const;
type Stage = (typeof STAGES)[number];

const STORAGE_KEY = 'crible_test_v1';

const REFINE_STATEMENTS = STATEMENTS.filter((s) => !s.express);

interface SavedState {
    stage: Stage;
    answers: AnswerRecord;
}

function loadSaved(): SavedState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return null;
        const { stage, answers } = parsed as Record<string, unknown>;
        if (typeof stage !== 'string' || !STAGES.includes(stage as Stage)) return null;
        const cleanAnswers = sanitizeAnswers(answers);
        if (cleanAnswers === null) return null;
        return { stage: stage as Stage, answers: cleanAnswers };
    } catch {
        return null;
    }
}

function save(state: SavedState) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // storage unavailable: the app stays functional
    }
}

function TeaserView({
    answers,
    onRefine,
    onSkip
}: {
    answers: AnswerRecord;
    onRefine: () => void;
    onSkip: () => void;
}) {
    const profile = useMemo(() => computeProfile(answers), [answers]);
    const top3 = useMemo(() => computePartyMatches(answers).slice(0, 3), [answers]);
    const synth = profile.syntheticProfile;

    return (
        <div className="mx-auto w-full max-w-xl space-y-7 text-center">
            <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                    Premier aperçu
                </p>
                <div className="mt-3 flex justify-center">
                    {synth ? (
                        <ProfileIcon name={synth.icon} className="h-14 w-14 text-[var(--color-primary)]" />
                    ) : (
                        <Compass className="h-14 w-14 text-[var(--color-primary)]" strokeWidth={1.5} aria-hidden="true" />
                    )}
                </div>
                <h2 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
                    {synth?.title ?? 'Profil singulier'}
                </h2>
                {synth && (
                    <p className="mt-2 text-lg italic text-[var(--color-text-secondary)]">
                        &quot;{synth.tagline}&quot;
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Tendances partisanes (sur 12 énoncés seulement)
                </p>
                {top3.map((m) => (
                    <div
                        key={m.party.id}
                        className="flex items-center justify-between rounded-xl border border-[var(--color-border-light)] bg-white px-4 py-2.5 text-sm"
                    >
                        <span className="font-medium text-[var(--color-text)]">
                            {m.party.name}{' '}
                            <span className="ml-1 rounded border border-[var(--color-border)] px-1 py-0.5 text-[10px] text-[var(--color-text-muted)]">
                                {m.party.country}
                            </span>
                        </span>
                        <span className="font-bold text-[var(--color-primary)]">{m.score}%</span>
                    </div>
                ))}
            </div>

            <div className="space-y-3">
                <button
                    type="button"
                    onClick={onRefine}
                    className="w-full rounded-xl bg-[var(--color-primary)] px-6 py-4 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[var(--color-primary-light)]"
                >
                    Affiner mon profil (16 énoncés, ~4 min)
                </button>
                <button
                    type="button"
                    onClick={onSkip}
                    className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-6 py-3.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/40"
                >
                    Voir mes résultats avec ce premier aperçu
                </button>
                <p className="text-xs text-[var(--color-text-muted)]">
                    Plus vous répondez, plus les proximités partisanes sont fiables: les scores sur 12
                    énoncés sont marqués &quot;couverture faible&quot;.
                </p>
            </div>
        </div>
    );
}

function IntroView({
    onStart,
    onStartVoice,
    hasSaved,
    onResume
}: {
    onStart: () => void;
    onStartVoice: () => void;
    hasSaved: boolean;
    onResume: () => void;
}) {
    return (
        <div className="mx-auto w-full max-w-xl space-y-7 text-center">
            <div className="space-y-3">
                <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">
                    Où vous situez-vous, vraiment ?
                </h2>
                <p className="text-[var(--color-text-secondary)]">
                    12 énoncés pour un premier profil en 3 minutes. Vous vous positionnez vous-même sur
                    chaque énoncé: aucun algorithme n&apos;interprète vos réponses à votre place, et un
                    &quot;sans opinion&quot; ne vous est jamais compté.
                </p>
            </div>

            <div className="mx-auto flex max-w-md flex-col gap-2 text-left text-sm text-[var(--color-text-secondary)]">
                {[
                    'Aucun compte, aucune donnée collectée: tout se calcule dans votre navigateur.',
                    'Résultats expliqués énoncé par énoncé, sources à l’appui.',
                    'Jamais de consigne de vote: un miroir, pas un juge.'
                ].map((line, i) => (
                    <div key={i} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden="true" />
                        <span>{line}</span>
                    </div>
                ))}
            </div>

            <div className="space-y-3">
                <button
                    type="button"
                    onClick={onStart}
                    className="w-full rounded-xl bg-[var(--color-primary)] px-6 py-4 text-lg font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[var(--color-primary-light)]"
                >
                    Commencer le test
                </button>
                {hasSaved && (
                    <button
                        type="button"
                        onClick={onResume}
                        className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)]/40"
                    >
                        Reprendre où j&apos;en étais
                    </button>
                )}
                <button
                    type="button"
                    onClick={onStartVoice}
                    className="inline-flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-primary)] hover:underline"
                >
                    <Mic className="h-4 w-4" aria-hidden="true" />
                    Préférer l&apos;entretien vocal (28 énoncés lus à voix haute, ~10 min)
                </button>
            </div>
        </div>
    );
}

// Global flow state, updated atomically (a single state transition per
// action) to avoid cascading renders. `saved` is the possibly resumable
// session, frozen at restoration.
interface FlowState {
    stage: Stage;
    answers: AnswerRecord;
    saved: SavedState | null;
}

function restoreFlow(code: string | null): FlowState {
    const decoded = code ? decodeAnswers(code) : null;
    if (decoded) return { stage: 'results', answers: decoded, saved: null };
    return { stage: 'intro', answers: {}, saved: loadSaved() };
}

function TestFlow() {
    const searchParams = useSearchParams();
    const [flow, setFlow] = useState<FlowState | null>(null);

    // Restoration from client-only sources (?p=code link or local
    // storage): must run after mount to avoid an SSR hydration mismatch.
    // A single atomic setState, so no cascade.
    useEffect(() => {
        setFlow(restoreFlow(searchParams.get('p')));
    }, [searchParams]);

    const ready = flow !== null;
    const stage = flow?.stage ?? 'intro';
    const answers = flow?.answers ?? {};
    const saved = flow?.saved ?? null;

    // Atomic transition: a stage and its answer set change together.
    const transition = (next: Stage, nextAnswers: AnswerRecord) => {
        setFlow((f) => ({ stage: next, answers: nextAnswers, saved: f?.saved ?? null }));
        save({ stage: next, answers: nextAnswers });
    };

    if (!ready) return null;

    return (
        <>
            {stage === 'intro' && (
                <IntroView
                    onStart={() => transition('express', {})}
                    onStartVoice={() => transition('voice', {})}
                    hasSaved={!!saved && saved.stage !== 'intro'}
                    onResume={() => {
                        if (saved) setFlow({ stage: saved.stage, answers: saved.answers, saved });
                    }}
                />
            )}

            {stage === 'voice' && (
                <VoiceSurvey
                    initialAnswers={answers}
                    onComplete={(a) => transition('results', a)}
                    onAnswer={(a) => save({ stage: 'voice', answers: a })}
                />
            )}

            {stage === 'express' && (
                <StatementSurvey
                    statements={EXPRESS_STATEMENTS}
                    initialAnswers={answers}
                    progressTotal={EXPRESS_STATEMENTS.length}
                    onComplete={(a) => transition('teaser', a)}
                    onAnswer={(a) => save({ stage: 'express', answers: a })}
                />
            )}

            {stage === 'teaser' && (
                <TeaserView
                    answers={answers}
                    onRefine={() => transition('refine', answers)}
                    onSkip={() => transition('results', answers)}
                />
            )}

            {stage === 'refine' && (
                <StatementSurvey
                    statements={REFINE_STATEMENTS}
                    initialAnswers={answers}
                    progressOffset={EXPRESS_STATEMENTS.length}
                    progressTotal={STATEMENTS.length}
                    onComplete={(a) => transition('results', a)}
                    onAnswer={(a) => save({ stage: 'refine', answers: a })}
                />
            )}

            {stage === 'results' && (
                <ResultsView
                    answers={answers}
                    onRestart={() => {
                        try {
                            localStorage.removeItem(STORAGE_KEY);
                        } catch {
                            // ignore
                        }
                        setFlow({ stage: 'intro', answers: {}, saved: null });
                    }}
                />
            )}
        </>
    );
}

export default function TestPage() {
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
                        Le test
                    </h1>
                    <div className="w-24" />
                </div>
            </header>
            <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                <Suspense fallback={null}>
                    <TestFlow />
                </Suspense>
            </main>
        </div>
    );
}
