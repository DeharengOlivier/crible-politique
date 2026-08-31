// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AccountBadge from '@/components/AccountBadge';
import { claimsFromIdToken, currentIdToken, loadGoogleIdentity } from '@/lib/googleSession';
import { encryptProfile } from '@/lib/profileVault';
import { statementsFor } from '@/lib/electoralScope';
import { TEST_SESSION_STORAGE_KEY, loadSavedSession } from '@/lib/testSession';
import type { AnswerRecord, LikertValue } from '@/types/positions';

// Requested 2026-08-29 (night): signing in lives in the top right corner of
// every page, as a small Google button; once signed in, the button becomes the
// reader's own Google picture, which is how a person checks they are actually
// connected. The test page has no chrome at all, so the badge stays off it.
//
// What is kept in this browser is the display identity (name and picture URL),
// never the Google ID token: the token is a bearer credential for the vault
// API, and nothing that grants access is written to storage.

const pathname = vi.hoisted(() => ({ current: '/' }));
vi.mock('next/navigation', () => ({
    usePathname: () => pathname.current,
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, back: () => {}, prefetch: () => {} })
}));

const ID_TOKEN = vi.hoisted(() => {
    const payload = {
        name: 'Camille Réunion',
        picture: 'https://lh3.googleusercontent.com/a/photo=s96-c',
        email: 'camille@example.org'
    };
    const b64url = (value: string) =>
        btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    // The payload carries an accented name, so a naive atob() would mangle it.
    const utf8 = String.fromCharCode(...new TextEncoder().encode(JSON.stringify(payload)));
    return `${b64url('{"alg":"RS256"}')}.${b64url(utf8)}.fake-signature`;
});

vi.mock('@/components/profile/GoogleSignInButton', () => ({
    default: ({ onIdToken }: { onIdToken: (t: string) => void }) => (
        <button type="button" onClick={() => onIdToken(ID_TOKEN)}>
            FAKE_GOOGLE
        </button>
    )
}));

const KEY_BYTES = new Uint8Array(32).fill(4);
const KEY_B64 = btoa(String.fromCharCode(...KEY_BYTES));

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

async function fakeServerWithVault(answers: AnswerRecord) {
    const sealed = await encryptProfile(
        { country: 'FR', college: null, answers, savedAt: '2026-08-29T12:00:00.000Z' },
        { raw: KEY_BYTES }
    );
    vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string) => {
            const target = String(url);
            if (target.endsWith('/vault/key')) {
                return new Response(JSON.stringify({ key: KEY_B64 }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                });
            }
            if (target.endsWith('/vault')) {
                return new Response(JSON.stringify(sealed), {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                });
            }
            return new Response(null, { status: 404 });
        })
    );
}

beforeEach(() => {
    pathname.current = '/';
    vi.stubEnv('NEXT_PUBLIC_CRIBLE_API_URL', 'https://api.example');
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'client-123.apps.googleusercontent.com');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 404 })));
});

afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    localStorage.clear();
});

describe('claimsFromIdToken', () => {
    it('reads the display name and picture, accents included', () => {
        expect(claimsFromIdToken(ID_TOKEN)).toEqual({
            name: 'Camille Réunion',
            picture: 'https://lh3.googleusercontent.com/a/photo=s96-c'
        });
    });

    it('returns null on anything that is not a token with a readable payload', () => {
        for (const bad of ['', 'not-a-token', 'a.b', 'a.!!!.c', `a.${btoa('[]')}.c`]) {
            expect(claimsFromIdToken(bad), bad).toBeNull();
        }
    });

    it('keeps a name without a picture, and refuses a payload with neither', () => {
        const b64url = (v: string) => btoa(v).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const nameOnly = `h.${b64url('{"name":"Sans Photo"}')}.s`;
        expect(claimsFromIdToken(nameOnly)).toEqual({ name: 'Sans Photo', picture: null });
        const neither = `h.${b64url('{"email":"x@example.org"}')}.s`;
        expect(claimsFromIdToken(neither)).toBeNull();
    });
});

