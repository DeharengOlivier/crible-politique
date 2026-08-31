# Crible API (Cloudflare Worker)

The one server this project has, and the two things it is allowed to hold:

1. **Encrypted profile vaults** (`/vault`): one sealed blob per account. The
   profile is encrypted in the browser (AES-256-GCM) before upload and opened
   in the browser on the way back, so plaintext answers never cross the wire.
   The storage key is a peppered SHA-256 of the Google subject, so a full
   database dump reveals neither identities nor content.

   Stated exactly, because the honest version is the only one worth writing:
   since 2026-08-29 the encryption key is **derived by this Worker** from the
   Google subject and `VAULT_KEY_PEPPER`, and handed to the browser
   (`/vault/key`). It is answered only to a caller holding a valid Google ID
   token for this client, and it is never stored. But whoever holds both the
   database and the server secrets could open a vault. The description this
   file carried until 2026-08-31 ("the key never leaves the user, recovery
   code") described the design that preceded it and had stopped being true.
   `app/confidentialite/page.tsx` says the same thing to readers.
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
- Rate limiting on both cost-bearing paths (since 2026-08-31): 10 anonymous
  analyses per address per minute, 20 authenticated calls per address per
  minute, checked **before** the Google signature is verified, since verifying
  is the expensive part. The bindings live in `wrangler.toml`; without them the
  bounded routes answer **503**, never unbounded traffic.
- Observability is off in wrangler.toml: tokens and bodies must never be logged.
  Detection comes from the `api_outcomes` table instead, which counts refusals
  per day, per route and per outcome, and holds nothing else (see below).
- Assumed limit: `/analyses` is unauthenticated (statistics must not require
  an account), so a determined actor can still skew counters within the rate
  limit. Validation and the limiter bound the damage; the public methodology
  says the counters are indicative.

## Reading what is failing

Workers logs are deliberately off, so this is the operator's view:

```bash
npx wrangler d1 execute crible-politique --remote -c api/wrangler.toml \
  --command "SELECT * FROM api_outcomes ORDER BY day DESC, count DESC LIMIT 50"
```

| outcome | what it means | when to worry |
|---|---|---|
| `server_error` | an unexpected failure, answered as a bodyless 500 | any sustained count: nothing else reports this |
| `unauthorized` | a token was refused | a spike without a matching `rate_limited` |
| `rate_limited` | a caller hit a limit, **or** a limit binding is missing | a flat wall of these right after a deploy means the bindings were dropped |
| `quota_exceeded` | one account passed 100 vault writes in a day | rarely, and it is per account |

There is no alerting on this table, and that is the honest state of it: a
count nobody reads is a count nobody reads. Cloudflare's dashboard can send an
error-rate notification on the Worker with no code, and that is the missing
half. Rows older than 90 days can be deleted; nothing in the table identifies
anyone, so retention is a housekeeping question, not a privacy one.

## Deploy runbook

```bash
npx wrangler login                                  # once per machine
npx wrangler d1 create crible-politique             # once; paste id in wrangler.toml
npx wrangler d1 execute crible-politique --remote --file=api/schema.sql -c api/wrangler.toml
openssl rand -hex 32 | npx wrangler secret put SUB_PEPPER -c api/wrangler.toml
openssl rand -hex 32 | npx wrangler secret put VAULT_KEY_PEPPER -c api/wrangler.toml
# fill GOOGLE_CLIENT_ID in [vars] once the OAuth client exists
npx wrangler deploy -c api/wrangler.toml
```

Then set `NEXT_PUBLIC_CRIBLE_API_URL` (the worker URL) and
`NEXT_PUBLIC_GOOGLE_CLIENT_ID` in the Vercel project and redeploy the site.

Two origin lists have to agree with each other, and neither failure is loud:

- `ALLOWED_ORIGINS` in `wrangler.toml` gates CORS on the API. A missing origin
  shows up as a CORS error in the browser console and a silently dropped
  counter.
- **Authorized JavaScript origins** on the Google OAuth client gate the sign-in
  button. A missing origin renders an *empty* account bubble: the script loads,
  `renderButton` inserts a node, and nothing is painted. The only clue is
  `[GSI_LOGGER]: The given origin is not allowed for the given client ID` in
  the console. Measured 2026-08-31 while validating a build on port 3111, which
  is registered nowhere. Every origin the site is served from needs to be in
  both lists, preview deployments included.

**Both peppers are set once, never rotated casually, and never equal to each
other.** SUB_PEPPER is part of every vault's storage key, so rotating it orphans
all vaults. VAULT_KEY_PEPPER is part of every vault's encryption key, so
rotating it makes stored vaults unreadable. Users would simply save again in
either case.

They must be two distinct random values, and that is a security property rather
than hygiene: the storage key is written to the database, so if the encryption
key came from the same secret, a stolen database would carry everything needed
to open itself. Kept separate, a stolen database opens nothing, even for someone
who knows the Google account id of a target. What an operator holding both the
database and the Worker secrets can do is stated on the site's privacy page
rather than hidden: they could decrypt a saved profile.

## Post-deploy checks

```bash
BASE=https://crible-api.<account>.workers.dev
curl -s $BASE/stats | head -c 200                       # 200, aggregates
curl -s -o /dev/null -w '%{http_code}\n' $BASE/vault    # 401 without a token
curl -s -o /dev/null -w '%{http_code}\n' -X POST $BASE/analyses \
  -H 'content-type: application/json' \
  -d '{"country":"FR","positionsTaken":33,"leaders":["fr_unknown"]}'   # 422
```
