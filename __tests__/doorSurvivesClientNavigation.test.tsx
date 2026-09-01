// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { expressStatementsFor, statementsFor } from '@/lib/electoralScope';
import { TEST_SESSION_STORAGE_KEY } from '@/lib/testSession';

// Reported 2026-09-01: "quand on sélectionne le mode long on est poussé vers le
// mode rapide et donc au final il est impossible de faire le mode long".
//
// Reproduced on the live site the same day, and the two cases separate cleanly:
//
//   - Opening https://crible.eu/test?analyse=complete directly: the country
//     picker appears, and answering leads to the whole corpus. Correct.
//   - Clicking "Analyse complète" on the home page: the address bar reads
//     /test?analyse=complete, and the INTRODUCTION screen appears. Pressing
//     "Commencer le test" from there goes to the express survey, because the
//     door is gone. Fifteen statements, which is precisely what that reader
//     chose not to do.
//
// The cause: the door was read with `useMemo(() => window.location.search, [])`,
// which runs during the first render. On a client-side navigation the router
// renders the new route BEFORE the history entry is committed, so that first
// render still sees the previous page's URL, reads no door, and the empty
// dependency list means it never looks again. The express door had the same
// defect and it was invisible: no door also leads to express.
//
// fullAnalysisEntry.test.tsx covered this behaviour and could not catch it,
// because it called history.replaceState BEFORE rendering, which is the
// direct-load case, the one that already worked. This battery models the other
// one: the router knows the new query, the document still shows the old URL.

const routerQuery = { current: new URLSearchParams() };

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, back: () => {}, prefetch: () => {} }),
    usePathname: () => '/test',
    // Next's own hook reads the router's state, which is why it is right on the
    // render where window.location is not yet.
    useSearchParams: () => routerQuery.current
}));

/**
 * A client-side navigation to `/test?<query>`: the router carries the new
 * query, and window.location is left on the page the reader came from.
 */
function navigateFromHomeTo(query: string): void {
    window.history.replaceState(null, '', '/');
    routerQuery.current = new URLSearchParams(query);
}

/** A direct load: the router and the document agree from the first render. */
function loadDirectly(query: string): void {
    window.history.replaceState(null, '', `/test?${query}`);
    routerQuery.current = new URLSearchParams(query);
}

function chooseFrance(): void {
    const button = screen.getByText('France').closest('button');
    if (button === null) throw new Error('the country choice is not a button');
    fireEvent.click(button);
}

async function renderTestPage() {
    const TestPage = (await import('@/app/test/page')).default;
    return render(<TestPage />);
}

beforeEach(() => {
    localStorage.clear();
    navigateFromHomeTo('');
});

afterEach(() => {
    cleanup();
    window.history.replaceState(null, '', '/');
});

describe('the door a reader pressed survives the navigation it caused', () => {
    it.each([
        ['clicked from the home page', navigateFromHomeTo],
        ['opened directly', loadDirectly]
    ])('asks the whole corpus for the complete analysis, %s', async (_case, arrive) => {
        arrive('analyse=complete');
        await renderTestPage();
        // Straight to the country, never the introduction: the reader has
        // already made the choice the introduction exists to offer.
        expect(screen.queryByText(/Commencer le test/)).toBeNull();
        chooseFrance();
        expect(screen.getByText(`Énoncé 1 / ${statementsFor('FR').length}`)).toBeTruthy();
    });

    it.each([
        ['clicked from the home page', navigateFromHomeTo],
        ['opened directly', loadDirectly]
    ])('asks the express corpus for the express analysis, %s', async (_case, arrive) => {
        arrive('analyse=express');
        await renderTestPage();
        expect(screen.queryByText(/Commencer le test/)).toBeNull();
        chooseFrance();
        expect(screen.getByText(`Énoncé 1 / ${expressStatementsFor('FR').length}`)).toBeTruthy();
    });

    it('still introduces itself to a reader who asked for neither', async () => {
        navigateFromHomeTo('');
        await renderTestPage();
        expect(screen.getByText(/Commencer le test/)).toBeTruthy();
    });

    it('starts the express analysis from the introduction, which promises fifteen', async () => {
        // The introduction says "15 énoncés pour un premier profil en 3
        // minutes", so its button has to lead there and not to the corpus.
        navigateFromHomeTo('');
        await renderTestPage();
        fireEvent.click(screen.getByText(/Commencer le test/));
        chooseFrance();
        expect(screen.getByText(`Énoncé 1 / ${expressStatementsFor('FR').length}`)).toBeTruthy();
    });

    it('resumes a saved session asked for by the same kind of link', async () => {
        // "Revoir mes résultats" on the home page is a client-side navigation
        // to /test?reprendre=1, and read the query the same broken way.
        localStorage.setItem(
            TEST_SESSION_STORAGE_KEY,
            JSON.stringify({ stage: 'express', answers: { pw1: 2 }, respondent: { country: 'FR' } })
        );
        navigateFromHomeTo('reprendre=1');
        await renderTestPage();
        expect(screen.queryByText(/Commencer le test/)).toBeNull();
    });
});
