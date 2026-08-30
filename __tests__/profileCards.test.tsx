// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import SaveProfileCard from "@/components/profile/SaveProfileCard";
import { forgetGoogleIdentity, rememberIdToken } from "@/lib/googleSession";

// The vault as the user sees it. What is under test is everything that happens
// after the Google token, with the real crypto.
//
// Since 2026-08-30 there is exactly one place in the whole site where a reader
// signs in: the bubble in the page corner. This card no longer draws a Google
// button of its own; it uses the sign-in already made, and says where to sign
// in when there is none. A reader who met three different Google buttons on
// three screens could not tell whether they were three accounts.
//
// Since 2026-08-29 signing in is the whole credential: the previous version of
// this file asserted a recovery code was shown, typed back in and kept in local
// storage; that feature is gone rather than weakened, because a reader who had
// to keep a 62-character key had a second thing to lose.

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

const save = () => fireEvent.click(screen.getByRole("button", { name: /Sauvegarder ce profil/ }));

beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CRIBLE_API_URL", "https://api.example");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "client-123.apps.googleusercontent.com");
    rememberIdToken("fake-google-token");
});

afterEach(() => {
    cleanup();
    forgetGoogleIdentity();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    localStorage.clear();
});

describe("SaveProfileCard, with the reader already signed in", () => {
    it("draws no Google button of its own", () => {
        fakeServer();
        const { container } = render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);
        expect(container.querySelector('[data-google-signin]')).toBeNull();
        expect(screen.queryByText(/Se connecter avec Google/)).toBeNull();
    });

    it("saves on demand, and asks for nothing else", async () => {
        const server = fakeServer();
        render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);
        save();

        await waitFor(() => expect(screen.getByText(/Profil chiffré et sauvegardé/)).toBeTruthy());
        expect(screen.queryByText(/code/i)).toBeNull();
        expect(server.state.sealed).toMatchObject({ version: expect.any(Number) });
    });

    it("uploads ciphertext, never the answers", async () => {
        const server = fakeServer();
        render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);
        save();

        await waitFor(() => expect(server.state.sealed).not.toBeNull());
        const uploaded = JSON.stringify(server.state.sealed);
        expect(uploaded).not.toContain("pw1");
        expect(uploaded).not.toContain("ge7");
    });

    it("writes nothing to local storage: there is no secret left to keep", async () => {
        fakeServer();
        render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);
        save();

        await waitFor(() => expect(screen.getByText(/Profil chiffré et sauvegardé/)).toBeTruthy());
        expect(localStorage.length).toBe(0);
    });

    it("says out loud when the daily quota is hit", async () => {
        const server = fakeServer();
        render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);
        server.state.saveStatus = 429;
        save();

        await waitFor(() => expect(screen.getByText(/Trop de sauvegardes/)).toBeTruthy());
    });

    it("sends the reader back to the bubble when the sign-in has expired", async () => {
        const server = fakeServer();
        render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);
        server.state.keyStatus = 401;
        save();

        await waitFor(() => expect(screen.getByText(/en haut à droite/)).toBeTruthy());
    });

    it("deletes the vault on request", async () => {
        const server = fakeServer();
        render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);
        save();
        await waitFor(() => expect(screen.getByText(/Supprimer ce profil/)).toBeTruthy());
        fireEvent.click(screen.getByText(/Supprimer ce profil/));

        await waitFor(() => expect(screen.getByText(/Profil supprimé du serveur/)).toBeTruthy());
        expect(server.state.deleted).toBe(true);
    });
});

describe("SaveProfileCard, with nobody signed in", () => {
    it("points at the one place where signing in happens, and offers no second one", () => {
        forgetGoogleIdentity();
        fakeServer();
        render(<SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />);

        expect(screen.getByText(/en haut à droite/)).toBeTruthy();
        expect(screen.queryByRole("button", { name: /Sauvegarder ce profil/ })).toBeNull();
    });
});

describe("a deployment without the vault configured", () => {
    it("shows no card at all", () => {
        vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");
        const { container } = render(
            <SaveProfileCard answers={ANSWERS} respondent={RESPONDENT} />
        );
        expect(container.textContent).toBe("");
    });
});
