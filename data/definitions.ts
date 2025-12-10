import {
    PowerArchetype,
    EconomyArchetype,
    GeopoliticsArchetype,
    SocialArchetype,
    EnvironmentArchetype,
    KnowledgeArchetype,
    MoralArchetype
} from "@/types/archetypes";

export const DIMENSIONS = {
    power: {
        title: "Rapport au Pouvoir",
        description: "Cette dimension explore la conception de l'autorité, de la démocratie et du rôle de l'État.",
        color: "bg-blue-500"
    },
    economy: {
        title: "Économie",
        description: "Comment produire et répartir les richesses ? Quel rôle pour le marché et l'État ?",
        color: "bg-red-500"
    },
    geopolitics: {
        title: "Géopolitique",
        description: "La place de la nation dans le monde, les alliances et la souveraineté.",
        color: "bg-indigo-500"
    },
    social: {
        title: "Société",
        description: "Les valeurs sociétales, la famille, l'identité et le vivre-ensemble.",
        color: "bg-pink-500"
    },
    environment: {
        title: "Environnement",
        description: "Le rapport à la nature, à la technologie et à l'urgence climatique.",
        color: "bg-green-500"
    },
    knowledge: {
        title: "Rapport à la Connaissance",
        description: "La place accordée à la science, aux médias, aux experts et au savoir d'expérience.",
        color: "bg-purple-500"
    },
    moral: {
        title: "Morale politique",
        description: "Les fondements éthiques de l'action politique : principes, résultats, compromis.",
        color: "bg-yellow-500"
    }
};

