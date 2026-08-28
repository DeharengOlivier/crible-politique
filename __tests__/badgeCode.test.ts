import { describe, it, expect } from 'vitest';
import {
  encodeBadge,
  decodeBadge,
  badgeIdentityOf,
  identityFromShareCode,
  BADGE_CODE_LENGTH
} from '@/lib/badgeCode';
import { BADGE_ALPHABET } from '@/data/badgeAlphabet';
import { encodeAnswers } from '@/lib/profileCode';
import { computeProfile } from '@/lib/scoringEngine';
import { STATEMENTS } from '@/data/statements';
import { PARTY_POSITIONS } from '@/data/partyPositions';
import { ARCHETYPE_SIGNATURES } from '@/data/archetypeSignatures';
import { DIMENSION_ORDER } from '@/types/positions';
import type { AnswerRecord } from '@/types/positions';

// A badge code sits in the path of a shared profile URL, which means it
// reaches the server, the access log and every link-preview crawler. It
// therefore has exactly one job: say what the shared page displays, and be
// unable to say anything more.

function answersFromParty(partyId: string): AnswerRecord {
  const answers: AnswerRecord = {};
  for (const s of STATEMENTS) answers[s.id] = PARTY_POSITIONS[s.id][partyId].value;
  return answers;
}

const PARTIES_UNDER_TEST = ['fr_lfi', 'fr_rn', 'fr_ps', 'fr_lr', 'fr_renaissance', 'fr_eelv'];

describe('the badge alphabet', () => {
  it('assigns a character to every archetype the engine can return', () => {
    // A missing entry would encode as "no archetype" and quietly downgrade a
    // real profile. Append the new label to its dimension in badgeAlphabet.ts.
    for (const { dimension, signatures } of ARCHETYPE_SIGNATURES) {
      for (const label of Object.keys(signatures)) {
        expect(BADGE_ALPHABET[dimension], `${dimension} / ${label}`).toContain(label);
      }
    }
  });

  it('never assigns the same character twice within a dimension', () => {
    for (const dim of DIMENSION_ORDER) {
      const labels = BADGE_ALPHABET[dim];
      expect(new Set(labels).size).toBe(labels.length);
    }
  });

  it('stays within the single-character budget', () => {
    // One character per dimension, from a 36-symbol alphabet.
    for (const dim of DIMENSION_ORDER) {
      expect(BADGE_ALPHABET[dim].length).toBeLessThanOrEqual(36);
    }
  });
});

describe('encodeBadge', () => {
  it('produces a version marker plus one character per dimension', () => {
    const badge = encodeBadge(computeProfile(answersFromParty('fr_lfi')));
    expect(badge).toHaveLength(BADGE_CODE_LENGTH);
    expect(badge[0]).toBe('2');
    expect(badge.length).toBe(1 + DIMENSION_ORDER.length);
  });

  it('is deterministic', () => {
    const profile = computeProfile(answersFromParty('fr_rn'));
    expect(encodeBadge(profile)).toBe(encodeBadge(computeProfile(answersFromParty('fr_rn'))));
  });

  it('is far shorter than the answer code it replaces', () => {
    const answers = answersFromParty('fr_ps');
    expect(encodeBadge(computeProfile(answers)).length).toBeLessThan(
      encodeAnswers(answers).length / 3
    );
  });

  it('cannot carry the answers: too few codes exist to name them all', () => {
    // 8 characters over an alphabet of 37 symbols is an upper bound of 37^7
    // distinct badges, against 6^28 distinct answer sets. The badge is not a
    // lossy encoding of the answers, it cannot be an encoding of them at all.
    const possibleBadges = Math.pow(37, DIMENSION_ORDER.length);
    const possibleAnswerSets = Math.pow(6, STATEMENTS.length);
    expect(possibleBadges).toBeLessThan(possibleAnswerSets);
  });

  it('encodes an empty profile without inventing an archetype', () => {
    const badge = encodeBadge(computeProfile({}));
    expect(badge).toHaveLength(BADGE_CODE_LENGTH);
    expect(decodeBadge(badge)?.dimensionLabels).toEqual({});
  });
});

