'use client';

import { useState, useEffect, useRef } from 'react';
import { STATEMENTS } from '@/data/statements';
import { AnswerRecord, AnswerValue } from '@/types/positions';
import { Mic, Volume2, Square } from 'lucide-react';
import LikertScale from './LikertScale';

// Interview mode: the statement is read aloud, the user can develop their
// thinking out loud, then VALIDATES THEIR OWN position on the scale.
// Deliberate architecture choice: the spoken answer is never interpreted
// automatically; only the validated position enters the computation. Voice
// is processed by the browser APIs, nothing is sent to a server.

interface SpeechRecognitionEventLike {
    resultIndex: number;
    results: {
        length: number;
        [index: number]: { isFinal: boolean; 0: { transcript: string } };
    };
}

interface SpeechRecognitionLike {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
}

type SpeechWindow = Window & {
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    SpeechRecognition?: new () => SpeechRecognitionLike;
};

interface VoiceSurveyProps {
    initialAnswers: AnswerRecord;
    onComplete: (answers: AnswerRecord) => void;
    onAnswer?: (answers: AnswerRecord) => void;
}

export default function VoiceSurvey({ initialAnswers, onComplete, onAnswer }: VoiceSurveyProps) {
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState<AnswerRecord>(initialAnswers);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interim, setInterim] = useState('');
    // Speech recognition support: determined at initialization, not in an
    // effect (avoids a cascading setState on mount).
    const [speechSupported] = useState(
        () =>
            typeof window !== 'undefined' &&
            ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
    );

    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

    const statement = STATEMENTS[index];

    useEffect(() => {
        const w = window as SpeechWindow;
        const SpeechRecognition = w.webkitSpeechRecognition || w.SpeechRecognition;
        if (!SpeechRecognition) return;

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'fr-FR';
            recognition.onresult = (event) => {
                let newInterim = '';
                let newFinal = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) newFinal += event.results[i][0].transcript;
                    else newInterim += event.results[i][0].transcript;
                }
                if (newFinal) setTranscript((prev) => `${prev} ${newFinal}`.trim());
                setInterim(newInterim);
            };
            recognition.onerror = () => setIsListening(false);
            recognition.onend = () => {
                setIsListening(false);
                setInterim('');
            };
            recognitionRef.current = recognition;
        } catch {
            // API present but unusable: the mode stays functional without a mic.
        }

        return () => {
            try {
                recognitionRef.current?.stop();
            } catch {
                // ignore
            }
            window.speechSynthesis?.cancel();
        };
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

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleSelect = (value: AnswerValue) => {
        try {
            recognitionRef.current?.stop();
        } catch {
            // ignore
        }
        window.speechSynthesis?.cancel();

        const next = { ...answers, [statement.id]: value };
        setAnswers(next);
        setTranscript('');
        setInterim('');
        onAnswer?.(next);

        if (index + 1 < STATEMENTS.length) {
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
                        Énoncé {index + 1} / {STATEMENTS.length}
                    </span>
                    <span className="rounded-full border border-[var(--color-border-light)] bg-white px-3 py-1 text-xs font-medium">
                        Mode entretien
                    </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
                    <div
                        className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
                        style={{ width: `${((index + 1) / STATEMENTS.length) * 100}%` }}
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
                        <Mic className="h-9 w-9" aria-hidden="true" />
                    )}
                </div>
            </div>

            <div className="rounded-2xl border-2 border-[var(--color-border-light)] bg-white p-6 sm:p-8">
                <p className="text-center text-xl font-medium leading-relaxed text-[var(--color-text)]">
                    {statement.text}
                </p>
            </div>

            {speechSupported && (
                <div className="space-y-3 text-center">
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                            isListening
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'border-2 border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-primary)]/40'
                        }`}
                    >
                        {isListening ? (
                            <>
                                <Square className="h-4 w-4" aria-hidden="true" />
                                Arrêter
                            </>
                        ) : (
                            <>
                                <Mic className="h-4 w-4" aria-hidden="true" />
                                Réfléchir à voix haute (facultatif)
                            </>
                        )}
                    </button>
                    {(transcript || interim) && (
                        <p className="rounded-xl bg-[var(--color-bg-elevated)] p-3 text-sm italic text-[var(--color-text-secondary)]">
                            &quot;{`${transcript} ${interim}`.trim()}&quot;
                        </p>
                    )}
                </div>
            )}

            <div className="space-y-2">
                <p className="text-center text-sm font-medium text-[var(--color-text-muted)]">
                    Votre position (elle seule compte, jamais l&apos;interprétation de votre voix):
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
                    La voix est traitée par votre navigateur, rien n&apos;est envoyé à un serveur.
                </p>
            </div>
        </div>
    );
}
