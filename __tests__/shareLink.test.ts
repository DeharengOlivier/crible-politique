import { describe, it, expect } from 'vitest';
import { shareFragment, readShareParam, readShareUrl } from '@/lib/shareLink';

// Share links carry a profile code, and a profile code is a set of answers to
// 28 political statements. The whole point of putting it in the fragment is
// that a fragment is never transmitted: it must survive a round trip through
// the address bar without ever having to become a path or a query string.

describe('shareFragment', () => {
  it('builds a fragment carrying one code', () => {
    expect(shareFragment({ p: '1abc' })).toBe('#p=1abc');
  });

  it('builds a fragment carrying two codes, in the order given', () => {
    expect(shareFragment({ a: '1aaa', b: '1bbb' })).toBe('#a=1aaa&b=1bbb');
  });

  it('returns an empty string rather than a bare hash when there is nothing to carry', () => {
    // A trailing "#" in a copied link is noise, and an empty fragment would
    // still make the URL look like it carries a profile.
    expect(shareFragment({})).toBe('');
  });

  it('skips empty values instead of emitting a keyless pair', () => {
    expect(shareFragment({ a: '1aaa', b: '' })).toBe('#a=1aaa');
  });

  it('escapes characters that would otherwise end the fragment', () => {
    expect(shareFragment({ a: 'x&b=y' })).toBe('#a=x%26b%3Dy');
  });
});

describe('readShareParam', () => {
  it('reads a code back out of a fragment it built', () => {
    const code = '1abcde';
    expect(readShareParam(shareFragment({ p: code }), 'p')).toBe(code);
  });

  it('reads each code of a two-code fragment', () => {
    const fragment = shareFragment({ a: '1aaa', b: '1bbb' });
    expect(readShareParam(fragment, 'a')).toBe('1aaa');
    expect(readShareParam(fragment, 'b')).toBe('1bbb');
  });

  it('survives a round trip through the characters it escapes', () => {
    const awkward = 'x&b=y#z';
    expect(readShareParam(shareFragment({ a: awkward }), 'a')).toBe(awkward);
  });

  it('accepts a fragment with or without its leading hash', () => {
    expect(readShareParam('#p=1abc', 'p')).toBe('1abc');
    expect(readShareParam('p=1abc', 'p')).toBe('1abc');
  });

  it('returns null for a key the fragment does not carry', () => {
    expect(readShareParam('#a=1aaa', 'b')).toBeNull();
  });

  it('returns null for an empty value, which carries no profile', () => {
    expect(readShareParam('#p=', 'p')).toBeNull();
  });

  it('returns null for a plain anchor, which is not a share fragment', () => {
    expect(readShareParam('#results', 'p')).toBeNull();
  });

  it.each([undefined, null, '', '#'])('returns null for %p', (hash) => {
    expect(readShareParam(hash, 'p')).toBeNull();
  });
});

describe('readShareUrl', () => {
  const KEYS = ['a', 'b'] as const;

  it('reads codes already in the fragment and leaves the URL alone', () => {
    const href = 'https://crible.eu/compare#a=1aaa&b=1bbb';
    expect(readShareUrl(href, KEYS)).toEqual({
      href,
      codes: { a: '1aaa', b: '1bbb' }
    });
  });

  it('reports every requested key, null for the ones the URL does not carry', () => {
    const result = readShareUrl('https://crible.eu/compare#a=1aaa', KEYS);
    expect(result.codes).toEqual({ a: '1aaa', b: null });
  });

  it('still honours a legacy link that carries the code in the query string', () => {
    // Links minted before the fragment form existed are in people's messages
    // and bookmarks. They must keep working.
    const result = readShareUrl('https://crible.eu/compare?a=1aaa&b=1bbb', KEYS);
    expect(result.codes).toEqual({ a: '1aaa', b: '1bbb' });
  });

  it('moves a legacy code out of the query string and into the fragment', () => {
    // The code has already reached the server on that one request. Rewriting
    // stops it travelling any further: address bar, Referer header of every
    // later asset, bookmark, synced tab.
    const result = readShareUrl('https://crible.eu/compare?a=1aaa&b=1bbb', KEYS);
    expect(result.href).toBe('https://crible.eu/compare#a=1aaa&b=1bbb');
    expect(result.href).not.toContain('?');
  });

  it('keeps query parameters that are not share codes', () => {
    const result = readShareUrl(
      'https://crible.eu/compare?a=1aaa&utm_source=whatsapp',
      KEYS
    );
    expect(result.href).toBe(
      'https://crible.eu/compare?utm_source=whatsapp#a=1aaa'
    );
  });

  it('prefers the fragment when a URL somehow carries both', () => {
    const result = readShareUrl(
      'https://crible.eu/compare?a=1query#a=1fragment',
      KEYS
    );
    expect(result.codes.a).toBe('1fragment');
  });

  it('drops the query copy even when the fragment already had the code', () => {
    const result = readShareUrl(
      'https://crible.eu/compare?a=1query#a=1fragment',
      KEYS
    );
    expect(result.href).toBe('https://crible.eu/compare#a=1fragment');
  });

  it('returns the URL unchanged when there is nothing to migrate', () => {
    const href = 'https://crible.eu/test';
    const result = readShareUrl(href, ['p']);
    expect(result).toEqual({ href, codes: { p: null } });
  });

  it('treats an empty query code as no code at all', () => {
    const result = readShareUrl('https://crible.eu/test?p=', ['p']);
    expect(result.codes.p).toBeNull();
    expect(result.href).toBe('https://crible.eu/test?p=');
  });
});
