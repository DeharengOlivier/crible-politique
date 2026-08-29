# Crible API (Cloudflare Worker)

The one server this project has, and the two things it is allowed to hold:

1. **Encrypted profile vaults** (`/vault`): one sealed blob per account. The
   profile is encrypted in the browser (AES-256-GCM) before upload; the key
   never leaves the user (recovery code). The storage key is a peppered
   SHA-256 of the Google subject, so a full database dump reveals neither
   identities nor content. The server cannot read what it stores, which is the
   product's central privacy claim.
2. **Anonymous public statistics** (`/analyses` in, `/stats` out): aggregate
   counters only. No per-event rows, no timestamps, no IP, no identity: one
   `UPDATE ... + 1` per completed analysis, weighted by
   `statements answered / 33` and split equally among tied leading parties
   (see METHODOLOGY.md §8.1).

The site runs fully without this API: every client call is optional,
feature-flagged on `NEXT_PUBLIC_CRIBLE_API_URL` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

## Architecture

- `src/handlers.ts` routing, authorization and validation, dependency-free
  and unit-tested against in-memory fakes (`__tests__/apiHandlers.test.ts`,
  negative-permission battery included).
- `src/contracts.ts` boundary parsing: every request body is parsed into a
  trusted type or refused (400/413/422), never re-checked downstream.
- `src/googleIdentity.ts` verifies Google ID tokens (signature against
  Google's JWKS, audience and issuer pinned) and yields only the peppered
  subject hash. Battery: `__tests__/googleIdentity.test.ts`.
- `src/d1Stores.ts` thin D1 adapters; integrity lives in `schema.sql`
  (NOT NULL, CHECK, primary keys), atomicity in `db.batch()` (one transaction).
- `src/index.ts` Cloudflare entry point: wires bindings to the ports.

Dependencies, each named by its constraint: `jose` (JWT signature
verification is never hand-rolled), `wrangler` (deploy tool),
`@cloudflare/workers-types` (typing for bindings).

## Security model

- Authorization is per resource by construction: the storage key IS the
  verified identity hash; no request field can address another vault.
- Deny by default, fail closed: any verification defect is a 401, any
  unexpected error a bodyless 500.
- Every write is bounded: 32 KB body cap, 24 KB ciphertext cap, 100 vault
  writes per account per day (enforced in the upsert's WHERE clause, so two
  concurrent requests cannot both pass), 12 leaders max per event.
- The stats weight is computed server-side from the statement count; whatever
  weight a client claims is ignored.
- Observability is off in wrangler.toml: tokens and bodies must never be logged.
- Assumed limit: `/analyses` is unauthenticated (statistics must not require
  an account), so a determined actor can skew counters. Validation bounds the
  damage; the public methodology says the counters are indicative.

## Deploy runbook

```bash
npx wrangler login                                  # once per machine
npx wrangler d1 create crible-politique             # once; paste id in wrangler.toml
npx wrangler d1 execute crible-politique --remote --file=api/schema.sql -c api/wrangler.toml
openssl rand -hex 32 | npx wrangler secret put SUB_PEPPER -c api/wrangler.toml
# fill GOOGLE_CLIENT_ID in [vars] once the OAuth client exists
npx wrangler deploy -c api/wrangler.toml
```

Then set `NEXT_PUBLIC_CRIBLE_API_URL` (the worker URL) and
`NEXT_PUBLIC_GOOGLE_CLIENT_ID` in the Vercel project and redeploy the site.

**SUB_PEPPER is set once and never rotated casually**: the pepper is part of
every vault's storage key, so rotating it orphans all vaults (users would
save again; nothing is decryptable by anyone either way).

## Post-deploy checks

```bash
BASE=https://crible-api.<account>.workers.dev
curl -s $BASE/stats | head -c 200                       # 200, aggregates
curl -s -o /dev/null -w '%{http_code}\n' $BASE/vault    # 401 without a token
curl -s -o /dev/null -w '%{http_code}\n' -X POST $BASE/analyses \
  -H 'content-type: application/json' \
  -d '{"country":"FR","positionsTaken":33,"leaders":["fr_unknown"]}'   # 422
```
