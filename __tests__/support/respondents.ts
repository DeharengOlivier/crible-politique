import { PARTY_POSITIONS } from '@/data/partyPositions';
import { PARTIES_BY_ID } from '@/data/parties';
import { statementsFor } from '@/lib/electoralScope';
import type { AnswerRecord, Country, LikertValue } from '@/types/positions';

// Builders for the respondents the suite reasons about. A respondent belongs to
// one country, so building an answer set from the whole corpus would put
// statements in front of them that they never saw.

export function countryOfParty(partyId: string): Country {
  const party = PARTIES_BY_ID[partyId];
  if (!party) throw new Error(`Unknown party id: ${partyId}`);
  return party.country;
}

/** A respondent who answers exactly one party's documented positions. */
export function answersLikeParty(partyId: string): AnswerRecord {
  const answers: AnswerRecord = {};
  for (const statement of statementsFor(countryOfParty(partyId))) {
    answers[statement.id] = PARTY_POSITIONS[statement.id][partyId].value;
  }
  return answers;
}

/** The scoring options of a respondent of the same country as this party. */
export function scopeOfParty(partyId: string): { country: Country } {
  return { country: countryOfParty(partyId) };
}

/**
 * A reproducible respondent who answers anything: the same seed always gives
 * the same answers, so a scenario measured once stays the scenario the test
 * describes. Linear congruential generator, no dependency.
 */
export function seededAnswers(country: Country, seed: number): AnswerRecord {
  const values: LikertValue[] = [-2, -1, 0, 1, 2];
  const answers: AnswerRecord = {};
  let state = seed;
  for (const statement of statementsFor(country)) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    answers[statement.id] = values[state % 5];
  }
  return answers;
}
