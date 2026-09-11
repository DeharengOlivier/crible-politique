import { describe, expect, it, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';

// Found while wiring audience measurement on 2026-09-12: the tracker reports
// the page address, and on this site two addresses ARE the reader's answers.
// /p/<code> decodes to a full profile, and /compare carries two codes in its
// fragment, which the tracker keeps unless told otherwise. Sending either would
// contradict /confidentialite, which invites the reader to open the network tab
// and check that nothing carries their answers.
//
// The invariant: no payload leaving this site contains a profile code, in the
// address or in the referrer, whatever the reader clicked.

type Payload = { url?: unknown; referrer?: unknown };
type Hook = (type: string, payload: Payload | null) => Payload | null;

let hook: Hook;

beforeAll(async () => {
    // The served file itself, not a copy: a redaction that only exists in a
    // test is a redaction that does not happen.
    const source = await readFile('public/mesure-audience.js', 'utf8');
    const globals = { window: {} as Record<string, unknown> };
    new Function('window', source)(globals.window);
    hook = globals.window.cribleMesureAudience as Hook;
    expect(typeof hook).toBe('function');
});

const CODE = 'v3_aBcDeF123456789';

describe('the measurement never carries a profile off the site', () => {
    it('replaces a shared profile code by the shape of its route', () => {
        expect(hook('event', { url: `/p/${CODE}` })?.url).toBe('/p/[code]');
    });

    it('drops the fragment, where the comparison keeps two codes', () => {
        expect(hook('event', { url: `/compare#a=${CODE}&b=${CODE}` })?.url).toBe('/compare');
    });

    it('redacts a same-site referrer too, not only the address', () => {
        const sent = hook('event', { url: '/methodology', referrer: `/p/${CODE}` });
        expect(sent?.referrer).toBe('/p/[code]');
    });

    it('leaves an ordinary address alone, query string included', () => {
        // The two doors on the home page are worth counting: /test?analyse=express
        // and ?analyse=complete carry no answer, only which door was taken.
        expect(hook('event', { url: '/test?analyse=express' })?.url).toBe('/test?analyse=express');
        expect(hook('event', { url: '/crible/isf_renforce' })?.url).toBe('/crible/isf_renforce');
    });

    it('no code survives, whatever the reader clicked', () => {
        const addresses = [
            `/p/${CODE}`,
            `/p/${CODE}?utm_source=x`,
            `/compare#a=${CODE}`,
            `/compare#a=${CODE}&b=${CODE}`,
            `/#${CODE}`,
        ];
        for (const address of addresses) {
            const sent = hook('event', { url: address, referrer: address });
            expect(String(sent?.url), address).not.toContain(CODE);
            expect(String(sent?.referrer), address).not.toContain(CODE);
        }
    });

    it('survives a payload the tracker never promised', () => {
        expect(hook('event', null)).toBeNull();
        expect(hook('event', {})?.url).toBeUndefined();
    });
});

describe('the tag actually asks for that redaction', () => {
    it('names the hook on the tracker script', async () => {
        // A redaction nothing calls is worse than none: it reads as a control.
        const layout = await readFile('app/layout.tsx', 'utf8');
        expect(layout).toMatch(/data-before-send="cribleMesureAudience"/);
        expect(layout).toMatch(/src="\/mesure-audience\.js"/);
    });
});
