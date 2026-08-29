/**
 * CHES 2024 salience: how important each theme is in a party's own public
 * stance, as rated by the CHES expert panel (0 = not important at all,
 * 10 = extremely important). Salience is direction-neutral: it says what a
 * party fights about, not which side it takes. That makes it the objective
 * counterpart of the reader's "combats prioritaires": both sides of the
 * comparison declare what matters most to them, and the app only reads the
 * overlap.
 *
 * Primary source: CHES 2024 (official dataset CHES_2024_final_v2.csv), same
 * citation and download as data/ches.ts. Values copied from the dataset on
 * 2026-08-29 and rounded to 2 decimals, the convention ches.ts already uses.
 *
 * Two parties (UPR, Les Patriotes) are below the CHES inclusion thresholds
 * and carry a documented estimate instead: no fabricated numbers, only the
 * fights their own program declares, marked as estimates in the UI exactly
 * like their positions.
 */

import type { DimensionKey } from '@/types/positions';
import type { CHESSource } from '@/data/ches';

/** The nine CHES 2024 salience items kept, in codebook order. */
export const SALIENCE_THEMES = [
    'eu',
    'economy',
    'traditions',
    'immigration',
    'multiculturalism',
    'redistribution',
    'climate',
    'environment',
    'antiElite'
] as const;

export type SalienceTheme = (typeof SALIENCE_THEMES)[number];

/**
 * CHES column behind each theme (codebook names, for auditability):
 * eu -> eu_salience, economy -> lrecon_salience, traditions -> galtan_salience,
 * immigration -> immigrate_salience, multiculturalism -> multicult_salience,
 * redistribution -> redist_salience, climate -> climate_change_salience,
 * environment -> environment_salience, antiElite -> anti_elite_salience.
 */
export const SALIENCE_THEME_LABELS: Record<SalienceTheme, string> = {
    eu: 'Intégration européenne',
    economy: 'Économie (gauche-droite)',
    traditions: 'Libertés et traditions',
    immigration: 'Immigration',
    multiculturalism: 'Multiculturalisme',
    redistribution: 'Redistribution',
    climate: 'Changement climatique',
    environment: "Protection de l'environnement",
    antiElite: 'Rhétorique anti-élites'
};

/**
 * Where each CHES theme lands among the app's seven dimensions, anchored in
 * the statement corpus rather than in intuition: immigration is asked in
 * geopolitics (ge3) and social (so2, be3), EU membership in geopolitics
 * (ge1, ge8), redistribution in economy (ec1), GAL-TAN topics in social
 * (so1-so4), climate and environment in environment (en1-en4), anti-elite
 * politics in power (po2, the citizens' initiative referendum) and knowledge
 * (the relation to experts and institutions). No CHES item measures the
 * knowledge or moral dimensions as such; the UI says so instead of stretching
 * the mapping.
 */
export const SALIENCE_THEME_DIMENSIONS: Record<SalienceTheme, readonly DimensionKey[]> = {
    eu: ['geopolitics'],
    economy: ['economy'],
    traditions: ['social'],
    immigration: ['geopolitics', 'social'],
    multiculturalism: ['social'],
    redistribution: ['economy'],
    climate: ['environment'],
    environment: ['environment'],
    antiElite: ['power', 'knowledge']
};

/** One program-declared fight of a party CHES does not cover. */
export interface DeclaredFightEstimate {
    theme: SalienceTheme;
    /** Clear-text statement of the fight, shown as-is in the UI. */
    detail: string;
}

export type PartySalienceEntry =
    | {
          source: Extract<CHESSource, 'CHES 2024'>;
          /** Official CHES party id, for cross-checking against the CSV. */
          chesId: number;
          values: Record<SalienceTheme, number>;
      }
    | {
          source: Extract<CHESSource, 'Estimation documentée'>;
          /** Why the estimate exists and what it rests on. */
          sourceNote: string;
          /** Ordered as the party's own program orders them. */
          declaredFights: DeclaredFightEstimate[];
      };

