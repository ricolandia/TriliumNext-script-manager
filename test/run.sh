#!/usr/bin/env bash
# Roda todos os smoke tests. Uso: bash test/run.sh
set -e
cd "$(dirname "$0")/.."

echo "== node --check (sintaxe) =="
node --check trilium-plugin-manager-v4.js

echo
echo "== registry-smoke =="
node test/registry-smoke.js

echo
echo "== manager-logic-smoke =="
node test/manager-logic-smoke.js

echo
echo "Tudo verde."
