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
 */
export function analyticsDomain(): string | null {
    const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
    if (domain === undefined || domain.length === 0) return null;
    return domain;
}
