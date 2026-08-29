// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import SaveProfileCard from "@/components/profile/SaveProfileCard";
import RestoreProfileCard from "@/components/profile/RestoreProfileCard";
import type { VaultProfile } from "@/lib/profileVault";

// The two faces of the vault as the user sees them. Google's real widget is
// replaced by a plain button handing over a fake token: what is under test is
// everything that happens after the token, with the real crypto. Whether the
// cards appear at all is decided by the real flags, stubbed below like any
// other configured deployment.
//
// Since 2026-08-29 signing in is the whole interaction. The previous version of
// this file asserted a recovery code was shown, typed back in and kept in local
// storage; that feature is gone rather than weakened, because a reader who had
// to keep a 62-character key had a second thing to lose, and losing it lost
// their profile.

vi.mock("@/components/profile/GoogleSignInButton", () => ({
    default: ({ onIdToken }: { onIdToken: (t: string) => void }) => (
        <button type="button" onClick={() => onIdToken("fake-google-token")}>
            FAKE_GOOGLE
        </button>
    )
}));

const RESPONDENT = { country: "FR" as const };
const ANSWERS = { pw1: 2 as const, ge7: -2 as const };
const KEY = btoa(String.fromCharCode(...new Uint8Array(32).fill(4)));

/** A server that derives one key per account and stores one sealed blob. */
function fakeServer() {
    // Two statuses because the browser makes two calls and they fail
    // differently: a stale sign-in is refused when the key is asked for, a full
    // vault when the blob is written.
    const state: { sealed: unknown; deleted: boolean; keyStatus: number; saveStatus: number } = {
        sealed: null,
        deleted: false,
        keyStatus: 200,
        saveStatus: 204
    };
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
        const target = String(url);
        if (target.endsWith("/vault/key")) {
            if (state.keyStatus !== 200) return new Response(null, { status: state.keyStatus });
            return new Response(JSON.stringify({ key: KEY }), {
                status: 200,
                headers: { "content-type": "application/json" }
            });
        }
        if (init?.method === "PUT") {
            if (state.saveStatus !== 204) return new Response(null, { status: state.saveStatus });
            state.sealed = JSON.parse(String(init.body));
            return new Response(null, { status: 204 });
        }
        if (init?.method === "DELETE") {
            state.deleted = true;
            state.sealed = null;
            return new Response(null, { status: 204 });
        }
        if (state.sealed === null) return new Response(null, { status: 404 });
        return new Response(JSON.stringify(state.sealed), {
            status: 200,
            headers: { "content-type": "application/json" }
        });
    });
    vi.stubGlobal("fetch", fetchMock);
    return { state, fetchMock };
}

const signIn = () => fireEvent.click(screen.getByText("FAKE_GOOGLE"));

beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CRIBLE_API_URL", "https://api.example");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "client-123.apps.googleusercontent.com");
});

afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    localStorage.clear();
});

describe("SaveProfileCard", () => {
    it("saves with the Google sign-in alone, and asks for nothing else", async () => {
        const server = fakeServer();
        render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);
        signIn();

        await waitFor(() => expect(screen.getByText(/Profil chiffré et sauvegardé/)).toBeTruthy());
        expect(screen.queryByText(/code/i)).toBeNull();
        expect(server.state.sealed).toMatchObject({ version: expect.any(Number) });
    });

    it("uploads ciphertext, never the answers", async () => {
        const server = fakeServer();
        render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);
        signIn();

        await waitFor(() => expect(server.state.sealed).not.toBeNull());
        const uploaded = JSON.stringify(server.state.sealed);
        expect(uploaded).not.toContain("pw1");
        expect(uploaded).not.toContain("ge7");
    });

    it("writes nothing to local storage: there is no secret left to keep", async () => {
        fakeServer();
        render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);
        signIn();

        await waitFor(() => expect(screen.getByText(/Profil chiffré et sauvegardé/)).toBeTruthy());
        expect(localStorage.length).toBe(0);
    });

    it("says out loud when the daily quota is hit", async () => {
        const server = fakeServer();
        render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);
        server.state.saveStatus = 429;
        signIn();

        await waitFor(() => expect(screen.getByText(/Trop de sauvegardes/)).toBeTruthy());
    });

    it("says when the sign-in itself was refused", async () => {
        const server = fakeServer();
        render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);
        server.state.keyStatus = 401;
        signIn();

        await waitFor(() =>
            expect(screen.getByText(/connexion Google n’a pas pu être vérifiée/)).toBeTruthy()
        );
    });

    it("deletes the vault on request", async () => {
        const server = fakeServer();
        render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);
        signIn();
        await waitFor(() => expect(screen.getByText(/Supprimer ce profil/)).toBeTruthy());
        fireEvent.click(screen.getByText(/Supprimer ce profil/));

        await waitFor(() => expect(screen.getByText(/Profil supprimé du serveur/)).toBeTruthy());
        expect(server.state.deleted).toBe(true);
    });
});

describe("RestoreProfileCard", () => {
    async function saveOnce() {
        render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);
        signIn();
        await waitFor(() => expect(screen.getByText(/Profil chiffré et sauvegardé/)).toBeTruthy());
        cleanup();
    }

    it("restores on another device with nothing but the sign-in", async () => {
        // The whole point of the change: this is a fresh render with empty
        // local storage, standing in for a phone that never saw the profile.
        fakeServer();
        await saveOnce();
        localStorage.clear();

        const restored: VaultProfile[] = [];
        render(<RestoreProfileCard onRestored={(profile) => restored.push(profile)} />);
        signIn();

        await waitFor(() => expect(restored).toHaveLength(1));
        expect(restored[0]).toMatchObject({ country: "FR", answers: ANSWERS });
    });

    it("offers no code to type", async () => {
        fakeServer();
        render(<RestoreProfileCard onRestored={() => {}} />);
        expect(screen.queryByRole("textbox")).toBeNull();
        expect(screen.queryByText(/code/i)).toBeNull();
    });

    it("says when the account has no vault at all", async () => {
        fakeServer();
        render(<RestoreProfileCard onRestored={() => {}} />);
        signIn();

        await waitFor(() => expect(screen.getByText(/Aucun profil sauvegardé/)).toBeTruthy());
    });

    it("reports a failure rather than restoring something wrong", async () => {
        const server = fakeServer();
        render(<RestoreProfileCard onRestored={() => {}} />);
        server.state.keyStatus = 500;
        signIn();

        await waitFor(() => expect(screen.getByText(/n'a pas abouti/)).toBeTruthy());
    });
});

describe("a deployment without the vault configured", () => {
    it("shows neither card", () => {
        vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");
        const { container: save } = render(
            <SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />
        );
        const { container: restore } = render(<RestoreProfileCard onRestored={() => {}} />);
        expect(save.textContent).toBe("");
        expect(restore.textContent).toBe("");
    });
});
