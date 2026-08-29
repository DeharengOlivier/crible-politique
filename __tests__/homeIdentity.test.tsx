// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Home from "@/app/page";
import { computeProfile } from "@/lib/scoringEngine";
import { statementsFor } from "@/lib/electoralScope";
import { TEST_SESSION_STORAGE_KEY } from "@/lib/testSession";
import type { AnswerRecord, LikertValue } from "@/types/positions";

// Requested 2026-08-29 (night): the home page recognises a returning
// respondent, in one line and without a card. Signing in lives in the account
// badge in the page corner (see accountBadge.test.tsx); what is left here is
// the greeting itself, which must name the reader's own family and lead back
// to their results rather than to the generic funnel.

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

});

describe("the home page and a respondent with nothing saved", () => {
    it("says nothing at all rather than offering a door", () => {
        // Signing in lives in the account badge since 2026-08-29 (night), and
        // this block is a greeting, not a funnel: with no session there is
        // nothing to greet, so it renders nothing.
        render(<Home />);
        expect(screen.queryByText(/Bon retour/)).toBeNull();
        expect(screen.queryByText(/Un test est en cours/)).toBeNull();
    });
});
