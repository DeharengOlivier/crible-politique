// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import TestPage from '@/app/test/page';
import { decodeProfile } from '@/lib/profileCode';

// A version 3 share code is read against the CURRENT corpus, so a link minted
// when France asked 33 statements stops decoding the day France asks 35. Those
// links are deliberately let go (see shareCodeFixturesAreCurrent.test.ts, the
// owner's decision of 2026-08-31): what is not accepted is the failure being
// silent.
//
// Measured that day: /test#p=<stale code> fell through restoreFlow to the
// ordinary introduction screen. The reader who followed a link a friend sent
// them saw the front door of the questionnaire, with nothing said, and no way
// to tell a dead link from a mistyped one or from having landed on the right
// page. Refusing the code is right; refusing it wordlessly is not.
//
// The invariant: a share code that is present and unreadable is announced.
// Boundaries covered below: no code at all (nothing to announce), a valid code
// (opens, announces nothing), and a code that is merely malformed rather than
// stale, which is the same thing to a reader and must read the same.

// Minted against the 33-statement French corpus, before 2026-08-30. Kept as a
// literal on purpose: regenerating it would defeat the test.
const STALE_V3 = '3fdcbedcbbdddedcdcdbdedccdbebdecsy';
const MALFORMED = '3zzzz';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace: () => {}, push: () => {} }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/test'
}));

function visit(fragment: string): void {
    window.location.hash = fragment;
}

beforeEach(() => {
    localStorage.clear();
    visit('');
});

afterEach(() => {
    cleanup();
    visit('');
    vi.unstubAllEnvs();
});

describe('a share link that no longer opens says so', () => {
    it('the fixture really is unreadable, which is what makes this test mean anything', () => {
        expect(decodeProfile(STALE_V3)).toBeNull();
        expect(decodeProfile(MALFORMED)).toBeNull();
    });

    it.each([
        ['a code minted against an older corpus', STALE_V3],
        ['a code that is simply malformed', MALFORMED]
    ])('announces %s instead of opening the front door in silence', async (_case, code) => {
        visit(`#p=${code}`);
        render(<TestPage />);
        expect(await screen.findByRole('status')).toHaveTextContent(/lien de partage/i);
    });

    it('says nothing when the reader arrived without a link', () => {
        render(<TestPage />);
        expect(screen.queryByRole('status')).toBeNull();
    });
});
