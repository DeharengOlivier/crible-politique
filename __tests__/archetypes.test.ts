import { describe, it, expect } from 'vitest';
import { ARCHETYPE_SIGNATURES } from '@/data/archetypeSignatures';
import { STATEMENTS } from '@/data/statements';
import { BADGE_ALPHABET } from '@/data/badgeAlphabet';
import { computeProfile } from '@/lib/scoringEngine';
import type { AnswerRecord } from '@/types/positions';

// A1..A3. An archetype must be able to win. The former engine scored each one
// over its own subset of statements, so a one-statement signature reached 100%
// on a single answer while a four-statement one almost never could, and two
// archetypes sharing a signature meant the second was unreachable forever.

const COMMON_IDS_BY_DIMENSION = STATEMENTS.filter((s) => s.scope === 'common').reduce<
  Record<string, string[]>
>((acc, s) => {
  (acc[s.dimension] ||= []).push(s.id);
  return acc;
}, {});

describe('A1: every archetype of a dimension is scored on the same statements', () => {
  it('covers exactly the common statements of its dimension, no more, no less', () => {
    for (const { dimension, signatures } of ARCHETYPE_SIGNATURES) {
      const expected = [...COMMON_IDS_BY_DIMENSION[dimension]].sort();
      for (const [label, signature] of Object.entries(signatures)) {
        expect(Object.keys(signature).sort(), `${dimension}/${label}`).toEqual(expected);
      }
    }
  });

  it('gives every archetype of a dimension the same signature length', () => {
    for (const { dimension, signatures } of ARCHETYPE_SIGNATURES) {
      const lengths = new Set(Object.values(signatures).map((s) => Object.keys(s).length));
      expect(lengths.size, `${dimension} has signatures of ${[...lengths].join('/')} items`).toBe(1);
    }
  });

  it('holds every signature value on the Likert scale', () => {
    for (const { dimension, signatures } of ARCHETYPE_SIGNATURES) {
      for (const [label, signature] of Object.entries(signatures)) {
        for (const [id, value] of Object.entries(signature)) {
          expect([-2, -1, 0, 1, 2], `${dimension}/${label}/${id}`).toContain(value);
        }
      }
    }
  });
});

describe('A2: no two archetypes of a dimension share a signature', () => {
  it('has a distinct signature for every archetype', () => {
    const duplicates: string[] = [];
    for (const { dimension, signatures } of ARCHETYPE_SIGNATURES) {
      const seen = new Map<string, string>();
      for (const [label, signature] of Object.entries(signatures)) {
        const key = Object.entries(signature)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([id, v]) => `${id}=${v}`)
          .join(',');
        const previous = seen.get(key);
        if (previous) duplicates.push(`${dimension}: ${previous} == ${label}`);
        else seen.set(key, label);
      }
    }
    expect(duplicates, `identical signatures: ${duplicates.join(' | ')}`).toEqual([]);
  });
});

describe('A3: no archetype is structurally unreachable', () => {
  it('returns each archetype for the answers that are exactly its signature', () => {
    const unreachable: string[] = [];
    for (const { dimension, signatures } of ARCHETYPE_SIGNATURES) {
      for (const [label, signature] of Object.entries(signatures)) {
        const answers: AnswerRecord = { ...signature };
        const winner = computeProfile(answers).dimensionArchetypes[dimension];
        if (winner?.label !== label) {
          unreachable.push(`${dimension}/${label} -> ${winner?.label ?? 'none'}`);
        }
      }
    }
    expect(unreachable, `archetypes that cannot be reached: ${unreachable.join(' | ')}`).toEqual([]);
  });

  it('scores that exact answer set at 100 and every rival strictly below', () => {
    for (const { dimension, signatures } of ARCHETYPE_SIGNATURES) {
      for (const [label, signature] of Object.entries(signatures)) {
        const profile = computeProfile({ ...signature });
        const scores = profile.allArchetypeScores.filter((a) => a.dimension === dimension);
        const own = scores.find((a) => a.label === label);
        expect(own?.score, `${dimension}/${label}`).toBe(100);
        expect(scores.filter((a) => a.score === 100), `${dimension}/${label} ties`).toHaveLength(1);
      }
    }
  });
});

describe('the badge alphabet still names every archetype', () => {
  it('lists every signature label, so a profile is always encodable', () => {
    for (const { dimension, signatures } of ARCHETYPE_SIGNATURES) {
      for (const label of Object.keys(signatures)) {
        expect(BADGE_ALPHABET[dimension], `${dimension}/${label}`).toContain(label);
      }
    }
  });
});

describe('A4: a dimension the answers cannot settle is reported as unsettled', () => {
  // Found 2026-08-29 by simulation: on the express test, 2 statements per
  // dimension leave several archetypes with identical partial signatures, and
  // the engine silently returned whichever was declared first. 19 of the 79
  // archetypes were unreachable that way, and one respondent in five was told
  // a current of thought that the data could not distinguish from two others.
  const EXPRESS_KNOWLEDGE = { kn2: -1 as const, kn3: 1 as const };

  it('names every archetype tied with the dominant one', () => {
    const profile = computeProfile(EXPRESS_KNOWLEDGE);
    const tied = profile.dimensionTies.knowledge!;
    expect(tied.length).toBeGreaterThan(1);
    expect(tied).toContain(profile.dimensionArchetypes.knowledge!.label);
    expect(tied).toContain('Sceptique cartésien');
    expect(tied).toContain('Croyant spirituel');
  });

  it('lists exactly the archetypes scoring what the dominant one scores', () => {
    for (const answers of [EXPRESS_KNOWLEDGE, { kn1: 2 as const, kn2: 1 as const, kn3: -2 as const, kn4: 0 as const }]) {
      const profile = computeProfile(answers);
      const best = profile.dimensionArchetypes.knowledge!.score;
      const expected = profile.allArchetypeScores
        .filter((a) => a.dimension === 'knowledge' && a.score === best)
        .map((a) => a.label);
      expect([...profile.dimensionTies.knowledge!].sort()).toEqual([...expected].sort());
    }
  });

  it('reports a single name when the answers do settle it', () => {
    for (const { dimension, signatures } of ARCHETYPE_SIGNATURES) {
      for (const [label, signature] of Object.entries(signatures)) {
        const profile = computeProfile({ ...signature });
        expect(profile.dimensionTies[dimension], `${dimension}/${label}`).toEqual([label]);
      }
    }
  });

  it('never reports a tie for a dimension it reports no archetype for', () => {
    const profile = computeProfile({ ec1: 1 });
    expect(profile.dimensionArchetypes.knowledge).toBeUndefined();
    expect(profile.dimensionTies.knowledge).toBeUndefined();
    expect(profile.dimensionTies.economy).toBeDefined();
  });

  it('keeps the dominant label deterministic across runs', () => {
    const a = computeProfile(EXPRESS_KNOWLEDGE);
    const b = computeProfile(EXPRESS_KNOWLEDGE);
    expect(a.dimensionArchetypes.knowledge!.label).toBe(b.dimensionArchetypes.knowledge!.label);
    expect(a.dimensionTies.knowledge).toEqual(b.dimensionTies.knowledge);
  });
});
