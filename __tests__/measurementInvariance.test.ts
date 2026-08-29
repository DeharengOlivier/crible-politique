import { describe, it, expect } from 'vitest';
import { STATEMENTS } from '@/data/statements';
import { PARTY_POSITIONS } from '@/data/partyPositions';
import { chesRawData, CHES_ID_BY_PARTY_ID } from '@/data/ches';
import { partiesFor, COUNTRIES } from '@/lib/electoralScope';
import {
  spearman,
  orientationAgainstAxis,
  contradictsAcrossCountries,
  INVARIANCE_AXES,
  SUBSTANTIAL_ORIENTATION,
} from '@/lib/measurementInvariance';
import type { InvarianceAxis } from '@/lib/measurementInvariance';
import type { LikertValue } from '@/types/positions';

// G4: a statement answered by everyone must mean the same thing everywhere.
// If agreeing places a French respondent on the left and a Belgian one on the
// right, the two answers are not comparable and the dimension built on them is
// not one measurement but two.

function orientationOf(statementId: string, country: 'FR' | 'BE', axis: InvarianceAxis): number | null {
  const values: LikertValue[] = [];
  const placements: number[] = [];
  for (const party of partiesFor(country)) {
    const ches = chesRawData[CHES_ID_BY_PARTY_ID[party.id]];
    const stance = PARTY_POSITIONS[statementId]?.[party.id];
    if (!ches || !stance) continue;
    values.push(stance.value);
    placements.push(ches[axis]);
  }
  return values.length >= 8 ? orientationAgainstAxis(values, placements) : null;
}

describe('spearman', () => {
  it('is +1 on a monotone increasing pair and -1 on a reversed one', () => {
    expect(spearman([1, 2, 3, 4], [10, 20, 30, 40])).toBeCloseTo(1, 10);
    expect(spearman([1, 2, 3, 4], [40, 30, 20, 10])).toBeCloseTo(-1, 10);
  });

  it('is 0 when one side is constant, rather than NaN', () => {
    expect(spearman([1, 1, 1, 1], [1, 2, 3, 4])).toBe(0);
  });
});

describe('contradictsAcrossCountries', () => {
  it('accepts two orientations pointing the same way', () => {
    expect(contradictsAcrossCountries(0.8, 0.6)).toBe(false);
    expect(contradictsAcrossCountries(-0.8, -0.6)).toBe(false);
  });

  it('accepts an opposition too weak to be a contradiction', () => {
    expect(contradictsAcrossCountries(0.7, -0.1)).toBe(false);
  });

  it('rejects two substantial orientations pointing opposite ways', () => {
    expect(contradictsAcrossCountries(0.7, -0.7)).toBe(true);
    expect(contradictsAcrossCountries(-SUBSTANTIAL_ORIENTATION, SUBSTANTIAL_ORIENTATION)).toBe(true);
  });
});

describe('the corpus is invariant across countries', () => {
  it('gives every common statement the same orientation in both countries, on every axis', () => {
    const offenders: string[] = [];
    for (const statement of STATEMENTS.filter((s) => s.scope === 'common')) {
      for (const axis of INVARIANCE_AXES) {
        const fr = orientationOf(statement.id, 'FR', axis);
        const be = orientationOf(statement.id, 'BE', axis);
        if (fr === null || be === null) continue;
        if (contradictsAcrossCountries(fr, be)) {
          offenders.push(`${statement.id} on ${axis} (FR ${fr.toFixed(2)} / BE ${be.toFixed(2)})`);
        }
      }
    }
    expect(offenders, `non-invariant common statements: ${offenders.join(', ')}`).toEqual([]);
  });

  it('leaves no country-scoped statement carrying parties of the other country', () => {
    for (const country of COUNTRIES) {
      const other = country === 'FR' ? 'BE' : 'FR';
      for (const statement of STATEMENTS.filter((s) => s.scope === country)) {
        for (const party of partiesFor(other)) {
          expect(PARTY_POSITIONS[statement.id]?.[party.id], `${statement.id}/${party.id}`).toBeUndefined();
        }
      }
    }
  });
});

describe('regression: decentralisation was never a common statement', () => {
  // Found 2026-08-29 by measuring the corpus: "the regions and municipalities
  // should hold more competences" placed a French respondent with the greens
  // (EELV +2, LFI -1) and a Belgian one with the Flemish nationalists
  // (N-VA +2, PTB -1). The same answer meant opposite things, and the power
  // dimension silently averaged the two. It is now two scoped statements.
  const FR_PARTIES = ['fr_lfi', 'fr_rn', 'fr_reconquete', 'fr_upr', 'fr_renaissance',
    'fr_lr', 'fr_eelv', 'fr_ps', 'fr_pcf', 'fr_horizons', 'fr_modem'] as const;
  const BE_PARTIES = ['be_ptb', 'be_mr', 'be_ps', 'be_ecolo', 'be_engages', 'be_nva',
    'be_vb', 'be_vooruit', 'be_openvld', 'be_cdv', 'be_groen', 'be_defi'] as const;
  // The values as they stood before the split.
  const OLD_PW3: Record<string, LikertValue> = {
    fr_lfi: -1, fr_rn: -1, fr_reconquete: -1, fr_upr: -1, fr_renaissance: 1,
    fr_lr: 1, fr_eelv: 2, fr_ps: 1, fr_pcf: -1, fr_horizons: 1, fr_modem: 1,
    be_ptb: -1, be_mr: 0, be_ps: 0, be_ecolo: 1, be_engages: 1, be_nva: 2,
    be_vb: 2, be_vooruit: 1, be_openvld: 1, be_cdv: 1, be_groen: 1, be_defi: -1,
  };

  function oldOrientation(ids: readonly string[], axis: InvarianceAxis): number {
    const values = ids.map((id) => OLD_PW3[id]);
    const placements = ids.map((id) => chesRawData[CHES_ID_BY_PARTY_ID[id]][axis]);
    return orientationAgainstAxis(values, placements);
  }

  it('detects the contradiction the old wording carried', () => {
    const contradicting = INVARIANCE_AXES.filter((axis) =>
      contradictsAcrossCountries(oldOrientation(FR_PARTIES, axis), oldOrientation(BE_PARTIES, axis))
    );
    expect(contradicting.length, 'no axis caught the old decentralisation statement').toBeGreaterThan(0);
  });

  it('names the libertarian-authoritarian axis as the one that catches it', () => {
    // The measurement that decided the split: more regional powers reads as
    // green-libertarian in France and Flemish-nationalist in Belgium.
    const fr = oldOrientation(FR_PARTIES, 'galtan');
    const be = oldOrientation(BE_PARTIES, 'galtan');
    expect(fr).toBeLessThanOrEqual(-SUBSTANTIAL_ORIENTATION);
    expect(be).toBeGreaterThanOrEqual(SUBSTANTIAL_ORIENTATION);
  });

  it('is invisible on the general left-right axis, which is why it survived', () => {
    const fr = oldOrientation(FR_PARTIES, 'position');
    const be = oldOrientation(BE_PARTIES, 'position');
    expect(contradictsAcrossCountries(fr, be)).toBe(false);
  });

  it('no longer exposes a statement with that id', () => {
    expect(STATEMENTS.find((s) => s.id === 'pw3')).toBeUndefined();
    expect(STATEMENTS.find((s) => s.id === 'pw3_fr')?.scope).toBe('FR');
    expect(STATEMENTS.find((s) => s.id === 'pw3_be')?.scope).toBe('BE');
  });
});
