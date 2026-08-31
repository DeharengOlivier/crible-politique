import { analysisWeight, leaderShares } from "@/lib/analysisStatEvent";
import { MAX_BODY_BYTES, parseAnalysisEventBody, parseSealedProfileBody } from "./contracts";
import type { ApiOutcome, ApiPorts, RateLimitBucket } from "./ports";

// One entry point, three resources:
//   /vault     - the caller's sealed profile; authenticated, owner-only by
//                construction (the storage key IS the verified identity hash).
//   /vault/key - the key that opens it, derived from the caller's Google
//                account and answered only to a browser that proved it owns
//                that account. Answered, never stored.
//   /analyses - anonymous aggregate increments; no authentication, because an
//               identity here would defeat the whole privacy design.
//   /stats    - the public read-only aggregates, CORS-open and cacheable.
// Everything else: 404/405. Any unexpected failure: 500 with an empty body,
// because an error message is a leak.

const STATS_CACHE_SECONDS = 15;

/**
 * The routes this API has, and the only strings its own counters may hold. A
 * 404 carries a caller-controlled path, and writing that into the operator's
 * table would let anyone put anything in it.
 */
const KNOWN_ROUTES = new Set(["/stats", "/analyses", "/vault", "/vault/key"]);
const UNKNOWN_ROUTE = "unknown";

export async function handleApiRequest(request: Request, ports: ApiPorts): Promise<Response> {
    const path = new URL(request.url).pathname;
    try {
        return await route(request, path, ports);
    } catch {
        // An error message is a leak, so the body stays empty and the fact
        // that something failed is kept where only the operator can read it.
        await count(ports, path, "server_error");
        return respond(request, ports, 500);
    }
}

async function route(request: Request, path: string, ports: ApiPorts): Promise<Response> {
    if (request.method === "OPTIONS") return respond(request, ports, 204);
    if (path === "/stats") {
        if (request.method !== "GET") return respond(request, ports, 405);
        // Read-only, cacheable and identical for everyone: the edge cache
        // absorbs a flood, so a limiter here would only add a cost.
        return serveStats(ports);
    }
    if (path === "/analyses") {
        if (request.method !== "POST") return respond(request, ports, 405);
        const bounded = await withinLimit(request, path, ports, "analyses");
        return bounded ?? (await recordAnalysis(request, ports));
    }
    if (path === "/vault/key" || path === "/vault") {
        // Checked before the token is verified, because verifying is the
        // expensive part: a limiter downstream of it protects nothing.
        const bounded = await withinLimit(request, path, ports, "authenticated");
        if (bounded !== null) return bounded;
        return path === "/vault/key" ? serveVaultKey(request, ports) : serveVault(request, ports);
    }
    return respond(request, ports, 404);
}

/**
 * The refusal to answer with, or null to carry on.
 *
 * Fails closed twice over: a deployment with no limiter refuses the operation
 * (503, it is not configured to serve it safely), and a limiter that throws
 * denies (429). The error path must never become the bypass.
 */
async function withinLimit(
    request: Request,
    path: string,
    ports: ApiPorts,
    bucket: RateLimitBucket
): Promise<Response | null> {
    if (ports.rateLimiter === null) {
        await count(ports, path, "rate_limited");
        return respond(request, ports, 503);
    }
    // Cloudflare gives the caller's address per request and this never stores
    // it: it names an ephemeral counter and is gone with the request. A caller
    // without one shares a single bucket rather than escaping the limit.
    const key = request.headers.get("cf-connecting-ip") ?? "unknown";
    let allowed: boolean;
    try {
        allowed = await ports.rateLimiter.allow(bucket, key);
    } catch {
        allowed = false;
    }
    if (allowed) return null;
    await count(ports, path, "rate_limited");
    return respond(request, ports, 429);
}

/**
 * One more day, one more refusal of this kind, on this route. Never throws:
 * observability is not allowed to become a failure mode of its own.
 */
async function count(ports: ApiPorts, path: string, outcome: ApiOutcome): Promise<void> {
    if (ports.outcomes === null) return;
    const route = KNOWN_ROUTES.has(path) ? path : UNKNOWN_ROUTE;
    try {
        await ports.outcomes.record(ports.now().toISOString().slice(0, 10), route, outcome);
    } catch {
        // a counter is never worth an error surface
    }
}

