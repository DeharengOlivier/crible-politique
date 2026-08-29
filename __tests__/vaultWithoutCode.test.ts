import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { restoreProfileFromVault, saveProfileToVault } from "@/lib/vaultClient";
import type { VaultProfile } from "@/lib/profileVault";

// Signing in with Google is the whole credential. There is no recovery code to
// write down, no second secret, and nothing a reader can lose: the key is
// derived from their Google account by the API and used in this browser.
//
// The order of operations is still the security property, and it did not
// change: the profile is sealed here before anything is sent, and the
// plaintext never appears in a request.

const PROFILE: VaultProfile = {
    country: "FR",
    college: null,
    answers: { pw1: 2, ec1: -1 },
    savedAt: "2026-08-29T12:00:00.000Z"
};

const KEY = btoa(String.fromCharCode(...new Uint8Array(32).fill(7)));

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" }
    });
}

beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CRIBLE_API_URL", "https://api.example");
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

describe("saving a profile", () => {
    it("asks the API for the account's key, then uploads ciphertext only", async () => {
        const calls: { url: string; init?: RequestInit }[] = [];
        vi.stubGlobal(
            "fetch",
            vi.fn(async (url: string, init?: RequestInit) => {
                calls.push({ url: String(url), init });
                if (String(url).endsWith("/vault/key")) return jsonResponse({ key: KEY });
                return new Response(null, { status: 204 });
            })
        );

        expect(await saveProfileToVault("id-token", PROFILE)).toBe("saved");

        expect(calls.map((c) => c.url)).toEqual([
            "https://api.example/vault/key",
            "https://api.example/vault"
        ]);
        const uploaded = String(calls[1].init?.body);
        expect(uploaded).not.toContain("pw1");
        expect(uploaded).not.toContain(KEY);
        expect(JSON.parse(uploaded)).toMatchObject({ version: expect.any(Number) });
    });

    it("reports the refusal rather than pretending, when the key is refused", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 401 })));
        expect(await saveProfileToVault("stale-token", PROFILE)).toBe("unauthorized");
    });

    it("reports a full vault", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async (url: string) =>
                String(url).endsWith("/vault/key")
                    ? jsonResponse({ key: KEY })
                    : new Response(null, { status: 429 })
            )
        );
        expect(await saveProfileToVault("id-token", PROFILE)).toBe("quota_exceeded");
    });
});

describe("finding a profile back", () => {
    it("needs nothing but the Google sign-in", async () => {
        // The round trip a person makes on a new device: sign in, get the
        // profile back. Nothing typed, nothing kept from the first device.
        const stored: Record<string, unknown> = {};
        vi.stubGlobal(
            "fetch",
            vi.fn(async (url: string, init?: RequestInit) => {
                if (String(url).endsWith("/vault/key")) return jsonResponse({ key: KEY });
                if (init?.method === "PUT") {
                    Object.assign(stored, JSON.parse(String(init.body)));
                    return new Response(null, { status: 204 });
                }
                return jsonResponse(stored);
            })
        );

        expect(await saveProfileToVault("id-token", PROFILE)).toBe("saved");
        const result = await restoreProfileFromVault("id-token-on-another-device");

        expect(result.outcome).toBe("restored");
        expect(result.outcome === "restored" && result.profile).toEqual(PROFILE);
    });

    it("says the vault is empty rather than inventing a profile", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async (url: string) =>
                String(url).endsWith("/vault/key")
                    ? jsonResponse({ key: KEY })
                    : new Response(null, { status: 404 })
            )
        );
        expect((await restoreProfileFromVault("id-token")).outcome).toBe("empty");
    });

    it("refuses to open a blob its key does not open", async () => {
        // A tampered blob and a wrong key are indistinguishable by design
        // (AES-GCM), and both must end as a refusal, never as a half-read
        // profile.
        const otherKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)));
        let keyToServe = KEY;
        vi.stubGlobal(
            "fetch",
            vi.fn(async (url: string, init?: RequestInit) => {
                if (String(url).endsWith("/vault/key")) return jsonResponse({ key: keyToServe });
                if (init?.method === "PUT") {
                    sealed = JSON.parse(String(init.body));
                    return new Response(null, { status: 204 });
                }
                return jsonResponse(sealed);
            })
        );
        let sealed: unknown = null;

        await saveProfileToVault("id-token", PROFILE);
        keyToServe = otherKey;
        expect((await restoreProfileFromVault("id-token")).outcome).toBe("error");
    });
});
