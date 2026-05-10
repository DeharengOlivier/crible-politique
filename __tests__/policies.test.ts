import { describe, it, expect } from 'vitest';
import { calculatePolicyImpact, calculateAllPartyImpacts, partyPolicies } from '@/data/policies';
import type { ImpactProfile } from '@/data/policies';

describe('calculatePolicyImpact', () => {
  const workerProfile: ImpactProfile = {
    monthlyIncome: 1400,
    patrimony: 0,
    profession: 'worker',
    location: 'small',
    socialClass: 'working_class',
  };

  const managerProfile: ImpactProfile = {
    monthlyIncome: 5000,
    patrimony: 800000,
    profession: 'senior_manager',
    location: 'metropolis',
    socialClass: 'upper_class',
  };

  it('returns null for unknown party', () => {
    expect(calculatePolicyImpact(workerProfile, 'unknown')).toBeNull();
  });

  it('returns result for LFI', () => {
    const result = calculatePolicyImpact(workerProfile, 'lfi');
    expect(result).not.toBeNull();
    expect(result!.partyId).toBe('lfi');
    expect(result!.measures.length).toBeGreaterThan(0);
    expect(typeof result!.totalImpact).toBe('number');
  });

  it('LFI benefits low-income workers more than high-income managers', () => {
    const workerResult = calculatePolicyImpact(workerProfile, 'lfi')!;
    const managerResult = calculatePolicyImpact(managerProfile, 'lfi')!;
    expect(workerResult.totalImpact).toBeGreaterThan(managerResult.totalImpact);
  });

  it('LR benefits high-income more through tax cuts', () => {
    const workerResult = calculatePolicyImpact(workerProfile, 'lr')!;
    const managerResult = calculatePolicyImpact(managerProfile, 'lr')!;
    expect(managerResult.totalImpact).toBeGreaterThan(workerResult.totalImpact);
  });

  it('RN carburant benefits rural more than metropolis', () => {
    const ruralProfile: ImpactProfile = { ...workerProfile, location: 'rural' };
    const metroProfile: ImpactProfile = { ...workerProfile, location: 'metropolis' };

    const ruralResult = calculatePolicyImpact(ruralProfile, 'rn')!;
    const metroResult = calculatePolicyImpact(metroProfile, 'rn')!;

    // Find carburant measure
    const ruralCarburant = ruralResult.measures.find(m => m.title.includes('carburant'));
    const metroCarburant = metroResult.measures.find(m => m.title.includes('carburant'));

    expect(ruralCarburant!.impact).toBeGreaterThan(metroCarburant!.impact);
  });
});

describe('calculateAllPartyImpacts', () => {
  const profile: ImpactProfile = {
    monthlyIncome: 2000,
    patrimony: 50000,
    profession: 'employee',
    location: 'medium',
    socialClass: 'middle_class',
  };

  it('returns results for all FR parties', () => {
    const results = calculateAllPartyImpacts(profile);
    const frParties = partyPolicies.filter(p => p.country === 'FR');
    expect(results.length).toBe(frParties.length);
  });

  it('results are sorted by total impact descending', () => {
    const results = calculateAllPartyImpacts(profile);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].totalImpact).toBeGreaterThanOrEqual(results[i].totalImpact);
    }
  });

  it('every measure has a source', () => {
    const results = calculateAllPartyImpacts(profile);
    results.forEach(r => {
      r.measures.forEach(m => {
        expect(m.source).toBeTruthy();
      });
    });
  });
});
