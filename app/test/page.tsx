'use client';

import { useMemo, useState } from 'react';
import { AnswerRecord, Respondent, Statement } from '@/types/positions';
import { computeProfile, computePartyMatches } from '@/lib/scoringEngine';
import { decodeProfile, sanitizeAnswers } from '@/lib/profileCode';
import { nextClarifyingStatement } from '@/lib/adaptiveClarification';
import {
    expressStatementsFor,
    parseBelgianCollege,
    parseCountry,
    statementsFor
} from '@/lib/electoralScope';
import { useShareCodes } from '@/lib/useShareCodes';
import RespondentPicker from '@/components/test/RespondentPicker';
import StatementSurvey from '@/components/test/StatementSurvey';
import ClarifySurvey from '@/components/test/ClarifySurvey';
import VoiceSurvey from '@/components/test/VoiceSurvey';
import ResultsView from '@/components/test/ResultsView';
import { ProfileIcon } from '@/lib/icons';
import { Compass, Check, Mic } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

// Time-to-value optimized flow:
// intro (1 screen) → country → express (14 statements, ~3 min) → clarify
// (0 to a few adaptive tie-break statements) → teaser (profile reveal) →
// opt-in refinement (remaining statements) → full layered results.
// Socio-economic situation is NEVER asked here: it lives in the
// opt-in "euro impact" module after the results.
//
// The country is asked before the first statement and not offered as a filter
// after the results, because it decides which statements are asked, not only
// which parties are displayed.

const STAGES = ['intro', 'country', 'express', 'clarify', 'teaser', 'refine', 'voice', 'results'] as const;
type Stage = (typeof STAGES)[number];

// v2: the saved session now carries the respondent. A v1 session has no
// country, so it cannot be resumed into a scoped test and is not read.
const STORAGE_KEY = 'crible_test_v2';

/** The statements not yet answered: express and clarifications excluded alike. */
function refineStatementsFor(respondent: Respondent, answers: AnswerRecord): Statement[] {
    return statementsFor(respondent.country).filter((s) => !(s.id in answers));
}

/** Which answered statements were clarifications: everything beyond express. */
function clarificationsAskedSoFar(respondent: Respondent, answers: AnswerRecord): string[] {
    const expressIds = new Set(expressStatementsFor(respondent.country).map((s) => s.id));
    return Object.keys(answers).filter((id) => !expressIds.has(id));
}

interface SavedState {
    stage: Stage;
    answers: AnswerRecord;
    respondent: Respondent | null;
}

/** Narrows a stored respondent, which is untrusted like anything in storage. */
function parseRespondent(raw: unknown): Respondent | null {
    if (typeof raw !== 'object' || raw === null) return null;
    const { country, college } = raw as Record<string, unknown>;
    const parsedCountry = parseCountry(country);
    if (parsedCountry === null) return null;
    if (college === undefined || college === null) return { country: parsedCountry };
    const parsedCollege = parseBelgianCollege(college);
    if (parsedCollege === null || parsedCountry !== 'BE') return null;
    return { country: parsedCountry, college: parsedCollege };
}

function loadSaved(): SavedState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return null;
        const { stage, answers, respondent } = parsed as Record<string, unknown>;
        if (typeof stage !== 'string' || !STAGES.includes(stage as Stage)) return null;
        const cleanAnswers = sanitizeAnswers(answers);
        if (cleanAnswers === null) return null;
        return { stage: stage as Stage, answers: cleanAnswers, respondent: parseRespondent(respondent) };
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
    respondent,
    onRefine,
    onSkip
}: {
    answers: AnswerRecord;
    respondent: Respondent;
    onRefine: () => void;
    onSkip: () => void;
}) {
    const profile = useMemo(() => computeProfile(answers), [answers]);
    const matches = useMemo(() => computePartyMatches(answers, respondent), [answers, respondent]);
    // The leading group, not a podium: on a dozen statements the gap between
    // the first two parties is inside the confidence interval most of the time.
    const leaders = matches.filter((m) => m.inLeadingGroup).slice(0, 4);
    const synth = profile.syntheticProfile;
    const seenCount = Object.keys(answers).length;
    const refineCount = refineStatementsFor(respondent, answers).length;

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
                    {leaders.length > 1
                        ? `${leaders.length} partis encore à égalité, sur ${seenCount} énoncés`
                        : `Tendance partisane, sur ${seenCount} énoncés`}
                </p>
                {leaders.map((m) => (
                    <div
                        key={m.party.id}
                        className="flex items-center justify-between rounded-xl border border-[var(--color-border-light)] bg-white px-4 py-2.5 text-sm"
                    >
                        <span className="font-medium text-[var(--color-text)]">{m.party.name}</span>
                        <span className="font-bold text-[var(--color-primary)]">
                            {m.lowerBound} à {m.upperBound}%
                        </span>
                    </div>
                ))}
            </div>

            <div className="space-y-3">
                <button
                    type="button"
                    onClick={onRefine}
                    className="w-full rounded-xl bg-[var(--color-primary)] px-6 py-4 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[var(--color-primary-light)]"
                >
                    Affiner mon profil ({refineCount} énoncés, ~4 min)
                </button>
                <button
                    type="button"
                    onClick={onSkip}
                    className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-6 py-3.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/40"
                >
                    Voir mes résultats avec ce premier aperçu
                </button>
                <p className="text-xs text-[var(--color-text-muted)]">
                    L&apos;intervalle affiché est celui de l&apos;estimation, pas une marge de politesse:
                    sur les premiers énoncés il reste assez large pour que plusieurs partis y
                    tiennent ensemble. Répondre aux suivants le resserre.
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
                    14 énoncés pour un premier profil en 3 minutes. Vous vous positionnez vous-même sur
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
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 text-sm text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-primary)] hover:underline"
                >
                    <Mic className="h-4 w-4" aria-hidden="true" />
                    Préférer l&apos;entretien vocal (30 énoncés lus à voix haute, ~10 min)
                </button>
            </div>
        </div>
    );
}

