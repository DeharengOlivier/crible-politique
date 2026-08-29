import type { DimensionKey, SourceStatus } from '@/types/positions';

/**
 * What each party says it fights for, read in its own programme.
 *
 * The mirror of the reader's "combats prioritaires": both sides declare what
 * matters most to them, and the app only shows the overlap. A declared fight
 * is never a position: it says what a party talks about, not which side it
 * takes, and it never enters the proximity computation.
 *
 * Sourcing rule, identical to the one governing positions:
 * - every entry names the document it was read in, with a link and a year;
 * - the fights are listed in the order the document itself presents them;
 * - the status is the same three-value scale as a position, and everything
 *   here is "codage préliminaire" until a second coder reviews it;
 * - a fight the 35 statements do not ask about carries no dimension at all,
 *   rather than a stretched one. Housing and schooling are real declared
 *   fights of several parties and the questionnaire is silent on both; saying
 *   so is more useful than pretending the reader's priorities cover them.
 *
 * History: a CHES 2024 salience layer was shipped a few hours earlier on
 * 2026-08-29 and replaced by this. The expert panel gave a 0-10 number to 22
 * parties and nothing at all to the two below its inclusion thresholds, so the
 * panel described its own reach more than it described the parties. See
 * CHANGELOG-DONNEES.md.
 */

export interface FightSource {
    /** The document that was read, named as it names itself. */
    label: string;
    url: string;
    year: string;
}

export interface PartyFight {
    /** Short theme, as the chip label. */
    theme: string;
    /** One sentence a reader can check against the source. */
    claim: string;
    /** Where the fight lands among the seven dimensions; empty if nowhere. */
    dimensions: DimensionKey[];
    /** Verbatim wording, when the document states it in one line. */
    quote?: string;
}

export interface PartyFightsEntry {
    source: FightSource;
    status: SourceStatus;
    /** In the order the source presents them. */
    fights: PartyFight[];
}

