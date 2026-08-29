import {
    AnswerRecord,
    ArchetypeLabelMap,
    DimensionKey,
    LikertValue,
    PartyStance,
    Respondent,
    SourceStatus,
    Statement,
    StanceSource
} from "@/types/positions";
import { STATEMENTS } from "@/data/statements";
import { PARTY_POSITIONS } from "@/data/partyPositions";
import { ARCHETYPE_SIGNATURES } from "@/data/archetypeSignatures";
import { SYNTHETIC_PROFILES, SyntheticProfile } from "@/data/syntheticProfiles";
import { PoliticalParty } from "@/types/archetypes";
import { partiesFor, statementsFor } from "@/lib/electoralScope";

// Deterministic, auditable scoring engine.
//
// Public formula (see METHODOLOGY.md):
//   agreement(statement) = 1 - |user_position - party_position| / 4
//   proximity(party)     = weighted mean of agreements over the statements where
//                          (a) the user took a position and (b) the party
//                          position is documented.
// "No opinion" answers and undocumented positions are excluded, never counted
// against the user nor against the party.
//
// Three things the previous version did not say, all of them measurable:
//   - a proximity is an estimate over a sample of statements, so it carries a
//     confidence interval, and two parties whose intervals overlap are tied,
//     not first and second;
//   - the proximity model rewards a party coded near the middle of every scale,
//     so a directional reading is published beside it;
//   - a respondent is only compared against parties they could vote for.
//
// No randomness, no clock, no I/O: same answers and same options always produce
// the same result, and every number is recomputable by hand.

export interface StatementComparison {
    statement: Statement;
    userValue: LikertValue;
    partyValue: LikertValue;
    agreement: number; // 0..1
    weight: number;
    status: SourceStatus;
    source?: StanceSource;
}

export interface PartyMatch {
    party: PoliticalParty;
    /** Proximity, 0..100: the weighted mean agreement, rounded. */
    score: number;
    /** Bounds of the 90% confidence interval around the proximity, 0..100. */
    lowerBound: number;
    upperBound: number;
    /** Competition rank, 1-based. Equal scores share a rank: 1, 2, 2, 4. */
    rank: number;
    /** Whether this party's interval reaches the leader's, i.e. it may be first. */
    inLeadingGroup: boolean;
    /**
     * Directional reading, 0..100, 50 meaning orthogonal. Rewards agreeing
     * intensely on the same side rather than sitting at a short distance, which
     * is what a proximity score cannot distinguish.
     */
    directionalScore: number;
    /** Statements where user and party are on the same side, neutrality excluded. */
    sameSideCount: number;
    oppositeSideCount: number;
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
    // Dominant archetype per dimension (absent if the dimension went unanswered).
    dimensionArchetypes: Partial<Record<DimensionKey, ArchetypeScore>>;
    /**
     * Every archetype scoring exactly what the dominant one scores, including
     * it. More than one name means the answers did not settle the dimension.
     *
     * This is not a corner case: on the express test each dimension is read
     * from 2 statements while signatures span 3 or 4, so distinct currents of
     * thought collapse onto the same partial pattern and cannot be told apart.
     * Returning the first of them as if it had won was the same defect as
     * announcing a single closest party inside the confidence interval.
     */
    dimensionTies: Partial<Record<DimensionKey, string[]>>;
    // All archetype scores, for the breakdown view.
    allArchetypeScores: ArchetypeScore[];
    // User's mean position per dimension (-2..+2), null if no answer.
    dimensionPositions: Partial<Record<DimensionKey, number>>;
    syntheticProfile: SyntheticProfile | null;
    /**
     * How well that family actually fits, and what came second. Every completed
     * analysis is now named, so the name alone would hide the difference
     * between a respondent a family describes closely and one who merely had
     * to be put somewhere. The margin is what says which of the two happened.
     */
    syntheticProfileFit: SyntheticProfileFit;
    answeredCount: number;
}

/** Who the respondent is compared against, and how much each statement counts. */
export interface ScoringOptions extends Respondent {
    /**
     * Salience: how much a statement counts for this respondent, keyed by
     * statement id. Absent means 1. A weight must be a positive finite number,
     * checked here because this object crosses the boundary from stored UI
     * state, which can be anything.
     */
    weights?: Readonly<Record<string, number>>;
}

const MIN_COMPARISONS_FOR_CONFIDENCE = 10;

