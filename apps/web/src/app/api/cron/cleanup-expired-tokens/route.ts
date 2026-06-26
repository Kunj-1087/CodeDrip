// =============================================================================
// Vercel Cron Job — Cleanup Expired Refresh Tokens
//
// Scheduled via vercel.json: "schedule": "0 3 * * *" (runs daily at 3 AM).
// Deletes expired and revoked refresh tokens from the database to prevent the
// refresh_tokens table from growing unbounded.
//
// Security: authenticated via CRON_SECRET in the Authorization header.
//
// NOTE: This Next.js API route creates its own pg.Pool connection to the
// database directly. It does NOT use the Express API's pool — this is a
// standalone cron that runs inside the Vercel serverless environment.
// =============================================================================
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Up to 60 seconds for this function.

export async function GET(req: Request) {
  // Authenticate the cron request.
  const authHeader = req.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken) {
    return Response.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return Response.json(
      { error: 'DATABASE_URL not configured' },
      { status: 500 },
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
    max: 1, // Single connection for the cron job.
    connectionTimeoutMillis: 5000,
  });

  try {
    const result = await pool.query(
      'DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked_at IS NOT NULL',
    );

    return Response.json({
      success: true,
      deletedCount: result.rowCount ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cron] Failed to clean up expired tokens:', message);
    return Response.json(
      { error: 'Cleanup failed', message },
      { status: 500 },
    );
  } finally {
    await pool.end().catch(() => {});
  }
}
