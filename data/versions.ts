/**
 * Central registry of data versions.
 *
 * Every source displayed in the UI must reference this file so that the
 * user always knows which data (and from when) a score is based on.
 * Data freshness is a trust argument.
 */

export interface DataVersion {
  /** Short label displayed in the UI */
  label: string;
  /** Vintage of the underlying data */
  vintage: string;
  /** Public URL of the source (auditability) */
  url?: string;
}

export const DATA_VERSIONS = {
  ches: {
    label: 'CHES 2024',
    vintage: 'Enquête oct-déc 2024 (Jolly et al., 2025)',
    url: 'https://www.chesdata.eu/2024-chapel-hill-expert-survey-ches',
  },
  insee: {
    label: 'INSEE',
    vintage: 'Revenus et patrimoine des ménages, données 2021-2023',
    url: 'https://www.insee.fr/fr/statistiques/7456907',
  },
  mft: {
    label: 'Moral Foundations Theory',
    vintage: 'Items adaptés du MFQ (Graham et al., 2011) ; cadre MFQ-2 (Atari et al., 2023)',
    url: 'https://moralfoundations.org/questionnaires/',
  },
  legal: {
    label: 'Corpus juridique UE',
    vintage: 'Traités consolidés 2016, jurisprudence citée datée par arrêt',
    url: 'https://eur-lex.europa.eu/collection/eu-law/treaties/treaties-force.html',
  },
  positions: {
    label: 'Positions des partis par énoncé',
    vintage: 'Codage préliminaire 2026, programmes officiels 2022-2024 (statut a_verifier)',
  },
  fiches: {
    label: 'Fiches de faisabilité',
    vintage: '14 fiches préliminaires 2026, normes et jurisprudences citées et datées',
  },
} as const satisfies Record<string, DataVersion>;

/** Date of the last editorial review of the entire dataset. */
export const DATA_LAST_REVIEW = '2026-06-07';

/** Standard freshness line for the footers of results cards. */
export function dataFreshnessLine(): string {
  return `Données vérifiées le ${new Date(DATA_LAST_REVIEW + 'T00:00:00').toLocaleDateString('fr-FR')} : ${DATA_VERSIONS.ches.label} (positions des partis), ${DATA_VERSIONS.insee.label} 2021-2023 (revenus/patrimoine), programmes 2022-2024.`;
}
