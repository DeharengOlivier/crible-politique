import Link from 'next/link';
import { SYNTHETIC_PROFILES } from '@/data/syntheticProfiles';
import { ProfileIcon } from '@/lib/icons';

// Profile gallery, pre-revealed on the landing page (personality-typology
// product pattern): seeing the profiles BEFORE the test creates the desire
// to discover your own. Each card is a character (icon + name + tagline
// + color), never a judgment.

interface ProfileGalleryProps {
    // Number of profiles displayed (the landing page shows a subset).
    limit?: number;
}

export default function ProfileGallery({ limit }: ProfileGalleryProps) {
    const profiles = limit ? SYNTHETIC_PROFILES.slice(0, limit) : SYNTHETIC_PROFILES;

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {profiles.map((profile) => (
                <div
                    key={profile.id}
                    className="group rounded-2xl border border-[var(--color-border-light)] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                    <div
                        className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                        style={{ backgroundColor: `${profile.accent}14`, color: profile.accent }}
                    >
                        <ProfileIcon name={profile.icon} className="h-6 w-6" />
                    </div>
                    <p className="font-[family-name:var(--font-heading)] text-sm font-bold leading-snug text-[var(--color-text)]">
                        {profile.title}
                    </p>
                    <p className="mt-1 text-xs italic leading-snug text-[var(--color-text-muted)]">
                        {profile.tagline}
                    </p>
                </div>
            ))}
            {limit && limit < SYNTHETIC_PROFILES.length && (
                <Link
                    href="/concepts"
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-transparent p-5 text-center transition-colors hover:border-[var(--color-primary)]/40 hover:bg-white"
                >
                    <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-primary)]">
                        +{SYNTHETIC_PROFILES.length - limit}
                    </span>
                    <span className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                        Voir tous les profils
                    </span>
                </Link>
            )}
        </div>
    );
}