/** Two-sided 90% normal quantile. Published so the interval is recomputable. */
const CONFIDENCE_Z = 1.645;

/** The widest a Likert answer can be from a party position. */
const MAX_DISTANCE = 4;

function agreementBetween(a: LikertValue, b: LikertValue): number {
    return 1 - Math.abs(a - b) / MAX_DISTANCE;
}

function clampToUnit(value: number): number {
    return Math.min(1, Math.max(0, value));
}

function asPercentage(value: number): number {
    return Math.round(clampToUnit(value) * 100);
}

function weightOf(weights: ScoringOptions["weights"], statementId: string): number {
    const weight = weights?.[statementId];
    if (weight === undefined) return 1;
    if (!Number.isFinite(weight) || weight <= 0) {
        throw new RangeError(
            `Salience weight for "${statementId}" must be a positive finite number, received ${String(weight)}`
        );
    }
    return weight;
}

/**
 * Standard error of a weighted mean, under reliability weights.
 *
 * Reduces exactly to s / sqrt(n) when every weight is 1, which is the form
 * published in METHODOLOGY.md. Returns null below two statements, where a
 * dispersion cannot be estimated at all.
 */
function standardErrorOfWeightedMean(
    values: readonly number[],
    weights: readonly number[],
    mean: number
): number | null {
    if (values.length < 2) return null;

    const sumWeights = weights.reduce((sum, w) => sum + w, 0);
    const sumSquaredWeights = weights.reduce((sum, w) => sum + w * w, 0);
    const denominator = sumWeights - sumSquaredWeights / sumWeights;
    if (denominator <= 0) return null;

    const weightedVariance =
        values.reduce((sum, value, i) => sum + weights[i] * (value - mean) ** 2, 0) / denominator;

    return Math.sqrt(weightedVariance * sumSquaredWeights) / sumWeights;
}

interface ScoredParty {
    party: PoliticalParty;
    comparisons: StatementComparison[];
    proximity: number;
    lowerBound: number;
    upperBound: number;
    directionalScore: number;
    sameSideCount: number;
    oppositeSideCount: number;
    dimensionScores: Partial<Record<DimensionKey, number>>;
}

function compareOneParty(
    party: PoliticalParty,
    answers: AnswerRecord,
    statements: readonly Statement[],
    weights: ScoringOptions["weights"]
): ScoredParty {
    const comparisons: StatementComparison[] = [];

    for (const statement of statements) {
        const userValue = answers[statement.id];
        if (userValue === null || userValue === undefined) continue;

        const stance: PartyStance | undefined = PARTY_POSITIONS[statement.id]?.[party.id];
        if (!stance || stance.status === "non_documente") continue;

        comparisons.push({
            statement,
            userValue,
            partyValue: stance.value,
            agreement: agreementBetween(userValue, stance.value),
            weight: weightOf(weights, statement.id),
            status: stance.status,
            source: stance.source
        });
    }

    const sumWeights = comparisons.reduce((sum, c) => sum + c.weight, 0);
    const proximity = sumWeights
        ? comparisons.reduce((sum, c) => sum + c.weight * c.agreement, 0) / sumWeights
        : 0;

    const standardError = standardErrorOfWeightedMean(
        comparisons.map((c) => c.agreement),
        comparisons.map((c) => c.weight),
        proximity
    );
    const margin = standardError === null ? Infinity : CONFIDENCE_Z * standardError;

    // Directional reading: the sum of signed products, normalised by the
    // strongest possible agreement. 0.5 is orthogonality, not indifference.
    const directional = sumWeights
        ? comparisons.reduce((sum, c) => sum + c.weight * c.userValue * c.partyValue, 0) /
          (MAX_DISTANCE * sumWeights)
        : 0;

    const sameSideCount = comparisons.filter(
        (c) => c.userValue !== 0 && c.partyValue !== 0 && Math.sign(c.userValue) === Math.sign(c.partyValue)
    ).length;
    const oppositeSideCount = comparisons.filter(
        (c) => c.userValue !== 0 && c.partyValue !== 0 && Math.sign(c.userValue) !== Math.sign(c.partyValue)
    ).length;

    const byDimension = new Map<DimensionKey, StatementComparison[]>();
    for (const comparison of comparisons) {
        const list = byDimension.get(comparison.statement.dimension) ?? [];
        list.push(comparison);
        byDimension.set(comparison.statement.dimension, list);
    }
    const dimensionScores: Partial<Record<DimensionKey, number>> = {};
    byDimension.forEach((list, dimension) => {
        const dimensionWeights = list.reduce((sum, c) => sum + c.weight, 0);
        dimensionScores[dimension] = asPercentage(
            list.reduce((sum, c) => sum + c.weight * c.agreement, 0) / dimensionWeights
        );
    });

    return {
        party,
        comparisons,
        proximity,
        lowerBound: asPercentage(proximity - margin),
        upperBound: asPercentage(proximity + margin),
        directionalScore: asPercentage(0.5 + directional / 2),
        sameSideCount,
        oppositeSideCount,
        dimensionScores
    };
}

