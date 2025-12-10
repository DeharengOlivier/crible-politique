import { Statement } from "@/types/positions";

// 28 statements (4 per dimension), worded according to three auditable rules:
// 1. A single proposition per statement (no double-barreled question).
// 2. Neutral vocabulary: the statement must be readable without discomfort by
//    a supporter as well as an opponent ("ideological Turing test").
// 3. Balanced polarities: being "in agreement" does not systematically
//    correspond to the same political side from one statement to the next.
// Any change to this list must be logged, dated and justified
// in CHANGELOG-DONNEES.md (public change log).

export const STATEMENTS: Statement[] = [
    // --- I. RELATION TO POWER ---
    {
        id: "pw1",
        express: true,
        dimension: "power",
        text: "L'État devrait jouer un rôle de planification dans les grandes orientations économiques et industrielles.",
        agreeLabel: "État stratège et planificateur",
        disagreeLabel: "Initiative laissée au marché et aux acteurs privés",
    },
    {
        id: "pw2",
        dimension: "power",
        text: "Les citoyens devraient pouvoir proposer ou abroger des lois par référendum d'initiative citoyenne.",
        agreeLabel: "Démocratie directe renforcée",
        disagreeLabel: "Primauté de la démocratie représentative",
    },
    {
        id: "pw3",
        dimension: "power",
        text: "Les régions et les communes devraient exercer davantage de compétences aujourd'hui détenues par l'État central.",
        agreeLabel: "Décentralisation",
        disagreeLabel: "Pouvoir central fort",
    },
    {
        id: "pw4",
        express: true,
        dimension: "power",
        text: "Pour garantir la sécurité, il est acceptable d'étendre les pouvoirs de surveillance des autorités.",
        agreeLabel: "Priorité à la sécurité",
        disagreeLabel: "Priorité aux libertés individuelles",
    },

    // --- II. ECONOMY ---
    {
        id: "ec1",
        express: true,
        dimension: "economy",
        text: "Il faut augmenter la contribution fiscale des plus hauts revenus et patrimoines pour financer la redistribution.",
        agreeLabel: "Redistribution accrue",
        disagreeLabel: "Modération fiscale",
    },
    {
        id: "ec2",
        dimension: "economy",
        text: "Les services essentiels (énergie, transports, santé) devraient être principalement gérés par la puissance publique.",
        agreeLabel: "Gestion publique des services essentiels",
        disagreeLabel: "Ouverture au secteur privé et à la concurrence",
    },
    {
        id: "ec3",
        express: true,
        dimension: "economy",
        text: "Il faut protéger les industries nationales par des barrières commerciales, même si cela renchérit certains produits.",
        agreeLabel: "Protectionnisme",
        disagreeLabel: "Libre-échange",
    },
    {
        id: "ec4",
        dimension: "economy",
        text: "La réduction de la dette publique devrait être une priorité, même au prix de baisses de dépenses.",
        agreeLabel: "Priorité à l'équilibre budgétaire",
        disagreeLabel: "Priorité à l'investissement public",
    },

    // --- III. GEOPOLITICS ---
    {
        id: "ge1",
        express: true,
        dimension: "geopolitics",
        text: "Mon pays devrait reprendre à l'Union européenne une partie des compétences qui lui ont été transférées.",
        agreeLabel: "Plus de souveraineté nationale",
        disagreeLabel: "Plus d'intégration européenne",
    },
    {
        id: "ge2",
        dimension: "geopolitics",
        text: "L'appartenance à l'OTAN sert les intérêts de mon pays.",
        agreeLabel: "Ancrage atlantique",
        disagreeLabel: "Distance vis-à-vis de l'OTAN",
    },
    {
        id: "ge3",
        express: true,
        dimension: "geopolitics",
        text: "L'immigration est globalement une chance pour le pays.",
        agreeLabel: "Vision positive de l'immigration",
        disagreeLabel: "Volonté de réduire l'immigration",
    },
    {
        id: "ge4",
        dimension: "geopolitics",
        text: "Le pays doit pouvoir intervenir militairement à l'étranger pour protéger des populations ou ses intérêts.",
        agreeLabel: "Interventionnisme assumé",
        disagreeLabel: "Non-intervention",
    },

    // --- IV. SOCIETY ---
    {
        id: "so1",
        express: true,
        dimension: "social",
        text: "L'extension des droits individuels en matière sociétale (fin de vie assistée, procréation, identité de genre) va dans le bon sens.",
        agreeLabel: "Libéralisme sociétal",
        disagreeLabel: "Prudence ou refus des évolutions sociétales",
    },
    {
        id: "so2",
        dimension: "social",
        text: "Des politiques actives de correction des inégalités entre groupes (quotas, discrimination positive) sont nécessaires.",
        agreeLabel: "Correction active des inégalités de groupes",
        disagreeLabel: "Égalité de traitement strictement individuelle",
    },
    {
        id: "so3",
        express: true,
        dimension: "social",
        text: "Une intégration réussie suppose que les nouveaux arrivants adoptent la culture du pays d'accueil.",
        agreeLabel: "Modèle assimilationniste",
        disagreeLabel: "Modèle multiculturel",
    },
    {
        id: "so4",
        dimension: "social",
        text: "La consommation de cannabis devrait être légalisée et encadrée.",
        agreeLabel: "Légalisation encadrée",
        disagreeLabel: "Maintien de l'interdiction",
    },

    // --- V. ENVIRONMENT ---
    {
        id: "en1",
        express: true,
        dimension: "environment",
        text: "L'énergie nucléaire doit faire partie de la réponse au défi climatique.",
        agreeLabel: "Nucléaire dans le mix énergétique",
        disagreeLabel: "Sortie ou refus du nucléaire",
    },
    {
        id: "en2",
        express: true,
        dimension: "environment",
        text: "Il faut accepter des contraintes sur certains modes de consommation (avion, viande, voiture) pour réduire les émissions.",
        agreeLabel: "Sobriété, y compris contrainte",
        disagreeLabel: "Refus des restrictions de consommation",
    },
    {
        id: "en3",
        dimension: "environment",
        text: "L'innovation technologique permettra de répondre à l'essentiel du défi climatique sans réduire la croissance.",
        agreeLabel: "Confiance dans la technologie",
        disagreeLabel: "Nécessité de changer de modèle économique",
    },
    {
        id: "en4",
        dimension: "environment",
        text: "La protection de l'environnement doit primer, même quand elle ralentit des projets économiques.",
        agreeLabel: "Priorité environnementale",
        disagreeLabel: "Priorité au développement économique",
    },

    // --- VI. RELATION TO KNOWLEDGE ---
    {
        id: "kn1",
        dimension: "knowledge",
        text: "Le consensus scientifique devrait peser davantage que l'opinion publique dans les décisions qui relèvent de questions techniques.",
        agreeLabel: "Primauté de l'expertise scientifique",
        disagreeLabel: "Primauté du choix démocratique",
    },
    {
        id: "kn2",
        express: true,
        dimension: "knowledge",
        text: "Les grands médias d'information couvrent l'actualité de façon globalement fiable.",
        agreeLabel: "Confiance dans les médias établis",
        disagreeLabel: "Défiance envers les médias établis",
    },
    {
        id: "kn3",
        dimension: "knowledge",
        text: "L'expérience de terrain des citoyens devrait peser autant que l'expertise académique dans les décisions publiques.",
        agreeLabel: "Valorisation du savoir d'expérience",
        disagreeLabel: "Valorisation du savoir académique",
    },
    {
        id: "kn4",
        dimension: "knowledge",
        text: "La liberté d'expression doit être très largement protégée, y compris pour des propos qui choquent.",
        agreeLabel: "Liberté d'expression extensive",
        disagreeLabel: "Encadrement des propos nuisibles",
    },

    // --- VII. POLITICAL MORALITY ---
    {
        id: "mo1",
        dimension: "moral",
        text: "En politique, il vaut mieux accepter des compromis que défendre des positions sans concession.",
        agreeLabel: "Culture du compromis",
        disagreeLabel: "Fidélité aux convictions",
    },
    {
        id: "mo2",
        dimension: "moral",
        text: "L'efficacité d'une politique compte davantage que sa conformité à des principes moraux.",
        agreeLabel: "Primauté des résultats",
        disagreeLabel: "Primauté des principes",
    },
    {
        id: "mo3",
        express: true,
        dimension: "moral",
        text: "La protection des plus vulnérables devrait être le premier critère de l'action publique.",
        agreeLabel: "Priorité aux plus fragiles",
        disagreeLabel: "Autres priorités (mérite, liberté, intérêt général)",
    },
    {
        id: "mo4",
        dimension: "moral",
        text: "La fidélité à l'histoire et à l'identité du pays doit guider les choix politiques.",
        agreeLabel: "Ancrage dans l'identité et l'histoire",
        disagreeLabel: "Choix guidés par d'autres références",
    },
];

export const STATEMENTS_BY_ID: Record<string, Statement> = Object.fromEntries(
    STATEMENTS.map((s) => [s.id, s])
);

export const STATEMENTS_BY_DIMENSION = STATEMENTS.reduce<Record<string, Statement[]>>(
    (acc, s) => {
        (acc[s.dimension] ||= []).push(s);
        return acc;
    },
    {}
);

// The 12 statements of the express test: coverage of the 7 dimensions in ~3 minutes.
export const EXPRESS_STATEMENTS = STATEMENTS.filter((s) => s.express);
