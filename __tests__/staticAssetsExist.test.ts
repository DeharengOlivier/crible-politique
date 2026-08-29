import { describe, expect, it } from 'vitest';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

// Found 2026-08-29: app/layout.tsx asked for <link rel="apple-touch-icon"
// href="/icons/icon-192.png"> while public/icons only ever held .svg files, so
// https://crible.deploy-env.net/icons/icon-192.png answered 404 and iOS had no
// home-screen icon at all. Nothing failed: a missing static asset is silent in
// a build, in a type check and in every render test, because the reference is
// a string nobody resolves until a browser asks.
//
// The invariant: every absolute asset path this site points at resolves to a
// file it actually ships. It covers the manifest's icons, the OG image, the
// service worker and anything added later, because it reads the sources rather
// than a list someone must remember to update.

const SOURCE_ROOTS = ['app', 'components', 'lib', 'utils'];
const ASSET_PATTERN = /["'`](\/[A-Za-z0-9._/-]+\.(?:png|jpe?g|webp|svg|ico|json|js|webmanifest|txt|xml))["'`]/g;

// Emitted by the App Router from a file of the same name in app/, so they are
// served without ever appearing under public/.
const APP_ROUTER_FILES: Record<string, string> = {
    '/favicon.ico': 'app/favicon.ico',
    '/icon.svg': 'app/icon.svg',
    '/apple-icon.png': 'app/apple-icon.png'
};

async function sourceFiles(dir: string): Promise<string[]> {
    const found: string[] = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            found.push(...(await sourceFiles(full)));
        } else if (/\.(ts|tsx|js|mjs|json)$/.test(entry.name)) {
            found.push(full);
        }
    }
    return found;
}

async function exists(path: string): Promise<boolean> {
    try {
        await stat(path);
        return true;
    } catch {
        return false;
    }
}

async function isShipped(assetPath: string): Promise<boolean> {
    const appRouterFile = APP_ROUTER_FILES[assetPath];
    if (appRouterFile !== undefined && (await exists(appRouterFile))) return true;
    return exists(join('public', assetPath));
}

async function referencedAssets(files: string[]): Promise<Map<string, string[]>> {
    const references = new Map<string, string[]>();
    for (const file of files) {
        const source = await readFile(file, 'utf8');
        for (const match of source.matchAll(ASSET_PATTERN)) {
            const asset = match[1];
            references.set(asset, [...(references.get(asset) ?? []), file]);
        }
    }
    return references;
}

describe('every static asset the site references is shipped', () => {
    it('holds for every path written in the sources', async () => {
        const files = (await Promise.all(SOURCE_ROOTS.map(sourceFiles))).flat();
        const references = await referencedAssets(files);
        expect(references.size).toBeGreaterThan(0); // the scan itself must not go blind

        const missing: string[] = [];
        for (const [asset, sources] of references) {
            if (!(await isShipped(asset))) missing.push(`${asset} (from ${sources.join(', ')})`);
        }
        expect(missing).toEqual([]);
    });

    it('holds for every icon the web app manifest declares', async () => {
        const manifest = JSON.parse(await readFile('public/manifest.json', 'utf8'));
        const missing: string[] = [];
        for (const icon of manifest.icons) {
            if (!(await isShipped(icon.src))) missing.push(icon.src);
        }
        expect(missing).toEqual([]);
    });

    it('ships the three icon files the browsers and iOS ask for by name', async () => {
        for (const file of Object.values(APP_ROUTER_FILES)) {
            expect(await exists(file), `${file} is missing`).toBe(true);
        }
    });

    it('carries a favicon of its own rather than the framework default', async () => {
        // create-next-app's favicon.ico is 25 931 bytes of Next.js logo. A
        // published product wearing it is a product nobody has looked at.
        const own = await readFile('app/favicon.ico');
        expect(own.byteLength).not.toBe(25931);
        // an .ico is a directory of images: reserved 0, type 1, at least one entry
        expect(own.readUInt16LE(0)).toBe(0);
        expect(own.readUInt16LE(2)).toBe(1);
        expect(own.readUInt16LE(4)).toBeGreaterThanOrEqual(1);
    });
});
