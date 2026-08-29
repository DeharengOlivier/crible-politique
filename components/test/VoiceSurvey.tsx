'use client';

import { useState, useEffect } from 'react';
import { Statement, AnswerRecord, AnswerValue } from '@/types/positions';
import { Ear, Volume2 } from 'lucide-react';
import LikertScale from './LikertScale';

// Interview mode: the statement is read aloud, the reader thinks about it,
// then validates their own position on the scale.
//
// This mode speaks and never listens, and that is a decision rather than a
// limitation. It used to run the browser's speech recognition so the reader
// could "think out loud" and see a transcript. That transcript was displayed
// and nothing else: it never touched an answer. But the recognition API is
// not local, on Chromium it streams the microphone to a speech service, so
// the feature sent someone's voice to a third party while they were being
// read political statements, in exchange for a string that changed nothing.
// Speech synthesis, which is what the mode is actually for, runs on the
// device. __tests__/noMicrophone.test.ts fails if a microphone API comes
// back, and the Permissions-Policy header denies one at the browser.

interface VoiceSurveyProps {
    // The statements of this respondent's country: the survey never decides
    // for itself what it reads out.
    statements: Statement[];
    initialAnswers: AnswerRecord;
    onComplete: (answers: AnswerRecord) => void;
    onAnswer?: (answers: AnswerRecord) => void;
}

export default function VoiceSurvey({ statements, initialAnswers, onComplete, onAnswer }: VoiceSurveyProps) {
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState<AnswerRecord>(initialAnswers);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const statement = statements[index];

    // Stop the reading when the mode is left, so a statement is not still
    // being spoken over whatever the reader moved on to.
    useEffect(() => {
        return () => window.speechSynthesis?.cancel();
    }, []);

    // Read the statement aloud on each change.
    useEffect(() => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(statement.text);
        utterance.lang = 'fr-FR';
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    }, [statement]);

    const handleSelect = (value: AnswerValue) => {
        window.speechSynthesis?.cancel();

        const next = { ...answers, [statement.id]: value };
        setAnswers(next);
        onAnswer?.(next);

        if (index + 1 < statements.length) {
            setIndex(index + 1);
        } else {
            onComplete(next);
        }
    };

    return (
        <div className="mx-auto w-full max-w-2xl space-y-6">
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                    <span>
                        Énoncé {index + 1} / {statements.length}
                    </span>
                    <span className="rounded-full border border-[var(--color-border-light)] bg-white px-3 py-1 text-xs font-medium">
                        Mode entretien
                    </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
                    <div
                        className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
                        style={{ width: `${((index + 1) / statements.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Reading avatar */}
            <div className="flex justify-center">
                <div
                    className={`flex h-20 w-20 items-center justify-center rounded-full transition-all duration-500 ${
                        isSpeaking ? 'scale-110 bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'
                    }`}
                >
                    {isSpeaking ? (
                        <Volume2 className="h-9 w-9" aria-hidden="true" />
                    ) : (
                        <Ear className="h-9 w-9" aria-hidden="true" />
                    )}
                </div>
            </div>

            <div className="rounded-2xl border-2 border-[var(--color-border-light)] bg-white p-6 sm:p-8">
                <p className="text-center text-xl font-medium leading-relaxed text-[var(--color-text)]">
                    {statement.text}
                </p>
            </div>

            <div className="space-y-2">
                <p className="text-center text-sm font-medium text-[var(--color-text-muted)]">
                    Votre position, la seule chose qui entre dans le calcul:
                </p>
                <LikertScale value={answers[statement.id]} onSelect={handleSelect} />
            </div>

            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => index > 0 && setIndex(index - 1)}
                    disabled={index === 0}
                    className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    ← Précédent
                </button>
                <p className="text-xs text-[var(--color-text-muted)]">
                    L&apos;énoncé est lu par votre navigateur. Le micro n&apos;est jamais utilisé.
                </p>
            </div>
        </div>
    );
}
