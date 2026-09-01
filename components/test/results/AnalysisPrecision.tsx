'use client';

import { Gauge } from 'lucide-react';
import { analysisCoverage, leadingIntervalWidth } from '@/lib/analysisCoverage';
import type { AnswerRecord, Country } from '@/types/positions';
import type { PartyMatch } from '@/lib/scoringEngine';

// What this result rests on, said before any percentage is read.
//
// Until 2026-09-01 an express ranking and a complete one were presented in the
// same words, with the same confidence. Measured that day: the interval on the
// leading party is 16 to 26 points wide after fifteen statements and 13 to 18
// after the whole corpus, and the group of parties the answers cannot separate
// roughly halves. That is a real difference in what the reader is looking at,
// and nothing on the screen carried it.
//
// So this states three things a reader can check: how many statements the
// ranking used, how wide the interval on the leader is, and, when the analysis
// is unfinished, the way to finish it. The offer to continue existed only on
// the teaser screen and was gone for good once passed, which left the express
// reader with a provisional result and no route to a better one.

export interface AnalysisPrecisionProps {
    answers: AnswerRecord;
    country: Country;
    matches: PartyMatch[];
    /**
     * Continues this reader's own analysis with the statements left.
     *
     * Absent for a profile that arrived in a shared link: those are someone
     * else's answers, and finishing them would mean answering in their name.
     */
    onContinue?: () => void;
}

export default function AnalysisPrecision({
    answers,
    country,
    matches,
    onContinue
}: AnalysisPrecisionProps) {
    const { answered, corpus, remaining, complete } = analysisCoverage(country, answers);
    const width = leadingIntervalWidth(matches);

    return (
        <div
            role="status"
            className="mb-4 space-y-2 rounded-xl border border-[var(--color-border-light)] bg-white p-4 text-sm"
        >
            <p className="flex items-start gap-2 text-[var(--color-text)]">
                <Gauge
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]"
                    strokeWidth={2}
                    aria-hidden="true"
                />
                <span>
                    {complete ? (
                        <>
                            <span className="font-semibold">Analyse complète</span>&nbsp;: ce
                            classement repose sur les {corpus} énoncés du questionnaire. C&apos;est
                            tout ce que cet outil peut mesurer&nbsp;; pour aller plus loin il
                            faudrait d&apos;autres énoncés, pas d&apos;autres calculs.
                        </>
                    ) : (
                        <>
                            Ce classement repose sur{' '}
                            <span className="font-semibold">
                                {answered} énoncés sur {corpus}
                            </span>
                            . C&apos;est un premier tri, pas un résultat définitif.
                        </>
                    )}{' '}
                    L&apos;intervalle sur le parti de tête est large de{' '}
                    <span className="font-semibold">{width} points</span>
                    {complete
                        ? '.'
                        : ", et répondre aux énoncés restants le resserre: chaque réponse ajoute une comparaison, et l'incertitude décroît avec leur nombre."}
                </span>
            </p>

            {!complete && onContinue !== undefined && (
                <button
                    type="button"
                    onClick={onContinue}
                    className="min-h-[44px] w-full rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-light)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                >
                    Répondre aux {remaining} énoncés restants
                </button>
            )}
        </div>
    );
}
