// End-to-end check that an answer code never reaches the server.
//
// The whole privacy design of this application is which part of a URL carries
// what: the badge in the path, the answers in the fragment. That property is
// invisible to a unit test, because it is a property of what the browser
// transmits, not of what a function returns. So this drives a real browser at
// a real production build, through a proxy that records the exact request line
// the server receives, and fails if an answer code appears in one.
//
// It also asserts each page still rendered, because a check that passes
// because nothing loaded would be worse than no check at all.
//
// Run with: npm run check:privacy

import { spawn } from 'node:child_process';
import { createServer, request as httpRequest, get as httpGet } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const APP_PORT = 3311;
const PROXY_PORT = 3312;

// How long the page is allowed to run before Chrome dumps the DOM, and the
// wall clock after which a browser that never exits is killed.
const VIRTUAL_TIME_MS = 10_000;
const RENDER_TIMEOUT_MS = 60_000;
// How long stdout must stay silent before the dump counts as finished.
const QUIET_MS = 2_000;

// A real answer code (28 statements) and the badge code it produces.
const ANSWERS = '1eebaeedadaebedbeadaddbddabeb';
const BADGE = '2046354a';

const CASES = [
    {
        url: `/test#p=${ANSWERS}`,
        expect: 'Votre boussole en 7 dimensions',
        why: 'a "keep my results" link restores the results'
    },
    {
        url: `/compare#a=${ANSWERS}&b=${ANSWERS}`,
        expect: 'de convergence globale',
        why: 'a comparison link compares'
    },
    {
        url: `/p/${BADGE}#p=${ANSWERS}`,
        expect: 'Profil partagé',
        why: 'a shared profile renders from its badge'
    }
];

const CHROME_CANDIDATES = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean);

const children = [];

function run(command, args, options = {}) {
    const child = spawn(command, args, { stdio: 'ignore', ...options });
    children.push(child);
    return child;
}

function shutdown() {
    for (const child of children) child.kill('SIGTERM');
}

async function waitForPort(port, timeoutMs = 60_000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const ok = await new Promise((resolve) => {
            const req = httpGet({ host: '127.0.0.1', port, path: '/' }, (res) => {
                res.resume();
                resolve(true);
            });
            req.on('error', () => resolve(false));
            req.setTimeout(1000, () => {
                req.destroy();
                resolve(false);
            });
        });
        if (ok) return;
        await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`nothing answered on port ${port} within ${timeoutMs}ms`);
}

