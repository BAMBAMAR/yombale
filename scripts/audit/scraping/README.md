# Kit d'audit de la collecte de données

Rapport : `docs/AUDIT-COLLECTE-DONNEES-2026-10-01.md` ; plan : `docs/PLAN-COLLECTE-DONNEES-2026-10-01.md` (ignorés par git). Méthode : `docs/METHODOLOGIE-AUDIT.md`.

Aucun de ces scripts n'effectue de requête réseau : les « faux sites » sont des réponses `axios` simulées dans le processus, la garde réseau de `audit-env.ps1` reste active.

## Préparer une copie de rejeu

```powershell
powershell -File scripts\audit\scraping\prepare-copy.ps1        # recrée nopalou_scrap_audit (copie de nopalou_audit_data), la migre, crée f_unaccent
. scripts\audit\audit-env.ps1
$env:DATABASE_URL = $env:DATABASE_URL -replace '/nopalou_audit$','/nopalou_scrap_audit'; $env:NODE_ENV = 'development'
```

Les rejeux **écrivent** dans la copie : la recréer avant chaque série. `powershell -File scripts\audit\scraping\prepare-copy.ps1 -Drop` la supprime (elle contient des données personnelles).

## Scripts

| Script | Cible | Écrit en base ? | Fiches |
|---|---|---|---|
| `replay-pipeline.js` | pagination, run « ok » sans donnée, `scraping_runs`, variantes, prix, Decathlon | oui (copie) | 172, 173, 174, 176, 179, 182, 183 |
| `replay-immo.js` | pagination immo, erreurs HTTP, CoinAfrique immo, Expat immo, miroir Facebook | oui (copie) | 174, 175, 179, 188, 189 |
| `replay-livraisons.js` | recoupement : idempotence, filtres, offres mortes, dé-stockage | oui (copie) | recoupement §1.1 |
| `price-matrix.js` | six parseurs de prix sur 17 chaînes | non | 187 |
| `measure-dedup.js`, `measure-dedup-identiques.js` | déduplication produits | non (lecture de `nopalou_audit_data`, ou `AUDIT_DATA_DB`) | 181 |
| `parse-task-log.js [log]` | statistiques de `logs/scraper-task.log` | non | 177, 185 |
| `q.js <base> "<sql>"` | requête en lecture seule | non | — |

Les chiffres du rapport portent sur la copie de production du 24/09/2026 (T0), antérieure aux assainissements des 28-29/09.
