import { AnswerRecord, AnswerValue } from "@/types/positions";
import { STATEMENTS } from "@/data/statements";

// Compact encoding of a profile into the URL, for sharing and duo comparison.
// Privacy: the code is never sent to a server; it only lives inside the link
// the user chooses to share.
// Format: version ("1") + one character per statement, in the order of STATEMENTS.
// a=-2, b=-1, c=0, d=+1, e=+2, x=no opinion.

const VALUE_TO_CHAR: Record<string, string> = {
    "-2": "a",
    "-1": "b",
    "0": "c",
    "1": "d",
    "2": "e",
    null: "x"
};

const CHAR_TO_VALUE: Record<string, AnswerValue> = {
    a: -2,
    b: -1,
    c: 0,
    d: 1,
    e: 2,
    x: null
};

export function encodeAnswers(answers: AnswerRecord): string {
    const body = STATEMENTS.map((s) => {
        const v = answers[s.id];
        return VALUE_TO_CHAR[v === null || v === undefined ? "null" : String(v)];
    }).join("");
    return `1${body}`;
}

export function decodeAnswers(code: string): AnswerRecord | null {
    if (!code || code[0] !== "1") return null;
    const body = code.slice(1);
    if (body.length !== STATEMENTS.length) return null;

    const answers: AnswerRecord = {};
    for (let i = 0; i < STATEMENTS.length; i++) {
        const char = body[i];
        if (!(char in CHAR_TO_VALUE)) return null;
        answers[STATEMENTS[i].id] = CHAR_TO_VALUE[char];
    }
    return answers;
}

const KNOWN_STATEMENT_IDS = new Set(STATEMENTS.map((s) => s.id));

// Validates an answers structure coming from an untrusted source (localStorage,
// external data). Returns an AnswerRecord containing only known statements with
// valid Likert values, or null if the input is unusable.
export function sanitizeAnswers(raw: unknown): AnswerRecord | null {
    if (typeof raw !== "object" || raw === null) return null;
    const result: AnswerRecord = {};
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        if (!KNOWN_STATEMENT_IDS.has(key)) continue;
        if (value === null) {
            result[key] = null;
        } else if (typeof value === "number" && Number.isInteger(value) && value >= -2 && value <= 2) {
            result[key] = value as AnswerValue;
        } else {
            return null; // corrupted value: reject the whole set
        }
    }
    return result;
}
