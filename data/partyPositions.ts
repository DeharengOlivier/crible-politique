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
    pw3: { // Decentralization to regions and municipalities
        fr_lfi: p(-1), fr_rn: p(-1), fr_reconquete: p(-1), fr_upr: p(-1), fr_patriotes: p(-1),
        fr_renaissance: p(1), fr_lr: p(1), fr_eelv: p(2), fr_ps: p(1),
        be_ptb: p(-1, { label: "PTB: position unitariste (refédéralisation)" }),
        be_mr: p(0), be_ps: p(0), be_ecolo: p(1),
        be_engages: p(1), be_nva: p(2, { label: "N-VA: confédéralisme" }), be_vb: p(2),
        fr_pcf: p(-1), fr_horizons: p(1), fr_modem: p(1),
        be_vooruit: p(1), be_openvld: p(1), be_cdv: p(1), be_groen: p(1), be_defi: p(-1)
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
    }
};
