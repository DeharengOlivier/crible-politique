import { describe, expect, it } from 'vitest';
import { PARTIES } from '@/data/parties';
import {
    PARTY_SALIENCE,
    SALIENCE_THEMES,
    SALIENCE_THEME_LABELS,
    SALIENCE_THEME_DIMENSIONS
} from '@/data/partySalience';
import { topDeclaredFights } from '@/lib/partyFights';
import { DIMENSION_ORDER } from '@/types/positions';

// A party's declared fights: what the party itself treats as its most
// important subjects, taken from the CHES 2024 salience items (how salient a
// theme is in the party's public stance, 0-10), never from our reading of it.
// Two parties are below the CHES inclusion thresholds and carry a documented
// estimate instead, marked as such, exactly like their positions in ches.ts.

describe('party salience data', () => {
    it('covers every party of the corpus, both countries', () => {
        for (const party of PARTIES) {
            expect(PARTY_SALIENCE[party.id], `missing salience for ${party.id}`).toBeDefined();
        }
    });

    it('CHES-sourced entries carry all nine themes, each within the 0-10 codebook scale', () => {
        for (const [partyId, entry] of Object.entries(PARTY_SALIENCE)) {
            if (entry.source !== 'CHES 2024') continue;
            for (const theme of SALIENCE_THEMES) {
                const value = entry.values[theme];
                expect(value, `${partyId}.${theme}`).toBeTypeOf('number');
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThanOrEqual(10);
            }
        }
    });

    it('estimated entries justify themselves and name at least one declared fight', () => {
        for (const [partyId, entry] of Object.entries(PARTY_SALIENCE)) {
            if (entry.source === 'CHES 2024') continue;
            expect(entry.sourceNote.length, partyId).toBeGreaterThan(30);
            expect(entry.declaredFights.length, partyId).toBeGreaterThan(0);
            for (const fight of entry.declaredFights) {
                expect(SALIENCE_THEMES).toContain(fight.theme);
                expect(fight.detail.length).toBeGreaterThan(10);
            }
        }
    });

    // Frozen against CHES_2024_final_v2.csv (party_id 610, 112, 119, 605),
    // re-read from the official download on 2026-08-29. If one of these moves,
    // the dataset copy drifted, not the expectation.
    it('matches the official dataset on spot-checked values', () => {
        expect(PARTY_SALIENCE.fr_rn).toMatchObject({
            source: 'CHES 2024',
            values: expect.objectContaining({ immigration: 9.6, multiculturalism: 9.7, antiElite: 8.75 })
        });
        expect(PARTY_SALIENCE.be_vb.source).toBe('CHES 2024');
        if (PARTY_SALIENCE.be_vb.source === 'CHES 2024') {
            expect(PARTY_SALIENCE.be_vb.values.immigration).toBe(9.8);
        }
        if (PARTY_SALIENCE.be_ptb.source === 'CHES 2024') {
            expect(PARTY_SALIENCE.be_ptb.values.redistribution).toBe(9.63);
        }
        if (PARTY_SALIENCE.fr_eelv.source === 'CHES 2024') {
            expect(PARTY_SALIENCE.fr_eelv.values.environment).toBe(10);
            expect(PARTY_SALIENCE.fr_eelv.values.climate).toBe(9.25);
        }
    });

    it('the two estimated parties are exactly the two below the CHES thresholds', () => {
        const estimated = Object.entries(PARTY_SALIENCE)
            .filter(([, entry]) => entry.source !== 'CHES 2024')
            .map(([id]) => id)
            .sort();
        expect(estimated).toEqual(['fr_patriotes', 'fr_upr']);
    });
});

describe('theme labels and dimension anchoring', () => {
    it('every theme has a French label and maps into at least one real dimension', () => {
        for (const theme of SALIENCE_THEMES) {
            expect(SALIENCE_THEME_LABELS[theme].length).toBeGreaterThan(2);
            const dims = SALIENCE_THEME_DIMENSIONS[theme];
            expect(dims.length).toBeGreaterThan(0);
            for (const dim of dims) expect(DIMENSION_ORDER).toContain(dim);
        }
    });

    it('anchors the contested mappings where the corpus actually asks the question', () => {
        // Immigration statements live in geopolitics (ge3) and social (so2/be3).
        expect(SALIENCE_THEME_DIMENSIONS.immigration).toContain('geopolitics');
        expect(SALIENCE_THEME_DIMENSIONS.multiculturalism).toContain('social');
        expect(SALIENCE_THEME_DIMENSIONS.redistribution).toEqual(['economy']);
        expect(SALIENCE_THEME_DIMENSIONS.eu).toEqual(['geopolitics']);
        expect(SALIENCE_THEME_DIMENSIONS.climate).toEqual(['environment']);
        expect(SALIENCE_THEME_DIMENSIONS.antiElite).toContain('power');
    });
});

describe('topDeclaredFights', () => {
    it('returns the three most salient themes, descending, for a CHES party', () => {
        const fights = topDeclaredFights('fr_rn');
        expect(fights.map((f) => f.theme)).toEqual(['multiculturalism', 'immigration', 'antiElite']);
        expect(fights[0].value).toBe(9.7);
        expect(fights.every((f) => f.source === 'CHES 2024')).toBe(true);
    });

    it('is deterministic on ties: theme declaration order breaks them', () => {
        // Groen: climate 9.8 clearly first; the invariant under test is that
        // two calls agree and values never ascend.
        const first = topDeclaredFights('be_groen');
        const second = topDeclaredFights('be_groen');
        expect(first).toEqual(second);
        for (let i = 1; i < first.length; i += 1) {
            expect(first[i].value ?? 0).toBeLessThanOrEqual(first[i - 1].value ?? 11);
        }
    });

    it('returns the documented declared fights, unnumbered, for an estimated party', () => {
        const fights = topDeclaredFights('fr_upr');
        expect(fights.length).toBeGreaterThan(0);
        expect(fights[0].theme).toBe('eu');
        expect(fights[0].value).toBeNull();
        expect(fights[0].source).toBe('Estimation documentée');
        expect(fights[0].detail).toMatch(/OTAN/);
    });

    it('returns an empty list for an unknown party instead of throwing', () => {
        expect(topDeclaredFights('fr_inconnu')).toEqual([]);
    });
});
