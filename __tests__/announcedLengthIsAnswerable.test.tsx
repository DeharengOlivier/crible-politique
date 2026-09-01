// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { STATEMENTS } from '@/data/statements';
import { expressStatementsFor, statementsFor } from '@/lib/electoralScope';
import RespondentPicker from '@/components/test/RespondentPicker';

// Found 2026-08-30 while auditing the site against its own promise. The home
// page offered "Analyse complète: 38 énoncés, 10 minutes", the country picker
// announced "33 énoncés dont 3 propres au débat français", and the voice door
// said "33 énoncés lus à voix haute". Nobody ever answers 38: that is the union
// of the two national corpora. A French respondent answers 35 and a Belgian 33,
// and France carries 5 national statements, not 3.
//
// The invariant this battery holds, on a site whose whole contract is "check us
// rather than believe us": a number of statements announced to a reader is a
// number some respondent actually answers. The catalogue figure remains
// sayable, but only when the sentence says it is the catalogue, because "38
// énoncés" and "38 énoncés au catalogue" are two different claims.

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, back: () => {}, prefetch: () => {} }),
    usePathname: () => '/',
    // On a direct load the router's params are the URL's, which is what
    // this models. doorSurvivesClientNavigation.test.tsx covers the case
    // where the two disagree, which is every click from the home page.
    useSearchParams: () => new URLSearchParams(window.location.search)
}));

/** What a respondent can actually be asked, whichever country and door. */
const ANSWERABLE = new Set<number>([
    statementsFor('FR').length,
    statementsFor('BE').length,
    expressStatementsFor('FR').length,
    expressStatementsFor('BE').length
]);

// The catalogue figure sits in a <dt> with its caption in the sibling <dd>, so
// the two are adjacent with no space in the concatenated text content.
const CLAIM = /(\d+)\s*énoncés(\s+au\s+catalogue|\s+comparables)?/g;

interface Claim {
    count: number;
    /** "au catalogue": the corpus both countries are drawn from. */
    isCatalogue: boolean;
    /**
     * "comparables": the statistical floor under which a score is flagged as
     * thin. A threshold, not a questionnaire length, so it answers to nothing
     * here. The qualifier is what makes the difference legible to a reader,
     * which is the same reason it makes it legible to this test.
     */
    isThreshold: boolean;
}

function claimsIn(text: string): Claim[] {
    return [...text.matchAll(CLAIM)].map((match) => ({
        count: Number(match[1]),
        isCatalogue: match[2]?.includes('catalogue') === true,
        isThreshold: match[2]?.includes('comparables') === true
    }));
}

function expectEveryClaimAnswerable(text: string): void {
    const claims = claimsIn(text);
    // A page that announces nothing cannot be checked, and every page in this
    // battery is there because it announces something.
    expect(claims.length).toBeGreaterThan(0);
    for (const claim of claims) {
        if (claim.isThreshold) continue;
        if (claim.isCatalogue) {
            expect(claim.count).toBe(STATEMENTS.length);
        } else {
            expect(ANSWERABLE.has(claim.count)).toBe(true);
        }
    }
}

afterEach(cleanup);

describe('the counts a page reads out are counts someone answers', () => {
    it('nobody is ever asked the union of the two corpora', () => {
        // The defect in one line: the number the home page used to print was
        // larger than either questionnaire.
        expect(STATEMENTS.length).toBeGreaterThan(statementsFor('FR').length);
        expect(ANSWERABLE.has(STATEMENTS.length)).toBe(false);
    });

    it('holds on the home page, both doors', async () => {
        const Home = (await import('@/app/page')).default;
        expectEveryClaimAnswerable(render(<Home />).container.textContent ?? '');
    });

    it('holds on the methodology page', async () => {
        const Methodology = (await import('@/app/methodology/page')).default;
        expectEveryClaimAnswerable(render(<Methodology />).container.textContent ?? '');
    });

    it('holds on the test introduction, including the voice door', async () => {
        window.history.replaceState(null, '', '/test');
        localStorage.clear();
        const TestPage = (await import('@/app/test/page')).default;
        expectEveryClaimAnswerable(render(<TestPage />).container.textContent ?? '');
    });

    it('holds on the country picker, which announces one country at a time', () => {
        expectEveryClaimAnswerable(render(<RespondentPicker onChoose={() => {}} />).container.textContent ?? '');
    });
});

describe('the country picker describes the country it names', () => {
    // The two rows had the same numbers, which made one of them wrong: the
    // French corpus carries five national statements and the Belgian three.
    function rowFor(country: 'France' | 'Belgique'): string {
        render(<RespondentPicker onChoose={() => {}} />);
        const button = screen.getByText(country).closest('button');
        if (button === null) throw new Error(`${country} is not a button`);
        return button.textContent ?? '';
    }

    it('announces the French corpus on the French row', () => {
        const row = rowFor('France');
        expect(row).toContain(`${statementsFor('FR').length} énoncés`);
        expect(row).toContain('5');
    });

    it('announces the Belgian corpus on the Belgian row', () => {
        const row = rowFor('Belgique');
        expect(row).toContain(`${statementsFor('BE').length} énoncés`);
        expect(row).toContain('3');
    });

    it('never gives the two countries the same length', () => {
        expect(statementsFor('FR').length).not.toBe(statementsFor('BE').length);
    });
});

describe('choosing a country leads to the questionnaire it announced', () => {
    // The end-to-end version of the same invariant: the announced number and
    // the number of screens the reader then walks through are one number.
    it.each([
        ['France', 'FR'],
        ['Belgique', 'BE']
    ] as const)('%s answers the length its row promised', async (label, country) => {
        window.history.replaceState(null, '', '/test?analyse=complete');
        localStorage.clear();
        const TestPage = (await import('@/app/test/page')).default;
        render(<TestPage />);
        const button = screen.getByText(label).closest('button');
        if (button === null) throw new Error(`${label} is not a button`);
        const announced = Number(/(\d+)\s+énoncés/.exec(button.textContent ?? '')?.[1]);
        fireEvent.click(button);
        // Belgium asks for an electoral college before the questionnaire, and
        // the whole-country answer is the one that keeps both paths comparable.
        const wholeCountry = screen.queryByText(/partis belges/);
        if (wholeCountry !== null) fireEvent.click(wholeCountry);
        expect(announced).toBe(statementsFor(country).length);
        expect(screen.getByText(`Énoncé 1 / ${statementsFor(country).length}`)).toBeTruthy();
    });
});
