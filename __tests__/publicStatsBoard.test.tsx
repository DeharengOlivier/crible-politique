// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import PublicStatsBoard from "@/components/stats/PublicStatsBoard";

// The public statistics page: real aggregates when the API answers, an honest
// absence when it does not, and never a NaN in front of a reader.

const SNAPSHOT = {
    totalAnalyses: 128,
    generatedAt: "2026-08-29T12:00:00.000Z",
    countries: {
        FR: {
            analyses: 90,
            weightSum: 60,
            leaders: [
                { partyId: "fr_lfi", weightSum: 30, timesLed: 40 },
                { partyId: "fr_rn", weightSum: 15, timesLed: 25 }
            ]
        },
        BE: { analyses: 38, weightSum: 20, leaders: [{ partyId: "be_ptb", weightSum: 20, timesLed: 38 }] }
    }
};

function statsResponse(body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" }
    });
}

beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CRIBLE_API_URL", "https://api.example");
});

afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe("PublicStatsBoard", () => {
    it("shows the total count and the weighted shares by party name", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(statsResponse(SNAPSHOT)));
        render(<PublicStatsBoard />);
        await waitFor(() => expect(screen.getByText("128")).toBeTruthy());
        expect(screen.getByText("La France Insoumise")).toBeTruthy();
        // 30 of 60 weighted points: 50%
        expect(screen.getAllByText("50 %").length).toBeGreaterThan(0);
        // times led is shown as an honest count, not only a percentage
        expect(screen.getByText(/en tête de 40 analyses/)).toBeTruthy();
    });

    it("says the statistics are unavailable rather than showing zeros", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("down")));
        render(<PublicStatsBoard />);
        await waitFor(() => expect(screen.getByText(/indisponibles/)).toBeTruthy());
        expect(screen.queryByText("0")).toBeNull();
    });

    it("keeps the numbers fresh by polling", async () => {
        vi.useFakeTimers();
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(statsResponse(SNAPSHOT))
            .mockResolvedValue(statsResponse({ ...SNAPSHOT, totalAnalyses: 129 }));
        vi.stubGlobal("fetch", fetchMock);
        render(<PublicStatsBoard />);
        await vi.waitFor(() => expect(screen.getByText("128")).toBeTruthy());
        await vi.advanceTimersByTimeAsync(31_000);
        await vi.waitFor(() => expect(screen.getByText("129")).toBeTruthy());
    });

    it("survives a snapshot naming a party the corpus no longer knows", async () => {
        // The counter row is real and outlives the corpus, so it is kept with
        // its share rather than dropped. What it is called changed on
        // 2026-08-29: this used to assert the raw id was printed, and a real
        // render of the home page showed what that means for a reader, a slug
        // like "be_vlaams_belang" in the middle of party names. The survival
        // property is unchanged; only the label a human sees is.
        const withUnknown = {
            ...SNAPSHOT,
            countries: {
                ...SNAPSHOT.countries,
                BE: { analyses: 1, weightSum: 1, leaders: [{ partyId: "be_gone", weightSum: 1, timesLed: 1 }] }
            }
        };
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(statsResponse(withUnknown)));
        render(<PublicStatsBoard />);
        await waitFor(() => expect(screen.getByText(/Parti retiré du corpus/)).toBeTruthy());
        expect(screen.queryByText("be_gone")).toBeNull();
        expect(screen.getByText("en tête de 1 analyses")).toBeTruthy();
    });
});
