'use client';

import { useState } from 'react';
import { Coins, Scale } from 'lucide-react';
import MftModule from '../MftModule';
import ImpactModule from '../ImpactModule';

// Two optional modules, opened one at a time and never both, because each asks
// its own questions and stacking them turns a result into a second
// questionnaire. Local and anonymous like the rest: nothing either one collects
// leaves the browser.

type ModuleKey = 'mft' | 'impact';

const OFFERS: { key: ModuleKey; title: string; description: string; Icon: typeof Scale }[] = [
    {
        key: 'mft',
        title: 'Mes fondations morales',
        description:
            '12 questions (~2 min) pour visualiser les valeurs qui structurent vos positions (théorie de Haidt).',
        Icon: Scale
    },
    {
        key: 'impact',
        title: "L'impact sur mon portefeuille",
        description:
            'Estimation en €/mois des mesures phares selon votre situation (barèmes publiés, données jamais transmises).',
        Icon: Coins
    }
];

export default function FurtherModules() {
    const [active, setActive] = useState<ModuleKey | null>(null);

    return (
        <section>
            <h3 className="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
                Aller plus loin
            </h3>
            <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
                Deux modules optionnels, locaux et anonymes comme le reste.
            </p>
            {active === null ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    {OFFERS.map(({ key, title, description, Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setActive(key)}
                            className="rounded-xl border-2 border-[var(--color-border-light)] bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40"
                        >
                            <Icon
                                className="h-7 w-7 text-[var(--color-primary)]"
                                strokeWidth={1.5}
                                aria-hidden="true"
                            />
                            <p className="mt-2 font-semibold text-[var(--color-text)]">{title}</p>
                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border-2 border-[var(--color-border-light)] bg-white p-6">
                    {active === 'mft' && <MftModule onClose={() => setActive(null)} />}
                    {active === 'impact' && <ImpactModule onClose={() => setActive(null)} />}
                </div>
            )}
        </section>
    );
}
