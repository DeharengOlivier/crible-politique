/**
 * Why the complete analysis still leaves several parties tied at the top.
 *
 * A reader reported on 2026-09-01 that answering the whole corpus does not
 * separate the parties much more sharply than answering fifteen statements.
 * Before adding statements, this measures where the separation is actually
 * lost, because the three candidate causes call for three different fixes:
 *
 *  1. the panel is incoherent. A respondent answering at random is close to
 *     nobody in particular, and a wide leading group is then the correct
 *     answer, not a defect. Measured here by comparing a uniform panel with
 *     party-aligned respondents carrying increasing noise.
 *  2. the statements do not discriminate. A statement every party answers the
 *     same way measures the respondent against nobody: it can never break a
 *     tie. Measured here as the spread of documented party positions per
 *     statement.
 *  3. the parties are genuinely alike on this corpus. Two parties whose coded
 *     positions differ by a fraction of a Likert step cannot be separated by
 *     any test, and no new statement inside the same dimensions will help. The
 *     honest output is then to say they are close, not to manufacture a gap.
 *
 * Run (offline, seconds, no dependency added to the project):
 *   npx --yes tsx scripts/party-separation.ts
 *
 * Complexity: O(panel x parties^2 x statements) per scenario, ~10M elementary
 * operations for the current corpus. Deterministic: every panel is seeded.
 */
import { PARTY_POSITIONS } from "../data/partyPositions";
import { PARTIES } from "../data/parties";
import { expressStatementsFor, partiesFor, statementsFor } from "../lib/electoralScope";
import { computePartyMatches } from "../lib/scoringEngine";
import type { AnswerRecord, Country, LikertValue } from "../types/positions";

const COUNTRIES: Country[] = ["FR", "BE"];
const PANEL = 300;
const LIKERT: LikertValue[] = [-2, -1, 0, 1, 2];

/** A seeded linear congruential generator, so every run prints the same table. */
function makeRandom(seed: number): () => number {
    let state = seed & 0x7fffffff;
    return () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x7fffffff;
    };
}

function partyLabel(id: string): string {
    return PARTIES.find((p) => p.id === id)?.name ?? id;
}

/**
 * A respondent who leans towards one party, with a share of their answers
 * re-rolled at random.
 *
 * noise = 0 is the party itself, noise = 1 is a uniform random respondent. A
 * real reader sits somewhere in between: they recognise themselves in a family
 * without matching its programme line by line.
 */
function alignedRespondent(
    country: Country,
    partyId: string,
    noise: number,
    random: () => number
): AnswerRecord {
    const answers: AnswerRecord = {};
    for (const statement of statementsFor(country)) {
        const coded = PARTY_POSITIONS[statement.id]?.[partyId];
        if (coded === undefined || random() < noise) {
            answers[statement.id] = LIKERT[Math.floor(random() * LIKERT.length)];
            continue;
        }
        answers[statement.id] = coded.value;
    }
    return answers;
}

function uniformRespondent(country: Country, random: () => number): AnswerRecord {
    const answers: AnswerRecord = {};
    for (const statement of statementsFor(country)) {
        answers[statement.id] = LIKERT[Math.floor(random() * LIKERT.length)];
    }
    return answers;
}

/** The same respondent, restricted to the fifteen statements the express run asks. */
function expressSubset(country: Country, answers: AnswerRecord): AnswerRecord {
    const subset: AnswerRecord = {};
    for (const statement of expressStatementsFor(country)) {
        const value = answers[statement.id];
        if (value !== undefined) subset[statement.id] = value;
    }
    return subset;
}

interface Outcome {
    groupSize: number;
    leaderId: string;
    leaderIsTarget: boolean;
    intervalWidth: number;
    groupIds: string[];
}

function outcomeFor(country: Country, answers: AnswerRecord, targetId: string): Outcome {
    const matches = computePartyMatches(answers, { country });
    const group = matches.filter((m) => m.inLeadingGroup);
    const leader = matches[0];
    return {
        groupSize: group.length,
        leaderId: leader.party.id,
        leaderIsTarget: leader.party.id === targetId,
        intervalWidth: leader.upperBound - leader.lowerBound,
        groupIds: group.map((m) => m.party.id)
    };
}

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];
}

function mean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// --- 1. Does the analysis separate a coherent respondent? ---

function reportSeparation(country: Country): void {
    const parties = partiesFor(country);
    const corpus = statementsFor(country).length;
    const express = expressStatementsFor(country).length;
    console.log(`\n## ${country}: leading group size, ${parties.length} parties`);
    console.log(`\n| respondent | express (${express}) | complete (${corpus}) | leader is target |`);
    console.log("|---|---|---|---|");

    for (const noise of [0, 0.1, 0.2, 0.3, 0.5]) {
        const random = makeRandom(20260901 + Math.round(noise * 100));
        const expressSizes: number[] = [];
        const completeSizes: number[] = [];
        let targetLed = 0;
        for (let index = 0; index < PANEL; index += 1) {
            const target = parties[index % parties.length];
            const answers = alignedRespondent(country, target.id, noise, random);
            expressSizes.push(outcomeFor(country, expressSubset(country, answers), target.id).groupSize);
            const complete = outcomeFor(country, answers, target.id);
            completeSizes.push(complete.groupSize);
            if (complete.leaderIsTarget) targetLed += 1;
        }
        const share = Math.round((targetLed / PANEL) * 100);
        console.log(
            `| party + ${Math.round(noise * 100)}% noise | median ${median(expressSizes)}, mean ${mean(expressSizes).toFixed(1)} ` +
                `| median ${median(completeSizes)}, mean ${mean(completeSizes).toFixed(1)} | ${share}% |`
        );
    }

    const random = makeRandom(20260901);
    const expressSizes: number[] = [];
    const completeSizes: number[] = [];
    for (let index = 0; index < PANEL; index += 1) {
        const answers = uniformRespondent(country, random);
        expressSizes.push(outcomeFor(country, expressSubset(country, answers), "").groupSize);
        completeSizes.push(outcomeFor(country, answers, "").groupSize);
    }
    console.log(
        `| uniform random | median ${median(expressSizes)}, mean ${mean(expressSizes).toFixed(1)} ` +
            `| median ${median(completeSizes)}, mean ${mean(completeSizes).toFixed(1)} | n/a |`
    );
}

