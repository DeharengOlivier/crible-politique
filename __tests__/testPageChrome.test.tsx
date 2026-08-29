// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

// Requested 2026-08-29 (night): during the test and on the results, the full
// top bar ("Le Crible Politique" / "Le test") is gone. The way back is a
// single floating button with an arrow: less chrome over the questionnaire,
// and the same 44px target.

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, back: () => {}, prefetch: () => {} }),
    useSearchParams: () => new URLSearchParams()
}));

afterEach(cleanup);

describe('the test page chrome', () => {
    it('offers a floating way back instead of a top bar', async () => {
        const TestPage = (await import('@/app/test/page')).default;
        render(<TestPage />);

        const back = screen.getByLabelText("Retour à l'accueil");
        expect(back.getAttribute('href')).toBe('/');
        expect(screen.queryByText('Le Crible Politique')).toBeNull();
        expect(screen.queryByText('Le test')).toBeNull();
    });
});
