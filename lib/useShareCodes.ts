"use client";

import { useEffect, useState } from "react";
import { readShareUrl, ShareUrl } from "@/lib/shareLink";

/**
 * Reads share codes from the URL, once the component has mounted.
 *
 * Mounting is the earliest this can happen: the server never receives the
 * fragment, so rendering from it during the server pass would produce a
 * hydration mismatch. Until then the hook returns null, which callers render
 * as "not decided yet" rather than as "no profile".
 *
 * All the decisions live in `readShareUrl`, which is a pure function over a
 * URL string and is tested as one. This hook only does what a pure function
 * cannot: read the current location, write it back, and re-read it when the
 * fragment changes under the page.
 *
 * `keys` is read through its joined form, so passing a fresh array on every
 * render does not restart the effect.
 */
export function useShareCodes(keys: readonly string[]): ShareUrl["codes"] | null {
    const signature = keys.join(",");
    const [codes, setCodes] = useState<ShareUrl["codes"] | null>(null);

    useEffect(() => {
        const wanted = signature === "" ? [] : signature.split(",");

        const read = () => {
            const result = readShareUrl(window.location.href, wanted);
            if (result.href !== window.location.href) {
                window.history.replaceState(null, "", result.href);
            }
            setCodes(result.codes);
        };

        read();
        window.addEventListener("hashchange", read);
        return () => window.removeEventListener("hashchange", read);
    }, [signature]);

    return codes;
}
