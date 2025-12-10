/**
 * Policy Impact Simulator: modeling of flagship measures by party
 *
 * Sources:
 * - IPP (Institut des Politiques Publiques), TAXIPP microsimulations
 * - OFCE, evaluations of electoral programs
 * - Official party programs (2022-2024)
 * - Direction Générale du Trésor, impact studies
 *
 * Each measure models a monthly euro impact based on the user profile.
 * The figures are ESTIMATES based on published scales.
 * They do not constitute an exact prediction.
 */

import type { ProfessionType, LocationType, SocialClass } from '@/types';

// ==================== TYPES ====================

export interface PolicyMeasure {
  id: string;
  title: string;
  description: string;
  category: 'fiscalite' | 'logement' | 'transport' | 'sante' | 'retraite' | 'emploi' | 'ecologie';
  source: string;
  /** Calculate monthly impact in euros for a given profile */
  calculateImpact: (profile: ImpactProfile) => number;
}

export interface PartyPolicies {
  partyId: string;
  partyName: string;
  country: 'FR' | 'BE';
  measures: PolicyMeasure[];
  sourceUrl: string;
}

export interface ImpactProfile {
  monthlyIncome: number;
  patrimony: number;
  profession: ProfessionType;
  location: LocationType;
  socialClass: SocialClass;
}

export interface PolicyImpactResult {
  partyId: string;
  partyName: string;
  measures: {
    title: string;
    description: string;
    category: string;
    impact: number; // euros/month (positive = gain, negative = loss)
    source: string;
  }[];
  totalImpact: number;
}

// ==================== CATEGORY LABELS ====================

export const categoryLabels: Record<string, { label: string; icon: string }> = {
  fiscalite: { label: 'Fiscalité', icon: 'percent' },
  logement: { label: 'Logement', icon: 'home' },
  transport: { label: 'Transport', icon: 'car' },
  sante: { label: 'Santé', icon: 'heart' },
  retraite: { label: 'Retraite', icon: 'clock' },
  emploi: { label: 'Emploi', icon: 'briefcase' },
  ecologie: { label: 'Écologie', icon: 'leaf' },
};

// ==================== HELPER FUNCTIONS ====================

/** Simple income tax bracket calculation (France 2024 scale) */
function estimateIncomeTax(monthlyIncome: number): number {
  const annual = monthlyIncome * 12;
  let tax = 0;
  if (annual > 11294) tax += Math.min(annual - 11294, 28797 - 11294) * 0.11;
  if (annual > 28797) tax += Math.min(annual - 28797, 82341 - 28797) * 0.30;
  if (annual > 82341) tax += Math.min(annual - 82341, 177106 - 82341) * 0.41;
  if (annual > 177106) tax += (annual - 177106) * 0.45;
  return tax / 12; // monthly
}

// ==================== PARTY POLICIES ====================

