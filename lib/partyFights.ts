import type { DimensionKey } from '@/types/positions';
import type { CHESSource } from '@/data/ches';
import {
    PARTY_SALIENCE,
    SALIENCE_THEMES,
    SALIENCE_THEME_DIMENSIONS,
    SalienceTheme
} from '@/data/partySalience';

// The declared fights of a party, read for display: the few themes the party
// itself treats as most important, with their measured salience when CHES
// covers the party and the program's own words when it does not.

export const TOP_FIGHTS_COUNT = 3;

export interface DeclaredFight {
    theme: SalienceTheme;
    /** CHES salience 0-10, or null when the fight is a documented estimate. */
    value: number | null;
    source: CHESSource;
    /** Clear-text statement, present only on estimated fights. */
    detail?: string;
}

/**
 * The party's top declared fights, most salient first. Ties break on the
 * codebook order of SALIENCE_THEMES (Array.prototype.sort is stable).
 * O(T log T) with T = 9 themes. Unknown party: empty list, the caller shows
 * nothing rather than crashing a results page.
 */
export function topDeclaredFights(partyId: string): DeclaredFight[] {
    const entry = PARTY_SALIENCE[partyId];
    if (entry === undefined) return [];
    if (entry.source === 'Estimation documentée') {
        return entry.declaredFights.map((fight) => ({
            theme: fight.theme,
            value: null,
            source: entry.source,
            detail: fight.detail
        }));
    }
    return SALIENCE_THEMES.map((theme) => ({
        theme,
        value: entry.values[theme],
        source: entry.source
    }))
        .sort((a, b) => b.value - a.value)
        .slice(0, TOP_FIGHTS_COUNT);
}

/** Whether a fight's theme falls inside one of the reader's named dimensions. */
export function fightInPriorities(
    theme: SalienceTheme,
    priorities: readonly DimensionKey[]
): boolean {
    return SALIENCE_THEME_DIMENSIONS[theme].some((dimension) => priorities.includes(dimension));
}
