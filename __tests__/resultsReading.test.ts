import { describe, it, expect } from 'vitest';
import { rankedForReading, READINGS } from '@/lib/resultsReading';
import { computePartyMatches } from '@/lib/scoringEngine';
import { answersLikeParty, scopeOfParty } from './support/respondents';

// Found 2026-08-29 in a manual session at 375px: switching to the directional
// reading reordered the list but kept the proximity ranks, so the column read
// "1, 3, 5, 2, 6, 4" and looked broken. A rank must always mean the rank under
// the reading being displayed.

const matches = computePartyMatches(answersLikeParty('be_ecolo'), scopeOfParty('be_ecolo'));

describe('rankedForReading', () => {
  it('numbers rows 1..n in order, under either reading', () => {
    for (const reading of READINGS) {
      const ranks = rankedForReading(matches, reading).map((r) => r.displayRank);
      expect([...ranks].sort((a, b) => a - b), reading).toEqual(ranks);
      expect(ranks[0], reading).toBe(1);
    }
  });

  it('orders by the score of the reading it is asked for', () => {
    const proximity = rankedForReading(matches, 'proximity').map((r) => r.match.score);
    expect([...proximity].sort((a, b) => b - a)).toEqual(proximity);

    const directional = rankedForReading(matches, 'directional').map((r) => r.match.directionalScore);
    expect([...directional].sort((a, b) => b - a)).toEqual(directional);
  });

  it('gives tied scores the same rank, under either reading', () => {
    for (const reading of READINGS) {
      const rows = rankedForReading(matches, reading);
      const scoreOf = (r: (typeof rows)[number]) =>
        reading === 'proximity' ? r.match.score : r.match.directionalScore;
      const seen = new Map<number, number>();
      for (const row of rows) {
        const known = seen.get(scoreOf(row));
        if (known === undefined) seen.set(scoreOf(row), row.displayRank);
        else expect(row.displayRank, `${reading}/${row.match.party.id}`).toBe(known);
      }
    }
  });

  it('keeps the proximity ranking identical to the one the engine computed', () => {
    for (const row of rankedForReading(matches, 'proximity')) {
      expect(row.displayRank, row.match.party.id).toBe(row.match.rank);
    }
  });

  it('returns every party exactly once, whichever reading', () => {
    for (const reading of READINGS) {
      const ids = rankedForReading(matches, reading).map((r) => r.match.party.id);
      expect(new Set(ids).size).toBe(matches.length);
    }
  });

  it('handles an empty list without inventing a rank', () => {
    expect(rankedForReading([], 'directional')).toEqual([]);
  });
});
