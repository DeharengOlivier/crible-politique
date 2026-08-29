import { LikertValue, PartyPositionsTable, PartyStance } from "@/types/positions";

// Party positions on each statement, on the same scale as the user
// (-2 strongly disagree ... +2 strongly agree).
//
// IMPORTANT - data status:
// This entire coding is currently at status "a_verifier":
// preliminary coding done from party programs and public positions, pending
// (1) adversarial double-coding by reviewers of different sensibilities and
// (2) self-positioning offered to the parties themselves (see GOVERNANCE.md).
// A position moves to status "verifie" only with a dated and linked citation.
// A party absent from a statement = not documented = not evaluated on that statement.
// A country-scoped statement only carries the parties of that country: asking a
// French party where it stands on Belgian state reform would be inventing data.
//
// To contest a value: public contestation procedure (GOVERNANCE.md §3),
// backed by a source. Any change must be logged, dated and justified
// in CHANGELOG-DONNEES.md (public change log).

const p = (value: LikertValue, source?: PartyStance["source"]): PartyStance => ({
    value,
    status: "a_verifier",
    source
});

export const PARTY_POSITIONS: PartyPositionsTable = {
    // --- POWER ---
    pw1: { // State planning of major economic orientations
        fr_lfi: p(2, { label: "L'Avenir en commun: planification écologique" }),
        fr_rn: p(1), fr_reconquete: p(-1), fr_upr: p(1), fr_patriotes: p(1),
        fr_renaissance: p(0), fr_lr: p(-1), fr_eelv: p(1), fr_ps: p(1),
        be_ptb: p(2), be_mr: p(-2), be_ps: p(1), be_ecolo: p(1),
        be_engages: p(0), be_nva: p(-1), be_vb: p(0),
        fr_pcf: p(2), fr_horizons: p(0), fr_modem: p(1),
        be_vooruit: p(1), be_openvld: p(-2), be_cdv: p(0), be_groen: p(1), be_defi: p(0)
    },
    pw2: { // Citizen-initiated referendum
        fr_lfi: p(2, { label: "L'Avenir en commun: RIC et constituante" }),
        fr_rn: p(1), fr_reconquete: p(-1), fr_upr: p(2), fr_patriotes: p(2),
        fr_renaissance: p(-1), fr_lr: p(-1), fr_eelv: p(1), fr_ps: p(0),
        be_ptb: p(2), be_mr: p(-1), be_ps: p(0), be_ecolo: p(1),
        be_engages: p(1), be_nva: p(-1), be_vb: p(1),
        fr_pcf: p(1), fr_horizons: p(-1), fr_modem: p(0),
        be_vooruit: p(0), be_openvld: p(0), be_cdv: p(-1), be_groen: p(1), be_defi: p(1)
    },
    pw4: { // Expansion of surveillance powers
        fr_lfi: p(-2), fr_rn: p(2), fr_reconquete: p(2), fr_upr: p(-1), fr_patriotes: p(0),
        fr_renaissance: p(1), fr_lr: p(2), fr_eelv: p(-2), fr_ps: p(-1),
        be_ptb: p(-2), be_mr: p(1), be_ps: p(-1), be_ecolo: p(-2),
        be_engages: p(0), be_nva: p(2), be_vb: p(2),
        fr_pcf: p(0), fr_horizons: p(1), fr_modem: p(0),
        be_vooruit: p(1), be_openvld: p(1), be_cdv: p(1), be_groen: p(-2), be_defi: p(0)
    },

    // --- ECONOMY ---
    ec1: { // Increase the contribution of the highest incomes / wealth
        fr_lfi: p(2), fr_rn: p(-1), fr_reconquete: p(-2), fr_upr: p(1), fr_patriotes: p(1),
        fr_renaissance: p(-1), fr_lr: p(-2), fr_eelv: p(2), fr_ps: p(2),
        be_ptb: p(2, { label: "PTB: taxe des millionnaires" }),
        be_mr: p(-2), be_ps: p(2), be_ecolo: p(2),
        be_engages: p(1), be_nva: p(-2), be_vb: p(0),
        fr_pcf: p(2), fr_horizons: p(-1), fr_modem: p(0),
        be_vooruit: p(2), be_openvld: p(-2), be_cdv: p(0), be_groen: p(2), be_defi: p(0)
    },
    ec2: { // Public management of essential services
        fr_lfi: p(2), fr_rn: p(1), fr_reconquete: p(-1), fr_upr: p(2), fr_patriotes: p(1),
        fr_renaissance: p(-1), fr_lr: p(-1), fr_eelv: p(1), fr_ps: p(1),
        be_ptb: p(2), be_mr: p(-1), be_ps: p(2), be_ecolo: p(1),
        be_engages: p(0), be_nva: p(-1), be_vb: p(0),
        fr_pcf: p(2), fr_horizons: p(-1), fr_modem: p(0),
        be_vooruit: p(2), be_openvld: p(-1), be_cdv: p(0), be_groen: p(1), be_defi: p(0)
    },
    ec3: { // Trade protectionism
        fr_lfi: p(1, { label: "Protectionnisme solidaire et écologique" }),
        fr_rn: p(2), fr_reconquete: p(1), fr_upr: p(1), fr_patriotes: p(2),
        fr_renaissance: p(-1), fr_lr: p(0), fr_eelv: p(0), fr_ps: p(0),
        be_ptb: p(1), be_mr: p(-1), be_ps: p(0), be_ecolo: p(0),
        be_engages: p(0), be_nva: p(-1), be_vb: p(1),
        fr_pcf: p(1), fr_horizons: p(-1), fr_modem: p(0),
        be_vooruit: p(0), be_openvld: p(-1), be_cdv: p(0), be_groen: p(0), be_defi: p(0)
    },
    ec4: { // Priority on debt reduction
        fr_lfi: p(-2), fr_rn: p(0), fr_reconquete: p(1), fr_upr: p(0), fr_patriotes: p(-1),
        fr_renaissance: p(1), fr_lr: p(2), fr_eelv: p(-1), fr_ps: p(-1),
        be_ptb: p(-2), be_mr: p(2), be_ps: p(-1), be_ecolo: p(-1),
        be_engages: p(0), be_nva: p(2), be_vb: p(0),
        fr_pcf: p(-2), fr_horizons: p(2), fr_modem: p(1),
        be_vooruit: p(0), be_openvld: p(2), be_cdv: p(1), be_groen: p(-1), be_defi: p(1)
    },

    // --- GEOPOLITICS ---
    ge1: { // Take back competences from the EU
        fr_lfi: p(1, { label: "Désobéissance ciblée aux traités" }),
        fr_rn: p(2), fr_reconquete: p(1),
        fr_upr: p(2, { label: "UPR: sortie de l'UE (art. 50)" }),
        fr_patriotes: p(2, { label: "Les Patriotes: Frexit" }),
        fr_renaissance: p(-2), fr_lr: p(0), fr_eelv: p(-1), fr_ps: p(-1),
        be_ptb: p(1), be_mr: p(-1), be_ps: p(-1), be_ecolo: p(-1),
        be_engages: p(-1), be_nva: p(0), be_vb: p(1),
        fr_pcf: p(1), fr_horizons: p(-1), fr_modem: p(-2),
        be_vooruit: p(-1), be_openvld: p(-1), be_cdv: p(-1), be_groen: p(-1), be_defi: p(-1)
    },
    ge2: { // NATO membership serves the country's interests
        fr_lfi: p(-2, { label: "Sortie de l'OTAN au programme" }),
        fr_rn: p(-1, { label: "Sortie du commandement intégré" }),
        fr_reconquete: p(0),
        fr_upr: p(-2, { label: "UPR: sortie de l'OTAN" }),
        fr_patriotes: p(-2),
        fr_renaissance: p(2), fr_lr: p(1), fr_eelv: p(0), fr_ps: p(1),
        be_ptb: p(-2), be_mr: p(2), be_ps: p(1), be_ecolo: p(0),
        be_engages: p(1), be_nva: p(2), be_vb: p(0),
        fr_pcf: p(-2), fr_horizons: p(2), fr_modem: p(1),
        be_vooruit: p(1), be_openvld: p(2), be_cdv: p(1), be_groen: p(0), be_defi: p(1)
    },
    ge3: { // Immigration is overall an opportunity
        fr_lfi: p(2), fr_rn: p(-2), fr_reconquete: p(-2), fr_upr: p(0), fr_patriotes: p(-2),
        fr_renaissance: p(1), fr_lr: p(-1), fr_eelv: p(2), fr_ps: p(1),
        be_ptb: p(1), be_mr: p(0), be_ps: p(1), be_ecolo: p(2),
        be_engages: p(1), be_nva: p(-1), be_vb: p(-2),
        fr_pcf: p(1), fr_horizons: p(0), fr_modem: p(1),
        be_vooruit: p(0), be_openvld: p(0), be_cdv: p(0), be_groen: p(2), be_defi: p(1)
    },
    ge4: { // Capacity for external military intervention
        fr_lfi: p(-1), fr_rn: p(-1), fr_reconquete: p(0), fr_upr: p(-2), fr_patriotes: p(-2),
        fr_renaissance: p(1), fr_lr: p(1), fr_eelv: p(0), fr_ps: p(1),
        be_ptb: p(-2), be_mr: p(1), be_ps: p(0), be_ecolo: p(0),
        be_engages: p(0), be_nva: p(1), be_vb: p(-1),
        fr_pcf: p(-1), fr_horizons: p(1), fr_modem: p(0),
        be_vooruit: p(0), be_openvld: p(1), be_cdv: p(0), be_groen: p(0), be_defi: p(0)
    },

    // ge5-ge7: coded 2026-08-29 from official statements, parliamentary votes
    // and party programmes 2024-2026 (see CHANGELOG-DONNEES.md for the full
    // motivation and the per-party evidence). Status a_verifier throughout:
    // labels cite the strongest single source found, pending double coding.
    ge5: { // Continue military support to Ukraine, even at a cost
        fr_lfi: p(-1, { label: "LFI: cessez-le-feu et négociations, contre l'escalade militaire", url: "https://lafranceinsoumise.fr/2025/03/12/pour-une-paix-juste-et-durable-en-ukraine/", date: "2025-03-12" }),
        fr_rn: p(-1, { label: "RN: condamnation verbale mais votes contre les résolutions de soutien au Parlement européen", url: "https://rassemblementnational.fr/communiques/resolution-du-parlement-europeen-sur-lukraine-le-rassemblement-national-reitere-son-soutien-a-lukraine", date: "2024-07-17" }),
        fr_reconquete: p(-1), fr_upr: p(-2), fr_patriotes: p(-2),
        fr_renaissance: p(2, { label: "Coalition des volontaires: garanties de sécurité et soutien dans la durée", url: "https://www.elysee.fr/", date: "2026-03-13" }),
        fr_lr: p(2), fr_eelv: p(2, { label: "Les Écologistes: soutien militaire renforcé, fin du pacifisme traditionnel", date: "2024" }),
        fr_ps: p(2, { label: "PS: résolution pour un soutien indéfectible à l'Ukraine", url: "https://www.parti-socialiste.fr/soutien_indefectible_a_l_ukraine_la_proposition_de_resolution_des_socialistes", date: "2024" }),
        fr_pcf: p(-1), fr_horizons: p(2), fr_modem: p(2),
        be_ptb: p(-2, { label: "PTB-PVDA: contre les livraisons d'armes, pour une sortie diplomatique immédiate", url: "https://www.ptb.be/pourquoi-lotan-ne-fait-pas-partie-de-la-solution", date: "2024" }),
        be_mr: p(1), be_ps: p(1), be_ecolo: p(1),
        be_engages: p(1), be_nva: p(1), be_vb: p(-1),
        be_vooruit: p(1), be_openvld: p(1), be_cdv: p(1), be_groen: p(1), be_defi: p(1)
    },
    ge6: { // Normalize relations with Russia in time
        fr_lfi: p(1), fr_rn: p(1, { label: "RN favorable à la levée de certaines sanctions contre la Russie", date: "2022-11" }),
        fr_reconquete: p(1), fr_upr: p(2), fr_patriotes: p(2),
        fr_renaissance: p(-1), fr_lr: p(-1),
        fr_eelv: p(-2, { label: "Les Écologistes: sanctions renforcées et étendues, fin des importations russes", date: "2024" }),
        fr_ps: p(-1), fr_pcf: p(1),
        fr_horizons: p(-2, { label: "Édouard Philippe au congrès Horizons: la Russie est une menace", date: "2025-03" }),
        fr_modem: p(-1),
        be_ptb: p(1), be_mr: p(-1), be_ps: p(-1), be_ecolo: p(-1),
        be_engages: p(-1), be_nva: p(-1),
        be_vb: p(1, { label: "Vlaams Belang: scepticisme sur les sanctions dures, liens historiques avec Moscou", date: "2022-11" }),
        be_vooruit: p(-1), be_openvld: p(-1), be_cdv: p(-1), be_groen: p(-1), be_defi: p(-1)
    },
    ge7: { // Priority support to Israel in the Israeli-Palestinian conflict
        fr_lfi: p(-2, { label: "LFI: adhésion officielle à la campagne BDS", url: "https://lafranceinsoumise.fr/2024/12/03/face-a-la-colonisation-a-lapartheid-et-au-genocide-a-gaza-la-france-insoumise-adhere-officiellement-a-la-campagne-de-bds/", date: "2024-12-03" }),
        fr_rn: p(2, { label: "RN: opposition à la reconnaissance de la Palestine, soutien affirmé à Israël", date: "2024-2025" }),
        fr_reconquete: p(2), fr_upr: p(-1), fr_patriotes: p(0),
        fr_renaissance: p(0, { label: "Reconnaissance de l'État de Palestine par la France à l'ONU, ligne des deux États", date: "2025-09-22" }),
        fr_lr: p(1), fr_eelv: p(-2, { label: "Les Écologistes: embargo sur les armes, légitimité du mouvement BDS (conseil fédéral)", date: "2025-06-15" }),
        fr_ps: p(-1), fr_pcf: p(-2, { label: "PCF: reconnaissance immédiate de l'État palestinien, déclaration commune avec l'OLP", date: "2024-06" }),
        fr_horizons: p(1), fr_modem: p(0),
        be_ptb: p(-2), be_mr: p(2, { label: "Ligne Bouchez: opposition aux sanctions et à la reconnaissance de la Palestine", date: "2025-03" }),
        be_ps: p(-1, { label: "PS: pression pour la reconnaissance de la Palestine", date: "2025" }),
        be_ecolo: p(-1), be_engages: p(-1, { label: "Les Engagés (Prévot): reconnaissance de la Palestine et sanctions contre Israël", date: "2025-09-02" }),
        be_nva: p(1), be_vb: p(1),
        be_vooruit: p(-1), be_openvld: p(1), be_cdv: p(-1), be_groen: p(-1), be_defi: p(0)
    },

    // --- SOCIETY ---
    so1: { // Expansion of individual societal rights
        fr_lfi: p(2), fr_rn: p(-1), fr_reconquete: p(-2), fr_upr: p(0), fr_patriotes: p(-1),
        fr_renaissance: p(2), fr_lr: p(-1), fr_eelv: p(2), fr_ps: p(2),
        be_ptb: p(1), be_mr: p(1), be_ps: p(2), be_ecolo: p(2),
        be_engages: p(0), be_nva: p(0), be_vb: p(-1),
        fr_pcf: p(1), fr_horizons: p(1), fr_modem: p(1),
        be_vooruit: p(2), be_openvld: p(2), be_cdv: p(-1), be_groen: p(2), be_defi: p(2)
    },
    so2: { // Affirmative action / quotas
        fr_lfi: p(1), fr_rn: p(-2), fr_reconquete: p(-2), fr_upr: p(-1), fr_patriotes: p(-2),
        fr_renaissance: p(0), fr_lr: p(-2), fr_eelv: p(2), fr_ps: p(1),
        be_ptb: p(1), be_mr: p(-1), be_ps: p(1), be_ecolo: p(2),
        be_engages: p(0), be_nva: p(-2), be_vb: p(-2),
        fr_pcf: p(0), fr_horizons: p(-1), fr_modem: p(0),
        be_vooruit: p(0), be_openvld: p(-1), be_cdv: p(0), be_groen: p(2), be_defi: p(0)
    },
    so3: { // Integration = adopting the culture of the host country
        fr_lfi: p(-1), fr_rn: p(2), fr_reconquete: p(2), fr_upr: p(2), fr_patriotes: p(2),
        fr_renaissance: p(1), fr_lr: p(2), fr_eelv: p(-2), fr_ps: p(0),
        be_ptb: p(-1), be_mr: p(1), be_ps: p(0), be_ecolo: p(-2),
        be_engages: p(1), be_nva: p(2), be_vb: p(2),
        fr_pcf: p(1), fr_horizons: p(1), fr_modem: p(1),
        be_vooruit: p(1), be_openvld: p(1), be_cdv: p(1), be_groen: p(-2), be_defi: p(1)
    },
    so4: { // Regulated legalization of cannabis
        fr_lfi: p(2, { label: "Légalisation au programme" }),
        fr_rn: p(-2), fr_reconquete: p(-2), fr_upr: p(0), fr_patriotes: p(-1),
        fr_renaissance: p(0), fr_lr: p(-2), fr_eelv: p(2), fr_ps: p(1),
        be_ptb: p(1), be_mr: p(0), be_ps: p(1), be_ecolo: p(2),
        be_engages: p(1, { label: "Les Engagés: régulation encadrée proposée" }),
        be_nva: p(-1), be_vb: p(-1),
        fr_pcf: p(1), fr_horizons: p(-1), fr_modem: p(-1),
        be_vooruit: p(1), be_openvld: p(1), be_cdv: p(-1), be_groen: p(2), be_defi: p(1)
    },

    // --- ENVIRONMENT ---
    en1: { // Nuclear power is part of the climate response
        fr_lfi: p(-2, { label: "Sortie du nucléaire au programme" }),
        fr_rn: p(2), fr_reconquete: p(2), fr_upr: p(1), fr_patriotes: p(1),
        fr_renaissance: p(2, { label: "Relance du programme nucléaire (EPR2)" }),
        fr_lr: p(2), fr_eelv: p(-2), fr_ps: p(0),
        be_ptb: p(1, { label: "Soutien à la prolongation des centrales" }),
        be_mr: p(2), be_ps: p(-1), be_ecolo: p(-2),
        be_engages: p(1), be_nva: p(2), be_vb: p(2),
        fr_pcf: p(2, { label: "PCF: défense historique de la filière nucléaire" }),
        fr_horizons: p(2), fr_modem: p(1),
        be_vooruit: p(0), be_openvld: p(2), be_cdv: p(1), be_groen: p(-2), be_defi: p(1)
    },
    en2: { // Constraints on consumption habits
        fr_lfi: p(1), fr_rn: p(-2), fr_reconquete: p(-2), fr_upr: p(0), fr_patriotes: p(-2),
        fr_renaissance: p(0), fr_lr: p(-1), fr_eelv: p(2), fr_ps: p(1),
        be_ptb: p(-1, { label: "Refus des écotaxes pesant sur les ménages" }),
        be_mr: p(-2), be_ps: p(1), be_ecolo: p(2),
        be_engages: p(1), be_nva: p(-1), be_vb: p(-2),
        fr_pcf: p(0), fr_horizons: p(0), fr_modem: p(1),
        be_vooruit: p(1), be_openvld: p(-1), be_cdv: p(1), be_groen: p(2), be_defi: p(0)
    },
    en3: { // Technology will meet the climate challenge without degrowth
        fr_lfi: p(-2), fr_rn: p(1), fr_reconquete: p(1), fr_upr: p(0), fr_patriotes: p(0),
        fr_renaissance: p(1), fr_lr: p(1), fr_eelv: p(-2), fr_ps: p(-1),
        be_ptb: p(-1), be_mr: p(2), be_ps: p(-1), be_ecolo: p(-2),
        be_engages: p(0), be_nva: p(2), be_vb: p(1),
        fr_pcf: p(0), fr_horizons: p(1), fr_modem: p(0),
        be_vooruit: p(-1), be_openvld: p(2), be_cdv: p(0), be_groen: p(-2), be_defi: p(0)
    },
    en4: { // The environment takes precedence over economic projects
        fr_lfi: p(1), fr_rn: p(-2), fr_reconquete: p(-2), fr_upr: p(0), fr_patriotes: p(-1),
        fr_renaissance: p(-1), fr_lr: p(-1), fr_eelv: p(2), fr_ps: p(1),
        be_ptb: p(1), be_mr: p(-1), be_ps: p(1), be_ecolo: p(2),
        be_engages: p(1), be_nva: p(-1), be_vb: p(-2),
        fr_pcf: p(1), fr_horizons: p(-1), fr_modem: p(0),
        be_vooruit: p(1), be_openvld: p(-1), be_cdv: p(0), be_groen: p(2), be_defi: p(0)
    },

    // --- KNOWLEDGE ---
    kn1: { // Weight of scientific consensus in technical decisions
        fr_lfi: p(1), fr_rn: p(0), fr_reconquete: p(0), fr_upr: p(1), fr_patriotes: p(-1),
        fr_renaissance: p(2), fr_lr: p(1), fr_eelv: p(2), fr_ps: p(2),
        be_ptb: p(1), be_mr: p(1), be_ps: p(1), be_ecolo: p(2),
        be_engages: p(1), be_nva: p(1), be_vb: p(-1),
        fr_pcf: p(1), fr_horizons: p(2), fr_modem: p(1),
        be_vooruit: p(1), be_openvld: p(1), be_cdv: p(1), be_groen: p(2), be_defi: p(2)
    },
    kn2: { // Overall reliability of mainstream media
        fr_lfi: p(-1), fr_rn: p(-2), fr_reconquete: p(-2), fr_upr: p(-2), fr_patriotes: p(-2),
        fr_renaissance: p(1), fr_lr: p(0), fr_eelv: p(0), fr_ps: p(1),
        be_ptb: p(-1), be_mr: p(0), be_ps: p(1), be_ecolo: p(1),
        be_engages: p(1), be_nva: p(-1), be_vb: p(-2),
        fr_pcf: p(-1), fr_horizons: p(1), fr_modem: p(1),
        be_vooruit: p(1), be_openvld: p(0), be_cdv: p(1), be_groen: p(1), be_defi: p(1)
    },
    kn3: { // Weight of experiential knowledge versus expertise
        fr_lfi: p(1), fr_rn: p(2), fr_reconquete: p(0), fr_upr: p(0), fr_patriotes: p(2),
        fr_renaissance: p(-1), fr_lr: p(1), fr_eelv: p(0), fr_ps: p(0),
        be_ptb: p(2), be_mr: p(0), be_ps: p(0), be_ecolo: p(0),
        be_engages: p(1), be_nva: p(1), be_vb: p(2),
        fr_pcf: p(2), fr_horizons: p(-1), fr_modem: p(1),
        be_vooruit: p(1), be_openvld: p(0), be_cdv: p(1), be_groen: p(0), be_defi: p(0)
    },
    kn4: { // Broad protection of freedom of expression
        fr_lfi: p(1), fr_rn: p(1), fr_reconquete: p(2), fr_upr: p(2), fr_patriotes: p(2),
        fr_renaissance: p(0), fr_lr: p(1), fr_eelv: p(0), fr_ps: p(0),
        be_ptb: p(0), be_mr: p(1), be_ps: p(-1), be_ecolo: p(-1),
        be_engages: p(-1), be_nva: p(1), be_vb: p(2),
        fr_pcf: p(0), fr_horizons: p(0), fr_modem: p(0),
        be_vooruit: p(-1), be_openvld: p(1), be_cdv: p(-1), be_groen: p(-1), be_defi: p(1)
    },

    // --- POLITICAL MORALITY ---
    mo1: { // Preference for compromise
        fr_lfi: p(-2), fr_rn: p(-1), fr_reconquete: p(-2), fr_upr: p(-1), fr_patriotes: p(-2),
        fr_renaissance: p(1), fr_lr: p(0), fr_eelv: p(1), fr_ps: p(1),
        be_ptb: p(-2), be_mr: p(0), be_ps: p(1), be_ecolo: p(1),
        be_engages: p(2), be_nva: p(0), be_vb: p(-1),
        fr_pcf: p(-1), fr_horizons: p(1), fr_modem: p(2),
        be_vooruit: p(1), be_openvld: p(1), be_cdv: p(2), be_groen: p(1), be_defi: p(1)
    },
    mo2: { // Effectiveness before principles
        fr_lfi: p(-1), fr_rn: p(1), fr_reconquete: p(1), fr_upr: p(0), fr_patriotes: p(0),
        fr_renaissance: p(2), fr_lr: p(1), fr_eelv: p(-2), fr_ps: p(-1),
        be_ptb: p(-1), be_mr: p(2), be_ps: p(-1), be_ecolo: p(-2),
        be_engages: p(-1), be_nva: p(2), be_vb: p(1),
        fr_pcf: p(-1), fr_horizons: p(2), fr_modem: p(-1),
        be_vooruit: p(1), be_openvld: p(2), be_cdv: p(0), be_groen: p(-2), be_defi: p(0)
    },
    mo3: { // Priority to the most vulnerable
        fr_lfi: p(2), fr_rn: p(0), fr_reconquete: p(-1), fr_upr: p(0), fr_patriotes: p(0),
        fr_renaissance: p(0), fr_lr: p(-1), fr_eelv: p(2), fr_ps: p(2),
        be_ptb: p(2), be_mr: p(-1), be_ps: p(2), be_ecolo: p(2),
        be_engages: p(2), be_nva: p(-1), be_vb: p(-1),
        fr_pcf: p(2), fr_horizons: p(0), fr_modem: p(1),
        be_vooruit: p(2), be_openvld: p(-1), be_cdv: p(1), be_groen: p(2), be_defi: p(1)
    },
    mo4: { // Fidelity to the country's history and identity
        fr_lfi: p(-1), fr_rn: p(2), fr_reconquete: p(2), fr_upr: p(1), fr_patriotes: p(2),
        fr_renaissance: p(0), fr_lr: p(2), fr_eelv: p(-2), fr_ps: p(-1),
        be_ptb: p(-1), be_mr: p(0), be_ps: p(-1), be_ecolo: p(-2),
        be_engages: p(0), be_nva: p(2), be_vb: p(2),
        fr_pcf: p(0), fr_horizons: p(1), fr_modem: p(1),
        be_vooruit: p(-1), be_openvld: p(0), be_cdv: p(1), be_groen: p(-2), be_defi: p(-1)
    },

    // --- FRANCE-SPECIFIC STATEMENTS ---
    pw3_fr: { // Decentralization to regions and municipalities
        fr_lfi: p(-1), fr_rn: p(-1), fr_reconquete: p(-1), fr_upr: p(-1), fr_patriotes: p(-1),
        fr_renaissance: p(1), fr_lr: p(1), fr_eelv: p(2), fr_ps: p(1),
        fr_pcf: p(-1), fr_horizons: p(1), fr_modem: p(1)
    },
    ec5_fr: { // Legal retirement age back to 62
        fr_lfi: p(2, { label: "L'Avenir en commun: retraite à 60 ans, a minima abrogation de 2023" }),
        fr_rn: p(2), fr_reconquete: p(0), fr_upr: p(2), fr_patriotes: p(1),
        fr_renaissance: p(-2, { label: "Réforme des retraites 2023, portée par la majorité" }),
        fr_lr: p(-2), fr_eelv: p(2), fr_ps: p(2),
        fr_pcf: p(2), fr_horizons: p(-2), fr_modem: p(-1)
    },
    so5_fr: { // Stricter application of laicite, including in public space
        fr_lfi: p(-1), fr_rn: p(2), fr_reconquete: p(2), fr_upr: p(1), fr_patriotes: p(2),
        fr_renaissance: p(1), fr_lr: p(2), fr_eelv: p(-1), fr_ps: p(0),
        fr_pcf: p(0), fr_horizons: p(1), fr_modem: p(0)
    },
    // Added 2026-08-29 (CHANGELOG-DONNEES.md): the formulated exits. +2 is
    // reserved for parties whose program states the exit itself; wanting to
    // renegotiate, disobey the treaties or leave only NATO's integrated
    // command is a different documented answer, not a milder shade of the
    // same one.
    ge8_fr: { // France should leave the European Union
        fr_lfi: p(-1, { label: "L'Avenir en commun: désobéir aux traités, pas de sortie" }),
        fr_rn: p(-1, { label: "Abandon du Frexit, réforme de l'UE de l'intérieur", date: "2019" }),
        fr_reconquete: p(-1, { label: "Europe des nations, pas de sortie" }),
        fr_upr: p(2, { label: "UPR: sortie de l'UE par l'article 50, cœur du programme" }),
        fr_patriotes: p(2, { label: "Les Patriotes: Frexit par référendum" }),
        fr_renaissance: p(-2), fr_lr: p(-2), fr_eelv: p(-2), fr_ps: p(-2),
        fr_pcf: p(-1, { label: "Sortie des traités demandée, pas de l'Union" }),
        fr_horizons: p(-2), fr_modem: p(-2)
    },
    ge9_fr: { // France should leave NATO altogether, not only its integrated command
        fr_lfi: p(2, { label: "L'Avenir en commun: sortir de l'OTAN" }),
        fr_rn: p(-1, { label: "Sortie du seul commandement intégré" }),
        fr_reconquete: p(-1, { label: "Sortie du seul commandement intégré" }),
        fr_upr: p(2, { label: "UPR: sortie de l'OTAN" }),
        fr_patriotes: p(2, { label: "Les Patriotes: sortie de l'OTAN" }),
        fr_renaissance: p(-2), fr_lr: p(-2), fr_eelv: p(-2), fr_ps: p(-2),
        fr_pcf: p(1, { label: "Sortie du commandement intégré, dissolution des blocs à terme" }),
        fr_horizons: p(-2), fr_modem: p(-2)
    },

    // --- BELGIUM-SPECIFIC STATEMENTS ---
    pw3_be: { // Further transfer of federal competences to Regions and Communities
        be_ptb: p(-2, { label: "PTB-PVDA: refédéralisation, position unitariste assumée" }),
        be_mr: p(-1), be_ps: p(-2),
        // Ecolo and Groen published ONE common institutional vision, so they
        // carry one identical coding. A differentiating value was briefly
        // written here to break their tie in the ranking; the sources say they
        // do not differ, and inventing a difference to help the algorithm is
        // exactly what this file forbids. See CHANGELOG-DONNEES.md, 2026-08-29.
        be_ecolo: p(-1, {
            label: "Ecolo-Groen, vision commune: du fédéralisme de blocage au fédéralisme collaboratif",
            url: "https://ecolo.be/actualites/ecolo-et-groen-avancent-une-vision-commune-du-federalisme-de-blocage-au-federalisme-collaboratif/",
            date: "2024-01-13"
        }),
        be_engages: p(-1),
        be_nva: p(2, { label: "N-VA: confédéralisme" }),
        be_vb: p(2), be_vooruit: p(0), be_openvld: p(1), be_cdv: p(1),
        be_groen: p(-1, {
            label: "Ecolo-Groen, vision commune: samenwerkingsfederalisme in plaats van blokkeringsfederalisme",
            url: "https://www.groen.be/staatshervorming-samenwerkingsfederalisme",
            date: "2024-01-13"
        }),
        be_defi: p(-2, { label: "DéFI: refédéralisation, défense des francophones" })
    },
    ec5_be: { // Unemployment benefits limited in time
        be_ptb: p(-2), be_mr: p(2, { label: "MR: limitation dans le temps, accord de gouvernement fédéral 2025" }),
        be_ps: p(-2), be_ecolo: p(-2), be_engages: p(1),
        be_nva: p(2), be_vb: p(1), be_vooruit: p(-1), be_openvld: p(2), be_cdv: p(1),
        be_groen: p(-2), be_defi: p(0)
    },
    so5_be: { // Regularisation of long-term undocumented residents
        be_ptb: p(2), be_mr: p(-1), be_ps: p(2), be_ecolo: p(2), be_engages: p(1),
        be_nva: p(-2), be_vb: p(-2), be_vooruit: p(0), be_openvld: p(-1), be_cdv: p(0),
        be_groen: p(2), be_defi: p(1)
    }
};