/**
 * Whether the answers really put the leading party ahead of another, or the
 * gap between their scores is noise.
 *
 * Paired, statement by statement, over the statements where both parties are
 * documented, for the same reason as the family layer: both parties are judged
 * by the same respondent on the same corpus, so the two scores are not
 * independent samples. The question is not "how sure are we of each score" but
 * "how consistently does this respondent side with one party over the other".
 *
 * Until 2026-08-29 the group was decided by overlap of the two independent
 * confidence intervals, and a reader reported the result: 80/76/75/69 all
 * called "à égalité en tête". Measured that day on seeded random respondents,
 * the median leading group was all 12 parties, gaps up to 20 points were
 * called ties, and the group was not even a prefix of the ranking. The paired
 * rule brings a realistic respondent (a party's positions with 20% of answers
 * re-rolled) to a median group of 1.
 */
function separatedOnSharedStatements(leader: ScoredParty, other: ScoredParty): boolean {
    const otherAgreements = new Map(other.comparisons.map((c) => [c.statement.id, c.agreement]));
    const differences: number[] = [];
    const weights: number[] = [];
    for (const comparison of leader.comparisons) {
        const otherAgreement = otherAgreements.get(comparison.statement.id);
        if (otherAgreement === undefined) continue;
        differences.push(comparison.agreement - otherAgreement);
        weights.push(comparison.weight);
    }
    const sumWeights = weights.reduce((sum, w) => sum + w, 0);
    if (sumWeights === 0) return false;
    const mean = differences.reduce((sum, d, i) => sum + weights[i] * d, 0) / sumWeights;
    const standardError = standardErrorOfWeightedMean(differences, weights, mean);
    if (standardError === null) return false;
    return mean - CONFIDENCE_Z * standardError > 0;
}

/**
 * Proximity of the respondent to every party they could vote for, best first.
 *
 * O(parties x statements) comparisons, at most 12 x 30 here, plus one sort and
 * O(parties x statements) paired separations against the leader.
 */
export function computePartyMatches(answers: AnswerRecord, options: ScoringOptions): PartyMatch[] {
    const statements = statementsFor(options.country);
    const scored = partiesFor(options.country, options.college)
        .map((party) => compareOneParty(party, answers, statements, options.weights))
        .sort((a, b) => b.proximity - a.proximity);

    // A prefix of the ranking, never a filter over it: "à égalité en tête" is
    // read as "the top of the list", so the group must not skip a rank and
    // keep a lower one. A leader the answers separate from nobody leads
    // nothing: the group is then every party, which is the honest reading of
    // "we cannot tell them apart".
    const inLeadingGroup = scored.map(() => false);
    for (let index = 0; index < scored.length; index += 1) {
        if (index > 0 && separatedOnSharedStatements(scored[0], scored[index])) break;
        inLeadingGroup[index] = true;
    }

    let rank = 0;
    let previousScore: number | null = null;
    return scored.map((entry, index) => {
        const score = asPercentage(entry.proximity);
        if (previousScore === null || score !== previousScore) {
            rank = index + 1;
            previousScore = score;
        }
        return {
            party: entry.party,
            score,
            lowerBound: entry.lowerBound,
            upperBound: entry.upperBound,
            rank,
            inLeadingGroup: inLeadingGroup[index],
            directionalScore: entry.directionalScore,
            sameSideCount: entry.sameSideCount,
            oppositeSideCount: entry.oppositeSideCount,
            comparisons: entry.comparisons,
            answeredAndDocumented: entry.comparisons.length,
            totalStatements: statements.length,
            dimensionScores: entry.dimensionScores,
            lowCoverage: entry.comparisons.length < MIN_COMPARISONS_FOR_CONFIDENCE
        };
    });
}

