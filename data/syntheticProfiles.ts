import { ProfileIconName } from "@/lib/icons";
import { DimensionKey } from "@/types/positions";
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
    /**
     * The dominant currents this family expects, dimension by dimension. Several
     * currents on one dimension are alternatives: the family recognises itself
     * in any of them, and the alternatives cover the wings of one family, never
     * two unrelated families under one name.
     *
     * Since 2026-08-29 (night) every family describes all seven dimensions.
     * They used to constrain one to three and stay silent on the rest, read as
     * the dimension's average; measured on the party corpus, that silence left
     * a median of 4 families out of 14 that the answers could not separate,
     * and readers rightly asked what a "profile" that says nothing about five
     * dimensions was naming. The type stays Partial because the engine still
     * handles a partial description correctly; the data no longer uses that
     * freedom, and a test forbids it.
     */
    expects: Partial<Record<DimensionKey, string[]>>;
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
        expects: {
            power: [PowerArchetype.PartisanOrdre, PowerArchetype.CentralisateurJacobin],
            economy: [
                EconomyArchetype.CorporatisteProtectionniste,
                EconomyArchetype.DirigisteColbertiste
            ],
            geopolitics: [
                GeopoliticsArchetype.SouverainisteProtectionniste,
                GeopoliticsArchetype.GaullisteSouverainiste
            ],
            social: [
                SocialArchetype.AssimilationnisteRepublicain,
                SocialArchetype.ConservateurMoral
            ],
            environment: [
                EnvironmentArchetype.ProductivisteEconomique,
                EnvironmentArchetype.EcomodernisteTechnophile
            ],
            knowledge: [
                KnowledgeArchetype.BonSensExperientiel,
                KnowledgeArchetype.EmpiristePragmatique
            ],
            moral: [MoralArchetype.RealisteEtat, MoralArchetype.NationalRomantique]
        }
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
        expects: {
            power: [PowerArchetype.PopulisteReferendaire],
            economy: [
                EconomyArchetype.CorporatisteProtectionniste,
                EconomyArchetype.SocialDemocrateRedistributif,
                EconomyArchetype.KeynesienProductiviste
            ],
            geopolitics: [
                GeopoliticsArchetype.SouverainisteProtectionniste,
                GeopoliticsArchetype.GaullisteSouverainiste
            ],
            social: [
                SocialArchetype.EgalitaristeCompassionnel,
                SocialArchetype.AssimilationnisteRepublicain
            ],
            environment: [
                EnvironmentArchetype.TechnocrateVert,
                EnvironmentArchetype.ProductivisteEconomique
            ],
            knowledge: [
                KnowledgeArchetype.PopulisteAntiElite,
                KnowledgeArchetype.DefiantInstitutionnel,
                KnowledgeArchetype.BonSensExperientiel
            ],
            moral: [MoralArchetype.RevoltePrometheen, MoralArchetype.RealisteInterets]
        }
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
        expects: {
            power: [PowerArchetype.CentralisateurJacobin, PowerArchetype.EtatistePlanificateur],
            economy: [
                EconomyArchetype.DirigisteColbertiste,
                EconomyArchetype.KeynesienProductiviste
            ],
            geopolitics: [GeopoliticsArchetype.GaullisteSouverainiste],
            social: [
                SocialArchetype.AssimilationnisteRepublicain,
                SocialArchetype.MeritocrateExigeant
            ],
            environment: [
                EnvironmentArchetype.EcomodernisteTechnophile,
                EnvironmentArchetype.TechnocrateVert
            ],
            knowledge: [
                KnowledgeArchetype.TechnocrateExpertCentre,
                KnowledgeArchetype.EmpiristePragmatique
            ],
            moral: [MoralArchetype.RealisteEtat, MoralArchetype.DualisteStrategique]
        }
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
        expects: {
            power: [PowerArchetype.DecentralisateurGirondin, PowerArchetype.AnarchisteHorizontal],
            economy: [
                EconomyArchetype.EcologisteDecroissant,
                EconomyArchetype.CommunautaristeSolidaire,
                EconomyArchetype.Altermondialiste
            ],
            geopolitics: [
                GeopoliticsArchetype.MultilateralisteOnusien,
                GeopoliticsArchetype.NonInterventionnisteIsolationniste
            ],
            social: [
                SocialArchetype.MulticulturalisteTolerant,
                SocialArchetype.EgalitaristeCompassionnel
            ],
            environment: [
                EnvironmentArchetype.EcologisteRadical,
                EnvironmentArchetype.PostCroissanceLocaliste,
                EnvironmentArchetype.SpiritualisteEcologique
            ],
            knowledge: [
                KnowledgeArchetype.RationalisteScientiste,
                KnowledgeArchetype.CroyantMystique
            ],
            moral: [
                MoralArchetype.MoralisteUniversaliste,
                MoralArchetype.SpiritualisteTranscendant
            ]
        }
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
        expects: {
            power: [PowerArchetype.TechnocrateRationaliste, PowerArchetype.ElitisteEclaire],
            economy: [
                EconomyArchetype.CapitalisteNeoliberal,
                EconomyArchetype.TechnoprogressisteGreenGrowth
            ],
            geopolitics: [GeopoliticsArchetype.AtlantisteLiberal],
            social: [SocialArchetype.ProgressisteSocietal, SocialArchetype.MeritocrateExigeant],
            environment: [
                EnvironmentArchetype.EcomodernisteTechnophile,
                EnvironmentArchetype.TechnocrateVert
            ],
            knowledge: [
                KnowledgeArchetype.MeritocrateCognitif,
                KnowledgeArchetype.RationalisteScientiste,
                KnowledgeArchetype.TechnocrateExpertCentre
            ],
            moral: [MoralArchetype.MoralisteUniversaliste, MoralArchetype.RealisteEtat]
        }
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
        expects: {
            power: [PowerArchetype.TechnocrateRationaliste],
            economy: [
                EconomyArchetype.TechnoprogressisteGreenGrowth,
                EconomyArchetype.SocialDemocrateRedistributif
            ],
            geopolitics: [
                GeopoliticsArchetype.MultilateralisteOnusien,
                GeopoliticsArchetype.MondialisteCosmopolite
            ],
            social: [
                SocialArchetype.ProgressisteSocietal,
                SocialArchetype.MulticulturalisteTolerant
            ],
            environment: [
                EnvironmentArchetype.TechnocrateVert,
                EnvironmentArchetype.EcomodernisteTechnophile
            ],
            knowledge: [
                KnowledgeArchetype.TechnocrateExpertCentre,
                KnowledgeArchetype.RationalisteScientiste
            ],
            moral: [
                MoralArchetype.MoralisteUniversaliste,
                MoralArchetype.ComplexisteRelativiste
            ]
        }
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
        expects: {
            power: [PowerArchetype.LibertarienIndividualiste],
            economy: [
                EconomyArchetype.LibertarienMarchePur,
                EconomyArchetype.CapitalisteNeoliberal
            ],
            geopolitics: [GeopoliticsArchetype.NonInterventionnisteIsolationniste],
            social: [SocialArchetype.LibertaireHedoniste, SocialArchetype.ProgressisteSocietal],
            environment: [
                EnvironmentArchetype.EcomodernisteTechnophile,
                EnvironmentArchetype.TranshumanistePostHumain
            ],
            knowledge: [
                KnowledgeArchetype.SceptiqueCartesien,
                KnowledgeArchetype.EmpiristePragmatique
            ],
            moral: [
                MoralArchetype.RealisteInterets,
                MoralArchetype.PragmatiqueDesideologise
            ]
        }
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
        expects: {
            power: [
                PowerArchetype.TechnopragmatiqueGestionnaire,
                PowerArchetype.TechnocrateRationaliste
            ],
            economy: [EconomyArchetype.TechnoprogressisteGreenGrowth],
            geopolitics: [
                GeopoliticsArchetype.MondialisteCosmopolite,
                GeopoliticsArchetype.MultilateralisteOnusien
            ],
            social: [SocialArchetype.ProgressisteSocietal, SocialArchetype.FeministeUniversaliste],
            environment: [
                EnvironmentArchetype.EcomodernisteTechnophile,
                EnvironmentArchetype.TranshumanistePostHumain
            ],
            knowledge: [
                KnowledgeArchetype.RationalisteScientiste,
                KnowledgeArchetype.MeritocrateCognitif
            ],
            moral: [MoralArchetype.MoralisteUniversaliste, MoralArchetype.RevoltePrometheen]
        }
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
        expects: {
            power: [PowerArchetype.PartisanOrdre, PowerArchetype.DecentralisateurGirondin],
            economy: [
                EconomyArchetype.CommunautaristeSolidaire,
                EconomyArchetype.CorporatisteProtectionniste
            ],
            geopolitics: [
                GeopoliticsArchetype.CivilisationnisteCulturaliste,
                GeopoliticsArchetype.SouverainisteProtectionniste
            ],
            social: [SocialArchetype.ConservateurMoral, SocialArchetype.NationalIdentitaire],
            environment: [
                EnvironmentArchetype.BioConservateur,
                EnvironmentArchetype.SpiritualisteEcologique
            ],
            knowledge: [KnowledgeArchetype.BonSensExperientiel, KnowledgeArchetype.CroyantMystique],
            moral: [MoralArchetype.NationalRomantique, MoralArchetype.IntransigeantMoral]
        }
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
        expects: {
            power: [
                PowerArchetype.TechnopragmatiqueGestionnaire,
                PowerArchetype.ElitisteEclaire
            ],
            economy: [
                EconomyArchetype.CapitalisteNeoliberal,
                EconomyArchetype.RigoristeBudgetaire
            ],
            geopolitics: [
                GeopoliticsArchetype.SouverainisteProtectionniste,
                GeopoliticsArchetype.GaullisteSouverainiste,
                GeopoliticsArchetype.AtlantisteLiberal
            ],
            social: [SocialArchetype.MeritocrateExigeant],
            environment: [
                EnvironmentArchetype.ProductivisteEconomique,
                EnvironmentArchetype.EcomodernisteTechnophile
            ],
            knowledge: [
                KnowledgeArchetype.EmpiristePragmatique,
                KnowledgeArchetype.TechnocrateExpertCentre
            ],
            moral: [
                MoralArchetype.PragmatiqueDesideologise,
                MoralArchetype.RealisteEtat,
                MoralArchetype.RealisteInterets
            ]
        }
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
        expects: {
            power: [PowerArchetype.RepublicainHumaniste, PowerArchetype.DemocratePluraliste],
            economy: [
                EconomyArchetype.SocialDemocrateRedistributif,
                EconomyArchetype.CommunautaristeSolidaire
            ],
            geopolitics: [
                GeopoliticsArchetype.MultilateralisteOnusien,
                GeopoliticsArchetype.InternationalisteTiersMondiste
            ],
            social: [
                SocialArchetype.EgalitaristeCompassionnel,
                SocialArchetype.MulticulturalisteTolerant
            ],
            environment: [
                EnvironmentArchetype.TechnocrateVert,
                EnvironmentArchetype.EcologisteRadical
            ],
            knowledge: [
                KnowledgeArchetype.EmpiristePragmatique,
                KnowledgeArchetype.CroyantMystique
            ],
            moral: [
                MoralArchetype.CompassionnelHumanitaire,
                MoralArchetype.MoralisteUniversaliste
            ]
        }
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
        expects: {
            power: [PowerArchetype.AnarchisteHorizontal, PowerArchetype.EtatistePlanificateur],
            economy: [
                EconomyArchetype.Altermondialiste,
                EconomyArchetype.SocialDemocrateRedistributif
            ],
            geopolitics: [
                GeopoliticsArchetype.DecolonialPostOccidental,
                GeopoliticsArchetype.InternationalisteTiersMondiste
            ],
            social: [SocialArchetype.IntersectionnelMilitant],
            environment: [
                EnvironmentArchetype.EcologisteRadical,
                EnvironmentArchetype.PostCroissanceLocaliste
            ],
            knowledge: [
                KnowledgeArchetype.RelativisteCulturel,
                KnowledgeArchetype.DefiantInstitutionnel
            ],
            moral: [MoralArchetype.RevoltePrometheen, MoralArchetype.IntransigeantMoral]
        }
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
        expects: {
            power: [PowerArchetype.DecentralisateurGirondin, PowerArchetype.PartisanOrdre],
            economy: [
                EconomyArchetype.CommunautaristeSolidaire,
                EconomyArchetype.SocialDemocrateRedistributif
            ],
            geopolitics: [
                GeopoliticsArchetype.CivilisationnisteCulturaliste,
                GeopoliticsArchetype.NonInterventionnisteIsolationniste
            ],
            social: [
                SocialArchetype.TraditionnalisteReligieux,
                SocialArchetype.ConservateurMoral
            ],
            environment: [
                EnvironmentArchetype.BioConservateur,
                EnvironmentArchetype.SpiritualisteEcologique
            ],
            knowledge: [KnowledgeArchetype.CroyantMystique],
            moral: [MoralArchetype.SpiritualisteTranscendant, MoralArchetype.IntransigeantMoral]
        }
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
        expects: {
            power: [PowerArchetype.DemocratePluraliste, PowerArchetype.RepublicainHumaniste],
            economy: [
                EconomyArchetype.SocialDemocrateRedistributif,
                EconomyArchetype.CapitalisteNeoliberal
            ],
            geopolitics: [
                GeopoliticsArchetype.MultilateralisteOnusien,
                GeopoliticsArchetype.AtlantisteLiberal
            ],
            social: [
                SocialArchetype.UniversalisteCritique,
                SocialArchetype.ProgressisteSocietal
            ],
            environment: [EnvironmentArchetype.TechnocrateVert],
            knowledge: [
                KnowledgeArchetype.TechnocrateExpertCentre,
                KnowledgeArchetype.SceptiqueCartesien
            ],
            moral: [MoralArchetype.ComplexisteRelativiste, MoralArchetype.DualisteStrategique]
        }
    }
];
