// Position model: statements, Likert answers and sourced party positions.
// Defensible architecture: scoring is a public, deterministic formula over
// positions explicitly validated by the user. No opaque model decides the
// profile.

export type DimensionKey =
    | "power"
    | "economy"
    | "geopolitics"
    | "social"
    | "environment"
    | "knowledge"
    | "moral";

// 5-point Likert scale.
// -2 = Strongly disagree, -1 = Somewhat disagree, 0 = Neutral / mixed,
// +1 = Somewhat agree, +2 = Strongly agree.
export type LikertValue = -2 | -1 | 0 | 1 | 2;

// null = "No opinion" (excluded from the computation, never penalized).
export type AnswerValue = LikertValue | null;

// User answers, keyed by statement id.
export type AnswerRecord = Record<string, AnswerValue>;

export interface Statement {
    id: string;
    dimension: DimensionKey;
    // A single affirmative statement (never two propositions in one question),
    // phrased to be acceptable both to a supporter and to an opponent.
    text: string;
    // What agreeing / disagreeing means (shown in the explanations).
    agreeLabel: string;
    disagreeLabel: string;
    // Part of the express test (12 statements, first profile in ~3 minutes).
    express?: boolean;
}

// Sourcing status of a position attributed to a party. The string literals are
// internal status codes (French-derived) referenced across the data files.
// "verifie": precise citation, reviewed and validated.
// "a_verifier": preliminary coding from the manifesto or public statements,
//   awaiting adversarial double coding.
// "non_documente": no public position identified; the party is not scored on
//   this statement.
export type SourceStatus = "verifie" | "a_verifier" | "non_documente";

export interface StanceSource {
    label: string; // e.g. "Programme législatives 2024, ch. 3"
    url?: string;
    date?: string; // ISO or year
    quote?: string;
}

export interface PartyStance {
    value: LikertValue;
    status: SourceStatus;
    source?: StanceSource;
}

// positions[statementId][partyId] -> PartyStance.
// A missing entry counts as "undocumented": the party is not scored on this statement.
export type PartyPositionsTable = Record<string, Record<string, PartyStance>>;

// Archetype signature: the answer pattern expected from a typical supporter of
// this current of thought, over the statements of its dimension.
export type ArchetypeSignature = Record<string, LikertValue>;

// Dominant archetype label per dimension (string = archetype enum value). Used
// by the synthetic profile matching rules, without depending on the archetype
// enums (avoids a coupling and a cast).
export type ArchetypeLabelMap = Record<DimensionKey, string>;

export const LIKERT_LABELS: Record<string, string> = {
    "-2": "Pas du tout d'accord",
    "-1": "Plutôt pas d'accord",
    "0": "Neutre / partagé",
    "1": "Plutôt d'accord",
    "2": "Tout à fait d'accord",
};

export const SOURCE_STATUS_LABELS: Record<SourceStatus, string> = {
    verifie: "Source vérifiée",
    a_verifier: "Codage préliminaire",
    non_documente: "Non documenté",
};

// Short labels for the 7 dimensions. Single source of truth, consumed by every
// view that displays a dimension (results, comparison, shared profile, survey
// flow, OG image). Values stay in French: they are user-facing product copy.
export const DIMENSION_LABELS: Record<DimensionKey, string> = {
    power: "Pouvoir",
    economy: "Économie",
    geopolitics: "Géopolitique",
    social: "Société",
    environment: "Environnement",
    knowledge: "Connaissance",
    moral: "Morale politique",
};

// Canonical display order of the dimensions.
export const DIMENSION_ORDER: DimensionKey[] = [
    "power",
    "economy",
    "geopolitics",
    "social",
    "environment",
    "knowledge",
    "moral",
];
