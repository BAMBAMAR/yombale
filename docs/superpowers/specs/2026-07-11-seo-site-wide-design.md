# Design — Chantier SEO site-wide « Qualité puis conquête »

**Date** : 11 juillet 2026
**Objectif** : faire décoller nopalou.com dans les résultats Google sur toutes ses catégories (produits, immo, télécom), pas seulement une niche.

## Contexte et diagnostic (audit du 11 juillet 2026)

- **Search Console** : 719 pages découvertes via le sitemap, **4 indexées seulement** (`/`, `/annonces`, `/immo`, `/telecom` — exactement les 4 liens de la barre de navigation). Le rapport « Pourquoi des pages ne sont pas indexées » ne liste que 4 pages bénignes (3 redirections, 1 canonical correcte) : les ~711 autres n'ont **pas encore été crawlées** — problème d'autorité/maillage sur domaine jeune, pas de pénalité qualité.
- **Concurrence** : les requêtes cibles (« climatiseur mobile prix Dakar », « iPhone prix Dakar »…) sont tenues par des sites à pages dédiées exact-match (electomenager-dakar.com, Jumia MLP, Expat-Dakar). Nopalou n'a aucune page dédiée par sous-type/marque.
- **Bugs SEO en prod** : titles dupliqués « … | Nopalou | Nopalou » (le template `%s | Nopalou` de `layout.tsx` s'ajoute à des titles qui contiennent déjà le suffixe), pages budget `/categorie/[slug]/moins-de-[budget]` en mojibake (`TÃ©lÃ©phones`) et orphelines (aucun lien interne, absentes du sitemap), guides absents du sitemap, canonical/JSON-LD manquants sur telecom/guides/boutiques, JSON-LD produit construit sur les offres brutes (prix aberrants inclus) au lieu des offres filtrées affichées.
- **Catalogue mesuré** (API prod, 11/07) : smartphones 3 077, tv-electro 2 715 (dont clim 2 150), informatique 521, mode 112, maison 111, jeux 56, auto-moto 34, **beauté 0**. Immo : location appartement 745, chambre 482, studio 142 ; vente terrain 125, appartement 96 ; maison location/vente 53/53. Télécom : Yas 55, Orange 45, Promobile 25, Expresso 19.
- **Document externe intégré** : « Audit SEO & Cahier des Charges » (PDF fourni). Ses exigences SSR/Metadata API/sitemap dynamique/JSON-LD/`<Link>` sont déjà satisfaites par le code ; sont reprises ici : configuration Cloudflare, plan de tests, landing pages immo/télécom, abandon des requêtes de marque (« Jumia … »). Sa proposition de silos d'URL à la racine (`/telephones/...`) est **écartée** : on garde la structure `/categorie/[slug]/...` déjà soumise à Google pour éviter des chaînes de redirections sur un site en cours d'indexation. Son point « Auto Minify Cloudflare » est obsolète (fonctionnalité retirée par Cloudflare en août 2024 ; Next.js minifie déjà).
- Déjà corrigé pendant l'audit (commit `52125bd`) : l'ID Google Analytics pointait vers une propriété inexistante (`G-3KGE1YBMVJ` → `G-GD7365PKTS`).

## Approche retenue : « Qualité d'abord, en 2 vagues »

Créer des landing pages sans corriger les signaux de qualité n'aurait aucun effet (Google ignore déjà 711 URLs). Vague 1 = débloquer l'indexation ; vague 2 = conquérir les mots-clés. Les deux vagues font partie du même chantier, dans cet ordre.

## Vague 1 — Débloquer l'indexation

### 1.1 Correctifs techniques
- **Titles dupliqués** : auditer toutes les pages ; retirer le « | Nopalou » des titles de page (le template de `frontend-next/src/app/layout.tsx` l'ajoute déjà).
- **Mojibake** : réécrire toutes les chaînes corrompues de `frontend-next/src/app/categorie/[slug]/moins-de-[budget]/page.tsx` (CATEGORIES, generateMetadata, H1, contenu visible) en UTF-8 correct.
- **Canonical + meta description manquants** : `/telecom`, les 5 guides (`guide-prix`, `guide-achat`, `guide-immo`, `guide-forfait`, `guide-emploi`), `/boutiques`.
- **JSON-LD produit** : construire les `Offer[]` depuis la liste d'offres **filtrée** affichée (pas la liste brute) dans `frontend-next/src/app/produit/[id]/page.tsx`.

### 1.2 Sitemap assaini (`frontend-next/src/app/sitemap.ts`)
- **Retirer** : `/connexion`, `/inscription`, `/favoris`, `/comparaison`, `/categorie/beaute` (0 produit).
- **Ajouter** : les 5 guides, `/assistant-whatsapp`, les pages budget réparées, les 20 landing pages de la vague 2.
- Plafond produits inchangé (500) tant que l'indexation n'a pas décollé.

### 1.3 Contenu unique par catégorie
Chaque page `/categorie/[slug]` (7 catégories, beauté exclue) reçoit un bloc éditorial **unique** de ~200-300 mots (conseils d'achat au Sénégal, marques populaires, fourchettes de prix réelles du catalogue) + liens vers ses sous-catégories et pages budget. Contenu rédigé en dur dans la config des pages (pas de CMS).

### 1.4 Maillage interne
- Footer global (`layout.tsx`) : liens vers les 7 catégories + sous-catégories phares.
- Bloc SEO homepage : ajouter les liens sous-catégories.
- Pages catégories : liens croisés vers leurs sous-catégories et pages budget.
- Fiche produit : fil d'Ariane cliquable vers catégorie (et sous-catégorie si détectable).

## Vague 2 — 20 landing pages (3 verticales)

Toutes server-rendered, sur le modèle de `/categorie/[slug]` : title/H1 exact-match sur la requête locale, meta description, canonical, bloc éditorial unique (~150-250 mots), listing produits/annonces avec filtres, JSON-LD BreadcrumbList + ItemList. Config codée en dur (pas de CMS). Toutes ajoutées au sitemap et au maillage (1.4).

### Produits — 9 pages, route `/categorie/[slug]/[sousCategorie]`
| Page | Produits | Requêtes visées |
|---|---|---|
| tv-electro/climatiseurs | 2 150 | climatiseur (mobile) prix Dakar, split, inverter |
| smartphones/iphone | 1 766 | iPhone prix Dakar/Sénégal |
| smartphones/samsung | 826 | Samsung Galaxy prix Dakar |
| smartphones/xiaomi-redmi | ~230 | Xiaomi/Redmi prix Sénégal |
| tv-electro/electromenager | 101 | machine à laver, micro-ondes Dakar |
| tv-electro/televiseurs | 90 | TV Samsung/LG prix Dakar, smart TV |
| tv-electro/refrigerateurs | 86 | frigo, congélateur prix Dakar |
| informatique/ordinateurs | ~80 | ordinateur portable prix Dakar |
| smartphones/tecno | 55 | Tecno prix Sénégal |

**Backend** : extension additive de `SOUS_TYPE_MOTS` dans `backend/routes/produits.js` (nouveaux sous-types `iphone`, `samsung`, `xiaomi`, `tecno`, `ordinateurs` avec leurs listes de mots-clés) — aucun impact sur les appels existants. Attention au piège documenté de renumérotation des placeholders SQL si un paramètre est ajouté (ici on n'ajoute pas de paramètre, on étend un dictionnaire).

### Immo — 7 pages, route `/immo/[slugCombo]` (segment statique par page)
location-appartement-dakar (745), location-chambre-dakar (482), location-studio-dakar (142), vente-terrain-dakar (125), vente-appartement-dakar (96), location-maison-dakar (53), vente-maison-dakar (53). L'API `/api/immo` supporte déjà `transaction` + `type_bien` : **zéro changement backend**. Attention à ne pas entrer en collision avec la route existante `/immo/[id]` (UUID) — le routeur doit distinguer les slugs des UUIDs.

### Télécom — 4 pages, route `/telecom/[operateur]`
yas (55), orange (45), promobile (25), expresso (19). L'API supporte déjà `operateur` : zéro changement backend. Requêtes comparatives légitimes (« forfait internet Orange Sénégal ») — pas de cannibalisation de marque au sens du document (contrairement à « Jumia climatiseur », abandonné).

### Catégories maigres
mode, maison, auto-moto, jeux : pas de sous-pages (catalogue trop mince — pages quasi vides contre-productives). Elles bénéficient de 1.3 et 1.4. Beauté : retirée du sitemap (1.2) ; la page reste accessible mais n'est plus poussée à Google.

## Infrastructure (actions manuelles, hors code)
- **Cloudflare** : règle de cache edge pour les pages HTML publiques (TTFB), règle de redirection canonique trailing-slash + www→apex (ou l'inverse selon la config DNS actuelle). À faire par l'utilisateur, instructions fournies à la fin du chantier.
- **Render** : merge sur `main` = déploiement. L'ID GA4 corrigé part avec le premier déploiement.

## Vérification

### En local (avant merge)
- `npx tsc --noEmit` et `npm run build` (frontend-next) : zéro erreur — obligatoire avant de déclarer toute tâche terminée.
- `curl` de chaque nouvelle page : vérifier title (sans doublon « | Nopalou »), H1, canonical, JSON-LD présent, contenu éditorial dans le HTML initial.
- Test « JavaScript désactivé » (du document) : le HTML brut (`curl`) doit contenir produits et prix.

### Après déploiement (actions utilisateur guidées)
- `curl` des pages en prod (title/H1/canonical).
- Search Console : re-soumettre le sitemap ; « Tester l'URL en direct » sur 2-3 landing pages (test 2 du document) ; puis **« Demander une indexation » sur les ~36 pages stratégiques** (7 catégories + 20 landing pages + 5 guides + 4 pages déjà indexées).
- Suivi à 2-6 semaines : évolution « pages indexées » dans Search Console et `site:nopalou.com`. L'indexation d'un domaine jeune prend des semaines — c'est attendu, pas un échec du chantier.

## Hors scope (explicitement)
- CMS admin pour gérer les landing pages (config codée en dur retenue).
- Renommage des URLs en silos racine (`/telephones/...`) proposé par le document externe.
- Acquisition de backlinks / netlinking (levier non technique).
- Sous-pages pour mode/maison/auto-moto/jeux tant que le catalogue est mince.
- Relèvement du plafond de 500 produits du sitemap (à revoir quand l'indexation décolle).
