import { describe, expect, it } from 'vitest';
import { SYNTHETIC_PROFILES } from '@/data/syntheticProfiles';
import { ARCHETYPE_SIGNATURES } from '@/data/archetypeSignatures';
import { closestSyntheticProfile, syntheticProfileFor } from '@/lib/scoringEngine';
import type { ArchetypeLabelMap, DimensionKey } from '@/types/positions';

// Measured 2026-08-29 on 5000 simulated runs per case, against the matcher that
// returned the first synthetic family whose boolean predicate accepted the seven
// dominant labels:
//
//   FR express : 20 to 23% of runs got no family at all, and 37 to 39% had
//                several candidate families, so the name shown in large type
//                was decided by the position of an entry in a source file.
//   BE express : 55 to 58% were decided that way, and three families were
//                structurally unreachable, whatever anyone answered:
//                "Souverainiste républicain d'ordre", "Multilatéraliste de la
//                raison", "Égalitariste des luttes croisées".
//   Everywhere  : two families out of fourteen took nearly half the results.
//
// A tool whose headline output depends on the order of a list is not neutral,
// and a family nobody can ever obtain is a promise the gallery does not keep.
// The archetype layer already states the rule this battery brings one level up
// (data/archetypeSignatures.ts): distinct expectations, therefore reachable by
// construction, therefore independent of declaration order.

type Signatures = Record<string, Record<string, number>>;

function signaturesOf(dimension: DimensionKey): Signatures {
    const entry = ARCHETYPE_SIGNATURES.find((d) => d.dimension === dimension);
    if (entry === undefined) throw new Error(`no signatures for ${dimension}`);
    return entry.signatures as Signatures;
}

const DIMENSIONS: DimensionKey[] = [
    'power',
    'economy',
    'geopolitics',
    'social',
    'environment',
    'knowledge',
    'moral'
];

/** The archetype of a dimension that sits closest to the average of them all. */
function mostCentralArchetype(dimension: DimensionKey): string {
    const signatures = signaturesOf(dimension);
    const labels = Object.keys(signatures);
    const statementIds = Object.keys(signatures[labels[0]]);
    const centroid: Record<string, number> = {};
    for (const statementId of statementIds) {
        centroid[statementId] =
            labels.reduce((sum, label) => sum + signatures[label][statementId], 0) / labels.length;
    }
    let best = labels[0];
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const label of labels) {
        const distance = statementIds.reduce(
            (sum, id) => sum + Math.abs(signatures[label][id] - centroid[id]),
            0
        );
        if (distance < bestDistance) {
            bestDistance = distance;
            best = label;
        }
    }
    return best;
}

/**
 * Respondents that hold everything a family expects. The dimensions it names
 * are pinned to the currents it accepts; the ones it says nothing about are
 * varied, because a family that describes a single dimension leaves the other
 * six open and no single respondent stands for it.
 */
function* respondentsHolding(
    family: (typeof SYNTHETIC_PROFILES)[number],
    rng: () => number,
    draws: number
): Generator<ArchetypeLabelMap> {
    for (let draw = 0; draw < draws; draw += 1) {
        const labels = {} as ArchetypeLabelMap;
        for (const dimension of DIMENSIONS) {
            const expected = family.expects[dimension] ?? [];
            if (expected.length > 0) {
                labels[dimension] = expected[Math.floor(rng() * expected.length)];
            } else {
                const options = draw === 0 ? [mostCentralArchetype(dimension)] : Object.keys(signaturesOf(dimension));
                labels[dimension] = options[Math.floor(rng() * options.length)];
            }
        }
        yield labels;
    }
}

