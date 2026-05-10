import { describe, it, expect } from 'vitest';
import { STATEMENTS, EXPRESS_STATEMENTS } from '@/data/statements';
import { PARTIES } from '@/data/parties';
import { PARTY_POSITIONS } from '@/data/partyPositions';
import { computeProfile, computePartyMatches } from '@/lib/scoringEngine';
import { encodeAnswers, decodeAnswers, sanitizeAnswers } from '@/lib/profileCode';
import { chesRawData } from '@/data/ches';
import { AnswerRecord, LikertValue } from '@/types/positions';

// La promesse centrale du produit est le déterminisme et l'intégrité des
// données: ces tests la verrouillent.

function buildAnswers(value: LikertValue): AnswerRecord {
  return Object.fromEntries(STATEMENTS.map((s) => [s.id, value]));
}

describe('Intégrité des données', () => {
  it('couvre 28 énoncés sur 7 dimensions', () => {
    expect(STATEMENTS).toHaveLength(28);
    expect(new Set(STATEMENTS.map((s) => s.dimension)).size).toBe(7);
  });

  it('le sous-ensemble express compte 12 énoncés couvrant les 7 dimensions', () => {
    expect(EXPRESS_STATEMENTS).toHaveLength(12);
    expect(new Set(EXPRESS_STATEMENTS.map((s) => s.dimension)).size).toBe(7);
  });

  it('chaque parti déclaré a une position sur chaque énoncé', () => {
    expect(PARTIES.length).toBe(24);
    for (const statement of STATEMENTS) {
      for (const party of PARTIES) {
        const stance = PARTY_POSITIONS[statement.id]?.[party.id];
        expect(stance, `${statement.id}/${party.id}`).toBeDefined();
        expect([-2, -1, 0, 1, 2]).toContain(stance!.value);
      }
    }
  });
});

describe('Déterminisme du moteur', () => {
  it('mêmes réponses, même résultat (matchs et profil)', () => {
    const answers: AnswerRecord = {};
    STATEMENTS.forEach((s, i) => {
      answers[s.id] = (((i % 5) - 2) as LikertValue);
    });
    const a = computePartyMatches(answers);
    const b = computePartyMatches(answers);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(computeProfile(answers))).toBe(JSON.stringify(computeProfile(answers)));
  });

  it("la formule d'accord est respectée (1 - |écart|/4)", () => {
    // Un seul énoncé répondu: le score du parti = accord sur cet énoncé.
    const answers: AnswerRecord = { ec1: 2 };
    const matches = computePartyMatches(answers);
    for (const m of matches) {
      const stance = PARTY_POSITIONS.ec1[m.party.id];
      const expected = Math.round((1 - Math.abs(2 - stance.value) / 4) * 100);
      expect(m.score).toBe(expected);
      expect(m.lowCoverage).toBe(true);
    }
  });

  it('"sans opinion" est exclu du calcul, jamais pénalisé', () => {
    const allNull: AnswerRecord = Object.fromEntries(STATEMENTS.map((s) => [s.id, null]));
    const profile = computeProfile(allNull);
    expect(profile.answeredCount).toBe(0);
    const matches = computePartyMatches(allNull);
    expect(matches.every((m) => m.answeredAndDocumented === 0)).toBe(true);
  });

  it('accord total avec soi-même: répondre les positions exactes d’un parti donne 100%', () => {
    const target = 'fr_lfi';
    const answers: AnswerRecord = {};
    STATEMENTS.forEach((s) => {
      answers[s.id] = PARTY_POSITIONS[s.id][target].value;
    });
    const top = computePartyMatches(answers)[0];
    expect(top.party.id).toBe(target);
    expect(top.score).toBe(100);
  });
});