// --- 2. Which statements can break a tie at all? ---

function reportDiscrimination(country: Country): void {
    const parties = partiesFor(country).map((p) => p.id);
    const rows = statementsFor(country).map((statement) => {
        const values: number[] = [];
        for (const partyId of parties) {
            const coded = PARTY_POSITIONS[statement.id]?.[partyId];
            if (coded !== undefined) values.push(coded.value);
        }
        const average = values.length === 0 ? 0 : mean(values);
        const variance =
            values.length === 0 ? 0 : mean(values.map((v) => (v - average) ** 2));
        const spread = values.length === 0 ? 0 : Math.max(...values) - Math.min(...values);
        return {
            id: statement.id,
            dimension: statement.dimension,
            documented: values.length,
            sd: Math.sqrt(variance),
            spread,
            text: statement.text
        };
    });

    rows.sort((a, b) => a.sd - b.sd);
    console.log(`\n## ${country}: statements ranked by discriminating power (lowest first)`);
    console.log("\n| statement | dimension | parties coded | sd | range | text |");
    console.log("|---|---|---|---|---|---|");
    for (const row of rows) {
        console.log(
            `| ${row.id} | ${row.dimension} | ${row.documented} | ${row.sd.toFixed(2)} | ${row.spread} | ${row.text.slice(0, 70)} |`
        );
    }
    const flat = rows.filter((r) => r.sd < 0.75).length;
    console.log(
        `\n${flat} of ${rows.length} statements have sd < 0.75, meaning the parties answer them nearly alike.`
    );
}

// --- 3. Are the tied parties actually alike in the data? ---

function reportClosestPairs(country: Country): void {
    const parties = partiesFor(country);
    const statements = statementsFor(country);
    const pairs: { a: string; b: string; distance: number; shared: number; identical: number }[] = [];
    for (let i = 0; i < parties.length; i += 1) {
        for (let j = i + 1; j < parties.length; j += 1) {
            const distances: number[] = [];
            let identical = 0;
            for (const statement of statements) {
                const first = PARTY_POSITIONS[statement.id]?.[parties[i].id];
                const second = PARTY_POSITIONS[statement.id]?.[parties[j].id];
                if (first === undefined || second === undefined) continue;
                distances.push(Math.abs(first.value - second.value));
                if (first.value === second.value) identical += 1;
            }
            if (distances.length === 0) continue;
            pairs.push({
                a: parties[i].id,
                b: parties[j].id,
                distance: mean(distances),
                shared: distances.length,
                identical
            });
        }
    }
    pairs.sort((x, y) => x.distance - y.distance);
    console.log(`\n## ${country}: closest party pairs in the coded data`);
    console.log("\n| pair | mean Likert gap | identical positions | shared statements |");
    console.log("|---|---|---|---|");
    for (const pair of pairs.slice(0, 12)) {
        console.log(
            `| ${partyLabel(pair.a)} / ${partyLabel(pair.b)} | ${pair.distance.toFixed(2)} | ${pair.identical}/${pair.shared} | ${pair.shared} |`
        );
    }
}

// --- 4. Which pairs actually stay tied, on a realistic panel? ---

function reportPersistentTies(country: Country): void {
    const parties = partiesFor(country);
    const random = makeRandom(20260902);
    const together = new Map<string, number>();
    let groups = 0;
    for (let index = 0; index < PANEL; index += 1) {
        const target = parties[index % parties.length];
        const answers = alignedRespondent(country, target.id, 0.2, random);
        const { groupIds } = outcomeFor(country, answers, target.id);
        if (groupIds.length < 2) continue;
        groups += 1;
        for (let i = 0; i < groupIds.length; i += 1) {
            for (let j = i + 1; j < groupIds.length; j += 1) {
                const key = [groupIds[i], groupIds[j]].sort().join(" / ");
                together.set(key, (together.get(key) ?? 0) + 1);
            }
        }
    }
    const ranked = [...together.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
    console.log(
        `\n## ${country}: pairs the answers cannot separate (${groups}/${PANEL} respondents had a tie at all, 20% noise)`
    );
    console.log("\n| pair | tied together |");
    console.log("|---|---|");
    for (const [key, count] of ranked) {
        const [a, b] = key.split(" / ");
        console.log(`| ${partyLabel(a)} / ${partyLabel(b)} | ${count} |`);
    }
}

for (const country of COUNTRIES) {
    reportSeparation(country);
    reportClosestPairs(country);
    reportPersistentTies(country);
    reportDiscrimination(country);
}
