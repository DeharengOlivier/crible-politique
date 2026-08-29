// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import GoogleSignInButton from '@/components/profile/GoogleSignInButton';

// The account corner asks for a logo, not a 200-pixel bar: measured on the
// real page at 375px, the standard button took more than half the width of a
// phone screen and sat over the page title. Google Identity Services draws an
// icon-sized button itself, so the size stays Google's own affordance instead
// of a hand-drawn imitation, which their branding rules forbid anyway.

const rendered: Array<Record<string, unknown>> = [];

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

/** jsdom never loads a script tag: this is the load the component waits for. */
function completeScriptLoad() {
    const script = document.head.querySelector('script[src*="accounts.google.com"]');
    script?.dispatchEvent(new Event('load'));
}

describe('the Google sign-in button', () => {
    it('draws the icon-sized button when asked for one', async () => {
        render(<GoogleSignInButton onIdToken={() => {}} variant="icon" />);
        completeScriptLoad();
        await waitFor(() => expect(rendered.length).toBeGreaterThan(0));
        expect(rendered[0].type).toBe('icon');
        expect(rendered[0].shape).toBe('circle');
    });

    it('keeps the full button by default, where there is room to explain', async () => {
        render(<GoogleSignInButton onIdToken={() => {}} />);
        completeScriptLoad();
        await waitFor(() => expect(rendered.length).toBeGreaterThan(0));
        expect(rendered[0].type).not.toBe('icon');
        expect(rendered[0].text).toBe('continue_with');
    });
});
