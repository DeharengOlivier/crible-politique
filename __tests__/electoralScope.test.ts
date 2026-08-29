import { describe, it, expect } from 'vitest';
import { STATEMENTS, EXPRESS_IDS_BY_COUNTRY } from '@/data/statements';
import { PARTIES } from '@/data/parties';
import { PARTY_POSITIONS } from '@/data/partyPositions';
import {
  COUNTRIES,
  BELGIAN_COLLEGES,
  statementsFor,
  expressStatementsFor,
  partiesFor,
} from '@/lib/electoralScope';
import { DIMENSION_ORDER } from '@/types/positions';
import type { Country } from '@/types/positions';

// G1..G5: a respondent is asked the statements of their country and compared
// only against the parties they could actually vote for.

describe('G2: statements are scoped, never silently reused', () => {
  it('declares a scope on every statement', () => {
    for (const s of STATEMENTS) {
      expect(['common', 'FR', 'BE'], s.id).toContain(s.scope);
    }
  });

  it('gives each country its common statements plus its own', () => {
    const common = STATEMENTS.filter((s) => s.scope === 'common');
    for (const country of COUNTRIES) {
      const own = STATEMENTS.filter((s) => s.scope === country);
      expect(own.length, `${country} has no specific statement`).toBeGreaterThan(0);
      expect(statementsFor(country)).toHaveLength(common.length + own.length);
      expect(statementsFor(country).every((s) => s.scope === 'common' || s.scope === country)).toBe(true);
    }
  });

  it('never leaks a statement of one country into the other', () => {
    for (const country of COUNTRIES) {
      const other = COUNTRIES.find((c) => c !== country)!;
      expect(statementsFor(country).some((s) => s.scope === other)).toBe(false);
    }
  });

  it('keeps statement ids unique across the whole corpus', () => {
    expect(new Set(STATEMENTS.map((s) => s.id)).size).toBe(STATEMENTS.length);
  });
});

describe('G3: no dimension is ever inferred from a single statement', () => {
  it('carries at least 2 statements per dimension in the full test', () => {
    for (const country of COUNTRIES) {
      for (const dimension of DIMENSION_ORDER) {
        const n = statementsFor(country).filter((s) => s.dimension === dimension).length;
        expect(n, `${country}/${dimension} full`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('carries exactly 2 statements per dimension in the express test', () => {
    for (const country of COUNTRIES) {
      const express = expressStatementsFor(country);
      expect(express, `${country} express`).toHaveLength(2 * DIMENSION_ORDER.length);
      for (const dimension of DIMENSION_ORDER) {
        const n = express.filter((s) => s.dimension === dimension).length;
        expect(n, `${country}/${dimension} express`).toBe(2);
      }
    }
  });

  it('draws the express test only from the statements of its own country', () => {
    for (const country of COUNTRIES) {
      const ids = new Set(statementsFor(country).map((s) => s.id));
      for (const id of EXPRESS_IDS_BY_COUNTRY[country]) {
        expect(ids.has(id), `${country} express id ${id}`).toBe(true);
      }
    }
  });
});

describe('G5: every express statement actually separates the parties', () => {
  // An express slot is expensive: 1 of 14. A statement whose parties all sit in
  // the same place spends the respondent's time without informing the result.
  const MIN_SD = 1.0;

  it('keeps a standard deviation of at least 1.0 across its country parties', () => {
    for (const country of COUNTRIES) {
      const parties = partiesFor(country);
      for (const statement of expressStatementsFor(country)) {
        const values: number[] = parties.map((p) => PARTY_POSITIONS[statement.id][p.id].value);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const sd = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1));
        expect(sd, `${country}/${statement.id} sd=${sd.toFixed(2)}`).toBeGreaterThanOrEqual(MIN_SD);
      }
    }
  });
});

describe('G1: a respondent is only compared against parties they can vote for', () => {
  it('scopes parties by country', () => {
    for (const country of COUNTRIES) {
      expect(partiesFor(country).length).toBeGreaterThan(0);
      expect(partiesFor(country).every((p) => p.country === country)).toBe(true);
    }
  });

  it('scopes Belgian parties by electoral college', () => {
    for (const college of BELGIAN_COLLEGES) {
      const parties = partiesFor('BE', college);
      expect(parties.length, college).toBeGreaterThan(0);
      expect(parties.every((p) => p.colleges?.includes(college)), college).toBe(true);
    }
  });

  it('never puts a Flemish-only list in front of a Walloon voter', () => {
    const walloon = partiesFor('BE', 'wallonie').map((p) => p.id);
    expect(walloon).not.toContain('be_nva');
    expect(walloon).not.toContain('be_vb');
    expect(walloon).toContain('be_ps');
    expect(walloon).toContain('be_ecolo');
  });

  it('never puts a francophone-only list in front of a Flemish voter', () => {
    const flemish = partiesFor('BE', 'flandre').map((p) => p.id);
    expect(flemish).not.toContain('be_defi');
    expect(flemish).not.toContain('be_ps');
    expect(flemish).toContain('be_nva');
    expect(flemish).toContain('be_groen');
  });

  it('puts both language groups in front of a Brussels voter', () => {
    const brussels = partiesFor('BE', 'bruxelles').map((p) => p.id);
    expect(brussels).toContain('be_ps');
    expect(brussels).toContain('be_nva');
  });

  it('gives every Belgian party at least one college, and no French party any', () => {
    for (const party of PARTIES) {
      if (party.country === 'BE') {
        expect(party.colleges?.length, party.id).toBeGreaterThan(0);
      } else {
        expect(party.colleges, party.id).toBeUndefined();
      }
    }
  });

  it('ignores a college for France, which has none', () => {
    expect(partiesFor('FR').map((p) => p.id)).toEqual(
      PARTIES.filter((p) => p.country === 'FR').map((p) => p.id)
    );
  });
});

describe('data integrity across the scoped corpus', () => {
  it('documents every party on every statement of its own country', () => {
    for (const country of COUNTRIES as readonly Country[]) {
      for (const statement of statementsFor(country)) {
        for (const party of partiesFor(country)) {
          const stance = PARTY_POSITIONS[statement.id]?.[party.id];
          expect(stance, `${statement.id}/${party.id}`).toBeDefined();
          expect([-2, -1, 0, 1, 2]).toContain(stance!.value);
        }
      }
    }
  });
});
