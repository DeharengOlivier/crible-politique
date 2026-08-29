// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import HomeStatsBand from '@/components/home/HomeStatsBand';

// The numbers the home page shows about the tool itself. They are the first
// figures a visitor reads, so the rule is that every one of them is measured,
// and an absence of measurement shows as an absence rather than as a zero
// dressed up as a result.

const SNAPSHOT = {
    totalAnalyses: 1284,
    generatedAt: '2026-08-29T12:00:00.000Z',
    countries: {
        FR: {
            analyses: 900,
            weightSum: 60,
            leaders: [
                { partyId: 'fr_lfi', weightSum: 30, timesLed: 40 },
                { partyId: 'fr_rn', weightSum: 18, timesLed: 25 },
                { partyId: 'fr_ps', weightSum: 12, timesLed: 20 }
            ]
        },
        BE: { analyses: 384, weightSum: 20, leaders: [{ partyId: 'be_ptb', weightSum: 20, timesLed: 38 }] }
    }
};

const EMPTY = {
    totalAnalyses: 0,
    generatedAt: '2026-08-29T12:00:00.000Z',
    countries: {
        FR: { analyses: 0, weightSum: 0, leaders: [] },
        BE: { analyses: 0, weightSum: 0, leaders: [] }
    }
};

function statsResponse(body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' }
    });
}

beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_CRIBLE_API_URL', 'https://api.example');
});

afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

describe('HomeStatsBand', () => {
    it('shows how many analyses were run and what they concluded', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(statsResponse(SNAPSHOT)));
        render(<HomeStatsBand />);

        await waitFor(() => expect(screen.getByText('1 284')).toBeTruthy());
        // The average result of those analyses, by name and by share, not a
        // ranking of parties by anything we decided.
        expect(screen.getByText(/La France Insoumise/)).toBeTruthy();
        expect(screen.getByText('50 %')).toBeTruthy();
    });

    it('says nothing has been measured yet rather than showing a zero', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(statsResponse(EMPTY)));
        render(<HomeStatsBand />);

        await waitFor(() => expect(screen.getByText(/Aucune analyse enregistrée/)).toBeTruthy());
        expect(screen.queryByText('0')).toBeNull();
    });

    it('disappears rather than showing a broken figure when the API is down', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
        const { container } = render(<HomeStatsBand />);

        await waitFor(() => expect(container.textContent).toBe(''));
    });

    it('never prints a party id at a reader', async () => {
        // Counters are keyed by party id at write time and outlive the corpus:
        // a party removed from data/parties.ts leaves its rows behind. Printing
        // the raw key would show "be_vlaams_belang" on the home page, which is
        // both unreadable and unexplained. The share is real, so the row stays
        // and says what it is.
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                statsResponse({
                    ...SNAPSHOT,
                    countries: {
                        ...SNAPSHOT.countries,
                        BE: {
                            analyses: 10,
                            weightSum: 10,
                            leaders: [{ partyId: 'be_disparu', weightSum: 10, timesLed: 10 }]
                        }
                    }
                })
            )
        );
        render(<HomeStatsBand />);

        await waitFor(() => expect(screen.getByText('1 284')).toBeTruthy());
        expect(screen.queryByText(/be_disparu/)).toBeNull();
        expect(screen.getByText(/Parti retiré du corpus/)).toBeTruthy();
    });

    it('never counts a visit, because visits are not counted', async () => {
        // The site sends nothing when it is read: a reader who never completes
        // an analysis makes no request to us at all. Any beacon added here
        // would break that, so this test stands guard over the promise.
        const fetchSpy = vi.fn().mockResolvedValue(statsResponse(SNAPSHOT));
        vi.stubGlobal('fetch', fetchSpy);
        render(<HomeStatsBand />);

        await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
        for (const call of fetchSpy.mock.calls) {
            expect(String(call[0])).toBe('https://api.example/stats');
            expect(call[1]?.method ?? 'GET').toBe('GET');
        }
    });
});
