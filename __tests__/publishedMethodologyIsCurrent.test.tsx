// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import MethodologyPage from '@/app/methodology/page';
import ConceptsPage from '@/app/concepts/page';

// The methodology page is the promise the tool makes about how it produced a
// result. A page that describes a rule the engine no longer follows is worse
// than no page: the reader believes they have checked something.
//
// On 2026-08-29 the naming of synthetic families stopped depending on the order
// of the published list, and the page still said the order decided ties for
// several hours. This battery is what makes that impossible to leave behind.

afterEach(cleanup);

describe('the published methodology describes the engine that is running', () => {
    it('does not claim the order of the list decides anything', () => {
        render(<MethodologyPage />);
        expect(screen.queryByText(/l'ordre de la liste publiée tranche/)).toBeNull();
        expect(screen.queryByText(/ordre de la liste/)).toBeNull();
    });

    it('states what is actually shown when several families fit', () => {
        render(<MethodologyPage />);
        expect(screen.getByText(/plus proche/)).toBeTruthy();
        expect(screen.getByText(/ne séparent pas/)).toBeTruthy();
    });

    it('says the same thing in the glossary that defines a family', () => {
        // The glossary is where a reader goes to find out what the title on
        // their results means. It has to say that several of these names can be
        // true of them at once, or the gallery reads as fourteen boxes.
        render(<ConceptsPage />);
        expect(screen.getByText(/plusieurs de ces familles/)).toBeTruthy();
    });
});
