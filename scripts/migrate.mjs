// =============================================================================
// CodeDrip — migration runner
// Applies db/001_schema.sql, db/002_functions.sql, db/003_seed.sql in order.
//
//   node scripts/migrate.mjs              # apply schema + functions (no seed)
//   node scripts/migrate.mjs --seed       # also apply seed data
//   node scripts/migrate.mjs --reset      # DROP & recreate public schema first
//   node scripts/migrate.mjs --reset --seed
//
// Reads DATABASE_URL from the environment, falling back to the root .env file.
// Pure Node + `pg` (a root devDependency) — no ORM, no migration framework.
// =============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Minimal .env loader so this script has zero runtime deps beyond `pg`.
function loadEnv() {
  const envPath = path.join(root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

loadEnv();

const { Client } = pg;
const args = new Set(process.argv.slice(2));
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is not set (checked env and .env).');
  process.exit(1);
}

const files = ['db/001_schema.sql', 'db/002_functions.sql', 'db/006_upgrade_schema.sql'];
if (args.has('--seed')) {
  files.push('db/005_tech_shirts.sql');
}

const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  console.log(`Connected: ${databaseUrl.replace(/:[^:@/]+@/, ':****@')}`);

  if (args.has('--reset')) {
    console.log('Resetting public schema (DROP CASCADE)...');
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  }

  for (const file of files) {
    const sql = readFileSync(path.join(root, file), 'utf8');
    process.stdout.write(`Applying ${file} ... `);
    await client.query(sql);
    console.log('done');
  }

  console.log('Migration complete.');
} catch (err) {
  console.error('\nMigration failed:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
