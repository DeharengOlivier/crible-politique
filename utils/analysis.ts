import {
  SocialClass,
  LocationType,
  MoralFoundations,
  MORAL_FOUNDATION_LABELS
} from '@/types';
import {
  getSocialPositionScore,
  socialPositionToClass
} from '@/data/insee';

// Analysis functions kept after the "Le Crible Politique" merge.
//
// The pre-merge pipeline (ideologies, time horizons, movement alignments,
// "values vs wallet") was removed: it relied on impact matrices set by expert
// opinion, not sourceable, identified as credibility flaw F1 in the internal
// audit. Party matching is now handled by the deterministic engine
// (lib/scoringEngine.ts) over sourced positions, and material impact by the
// simulator with published scales (data/policies.ts).
//
// What remains here are the functions with a documented basis:
// - social class and trajectory (INSEE deciles, Peugny 2013);
// - moral foundations (MFQ, Haidt et al.).

// ==================== SOCIAL CLASS (INSEE) ====================

/**
 * Determines the social class based on INSEE deciles.
 * Source: INSEE "Revenus et patrimoine des ménages" 2023
 *
 * @param income - Net monthly income in euros
 * @param patrimony - Gross wealth in euros
 * @param location - Territory type (adjusts income for cost of living)
 */
export function determineSocialClass(
  income: number,
  patrimony: number,
  location: LocationType = 'medium'
): SocialClass {
  const score = getSocialPositionScore(income, patrimony, location);
  return socialPositionToClass(score);
}

// ==================== MORAL FOUNDATIONS (Haidt MFT) ====================

/**
 * Computes the user's moral foundations profile.
 *
 * Source: Jonathan Haidt, "The Righteous Mind" (2012).
 * Questionnaire adapted from the MFQ-30 (Moral Foundations Questionnaire).
 */
export function calculateMoralFoundations(convictions: { [key: string]: number }): MoralFoundations {
  // Only the questions actually answered count: in express mode (1 item per
  // foundation), the average is taken over the present item instead of diluting
  // the score with a neutral default.
  const avg = (ids: string[]) => {
    const values = ids
      .map(id => convictions[id])
      .filter((v): v is number => v !== undefined);
    if (values.length === 0) return 3;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  return {
    care: avg(['mf1', 'mf2']),
    fairness: avg(['mf3', 'mf4']),
    loyalty: avg(['mf5', 'mf6']),
    authority: avg(['mf7', 'mf8']),
    sanctity: avg(['mf9', 'mf10']),
    liberty: avg(['mf11', 'mf12']),
  };
}

/**
 * Returns a human-readable interpretation of the moral profile.
 * Based on Haidt's finding that progressives emphasize Care/Fairness,
 * while conservatives balance all 6 foundations.
 */
export function interpretMoralProfile(mf: MoralFoundations): string {
  const dominant: string[] = [];
  const entries = Object.entries(mf) as [keyof MoralFoundations, number][];

  entries.forEach(([key, val]) => {
    if (val >= 3.8) dominant.push(MORAL_FOUNDATION_LABELS[key].full);
  });

  if (dominant.length === 0) {
    return 'Votre profil moral est équilibré, sans fondation nettement dominante.';
  }

  const allHigh = entries.every(([, val]) => val >= 3.5);
  if (allHigh) {
    return 'Vous accordez une importance élevée à l\'ensemble des fondations morales, ce qui est caractéristique d\'un profil moral intégrateur.';
  }

  return `Vos fondations morales dominantes sont : ${dominant.join(', ')}. Ces valeurs structurent probablement vos choix politiques au-delà des considérations économiques.`;
}