// Writing rule (audited): each description is written in the voice of a
// sincere supporter of the current it describes. It must be reviewable and
// endorsable by someone who identifies with that current.
export const DEFINITIONS = {
    power: {
        [PowerArchetype.EtatistePlanificateur]: "L'État doit fixer le cap de l'économie et des grands projets pour servir l'intérêt général.",
        [PowerArchetype.TechnocrateRationaliste]: "Les décisions publiques gagnent à s'appuyer d'abord sur l'expertise et les données.",
        [PowerArchetype.LibertarienIndividualiste]: "La liberté individuelle prime; l'État doit être réduit à ses fonctions minimales.",
        [PowerArchetype.CentralisateurJacobin]: "L'unité et l'égalité du pays passent par un pouvoir central fort.",
        [PowerArchetype.DecentralisateurGirondin]: "Le pouvoir doit s'exercer au plus près des territoires et des citoyens.",
        [PowerArchetype.PopulisteReferendaire]: "Le peuple doit pouvoir décider directement, notamment par référendum d'initiative citoyenne.",
        [PowerArchetype.RepublicainHumaniste]: "Attaché aux institutions, à l'état de droit et aux libertés fondamentales.",
        [PowerArchetype.ElitisteEclaire]: "Le gouvernement doit revenir aux plus compétents et aux plus instruits.",
        [PowerArchetype.PartisanOrdre]: "L'ordre et la sécurité sont la première des libertés et la condition du reste.",
        [PowerArchetype.DemocratePluraliste]: "La démocratie vit par le débat parlementaire, le pluralisme et le compromis.",
        [PowerArchetype.AnarchisteHorizontal]: "L'auto-organisation sans hiérarchie est préférable à toute autorité instituée.",
        [PowerArchetype.TechnopragmatiqueGestionnaire]: "L'État doit être géré avec efficacité, en se concentrant sur ce qui marche."
    },
    economy: {
        [EconomyArchetype.CapitalisteNeoliberal]: "Le marché et la concurrence sont les meilleurs moteurs de la prospérité.",
        [EconomyArchetype.SocialDemocrateRedistributif]: "Le marché est efficace, mais l'État doit redistribuer pour garantir l'égalité réelle.",
        [EconomyArchetype.CorporatisteProtectionniste]: "Il faut protéger les métiers et les industries nationales de la concurrence déloyale.",
        [EconomyArchetype.KeynesienProductiviste]: "L'État doit investir et soutenir la demande pour assurer croissance et plein emploi.",
        [EconomyArchetype.DirigisteColbertiste]: "L'État doit piloter de grands champions industriels nationaux.",
        [EconomyArchetype.Altermondialiste]: "Une autre mondialisation est possible: solidaire, écologique et sociale.",
        [EconomyArchetype.LibertarienMarchePur]: "Impôts et régulations doivent être réduits au strict minimum.",
        [EconomyArchetype.EcologisteDecroissant]: "La croissance infinie est impossible: il faut réduire production et consommation matérielles.",
        [EconomyArchetype.TechnoprogressisteGreenGrowth]: "L'innovation rend possible une croissance compatible avec le climat.",
        [EconomyArchetype.CommunautaristeSolidaire]: "Économie locale, entraide, coopératives et circuits courts d'abord.",
        [EconomyArchetype.PhilanthroCapitaliste]: "La réussite économique crée une responsabilité d'investir dans le bien commun.",
        [EconomyArchetype.RigoristeBudgetaire]: "Des comptes publics équilibrés sont la condition de la souveraineté et de la confiance."
    },
    geopolitics: {
        [GeopoliticsArchetype.GaullisteSouverainiste]: "Indépendance nationale, refus des alignements, politique étrangère autonome.",
        [GeopoliticsArchetype.AtlantisteLiberal]: "L'alliance avec les États-Unis et l'OTAN protège nos démocraties.",
        [GeopoliticsArchetype.EurasiatisteContinental]: "L'Europe doit dialoguer avec l'Est plutôt que s'aligner sur Washington.",
        [GeopoliticsArchetype.NonInterventionnisteIsolationniste]: "Le pays ne doit pas s'ingérer dans les conflits qui ne le concernent pas directement.",
        [GeopoliticsArchetype.InterventionnisteNeoconservateur]: "Les démocraties doivent défendre activement leurs valeurs, y compris par la force.",
        [GeopoliticsArchetype.MultilateralisteOnusien]: "La paix passe par le droit international et les institutions multilatérales.",
        [GeopoliticsArchetype.InternationalisteTiersMondiste]: "Solidarité avec les peuples du Sud et refus des logiques impériales.",
        [GeopoliticsArchetype.DecolonialPostOccidental]: "Il faut rompre avec l'héritage colonial et l'occidentalo-centrisme.",
        [GeopoliticsArchetype.CivilisationnisteCulturaliste]: "La défense de l'identité de civilisation européenne est l'enjeu central de l'époque.",
        [GeopoliticsArchetype.MondialisteCosmopolite]: "Les grandes questions se règlent à l'échelle du monde, par l'ouverture et la coopération.",
        [GeopoliticsArchetype.SouverainisteProtectionniste]: "Maîtres chez nous: protection économique et culturelle de la nation."
    },
    social: {
        [SocialArchetype.ConservateurMoral]: "Les repères moraux et familiaux hérités méritent d'être préservés.",
        [SocialArchetype.ProgressisteSocietal]: "L'extension des droits individuels est un progrès continu de la société.",
        [SocialArchetype.TraditionnalisteReligieux]: "La transcendance et la tradition donnent leur fondement aux lois humaines.",
        [SocialArchetype.LibertaireHedoniste]: "Chacun doit pouvoir vivre comme il l'entend, sans tutelle morale.",
        [SocialArchetype.NationalIdentitaire]: "L'identité culturelle nationale est le ciment de la société.",
        [SocialArchetype.MulticulturalisteTolerant]: "La diversité culturelle est une richesse à reconnaître et organiser.",
        [SocialArchetype.AssimilationnisteRepublicain]: "L'intégration réussie passe par l'adoption de la culture commune du pays.",
        [SocialArchetype.FeministeUniversaliste]: "L'égalité entre les femmes et les hommes, partout et sans essentialisme.",
        [SocialArchetype.IntersectionnelMilitant]: "Les inégalités systémiques croisées appellent des politiques actives de correction.",
        [SocialArchetype.EgalitaristeCompassionnel]: "Priorité aux plus vulnérables et aux exclus.",
        [SocialArchetype.MeritocrateExigeant]: "Chacun selon ses efforts et ses talents, sans passe-droits.",
        [SocialArchetype.UniversalisteCritique]: "L'universalisme commun doit primer sur les appartenances de groupes."
    },
    environment: {
        [EnvironmentArchetype.EcologisteRadical]: "L'urgence écologique justifie des transformations profondes et rapides de nos modes de vie.",
        [EnvironmentArchetype.EcomodernisteTechnophile]: "La technologie (nucléaire, innovation) est notre meilleur levier climatique.",
        [EnvironmentArchetype.ProductivisteEconomique]: "La prospérité économique reste prioritaire; les politiques climatiques ne doivent pas la compromettre.",
        [EnvironmentArchetype.PostCroissanceLocaliste]: "Vivre mieux avec moins, localement et sobrement.",
        [EnvironmentArchetype.TechnocrateVert]: "Normes, prix du carbone et planification permettent de piloter la transition.",
        [EnvironmentArchetype.BioConservateur]: "Le vivant a des limites qu'il ne faut pas franchir, ni par la technique ni par le marché.",
        [EnvironmentArchetype.TranshumanistePostHumain]: "L'humanité doit assumer d'augmenter ses capacités par la science.",
        [EnvironmentArchetype.SpiritualisteEcologique]: "La crise écologique appelle aussi une reconnexion intérieure au vivant."
    },
    knowledge: {
        [KnowledgeArchetype.RationalisteScientiste]: "La méthode scientifique est notre meilleur outil pour approcher le vrai.",
        [KnowledgeArchetype.TechnocrateExpertCentre]: "Les questions complexes doivent être instruites par ceux qui les maîtrisent.",
        [KnowledgeArchetype.EmpiristePragmatique]: "L'expérience concrète du terrain vaut souvent mieux que les modèles.",
        [KnowledgeArchetype.RelativisteCulturel]: "Les vérités dépendent des contextes et des points de vue.",
        [KnowledgeArchetype.SceptiqueCartesien]: "Douter méthodiquement et vérifier par soi-même.",
        [KnowledgeArchetype.CroyantMystique]: "La foi et l'intuition donnent accès à des vérités que la raison seule n'atteint pas.",
        [KnowledgeArchetype.DefiantInstitutionnel]: "Les récits officiels méritent d'être systématiquement questionnés et contre-vérifiés.",
        [KnowledgeArchetype.BonSensExperientiel]: "Le bon sens et l'expérience vécue sont des boussoles plus sûres que les théories.",
        [KnowledgeArchetype.MeritocrateCognitif]: "Le poids dans la décision doit refléter la compétence sur le sujet.",
        [KnowledgeArchetype.PopulisteAntiElite]: "Le savoir institué sert trop souvent les intérêts de ceux qui le détiennent."
    },
    moral: {
        [MoralArchetype.MoralisteUniversaliste]: "Des principes moraux universels doivent guider l'action politique.",
        [MoralArchetype.PragmatiqueDesideologise]: "Peu importe la doctrine: comptent les résultats concrets.",
        [MoralArchetype.RealisteEtat]: "La responsabilité de l'État impose parfois de faire primer l'efficacité sur les principes.",
        [MoralArchetype.RealisteInterets]: "Derrière les discours, chacun défend des intérêts: mieux vaut le regarder en face.",
        [MoralArchetype.CompassionnelHumanitaire]: "La souffrance d'autrui oblige; elle doit orienter l'action publique.",
        [MoralArchetype.NationalRomantique]: "Fidélité à l'âme du peuple et à son destin historique.",
        [MoralArchetype.CivilisationnisteMissionnaire]: "Notre civilisation porte des acquis qu'elle a le devoir de défendre et transmettre.",
        [MoralArchetype.FatalisteHistoriciste]: "L'histoire a ses forces profondes; la volonté politique ne peut pas tout.",
        [MoralArchetype.RevoltePrometheen]: "Face à l'injustice, la révolte est un devoir.",
        [MoralArchetype.SpiritualisteTranscendant]: "Nos actes s'inscrivent dans un ordre qui dépasse la politique.",
        [MoralArchetype.IntransigeantMoral]: "Sur l'essentiel, le compromis est une défaite morale.",
        [MoralArchetype.DualisteStrategique]: "Il faut savoir être ferme sur les fins et souple sur les moyens.",
        [MoralArchetype.ComplexisteRelativiste]: "Le réel est nuancé: se méfier des grilles binaires.",
        [MoralArchetype.Desabuse]: "L'expérience invite à ne plus attendre grand-chose du politique."
    }
};
