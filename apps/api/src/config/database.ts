// =============================================================================
// PostgreSQL connection pool (single shared instance) + query helpers.
//
// HARD INVARIANT #4: every query in this codebase uses parameterized $1,$2
// placeholders. `query()` forces params through pg's prepared-statement path;
// never build SQL by string concatenation of user input.
// =============================================================================
import pg from 'pg';
import { env } from './env.ts';

const { Pool } = pg;

// pg returns NUMERIC as string by default to avoid float precision loss. We
// keep that behavior and convert to Number explicitly at the edges where a JSON
// number is wanted — money math stays exact in SQL via NUMERIC.
export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  // A pooled client errored while idle — log but don't crash the process.
  // eslint-disable-next-line no-console
  console.error('Unexpected idle Postgres client error:', err.message);
});

type Params = ReadonlyArray<unknown>;

/** Run a one-off parameterized query on a pooled connection. */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: Params,
) {
  return pool.query<T>(text, params as unknown[]);
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