export const partyPolicies: PartyPolicies[] = [
  // ======================== LFI ========================
  {
    partyId: 'lfi',
    partyName: 'La France Insoumise',
    country: 'FR',
    sourceUrl: 'https://lafranceinsoumise.fr/programme/',
    measures: [
      {
        id: 'lfi-ir',
        title: 'Réforme de l\'impôt sur le revenu (14 tranches)',
        description: 'Barème progressif à 14 tranches, hausse pour les hauts revenus, baisse pour les bas revenus',
        category: 'fiscalite',
        source: 'Programme LFI 2022, chiffrage IPP',
        calculateImpact: ({ monthlyIncome }) => {
          // Simplified: below 2000€ → gains, above 4000€ → losses
          if (monthlyIncome < 1500) return 80;
          if (monthlyIncome < 2500) return 40;
          if (monthlyIncome < 4000) return 0;
          if (monthlyIncome < 6000) return -150;
          return -400;
        },
      },
      {
        id: 'lfi-smic',
        title: 'SMIC à 1600€ net',
        description: 'Augmentation du salaire minimum à 1600€ net mensuels',
        category: 'emploi',
        source: 'Programme LFI 2022',
        calculateImpact: ({ monthlyIncome, profession }) => {
          if (profession === 'retired' || profession === 'student') return 0;
          if (monthlyIncome < 1400) return 200;
          if (monthlyIncome < 1600) return 1600 - monthlyIncome;
          return 0;
        },
      },
      {
        id: 'lfi-loyer',
        title: 'Encadrement des loyers généralisé',
        description: 'Plafonnement des loyers dans toutes les zones tendues',
        category: 'logement',
        source: 'Programme LFI, estimation OFCE',
        calculateImpact: ({ location, profession }) => {
          if (profession === 'self_employed' && location === 'metropolis') return -20; // landlord
          if (location === 'metropolis') return 120;
          if (location === 'medium') return 60;
          return 0;
        },
      },
      {
        id: 'lfi-transport',
        title: 'Gratuité des transports en commun',
        description: 'Transports en commun gratuits pour les moins de 25 ans et précaires',
        category: 'transport',
        source: 'Programme LFI 2022',
        calculateImpact: ({ monthlyIncome, profession }) => {
          if (profession === 'student') return 75;
          if (monthlyIncome < 1500) return 60;
          return 0;
        },
      },
      {
        id: 'lfi-isf',
        title: 'Rétablissement de l\'ISF renforcé',
        description: 'Impôt sur la fortune élargi et renforcé',
        category: 'fiscalite',
        source: 'Programme LFI, estimation DG Trésor',
        calculateImpact: ({ patrimony }) => {
          if (patrimony < 750000) return 0;
          if (patrimony < 1500000) return -(patrimony * 0.005 / 12);
          return -(patrimony * 0.015 / 12);
        },
      },
    ],
  },

  // ======================== RN ========================
  {
    partyId: 'rn',
    partyName: 'Rassemblement National',
    country: 'FR',
    sourceUrl: 'https://rassemblementnational.fr/programme/',
    measures: [
      {
        id: 'rn-tva',
        title: 'Baisse de la TVA sur l\'énergie (5,5%)',
        description: 'Réduction de la TVA sur l\'énergie de 20% à 5,5%',
        category: 'ecologie',
        source: 'Programme RN 2022, chiffrage Sénat',
        calculateImpact: ({ location }) => {
          // Estimate based on average energy bill
          if (location === 'rural') return 45;
          if (location === 'small') return 38;
          return 30;
        },
      },
      {
        id: 'rn-ir-jeunes',
        title: 'Exonération IR pour les moins de 30 ans',
        description: 'Les moins de 30 ans ne paient pas d\'impôt sur le revenu',
        category: 'fiscalite',
        source: 'Programme RN 2024',
        calculateImpact: ({ monthlyIncome, profession }) => {
          // Only young workers benefit (proxy: students/early career)
          if (profession === 'student') return estimateIncomeTax(monthlyIncome);
          return 0;
        },
      },
      {
        id: 'rn-carburant',
        title: 'Baisse des taxes sur le carburant',
        description: 'Réduction de la TICPE de 30 centimes/litre',
        category: 'transport',
        source: 'Programme RN 2022',
        calculateImpact: ({ location }) => {
          // Rural = more dependent on the car
          if (location === 'rural') return 65;
          if (location === 'small') return 50;
          if (location === 'medium') return 30;
          return 10;
        },
      },
      {
        id: 'rn-retraite',
        title: 'Retraite à 60 ans (40 annuités)',
        description: 'Retour de l\'âge de départ à 60 ans pour ceux ayant 40 annuités',
        category: 'retraite',
        source: 'Programme RN 2022',
        calculateImpact: ({ profession }) => {
          if (profession === 'retired') return 0; // already retired
          if (profession === 'worker') return 25; // symbolic valuation
          return 0; // future impact, not immediate
        },
      },
      {
        id: 'rn-immigration',
        title: 'Fin de l\'AME (Aide Médicale d\'État)',
        description: 'Suppression de l\'aide médicale pour les sans-papiers, réallocation',
        category: 'sante',
        source: 'Programme RN 2024, chiffrage DREES',
        calculateImpact: () => {
          // Low budgetary impact per capita (~1bn EUR / 67M inhabitants = ~1.2 EUR/month)
          return 1;
        },
      },
    ],
  },

  // ======================== RENAISSANCE ========================
  {
    partyId: 'renaissance',
    partyName: 'Renaissance',
    country: 'FR',
    sourceUrl: 'https://www.renaissance-en-marche.fr/',
    measures: [
      {
        id: 'ren-travail',
        title: 'Prime d\'activité renforcée',
        description: 'Augmentation de la prime d\'activité pour les travailleurs modestes',
        category: 'emploi',
        source: 'Bilan Macron, CAF données 2024',
        calculateImpact: ({ monthlyIncome, profession }) => {
          if (profession === 'student' || profession === 'retired') return 0;
          if (monthlyIncome < 1800) return 50;
          if (monthlyIncome < 2500) return 20;
          return 0;
        },
      },
      {
        id: 'ren-retraite64',
        title: 'Réforme des retraites (64 ans)',
        description: 'Recul de l\'âge de départ à 64 ans, surcote pour les carrières longues',
        category: 'retraite',
        source: 'Loi retraites 2023, étude DREES',
        calculateImpact: ({ profession }) => {
          if (profession === 'worker') return -30; // hardship
          if (profession === 'employee') return -20;
          if (profession === 'senior_manager') return 15; // favorable pension bonus
          return -10;
        },
      },
      {
        id: 'ren-baisse-impots',
        title: 'Baisse de l\'impôt sur le revenu (tranches basses)',
        description: 'Réduction de la tranche à 11% pour les classes moyennes',
        category: 'fiscalite',
        source: 'PLF 2025, chiffrage DG Trésor',
        calculateImpact: ({ monthlyIncome }) => {
          if (monthlyIncome < 1200) return 0;
          if (monthlyIncome < 2500) return 25;
          if (monthlyIncome < 4000) return 15;
          return 0;
        },
      },
      {
        id: 'ren-elec',
        title: 'Bouclier tarifaire énergie (maintien)',
        description: 'Maintien du plafonnement des prix de l\'électricité',
        category: 'ecologie',
        source: 'CRE, bilan 2023-2024',
        calculateImpact: () => 20, // ~20 EUR/month average saving
      },
      {
        id: 'ren-apprentissage',
        title: 'Subvention apprentissage renforcée',
        description: 'Aide de 6000€ par apprenti pour les entreprises',
        category: 'emploi',
        source: 'DARES 2024',
        calculateImpact: ({ profession }) => {
          if (profession === 'student') return 30; // better access to apprenticeships
          return 0;
        },
      },
    ],
  },

  // ======================== EELV ========================
  {
    partyId: 'eelv',
    partyName: 'Europe Écologie Les Verts',
    country: 'FR',
    sourceUrl: 'https://www.eelv.fr/',
    measures: [
      {
        id: 'eelv-isf-vert',
        title: 'ISF climatique',
        description: 'Impôt sur la fortune indexé sur l\'empreinte carbone du patrimoine',
        category: 'fiscalite',
        source: 'Programme EELV 2022, estimation Oxfam',
        calculateImpact: ({ patrimony }) => {
          if (patrimony < 500000) return 0;
          return -(patrimony * 0.003 / 12);
        },
      },
      {
        id: 'eelv-transport-gratuit',
        title: 'Transports en commun à 1€/jour',
        description: 'Forfait transport plafonné à 30€/mois partout en France',
        category: 'transport',
        source: 'Programme EELV 2022',
        calculateImpact: ({ location }) => {
          if (location === 'metropolis') return 50; // Navigo = 86 EUR -> 30 EUR
          if (location === 'medium') return 20;
          return 0;
        },
      },
      {
        id: 'eelv-reno',
        title: 'Rénovation énergétique obligatoire',
        description: 'Plan massif de rénovation des logements, financé par l\'État',
        category: 'logement',
        source: 'Programme EELV, chiffrage ADEME',
        calculateImpact: ({ socialClass }) => {
          // Lower energy bill after renovation
          if (socialClass === 'working_class') return 60;
          if (socialClass === 'middle_class') return 40;
          return 0; // upper classes self-finance
        },
      },
      {
        id: 'eelv-taxe-carbone',
        title: 'Taxe carbone progressive',
        description: 'Hausse de la taxe carbone à 150€/tonne, redistribuée en chèque vert',
        category: 'ecologie',
        source: 'I4CE, étude trajectoire carbone',
        calculateImpact: ({ location, monthlyIncome }) => {
          // Energy cost + redistribution
          const cost = location === 'rural' ? -80 : location === 'small' ? -50 : -30;
          const redistribution = monthlyIncome < 2000 ? 60 : monthlyIncome < 3500 ? 30 : 0;
          return cost + redistribution;
        },
      },
      {
        id: 'eelv-bio',
        title: 'Cantine 100% bio et locale',
        description: 'Restauration scolaire bio et locale, gratuite pour les familles modestes',
        category: 'sante',
        source: 'Programme EELV 2022',
        calculateImpact: ({ monthlyIncome }) => {
          if (monthlyIncome < 2000) return 40; // canteen saving
          return 0;
        },
      },
    ],
  },

  // ======================== LR ========================
  {
    partyId: 'lr',
    partyName: 'Les Républicains',
    country: 'FR',
    sourceUrl: 'https://republicains.fr/',
    measures: [
      {
        id: 'lr-impots',
        title: 'Baisse de 10% de l\'impôt sur le revenu',
        description: 'Réduction linéaire de 10% de l\'IR pour tous les contribuables',
        category: 'fiscalite',
        source: 'Programme LR 2022, chiffrage IPP',
        calculateImpact: ({ monthlyIncome }) => {
          return estimateIncomeTax(monthlyIncome) * 0.10;
        },
      },
      {
        id: 'lr-heritage',
        title: 'Exonération droits de succession (300k€)',
        description: 'Relèvement de l\'abattement sur les successions de 100k€ à 300k€',
        category: 'fiscalite',
        source: 'Programme LR 2022',
        calculateImpact: ({ patrimony }) => {
          // One-off impact, smoothed monthly over 30 years
          if (patrimony > 100000 && patrimony < 300000) return 5;
          return 0;
        },
      },
      {
        id: 'lr-charges',
        title: 'Baisse des charges patronales',
        description: 'Réduction des cotisations employeur pour les salaires < 2,5 SMIC',
        category: 'emploi',
        source: 'Programme LR, chiffrage OFCE',
        calculateImpact: ({ profession, monthlyIncome }) => {
          if (profession === 'self_employed') return 80;
          if (monthlyIncome < 3500 && profession !== 'retired' && profession !== 'student') return 15;
          return 0;
        },
      },
      {
        id: 'lr-sante',
        title: 'Franchise médicale renforcée',
        description: 'Augmentation de la franchise sur les consultations et médicaments',
        category: 'sante',
        source: 'Programme LR 2024',
        calculateImpact: () => -8,
      },
      {
        id: 'lr-securite',
        title: 'Peines plancher rétablies',
        description: 'Rétablissement des peines plancher et construction de places de prison',
        category: 'emploi',
        source: 'Programme LR 2022',
        calculateImpact: () => 0, // no directly measurable economic impact
      },
    ],
  },

  // ======================== PS ========================
  {
    partyId: 'ps',
    partyName: 'Parti Socialiste',
    country: 'FR',
    sourceUrl: 'https://parti-socialiste.fr/',
    measures: [
      {
        id: 'ps-sante',
        title: 'Remboursement intégral des soins courants',
        description: 'Prise en charge à 100% par la Sécu des consultations, optique et dentaire',
        category: 'sante',
        source: 'Programme PS 2022, chiffrage DREES',
        calculateImpact: ({ monthlyIncome }) => {
          if (monthlyIncome < 2000) return 45;
          if (monthlyIncome < 3500) return 30;
          return 15;
        },
      },
      {
        id: 'ps-logement',
        title: 'Construction de 150 000 logements sociaux/an',
        description: 'Plan massif de construction de HLM et encadrement des loyers',
        category: 'logement',
        source: 'Programme PS, estimation Fondation Abbé Pierre',
        calculateImpact: ({ location, monthlyIncome }) => {
          if (monthlyIncome < 2000 && location === 'metropolis') return 80;
          if (monthlyIncome < 2000) return 40;
          return 0;
        },
      },
      {
        id: 'ps-education',
        title: 'Revalorisation enseignants +20%',
        description: 'Augmentation de 20% du salaire des enseignants sur le quinquennat',
        category: 'emploi',
        source: 'Programme PS 2022',
        calculateImpact: ({ profession }) => {
          if (profession === 'civil_servant') return 30; // proxy for teachers
          return 0;
        },
      },
      {
        id: 'ps-ir',
        title: 'Hausse de l\'IR pour les 5% les plus riches',
        description: 'Nouvelle tranche à 50% au-dessus de 250k€/an',
        category: 'fiscalite',
        source: 'Programme PS, chiffrage IPP',
        calculateImpact: ({ monthlyIncome }) => {
          if (monthlyIncome > 8000) return -300;
          if (monthlyIncome < 2000) return 10; // indirect redistribution
          return 0;
        },
      },
      {
        id: 'ps-rsa',
        title: 'RSA jeunes dès 18 ans',
        description: 'Extension du RSA aux 18-25 ans sans condition',
        category: 'emploi',
        source: 'Programme PS 2022',
        calculateImpact: ({ profession }) => {
          if (profession === 'student') return 100;
          return 0;
        },
      },
    ],
  },

  // ======================== RECONQUÊTE ========================
  {
    partyId: 'reconquete',
    partyName: 'Reconquête',
    country: 'FR',
    sourceUrl: 'https://reconquete.fr/',
    measures: [
      {
        id: 'rec-flat-tax',
        title: 'Flat tax étendue à tous les revenus du capital',
        description: 'Taux unique de 30% sur tous les revenus du patrimoine',
        category: 'fiscalite',
        source: 'Programme Reconquête 2022',
        calculateImpact: ({ patrimony }) => {
          if (patrimony > 500000) return 100;
          if (patrimony > 100000) return 20;
          return 0;
        },
      },
      {
        id: 'rec-immigration',
        title: 'Immigration zéro (hors UE)',
        description: 'Arrêt total de l\'immigration extra-européenne, fin du regroupement familial',
        category: 'emploi',
        source: 'Programme Reconquête 2022',
        calculateImpact: () => 0, // uncertain and controversial economic impact
      },
      {
        id: 'rec-tva-energie',
        title: 'Suppression de la TVA sur l\'énergie',
        description: 'TVA à 0% sur le gaz et l\'électricité',
        category: 'ecologie',
        source: 'Programme Reconquête 2022',
        calculateImpact: ({ location }) => {
          if (location === 'rural') return 50;
          return 35;
        },
      },
      {
        id: 'rec-baisse-ir',
        title: 'Baisse de l\'IR de 20% pour les classes moyennes',
        description: 'Réduction ciblée de l\'IR pour les revenus entre 2 et 5 SMIC',
        category: 'fiscalite',
        source: 'Programme Reconquête 2022',
        calculateImpact: ({ monthlyIncome }) => {
          if (monthlyIncome >= 2800 && monthlyIncome <= 7000) return estimateIncomeTax(monthlyIncome) * 0.20;
          return 0;
        },
      },
      {
        id: 'rec-heritage',
        title: 'Suppression des droits de succession en ligne directe',
        description: 'Exonération totale des successions parents-enfants',
        category: 'fiscalite',
        source: 'Programme Reconquête 2022',
        calculateImpact: ({ patrimony }) => {
          if (patrimony > 200000) return 15; // smoothed over a lifetime
          return 0;
        },
      },
    ],
  },

  // ======================== UPR ========================
  {
    partyId: 'upr',
    partyName: 'Union Populaire Républicaine',
    country: 'FR',
    sourceUrl: 'https://www.upr.fr/',
    measures: [
      {
        id: 'upr-frexit',
        title: 'Sortie de l\'Union européenne (Frexit)',
        description: 'Application de l\'article 50 TUE pour quitter l\'UE',
        category: 'ecologie', // categorized as sovereignty but using available categories
        source: 'Programme UPR, art. 50 TUE',
        calculateImpact: () => 0, // impact too uncertain to model
      },
      {
        id: 'upr-otan',
        title: 'Sortie de l\'OTAN',
        description: 'Retrait complet du traité de l\'Atlantique Nord',
        category: 'emploi',
        source: 'Programme UPR',
        calculateImpact: () => 0,
      },
      {
        id: 'upr-monnaie',
        title: 'Retour au Franc',
        description: 'Sortie de la zone euro et rétablissement du Franc français',
        category: 'fiscalite',
        source: 'Programme UPR',
        calculateImpact: ({ monthlyIncome }) => {
          // Very controversial: devaluation would help exporters but raise import prices
          if (monthlyIncome < 2000) return -50; // inflation on imported goods
          return -30;
        },
      },
      {
        id: 'upr-souverainete',
        title: 'Nationalisation des autoroutes',
        description: 'Reprise en main publique des concessions autoroutières',
        category: 'transport',
        source: 'Programme UPR',
        calculateImpact: ({ location }) => {
          if (location === 'rural') return 30;
          if (location === 'small') return 20;
          return 5;
        },
      },
      {
        id: 'upr-dette',
        title: 'Restructuration de la dette publique',
        description: 'Audit et restructuration partielle de la dette via la Banque de France',
        category: 'fiscalite',
        source: 'Programme UPR',
        calculateImpact: () => 0, // macroeconomic, not modelable individually
      },
    ],
  },
];

// ==================== CALCULATOR ====================

export function calculatePolicyImpact(
  profile: ImpactProfile,
  partyId: string
): PolicyImpactResult | null {
  const party = partyPolicies.find(p => p.partyId === partyId);
  if (!party) return null;

  const measures = party.measures.map(m => ({
    title: m.title,
    description: m.description,
    category: m.category,
    impact: Math.round(m.calculateImpact(profile)),
    source: m.source,
  }));

  return {
    partyId: party.partyId,
    partyName: party.partyName,
    measures,
    totalImpact: measures.reduce((sum, m) => sum + m.impact, 0),
  };
}

export function calculateAllPartyImpacts(profile: ImpactProfile): PolicyImpactResult[] {
  return partyPolicies
    .filter(p => p.country === 'FR')
    .map(p => calculatePolicyImpact(profile, p.partyId)!)
    .filter(Boolean)
    .sort((a, b) => b.totalImpact - a.totalImpact);
}
