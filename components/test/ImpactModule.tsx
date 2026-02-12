'use client';

import { useState } from 'react';
import ImpactSimulator from './ImpactSimulator';
import { determineSocialClass } from '@/utils/analysis';
import type { ImpactProfile } from '@/data/policies';
import type { ProfessionType, LocationType } from '@/types';

// Opt-in "Impact on my wallet" module: the ONLY place in the product that
// asks for socio-economic data, after the results, with the reason shown.
// Everything stays local: nothing is transmitted or stored server-side.

interface ImpactModuleProps {
    onClose: () => void;
}

const PROFESSIONS: { value: ProfessionType; label: string }[] = [
    { value: 'employee', label: 'Salarié(e)' },
    { value: 'worker', label: 'Ouvrier / ouvrière' },
    { value: 'manager', label: 'Cadre' },
    { value: 'senior_manager', label: 'Cadre supérieur(e)' },
    { value: 'self_employed', label: 'Indépendant(e)' },
    { value: 'civil_servant', label: 'Fonctionnaire' },
    { value: 'student', label: 'Étudiant(e)' },
    { value: 'retired', label: 'Retraité(e)' },
    { value: 'unemployed', label: 'Sans emploi' }
];

const LOCATIONS: { value: LocationType; label: string }[] = [
    { value: 'metropolis', label: 'Métropole / grande ville' },
    { value: 'medium', label: 'Ville moyenne' },
    { value: 'small', label: 'Petite ville' },
    { value: 'rural', label: 'Rural' }
];

export default function ImpactModule({ onClose }: ImpactModuleProps) {
    const [income, setIncome] = useState('');
    const [patrimony, setPatrimony] = useState('');
    const [profession, setProfession] = useState<ProfessionType>('employee');
    const [location, setLocation] = useState<LocationType>('medium');
    const [profile, setProfile] = useState<ImpactProfile | null>(null);

    if (profile) {
        return (
            <div className="space-y-4">
                <ImpactSimulator profile={profile} />
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setProfile(null)}
                        className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
                    >
                        Modifier ma situation
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
                    >
                        ← Retour aux résultats
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const monthlyIncome = parseInt(income, 10) || 0;
        const pat = parseInt(patrimony, 10) || 0;
        setProfile({
            monthlyIncome,
            patrimony: pat,
            profession,
            location,
            socialClass: determineSocialClass(monthlyIncome, pat, location)
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
                    L&apos;impact sur votre portefeuille
                </h3>
                <button type="button" onClick={onClose} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
                    Annuler
                </button>
            </div>
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                Pourquoi ces questions: estimer l&apos;effet en euros des mesures phares de chaque
                parti sur VOTRE situation (barèmes publiés IPP/OFCE). Ces données restent dans
                votre navigateur, ne sont ni transmises ni stockées, et sont oubliées dès que
                vous fermez l&apos;onglet.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-[var(--color-text)]">
                    Revenu net mensuel (€)
                    <input
                        type="number"
                        required
                        min={0}
                        value={income}
                        onChange={(e) => setIncome(e.target.value)}
                        placeholder="ex: 2100"
                        className="w-full rounded-xl border-2 border-[var(--color-border)] px-4 py-3 text-base focus:border-[var(--color-primary)] focus:outline-none"
                    />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-[var(--color-text)]">
                    Patrimoine brut approximatif (€)
                    <input
                        type="number"
                        min={0}
                        value={patrimony}
                        onChange={(e) => setPatrimony(e.target.value)}
                        placeholder="ex: 15000 (0 si aucun)"
                        className="w-full rounded-xl border-2 border-[var(--color-border)] px-4 py-3 text-base focus:border-[var(--color-primary)] focus:outline-none"
                    />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-[var(--color-text)]">
                    Situation professionnelle
                    <select
                        value={profession}
                        onChange={(e) => setProfession(e.target.value as ProfessionType)}
                        className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-base focus:border-[var(--color-primary)] focus:outline-none"
                    >
                        {PROFESSIONS.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>
                </label>
                <label className="space-y-1.5 text-sm font-medium text-[var(--color-text)]">
                    Type de territoire
                    <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value as LocationType)}
                        className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-base focus:border-[var(--color-primary)] focus:outline-none"
                    >
                        {LOCATIONS.map((l) => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                        ))}
                    </select>
                </label>
            </div>

            <button
                type="submit"
                className="w-full rounded-xl bg-[var(--color-primary)] px-6 py-4 font-semibold text-white transition-colors hover:bg-[var(--color-primary-light)]"
            >
                Estimer l&apos;impact en €/mois
            </button>
        </form>
    );
}