describe('the account badge', () => {
    it('offers the Google sign-in when nobody is signed in', () => {
        render(<AccountBadge />);
        expect(screen.getByText('FAKE_GOOGLE')).toBeTruthy();
        expect(screen.queryByRole('img')).toBeNull();
    });

    it('stays off the questionnaire, which has no chrome', () => {
        pathname.current = '/test';
        const { container } = render(<AccountBadge />);
        expect(container.innerHTML).toBe('');
    });

    it('comes back on the results, the one screen of /test that offers to save', () => {
        // Added 2026-08-30 with the removal of every other Google button: the
        // save card no longer signs anyone in, so the bubble has to be reachable
        // where saving is offered, and only there.
        pathname.current = '/test';
        localStorage.setItem(
            TEST_SESSION_STORAGE_KEY,
            JSON.stringify({ stage: 'results', answers: deterministicAnswers(), respondent: { country: 'FR' } })
        );
        render(<AccountBadge />);
        expect(screen.getByText('FAKE_GOOGLE')).toBeTruthy();
    });

    it('remembers the token in memory so the results page can save, and never stores it', async () => {
        await fakeServerWithVault(deterministicAnswers());
        render(<AccountBadge />);
        fireEvent.click(screen.getByText('FAKE_GOOGLE'));

        await waitFor(() => expect(currentIdToken()).toBe(ID_TOKEN));
        expect(JSON.stringify(localStorage)).not.toContain('fake-signature');
        expect(sessionStorage.length).toBe(0);
    });

    it('stays away entirely when the deployment has no vault', () => {
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', '');
        const { container } = render(<AccountBadge />);
        expect(container.innerHTML).toBe('');
    });

    it('becomes the reader own picture once signed in, with a menu', async () => {
        await fakeServerWithVault(deterministicAnswers());
        render(<AccountBadge />);
        fireEvent.click(screen.getByText('FAKE_GOOGLE'));

        const avatar = await screen.findByRole('img', { name: /Camille Réunion/ });
        expect(avatar.getAttribute('src')).toContain('googleusercontent.com');

        fireEvent.click(screen.getByRole('button', { name: /Camille Réunion/ }));
        expect(screen.getByRole('link', { name: /Voir mon profil/ }).getAttribute('href')).toBe(
            '/test?reprendre=1'
        );
        expect(screen.getByRole('button', { name: /Se déconnecter/ })).toBeTruthy();
    });

    it('restores the saved profile into this browser when signing in', async () => {
        await fakeServerWithVault(deterministicAnswers());
        render(<AccountBadge />);
        fireEvent.click(screen.getByText('FAKE_GOOGLE'));

        await waitFor(() => expect(loadSavedSession()?.stage).toBe('results'));
        expect(loadSavedSession()?.respondent).toEqual({ country: 'FR' });
    });

    it('says so when the account has nothing saved, and stays signed in', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url: string) =>
                String(url).endsWith('/vault/key')
                    ? new Response(JSON.stringify({ key: KEY_B64 }), {
                          status: 200,
                          headers: { 'content-type': 'application/json' }
                      })
                    : new Response(null, { status: 404 })
            )
        );
        render(<AccountBadge />);
        fireEvent.click(screen.getByText('FAKE_GOOGLE'));

        await waitFor(() => expect(screen.getByText(/Aucun profil sauvegardé/)).toBeTruthy());
        expect(screen.getByRole('button', { name: /Camille Réunion/ })).toBeTruthy();
    });

    it('forgets the account and the token on sign-out', async () => {
        await fakeServerWithVault(deterministicAnswers());
        render(<AccountBadge />);
        fireEvent.click(screen.getByText('FAKE_GOOGLE'));
        await screen.findByRole('img', { name: /Camille Réunion/ });

        expect(JSON.stringify(localStorage)).not.toContain('fake-signature');
        expect(loadGoogleIdentity()?.name).toBe('Camille Réunion');

        fireEvent.click(screen.getByRole('button', { name: /Camille Réunion/ }));
        fireEvent.click(screen.getByRole('button', { name: /Se déconnecter/ }));

        expect(loadGoogleIdentity()).toBeNull();
        expect(currentIdToken()).toBeNull();
        expect(screen.getByText('FAKE_GOOGLE')).toBeTruthy();
    });

    it('leaves the answers on the device when the account is forgotten', async () => {
        await fakeServerWithVault(deterministicAnswers());
        render(<AccountBadge />);
        fireEvent.click(screen.getByText('FAKE_GOOGLE'));
        // The avatar appears as soon as the token is read; the restore lands
        // one promise later, and this test is about what survives after it.
        await waitFor(() => expect(loadSavedSession()?.stage).toBe('results'));

        fireEvent.click(screen.getByRole('button', { name: /Camille Réunion/ }));
        fireEvent.click(screen.getByRole('button', { name: /Se déconnecter/ }));

        // Signing out is not erasing: the local session is the reader's own
        // data on their own device, and it has its own erase button elsewhere.
        expect(loadSavedSession()?.stage).toBe('results');
    });
});

describe('what the badge says after a sign-in that found no vault', () => {
    // Reported 2026-08-31 by a reader who had results on the device: signing in
    // answered "Aucun profil sauvegardé sur ce compte. Faites le test, puis
    // sauvegardez-le depuis vos résultats." They had just done the test. The
    // message was true of the server and false of the screen it appeared on, and
    // it became the common case the day signing in was required to read results.
    //
    // The invariant: a message about the server never makes a claim about what
    // is on this device. The badge knows both, so it says which is which.
    async function signInFindingNothing(): Promise<void> {
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url: string) =>
                String(url).endsWith('/vault/key')
                    ? new Response(JSON.stringify({ key: KEY_B64 }), {
                          status: 200,
                          headers: { 'content-type': 'application/json' }
                      })
                    : new Response(null, { status: 404 })
            )
        );
        render(<AccountBadge />);
        fireEvent.click(screen.getByText('FAKE_GOOGLE'));
    }

    it('never tells a reader with results on the device to go and take the test', async () => {
        localStorage.setItem(
            TEST_SESSION_STORAGE_KEY,
            JSON.stringify({
                stage: 'results',
                answers: deterministicAnswers(),
                respondent: { country: 'FR' }
            })
        );
        await signInFindingNothing();

        const message = await screen.findByText(/sauvegard/i);
        expect(message.textContent).not.toMatch(/Faites le test/);
        // And it says what is actually true of this device.
        expect(message.textContent).toMatch(/sur cet appareil/i);
    });

    it('still tells a reader with nothing on the device to take the test', async () => {
        await signInFindingNothing();
        expect((await screen.findByText(/Faites le test/)).textContent).toMatch(/aucune analyse/i);
    });

    it('leaves the answers on the device untouched either way', async () => {
        const answers = deterministicAnswers();
        localStorage.setItem(
            TEST_SESSION_STORAGE_KEY,
            JSON.stringify({ stage: 'results', answers, respondent: { country: 'FR' } })
        );
        await signInFindingNothing();
        await screen.findByText(/sauvegard/i);
        expect(loadSavedSession()?.answers).toEqual(answers);
    });
});
