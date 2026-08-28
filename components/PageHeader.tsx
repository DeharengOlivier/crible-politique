import Link from 'next/link';

// The header every secondary page carries: a way home on the left, the page
// name in the middle, and a spacer on the right so the name sits centred.
//
// It was written out eight times, identically apart from the title and the
// sticky flag. The eighth copy is how a change like the 44 pixel tap target
// gets applied to seven pages and missed on one.

interface PageHeaderProps {
    title: string;
    // The test and comparison pages keep their header visible while scrolling,
    // because the way out matters most mid-questionnaire.
    sticky?: boolean;
}

export default function PageHeader({ title, sticky = false }: PageHeaderProps) {
    return (
        <header
            className={`border-b border-[var(--color-border-light)] bg-white/95 ${
                sticky ? 'sticky top-0 z-10 backdrop-blur-sm' : ''
            }`}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <Link
                    href="/"
                    className="inline-flex min-h-[44px] items-center text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)] sm:min-h-0"
                >
                    ← Le Crible Politique
                </Link>
                <h1 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)]">
                    {title}
                </h1>
                <div className="w-24" />
            </div>
        </header>
    );
}
