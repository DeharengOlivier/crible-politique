// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import PrivacyPage from '@/app/confidentialite/page';

// The privacy page is a promise, and this battery is what keeps it exactly as
// true as the code makes it.
//
// Until 2026-08-29 the vault key was a recovery code the reader kept, so the
// page could say nobody could read a saved profile, us included. The key is now
// derived by the API from the reader's Google account, which removed the code
// and with it that sentence: an operator holding the server secrets and the
// database could open a vault. That is a real cost of the change, it is the
// reason the change is stated rather than hidden, and a page that kept the old
// wording would be lying.

beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_CRIBLE_API_URL', 'https://api.example');
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'client-123.apps.googleusercontent.com');
});

afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
});

describe('what the privacy page says about the saved profile', () => {
    it('no longer claims nobody can read it', () => {
        render(<PrivacyPage />);
        expect(screen.queryByText(/ni nous, ni l/)).toBeNull();
        expect(screen.queryByText(/personne.{0,40}ne peut lire/)).toBeNull();
    });

    it('says who could technically read it', () => {
        render(<PrivacyPage />);
        expect(screen.getByText(/pourrait techniquement/)).toBeTruthy();
    });

    it('says the sign-in is the only thing to keep', () => {
        render(<PrivacyPage />);
        expect(screen.getByText(/aucun code à conserver/)).toBeTruthy();
    });

    it('still says the answers are sealed before they leave and opened here', () => {
        render(<PrivacyPage />);
        expect(screen.getByText(/AES-256-GCM/)).toBeTruthy();
        expect(screen.getByText(/déchiffré dans votre navigateur/)).toBeTruthy();
    });

    it('does not open by promising an impossibility either', () => {
        // The lead paragraph used to answer the sensitivity of political
        // opinions with "never being able to read them". That is true of the
        // default path, where nothing is transmitted at all, and it stopped
        // being true of the opt-in vault the day the key started coming from
        // the account. Not collecting is the claim that survives both.
        render(<PrivacyPage />);
        expect(screen.queryByText(/ne jamais pouvoir les lire/)).toBeNull();
        expect(screen.getByText(/ne jamais les collecter/)).toBeTruthy();
    });

    it('still says what the database holds, and what it does not', () => {
        render(<PrivacyPage />);
        expect(screen.getByText(/empreinte irréversible/)).toBeTruthy();
        expect(screen.getByText(/ans votre nom/)).toBeTruthy();
    });
});
