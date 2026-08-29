// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { requestedAnalysis } from '@/lib/analysisMode';
import { statementsFor, expressStatementsFor } from '@/lib/electoralScope';

// Two doors, not one behind the other. The express test was the only way in,
// and the whole corpus was reachable only by finishing the express one first
// and accepting an offer to continue, so a reader who arrived wanting to answer
// everything had to answer fifteen statements to be allowed to.
//
// The door is read from the address, which is untrusted like any input: it is
// narrowed to one of the two analyses or to nothing at all, and "nothing at
// all" is the introduction screen, not an error the reader has to understand.

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, back: () => {}, prefetch: () => {} })
}));

afterEach(cleanup);

describe('requestedAnalysis, the boundary', () => {
    it('reads the two analyses the site offers', () => {
        expect(requestedAnalysis('complete')).toBe('complete');
        expect(requestedAnalysis('express')).toBe('express');
    });

    it.each([null, undefined, '', 'COMPLETE', 'complet', 'full', '1', 'true', ' complete', 'complete<script>'])(
        'asks rather than guesses on %p',
        (raw) => {
            expect(requestedAnalysis(raw as string | null)).toBeNull();
        }
    );
});

describe('the home page offers both analyses', () => {
    it('links to the express test and to the complete one', async () => {
        const Home = (await import('@/app/page')).default;
        render(<Home />);

        const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
        expect(links).toContain('/test?analyse=express');
        expect(links).toContain('/test?analyse=complete');
    });
});

describe('the test page honours the door it was entered by', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    function chooseFrance() {
        const button = screen.getByText('France').closest('button');
        if (button === null) throw new Error('the country choice is not a button');
        fireEvent.click(button);
    }

    async function renderTestAt(url: string) {
        window.history.replaceState(null, '', url);
        const TestPage = (await import('@/app/test/page')).default;
        render(<TestPage />);
    }

    it('asks the whole corpus when entered by the complete door', async () => {
        await renderTestAt('/test?analyse=complete');
        // The country decides which statements exist, so it is asked first
        // whichever door was used.
        chooseFrance();
        expect(screen.getByText(`Énoncé 1 / ${statementsFor('FR').length}`)).toBeTruthy();
    });

    it('asks the express corpus when entered by the express door', async () => {
        await renderTestAt('/test?analyse=express');
        chooseFrance();
        expect(screen.getByText(`Énoncé 1 / ${expressStatementsFor('FR').length}`)).toBeTruthy();
    });

    it('still introduces itself to a reader who asked for neither', async () => {
        await renderTestAt('/test');
        expect(screen.getByText(/Commencer le test/)).toBeTruthy();
    });

    it('does not make a reader who chose a door read the introduction', async () => {
        await renderTestAt('/test?analyse=complete');
        expect(screen.queryByText(/Commencer le test/)).toBeNull();
    });
});
