// Guards two things a production build can lose without anyone noticing.
//
// First, the routes. This site is almost entirely prerendered, and a page that
// silently stops being emitted, or quietly turns from static into
// server-rendered, is not something any test or type check would see.
//
// Second, the size of the JavaScript every visitor downloads. The performance
// budget assumes a mid-range phone on a slow network, and a budget nobody
// measures is a wish.
//
// Run with: npm run check:build (after npm run build)

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

// Every route the application is expected to serve, and how. "static" is
// prerendered at build time, "dynamic" is rendered per request.
const EXPECTED_ROUTES = {
    '/': 'static',
    '/a-propos': 'static',
    '/compare': 'static',
    '/concepts': 'static',
    '/confidentialite': 'static',
    '/crible': 'static',
    '/crible/[id]': 'static',
    '/embed': 'static',
    '/favicon.ico': 'static',
    '/legal': 'static',
    '/methodology': 'static',
    '/p/[code]': 'dynamic',
    '/p/[code]/opengraph-image': 'dynamic',
    '/partners': 'static',
    '/statistiques': 'static',
    '/test': 'static'
};

// The JavaScript every visitor downloads before anything is interactive,
// gzipped, in kilobytes. Measured at 128 kB when this budget was written, so
// the ceiling leaves real headroom while still catching a library arriving by
// accident. Raise it deliberately, in a commit that says what was added and
// why.
const ENTRY_JS_BUDGET_KB = 160;

async function readManifest() {
    const path = join('.next', 'app-path-routes-manifest.json');
    try {
        return JSON.parse(await readFile(path, 'utf8'));
    } catch {
        throw new Error(`${path} is missing. Run "npm run build" first.`);
    }
}

async function prerenderedRoutes() {
    try {
        const manifest = JSON.parse(
            await readFile(join('.next', 'prerender-manifest.json'), 'utf8')
        );
        return new Set([
            ...Object.keys(manifest.routes ?? {}),
            ...Object.keys(manifest.dynamicRoutes ?? {})
        ]);
    } catch {
        return new Set();
    }
}

// What a first visit costs: the entry chunks every page loads, as they travel
// over the wire. Summing every file in .next/static would count code no single
// visitor ever downloads, and counting them uncompressed would count bytes
// nobody transfers.
async function entryJsGzippedBytes() {
    const manifest = JSON.parse(
        await readFile(join('.next', 'build-manifest.json'), 'utf8')
    );
    const files = new Set([
        ...(manifest.rootMainFiles ?? []),
        ...Object.values(manifest.pages ?? {}).flat()
    ]);

    let total = 0;
    for (const file of files) {
        if (!file.endsWith('.js')) continue;
        total += gzipSync(await readFile(join('.next', file))).length;
    }
    return total;
}

const failures = [];

const manifest = await readManifest();
const built = new Set(Object.values(manifest));
const prerendered = await prerenderedRoutes();

for (const [route, kind] of Object.entries(EXPECTED_ROUTES)) {
    if (!built.has(route)) {
        failures.push(`route ${route} is not in the build at all`);
        continue;
    }
    const isPrerendered = prerendered.has(route) || [...prerendered].some(
        (p) => p !== route && route.includes('[') && p.startsWith(route.split('[')[0])
    );
    if (kind === 'static' && !isPrerendered) {
        failures.push(`route ${route} was prerendered and now is not`);
    }
    if (kind === 'dynamic' && prerendered.has(route)) {
        failures.push(`route ${route} is now prerendered, so it no longer reads its own path`);
    }
}

for (const route of built) {
    if (route.startsWith('/_') || route === '/robots.txt' || route === '/sitemap.xml') continue;
    if (!(route in EXPECTED_ROUTES)) {
        failures.push(`route ${route} is new. Add it to EXPECTED_ROUTES with the kind it should be.`);
    }
}

const kb = Math.round((await entryJsGzippedBytes()) / 1024);
if (kb > ENTRY_JS_BUDGET_KB) {
    failures.push(`entry JavaScript is ${kb} kB gzipped, over the ${ENTRY_JS_BUDGET_KB} kB budget`);
}

console.log(`${Object.keys(EXPECTED_ROUTES).length} routes, as expected`);
console.log(`entry JavaScript: ${kb} kB gzipped, of a ${ENTRY_JS_BUDGET_KB} kB budget`);

if (failures.length > 0) {
    console.error(`\n${failures.length} failure(s):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
}
