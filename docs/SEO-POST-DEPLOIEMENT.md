# SEO — Actions après déploiement (à faire par le fondateur)

## 1. Search Console (dès que le déploiement est en ligne)

1. Vérifier 3 pages avec « Inspection de l'URL » → « Tester l'URL en direct » (ex: `/categorie/tv-electro/climatiseurs`) : le HTML rendu doit contenir le H1 et les produits.
2. Sitemaps → re-soumettre `https://nopalou.com/sitemap.xml`.
3. « Demander une indexation » (Inspection de l'URL, bouton après le test) pour chacune des pages stratégiques :
   - Les 7 catégories : `/categorie/{smartphones, informatique, tv-electro, mode, maison, auto-moto, jeux}`
   - Les 9 sous-catégories : `/categorie/tv-electro/{climatiseurs, televiseurs, refrigerateurs, electromenager}`, `/categorie/smartphones/{iphone, samsung, xiaomi-redmi, tecno}`, `/categorie/informatique/ordinateurs`
   - Les 7 pages immo : `/immo/{location-appartement-dakar, location-chambre-dakar, location-studio-dakar, location-maison-dakar, vente-appartement-dakar, vente-maison-dakar, vente-terrain-dakar}`
   - Les 4 pages télécom : `/telecom/{orange, yas, promobile, expresso}`
   - Les 5 guides : `/guide-prix`, `/guide-achat`, `/guide-immo`, `/guide-forfait`, `/guide-emploi`

   (Quota Google ≈ 10-12 demandes/jour : étaler sur 3-4 jours, commencer par les sous-catégories.)

## 1bis. Vérification du statut 404 en prod (2 minutes)

En local (dev), les routes dynamiques renvoient 200 même sur `notFound()` (comportement de streaming Next). Vérifier qu'en prod le statut est bien 404 :

```
curl -s -o /dev/null -w "%{http_code}" https://nopalou.com/categorie/smartphones/nimportequoi-xyz
```

Attendu : `404`. Si `200` : signaler — il faudra désactiver le streaming sur ces pages (sinon Google les classera « soft 404 », sans gravité mais moins propre).

## 2. Cloudflare (si le domaine passe par Cloudflare)

- **Rules → Redirect Rules** : forcer une seule version canonique — rediriger `www.nopalou.com/*` vers `nopalou.com/$1` en 301 (ou l'inverse selon la config DNS actuelle).
- **Caching → Cache Rules** : « Eligible for cache » sur les chemins publics HTML (`/categorie/*`, `/immo/*`, `/telecom/*`, `/guide-*`), Edge TTL 1h — améliore le TTFB mesuré par Google. NE PAS mettre en cache `/compte*`, `/mes-*`, `/admin*`, `/api/*`.
- « Auto Minify » n'existe plus (retiré par Cloudflare en 2024) — rien à faire, Next.js minifie déjà.

## 3. Suivi (2 à 6 semaines)

- Search Console → Indexation → Pages : la courbe « indexées » doit monter au fil des semaines (point de départ au 11 juillet 2026 : 719 découvertes / 4 indexées).
- `site:nopalou.com` sur Google : le nombre de résultats doit croître.
- Performances → Requêtes : surveiller l'apparition de « climatiseur prix dakar », « iphone prix dakar », « location appartement dakar »…
- Rappel : domaine jeune ⇒ l'indexation prend des semaines. Ne pas re-demander l'indexation des mêmes pages plus d'une fois par semaine.
