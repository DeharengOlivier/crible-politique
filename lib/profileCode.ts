import { AnswerRecord, AnswerValue, Country } from "@/types/positions";
import { STATEMENTS } from "@/data/statements";
import { statementsFor, parseCountry } from "@/lib/electoralScope";

// Compact encoding of a profile into the URL, for sharing and duo comparison.
//
// Privacy: the code is never sent to a server; it only lives inside the
// fragment of the link the user chooses to share (see lib/shareLink.ts).
//
// Format, version 2: "2" + one country character + one character per statement
// of that country in corpus order + two check characters.
//   country:  f = France, b = Belgique
//   answer:   a=-2, b=-1, c=0, d=+1, e=+2, x=no opinion
//   check 1:  sum of the character codes of everything after the version,
//             modulo 36, written in 0-9a-z
//   check 2:  the same sum with each character code multiplied by its
//             1-based position, modulo 36, same alphabet
//
// The country has to be in the code. Without it the reader cannot know which
// corpus the characters belong to, and the two corpora differ: a French code
// read as Belgian would attribute answers about pension age to statements
// about state reform.
//
// The checks exist because both corpora hold thirty statements, so flipping
// the single country character of a French code turned it into a valid Belgian
// profile: a link mangled in transit displayed a plausible profile attributed
// to the person who shared it. Every character of the code differs from every
// other by less than 36, so any single-character substitution changes the
// plain sum and is rejected. A swap of two characters leaves the plain sum
// unchanged, which is why the second check weighs each character by its
// position: a swap d positions apart changes the weighted sum by d times the
// character difference, so every adjacent swap is caught, and a distant one
// escapes only when that product is a multiple of 36 (for example "b" and "d"
// exchanged 18 positions apart). That residue is the stated limit.
//
// Version 1 was "1" + 28 characters over a single corpus with no country. Those
// links are in people's messages, so they keep resolving: their order is frozen
// below and read as "answers, country unknown".

const VERSION = "2";

const COUNTRY_TO_CHAR: Record<Country, string> = { FR: "f", BE: "b" };
const CHAR_TO_COUNTRY: Record<string, Country> = { f: "FR", b: "BE" };

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

/**
 * The statement order of version 1 codes, frozen for ever.
 *
 * Append-only in spirit and in fact: this list is not the corpus, it is what
 * already-shared links mean. "pw3" is in it and no longer exists as a statement
 * (it became two country-scoped ones), which is exactly why the list cannot be
 * derived from the current corpus.
 */
export const LEGACY_V1_STATEMENT_IDS: readonly string[] = [
    "pw1", "pw2", "pw3", "pw4",
    "ec1", "ec2", "ec3", "ec4",
    "ge1", "ge2", "ge3", "ge4",
    "so1", "so2", "so3", "so4",
    "en1", "en2", "en3", "en4",
    "kn1", "kn2", "kn3", "kn4",
    "mo1", "mo2", "mo3", "mo4"
] as const;

const LEGACY_VERSION = "1";

/** Longest code worth parsing at all: the largest corpus plus its markers. */
const MAX_CODE_LENGTH =
    4 + Math.max(statementsFor("FR").length, statementsFor("BE").length, LEGACY_V1_STATEMENT_IDS.length);

const CHECKSUM_SYMBOLS = "0123456789abcdefghijklmnopqrstuvwxyz";

/** Both check characters, O(n) over the code body. */
function checksOf(payload: string): string {
    let plain = 0;
    let weighted = 0;
    for (let i = 0; i < payload.length; i++) {
        plain += payload.charCodeAt(i);
        weighted += (i + 1) * payload.charCodeAt(i);
    }
    return (
        CHECKSUM_SYMBOLS[plain % CHECKSUM_SYMBOLS.length] +
        CHECKSUM_SYMBOLS[weighted % CHECKSUM_SYMBOLS.length]
    );
}

/** A decoded profile. `country` is null only for a version 1 link. */
export interface DecodedProfile {
    country: Country | null;
    answers: AnswerRecord;
}

/** Encodes one respondent's answers, O(statements). */
export function encodeAnswers(answers: AnswerRecord, country: Country): string {
    const body = statementsFor(country)
        .map((statement) => {
            const value = answers[statement.id];
            return VALUE_TO_CHAR[value === null || value === undefined ? "null" : String(value)];
        })
        .join("");
    const payload = `${COUNTRY_TO_CHAR[country]}${body}`;
    return `${VERSION}${payload}${checksOf(payload)}`;
}

const KNOWN_STATEMENT_IDS = new Set(STATEMENTS.map((s) => s.id));

/**
 * Reads a profile code of any generation, or returns null.
 *
 * Every character is checked. A code whose length, country marker or any single
 * answer character is not one this corpus can produce is rejected whole: a
 * partially read profile would be attributed to the person who shared it.
 */
export function decodeProfile(code: string | null | undefined): DecodedProfile | null {
    if (!code || code.length > MAX_CODE_LENGTH) return null;

    if (code[0] === LEGACY_VERSION) return decodeLegacy(code.slice(1));
    if (code[0] !== VERSION) return null;

    const country = parseCountry(CHAR_TO_COUNTRY[code[1]]);
    if (country === null) return null;

    const statements = statementsFor(country);
    const payload = code.slice(1, -2);
    const body = payload.slice(1);
    if (body.length !== statements.length) return null;
    if (code.slice(-2) !== checksOf(payload)) return null;

    const answers: AnswerRecord = {};
    for (let i = 0; i < statements.length; i++) {
        const char = body[i];
        if (!(char in CHAR_TO_VALUE)) return null;
        answers[statements[i].id] = CHAR_TO_VALUE[char];
    }
    return { country, answers };
}

function decodeLegacy(body: string): DecodedProfile | null {
    if (body.length !== LEGACY_V1_STATEMENT_IDS.length) return null;

    const answers: AnswerRecord = {};
    for (let i = 0; i < LEGACY_V1_STATEMENT_IDS.length; i++) {
        const char = body[i];
        if (!(char in CHAR_TO_VALUE)) return null;
        const id = LEGACY_V1_STATEMENT_IDS[i];
        // A statement that has since been split out of the common corpus is
        // dropped rather than guessed: nothing in an old link says which
        // country its author was answering for.
        if (!KNOWN_STATEMENT_IDS.has(id)) continue;
        answers[id] = CHAR_TO_VALUE[char];
    }
    return { country: null, answers };
}

/** The answers of a profile code, for callers that do not need the country. */
export function decodeAnswers(code: string | null | undefined): AnswerRecord | null {
    return decodeProfile(code)?.answers ?? null;
}

/**
 * Validates an answers structure coming from an untrusted source (localStorage,
 * external data). Returns an AnswerRecord containing only known statements with
 * valid Likert values, or null if the input is unusable.
 */
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