// A request line is written by whatever made the request, so it reaches this
// script as untrusted text. It is later printed in a failure report, and a
// newline in it would let one request line look like several. Control
// characters are escaped, and the line is capped, before it is ever stored.
function readable(requestLine) {
    return requestLine
        // The line break is the one that matters: it is what would let a
        // single request line print as several, in a report whose whole
        // content is a list of request lines.
        .replace(/[\r\n]/g, ' ')
        // Everything else that could move a cursor or colour a terminal.
        .replace(/[\u0000-\u001f\u007f]/g, (c) => `\\x${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .slice(0, 400);
}

function startLoggingProxy(lines) {
    return new Promise((resolve) => {
        const server = createServer((req, res) => {
            lines.push(readable(`${req.method} ${req.url}`));
            const upstream = httpRequest(
                {
                    host: '127.0.0.1',
                    port: APP_PORT,
                    path: req.url,
                    method: req.method,
                    headers: req.headers
                },
                (upstreamRes) => {
                    res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
                    upstreamRes.pipe(res);
                }
            );
            upstream.on('error', () => {
                res.writeHead(502);
                res.end();
            });
            req.pipe(upstream);
        });
        server.listen(PROXY_PORT, () => resolve(server));
    });
}

function findChrome() {
    const found = CHROME_CANDIDATES.find((path) => existsSync(path));
    if (found) return found;
    throw new Error(
        `no Chrome found in any of:\n  ${CHROME_CANDIDATES.join('\n  ')}\nSet CHROME_PATH to a Chrome or Chromium binary.`
    );
}

// A fresh profile per render: Chrome treats a reused --user-data-dir as an
// existing instance, hands the URL to it and exits without dumping anything.
//
// Spawned from Node rather than from a shell, Chrome writes the whole DOM to
// stdout and then neither exits nor closes the stream, so neither 'close' nor
// 'end' ever arrives. What does arrive is the DOM, in one burst. So the dump
// is taken to be complete once the stream has been quiet for QUIET_MS after
// the last chunk, and the browser is then killed. --virtual-time-budget bounds
// what the page is allowed to do before that burst.
async function renderInChrome(chrome, url) {
    const profileDir = await mkdtemp(join(tmpdir(), 'crible-privacy-'));
    const chunks = [];

    try {
        await new Promise((resolve, reject) => {
            const child = spawn(
                chrome,
                [
                    '--headless',
                    '--disable-gpu',
                    '--no-sandbox',
                    `--user-data-dir=${profileDir}`,
                    `--virtual-time-budget=${VIRTUAL_TIME_MS}`,
                    '--dump-dom',
                    url
                ],
                { stdio: ['ignore', 'pipe', 'ignore'] }
            );

            let quiet;
            const settle = (error) => {
                clearTimeout(quiet);
                clearTimeout(killer);
                child.kill('SIGKILL');
                if (error) reject(error);
                else resolve();
            };

            // A browser that produces nothing at all would hang the whole
            // check, and a check that can hang is a check nobody puts in CI.
            const killer = setTimeout(
                () => settle(new Error(`Chrome produced nothing for ${url} within ${RENDER_TIMEOUT_MS}ms`)),
                RENDER_TIMEOUT_MS
            );

            child.stdout.on('data', (chunk) => {
                chunks.push(chunk);
                clearTimeout(quiet);
                quiet = setTimeout(() => settle(), QUIET_MS);
            });
            child.stdout.on('end', () => settle());
            child.on('close', () => settle());
            child.on('error', (error) => settle(error));
        });
    } finally {
        // Best effort: the browser may still be releasing files in there, and
        // a leftover temp directory is not a failure of this check.
        await rm(profileDir, { recursive: true, force: true }).catch(() => {});
    }

    return Buffer.concat(chunks).toString('utf8');
}

async function main() {
    const chrome = findChrome();

    run('npx', ['next', 'start', '--port', String(APP_PORT)]);
    const lines = [];
    const proxy = await startLoggingProxy(lines);
    await waitForPort(APP_PORT);

    const failures = [];

    for (const testCase of CASES) {
        lines.length = 0;
        const dom = await renderInChrome(
            chrome,
            `http://127.0.0.1:${PROXY_PORT}${testCase.url}`
        );

        const leaked = lines.filter((line) => line.includes(ANSWERS));
        if (leaked.length > 0) {
            failures.push(
                `${testCase.url}\n    the server received the answer code in ${leaked.length} request line(s):\n      ${leaked.join('\n      ')}`
            );
        }
        if (!dom.includes(testCase.expect)) {
            failures.push(
                `${testCase.url}\n    the page did not render (${testCase.why}): "${testCase.expect}" is absent`
            );
        }
        const verdict = leaked.length === 0 && dom.includes(testCase.expect) ? 'ok' : 'FAILED';
        console.log(`${verdict.padEnd(7)} ${testCase.url}`);
    }

    proxy.close();
    shutdown();

    if (failures.length > 0) {
        console.error(`\n${failures.length} failure(s):\n`);
        for (const failure of failures) console.error(`  ${failure}\n`);
        process.exit(1);
    }
    console.log(`\nNo answer code reached the server, on ${CASES.length} share links.`);
    process.exit(0);
}

process.on('SIGINT', () => {
    shutdown();
    process.exit(130);
});

main().catch((error) => {
    console.error(error.message);
    shutdown();
    process.exit(1);
});
