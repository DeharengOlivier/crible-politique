import type { DimensionKey } from '@/types/positions';
import { PARTY_FIGHTS, PartyFight, PartyFightsEntry } from '@/data/partyFights';

// Reading the declared fights of a party, and policing how they are sourced.
//
// The sourcing rule is the one the project already applies to positions, and
// it lives here as a function rather than as a promise in a comment: a status
// "verifie" without a verbatim quote is a defect the suite catches, not an
// editorial intention.

export function fightsFor(partyId: string): PartyFightsEntry | null {
    return PARTY_FIGHTS[partyId] ?? null;
}

/** Whether a fight touches one of the dimensions the reader named. O(d). */
export function fightInPriorities(
    fight: Pick<PartyFight, 'dimensions'>,
    priorities: readonly DimensionKey[]
): boolean {
    return fight.dimensions.some((dimension) => priorities.includes(dimension));
}

/** Shortest claim that a reader can actually check against the source. */
const MIN_CLAIM_LENGTH = 20;

/**
 * Everything wrong with how an entry is sourced, as a list of reasons.
 *
 * O(fights). An empty list is the only acceptable result for shipped data.
 */
export function fightsSourcingIssues(entry: PartyFightsEntry): string[] {
    const issues: string[] = [];
    if (!entry.source.url.startsWith('https://')) issues.push('source.url must be an https URL');
    if (entry.source.label.trim().length === 0) {
        issues.push('source.label must say which document was read');
    }
    if (!/^\d{4}$/.test(entry.source.year)) issues.push('source.year must be a four-digit year');
    if (entry.status === 'non_documente') {
        issues.push('status "non_documente" has no meaning here');
    }
    if (entry.status === 'verifie' && entry.fights.some((fight) => fight.quote === undefined)) {
        issues.push('status "verifie" requires a quote on every fight');
    }
    for (const fight of entry.fights) {
        if (fight.theme.trim().length === 0) issues.push('a fight must carry a theme');
        if (fight.claim.trim().length < MIN_CLAIM_LENGTH) {
            issues.push(`claim too short to be checkable: "${fight.claim}"`);
        }
    }
    return issues;
}

export type { PartyFight, PartyFightsEntry };
