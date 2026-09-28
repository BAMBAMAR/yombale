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

### 📌 Dernière Version Locale (28 septembre 2026 - Système d'Alertes Administratives Multi-Canales WhatsApp 777202086 + Telegram + Email) :
- **Système Centralisé d'Alertes Immédiates Multi-Canales (`backend/services/admin-alerts.js`)** :
  - **Diagnostic** : Les alertes critiques étaient restreintes aux incidents techniques DB/WhatsApp sans prévenir l'administrateur en direct sur son smartphone pour les flux métier vitaux (dépôts Wave/OM, abonnements, signalements de fraude, avis 1-2 étoiles, litiges support).
  - **Moteur Multi-Canal Enrichi** :
    - **Canal WhatsApp officiel** : Envoi direct et garanti 24h/24 vers le numéro de l'administrateur **`+221 77 720 20 86`** (`admin_notification_phone`) via l'API Meta Cloud (`sendWhatsAppNotification` avec template certifié + fallback SMS).
    - **Canal Telegram interactif** : Prise en charge des boutons cliquables *Inline Keyboard* (`reply_markup`) reliant directement à l'écran admin adéquat ou au contact WhatsApp.
    - **Canal Email de traçabilité** vers `admin@nopalou.com`.
    - **Sanitisation PII** : Masquage automatique des numéros, emails et secrets dans les logs et notifications.
    - **Helpers dédiés de haut niveau** : `alerterPaiementManuel`, `alerterAbonnement`, `alerterSignalement`, `alerterAvisNegatif`, `alerterSupportTicket`.
  - **Câblage Intégral des 5 Domaines Opérationnels Majeurs** :
    1. *Paiements Manuels (`backend/routes/paiement.js`)* : Alerte P0 à chaque déclaration Wave / Orange Money avec montant FCFA, expéditeur, référence et lien direct vers le reçu et le bouton de validation.
    2. *Abonnements Marchands (`backend/routes/paiement.js`)* : Alerte lors de toute souscription ou renouvellement de forfait (nom de boutique, formule, montant, date de fin).
    3. *Signalements d'Abus & Sécurité (`backend/routes/support.js`)* : Alerte immédiate sur tout signalement d'abus (produit contrefait, boutique suspecte, escroquerie) avec priorisation P0/P1.
    4. *Modération Avis Clients (`boutiques-produits.js` & `boutiques-crud.js`)* : Détection et alerte automatique pour toute note négative (1 ou 2 étoiles) afin d'intervenir sans délai.
    5. *Helpdesk & Support Client (`backend/routes/support.js`)* : Alerte avec lien direct de prise en charge admin et lien direct WhatsApp vers le client (`https://wa.me/221...`).
  - **Supervision & Test Direct dans le Panel Admin (`SystemAlertsCard.tsx` & `admin-system.js`)** :
    - Nouvelle carte dédiée dans l'écran Santé Système ([`/admin/system`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/frontend-next/src/app/admin/(protected)/system/page.tsx)) récapitulant les canaux actifs et les 5 catégories supervisées.
    - Endpoint `POST /api/admin/system/test-alertes` avec bouton interactif « Tester WhatsApp & Telegram » permettant de valider la bonne réception en direct sur le smartphone.
  - **Contrôle Qualité & Résilience** :
    - Tests unitaires Jest 100% PASS (`tests/unit/admin-alerts-and-health.test.js`).
    - Linter Anti-AI-Slop 100% conforme (icônes `lucide-react`, zéro émoji UI, tokens CSS Nopalou).
    - Validation TypeScript `tsc --noEmit` 100% PASS (0 erreur).

### 📌 Version Précédente (28 septembre 2026 - Gestion Dynamique des Réseaux Sociaux dans Kit Com & Profils Sociaux) :

