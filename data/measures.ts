// Mode 2: legal feasibility of emblematic measures.
//
// Editorial principles (see METHODOLOGY.md):
// - We never say "this program is unfeasible". We document the legal
//   obstacles, the possible pathways and the level of uncertainty.
// - Each obstacle cites its norm (Constitution, EU law, treaties,
//   case law) and its sources.
// - "What is established" = points of law that are little contested.
//   "What is debated" = points on which legal scholars disagree.
// - Status "preliminaire": entry written by the team, pending validation
//   by named external legal experts (see GOVERNANCE.md).

export type NormLevel =
    | "Constitution"
    | "Droit de l'UE"
    | "Traités internationaux"
    | "Jurisprudence"
    | "Budgétaire / économique";

export type Uncertainty = "faible" | "moyenne" | "élevée";

export interface MeasureSource {
    label: string;
    url?: string;
}

export interface LegalObstacle {
    norm: NormLevel;
    title: string;
    detail: string;
    sources: MeasureSource[];
}

export interface Pathway {
    title: string;
    detail: string;
}

export interface Measure {
    id: string;
    title: string;
    proposedBy: string; // neutral wording: "championed notably by..."
    claim: string; // the measure as announced
    established: string; // what is legally established
    debated: string; // what is debated among legal scholars
    obstacles: LegalObstacle[];
    pathways: Pathway[];
    uncertainty: Uncertainty;
    status: "preliminaire" | "valide";
}

