// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import ResultsView from '@/components/test/ResultsView';
import { answersLikeParty, scopeOfParty, seededAnswers } from './support/respondents';

// Reported by a reader on 2026-08-29 (night): "à égalité en tête" was printed
// next to parties showing different percentages (61 and 59), because the badge
// carried the result of the paired statistical test. Whatever the statistics
// say, a badge that claims equality next to two different numbers reads as a
// bug. The badge now means one thing only: the same percentage is displayed.
// The statistical result did not disappear, it moved to a sentence that says
// what it actually means.

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, back: () => {}, prefetch: () => {} })
}));

const BADGE = 'à égalité en tête';

afterEach(cleanup);

describe('the "à égalité en tête" badge', () => {
    it('marks the parties that really show the same percentage', () => {
        // Measured: a respondent answering Ecolo's documented positions scores
        // Ecolo and Groen at exactly 100, their coding being identical.
        render(
            <ResultsView
                answers={answersLikeParty('be_ecolo')}
                respondent={scopeOfParty('be_ecolo')}
                onRestart={() => {}}
            />
        );
        expect(screen.getAllByText(BADGE)).toHaveLength(2);
    });

    it('never marks a party whose percentage differs, however wide the leading group', () => {
        // Measured: seed 1 in France gives 61 alone at the top, and the paired
        // test separates the leader from nobody (group of 12). Not one badge.
        render(
            <ResultsView
                answers={seededAnswers('FR', 1)}
                respondent={{ country: 'FR' }}
                onRestart={() => {}}
            />
        );
        expect(screen.queryAllByText(BADGE)).toHaveLength(0);
    });

    it('never marks anything when one party leads alone', () => {
        render(
            <ResultsView
                answers={answersLikeParty('fr_lfi')}
                respondent={scopeOfParty('fr_lfi')}
                onRestart={() => {}}
            />
        );
        expect(screen.queryAllByText(BADGE)).toHaveLength(0);
    });
});

describe('what the page says under the list', () => {
    it('names the parties the answers do not separate, and says the percentages differ', () => {
        render(
            <ResultsView
                answers={seededAnswers('FR', 1)}
                respondent={{ country: 'FR' }}
                onRestart={() => {}}
            />
        );
        expect(screen.getByText(/ne départagent pas les 12 premiers/)).toBeTruthy();
        expect(screen.getByText(/même si leurs pourcentages diffèrent/)).toBeTruthy();
    });

    it('says the leader is alone when the answers separate it from everyone', () => {
        render(
            <ResultsView
                answers={answersLikeParty('fr_lfi')}
                respondent={scopeOfParty('fr_lfi')}
                onRestart={() => {}}
            />
        );
        expect(screen.getByText(/est seul en tête/)).toBeTruthy();
    });

    it('states the exact tie in clear text when two parties share the score', () => {
        render(
            <ResultsView
                answers={answersLikeParty('be_ecolo')}
                respondent={scopeOfParty('be_ecolo')}
                onRestart={() => {}}
            />
        );
        expect(screen.getByText(/exactement le même score/)).toBeTruthy();
    });
});

describe('the single reading', () => {
    it('offers no reading selector any more', () => {
        render(
            <ResultsView
                answers={seededAnswers('FR', 1)}
                respondent={{ country: 'FR' }}
                onRestart={() => {}}
            />
        );
        expect(screen.queryByRole('button', { name: 'Directionnelle' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Proximité' })).toBeNull();
    });

    it('still explains what the displayed score measures', () => {
        render(
            <ResultsView
                answers={seededAnswers('FR', 1)}
                respondent={{ country: 'FR' }}
                onRestart={() => {}}
            />
        );
        expect(screen.getByText(/distance moyenne entre vos réponses et celles du parti/)).toBeTruthy();
    });
});
