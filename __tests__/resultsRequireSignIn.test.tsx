// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import TestPage from '@/app/test/page';
import { resultsAccess } from '@/lib/resultsAccess';
import { statementsFor } from '@/lib/electoralScope';
import { TEST_SESSION_STORAGE_KEY, loadSavedSession } from '@/lib/testSession';
import { saveGoogleIdentity } from '@/lib/googleSession';
import { encodeAnswers } from '@/lib/profileCode';
import type { AnswerRecord, LikertValue } from '@/types/positions';

// Added 2026-08-31: a deployment offering profile accounts asks a respondent to
// sign in before opening their own results.
//
// The invariants this battery holds, and they are as much about what the gate
// must NOT do as about what it does:
//   - a deployment with no accounts to offer never shows the gate;
//   - a profile arriving in a shared link is never gated;
//   - the answers survive the gate, closed or open, and survive a sign-out;
//   - the gate points at the account bubble and draws no Google button of its
//     own, the site having exactly one place to sign in since 2026-08-30.

const API = 'https://api.example';
const GOOGLE_CLIENT = 'client-123.apps.googleusercontent.com';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, back: () => {}, prefetch: () => {} }),
    useSearchParams: () => new URLSearchParams(window.location.search),
    usePathname: () => '/test'
}));

function seededAnswers(): AnswerRecord {
    const values: LikertValue[] = [-2, -1, 0, 1, 2];
    const answers: AnswerRecord = {};
    let seed = 7;
    for (const { id } of statementsFor('FR')) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        answers[id] = values[seed % 5];
    }
    return answers;
}

function saveOwnResults(answers: AnswerRecord = seededAnswers()): AnswerRecord {
    localStorage.setItem(
        TEST_SESSION_STORAGE_KEY,
        JSON.stringify({ stage: 'results', answers, respondent: { country: 'FR' } })
    );
    return answers;
}

function offerAccounts(): void {
    vi.stubEnv('NEXT_PUBLIC_CRIBLE_API_URL', API);
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', GOOGLE_CLIENT);
}

function signIn(): void {
    act(() => saveGoogleIdentity({ name: 'Camille', picture: null }));
}

const COMPASS = /Votre boussole en 7 dimensions/;
const GATE = /Connectez-vous pour ouvrir vos résultats/;

beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/test');
});

afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    localStorage.clear();
});

describe('resultsAccess, the rule itself', () => {
    it('asks a signed-out respondent to sign in', () => {
        expect(
            resultsAccess({ accountsOffered: true, signedIn: false, fromSharedLink: false })
        ).toBe('sign_in_required');
    });

    it('opens once they are signed in', () => {
        expect(resultsAccess({ accountsOffered: true, signedIn: true, fromSharedLink: false })).toBe(
            'open'
        );
    });

    it('never gates a deployment that has no accounts to offer', () => {
        // A wall nobody can pass is worse than no wall: a fork with no API
        // configured would otherwise become unusable at the last screen.
        expect(
            resultsAccess({ accountsOffered: false, signedIn: false, fromSharedLink: false })
        ).toBe('open');
    });

    it('never gates a profile someone else shared', () => {
        expect(
            resultsAccess({ accountsOffered: true, signedIn: false, fromSharedLink: true })
        ).toBe('open');
    });
});

describe('the results screen, on a deployment that offers accounts', () => {
    it('shows the gate instead of the parties to a signed-out respondent', async () => {
        offerAccounts();
        saveOwnResults();
        window.history.replaceState(null, '', '/test?reprendre=1');
        render(<TestPage />);

        expect(await screen.findByText(GATE)).toBeTruthy();
        expect(screen.queryByText(COMPASS)).toBeNull();
    });

    it('opens the results once the reader is signed in', async () => {
        offerAccounts();
        saveOwnResults();
        signIn();
        window.history.replaceState(null, '', '/test?reprendre=1');
        render(<TestPage />);

        expect(await screen.findByText(COMPASS)).toBeTruthy();
        expect(screen.queryByText(GATE)).toBeNull();
    });

    it('opens them the moment the reader signs in, without a reload', async () => {
        offerAccounts();
        saveOwnResults();
        window.history.replaceState(null, '', '/test?reprendre=1');
        render(<TestPage />);
        expect(await screen.findByText(GATE)).toBeTruthy();

        signIn();

        expect(await screen.findByText(COMPASS)).toBeTruthy();
    });

    it('sends the reader to the one place the site signs in, and draws no button of its own', async () => {
        offerAccounts();
        saveOwnResults();
        window.history.replaceState(null, '', '/test?reprendre=1');
        const { container } = render(<TestPage />);

        expect(await screen.findByText(GATE)).toBeTruthy();
        expect(container.textContent).toMatch(/bulle en haut à droite/);
        // The Google button renders into a container the script fills; the gate
        // must not carry one, whatever the script does.
        expect(container.querySelector('[data-google-button]')).toBeNull();
    });

    it('keeps the answers on the device while the gate is closed', async () => {
        offerAccounts();
        const answers = saveOwnResults();
        window.history.replaceState(null, '', '/test?reprendre=1');
        render(<TestPage />);

        expect(await screen.findByText(GATE)).toBeTruthy();
        expect(loadSavedSession()?.answers).toEqual(answers);
        // And it says so, rather than leaving the reader to wonder.
        expect(screen.getByText(/restent sur cet appareil/)).toBeTruthy();
    });
});