export const MEASURES: Measure[] = [
    {
        id: "retraite_60",
        title: "Retraite à 60 ans à taux plein",
        proposedBy: "Portée notamment par La France Insoumise et le PCF",
        claim: "Rétablir l'âge légal de départ à 60 ans avec 40 annuités.",
        established:
            "Aucun obstacle constitutionnel ou européen n'empêche de fixer l'âge légal à 60 ans: c'est une loi ordinaire. La contrainte est budgétaire, pas juridique.",
        debated:
            "Le coût net (estimations divergentes selon les hypothèses d'emploi des seniors) et la compatibilité de la trajectoire de déficit avec les règles budgétaires européennes réformées en 2024.",
        obstacles: [
            {
                norm: "Budgétaire / économique",
                title: "Coût budgétaire et règles européennes de déficit",
                detail:
                    "La mesure accroît les dépenses de retraite de plusieurs dizaines de milliards par an selon les paramètres retenus. Le cadre budgétaire UE réformé (2024) impose une trajectoire pluriannuelle de dépenses; un dérapage expose à une procédure pour déficit excessif, avec sanctions financières possibles mais historiquement jamais appliquées à ce stade.",
                sources: [
                    { label: "Règlement (UE) 2024/1263 sur la coordination des politiques économiques", url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1263" },
                    { label: "Rapports du COR sur les scénarios d'âge de départ", url: "https://www.cor-retraites.fr" }
                ]
            }
        ],
        pathways: [
            {
                title: "Loi ordinaire + financement",
                detail:
                    "Vote en loi ordinaire; financement par hausse de cotisations, élargissement d'assiette ou fiscalité. Le choix du financement est politique, pas juridique."
            }
        ],
        uncertainty: "faible",
        status: "preliminaire"
    },
    {
        id: "isf_renforce",
        title: "Rétablir un impôt sur la fortune renforcé",
        proposedBy: "Portée notamment par LFI, le PS, EELV (FR) et le PTB (BE)",
        claim: "Rétablir et durcir un impôt sur les grandes fortunes (ou taxe des millionnaires).",
        established:
            "Un impôt sur le patrimoine est constitutionnellement possible: l'ISF a existé de 1989 à 2017. Le législateur fiscal a une large marge de manœuvre.",
        debated:
            "Le seuil au-delà duquel l'impôt devient confiscatoire (le Conseil constitutionnel a censuré en 2012 une imposition globale des revenus à 75%), et l'ampleur réelle de l'exil fiscal qu'il provoquerait.",
        obstacles: [
            {
                norm: "Jurisprudence",
                title: "Interdiction du caractère confiscatoire",
                detail:
                    "Le Conseil constitutionnel censure les impositions qui font peser une charge excessive au regard des facultés contributives (décision n° 2012-662 DC). Un barème très élevé sur le patrimoine, cumulé aux autres impôts, devrait être plafonné.",
                sources: [
                    { label: "CC, décision n° 2012-662 DC du 29 décembre 2012", url: "https://www.conseil-constitutionnel.fr/decision/2012/2012662DC.htm" }
                ]
            },
            {
                norm: "Traités internationaux",
                title: "Conventions fiscales et mobilité du capital",
                detail:
                    "Les conventions fiscales bilatérales et la libre circulation des capitaux (art. 63 TFUE) limitent la capacité à imposer les patrimoines délocalisés; une 'exit tax' renforcée est possible mais encadrée par la jurisprudence de la CJUE.",
                sources: [
                    { label: "Art. 63 TFUE", url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:12016E063" },
                    { label: "CJUE, Lasteyrie du Saillant (C-9/02)", url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:62002CJ0009" }
                ]
            }
        ],
        pathways: [
            {
                title: "Loi de finances avec barème plafonné",
                detail: "Rétablissement par loi de finances, avec mécanisme de plafonnement pour passer le contrôle constitutionnel."
            },
            {
                title: "Coordination internationale",
                detail: "Soutenir l'initiative d'imposition minimale des très hauts patrimoines discutée au G20/OCDE pour limiter l'exil fiscal."
            }
        ],
        uncertainty: "faible",
        status: "preliminaire"
    },
    {
        id: "quotas_immigration",
        title: "Quotas annuels d'immigration votés par le Parlement",
        proposedBy: "Portée notamment par Les Républicains et le RN",
        claim: "Faire voter chaque année par le Parlement un plafond d'immigration par catégorie.",
        established:
            "Des quotas sont juridiquement possibles pour l'immigration de travail hors UE: c'est une compétence largement nationale. Ils sont impossibles pour trois flux majeurs: citoyens UE (libre circulation), demandeurs d'asile (Convention de Genève: l'examen individuel ne peut être plafonné) et, en grande partie, regroupement familial (directive 2003/86, art. 8 CEDH).",
        debated:
            "La part exacte des flux réellement 'plafonnable' (minoritaire selon la plupart des analyses), et la possibilité de renégocier la directive regroupement familial au niveau européen.",
        obstacles: [
            {
                norm: "Traités internationaux",
                title: "Droit d'asile: examen individuel obligatoire",
                detail:
                    "La Convention de Genève de 1951 et le principe de non-refoulement interdisent de refuser l'examen d'une demande d'asile au motif qu'un plafond est atteint.",
                sources: [
                    { label: "Convention de Genève (1951), art. 33", url: "https://www.unhcr.org/fr/convention-1951-relative-statut-refugies" }
                ]
            },
            {
                norm: "Droit de l'UE",
                title: "Regroupement familial encadré par directive",
                detail:
                    "La directive 2003/86/CE crée un droit subjectif au regroupement familial sous conditions; un quota national qui le bloquerait serait contraire au droit de l'UE (CJUE, C-540/03).",
                sources: [
                    { label: "Directive 2003/86/CE", url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32003L0086" },
                    { label: "CJUE, C-540/03", url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:62003CJ0540" }
                ]
            },
            {
                norm: "Constitution",
                title: "Exigences constitutionnelles (FR)",
                detail:
                    "Le Conseil constitutionnel reconnaît un droit à une vie familiale normale (fondé sur le Préambule de 1946) et le droit d'asile comme exigence constitutionnelle: un plafonnement strict de ces catégories serait censuré à droit constitutionnel constant.",
                sources: [
                    { label: "CC, décision n° 93-325 DC du 13 août 1993", url: "https://www.conseil-constitutionnel.fr/decision/1993/93325DC.htm" }
                ]
            }
        ],
        pathways: [
            {
                title: "Quotas sur l'immigration de travail",
                detail: "Juridiquement réalisable par loi pour les titres de séjour économiques hors UE (modèle canadien partiel)."
            },
            {
                title: "Renégociation européenne",
                detail: "Modifier la directive regroupement familial exige une majorité qualifiée au Conseil de l'UE et un vote du Parlement européen: voie longue et incertaine."
            },
            {
                title: "Révision constitutionnelle + retrait conventionnel",
                detail: "Pour plafonner asile et famille, il faudrait réviser la Constitution et se retirer ou déroger à des conventions (Genève, CEDH): juridiquement possible, politiquement et diplomatiquement lourd."
            }
        ],
        uncertainty: "faible",
        status: "preliminaire"
    },
    {
        id: "preference_nationale",
        title: "Priorité nationale pour l'emploi et les prestations sociales",
        proposedBy: "Portée notamment par le RN (FR) et le Vlaams Belang (BE)",
        claim: "Réserver ou prioriser l'accès à l'emploi, au logement social et à certaines prestations aux nationaux.",
        established:
            "À droit constant, la mesure est contraire à la Constitution française (principe d'égalité), au droit de l'UE (non-discrimination des travailleurs européens, statut des résidents de longue durée) et à la CEDH (art. 14). Le RN lui-même prévoit une révision constitutionnelle par référendum pour la rendre possible.",
        debated:
            "La validité de la voie référendaire envisagée (art. 11 vs art. 89 de la Constitution): une révision constitutionnelle par l'art. 11 est jugée inconstitutionnelle par la doctrine majoritaire malgré les précédents de 1962 et 1969, et le Conseil d'État comme le Conseil constitutionnel pourraient être saisis. Même révisée, la Constitution ne neutraliserait pas les obligations européennes sans conflit frontal avec la CJUE.",
        obstacles: [
            {
                norm: "Constitution",
                title: "Principe d'égalité",
                detail:
                    "L'article 1er de la Constitution et la DDHC garantissent l'égalité devant la loi sans distinction d'origine; une différence de traitement fondée sur la nationalité pour des prestations non contributives est censurée de longue date.",
                sources: [{ label: "CC, décision n° 89-269 DC du 22 janvier 1990", url: "https://www.conseil-constitutionnel.fr/decision/1990/89269DC.htm" }]
            },
            {
                norm: "Droit de l'UE",
                title: "Non-discrimination européenne",
                detail:
                    "Les règlements sur la libre circulation des travailleurs (492/2011) et la directive résidents de longue durée (2003/109) imposent l'égalité de traitement; une priorité nationale systémique placerait le pays en infraction continue, avec astreintes financières (précédent polonais: 1 M EUR/jour).",
                sources: [
                    { label: "Règlement (UE) 492/2011", url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32011R0492" },
                    { label: "Directive 2003/109/CE", url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32003L0109" }
                ]
            },
            {
                norm: "Traités internationaux",
                title: "CEDH, article 14",
                detail:
                    "La Cour EDH juge que les distinctions fondées sur la seule nationalité exigent des justifications très fortes (Gaygusuz c. Autriche, 1996).",
                sources: [{ label: "CEDH, Gaygusuz c. Autriche (1996)" }]
            }
        ],
        pathways: [
            {
                title: "Révision constitutionnelle",
                detail: "Une révision par l'art. 89 (accord des deux chambres puis référendum ou Congrès) pourrait lever l'obstacle interne, pas les obligations européennes et conventionnelles."
            },
            {
                title: "Renégociation ou sortie des cadres européens",
                detail: "Appliquer pleinement la mesure supposerait de renégocier les traités UE ou d'en sortir, et de dénoncer ou renégocier la CEDH: c'est la mesure au coût juridique et diplomatique le plus élevé de ce panel."
            }
        ],
        uncertainty: "moyenne",
        status: "preliminaire"
    },
    {
        id: "sortie_otan",
        title: "Sortie de l'OTAN (ou du commandement intégré)",
        proposedBy: "Portée notamment par LFI, l'UPR, Les Patriotes (FR) et le PTB (BE)",
        claim: "Quitter l'OTAN, ou a minima son commandement militaire intégré.",
        established:
            "Juridiquement, c'est l'une des mesures les plus simples du panel: l'article 13 du traité de Washington permet à tout membre de se retirer avec un préavis d'un an. La sortie du seul commandement intégré est une décision exécutive sans modification de traité (précédent français de 1966, retour en 2009).",
        debated:
            "Aucun débat juridique sérieux; tout le débat est stratégique et diplomatique (garanties de sécurité, relations avec les alliés, position face à la Russie).",
        obstacles: [
            {
                norm: "Traités internationaux",
                title: "Préavis d'un an",
                detail: "Notification au gouvernement des États-Unis (dépositaire), effet après un an: contrainte de calendrier, pas d'interdiction.",
                sources: [{ label: "Traité de l'Atlantique Nord (1949), art. 13", url: "https://www.nato.int/cps/fr/natohq/official_texts_17120.htm" }]
            }
        ],
        pathways: [
            {
                title: "Décision exécutive",
                detail: "En France, la décision relève du Président (domaine réservé de fait); un vote parlementaire ou un référendum est politiquement probable mais juridiquement non requis."
            }
        ],
        uncertainty: "faible",
        status: "preliminaire"
    },
    {
        id: "frexit",
        title: "Sortie de l'Union européenne",
        proposedBy: "Portée notamment par l'UPR et Les Patriotes",
        claim: "Quitter l'Union européenne par l'article 50 du TUE.",
        established:
            "La sortie est un droit explicite (art. 50 TUE, précédent britannique). La procédure: notification, négociation d'un accord de retrait (2 ans prorogeables), puis sortie. En France, la décision peut passer par référendum (art. 11) ou par la voie parlementaire.",
        debated:
            "Pas la possibilité juridique, mais les conséquences: statut des ressortissants, frontière douanière, contrats en cours, participation à l'euro (une sortie de l'UE implique de quitter l'euro, sans procédure prévue par les traités pour ce volet: terrain juridiquement inédit).",
        obstacles: [
            {
                norm: "Droit de l'UE",
                title: "Sortie de l'euro non codifiée",
                detail:
                    "Aucune disposition des traités n'organise la sortie de la zone euro; la redénomination de la dette et des contrats en nouvelle monnaie (lex monetae) serait contestée devant de multiples juridictions.",
                sources: [
                    { label: "Art. 50 TUE", url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:12016M050" },
                    { label: "Doctrine sur la lex monetae" }
                ]
            },
            {
                norm: "Constitution",
                title: "Révision constitutionnelle de cohérence",
                detail: "Le titre XV de la Constitution française organise la participation à l'UE; une sortie exigerait son abrogation ou sa révision.",
                sources: [{ label: "Constitution, titre XV (art. 88-1 et s.)", url: "https://www.conseil-constitutionnel.fr/le-bloc-de-constitutionnalite/texte-integral-de-la-constitution-du-4-octobre-1958-en-vigueur" }]
            }
        ],
        pathways: [
            {
                title: "Référendum puis article 50",
                detail: "Voie politiquement la plus légitime; l'accord de retrait détermine l'essentiel des conséquences pratiques."
            }
        ],
        uncertainty: "moyenne",
        status: "preliminaire"
    },
    {
        id: "desobeissance_traites",
        title: "Désobéissance ciblée aux traités européens",
        proposedBy: "Portée notamment par La France Insoumise",
        claim: "Appliquer le programme national en désobéissant aux règles européennes incompatibles (règles budgétaires, concurrence, marché de l'énergie), sans sortir de l'UE.",
        established:
            "Le droit de l'UE prime sur le droit national (jurisprudence constante CJUE depuis Costa c. ENEL, 1964) et l'art. 88-1 de la Constitution française ancre la participation à l'UE. Une désobéissance assumée expose à des recours en manquement, des astreintes financières journalières et, pour les fonds européens, au mécanisme de conditionnalité (précédents Pologne et Hongrie).",
        debated:
            "L'ampleur des marges réelles: l'« opt-out de fait » par négociation (dérogations, clauses, rapports de force au Conseil) a des précédents (dérogation ibérique sur l'électricité, opt-outs danois). Les partisans soutiennent qu'un grand État fondateur obtiendrait des concessions qu'un recours contentieux ne reflète pas; les opposants soulignent que la France n'est pas la Pologne de 2021 mais que la mécanique juridique serait identique.",
        obstacles: [
            {
                norm: "Droit de l'UE",
                title: "Primauté et recours en manquement",
                detail:
                    "La Commission peut saisir la CJUE (art. 258 TFUE); les astreintes peuvent atteindre des centaines de milliers d'euros par jour (Pologne: 1 M EUR/jour en 2021).",
                sources: [
                    { label: "Art. 258-260 TFUE", url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:12016E258" },
                    { label: "CJUE, Costa c. ENEL (1964)", url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:61964CJ0006" }
                ]
            },
            {
                norm: "Constitution",
                title: "Article 88-1",
                detail:
                    "Le Conseil constitutionnel juge que la participation à l'UE est une exigence constitutionnelle; une loi ouvertement contraire au droit de l'UE pourrait être censurée en amont.",
                sources: [{ label: "CC, décision n° 2004-505 DC (traité constitutionnel)", url: "https://www.conseil-constitutionnel.fr/decision/2004/2004505DC.htm" }]
            }
        ],
        pathways: [
            {
                title: "Négociation de dérogations",
                detail: "Précédents réels: dérogation ibérique (énergie, 2022), flexibilités budgétaires Covid. Voie efficace mais limitée aux cas où une majorité d'États y consent."
            },
            {
                title: "Rapport de force assumé",
                detail: "Désobéir en acceptant le contentieux et les astreintes, en pariant sur une renégociation. Coût financier et politique réel, issue incertaine."
            }
        ],
        uncertainty: "élevée",
        status: "preliminaire"
    },
    {
        id: "ric_constituant",
        title: "Référendum d'initiative citoyenne en toutes matières",
        proposedBy: "Portée notamment par LFI, le RN (version restreinte) et Les Patriotes",
        claim: "Permettre aux citoyens de proposer, abroger des lois et réviser la Constitution par référendum d'initiative populaire.",
        established:
            "Le RIC législatif exige une révision de la Constitution (l'art. 11 actuel ne prévoit qu'un référendum d'initiative partagée très restrictif). Une révision par l'art. 89 nécessite l'accord des deux chambres avant référendum: un Sénat hostile peut bloquer indéfiniment.",
        debated:
            "La possibilité de passer par l'art. 11 pour réviser la Constitution (précédents de Gaulle 1962/1969) reste l'objet d'une controverse doctrinale majeure; et la question des limites matérielles: un RIC permettant d'abroger des droits fondamentaux entrerait en conflit avec la CEDH et le droit de l'UE.",
        obstacles: [
            {
                norm: "Constitution",
                title: "Verrou de l'article 89",
                detail: "Toute révision exige un vote en termes identiques par l'Assemblée et le Sénat avant référendum; pas de voie incontestée pour contourner un blocage sénatorial.",
                sources: [{ label: "Constitution, art. 89; art. 11", url: "https://www.conseil-constitutionnel.fr/le-bloc-de-constitutionnalite/texte-integral-de-la-constitution-du-4-octobre-1958-en-vigueur" }]
            },
            {
                norm: "Traités internationaux",
                title: "Conventionnalité des lois référendaires",
                detail:
                    "Une loi adoptée par référendum reste soumise aux engagements internationaux; la CEDH s'applique aux choix référendaires (précédents suisses sur les minarets, contentieux toujours ouverts).",
                sources: [{ label: "CEDH; doctrine sur le contrôle des lois référendaires" }]
            }
        ],
        pathways: [
            {
                title: "Révision art. 89 négociée",
                detail: "Un RIC encadré (seuils élevés, exclusion des droits fondamentaux et des traités) aurait plus de chances de passer le Sénat et le contrôle juridictionnel."
            },
            {
                title: "Voie de l'article 11",
                detail: "Constitutionnellement contestée mais historiquement praticable; déclencherait presque certainement une crise institutionnelle arbitrée par le Conseil constitutionnel."
            }
        ],
        uncertainty: "élevée",
        status: "preliminaire"
    },
    {
        id: "nationalisation_autoroutes",
        title: "Renationalisation des autoroutes",
        proposedBy: "Portée par des responsables de LFI au RN en passant par des voix LR",
        claim: "Reprendre le contrôle public des concessions autoroutières.",
        established:
            "La nationalisation est constitutionnellement possible (alinéa 9 du Préambule de 1946) à condition d'une juste et préalable indemnité (art. 17 DDHC). Deux voies: attendre la fin des concessions (2031-2036 pour les principales) ou racheter/résilier avant terme, ce que les contrats prévoient moyennant indemnisation du manque à gagner: coût estimé en dizaines de milliards.",
        debated:
            "Le montant exact de l'indemnisation en cas de résiliation anticipée (les clauses contractuelles sont partiellement confidentielles) et la qualification juridique d'une résiliation pour motif d'intérêt général versus une déchéance pour faute.",
        obstacles: [
            {
                norm: "Constitution",
                title: "Indemnisation juste et préalable",
                detail: "Toute expropriation ou résiliation anticipée impose d'indemniser les concessionnaires, y compris le manque à gagner contractuel.",
                sources: [{ label: "Art. 17 DDHC; CC, décision n° 81-132 DC (nationalisations de 1982)", url: "https://www.conseil-constitutionnel.fr/decision/1982/81132DC.htm" }]
            },
            {
                norm: "Droit de l'UE",
                title: "Protection des investissements et libre circulation des capitaux",
                detail: "Les actionnaires étrangers pourraient activer des arbitrages d'investissement; le droit UE n'interdit pas la propriété publique (art. 345 TFUE) mais encadre les modalités.",
                sources: [
                    { label: "Art. 345 TFUE", url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:12016E345" },
                    { label: "Traités bilatéraux d'investissement" }
                ]
            }
        ],
        pathways: [
            {
                title: "Non-renouvellement à échéance",
                detail: "Juridiquement imparable et budgétairement neutre: reprise en régie ou nouvel opérateur public à la fin des contrats (à partir de 2031)."
            },
            {
                title: "Rachat négocié anticipé",
                detail: "Possible mais au prix du manque à gagner; un rapport de force sur les sur-profits constatés (rapports parlementaires 2020) peut réduire la facture."
            }
        ],
        uncertainty: "faible",
        status: "preliminaire"
    },
    {
        id: "sortie_marche_electricite",
        title: "Sortir du marché européen de l'électricité",
        proposedBy: "Portée notamment par le RN et LFI",
        claim: "Découpler les prix français de l'électricité du marché européen pour revenir à des prix fondés sur les coûts de production nationaux.",
        established:
            "Le marché intérieur de l'énergie repose sur des règlements UE directement applicables: une sortie unilatérale sans désobéissance assumée n'est pas possible en restant dans l'UE. En revanche, la régulation des prix de détail et les mécanismes type 'dérogation ibérique' (2022) montrent qu'un encadrement négocié est réalisable. La réforme du marché adoptée en 2024 (CfD, contrats long terme) a déjà partiellement répondu à la critique.",
        debated:
            "L'ampleur du gain réel pour le consommateur (la France exporte massivement: le découplage lui coûterait aussi des recettes), et la faisabilité physique d'un découplage tarifaire avec des réseaux interconnectés.",
        obstacles: [
            {
                norm: "Droit de l'UE",
                title: "Règlements directement applicables",
                detail: "Les règlements 2019/943 (marché de l'électricité) et associés s'imposent sans transposition; y déroger exige une décision européenne, pas nationale.",
                sources: [{ label: "Règlement (UE) 2019/943; réforme du marché 2024", url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32019R0943" }]
            }
        ],
        pathways: [
            {
                title: "Dérogation négociée",
                detail: "Précédent ibérique: plafonnement temporaire du prix du gaz dans la formation des prix, autorisé par la Commission (2022)."
            },
            {
                title: "Utiliser la réforme 2024",
                detail: "Contrats pour différence sur le nucléaire existant et contrats long terme: déconnecte déjà partiellement la facture du prix marginal du gaz."
            }
        ],
        uncertainty: "moyenne",
        status: "preliminaire"
    },
    {
        id: "assurance_chomage_durcie",
        title: "Durcissement de l'assurance chômage (dégressivité, durée réduite)",
        proposedBy: "Portée notamment par Renaissance, Horizons et Les Républicains",
        claim: "Réduire la durée d'indemnisation et introduire une dégressivité pour inciter au retour à l'emploi.",
        established:
            "Juridiquement, c'est l'une des mesures les plus simples du panel: depuis 2019, l'État peut imposer les règles par décret de carence quand la négociation paritaire échoue, et l'a fait à plusieurs reprises (2019, 2023). Aucun obstacle constitutionnel ou européen sérieux: le niveau d'indemnisation relève du choix politique national.",
        debated:
            "L'efficacité économique, pas la légalité: la littérature est divisée sur l'ampleur de l'effet incitatif des règles plus dures versus leur effet de précarisation, et la conformité d'ensemble à la convention n° 168 de l'OIT a été soulevée par les syndicats sans succès contentieux à ce jour. Le débat juridique le plus réel porte sur le contournement durable du paritarisme par décrets successifs.",
        obstacles: [
            {
                norm: "Jurisprudence",
                title: "Contrôle du juge administratif",
                detail:
                    "Les décrets assurance chômage sont systématiquement attaqués devant le Conseil d'État; certaines dispositions ont été annulées (bonus-malus partiel, salaire journalier de référence en 2020) mais le cœur des réformes a été validé. Risque d'annulation partielle, pas de blocage.",
                sources: [
                    { label: "CE, 25 novembre 2020, n° 434920 (annulation partielle du décret de 2019)", url: "https://www.conseil-etat.fr" }
                ]
            }
        ],
        pathways: [
            {
                title: "Décret de carence",
                detail: "Voie utilisée depuis 2019: document de cadrage contraignant, puis décret si la négociation des partenaires sociaux n'aboutit pas."
            },
            {
                title: "Négociation paritaire encadrée",
                detail: "Politiquement moins coûteuse et juridiquement plus solide; suppose d'accepter des compromis avec les partenaires sociaux."
            }
        ],
        uncertainty: "faible",
        status: "preliminaire"
    },
    {
        id: "deficit_3_pourcent",
        title: "Ramener le déficit public sous 3% du PIB d'ici 2029",
        proposedBy: "Trajectoire du gouvernement français, soutenue par le bloc central et Les Républicains",
        claim: "Respecter la trajectoire budgétaire transmise à la Commission européenne: déficit sous 3% du PIB en 2029.",
        established:
            "Le cadre est juridiquement clair: le plan budgétaire et structurel à moyen terme transmis à l'UE engage la France (règlement 2024/1263), et la procédure pour déficit excessif ouverte en 2024 impose un effort structurel annuel contrôlé. Ne pas tenir la trajectoire expose à des recommandations renforcées et, en théorie, à des sanctions financières (jamais appliquées à ce jour dans l'histoire de l'UE).",
        debated:
            "Le réalisme, pas le droit: le Haut Conseil des finances publiques a régulièrement jugé optimistes les hypothèses de croissance sous-jacentes, et la plupart des économistes considèrent l'objectif 2029 très exigeant sans mesures nouvelles documentées. C'est l'exemple type d'un engagement juridiquement encadré mais dont la crédibilité est une question politique et économique.",
        obstacles: [
            {
                norm: "Droit de l'UE",
                title: "Procédure pour déficit excessif en cours",
                detail:
                    "La France est sous procédure (art. 126 TFUE) depuis juillet 2024; l'écart à la trajectoire déclenche des recommandations contraignantes du Conseil. Les sanctions financières prévues (jusqu'à 0,05% du PIB par semestre) n'ont jamais été appliquées à aucun État.",
                sources: [
                    { label: "Art. 126 TFUE; règlement (UE) 2024/1263", url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1263" }
                ]
            },
            {
                norm: "Budgétaire / économique",
                title: "Hypothèses macroéconomiques contestées",
                detail:
                    "Les avis du HCFP sur les lois de finances successives soulignent des prévisions de croissance et d'élasticité des recettes optimistes; un écart de 0,5 point de croissance déplace le déficit d'environ 0,3 point de PIB.",
                sources: [
                    { label: "Avis du Haut Conseil des finances publiques", url: "https://www.hcfp.fr" }
                ]
            }
        ],
        pathways: [
            {
                title: "Effort documenté en dépenses et recettes",
                detail: "Crédibiliser la trajectoire suppose des mesures votées et chiffrées année par année, pas seulement des objectifs agrégés."
            },
            {
                title: "Renégociation du calendrier",
                detail: "Le cadre 2024 permet d'étaler l'ajustement sur 7 ans contre des réformes et investissements; la France utilise déjà cette flexibilité."
            }
        ],
        uncertainty: "moyenne",
        status: "preliminaire"
    },
    {
        id: "snu_obligatoire",
        title: "Service national universel obligatoire",
        proposedBy: "Portée notamment par Renaissance (généralisation un temps annoncée)",
        claim: "Rendre le SNU obligatoire pour toute une classe d'âge.",
        established:
            "Un service obligatoire est juridiquement possible par la loi: la CEDH exclut explicitement le service militaire et le service civique obligatoire de la notion de travail forcé (art. 4 §3). Le caractère obligatoire pour des mineurs exige en revanche une loi (et non le cadre réglementaire actuel du SNU volontaire), et l'obstacle dominant est budgétaire et logistique: l'accueil de 800 000 jeunes par an est chiffré en milliards d'euros annuels.",
        debated:
            "La conformité constitutionnelle d'une obligation d'hébergement hors du domicile pour des mineurs (liberté d'aller et venir, droit à l'instruction si empiétement scolaire) n'a jamais été testée devant le Conseil constitutionnel; la doctrine est partagée sur l'encadrement nécessaire.",
        obstacles: [
            {
                norm: "Constitution",
                title: "Obligation imposée à des mineurs: terrain non testé",
                detail:
                    "Une obligation de séjour encadré pour mineurs hors cadre scolaire est inédite; elle devrait être strictement proportionnée et passerait vraisemblablement par un contrôle constitutionnel exigeant.",
                sources: [
                    { label: "Avis et études du Conseil d'État sur le SNU", url: "https://www.conseil-etat.fr" }
                ]
            },
            {
                norm: "Budgétaire / économique",
                title: "Coût de généralisation",
                detail:
                    "Les estimations publiques pour une généralisation complète se chiffrent en milliards d'euros par an (encadrement, hébergement, transport), sans compter la capacité d'accueil à construire.",
                sources: [
                    { label: "Rapports parlementaires sur le budget du SNU" }
                ]
            }
        ],
        pathways: [
            {
                title: "Loi de généralisation progressive",
                detail: "Montée en charge par cohortes avec phase pilote obligatoire dans certains territoires, pour tester le cadre juridique et la logistique."
            },
            {
                title: "Intégration au temps scolaire",
                detail: "Voie choisie partiellement en 2024 (classes engagées): réduit l'obstacle juridique (cadre scolaire existant) et le coût, au prix de l'ambition initiale."
            }
        ],
        uncertainty: "moyenne",
        status: "preliminaire"
    },
    {
        id: "smic_hausse",
        title: "Hausse immédiate et forte du salaire minimum (SMIC à 1600 EUR net)",
        proposedBy: "Portée notamment par LFI et une partie de la gauche (FR); débat parallèle en Belgique",
        claim: "Augmenter le SMIC par décret de l'ordre de 10 à 15% dès l'arrivée au pouvoir.",
        established:
            "Juridiquement, c'est immédiat: le gouvernement français peut revaloriser le SMIC par simple décret ('coup de pouce'), sans vote. Aucune règle européenne ne l'interdit; la directive 2022/2041 sur les salaires minimaux adéquats va dans le sens d'une hausse.",
        debated:
            "Les effets économiques: impact sur l'emploi peu qualifié (littérature économique divisée), effet de tassement des grilles salariales, coût des exonérations de cotisations compensées par l'État, répercussion sur les TPE-PME. Le débat est entièrement économique, pas juridique.",
        obstacles: [
            {
                norm: "Budgétaire / économique",
                title: "Coût indirect pour les finances publiques",
                detail:
                    "Les allègements de cotisations sur les bas salaires sont indexés sur le SMIC: une forte hausse renchérit mécaniquement leur compensation budgétaire et peut créer des trappes à bas salaires.",
                sources: [
                    { label: "Directive (UE) 2022/2041 sur les salaires minimaux", url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022L2041" },
                    { label: "Rapports du groupe d'experts SMIC" }
                ]
            }
        ],
        pathways: [
            {
                title: "Décret immédiat",
                detail: "Mesure applicable dès le premier conseil des ministres; l'enjeu est le calibrage (ampleur, accompagnement des TPE), pas la légalité."
            }
        ],
        uncertainty: "faible",
        status: "preliminaire"
    }
];
