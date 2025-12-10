/**
 * Chapel Hill Expert Survey (CHES) 2024: positioning of political parties.
 *
 * Primary source: CHES 2024 (official dataset CHES_2024_final_v2.csv)
 *   Jolly, S., Bakker, R., Hooghe, L., Marks, G., Polk, J., Rovny, J.,
 *   Steenbergen, M., Vachudova, M. (2025). "The 2024 Chapel Hill Expert Survey
 *   on political party positioning in Europe". Electoral Studies.
 *   Download: https://www.chesdata.eu/2024-chapel-hill-expert-survey-ches
 *   Codebook: https://www.chesdata.eu/s/CHES-2024-Codebook-er9d.pdf
 *   Survey conducted Oct-Dec 2024 among 609 political scientists (279 parties, 31 countries).
 *
 * CHES 2024 codebook scale conventions (respected below):
 * - lrgen      : 0 = far left, 10 = far right (general position)
 * - lrecon     : 0 = economic left, 10 = economic right
 * - eu_position: 1 = strongly opposed to EU integration, 7 = strongly in favor
 * - deregulation: 0 = opposed to market deregulation, 10 = in favor
 * - immigrate_policy: 0 = favors an open immigration policy,
 *                     10 = favors a restrictive policy
 * - galtan     : 0 = libertarian (GAL), 10 = authoritarian/traditionalist (TAN)
 * - environment: 0 = environment first (even at the cost of growth),
 *                10 = growth first (even at the cost of the environment)
 *
 * CHES -> app normalization (1-5): see chesDataToAppProfile() below.
 * The inversions account for the conventions above.
 */

/** Provenance of a party's data. */
export type CHESSource = 'CHES 2024' | 'Estimation documentée';

export interface CHESPartyData {
  /** Official CHES party id (party_id from the dataset), 0 if absent */
  chesId: number;
  /** Full name */
  name: string;
  /** Country */
  country: 'FR' | 'BE';
  /** Provenance: official dataset or documented estimate */
  source: CHESSource;
  /** Justification if estimated (required when source != CHES 2024) */
  sourceNote?: string;
  /** lrgen: general left-right position (0-10) */
  position: number;
  /** lrecon: economic left-right position (0=left, 10=right) */
  lrecon: number;
  /** eu_position: European integration (1=opposed, 7=in favor) */
  eu_position: number;
  /** deregulation: market deregulation (0=opposed, 10=in favor) */
  deregulation: number;
  /** immigrate_policy: immigration policy (0=open, 10=restrictive) */
  immigrate_policy: number;
  /** galtan: libertarian vs authoritarian (0=GAL, 10=TAN) */
  galtan: number;
  /** environment: environment vs growth (0=pro-env, 10=pro-growth) */
  environment: number;
}

/**
 * Official CHES 2024 data for 13 of the 14 parties.
 * Values copied from the CHES_2024_final_v2.csv dataset (rounded to 2 decimals).
 *
 * Only exception: UPR (absent from the CHES dataset because below the electoral
 * inclusion thresholds). Its values are an editorial committee estimate, marked
 * as such and displayed as such in the interface.
 */
