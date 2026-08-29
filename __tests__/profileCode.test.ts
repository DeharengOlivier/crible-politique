import { describe, it, expect } from 'vitest';
import { encodeAnswers, decodeAnswers, decodeProfile, sanitizeAnswers, LEGACY_V1_STATEMENT_IDS } from '@/lib/profileCode';
import { statementsFor, COUNTRIES } from '@/lib/electoralScope';
import type { AnswerRecord, LikertValue } from '@/types/positions';
import { answersLikeParty } from './support/respondents';

// P2, P3. A profile code travels in the fragment of a link somebody sent to
// somebody else. It is untrusted on the way back in, and links already sent
// must keep working.

describe('the code carries the country it was taken in', () => {
  it('round trips answers and country for both countries', () => {
    for (const country of COUNTRIES) {
      const answers: AnswerRecord = {};
      statementsFor(country).forEach((s, i) => {
        answers[s.id] = i % 4 === 0 ? null : (((i % 5) - 2) as LikertValue);
      });
      const decoded = decodeProfile(encodeAnswers(answers, country));
      expect(decoded, country).not.toBeNull();
      expect(decoded!.country).toBe(country);
      for (const s of statementsFor(country)) {
        expect(decoded!.answers[s.id], `${country}/${s.id}`).toBe(answers[s.id] ?? null);
      }
    }
  });

  it('never puts a statement of the other country in a decoded profile', () => {
    const decoded = decodeProfile(encodeAnswers(answersLikeParty('fr_ps'), 'FR'))!;
    expect(Object.keys(decoded.answers)).not.toContain('pw3_be');
    expect(Object.keys(decoded.answers)).toContain('pw3_fr');
  });

  it('gives the two countries codes of their own length', () => {
    const code = encodeAnswers(answersLikeParty('be_ps'), 'BE');
    // version + country + one character per statement + two check characters
    expect(code).toHaveLength(4 + statementsFor('BE').length);
    expect(code[0]).toBe('2');
  });
});

describe('P3: a code arriving from a URL is untrusted', () => {
  it('rejects an unknown version', () => {
    expect(decodeProfile('9' + 'c'.repeat(40))).toBeNull();
    expect(decodeProfile('')).toBeNull();
    expect(decodeProfile('   ')).toBeNull();
  });

  it('rejects an unknown country marker', () => {
    const valid = encodeAnswers(answersLikeParty('fr_ps'), 'FR');
    expect(decodeProfile('2z' + valid.slice(2))).toBeNull();
  });

  it('rejects a body of the wrong length for its country', () => {
    const valid = encodeAnswers(answersLikeParty('fr_ps'), 'FR');
    expect(decodeProfile(valid.slice(0, -1))).toBeNull();
    expect(decodeProfile(valid + 'c')).toBeNull();
  });

  it('rejects an unknown answer character rather than reading it partially', () => {
    const valid = encodeAnswers(answersLikeParty('fr_ps'), 'FR');
    expect(decodeProfile(valid.slice(0, 5) + 'z' + valid.slice(6))).toBeNull();
  });

  it('rejects a code long enough to be an attack rather than a profile', () => {
    expect(decodeProfile('2f' + 'c'.repeat(100000))).toBeNull();
  });
});

describe('P2: links minted before the country existed keep working', () => {
  it('reads a v1 code and reports that it names no country', () => {
    const legacy = '1' + 'e'.repeat(LEGACY_V1_STATEMENT_IDS.length);
    const decoded = decodeProfile(legacy);
    expect(decoded).not.toBeNull();
    expect(decoded!.country).toBeNull();
    expect(decoded!.answers.pw1).toBe(2);
    expect(decoded!.answers.mo4).toBe(2);
  });

  it('drops the one statement that no longer exists, and keeps the rest', () => {
    const legacy = '1' + 'e'.repeat(LEGACY_V1_STATEMENT_IDS.length);
    const decoded = decodeProfile(legacy)!;
    expect(LEGACY_V1_STATEMENT_IDS).toContain('pw3');
    expect(decoded.answers.pw3).toBeUndefined();
    expect(Object.keys(decoded.answers)).toHaveLength(LEGACY_V1_STATEMENT_IDS.length - 1);
  });

  it('still rejects a malformed v1 code', () => {
    expect(decodeProfile('1abc')).toBeNull();
    expect(decodeProfile('1' + 'z'.repeat(LEGACY_V1_STATEMENT_IDS.length))).toBeNull();
  });

  it('freezes the v1 statement order, because it decides what old links mean', () => {
    expect(LEGACY_V1_STATEMENT_IDS).toEqual([
      'pw1', 'pw2', 'pw3', 'pw4', 'ec1', 'ec2', 'ec3', 'ec4',
      'ge1', 'ge2', 'ge3', 'ge4', 'so1', 'so2', 'so3', 'so4',
      'en1', 'en2', 'en3', 'en4', 'kn1', 'kn2', 'kn3', 'kn4',
      'mo1', 'mo2', 'mo3', 'mo4',
    ]);
  });
});

