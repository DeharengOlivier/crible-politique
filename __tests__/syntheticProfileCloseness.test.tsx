// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import ResultsView from '@/components/test/ResultsView';
import { computeProfile } from '@/lib/scoringEngine';
import { encodeBadge } from '@/lib/badgeCode';
import { statementsFor } from '@/lib/electoralScope';
import type { AnswerRecord, LikertValue } from '@/types/positions';

// Since 2026-08-29 every completed analysis is named: the family shown is the
// closest one rather than the first predicate to accept the answers, so nobody
// lands on "Profil singulier" by accident any more. That removes an arbitrary
// silence and introduces a new way to mislead: a name given with the same
// confidence whether it stands alone or barely leads a crowd.
//
// Measured the same day, the crowd is the normal case: the answers cannot
// separate the leader from a median of four families out of fourteen, and that
// holds for a respondent reproducing a party's documented positions exactly. The
// results have to say which ones, the way the party ranking already names its
// leading group instead of announcing a winner.

// ResultsView reads the router to offer the duo comparison. jsdom mounts no
// app router, so the hook is stubbed; nothing under test navigates.
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, back: () => {}, prefetch: () => {} })
}));

const RESPONDENT = { country: 'FR' as const };

/** Answers whose leading group of families has exactly `size` members. */
function answersWithGroupOf(size: number): AnswerRecord {
    const ids = statementsFor('FR').map((s) => s.id);
    const values: LikertValue[] = [-2, -1, 0, 1, 2];
    let seed = 1;
    for (let attempt = 0; attempt < 20000; attempt += 1) {
        const answers: AnswerRecord = {};
        for (const id of ids) {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            answers[id] = values[seed % 5];
        }
        if (computeProfile(answers).syntheticProfileFit.leadingGroup.length === size) return answers;
    }
    throw new Error(`no answer set found whose leading group holds ${size} families`);
}

afterEach(cleanup);

describe('the results say which families the answers cannot separate', () => {
    it('names every other family of the leading group', () => {
        const answers = answersWithGroupOf(3);
        const [, ...others] = computeProfile(answers).syntheticProfileFit.leadingGroup;
        render(<ResultsView answers={answers} respondent={RESPONDENT} onRestart={() => {}} />);

        // getAllByText since 2026-08-29: each family of the group is now also
        // named by its composition card, so appearing more than once is the
        // feature, not a defect. The invariant stays: named at least once.
        for (const family of others) {
            expect(screen.getAllByText(new RegExp(family.title)).length).toBeGreaterThan(0);
        }
        expect(screen.getByText(/collent autant à vos réponses/)).toBeTruthy();
    });

    it('says the same thing on the card that gets shared', async () => {
        // The card is what circulates, and it is read as a claim about a
        // person. It must not name one family alone while the results name
        // three: the tool would be contradicting itself in public.
        const answers = answersWithGroupOf(3);
        const profile = computeProfile(answers);
        const [, ...others] = profile.syntheticProfileFit.leadingGroup;

        const SharedProfilePage = (await import('@/app/p/[code]/page')).default;
        render(await SharedProfilePage({ params: Promise.resolve({ code: encodeBadge(profile) }) }));

        for (const family of others) {
            expect(screen.getByText(new RegExp(family.title))).toBeTruthy();
        }
        expect(screen.getByText(/collent autant/)).toBeTruthy();
    });

    it('says it in the widget that runs on someone else\'s page too', async () => {
        // The embed is the most assertive form of the claim with the least
        // context around it, so it is the last place where a single title
        // should be allowed to stand for a whole result.
        const answers = answersWithGroupOf(3);
        const [, ...others] = computeProfile(answers).syntheticProfileFit.leadingGroup;
        const { EmbedResults } = await import('@/app/embed/page');
        render(<EmbedResults answers={answers} country="FR" />);

        for (const family of others) {
            expect(screen.getByText(new RegExp(family.title))).toBeTruthy();
        }
        expect(screen.getByText(/familles à égalité/)).toBeTruthy();
    });

    it('says so when the closest family stands alone', () => {
        render(
            <ResultsView
                answers={answersWithGroupOf(1)}
                respondent={RESPONDENT}
                onRestart={() => {}}
            />
        );
        expect(screen.queryByText(/collent autant à vos réponses/)).toBeNull();
        expect(screen.getByText(/Aucune autre famille/)).toBeTruthy();
    });
});
