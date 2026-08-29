// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ResultsView from '@/components/test/ResultsView';
import { statementsFor } from '@/lib/electoralScope';
import type { AnswerRecord } from '@/types/positions';

// "Vos combats prioritaires" only means something next to the other half of
// the comparison: what each party itself says it fights for. Every party is
// shown the same way, from its own programme, with the document linked so a
// reader can go and check. A fight the questionnaire does not ask about says
// so instead of being marked.

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

function rowOf(partyName: string): HTMLElement {
    const row = screen
        .getByText(partyName, { selector: '[data-fights-row] *' })
        .closest('[data-fights-row]');
    expect(row).not.toBeNull();
    return row as HTMLElement;
}

afterEach(cleanup);

describe('the declared fights of the parties', () => {
    it('shows the panel and says where the fights come from', () => {
        renderResults();
        expect(screen.getByText('Les combats déclarés des partis')).toBeTruthy();
        expect(screen.getAllByText(/Codage préliminaire/).length).toBeGreaterThan(0);
    });

    it('gives the RN its own words, with the document linked', () => {
        renderResults();
        const row = rowOf('Rassemblement National');
        expect(row.textContent).toContain('Immigration');
        expect(row.textContent).toContain('submersion migratoire');
        const source = row.querySelector('a');
        expect(source?.getAttribute('href')).toContain('rassemblementnational.fr');
    });

    it('treats the UPR exactly like the others, with its programme linked', () => {
        renderResults();
        const row = rowOf('Union Populaire Républicaine (UPR)');
        expect(row.textContent).toMatch(/OTAN/);
        expect(row.textContent).not.toMatch(/Estimation/);
        expect(row.querySelector('a')?.getAttribute('href')).toContain('upr.fr');
    });

    it('quotes the Patriotes programme on the Frexit being the keystone', () => {
        renderResults();
        const row = rowOf('Les Patriotes');
        expect(row.textContent).toMatch(/Frexit/);
        expect(row.querySelector('a')?.getAttribute('href')).toContain('les-patriotes.fr');
    });

    it('shows no expert-panel score any more', () => {
        renderResults();
        expect(screen.queryAllByText(/\/10/)).toHaveLength(0);
        expect(screen.queryAllByText(/saillance/i)).toHaveLength(0);
    });

    it('marks the fights that fall inside the dimensions the reader named', () => {
        renderResults();
        expect(screen.queryAllByText('dans vos priorités')).toHaveLength(0);

        fireEvent.click(screen.getByRole('button', { name: 'Géopolitique' }));
        expect(screen.getAllByText('dans vos priorités').length).toBeGreaterThan(0);

        fireEvent.click(screen.getByRole('button', { name: 'Géopolitique' }));
        expect(screen.queryAllByText('dans vos priorités')).toHaveLength(0);
    });

    it('says which fights the questionnaire simply does not ask about', () => {
        render(
            <ResultsView
                answers={(() => {
                    const answers: AnswerRecord = {};
                    for (const s of statementsFor('BE')) answers[s.id] = 0;
                    return answers;
                })()}
                respondent={{ country: 'BE', college: 'wallonie' }}
                onRestart={() => {}}
            />
        );
        expect(screen.getAllByText('hors questionnaire').length).toBeGreaterThan(0);
    });
});
