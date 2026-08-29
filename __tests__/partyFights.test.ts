import { describe, expect, it } from 'vitest';
import { PARTIES } from '@/data/parties';
import { PARTY_FIGHTS, PartyFightsEntry } from '@/data/partyFights';
import { fightsSourcingIssues, fightInPriorities } from '@/lib/partyFights';
import { DIMENSION_ORDER } from '@/types/positions';

// What a party says it fights for, taken from its own programme and nothing
// else. Replaces the CHES 2024 salience layer shipped a few hours earlier the
// same night: a reader objected that it gave numbers to 22 parties and nothing
// to the two the panel does not cover, which made the panel say more about the
// dataset's reach than about the parties. Every party is now treated the same
// way, and every fight is a sourced sentence a reader can go and check.

const entries = Object.entries(PARTY_FIGHTS);

describe('the declared fights data', () => {
    it('covers every party of the corpus, both countries', () => {
        for (const party of PARTIES) {
            expect(PARTY_FIGHTS[party.id], `missing fights for ${party.id}`).toBeDefined();
        }
        expect(entries.length).toBe(PARTIES.length);
    });

    it('names no party the corpus does not have', () => {
        const known = new Set(PARTIES.map((party) => party.id));
        for (const [partyId] of entries) expect(known.has(partyId), partyId).toBe(true);
    });

    it('gives every party between two and four fights', () => {
        for (const [partyId, entry] of entries) {
            expect(entry.fights.length, partyId).toBeGreaterThanOrEqual(2);
            expect(entry.fights.length, partyId).toBeLessThanOrEqual(4);
        }
    });

    it('anchors every fight in the dimensions the questionnaire really asks about', () => {
        for (const [partyId, entry] of entries) {
            for (const fight of entry.fights) {
                for (const dimension of fight.dimensions) {
                    expect(DIMENSION_ORDER, `${partyId}/${fight.theme}`).toContain(dimension);
                }
                expect(new Set(fight.dimensions).size).toBe(fight.dimensions.length);
            }
        }
    });

    it('leaves a fight outside the corpus without a dimension rather than stretching one', () => {
        // Housing and schooling are declared fights of several parties and are
        // asked by none of the 35 statements. Inventing a dimension for them
        // would make a reader believe their priorities cover them.
        const outside = entries.flatMap(([partyId, entry]) =>
            entry.fights.filter((f) => f.dimensions.length === 0).map((f) => `${partyId}/${f.theme}`)
        );
        expect(outside.length).toBeGreaterThan(0);
    });

    it('treats the two parties outside every expert panel exactly like the others', () => {
        // The complaint that killed the salience layer: no party may be the one
        // with a downgraded kind of evidence.
        for (const partyId of ['fr_upr', 'fr_patriotes']) {
            const entry = PARTY_FIGHTS[partyId];
            expect(entry.status, partyId).toBe(PARTY_FIGHTS.fr_rn.status);
            expect(entry.fights.length, partyId).toBeGreaterThanOrEqual(2);
            expect(entry.source.url.startsWith('https://'), partyId).toBe(true);
        }
    });

    it('carries the formulated exits where the programmes formulate them', () => {
        const upr = JSON.stringify(PARTY_FIGHTS.fr_upr);
        expect(upr).toMatch(/OTAN/);
        expect(upr).toMatch(/euro|€/);
        const patriotes = JSON.stringify(PARTY_FIGHTS.fr_patriotes);
        expect(patriotes).toMatch(/Frexit/);
        expect(patriotes).toMatch(/OTAN/);
    });

    it('has no sourcing issue anywhere in the real data', () => {
        for (const [partyId, entry] of entries) {
            expect(fightsSourcingIssues(entry), partyId).toEqual([]);
        }
    });
});

describe('fightsSourcingIssues', () => {
    const sound: PartyFightsEntry = {
        source: { label: 'Programme fédéral 2024', url: 'https://example.org/programme', year: '2024' },
        status: 'a_verifier',
        fights: [
            { theme: 'Justice fiscale', claim: 'Taxer les multimillionnaires, premier axe du programme.', dimensions: ['economy'] },
            { theme: 'Climat', claim: 'Ce sont aux gros pollueurs de payer, axe affiché du programme.', dimensions: ['environment'] }
        ]
    };

    it('accepts a sound entry', () => {
        expect(fightsSourcingIssues(sound)).toEqual([]);
    });

    it('refuses a source that is not a reachable-looking document', () => {
        expect(fightsSourcingIssues({ ...sound, source: { ...sound.source, url: 'example.org' } })).toContain(
            'source.url must be an https URL'
        );
        expect(fightsSourcingIssues({ ...sound, source: { ...sound.source, label: '' } })).toContain(
            'source.label must say which document was read'
        );
    });

    it('refuses a claim too short to be checkable', () => {
        const issues = fightsSourcingIssues({
            ...sound,
            fights: [{ theme: 'X', claim: 'Bof.', dimensions: [] }, sound.fights[1]]
        });
        expect(issues.some((issue) => issue.includes('claim'))).toBe(true);
    });

    it('refuses a verified status without a verbatim quote, as the positions do', () => {
        const issues = fightsSourcingIssues({ ...sound, status: 'verifie' });
        expect(issues).toContain('status "verifie" requires a quote on every fight');
        const quoted: PartyFightsEntry = {
            ...sound,
            status: 'verifie',
            fights: sound.fights.map((fight) => ({ ...fight, quote: 'une citation exacte' }))
        };
        expect(fightsSourcingIssues(quoted)).toEqual([]);
    });

    it('refuses an undocumented status: a party with no fight has no entry at all', () => {
        expect(fightsSourcingIssues({ ...sound, status: 'non_documente' })).toContain(
            'status "non_documente" has no meaning here'
        );
    });
});

describe('fightInPriorities', () => {
    it('is true when the fight touches one of the named dimensions', () => {
        expect(fightInPriorities({ dimensions: ['economy'] }, ['economy'])).toBe(true);
        expect(fightInPriorities({ dimensions: ['geopolitics', 'social'] }, ['social'])).toBe(true);
    });

    it('is false for a fight the questionnaire does not cover, whatever is named', () => {
        // Housing: a real declared fight, asked by none of the statements.
        expect(fightInPriorities({ dimensions: [] }, [...DIMENSION_ORDER])).toBe(false);
    });

    it('is false when nothing is named', () => {
        expect(fightInPriorities({ dimensions: ['economy'] }, [])).toBe(false);
    });
});
