#!/usr/bin/env bash
# Runs `prisma migrate deploy`, retrying when the database is waking up or another build holds
# Prisma's migration lock (P1002). Preview and production builds share the database, so a push
# that triggers both can collide, and a sleeping Neon compute can miss Prisma's 10 s lock timeout.
set -uo pipefail
for attempt in 1 2 3 4; do
  out=$(npx prisma migrate deploy 2>&1); code=$?
  echo "$out"
  [ $code -eq 0 ] && exit 0
  if ! grep -q "P1002\|P1001" <<<"$out" || [ $attempt -eq 4 ]; then exit $code; fi
  echo "Database busy or waking up; retrying in $((attempt * 15)) s (attempt $attempt of 4)…"
  sleep $((attempt * 15))
done