- **Gestion Dynamique et Actions Complètes sur les Réseaux Sociaux Nopalou (`/admin/communication`)** :
  - **Diagnostic** : L'onglet "Kit Com & Profils Sociaux" affichait jusqu'ici une liste statique codée en dur de profils sociaux (TikTok, WhatsApp Channel, Facebook, etc.) sans possibilité d'ajouter de nouveaux canaux, d'éditer les URL, d'activer/masquer des profils ou d'interagir dynamiquement.
  - **Architecture de Stockage Dynamique (`backend/lib/settingsCache.js` & `backend/routes/settings.js`)** :
    - Clé de configuration globale `nopalou_social_links` enregistrée dans `settingsCache.DEFAULTS` avec parsing JSON résilient.
    - Exposition dans l'endpoint public `GET /api/settings/public` pour réutilisation dans le footer, header et pages publiques, et persistance via `PUT /api/settings` sous authentification admin.
  - **Server Actions Dédiées (`frontend-next/src/app/actions/admin/admin-communication.ts` & `actions/admin.ts`)** :
    - `adminGetSocialLinks()` : Récupération des profils configurés avec repli gracieux sur les valeurs par défaut.
    - `adminSaveSocialLinks(links)` : Enregistrement instantané avec revalidation de cache Next.js (`revalidatePath('/admin/communication')` et `revalidatePath('/')`).
    - `adminResetSocialLinks()` : Réinitialisation aux réglages d'usine officiels Nopalou en un clic.
  - **Gestionnaire Interactif Avancé (`KitComSocialLinksManager.tsx` & `ModalEditSocialLink.tsx`)** :
    - **Actions d'enrichissement & gestion** :
      - *Ajout / Édition complète* : Titre, identifiant/handle, URL complète, description pédagogique, badge officiel, couleur personnalisée.
      - *10 Préréglages en 1-clic* : TikTok, WhatsApp Channel, Instagram, Facebook, X (Twitter), YouTube, LinkedIn, Telegram, Threads, WhatsApp Support.
      - *Statut Actif / Masqué* : Masquer temporairement un réseau sans supprimer ses paramètres.
      - *Réordonnancement fluide* : Flèches haut/bas pour réorganiser la priorité d'affichage des cartes.
      - *Actions rapides de diffusion* : Copie directe de l'URL, copie du texte d'invitation formaté pour partage WhatsApp/SMS, ouverture directe dans un nouvel onglet avec `rel="noopener noreferrer"`.
      - *Suppression sécurisée* avec confirmation préalable et réinitialisation d'usine disponible.
    - **Interface & Anti-IA-Slop** :
      - Composants modulaires (< 400 lignes), zéro émoji d'interface (icônes `lucide-react` calibrées 12-16px), respect strict des tokens CSS Nopalou.
      - Validation TypeScript `tsc --noEmit` 100% PASS.

### 📌 Version Précédente (28 septembre 2026 - Modération Produits Admin Enrichie & Communication Marchand Pédagogique) :

- **Supervision & Modération Complète du Catalogue Marchand (`/admin/produits`)** :
  - **Diagnostic** : L'interface d'administration disposait uniquement d'un commutateur binaire masquant/activant le produit (`en_stock`) sans possibilité d'indiquer la raison du rejet au commerçant, sans historique ni canaux de communication intégrés.
  - **Modération & Suspension avec Motifs Pédagogiques** :
    - Modale de modération administrative (`ModalModererProduit.tsx`) avec sélection rapide de motifs fréquents (*Photos floues ou non conformes*, *Prix manifestement erroné ou abusif*, *Description incomplète ou trompeuse*, *Rupture de stock prolongée*, *Contrefaçon présumée*, *Non-respect des CGU*) ou saisie libre de motif personnalisé.
    - Saisie d'instructions complémentaires spécifiques et prévisualisation instantanée du message envoyé au commerçant.
    - Levée de suspension et réactivation en 1 clic avec message de félicitations/validation.
  - **Communication Directe Multi-Canale avec le Marchand** :
    - Notification automatique par **WhatsApp** (`sendWhatsAppNotification`) et **Email** stylisé Nopalou (`envoyerEmail`) à chaque suspension ou réactivation.
    - Génération côté serveur d'un lien **WhatsApp direct 1-clic** (`https://wa.me/221...`) pré-rempli pour ouvrir une conversation instantanée depuis l'ordinateur ou le mobile du modérateur.
    - Modale dédiée de messagerie instantanée (`ModalMessageMarchand.tsx`) pour échanger avec le commerçant sans désactiver le produit (modèles de messages rapides : vérification stock, amélioration photo, précision tarifaire).
  - **Fiche d'Inspection Produit 360° & Édition Rapide** :
    - Panneau d'inspection détaillée (`ModalDetailProduit.tsx`) : galerie complète de photos, variantes, stocks, coordonnées complètes de la boutique et du propriétaire, historique des logs de modération.
    - Modale d'édition rapide (`ModalEditionRapideProduit.tsx`) pour corriger immédiatement le titre, prix, prix barré, stock ou catégorie.
    - Modale de suppression sécurisée (`ModalSupprimerProduit.tsx`) avec motif d'audit et notification marchand.
  - **Transparence Côté Marchand (`CatalogueProductCard.tsx`)** :
    - Affichage d'un badge d'alerte visible dans l'espace marchand : *"Modération : [Motif]"* avec raccourci immédiat pour corriger et republier l'article sans incompréhension.
  - **Persistance Base de Données (`backend/migrate-inline.js`)** :
    - Colonnes `statut_moderation VARCHAR(30) DEFAULT 'actif'`, `motif_moderation TEXT`, `modere_le TIMESTAMPTZ`, `modere_par VARCHAR(150)` ajoutées à `boutique_produits` avec index de performance `idx_bp_statut_moderation`.
    - Traçabilité totale des décisions dans `admin_audit_logs`.
  - **Validation & Anti-IA-Slop** :
    - Zéro émoji dans l'interface UI (icônes vectorielles `lucide-react` uniquement), respect strict des tokens CSS Nopalou, respect du plafond de taille modulaire (< 450 lignes).
    - Validation `node --check` backend et build Next.js 14 en production 100% PASS.