function mulberry32(seed: number): () => number {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function randomLabels(rng: () => number): ArchetypeLabelMap {
    const labels = {} as ArchetypeLabelMap;
    for (const dimension of DIMENSIONS) {
        const options = Object.keys(signaturesOf(dimension));
        labels[dimension] = options[Math.floor(rng() * options.length)];
    }
    return labels;
}

describe('every synthetic family is reachable', () => {
    it.each(SYNTHETIC_PROFILES.map((family) => [family.title, family.id] as const))(
        'has a respondent it names: %s',
        (_title, id) => {
            const family = SYNTHETIC_PROFILES.find((f) => f.id === id)!;
            const rng = mulberry32(7);
            let named = false;
            for (const labels of respondentsHolding(family, rng, 3000)) {
                if (syntheticProfileFor(labels)?.id === id) {
                    named = true;
                    break;
                }
            }
            expect(named, `no set of dominant currents is ever named "${id}"`).toBe(true);
        }
    );

    it('gives every family a distinct set of expectations', () => {
        const seen = new Map<string, string>();
        for (const family of SYNTHETIC_PROFILES) {
            const key = DIMENSIONS.map((d) => (family.expects[d] ?? []).join('+')).join('|');
            const previous = seen.get(key);
            expect(previous, `${family.id} expects exactly what ${previous} expects`).toBeUndefined();
            seen.set(key, family.id);
        }
    });
});

describe('the family named does not depend on the order of the data file', () => {
    it('answers the same on 500 label sets with the list reversed', () => {
        const rng = mulberry32(4242);
        const samples = Array.from({ length: 500 }, () => randomLabels(rng));
        const before = samples.map((labels) => syntheticProfileFor(labels)?.id ?? null);

        SYNTHETIC_PROFILES.reverse();
        try {
            const after = samples.map((labels) => syntheticProfileFor(labels)?.id ?? null);
            expect(after).toEqual(before);
        } finally {
            SYNTHETIC_PROFILES.reverse();
        }
    });
});

// Measured 2026-08-29, margin in points between the closest family and the next
// one, over the whole party corpus and 5000 uniform draws:
//
//   respondent answering a party's documented positions exactly : median 1, 33% at 0
//   the same, with 3 answers redrawn at random                  : median 1, 27% at 0
//   uniform random answers, full French test                    : median 2, 16% at 0
//
// The most coherent respondent imaginable is separated from the runner-up by
// about as little as pure noise is. The families describe one to three of the
// seven dimensions, so most of the comparison is background they share, and the
// winner is decided in the last point. Naming one of them alone, in large type,
// would present a coin flip as a result.
//
// The party layer already met this and answered it: it publishes a leading
// group, every party whose interval reaches the leader's lower bound, instead of
// a winner. The same rule applies here, for the same reason, with the same
// statistics.
describe('the families the answers cannot tell apart', () => {
    it('always contains the family that is named', () => {
        const rng = mulberry32(11);
        for (let i = 0; i < 300; i += 1) {
            const fit = closestSyntheticProfile(randomLabels(rng));
            expect(fit.leadingGroup[0]?.id).toBe(fit.family?.id);
        }
    });

    it('is empty when nothing was answered', () => {
        const empty = DIMENSIONS.reduce((map, d) => ({ ...map, [d]: '' }), {} as ArchetypeLabelMap);
        expect(closestSyntheticProfile(empty).leadingGroup).toEqual([]);
    });

    it('never leaves out a family that fits better than one it keeps', () => {
        // The group is a prefix of the ranking, so a reader can trust that no
        // closer family was dropped from the list they are shown.
        const rng = mulberry32(12);
        for (let i = 0; i < 300; i += 1) {
            const fit = closestSyntheticProfile(randomLabels(rng));
            const insideScores = fit.leadingGroup.map((f) => fit.scores[f.id]);
            const outside = SYNTHETIC_PROFILES.filter(
                (f) => !fit.leadingGroup.some((g) => g.id === f.id)
            ).map((f) => fit.scores[f.id]);
            const worstInside = Math.min(...insideScores);
            for (const score of outside) expect(score).toBeLessThanOrEqual(worstInside);
        }
    });

    // The group is only honest if it means "these fit equally well". A family
    // that expects the opposite current on a dimension the respondent holds does
    // not fit equally well, and the statistics have to be able to see it. Each
    // pair below names one dimension with no current in common.
    function confusedPairs(minimumContradictions: number): string[] {
        const confused: string[] = [];
        for (const held of SYNTHETIC_PROFILES) {
            const labels = {} as ArchetypeLabelMap;
            for (const dimension of DIMENSIONS) {
                const expected = held.expects[dimension] ?? [];
                labels[dimension] = expected[0] ?? mostCentralArchetype(dimension);
            }
            const group = closestSyntheticProfile(labels).leadingGroup;

            for (const other of SYNTHETIC_PROFILES) {
                if (other.id === held.id) continue;
                const contradictions = DIMENSIONS.filter((dimension) => {
                    const mine = held.expects[dimension] ?? [];
                    const theirs = other.expects[dimension] ?? [];
                    return (
                        mine.length > 0 &&
                        theirs.length > 0 &&
                        theirs.every((label) => !mine.includes(label))
                    );
                }).length;
                if (contradictions < minimumContradictions) continue;
                if (group.some((f) => f.id === other.id)) {
                    confused.push(`${held.id} / ${other.id}`);
                }
            }
        }
        return confused;
    }

    it('tells apart two families that disagree on more than one dimension', () => {
        expect(confusedPairs(2)).toEqual([]);
    });

    it('separates even the pairs that disagree on a single dimension', () => {
        // Four pairs used to sit here, frozen, with the note that the fix was
        // editorial: families describing one or two dimensions of seven left a
        // respondent about whom almost nothing was claimed. On 2026-08-29
        // (night) every family was described on all seven dimensions, at a
        // reader's demand, and the list emptied exactly as predicted. Frozen
        // at empty so that nothing silently joins it again.
        expect(confusedPairs(1)).toEqual([]);
    });

    it('does not depend on the order of the data file', () => {
        const rng = mulberry32(13);
        const samples = Array.from({ length: 200 }, () => randomLabels(rng));
        const before = samples.map((l) => closestSyntheticProfile(l).leadingGroup.map((f) => f.id));

        SYNTHETIC_PROFILES.reverse();
        try {
            const after = samples.map((l) => closestSyntheticProfile(l).leadingGroup.map((f) => f.id));
            expect(after).toEqual(before);
        } finally {
            SYNTHETIC_PROFILES.reverse();
        }
    });
});

describe('a completed analysis is always named', () => {
    it('never leaves a full set of seven dominant currents without a family', () => {
        const rng = mulberry32(99);
        const unnamed: ArchetypeLabelMap[] = [];
        for (let i = 0; i < 2000; i += 1) {
            const labels = randomLabels(rng);
            if (syntheticProfileFor(labels) === null) unnamed.push(labels);
        }
        expect(unnamed.slice(0, 3)).toEqual([]);
    });

    it('still refuses to name a respondent who answered nothing', () => {
        const empty = DIMENSIONS.reduce((map, d) => ({ ...map, [d]: '' }), {} as ArchetypeLabelMap);
        expect(syntheticProfileFor(empty)).toBeNull();
    });
});