/**
 * The respondent's own profile: dominant current per dimension, mean position
 * per dimension, and the synthetic profile they imply.
 *
 * Country-independent: archetypes are defined over the statements common to
 * both countries, and a statement the respondent never saw is simply absent
 * from their answers.
 */
export function computeProfile(answers: AnswerRecord): ProfileResult {
    const allArchetypeScores: ArchetypeScore[] = [];
    const dimensionArchetypes: Partial<Record<DimensionKey, ArchetypeScore>> = {};
    const dimensionTies: Partial<Record<DimensionKey, string[]>> = {};
    const dimensionPositions: Partial<Record<DimensionKey, number>> = {};

    const byDimension = new Map<DimensionKey, LikertValue[]>();
    for (const statement of STATEMENTS) {
        const value = answers[statement.id];
        if (value === null || value === undefined) continue;
        const list = byDimension.get(statement.dimension) ?? [];
        list.push(value);
        byDimension.set(statement.dimension, list);
    }
    byDimension.forEach((values, dimension) => {
        dimensionPositions[dimension] =
            Math.round((values.reduce<number>((sum, v) => sum + v, 0) / values.length) * 100) / 100;
    });

    // Each archetype scores the similarity between the respondent's answers and
    // its signature. Every archetype of a dimension carries the same statements
    // (held by __tests__/archetypes.test.ts), so the comparison is between
    // equals and the shortest signature no longer wins.
    for (const { dimension, signatures } of ARCHETYPE_SIGNATURES) {
        let best: { score: ArchetypeScore; similarity: number } | undefined;
        const scoresOfDimension: { label: string; similarity: number }[] = [];

        for (const [label, signature] of Object.entries(signatures)) {
            const answered = Object.entries(signature).filter(
                ([statementId]) => answers[statementId] !== null && answers[statementId] !== undefined
            );
            if (answered.length === 0) continue;

            const similarity =
                answered.reduce(
                    (sum, [statementId, expected]) =>
                        sum + agreementBetween(answers[statementId] as LikertValue, expected),
                    0
                ) / answered.length;

            const archetypeScore: ArchetypeScore = {
                label,
                dimension,
                score: Math.round(similarity * 100),
                matchedStatements: answered.length
            };
            allArchetypeScores.push(archetypeScore);
            scoresOfDimension.push({ label, similarity });

            // Compared on the exact similarity, never on the rounded score: two
            // genuinely different archetypes must not be made equal by display.
            if (
                !best ||
                similarity > best.similarity ||
                (similarity === best.similarity &&
                    archetypeScore.matchedStatements > best.score.matchedStatements)
            ) {
                best = { score: archetypeScore, similarity };
            }
        }

        if (best) {
            dimensionArchetypes[dimension] = best.score;
            // Tied on the exact similarity, in declaration order, so the list
            // is the same for the same answers on every run. Exact rather than
            // rounded, and the two never disagree: every signature of a
            // dimension has the same length, so two similarities differ by at
            // least 1/(4n), which is 6.25 points at worst.
            dimensionTies[dimension] = scoresOfDimension
                .filter((entry) => entry.similarity === best!.similarity)
                .map((entry) => entry.label);
        }
    }

    const answeredCount = STATEMENTS.filter(
        (s) => answers[s.id] !== null && answers[s.id] !== undefined
    ).length;
    const fit = findSyntheticProfile(dimensionArchetypes);

    return {
        dimensionArchetypes,
        dimensionTies,
        allArchetypeScores,
        dimensionPositions,
        syntheticProfile: fit.family,
        syntheticProfileFit: fit,
        answeredCount
    };
}

/**
 * The synthetic family closest to a set of dominant archetype labels.
 *
 * Exported because it is the whole of what a shared profile page displays:
 * rendering one needs the labels, never the answers they were derived from.
 *
 * Closest, not first to match. The families used to be boolean predicates read
 * in declaration order, and on 5000 simulated Belgian express runs 58% of
 * respondents were named by the position of an entry in a source file while
 * three families could never come out at all. Distance settles it instead: the
 * labels are turned back into the answers they stand for, each family carries
 * the answers it expects, and the nearest one wins. Order stops mattering, and
 * every family is reachable by construction, the same guarantee the archetype
 * layer already holds one level below.
 */
