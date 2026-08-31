// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import GoogleSignInButton from '@/components/profile/GoogleSignInButton';

// Measured 2026-08-31 on the live site, with the network panel the privacy page
// invites the reader to open: a plain visit to the home page, clicking nothing,
// issued GET https://accounts.google.com/gsi/client and /gsi/style, both
// carrying "referer: https://crible.eu/". Every visitor was announced to Google
// as having opened a political self-assessment tool, including the ones who
// would never sign in, and a browser signed into Google sends its Google
// cookies with those requests.
//
// The site's own promise is that nothing leaves the browser unless the reader
// asks. Disclosing this would have been the minimum; not doing it is better,
// and it costs one click that the reader chose to make anyway.
//
// The invariant: no request reaches Google until the reader acts on the
// sign-in control. This is what "privé par construction" has to mean at the
// place where it is hardest to hold.

const rendered: Array<Record<string, unknown>> = [];

function googleScripts(): HTMLScriptElement[] {
    return [...document.head.querySelectorAll('script')].filter((script) =>
        script.src.includes('accounts.google.com')
    );
}

/** jsdom never loads a script tag: this is the load the component waits for. */
function completeScriptLoad(): void {
    googleScripts()[0]?.dispatchEvent(new Event('load'));
}

beforeEach(() => {
    rendered.length = 0;
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'client-123.apps.googleusercontent.com');
    vi.stubGlobal('google', {
        accounts: {
            id: {
                initialize: () => {},
                renderButton: (_parent: HTMLElement, options: Record<string, unknown>) => {
                    rendered.push(options);
                }
            }
        }
    });
});

afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    document.head.querySelectorAll('script').forEach((script) => script.remove());
});

describe('a reader who does not sign in is never announced to Google', () => {
    it('loads nothing from Google on mount', () => {
        render(<GoogleSignInButton onIdToken={() => {}} variant="icon" />);
        expect(googleScripts()).toHaveLength(0);
    });

    it('offers a control of our own, which says what pressing it does', () => {
        render(<GoogleSignInButton onIdToken={() => {}} variant="icon" />);
        const control = screen.getByRole('button');
        expect(control.getAttribute('aria-label')).toMatch(/Google/);
        expect(googleScripts()).toHaveLength(0);
    });

    it('contacts Google only once the reader presses it', async () => {
        render(<GoogleSignInButton onIdToken={() => {}} variant="icon" />);
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(googleScripts()).toHaveLength(1));
    });
});

describe('once the reader has asked for it', () => {
    async function pressAndLoad(variant?: 'standard' | 'icon') {
        render(<GoogleSignInButton onIdToken={() => {}} variant={variant} />);
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(googleScripts()).toHaveLength(1));
        completeScriptLoad();
        await waitFor(() => expect(rendered.length).toBeGreaterThan(0));
    }

    it('draws the icon-sized button when asked for one', async () => {
        // Moved here from googleButtonVariant.test.tsx on 2026-08-31: the
        // options are unchanged, the moment they are asked for is not.
        await pressAndLoad('icon');
        expect(rendered[0].type).toBe('icon');
        expect(rendered[0].shape).toBe('circle');
    });

    it('keeps the full button by default, where there is room to explain', async () => {
        await pressAndLoad();
        expect(rendered[0].type).not.toBe('icon');
        expect(rendered[0].text).toBe('continue_with');
    });

    it('hands the placeholder over to Google rather than stacking two buttons', async () => {
        await pressAndLoad('icon');
        // Google's button is drawn into the container; ours must be gone, or a
        // reader sees two sign-in controls side by side.
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('loads the script once, however many buttons the page mounts', async () => {
        await pressAndLoad('icon');
        cleanup();
        render(<GoogleSignInButton onIdToken={() => {}} />);
        // A second mount finds the script already there and draws straight away.
        await waitFor(() => expect(rendered.length).toBeGreaterThan(1));
        expect(googleScripts()).toHaveLength(1);
    });
});
