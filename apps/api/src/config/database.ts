// =============================================================================
// PostgreSQL connection pool (single shared instance) + query helpers.
//
// HARD INVARIANT #4: every query in this codebase uses parameterized $1,$2
// placeholders. `query()` forces params through pg's prepared-statement path;
// never build SQL by string concatenation of user input.
//
// PRODUCTION POOL SIZING: the pool must accommodate peak concurrent requests
// without exhausting the Postgres connection limit. Rule of thumb is (2 × CPU
// cores) + active disk spindles — start with 20, monitor, and tune up. The
// `min` keeps a baseline warm so a sudden traffic spike doesn't wait for new
// connections to establish.
// =============================================================================
import pg from 'pg';
import { env } from './env.ts';

const { Pool } = pg;

// pg returns NUMERIC as string by default to avoid float precision loss. We
// keep that behavior and convert to Number explicitly at the edges where a JSON
// number is wanted — money math stays exact in SQL via NUMERIC.
export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.isProduction ? { rejectUnauthorized: false } : false,
  // Connection pool sizing — critical for scaling under concurrent load.
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  min: parseInt(process.env.DB_POOL_MIN || '2', 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  allowExitOnIdle: false,
});

// Log pool errors — a silent pool error can take down the entire API.
pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[DB Pool] Unexpected error on idle client:', err.message);
});

// Log when a new connection is established (useful for pool sizing tuning).
pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[DB Pool] New connection established. Active count:', pool.totalCount);
  }
});

type Params = ReadonlyArray<unknown>;

/** Run a one-off parameterized query on a pooled connection. */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: Params,
) {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params as unknown[]);
    const duration = Date.now() - start;

    if (!env.isProduction && duration > 100) {
      // eslint-disable-next-line no-console
      console.warn(`[DB] Slow query (${duration}ms):`, text.substring(0, 120));
    }

    return result;
  } catch (error: unknown) {
    const pgErr = error as { code?: string; message?: string };
    // Log the failing query and duration for debugging.
    const duration = Date.now() - start;
    // eslint-disable-next-line no-console
    console.error(`[DB] Query error (${duration}ms):`, { code: pgErr.code, message: pgErr.message, query: text.substring(0, 200) });
    throw error;
  }
}

/**
 * Run `fn` inside a single transaction. Commits on success, rolls back on any
 * thrown error, and always releases the client. Used by order creation and the
 * mock payment flow, where multiple writes must be atomic.
 */
export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Health check: verifies the pool can execute a trivial query.
 * Returns true if the database is reachable, false otherwise.
 */
export async function checkDbHealth(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

// DatabaseError class for structured error handling (used by the centralized
// query helper and error middleware).
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly queryText?: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}
