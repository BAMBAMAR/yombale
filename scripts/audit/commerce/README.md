# Sondes du parcours commercial (audit Phase 6, AUD-072 à AUD-086)
Prérequis : `powershell -File scripts\audit\check-pg.ps1` OK puis `powershell -File scripts\audit\start-stack.ps1`.
Ordre : `node scripts/audit/commerce/01-setup.js`, `02-produits.js`, `03` à `06` (chaque script lit/écrit `scripts/audit/.local/commerce-state.json`, ignoré par git).
Virement automatique Wave (AUD-072, Wave simulé) : `. scripts\audit\audit-env.ps1; $env:DATABASE_URL_TEST=$env:DATABASE_URL; npx jest --rootDir scripts/audit/commerce --runInBand --forceExit --testMatch '**/payout.probe.test.js' --testPathIgnorePatterns zzz`
Les sondes créent des comptes et commandes de test dans `nopalou_audit` uniquement. Résultat attendu APRÈS correction : inverse des constats de la Phase 6 (409/400 au lieu de 201, etc.).
