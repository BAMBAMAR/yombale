# 📋 DIRECTIVES PERMANENTES & RÈGLES D'OR DU PROJET (NOPALOU)

> **Note aux assistants IA (Claude, Antigravity, etc.)** : Ces directives priment sur toute autre instruction et doivent être scrupuleusement appliquées à chaque session.

## 🛑 1. Déploiement & Git
- **Bannissement du Push Automatique** : Ne **JAMAIS** exécuter de `git push` de sa propre initiative. Attendre un ordre explicite de l'utilisateur (ex: *"push"*, *"déploie"*).
- **Documentation Systématique** : Ajouter le compte-rendu précis de chaque livraison/push en tête de `docs/JOURNAL-LIVRAISONS.md` (pas dans `CLAUDE.md`, chargé automatiquement dans chaque session).
- **Authentification Git** : Utiliser le token `GITHUB_TOKEN` présent dans `.env` si nécessaire.

## 🛡️ 2. Les 5 Règles d'Or Anti-IA-Slop & Standard Ingénieur Senior
1. **Bannissement des Béquilles Emojis dans l'UI** : Utiliser exclusivement les icônes vectorielles SVG de `lucide-react` (dimensionnement précis 14px, 16px, 18px). Zéro émoji Unicode (`🏪`, `👑`, `⚡`, `💳`, `📦`) comme icônes d'interface ou de boutons. Linter : `npm run lint:slop`.
2. **Modularisation (< 450 lignes)** : Aucun composant React ne doit dépasser 450 lignes. Extraire les modales, claviers, paniers et listes dans des sous-composants dédiés sous `components/`. Styles globaux dans des fichiers `.css` dédiés.
3. **Respect Strict du Design System Nopalou** : Utiliser exclusivement les tokens CSS déclarés (`--navy: #1C2B4A`, `--accent: #C75B00`, `--price: #0A5C36`, `--bg: #F8F5F0`, `--border: #E8DDD2`) et les classes d'utilité (`.btn-npl`, `.badge-npl`). Interdiction des codes hex ad-hoc inline.
4. **Sécurité Multi-Tenant & Anti-IDOR Obligatoire** : Valider systématiquement l'appartenance boutique avec `requireBoutiqueOwnership` ou `checkBoutiqueAccess` (`backend/middlewares/tenantSecurity.js`). Routes 404 API en JSON strict (`{ success: false, error: 'Not Found' }`).
5. **Ergonomie Épurée, Zéro Redondance & Affichage Lié Uniquement au Contexte** :
   - **Zéro Encombrement de Boutons & Anti-Redondance** : Ne jamais surcharger l'écran avec une multitude de boutons d'actions statiques, lourds ou répétitifs. Pour les actions secondaires ou avancées, privilégier des tiroirs contextuels (Action Sheets légères) ou des menus fluides.
   - **Affichage Strictement Conditionnel au Contexte Réel** : Masquer tout panneau, formulaire ou bouton inutile ou vide (ex: masquer le formulaire/panier tant qu'il y a 0 article dans le panier, n'afficher que les contrôles pertinents pour l'étape en cours).
   - **Pleine Largeur & Zéro Espace Vide à Droite** : Toujours exploiter 100% de la largeur disponible (`width: 100%`). Privilégier les affichages en liste plutôt que des grilles de vignettes étroites qui laissent un vide blanc béant à droite.
   - **Alignement Monoligne Prioritaire** : Verrouiller les contrôles d'en-tête (vocal, scan, onglets) sur une seule et même ligne tant que l'espace le permet via `flexWrap: 'nowrap'` et `flexShrink: 0`.
   - **Lisibilité Produit sans Troncature Sauvage** : Pour les listes d'articles, découper en 2 sous-lignes calibrées (Ligne 1 : Nom complet lisible sans troncature agressive ; Ligne 2 : Prix FCFA et badge stock en `whiteSpace: 'nowrap'`), avec le bouton d'action calé à droite sans tronquer le texte ni déborder de la carte.

---


# 📜 JOURNAL DES VERSIONS & LIVRAISONS

L'historique complet des livraisons (~11 500 lignes, ~1,7 Mo) a été déplacé dans [`docs/JOURNAL-LIVRAISONS.md`](docs/JOURNAL-LIVRAISONS.md) pour ne plus être chargé automatiquement dans le contexte. Le consulter avec `grep` / `head` ciblés, jamais en entier.

### 📌 Dernière Version Locale (27 septembre 2026 - Soir - Correction Affichage Fiche Produit & CTA) :
- **Résolution Débordement Grille & Image Sur-Zoomée (Fiche Produit Boutique)** :
  - **Diagnostic Technique Précis** : Sur les fiches produits comportant un grand nombre de photos (ex: 14 photos sur *"Foulards Prix"*), le conteneur de miniatures (14 x 72px + gaps = 1112px) forçait une largeur minimale intrinsèque (`min-content`) de 1112px. Comme `.boutique-produit-layout` utilisait `grid-template-columns: 1fr 1fr` avec `min-width: auto` par défaut, la colonne de gauche explosait à 1112px. L'image principale (`aspect-ratio: 1/1`) atteignait donc 1110px x 1110px, donnant l'impression d'un zoom démesuré, expulsant la colonne de droite hors écran et masquant complètement les contrôles de commande.
  - **Correction CSS Grid Robuste** : Utilisation de `grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr)` avec `min-width: 0` et `max-width: 100%` sur les enfants directs dans `produit.css` et `globals.css`.
  - **Contrainte & Défilement Tactile Galerie** : Sécurisation de `GalerieClient.tsx` avec `minWidth: 0`, `maxWidth: '100%'` et défilement horizontal fluide swipeable (`overflowX: 'auto'`, `-webkit-overflow-scrolling: touch`) sur le ruban de miniatures.
  - **Repositionnement Prioritaire du CTA d'Achat** : Déplacement de `ProduitCTA` (variantes, "Ajouter au panier", "Commander en direct 1 clic", WhatsApp) immédiatement sous le Prix et le Stock, avant la Description et les Caractéristiques techniques, garantissant que le bouton pour commander est visible immédiatement au-dessus du pli.

### 📌 Version Précédente (27 septembre 2026 - Soir - Audit Communication & Alignement Factuel Marketing/Produit) :
- **Suppression du Forfait Fantôme "Boutique Gratuite"** : Retrait de l'objet orphelin `gratuit` (0 FCFA) dans `TarifsPublicsSelector.tsx` qui redirigeait vers `/creer-boutique?plan=gratuit` où il était forcé vers la formule payante Taf Taf (2 500 F). Aligné sur les 3 forfaits réels backend/wizard : Taf Taf (2 500 F avec 1 mois offert), Pro (5 000 F), Business (10 000 F).
- **Harmonisation Vérité des Prix Caisse POS** : Correction des pages d'acquisition SEO (`logiciel-caisse-senegal/page.tsx` et `pourquoi-nopalou/page.tsx`) qui annonçaient la caisse tactile "dès 2 500 FCFA/mois" alors que la caisse enregistreuse tactile magasin et l'impression tickets relèvent de la formule Boutique Pro (5 000 FCFA/mois avec 30 jours offerts).
- **Synchronisation Tarifs Gestion Locative Immo** : Remplacement de la mention erronée "9 900 FCFA/mois" dans la FAQ de `logiciel-gestion-locative-senegal/page.tsx` par "10 000 FCFA/mois" (Plan Agence Pro) et mention du Plan Agence Essentiel 100% offert, en stricte conformité avec le backend (`backend/routes/abonnements.js`).
- **Correction Promesse Déstockage WhatsApp** : Clarification de la FAQ dans `vendre-sur-whatsapp/page.tsx` : le stock n'est pas décrémenté de manière fantaisiste lors de l'envoi du message WhatsApp, mais dès la validation en 1 clic par le commerçant dans sa caisse Nopalou.
- **Réparation Rupture Parcours Sama Xaalis** : Redirection des CTA de `sama-xaalis/page.tsx` vers `/inscription?role=particulier&redirect=/compte?tab=kalpe` (au lieu de `/compte?tab=kalpe` qui éjectait brutalement le visiteur non connecté sur `/connexion` sans contexte).
- **Nettoyage SEO Anti-Pénalité Google** : Suppression du bloc `aggregateRating` fictif (4.9/5 sur 340 avis) dans `creer-boutique-en-ligne/page.tsx` pour éliminer tout risque de sanction de Google pour données structurées trompeuses.
- **Préservation de l'ADN Comparateur** : Réservation de la refonte de la barre de navigation et des vues d'accueil pour une future branche dédiée, garantissant que l'accueil acheteur reste à 100% focalisé sur le comparateur de prix multi-boutiques sans dénaturation.

### 📌 Version Précédente Déployée (27 septembre 2026 - Soir - Audit & Conversion) :
- **Décompte Intégral du Catalogue (10 570 produits réels)** : Restructuration de la requête mixte par défaut (`backend/routes/produits.js`) en 3 paliers sans élision (`sort_group 1` = top smartphones/électro + boutiques locales, `sort_group 2` = catalogue général ≥ 20k, `sort_group 3` = accessoires < 20k). Les 3 370 produits accessoires sont désormais pleinement comptabilisés dans le catalogue disponible (10 570 articles) sans polluer la vitrine d'accueil.
- **Badge Dynamique Page d'Accueil** : Remplacement du badge statique 6800+ par le décompte exact en temps réel (`{total}+ produits · mis à jour en temps réel`) dans `frontend-next/src/app/page.tsx`.
- **Fermeture de la Fuite de Paywall (Plafond Gratuit Strict)** : Correction de `GET /api/boutiques/mine` et `GET /api/boutiques/:id` (`boutiques-crud.js`) qui retournaient `'pro'` par défaut même pour les essais expirés. Retourne désormais `'gratuit'`, `abo_expire: true` et `jours_restants_essai: 0`, déclenchant les barrières de paiement et incitations à l'abonnement.
- **Réparation du Tunnel Tarifs → Inscription** : Prise en charge des paramètres `plan` et `duree` dans le Server Action `signup` (`auth.ts`) et dans l'inscription WhatsApp OTP (`InscriptionForm.tsx`). Tout visiteur choisissant un plan payant sur `/tarifs-boutique` est désormais redirigé directement vers le paiement d'abonnement au lieu d'être relégué sur un compte gratuit mort.
- **Éradication du Syndrome de la Boutique Fantôme** : Auto-génération de 2 articles de démonstration personnalisables lors de la création d'une boutique (`/taf-taf` et `POST /api/boutiques`) pour que la caisse POS et la vitrine soient opérationnelles immédiatement.
- **Mode POS Express (Vente Libre)** : Création du composant modulaire `PosVenteLibreWidget.tsx` intégré dans `PosCatalogueSection.tsx`, permettant l'encaissement d'un montant direct (avec paliers rapides 1k, 2k, 5k, 10k FCFA) sans aucun produit pré-enregistré.
- **Alerte Immédiate Paiement Manuel & Boucle WhatsApp** : Envoi d'alertes instantanées aux administrateurs lors d'une déclaration de paiement (`backend/routes/paiement.js`) et bouton 1-clic de confirmation WhatsApp pré-rempli dans `ModalPaiementManuel.tsx`.



