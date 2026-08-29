import Link from 'next/link';
import { DIMENSION_LABELS, DimensionKey } from '@/types/positions';
import { SyntheticProfile } from '@/data/syntheticProfiles';
import { familyCompositionOf } from '@/lib/familyComposition';

// One family of the leading group, opened up: the currents it expects,
// dimension by dimension, laid against the currents the respondent actually
// holds. This is the bridge between the two layers of the result; without it
// the family title reads as a verdict produced by nothing.

interface FamilyCompositionCardProps {
    family: SyntheticProfile;
    /** The respondent's dominant current per dimension. */
    held: Partial<Record<DimensionKey, string>>;
    /** Whether the card starts unfolded (the closest family does). */
    open?: boolean;
}

export default function FamilyCompositionCard({
    family,
    held,
    open = false
}: FamilyCompositionCardProps) {
    const composition = familyCompositionOf(family, held);
    return (
        <details
            open={open}
            className="rounded-xl border border-[var(--color-border-light)] bg-white px-4 py-3"
        >
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-[var(--color-text)] sm:min-h-0">
                <span>Ce qui définit «&nbsp;{family.title}&nbsp;»</span>
                <span aria-hidden="true" className="text-xs font-normal text-[var(--color-text-muted)]">
                    déplier
                </span>
            </summary>
            <div className="mt-2 space-y-2">
                {composition.constrained.map((reading) => (
                    <div
                        key={reading.dimension}
                        className="rounded-lg bg-[var(--color-bg-elevated)] px-3 py-2"
                    >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                            {DIMENSION_LABELS[reading.dimension]}
                        </p>
                        <p className="mt-0.5 text-sm text-[var(--color-text)]">
                            Se reconnaît dans:{' '}
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
                <p className="text-xs text-[var(--color-text-muted)]">
                    Les {composition.silent.length} autres dimensions (
                    {composition.silent.map((d) => DIMENSION_LABELS[d]).join(', ')}) n&apos;entrent
                    pas dans la définition de cette famille: votre boussole ci-dessous les couvre
                    toutes.
                </p>
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
