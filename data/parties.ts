import { PoliticalParty } from "@/types/archetypes";

// Parties are no longer described by archetypes decreed by the editor
// (an unverifiable global judgment), but by their positions statement by
// statement in partyPositions.ts, each with a sourcing status.
// The program field documents the main reference used for the coding.

export const PARTIES: PoliticalParty[] = [
    // --- FRANCE ---
    {
        id: "fr_lfi",
        name: "La France Insoumise",
        country: "FR",
        program: { label: "L'Avenir en commun (programme 2022, actualisé)", url: "https://laec.fr", year: "2022" }
    },
    {
        id: "fr_rn",
        name: "Rassemblement National",
        country: "FR",
        program: { label: "Programme présidentielle 2022 / législatives 2024", url: "https://rassemblementnational.fr", year: "2024" }
    },
    {
        id: "fr_reconquete",
        name: "Reconquête",
        country: "FR",
        program: { label: "Programme présidentielle 2022", url: "https://parti-reconquete.fr", year: "2022" }
    },
    {
        id: "fr_upr",
        name: "Union Populaire Républicaine (UPR)",
        country: "FR",
        program: { label: "Programme de libération nationale", url: "https://www.upr.fr", year: "2022" }
    },
    {
        id: "fr_patriotes",
        name: "Les Patriotes",
        country: "FR",
        program: { label: "Programme officiel", url: "https://www.les-patriotes.fr", year: "2022" }
    },
    {
        id: "fr_renaissance",
        name: "Renaissance",
        country: "FR",
        program: { label: "Programme présidentielle 2022 / orientation 2024", url: "https://parti-renaissance.fr", year: "2024" }
    },
    {
        id: "fr_lr",
        name: "Les Républicains",
        country: "FR",
        program: { label: "Programme législatives 2024", url: "https://republicains.fr", year: "2024" }
    },
    {
        id: "fr_eelv",
        name: "Les Écologistes",
        country: "FR",
        program: { label: "Programme présidentielle 2022 / européennes 2024", url: "https://lesecologistes.fr", year: "2024" }
    },
    {
        id: "fr_ps",
        name: "Parti Socialiste",
        country: "FR",
        program: { label: "Programme législatives 2024 (NFP) / orientations propres", url: "https://parti-socialiste.fr", year: "2024" }
    },
    {
        id: "fr_pcf",
        name: "Parti Communiste Français",
        country: "FR",
        program: { label: "Programme présidentielle 2022 (La France des Jours Heureux)", url: "https://www.pcf.fr", year: "2022" }
    },
    {
        id: "fr_horizons",
        name: "Horizons",
        country: "FR",
        program: { label: "Orientations et prises de position publiques", url: "https://parti-horizons.fr", year: "2024" }
    },
    {
        id: "fr_modem",
        name: "MoDem",
        country: "FR",
        program: { label: "Orientations et prises de position publiques", url: "https://www.mouvementdemocrate.fr", year: "2024" }
    },

    // --- BELGIUM ---
    {
        id: "be_ptb",
        name: "PTB-PVDA",
        country: "BE",
        program: { label: "Programme fédéral 2024", url: "https://www.ptb.be", year: "2024" }
    },
    {
        id: "be_mr",
        name: "Mouvement Réformateur (MR)",
        country: "BE",
        program: { label: "Programme fédéral 2024", url: "https://www.mr.be", year: "2024" }
    },
    {
        id: "be_ps",
        name: "Parti Socialiste (PS)",
        country: "BE",
        program: { label: "Programme fédéral 2024", url: "https://www.ps.be", year: "2024" }
    },
    {
        id: "be_ecolo",
        name: "Ecolo",
        country: "BE",
        program: { label: "Programme fédéral 2024", url: "https://ecolo.be", year: "2024" }
    },
    {
        id: "be_engages",
        name: "Les Engagés",
        country: "BE",
        program: { label: "Programme fédéral 2024", url: "https://lesengages.be", year: "2024" }
    },
    {
        id: "be_nva",
        name: "N-VA",
        country: "BE",
        program: { label: "Programme fédéral 2024", url: "https://www.n-va.be", year: "2024" }
    },
    {
        id: "be_vb",
        name: "Vlaams Belang",
        country: "BE",
        program: { label: "Programme fédéral 2024", url: "https://www.vlaamsbelang.org", year: "2024" }
    },
    {
        id: "be_vooruit",
        name: "Vooruit",
        country: "BE",
        program: { label: "Programme fédéral 2024", url: "https://www.vooruit.org", year: "2024" }
    },
    {
        id: "be_openvld",
        name: "Open VLD",
        country: "BE",
        program: { label: "Programme fédéral 2024", url: "https://www.openvld.be", year: "2024" }
    },
    {
        id: "be_cdv",
        name: "CD&V",
        country: "BE",
        program: { label: "Programme fédéral 2024", url: "https://www.cdenv.be", year: "2024" }
    },
    {
        id: "be_groen",
        name: "Groen",
        country: "BE",
        program: { label: "Programme fédéral 2024", url: "https://www.groen.be", year: "2024" }
    },
    {
        id: "be_defi",
        name: "DéFI",
        country: "BE",
        program: { label: "Programme fédéral 2024", url: "https://defi.eu", year: "2024" }
    }
];

export const PARTIES_BY_ID: Record<string, PoliticalParty> = Object.fromEntries(
    PARTIES.map((p) => [p.id, p])
);
