import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parsePublicStats, reportAnalysis } from "@/lib/cribleApi";

// The site must behave identically with or without a statistics backend: the
// API URL is optional, a network failure is silent, and whatever the server
// answers is untrusted input parsed at the boundary.

const SNAPSHOT = {
    totalAnalyses: 12,
    generatedAt: "2026-08-29T12:00:00.000Z",
    countries: {
        FR: { analyses: 8, weightSum: 6.5, leaders: [{ partyId: "fr_lfi", weightSum: 3, timesLed: 4 }] },
        BE: { analyses: 4, weightSum: 2, leaders: [] }
    }
};

describe("parsePublicStats", () => {
    it("accepts a well-formed snapshot", () => {
        const stats = parsePublicStats(SNAPSHOT);
        expect(stats).not.toBeNull();
        expect(stats!.totalAnalyses).toBe(12);
        expect(stats!.countries.FR.leaders[0].partyId).toBe("fr_lfi");
    });

    it("refuses everything else rather than rendering NaN", () => {
        for (const raw of [
            null,
            "stats",
            {},
            { ...SNAPSHOT, totalAnalyses: "12" },
            { ...SNAPSHOT, countries: { FR: SNAPSHOT.countries.FR } }, // BE missing
            {
                ...SNAPSHOT,
                countries: {
                    ...SNAPSHOT.countries,
                    FR: { analyses: 1, weightSum: 1, leaders: [{ partyId: 3, weightSum: 1, timesLed: 1 }] }
                }
            },
            {
                ...SNAPSHOT,
                countries: {
                    ...SNAPSHOT.countries,
                    FR: { analyses: -1, weightSum: 1, leaders: [] }
                }
            }
        ]) {
            expect(parsePublicStats(raw), JSON.stringify(raw)).toBeNull();
        }
    });
});

describe("reportAnalysis", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    });
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it("does nothing at all when no API is configured", () => {
        vi.stubEnv("NEXT_PUBLIC_CRIBLE_API_URL", "");
        reportAnalysis({ country: "FR", positionsTaken: 33, leaders: ["fr_lfi"] });
        expect(fetch).not.toHaveBeenCalled();
    });

    it("posts the event, and only the event, to /analyses", () => {
        vi.stubEnv("NEXT_PUBLIC_CRIBLE_API_URL", "https://api.example/");
        reportAnalysis({ country: "FR", positionsTaken: 15, leaders: ["fr_lfi"] });
        expect(fetch).toHaveBeenCalledOnce();
        const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
        expect(url).toBe("https://api.example/analyses");
        expect(JSON.parse(init.body as string)).toEqual({
            country: "FR",
            positionsTaken: 15,
            leaders: ["fr_lfi"]
        });
        expect(init.keepalive).toBe(true);
    });

    it("survives a network that is down without touching the caller", () => {
        vi.stubEnv("NEXT_PUBLIC_CRIBLE_API_URL", "https://api.example");
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network down")));
        expect(() => reportAnalysis({ country: "BE", positionsTaken: 33, leaders: [] })).not.toThrow();
    });
});
