#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Amdox ERP database seeding"

if [[ -f "scripts/seed.ts" ]]; then
    npx tsx scripts/seed.ts
elif [[ -f "src/scripts/seed.ts" ]]; then
    npx tsx src/scripts/seed.ts
else
    echo "No seed implementation configured yet."
    exit 1
fi

echo "Database seeding completed."
