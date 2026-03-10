'use client';

import { useMemo, useState } from 'react';
import { EXPRESS_STATEMENTS } from '@/data/statements';
import { AnswerRecord } from '@/types/positions';
import { computeProfile, computePartyMatches } from '@/lib/scoringEngine';
import { encodeAnswers } from '@/lib/profileCode';
import { ProfileIcon } from '@/lib/icons';
import StatementSurvey from '@/components/test/StatementSurvey';

/**
 * Embeddable widget for partner media: the express test (12 statements)
 * on the deterministic engine, inside an iframe.
 * Usage: <iframe src="https://criblepolitique.fr/embed" width="100%" height="720" />
 * Same doctrine as the site: local computation, no data collected.
 */

function EmbedResults({ answers }: { answers: AnswerRecord }) {
    const profile = useMemo(() => computeProfile(answers), [answers]);
    const top3 = useMemo(() => computePartyMatches(answers).slice(0, 3), [answers]);
    const synth = profile.syntheticProfile;
    const code = encodeAnswers(answers);

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
                    Tendances (12 énoncés, premier aperçu)
                </p>
                {top3.map((m) => (
                    <div
                        key={m.party.id}
                        className="flex items-center justify-between rounded-lg border border-[var(--color-border-light)] px-3 py-2 text-sm"
                    >
                        <span className="font-medium">{m.party.name}</span>
                        <span className="font-bold text-[var(--color-primary)]">{m.score}%</span>
                    </div>
                ))}
            </div>
            <a
                href={`/test?p=${code}`}
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
    const [stage, setStage] = useState<'intro' | 'survey' | 'results'>('intro');
    const [answers, setAnswers] = useState<AnswerRecord>({});

    return (
        <div className="px-4 py-6">
            {stage === 'intro' && (
                <div className="mx-auto max-w-md space-y-4 text-center">
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-primary)]">
                        Où vous situez-vous, vraiment ?
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        12 énoncés, 3 minutes, calcul local: vos réponses ne quittent pas votre
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
            {stage === 'survey' && (
                <StatementSurvey
                    statements={EXPRESS_STATEMENTS}
                    initialAnswers={answers}
                    onComplete={(a) => {
                        setAnswers(a);
                        setStage('results');
                    }}
                />
            )}
            {stage === 'results' && <EmbedResults answers={answers} />}
        </div>
    );
}
