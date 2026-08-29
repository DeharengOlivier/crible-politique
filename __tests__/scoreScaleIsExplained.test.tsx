// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import ResultsView from '@/components/test/ResultsView';
import { statementsFor } from '@/lib/electoralScope';
import type { AnswerRecord, LikertValue } from '@/types/positions';

// Reported 2026-08-29: "all my scores sit between 53 and 80". Measured the same
// day on party clones (a respondent reproducing one party's coding exactly):
// the WORST enemy of a perfectly coherent respondent still scores 34 to 58,
// median floor around 40. The published formula (agreement = 1 - distance / 4,
// averaged) cannot reach 0 against real parties, because no two parties sit at
// distance 4 on every statement. So 53 does not mean "half agree", it means
// "close to as far as a real party can be".
//
// The chosen fix is disclosure, not stretching: rescaling the display would
// break the hand-recomputable formula the methodology promises. This battery
// keeps the scale explained where the scores are read.

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, back: () => {}, prefetch: () => {} })
}));

function someAnswers(): AnswerRecord {
    const values: LikertValue[] = [-2, -1, 0, 1, 2];
    const answers: AnswerRecord = {};
    let seed = 3;
    for (const { id } of statementsFor('FR')) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        answers[id] = values[seed % 5];
    }
    return answers;
}

afterEach(cleanup);

describe('the effective score scale is explained where it is read', () => {
    it('tells the reader what the floor of the scale really is', () => {
        render(
            <ResultsView answers={someAnswers()} respondent={{ country: 'FR' }} onRestart={() => {}} />
        );
        expect(screen.getByText(/échelle utile/i)).toBeTruthy();
        expect(screen.getByText(/40/)).toBeTruthy();
    });

    it('is documented in the published methodology with the measured numbers', () => {
        const methodology = readFileSync(join(process.cwd(), 'METHODOLOGY.md'), 'utf8');
        expect(methodology).toMatch(/plage effective/i);
        expect(methodology).toMatch(/plancher/i);
    });
});
