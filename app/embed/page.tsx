'use client';

import { useMemo, useState } from 'react';
import { AnswerRecord, Country } from '@/types/positions';
import { computeProfile, computePartyMatches } from '@/lib/scoringEngine';
import { encodeAnswers } from '@/lib/profileCode';
import { shareFragment } from '@/lib/shareLink';
import { ProfileIcon } from '@/lib/icons';
import { COUNTRIES, COUNTRY_LABELS, expressStatementsFor, parseCountry } from '@/lib/electoralScope';
import StatementSurvey from '@/components/test/StatementSurvey';
import ClarifySurvey from '@/components/test/ClarifySurvey';
import { nextClarifyingStatement } from '@/lib/adaptiveClarification';

/**
 * Embeddable widget for partner media: the express test (15 statements)
 * on the deterministic engine, inside an iframe.
 * Usage: <iframe src="https://criblepolitique.fr/embed?pays=FR" width="100%" height="720" />
 *
 * The country decides which statements are asked, so a partner pins theirs
 * with ?pays=FR or ?pays=BE. Without it the reader is asked, because guessing
 * would put Belgian statements in front of a French reader.
 * Same doctrine as the site: local computation, no data collected. The link
 * out to the full test carries the answers in the fragment, like every other
 * share link: this widget runs on somebody else's page, so the one thing it
 * must never do is turn a reader's answers into a request to ours.
 */

function EmbedResults({ answers, country }: { answers: AnswerRecord; country: Country }) {
    const profile = useMemo(() => computeProfile(answers), [answers]);
    const matches = useMemo(() => computePartyMatches(answers, { country }), [answers, country]);
    const leaders = matches.filter((m) => m.inLeadingGroup).slice(0, 4);
    const synth = profile.syntheticProfile;
    const code = encodeAnswers(answers, country);

    return (
        <div className="mx-auto max-w-md space-y-5 text-center">
            <div className="flex justify-center">
                <ProfileIcon name={synth?.icon} className="h-14 w-14 text-[var(--color-primary)]" />
            </div>
            <div>
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-primary)]">
                    {synth?.title ?? 'Profil singulier'}
                </h2>
                {synth && (
                    <p className="mt-1 text-sm italic text-[var(--color-text-secondary)]">&quot;{synth.tagline}&quot;</p>
                )}
            </div>
            <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                    {leaders.length > 1
                        ? `${leaders.length} partis à égalité (${Object.keys(answers).length} énoncés)`
                        : `Tendance (${Object.keys(answers).length} énoncés)`}
                </p>
                {leaders.map((m) => (
                    <div
                        key={m.party.id}
                        className="flex items-center justify-between rounded-lg border border-[var(--color-border-light)] px-3 py-2 text-sm"
                    >
                        <span className="font-medium">{m.party.name}</span>
                        <span className="font-bold text-[var(--color-primary)]">
                            {m.lowerBound} à {m.upperBound}%
                        </span>
                    </div>
                ))}
            </div>
            <a
                href={`/test${shareFragment({ p: code })}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-light)]"
            >
                Affiner mon profil sur Le Crible Politique →
            </a>
            <p className="text-[10px] text-[var(--color-text-muted)]">
                Calcul local et déterministe, aucune donnée collectée. Proximité n&apos;est pas
                consigne de vote.
            </p>
        </div>
    );
}

export default function EmbedPage() {
    const [stage, setStage] = useState<'intro' | 'survey' | 'clarify' | 'results'>('intro');
    const [answers, setAnswers] = useState<AnswerRecord>({});
    // The partner may pin the country; the query string is untrusted, so it is
    // narrowed rather than read.
    const [country, setCountry] = useState<Country | null>(() => {
        if (typeof window === 'undefined') return null;
        return parseCountry(new URLSearchParams(window.location.search).get('pays'));
    });

    return (
        <div className="px-4 py-6">
            {stage === 'intro' && country === null && (
                <div className="mx-auto max-w-md space-y-4 text-center">
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-primary)]">
                        Dans quel pays votez-vous ?
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Les énoncés ne sont pas les mêmes des deux côtés de la frontière.
                    </p>
                    {COUNTRIES.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setCountry(c)}
                            className="min-h-[44px] w-full rounded-xl border-2 border-[var(--color-border)] px-5 py-3 font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)]/50"
                        >
                            {COUNTRY_LABELS[c]}
                        </button>
                    ))}
                </div>
            )}
            {stage === 'intro' && country !== null && (
                <div className="mx-auto max-w-md space-y-4 text-center">
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-primary)]">
                        Où vous situez-vous, vraiment ?
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        15 énoncés, 3 minutes, calcul local: vos réponses ne quittent pas votre
                        navigateur.
                    </p>
                    <button
                        type="button"
                        onClick={() => setStage('survey')}
                        className="w-full rounded-xl bg-[var(--color-primary)] px-5 py-3.5 font-semibold text-white hover:bg-[var(--color-primary-light)]"
                    >
                        Commencer le test
                    </button>
                    <p className="text-[10px] text-[var(--color-text-muted)]">
                        Un widget du Crible Politique - méthodologie publique, jamais de consigne de vote.
                    </p>
                </div>
            )}
            {stage === 'survey' && country !== null && (
                <StatementSurvey
                    statements={expressStatementsFor(country)}
                    initialAnswers={answers}
                    onComplete={(a) => {
                        setAnswers(a);
                        setStage(nextClarifyingStatement(a, []) === null ? 'results' : 'clarify');
                    }}
                />
            )}
            {stage === 'clarify' && country !== null && (
                <ClarifySurvey
                    initialAnswers={answers}
                    initialAsked={[]}
                    onComplete={(a) => {
                        setAnswers(a);
                        setStage('results');
                    }}
                />
            )}
            {stage === 'results' && country !== null && (
                <EmbedResults answers={answers} country={country} />
            )}
        </div>
    );
}
