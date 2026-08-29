import {
    decryptProfile,
    encryptProfile,
    generateVaultKey,
    keyFromRecoveryCode,
    recoveryCodeFromKey
} from "@/lib/profileVault";
import type { VaultProfile } from "@/lib/profileVault";
import { loadVault, saveVault } from "@/lib/cribleApi";

// The complete client-side workflow behind "save my profile" and "find my
// profile back". The order of operations is the security property: encrypt
// first, upload second, and the key material (the recovery code) never
// appears in any request. Local storage keeps the code as a convenience on
// this device; losing it and the code together means the vault is gone, which
// the UI says out loud instead of pretending otherwise.

export type VaultSaveResult =
    | { outcome: "saved"; recoveryCode: string }
    | { outcome: "quota_exceeded" }
    | { outcome: "unauthorized" }
    | { outcome: "error" };

/**
 * Encrypts and uploads the profile. A caller who already holds a recovery
 * code (same device, or typed back in) keeps its key, so every save stays
 * readable with the one code the user wrote down; without one, a fresh key is
 * generated and its code returned to be shown exactly once.
 */
export async function saveProfileToVault(
    idToken: string,
    profile: VaultProfile,
    knownRecoveryCode: string | null
): Promise<VaultSaveResult> {
    const knownKey = knownRecoveryCode === null ? null : keyFromRecoveryCode(knownRecoveryCode);
    const key = knownKey ?? generateVaultKey();
    const sealed = await encryptProfile(profile, key);
    const outcome = await saveVault(idToken, sealed);
    if (outcome !== "saved") return { outcome };
    return { outcome: "saved", recoveryCode: recoveryCodeFromKey(key) };
}

export type VaultRestoreResult =
    | { outcome: "restored"; profile: VaultProfile }
    | { outcome: "empty" }
    | { outcome: "wrong_code" }
    | { outcome: "unauthorized" }
    | { outcome: "error" };

export async function restoreProfileFromVault(
    idToken: string,
    recoveryCode: string
): Promise<VaultRestoreResult> {
    const key = keyFromRecoveryCode(recoveryCode);
    if (key === null) return { outcome: "wrong_code" };
    const loaded = await loadVault(idToken);
    if (loaded.outcome !== "found") return { outcome: loaded.outcome };
    const profile = await decryptProfile(loaded.sealed, key);
    // Wrong key and tampered blob are indistinguishable by design (GCM), and
    // that is the right message: "this code does not open this vault".
    return profile === null ? { outcome: "wrong_code" } : { outcome: "restored", profile };
}

const RECOVERY_CODE_STORAGE_KEY = "crible_vault_recovery_v1";

export function rememberRecoveryCode(code: string): void {
    try {
        localStorage.setItem(RECOVERY_CODE_STORAGE_KEY, code);
    } catch {
        // storage unavailable: the user still has the code on screen
    }
}

/** Returns the stored code only if it still decodes to a key. */
export function recallRecoveryCode(): string | null {
    try {
        const code = localStorage.getItem(RECOVERY_CODE_STORAGE_KEY);
        if (code === null || keyFromRecoveryCode(code) === null) return null;
        return code;
    } catch {
        return null;
    }
}

export function forgetRecoveryCode(): void {
    try {
        localStorage.removeItem(RECOVERY_CODE_STORAGE_KEY);
    } catch {
        // nothing to forget if storage is unreachable
    }
}
