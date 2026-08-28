import { describe, it, expect } from 'vitest';
import { STATEMENTS, EXPRESS_STATEMENTS } from '@/data/statements';
import { PARTIES } from '@/data/parties';
import { PARTY_POSITIONS } from '@/data/partyPositions';
import { computeProfile, computePartyMatches } from '@/lib/scoringEngine';
import { encodeAnswers, decodeAnswers, sanitizeAnswers } from '@/lib/profileCode';
import { chesRawData } from '@/data/ches';
import { AnswerRecord, LikertValue } from '@/types/positions';

// The product's central promise is determinism and data integrity: these
// tests are what hold it.

describe('data integrity', () => {
  it('covers 28 statements across 7 dimensions', () => {
    expect(STATEMENTS).toHaveLength(28);
    expect(new Set(STATEMENTS.map((s) => s.dimension)).size).toBe(7);
  });

  it('the express subset is 12 statements still covering all 7 dimensions', () => {
    expect(EXPRESS_STATEMENTS).toHaveLength(12);
    expect(new Set(EXPRESS_STATEMENTS.map((s) => s.dimension)).size).toBe(7);
  });

  it('every declared party has a position on every statement', () => {
    expect(PARTIES.length).toBe(24);
    for (const statement of STATEMENTS) {
      for (const party of PARTIES) {
        const stance = PARTY_POSITIONS[statement.id]?.[party.id];
        expect(stance, `${statement.id}/${party.id}`).toBeDefined();
        expect([-2, -1, 0, 1, 2]).toContain(stance!.value);
      }
    }
  });
});

describe('engine determinism', () => {
  it('the same answers give the same result, both matches and profile', () => {
    const answers: AnswerRecord = {};
    STATEMENTS.forEach((s, i) => {
      answers[s.id] = (((i % 5) - 2) as LikertValue);
    });
    const a = computePartyMatches(answers);
    const b = computePartyMatches(answers);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(computeProfile(answers))).toBe(JSON.stringify(computeProfile(answers)));
  });

  it('the published agreement formula holds: 1 - |gap| / 4', () => {
    // One statement answered, so the party score is the agreement on it.
    const answers: AnswerRecord = { ec1: 2 };
    const matches = computePartyMatches(answers);
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
    const matches = computePartyMatches(allNull);
    expect(matches.every((m) => m.answeredAndDocumented === 0)).toBe(true);
  });

  it('answering a party\'s exact documented positions scores 100% against it', () => {
    const target = 'fr_lfi';
    const answers: AnswerRecord = {};
    STATEMENTS.forEach((s) => {
      answers[s.id] = PARTY_POSITIONS[s.id][target].value;
    });
    const top = computePartyMatches(answers)[0];
    expect(top.party.id).toBe(target);
    expect(top.score).toBe(100);
  });
});

describe('profile encoding', () => {
  it('a full roundtrip survives no-opinion answers and partial ones', () => {
    const answers: AnswerRecord = {};
    STATEMENTS.forEach((s, i) => {
      answers[s.id] = i % 4 === 0 ? null : ((((i % 5) - 2)) as LikertValue);
    });
    const decoded = decodeAnswers(encodeAnswers(answers));
    expect(decoded).not.toBeNull();
    for (const s of STATEMENTS) {
      expect(decoded![s.id]).toBe(answers[s.id] ?? null);
    }
  });

  it('rejects malformed codes', () => {
    expect(decodeAnswers('')).toBeNull();
    expect(decodeAnswers('2abc')).toBeNull();
    expect(decodeAnswers('1abc')).toBeNull(); // longueur incorrecte
    expect(decodeAnswers('1' + 'z'.repeat(28))).toBeNull(); // unknown character
  });
});

describe('sanitizeAnswers, the local-storage boundary', () => {
  it('keeps known statements carrying valid Likert values', () => {
    const clean = sanitizeAnswers({ ec1: 2, pw1: -1, mo3: 0, ge3: null });
    expect(clean).toEqual({ ec1: 2, pw1: -1, mo3: 0, ge3: null });
  });

  it('drops statements it does not know', () => {
    const clean = sanitizeAnswers({ ec1: 1, inexistant: 2 });
    expect(clean).toEqual({ ec1: 1 });
  });

  it('rejects the whole set when any value is corrupted', () => {
    expect(sanitizeAnswers({ ec1: 1, pw1: 99 })).toBeNull();
    expect(sanitizeAnswers({ ec1: 1.5 })).toBeNull();
    expect(sanitizeAnswers({ ec1: 'gauche' })).toBeNull();
    expect(sanitizeAnswers('pas un objet')).toBeNull();
    expect(sanitizeAnswers(null)).toBeNull();
  });
});

describe('external agreement with CHES 2024 on the economic axis', () => {
  // Our per-statement coding and the academic CHES placement are two
  // independent measurements of the same thing. They have to correlate
  // strongly on the economic left-right axis, or one of the two is wrong.
  const ID_MAP: Record<string, string> = {
    fr_lfi: 'lfi', fr_rn: 'rn', fr_renaissance: 'renaissance', fr_lr: 'lr',
    fr_eelv: 'eelv', fr_ps: 'ps', fr_reconquete: 'reconquete', fr_pcf: 'pcf',
    fr_modem: 'modem', fr_horizons: 'horizons', fr_upr: 'upr',
    be_ptb: 'ptb', be_mr: 'mr', be_ecolo: 'ecolo', be_nva: 'nva',
    be_vooruit: 'vooruit', be_groen: 'groen', be_cdv: 'cdv', be_defi: 'defi'
  };

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
