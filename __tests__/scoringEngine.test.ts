import { describe, it, expect } from 'vitest';
import { STATEMENTS } from '@/data/statements';
import { PARTY_POSITIONS } from '@/data/partyPositions';
import { computeProfile, computePartyMatches } from '@/lib/scoringEngine';
import { encodeAnswers, decodeAnswers } from '@/lib/profileCode';
import { chesRawData, CHES_ID_BY_PARTY_ID } from '@/data/ches';
import { statementsFor, partiesFor } from '@/lib/electoralScope';
import { AnswerRecord, LikertValue } from '@/types/positions';
import { answersLikeParty, scopeOfParty } from './support/respondents';

const FR = { country: 'FR' } as const;

// The product's central promise is determinism and data integrity: these
// tests are what hold it.

describe('data integrity', () => {
  it('covers the 7 dimensions in both countries', () => {
    for (const country of ['FR', 'BE'] as const) {
      expect(new Set(statementsFor(country).map((s) => s.dimension)).size, country).toBe(7);
    }
  });

  it('carries a position for every party on every statement it is asked', () => {
    // Scoped coverage: a French party has no position on a Belgian statement,
    // and asking for one would be inventing data. The scoped version of this
    // check lives in electoralScope.test.ts; this one guards the shape.
    for (const country of ['FR', 'BE'] as const) {
      for (const statement of statementsFor(country)) {
        for (const party of partiesFor(country)) {
          expect([-2, -1, 0, 1, 2], `${statement.id}/${party.id}`).toContain(
            PARTY_POSITIONS[statement.id]?.[party.id]?.value
          );
        }
      }
    }
  });
});

describe('engine determinism', () => {
  it('the same answers give the same result, both matches and profile', () => {
    const answers: AnswerRecord = {};
    statementsFor('FR').forEach((s, i) => {
      answers[s.id] = (((i % 5) - 2) as LikertValue);
    });
    const a = computePartyMatches(answers, FR);
    const b = computePartyMatches(answers, FR);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(computeProfile(answers))).toBe(JSON.stringify(computeProfile(answers)));
  });

  it('the published agreement formula holds: 1 - |gap| / 4', () => {
    // One statement answered, so the party score is the agreement on it.
    const answers: AnswerRecord = { ec1: 2 };
    const matches = computePartyMatches(answers, FR);
    for (const m of matches) {
      const stance = PARTY_POSITIONS.ec1[m.party.id];
      const expected = Math.round((1 - Math.abs(2 - stance.value) / 4) * 100);
      expect(m.score).toBe(expected);
      expect(m.lowCoverage).toBe(true);
    }
  });

  it('"no opinion" is excluded from the computation, never counted against anyone', () => {
    const allNull: AnswerRecord = Object.fromEntries(STATEMENTS.map((s) => [s.id, null]));
    const profile = computeProfile(allNull);
    expect(profile.answeredCount).toBe(0);
    const matches = computePartyMatches(allNull, FR);
    expect(matches.every((m) => m.answeredAndDocumented === 0)).toBe(true);
  });

  it('answering a party\'s exact documented positions scores 100% against it', () => {
    for (const target of ['fr_lfi', 'be_nva']) {
      const top = computePartyMatches(answersLikeParty(target), scopeOfParty(target))[0];
      expect(top.party.id).toBe(target);
      expect(top.score).toBe(100);
    }
  });
});

describe('profile encoding', () => {
  it('a full roundtrip survives no-opinion answers and partial ones', () => {
    const answers: AnswerRecord = {};
    statementsFor('FR').forEach((s, i) => {
      answers[s.id] = i % 4 === 0 ? null : ((((i % 5) - 2)) as LikertValue);
    });
    const decoded = decodeAnswers(encodeAnswers(answers, 'FR'));
    expect(decoded).not.toBeNull();
    for (const s of statementsFor('FR')) {
      expect(decoded![s.id]).toBe(answers[s.id] ?? null);
    }
  });
});

describe('external agreement with CHES 2024 on the economic axis', () => {
  // Our per-statement coding and the academic CHES placement are two
  // independent measurements of the same thing. They have to correlate
  // strongly on the economic left-right axis, or one of the two is wrong.
  const ID_MAP = CHES_ID_BY_PARTY_ID;

  function spearman(xs: number[], ys: number[]): number {
    const rank = (arr: number[]) => {
      const sorted = arr.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
      const ranks = new Array<number>(arr.length);
      sorted.forEach(([, originalIndex], r) => {
        ranks[originalIndex] = r;
      });
      return ranks;
    };
    const rx = rank(xs);
    const ry = rank(ys);
    const n = xs.length;
    const meanX = rx.reduce((a, b) => a + b, 0) / n;
    const meanY = ry.reduce((a, b) => a + b, 0) / n;
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) {
      num += (rx[i] - meanX) * (ry[i] - meanY);
      dx += (rx[i] - meanX) ** 2;
      dy += (ry[i] - meanY) ** 2;
    }
    return num / Math.sqrt(dx * dy);
  }

  it('our economic axis and the CHES lrecon axis rank parties the same way', () => {
    const ours: number[] = [];
    const ches: number[] = [];
    for (const [ourId, chesId] of Object.entries(ID_MAP)) {
      const data = chesRawData[chesId];
      if (!data) continue;
      // Economic right by our statements: against taxing (ec1-), against
      // public provision (ec2-), debt first (ec4+).
      const econRight =
        -PARTY_POSITIONS.ec1[ourId].value -
        PARTY_POSITIONS.ec2[ourId].value +
        PARTY_POSITIONS.ec4[ourId].value;
      ours.push(econRight);
      ches.push(data.lrecon); // 0 = gauche, 10 = droite
    }
    expect(ours.length).toBeGreaterThanOrEqual(15);
    const rho = spearman(ours, ches);
    expect(rho).toBeGreaterThan(0.7);
  });
});
