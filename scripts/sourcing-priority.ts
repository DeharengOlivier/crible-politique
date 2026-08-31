/**
 * Which coded positions to source first.
 *
 * The audit of 2026-08-30 measured that 816 coded party positions carry the
 * whole application and that 55 of them name a source. Sourcing all of them is
 * a long job, and the order it is done in is not neutral: a position no
 * respondent's result depends on can be wrong for a year without anyone being
 * misled, while a position that decides who tops the ranking is the one worth
 * an afternoon in a manifesto.
 *
 * So this measures each cell rather than guessing: it perturbs one coded
 * position by one Likert step, recomputes a panel of respondents, and counts
 * how many of them end up with a different leading group. A cell nothing
 * depends on scores zero. A cell that flips the answer for a third of the panel
 * is at the top of the list.
 *
 * Run (offline, minutes, no dependency added to the project):
 *   npx --yes tsx scripts/sourcing-priority.ts > docs/sourcing-priority.md
 *
 * Complexity: O(cells x perturbations x panel x parties^2 x statements), which
 * is ~500M elementary operations for the current corpus, hence a script and not
 * a test. Deterministic: the panel is seeded.
 */
import { PARTY_POSITIONS } from "../data/partyPositions";
import { STATEMENTS_BY_ID } from "../data/statements";
import { PARTIES } from "../data/parties";
import { statementsFor } from "../lib/electoralScope";
import { computePartyMatches } from "../lib/scoringEngine";
import type { AnswerRecord, Country, LikertValue } from "../types/positions";

/**
 * Respondents per country. The panel answers uniformly at random, which is not
 * an electorate: it is a way of asking "on how many possible readers does this
 * one cell matter", not "on how many actual readers". Real respondents cluster,
 * so a cell that matters to a cluster this panel under-represents will rank
 * lower here than it deserves. Said plainly rather than left for someone to
 * discover in the numbers.
 */
const PANEL = 200;
const TOP_TO_REPORT = 40;

const LIKERT: LikertValue[] = [-2, -1, 0, 1, 2];

/** A deterministic panel: the same list every run, on any machine. */
function panelFor(country: Country): AnswerRecord[] {
    const statements = statementsFor(country);
    const respondents: AnswerRecord[] = [];
    let seed = 20260830;
    for (let index = 0; index < PANEL; index += 1) {
        const answers: AnswerRecord = {};
        for (const { id } of statements) {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            answers[id] = LIKERT[seed % LIKERT.length];
        }
        respondents.push(answers);
    }
    return respondents;
}

function leadingGroupOf(answers: AnswerRecord, country: Country): string {
    return computePartyMatches(answers, { country })
        .filter((match) => match.inLeadingGroup)
        .map((match) => match.party.id)
        .sort()
        .join(",");
}

interface CellImpact {
    statementId: string;
    partyId: string;
    /** Share of the panel whose leading group changed, 0 to 1. */
    impact: number;
    sourced: boolean;
}

function measure(country: Country): CellImpact[] {
    const panel = panelFor(country);
    const baseline = panel.map((answers) => leadingGroupOf(answers, country));
    const partyIds = PARTIES.filter((party) => party.country === country).map((party) => party.id);
    const impacts: CellImpact[] = [];

    for (const { id: statementId } of statementsFor(country)) {
        const row = PARTY_POSITIONS[statementId];
        if (row === undefined) continue;
        for (const partyId of partyIds) {
            const stance = row[partyId];
            if (stance === undefined) continue;
            const original = stance.value;
            let changed = 0;
            for (const step of [-1, 1]) {
                const shifted = Math.max(-2, Math.min(2, original + step)) as LikertValue;
                if (shifted === original) continue;
                row[partyId] = { ...stance, value: shifted };
                panel.forEach((answers, index) => {
                    if (leadingGroupOf(answers, country) !== baseline[index]) changed += 1;
                });
            }
            row[partyId] = stance;
            impacts.push({
                statementId,
                partyId,
                // Two perturbations over the panel, so the denominator is 2N.
                impact: changed / (2 * panel.length),
                sourced: stance.source !== undefined
            });
        }
    }
    return impacts;
}

function nameOf(partyId: string): string {
    return PARTIES.find((party) => party.id === partyId)?.name ?? partyId;
}

function report(country: Country): void {
    const impacts = measure(country)
        .filter((cell) => cell.impact > 0 && !cell.sourced)
        .sort((a, b) => b.impact - a.impact)
        .slice(0, TOP_TO_REPORT);

    console.log(`\n## ${country}: les ${impacts.length} positions non sourcées les plus décisives\n`);
    console.log("| # | Parti | Énoncé | Part du panel dont le groupe de tête change |");
    console.log("|---|---|---|---|");
    impacts.forEach((cell, index) => {
        const text = STATEMENTS_BY_ID[cell.statementId]?.text ?? cell.statementId;
        const short = text.length > 90 ? `${text.slice(0, 88)}…` : text;
        console.log(
            `| ${index + 1} | ${nameOf(cell.partyId)} | ${short} | ${(cell.impact * 100).toFixed(0)}% |`
        );
    });
}

console.log("# Ordre de sourçage, mesuré");
console.log(
    `\nGénéré par \`scripts/sourcing-priority.ts\`, panel de ${PANEL} répondants par pays, ` +
        "perturbation d'un cran Likert sur chaque position codée. Le pourcentage est la part " +
        "du panel dont le **groupe de tête** change quand cette seule position bouge d'un cran. " +
        "Les positions déjà sourcées sont exclues de la liste."
);
report("FR");
report("BE");