export function syntheticProfileFor(labels: ArchetypeLabelMap): SyntheticProfile | null {
    return closestSyntheticProfile(labels).family;
}

export interface SyntheticProfileFit {
    family: SyntheticProfile | null;
    /** Agreement with the family's expectations, 0 to 100. */
    score: number;
    /**
     * Every family these answers cannot separate from the closest one, that one
     * first. Measured 2026-08-29: a respondent reproducing a party's documented
     * positions exactly is a single point away from the runner-up, and a third of
     * them are an exact tie. Naming one family alone would present a coin flip as
     * a result, so the interval decides who is in and the reader sees the group,
     * exactly as the party ranking already does.
     */
    leadingGroup: SyntheticProfile[];
    /** Agreement of every family, 0 to 100, by family id. */
    scores: Record<string, number>;
    /** The next closest family, and how far behind it is, in the same points. */
    runnerUp: SyntheticProfile | null;
    margin: number;
}

/**
 * Whether the answers really put the first family ahead of the second, or
 * whether the gap between them is within the noise of a single respondent.
 *
 * Paired, statement by statement, and that is the whole point. Both families are
 * judged on the same statements by the same person, so the two are not
 * independent samples: the question is not "how sure are we of each score" but
 * "how consistently does this respondent side with one rather than the other".
 * The statements where the two expect the same thing, which is most of the
 * corpus since a family describes one to three of the seven dimensions, cancel
 * out exactly instead of drowning the ones where they differ.
 *
 * Measured 2026-08-29 on the whole party corpus: comparing the two scores as
 * independent means left a median of 10 families out of 14 inside the leading
 * group, even for a respondent reproducing a party's documented positions
 * exactly, and 19 pairs of families expecting opposite currents were called
 * indistinguishable. The paired difference is the correct test and it is the one
 * the reader assumes is being made.
 */
function separatedFrom(leader: readonly number[], other: readonly number[]): boolean {
    if (leader.length !== other.length || leader.length < 2) return false;
    const differences = leader.map((agreement, i) => agreement - other[i]);
    const mean = differences.reduce((sum, d) => sum + d, 0) / differences.length;
    const standardError = standardErrorOfWeightedMean(
        differences,
        differences.map(() => 1),
        mean
    );
    if (standardError === null) return false;
    return mean - CONFIDENCE_Z * standardError > 0;
}

export function closestSyntheticProfile(labels: ArchetypeLabelMap): SyntheticProfileFit {
    const respondent = expectedAnswersOf(labels);
    const empty: SyntheticProfileFit = {
        family: null,
        score: 0,
        leadingGroup: [],
        scores: {},
        runnerUp: null,
        margin: 0
    };
    if (Object.keys(respondent).length === 0) return empty;

    const ranked = SYNTHETIC_PROFILES.map((family) => {
        const { similarity, agreements } = similarityBetween(respondent, expectationsOf(family));
        return {
            family,
            similarity,
            agreements,
            // How much the family commits to. On an exact tie the more specific
            // description wins: it says more about the respondent and risks more.
            constrained: ARCHETYPE_SIGNATURES.filter(
                ({ dimension }) => (family.expects[dimension] ?? []).length > 0
            ).length
        };
    }).sort(
        (a, b) =>
            b.similarity - a.similarity ||
            b.constrained - a.constrained ||
            // Last resort, and never the list's order: two families that fit
            // identically must not be separated by which was typed first.
            a.family.id.localeCompare(b.family.id)
    );

    const [best, second] = ranked;
    const scores: Record<string, number> = {};
    for (const entry of ranked) scores[entry.family.id] = Math.round(entry.similarity * 100);

    // A prefix of the ranking, not a filter over it: the group is read as "the
    // closest families", so it must never skip one and keep a more distant one.
    const leadingGroup: SyntheticProfile[] = [];
    for (const entry of ranked) {
        if (entry !== best && separatedFrom(best.agreements, entry.agreements)) break;
        leadingGroup.push(entry.family);
    }

    return {
        family: best.family,
        score: scores[best.family.id],
        leadingGroup,
        scores,
        runnerUp: second?.family ?? null,
        margin: second === undefined ? 0 : Math.round((best.similarity - second.similarity) * 100)
    };
}