### 📌 Version Précédente (28 septembre 2026 - Nuit - Filtrage Photos Accueil & Assainissement Données de Test) :
- **Masquage Strict des Produits Sans Photo sur la Page Accueil** :
  - **Diagnostic** : Des articles sans image ou avec des vignettes cassées polluaient les grilles de comparaison et de recherche d'accueil.
  - **Correction Backend** (`backend/routes/produits.js`) :
    - Dans `baseScraped` : ajout du prédicat `AND p.image_url IS NOT NULL AND TRIM(p.image_url) != '' AND p.image_url NOT ILIKE '%placeholder%'`.
    - Dans `baseBoutique` : ajout du prédicat `AND p.images IS NOT NULL AND array_length(p.images, 1) > 0 AND p.images[1] IS NOT NULL AND TRIM(p.images[1]) != '' AND p.images[1] NOT ILIKE '%placeholder%'`.
    - Dans `/instantanee` (Typeahead) : vérification de la présence d'images valides sur les produits retournés.
  - **Correction Frontend** (`frontend-next/src/app/page.tsx` & `ProduitsListe.tsx`) :
    - Double validation `isValidPhoto` appliquée sur le rendu initial SSR, les rechargements et la pagination client (`voirPlus`).
- **Verrouillage & Masquage des Produits de Boutiques Inactives** :
  - Condition `b.actif = true AND p.en_stock = true` verrouillée sur toutes les requêtes du catalogue et de l'auto-complétion.
