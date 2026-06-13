#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  DB_HOST="${DATABASE_HOST:-localhost}"
  DB_PORT="${DATABASE_PORT:-5432}"
  DB_NAME="${DATABASE_NAME:-cargotrack}"
  DB_USER="${DATABASE_USER:-cargotrack}"
  DB_PASS="${DATABASE_PASSWORD:-cargotrack123}"
  DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
  export DATABASE_URL
  echo "[ai-service] DATABASE_URL constructed (host: ${DB_HOST}:${DB_PORT})"
fi

# AI service does NOT run migrations. Schema is owned by core-service.
echo "[ai-service] Starting compliance agent..."
node dist/index.js
