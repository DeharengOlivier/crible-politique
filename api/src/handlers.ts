import { analysisWeight, leaderShares } from "@/lib/analysisStatEvent";
import { MAX_BODY_BYTES, parseAnalysisEventBody, parseSealedProfileBody } from "./contracts";
import type { ApiPorts } from "./ports";

// One entry point, three resources:
//   /vault    - the caller's sealed profile; authenticated, owner-only by
//               construction (the storage key IS the verified identity hash).
//   /analyses - anonymous aggregate increments; no authentication, because an
//               identity here would defeat the whole privacy design.
//   /stats    - the public read-only aggregates, CORS-open and cacheable.
// Everything else: 404/405. Any unexpected failure: 500 with an empty body,
// because an error message is a leak.

const STATS_CACHE_SECONDS = 15;

export async function handleApiRequest(request: Request, ports: ApiPorts): Promise<Response> {
    try {
        return await route(request, ports);
    } catch {
        return respond(request, ports, 500);
    }
}

async function route(request: Request, ports: ApiPorts): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (request.method === "OPTIONS") return respond(request, ports, 204);
    if (path === "/stats") {
        if (request.method !== "GET") return respond(request, ports, 405);
        return serveStats(ports);
    }
    if (path === "/analyses") {
        if (request.method !== "POST") return respond(request, ports, 405);
        return recordAnalysis(request, ports);
    }
    if (path === "/vault") return serveVault(request, ports);
    return respond(request, ports, 404);
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

async function serveVault(request: Request, ports: ApiPorts): Promise<Response> {
    const identity = await ports.verifyIdentity(request.headers.get("authorization"));
    if (identity === null) return respond(request, ports, 401);
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
            return respond(request, ports, outcome === "stored" ? 204 : 429);
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
    if (text.length > MAX_BODY_BYTES) return { outcome: "too_large" };
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
