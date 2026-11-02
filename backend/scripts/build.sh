#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Installing dependencies..."
npm ci

echo "Building Amdox ERP backend..."
npm run build

echo "Build completed successfully."
