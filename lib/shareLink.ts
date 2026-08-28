// Share links carry a profile code, and a profile code encodes someone's
// answers to 28 political statements: special-category data under GDPR
// article 9. It therefore travels in the URL fragment.
//
// A fragment is the one part of a URL a browser keeps to itself. It is not in
// the request line, so it never reaches a server log, a CDN, an edge function
// or a link-preview crawler, and it is stripped from the Referer header sent
// to third parties. A path segment or a query string has none of those
// properties: both are transmitted on every request for the document.

const HASH = "#";

// Values that mean "this key carries nothing". Emitting `a=` would make a link
// look like it carries a profile when it does not.
function isEmpty(value: string | null | undefined): boolean {
    return value === null || value === undefined || value === "";
}

/**
 * Builds the fragment of a share link, leading "#" included.
 *
 * Returns an empty string when nothing is left to carry, so a link without a
 * profile does not end in a bare "#". Keys appear in the order given.
 */
export function shareFragment(codes: Record<string, string>): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(codes)) {
        if (isEmpty(value)) continue;
        params.set(key, value);
    }
    const body = params.toString();
    return body === "" ? "" : `${HASH}${body}`;
}

/**
 * Reads one code out of a location hash.
 *
 * Accepts the hash with or without its leading "#", which is what
 * `window.location.hash` gives on a URL that has one and on one that does not.
 * Returns null for a missing key, an empty value, and for a plain anchor such
 * as "#results", none of which carry a profile.
 */
export function readShareParam(
    hash: string | null | undefined,
    key: string
): string | null {
    if (hash === null || hash === undefined || hash === "") return null;
    const body = hash.startsWith(HASH) ? hash.slice(HASH.length) : hash;
    const value = new URLSearchParams(body).get(key);
    return isEmpty(value) ? null : value;
}

// A URL as this application wants it: share codes in the fragment, and the
// codes it carries, one entry per key asked for.
export interface ShareUrl {
    href: string;
    codes: Record<string, string | null>;
}

/**
 * Reads the share codes of a URL, and returns the URL with any code that was
 * still in the query string moved into the fragment.
 *
 * Links minted before the fragment form existed carry the code as a query
 * parameter, and they are in people's messages and bookmarks. They keep
 * working, but the code is moved: it has already reached the server on that
 * one request, and moving it stops it travelling any further with the address
 * bar, with the Referer header of every asset the page loads afterwards, with
 * a bookmark, or with a synced tab.
 *
 * The fragment wins when a URL somehow carries both, and query parameters that
 * are not share codes are left where they are.
 */
export function readShareUrl(href: string, keys: readonly string[]): ShareUrl {
    const url = new URL(href);
    const fragment = new URLSearchParams(
        url.hash.startsWith(HASH) ? url.hash.slice(HASH.length) : url.hash
    );

    const codes: Record<string, string | null> = {};
    let moved = false;

    for (const key of keys) {
        const inFragment = fragment.get(key);
        const inQuery = url.searchParams.get(key);
        codes[key] = isEmpty(inFragment) ? (isEmpty(inQuery) ? null : inQuery) : inFragment;

        if (isEmpty(inQuery)) continue;
        url.searchParams.delete(key);
        if (isEmpty(inFragment)) fragment.set(key, inQuery as string);
        moved = true;
    }

    if (!moved) return { href, codes };

    const body = fragment.toString();
    const rewritten = `${url.origin}${url.pathname}${url.search}${body === "" ? "" : HASH + body}`;
    return { href: rewritten, codes };
}
