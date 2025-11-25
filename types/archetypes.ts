// Archetypes per dimension. The label values stay in French: they are the
// user-facing political taxonomy displayed in results.
// Naming rule (audited): each label must be one a sincere supporter of the
// described current could claim for themselves. No label may work as an insult
// or a diagnosis. The former labels judged pejorative ("Conspirationniste",
// "Anti-wok", "Oligarchique", "Austéritaire", "Machiavélien", "Manichéen",
// "Moralisateur", "Climatosceptique") were reworded into terms the people
// concerned use about themselves.

export enum PowerArchetype {
    EtatistePlanificateur = "Étatiste planificateur",
    TechnocrateRationaliste = "Technocrate rationaliste",
    LibertarienIndividualiste = "Libertarien individualiste",
    CentralisateurJacobin = "Centralisateur jacobin",
    DecentralisateurGirondin = "Décentralisateur girondin",
    PopulisteReferendaire = "Populiste référendaire",
    RepublicainHumaniste = "Républicain humaniste",
    ElitisteEclaire = "Élitiste éclairé",
    PartisanOrdre = "Partisan de l'ordre",
    DemocratePluraliste = "Démocrate pluraliste",
    AnarchisteHorizontal = "Anarchiste horizontal",
    TechnopragmatiqueGestionnaire = "Technopragmatique gestionnaire"
}

export enum EconomyArchetype {
    CapitalisteNeoliberal = "Libéral de marché",
    SocialDemocrateRedistributif = "Social-démocrate redistributif",
    CorporatisteProtectionniste = "Protectionniste industriel",
    KeynesienProductiviste = "Keynésien productiviste",
    DirigisteColbertiste = "Dirigiste colbertiste",
    Altermondialiste = "Altermondialiste",
    LibertarienMarchePur = "Libertarien du marché pur",
    EcologisteDecroissant = "Écologiste décroissant",
    TechnoprogressisteGreenGrowth = "Technoprogressiste croissance verte",
    CommunautaristeSolidaire = "Solidariste local",
    PhilanthroCapitaliste = "Philanthro-capitaliste",
    RigoristeBudgetaire = "Rigoriste budgétaire"
}

export enum GeopoliticsArchetype {
    GaullisteSouverainiste = "Gaulliste souverainiste",
    AtlantisteLiberal = "Atlantiste libéral",
    EurasiatisteContinental = "Eurasiatiste continental",
    NonInterventionnisteIsolationniste = "Non-interventionniste",
    InterventionnisteNeoconservateur = "Interventionniste néoconservateur",
    MultilateralisteOnusien = "Multilatéraliste onusien",
    InternationalisteTiersMondiste = "Internationaliste tiers-mondiste",
    DecolonialPostOccidental = "Décolonial post-occidental",
    CivilisationnisteCulturaliste = "Civilisationniste culturaliste",
    MondialisteCosmopolite = "Cosmopolite ouvert",
    SouverainisteProtectionniste = "Souverainiste protectionniste"
}

export enum SocialArchetype {
    ConservateurMoral = "Conservateur moral",
    ProgressisteSocietal = "Progressiste sociétal",
    TraditionnalisteReligieux = "Traditionaliste religieux",
    LibertaireHedoniste = "Libertaire hédoniste",
    NationalIdentitaire = "National-identitaire",
    MulticulturalisteTolerant = "Multiculturaliste",
    AssimilationnisteRepublicain = "Assimilationniste républicain",
    FeministeUniversaliste = "Féministe universaliste",
    IntersectionnelMilitant = "Intersectionnel militant",
    EgalitaristeCompassionnel = "Égalitariste solidaire",
    MeritocrateExigeant = "Méritocrate exigeant",
    UniversalisteCritique = "Universaliste critique"
}

export enum EnvironmentArchetype {
    EcologisteRadical = "Écologiste de rupture",
    EcomodernisteTechnophile = "Écomoderniste technophile",
    ProductivisteEconomique = "Productiviste priorité économie",
    PostCroissanceLocaliste = "Post-croissance localiste",
    TechnocrateVert = "Régulateur vert",
    BioConservateur = "Bio-conservateur",
    TranshumanistePostHumain = "Transhumaniste",
    SpiritualisteEcologique = "Spiritualiste écologique"
}

export enum KnowledgeArchetype {
    RationalisteScientiste = "Rationaliste scientifique",
    TechnocrateExpertCentre = "Partisan de l'expertise",
    EmpiristePragmatique = "Empiriste pragmatique",
    RelativisteCulturel = "Relativiste culturel",
    SceptiqueCartesien = "Sceptique cartésien",
    CroyantMystique = "Croyant spirituel",
    DefiantInstitutionnel = "Défiant institutionnel",
    BonSensExperientiel = "Praticien du bon sens",
    MeritocrateCognitif = "Méritocrate cognitif",
    PopulisteAntiElite = "Populiste anti-élites"
}

export enum MoralArchetype {
    MoralisteUniversaliste = "Moraliste universaliste",
    PragmatiqueDesideologise = "Pragmatique désidéologisé",
    RealisteEtat = "Réaliste d'État",
    RealisteInterets = "Réaliste des intérêts",
    CompassionnelHumanitaire = "Compassionnel humanitaire",
    NationalRomantique = "National-romantique",
    CivilisationnisteMissionnaire = "Civilisationniste missionnaire",
    FatalisteHistoriciste = "Fataliste historiciste",
    RevoltePrometheen = "Révolté prométhéen",
    SpiritualisteTranscendant = "Spiritualiste transcendant",
    IntransigeantMoral = "Intransigeant moral",
    DualisteStrategique = "Dualiste stratégique",
    ComplexisteRelativiste = "Complexiste nuancé",
    Desabuse = "Désabusé"
}

export interface PoliticalParty {
    id: string;
    name: string;
    country: "FR" | "BE";
    // Reference to the manifesto used for coding the positions.
    program?: {
        label: string;
        url?: string;
        year?: string;
    };
    description?: string;
    logo?: string;
}
