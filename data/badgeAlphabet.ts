import { DimensionKey } from "@/types/positions";

// Frozen character assignment for badge codes.
//
// A shared profile URL carries a badge code in its path, and a path is
// transmitted: it reaches the access log, the CDN and every link-preview
// crawler. A badge code therefore says only what the shared page displays, the
// dominant current of thought per dimension, and cannot be turned back into
// the answers it came from. One character per dimension, and the character is
// the archetype's index in the list below.
//
// APPEND ONLY. A character, once assigned, belongs to that archetype for good.
// Reordering or removing an entry silently changes what every badge link
// already sent means: a link a friend received last month would show a
// stranger's profile. New archetypes go at the end of their dimension's list.
// __tests__/badgeCode.test.ts fails when an archetype is missing from here.
export const BADGE_ALPHABET: Record<DimensionKey, readonly string[]> = {
    power: [
        "Étatiste planificateur",
        "Technocrate rationaliste",
        "Libertarien individualiste",
        "Centralisateur jacobin",
        "Décentralisateur girondin",
        "Populiste référendaire",
        "Républicain humaniste",
        "Élitiste éclairé",
        "Partisan de l'ordre",
        "Démocrate pluraliste",
        "Anarchiste horizontal",
        "Technopragmatique gestionnaire",
    ],
    economy: [
        "Libéral de marché",
        "Social-démocrate redistributif",
        "Protectionniste industriel",
        "Keynésien productiviste",
        "Dirigiste colbertiste",
        "Altermondialiste",
        "Libertarien du marché pur",
        "Écologiste décroissant",
        "Technoprogressiste croissance verte",
        "Solidariste local",
        "Philanthro-capitaliste",
        "Rigoriste budgétaire",
    ],
    geopolitics: [
        "Gaulliste souverainiste",
        "Atlantiste libéral",
        "Eurasiatiste continental",
        "Non-interventionniste",
        "Interventionniste néoconservateur",
        "Multilatéraliste onusien",
        "Internationaliste tiers-mondiste",
        "Décolonial post-occidental",
        "Civilisationniste culturaliste",
        "Cosmopolite ouvert",
        "Souverainiste protectionniste",
    ],
    social: [
        "Conservateur moral",
        "Progressiste sociétal",
        "Traditionaliste religieux",
        "Libertaire hédoniste",
        "National-identitaire",
        "Multiculturaliste",
        "Assimilationniste républicain",
        "Féministe universaliste",
        "Intersectionnel militant",
        "Égalitariste solidaire",
        "Méritocrate exigeant",
        "Universaliste critique",
    ],
    environment: [
        "Écologiste de rupture",
        "Écomoderniste technophile",
        "Productiviste priorité économie",
        "Post-croissance localiste",
        "Régulateur vert",
        "Bio-conservateur",
        "Transhumaniste",
        "Spiritualiste écologique",
    ],
    knowledge: [
        "Rationaliste scientifique",
        "Partisan de l'expertise",
        "Empiriste pragmatique",
        "Relativiste culturel",
        "Sceptique cartésien",
        "Croyant spirituel",
        "Défiant institutionnel",
        "Praticien du bon sens",
        "Méritocrate cognitif",
        "Populiste anti-élites",
    ],
    moral: [
        "Moraliste universaliste",
        "Pragmatique désidéologisé",
        "Réaliste d'État",
        "Réaliste des intérêts",
        "Compassionnel humanitaire",
        "National-romantique",
        "Civilisationniste missionnaire",
        "Fataliste historiciste",
        "Révolté prométhéen",
        "Spiritualiste transcendant",
        "Intransigeant moral",
        "Dualiste stratégique",
        "Complexiste nuancé",
        "Désabusé",
    ],
};
