// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import StatementSurvey from '@/components/test/StatementSurvey';
import RespondentPicker from '@/components/test/RespondentPicker';
import ClarifySurvey from '@/components/test/ClarifySurvey';
import { expressStatementsFor } from '@/lib/electoralScope';
import { EXPRESS_IDS_BY_COUNTRY } from '@/data/statements';
import type { AnswerRecord } from '@/types/positions';

// Found 2026-08-29 in a manual session at a real 375px viewport: on the
// statement screen, "Sans opinion / passer" was 20px high and "Énoncé
// précédent" 40px, both under the 44px minimum a thumb needs. jsdom computes
// no layout, so what is asserted here is the declared minimum rather than the
// rendered box: it cannot measure the button, it can stop the guarantee being
// deleted.

const MIN_HEIGHT_CLASSES = ['min-h-[44px]', 'min-h-[3.25rem]'];

function undersizedControls(container: HTMLElement): string[] {
  return [...container.querySelectorAll('button, a')]
    .filter((element) => !MIN_HEIGHT_CLASSES.some((cls) => element.className.includes(cls)))
    .map((element) => element.textContent?.trim().slice(0, 40) ?? '');
}

describe('every control a thumb must hit declares a 44px minimum', () => {
  it('holds on the statement screen', () => {
    const { container } = render(
      <StatementSurvey
        statements={expressStatementsFor('FR')}
        initialAnswers={{}}
        onComplete={() => {}}
      />
    );
    expect(undersizedControls(container)).toEqual([]);
  });

  it('holds on the statement screen once a previous statement exists', () => {
    const { container } = render(
      <StatementSurvey
        statements={expressStatementsFor('BE')}
        initialAnswers={{}}
        onComplete={() => {}}
      />
    );
    const previous = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Énoncé précédent')
    );
    expect(previous, 'the back control is rendered').toBeDefined();
    expect(previous!.className).toContain('min-h-[44px]');
  });

  it('holds on the country screen', () => {
    const { container } = render(<RespondentPicker onChoose={() => {}} />);
    expect(undersizedControls(container)).toEqual([]);
  });

  it('holds on the tie-break screen', () => {
    const ambivalent: AnswerRecord = {};
    for (const id of EXPRESS_IDS_BY_COUNTRY.BE) ambivalent[id] = 0;
    const { container } = render(
      <ClarifySurvey initialAnswers={ambivalent} initialAsked={[]} onComplete={() => {}} />
    );
    expect(undersizedControls(container)).toEqual([]);
  });
});
