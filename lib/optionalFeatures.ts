import { cribleApiBaseUrl } from "@/lib/cribleApi";

// Which of the two optional features this deployment actually runs. The site
// works fully without either: the default build is the client-only tool that
// sends nothing anywhere, and each feature turns on only when its own
// configuration exists.
//
// One rule, held here so no surface can drift from it: a feature that is not
// configured is not exposed. Not as a page, not as a link, not as a sentence
// promising what the site collects. Reading the flags in one place is what
// makes that rule checkable.

export function googleClientId(): string | null {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId === undefined || clientId.length === 0) return null;
    return clientId;
}

/** Anonymous aggregate counters, and the public page that reads them back. */
export function publicStatisticsEnabled(): boolean {
    return cribleApiBaseUrl() !== null;
}

/** Encrypted profile vaults: needs the API to store them and Google to name them. */
export function profileVaultEnabled(): boolean {
    return cribleApiBaseUrl() !== null && googleClientId() !== null;
}

/**
 * Cookieless audience measurement. Unset means the script is never injected,
 * and therefore that no analytics processor may be declared: /legal listed
 * Plausible for two days on a production deployment that had never set this
 * (measured 2026-08-31), which announces a transfer that does not happen.
 *
 * The measurement moved off Plausible on 2026-09-12 to a self-hosted Umami,
 * which is why this is now a website id and no longer a domain: Umami names
 * the site by an opaque identifier issued by the instance. The processor row
 * on /legal moved with it, from Plausible to the host of that instance.
 */
export function analyticsWebsiteId(): string | null {
    const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
    if (websiteId === undefined || websiteId.length === 0) return null;
    return websiteId;
}

/**
 * What our hosts' sight of an IP address is used for. Two pages state it, so it
 * lives here: they must never disagree, and neither may contradict the running
 * configuration. /legal once listed Plausible on a deployment that measured
 * nothing; on 2026-09-12 the opposite happened, and the flat denial below
 * stayed on /confidentialite while the measurement was switched on in
 * production. Both are the same defect, in opposite directions.
 */
export function ipUsageSentence(): string {
    if (analyticsWebsiteId() === null) {
        return "Nous ne les croisons avec rien, et aucune mesure d'audience ne tourne sur ce site.";
    }
    return "Nous ne les croisons avec rien. La mesure d'audience s'en sert le temps de la requête pour calculer un identifiant de visite, recalculé chaque jour, et l'adresse elle-même n'est conservée nulle part.";
}
