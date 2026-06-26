#!/bin/sh
# =============================================================================
# CodeDrip API — Production startup script
# Runs database migrations before starting the server.
# =============================================================================
set -e

# Resolve paths relative to this script (handles both Railway and Docker CWDs).
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Running database migrations..."
node "$PROJECT_ROOT/scripts/post-deploy.mjs" || echo "WARNING: Migration failed, starting server anyway..."

echo "Starting API server..."
exec npx tsx src/server.ts
