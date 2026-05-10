import { describe, it, expect } from 'vitest';
import {
  determineSocialClass,
  calculateMoralFoundations,
  interpretMoralProfile,
} from '@/utils/analysis';
import type { MoralFoundations } from '@/types';

// ==================== SOCIAL CLASS ====================

describe('determineSocialClass', () => {
  it('classifies low income + low patrimony as working_class', () => {
    expect(determineSocialClass(900, 0)).toBe('working_class');
  });

  it('classifies median income + median patrimony as middle_class', () => {
    expect(determineSocialClass(2000, 170000)).toBe('middle_class');
  });

  it('classifies high income + high patrimony as upper_class', () => {
    expect(determineSocialClass(5000, 800000)).toBe('upper_class');
  });

  it('adjusts for metropolis location (higher threshold)', () => {
    // 2800€ in metropolis is normalized to ~2435€ (/ 1.15)
    const cls = determineSocialClass(2800, 0, 'metropolis');
    expect(['working_class', 'middle_class']).toContain(cls);
  });

  it('adjusts for rural location (lower threshold)', () => {
    // 2000€ in rural is normalized to ~2353€ (/ 0.85)
    const cls = determineSocialClass(2000, 0, 'rural');
    expect(cls).toBe('middle_class');
  });

  it('handles zero income', () => {
    expect(determineSocialClass(0, 0)).toBe('working_class');
  });

  it('handles very high income', () => {
    expect(determineSocialClass(10000, 2000000)).toBe('upper_class');
  });
});

// ==================== FONDATIONS MORALES ====================

describe('calculateMoralFoundations', () => {
  it('returns correct averages for paired questions', () => {
    const convictions = {
      mf1: 5, mf2: 3,   // care: 4.0
      mf3: 4, mf4: 4,   // fairness: 4.0
      mf5: 2, mf6: 2,   // loyalty: 2.0
      mf7: 1, mf8: 1,   // authority: 1.0
      mf9: 3, mf10: 3,  // sanctity: 3.0
      mf11: 5, mf12: 5, // liberty: 5.0
    };
    const mf = calculateMoralFoundations(convictions);
    expect(mf.care).toBe(4);
    expect(mf.fairness).toBe(4);
    expect(mf.loyalty).toBe(2);
    expect(mf.authority).toBe(1);
    expect(mf.sanctity).toBe(3);
    expect(mf.liberty).toBe(5);
  });

  it('defaults to 3 for missing answers', () => {
    const mf = calculateMoralFoundations({});
    expect(mf.care).toBe(3);
    expect(mf.liberty).toBe(3);
  });
});

describe('interpretMoralProfile', () => {
  it('identifies dominant foundations', () => {
    const mf: MoralFoundations = { care: 4.5, fairness: 4.2, loyalty: 2.0, authority: 1.5, sanctity: 2.0, liberty: 3.0 };
    const text = interpretMoralProfile(mf);
    expect(text).toContain('Soin/Protection');
    expect(text).toContain('Équité/Justice');
  });

  it('reports balanced profile when all high', () => {
    const mf: MoralFoundations = { care: 4.0, fairness: 4.0, loyalty: 4.0, authority: 3.8, sanctity: 3.5, liberty: 4.0 };
    const text = interpretMoralProfile(mf);
    expect(text).toContain('intégrateur');
  });

  it('reports balanced when nothing dominant', () => {
    const mf: MoralFoundations = { care: 3.0, fairness: 3.0, loyalty: 3.0, authority: 3.0, sanctity: 3.0, liberty: 3.0 };
    const text = interpretMoralProfile(mf);
    expect(text).toContain('équilibré');
  });
});

// ==================== TIME HORIZON ====================

