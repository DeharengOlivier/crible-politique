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

// Signature = the answer pattern a typical supporter of the current would give
// to the statements of its dimension. An archetype's score is the similarity
// between the user's answers and this signature (public formula, see
// METHODOLOGY.md). Signatures are published editorial hypotheses: any challenge
// can be raised statement by statement through the public procedure
// (GOVERNANCE.md section 3); changes are recorded in CHANGELOG-DONNEES.md.

export interface DimensionSignatures {
    dimension: DimensionKey;
    signatures: Record<string, ArchetypeSignature>;
}

export const ARCHETYPE_SIGNATURES: DimensionSignatures[] = [
    {
        dimension: "power",
        signatures: {
            [PowerArchetype.EtatistePlanificateur]: { pw1: 2, pw3: -1 },
            [PowerArchetype.TechnocrateRationaliste]: { pw1: 1, pw2: -2 },
            [PowerArchetype.LibertarienIndividualiste]: { pw1: -2, pw4: -2, pw3: 1 },
            [PowerArchetype.CentralisateurJacobin]: { pw3: -2, pw1: 1 },
            [PowerArchetype.DecentralisateurGirondin]: { pw3: 2, pw1: -1 },
            [PowerArchetype.PopulisteReferendaire]: { pw2: 2 },
            [PowerArchetype.RepublicainHumaniste]: { pw4: -1, pw2: -1, pw1: 0 },
            [PowerArchetype.ElitisteEclaire]: { pw2: -2, pw1: 1 },
            [PowerArchetype.PartisanOrdre]: { pw4: 2 },
            [PowerArchetype.DemocratePluraliste]: { pw2: 1, pw3: 1, pw4: -1 },
            [PowerArchetype.AnarchisteHorizontal]: { pw1: -2, pw4: -2, pw3: 2, pw2: 1 },
            [PowerArchetype.TechnopragmatiqueGestionnaire]: { pw1: 0, pw2: -1, pw4: 1 }
        }
    },
    {
        dimension: "economy",
        signatures: {
            [EconomyArchetype.CapitalisteNeoliberal]: { ec1: -2, ec2: -2, ec3: -1, ec4: 1 },
            [EconomyArchetype.SocialDemocrateRedistributif]: { ec1: 2, ec2: 1, ec4: -1 },
            [EconomyArchetype.CorporatisteProtectionniste]: { ec3: 2, ec2: 1 },
            [EconomyArchetype.KeynesienProductiviste]: { ec4: -2, ec2: 1, ec1: 1 },
            [EconomyArchetype.DirigisteColbertiste]: { ec2: 2, ec3: 1 },
            [EconomyArchetype.Altermondialiste]: { ec1: 2, ec2: 1, ec3: 0 },
            [EconomyArchetype.LibertarienMarchePur]: { ec1: -2, ec2: -2, ec3: -2, ec4: 2 },
            [EconomyArchetype.EcologisteDecroissant]: { ec1: 1, ec4: -1, ec2: 1 },
            [EconomyArchetype.TechnoprogressisteGreenGrowth]: { ec2: -1, ec1: 0, ec4: 0 },
            [EconomyArchetype.CommunautaristeSolidaire]: { ec2: 1, ec3: 1, ec1: 1 },
            [EconomyArchetype.PhilanthroCapitaliste]: { ec1: -1, ec2: -1 },
            [EconomyArchetype.RigoristeBudgetaire]: { ec4: 2, ec1: -1 }
        }
    },
    {
        dimension: "geopolitics",
        signatures: {
            [GeopoliticsArchetype.GaullisteSouverainiste]: { ge1: 2, ge2: -2, ge4: 1 },
            [GeopoliticsArchetype.AtlantisteLiberal]: { ge2: 2, ge1: -1 },
            [GeopoliticsArchetype.EurasiatisteContinental]: { ge2: -2, ge1: 1 },
            [GeopoliticsArchetype.NonInterventionnisteIsolationniste]: { ge4: -2, ge2: -1 },
            [GeopoliticsArchetype.InterventionnisteNeoconservateur]: { ge4: 2, ge2: 2 },
            [GeopoliticsArchetype.MultilateralisteOnusien]: { ge1: -1, ge3: 1, ge4: 0 },
            [GeopoliticsArchetype.InternationalisteTiersMondiste]: { ge2: -2, ge3: 2, ge4: -1 },
            [GeopoliticsArchetype.DecolonialPostOccidental]: { ge2: -2, ge3: 2, ge1: 0 },
            [GeopoliticsArchetype.CivilisationnisteCulturaliste]: { ge3: -2, ge1: 1 },
            [GeopoliticsArchetype.MondialisteCosmopolite]: { ge3: 2, ge1: -2 },
            [GeopoliticsArchetype.SouverainisteProtectionniste]: { ge1: 2, ge3: -1 }
        }
    },
    {
        dimension: "social",
        signatures: {
            [SocialArchetype.ConservateurMoral]: { so1: -2, so4: -1 },
            [SocialArchetype.ProgressisteSocietal]: { so1: 2, so4: 1 },
            [SocialArchetype.TraditionnalisteReligieux]: { so1: -2, so4: -2, so3: 1 },
            [SocialArchetype.LibertaireHedoniste]: { so4: 2, so1: 2, so3: -1 },
            [SocialArchetype.NationalIdentitaire]: { so3: 2, so2: -2 },
            [SocialArchetype.MulticulturalisteTolerant]: { so3: -2, so2: 1 },
            [SocialArchetype.AssimilationnisteRepublicain]: { so3: 2, so2: -1, so1: 1 },
            [SocialArchetype.FeministeUniversaliste]: { so1: 1, so2: 1, so3: 0 },
            [SocialArchetype.IntersectionnelMilitant]: { so2: 2, so3: -2 },
            [SocialArchetype.EgalitaristeCompassionnel]: { so2: 1, so1: 1 },
            [SocialArchetype.MeritocrateExigeant]: { so2: -2 },
            [SocialArchetype.UniversalisteCritique]: { so2: -2, so3: 1, so1: 0 }
        }
    },
    {
        dimension: "environment",
        signatures: {
            [EnvironmentArchetype.EcologisteRadical]: { en2: 2, en4: 2, en3: -2, en1: -1 },
            [EnvironmentArchetype.EcomodernisteTechnophile]: { en1: 2, en3: 2, en2: -1 },
            [EnvironmentArchetype.ProductivisteEconomique]: { en4: -2, en2: -2, en3: 1 },
            [EnvironmentArchetype.PostCroissanceLocaliste]: { en2: 2, en3: -2, en1: -1 },
            [EnvironmentArchetype.TechnocrateVert]: { en4: 1, en2: 1, en1: 0, en3: 0 },
            [EnvironmentArchetype.BioConservateur]: { en4: 1, en3: -1 },
            [EnvironmentArchetype.TranshumanistePostHumain]: { en3: 2, en1: 1 },
            [EnvironmentArchetype.SpiritualisteEcologique]: { en4: 2, en3: -2 }
        }
    },
    {
        dimension: "knowledge",
        signatures: {
            [KnowledgeArchetype.RationalisteScientiste]: { kn1: 2, kn3: -1 },
            [KnowledgeArchetype.TechnocrateExpertCentre]: { kn1: 2, kn3: -2 },
            [KnowledgeArchetype.EmpiristePragmatique]: { kn3: 2, kn1: 0 },
            [KnowledgeArchetype.RelativisteCulturel]: { kn1: -1, kn3: 1 },
            [KnowledgeArchetype.SceptiqueCartesien]: { kn2: -1, kn1: 1, kn4: 1 },
            [KnowledgeArchetype.CroyantMystique]: { kn1: -2 },
            [KnowledgeArchetype.DefiantInstitutionnel]: { kn2: -2, kn4: 2, kn1: -1 },
            [KnowledgeArchetype.BonSensExperientiel]: { kn3: 2, kn1: -1 },
            [KnowledgeArchetype.MeritocrateCognitif]: { kn1: 1, kn3: -2 },
            [KnowledgeArchetype.PopulisteAntiElite]: { kn2: -2, kn3: 2 }
        }
    },
    {
        dimension: "moral",
        signatures: {
            [MoralArchetype.MoralisteUniversaliste]: { mo2: -2, mo3: 1 },
            [MoralArchetype.PragmatiqueDesideologise]: { mo2: 2, mo1: 1 },
            [MoralArchetype.RealisteEtat]: { mo2: 2, mo4: 1 },
            [MoralArchetype.RealisteInterets]: { mo2: 1, mo3: -1 },
            [MoralArchetype.CompassionnelHumanitaire]: { mo3: 2 },
            [MoralArchetype.NationalRomantique]: { mo4: 2 },
            [MoralArchetype.CivilisationnisteMissionnaire]: { mo4: 1, mo1: -1 },
            [MoralArchetype.FatalisteHistoriciste]: { mo1: 1, mo3: -1 },
            [MoralArchetype.RevoltePrometheen]: { mo1: -2, mo3: 1 },
            [MoralArchetype.SpiritualisteTranscendant]: { mo2: -2, mo4: 1 },
            [MoralArchetype.IntransigeantMoral]: { mo1: -2, mo2: -1 },
            [MoralArchetype.DualisteStrategique]: { mo2: 1, mo1: 1 },
            [MoralArchetype.ComplexisteRelativiste]: { mo1: 2, mo2: 0 },
            [MoralArchetype.Desabuse]: { mo3: -1, mo2: 1, mo1: 0 }
        }
    }
];
