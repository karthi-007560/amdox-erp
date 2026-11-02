#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Amdox ERP database migration"

if [[ -f "scripts/migrate.ts" ]]; then
    npx tsx scripts/migrate.ts
elif [[ -f "src/scripts/migrate.ts" ]]; then
    npx tsx src/scripts/migrate.ts
else
    echo "No migration runner configured."
    echo "MongoDB schema changes are currently managed through Mongoose models."
fi
