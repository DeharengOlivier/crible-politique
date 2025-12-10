import { ProfileIconName } from "@/lib/icons";
import { ArchetypeLabelMap } from "@/types/positions";
import {
    PowerArchetype,
    EconomyArchetype,
    GeopoliticsArchetype,
    SocialArchetype,
    EnvironmentArchetype,
    KnowledgeArchetype,
    MoralArchetype
} from "@/types/archetypes";

// Synthetic profiles: the identity-based, shareable layer of the result.
// Writing rules: each profile is described with the same benevolence,
// has a strength AND a point of caution, and its title must be something
// the described person can claim with pride.

export interface SyntheticProfile {
    id: string;
    title: string;
    tagline: string;
    icon: ProfileIconName;
    // Accent color (visual variety of the gallery, not a taxonomy).
    accent: string;
    description: string;
    strategy: string;
    weakness: string;
    // Evaluates the profile from the dominant archetype labels per dimension.
    matches: (profile: ArchetypeLabelMap) => boolean;
}

export const SYNTHETIC_PROFILES: SyntheticProfile[] = [
    {
        id: "souverainiste_republicain_securitaire",
        title: "Souverainiste républicain d'ordre",
        tagline: "La Nation protectrice, l'ordre et la souveraineté.",
        icon: "shield",
        accent: "#B45309",
        description: "Vous défendez un État national fort, protecteur de ses citoyens et maître de ses choix. L'ordre public et la souveraineté sont pour vous les conditions de toutes les autres libertés.",
        strategy: "Maîtrise des frontières, autorité régalienne assumée, indépendance vis-à-vis des organisations supranationales.",
        weakness: "Le défi: protéger sans se fermer aux coopérations utiles.",
        matches: (p) =>
            (p.geopolitics === GeopoliticsArchetype.SouverainisteProtectionniste ||
                p.geopolitics === GeopoliticsArchetype.GaullisteSouverainiste) &&
            p.power === PowerArchetype.PartisanOrdre
    },
    {
        id: "populiste_social_souverainiste",
        title: "Populiste social souverainiste",
        tagline: "Le peuple d'abord, contre les puissants.",
        icon: "megaphone",
        accent: "#C2410C",
        description: "Vous portez la voix des oubliés face aux élites mondialisées. Vous voulez rendre le pouvoir au peuple par la démocratie directe, protéger l'économie nationale et redistribuer les richesses.",
        strategy: "Référendums d'initiative citoyenne, protection de l'économie nationale, redistribution.",
        weakness: "Le défi: transformer la colère en politiques durables et finançables.",
        matches: (p) =>
            p.power === PowerArchetype.PopulisteReferendaire &&
            (p.economy === EconomyArchetype.CorporatisteProtectionniste ||
                p.economy === EconomyArchetype.SocialDemocrateRedistributif ||
                p.economy === EconomyArchetype.KeynesienProductiviste)
    },
    {
        id: "gaulliste_social_pragmatique",
        title: "Gaulliste social-étatiste",
        tagline: "L'État stratège au service de l'indépendance et du progrès social.",
        icon: "landmark",
        accent: "#1E3A8A",
        description: "Pour vous, la puissance publique doit guider l'économie et protéger les citoyens, sans dogme. Vous cherchez l'efficacité, l'indépendance nationale et la cohésion sociale avant tout.",
        strategy: "Planification industrielle, participation des salariés, politique étrangère indépendante.",
        weakness: "Le défi: éviter la lourdeur bureaucratique et le centralisme excessif.",
        matches: (p) =>
            p.power === PowerArchetype.CentralisateurJacobin ||
            p.power === PowerArchetype.EtatistePlanificateur
    },
    {
        id: "ecologiste_spirituel_post_croissance",
        title: "Écologiste de la sobriété",
        tagline: "Retrouver l'harmonie avec le vivant.",
        icon: "leaf",
        accent: "#047857",
        description: "Pour vous, la crise écologique appelle un changement de modèle, pas seulement des ajustements techniques. Vous prônez la sobriété, le local et un rapport renouvelé au vivant.",
        strategy: "Décroissance choisie, relocalisation, agriculture durable, sobriété énergétique.",
        weakness: "Le défi: convaincre au-delà des convaincus, sans paraître punitif.",
        matches: (p) =>
            p.environment === EnvironmentArchetype.EcologisteRadical ||
            p.environment === EnvironmentArchetype.PostCroissanceLocaliste ||
            p.environment === EnvironmentArchetype.SpiritualisteEcologique
    },
    {
        id: "rationaliste_atlantiste",
        title: "Rationaliste libéral atlantiste",
        tagline: "La raison, l'ouverture et l'ordre libéral international.",
        icon: "columns",
        accent: "#0369A1",
        description: "Vous défendez l'ordre libéral occidental, la rationalité scientifique et les institutions face aux passions politiques. Vous croyez aux compétences et à la coopération entre démocraties.",
        strategy: "Alliances entre démocraties, gouvernance par les compétences, lutte contre la désinformation.",
        weakness: "Le défi: rester audible des citoyens qui se sentent déclassés.",
        matches: (p) =>
            (p.knowledge === KnowledgeArchetype.MeritocrateCognitif ||
                p.knowledge === KnowledgeArchetype.RationalisteScientiste ||
                p.knowledge === KnowledgeArchetype.TechnocrateExpertCentre) &&
            p.geopolitics === GeopoliticsArchetype.AtlantisteLiberal
    },
    {
        id: "technocrate_mondialiste",
        title: "Multilatéraliste de la raison",
        tagline: "Les grands défis se règlent ensemble, avec méthode.",
        icon: "globe",
        accent: "#0E7490",
        description: "Vous croyez qu'une gouvernance fondée sur l'expertise et la coopération internationale est la seule à la hauteur des défis globaux: climat, pandémies, régulation du numérique.",
        strategy: "Institutions internationales renforcées, régulations globales, diplomatie des valeurs.",
        weakness: "Le défi: ne pas perdre le lien avec les attachements locaux et nationaux.",
        matches: (p) =>
            p.power === PowerArchetype.TechnocrateRationaliste &&
            (p.geopolitics === GeopoliticsArchetype.MultilateralisteOnusien ||
                p.geopolitics === GeopoliticsArchetype.MondialisteCosmopolite)
    },
    {
        id: "libertarien_individualiste",
        title: "Libertarien de la vie libre",
        tagline: "Vivre libre, entreprendre, choisir.",
        icon: "wind",
        accent: "#0891B2",
        description: "Votre liberté individuelle est la valeur cardinale. Vous vous méfiez des contraintes, qu'elles viennent de l'État, des normes sociales ou des injonctions collectives.",
        strategy: "Baisse des impôts, dérégulation, liberté de mode de vie, responsabilité individuelle.",
        weakness: "Le défi: répondre aux problèmes qui exigent de la coordination collective.",
        matches: (p) =>
            p.power === PowerArchetype.LibertarienIndividualiste ||
            (p.economy === EconomyArchetype.LibertarienMarchePur)
    },
    {
        id: "progressiste_technophile",
        title: "Progressiste technophile",
        tagline: "Le progrès technique et social vont de pair.",
        icon: "rocket",
        accent: "#6D28D9",
        description: "Vous êtes optimiste: la science et l'extension des droits construisent ensemble une société plus ouverte et plus prospère. L'innovation est votre levier préféré, y compris pour le climat.",
        strategy: "Investissements dans l'innovation, droits individuels étendus, intégration européenne.",
        weakness: "Le défi: ne pas sous-estimer les résistances culturelles et les coûts de transition.",
        matches: (p) =>
            p.social === SocialArchetype.ProgressisteSocietal &&
            (p.environment === EnvironmentArchetype.EcomodernisteTechnophile ||
                p.environment === EnvironmentArchetype.TranshumanistePostHumain)
    },
    {
        id: "conservateur_national_romantique",
        title: "Conservateur enraciné",
        tagline: "Transmettre ce qui nous a été transmis.",
        icon: "castle",
        accent: "#92400E",
        description: "Vous défendez l'âme du pays: son histoire, ses paysages, ses mœurs et sa continuité. Face à l'uniformisation, vous valorisez l'enracinement et la transmission.",
        strategy: "Protection du patrimoine, politique familiale, continuité historique et culturelle.",
        weakness: "Le défi: faire une place aux évolutions sans trahir l'héritage.",
        matches: (p) =>
            p.moral === MoralArchetype.NationalRomantique ||
            (p.social === SocialArchetype.ConservateurMoral &&
                p.moral === MoralArchetype.IntransigeantMoral)
    },
    {
        id: "neorealiste_strategique",
        title: "Néoréaliste stratège",
        tagline: "Les résultats d'abord, les postures ensuite.",
        icon: "strategy",
        accent: "#334155",
        description: "Pour vous, la politique est un art de l'efficacité et des rapports de force assumés. Vous jugez les politiques à leurs effets, pas à leurs intentions.",
        strategy: "Realpolitik, pragmatisme économique, alliances d'intérêt, évaluation par les résultats.",
        weakness: "Le défi: nourrir aussi un idéal capable de mobiliser.",
        matches: (p) =>
            (p.moral === MoralArchetype.PragmatiqueDesideologise ||
                p.moral === MoralArchetype.RealisteEtat) &&
            (p.geopolitics === GeopoliticsArchetype.SouverainisteProtectionniste ||
                p.geopolitics === GeopoliticsArchetype.GaullisteSouverainiste ||
                p.geopolitics === GeopoliticsArchetype.AtlantisteLiberal)
    },
    {
        id: "humaniste_compassionnel",
        title: "Humaniste solidaire",
        tagline: "Prendre soin de chaque personne.",
        icon: "handshake",
        accent: "#BE185D",
        description: "Votre boussole est la dignité humaine, en particulier celle des plus fragiles. La solidarité ne s'arrête pas pour vous aux frontières ni aux appartenances.",
        strategy: "Justice sociale, accueil digne, diplomatie de la paix, protection des vulnérables.",
        weakness: "Le défi: concilier générosité et soutenabilité des politiques.",
        matches: (p) =>
            p.moral === MoralArchetype.CompassionnelHumanitaire ||
            p.social === SocialArchetype.EgalitaristeCompassionnel
    },
    {
        id: "egalitariste_intersectionnel",
        title: "Égalitariste des luttes croisées",
        tagline: "L'égalité réelle, pour tous les groupes.",
        icon: "solidarity",
        accent: "#A21CAF",
        description: "Vous analysez la société à travers ses inégalités structurelles, qui se cumulent et se croisent. Votre objectif est l'égalité réelle, au besoin par des politiques correctrices actives.",
        strategy: "Politiques antidiscriminatoires actives, représentation des minorités, justice sociale.",
        weakness: "Le défi: construire du commun au-delà des appartenances de groupes.",
        matches: (p) =>
            p.social === SocialArchetype.IntersectionnelMilitant ||
            p.geopolitics === GeopoliticsArchetype.DecolonialPostOccidental
    },
    {
        id: "traditionaliste_religieux",
        title: "Traditionaliste spirituel",
        tagline: "La foi et la tradition comme boussole.",
        icon: "tradition",
        accent: "#854D0E",
        description: "Pour vous, la politique ne peut se couper du sacré et de la transmission. Vous défendez un héritage spirituel et moral face au matérialisme et au relativisme.",
        strategy: "Valeurs familiales, bioéthique prudente, place reconnue aux communautés de foi.",
        weakness: "Le défi: vivre sa fidélité dans une société pluraliste et laïque.",
        matches: (p) =>
            (p.social === SocialArchetype.ConservateurMoral ||
                p.social === SocialArchetype.TraditionnalisteReligieux) &&
            (p.knowledge === KnowledgeArchetype.CroyantMystique ||
                p.moral === MoralArchetype.SpiritualisteTranscendant)
    },
    {
        id: "democrate_pluraliste_compromis",
        title: "Démocrate du compromis",
        tagline: "La démocratie est un art de la nuance.",
        icon: "balance",
        accent: "#0F766E",
        description: "Vous vous méfiez des solutions simples et des camps tranchés. Pour vous, la qualité du débat, le pluralisme et le compromis sont la force des sociétés démocratiques.",
        strategy: "Coalitions, concertation, réformes graduées, protection des contre-pouvoirs.",
        weakness: "Le défi: garder un cap clair au milieu des nuances.",
        matches: (p) =>
            p.power === PowerArchetype.DemocratePluraliste ||
            p.moral === MoralArchetype.ComplexisteRelativiste
    }
];
