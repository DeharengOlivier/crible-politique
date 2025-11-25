// Socio-economic and scientific types kept after the "Le Crible Politique"
// merge. The tool's political model (statements, positions, archetypes) lives
// in types/positions.ts and types/archetypes.ts; this file now only holds what
// the impact simulator (INSEE), the moral foundations (Haidt) and the MFT
// question module need.

// ==================== SOCIO-ECONOMIC PROFILE (INSEE) ====================

export type LocationType = 'metropolis' | 'medium' | 'small' | 'rural';
export type EducationType = 'none' | 'cap' | 'bac' | 'bac23' | 'bac5' | 'bac8';
export type ProfessionType =
    | 'student'
    | 'employee'
    | 'worker'
    | 'manager'
    | 'senior_manager'
    | 'self_employed'
    | 'civil_servant'
    | 'unemployed'
    | 'retired';

export type SocialClass = 'working_class' | 'middle_class' | 'upper_class';
export type SocialTrajectory = 'ascending' | 'stable' | 'descending' | 'class_migrant';

// ==================== MORAL FOUNDATIONS (Haidt MFT) ====================

export interface MoralFoundations {
    care: number; // Care/Harm: protect the vulnerable
    fairness: number; // Fairness/Cheating: justice, proportionality
    loyalty: number; // Loyalty/Betrayal: in-group solidarity
    authority: number; // Authority/Subversion: respect for hierarchy
    sanctity: number; // Sanctity/Degradation: sacred values
    liberty: number; // Liberty/Oppression: resistance to domination
}

// Moral foundation labels (short / full / description). Single source consumed
// by the computation (interpretation) and by the radar. Values stay in French:
// they are user-facing product copy.
export const MORAL_FOUNDATION_LABELS: Record<
    keyof MoralFoundations,
    { short: string; full: string; desc: string }
> = {
    care: { short: 'Soin', full: 'Soin/Protection', desc: 'Protéger les vulnérables, empathie' },
    fairness: { short: 'Équité', full: 'Équité/Justice', desc: 'Traitement juste, proportionnalité' },
    loyalty: { short: 'Loyauté', full: 'Loyauté/Appartenance', desc: 'Solidarité de groupe, patriotisme' },
    authority: { short: 'Autorité', full: 'Autorité/Tradition', desc: 'Respect de la hiérarchie, stabilité' },
    sanctity: { short: 'Sacralité', full: 'Sacralité/Dignité', desc: 'Valeurs sacrées, limites morales' },
    liberty: { short: 'Liberté', full: 'Liberté/Autonomie', desc: 'Résistance à la domination, choix individuel' }
};

// ==================== QUESTIONNAIRE (moral foundations module) ====================

export interface QuestionCategory {
    id: string;
    name: string;
    questions: Question[];
}

export interface Question {
    id: string;
    category: string;
    text: string;
    weight: number;
    express?: boolean;
    impactDimensions: {
        economic?: number;
        social?: number;
        sovereignty?: number;
        international?: number;
    };
}
