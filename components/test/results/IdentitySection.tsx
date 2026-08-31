'use client';

import { useMemo } from 'react';
import { Compass } from 'lucide-react';
import { DIMENSION_ORDER, type DimensionKey } from '@/types/positions';
import FamilyCompositionCard from '@/components/FamilyCompositionCard';
import { ProfileIcon } from '@/lib/icons';
import type { ProfileResult } from '@/lib/scoringEngine';

// The first thing a respondent reads about themselves: a named family, and
// immediately after it, every other family these answers cannot separate from
// it. The name is the closest fit, never a verdict, and the page says so at the
// exact moment the reader is most likely to take it for one.

export default function IdentitySection({ profile }: { profile: ProfileResult }) {
    const synth = profile.syntheticProfile;
    const fit = profile.syntheticProfileFit;
    // Everything the answers cannot separate from the family shown above them.
    const alsoInGroup = fit.leadingGroup.slice(1);

    // The respondent's dominant current per dimension, to lay against what
    // each family of the leading group expects. O(dimensions), memoized
    // because it is read by every card below.
    const heldCurrents = useMemo(() => {
        const held: Partial<Record<DimensionKey, string>> = {};
        for (const dimension of DIMENSION_ORDER) {
            const archetype = profile.dimensionArchetypes[dimension];
            if (archetype) held[dimension] = archetype.label;
        }
        return held;
    }, [profile]);

    return (
        <>
            <div className="flex justify-center">
                {synth ? (
                    <ProfileIcon name={synth.icon} className="h-16 w-16 text-[var(--color-primary)]" />
                ) : (
                    <Compass
                        className="h-16 w-16 text-[var(--color-primary)]"
                        strokeWidth={1.5}
                        aria-hidden="true"
                    />
                )}
            </div>
            <div>
                <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">
                    {synth?.title ?? 'Profil singulier'}
                </h2>
                <p className="mt-2 text-lg italic text-[var(--color-text-secondary)]">
                    &quot;{synth?.tagline ?? 'Vous empruntez à plusieurs traditions politiques.'}&quot;
                </p>
                {alsoInGroup.length > 0 ? (
                    <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-text-secondary)]">
                        {alsoInGroup.length === 1
                            ? 'Une autre famille colle'
                            : `${alsoInGroup.length} autres familles collent`}{' '}
                        autant à vos réponses:{' '}
                        {alsoInGroup.map((family, index) => (
                            <span key={family.id}>
                                {index > 0 && (index === alsoInGroup.length - 1 ? ' et ' : ', ')}
                                <span className="font-semibold text-[var(--color-text)]">
                                    {family.title}
                                </span>
                            </span>
                        ))}
                        . L&apos;écart entre elles est plus petit que la précision du test: le
                        titre ci-dessus est la plus proche, pas un verdict.
                    </p>
                ) : (
                    synth && (
                        <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-text-secondary)]">
                            Aucune autre famille du répertoire ne colle autant à vos réponses.
                        </p>
                    )
                )}
            </div>
            {synth && (
                <div className="mx-auto grid max-w-2xl gap-3 text-left sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                            Leviers privilégiés
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text)]">{synth.strategy}</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                            Point de vigilance
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text)]">{synth.weakness}</p>
                    </div>
                </div>
            )}

            {/* The bridge between the two layers: what each named family is
                made of, against the currents this respondent holds. */}
            {synth && (
                <div className="mx-auto max-w-2xl space-y-3 text-left">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Une famille est une combinaison nommée de courants sur les 7
                        dimensions de votre boussole (détaillée plus bas). Dépliez chaque
                        famille pour voir ce qu&apos;elle attend, ce que vous tenez, et donc
                        pourquoi elle vous correspond plus ou moins qu&apos;une autre.
                    </p>
                    {fit.leadingGroup.map((family, index) => (
                        <FamilyCompositionCard
                            key={family.id}
                            family={family}
                            held={heldCurrents}
                            score={fit.scores[family.id]}
                            open={index === 0}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
