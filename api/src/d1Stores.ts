import type { Country } from "@/types/positions";
import type {
    CountryStats,
    StatsSnapshot,
    StatsStore,
    StoredVault,
    VaultStore,
    VaultWriteOutcome
} from "./ports";

// Thin D1 adapters: SQL in, port types out, no decisions. Integrity lives in
// schema.sql (NOT NULL, CHECK, primary keys); atomicity relies on db.batch(),
// which D1 runs as a single transaction.

/** Bounded write path: one account cannot grind the database all day. */
const DAILY_VAULT_WRITE_CAP = 100;

interface VaultRow {
    ciphertext: string;
    iv: string;
    version: number;
    updated_at: string;
}

export function d1VaultStore(db: D1Database, dailyWriteCap: number = DAILY_VAULT_WRITE_CAP): VaultStore {
    return {
        async read(subHash: string): Promise<StoredVault | null> {
            const row = await db
                .prepare("SELECT ciphertext, iv, version, updated_at FROM vaults WHERE sub_hash = ?1")
                .bind(subHash)
                .first<VaultRow>();
            if (row === null) return null;
            return { ciphertext: row.ciphertext, iv: row.iv, version: row.version, updatedAt: row.updated_at };
        },

        // One statement so two concurrent saves cannot both pass an
        // application-level quota check: the WHERE clause is the quota.
        async upsert(subHash, sealed, nowIso): Promise<VaultWriteOutcome> {
            const day = nowIso.slice(0, 10);
            const result = await db
                .prepare(
                    `INSERT INTO vaults (sub_hash, ciphertext, iv, version, created_at, updated_at, write_day, writes_today)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?5, ?6, 1)
                     ON CONFLICT (sub_hash) DO UPDATE SET
                         ciphertext = excluded.ciphertext,
                         iv = excluded.iv,
                         version = excluded.version,
                         updated_at = excluded.updated_at,
                         writes_today = CASE WHEN vaults.write_day = excluded.write_day
                                             THEN vaults.writes_today + 1 ELSE 1 END,
                         write_day = excluded.write_day
                     WHERE vaults.write_day <> excluded.write_day OR vaults.writes_today < ?7`
                )
                .bind(subHash, sealed.ciphertext, sealed.iv, sealed.version, nowIso, day, dailyWriteCap)
                .run();
            return result.meta.changes > 0 ? "stored" : "quota_exceeded";
        },

        async remove(subHash: string): Promise<void> {
            await db.prepare("DELETE FROM vaults WHERE sub_hash = ?1").bind(subHash).run();
        }
    };
}

interface TotalsRow {
    country: string;
    analyses_count: number;
    weight_sum: number;
}

interface LeaderRow {
    country: string;
    party_id: string;
    weight_sum: number;
    times_led: number;
}

export function d1StatsStore(db: D1Database): StatsStore {
    return {
        async recordAnalysis(country, weight, shares): Promise<void> {
            const statements = [
                db.prepare(
                    `INSERT INTO analysis_totals (country, analyses_count, weight_sum) VALUES (?1, 1, ?2)
                     ON CONFLICT (country) DO UPDATE SET
                         analyses_count = analyses_count + 1,
                         weight_sum = weight_sum + excluded.weight_sum`
                ).bind(country, weight)
            ];
            for (const [partyId, share] of shares) {
                statements.push(
                    db.prepare(
                        `INSERT INTO leading_party_weights (country, party_id, weight_sum, times_led)
                         VALUES (?1, ?2, ?3, 1)
                         ON CONFLICT (country, party_id) DO UPDATE SET
                             weight_sum = weight_sum + excluded.weight_sum,
                             times_led = times_led + 1`
                    ).bind(country, partyId, share)
                );
            }
            await db.batch(statements);
        },

        async snapshot(): Promise<StatsSnapshot> {
            const [totals, leaders] = await db.batch([
                db.prepare("SELECT country, analyses_count, weight_sum FROM analysis_totals"),
                db.prepare(
                    `SELECT country, party_id, weight_sum, times_led
                     FROM leading_party_weights ORDER BY weight_sum DESC`
                )
            ]);
            const countries: Record<Country, CountryStats> = {
                FR: { analyses: 0, weightSum: 0, leaders: [] },
                BE: { analyses: 0, weightSum: 0, leaders: [] }
            };
            for (const row of totals.results as unknown as TotalsRow[]) {
                const stats = countries[row.country as Country];
                stats.analyses = row.analyses_count;
                stats.weightSum = row.weight_sum;
            }
            for (const row of leaders.results as unknown as LeaderRow[]) {
                countries[row.country as Country].leaders.push({
                    partyId: row.party_id,
                    weightSum: row.weight_sum,
                    timesLed: row.times_led
                });
            }
            return { totalAnalyses: countries.FR.analyses + countries.BE.analyses, countries };
        }
    };
}
