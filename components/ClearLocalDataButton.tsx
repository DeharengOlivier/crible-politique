'use client';

import { useState } from 'react';
import { Trash2, Check } from 'lucide-react';

// The only interactive island on the Privacy page (which stays a server
// component). Clears the test data kept locally.

export default function ClearLocalDataButton() {
    const [cleared, setCleared] = useState(false);

    return (
        <div className="pt-2">
            <button
                type="button"
                onClick={() => {
                    try {
                        localStorage.removeItem('crible_test_v1');
                        sessionStorage.clear();
                    } catch {
                        // storage unavailable: no effect
                    }
                    setCleared(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-red-400 hover:text-red-600"
            >
                {cleared ? (
                    <>
                        <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} aria-hidden="true" />
                        Données locales effacées
                    </>
                ) : (
                    <>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Effacer mes données locales
                    </>
                )}
            </button>
        </div>
    );
}
