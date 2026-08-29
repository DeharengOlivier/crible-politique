// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    forgetRecoveryCode,
    recallRecoveryCode,
    rememberRecoveryCode,
    restoreProfileFromVault,
    saveProfileToVault
} from "@/lib/vaultClient";
import { generateVaultKey, recoveryCodeFromKey } from "@/lib/profileVault";
import type { VaultProfile } from "@/lib/profileVault";

// The workflow the "save my profile" card runs: encrypt locally, upload the
// blob, hand the user their recovery code; and the reverse on another device.
// The server in these tests is a mocked fetch, because the property under
// test is what crosses it: ciphertext, never the profile.

const PROFILE: VaultProfile = {
    country: "FR",
    college: null,
    answers: { pw1: 2, ge7: -2, ec1: null },
    savedAt: "2026-08-29T23:00:00.000Z"
};

beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CRIBLE_API_URL", "https://api.example");
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    localStorage.clear();
});

describe("saving", () => {
    it("uploads ciphertext only, authenticated, and returns a usable recovery code", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
        vi.stubGlobal("fetch", fetchMock);
        const result = await saveProfileToVault("id-token", PROFILE, null);
        expect(result.outcome).toBe("saved");
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe("https://api.example/vault");
        expect(init.method).toBe("PUT");
        expect((init.headers as Record<string, string>).authorization).toBe("Bearer id-token");
        const body = init.body as string;
        for (const marker of ["answers", "pw1", "country", "FR", "savedAt"]) {
            expect(body).not.toContain(`"${marker}"`);
        }
        expect(JSON.parse(body)).toHaveProperty("ciphertext");
    });

    it("reuses the caller's recovery code so the key never silently changes", async () => {
        const code = recoveryCodeFromKey(generateVaultKey());
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
        const result = await saveProfileToVault("id-token", PROFILE, code);
        expect(result).toEqual({ outcome: "saved", recoveryCode: code });
    });

    it("maps quota and auth refusals to their own outcomes", async () => {
        for (const [status, outcome] of [
            [429, "quota_exceeded"],
            [401, "unauthorized"],
            [500, "error"]
        ] as const) {
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status })));
            expect((await saveProfileToVault("id-token", PROFILE, null)).outcome).toBe(outcome);
        }
    });
});

describe("restoring", () => {
    it("round-trips through a mocked server: what was saved comes back intact", async () => {
        let storedBody = "";
        vi.stubGlobal(
            "fetch",
            vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
                if (init?.method === "PUT") {
                    storedBody = init.body as string;
                    return new Response(null, { status: 204 });
                }
                return new Response(storedBody, { status: 200 });
            })
        );
        const saved = await saveProfileToVault("id-token", PROFILE, null);
        expect(saved.outcome).toBe("saved");
        const code = (saved as { recoveryCode: string }).recoveryCode;
        const restored = await restoreProfileFromVault("id-token", code);
        expect(restored).toEqual({ outcome: "restored", profile: PROFILE });
    });

    it("calls a wrong-but-well-formed code what it is, without leaking why", async () => {
        vi.stubGlobal("fetch", vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
            if (init?.method === "PUT") return new Response(null, { status: 204 });
            return new Response(JSON.stringify({ ciphertext: "AAAA", iv: "AAAA", version: 1 }), { status: 200 });
        }));
        const otherCode = recoveryCodeFromKey(generateVaultKey());
        expect(await restoreProfileFromVault("id-token", otherCode)).toEqual({ outcome: "wrong_code" });
    });

    it("rejects a malformed code before any network call", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
        expect(await restoreProfileFromVault("id-token", "not-a-code")).toEqual({ outcome: "wrong_code" });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("distinguishes an account that simply has no vault yet", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
        const code = recoveryCodeFromKey(generateVaultKey());
        expect(await restoreProfileFromVault("id-token", code)).toEqual({ outcome: "empty" });
    });
});

describe("recovery code custody", () => {
    it("remembers, recalls and forgets the code in local storage only", () => {
        const code = recoveryCodeFromKey(generateVaultKey());
        expect(recallRecoveryCode()).toBeNull();
        rememberRecoveryCode(code);
        expect(recallRecoveryCode()).toBe(code);
        forgetRecoveryCode();
        expect(recallRecoveryCode()).toBeNull();
    });

    it("ignores a stored value that no longer decodes to a key", () => {
        localStorage.setItem("crible_vault_recovery_v1", "corrupted");
        expect(recallRecoveryCode()).toBeNull();
    });
});
