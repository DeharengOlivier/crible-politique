// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import ResultsView from '@/components/test/ResultsView';
import ConceptsPage from '@/app/concepts/page';
import { computeProfile } from '@/lib/scoringEngine';
import { encodeBadge } from '@/lib/badgeCode';
import { familyCompositionOf } from '@/lib/familyComposition';
import { statementsFor } from '@/lib/electoralScope';
import { SYNTHETIC_PROFILES } from '@/data/syntheticProfiles';
import { DEFINITIONS } from '@/data/definitions';
import { DIMENSION_ORDER } from '@/types/positions';
import type { AnswerRecord, LikertValue } from '@/types/positions';

// Since 2026-08-29 the two layers of a result are tied together on screen. The
// reader used to see a family title above seven currents with nothing saying
// how one produced the other; the family read as an unexplained verdict. Every
// surface that names a family now also shows what it is made of: the currents
// it expects, dimension by dimension, and which dimensions it says nothing
// about. And every current on the compass carries its own definition, so a
// label is never the end of the explanation.

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, back: () => {}, prefetch: () => {} })
}));

const RESPONDENT = { country: 'FR' as const };

function deterministicAnswers(): AnswerRecord {
    const values: LikertValue[] = [-2, -1, 0, 1, 2];
    const answers: AnswerRecord = {};
    let seed = 7;
    for (const { id } of statementsFor('FR')) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        answers[id] = values[seed % 5];
    }
    return answers;
}

afterEach(cleanup);

describe('the results explain what the named family is made of', () => {
    it('shows the expected currents of every family in the leading group', () => {
        const answers = deterministicAnswers();
        const { leadingGroup } = computeProfile(answers).syntheticProfileFit;
        render(<ResultsView answers={answers} respondent={RESPONDENT} onRestart={() => {}} />);

        for (const family of leadingGroup) {
            for (const reading of familyCompositionOf(family).constrained) {
                for (const label of reading.expected) {
                    expect(
                        screen.getAllByText(new RegExp(label)).length,
                        `${family.id} / ${label}`
                    ).toBeGreaterThan(0);
                }
            }
        }
    });

    it('shows no silent dimension: every family describes all seven', () => {
        // Specification changed 2026-08-29 (night): families used to constrain
        // one to three dimensions and the cards disclosed the silence. At the
        // reader's demand every family now describes all seven, so the silence
        // line must be gone, and each unfolded card carries seven expectations.
        const answers = deterministicAnswers();
        const { container } = render(
            <ResultsView answers={answers} respondent={RESPONDENT} onRestart={() => {}} />
        );
        expect(screen.queryByText(/n['’]entrent pas dans la définition/)).toBeNull();
        const groupSize = computeProfile(answers).syntheticProfileFit.leadingGroup.length;
        const expectations = [...container.querySelectorAll('p')].filter((p) =>
            p.textContent?.startsWith('Attend:')
        );
        expect(expectations.length).toBe(7 * groupSize);
    });

    it('shows how well each family of the group matches, so two can be compared', () => {
        const answers = deterministicAnswers();
        const fit = computeProfile(answers).syntheticProfileFit;
        render(<ResultsView answers={answers} respondent={RESPONDENT} onRestart={() => {}} />);
        for (const family of fit.leadingGroup) {
            expect(
                screen.getAllByText(`${fit.scores[family.id]}%`).length,
                `${family.id} score shown`
            ).toBeGreaterThan(0);
        }
    });

    it('lays the respondent\'s own current against each expectation', () => {
        const answers = deterministicAnswers();
        const profile = computeProfile(answers);
        const family = profile.syntheticProfileFit.family!;
        const firstConstrained = familyCompositionOf(family).constrained[0].dimension;
        const held = profile.dimensionArchetypes[firstConstrained]!.label;
        render(<ResultsView answers={answers} respondent={RESPONDENT} onRestart={() => {}} />);

        const yours = screen.getAllByText(/Votre courant/);
        expect(yours.length).toBeGreaterThan(0);
        expect(screen.getAllByText(new RegExp(held)).length).toBeGreaterThan(0);
    });
});

describe('every current on the compass explains itself', () => {
    it('carries the published definition of the dominant current, per dimension', () => {
        const answers = deterministicAnswers();
        const profile = computeProfile(answers);
        render(<ResultsView answers={answers} respondent={RESPONDENT} onRestart={() => {}} />);

        for (const dim of DIMENSION_ORDER) {
            const archetype = profile.dimensionArchetypes[dim];
            if (!archetype) continue;
            const definition = (DEFINITIONS[dim] as Record<string, string>)[archetype.label];
            expect(definition, `${dim} / ${archetype.label} has a definition`).toBeTruthy();
            expect(document.body.textContent, `${dim} definition rendered`).toContain(definition);
        }
    });
});

describe('the glossary shows the composition of every family', () => {
    it('names the expected currents on each family card, under an anchor', () => {
        const { container } = render(<ConceptsPage />);
        for (const family of SYNTHETIC_PROFILES) {
            const card = container.querySelector(`#${family.id}`);
            expect(card, `anchor for ${family.id}`).not.toBeNull();
            for (const reading of familyCompositionOf(family).constrained) {
                for (const label of reading.expected) {
                    expect(card!.textContent).toContain(label);
                }
            }
        }
    });

    it('explains the two layers instead of listing families as an eighth dimension', () => {
        render(<ConceptsPage />);
        expect(screen.getByText(/combinaison/i)).toBeTruthy();
    });
});

describe('the shared card explains the family it shows', () => {
    it('names the defining dimensions and their expected currents', async () => {
        const answers = deterministicAnswers();
        const profile = computeProfile(answers);
        const family = profile.syntheticProfileFit.family!;

        const SharedProfilePage = (await import('@/app/p/[code]/page')).default;
        render(await SharedProfilePage({ params: Promise.resolve({ code: encodeBadge(profile) }) }));

        for (const reading of familyCompositionOf(family).constrained) {
            for (const label of reading.expected) {
                expect(screen.getAllByText(new RegExp(label)).length).toBeGreaterThan(0);
            }
        }
        expect(screen.getByText(/se définit par/)).toBeTruthy();
    });
});
