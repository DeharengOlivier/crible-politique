/**
 * Which analysis a reader asked for when they opened the test.
 *
 * The express analysis asks 15 statements and takes about three minutes; the
 * complete one asks the whole corpus. Both always existed, but the complete one
 * was only reachable after finishing the express one and accepting an offer to
 * continue, so a reader who arrived wanting to answer everything had to answer
 * fifteen statements before being allowed to.
 */
export type AnalysisMode = "express" | "complete";

/**
 * The analysis named by a URL, or null when the URL names none.
 *
 * The value arrives from the address bar, so it is untrusted input and is
 * narrowed to one of the two analyses the site offers. Anything else, including
 * a near miss like "complet", is read as naming none: the reader is then shown
 * the introduction and chooses, which is the honest reading of an address that
 * did not say. Nothing here throws, because a mistyped address is not an error
 * a reader should have to understand.
 */
export function requestedAnalysis(raw: string | null | undefined): AnalysisMode | null {
    if (raw === "express" || raw === "complete") return raw;
    return null;
}
