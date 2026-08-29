// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ResultsView from '@/components/test/ResultsView';
import { computePartyMatches } from '@/lib/scoringEngine';
import { weightsForPriorities } from '@/lib/priorityWeights';
import { statementsFor } from '@/lib/electoralScope';
import { PARTY_POSITIONS } from '@/data/partyPositions';
import type { AnswerRecord } from '@/types/positions';

// The reader's fights, applied where the scores are read. Naming up to three
// dimensions doubles their statements in the displayed ranking, per the
// mechanism METHODOLOGY.md 3.4 publishes, and the page says out loud that the
// scores are weighted while it is on.

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, back: () => {}, prefetch: () => {} })
}));

const RESPONDENT = { country: 'FR' as const };

/** LFI's documented economy, indifference everywhere else. */
function economyLeaningAnswers(): AnswerRecord {
    const answers: AnswerRecord = {};
    for (const s of statementsFor('FR')) {
        const stance = s.dimension === 'economy' ? PARTY_POSITIONS[s.id]?.fr_lfi : undefined;
        answers[s.id] = stance && stance.status !== 'non_documente' ? stance.value : 0;
    }
    return answers;
}

function lfiScoreShown(): string {
    // Since 2026-08-29 (night) the party name also appears in the declared
    // fights panel; the score under test lives in the ranking row, so the
    // helper skips any occurrence inside that panel.
    const row = screen
        .getAllByText('La France Insoumise')
        .map((el) => el.closest('details'))
        .find((d) => d !== null && !d.hasAttribute('data-fights-panel'));
    expect(row).not.toBeNull();
    return row!.textContent ?? '';
}

afterEach(cleanup);

describe('naming your fights reweighs the displayed ranking', () => {
    it('doubling a dimension you echo a party on raises that party, visibly', () => {
        const answers = economyLeaningAnswers();
        const unweighted = computePartyMatches(answers, RESPONDENT).find(
            (m) => m.party.id === 'fr_lfi'
        )!.score;
        const weighted = computePartyMatches(answers, {
            ...RESPONDENT,
            weights: weightsForPriorities('FR', ['economy'])
        }).find((m) => m.party.id === 'fr_lfi')!.score;
        // The scenario must actually discriminate, or the test proves nothing.
        expect(weighted).toBeGreaterThan(unweighted);

        render(<ResultsView answers={answers} respondent={RESPONDENT} onRestart={() => {}} />);
        expect(lfiScoreShown()).toContain(`${unweighted}%`);

        fireEvent.click(screen.getByRole('button', { name: 'Économie' }));
        expect(lfiScoreShown()).toContain(`${weighted}%`);
    });

    it('says the scores are weighted while a fight is named', () => {
        render(
            <ResultsView answers={economyLeaningAnswers()} respondent={RESPONDENT} onRestart={() => {}} />
        );
        expect(screen.queryByText(/comptent double/)).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Économie' }));
        expect(screen.getByText(/comptent double/)).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Économie' }));
        expect(screen.queryByText(/comptent double/)).toBeNull();
    });

    it('stops at three fights: beyond that, nothing is a priority any more', () => {
        render(
            <ResultsView answers={economyLeaningAnswers()} respondent={RESPONDENT} onRestart={() => {}} />
        );
        for (const name of ['Économie', 'Société', 'Environnement']) {
            fireEvent.click(screen.getByRole('button', { name }));
        }
        const fourth = screen.getByRole('button', { name: 'Géopolitique' });
        expect(fourth.hasAttribute('disabled')).toBe(true);
    });
});
