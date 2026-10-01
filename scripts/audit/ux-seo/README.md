# Sondes UX, contenu et SEO (audit du 01/10/2026)

Lecture seule, contre la pile isolee (`. scripts\audit\audit-env.ps1`, puis `start-stack.ps1 -Frontend -Db nopalou_audit_data`). Pour les statuts HTTP reels, utiliser un build de production (`npx next build` puis `npx next start -p 3001` dans `frontend-next`, avec `BACKEND_URL=http://127.0.0.1:4100`), puis restaurer `frontend-next/public/sw.js` (`git checkout`) : le build le regenere.

| Script | Role |
|---|---|
| `seo-crawl.mjs <paths.json> <sortie.json>` | titre, description, canonical, robots, H1/H2, JSON-LD, liens internes, mots par page |
| `analyse.mjs <sortie.json>` | doublons, longueurs, canonical, H1, og:image |
| `count.mjs <sortie.json>` | decomptes de synthese |
| `hdr.mjs <paths.json>` | statut HTTP, noindex, canonical, cache-control (pages introuvables, variantes d'URL) |
| `og.mjs` | balises og/twitter et comportement par User-Agent |
| `ux-mobile.cjs <pages.json> <sortie.json>` | Chromium 375 et 1366 px : debordement, cibles tactiles, troncatures, emojis, H1, elements en premiere vue, captures ; toute requete hors boucle locale est bloquee |
| `q.cjs <requetes.json>` | requetes SQL de lecture seule (refuse toute base hors port 54329) |
| `static-scan.mjs` | pages sans metadonnees, sans canonical, nombre de H1 (analyse statique) |
| `prices.mjs` | prix et duree d'essai affiches par page marchande |

Les fichiers `*.json` sont des entrees d'exemple (listes d'URL, requetes). Aucune sortie n'est versionnee.
