import { describe, it, expect } from 'vitest';
import { computePartyMatches } from '@/lib/scoringEngine';
import { PARTY_POSITIONS } from '@/data/partyPositions';
import { statementsFor, partiesFor } from '@/lib/electoralScope';
import type { AnswerRecord, LikertValue } from '@/types/positions';

// E1..E5. A single winner announced with no interval was the product's most
// misleading claim: on simulated coherent respondents the first and second
// party sat within one point of each other 30% of the time.

function answersLike(partyId: string, country: 'FR' | 'BE'): AnswerRecord {
  const answers: AnswerRecord = {};
  for (const statement of statementsFor(country)) {
    answers[statement.id] = PARTY_POSITIONS[statement.id][partyId].value;
  }
  return answers;
}

const FR = { country: 'FR' } as const;
const BE = { country: 'BE' } as const;

describe('scoping (G1 at engine level)', () => {
  it('never returns a party of the other country', () => {
    expect(computePartyMatches(answersLike('fr_ps', 'FR'), FR).every((m) => m.party.country === 'FR')).toBe(true);
    expect(computePartyMatches(answersLike('be_ps', 'BE'), BE).every((m) => m.party.country === 'BE')).toBe(true);
  });

  it('returns only the lists of the chosen Belgian college', () => {
    const walloon = computePartyMatches(answersLike('be_ps', 'BE'), { country: 'BE', college: 'wallonie' });
    expect(walloon.map((m) => m.party.id)).not.toContain('be_nva');
    expect(walloon.length).toBeLessThan(computePartyMatches(answersLike('be_ps', 'BE'), BE).length);
  });

  it('never scores a respondent on a statement of the other country', () => {
    const matches = computePartyMatches(answersLike('fr_ps', 'FR'), FR);
    const ids = matches[0].comparisons.map((c) => c.statement.id);
    expect(ids).not.toContain('pw3_be');
    expect(ids).toContain('pw3_fr');
  });
});

describe('E1: determinism', () => {
  it('gives byte-identical results for the same answers and options', () => {
    const answers = answersLike('fr_eelv', 'FR');
    expect(JSON.stringify(computePartyMatches(answers, FR))).toBe(
      JSON.stringify(computePartyMatches(answers, FR))
    );
  });
});