export const chesRawData: Record<string, CHESPartyData> = {
  // === France (country=6 dans le dataset) ===
  lfi: {
    chesId: 627, // FI
    name: 'La France Insoumise',
    country: 'FR',
    source: 'CHES 2024',
    position: 0.82,
    lrecon: 0.91,
    eu_position: 3.0,
    deregulation: 0.67,
    immigrate_policy: 1.55,
    galtan: 1.82,
    environment: 3.33,
  },
  rn: {
    chesId: 610, // RN
    name: 'Rassemblement National',
    country: 'FR',
    source: 'CHES 2024',
    position: 8.82,
    lrecon: 6.0,
    eu_position: 2.18,
    deregulation: 4.0,
    immigrate_policy: 9.55,
    galtan: 8.36,
    environment: 8.0,
  },
  renaissance: {
    chesId: 626, // RE
    name: 'Renaissance',
    country: 'FR',
    source: 'CHES 2024',
    position: 6.27,
    lrecon: 6.18,
    eu_position: 6.27,
    deregulation: 7.0,
    immigrate_policy: 5.73,
    galtan: 4.09,
    environment: 5.67,
  },
  lr: {
    chesId: 609, // LR
    name: 'Les Républicains',
    country: 'FR',
    source: 'CHES 2024',
    position: 7.73,
    lrecon: 7.82,
    eu_position: 5.27,
    deregulation: 7.29,
    immigrate_policy: 8.36,
    galtan: 7.18,
    environment: 7.33,
  },
  eelv: {
    chesId: 605, // LE/EELV (Les Écologistes)
    name: 'Les Écologistes (ex-EELV)',
    country: 'FR',
    source: 'CHES 2024',
    position: 2.3,
    lrecon: 2.3,
    eu_position: 6.2,
    deregulation: 1.29,
    immigrate_policy: 1.6,
    galtan: 1.7,
    environment: 2.0,
  },
  ps: {
    chesId: 602, // PS
    name: 'Parti Socialiste',
    country: 'FR',
    source: 'CHES 2024',
    position: 3.45,
    lrecon: 3.36,
    eu_position: 6.27,
    deregulation: 3.43,
    immigrate_policy: 3.18,
    galtan: 2.73,
    environment: 3.33,
  },
  reconquete: {
    chesId: 630, // REC: now included in CHES 2024
    name: 'Reconquête',
    country: 'FR',
    source: 'CHES 2024',
    position: 9.73,
    lrecon: 8.33,
    eu_position: 1.64,
    deregulation: 5.8,
    immigrate_policy: 9.67,
    galtan: 9.1,
    environment: 7.83,
  },
  pcf: {
    chesId: 601, // PCF
    name: 'Parti Communiste Français',
    country: 'FR',
    source: 'CHES 2024',
    position: 1.73,
    lrecon: 1.27,
    eu_position: 3.11,
    deregulation: 1.29,
    immigrate_policy: 3.09,
    galtan: 3.55,
    environment: 4.33,
  },
  modem: {
    chesId: 613, // MoDem
    name: 'Mouvement Démocrate',
    country: 'FR',
    source: 'CHES 2024',
    position: 5.36,
    lrecon: 5.7,
    eu_position: 6.82,
    deregulation: 6.71,
    immigrate_policy: 4.67,
    galtan: 4.5,
    environment: 5.67,
  },
  horizons: {
    chesId: 631, // Horizons
    name: 'Horizons',
    country: 'FR',
    source: 'CHES 2024',
    position: 6.6,
    lrecon: 6.8,
    eu_position: 6.44,
    deregulation: 7.43,
    immigrate_policy: 6.0,
    galtan: 5.3,
    environment: 6.33,
  },
  upr: {
    chesId: 0, // Absent from CHES (party below the electoral inclusion thresholds)
    name: 'Union Populaire Républicaine',
    country: 'FR',
    source: 'Estimation documentée',
    sourceNote:
      "Parti absent du dataset CHES 2024 (seuils électoraux non atteints). " +
      "Estimation du comité éditorial à partir du programme officiel UPR " +
      "(upr.fr/programme) : Frexit (eu_position minimal), positionnement " +
      "économique et sociétal médian revendiqué. Valeurs à considérer comme " +
      "indicatives.",
    position: 5.0,
    lrecon: 4.0,
    eu_position: 1.0,
    deregulation: 4.0,
    immigrate_policy: 6.0,
    galtan: 5.0,
    environment: 6.0,
  },
  // === Belgique (country=1 dans le dataset) ===
  ptb: {
    chesId: 119, // PVDA-PTB
    name: 'PTB-PVDA',
    country: 'BE',
    source: 'CHES 2024',
    position: 0.8,
    lrecon: 0.8,
    eu_position: 2.44,
    deregulation: 1.67,
    immigrate_policy: 2.78,
    galtan: 3.2,
    environment: 5.0,
  },
  'ps-be': {
    chesId: 102, // PS (francophone)
    name: 'Parti Socialiste (BE)',
    country: 'BE',
    source: 'CHES 2024',
    position: 2.56,
    lrecon: 2.44,
    eu_position: 5.78,
    deregulation: 3.33,
    immigrate_policy: 3.22,
    galtan: 2.78,
    environment: 3.0,
  },
  mr: {
    chesId: 106, // MR
    name: 'Mouvement Réformateur',
    country: 'BE',
    source: 'CHES 2024',
    position: 7.44,
    lrecon: 8.0,
    eu_position: 6.44,
    deregulation: 8.0,
    immigrate_policy: 6.5,
    galtan: 5.22,
    environment: 7.4,
  },
  ecolo: {
    chesId: 104, // Ecolo
    name: 'Ecolo',
    country: 'BE',
    source: 'CHES 2024',
    position: 2.44,
    lrecon: 2.44,
    eu_position: 5.89,
    deregulation: 3.67,
    immigrate_policy: 2.44,
    galtan: 1.56,
    environment: 1.0,
  },
  'les-engages': {
    chesId: 108, // LE
    name: 'Les Engagés (ex-cdH)',
    country: 'BE',
    source: 'CHES 2024',
    position: 5.56,
    lrecon: 5.33,
    eu_position: 6.43,
    deregulation: 4.33,
    immigrate_policy: 4.63,
    galtan: 5.75,
    environment: 5.8,
  },
  nva: {
    chesId: 110, // N-VA
    name: 'N-VA',
    country: 'BE',
    source: 'CHES 2024',
    position: 7.5,
    lrecon: 7.5,
    eu_position: 4.5,
    deregulation: 6.33,
    immigrate_policy: 8.2,
    galtan: 7.1,
    environment: 6.8,
  },
  vooruit: {
    chesId: 103, // Vooruit
    name: 'Vooruit',
    country: 'BE',
    source: 'CHES 2024',
    position: 4.3,
    lrecon: 4.1,
    eu_position: 6.1,
    deregulation: 4.0,
    immigrate_policy: 5.0,
    galtan: 3.1,
    environment: 3.2,
  },
  groen: {
    chesId: 105, // Groen
    name: 'Groen',
    country: 'BE',
    source: 'CHES 2024',
    position: 2.5,
    lrecon: 2.7,
    eu_position: 5.9,
    deregulation: 3.67,
    immigrate_policy: 2.6,
    galtan: 1.6,
    environment: 1.0,
  },
  'open-vld': {
    chesId: 107, // Open Vld
    name: 'Open Vld',
    country: 'BE',
    source: 'CHES 2024',
    position: 6.33,
    lrecon: 7.0,
    eu_position: 6.7,
    deregulation: 7.33,
    immigrate_policy: 5.6,
    galtan: 3.0,
    environment: 6.0,
  },
  cdv: {
    chesId: 109, // CD&V
    name: 'CD&V',
    country: 'BE',
    source: 'CHES 2024',
    position: 5.7,
    lrecon: 5.6,
    eu_position: 6.7,
    deregulation: 4.67,
    immigrate_policy: 5.5,
    galtan: 6.8,
    environment: 6.4,
  },
  'vlaams-belang': {
    chesId: 112, // VB
    name: 'Vlaams Belang',
    country: 'BE',
    source: 'CHES 2024',
    position: 9.2,
    lrecon: 7.0,
    eu_position: 2.0,
    deregulation: 5.5,
    immigrate_policy: 9.9,
    galtan: 8.9,
    environment: 8.0,
  },
  defi: {
    chesId: 111, // DéFI
    name: 'DéFI',
    country: 'BE',
    source: 'CHES 2024',
    position: 6.0,
    lrecon: 5.5,
    eu_position: 6.0,
    deregulation: 5.0,
    immigrate_policy: 4.5,
    galtan: 3.75,
    environment: 5.0,
  },
};

