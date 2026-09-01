// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { analysisCoverage, leadingIntervalWidth } from '@/lib/analysisCoverage';
import { computePartyMatches } from '@/lib/scoringEngine';
import { expressStatementsFor, statementsFor } from '@/lib/electoralScope';
import ResultsView from '@/components/test/ResultsView';
import type { AnswerRecord, Country, LikertValue } from '@/types/positions';

// Asked 2026-09-01, alongside the door bug: "il faut que la réponse en long
// form soit bcp plus précise que celle en form court".
//
// Measured the same day, on five pseudo-random French respondents: the complete
// analysis IS more precise. The confidence interval on the leading party is 16
// to 26 points wide after the express fifteen and 13 to 18 points after the
// whole corpus, and the leading group of statistically inseparable parties goes
// from 4-12 down to 3-8. So the scoring did its part.
//
// What was missing is everything around it. The two results were presented
// identically: nothing said how many statements a ranking rested on, nothing
// said an express result was provisional, and the results screen offered no way
// to finish an analysis left half done. The offer to continue existed only on
// the teaser, one screen earlier, and was gone for good once passed. A reader
// who took the express analysis was therefore shown a coarse result with the
// confidence of a complete one, and could not have done better even wanting to.
//
// The invariants: a result says what it rests on; an incomplete one says so and
// offers the way out; a complete one says there is nothing more to answer; and
// nobody is invited to finish an analysis that is not theirs.

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, back: () => {}, prefetch: () => {} }),
    usePathname: () => '/test',
    useSearchParams: () => new URLSearchParams()
}));

function answersOver(ids: string[], seed0 = 7): AnswerRecord {
    const values: LikertValue[] = [-2, -1, 0, 1, 2];
    const answers: AnswerRecord = {};
    let seed = seed0;
    for (const id of ids) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        answers[id] = values[seed % 5];
    }
    return answers;
}

const expressAnswers = (country: Country) =>
    answersOver(expressStatementsFor(country).map((s) => s.id));
const fullAnswers = (country: Country) => answersOver(statementsFor(country).map((s) => s.id));

afterEach(cleanup);

describe('analysisCoverage, the measurement behind the claim', () => {
    it.each(['FR', 'BE'] as const)('counts the express run as partial in %s', (country) => {
        const coverage = analysisCoverage(country, expressAnswers(country));
        expect(coverage.answered).toBe(expressStatementsFor(country).length);
        expect(coverage.corpus).toBe(statementsFor(country).length);
        expect(coverage.remaining).toBe(coverage.corpus - coverage.answered);
        expect(coverage.complete).toBe(false);
    });

    it.each(['FR', 'BE'] as const)('counts the whole corpus as complete in %s', (country) => {
        const coverage = analysisCoverage(country, fullAnswers(country));
        expect(coverage.complete).toBe(true);
        expect(coverage.remaining).toBe(0);
    });

    it('does not count a "no opinion" as an answer', () => {
        // It contributes nothing to the scoring, so it must contribute nothing
        // to a claim about how much the scoring had to work with.
        const ids = statementsFor('FR').map((s) => s.id);
        const answers = answersOver(ids);
        answers[ids[0]] = null;
        const coverage = analysisCoverage('FR', answers);
        expect(coverage.complete).toBe(false);
        expect(coverage.remaining).toBe(1);
    });

    it('ignores answers to statements this country never asks', () => {
        // A profile can arrive from across the border or from an older corpus.
        const answers = { ...expressAnswers('FR'), be_only_statement_that_does_not_exist: 2 as LikertValue };
        const coverage = analysisCoverage('FR', answers);
        expect(coverage.answered).toBe(expressStatementsFor('FR').length);
        expect(coverage.remaining).toBeGreaterThan(0);
    });

    it('never reports negative work left, whatever it is handed', () => {
        const answers = { ...fullAnswers('FR'), ...fullAnswers('BE') };
        expect(analysisCoverage('FR', answers).remaining).toBe(0);
    });
});

describe('the complete analysis really is the more precise one', () => {
    // The claim the interface is about to make, held to a measurement rather
    // than to a comment. If a corpus change ever made the long form no better,
    // this fails before the copy starts promising it.
    it.each(['FR', 'BE'] as const)('narrows the interval on the leader in %s', (country) => {
        const short = leadingIntervalWidth(computePartyMatches(expressAnswers(country), { country }));
        const long = leadingIntervalWidth(computePartyMatches(fullAnswers(country), { country }));
        expect(long).toBeLessThan(short);
    });
});

describe('a result says what it rests on', () => {
    const respondent = { country: 'FR' } as const;

    it('names the statements behind an express result, and offers to finish it', () => {
        const answers = expressAnswers('FR');
        const onContinue = vi.fn();
        render(
            <ResultsView
                answers={answers}
                respondent={respondent}
                onRestart={() => {}}
                onContinue={onContinue}
            />
        );
        const coverage = analysisCoverage('FR', answers);
        expect(screen.getByRole('status')).toHaveTextContent(
            new RegExp(`${coverage.answered}[^0-9]{0,20}${coverage.corpus}`)
        );
        fireEvent.click(screen.getByRole('button', { name: /répondre aux .* restants/i }));
        expect(onContinue).toHaveBeenCalledTimes(1);
    });

    it('says a complete result has nothing left to answer', () => {
        render(
            <ResultsView
                answers={fullAnswers('FR')}
                respondent={respondent}
                onRestart={() => {}}
                onContinue={() => {}}
            />
        );
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent(/analyse complète/i);
        expect(screen.queryByRole('button', { name: /répondre aux .* restants/i })).toBeNull();
    });

    it('shows how wide the interval is, which is what precision means here', () => {
        const answers = expressAnswers('FR');
        render(
            <ResultsView
                answers={answers}
                respondent={respondent}
                onRestart={() => {}}
                onContinue={() => {}}
            />
        );
        const width = leadingIntervalWidth(computePartyMatches(answers, respondent));
        expect(screen.getByRole('status')).toHaveTextContent(new RegExp(`${width} points`));
    });

    it('does not invite anyone to finish an analysis that is not theirs', () => {
        // A shared profile is someone else's answers. "Answer the remaining
        // twenty" would mean answering them in their name.
        render(
            <ResultsView answers={expressAnswers('FR')} respondent={respondent} onRestart={() => {}} />
        );
        expect(screen.queryByRole('button', { name: /répondre aux .* restants/i })).toBeNull();
        // It still says what the result rests on: that is true of anyone's.
        expect(screen.getByRole('status')).toHaveTextContent(/15/);
    });
});