describe('Encodage de profil (partage local)', () => {
  it('roundtrip complet, y compris sans opinion et réponses partielles', () => {
    const answers: AnswerRecord = {};
    STATEMENTS.forEach((s, i) => {
      answers[s.id] = i % 4 === 0 ? null : ((((i % 5) - 2)) as LikertValue);
    });
    const decoded = decodeAnswers(encodeAnswers(answers));
    expect(decoded).not.toBeNull();
    for (const s of STATEMENTS) {
      expect(decoded![s.id]).toBe(answers[s.id] ?? null);
    }
  });

  it('rejette les codes invalides', () => {
    expect(decodeAnswers('')).toBeNull();
    expect(decodeAnswers('2abc')).toBeNull();
    expect(decodeAnswers('1abc')).toBeNull(); // longueur incorrecte
    expect(decodeAnswers('1' + 'z'.repeat(28))).toBeNull(); // caractère inconnu
  });
});

describe('sanitizeAnswers (validation du stockage local)', () => {
  it('conserve les énoncés connus avec des valeurs Likert valides', () => {
    const clean = sanitizeAnswers({ ec1: 2, pw1: -1, mo3: 0, ge3: null });
    expect(clean).toEqual({ ec1: 2, pw1: -1, mo3: 0, ge3: null });
  });

  it('ignore les énoncés inconnus', () => {
    const clean = sanitizeAnswers({ ec1: 1, inexistant: 2 });
    expect(clean).toEqual({ ec1: 1 });
  });

  it('rejette tout le jeu si une valeur est corrompue', () => {
    expect(sanitizeAnswers({ ec1: 1, pw1: 99 })).toBeNull();
    expect(sanitizeAnswers({ ec1: 1.5 })).toBeNull();
    expect(sanitizeAnswers({ ec1: 'gauche' })).toBeNull();
    expect(sanitizeAnswers('pas un objet')).toBeNull();
    expect(sanitizeAnswers(null)).toBeNull();
  });
});

describe('Cohérence externe avec CHES 2024 (axe économique)', () => {
  // Notre codage par énoncé et le positionnement académique CHES sont deux
  // mesures indépendantes: elles doivent être fortement corrélées sur l'axe
  // économique gauche-droite, sinon l'un des deux codages a un problème.
  const ID_MAP: Record<string, string> = {
    fr_lfi: 'lfi', fr_rn: 'rn', fr_renaissance: 'renaissance', fr_lr: 'lr',
    fr_eelv: 'eelv', fr_ps: 'ps', fr_reconquete: 'reconquete', fr_pcf: 'pcf',
    fr_modem: 'modem', fr_horizons: 'horizons', fr_upr: 'upr',
    be_ptb: 'ptb', be_mr: 'mr', be_ecolo: 'ecolo', be_nva: 'nva',
    be_vooruit: 'vooruit', be_groen: 'groen', be_cdv: 'cdv', be_defi: 'defi'
  };

  function spearman(xs: number[], ys: number[]): number {
    const rank = (arr: number[]) => {
      const sorted = arr.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
      const ranks = new Array<number>(arr.length);
      sorted.forEach(([, originalIndex], r) => {
        ranks[originalIndex] = r;
      });
      return ranks;
    };
    const rx = rank(xs);
    const ry = rank(ys);
    const n = xs.length;
    const meanX = rx.reduce((a, b) => a + b, 0) / n;
    const meanY = ry.reduce((a, b) => a + b, 0) / n;
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) {
      num += (rx[i] - meanX) * (ry[i] - meanY);
      dx += (rx[i] - meanX) ** 2;
      dy += (ry[i] - meanY) ** 2;
    }
    return num / Math.sqrt(dx * dy);
  }

  it('la corrélation de rang entre notre axe économique et CHES lrecon est forte', () => {
    const ours: number[] = [];
    const ches: number[] = [];
    for (const [ourId, chesId] of Object.entries(ID_MAP)) {
      const data = chesRawData[chesId];
      if (!data) continue;
      // Droite économique selon nos énoncés: refus de taxer (ec1-), refus du
      // public (ec2-), priorité à la dette (ec4+).
      const econRight =
        -PARTY_POSITIONS.ec1[ourId].value -
        PARTY_POSITIONS.ec2[ourId].value +
        PARTY_POSITIONS.ec4[ourId].value;
      ours.push(econRight);
      ches.push(data.lrecon); // 0 = gauche, 10 = droite
    }
    expect(ours.length).toBeGreaterThanOrEqual(15);
    const rho = spearman(ours, ches);
    expect(rho).toBeGreaterThan(0.7);
  });
});
