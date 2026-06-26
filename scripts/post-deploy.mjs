# =============================================================================
# CodeDrip — Post-deploy migration hook for Railway
# =============================================================================
# Railway runs this after each deploy to apply database migrations.
# Add as a "Deploy Command" or use in a Procfile/web process.
#
# Usage (manual):  DATABASE_URL=... node scripts/post-deploy.mjs
# =============================================================================

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Minimal .env loader
function loadEnv() {
  const envPath = path.join(root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

loadEnv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Skipping migration.');
  process.exit(0); // Don't fail the deploy if DB isn't configured yet
}

const { Client } = pg;
const files = ['db/001_schema.sql', 'db/002_functions.sql', 'db/006_upgrade_schema.sql'];
const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  console.log('Connected to database.');

  for (const file of files) {
    const filePath = path.join(root, file);
    if (!existsSync(filePath)) {
      console.log(`Skipping ${file} (not found)`);
      continue;
    }
    const sql = readFileSync(filePath, 'utf8');
    process.stdout.write(`Applying ${file} ... `);
    await client.query(sql);
    console.log('done');
  }

  console.log('Post-deploy migration complete.');
} catch (err) {
  console.error('Migration failed:', err.message);
  // Don't fail the deploy — log the error and let the API start.
  // Migrations can be run manually if needed.
  console.error('WARNING: API will start despite migration failure.');
} finally {
  await client.end();
}
