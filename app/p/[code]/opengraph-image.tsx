import { ImageResponse } from 'next/og';
import { decodeAnswers } from '@/lib/profileCode';
import { computeProfile } from '@/lib/scoringEngine';
import { DimensionKey, DIMENSION_LABELS } from '@/types/positions';
import { profileIconNode } from '@/lib/icons';

// Dynamic Open Graph card for a shared profile, generated from the URL
// (no storage). This image is what shows up in previews on
// WhatsApp / X / LinkedIn / iMessage: the heart of the viral loop.
// It shows the identity, never the party affinities.

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Profil politique - Le Crible Politique';

// Subset of dimensions shown on the OG card (space constraint).
const OG_DIMENSIONS: DimensionKey[] = ['economy', 'social', 'environment', 'geopolitics'];

export default async function OgImage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    const answers = decodeAnswers(code);
    const profile = answers ? computeProfile(answers) : null;
    const synth = profile?.syntheticProfile;
    const iconChildren = profileIconNode(synth?.icon).map(([tag, attrs], i) => {
        const Tag = tag as 'path' | 'circle' | 'line' | 'polyline' | 'polygon' | 'rect';
        return <Tag key={i} {...attrs} />;
    });

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                    padding: 48
                }}
            >
                <div style={{ display: 'flex', marginBottom: 16 }}>
                    <svg
                        width={96}
                        height={96}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        {iconChildren}
                    </svg>
                </div>
                <div
                    style={{
                        display: 'flex',
                        fontSize: 58,
                        fontWeight: 700,
                        color: '#f8fafc',
                        textAlign: 'center',
                        maxWidth: 1000
                    }}
                >
                    {synth?.title ?? 'Profil singulier'}
                </div>
                <div
                    style={{
                        display: 'flex',
                        fontSize: 30,
                        fontStyle: 'italic',
                        color: '#94a3b8',
                        marginTop: 12,
                        textAlign: 'center',
                        maxWidth: 950
                    }}
                >
                    &quot;{synth?.tagline ?? 'Un profil qui ne rentre dans aucune case.'}&quot;
                </div>

                <div style={{ display: 'flex', gap: 14, marginTop: 36, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {OG_DIMENSIONS.map((dim) => {
                        const archetype = profile?.dimensionArchetypes[dim];
                        if (!archetype) return null;
                        return (
                            <div
                                key={dim}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    backgroundColor: 'rgba(255,255,255,0.08)',
                                    borderRadius: 14,
                                    padding: '12px 22px'
                                }}
                            >
                                <span style={{ fontSize: 16, color: '#64748b', textTransform: 'uppercase' }}>
                                    {DIMENSION_LABELS[dim]}
                                </span>
                                <span style={{ fontSize: 22, color: '#e2e8f0', fontWeight: 600 }}>
                                    {archetype.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 44 }}>
                    <div
                        style={{
                            display: 'flex',
                            backgroundColor: '#38bdf8',
                            color: '#0f172a',
                            fontSize: 24,
                            fontWeight: 700,
                            borderRadius: 999,
                            padding: '12px 32px'
                        }}
                    >
                        Et toi ? Fais le test - 3 min
                    </div>
                    <div style={{ display: 'flex', fontSize: 24, color: '#94a3b8', fontWeight: 600 }}>
                        Le Crible Politique
                    </div>
                </div>
            </div>
        ),
        size
    );
}
