// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import ResultsView from '@/components/test/ResultsView';
import { PARTY_POSITIONS } from '@/data/partyPositions';
import { expressStatementsFor, statementsFor } from '@/lib/electoralScope';
import { computePartyMatches } from '@/lib/scoringEngine';
import { topPairSeparation } from '@/lib/partySeparation';
import type { AnswerRecord, Country, LikertValue } from '@/types/positions';

// Asked 2026-09-01: "il faudrait faire en sorte que si on fait la partie
// longue, ça soit beaucoup plus tranché, au niveau des différents partis,
// peut-être rajouter des questions qui permettraient de départager plus
// nettement".
//
// Measured before building anything (scripts/party-separation.ts, 300 seeded
// respondents per country):
//   - the leading group is already 1 party for a coherent respondent, even
//     with 30% of their answers re-rolled. The 3-to-8 figure from the day
//     before came from a uniform random panel, which is inseparable by
//     construction and was the wrong instrument.
//   - the gap between the first and the second is 5.3 points after the express
//     fifteen and 5.6 after the whole corpus. That is arithmetic: the score is
//     a mean over statements, so more statements converge it and narrow its
//     interval, they do not widen it. No statement of ordinary discriminating
//     power can change this, and there is nothing to prune either: none of the
//     35 French statements has a party spread below 0.75, and re-weighting the
//     corpus by discriminating power moved the gap by 0.2 points.
//   - the parties at the top are close because they are close in the coded
//     table: Renaissance and Horizons share 26 of 35 positions, Ecolo and Groen
//     33 of 33.
//
// So the request is answered by showing where the separation actually is,
// rather than by inflating a gap. The statements on which the top two genuinely
// diverge are what grows with the long run: measured 2.3 to 3.8 in France and
// 2.2 to 4.4 in Belgium.
//
// The invariants: the results screen names what divides the top two; it says so
// plainly when nothing does; and it never asserts a divergence the coded table
// does not carry.

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: () => {},
        replace: () => {},
        refresh: () => {},
        back: () => {},
        prefetch: () => {}
    }),
    usePathname: () => '/test',
    useSearchParams: () => new URLSearchParams()
}));

afterEach(cleanup);

/** A coherent respondent: one party's positions, answered at full intensity. */
function leaningTowards(partyId: string, country: Country, ids: string[]): AnswerRecord {
    const answers: AnswerRecord = {};
    for (const id of ids) {
        const coded = PARTY_POSITIONS[id]?.[partyId];
        if (coded === undefined) continue;
        answers[id] = (coded.value === 0 ? 0 : Math.sign(coded.value) * 2) as LikertValue;
    }
    return answers;
}

const allIds = (country: Country) => statementsFor(country).map((s) => s.id);
const expressIds = (country: Country) => expressStatementsFor(country).map((s) => s.id);

/**
 * The separation panel alone.
 *
 * The results screen prints every statement twice, once here and once in the
 * per-party detail below, so a page-wide query cannot tell which block made a
 * claim. These assertions are about this panel, so they are scoped to it.
 */
function separationPanel(): HTMLElement {
    const heading = screen.getByText(/Ce qui vous départage/);
    const section = heading.closest('section');
    if (section === null) throw new Error('the separation panel is not a section');
    return section;
}

describe('the results screen says what divides the top two', () => {
    it.each([
        ['FR', 'fr_lfi'],
        ['BE', 'be_nva']
    ] as const)('names both parties in %s', (country, partyId) => {
        const answers = leaningTowards(partyId, country, allIds(country));
        render(<ResultsView answers={answers} respondent={{ country }} onRestart={() => {}} />);

        const matches = computePartyMatches(answers, { country });
        const heading = screen.getByText(/Ce qui vous départage/);
        expect(heading.textContent).toContain(matches[0].party.name);
        expect(heading.textContent).toContain(matches[1].party.name);
    });

    it('states plainly when the corpus separates the top two on nothing', () => {
        // Renaissance and Horizons carry the same coded value on 26 of 35
        // French statements, and a Renaissance-leaning reader lands on exactly
        // that pair. Presenting their percentage gap as a result would be
        // reading coding noise.
        const answers = leaningTowards('fr_renaissance', 'FR', allIds('FR'));
        const separation = topPairSeparation(
            computePartyMatches(answers, { country: 'FR' }),
            answers,
            'FR'
        );

        render(<ResultsView answers={answers} respondent={{ country: 'FR' }} onRestart={() => {}} />);

        expect(separation?.separating).toHaveLength(0);
        expect(separationPanel().textContent).toContain('aucun énoncé');
    });

    it('never draws a divergence the coded table does not carry', () => {
        const answers = leaningTowards('fr_lfi', 'FR', allIds('FR'));
        const separation = topPairSeparation(
            computePartyMatches(answers, { country: 'FR' }),
            answers,
            'FR'
        );

        render(<ResultsView answers={answers} respondent={{ country: 'FR' }} onRestart={() => {}} />);

        for (const entry of separation?.separating.slice(0, 6) ?? []) {
            const coded = PARTY_POSITIONS[entry.statement.id];
            expect(coded[separation!.first.id].value).toBe(entry.firstPosition);
            expect(coded[separation!.second.id].value).toBe(entry.secondPosition);
            expect(within(separationPanel()).getByText(entry.statement.text)).toBeTruthy();
        }
    });

    it('rests on more divergences after the complete run than after the express one', () => {
        // The honest payoff of the long analysis. Not the percentage gap, which
        // is a mean and does not move: the number of concrete disagreements the
        // reader has actually arbitrated between the two parties at the top.
        const country: Country = 'FR';
        let longerOrEqual = 0;
        let strictlyLonger = 0;
        const parties = ['fr_lfi', 'fr_rn', 'fr_ps', 'fr_lr', 'fr_eelv', 'fr_pcf'];

        for (const partyId of parties) {
            const complete = leaningTowards(partyId, country, allIds(country));
            const express = leaningTowards(partyId, country, expressIds(country));
            const short = topPairSeparation(
                computePartyMatches(express, { country }),
                express,
                country
            );
            const full = topPairSeparation(
                computePartyMatches(complete, { country }),
                complete,
                country
            );
            if ((full?.comparable ?? 0) >= (short?.comparable ?? 0)) longerOrEqual += 1;
            if ((full?.comparable ?? 0) > (short?.comparable ?? 0)) strictlyLonger += 1;
        }

        expect(longerOrEqual).toBe(parties.length);
        expect(strictlyLonger).toBe(parties.length);
    });

    it('draws no separation panel for a respondent who answered nothing', () => {
        render(<ResultsView answers={{}} respondent={{ country: 'FR' }} onRestart={() => {}} />);

        expect(screen.queryByText(/Ce qui vous départage/)).toBeNull();
    });
});
