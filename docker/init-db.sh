#!/usr/bin/env bash
set -euo pipefail

# Usage: ./docker/init-db.sh <psql-connection-string>
# Example: ./docker/init-db.sh "postgresql://promptminder:promptminder@localhost:5432/promptminder"

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <DATABASE_URL>"
  exit 1
fi

DATABASE_URL="$1"

echo "Applying SQL files from ./sql to $DATABASE_URL"

for f in $(ls ./sql/*.sql | sort); do
  echo "-- running $f"
  psql "$DATABASE_URL" -f "$f"
done

echo "Done."