/**
 * The answers a respondent described by these labels would have given: each
 * dominant current is published as a signature, so the labels can be read back
 * as the pattern they stand for. A dimension left unanswered stays absent.
 */
function expectedAnswersOf(labels: ArchetypeLabelMap): Record<string, number> {
    const expected: Record<string, number> = {};
    for (const { dimension, signatures } of ARCHETYPE_SIGNATURES) {
        const signature = signatures[labels[dimension]];
        if (signature === undefined) continue;
        for (const [statementId, value] of Object.entries(signature)) expected[statementId] = value;
    }
    return expected;
}

/** One dimension of a family's description: the patterns it accepts there. */
interface DimensionExpectation {
    statementIds: string[];
    /** Alternatives, never blended: a family recognises itself in any of them. */
    accepted: Record<string, number>[];
}

const familyExpectations = new Map<string, DimensionExpectation[]>();

/**
 * What a family expects, dimension by dimension. On a dimension it names, the
 * signatures of the currents it accepts, kept apart; on a dimension it leaves
 * out, the average of every current of that dimension, which is the only
 * neutral value: a family that says nothing about the economy must neither gain
 * nor lose from it.
 *
 * Alternatives are kept apart rather than averaged, because the average of two
 * opposite currents is a third position that neither of them holds. Averaging
 * them made "Néoréaliste stratège" unreachable: it accepts a sovereignist or an
 * atlanticist geopolitics, and the midpoint of the two resembled neither.
 */
function expectationsOf(family: SyntheticProfile): DimensionExpectation[] {
    const cached = familyExpectations.get(family.id);
    if (cached !== undefined) return cached;

    const expectations: DimensionExpectation[] = [];
    for (const { dimension, signatures } of ARCHETYPE_SIGNATURES) {
        const named = (family.expects[dimension] ?? []).filter((l) => signatures[l] !== undefined);
        const allLabels = Object.keys(signatures);
        const statementIds = Object.keys(signatures[allLabels[0]]);
        if (named.length > 0) {
            expectations.push({ statementIds, accepted: named.map((label) => signatures[label]) });
            continue;
        }
        const centroid: Record<string, number> = {};
        for (const statementId of statementIds) {
            centroid[statementId] =
                allLabels.reduce((sum, label) => sum + signatures[label][statementId], 0) /
                allLabels.length;
        }
        expectations.push({ statementIds, accepted: [centroid] });
    }
    familyExpectations.set(family.id, expectations);
    return expectations;
}

/**
 * Mean agreement over the statements the respondent stands on, each dimension
 * scored by the accepted pattern that fits best. O(dimensions x currents x
 * statements), all three bounded by the published data.
 *
 * The per-statement agreements come back with the mean, because how much they
 * disagree with each other is what says whether the mean can be trusted to
 * separate one family from the next.
 */
function similarityBetween(
    respondent: Record<string, number>,
    expectations: DimensionExpectation[]
): { similarity: number; agreements: number[] } {
    const agreements: number[] = [];
    for (const { statementIds, accepted } of expectations) {
        const shared = statementIds.filter((id) => respondent[id] !== undefined);
        if (shared.length === 0) continue;
        const perPattern = accepted.map((pattern) =>
            shared.map((id) => 1 - Math.abs(respondent[id] - pattern[id]) / MAX_DISTANCE)
        );
        const meanOf = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;
        const best = perPattern.reduce((a, b) => (meanOf(b) > meanOf(a) ? b : a));
        agreements.push(...best);
    }
    if (agreements.length === 0) return { similarity: 0, agreements };
    return {
        similarity: agreements.reduce((sum, a) => sum + a, 0) / agreements.length,
        agreements
    };
}

function findSyntheticProfile(
    dimensionArchetypes: Partial<Record<DimensionKey, ArchetypeScore>>
): SyntheticProfileFit {
    const labels: ArchetypeLabelMap = {
        power: dimensionArchetypes.power?.label ?? "",
        economy: dimensionArchetypes.economy?.label ?? "",
        geopolitics: dimensionArchetypes.geopolitics?.label ?? "",
        social: dimensionArchetypes.social?.label ?? "",
        environment: dimensionArchetypes.environment?.label ?? "",
        knowledge: dimensionArchetypes.knowledge?.label ?? "",
        moral: dimensionArchetypes.moral?.label ?? ""
    };

    return closestSyntheticProfile(labels);
}
