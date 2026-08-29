import { AnswerRecord, Respondent } from "@/types/positions";
import { sanitizeAnswers } from "@/lib/profileCode";
import { parseBelgianCollege, parseCountry } from "@/lib/electoralScope";

// The saved test session, shared between the test flow (which writes it after
// every answer) and the home page (which reads it to greet a returning
// respondent with their own profile instead of a generic funnel). Extracted
// from app/test/page.tsx on 2026-08-29 when the home page became the second
// reader; the storage format did not move.

export const TEST_SESSION_STORAGE_KEY = "crible_test_v2";

export const STAGES = [
    "intro",
    "country",
    "express",
    "clarify",
    "teaser",
    "refine",
    "full",
    "voice",
    "results"
] as const;
export type Stage = (typeof STAGES)[number];

export interface SavedSession {
    stage: Stage;
    answers: AnswerRecord;
    respondent: Respondent | null;
}

/** Narrows a stored respondent, which is untrusted like anything in storage. */
export function parseRespondent(raw: unknown): Respondent | null {
    if (typeof raw !== "object" || raw === null) return null;
    const { country, college } = raw as Record<string, unknown>;
    const parsedCountry = parseCountry(country);
    if (parsedCountry === null) return null;
    if (college === undefined || college === null) return { country: parsedCountry };
    const parsedCollege = parseBelgianCollege(college);
    if (parsedCollege === null || parsedCountry !== "BE") return null;
    return { country: parsedCountry, college: parsedCollege };
}

export function loadSavedSession(): SavedSession | null {
    try {
        const raw = localStorage.getItem(TEST_SESSION_STORAGE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return null;
        const { stage, answers, respondent } = parsed as Record<string, unknown>;
        if (typeof stage !== "string" || !STAGES.includes(stage as Stage)) return null;
        const cleanAnswers = sanitizeAnswers(answers);
        if (cleanAnswers === null) return null;
        return {
            stage: stage as Stage,
            answers: cleanAnswers,
            respondent: parseRespondent(respondent)
        };
    } catch {
        return null;
    }
}

const listeners = new Set<() => void>();

/**
 * Subscribes to session writes, in this tab and in the others.
 *
 * A component reading the session with useSyncExternalStore used to subscribe
 * to nothing, which was true while the only writer lived inside it. Since the
 * account badge restores a vault profile from the page header, the home
 * greeting has to hear a write it did not make.
 */
export function subscribeToSession(listener: () => void): () => void {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === TEST_SESSION_STORAGE_KEY) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
    };
}

/** The raw stored string: the snapshot identity useSyncExternalStore needs. */
export function rawStoredSession(): string | null {
    try {
        return localStorage.getItem(TEST_SESSION_STORAGE_KEY);
    } catch {
        return null;
    }
}

export function saveSession(state: SavedSession): void {
    try {
        localStorage.setItem(TEST_SESSION_STORAGE_KEY, JSON.stringify(state));
    } catch {
        // storage unavailable: the app stays functional
    }
    for (const listener of listeners) listener();
}