/** Salience per party, keyed by the app's party ids (data/parties.ts). */
export const PARTY_SALIENCE: Record<string, PartySalienceEntry> = {
    // === France (country=6 in the dataset) ===
    fr_lfi: {
        source: 'CHES 2024',
        chesId: 627,
        values: {
            eu: 5.3,
            economy: 7.5,
            traditions: 7.67,
            immigration: 4.8,
            multiculturalism: 5.11,
            redistribution: 9,
            climate: 6.75,
            environment: 7.4,
            antiElite: 8.75
        }
    },
    fr_rn: {
        source: 'CHES 2024',
        chesId: 610,
        values: {
            eu: 5.36,
            economy: 6.2,
            traditions: 6.6,
            immigration: 9.6,
            multiculturalism: 9.7,
            redistribution: 5.44,
            climate: 5.25,
            environment: 3.2,
            antiElite: 8.75
        }
    },
    fr_reconquete: {
        source: 'CHES 2024',
        chesId: 630,
        values: {
            eu: 6.9,
            economy: 4,
            traditions: 8.4,
            immigration: 9.7,
            multiculturalism: 9.8,
            redistribution: 3.57,
            climate: 4.67,
            environment: 1.2,
            antiElite: 8.75
        }
    },
    fr_upr: {
        source: 'Estimation documentée',
        sourceNote:
            'Parti absent du dataset CHES 2024 (seuils électoraux non atteints). ' +
            "Combat déclaré repris du programme officiel (upr.fr) : la sortie de " +
            "l'Union européenne, de l'euro et de l'OTAN y est présentée comme la " +
            'raison d\'être du parti, avant tout autre sujet.',
        declaredFights: [
            {
                theme: 'eu',
                detail: "Sortie de l'UE, de l'euro et de l'OTAN (cœur du programme)"
            }
        ]
    },
    fr_patriotes: {
        source: 'Estimation documentée',
        sourceNote:
            'Parti absent du dataset CHES 2024 (seuils électoraux non atteints). ' +
            'Combat déclaré repris du programme officiel (les-patriotes.fr) : le ' +
            "Frexit et la sortie de l'euro y structurent l'ensemble des propositions.",
        declaredFights: [
            {
                theme: 'eu',
                detail: "Frexit et sortie de l'euro (axe central du programme)"
            }
        ]
    },
    fr_renaissance: {
        source: 'CHES 2024',
        chesId: 626,
        values: {
            eu: 6.91,
            economy: 7.8,
            traditions: 5.7,
            immigration: 6,
            multiculturalism: 5.22,
            redistribution: 5.22,
            climate: 4.75,
            environment: 4.8,
            antiElite: 3.75
        }
    },
    fr_lr: {
        source: 'CHES 2024',
        chesId: 609,
        values: {
            eu: 5.5,
            economy: 7.7,
            traditions: 5.22,
            immigration: 7.7,
            multiculturalism: 7.6,
            redistribution: 4.89,
            climate: 2.75,
            environment: 3.4,
            antiElite: 5
        }
    },
    fr_eelv: {
        source: 'CHES 2024',
        chesId: 605,
        values: {
            eu: 7,
            economy: 6.11,
            traditions: 8,
            immigration: 4.78,
            multiculturalism: 4.89,
            redistribution: 8,
            climate: 9.25,
            environment: 10,
            antiElite: 5
        }
    },
    fr_ps: {
        source: 'CHES 2024',
        chesId: 602,
        values: {
            eu: 6.5,
            economy: 6.9,
            traditions: 6,
            immigration: 4.3,
            multiculturalism: 4,
            redistribution: 7.56,
            climate: 6.5,
            environment: 7,
            antiElite: 4.25
        }
    },
    fr_pcf: {
        source: 'CHES 2024',
        chesId: 601,
        values: {
            eu: 3.6,
            economy: 7.56,
            traditions: 5.33,
            immigration: 3.4,
            multiculturalism: 3.88,
            redistribution: 9,
            climate: 5.5,
            environment: 4.8,
            antiElite: 6
        }
    },
    fr_horizons: {
        source: 'CHES 2024',
        chesId: 631,
        values: {
            eu: 6.3,
            economy: 7.44,
            traditions: 4.89,
            immigration: 5.33,
            multiculturalism: 5,
            redistribution: 4.89,
            climate: 4.5,
            environment: 4.4,
            antiElite: 3
        }
    },
    fr_modem: {
        source: 'CHES 2024',
        chesId: 613,
        values: {
            eu: 6.8,
            economy: 6.33,
            traditions: 4.22,
            immigration: 4.67,
            multiculturalism: 4.33,
            redistribution: 4.67,
            climate: 4.75,
            environment: 4.6,
            antiElite: 3
        }
    },
    // === Belgium (country=1 in the dataset) ===
    be_ptb: {
        source: 'CHES 2024',
        chesId: 119,
        values: {
            eu: 4.33,
            economy: 8.4,
            traditions: 3.2,
            immigration: 3.1,
            multiculturalism: 3.75,
            redistribution: 9.63,
            climate: 3.6,
            environment: 3.6,
            antiElite: 8.71
        }
    },
    be_mr: {
        source: 'CHES 2024',
        chesId: 106,
        values: {
            eu: 3.38,
            economy: 8.11,
            traditions: 5.25,
            immigration: 5.78,
            multiculturalism: 5.75,
            redistribution: 6.57,
            climate: 3,
            environment: 5.4,
            antiElite: 4.2
        }
    },
    be_ps: {
        source: 'CHES 2024',
        chesId: 102,
        values: {
            eu: 3.22,
            economy: 7.44,
            traditions: 4.75,
            immigration: 3.22,
            multiculturalism: 4,
            redistribution: 8.43,
            climate: 3.67,
            environment: 4.2,
            antiElite: 4.4
        }
    },
    be_ecolo: {
        source: 'CHES 2024',
        chesId: 104,
        values: {
            eu: 3.88,
            economy: 5.5,
            traditions: 7.25,
            immigration: 5.75,
            multiculturalism: 5.14,
            redistribution: 6.57,
            climate: 9.75,
            environment: 7.2,
            antiElite: 3.2
        }
    },
    be_engages: {
        source: 'CHES 2024',
        chesId: 108,
        values: {
            eu: 3.33,
            economy: 6,
            traditions: 4.63,
            immigration: 3.29,
            multiculturalism: 4.29,
            redistribution: 5.67,
            climate: 4,
            environment: 4.2,
            antiElite: 2.25
        }
    },
    be_nva: {
        source: 'CHES 2024',
        chesId: 110,
        values: {
            eu: 3,
            economy: 7.8,
            traditions: 5.8,
            immigration: 7,
            multiculturalism: 7,
            redistribution: 5.5,
            climate: 3.2,
            environment: 5.8,
            antiElite: 4.5
        }
    },
    be_vb: {
        source: 'CHES 2024',
        chesId: 112,
        values: {
            eu: 4.2,
            economy: 3.4,
            traditions: 6.1,
            immigration: 9.8,
            multiculturalism: 9.78,
            redistribution: 3.75,
            climate: 1,
            environment: 3.4,
            antiElite: 8.71
        }
    },
    be_vooruit: {
        source: 'CHES 2024',
        chesId: 103,
        values: {
            eu: 3,
            economy: 7,
            traditions: 5.1,
            immigration: 4.4,
            multiculturalism: 4.89,
            redistribution: 7.63,
            climate: 5.2,
            environment: 4,
            antiElite: 3.67
        }
    },
    be_openvld: {
        source: 'CHES 2024',
        chesId: 107,
        values: {
            eu: 4,
            economy: 7.6,
            traditions: 4.9,
            immigration: 3.3,
            multiculturalism: 4,
            redistribution: 5.63,
            climate: 3.8,
            environment: 4.2,
            antiElite: 2.5
        }
    },
    be_cdv: {
        source: 'CHES 2024',
        chesId: 109,
        values: {
            eu: 3.4,
            economy: 6,
            traditions: 5.3,
            immigration: 3.8,
            multiculturalism: 5,
            redistribution: 6,
            climate: 3.4,
            environment: 3.6,
            antiElite: 2
        }
    },
    be_groen: {
        source: 'CHES 2024',
        chesId: 105,
        values: {
            eu: 3.6,
            economy: 5.6,
            traditions: 6.8,
            immigration: 5.1,
            multiculturalism: 4.44,
            redistribution: 6.75,
            climate: 9.8,
            environment: 7.2,
            antiElite: 2.83
        }
    },
    be_defi: {
        source: 'CHES 2024',
        chesId: 111,
        values: {
            eu: 2.67,
            economy: 4.2,
            traditions: 6.25,
            immigration: 6.25,
            multiculturalism: 5.67,
            redistribution: 6,
            climate: 3,
            environment: 5,
            antiElite: 2.5
        }
    }
};