- **Désactivation Intégrale des Boutiques, Produits & Annonces de Test** :
  - **Boutiques** : 22 boutiques de test (`actif = false`) désactivées en base (boutiques d'audit générées et compte admin BAMBA `dieteltouba@gmail.com`). 70 boutiques réelles et vérifiées restent actives.
  - **Produits Marchands** : 71 produits rattachés aux boutiques inactives ou portant des mentions de test désactivés (`en_stock = false`).
  - **Annonces** : Annonces associées à des comptes de test désactivées (`actif = false`), annonces réelles d'utilisateurs préservées.
  - **Cache** : Invalidation globale du cache Redis/mémoire (`prod:*`).
- **Validation** : 100% PASS sur le banc de test automatisé (0 produit sans photo, 0 boutique inactive exposée).

### 📌 Version Précédente (28 septembre 2026 - Nuit - Audit Transversal Conversion & Corrections Opérationnelles Validées) :
- **Déblocage Immédiat de la Création de Boutique Standard (`ERR-COM-01` / P0)** :
  - **Diagnostic** : Le middleware `requireEmailVerifie` sur `POST /api/boutiques` bloquait avec HTTP 403 tout commerçant inscrit par e-mail n'ayant pas validé son lien avant de créer sa boutique.
  - **Correction** : Aligné sur la route `taf-taf` en levant le blocage e-mail sur `POST /api/boutiques` pour autoriser la création de la boutique d'essai immédiate.
- **Initialisation Automatique de `caisse_token` sur Taf-Taf & Standard (`ERR-TECH-02` / P1)** :
  - **Diagnostic** : `POST /api/boutiques/taf-taf` et `POST /` omettaient la colonne `caisse_token`, laissant le jeton à `NULL` et provoquant une 404 lors de l'accès au terminal autonome de caisse `/api/boutiques/caisse-terminal/:token`.
  - **Correction** : Génération systématique d'un jeton cryptographique (`crypto.randomBytes(24).toString('hex')`) à l'insertion et renvoi dans la charge utile de réponse ; backfill exécuté en base sur les boutiques existantes.
- **Garde-Fou d'Intégrité Téléphonique Marchand (`ERR-TECH-07` / P3)** :
  - **Diagnostic** : Le formulaire standard autorisait la création d'une boutique sans téléphone, risquant de créer une vitrine sans contact direct.
  - **Correction** : Obligation d'un numéro de téléphone/WhatsApp direct sur `POST /api/boutiques` (HTTP 400 clair si manquant) avec rétro-synchronisation automatique sur `utilisateurs.telephone`.
- **Conversion des Annonces Immobilières Orphelines vers Chasseur Immo Nopalou (`ERR-COM-03` / P1)** :
  - **Diagnostic** : 2 933 annonces immobilières scrapées (72,5%) n'avaient aucun contact téléphonique direct et affichaient un bouton sortant externe bleu menant chez les concurrents.
  - **Correction** : Implémentation d'une carte Conciergerie Chasseur Immo Nopalou (`BlocAgenceAnnonce.tsx`) avec contact WhatsApp direct (`221777202086`) et capture automatique de lead dans `contacts_immo` (`POST /api/crm-immo/public/lead` avec `type_action: 'chasseur_immo_click'`). Le lien externe sortant (`FicheImmoSidebar.tsx`) a été basculé en lien secondaire discret outline.
- **Traitement & Relance Automatisée des Paniers Abandonnés (`ERR-COM-05` / P2)** :
  - **Diagnostic** : 44 sessions de paniers abandonnés avec téléphones clients dormaient en base (`paniers_abandonnes`) sans relance automatisée.
  - **Correction** : Extension de `backend/services/relance-panier.js` pour extraire et relancer automatiquement par WhatsApp les paniers abandonnés éligibles (> 45 min), sous protection stricte des heures ouvrées (9h-21h GMT).
- **Élimination de l'Erreur 404 sur `/comparateur` & `/comparer` (`ERR-SEO-06` / P2)** :
  - **Diagnostic** : Taper `/comparateur` ou `/comparer` générait une erreur 404 sur le frontend et le backend.
  - **Correction** : Redirection 301 dans `frontend-next/next.config.js`, Route Handler App Router `frontend-next/src/app/comparateur/route.ts` (avec préservation des requêtes `?q=`) et redirection permanente dans `backend/app.js`.

### 📌 Version Précédente (28 septembre 2026 - Nuit - Audit Réel Mobile & Réseau Extrême & Corrections 100% Validées) :
- **Éradication de la Boucle de Hard Reload Premier Visiteur (`RegisterSW.tsx`)** :
  - **Diagnostic** : Quand `currentForce` était `null` (premier arrivant sur le site), l'évaluation `currentForce !== FORCE_VERSION` renvoyait `true`, supprimait tous les caches, désenregistrait le Service Worker et appelait `window.location.reload()`, avortant brutalement les requêtes RSC Next.js en vol (`Failed to fetch RSC payload`).
  - **Correction** : Si `!currentForce`, enregistrement direct de la clé dans le localStorage sans rechargement. Le rechargement sur changement de contrôleur SW n'intervient que si la page était déjà contrôlée au chargement initial.
- **Re-synchronisation & Décrassage du Service Worker (`sw.ts` & `public/sw.js`)** :
  - **Diagnostic** : `public/sw.js` embarquait des hashs de chunks webpack obsolètes d'un ancien build (`NZ7OnmIFp18FU4Dt97-xA`), ce qui faisait échouer le pré-cache Serwist avec des 404, maintenant le SW en état perpétuel d'installation (`installing: true`, `hasController: false`).
  - **Correction** : Filtrage des chunks non-essentiels/admin dans la config Serwist de `sw.ts`, incrément de `CACHE_VERSION = 'v29'`, recompilation avec `npm run build` synchronisant `public/sw.js` sur le build ID actif (`bUafJYZJyczstr4qeq2Mq`).
- **Colmatage de l'Écran Blanc sur URLs Introuvables (`app/[slug]/route.ts`)** :
  - **Diagnostic** : La route dynamique catch-all de racine renvoyait `new NextResponse(null, { status: 404 })` (corps vide de 0 octet), affichant un écran blanc opaque au visiteur en cas de lien brisé.
  - **Correction** : Implémentation de `respond404(request)` renvoyant une page HTML 404 stylisée conforme au Design System Nopalou avec bouton de retour à l'accueil pour les navigateurs, et un JSON strict `{ success: false, error: 'Not Found' }` pour les requêtes API/RSC.
- **Assainissement des Images Scrappées Expirées & Mortes (`sanitizeImg.ts` & `ExternalImg.tsx`)** :
  - **Diagnostic** : Les URLs CDN Facebook/Instagram scrappées avec token hexadécimal expiré (`oe=`) généraient des erreurs HTTP 403 Forbidden dans la console ; un produit présentait une URL kanje.sn morte en 404 (`JBL_GO_5-1.jpg`).
  - **Correction** : Détection et invalidation préventive des signatures `oe=` expirées dans `sanitizeImg.ts` (évite les requêtes réseau vouées à l'échec) ; fallback élégant SVG vectoriel dans `ExternalImg.tsx` sans espace vide ; réparation de l'URL image en base PostgreSQL.
- **Éradication de l'Appel Externe Hardcodé HTTP 504 sur les Vitrines Marchandes (`ABTestVitrineHeader.tsx`)** :
  - **Diagnostic** : Le composant de test A/B appelait en dur l'URL externe `https://api.nopalou.com`, causant un timeout 504 intercepté par le fallback du Service Worker lors des navigations offline ou locales sur les vitrines boutiques (`/boutiques/dievo-style`).
  - **Correction** : Utilisation d'un chemin relatif `/api/boutiques/${boutiqueId}/ab-test` avec gestion d'erreur silencieuse `.catch(() => {})`.
- **Désengorgement du Préchargement Agressif Next.js (`NavbarSearch.tsx`, `boutiques/page.tsx`)** :
  - **Diagnostic** : Des dizaines de liens de filtres, badges et fiches marchandes préchargeaient agressivement les payloads RSC (`prefetch={true}` par défaut), saturant les connexions mobiles lentes (3G) et générant des requêtes annulées.
  - **Correction** : Ajout de `prefetch={false}` sur les tags de recherche dynamique et la liste des commerces.
- **Validation Empirique Intégrale de la Chaîne Réseau, Offline & Métier (0 Anomalie)** :
  - Validation automatisée des 16 scénarios via `scratch/test_real_user_audit.mjs` : TTFB/FCP mobile & desktop ultra-rapides (< 50ms TTFB), 0px de débordement horizontal, 100% des redirections 301/307 conformes, PWA manifest & SW activé contrôlant le scope, résilience 3G lente (7.6s), bandeau offline visible dès la coupure réseau, rechargement F5 offline (200 OK via cache), navigation hors-ligne interceptée avec écran de secours, encaissement POS hors-ligne stocké dans IndexedDB (`nopalou_pos_offline_v6`), et synchronisation serveur vérifiée dans PostgreSQL à la reconnexion avec décrément de stock certifié (-1) et protection anti-doublon d'idempotence.

### 📌 Version Précédente (28 septembre 2026 - Nuit - Remédiation Complète de la Rétention & Parcours Notification-Action Commerçant) :
- **Suppression du Mur de Connexion (Système de Magic Links HMAC)** :
  - **Diagnostic** : 100% des commerçants relancés par WhatsApp arrivaient dans une WebView mobile sans cookies de session et se heurtaient à la barrière `/connexion`, abandonnant instantanément car leur mot de passe avait été généré automatiquement par le bot WhatsApp.
  - **Correction** :
    - `backend/lib/magicAuthToken.js` : Génération et validation de jetons HMAC-SHA256 temporaires (validité 48h, anti-altération timing-safe).
    - `POST /api/auth/magic-verify` dans `backend/routes/auth.js`.
    - Route Handler Next.js `frontend-next/src/app/api/auth/magic-login/route.ts` posant le cookie HTTP-only sécurisé `nopalou_session` et redirigeant sans jamais demander de mot de passe.
    - Injection automatique de ces liens dans tous les crons et services WhatsApp (`cron-relances-marchands.js`, `relance-catalogue.js`, `cron-bilan-journalier.js`).
- **Pack de Démarrage Automatique (Anti-Boutique-Vide & Activation Immédiate du POS)** :
  - **Diagnostic** : 62,4% des boutiques (63 sur 101) avaient 0 produit en base de données. Le marchand ouvrait sa caisse POS, constatait qu'elle était vide, et n'enregistrait aucune vente.
  - **Correction** :
    - `backend/data/starter-catalogues.json` : Catalogues types adaptés aux commerces dakarois par catégorie (`alimentation`, `mode`, `cosmetique`, `electronique`, `divers`) avec prix réels du marché et unités de vente.
    - `backend/services/starter-catalogues.js` (`injecterStarterPack`) : Détection et injection automatique de 4 à 5 articles populaires lors de la création d'une boutique sur le Web (`boutiques-crud.js`) ou via le bot WhatsApp (`whatsapp-chatbot.js`).
    - Endpoint sécurisé `POST /api/boutiques/:id/starter-pack` dans `boutiques-integrations.js` avec vérification anti-IDOR.
    - Bouton 1-clic d'activation du pack dans `frontend-next/src/app/boutique/CatalogueProduits.tsx` lorsque le catalogue est vide.
- **Portail Public de Paiement de Dette 1-Clic Wave & Orange Money (`/payer-credit/[token]`)** :
  - **Diagnostic** : Les rappels de carnet de crédit renvoyaient vers l'accueil de la boutique avec pour seule consigne de se déplacer physiquement au magasin, rendant le taux de recouvrement digital nul.
  - **Correction** :
    - `backend/lib/creditPaymentToken.js` : Jeton HMAC autonome identifiant de façon étanche le client débiteur et sa boutique.
    - `backend/routes/public-credit.js` : API publique (`GET /:token`, `POST /:token/initier-wave`, `POST /:token/confirmer`) imputant les règlements sur `caisse_credit_historique` et décrémentant le solde `caisse_clients_credits.solde`.
    - Alertes instantanées WhatsApp envoyées au marchand lors de chaque encaissement et reçu digital remis au débiteur.
    - Page publique Next.js `frontend-next/src/app/payer-credit/[token]/page.tsx` et `PayerCreditClient.tsx` (< 380 lignes, 0 émoji UI, strict Lucide icons, Design System Nopalou).
    - Intégration du lien direct de règlement dans `backend/services/cron-relances-carnet.js`.
- **Centre de Contrôle des Notifications & Bouclier Anti-Harcèlement** :
  - Migration colonnes PostgreSQL dans `boutiques` (`notif_bilan_caisse`, `notif_heure_bilan`, `notif_relance_dettes`, `notif_panier_abandonne`, `notif_marketing_astuces`, `relances_suspendues`, `nb_relances_sans_reponse`).
  - Gating horaire strict (aucun message entre 20h30 et 09h00 GMT Dakar), plafond d'une relance max par jour, suspension automatique après 3 messages sans réponse.
  - Gestionnaire de commandes STOP et START dans `backend/services/whatsapp-chatbot.js` mettant à jour immédiatement `relances_suspendues` pour les boutiques du commerçant.
  - Interface marchande dédiée `frontend-next/src/app/boutique/ParametresNotifications.tsx` avec sélection de l'heure du bilan, commutateurs par canal et bouton d'arrêt d'urgence WhatsApp.
- **Bilan Journalier de Caisse du Soir Automatisé** :
  - Création de `backend/services/cron-bilan-journalier.js` calculant chaque soir les ventes effectives (Wave, Espèces, OM) et les mouvements de crédit pour les marchands actifs, avec lien d'accès direct POS.
- **Optimisation des Tâches Fantômes & CTA Paniers** :
  - Réduction de la cadence de `verifier_alertes_prix` de 15 minutes à 1 fois par jour à 08h00 dans `scraper.js`.
  - Intégration du lien direct Wave de finalisation dans `relance-panier.js`.
- **Validation Complète par Suite de Tests E2E** :
  - `scratch/test_retention_corrections_e2e.js` : Validation 100% PASS de la chaîne Magic Link, injection catalogue, paiement créance et bilan de caisse.

### 📌 Version Précédente (27 septembre 2026 - Nuit - Colmatage Paywall POS & Moteur de Conversion des Essais Gratuits) :
- **Colmatage Intégral des Fuites de Paywall POS & Caisse Enregistreuse** :
  - **Diagnostic** : La route `GET /api/boutiques/caisse-terminal/:token` et le hook client `useCaisseData.ts` possédaient un fallback forcé `plan || 'pro'`, attribuant automatiquement les droits Pro à tout appareil tactile ouvrant la caisse, y compris des mois après l'expiration de l'essai gratuit. De plus, `POST /:id/pos-vente` n'effectuait aucune vérification d'abonnement actif, permettant des encaissements illimités ad vitam æternam sans payer.
  - **Correction Backend (`boutiques-pos.js`)** :
    - `verifierAbonnementCaisse(boutiqueId)` vérifie désormais rigoureusement `a.statut = 'actif' AND a.fin > NOW()`. Les essais gratuits actifs sont assimilés à Business VIP ; toute boutique expirée retourne `null`.
    - Remplacement des fallbacks `'pro'` par `'gratuit'`.
    - Sécurisation de `POST /:id/pos-vente` : rejet strict avec code HTTP `403 ABONNEMENT_POS_REQUIS` si la boutique n'a pas d'abonnement Pro/Business actif ou d'essai gratuit en cours.
  - **Correction Frontend (`CaisseClient.tsx`)** :
    - Intégration de l'écran de blocage élégant `PosNonAutoriseScreen` lorsque `!estBoutiqueAutorisee` (`!is_trial && plan !== 'pro' && plan !== 'business'`).
    - Proposition directe d'activation d'abonnement (`/boutique/abonnement`) ou de bascule vers une autre boutique autorisée du compte.
- **Sécurisation Multi-Tenant des Routes Métier Backend (Anti-Bypass de Paywall)** :
  - Ajout des middlewares `checkAbonnement, requireAbonnement` ou `requireBusiness` sur les routes qui n'étaient auparavant protégées que visuellement côté frontend :
    - Documents & Factures : `GET, POST, PUT, DELETE /api/boutiques/:id/documents` (`boutiques-documents.js`).
    - Comptabilité & Fiscalité : `/:boutiqueId/bilan`, `/:boutiqueId/inventaire`, `/:boutiqueId/ventes/export.csv`, `/:boutiqueId/export/syscohada` (`comptabilite.js`).
    - Entrepôts & Multi-stocks : `POST/PUT /:id/entrepots`, `POST /:id/entrepots/stocks` (`entrepots.js`).
    - Fournisseurs & Commandes d'achat : `GET/POST/PUT /:id/fournisseurs`, `GET/POST /:id/commandes-fournisseurs` (`boutiques-fournisseurs.js`).
    - Gestion d'équipe & Administrateurs délégués : `POST /:id/admins` protégé avec `requireBusiness` (`boutiques-equipe.js`).
- **Calibrage de la Période d'Essai Gratuit à 14 Jours** :
  - Passage de 30 jours à 14 jours dans la table PostgreSQL `settings` (`abonnement_essai_jours = '14'`), dans `backend/lib/settingsCache.js` et dans `backend/routes/boutiques-modules/boutiques-crud.js`. 14 jours créent l'urgence commerciale nécessaire à la conversion avant la perte d'engagement du marchand.
- **Moteur de Relances & Conversion WhatsApp (`cron-relances-marchands.js`)** :
  - Déploiement d'une séquence de conversion ciblée en 3 étapes :
    - **J-3** : Alerte expiration imminente dans 3 jours, incitation avec formules dès 2 500 FCFA/mois et remise annuelle -25%.
    - **J-1** : Alerte d'urgence « Dernier jour d'essai », avertissant que l'encaissement POS et la vitrine seront suspendus demain.
    - **J+1 Expiré** : Message rassurant attestant que toutes les données (produits, historique, dettes clients) sont conservées en sécurité, avec lien de réactivation en 1 clic.
- **Validation Tests Fonctionnels & Non-Régression** :
  - 100% des tests de cycle de vie (`scratch/test_economic_lifecycle.js`) et 100% des tests de paywall et guards backend (`scratch/test_paywall_verification.js`) validés avec succès (8/8 PASS).

### 📌 Version Précédente (27 septembre 2026 - Nuit - Audit Exhaustif & Remédiations Écosystème Conversationnel Web & WhatsApp) :
- **Audit Empirique des 16 Scénarios Conversationnels (100% Conformes - 0 Anomalie)** :
  - Exécution en conditions réelles contre la base PostgreSQL de production/staging pour tous les flux : recherche produit, recherche boutique, comparaison multi-marchands, panier, tunnel de commande, suivi de commande, immobilier, annonces classifiées, compte marchand/PIN, FAQ, robustesse/erreurs, stateless vs connecté, données inexistantes, vérification des prix au franc près, disponibilité/ruptures, tickets support/rappel et isolation multi-tenant.
- **Sécurisation Anti-IDOR / Anti-BOLA Espace Marchand WhatsApp (`whatsapp-chatbot.js`)** :
  - **Diagnostic** : Les commandes marchandes (`menu_marchand`, `marchand_commandes`, `marchand_stock`, `marchand_caisse`, etc.) utilisaient `context?.boutique || await trouverBoutiqueMarchand(phone)`. Si un client naviguait dans une boutique tierce, `context.boutique` était renseigné, lui permettant de déclencher les menus marchands d'autrui. De plus, les numéros non-marchands tombaient en fallback silencieux.
  - **Correction** : Éradication totale de `context?.boutique` pour toutes les actions d'administration marchande. Vérification stricte et exclusive de l'appartenance via `trouverBoutiqueMarchand(phone)`. En cas d'appel par un tiers, refus explicite et proposition d'ouverture de boutique (`creer_boutique`).
- **Correction Recherche Directe WhatsApp en Session IDLE (`whatsapp-chatbot.js`)** :
  - **Diagnostic** : Lorsqu'un utilisateur envoyait directement une référence produit ou une boutique en état `IDLE`, le bot se contentait d'un message d'accueil générique et écrasait la requête sans déclencher la recherche.
  - **Correction** : Détection des salutations pures vs intentions de recherche. Si un terme signifiant est saisi dès le premier message, confirmation immédiate et routage automatique vers la recherche produit/boutique en direct.
- **Enrichissement Sémantique Recherche Immobilière Web (`backend/routes/chat.js`)** :
  - **Diagnostic** : La liste des quartiers de `searchImmoIlike` omettait plusieurs secteurs majeurs (notamment *Mamelles*, *Virage*, *Hann*, *Keur Massar*, etc.), provoquant une absence de filtrage géographique et le renvoi d'annonces hors secteur.
  - **Correction** : Extension de la nomenclature des quartiers et implémentation d'une extraction des mots résiduels significatifs pour filtrer dynamiquement sur `ai.quartier`, `ai.ville` et `ai.titre`.
- **Correction Collision Mot-Clé FAQ Achat vs Suivi (`backend/lib/faq.js`)** :
  - **Diagnostic** : Le mot-clé générique `'commande'` dans `FAQ_WEB` interceptait n'importe quelle intention d'achat (ex: *"Je veux commander un ASICS KAYANO 14"*), provoquant une fausse réponse de suivi de colis et bloquant l'acte d'achat.
  - **Correction** : Remplacement par des expressions d'intention explicites (`'suivi commande'`, `'suivre ma commande'`, `'suivi de commande'`, `'mon colis'`, `'ou est ma commande'`).
- **Cloisonnement Multi-Tenant des Boutiques Inactives (`backend/services/whatsapp-chatbot.js`)** :
  - **Diagnostic** : La fonction `searchContentIlike` ne filtrait pas sur `b.actif = true`, exposant ainsi les produits de boutiques fermées ou suspendues dans la recherche conversationnelle.
  - **Correction** : Ajout strict de `AND b.actif = true` dans la clause WHERE du `JOIN boutiques`.
- **Validation Globale** :
  - 100% des tests unitaires Jest (`383 passed, 48 test suites`) et 100% de la suite empirique conversationnelle (`scratch/test_conversational_suite.js`) validés avec 0 régression.

### 📌 Version Précédente (27 septembre 2026 - Nuit - Assainissement Réassurance, Vérité des Données & Conformité Légale) :
- **Éradication de la Fausse Note 5.0/5 sur l'Annuaire des Boutiques** :
  - **Diagnostic** : Dans `boutiques/page.tsx`, l'évaluation utilisait `{Number(b.note_moyenne || 5.0).toFixed(1)} / 5`. Comme la colonne `note_moyenne` n'existait pas sur la table SQL `boutiques`, 100% des commerces affichaient artificiellement une note dorée de « 5.0 / 5 » sans aucun avis client.
  - **Correction** : Affichage conditionnel strict. Seules les boutiques ayant un `total_avis > 0` et une note réelle affichent désormais leur note et leurs étoiles. Les autres affichent en toute transparence le badge neutre « Nouveau commerçant ».
  - **Composant `AvisClients.tsx`** : Suppression du fallback `5.0`. Si `totalAvis === 0`, affiche explicitement « Aucune évaluation pour le moment » au lieu d'afficher 5 étoiles fictives.
  - **Composant `AvisProduitSection.tsx`** : Remplacement de l'allégation non sourcée « Avis Clients Vérifiés » par « Avis Clients » sans label d'huissier ou de certification fictive.
- **Purge Base de Données des Avis de Bancs d'Essai Automatisés** :
  - Suppression de 50 faux avis de test dans la table `boutique_avis` créés lors des tests automatisés (`"Testeur Automatique"` et `"Client Test"` avec commentaires type *"Test banc d’essai automatisé réussi"*). Seuls les avis réels organiques subsistent.
- **Conformité & Transparence Légale (Mentions Légales & Cookies)** :
  - **Harmonisation des Contacts** : Résolution de la contradiction entre le standard officiel `+221 70 871 79 42` (Service client & WhatsApp, Lun-Sam 8h-20h) et la ligne administrative `+221 77 720 20 86` (Siège administratif), tous deux clairement explicités dans `/mentions-legales`.
  - **Identification Précise des Hébergeurs** : Ajout des raisons sociales et sièges complets de Vercel Inc. (Frontend Edge, Covina CA) et Render Services Inc. (Backend API & Base de données, San Francisco CA).
  - **Mise en Conformité Politique de Confidentialité** : Suppression de la fausse déclaration « Aucun cookie ou tracking tiers n'est utilisé » dans `/confidentialite`. Clarification honnête sur l'utilisation de Google Analytics 4 (`G-3KGE1YBMVJ`) pour la seule mesure d'audience statistique anonymisée, sans revente de données personnelles ni profilage publicitaire.
- **Assainissement des Promesses Marketing & Fraîcheur des Données** :
  - **Page d'Accueil (`page.tsx`)** : Remplacement du slogan non prouvé « L'écosystème N°1 au Sénégal » par « L'écosystème de commerce digital & comparateur au Sénégal ».
  - **Vérité de la Fraîcheur des Prix** : Remplacement du badge rigide et inexact « Prix vérifiés toutes les 6h » par « Prix actualisés régulièrement » dans le footer et « Prix relevés et synchronisés régulièrement auprès des marchands et boutiques du Sénégal » sur la homepage, en parfaite adéquation avec le rythme réel des scrapes marchands.
  - **Composant `SocialProof.tsx`** : Suppression des chiffres simulés codés en dur (2847 comparaisons, 89 boutiques). Le composant ne s'affiche désormais que si des métriques réelles prouvées lui sont fournies.
  - **Clarté du Footer & Navigation** :
    - Distinction nette : renommage du lien footer « Programme Partenaires » en « Programme Apporteurs (20%) » pour éviter la confusion avec les marchands.
    - Ajout du quartier du siège social réel (« +221 70 871 79 42 • Yoff, Dakar ») dans le bandeau de contact rapide du footer.
    - Schema.org Navigation : alignement de « Boutiques Partenaires » vers « Boutiques & Marchands ».

### 📌 Version Précédente (27 septembre 2026 - Soir - Correction Affichage Fiche Produit & CTA) :
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

### 📌 Version Actuelle (28 septembre 2026 - Nuit - Correction Routage WhatsApp Boutiques & Fallback Orphelins) :
- **Attribution du Numéro Marchand à la Boutique "D'accord"** : Mise à jour en base de données de la boutique `d-accord` (ID `ec55971a-ad31-4c35-8c9a-203c7adb6806`) avec le numéro réel de son propriétaire SAMACOM Innovation (`whatsapp = '221708274472'`, `telephone = '708274472'`), stoppant la fuite des commandes vers le numéro administrateur.
- **Réparation Massive des Contacts Boutiques Orphelines** :
  - Synchronisation automatique de 62 boutiques ayant un téléphone renseigné mais un champ `whatsapp` à `NULL`.
  - Rétablissement de 6 boutiques ayant les deux champs vides en récupérant le numéro du compte créateur depuis la table `utilisateurs`.
- **Résolution du Bug de Transmission dans ProduitCTA & CommanderModal** :
  - Détection et correction d'un oubli majeur dans `ProduitCTA.tsx` où `CommanderModal` était invoqué sans passer `nomBoutique` ni `whatsapp`, forçant le texte à afficher *"Bonjour vendeur !"* et déclenchant systématiquement le fallback vers le numéro administrateur sur toutes les fiches produits individuelles (`/boutiques/[id]/produits/[produitId]`).
  - Transmission propre de `whatsapp` et `nomBoutique` dans `ProduitCTA.tsx` et `page.tsx`.
- **Sécurisation Backend Anti-Orphelins (Auto-Healing)** :
  - Dans `GET /api/boutiques/:id/produits/:prodId` (`boutiques-produits.js`) et `GET /api/boutiques/:id` (`boutiques-crud.js`), ajout d'une jointure `LEFT JOIN utilisateurs u ON b.utilisateur_id = u.id` avec un `COALESCE` hiérarchique : `COALESCE(b.whatsapp, b.telephone, u.telephone)` pour garantir qu'aucune boutique ne renvoie de contact vide si son propriétaire possède un numéro de téléphone enregistré.