describe('decodeBadge', () => {
  it.each(PARTIES_UNDER_TEST)('round trips the dominant archetypes of %s', (partyId) => {
    const profile = computeProfile(answersFromParty(partyId));
    const decoded = decodeBadge(encodeBadge(profile));

    expect(decoded).not.toBeNull();
    for (const dim of DIMENSION_ORDER) {
      expect(decoded?.dimensionLabels[dim]).toBe(profile.dimensionArchetypes[dim]?.label);
    }
  });

  it.each(PARTIES_UNDER_TEST)('round trips the synthetic profile of %s', (partyId) => {
    const profile = computeProfile(answersFromParty(partyId));
    const decoded = decodeBadge(encodeBadge(profile));
    expect(decoded?.syntheticProfile?.id).toBe(profile.syntheticProfile?.id);
  });

  it('rejects a code of the wrong version', () => {
    const badge = encodeBadge(computeProfile(answersFromParty('fr_lfi')));
    expect(decodeBadge(`3${badge.slice(1)}`)).toBeNull();
  });

  it('rejects a code of the wrong length', () => {
    expect(decodeBadge('2')).toBeNull();
    expect(decodeBadge(`2${'a'.repeat(DIMENSION_ORDER.length + 1)}`)).toBeNull();
  });

  it('rejects a character outside the alphabet', () => {
    expect(decodeBadge(`2${'!'.repeat(DIMENSION_ORDER.length)}`)).toBeNull();
  });

  it('rejects an index no archetype was ever assigned', () => {
    // "z" is index 35; no dimension has 36 archetypes.
    expect(decodeBadge(`2${'z'.repeat(DIMENSION_ORDER.length)}`)).toBeNull();
  });

  it.each(['', null, undefined])('rejects %p', (code) => {
    expect(decodeBadge(code as unknown as string)).toBeNull();
  });

  it('is not confused by an answer code', () => {
    expect(decodeBadge(encodeAnswers(answersFromParty('fr_lfi')))).toBeNull();
  });
});

describe('badge codes already sent to people', () => {
  // A badge code is in the path of a link someone shared. Reordering
  // BADGE_ALPHABET would keep every round trip in this file green while
  // silently making that link show a stranger's profile. These fixtures are
  // the only thing that notices. They are not to be regenerated: a failure
  // here means the alphabet was reordered, and the fix is to put it back and
  // append instead.
  const FIXTURES = [
    {
      badge: '2046354a',
      synthetic: 'gaulliste_social_pragmatique',
      labels: {
        power: 'Étatiste planificateur',
        economy: 'Dirigiste colbertiste',
        geopolitics: 'Internationaliste tiers-mondiste',
        social: 'Libertaire hédoniste',
        environment: 'Bio-conservateur',
        knowledge: 'Sceptique cartésien',
        moral: 'Intransigeant moral'
      }
    },
    {
      badge: '28234225',
      synthetic: 'conservateur_national_romantique',
      labels: {
        power: "Partisan de l'ordre",
        economy: 'Protectionniste industriel',
        geopolitics: 'Non-interventionniste',
        social: 'National-identitaire',
        environment: 'Productiviste priorité économie',
        knowledge: 'Empiriste pragmatique',
        moral: 'National-romantique'
      }
    }
  ];

  it.each(FIXTURES)('$badge still means what it meant when it was minted', (fixture) => {
    const decoded = decodeBadge(fixture.badge);
    expect(decoded?.dimensionLabels).toEqual(fixture.labels);
    expect(decoded?.syntheticProfile?.id).toBe(fixture.synthetic);
  });
});

describe('identityFromShareCode, the /p/{code} boundary', () => {
  it('reads a badge code', () => {
    const profile = computeProfile(answersFromParty('fr_lfi'));
    const identity = identityFromShareCode(encodeBadge(profile));
    expect(identity?.syntheticProfile?.id).toBe(profile.syntheticProfile?.id);
  });

  it('still reads a link minted before badge codes existed', () => {
    // Those links carry the full answer code in the path. They are in
    // people's messages and they must keep resolving to the same page.
    const profile = computeProfile(answersFromParty('fr_rn'));
    const identity = identityFromShareCode(encodeAnswers(answersFromParty('fr_rn')));
    expect(identity?.syntheticProfile?.id).toBe(profile.syntheticProfile?.id);
    for (const dim of DIMENSION_ORDER) {
      expect(identity?.dimensionLabels[dim]).toBe(profile.dimensionArchetypes[dim]?.label);
    }
  });

  it('rejects anything that is neither', () => {
    expect(identityFromShareCode('not-a-code')).toBeNull();
    expect(identityFromShareCode('')).toBeNull();
  });
});

describe('badgeIdentityOf', () => {
  it('is what encodeBadge and decodeBadge agree on', () => {
    const profile = computeProfile(answersFromParty('fr_ps'));
    expect(decodeBadge(encodeBadge(profile))).toEqual(badgeIdentityOf(profile));
  });
});