describe('E2: the interval always contains the point estimate', () => {
  it('brackets the score of every party, for every simulated respondent', () => {
    for (const country of ['FR', 'BE'] as const) {
      for (const party of partiesFor(country)) {
        for (const match of computePartyMatches(answersLike(party.id, country), { country })) {
          expect(match.lowerBound, `${match.party.id} lower`).toBeLessThanOrEqual(match.score);
          expect(match.upperBound, `${match.party.id} upper`).toBeGreaterThanOrEqual(match.score);
          expect(match.lowerBound).toBeGreaterThanOrEqual(0);
          expect(match.upperBound).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('collapses to a point when every statement agrees exactly', () => {
    const match = computePartyMatches(answersLike('fr_lfi', 'FR'), FR)[0];
    expect(match.score).toBe(100);
    expect(match.lowerBound).toBe(100);
    expect(match.upperBound).toBe(100);
  });

  it('widens the interval when few statements were answered', () => {
    const full = answersLike('fr_ps', 'FR');
    const partial: AnswerRecord = {};
    statementsFor('FR').slice(0, 6).forEach((s) => { partial[s.id] = full[s.id]; });
    const wide = computePartyMatches(partial, FR).find((m) => m.party.id === 'fr_rn')!;
    const narrow = computePartyMatches(full, FR).find((m) => m.party.id === 'fr_rn')!;
    expect(wide.upperBound - wide.lowerBound).toBeGreaterThan(narrow.upperBound - narrow.lowerBound);
  });
});

describe('E3: the leading group', () => {
  // Specification changed 2026-08-29. The group used to be "every party whose
  // interval overlaps the leader's", and this file asserted that rule; a
  // reader then showed a ranking of 80/76/75/69 all called "à égalité en
  // tête". The two scores are paired (same respondent, same statements), so
  // the group is now decided statement by statement; the full battery lives in
  // partyLeadingGroup.test.ts. What survives here is what was true of both
  // rules.
  it('always contains the leader', () => {
    const matches = computePartyMatches(answersLike('be_ecolo', 'BE'), BE);
    expect(matches[0].inLeadingGroup).toBe(true);
  });

  it('keeps publishing the per-party interval it no longer groups by', () => {
    // The interval still quantifies how precisely one score is measured, and
    // the results page still displays it. Only the tie decision left it.
    for (const match of computePartyMatches(answersLike('fr_ps', 'FR'), FR)) {
      expect(match.lowerBound).toBeLessThanOrEqual(match.score);
      expect(match.upperBound).toBeGreaterThanOrEqual(match.score);
    }
  });
});

describe('E4: identical parties always share a rank', () => {
  it('gives the same rank to every party sharing a score', () => {
    for (const country of ['FR', 'BE'] as const) {
      for (const party of partiesFor(country)) {
        const matches = computePartyMatches(answersLike(party.id, country), { country });
        const rankByScore = new Map<number, number>();
        for (const match of matches) {
          const known = rankByScore.get(match.score);
          if (known === undefined) rankByScore.set(match.score, match.rank);
          else expect(match.rank, `${country}/${party.id}/${match.party.id}`).toBe(known);
        }
      }
    }
  });

  it('lets every party be the top match for the respondent who answers like it', () => {
    // The former engine sorted on the rounded score with a stable sort, so
    // Groen, coded exactly like Ecolo and declared after it, was never first
    // for anybody: 0 times out of 20 000 simulated respondents.
    const unreachable: string[] = [];
    for (const country of ['FR', 'BE'] as const) {
      for (const party of partiesFor(country)) {
        const match = computePartyMatches(answersLike(party.id, country), { country })
          .find((m) => m.party.id === party.id)!;
        if (match.rank !== 1) unreachable.push(`${party.id} ranks ${match.rank}`);
      }
    }
    expect(unreachable, `parties that cannot be first: ${unreachable.join(', ')}`).toEqual([]);
  });

  it('numbers ranks by competition ranking: 1, 2, 2, 4', () => {
    const matches = computePartyMatches(answersLike('be_ps', 'BE'), BE);
    let expectedRank = 1;
    matches.forEach((match, index) => {
      if (index > 0 && match.score !== matches[index - 1].score) expectedRank = index + 1;
      expect(match.rank, match.party.id).toBe(expectedRank);
    });
  });

  it('keeps the list sorted by score, best first', () => {
    const scores = computePartyMatches(answersLike('fr_rn', 'FR'), FR).map((m) => m.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });
});

describe('E5: uniform weights change nothing', () => {
  it('gives the same scores with every weight at 1 as with no weights at all', () => {
    const answers = answersLike('fr_modem', 'FR');
    const weights = Object.fromEntries(statementsFor('FR').map((s) => [s.id, 1]));
    expect(computePartyMatches(answers, { ...FR, weights }).map((m) => m.score)).toEqual(
      computePartyMatches(answers, FR).map((m) => m.score)
    );
  });

  it('moves a party up when the statements it agrees on are weighted double', () => {
    // A respondent answering like the RN, who then says the economy matters
    // twice as much, must not move away from the RN on economic statements.
    const answers = answersLike('fr_rn', 'FR');
    const weights = Object.fromEntries(
      statementsFor('FR').filter((s) => s.dimension === 'economy').map((s) => [s.id, 2])
    );
    const weighted = computePartyMatches(answers, { ...FR, weights }).find((m) => m.party.id === 'fr_rn')!;
    expect(weighted.score).toBe(100);
  });

  it('rejects a weight that is not a positive finite number', () => {
    const answers = answersLike('fr_ps', 'FR');
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => computePartyMatches(answers, { ...FR, weights: { ec1: bad } })).toThrow();
    }
  });
});

describe('the directional reading', () => {
  it('ranks first the party a respondent amplifies, and well above orthogonality', () => {
    // Amplifying every LFI position to full intensity must make LFI the most
    // directionally aligned party. It does not reach 100: the ceiling is the
    // party's own intensity, and LFI holds moderate positions on some
    // statements. That ceiling is the point of the directional reading.
    const answers: AnswerRecord = {};
    for (const s of statementsFor('FR')) {
      const v = PARTY_POSITIONS[s.id]['fr_lfi'].value;
      answers[s.id] = (v === 0 ? 0 : v > 0 ? 2 : -2) as LikertValue;
    }
    const matches = computePartyMatches(answers, FR);
    const best = [...matches].sort((a, b) => b.directionalScore - a.directionalScore)[0];
    expect(best.party.id).toBe('fr_lfi');
    expect(best.directionalScore).toBeGreaterThan(75);
  });

  it('separates the two readings: the directional order is not the proximity order', () => {
    // If both readings always agreed, publishing two would be theatre. They
    // disagree because proximity rewards short distances and the directional
    // reading rewards intensity on the same side.
    const answers: AnswerRecord = {};
    for (const s of statementsFor('FR')) {
      answers[s.id] = PARTY_POSITIONS[s.id]['fr_eelv'].value;
    }
    const matches = computePartyMatches(answers, FR);
    const byProximity = matches.map((m) => m.party.id);
    const byDirection = [...matches]
      .sort((a, b) => b.directionalScore - a.directionalScore)
      .map((m) => m.party.id);
    expect(byDirection).not.toEqual(byProximity);
  });

  it('sits at 50 for a respondent with no opinion anywhere it could count', () => {
    const answers: AnswerRecord = {};
    for (const s of statementsFor('FR')) answers[s.id] = 0;
    for (const match of computePartyMatches(answers, FR)) {
      expect(match.directionalScore).toBe(50);
    }
  });

  it('falls below 50 for a respondent who mirrors a party', () => {
    const answers: AnswerRecord = {};
    for (const s of statementsFor('FR')) {
      answers[s.id] = -PARTY_POSITIONS[s.id]['fr_lfi'].value as LikertValue;
    }
    const lfi = computePartyMatches(answers, FR).find((m) => m.party.id === 'fr_lfi')!;
    expect(lfi.directionalScore).toBeLessThan(50);
  });
});

describe('the interpretable count', () => {
  it('counts every statement where the respondent and the party are on the same side', () => {
    const answers = answersLike('fr_ps', 'FR');
    const ps = computePartyMatches(answers, FR).find((m) => m.party.id === 'fr_ps')!;
    const expected = ps.comparisons.filter(
      (c) => c.userValue !== 0 && c.partyValue !== 0 && Math.sign(c.userValue) === Math.sign(c.partyValue)
    ).length;
    expect(ps.sameSideCount).toBe(expected);
    expect(ps.sameSideCount + ps.oppositeSideCount).toBeLessThanOrEqual(ps.answeredAndDocumented);
  });

  it('counts a neutral answer on neither side', () => {
    const answers: AnswerRecord = {};
    for (const s of statementsFor('FR')) answers[s.id] = 0;
    for (const match of computePartyMatches(answers, FR)) {
      expect(match.sameSideCount).toBe(0);
      expect(match.oppositeSideCount).toBe(0);
    }
  });
});

describe('E6: no opinion is never counted against anyone', () => {
  it('excludes a no-opinion answer from every party score', () => {
    const answers = answersLike('fr_lfi', 'FR');
    answers.ec1 = null;
    const match = computePartyMatches(answers, FR).find((m) => m.party.id === 'fr_lfi')!;
    expect(match.score).toBe(100);
    expect(match.comparisons.map((c) => c.statement.id)).not.toContain('ec1');
  });

  it('returns an empty comparison set and a zero score when nothing was answered', () => {
    for (const match of computePartyMatches({}, FR)) {
      expect(match.answeredAndDocumented).toBe(0);
      expect(match.score).toBe(0);
      expect(match.lowCoverage).toBe(true);
    }
  });
});