export const PARTY_FIGHTS: Record<string, PartyFightsEntry> = {
    // ============================ FRANCE ============================
    fr_lfi: {
        source: {
            label: "L'Avenir en commun, sommaire du programme",
            url: 'https://laec.fr',
            year: '2022'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Démocratie et institutions',
                claim: "Premier chapitre du programme, avant tout autre sujet.",
                dimensions: ['power'],
                quote: 'Démocratie et institutions'
            },
            {
                theme: 'Planification écologique',
                claim: "Troisième chapitre, suivi des « grands défis de la bifurcation écologique ».",
                dimensions: ['environment'],
                quote: "Planification écologique et organisation du pays"
            },
            {
                theme: 'Partage des richesses',
                claim: "Chapitre consacré à la redistribution, avec « Plein emploi » et « Égalité ».",
                dimensions: ['economy'],
                quote: 'Partage des richesses'
            }
        ]
    },
    fr_rn: {
        source: {
            label: 'Projet de gouvernement, campagnes affichées par le parti',
            url: 'https://rassemblementnational.fr',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Immigration',
                claim: "Campagne mise en avant en tête de page par le parti.",
                dimensions: ['geopolitics', 'social'],
                quote: 'Pour stopper la submersion migratoire'
            },
            {
                theme: "Prix de l'énergie",
                claim: "Baisse de la TVA sur l'énergie, mesure de pouvoir d'achat mise en avant.",
                dimensions: ['economy'],
                quote: "Pour la réduction de la TVA de 20% à 5,5% sur l'énergie"
            },
            {
                theme: 'Référendum d’initiative citoyenne',
                claim: "Le RIC est porté comme réponse institutionnelle centrale.",
                dimensions: ['power'],
                quote: "Pour le RIC, le référendum d'initiative citoyenne"
            },
            {
                theme: 'Ordre et sécurité',
                claim: "Sécurité et autorité de l'État, affichées avec la fermeture des mosquées radicales.",
                dimensions: ['power', 'social'],
                quote: 'Pour remettre la France en ordre'
            }
        ]
    },
    fr_reconquete: {
        source: {
            label: "Les priorités d'Éric Zemmour pour la France",
            url: 'https://parti-reconquete.fr',
            year: '2022'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Identité',
                claim: "Le parti énonce huit priorités en « I », l'identité en tête.",
                dimensions: ['social'],
                quote: 'Identité, Immigration, Islam, Insécurité, Instruction, Impôts, Industrie et Indépendance'
            },
            {
                theme: 'Immigration et islam',
                claim: "Deuxième et troisième priorités de la liste publiée par le parti.",
                dimensions: ['geopolitics', 'social']
            },
            {
                theme: 'Impôts et industrie',
                claim: "Priorités économiques, citées après les priorités identitaires et sécuritaires.",
                dimensions: ['economy']
            }
        ]
    },
    fr_upr: {
        source: {
            label: 'Programme de libération nationale',
            url: 'https://upr.fr',
            year: '2022'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: "Sortie de l'UE, de l'euro et de l'OTAN",
                claim: "Raison d'être affichée du parti, présentée comme préalable à tout le reste.",
                dimensions: ['geopolitics'],
                quote: "Libérons-nous de l'UE, de l'€, de l'OTAN"
            },
            {
                theme: 'Retour au franc',
                claim: "Retour à une monnaie nationale pour reprendre la politique monétaire.",
                dimensions: ['economy', 'geopolitics']
            },
            {
                theme: 'Référendum et probité des élus',
                claim: "RIC, casier judiciaire vierge exigé des élus, limitation des mandats.",
                dimensions: ['power']
            }
        ]
    },
    fr_patriotes: {
        source: {
            label: 'Grandes orientations pour un projet patriote',
            url: 'https://les-patriotes.fr/wp-content/uploads/2025/09/lespatriotes_projet.pdf',
            year: '2025'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Frexit',
                claim: "Le programme présente le Frexit comme la condition de toutes les autres mesures, et écarte explicitement l'idée de réformer l'UE de l'intérieur.",
                dimensions: ['geopolitics'],
                quote: "Le Frexit est ainsi la clé de voute du projet des Patriotes"
            },
            {
                theme: 'Sortie des instances supranationales',
                claim: "La liste des sorties dépasse l'UE seule et figure au premier chapitre.",
                dimensions: ['geopolitics'],
                quote: 'quitter toutes les instances supranationales : UE, Euro, Schengen, CEDH, OTAN, OMS'
            },
            {
                theme: 'Démocratie, institutions, corruption',
                claim: "Premier chapitre du livret: RIC inscrit dans la Constitution, inéligibilité à vie pour corruption.",
                dimensions: ['power'],
                quote: 'DÉMOCRATIE, INSTITUTIONS, CORRUPTION'
            }
        ]
    },
    fr_renaissance: {
        source: {
            label: 'Orientations du parti, consultation « Nouvelle République »',
            url: 'https://parti-renaissance.fr',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Économie et climat',
                claim: "Axe affiché en tête: transformation économique et écologique conjointe.",
                dimensions: ['economy', 'environment'],
                quote: 'Pour une nouvelle donne économique et climatique'
            },
            {
                theme: "Autorité de l'État",
                claim: "Fermeté républicaine, application des règles et contrôle des frontières.",
                dimensions: ['power', 'social'],
                quote: 'Une République ferme, une France apaisée'
            },
            {
                theme: 'Souveraineté européenne',
                claim: "Investissement militaire et indépendance européenne face aux puissances extérieures.",
                dimensions: ['geopolitics']
            }
        ]
    },
    fr_lr: {
        source: {
            label: 'Priorités publiées par le parti, par thème',
            url: 'https://republicains.fr',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Fiscalité et dépense publique',
                claim: "Premier thème affiché, avec la baisse des droits de succession.",
                dimensions: ['economy'],
                quote: 'Fiscalité & Dépense'
            },
            {
                theme: 'Immigration',
                claim: "Réserver Schengen aux Européens et refuser la répartition des migrants illégaux.",
                dimensions: ['geopolitics', 'social']
            },
            {
                theme: 'Justice et souveraineté du peuple',
                claim: "Contrôle disciplinaire des magistrats, au nom du retour de la souveraineté populaire.",
                dimensions: ['power']
            }
        ]
    },
    fr_eelv: {
        source: {
            label: 'Programme des Écologistes aux européennes 2024 (synthèse Touteleurope)',
            url: 'https://www.touteleurope.eu/vie-politique-des-etats-membres/elections-europeennes-2024-le-programme-de-marie-toussaint-et-des-ecologistes-eelv/',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Traité environnemental',
                claim: "Première proposition: une obligation générale de protéger le climat au sommet des normes européennes.",
                dimensions: ['environment'],
                quote: 'obligation générale de protéger le climat et de ne pas dépasser les limites planétaires'
            },
            {
                theme: 'Green Deal 2.0',
                claim: "Acte II de l'économie européenne, pour financer la transition et créer des emplois.",
                dimensions: ['economy', 'environment']
            },
            {
                theme: 'Urgence sociale',
                claim: "Protection sociale contre la précarité énergétique et alimentaire, portée avec le climat.",
                dimensions: ['economy']
            }
        ]
    },
    fr_ps: {
        source: {
            label: 'Orientations publiées par le parti',
            url: 'https://www.parti-socialiste.fr',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Justice sociale et redistribution',
                claim: "Le partage des richesses est le premier terme de la vision affichée.",
                dimensions: ['economy'],
                quote: 'Pour un avenir Social, écologique & démocratique'
            },
            {
                theme: 'Écologie',
                claim: "Deuxième terme de la même vision, la préservation écologique.",
                dimensions: ['environment']
            },
            {
                theme: 'Droits et démocratie',
                claim: "Souveraineté démocratique et nouveaux droits, dont les droits LGBTQ+ et féministes.",
                dimensions: ['power', 'social']
            }
        ]
    },
    fr_pcf: {
        source: {
            label: 'Propositions phares publiées par le parti',
            url: 'https://www.pcf.fr',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Salaires et temps de travail',
                claim: "Deux mesures affichées en tête: 32 heures et SMIC à 1600 € net.",
                dimensions: ['economy'],
                quote: 'LA SEMAINE DE TRAVAIL À 32 HEURES'
            },
            {
                theme: 'Retraite à 60 ans',
                claim: "Retraite à taux plein à 60 ans, affichée parmi les propositions phares.",
                dimensions: ['economy'],
                quote: 'LA RETRAITE À 60 ANS À TAUX PLEIN'
            },
            {
                theme: 'Paix et reconnaissance de la Palestine',
                claim: "Campagne internationale portée par le parti, avec une pétition dédiée.",
                dimensions: ['geopolitics']
            }
        ]
    },
    fr_horizons: {
        source: {
            label: 'Orientations et prises de position publiques du parti',
            url: 'https://horizonsleparti.fr',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Finances publiques',
                claim: "Retour de l'ordre budgétaire et transformation de l'État recentré sur ses missions.",
                dimensions: ['economy', 'power']
            },
            {
                theme: 'Autorité et sécurité',
                claim: "Ordre public et autorité de l'État, avec l'école et l'universalisme républicain.",
                dimensions: ['power', 'social']
            },
            {
                theme: 'Décarbonation',
                claim: "Ligne écologique articulée autour de la décarbonation et des filières énergétiques.",
                dimensions: ['environment']
            }
        ]
    },
    fr_modem: {
        source: {
            label: 'Nos priorités',
            url: 'https://www.mouvementdemocrate.fr',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Union européenne',
                claim: "Deuxième des six priorités affichées par le parti, avant les solidarités.",
                dimensions: ['geopolitics'],
                quote: 'Villages Démocrates, Union européenne, Solidarités, Transition écologique, Innovation et industrie, Démocratie'
            },
            {
                theme: 'Solidarités',
                claim: "Troisième priorité affichée, avant la transition écologique.",
                dimensions: ['economy']
            },
            {
                theme: 'Transition écologique',
                claim: "Quatrième priorité affichée, avec l'innovation et l'industrie.",
                dimensions: ['environment']
            }
        ]
    },

    // ============================ BELGIQUE ============================
    be_ptb: {
        source: {
            label: 'Programme fédéral 2024',
            url: 'https://www.ptb.be/programme',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Justice fiscale',
                claim: "Premier des quatre engagements mis en avant par le parti.",
                dimensions: ['economy'],
                quote: 'Justice fiscale: taxons les multimillionnaires'
            },
            {
                theme: "Pouvoir d'achat",
                claim: "Deuxième engagement affiché, revendiqué comme le combat du parti.",
                dimensions: ['economy'],
                quote: "Le pouvoir d'achat, c'est notre combat"
            },
            {
                theme: 'Privilèges des politiciens',
                claim: "Troisième engagement affiché, sur le fonctionnement du pouvoir.",
                dimensions: ['power'],
                quote: 'Stop aux privilèges des politiciens'
            },
            {
                theme: 'Climat',
                claim: "Quatrième engagement affiché: une politique climatique sociale.",
                dimensions: ['environment'],
                quote: "C'est aux gros pollueurs de payer"
            }
        ]
    },
    be_mr: {
        source: {
            label: 'Programme général 2024',
            url: 'https://www.mr.be/programme2024/',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: "Pouvoir d'achat",
                claim: "Premier axe du programme général du parti.",
                dimensions: ['economy'],
                quote: "Plus de pouvoir d'achat pour tous les travailleurs"
            },
            {
                theme: 'Fiscalité du travail',
                claim: "Baisse de la fiscalité sur le travail, financée par une baisse de la dépense publique.",
                dimensions: ['economy']
            },
            {
                theme: "Taux d'emploi à 80%",
                claim: "Objectif d'emploi porté par le soutien aux indépendants et aux PME.",
                dimensions: ['economy']
            }
        ]
    },
    be_ps: {
        source: {
            label: 'Priorités publiées par le parti',
            url: 'https://www.ps.be',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Sécurité du quotidien',
                claim: "Première priorité affichée par le parti.",
                dimensions: ['power'],
                quote: 'Des villes et des villages plus sûrs'
            },
            {
                theme: 'Logement abordable',
                claim: "Deuxième priorité affichée. Aucun des 35 énoncés ne porte sur le logement.",
                dimensions: [],
                quote: 'Des logements à prix accessibles'
            },
            {
                theme: 'Salaires et services publics',
                claim: "Priorités suivantes: services accessibles à tous, salaires, soins de santé.",
                dimensions: ['economy'],
                quote: 'Garantir des services accessibles pour toutes et tous'
            }
        ]
    },
    be_ecolo: {
        source: {
            label: 'Priorités publiées par le parti',
            url: 'https://www.ecolo.be',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Climat',
                claim: "Première des trois missions affichées, et urgence répétée dans ses prises de position.",
                dimensions: ['environment'],
                quote: 'protéger notre planète, améliorer nos vies et rassembler plutôt que diviser'
            },
            {
                theme: 'Transports accessibles',
                claim: "Campagne affichée pour des transports et parkings à 1 €.",
                dimensions: ['economy', 'environment']
            },
            {
                theme: 'Rassembler plutôt que diviser',
                claim: "Troisième mission affichée, contre les visites domiciliaires et pour la vie privée.",
                dimensions: ['social', 'power']
            }
        ]
    },
    be_engages: {
        source: {
            label: 'Notre projet de société',
            url: 'https://lesengages.be',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Régénération',
                claim: "Le parti oppose « la Régénération » au modèle de croissance infinie.",
                dimensions: ['environment', 'economy'],
                quote: 'Protéger aujourd’hui. Garantir demain'
            },
            {
                theme: 'Familles',
                claim: "Priorité affichée « pour les familles », avec le soutien à la parentalité.",
                dimensions: [],
            },
            {
                theme: 'Égalité femmes-hommes',
                claim: "Priorité affichée « pour l'égalité H/F », dont 40% de femmes aux postes fédéraux.",
                dimensions: ['social']
            }
        ]
    },
    be_nva: {
        source: {
            label: 'Verkiezingsprogramma 2024: Voor Vlaamse welvaart',
            url: 'https://www.n-va.be/sites/n-va.be/files/2024-04/Verkiezingsprogramma.pdf',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Confédéralisme',
                claim: "Le programme s'ouvre sur un préambule confédéral: l'autonomie flamande commande le reste.",
                dimensions: ['power'],
                quote: 'Voor Vlaamse welvaart'
            },
            {
                theme: 'Contrôle de la migration',
                claim: "Thème affiché en tête du programme, avec l'objectif de reprendre le contrôle.",
                dimensions: ['geopolitics', 'social'],
                quote: 'Opnieuw controle over migratie'
            },
            {
                theme: 'Prospérité et travail',
                claim: "Récompenser ceux qui travaillent et contribuent à la prospérité flamande.",
                dimensions: ['economy']
            }
        ]
    },
    be_vb: {
        source: {
            label: 'Programma',
            url: 'https://www.vlaamsbelang.org/programma',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Indépendance de la Flandre',
                claim: "Premier chapitre du programme, avant tout autre thème.",
                dimensions: ['power'],
                quote: 'Vlaanderen onafhankelijk'
            },
            {
                theme: 'Criminalité',
                claim: "Chapitre consacré à la lutte contre la criminalité.",
                dimensions: ['power'],
                quote: 'Criminaliteit aanpakken'
            },
            {
                theme: 'Immigration',
                claim: "Chapitre sur l'accueil et ses limites, formulé par le parti comme un « oui mais ».",
                dimensions: ['geopolitics', 'social'],
                quote: 'Gastvrij maar niet gek'
            }
        ]
    },
    be_vooruit: {
        source: {
            label: 'Standpunten (thèmes mis en avant)',
            url: 'https://www.vooruit.org/standpunten',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: "Pouvoir d'achat",
                claim: "Premier des trois thèmes que le parti met en avant avant tous les autres.",
                dimensions: ['economy'],
                quote: 'Koopkracht'
            },
            {
                theme: 'Soins de santé',
                claim: "Deuxième thème mis en avant.",
                dimensions: ['economy'],
                quote: 'Zorg'
            },
            {
                theme: 'Égalité des chances',
                claim: "Troisième thème mis en avant.",
                dimensions: ['social'],
                quote: 'Gelijke kansen'
            }
        ]
    },
    be_openvld: {
        source: {
            label: 'Standpunten du parti (devenu « Anders » en janvier 2026)',
            url: 'https://anders.be/standpunten',
            year: '2026'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Travailler doit rapporter plus',
                claim: "Position affichée: au moins 500 € net de plus par mois pour qui travaille.",
                dimensions: ['economy']
            },
            {
                theme: 'Flexibilité du travail',
                claim: "Contrats plus souples et heures supplémentaires volontaires déplafonnées.",
                dimensions: ['economy']
            },
            {
                theme: "Moins d'État",
                claim: "Valeurs revendiquées: dégraisser l'État, laisser entreprendre.",
                dimensions: ['power', 'economy'],
                quote: 'ontvetten, ontplooien, ondernemen'
            }
        ]
    },
    be_cdv: {
        source: {
            label: 'Priorités publiées par le parti',
            url: 'https://www.cdenv.be',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Impôts sur le travail',
                claim: "Priorité affichée en tête de page par le parti.",
                dimensions: ['economy'],
                quote: 'We verlagen de belastingen op arbeid, zodat werken opnieuw meer loont.'
            },
            {
                theme: 'Aidants proches',
                claim: "Plan affiché pour lever les obstacles et donner de la souplesse aux aidants proches.",
                dimensions: ['economy']
            }
        ]
    },
    be_groen: {
        source: {
            label: 'Standpunten',
            url: 'https://www.groen.be/standpunten',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Climat',
                claim: "Premier thème de la liste publiée par le parti.",
                dimensions: ['environment'],
                quote: 'Klimaat'
            },
            {
                theme: 'Fiscalité juste',
                claim: "Deuxième thème de la liste publiée.",
                dimensions: ['economy'],
                quote: 'Eerlijke belastingen'
            },
            {
                theme: 'Enseignement',
                claim: "Troisième thème de la liste publiée. Aucun des 35 énoncés ne porte sur l'école.",
                dimensions: [],
                quote: 'Onderwijs'
            }
        ]
    },
    be_defi: {
        source: {
            label: 'Nos valeurs, nos combats',
            url: 'https://www.defi.be',
            year: '2024'
        },
        status: 'a_verifier',
        fights: [
            {
                theme: 'Face à l’extrémisme et au populisme',
                claim: "Le parti présente ses valeurs comme une réponse à l'extrémisme et au populisme.",
                dimensions: ['power', 'moral'],
                quote: 'Nos valeurs, nos combats'
            },
            {
                theme: 'Bonne gouvernance',
                claim: "Thème récurrent de ses prises de position, notamment sur le logement social.",
                dimensions: ['power']
            },
            {
                theme: 'Logement',
                claim: "Réforme du logement social. Aucun des 35 énoncés ne porte sur le logement.",
                dimensions: []
            }
        ]
    }
};
