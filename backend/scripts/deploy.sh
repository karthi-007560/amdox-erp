#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Preparing Amdox ERP backend for deployment..."

npm ci
npm run build

if [[ -n "${RENDER_DEPLOY_HOOK_URL:-}" ]]; then
    echo "Triggering Render deployment..."

    curl --fail --silent --show-error \
        --request POST \
        "$RENDER_DEPLOY_HOOK_URL"

    echo "Render deployment trigger sent."
else
    echo "RENDER_DEPLOY_HOOK_URL is not configured."
    echo "Push your changes to the branch connected to Render to deploy."
fi
