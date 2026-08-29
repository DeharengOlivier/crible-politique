import { PARTIES } from "@/data/parties";

const PARTY_NAMES: ReadonlyMap<string, string> = new Map(
    PARTIES.map((party) => [party.id, party.name])
);

/**
 * The name to print for a counter's party id.
 *
 * Counters are keyed by party id at write time and outlive the corpus: a party
 * removed from data/parties.ts leaves its rows behind, and its share of the
 * analyses is real. Printing the raw key would show a slug to a reader, so the
 * row keeps its weight and says what it is instead.
 */
export function partyLabelOf(partyId: string): string {
    return PARTY_NAMES.get(partyId) ?? "Parti retiré du corpus";
}
