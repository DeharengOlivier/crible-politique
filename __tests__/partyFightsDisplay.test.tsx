// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ResultsView from '@/components/test/ResultsView';
import { statementsFor } from '@/lib/electoralScope';
import type { AnswerRecord } from '@/types/positions';

// "Vos combats prioritaires" only makes sense next to the other half of the
// comparison: what each party itself fights for. The results page shows the
// declared fights of every ranked party, sourced (CHES 2024 salience, or a
// documented estimate for the two parties CHES does not cover), and marks the
// fights that fall inside the dimensions the reader named.

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, back: () => {}, prefetch: () => {} })
}));

const RESPONDENT = { country: 'FR' as const };

function neutralAnswers(): AnswerRecord {
    const answers: AnswerRecord = {};
    for (const s of statementsFor('FR')) answers[s.id] = 0;
    return answers;
}

function renderResults() {
    render(<ResultsView answers={neutralAnswers()} respondent={RESPONDENT} onRestart={() => {}} />);
}

afterEach(cleanup);

describe('the declared fights of the parties', () => {
    it('shows the panel with its source named', () => {
        renderResults();
        expect(screen.getByText('Les combats déclarés des partis')).toBeTruthy();
        expect(screen.getAllByText(/CHES 2024/).length).toBeGreaterThan(0);
    });

    it('gives the RN its measured fights, value included, in French notation', () => {
        renderResults();
        const row = screen.getByText('Rassemblement National', { selector: '[data-fights-row] *' })
            .closest('[data-fights-row]');
        expect(row).not.toBeNull();
        expect(row!.textContent).toContain('Multiculturalisme');
        expect(row!.textContent).toContain('9,7');
    });

    it('marks the UPR as estimated and states its declared fight in clear text', () => {
        renderResults();
        const row = screen.getByText('Union Populaire Républicaine (UPR)', { selector: '[data-fights-row] *' })
            .closest('[data-fights-row]');
        expect(row).not.toBeNull();
        expect(row!.textContent).toMatch(/[Ee]stimation/);
        expect(row!.textContent).toMatch(/OTAN/);
    });

    it('marks the fights that fall inside the dimensions the reader named', () => {
        renderResults();
        expect(screen.queryAllByText('dans vos priorités')).toHaveLength(0);

        fireEvent.click(screen.getByRole('button', { name: 'Géopolitique' }));
        expect(screen.getAllByText('dans vos priorités').length).toBeGreaterThan(0);

        fireEvent.click(screen.getByRole('button', { name: 'Géopolitique' }));
        expect(screen.queryAllByText('dans vos priorités')).toHaveLength(0);
    });

    it('says out loud which dimensions CHES measures no salience for', () => {
        renderResults();
        expect(screen.getByText(/Connaissance/, { selector: '[data-fights-panel] p' }).textContent)
            .toMatch(/Morale politique/);
    });
});
