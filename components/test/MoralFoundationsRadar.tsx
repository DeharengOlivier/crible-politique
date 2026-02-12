'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { MORAL_FOUNDATION_LABELS, type MoralFoundations } from '@/types';

interface Props {
  foundations: MoralFoundations;
}

const FOUNDATION_ORDER: (keyof MoralFoundations)[] = [
  'care', 'fairness', 'liberty', 'loyalty', 'authority', 'sanctity'
];

export default function MoralFoundationsRadar({ foundations }: Props) {
  const data = FOUNDATION_ORDER.map(key => ({
    dimension: MORAL_FOUNDATION_LABELS[key].short,
    fullLabel: MORAL_FOUNDATION_LABELS[key].full,
    description: MORAL_FOUNDATION_LABELS[key].desc,
    value: foundations[key],
    fullMark: 5,
  }));

  return (
    <div>
      <div className="mx-auto" style={{ width: '100%', maxWidth: 420, height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: '#374151', fontSize: 13, fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 5]}
              tickCount={6}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
            />
            <Radar
              name="Vos fondations"
              dataKey="value"
              stroke="#2563eb"
              fill="#2563eb"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as { fullLabel: string; description: string; value: number };
                return (
                  <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
                    <p className="text-sm font-semibold text-gray-900">{d.fullLabel}</p>
                    <p className="text-xs text-gray-500">{d.description}</p>
                    <p className="mt-1 text-lg font-bold text-blue-600">{d.value.toFixed(1)}/5</p>
                  </div>
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend grid below radar */}
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
        {FOUNDATION_ORDER.map(key => {
          const val = foundations[key];
          const info = MORAL_FOUNDATION_LABELS[key];
          return (
            <div key={key} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">{info.short}</span>
                <span className="text-sm font-bold text-blue-600">{val.toFixed(1)}</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                <div
                  className="h-1.5 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${(val / 5) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
