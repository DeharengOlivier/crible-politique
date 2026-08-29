import Link from 'next/link';
import { DIMENSION_LABELS, DimensionKey } from '@/types/positions';
import { SyntheticProfile } from '@/data/syntheticProfiles';
import { familyCompositionOf } from '@/lib/familyComposition';

// One family of the leading group, opened up: what it stands for, the currents
// it expects on every dimension, laid against the currents the respondent
// actually holds, and how well the whole matches. This is the bridge between
// the two layers of the result; without it the family title reads as a verdict
// produced by nothing, and two families in the group cannot be compared.

interface FamilyCompositionCardProps {
    family: SyntheticProfile;
    /** The respondent's dominant current per dimension. */
    held: Partial<Record<DimensionKey, string>>;
    /** Agreement between the respondent's answers and this family, 0-100. */
    score?: number;
    /** Whether the card starts unfolded (the closest family does). */
    open?: boolean;
}

export default function FamilyCompositionCard({
    family,
    held,
    score,
    open = false
}: FamilyCompositionCardProps) {
    const composition = familyCompositionOf(family, held);
    return (
        <details
            open={open}
            className="rounded-xl border border-[var(--color-border-light)] bg-white px-4 py-3"
        >
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-[var(--color-text)] sm:min-h-0">
                <span>«&nbsp;{family.title}&nbsp;»</span>
                <span className="shrink-0 text-xs font-normal text-[var(--color-text-muted)]">
                    {score !== undefined && (
                        <span className="mr-2 font-[family-name:var(--font-heading)] font-bold text-[var(--color-primary)]">
                            {score}%
                        </span>
                    )}
                    <span aria-hidden="true">déplier</span>
                </span>
            </summary>
            <div className="mt-2 space-y-2">
                <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    {family.description}
                </p>
                {composition.constrained.map((reading) => (
                    <div
                        key={reading.dimension}
                        className="rounded-lg bg-[var(--color-bg-elevated)] px-3 py-2"
                    >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                            {DIMENSION_LABELS[reading.dimension]}
                        </p>
                        <p className="mt-0.5 text-sm text-[var(--color-text)]">
                            Attend:{' '}
                            <span className="font-semibold">{reading.expected.join(' ou ')}</span>
                        </p>
                        {reading.held && (
                            <p
                                className={`mt-0.5 text-xs ${
                                    reading.shared ? 'text-emerald-700' : 'text-amber-700'
                                }`}
                            >
                                Votre courant: {reading.held}
                                {reading.shared
                                    ? ', celui attendu par cette famille.'
                                    : ", un autre: la proximité se joue énoncé par énoncé, pas sur le seul courant dominant."}
                            </p>
                        )}
                    </div>
                ))}
                {composition.silent.length > 0 && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                        Les {composition.silent.length} autres dimensions (
                        {composition.silent.map((d) => DIMENSION_LABELS[d]).join(', ')})
                        n&apos;entrent pas dans la définition de cette famille.
                    </p>
                )}
                <Link
                    href={`/concepts#${family.id}`}
                    className="inline-block text-xs font-semibold text-[var(--color-primary)] hover:underline"
                >
                    La fiche complète de cette famille
                </Link>
            </div>
        </details>
    );
}
