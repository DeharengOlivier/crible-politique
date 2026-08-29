import {
    PowerArchetype,
    EconomyArchetype,
    GeopoliticsArchetype,
    SocialArchetype,
    EnvironmentArchetype,
    KnowledgeArchetype,
    MoralArchetype
} from "@/types/archetypes";
import { ArchetypeSignature, DimensionKey } from "@/types/positions";

// Signature = the answers a typical supporter of the current would give to the
// statements of its dimension. An archetype's score is the similarity between
// the respondent's answers and this signature (public formula, see
// METHODOLOGY.md).
//
// Every signature of a dimension covers EXACTLY the same statements, and that
// is a correctness property, not a style rule. Signatures used to be partial:
// each archetype was scored on its own subset, so a one-statement signature hit
// 100% on a single answer while a four-statement one almost never could. On
// 20 000 simulated respondents the one-statement archetypes won 15 to 19% of
// the time and the four-statement ones 1 to 2%: the dominant current returned
// to a respondent said more about how the signature had been written than about
// what they had answered. Complete signatures put every archetype on the same
// footing, and two consequences follow that a test holds:
//   - no two archetypes of a dimension may share a signature, otherwise the
//     second is unreachable for ever (this had happened: "Technocrate
//     rationaliste" and "Élitiste éclairé" were the same two values);
//   - with complete and distinct signatures, answering exactly a signature
//     scores it at 100 and everything else strictly below, so every archetype
//     is reachable by construction.
//
// Signatures cover the statements COMMON to both countries only. A
// country-scoped statement measures a cleavage that has no counterpart in the
// other country, so an archetype built on it could not be the same archetype in
// both. Country statements feed the party comparison and the compass, not the
// taxonomy.
//
// Signatures are published editorial hypotheses: any challenge can be raised
// statement by statement through the public procedure (GOVERNANCE.md section 3);
// changes are recorded in CHANGELOG-DONNEES.md.

export interface DimensionSignatures {
    dimension: DimensionKey;
    signatures: Record<string, ArchetypeSignature>;
}

