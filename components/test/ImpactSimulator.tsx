'use client';

import { useMemo, useState } from 'react';
import { calculateAllPartyImpacts, categoryLabels } from '@/data/policies';
import type { ImpactProfile, PolicyImpactResult } from '@/data/policies';

interface Props {
  profile: ImpactProfile;
}

export default function ImpactSimulator({ profile }: Props) {
  const [expandedParty, setExpandedParty] = useState<string | null>(null);

  const results = useMemo(() => calculateAllPartyImpacts(profile), [profile]);

  const maxAbsImpact = useMemo(() => {
    const max = Math.max(...results.map(r => Math.abs(r.totalImpact)), 1);
    return max;
  }, [results]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h2 className="mb-2 text-2xl font-semibold text-gray-900 md:text-3xl">
        Simulateur d&apos;impact personnel
      </h2>
      <p className="mb-2 text-sm text-gray-600">
        Estimation de l&apos;impact mensuel des mesures phares de chaque parti sur votre profil
        (revenus : {profile.monthlyIncome}€/mois, {profile.location}).
      </p>
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
        <p className="text-xs text-amber-700">
          Ces chiffres sont des estimations simplifiées basées sur les programmes publiés et les chiffrages IPP/OFCE.
          Ils ne constituent pas une prédiction exacte. L&apos;impact réel dépend de nombreux facteurs non modélisés.
        </p>
      </div>

      {/* Party comparison bars */}
      <div className="mb-8 space-y-3">
        {results.map(result => (
          <PartyImpactRow
            key={result.partyId}
            result={result}
            maxAbsImpact={maxAbsImpact}
            isExpanded={expandedParty === result.partyId}
            onToggle={() => setExpandedParty(expandedParty === result.partyId ? null : result.partyId)}
          />
        ))}
      </div>

      {/* Sources */}
      <p className="text-xs text-gray-400">
        Sources : IPP (TAXIPP), OFCE, DG Trésor, programmes officiels des partis (2022-2024).
        Méthodologie : impact estimé par mesure sur un profil type correspondant à vos données.
      </p>
    </div>
  );
}

function PartyImpactRow({
  result,
  maxAbsImpact,
  isExpanded,
  onToggle,
}: {
  result: PolicyImpactResult;
  maxAbsImpact: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isPositive = result.totalImpact >= 0;
  const barWidth = Math.min(Math.abs(result.totalImpact) / maxAbsImpact * 100, 100);

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 transition-all">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-4 text-left hover:bg-gray-100"
      >
        <div className="w-40 shrink-0">
          <span className="text-sm font-semibold text-gray-900">{result.partyName}</span>
        </div>

        {/* Bar */}
        <div className="flex flex-1 items-center">
          <div className="relative h-6 w-full rounded-full bg-gray-200">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 h-full w-px bg-gray-400" />
            {/* Bar */}
            <div
              className={`absolute top-0 h-full rounded-full transition-all ${
                isPositive ? 'bg-emerald-500' : 'bg-red-400'
              }`}
              style={{
                width: `${barWidth / 2}%`,
                left: isPositive ? '50%' : undefined,
                right: !isPositive ? '50%' : undefined,
              }}
            />
          </div>
        </div>

        {/* Amount */}
        <div className={`w-28 shrink-0 text-right text-lg font-bold ${
          isPositive ? 'text-emerald-600' : 'text-red-500'
        }`}>
          {isPositive ? '+' : ''}{result.totalImpact}€/mois
        </div>

        {/* Chevron */}
        <svg
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-gray-200 px-4 pb-4 pt-3">
          <div className="space-y-2">
            {result.measures.map((m, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {categoryLabels[m.category]?.label || m.category}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{m.title}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{m.description}</p>
                </div>
                <div className={`ml-4 shrink-0 text-sm font-bold ${
                  m.impact > 0 ? 'text-emerald-600' : m.impact < 0 ? 'text-red-500' : 'text-gray-400'
                }`}>
                  {m.impact > 0 ? '+' : ''}{m.impact}€
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            {result.measures.map(m => m.source).filter((v, i, a) => a.indexOf(v) === i).join(' | ')}
          </p>
        </div>
      )}
    </div>
  );
}
