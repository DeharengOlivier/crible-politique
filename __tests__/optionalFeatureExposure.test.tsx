// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import sitemap from '@/app/sitemap';
import Home from '@/app/page';
import ConfidentialitePage from '@/app/confidentialite/page';
import StatistiquesPage from '@/app/statistiques/page';
import { EmbedResults } from '@/app/embed/page';
import SaveProfileCard from '@/components/profile/SaveProfileCard';
import RestoreProfileCard from '@/components/profile/RestoreProfileCard';
import { profileVaultEnabled, publicStatisticsEnabled } from '@/lib/optionalFeatures';

// Found 2026-08-29 on the live site: https://crible.deploy-env.net/statistiques
// answered 200 with nothing but "les statistiques sont momentanément
// indisponibles ... les compteurs vivent côté serveur", and the URL was in the
// sitemap and in the home footer, while no server had ever been deployed. The
// flag gated the network calls but not the page, the links, or the sentences
// claiming what the site collects.
//
// The invariant this battery holds: a feature this deployment has not
// configured is not exposed. Not as a page, not as a link, not as a promise in
// the privacy copy. The default deployment collects nothing and says so.

const API = 'https://api.example';
const GOOGLE_CLIENT = 'client-123.apps.googleusercontent.com';

const notFoundCalls = vi.hoisted(() => ({ count: 0 }));
vi.mock('next/navigation', () => ({
    notFound: () => {
        notFoundCalls.count += 1;
        throw new Error('NEXT_NOT_FOUND');
    }
}));

function enableStatistics(): void {
    vi.stubEnv('NEXT_PUBLIC_CRIBLE_API_URL', API);
}

function enableVault(): void {
    enableStatistics();
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', GOOGLE_CLIENT);
}

function linksTo(container: HTMLElement, href: string): number {
    return container.querySelectorAll(`a[href="${href}"]`).length;
}

afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    notFoundCalls.count = 0;
});

describe('an unconfigured optional feature is not exposed', () => {
    it('answers 404 on the statistics page when no API is configured', () => {
        expect(() => StatistiquesPage()).toThrow('NEXT_NOT_FOUND');
        expect(notFoundCalls.count).toBe(1);
    });

    it('serves the statistics page once an API is configured', () => {
        enableStatistics();
        const { container } = render(<>{StatistiquesPage()}</>);
        expect(notFoundCalls.count).toBe(0);
        expect(container.textContent).toContain('Statistiques publiques');
    });

    it('keeps the statistics URL out of the sitemap when no API is configured', () => {
        const urls = sitemap().map((entry) => entry.url);
        expect(urls.some((url) => url.endsWith('/statistiques'))).toBe(false);
        // the rest of the sitemap is untouched: this gate closes one route only
        expect(urls.some((url) => url.endsWith('/methodology'))).toBe(true);
    });

    it('puts the statistics URL in the sitemap once an API is configured', () => {
        enableStatistics();
        expect(sitemap().some((entry) => entry.url.endsWith('/statistiques'))).toBe(true);
    });

    it('offers no home footer link to a statistics page that 404s', () => {
        const { container } = render(<Home />);
        expect(linksTo(container, '/statistiques')).toBe(0);
    });

    it('links the statistics page from the home footer once it exists', () => {
        enableStatistics();
        const { container } = render(<Home />);
        expect(linksTo(container, '/statistiques')).toBe(1);
    });
});

describe('the privacy page describes the deployment it runs in', () => {
    it('promises no counter and no vault when neither is configured', () => {
        const { container } = render(<ConfidentialitePage />);
        const text = container.textContent ?? '';
        expect(text).toContain("rien n'en sort");
        expect(text).not.toContain('incrémente un compteur');
        expect(text).not.toMatch(/sauvegarder votre profil avec votre compte Google/);
        expect(linksTo(container, '/statistiques')).toBe(0);
    });

    it('declares the counter and the vault once both are configured', () => {
        enableVault();
        const { container } = render(<ConfidentialitePage />);
        const text = container.textContent ?? '';
        expect(text).toContain('incrémente un compteur');
        expect(text).toMatch(/sauvegarder votre profil avec votre compte Google/);
        expect(linksTo(container, '/statistiques')).toBe(1);
    });

    it('declares the counter alone when only the statistics are configured', () => {
        enableStatistics();
        const text = render(<ConfidentialitePage />).container.textContent ?? '';
        expect(text).toContain('incrémente un compteur');
        expect(text).not.toMatch(/sauvegarder votre profil avec votre compte Google/);
    });

    // The page tells the reader to open the network tab and count the calls.
    // That count is a falsifiable claim, so it follows the deployment.
    it('announces the exact number of API calls the build can make', () => {
        expect(render(<ConfidentialitePage />).container.textContent).toContain(
            "aucun appel vers une API"
        );
        cleanup();

        enableStatistics();
        expect(render(<ConfidentialitePage />).container.textContent).toContain('au plus un appel');
        cleanup();

        enableVault();
        expect(render(<ConfidentialitePage />).container.textContent).toContain('au plus deux appels');
    });
});

describe('the partner embed claims only what it does', () => {
    const ANSWERS = { pw1: 2 as const, ec1: -1 as const, ge7: -2 as const };

    it('says nothing leaves the browser when no counter is configured', () => {
        const text = render(<EmbedResults answers={ANSWERS} country="FR" />).container.textContent ?? '';
        expect(text).toContain('ne quittent pas votre navigateur');
        expect(text).not.toContain('compteur anonyme');
    });

    it('announces the anonymous counter once it is configured', () => {
        enableStatistics();
        const text = render(<EmbedResults answers={ANSWERS} country="FR" />).container.textContent ?? '';
        expect(text).toContain('compteur anonyme');
    });
});

describe('the vault needs both of its flags, and the neighbours stay gated', () => {
    it('reads an empty variable as an absent one', () => {
        vi.stubEnv('NEXT_PUBLIC_CRIBLE_API_URL', '');
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', '');
        expect(publicStatisticsEnabled()).toBe(false);
        expect(profileVaultEnabled()).toBe(false);
    });

    it('stays closed when only the API is configured', () => {
        enableStatistics();
        expect(publicStatisticsEnabled()).toBe(true);
        expect(profileVaultEnabled()).toBe(false);
    });

    it('stays closed when only the Google client is configured', () => {
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', GOOGLE_CLIENT);
        expect(publicStatisticsEnabled()).toBe(false);
        expect(profileVaultEnabled()).toBe(false);
    });

    it('opens only when both are configured', () => {
        enableVault();
        expect(profileVaultEnabled()).toBe(true);
    });

    it('renders no profile card while the vault is closed', () => {
        enableStatistics(); // half-configured: still no vault
        const save = render(<SaveProfileCard answers={{ pw1: 1 }} respondent={{ country: 'FR' }} />);
        expect(save.container.innerHTML).toBe('');
        const restore = render(<RestoreProfileCard onRestored={() => {}} />);
        expect(restore.container.innerHTML).toBe('');
    });
});
