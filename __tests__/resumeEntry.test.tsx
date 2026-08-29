// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import TestPage from '@/app/test/page';
import { statementsFor } from '@/lib/electoralScope';
import { TEST_SESSION_STORAGE_KEY } from '@/lib/testSession';
import type { AnswerRecord, LikertValue } from '@/types/positions';

// "Revoir mes résultats" on the home page must land on the results, not on the
// introduction screen with one more button to find. The link carries the
// intent (?reprendre=1), and the flow honours it when a saved session exists;
// without one, the address degrades to the ordinary introduction.

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, back: () => {}, prefetch: () => {} }),
    useSearchParams: () => new URLSearchParams(window.location.search)
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

afterEach(() => {
    cleanup();
    localStorage.clear();
    window.history.replaceState(null, '', '/test');
});

describe('entering the test with ?reprendre=1', () => {
    it('lands straight on the saved results', async () => {
        localStorage.setItem(
            TEST_SESSION_STORAGE_KEY,
            JSON.stringify({ stage: 'results', answers: seededAnswers(), respondent: { country: 'FR' } })
        );
        window.history.replaceState(null, '', '/test?reprendre=1');
        render(<TestPage />);

        expect(await screen.findByText(/Votre boussole en 7 dimensions/)).toBeTruthy();
    });

    it('lands on the saved mid-test stage as well', async () => {
        const answers = seededAnswers();
        const partial: AnswerRecord = {};
        for (const id of Object.keys(answers).slice(0, 6)) partial[id] = answers[id];
        localStorage.setItem(
            TEST_SESSION_STORAGE_KEY,
            JSON.stringify({ stage: 'express', answers: partial, respondent: { country: 'FR' } })
        );
        window.history.replaceState(null, '', '/test?reprendre=1');
        render(<TestPage />);

        // The survey screen, not the introduction.
        expect(await screen.findByText(/Pas du tout d'accord/)).toBeTruthy();
    });

    it('degrades to the introduction when nothing was saved', async () => {
        window.history.replaceState(null, '', '/test?reprendre=1');
        render(<TestPage />);

        expect(await screen.findByText(/Où vous situez-vous, vraiment/)).toBeTruthy();
    });
});