export const ARCHETYPE_SIGNATURES: DimensionSignatures[] = [
    {
        // pw1 state planning | pw2 citizen referendum | pw4 surveillance powers
        dimension: "power",
        signatures: {
            [PowerArchetype.EtatistePlanificateur]: { pw1: 2, pw2: 0, pw4: 1 },
            [PowerArchetype.TechnocrateRationaliste]: { pw1: 1, pw2: -2, pw4: 1 },
            [PowerArchetype.LibertarienIndividualiste]: { pw1: -2, pw2: 1, pw4: -2 },
            [PowerArchetype.CentralisateurJacobin]: { pw1: 2, pw2: -1, pw4: 2 },
            [PowerArchetype.DecentralisateurGirondin]: { pw1: -1, pw2: 1, pw4: -1 },
            [PowerArchetype.PopulisteReferendaire]: { pw1: 1, pw2: 2, pw4: 0 },
            [PowerArchetype.RepublicainHumaniste]: { pw1: 0, pw2: -1, pw4: -1 },
            [PowerArchetype.ElitisteEclaire]: { pw1: 1, pw2: -2, pw4: 0 },
            [PowerArchetype.PartisanOrdre]: { pw1: 0, pw2: 0, pw4: 2 },
            [PowerArchetype.DemocratePluraliste]: { pw1: 0, pw2: 1, pw4: -1 },
            [PowerArchetype.AnarchisteHorizontal]: { pw1: -2, pw2: 2, pw4: -2 },
            [PowerArchetype.TechnopragmatiqueGestionnaire]: { pw1: 0, pw2: -1, pw4: 1 }
        }
    },
    {
        // ec1 taxing high incomes | ec2 public essential services
        // ec3 trade protection | ec4 debt reduction first
        dimension: "economy",
        signatures: {
            [EconomyArchetype.CapitalisteNeoliberal]: { ec1: -2, ec2: -2, ec3: -1, ec4: 1 },
            [EconomyArchetype.SocialDemocrateRedistributif]: { ec1: 2, ec2: 1, ec3: 0, ec4: -1 },
            [EconomyArchetype.CorporatisteProtectionniste]: { ec1: 0, ec2: 1, ec3: 2, ec4: 0 },
            [EconomyArchetype.KeynesienProductiviste]: { ec1: 1, ec2: 1, ec3: 1, ec4: -2 },
            [EconomyArchetype.DirigisteColbertiste]: { ec1: 1, ec2: 2, ec3: 1, ec4: -1 },
            [EconomyArchetype.Altermondialiste]: { ec1: 2, ec2: 1, ec3: 0, ec4: -2 },
            [EconomyArchetype.LibertarienMarchePur]: { ec1: -2, ec2: -2, ec3: -2, ec4: 2 },
            [EconomyArchetype.EcologisteDecroissant]: { ec1: 1, ec2: 1, ec3: 1, ec4: 0 },
            [EconomyArchetype.TechnoprogressisteGreenGrowth]: { ec1: 0, ec2: -1, ec3: -1, ec4: 0 },
            [EconomyArchetype.CommunautaristeSolidaire]: { ec1: 1, ec2: 1, ec3: 2, ec4: -1 },
            [EconomyArchetype.PhilanthroCapitaliste]: { ec1: -1, ec2: -1, ec3: -1, ec4: 0 },
            [EconomyArchetype.RigoristeBudgetaire]: { ec1: -1, ec2: -1, ec3: 0, ec4: 2 }
        }
    },
    {
        // ge1 repatriating EU competences | ge2 NATO membership
        // ge3 immigration as an opportunity | ge4 military intervention abroad
        dimension: "geopolitics",
        signatures: {
            [GeopoliticsArchetype.GaullisteSouverainiste]: { ge1: 2, ge2: -2, ge3: 0, ge4: 1, ge5: 0, ge6: 1, ge7: -1 },
            [GeopoliticsArchetype.AtlantisteLiberal]: { ge1: -1, ge2: 2, ge3: 1, ge4: 1, ge5: 2, ge6: -1, ge7: 1 },
            [GeopoliticsArchetype.EurasiatisteContinental]: { ge1: 1, ge2: -2, ge3: -1, ge4: -1, ge5: -2, ge6: 2, ge7: 0 },
            [GeopoliticsArchetype.NonInterventionnisteIsolationniste]: { ge1: 1, ge2: -1, ge3: 0, ge4: -2, ge5: -1, ge6: 1, ge7: 0 },
            [GeopoliticsArchetype.InterventionnisteNeoconservateur]: { ge1: -1, ge2: 2, ge3: 0, ge4: 2, ge5: 2, ge6: -2, ge7: 2 },
            [GeopoliticsArchetype.MultilateralisteOnusien]: { ge1: -1, ge2: 0, ge3: 1, ge4: 0, ge5: 1, ge6: 0, ge7: -1 },
            [GeopoliticsArchetype.InternationalisteTiersMondiste]: { ge1: 0, ge2: -2, ge3: 2, ge4: -1, ge5: -1, ge6: 0, ge7: -2 },
            [GeopoliticsArchetype.DecolonialPostOccidental]: { ge1: -1, ge2: -2, ge3: 2, ge4: -2, ge5: -1, ge6: 1, ge7: -2 },
            [GeopoliticsArchetype.CivilisationnisteCulturaliste]: { ge1: 1, ge2: 1, ge3: -2, ge4: 0, ge5: 0, ge6: 0, ge7: 2 },
            [GeopoliticsArchetype.MondialisteCosmopolite]: { ge1: -2, ge2: 1, ge3: 2, ge4: 0, ge5: 1, ge6: -1, ge7: 0 },
            [GeopoliticsArchetype.SouverainisteProtectionniste]: { ge1: 2, ge2: -1, ge3: -1, ge4: -1, ge5: -1, ge6: 1, ge7: 0 }
        }
    },
    {
        // so1 extending societal rights | so2 group-based corrective policies
        // so3 assimilation of newcomers | so4 legalising cannabis
        dimension: "social",
        signatures: {
            [SocialArchetype.ConservateurMoral]: { so1: -2, so2: -1, so3: 1, so4: -1 },
            [SocialArchetype.ProgressisteSocietal]: { so1: 2, so2: 1, so3: -1, so4: 1 },
            [SocialArchetype.TraditionnalisteReligieux]: { so1: -2, so2: -1, so3: 2, so4: -2 },
            [SocialArchetype.LibertaireHedoniste]: { so1: 2, so2: 0, so3: -1, so4: 2 },
            [SocialArchetype.NationalIdentitaire]: { so1: -1, so2: -2, so3: 2, so4: -1 },
            [SocialArchetype.MulticulturalisteTolerant]: { so1: 1, so2: 1, so3: -2, so4: 1 },
            [SocialArchetype.AssimilationnisteRepublicain]: { so1: 1, so2: -1, so3: 2, so4: 0 },
            [SocialArchetype.FeministeUniversaliste]: { so1: 2, so2: 1, so3: 0, so4: 0 },
            [SocialArchetype.IntersectionnelMilitant]: { so1: 2, so2: 2, so3: -2, so4: 1 },
            [SocialArchetype.EgalitaristeCompassionnel]: { so1: 1, so2: 1, so3: 0, so4: 0 },
            [SocialArchetype.MeritocrateExigeant]: { so1: 0, so2: -2, so3: 1, so4: 0 },
            [SocialArchetype.UniversalisteCritique]: { so1: 1, so2: -2, so3: 1, so4: 1 }
        }
    },
    {
        // en1 nuclear in the mix | en2 accepting consumption constraints
        // en3 technology suffices | en4 environment over economic projects
        dimension: "environment",
        signatures: {
            [EnvironmentArchetype.EcologisteRadical]: { en1: -1, en2: 2, en3: -2, en4: 2 },
            [EnvironmentArchetype.EcomodernisteTechnophile]: { en1: 2, en2: -1, en3: 2, en4: 0 },
            [EnvironmentArchetype.ProductivisteEconomique]: { en1: 2, en2: -2, en3: 1, en4: -2 },
            [EnvironmentArchetype.PostCroissanceLocaliste]: { en1: -1, en2: 2, en3: -2, en4: 1 },
            [EnvironmentArchetype.TechnocrateVert]: { en1: 0, en2: 1, en3: 0, en4: 1 },
            [EnvironmentArchetype.BioConservateur]: { en1: -1, en2: 1, en3: -1, en4: 1 },
            [EnvironmentArchetype.TranshumanistePostHumain]: { en1: 1, en2: -1, en3: 2, en4: -1 },
            [EnvironmentArchetype.SpiritualisteEcologique]: { en1: -2, en2: 1, en3: -2, en4: 2 }
        }
    },
    {
        // kn1 scientific consensus over opinion | kn2 established media are reliable
        // kn3 lived experience weighs as much as expertise | kn4 broad free speech
        dimension: "knowledge",
        signatures: {
            [KnowledgeArchetype.RationalisteScientiste]: { kn1: 2, kn2: 1, kn3: -1, kn4: 1 },
            [KnowledgeArchetype.TechnocrateExpertCentre]: { kn1: 2, kn2: 1, kn3: -2, kn4: 0 },
            [KnowledgeArchetype.EmpiristePragmatique]: { kn1: 0, kn2: 0, kn3: 2, kn4: 1 },
            [KnowledgeArchetype.RelativisteCulturel]: { kn1: -1, kn2: 0, kn3: 1, kn4: 0 },
            [KnowledgeArchetype.SceptiqueCartesien]: { kn1: 1, kn2: -1, kn3: 1, kn4: 2 },
            [KnowledgeArchetype.CroyantMystique]: { kn1: -2, kn2: -1, kn3: 1, kn4: 0 },
            [KnowledgeArchetype.DefiantInstitutionnel]: { kn1: -1, kn2: -2, kn3: 1, kn4: 2 },
            [KnowledgeArchetype.BonSensExperientiel]: { kn1: -1, kn2: 0, kn3: 2, kn4: 1 },
            [KnowledgeArchetype.MeritocrateCognitif]: { kn1: 1, kn2: 1, kn3: -2, kn4: 1 },
            [KnowledgeArchetype.PopulisteAntiElite]: { kn1: -1, kn2: -2, kn3: 2, kn4: 1 }
        }
    },
    {
        // mo1 compromise over conviction | mo2 effectiveness over principles
        // mo3 protecting the vulnerable first | mo4 fidelity to history and identity
        dimension: "moral",
        signatures: {
            [MoralArchetype.MoralisteUniversaliste]: { mo1: -1, mo2: -2, mo3: 1, mo4: -1 },
            [MoralArchetype.PragmatiqueDesideologise]: { mo1: 2, mo2: 2, mo3: 0, mo4: 0 },
            [MoralArchetype.RealisteEtat]: { mo1: 1, mo2: 2, mo3: -1, mo4: 1 },
            [MoralArchetype.RealisteInterets]: { mo1: 1, mo2: 1, mo3: -1, mo4: 0 },
            [MoralArchetype.CompassionnelHumanitaire]: { mo1: 0, mo2: -1, mo3: 2, mo4: -1 },
            [MoralArchetype.NationalRomantique]: { mo1: -1, mo2: 0, mo3: 0, mo4: 2 },
            [MoralArchetype.CivilisationnisteMissionnaire]: { mo1: -1, mo2: 1, mo3: -1, mo4: 2 },
            [MoralArchetype.FatalisteHistoriciste]: { mo1: 1, mo2: 1, mo3: -1, mo4: 1 },
            [MoralArchetype.RevoltePrometheen]: { mo1: -2, mo2: -1, mo3: 1, mo4: -2 },
            [MoralArchetype.SpiritualisteTranscendant]: { mo1: 0, mo2: -2, mo3: 1, mo4: 1 },
            [MoralArchetype.IntransigeantMoral]: { mo1: -2, mo2: -2, mo3: 0, mo4: 0 },
            [MoralArchetype.DualisteStrategique]: { mo1: 1, mo2: 2, mo3: 0, mo4: 1 },
            [MoralArchetype.ComplexisteRelativiste]: { mo1: 2, mo2: 0, mo3: 1, mo4: 0 },
            [MoralArchetype.Desabuse]: { mo1: 0, mo2: 1, mo3: -1, mo4: -1 }
        }
    }
];