// ==================== CHES -> APP NORMALIZATION ====================

export interface NormalizedPartyProfile {
  economic_redistribution: number; // 1-5, 5 = strong redistribution
  eu_critical: number;             // 1-5, 5 = very critical of the EU
  state_intervention: number;      // 1-5, 5 = strong intervention
  immigration_control: number;     // 1-5, 5 = strong control
  internationalism: number;        // 1-5, 5 = very internationalist
  green_policies: number;          // 1-5, 5 = very environmentalist
}

/**
 * Normalizes raw CHES data into an app profile (1-5).
 *
 * Mapping (following CHES 2024 codebook conventions):
 * - lrecon -> economic_redistribution: INVERTED (economic left = strong redistribution)
 * - eu_position -> eu_critical: INVERTED, 1-7 scale (pro-EU = low criticism)
 * - deregulation -> state_intervention: INVERTED (pro-deregulation = low intervention)
 * - immigrate_policy -> immigration_control: DIRECT (10 = restrictive in CHES 2024)
 * - eu_position -> internationalism: DIRECT, 1-7 scale (pro-EU ~ internationalist)
 * - environment -> green_policies: INVERTED (0 = pro-environment in CHES 2024)
 */
function normalize(chesValue: number, max: number = 10, invert: boolean = false): number {
  const normalized = invert
    ? 1 + ((max - chesValue) / max) * 4
    : 1 + (chesValue / max) * 4;
  return Math.round(normalized * 10) / 10; // 1 decimal
}

