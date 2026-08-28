// Erasing everything this application can leave on a device.
//
// The privacy page offers a button for it, and that button is what makes the
// promise on the page true, so it is written here rather than inside the
// component: it is a rule about the product, and it is testable as one. The
// browser surfaces are passed in, so the tests can hand it fakes and check it
// really reaches each of them.

// The narrow slice of each browser API this needs. Declaring it this way keeps
// the function honest about what it touches, and lets a test supply a fake.
interface ClearableStorage {
    clear(): void;
}

interface ClearableCaches {
    keys(): Promise<string[]>;
    delete(name: string): Promise<boolean>;
}

interface UnregisterableWorkers {
    getRegistrations(): Promise<readonly { unregister(): Promise<boolean> }[]>;
}

export interface LocalDataSurfaces {
    local?: ClearableStorage | null;
    session?: ClearableStorage | null;
    cacheStorage?: ClearableCaches | null;
    serviceWorkers?: UnregisterableWorkers | null;
}

export interface ClearReport {
    localStorage: boolean;
    sessionStorage: boolean;
    caches: number;
    serviceWorkers: number;
}

/** The surfaces of the browser the page is running in, when there is one. */
export function browserSurfaces(): LocalDataSurfaces {
    if (typeof window === "undefined") return {};
    return {
        local: window.localStorage,
        session: window.sessionStorage,
        cacheStorage: typeof caches === "undefined" ? null : caches,
        serviceWorkers: navigator.serviceWorker ?? null
    };
}

/**
 * Clears every local surface, and keeps going when one of them refuses.
 *
 * Storage throws rather than returning an error in private modes and with
 * cookies blocked. A refusal on one surface must not leave the others
 * untouched, so each is attempted independently and the report says what
 * actually happened.
 *
 * Both storages are emptied whole, not key by key: any key on this origin
 * belongs to this application, and a list of keys to remove is a list that
 * goes stale the first time someone adds one.
 */
export async function clearLocalData(surfaces: LocalDataSurfaces): Promise<ClearReport> {
    return {
        localStorage: clearStorage(surfaces.local),
        sessionStorage: clearStorage(surfaces.session),
        caches: await deleteCaches(surfaces.cacheStorage),
        // Unregistering last: while the worker is alive it can write to a
        // cache, and a cache emptied before it is gone can be refilled.
        serviceWorkers: await unregisterWorkers(surfaces.serviceWorkers)
    };
}

function clearStorage(storage: ClearableStorage | null | undefined): boolean {
    if (!storage) return false;
    try {
        storage.clear();
        return true;
    } catch {
        return false;
    }
}

async function deleteCaches(cacheStorage: ClearableCaches | null | undefined): Promise<number> {
    if (!cacheStorage) return 0;
    try {
        const names = await cacheStorage.keys();
        const deleted = await Promise.all(names.map((name) => cacheStorage.delete(name)));
        return deleted.filter(Boolean).length;
    } catch {
        return 0;
    }
}

async function unregisterWorkers(
    workers: UnregisterableWorkers | null | undefined
): Promise<number> {
    if (!workers) return 0;
    try {
        const registrations = await workers.getRegistrations();
        const gone = await Promise.all(registrations.map((r) => r.unregister()));
        return gone.filter(Boolean).length;
    } catch {
        return 0;
    }
}
