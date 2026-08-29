import { decryptProfile, encryptProfile } from "@/lib/profileVault";
import type { VaultKey, VaultProfile } from "@/lib/profileVault";
import { fetchVaultKey, loadVault, saveVault } from "@/lib/cribleApi";

// The complete client-side workflow behind "save my profile" and "find my
// profile back".
//
// Signing in with Google is the whole credential. The key that opens the vault
// is derived by the API from the Google account and answered only to a browser
// holding a valid ID token for this application; it is used here and kept
// nowhere. A reader has nothing to write down and nothing to lose, on any
// device, which is the point.
//
// What did not change is the order of operations, and that is the security
// property: the profile is sealed in this browser before anything is sent, and
// the plaintext never appears in a request. The server holds ciphertext, and
// what it can technically do is stated on the privacy page rather than dressed
// up as impossible.

export type VaultSaveOutcome = "saved" | "quota_exceeded" | "unauthorized" | "error";

export async function saveProfileToVault(
    idToken: string,
    profile: VaultProfile
): Promise<VaultSaveOutcome> {
    const key = await fetchVaultKey(idToken);
    if (key.outcome !== "found") return key.outcome;
    const sealed = await encryptProfile(profile, key.key);
    return saveVault(idToken, sealed);
}

export type VaultRestoreResult =
    | { outcome: "restored"; profile: VaultProfile }
    | { outcome: "empty" }
    | { outcome: "unauthorized" }
    | { outcome: "error" };

export async function restoreProfileFromVault(idToken: string): Promise<VaultRestoreResult> {
    const key = await fetchVaultKey(idToken);
    if (key.outcome !== "found") return { outcome: key.outcome };
    const loaded = await loadVault(idToken);
    if (loaded.outcome !== "found") return { outcome: loaded.outcome };
    const profile = await decryptProfile(loaded.sealed, key.key);
    // A wrong key and a tampered blob are indistinguishable by design (AES-GCM)
    // and both end here: the vault did not open, and nothing is guessed.
    return profile === null ? { outcome: "error" } : { outcome: "restored", profile };
}

export type { VaultKey };
