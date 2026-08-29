import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// The whole chrome of the test and results screens: one floating round button
// back to the home page. Requested 2026-08-29 to replace the full top bar,
// which sat over every question for the benefit of a title nobody needed
// mid-questionnaire. Fixed so the way out never scrolls away, 44px target.

export default function FloatingBackButton() {
    return (
        <Link
            href="/"
            aria-label="Retour à l'accueil"
            className="fixed left-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border-light)] bg-white/95 text-[var(--color-text-secondary)] shadow-sm backdrop-blur-sm transition-colors hover:text-[var(--color-primary)]"
        >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </Link>
    );
}
