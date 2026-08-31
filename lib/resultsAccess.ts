import type { Country } from "@/types/positions";

/**
 * Who may read a set of results, and why.
 *
 * Since 2026-08-31 a deployment that offers profile accounts asks a respondent
 * to sign in before it opens their own results. Three things about that rule
 * have to be said plainly, because a reader who cannot check a claim has to
 * take it on faith, which is exactly what this site refuses to ask of anyone:
 *
 *   - It is a product decision, never a security control. The scoring runs in
 *     the browser from published data, so anyone can compute the same result
 *     without this file. The frontend is not a security boundary here and is
 *     not pretending to be one: nothing behind this gate is a secret, and no
 *     server-side authorization depends on it.
 *   - It never applies to a deployment that has no accounts to offer. A fork
 *     with no API configured shows a wall nobody could pass, which is worse
 *     than no gate at all.
 *   - It never applies to a profile someone else shared. That profile arrived
 *     in a link, it is not the reader's own analysis, and asking a recipient
 *     for an account before they may look at it would break sharing without
 *     protecting anything.
 *
 * The answers themselves are untouched by all of this: they stay in the
 * browser, gate open or closed, and signing out gives them back.
 */
export type ResultsAccess = "open" | "sign_in_required";

export interface ResultsAudience {
    /** Does this deployment offer profile accounts at all? */
    accountsOffered: boolean;
    /** Is a Google account currently signed in on this device? */
    signedIn: boolean;
    /** Did these answers arrive in a shared link rather than from this reader? */
    fromSharedLink: boolean;
}

export function resultsAccess(audience: ResultsAudience): ResultsAccess {
    if (!audience.accountsOffered) return "open";
    if (audience.fromSharedLink) return "open";
    return audience.signedIn ? "open" : "sign_in_required";
}

/**
 * What the reader keeps while the gate is closed, said in their own terms.
 * Kept next to the rule rather than in the component, so the promise and the
 * behaviour cannot drift apart.
 */
export function answersKeptWhileGated(country: Country): string {
    const where = country === "FR" ? "France" : "Belgique";
    return `Vos réponses (${where}) restent sur cet appareil: elles ne sont pas perdues, et se déconnecter n'y touche pas.`;
}