// The code a "keep my results" link carries, in the fragment: "#p=...".
const SHARE_KEYS = ['p'] as const;

// Global flow state, updated atomically (a single state transition per
// action) to avoid cascading renders. `saved` is the possibly resumable
// session, frozen at restoration.
interface FlowState {
    stage: Stage;
    answers: AnswerRecord;
    respondent: Respondent | null;
    saved: SavedState | null;
}

function restoreFlow(code: string | null): FlowState {
    const decoded = code ? decodeProfile(code) : null;
    // A link minted before the country existed names none. Rather than guess
    // one, the respondent is asked, and their answers are kept.
    if (decoded && decoded.country !== null) {
        return {
            stage: 'results',
            answers: decoded.answers,
            respondent: { country: decoded.country },
            saved: null
        };
    }
    if (decoded) return { stage: 'country', answers: decoded.answers, respondent: null, saved: null };
    return { stage: 'intro', answers: {}, respondent: null, saved: loadSaved() };
}

function TestFlow() {
    const shared = useShareCodes(SHARE_KEYS);

    // Restoration reads client-only sources: the "#p=code" fragment of a
    // "keep my results" link, and local storage. Neither exists during the
    // server render, so the hook reports null until mount and this stays
    // null with it, which renders nothing rather than a wrong first frame.
    const restored = useMemo(
        () => (shared === null ? null : restoreFlow(shared.p)),
        [shared]
    );

    // Everything the user does afterwards replaces the restored state. Two
    // separate values rather than one piece of state seeded by an effect:
    // seeding would mean a render with the wrong stage, then a second one.
    const [chosen, setChosen] = useState<FlowState | null>(null);
    const flow = chosen ?? restored;

    const stage = flow?.stage ?? 'intro';
    const answers = flow?.answers ?? {};
    const respondent = flow?.respondent ?? null;
    const saved = flow?.saved ?? null;

    // Atomic transition: a stage, its answer set and its respondent change
    // together. Nothing downstream of the country stage may run without one.
    const transition = (next: Stage, nextAnswers: AnswerRecord, nextRespondent = respondent) => {
        setChosen({ stage: next, answers: nextAnswers, respondent: nextRespondent, saved });
        save({ stage: next, answers: nextAnswers, respondent: nextRespondent });
    };

    if (flow === null) return null;

    // A stage past the country screen without a respondent is unreachable by
    // construction; a corrupted saved session is sent back to choose one.
    const needsRespondent = stage !== 'intro' && stage !== 'country' && respondent === null;

    return (
        <>
            {stage === 'intro' && (
                <IntroView
                    onStart={() => transition('country', {}, null)}
                    onStartVoice={() => transition('country', {}, null)}
                    hasSaved={!!saved && saved.stage !== 'intro' && saved.respondent !== null}
                    onResume={() => {
                        if (saved) setChosen({ ...saved, saved });
                    }}
                />
            )}

            {(stage === 'country' || needsRespondent) && (
                <RespondentPicker onChoose={(r) => transition('express', answers, r)} />
            )}

            {stage === 'voice' && respondent && (
                <VoiceSurvey
                    statements={statementsFor(respondent.country)}
                    initialAnswers={answers}
                    onComplete={(a) => transition('results', a)}
                    onAnswer={(a) => save({ stage: 'voice', answers: a, respondent })}
                />
            )}

            {stage === 'express' && respondent && (
                <StatementSurvey
                    statements={expressStatementsFor(respondent.country)}
                    initialAnswers={answers}
                    progressTotal={expressStatementsFor(respondent.country).length}
                    onComplete={(a) =>
                        transition(nextClarifyingStatement(a, []) === null ? 'teaser' : 'clarify', a)
                    }
                    onAnswer={(a) => save({ stage: 'express', answers: a, respondent })}
                />
            )}

            {stage === 'clarify' && respondent && (
                <ClarifySurvey
                    initialAnswers={answers}
                    initialAsked={clarificationsAskedSoFar(respondent, answers)}
                    onComplete={(a) => transition('teaser', a)}
                    onAnswer={(a) => save({ stage: 'clarify', answers: a, respondent })}
                />
            )}

            {stage === 'teaser' && respondent && (
                <TeaserView
                    answers={answers}
                    respondent={respondent}
                    onRefine={() => transition('refine', answers)}
                    onSkip={() => transition('results', answers)}
                />
            )}

            {stage === 'refine' && respondent && (
                <StatementSurvey
                    statements={refineStatementsFor(respondent, answers)}
                    initialAnswers={answers}
                    progressOffset={statementsFor(respondent.country).length - refineStatementsFor(respondent, answers).length}
                    progressTotal={statementsFor(respondent.country).length}
                    onComplete={(a) => transition('results', a)}
                    onAnswer={(a) => save({ stage: 'refine', answers: a, respondent })}
                />
            )}

            {stage === 'results' && respondent && (
                <ResultsView
                    answers={answers}
                    respondent={respondent}
                    onRestart={() => {
                        try {
                            localStorage.removeItem(STORAGE_KEY);
                        } catch {
                            // ignore
                        }
                        setChosen({ stage: 'intro', answers: {}, respondent: null, saved: null });
                    }}
                />
            )}
        </>
    );
}

export default function TestPage() {
    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <PageHeader title="Le test" sticky />
            <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                <TestFlow />
            </main>
        </div>
    );
}
