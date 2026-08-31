import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    API_TIMEOUT_MS,
    deleteVault,
    fetchPublicStats,
    fetchVaultKey,
    loadVault,
    reportAnalysis,
    saveVault
} from "@/lib/cribleApi";

// Found 2026-08-30 while auditing against CODING-RULES.md section 7: not one of
// the six calls to the API carried a timeout. A connection that hangs rather
// than fails is the worst of the two: the save card sat on "Chiffrement et
// envoi en cours…" forever, with nothing to cancel and nothing to read.
//
// The invariant: every request this client makes is bounded in time, and the
// expiry produces the same clean, honest outcome as any other failure. Never an
// exception thrown into a component, never a promise that does not settle.

const API = "https://api.example";
const TOKEN = "id-token";
const SEALED = { ciphertext: "c", iv: "i", version: 1 };

let seen: RequestInit[] = [];

/** A server that accepts the connection and then never answers. */
function neverAnswers(): void {
    vi.stubGlobal("fetch", (_url: string, init: RequestInit = {}) => {
        seen.push(init);
        return new Promise((_resolve, reject) => {
            init.signal?.addEventListener("abort", () =>
                reject(new DOMException("The operation was aborted.", "AbortError"))
            );
        });
    });
}

/** A server that answers immediately, to inspect what was sent. */
function answers(status: number, body: unknown = {}): void {
    vi.stubGlobal("fetch", (_url: string, init: RequestInit = {}) => {
        seen.push(init);
        return Promise.resolve(
            new Response(status === 204 ? null : JSON.stringify(body), { status })
        );
    });
}

beforeEach(() => {
    seen = [];
    vi.stubEnv("NEXT_PUBLIC_CRIBLE_API_URL", API);
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe("every call is bounded in time", () => {
    it("budgets a timeout short enough for a person to still be waiting", () => {
        // A phone on a poor connection needs room; a reader does not wait a
        // minute at a spinner. Stated rather than discovered.
        expect(API_TIMEOUT_MS).toBeGreaterThanOrEqual(4000);
        expect(API_TIMEOUT_MS).toBeLessThanOrEqual(15000);
    });

    it.each([
        ["fetchPublicStats", () => fetchPublicStats()],
        ["fetchVaultKey", () => fetchVaultKey(TOKEN)],
        ["loadVault", () => loadVault(TOKEN)],
        ["saveVault", () => saveVault(TOKEN, SEALED)],
        ["deleteVault", () => deleteVault(TOKEN)]
    ])("%s carries an abort signal", async (_name, call) => {
        answers(200, { key: "" });
        await call();
        expect(seen).toHaveLength(1);
        expect(seen[0].signal).toBeInstanceOf(AbortSignal);
    });

    it("reportAnalysis carries one too, fire-and-forget as it is", () => {
        answers(204);
        reportAnalysis({ country: "FR", positionsTaken: 30, leaders: ["fr_lfi"] });
        expect(seen).toHaveLength(1);
        expect(seen[0].signal).toBeInstanceOf(AbortSignal);
    });
});

describe("what a hung connection produces", () => {
    // Real timers with a real signal would mean waiting the full budget, so the
    // clock is the injected dependency here: fake timers advance past it.
    async function expire<T>(call: () => Promise<T>): Promise<T> {
        vi.useFakeTimers();
        const pending = call();
        await vi.advanceTimersByTimeAsync(API_TIMEOUT_MS + 1);
        return pending;
    }

    it("gives the vault key caller an error rather than a hang", async () => {
        neverAnswers();
        expect(await expire(() => fetchVaultKey(TOKEN))).toEqual({ outcome: "error" });
    });

    it("gives the vault reader an error rather than a hang", async () => {
        neverAnswers();
        expect(await expire(() => loadVault(TOKEN))).toEqual({ outcome: "error" });
    });

    it("tells the save card the save did not happen", async () => {
        neverAnswers();
        expect(await expire(() => saveVault(TOKEN, SEALED))).toBe("error");
    });

    it("reports a failed deletion as failed", async () => {
        neverAnswers();
        expect(await expire(() => deleteVault(TOKEN))).toBe(false);
    });

    it("leaves the statistics page with nothing to show, not with a crash", async () => {
        neverAnswers();
        expect(await expire(() => fetchPublicStats())).toBeNull();
    });

    it("never lets the counter throw into the results screen", () => {
        neverAnswers();
        expect(() =>
            reportAnalysis({ country: "FR", positionsTaken: 30, leaders: ["fr_lfi"] })
        ).not.toThrow();
    });
});
