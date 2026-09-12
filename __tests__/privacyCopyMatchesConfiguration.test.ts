import { readFileSync } from 'node:fs';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ipUsageSentence } from '@/lib/optionalFeatures';

// A sentence about what we collect must follow the configuration, in BOTH
// directions. /legal once listed Plausible on a deployment that measured
// nothing; on 2026-09-12 the opposite happened, and "aucune mesure d'audience
// ne tourne sur ce site" stayed on /confidentialite while the measurement was
// switched on in production.

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('what the pages say about IP addresses', () => {
    it('denies any measurement when none is configured', () => {
        vi.stubEnv('NEXT_PUBLIC_UMAMI_WEBSITE_ID', '');
        expect(ipUsageSentence()).toContain("aucune mesure d'audience");
    });

    it('never denies a measurement that is running', () => {
        vi.stubEnv('NEXT_PUBLIC_UMAMI_WEBSITE_ID', 'fba45ae4-7b42-48db-a4fe-c1373091e10b');
        expect(ipUsageSentence()).not.toContain("aucune mesure d'audience");
    });

    it('says what the address is used for once a measurement runs', () => {
        vi.stubEnv('NEXT_PUBLIC_UMAMI_WEBSITE_ID', 'fba45ae4-7b42-48db-a4fe-c1373091e10b');
        const sentence = ipUsageSentence();
        expect(sentence).toContain('identifiant de visite');
        expect(sentence).toMatch(/recalcul/);
    });

    it('leaves neither page free to hardcode the denial', () => {
        // The phrase must exist in exactly one place, or the next change turns
        // one page into a lie while the other stays true.
        for (const page of ['app/confidentialite/page.tsx', 'app/legal/page.tsx']) {
            const source = readFileSync(new URL(`../${page}`, import.meta.url), 'utf8');
            expect(source, `${page} still states it itself`).not.toMatch(/aucune mesure d.apos;audience/);
            expect(source, `${page} does not use the shared sentence`).toContain('ipUsageSentence');
        }
    });
});
