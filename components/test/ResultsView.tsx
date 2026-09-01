'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnswerRecord, DimensionKey, Respondent } from '@/types/positions';
import { COLLEGE_LABELS, COUNTRY_LABELS } from '@/lib/electoralScope';
import { computeProfile, computePartyMatches } from '@/lib/scoringEngine';
import { MAX_PRIORITY_DIMENSIONS, weightsForPriorities } from '@/lib/priorityWeights';
import { encodeAnswers } from '@/lib/profileCode';
import { encodeBadge } from '@/lib/badgeCode';
import { topPairSeparation } from '@/lib/partySeparation';
import SaveProfileCard from '@/components/profile/SaveProfileCard';
import PartyFightsPanel from './PartyFightsPanel';
import CompassSection from './results/CompassSection';
import DuoInvitationBanner from './results/DuoInvitationBanner';
import FurtherModules from './results/FurtherModules';
import IdentitySection from './results/IdentitySection';
import AnalysisPrecision from './results/AnalysisPrecision';
import LeadingGroupSummary from './results/LeadingGroupSummary';
import PartyRanking from './results/PartyRanking';
import WhatSeparatesTheTopTwo from './results/WhatSeparatesTheTopTwo';
import PriorityPicker from './results/PriorityPicker';
import ShareActions from './results/ShareActions';

// Layered results (progressive disclosure), one component per layer:
// 1. Identity (shareable synthetic profile)
// 2. 7-dimension compass
// 3. Parties, explained statement by statement with sourcing status
// 4. Opt-in modules (moral foundations, euro impact): never forced
// 5. Bridge to the observatory (fact sheets) plus transparency
//
// This file owns what the layers share and nothing else: the answers, the two
// derived readings of them, and the priorities that reweigh the third layer.
// Each layer was inlined here until 2026-08-30, which made a 535-line component
// no section of which could be rendered, or tested, on its own.

interface ResultsViewProps {
    answers: AnswerRecord;
    respondent: Respondent;
    onRestart: () => void;
    /**
     * Continues an unfinished analysis with the statements left to answer.
     *
     * Optional, and its absence is meaningful rather than a default: a profile
     * that arrived in a shared link is someone else's answers, and finishing
     * them would mean answering in their name.
     */
    onContinue?: () => void;
}

export default function ResultsView({ answers, respondent, onRestart, onContinue }: ResultsViewProps) {
    const profile = useMemo(() => computeProfile(answers), [answers]);
    // The reader's fights: dimensions whose statements count double in the
    // displayed ranking (METHODOLOGY.md 3.4). Display-only and session-local;
    // the anonymous stat event was sent unweighted before this screen.
    const [priorities, setPriorities] = useState<DimensionKey[]>([]);
    const matches = useMemo(
        () =>
            computePartyMatches(answers, {
                ...respondent,
                weights:
                    priorities.length > 0
                        ? weightsForPriorities(respondent.country, priorities)
                        : undefined
            }),
        [answers, respondent, priorities]
    );

    // O(statements) over the corpus, recomputed only when the ranking moves.
    const topSeparation = useMemo(
        () => topPairSeparation(matches, answers, respondent.country),
        [matches, answers, respondent.country]
    );

    const togglePriority = (dimension: DimensionKey) =>
        setPriorities((current) =>
            current.includes(dimension)
                ? current.filter((d) => d !== dimension)
                : current.length < MAX_PRIORITY_DIMENSIONS
                  ? [...current, dimension]
                  : current
        );

    const perimeter =
        respondent.college === undefined
            ? COUNTRY_LABELS[respondent.country]
            : `${COUNTRY_LABELS[respondent.country]}, ${COLLEGE_LABELS[respondent.college]}`;

    // Two codes, and the difference between them is the whole privacy design.
    // `code` is the answers, and only ever travels in a fragment. `badge` is
    // the identity, and is the only thing allowed in a path the server sees.
    const code = encodeAnswers(answers, respondent.country);
    const badge = encodeBadge(profile);

    return (
        <div className="mx-auto w-full max-w-3xl space-y-10">
            <DuoInvitationBanner code={code} />

            {/* LAYER 1: IDENTITY */}
            <section className="space-y-5 text-center">
                <IdentitySection profile={profile} />
                <ShareActions code={code} badge={badge} family={profile.syntheticProfile} />
            </section>

            {/* LAYER 2: 7-DIMENSION COMPASS */}
            <CompassSection profile={profile} />

            {/* LAYER 3: PARTIES EXPLAINED */}
            <section>
                <div className="mb-3">
                    <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
                        Proximité avec les partis
                    </h3>
                </div>

                <PriorityPicker priorities={priorities} onToggle={togglePriority} />

                {/* The mirror of the block above: what the parties themselves fight for. */}
                <PartyFightsPanel
                    parties={matches.map((match) => match.party)}
                    priorities={priorities}
                />

                {/* Before any percentage: how much of the corpus this rests
                    on, and the way to make it rest on more. */}
                <AnalysisPrecision
                    answers={answers}
                    country={respondent.country}
                    matches={matches}
                    onContinue={onContinue}
                />

                <LeadingGroupSummary matches={matches} perimeter={perimeter} />

                {/* The percentage cannot be made more clear-cut by a longer
                    analysis: it is a mean, so more statements narrow its
                    interval without widening the gap. What separates the top
                    two is the statements they actually disagree on, and that
                    list is what grows with the complete run. */}
                {topSeparation !== null && <WhatSeparatesTheTopTwo separation={topSeparation} />}

                <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
                    Proximité n&apos;est pas consigne de vote. Dépliez chaque parti pour voir exactement
                    pourquoi, énoncé par énoncé, avec le statut de sourçage de chaque position.
                </p>
                <PartyRanking matches={matches} />
            </section>

            {/* LAYER 4: OPT-IN MODULES */}
            <FurtherModules />

            {/* LAYER 5: BRIDGE TO THE OBSERVATORY + TRANSPARENCY */}
            <section className="rounded-2xl border-2 border-[var(--color-primary)]/15 bg-[var(--color-bg-hero)] p-6 text-center">
                <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)]">
                    Et ces idées, que dit le droit ?
                </h3>
                <p className="mx-auto mt-1 max-w-xl text-sm text-[var(--color-text-secondary)]">
                    Retraite à 60 ans, quotas d&apos;immigration, sortie de l&apos;OTAN, déficit sous 3%...
                    Les mesures phares du débat, examinées norme par norme: ce qui est établi, ce qui est débattu,
                    sans verdict.
                </p>
                <Link
                    href="/crible"
                    className="mt-4 inline-block rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-light)]"
                >
                    Explorer l&apos;observatoire
                </Link>
            </section>

            <SaveProfileCard answers={answers} respondent={respondent} />

            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-[var(--color-text-secondary)]">
                <strong className="text-[var(--color-text)]">Transparence:</strong> le positionnement des
                partis est un codage préliminaire d&apos;après leurs programmes, en attente de double codage
                contradictoire. Le calcul est une formule publique et déterministe: mêmes réponses, même
                résultat, recalculable à la main.{' '}
                <Link href="/methodology" className="font-semibold text-[var(--color-primary)] hover:underline">
                    Méthodologie complète
                </Link>
            </section>

            <div className="text-center">
                <button
                    type="button"
                    onClick={onRestart}
                    className="text-sm text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-primary)] hover:underline"
                >
                    Refaire le test
                </button>
            </div>
        </div>
    );
}