describe('decodeAnswers keeps its shape for callers that only want answers', () => {
  it('returns the answers of a v2 code', () => {
    const answers = answersLikeParty('fr_lfi');
    expect(decodeAnswers(encodeAnswers(answers, 'FR'))!.ec1).toBe(answers.ec1);
  });

  it('returns null on anything it cannot read', () => {
    expect(decodeAnswers('nope')).toBeNull();
  });
});

describe('sanitizeAnswers, the local-storage boundary', () => {
  it('accepts a country-scoped statement id', () => {
    expect(sanitizeAnswers({ pw3_be: 2, ec5_fr: -1 })).toEqual({ pw3_be: 2, ec5_fr: -1 });
  });

  it('still drops an id the corpus does not know', () => {
    expect(sanitizeAnswers({ ec1: 1, pw3: 2 })).toEqual({ ec1: 1 });
  });
});

describe('a single altered character is rejected, not read as another profile', () => {
  // Found 2026-08-29 in an adversarial pass: flipping the country marker of a
  // French code to "b" produced a perfectly valid Belgian profile, because both
  // corpora hold 30 statements. A mangled link then showed a plausible profile
  // attributed to the person who shared it. A checksum character turns every
  // single-character substitution into an invalid link instead.
  const CODES = [
    encodeAnswers(answersLikeParty('fr_ps'), 'FR'),
    encodeAnswers(answersLikeParty('be_nva'), 'BE'),
  ];

  it('rejects the country marker being flipped', () => {
    const french = CODES[0];
    expect(decodeProfile('2b' + french.slice(2))).toBeNull();
  });

  it('rejects every single-character substitution, at every position', () => {
    const alphabet = ['a', 'b', 'c', 'd', 'e', 'x', 'f', '0', '1', 'z'];
    for (const code of CODES) {
      for (let i = 1; i < code.length; i++) {
        for (const replacement of alphabet) {
          if (replacement === code[i]) continue;
          const mangled = code.slice(0, i) + replacement + code.slice(i + 1);
          expect(decodeProfile(mangled), `position ${i} -> ${replacement} in ${code}`).toBeNull();
        }
      }
    }
  });

  it('accepts the untouched code', () => {
    for (const code of CODES) expect(decodeProfile(code)).not.toBeNull();
  });

  it('rejects a truncated or extended code', () => {
    for (const code of CODES) {
      expect(decodeProfile(code.slice(0, -1))).toBeNull();
      expect(decodeProfile(code + 'c')).toBeNull();
    }
  });

  it('rejects two adjacent answers swapped with each other', () => {
    // The plain sum cannot see a swap; the position-weighted second check
    // character can. For adjacent positions the weighted sums differ by
    // exactly the character difference, never a multiple of 36, so every
    // adjacent swap of two different characters is caught.
    for (const code of CODES) {
      const body = code.slice(2, -2);
      for (let i = 0; i + 1 < body.length; i++) {
        if (body[i] === body[i + 1]) continue;
        const a = 2 + i;
        const swapped =
          code.slice(0, a) + code[a + 1] + code[a] + code.slice(a + 2);
        expect(decodeProfile(swapped), `swap at ${i} in ${code}`).toBeNull();
      }
    }
  });

  it('rejects the swap the single-sum design accepted', () => {
    // The exact case documented as uncaught on 2026-08-29: the first two
    // different answer characters exchanged. Kept as the memory of that limit.
    const code = CODES[0];
    const body = code.slice(2, -2);
    const i = 2;
    const j = 2 + body.split('').findIndex((c) => c !== body[0]);
    expect(j, 'the fixture needs two different answer characters').toBeGreaterThan(i);
    const swapped = code.slice(0, i) + code[j] + code.slice(i + 1, j) + code[i] + code.slice(j + 1);
    expect(swapped).not.toBe(code);
    expect(decodeProfile(swapped)).toBeNull();
  });

  it('says plainly what it still does not catch', () => {
    // Two characters d apart whose difference times d is a multiple of 36
    // leave both sums unchanged: for example "b" and "d" (difference 2)
    // exchanged 18 positions apart. Documented rather than pretended away.
    const statements = statementsFor('FR');
    const answers = answersLikeParty('fr_ps');
    answers[statements[0].id] = -1; // encodes as "b"
    answers[statements[18].id] = 1; // encodes as "d", 18 positions later
    const code = encodeAnswers(answers, 'FR');
    const i = 2;
    const j = 2 + 18;
    expect(code[i]).toBe('b');
    expect(code[j]).toBe('d');
    const swapped = code.slice(0, i) + code[j] + code.slice(i + 1, j) + code[i] + code.slice(j + 1);
    expect(decodeProfile(swapped)).not.toBeNull();
  });
});
