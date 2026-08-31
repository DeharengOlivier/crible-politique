// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import GoogleSignInButton from '@/components/profile/GoogleSignInButton';

// Found by `next build` on 2026-08-31, in the same change that made Google be
// contacted only on intent: the component decided its initial state by reading
// the document ("is Google's script already here?"), and Next prerenders every
// page, including the client components on it, where there is no document.
// The build failed with "ReferenceError: document is not defined" on /embed
// and /a-propos.
//
// The jsdom battery could not see it, because jsdom always has a document. So
// the invariant gets its own file with a node environment, which is the
// environment the prerender actually runs in.
//
// The invariant, stated generally: the first render of this component reads no
// browser global. Beyond the crash, a first render that differed between the
// server and the browser would be a hydration mismatch: the initial state has
// to be the same on both sides, and the document can only be consulted after
// mounting.

describe('the sign-in button on the prerender pass', () => {
    it('renders without a document', () => {
        // No jsdom here: `document` genuinely does not exist, exactly as during
        // the build. Referencing one would throw rather than return null.
        expect(typeof document).toBe('undefined');
        expect(() => renderToStaticMarkup(<GoogleSignInButton onIdToken={() => {}} />)).not.toThrow();
    });

    it('renders the same first pass whether or not Google is configured', () => {
        // The prerender happens once, with the build's environment; the browser
        // hydrates it with its own. A first render that branched on the client
        // id would produce markup React then has to throw away.
        const withoutGoogle = renderToStaticMarkup(<GoogleSignInButton onIdToken={() => {}} variant="icon" />);
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'client-123.apps.googleusercontent.com');
        const withGoogle = renderToStaticMarkup(<GoogleSignInButton onIdToken={() => {}} variant="icon" />);
        vi.unstubAllEnvs();
        expect(withGoogle).toBe(withoutGoogle);
    });

    it('ships no reference to Google in the prerendered markup', () => {
        // The page is served from our own origin as static HTML. If the markup
        // named accounts.google.com, the browser would fetch it while parsing,
        // before any React code had a chance to decide otherwise.
        const markup = renderToStaticMarkup(<GoogleSignInButton onIdToken={() => {}} />);
        expect(markup).not.toMatch(/accounts\.google\.com/);
        expect(markup).not.toMatch(/<script/);
    });
});
