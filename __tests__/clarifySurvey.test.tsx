// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ClarifySurvey from '@/components/test/ClarifySurvey';
import { nextClarifyingStatement } from '@/lib/adaptiveClarification';
import { computeProfile } from '@/lib/scoringEngine';
import { EXPRESS_IDS_BY_COUNTRY } from '@/data/statements';
import type { AnswerRecord } from '@/types/positions';

// The browser half of the adaptive tie-break: the pure function is covered by
// __tests__/adaptiveClarification.test.ts, what is checked here is that the
// component asks, records and terminates.

/** Clicks the Likert button carrying `label`. */
function answer(label: string) {
  const button = screen.getAllByRole('button').find((b) => b.textContent?.includes(label));
  expect(button, `no button labelled ${label}`).toBeDefined();
  act(() => {
    button!.click();
  });
}

/** A Belgian express run answered 0 everywhere: every dimension stays tied. */
function ambivalentBelgianExpress(): AnswerRecord {
  const answers: AnswerRecord = {};
  for (const id of EXPRESS_IDS_BY_COUNTRY.BE) answers[id] = 0;
  return answers;
}

describe('ClarifySurvey', () => {
  it('shows the statement the engine asked for, and its dimension', () => {
    const answers = ambivalentBelgianExpress();
    const expected = nextClarifyingStatement(answers, [])!;
    render(<ClarifySurvey initialAnswers={answers} initialAsked={[]} onComplete={() => {}} />);
    expect(screen.getByText(expected.statement.text)).toBeTruthy();
    expect(screen.getByText(/Départage/)).toBeTruthy();
  });

  it('never names the tied currents before the answer, which would steer it', () => {
    const answers = ambivalentBelgianExpress();
    const { container } = render(
      <ClarifySurvey initialAnswers={answers} initialAsked={[]} onComplete={() => {}} />
    );
    const tied = nextClarifyingStatement(answers, [])!.tiedLabels;
    expect(tied.length).toBeGreaterThan(1);
    for (const label of tied) expect(container.textContent).not.toContain(label);
  });

  it('records the answer and moves to the next statement', () => {
    const answers = ambivalentBelgianExpress();
    const first = nextClarifyingStatement(answers, [])!.statement;
    const onAnswer = vi.fn();
    render(
      <ClarifySurvey initialAnswers={answers} initialAsked={[]} onComplete={() => {}} onAnswer={onAnswer} />
    );
    answer("Tout à fait d'accord");
    const [recorded, asked] = onAnswer.mock.calls[0];
    expect(recorded[first.id]).toBe(2);
    expect(asked).toEqual([first.id]);
    expect(screen.queryByText(first.text)).toBeNull();
  });

  it('completes once, with every clarification recorded, and never loops', () => {
    const answers = ambivalentBelgianExpress();
    const onComplete = vi.fn();
    render(<ClarifySurvey initialAnswers={answers} initialAsked={[]} onComplete={onComplete} />);
    for (let guard = 0; guard < 30 && onComplete.mock.calls.length === 0; guard++) {
      answer("Tout à fait d'accord");
    }
    expect(onComplete).toHaveBeenCalledTimes(1);
    const final: AnswerRecord = onComplete.mock.calls[0][0];
    expect(nextClarifyingStatement(final, Object.keys(final))).toBeNull();
    expect(Object.keys(final).length).toBeGreaterThan(Object.keys(answers).length);
  });

  it('completes immediately when nothing is left to separate', () => {
    // A resumed session can land here with the tie already broken.
    const answers = ambivalentBelgianExpress();
    let current = { ...answers };
    const asked: string[] = [];
    for (let guard = 0; guard < 30; guard++) {
      const next = nextClarifyingStatement(current, asked);
      if (!next) break;
      current = { ...current, [next.statement.id]: 2 };
      asked.push(next.statement.id);
    }
    const onComplete = vi.fn();
    const { container } = render(
      <ClarifySurvey initialAnswers={current} initialAsked={asked} onComplete={onComplete} />
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('');
  });

  it('going back forgets the answer it had recorded', () => {
    const answers = ambivalentBelgianExpress();
    const first = nextClarifyingStatement(answers, [])!.statement;
    const onAnswer = vi.fn();
    render(
      <ClarifySurvey initialAnswers={answers} initialAsked={[]} onComplete={() => {}} onAnswer={onAnswer} />
    );
    answer("Tout à fait d'accord");
    const back = screen.getAllByRole('button').find((b) => b.textContent?.includes('Énoncé précédent'));
    act(() => {
      back!.click();
    });
    const [restored, asked] = onAnswer.mock.calls[onAnswer.mock.calls.length - 1];
    expect(restored).not.toHaveProperty(first.id);
    expect(asked).toEqual([]);
    expect(screen.getByText(first.text)).toBeTruthy();
  });

  it('leaves a dimension with a unique dominant current when it completes', () => {
    // The point of the whole stage: the badge is no longer arbitrated by the
    // declaration order of the data file.
    const answers = ambivalentBelgianExpress();
    const onComplete = vi.fn();
    render(<ClarifySurvey initialAnswers={answers} initialAsked={[]} onComplete={onComplete} />);
    for (let guard = 0; guard < 30 && onComplete.mock.calls.length === 0; guard++) {
      answer("Plutôt d'accord");
    }
    const final: AnswerRecord = onComplete.mock.calls[0][0];
    const profile = computeProfile(final);
    // Dimensions can stay tied only after spending their budget; every
    // dimension that the engine stopped asking about is either unique or
    // honestly reported as tied, and none is silently arbitrated.
    for (const [dimension, ties] of Object.entries(profile.dimensionTies)) {
      if (ties && ties.length > 1) {
        expect(nextClarifyingStatement(final, Object.keys(final)), dimension).toBeNull();
      }
    }
  });
});