/** Specific eu_position normalization: 1-7 scale (not 0-10). */
function normalizeEU(value: number, invert: boolean): number {
  const ratio = (value - 1) / 6; // 1-7 -> 0-1
  const normalized = invert ? 1 + (1 - ratio) * 4 : 1 + ratio * 4;
  return Math.round(normalized * 10) / 10;
}

export function chesDataToAppProfile(data: CHESPartyData): NormalizedPartyProfile {
  return {
    economic_redistribution: normalize(data.lrecon, 10, true),
    eu_critical: normalizeEU(data.eu_position, true),
    state_intervention: normalize(data.deregulation, 10, true),
    immigration_control: normalize(data.immigrate_policy, 10, false),
    internationalism: normalizeEU(data.eu_position, false),
    green_policies: normalize(data.environment, 10, true),
  };
}

/** All normalized profiles for the app, keyed by party id */
export function getAllNormalizedProfiles(): Record<string, NormalizedPartyProfile> {
  const profiles: Record<string, NormalizedPartyProfile> = {};
  for (const [id, data] of Object.entries(chesRawData)) {
    profiles[id] = chesDataToAppProfile(data);
  }
  return profiles;
}

/** Provenance of a party's data (for UI display and open data). */
export function getPartySource(partyId: string): { source: CHESSource; note?: string } | null {
  const data = chesRawData[partyId];
  if (!data) return null;
  return { source: data.source, note: data.sourceNote };
}

/**
 * Complete open data table: raw + normalized positions + provenance.
 * Exposed publicly (methodology page) for auditability.
 */
export function getOpenDataTable() {
  return Object.entries(chesRawData).map(([id, data]) => ({
    id,
    name: data.name,
    country: data.country,
    chesId: data.chesId,
    source: data.source,
    sourceNote: data.sourceNote ?? null,
    raw: {
      position: data.position,
      lrecon: data.lrecon,
      eu_position: data.eu_position,
      deregulation: data.deregulation,
      immigrate_policy: data.immigrate_policy,
      galtan: data.galtan,
      environment: data.environment,
    },
    normalized: chesDataToAppProfile(data),
  }));
}