async function serveStats(ports: ApiPorts): Promise<Response> {
    const snapshot = await ports.stats.snapshot();
    return new Response(JSON.stringify({ ...snapshot, generatedAt: ports.now().toISOString() }), {
        status: 200,
        headers: {
            "content-type": "application/json",
            "cache-control": `public, max-age=${STATS_CACHE_SECONDS}`,
            "access-control-allow-origin": "*"
        }
    });
}

async function recordAnalysis(request: Request, ports: ApiPorts): Promise<Response> {
    const body = await readBoundedJson(request);
    if (body.outcome !== "ok") return respond(request, ports, body.outcome === "too_large" ? 413 : 400);
    const event = parseAnalysisEventBody(body.parsed, ports.partyIdsOf);
    if (event === null) return respond(request, ports, 422);
    await ports.stats.recordAnalysis(
        event.country,
        analysisWeight(event.positionsTaken),
        leaderShares(event.leaders, event.positionsTaken)
    );
    return respond(request, ports, 204);
}

/**
 * The vault key of the authenticated caller.
 *
 * Handing out a decryption key looks alarming written down, so the exact rule:
 * the key is a function of the Google subject and a server secret, and this
 * endpoint answers it only to a caller holding a Google ID token minted for
 * this application and signed by Google. That token is the same credential
 * that already authorizes reading the ciphertext, so the endpoint grants
 * nothing the caller could not already obtain, and it lets the plaintext be
 * opened in the browser rather than on the server.
 */
async function serveVaultKey(request: Request, ports: ApiPorts): Promise<Response> {
    if (request.method !== "GET") return respond(request, ports, 405);
    const identity = await ports.verifyIdentity(request.headers.get("authorization"));
    if (identity === null) {
        await count(ports, "/vault/key", "unauthorized");
        return respond(request, ports, 401);
    }
    return respond(request, ports, 200, JSON.stringify({ key: identity.vaultKey }));
}

async function serveVault(request: Request, ports: ApiPorts): Promise<Response> {
    const identity = await ports.verifyIdentity(request.headers.get("authorization"));
    if (identity === null) {
        await count(ports, "/vault", "unauthorized");
        return respond(request, ports, 401);
    }
    switch (request.method) {
        case "GET": {
            const vault = await ports.vaults.read(identity.subHash);
            if (vault === null) return respond(request, ports, 404);
            return respond(request, ports, 200, JSON.stringify(vault));
        }
        case "PUT": {
            const body = await readBoundedJson(request);
            if (body.outcome !== "ok") return respond(request, ports, body.outcome === "too_large" ? 413 : 400);
            const sealed = parseSealedProfileBody(body.parsed);
            if (sealed === null) return respond(request, ports, 422);
            const outcome = await ports.vaults.upsert(identity.subHash, sealed, ports.now().toISOString());
            if (outcome !== "stored") {
                await count(ports, "/vault", "quota_exceeded");
                return respond(request, ports, 429);
            }
            return respond(request, ports, 204);
        }
        case "DELETE": {
            await ports.vaults.remove(identity.subHash);
            return respond(request, ports, 204);
        }
        default:
            return respond(request, ports, 405);
    }
}

type BoundedJson =
    | { outcome: "ok"; parsed: unknown }
    | { outcome: "too_large" }
    | { outcome: "malformed" };

async function readBoundedJson(request: Request): Promise<BoundedJson> {
    const text = await request.text();
    // Bytes, not characters: the budget is a byte budget, and a string of
    // accented or emoji characters weighs up to four times its length. The
    // check said "length" until 2026-08-30 and let a body four times over.
    if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return { outcome: "too_large" };
    try {
        return { outcome: "ok", parsed: JSON.parse(text) };
    } catch {
        return { outcome: "malformed" };
    }
}

function respond(request: Request, ports: ApiPorts, status: number, body?: string): Response {
    const headers = new Headers();
    if (body !== undefined) headers.set("content-type", "application/json");
    const origin = request.headers.get("origin");
    if (origin !== null && ports.allowedOrigins.has(origin)) {
        headers.set("access-control-allow-origin", origin);
        headers.set("access-control-allow-methods", "GET, PUT, POST, DELETE, OPTIONS");
        headers.set("access-control-allow-headers", "authorization, content-type");
        headers.set("access-control-max-age", "86400");
        headers.set("vary", "origin");
    }
    return new Response(body, { status, headers });
}
