import { PARTY_POSITIONS } from '@/data/partyPositions';
import { PARTIES_BY_ID } from '@/data/parties';
import { statementsFor } from '@/lib/electoralScope';
import type { AnswerRecord, Country } from '@/types/positions';

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
