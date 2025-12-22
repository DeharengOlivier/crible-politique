import {
    AnswerRecord,
    ArchetypeLabelMap,
    DimensionKey,
    LikertValue,
    PartyStance,
    SourceStatus,
    Statement,
    StanceSource
} from "@/types/positions";
import { STATEMENTS } from "@/data/statements";
import { PARTY_POSITIONS } from "@/data/partyPositions";
import { PARTIES } from "@/data/parties";
import { ARCHETYPE_SIGNATURES } from "@/data/archetypeSignatures";
import { SYNTHETIC_PROFILES, SyntheticProfile } from "@/data/syntheticProfiles";
import { PoliticalParty } from "@/types/archetypes";

// Deterministic, auditable scoring engine.
// Public formula (see METHODOLOGY.md):
//   agreement(statement) = 1 - |user_position - party_position| / 4
//   score(party)         = mean of agreements over the statements where (a) the
//                          user took a position and (b) the party position is documented.
// "No opinion" answers and undocumented positions are excluded from the
// computation, never counted against the user nor against the party.
// No randomness, no opaque model: same answers => same result.

export interface StatementComparison {
    statement: Statement;
    userValue: LikertValue;
    partyValue: LikertValue;
    agreement: number; // 0..1
    status: SourceStatus;
    source?: StanceSource;
}

export interface PartyMatch {
    party: PoliticalParty;
    score: number; // 0..100
    comparisons: StatementComparison[];
    answeredAndDocumented: number;
    totalStatements: number;
    dimensionScores: Partial<Record<DimensionKey, number>>;
    lowCoverage: boolean;
}

export interface ArchetypeScore {
    label: string;
    dimension: DimensionKey;
    score: number; // 0..100
    matchedStatements: number;
}

export interface ProfileResult {
    // Dominant archetype per dimension (null if not enough answers).
    dimensionArchetypes: Partial<Record<DimensionKey, ArchetypeScore>>;
    // All archetype scores, for the breakdown view.
    allArchetypeScores: ArchetypeScore[];
    // User's mean position per dimension (-2..+2), null if no answer.
    dimensionPositions: Partial<Record<DimensionKey, number>>;
    syntheticProfile: SyntheticProfile | null;
    answeredCount: number;
    totalCount: number;
}

const MIN_COMPARISONS_FOR_CONFIDENCE = 10;

function agreementBetween(a: LikertValue, b: LikertValue): number {
    return 1 - Math.abs(a - b) / 4;
}

export function computePartyMatches(answers: AnswerRecord): PartyMatch[] {
    return PARTIES.map((party) => {
        const comparisons: StatementComparison[] = [];

        for (const statement of STATEMENTS) {
            const userValue = answers[statement.id];
            if (userValue === null || userValue === undefined) continue;

            const stance: PartyStance | undefined = PARTY_POSITIONS[statement.id]?.[party.id];
            if (!stance || stance.status === "non_documente") continue;

            comparisons.push({
                statement,
                userValue,
                partyValue: stance.value,
                agreement: agreementBetween(userValue, stance.value),
                status: stance.status,
                source: stance.source
            });
        }

        const score = comparisons.length
            ? Math.round(
                  (comparisons.reduce((sum, c) => sum + c.agreement, 0) / comparisons.length) * 100
              )
            : 0;

        // Per-dimension scores (only dimensions with at least one comparison).
        const dimensionScores: Partial<Record<DimensionKey, number>> = {};
        const byDimension = new Map<DimensionKey, StatementComparison[]>();
        comparisons.forEach((c) => {
            const list = byDimension.get(c.statement.dimension) || [];
            list.push(c);
            byDimension.set(c.statement.dimension, list);
        });
        byDimension.forEach((list, dim) => {
            dimensionScores[dim] = Math.round(
                (list.reduce((s, c) => s + c.agreement, 0) / list.length) * 100
            );
        });

        return {
            party,
            score,
            comparisons,
            answeredAndDocumented: comparisons.length,
            totalStatements: STATEMENTS.length,
            dimensionScores,
            lowCoverage: comparisons.length < MIN_COMPARISONS_FOR_CONFIDENCE
        };
    }).sort((a, b) => b.score - a.score);
}

export function computeProfile(answers: AnswerRecord): ProfileResult {
    const allArchetypeScores: ArchetypeScore[] = [];
    const dimensionArchetypes: Partial<Record<DimensionKey, ArchetypeScore>> = {};
    const dimensionPositions: Partial<Record<DimensionKey, number>> = {};

    // Mean position per dimension.
    const byDimension = new Map<DimensionKey, LikertValue[]>();
    for (const statement of STATEMENTS) {
        const v = answers[statement.id];
        if (v === null || v === undefined) continue;
        const list = byDimension.get(statement.dimension) || [];
        list.push(v);
        byDimension.set(statement.dimension, list);
    }
    byDimension.forEach((values, dim) => {
        dimensionPositions[dim] =
            Math.round((values.reduce<number>((s, v) => s + v, 0) / values.length) * 100) / 100;
    });

    // Each archetype score = mean similarity with its signature, over the
    // signature statements the user actually answered.
    for (const { dimension, signatures } of ARCHETYPE_SIGNATURES) {
        let best: ArchetypeScore | undefined;

        for (const [label, signature] of Object.entries(signatures)) {
            const entries = Object.entries(signature).filter(
                ([stmtId]) => answers[stmtId] !== null && answers[stmtId] !== undefined
            );
            if (entries.length === 0) continue;

            const similarity =
                entries.reduce(
                    (sum, [stmtId, expected]) =>
                        sum + agreementBetween(answers[stmtId] as LikertValue, expected),
                    0
                ) / entries.length;

            const archetypeScore: ArchetypeScore = {
                label,
                dimension,
                score: Math.round(similarity * 100),
                matchedStatements: entries.length
            };
            allArchetypeScores.push(archetypeScore);

            if (
                !best ||
                archetypeScore.score > best.score ||
                (archetypeScore.score === best.score &&
                    archetypeScore.matchedStatements > best.matchedStatements)
            ) {
                best = archetypeScore;
            }
        }

        if (best) {
            dimensionArchetypes[dimension] = best;
        }
    }

    const answeredCount = STATEMENTS.filter(
        (s) => answers[s.id] !== null && answers[s.id] !== undefined
    ).length;

    return {
        dimensionArchetypes,
        allArchetypeScores,
        dimensionPositions,
        syntheticProfile: findSyntheticProfile(dimensionArchetypes),
        answeredCount,
        totalCount: STATEMENTS.length
    };
}

function findSyntheticProfile(
    dimensionArchetypes: Partial<Record<DimensionKey, ArchetypeScore>>
): SyntheticProfile | null {
    // Map of dominant labels per dimension, evaluated by the synthetic profile
    // matching rules. No cast needed: by construction the labels are the values
    // of the archetype enums.
    const labels: ArchetypeLabelMap = {
        power: dimensionArchetypes.power?.label ?? "",
        economy: dimensionArchetypes.economy?.label ?? "",
        geopolitics: dimensionArchetypes.geopolitics?.label ?? "",
        social: dimensionArchetypes.social?.label ?? "",
        environment: dimensionArchetypes.environment?.label ?? "",
        knowledge: dimensionArchetypes.knowledge?.label ?? "",
        moral: dimensionArchetypes.moral?.label ?? ""
    };

    return SYNTHETIC_PROFILES.find((p) => p.matches(labels)) ?? null;
}
