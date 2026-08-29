// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Home from "@/app/page";
import { computeProfile } from "@/lib/scoringEngine";
import { encryptProfile } from "@/lib/profileVault";
import { statementsFor } from "@/lib/electoralScope";
import { TEST_SESSION_STORAGE_KEY, loadSavedSession } from "@/lib/testSession";
import type { AnswerRecord, LikertValue } from "@/types/positions";

// Requested 2026-08-29 (night): the home page recognises a returning
// respondent. Signing in with Google lives on the landing page itself, and a
// reader with a profile (restored from the vault, or simply saved on this
// device by a previous test) is greeted with their own family and a way back
// to their results, instead of the generic funnel.

vi.mock("@/components/profile/GoogleSignInButton", () => ({
    default: ({ onIdToken }: { onIdToken: (t: string) => void }) => (
        <button type="button" onClick={() => onIdToken("fake-google-token")}>
            FAKE_GOOGLE
        </button>
    )
}));

const KEY_BYTES = new Uint8Array(32).fill(4);
const KEY_B64 = btoa(String.fromCharCode(...KEY_BYTES));

function deterministicAnswers(): AnswerRecord {
    const values: LikertValue[] = [-2, -1, 0, 1, 2];
    const answers: AnswerRecord = {};
    let seed = 7;
    for (const { id } of statementsFor("FR")) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        answers[id] = values[seed % 5];
    }
    return answers;
}

/** A server holding one sealed profile, reachable through the real crypto. */
async function fakeServerWithVault(answers: AnswerRecord) {
    const sealed = await encryptProfile(
        { country: "FR", college: null, answers, savedAt: "2026-08-29T12:00:00.000Z" },
        { raw: KEY_BYTES }
    );
    vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) => {
            const target = String(url);
            if (target.endsWith("/vault/key")) {
                return new Response(JSON.stringify({ key: KEY_B64 }), {
                    status: 200,
                    headers: { "content-type": "application/json" }
                });
            }
            if (target.endsWith("/vault")) {
                return new Response(JSON.stringify(sealed), {
                    status: 200,
                    headers: { "content-type": "application/json" }
                });
            }
            return new Response(null, { status: 404 });
        })
    );
}

beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CRIBLE_API_URL", "https://api.example");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "client-123.apps.googleusercontent.com");
    // The stats band fetches on mount; a dead network keeps it silent.
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 500 })));
});

afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    localStorage.clear();
});

describe("the home page and a respondent who already has a profile", () => {
    it("greets them with their own family and a way back to their results", () => {
        const answers = deterministicAnswers();
        const family = computeProfile(answers).syntheticProfileFit.family!;
        localStorage.setItem(
            TEST_SESSION_STORAGE_KEY,
            JSON.stringify({ stage: "results", answers, respondent: { country: "FR" } })
        );
        render(<Home />);

        expect(screen.getAllByText(new RegExp(family.title)).length).toBeGreaterThan(0);
        const back = screen.getByRole("link", { name: /Revoir mes résultats/ });
        expect(back.getAttribute("href")).toBe("/test?reprendre=1");
    });

    it("offers to resume a test still in progress", () => {
        const answers = deterministicAnswers();
        const partial: AnswerRecord = {};
        for (const id of Object.keys(answers).slice(0, 6)) partial[id] = answers[id];
        localStorage.setItem(
            TEST_SESSION_STORAGE_KEY,
            JSON.stringify({ stage: "express", answers: partial, respondent: { country: "FR" } })
        );
        render(<Home />);

        expect(screen.getByRole("link", { name: /Reprendre mon test/ })).toBeTruthy();
    });

    it("signs in from the landing page and lands on the saved profile", async () => {
        const answers = deterministicAnswers();
        const family = computeProfile(answers).syntheticProfileFit.family!;
        await fakeServerWithVault(answers);
        render(<Home />);

        fireEvent.click(screen.getByText("FAKE_GOOGLE"));

        // "Bon retour" only exists in the identity block, never in the profile
        // gallery below it, which lists every family title: a family-title
        // match would pass before the restore even ran.
        await waitFor(() => expect(screen.getByText(/Bon retour/)).toBeTruthy());
        expect(screen.getAllByText(new RegExp(family.title)).length).toBeGreaterThan(1);
        const session = loadSavedSession();
        expect(session?.stage).toBe("results");
        expect(session?.respondent).toEqual({ country: "FR" });
    });

    it("says so when the account has no saved profile", async () => {
        // A valid sign-in against an account that never saved: key answered,
        // vault 404. The all-500 stub from beforeEach would read as an outage.
        vi.stubGlobal(
            "fetch",
            vi.fn(async (url: string) => {
                if (String(url).endsWith("/vault/key")) {
                    return new Response(JSON.stringify({ key: KEY_B64 }), {
                        status: 200,
                        headers: { "content-type": "application/json" }
                    });
                }
                return new Response(null, { status: 404 });
            })
        );
        render(<Home />);
        fireEvent.click(screen.getByText("FAKE_GOOGLE"));
        await waitFor(() => expect(screen.getByText(/Aucun profil sauvegardé/)).toBeTruthy());
    });
});

describe("a deployment without the vault", () => {
    it("shows no sign-in on the home page, but still greets a local profile", () => {
        vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");
        const answers = deterministicAnswers();
        localStorage.setItem(
            TEST_SESSION_STORAGE_KEY,
            JSON.stringify({ stage: "results", answers, respondent: { country: "FR" } })
        );
        render(<Home />);

        expect(screen.queryByText("FAKE_GOOGLE")).toBeNull();
        expect(screen.getByRole("link", { name: /Revoir mes résultats/ })).toBeTruthy();
    });
});
