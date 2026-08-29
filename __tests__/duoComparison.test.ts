import { describe, it, expect } from 'vitest';
import { compareAnswers, sharedStatementCount } from '@/lib/duoComparison';
import { statementsFor } from '@/lib/electoralScope';
import { answersLikeParty } from './support/respondents';
import type { AnswerRecord } from '@/types/positions';

// Two people can compare profiles across the border. What they must never be
// shown is a percentage computed over statements only one of them answered.

describe('compareAnswers', () => {
  it('compares only the statements both people answered', () => {
    const fr = answersLikeParty('fr_ps');
    const be = answersLikeParty('be_ps');
    const result = compareAnswers(fr, be);
    const common = statementsFor('FR').filter((s) => s.scope === 'common').length;
    expect(result.count).toBe(common);
    expect(result.pairs.map((p) => p.statement.id)).not.toContain('pw3_fr');
    expect(result.pairs.map((p) => p.statement.id)).not.toContain('pw3_be');
  });

  it('scores an identical pair at 100 and an opposite one at 0', () => {
    const fr = answersLikeParty('fr_lfi');
    expect(compareAnswers(fr, fr).overall).toBe(100);

    const mirrored: AnswerRecord = {};
    for (const [id, value] of Object.entries(fr)) mirrored[id] = value === null ? null : (-value as never);
    const opposite = compareAnswers({ pw1: 2 }, { pw1: -2 });
    expect(opposite.overall).toBe(0);
    expect(mirrored.pw1).toBe(-fr.pw1!);
  });

  it('returns no score at all when nothing is shared, rather than zero', () => {
    expect(compareAnswers({ pw3_fr: 2 }, { pw3_be: 2 }).overall).toBeNull();
    expect(compareAnswers({}, {}).count).toBe(0);
  });

  it('excludes a no-opinion answer from either side', () => {
    expect(compareAnswers({ pw1: 2, ec1: 2 }, { pw1: null, ec1: 2 }).count).toBe(1);
  });

  it('reports the same score whichever way round the two profiles are given', () => {
    const a = answersLikeParty('fr_rn');
    const b = answersLikeParty('fr_eelv');
    expect(compareAnswers(a, b).overall).toBe(compareAnswers(b, a).overall);
  });
});

describe('sharedStatementCount', () => {
  it('is the full corpus for two respondents of the same country', () => {
    expect(sharedStatementCount('FR', 'FR')).toBe(statementsFor('FR').length);
  });

  it('drops to the common corpus across the border', () => {
    const common = statementsFor('FR').filter((s) => s.scope === 'common').length;
    expect(sharedStatementCount('FR', 'BE')).toBe(common);
    expect(sharedStatementCount('BE', 'FR')).toBe(common);
  });

  it('falls back to the common corpus when a country is unknown', () => {
    const common = statementsFor('FR').filter((s) => s.scope === 'common').length;
    expect(sharedStatementCount(null, 'BE')).toBe(common);
    expect(sharedStatementCount(null, null)).toBe(common);
  });
});
