import { describe, it, expect } from 'vitest';
import { chesRawData, chesDataToAppProfile, getOpenDataTable, getPartySource } from '@/data/ches';
import { calculateMoralFoundations } from '@/utils/analysis';
import { MORAL_FOUNDATION_QUESTIONS } from '@/data/moralFoundations';

describe('CHES 2024: normalisation and provenance', () => {
  it('covers 23 parties, 22 of them straight from the official dataset', () => {
    const all = Object.values(chesRawData);
    expect(all).toHaveLength(23);
    expect(all.filter(p => p.source === 'CHES 2024')).toHaveLength(22);
    const estimates = all.filter(p => p.source !== 'CHES 2024');
    expect(estimates).toHaveLength(1);
    expect(estimates[0].name).toContain('Union Populaire');
    // Toute estimation doit être justifiée
    expect(estimates[0].sourceNote).toBeTruthy();
  });

  it('follows the 2024 codebook conventions: immigration direct, environment inverted', () => {
    // RN : immigrate_policy 9.55 (restrictif) → immigration_control élevé
    const rn = chesDataToAppProfile(chesRawData.rn);
    expect(rn.immigration_control).toBeGreaterThan(4);
    // EELV : environment 2.0 (pro-env) → green_policies élevé
    const eelv = chesDataToAppProfile(chesRawData.eelv);
    expect(eelv.green_policies).toBeGreaterThan(4);
    // LFI : lrecon 0.91 (gauche) → forte redistribution
    const lfi = chesDataToAppProfile(chesRawData.lfi);
    expect(lfi.economic_redistribution).toBeGreaterThan(4);
    // Renaissance : eu_position 6.27/7 → faible critique UE, fort internationalisme
    const re = chesDataToAppProfile(chesRawData.renaissance);
    expect(re.eu_critical).toBeLessThan(2);
    expect(re.internationalism).toBeGreaterThan(4);
  });

  it('exposes a complete open-data table carrying its provenance', () => {
    const table = getOpenDataTable();
    expect(table).toHaveLength(23);
    table.forEach(row => {
      expect(row.source).toBeDefined();
      expect(row.normalized.economic_redistribution).toBeGreaterThanOrEqual(1);
      expect(row.normalized.economic_redistribution).toBeLessThanOrEqual(5);
    });
  });

  it('getPartySource returns the provenance for one party', () => {
    expect(getPartySource('lfi')?.source).toBe('CHES 2024');
    expect(getPartySource('upr')?.source).toBe('Estimation documentée');
    expect(getPartySource('inconnu')).toBeNull();
  });
});

describe('moral foundations', () => {
  it('covers the 6 foundations with 2 items each', () => {
    expect(MORAL_FOUNDATION_QUESTIONS).toHaveLength(12);
    const byFoundation = MORAL_FOUNDATION_QUESTIONS.reduce<Record<string, number>>((acc, q) => {
      acc[q.foundation] = (acc[q.foundation] ?? 0) + 1;
      return acc;
    }, {});
    expect(Object.keys(byFoundation).sort()).toEqual([
      'authority', 'care', 'fairness', 'liberty', 'loyalty', 'sanctity'
    ]);
    expect(Object.values(byFoundation).every(n => n === 2)).toBe(true);
  });

  it('uses the single item present rather than diluting it with a neutral default', () => {
    // mf2 = 5 (care élevé), mf1 absent → care doit être 5, pas (3+5)/2 = 4
    const mf = calculateMoralFoundations({ mf2: 5 });
    expect(mf.care).toBe(5);
    // Aucun item → neutre
    expect(mf.loyalty).toBe(3);
  });
});
