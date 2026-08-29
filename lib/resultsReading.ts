import { PartyMatch } from "@/lib/scoringEngine";

// Two readings of the same comparison, and the rank that goes with each.
//
// Proximity answers "how far are their positions from mine on average", and
// mechanically favours a party coded near the middle of every scale. The
// directional reading answers "how strongly do we push the same way", and
// favours intensity instead. They disagree, and that disagreement is the
// information: a first place that survives only one of the two metrics was
// never a first place.
//
// The rank belongs to the reading. Displaying the proximity rank beside a list
// ordered by directional score reads as a broken table, which is what a manual
// session found it doing.

export const READINGS = ["proximity", "directional"] as const;

export type Reading = (typeof READINGS)[number];

export const READING_LABELS: Record<Reading, string> = {
    proximity: "Proximité",
    directional: "Directionnelle"
};

export interface RankedMatch {
    match: PartyMatch;
    /** Competition rank under this reading: equal scores share it, 1, 2, 2, 4. */
    displayRank: number;
}

function scoreUnder(match: PartyMatch, reading: Reading): number {
    return reading === "proximity" ? match.score : match.directionalScore;
}

/**
 * Orders the matches by the score of one reading and numbers them under it.
 *
 * O(n log n) in the number of parties, which is at most twelve.
 */
export function rankedForReading(matches: readonly PartyMatch[], reading: Reading): RankedMatch[] {
    const ordered = [...matches].sort((a, b) => scoreUnder(b, reading) - scoreUnder(a, reading));

    let rank = 0;
    let previousScore: number | null = null;
    return ordered.map((match, index) => {
        const score = scoreUnder(match, reading);
        if (previousScore === null || score !== previousScore) {
            rank = index + 1;
            previousScore = score;
        }
        return { match, displayRank: rank };
    });
}
