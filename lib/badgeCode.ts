import { ArchetypeLabelMap, DimensionKey, DIMENSION_ORDER } from "@/types/positions";
import { BADGE_ALPHABET } from "@/data/badgeAlphabet";
import { closestSyntheticProfile, computeProfile, ProfileResult } from "@/lib/scoringEngine";
import { decodeAnswers } from "@/lib/profileCode";
import { SyntheticProfile } from "@/data/syntheticProfiles";

// The code a shared profile URL carries in its path.
//
// A path is transmitted: it reaches the access log, the CDN and every
// link-preview crawler that follows the link. The answer code (lib/profileCode)
// therefore has no business being there, because it names someone's position on
// 28 political statements, which is special-category data under GDPR article 9.
//
// A badge code names only what the shared page shows: the dominant current of
// thought per dimension, and the synthetic profile those imply. It is one
// character per dimension, so it cannot be a re-encoding of the answers: seven
// characters over a 37-symbol alphabet cannot address 6^28 answer sets. The
// full answers still travel with a share link, in the fragment, which the
// browser does not transmit.

const VERSION = "2";

// Index -> character. Position i of a dimension's list in BADGE_ALPHABET is
// written as SYMBOLS[i].
const SYMBOLS = "0123456789abcdefghijklmnopqrstuvwxyz";

// A dimension where the answers determined no dominant archetype.
const NONE = "-";

/** Length of a badge code: the version marker plus one character per dimension. */
export const BADGE_CODE_LENGTH = 1 + DIMENSION_ORDER.length;

export interface BadgeIdentity {
    // Dominant archetype label per dimension. A dimension the profile did not
    // determine is absent, exactly as it is absent from a computed profile.
    dimensionLabels: Partial<Record<DimensionKey, string>>;
    syntheticProfile: SyntheticProfile | null;
    /**
     * The families these dominant currents do not separate from the one above,
     * that one first. A shared card is read as a claim about a person, so it
     * carries the same reservation the results page carries rather than
     * presenting the closest family as the only one that fits.
     */
    leadingGroup: SyntheticProfile[];
}

/** Encodes the identity layer of a profile, and nothing else. */
export function encodeBadge(profile: ProfileResult): string {
    const body = DIMENSION_ORDER.map((dimension) => {
        const label = profile.dimensionArchetypes[dimension]?.label;
        if (label === undefined) return NONE;
        const index = BADGE_ALPHABET[dimension].indexOf(label);
        // An archetype missing from the frozen alphabet is a data error, caught
        // by the test suite. Encoding it as "unknown" is the safe reading: the
        // page shows one dimension less rather than the wrong current.
        return index < 0 || index >= SYMBOLS.length ? NONE : SYMBOLS[index];
    }).join("");
    return `${VERSION}${body}`;
}

/**
 * Decodes a badge code, or returns null when it is not one.
 *
 * The code arrives from a URL, so it is untrusted input: every character is
 * checked against the alphabet of its own dimension, and a code that names an
 * archetype that does not exist is rejected rather than partially read.
 */
export function decodeBadge(code: string | null | undefined): BadgeIdentity | null {
    if (!code || code.length !== BADGE_CODE_LENGTH || code[0] !== VERSION) return null;

    const dimensionLabels: Partial<Record<DimensionKey, string>> = {};

    for (let i = 0; i < DIMENSION_ORDER.length; i++) {
        const dimension = DIMENSION_ORDER[i];
        const symbol = code[i + 1];
        if (symbol === NONE) continue;

        const index = SYMBOLS.indexOf(symbol);
        if (index < 0) return null;

        const label = BADGE_ALPHABET[dimension][index];
        if (label === undefined) return null;

        dimensionLabels[dimension] = label;
    }

    const { family, leadingGroup } = fitFrom(dimensionLabels);
    return { dimensionLabels, syntheticProfile: family, leadingGroup };
}

function fitFrom(dimensionLabels: Partial<Record<DimensionKey, string>>) {
    // The matching rules read every dimension, and an undetermined one is an
    // empty label, the same convention computeProfile uses.
    const labels: ArchetypeLabelMap = {
        power: dimensionLabels.power ?? "",
        economy: dimensionLabels.economy ?? "",
        geopolitics: dimensionLabels.geopolitics ?? "",
        social: dimensionLabels.social ?? "",
        environment: dimensionLabels.environment ?? "",
        knowledge: dimensionLabels.knowledge ?? "",
        moral: dimensionLabels.moral ?? ""
    };
    return closestSyntheticProfile(labels);
}

/** The identity layer of a computed profile: what a shared page displays. */
export function badgeIdentityOf(profile: ProfileResult): BadgeIdentity {
    const dimensionLabels: Partial<Record<DimensionKey, string>> = {};
    for (const dimension of DIMENSION_ORDER) {
        const label = profile.dimensionArchetypes[dimension]?.label;
        if (label !== undefined) dimensionLabels[dimension] = label;
    }
    return {
        dimensionLabels,
        syntheticProfile: profile.syntheticProfile,
        leadingGroup: profile.syntheticProfileFit.leadingGroup
    };
}

/**
 * Reads the code in a /p/{code} URL, whichever generation it belongs to.
 *
 * New links carry a badge code. Links minted before badge codes existed carry
 * the full answer code, and they are in people's messages: they keep resolving
 * to the same page, from the same identity, for as long as they are clicked.
 */
export function identityFromShareCode(code: string | null | undefined): BadgeIdentity | null {
    const badge = decodeBadge(code);
    if (badge) return badge;

    const answers = decodeAnswers(code ?? "");
    return answers === null ? null : badgeIdentityOf(computeProfile(answers));
}
