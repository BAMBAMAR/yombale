#!/bin/bash
# Exécuter après chaque déploiement en production/staging
set -e

echo "=== SMOKE TESTS POST-DÉPLOIEMENT ==="
echo "URL cible: $BASE_URL"

npx playwright test tests/e2e/00-smoke.spec.ts \
  --reporter=list \
  --timeout=30000

echo "=== SMOKE TESTS PASSÉS ==="
