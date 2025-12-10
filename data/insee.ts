/**
 * INSEE data: household income and wealth (France, 2023)
 *
 * Sources:
 * - INSEE, "Revenus et patrimoine des ménages", 2023 edition
 * - INSEE, Enquête Revenus fiscaux et sociaux (ERFS) 2021
 * - INSEE, Enquête Patrimoine 2021
 *
 * Values are in net monthly euros (income) and euros (wealth).
 * Deciles: D1 = poorest 10%, D9 = richest 10%.
 */

import type { ProfessionType, EducationType, LocationType } from '@/types';

// ==================== INCOME DECILES ====================

/** Deciles of individual monthly standard of living (net euros/month, 2021) */
export const incomeDeciles = {
  D1: 940,    // poorest 10%
  D2: 1_180,
  D3: 1_380,
  D4: 1_580,
  D5: 1_800,  // Median
  D6: 2_050,
  D7: 2_370,
  D8: 2_820,
  D9: 3_600,  // wealthiest 10%
} as const;

/** Median income by socio-professional category (average net monthly salary, INSEE DADS 2021) */
export const medianIncomeByProfession: Record<ProfessionType, number> = {
  student: 500,
  unemployed: 800,
  worker: 1_600,
  employee: 1_750,
  civil_servant: 2_200,
  self_employed: 2_500,
  manager: 3_200,
  senior_manager: 4_800,
  retired: 1_700,
};

/** Median income by diploma (net euros/month, INSEE 2021) */
export const medianIncomeByEducation: Record<EducationType, number> = {
  none: 1_200,
  cap: 1_500,
  bac: 1_700,
  bac23: 2_100,
  bac5: 2_800,
  bac8: 3_500,
};

/** Territorial coefficient (ratio of local vs national median income) */
export const territorialCoefficient: Record<LocationType, number> = {
  metropolis: 1.15,  // Metropolitan areas: income ~15% higher
  medium: 1.00,      // Medium-sized cities: baseline
  small: 0.92,       // Small towns: ~8% lower
  rural: 0.85,       // Rural: ~15% lower
};

// ==================== WEALTH DECILES ====================

/**
 * Deciles of gross household wealth (euros, INSEE Patrimoine 2021)
 * Source: INSEE, Histoire de vie et Patrimoine survey 2021
 */
export const patrimonyDeciles = {
  D1: 3_800,
  D2: 13_400,
  D3: 46_000,
  D4: 105_000,
  D5: 172_000,   // Median
  D6: 250_000,
  D7: 340_000,
  D8: 468_000,
  D9: 710_000,
} as const;

// ==================== SOCIAL CLASSIFICATION ====================

/**
 * Determines social class based on INSEE deciles.
 *
 * Methodology:
 * - Composite score = position in income deciles (60%) + wealth (40%)
 * - D1-D3 -> working class
 * - D4-D7 -> middle class
 * - D8-D10 -> upper class
 *
 * Income is adjusted by the territorial coefficient to reflect
 * cost-of-living disparities.
 */
export function getIncomeDecile(
  income: number,
  location: LocationType = 'medium'
): number {
  // Adjust income by the territorial coefficient (normalize to the national average)
  const adjustedIncome = income / territorialCoefficient[location];

  const deciles = Object.values(incomeDeciles);
  for (let i = 0; i < deciles.length; i++) {
    if (adjustedIncome <= deciles[i]) return i + 1;
  }
  return 10; // Above D9
}

export function getPatrimonyDecile(patrimony: number): number {
  const deciles = Object.values(patrimonyDeciles);
  for (let i = 0; i < deciles.length; i++) {
    if (patrimony <= deciles[i]) return i + 1;
  }
  return 10;
}

/**
 * Composite social position score (1-10).
 * Weighting: income 60%, wealth 40%.
 */
export function getSocialPositionScore(
  income: number,
  patrimony: number,
  location: LocationType = 'medium'
): number {
  const incDecile = getIncomeDecile(income, location);
  const patDecile = getPatrimonyDecile(patrimony);
  return Math.round(incDecile * 0.6 + patDecile * 0.4);
}

/**
 * Mapping from position score to social class.
 *
 * Sources:
 * - Louis Chauvel, "Les classes moyennes à la dérive" (Seuil, 2006)
 * - Camille Peugny, "Le destin au berceau" (Seuil, 2013)
 *
 * D1-D3 (score 1-3): Working classes, income < ~1400 EUR, wealth < ~46k EUR
 * D4-D7 (score 4-7): Middle classes, income 1400-2800 EUR, wealth 46k-468k EUR
 * D8-D10 (score 8-10): Upper classes, income > 2800 EUR, wealth > 468k EUR
 */
export function socialPositionToClass(score: number): 'working_class' | 'middle_class' | 'upper_class' {
  if (score <= 3) return 'working_class';
  if (score <= 7) return 'middle_class';
  return 'upper_class';
}
