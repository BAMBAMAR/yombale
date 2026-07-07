# Outils de partage et marketing boutique — Chantier 3/3 "Marketing boutique"

## Contexte

Troisième et dernier chantier de la série "faciliter le marketing du client boutique", après le [Chantier 1 — fiabilisation du catalogue Meta/WhatsApp](2026-07-07-catalogue-meta-fiabilisation-design.md) et le [Chantier 2 — simplification de l'ajout de produit](2026-07-07-ajout-produit-simplifie-design.md).

L'audit initial de la boutique avait relevé qu'aucun outil de partage ou de marketing n'existe aujourd'hui pour un vendeur, en dehors d'un simple lien `wa.me` pré-rempli sur la fiche produit (ouverture d'une conversation WhatsApp, pas un partage en Statut/Story). Aucune fonctionnalité Facebook/Instagram Shops, campagne publicitaire Meta, ou partage en Statut/Story n'existe dans le code.

**Clarification de périmètre actée avec l'utilisateur** : ce chantier ne couvre **pas** de publicité payante (pas d'intégration Meta Ads Manager/Marketing API) — il s'agit uniquement d'outils de **partage simple** sur les réseaux (WhatsApp Statut, Instagram Story, copie de lien), au même esprit que ce que l'utilisateur appelait initialement "assistance pub" mais qui désigne en réalité du partage marketing basique, pas de la publicité programmatique.

Deux patterns existent déjà dans le code et sont réutilisés tels quels plutôt que réinventés :
- **Génération de visuel dynamique** via `next/og` `ImageResponse` — déjà utilisé pour des visuels statiques plateforme (`frontend-next/src/app/assets/story-instagram/route.tsx`, format 1080×1920) et pour un visuel **dynamique par entité** avec vraies données (`frontend-next/src/app/produit/[id]/opengraph-image.tsx`, qui fetch le produit via `apiFetch()` et l'injecte dans le visuel).
- **Kit de partage à 3 actions** (copier le lien / partager sur WhatsApp / voir le visuel téléchargeable) — déjà implémenté pour le programme apporteur d'affaires (`frontend-next/src/app/compte/apporteur/ApporteurClient.tsx:83-130`), utilisant `navigator.clipboard.writeText()` et un lien `https://wa.me/?text=${encodeURIComponent(message)}`.

## Design

### 1. Visuel produit prêt-à-partager (format Story uniquement pour ce chantier)

Nouvelle route `frontend-next/src/app/assets/produit-boutique/[id]/story/route.tsx`, construite sur le modèle exact de `produit/[id]/opengraph-image.tsx` (fetch des données réelles) combiné au style visuel de `assets/story-instagram/route.tsx` (format 1080×1920, fond dégradé Nopalou) :
- Fetch le produit (`boutique_produits`) joint à sa boutique (nom, logo) via une requête équivalente à celle déjà utilisée dans `GET /api/boutiques/:id/produits/:prodId`.
- Affiche : photo du produit en grand, nom, prix (et prix barré barré visuellement si présent, réutilisant le même calcul de réduction déjà affiché sur la fiche produit publique), nom + logo de la boutique, et un lien court vers la fiche produit (`nopalou.com/boutiques/{slug}/produits/{id}`).
- Format post carré (1080×1080) explicitement **non construit** dans ce chantier — n'ajouter que si le retour d'usage sur le format story s'avère insuffisant.

### 2. Bouton "Partager" sur chaque produit

Ajouté à deux endroits :
- **Fiche produit publique** (`frontend-next/src/app/boutiques/[id]/produits/[produitId]/page.tsx`, à côté de `ProduitCTA.tsx`) — visible pour toute personne consultant la fiche (le vendeur lui-même, en priorité, mais aussi un visiteur qui voudrait relayer le produit).
- **Carte produit du dashboard vendeur** (`CatalogueProduits` dans `BoutiqueClient.tsx`, la même liste modifiée aux Chantiers 1 et 2) — action rapide pour le vendeur sans quitter son tableau de bord.

Le bouton "📤 Partager" ouvre un petit menu à 3 choix, chacun réutilisant un pattern déjà implémenté dans `ApporteurClient.tsx` :
- **Copier le lien** — `navigator.clipboard.writeText()` vers l'URL de la fiche produit.
- **Partager sur WhatsApp** — lien `https://wa.me/?text=${encodeURIComponent(message)}` avec un message pré-rempli (nom du produit, prix, lien).
- **Télécharger le visuel** — lien vers la route du point 1 (`/assets/produit-boutique/{id}/story`), qui s'ouvre comme une image téléchargeable/enregistrable, prête à poster en Statut WhatsApp ou Story Instagram.

### 3. Kit marketing boutique

Nouvelle section dans le dashboard boutique — soit un nouvel onglet "Marketing" à côté des onglets existants (Catalogue, Commandes, Comptabilité, Analytics, Paramètres dans `BoutiqueClient.tsx`), soit intégré en bas de l'onglet Paramètres — sur le modèle de `/compte/apporteur` (`ApporteurClient.tsx`) :
- Un **visuel de présentation générale de la boutique** (nouvelle route `frontend-next/src/app/assets/boutique/[id]/story/route.tsx`) : logo, nom, catégorie, ville, message "Découvrez {nom} sur Nopalou", format story 1080×1920 identique en style au visuel produit.
- Les mêmes 3 actions de partage (copier le lien / partager sur WhatsApp / télécharger le visuel), appliquées cette fois au lien de la boutique entière (`nopalou.com/boutiques/{slug}`) plutôt qu'à un produit précis — à utiliser une fois pour faire connaître la boutique elle-même, plutôt qu'à chaque nouvel article.

## Hors périmètre (explicitement)

- Format post carré (1080×1080) pour les visuels produit ou boutique — différé, à ajouter seulement sur retour d'usage.
- Toute intégration Meta Ads Manager / Marketing API — pas de campagne publicitaire payante construite ou assistée dans ce chantier ; le mot "publicité" de la demande initiale désigne ici du partage marketing organique, pas de la publicité programmatique.
- Partage automatisé/programmé (ex. republier automatiquement un produit chaque semaine) — le vendeur partage manuellement, à son rythme, à chaque fois qu'il le souhaite.
- Statistiques de performance du partage (nombre de partages, clics générés par visuel) — non couvert ici, pourrait rejoindre une future itération de l'analytics boutique (déjà limité, voir l'audit initial de la fonctionnalité boutique).

## Vérification

- Ouvrir `/assets/produit-boutique/{id}/story` directement dans le navigateur pour un produit réel avec photo, prix et prix barré renseignés → vérifier que l'image générée affiche correctement toutes ces données ainsi que le nom/logo de la boutique.
- Sur la fiche produit publique et dans le dashboard vendeur, cliquer "Partager" → "Copier le lien" → vérifier que le lien copié pointe bien vers la fiche produit correcte.
- Cliquer "Partager sur WhatsApp" → vérifier que la fenêtre WhatsApp Web/app s'ouvre avec un message pré-rempli cohérent (nom, prix, lien).
- Cliquer "Télécharger le visuel" → vérifier que l'image story s'ouvre/se télécharge correctement, dimensionnée pour un Statut WhatsApp ou une Story Instagram (1080×1920).
- Dans le nouvel onglet/section "Marketing" du dashboard boutique, vérifier que le visuel boutique générique reflète bien le logo, nom, catégorie et ville réels de la boutique connectée, et que les 3 actions de partage pointent vers le lien de la boutique (`/boutiques/{slug}`), pas vers un produit.
