import { describe, it, expect } from 'vitest';
import { computeProfile, computePartyMatches } from '@/lib/scoringEngine';
import { STATEMENTS } from '@/data/statements';
import { PARTY_POSITIONS } from '@/data/partyPositions';
import { ARCHETYPE_SIGNATURES } from '@/data/archetypeSignatures';
import { DIMENSION_ORDER } from '@/types/positions';
import type { AnswerRecord, DimensionKey, LikertValue } from '@/types/positions';

// Direct coverage of computeProfile(): the layer that turns raw answers into
// per-dimension positions and dominant archetypes. The existing suite only
// exercised it for determinism and the empty case.

// Build a full answer set from one party's documented positions.
function answersFromParty(partyId: string): AnswerRecord {
  const answers: AnswerRecord = {};
  for (const s of STATEMENTS) {
    answers[s.id] = PARTY_POSITIONS[s.id][partyId].value;
  }
  return answers;
}

describe('computeProfile: dimension positions', () => {
  it('returns the mean answer per dimension, rounded to 2 decimals', () => {
    const answers = answersFromParty('fr_lfi');
    const profile = computeProfile(answers);

    for (const dim of DIMENSION_ORDER) {
      const values = STATEMENTS
        .filter((s) => s.dimension === dim)
        .map((s) => answers[s.id] as number);
      const expected = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
      expect(profile.dimensionPositions[dim]).toBeCloseTo(expected, 5);
    }
  });

  it('counts every answered statement', () => {
    const answers = answersFromParty('fr_rn');
    const profile = computeProfile(answers);
    expect(profile.answeredCount).toBe(STATEMENTS.length);
    expect(profile.totalCount).toBe(STATEMENTS.length);
  });

  it('omits a dimension entirely when no statement in it is answered', () => {
    // Answer only the economy statements, leave everything else as "no opinion".
    const answers: AnswerRecord = {};
    for (const s of STATEMENTS) {
      answers[s.id] = s.dimension === 'economy' ? (1 as LikertValue) : null;
    }
    const profile = computeProfile(answers);
    expect(profile.dimensionPositions.economy).toBe(1);
    const otherDims = DIMENSION_ORDER.filter((d) => d !== 'economy');
    for (const d of otherDims) {
      expect(profile.dimensionPositions[d]).toBeUndefined();
      expect(profile.dimensionArchetypes[d]).toBeUndefined();
    }
  });
});

describe('computeProfile: dominant archetypes', () => {
  it('selects exactly one dominant archetype per answered dimension', () => {
    const answers = answersFromParty('fr_ps');
    const profile = computeProfile(answers);

    const dimensionsWithSignatures = new Set(ARCHETYPE_SIGNATURES.map((s) => s.dimension));
    for (const dim of dimensionsWithSignatures) {
      const dominant = profile.dimensionArchetypes[dim as DimensionKey];
      expect(dominant, `dimension ${dim}`).toBeDefined();
      expect(dominant!.dimension).toBe(dim);
      expect(dominant!.score).toBeGreaterThanOrEqual(0);
      expect(dominant!.score).toBeLessThanOrEqual(100);
      // The dominant score is the best among all scores for that dimension.
      const sameDim = profile.allArchetypeScores.filter((a) => a.dimension === dim);
      const maxScore = Math.max(...sameDim.map((a) => a.score));
      expect(dominant!.score).toBe(maxScore);
    }
  });
});

describe('computePartyMatches: low coverage flag', () => {
  it('flags low coverage below the confidence threshold and clears it above', () => {
    // A single answered statement: every match has only one comparison.
    const sparse: AnswerRecord = { ec1: 2 };
    expect(computePartyMatches(sparse).every((m) => m.lowCoverage)).toBe(true);

    // A full answer set: documented parties clear the threshold.
    const full = answersFromParty('fr_renaissance');
    const matches = computePartyMatches(full);
    const target = matches.find((m) => m.party.id === 'fr_renaissance')!;
    expect(target.lowCoverage).toBe(false);
    expect(target.answeredAndDocumented).toBeGreaterThanOrEqual(10);
  });
});
