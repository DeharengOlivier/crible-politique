-- Crible Politique API schema (Cloudflare D1 / SQLite).
-- Apply with: npx wrangler d1 execute crible-politique --remote --file=api/schema.sql -c api/wrangler.toml
--
-- Two families of data, deliberately unlinkable:
--   vaults                 one sealed blob per account hash; the server cannot
--                          read it and the hash names nobody without the pepper.
--   analysis_totals /      anonymous aggregate counters; there is no per-event
--   leading_party_weights  row, no timestamp, no IP, so nothing to correlate.

CREATE TABLE IF NOT EXISTS vaults (
    sub_hash     TEXT PRIMARY KEY CHECK (length(sub_hash) = 64),
    ciphertext   TEXT NOT NULL CHECK (length(ciphertext) BETWEEN 1 AND 24576),
    iv           TEXT NOT NULL CHECK (length(iv) BETWEEN 1 AND 64),
    version      INTEGER NOT NULL CHECK (version BETWEEN 1 AND 100),
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL,
    write_day    TEXT NOT NULL,
    writes_today INTEGER NOT NULL DEFAULT 0 CHECK (writes_today >= 0)
);

CREATE TABLE IF NOT EXISTS analysis_totals (
    country        TEXT PRIMARY KEY CHECK (country IN ('FR', 'BE')),
    analyses_count INTEGER NOT NULL DEFAULT 0 CHECK (analyses_count >= 0),
    weight_sum     REAL NOT NULL DEFAULT 0 CHECK (weight_sum >= 0)
);

CREATE TABLE IF NOT EXISTS leading_party_weights (
    country    TEXT NOT NULL CHECK (country IN ('FR', 'BE')),
    party_id   TEXT NOT NULL CHECK (length(party_id) BETWEEN 1 AND 64),
    weight_sum REAL NOT NULL DEFAULT 0 CHECK (weight_sum >= 0),
    times_led  INTEGER NOT NULL DEFAULT 0 CHECK (times_led >= 0),
    PRIMARY KEY (country, party_id)
);