describe('the gate is not a dead end', () => {
    // The gate points at the account bubble, and the bubble hides itself on
    // /test because the questionnaire carries no chrome. If that rule ever
    // covered the results screen too, the gate would send a reader to a control
    // that is not on the page, and the analysis would be unreachable. These two
    // components only meet in the browser, so this is where they are made to.
    it('shows the account bubble on the very screen the gate sends the reader to', async () => {
        offerAccounts();
        saveOwnResults();
        const AccountBadge = (await import('@/components/AccountBadge')).default;
        const { container } = render(<AccountBadge />);
        expect(container.innerHTML).not.toBe('');
    });

    it('hides it during the questionnaire, where nothing is offered yet', async () => {
        offerAccounts();
        localStorage.setItem(
            TEST_SESSION_STORAGE_KEY,
            JSON.stringify({ stage: 'express', answers: {}, respondent: { country: 'FR' } })
        );
        const AccountBadge = (await import('@/components/AccountBadge')).default;
        expect(render(<AccountBadge />).container.innerHTML).toBe('');
    });
});

describe('the pages say which of the two deployments they are', () => {
    // A gate is defensible; a gate on a page promising no account is not. The
    // sentence "aucun compte requis" was true of every build until 2026-08-31
    // and is now true of only one of them.
    const NO_ACCOUNT = /[Aa]ucun compte requis/;

    it('the privacy page drops the promise once accounts are required', async () => {
        offerAccounts();
        const ConfidentialitePage = (await import('@/app/confidentialite/page')).default;
        const text = render(<ConfidentialitePage />).container.textContent ?? '';
        expect(text).not.toMatch(NO_ACCOUNT);
        expect(text).toMatch(/pour ouvrir vos résultats/);
        // What has not changed is the part that matters most, and it stays said.
        expect(text).toMatch(/aucune réponse transmise|ne reçoit jamais vos réponses/);
    });

    it('the privacy page keeps the promise where it is still true', async () => {
        const ConfidentialitePage = (await import('@/app/confidentialite/page')).default;
        expect(render(<ConfidentialitePage />).container.textContent ?? '').toMatch(NO_ACCOUNT);
    });

    it('the test introduction promises no account only where none is needed', async () => {
        window.history.replaceState(null, '', '/test');
        expect(render(<TestPage />).container.textContent ?? '').toMatch(NO_ACCOUNT);
        cleanup();

        offerAccounts();
        const gated = render(<TestPage />).container.textContent ?? '';
        expect(gated).not.toMatch(NO_ACCOUNT);
        expect(gated).toMatch(/compte Google/);
    });
});

describe('what the gate never touches', () => {
    it('leaves a shared profile readable without an account', async () => {
        offerAccounts();
        const code = encodeAnswers(seededAnswers(), 'FR');
        window.history.replaceState(null, '', `/test#p=${code}`);
        render(<TestPage />);

        expect(await screen.findByText(COMPASS)).toBeTruthy();
    });

    it('leaves a deployment without accounts exactly as it was', async () => {
        saveOwnResults();
        window.history.replaceState(null, '', '/test?reprendre=1');
        render(<TestPage />);

        expect(await screen.findByText(COMPASS)).toBeTruthy();
    });

    it('never gates the questionnaire itself, only the results', async () => {
        offerAccounts();
        const answers = seededAnswers();
        const partial: AnswerRecord = {};
        for (const id of Object.keys(answers).slice(0, 6)) partial[id] = answers[id];
        localStorage.setItem(
            TEST_SESSION_STORAGE_KEY,
            JSON.stringify({ stage: 'express', answers: partial, respondent: { country: 'FR' } })
        );
        window.history.replaceState(null, '', '/test?reprendre=1');
        render(<TestPage />);

        expect(await screen.findByText(/Pas du tout d'accord/)).toBeTruthy();
        expect(screen.queryByText(GATE)).toBeNull();
    });
});
