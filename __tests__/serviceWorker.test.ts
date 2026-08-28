import { describe, it, expect } from 'vitest';
import { CACHE_NAME, PRECACHE_ROUTES, isCacheable } from '@/public/sw.js';

// The service worker writes to Cache Storage, which is a copy of pages kept on
// the device after the tab is closed. On a tool whose premise is that nothing
// about anyone is stored, what it is allowed to keep is a privacy rule, not a
// performance detail.

describe('isCacheable', () => {
  it('caches the shell and the ordinary pages', () => {
    expect(isCacheable('/')).toBe(true);
    expect(isCacheable('/test')).toBe(true);
    expect(isCacheable('/crible')).toBe(true);
    expect(isCacheable('/crible/retraite_60')).toBe(true);
    expect(isCacheable('/concepts')).toBe(true);
    expect(isCacheable('/_next/static/chunks/main.js')).toBe(true);
  });

  it('never caches a shared profile', () => {
    // A shared profile is someone else's political identity. Keeping a copy of
    // it on the recipient's device, past the visit, is not this tool's to do.
    expect(isCacheable('/p/2046354a')).toBe(false);
    expect(isCacheable('/p/1eebaeedadaebedbeadaddbddabeb')).toBe(false);
    expect(isCacheable('/p/2046354a/opengraph-image')).toBe(false);
  });

  it('caches the page named /partners, which only starts like /p', () => {
    expect(isCacheable('/partners')).toBe(true);
    expect(isCacheable('/p')).toBe(true);
  });

  it('never caches the comparison page', () => {
    // The comparison of two people is even less this tool's to keep.
    expect(isCacheable('/compare')).toBe(false);
  });
});

describe('the precache list', () => {
  it('names only routes the application serves', () => {
    // /mode1, /mode2 and /elections were precached for years. They are
    // redirects left from an older version of this project, so the install
    // step spent four round trips fetching three pages that no longer exist
    // under those names.
    const served = ['/', '/test', '/crible', '/concepts', '/a-propos', '/methodology', '/legal', '/confidentialite'];
    for (const route of PRECACHE_ROUTES) {
      expect(served, `precached route ${route}`).toContain(route);
    }
  });

  it('precaches nothing that isCacheable refuses', () => {
    for (const route of PRECACHE_ROUTES) {
      expect(isCacheable(route), `precached route ${route}`).toBe(true);
    }
  });
});

describe('the cache name', () => {
  it('names this project', () => {
    // It used to say "politicheck", from a project this code was copied from.
    expect(CACHE_NAME).toContain('crible');
  });
});
