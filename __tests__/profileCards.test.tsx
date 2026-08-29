// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import SaveProfileCard from "@/components/profile/SaveProfileCard";
import RestoreProfileCard from "@/components/profile/RestoreProfileCard";
import { encryptProfile, generateVaultKey, keyFromRecoveryCode, recoveryCodeFromKey } from "@/lib/profileVault";
import type { VaultProfile } from "@/lib/profileVault";
import { rememberRecoveryCode } from "@/lib/vaultClient";

// The two faces of the vault as the user sees them. Google's real widget is
// replaced by a plain button handing over a fake token: what is under test is
// everything that happens after the token, with the real crypto.

vi.mock("@/components/profile/GoogleSignInButton", () => ({
    default: ({ onIdToken }: { onIdToken: (t: string) => void }) => (
        <button type="button" onClick={() => onIdToken("fake-google-token")}>
            FAKE_GOOGLE
        </button>
    ),
    googleClientId: () => "client-123.apps.googleusercontent.com"
}));

const RESPONDENT = { country: "FR" as const };
const ANSWERS = { pw1: 2 as const, ge7: -2 as const };

beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CRIBLE_API_URL", "https://api.example");
});

afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    localStorage.clear();
});

describe("SaveProfileCard", () => {
    it("shows the recovery code once after a first save, and keeps it locally", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
        render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);
        fireEvent.click(screen.getByText("FAKE_GOOGLE"));
        await waitFor(() => expect(screen.getByText(/code de récupération/)).toBeTruthy());
        expect(screen.getByText(/Notez-le/)).toBeTruthy();
        const shownCode = screen.getByText(/^[0-9a-hjkmnp-tv-z]{6}(-[0-9a-hjkmnp-tv-z]{6}){8}$/);
        expect(keyFromRecoveryCode(shownCode.textContent ?? "")).not.toBeNull();
        expect(localStorage.getItem("crible_vault_recovery_v1")).toBe(shownCode.textContent);
    });

    it("does not re-show a code the user already has", async () => {
        rememberRecoveryCode(recoveryCodeFromKey(generateVaultKey()));
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
        render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);
        fireEvent.click(screen.getByText("FAKE_GOOGLE"));
        await waitFor(() => expect(screen.getByText(/habituel reste valable/)).toBeTruthy());
        expect(screen.queryByText("Copier le code")).toBeNull();
    });

    it("says out loud when the daily quota is hit", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 429 })));
        render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);
        fireEvent.click(screen.getByText("FAKE_GOOGLE"));
        await waitFor(() => expect(screen.getByText(/Trop de sauvegardes/)).toBeTruthy());
    });

    it("deletes the vault and forgets the local code on request", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response(null, { status: 204 })) // PUT
            .mockResolvedValueOnce(new Response(null, { status: 204 })); // DELETE
        vi.stubGlobal("fetch", fetchMock);
        render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);
        fireEvent.click(screen.getByText("FAKE_GOOGLE"));
        await waitFor(() => expect(screen.getByText(/Supprimer ce profil/)).toBeTruthy());
        fireEvent.click(screen.getByText(/Supprimer ce profil/));
        await waitFor(() => expect(screen.getByText(/Profil supprimé/)).toBeTruthy());
        expect(localStorage.getItem("crible_vault_recovery_v1")).toBeNull();
        const deleteCall = fetchMock.mock.calls[1] as [string, RequestInit];
        expect(deleteCall[1].method).toBe("DELETE");
    });
});

describe("RestoreProfileCard", () => {
    const PROFILE: VaultProfile = {
        country: "BE",
        college: "wallonie",
        answers: { pw4: 1, ec1: -1 },
        savedAt: "2026-08-29T10:00:00.000Z"
    };

    async function sealedWith(code: string) {
        const key = keyFromRecoveryCode(code);
        return encryptProfile(PROFILE, key!);
    }

    it("restores silently on the device that kept the code", async () => {
        const code = recoveryCodeFromKey(generateVaultKey());
        rememberRecoveryCode(code);
        const sealed = await sealedWith(code);
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ ...sealed, updatedAt: "x" }), { status: 200 })
        ));
        const onRestored = vi.fn();
        render(<RestoreProfileCard onRestored={onRestored} />);
        fireEvent.click(screen.getByText("FAKE_GOOGLE"));
        await waitFor(() => expect(onRestored).toHaveBeenCalledWith(PROFILE));
    });

    it("asks for the code on a new device and restores with the typed one", async () => {
        const code = recoveryCodeFromKey(generateVaultKey());
        const sealed = await sealedWith(code);
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ ...sealed, updatedAt: "x" }), { status: 200 })
        ));
        const onRestored = vi.fn();
        render(<RestoreProfileCard onRestored={onRestored} />);
        fireEvent.click(screen.getByText("FAKE_GOOGLE"));
        const input = await screen.findByLabelText("Code de récupération");
        fireEvent.change(input, { target: { value: code } });
        fireEvent.click(screen.getByText("Déchiffrer mon profil"));
        await waitFor(() => expect(onRestored).toHaveBeenCalledWith(PROFILE));
        // a typed code that worked is kept for next time
        expect(localStorage.getItem("crible_vault_recovery_v1")).toBe(code);
    });

    it("tells a wrong typed code from an empty account", async () => {
        const rightCode = recoveryCodeFromKey(generateVaultKey());
        const sealed = await sealedWith(rightCode);
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ ...sealed, updatedAt: "x" }), { status: 200 })
        ));
        render(<RestoreProfileCard onRestored={vi.fn()} />);
        fireEvent.click(screen.getByText("FAKE_GOOGLE"));
        const input = await screen.findByLabelText("Code de récupération");
        fireEvent.change(input, { target: { value: recoveryCodeFromKey(generateVaultKey()) } });
        fireEvent.click(screen.getByText("Déchiffrer mon profil"));
        await waitFor(() => expect(screen.getByText(/n’ouvre pas ce profil/)).toBeTruthy());
    });

    it("says when the account has no vault at all", async () => {
        rememberRecoveryCode(recoveryCodeFromKey(generateVaultKey()));
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
        render(<RestoreProfileCard onRestored={vi.fn()} />);
        fireEvent.click(screen.getByText("FAKE_GOOGLE"));
        await waitFor(() => expect(screen.getByText(/Aucun profil sauvegardé/)).toBeTruthy());
    });
});
