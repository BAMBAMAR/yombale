# Kit de sondes « protection des données » (audit AUD-132..152)

Méthode : `docs/METHODOLOGIE-AUDIT.md`. Environnement isolé obligatoire (`. scripts\audit\audit-env.ps1`). Les scripts lisent des ports fixes : backend d'audit `:4100`, backend en mode production `:4101` (`NODE_ENV=production`, `SSR_SECRET=audit-ssr`), frontend de production `:3001`. Une IP publique est simulée avec `X-Forwarded-For` (valable car `trust proxy: 1`).

| Script | Rôle | Fiche |
|---|---|---|
| `harvest.js` | volume extractible en une requête (offres, immo, annonces, produits, télécom) | AUD-135 |
| `harvest-aggregates.js` | agrégats : téléphones exposés, champs internes, boutiques | AUD-135/142 |
| `limit-test.js` | limiteurs en mode production (UA, budget, XFF forgé, rafale annonces) | AUD-135/138 |
| `ua-test.js` | filtre d'User-Agent, API partenaire, webhooks | AUD-138 |
| `boutique-fields.js` | champs fiscaux/bancaires de `GET /api/boutiques/:id` (comptes `seed.json`) | AUD-134 |
| `product-keys.js` | clés des réponses produits publiques | AUD-142 |
| `locataire-fixture.sql` / `locataire-cleanup.sql` / `locataire-lookup.js` | portail locataire (données **fictives**, base `nopalou_audit` uniquement) | AUD-132 |
| `ssrf.js` | SSRF et visuels non signés du générateur d'images | AUD-133 |
| `bundle-scan.js` | secrets des `.env` retrouvés dans les bundles (noms seulement) | conformité |
| `errors-webhooks.js` | messages d'erreur, webhooks, routes internes, CORS | AUD-145 |

Les valeurs de départ (avant correctifs) sont dans `docs/AUDIT-PROTECTION-DONNEES-2026-10-01.md` : 12 348 offres/requête, 3 091 annonces immo/requête, 4 633 annonces et 3 808 téléphones aspirables en 93 pages, etc.
