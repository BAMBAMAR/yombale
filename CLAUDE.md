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

## 🔎 3. Audits & Plans de Correction (méthode complète : [`docs/METHODOLOGIE-AUDIT.md`](docs/METHODOLOGIE-AUDIT.md))
- **Environnement isolé obligatoire** : tout audit, test ou sonde passe par `scripts/audit/` (`. scripts\audit\audit-env.ps1` : base PostgreSQL locale port 54329, clés externes factices non vides, garde réseau en liste blanche). **Jamais** de test ni de sonde contre la base Render ou les API réelles (Wave, WhatsApp, Telegram, Stripe, Resend, Cloudinary, Facebook). Mot de passe local dans `scripts/audit/.local/pgpass.txt` (ignoré par git, jamais committé ; ne jamais copier de secrets dans le dépôt).
- **Audit = preuve ou rien** : chaque anomalie `AUD-NNN` a une preuve reproductible, un impact, une cause racine, une gravité (P0 argent/fuite/prise de contrôle, P1 contournement/donnée corrompue/sauvegarde inutilisable, P2, P3). Ce qui n'est pas vérifié est listé comme tel. Aucune correction pendant l'audit. Rapport : `docs/AUDIT-NOPALOU-AAAA-MM-JJ.md`.
- **Plan = livrable séparé, sans toucher au code** : `docs/PLAN-CORRECTION-NOPALOU-AAAA-MM-JJ.md`, phases ordonnées (Phase 0 filet de tests, puis P0, P1, P2, P3, régression globale), et pour chaque anomalie : fichiers, approche, risque de régression, test de validation, critère d'acceptation, retour arrière, effort ; actions d'exploitation (rotation de secrets, variables Render) listées à part.
- **Exécution** : branche dédiée, commits locaux `fix(zone): AUD-NNN …`, pas de `git push` sans ordre. Chaque correctif est prouvé par un test qui échoue sans lui (contrôle par mutation). Migrations idempotentes validées sur base vide (`MIGRATE_STRICT=true node scripts/audit/freshmig.js 2 nobase`) puis sur base existante. Journal dans `docs/JOURNAL-LIVRAISONS.md`.
- **Entretien de l'environnement** : conserver `nopalou_audit`, `nopalou_audit_data` (copie de production = données personnelles, jamais commitée, à rafraîchir avant un audit) et mettre à jour `scripts/audit/` et la méthodologie quand une sonde ou une règle est ajoutée.

---


# 📜 JOURNAL DES VERSIONS & LIVRAISONS

L'historique complet des livraisons (~11 500 lignes, ~1,7 Mo) a été déplacé dans [`docs/JOURNAL-LIVRAISONS.md`](docs/JOURNAL-LIVRAISONS.md) pour ne plus être chargé automatiquement dans le contexte. Le consulter avec `grep` / `head` ciblés, jamais en entier.

- **Assainissement des Zones de Livraison & Éradication du Faux Libellé « Gratuit » (`CheckoutStep1Info.tsx`, `CommanderFormView.tsx`, `useCommander.ts`, `DrawerCartCheckout.tsx`, `useDrawerCartCheckout.ts`, `checkout-express/page.tsx`, `whatsapp-chatbot.js`)** :
  - **Suppression du Libellé « Gratuit » sur « Frais à convenir »** : L'option `Livraison (Frais à convenir avec le vendeur)` ayant techniquement un prix de 0 en base avant accord, l'interface lui accolait faussement `— Gratuit`, trompant le client. Seul le *Retrait en boutique* affiche désormais `Gratuit` ; l'option à convenir affiche son libellé exact sans suffixe de prix.
  - **Suppression des Fausses Zones Géographiques par Défaut (Dakar / Banlieue / Régions)** : Lorsqu'un marchand n'a pas configuré de zones de livraison, le système n'injecte plus arbitrairement des zones fictives avec des tarifs inventés (1 000 F, 1 500 F, 2 200 F). Seules les deux options universelles sont présentées : `Livraison (Frais à convenir avec le vendeur)` et `Retrait gratuit en boutique`.
  - **Alignement Web & Chatbot WhatsApp** : Suppression de `f_dakar_wave`, `f_dakar_cash` et `f_banlieue_cash` en fallback pour les boutiques sans grille tarifaire.

- **Correction du Type Error Next.js Build sur le Panier (`useDrawerCartCheckout.ts`)** :
  - **Déclaration Hook Scope de `isRetrait` et `isAConvenir`** : Correction de la variable non déclarée `Cannot find name 'isAConvenir'` qui bloquait la compilation TypeScript (`next build`) en production sur Render. Les deux variables dérivées de `zoneSelectionnee` sont désormais instanciées à la racine du hook et exportées pour tout le cycle de vie du panier.

- **Résolution du Crash Satori Edge ImageResponse `Image size cannot be determined` (`opengraph-image.tsx`, `assets/produit-promo/route.tsx`, `assets/produit-boutique/...`, `assets/boutique/...`)** :
  - **Attributs Numériques Explicites `width` et `height` sur `<img>`** : Satori (le moteur `@vercel/og` de Next.js) exige des dimensions numériques absolues (`width={X}` et `height={Y}`) directement sur les balises `<img>`. L'utilisation exclusive de styles CSS inline (`width: '100%'`, `maxWidth`) déclenchait une tentative interne de résolution du header de l'image distante qui échouait et plantait l'Edge Function (`Error: Image size cannot be determined. Please provide the width and height of the image.`).
  - **Garantie de Dimensions & Fallback Silencieux sur Toutes les Routes d'Images Dynamiques** :
    - `frontend-next/src/app/produit/[id]/opengraph-image.tsx` : Dimensions fixes 300x300 sur l'image produit et encapsulation dans un `try...catch` renvoyant le gabarit sans image si la ressource distante Cloudinary/CDN est inaccessible.
    - `frontend-next/src/app/assets/produit-promo/route.tsx` : Dimensions fixes 380x380 sur l'image de promotion.
    - `frontend-next/src/app/assets/produit-boutique/[id]/og/route.tsx` & `story/route.tsx` : Dimensions fixes explicites pour le logo de la boutique et la photo produit.
    - `frontend-next/src/app/assets/boutique/[id]/og/route.tsx` & `story/route.tsx` : Dimensions fixes explicites pour le logo boutique.
  - **Éradication de l'Erreur 500 `failed to pipe response`** : Le runtime Edge ne plante plus lors de la génération des cartes d'aperçu de partage WhatsApp/réseaux sociaux.

- **Gestion Universelle des Livraisons & Retrait en Boutique (Modèle 1 Hybride Pro, `whatsapp-chatbot.js`, `commande-service.js`, `comptabilite.js`, `useDrawerCartCheckout.ts`, `useCommander.ts`, `CommandeCard.tsx`, `CommandeNextStepGuide.tsx`)** :
  - **Garantie Systématique du Retrait en Boutique (Gratuit - 0 FCFA)** : Éradication du bug où la présence de zones de livraison configurées par le marchand masquait complètement l'option « Retrait en boutique » sur WhatsApp et sur le Web. Le retrait sur place reste désormais TOUJOURS garanti et disponible pour le client.
  - **Option Flexible « Frais de Livraison à Convenir avec le Vendeur »** : Suppression des frais imposés arbitrairement (1 500 F / 2 500 F) pour les boutiques sans grille ou les clients hors-zone. Les clients peuvent commander avec des frais à fixer selon le quartier réel ; la commande enregistre le sous-total exact des articles avec la note `[Livraison : À convenir avec le client]`.
  - **Notification Vendeur & Contact 1-Clic sur WhatsApp** : Le commerçant reçoit immédiatement une alerte `🚚 Livraison : ⚠️ Frais à convenir avec le client` accompagnée d'un lien direct WhatsApp vers le client pour fixer le tarif du transporteur/tiak-tiak en un clic.
  - **Ajustement Backend des Frais de Livraison (`PATCH /api/comptabilite/:id/commandes/:cmdId`)** : Possibilité pour le commerçant de renseigner ou ajuster `frais_livraison` sur une commande existante avec mise à jour instantanée du `montant_total` et des relances de paiement Wave 1-clic.
  - **Badges d'Alerte & Guide d'Étape Contextuel (Espace Marchand)** : Affichage du badge `⚠️ Livraison : Frais à convenir` sur la carte commande et d'un bouton d'action rapide `💬 Fixer le tarif sur WhatsApp` dans le guide étape marchande.
- **Refonte Complète du Système d'Identité Nopalou & Suppression Autonome de Compte (RGPD Art. 17)** :
  - **Séparation Stricte des Secrets JWT (Fix AN-001, `auth.js`, `admin-utilisateurs.js`)** : Découplage de `JWT_SECRET` en créant `RESET_SECRET` (dédié à la réinitialisation de mot de passe) et `VERIFY_SECRET` (dédié à la vérification d'adresse email), éliminant toute collision ou usurpation de session avec des jetons à usage unique.
  - **Invalidation Immédiate de Session & Versioning JWT (Fix AN-002, `backend/middlewares/auth.js`, `backend/routes/auth.js`)** : Migration de la colonne `jwt_version INT DEFAULT 1` sur la table `utilisateurs`. Incrémentation automatique à la déconnexion (`/api/auth/deconnexion`) et lors du changement de mot de passe. Vérification synchrone dans `verifierToken` pour révoquer instantanément les sessions obsolètes sur tous les appareils.
  - **Normalisation & Messages d'Erreur Explicites en Français (Fix AN-003, AN-007, `backend/routes/auth.js`)** : Ajout de `.normalizeEmail()` sur la route de connexion et harmonisation des validateurs `express-validator` avec des messages en français clair via `.withMessage(...)`.
  - **Template d'Email Officiel Nopalou (Fix AN-004, AN-005, AN-006, `backend/services/email.js`, `backend/routes/auth.js`)** : Création de la fonction `templateEmail()` appliquant la charte graphique Nopalou (`#1C2B4A`, bouton CTA `#C75B00`, typographie système native haute lisibilité sans aucun CDN externe de police). Remplacement des 3 emails HTML bruts (bienvenue/vérification, renvoi de lien, mot de passe oublié).
  - **Conformité Anti-IA-Slop & Restauration des Icônes Vectorielles (Fix AN-008, AN-009, AN-010, `InscriptionForm.tsx`, `ConnexionForm.tsx`, `MotDePasseOublieForm.tsx`, `BannerEmailNonVerifie.tsx`)** : Remplacement de tous les spans vides orphelins d'anciens émojis par des icônes SVG calibrées de `lucide-react` (`MessageCircle`, `Mail`, `CheckCircle`, `AlertCircle`). Correction de la clé i18n erronée sur la confirmation de réinitialisation de mot de passe.
  - **Élimination du Conflit de Sécurité HTTP Headers (Fix AN-011, `frontend-next/next.config.js`)** : Suppression du header `X-Frame-Options: SAMEORIGIN` redondant dans `next.config.js` au profit du contrôle strict `DENY` assuré par le middleware.
  - **Suppression Autonome de Compte & Période de Grâce de 30 Jours (RGPD Art. 17, `backend/routes/auth.js`, `actions/auth.ts`, `SupprimerCompteSection.tsx`, `BannerCompteSuppression.tsx`, `ActionsCompteClient.tsx`)** :
    - Endpoints backend `/api/auth/supprimer-compte`, `/api/auth/annuler-suppression` et `/api/auth/statut-suppression` avec colonne `supprime_par_utilisateur`.
    - Période de grâce de 30 jours permettant la reconnexion et l'annulation immédiate en 1 clic.
    - Composant modulaire `SupprimerCompteSection.tsx` (< 450 lignes) avec modal de confirmation exigeant le mot de passe actuel et la saisie de *"SUPPRIMER"*.
    - Bandeau d'avertissement contextuel `BannerCompteSuppression.tsx` affichant le compte à rebours des 30 jours et le bouton de restauration.
    - Traçabilité côté administration : badge visuel indiquant si la suppression a été initiée par l'utilisateur ou par un administrateur.
    - Suite de tests unitaires dédiée `tests/unit/identity-and-self-delete.test.js` (6/6 tests réussis à 100%).
  - **Élimination des Erreurs 403 Forbidden sur Documents, Fournisseurs et Bilan (`useBoutiqueOfflinePreloader.ts`, `CompteClient.tsx`, `useGestionDocumentsData.ts`)** : Conditionnement strict du préchargement hors-ligne des modules Documents (`/api/boutiques/:id/documents`), Fournisseurs (`/api/boutiques/:id/fournisseurs`) et Bilan Financier (`/api/comptabilite/:id/bilan`) à l'éligibilité réelle de la boutique (`plan_actif === 'pro' || plan_actif === 'business'`), empêchant les boutiques en forfait gratuit d'inonder la console de 403 `ABONNEMENT_REQUIS`. Suppression également du fallback `fetch` direct client non-authentifié dans `useGestionDocumentsData.ts`.
  - **Résolution du Mismatch d'Hydratation React #418, #423, #425 & `TypeError: Cannot read properties of null (reading 'parentNode')` (`BoutiqueClient.tsx`)** : Éradication des lectures synchrones de `localStorage` dans les initialiseurs `useState()` (qui provoquaient une désynchronisation entre le HTML SSR initial et le client React). Le state est désormais initialisé de manière SSR-safe avec les props transmises, et la réconciliation avec le cache offline s'effectue proprement en `useEffect()` après hydratation.
  - **Correction du Warning Preload Cross-World Service Worker GTM (`layout.tsx`)** : Passage de `strategy="afterInteractive"` à `strategy="lazyOnload"` sur le script Google Tag Manager / GA4, éliminant le conflit d'interception avec Serwist/Service Worker et supprimant le warning de preload inutilisé sans impacter le suivi analytique.
- **Redressement Intégral & Fiabilisation du Module Prospection Commerciale (`backend/app.js`, `backend/lib/cronLogger.js`, `backend/services/cron-relances-prospects.js`, `backend/services/cron-relances-marchands.js`, `backend/services/prospection.js`, `backend/services/scraper-prospection.js`)** :
  - **Résolution du Désalignement Statuts CRM / Messages (Fix A-07)** : Synchronisation de 215 leads contactés bloqués à "nouveau" vers "contacte_wa" (portant le total de 480 à 695). Cohérence messages réels vs statuts établie à 100% (0 lead contacté encore "nouveau").
  - **Activation et Observabilité des Crons Relances (Fix A-03, A-04, A-12)** : Enregistrement de `cron-relances-prospects` et `cron-relances-marchands` dans `app.js` (modes web + worker). Encapsulation via `executerTacheCron()` avec auto-nettoyage des tâches expirées (> 1h) dans `cronLogger.js`. Déblocage de `sauvegarde_quotidienne`.
  - **Scoring Intelligent & Fit Score Dynamique (Fix A-08, A-09)** : Intégration systématique de `evaluerLeadComplet()` dans le moteur de scraping (`scraper-prospection.js`) pour calculer `fit_score`, `priority_score` et `next_best_action` dès l'acquisition. 1 544 leads recalculés avec scoring actif en base.
  - **Réconciliation Bi-directionnelle Boutiques & CRM (Fix A-05, A-06, A-13)** : Refonte de la réconciliation dans `prospection.js` (prise en compte de `utilisateurs.telephone`, WhatsApp, téléphone boutique, et mise à jour même des leads déjà convertis) : passage de 5 à 36 boutiques actives rattachées avec `crm_lead_id` (+620%).
  - **Assainissement Hors-Cible & Qualité des Données (Fix A-10, A-01, A-02)** : Invalidation et remise à zéro des scores de 108 profils hors-cible emploi/recrutement. Enrichissement des emails et noms réels depuis les comptes marchands et annonces.
- **Correction & Optimisation Mobile des Formulaires de Support & Litige (`ModalCreerTicket.tsx`, `ModalSignalerProbleme.tsx`, `SuiviTicketSection.tsx`, `src/styles/aide.css`)** :
  - **Résolution Définitive des Troncatures de Textes sur Mobile** : Remplacement des grilles rigides (`gridTemplateColumns: '1fr 1fr'`) par des grilles adaptatives passant en 1 colonne complète sur smartphone (`@media (max-width: 600px)`), empêchant la coupure des noms de clients et numéros de téléphone.
  - **Correction du Débordement du Bouton d'Envoi** : Ajout de la classe `.npl-modal-btn-row` permettant aux boutons d'action de s'empiler en pleine largeur sur mobile (`<= 480px`), empêchant le texte *« Transmettre le signalement »* d'être rogné sur le bord droit.
  - **Correction de la Zone de Texte Écrasée (`textarea`)** : Application d'une hauteur minimale confortable (`min-height: 96px`, padding aéré, line-height 1.45), supprimant l'écrasement à 2 lignes visibles sur smartphone.
  - **Formulaire de Suivi Adaptatif (`SuiviTicketSection.tsx`)** : Réorganisation responsive de la barre de recherche (numéro + contact + bouton) en flux vertical plein écran sur mobile (`width: 100%`) et monoligne sur grand écran.
  - **Création de la Feuille CSS Dédiée (`aide.css`)** : Centralisation propre des styles de la modale et des formulaires avec respect des tokens Nopalou.
- **Refonte Responsive & Ergonomique de la Carte Commande Marchand (`frontend-next/src/app/boutique/commandes/CommandeCard.tsx`, `CommandeNextStepGuide.tsx`, `CommandeActionsBar.tsx`, `src/styles/commandes.css`)** :
  - **Grille 2 Colonnes Web (Desktop)** : Remplacement de l'accordéon étiré vertical par une disposition équilibrée en 2 colonnes (`1.15fr 0.85fr`). Colonne gauche dédiée au déroulement de commande (guide étape active, récapitulatif articles, total TTC et notes), colonne droite dédiée à la relation client et aux actions (fiche client, boutons rapides d'appel et WhatsApp, actions secondaires Facture PDF et changement de statut).
  - **Flux Vertical Épuré Mobile** : Élimination de l'effet "card inception" (4 sous-boîtes imbriquées lourdes) au profit d'un flux ergonomique continu réduisant de ~40% la hauteur nécessaire pour traiter une commande au comptoir.
  - **Éradication des Boutons Redondants (Anti-IA-Slop Règle 5)** : Suppression du doublon du bouton "Dispatch Livreur" (qui apparaissait simultanément dans l'étape active et dans les raccourcis rapides en bas).
  - **Alignement Chromatique Charte Nopalou** : Élimination des teintes violettes discordantes au profit des tokens officiels (`--navy: #1C2B4A`, `--accent: #C75B00`, `--price: #0A5C36`, `--border: #E8DDD2`).
  - **Feuille de Styles Dédiée (`commandes.css`)** : Extraction des styles inline monolithiques vers une feuille CSS optimisée, ramenant `CommandeCard.tsx` à 333 lignes (respect strict du seuil de modularité < 450 lignes).
- **Éradication des Erreurs SQL Scraper Facebook & Tâche Planifiée Windows (`backend/services/scraper-immo-facebook.js`, `scripts/run-full-combo.js`, `scripts/run-scraper-task.bat`)** :
  - **Correction de la Requête SQL d'Insertion Annonces (`syntax error at or near "DO"`)** : Rétablissement de la clause obligatoire `ON CONFLICT (source, ref_externe) WHERE ref_externe IS NOT NULL` manquante devant `DO UPDATE SET`, qui provoquait l'échec systématique des 32 annonces extraites par run.
  - **Correction d'Incohérence de Type Paramètre SQL (`annonces_immo`)** : Élimination du conflit de type PostgreSQL (`inconsistent types deduced for parameter $1`) en pré-calculant la transaction (`vente` vs `location`) en amont en JavaScript au lieu d'une expression `CASE WHEN $1 ILIKE ...` non castée.
  - **Synchronisation CRM WhatsApp Facebook Directe** : Insertion miroir automatisée des annonceurs immobiliers Facebook dans `prospection_leads` (`+221...`, opérateur, quartier, note avec prix).
  - **Nouveau Runner Node.js Full Combo (`scripts/run-full-combo.js`)** : Remplacement de l'évaluation batch fragile `FULL_COMBO` par un runner Node unifié orchestrant séquentiellement Phase 1 (Omnisource Google/Réseaux) et Phase 2 (Scraping Facebook avec Cloudinary), éliminant l'erreur `Cannot find module 'FULL_COMBO'`.
- **Résolution Définitive de l'Erreur 401 sur le Portail Développeur (`/admin/developer`)** :
  - **Correction du Proxy Next.js (`src/app/api/boutiques/[id]/[...path]/route.ts`)** : Transmission obligatoire des headers administratifs (`X-Admin-Secret`, `Authorization`) et des cookies de session vers le backend Express, évitant l'écrasement silencieux des privilèges.
  - **Pré-chargement SSR Sécurisé (`developer/page.tsx`)** : Chargement direct côté serveur des clés API et webhooks avec les identifiants admin serveur, supprimant le flash de chargement et le 401 client.
  - **Server Actions Développeur (`developer/actions.ts`, `DeveloperClient.tsx`)** : Implémentation de `fetchDevPortalData`, `revoquerCleApiAction` et `supprimerWebhookAction` avec révalidation instantanée du cache et conformité Anti-Slop (icônes vectorielles SVG `lucide-react`, palette officielle Nopalou).
- **Expansion Massive du Répertoire Scraper Facebook (`backend/services/scraper-immo-facebook.js`)** :
  - Intégration de plus de 80 nouveaux groupes Facebook qualifiés : passage d'un pool restreint à **102 groupes actifs** (Immobilier Dakar & Régions, Thiès, Saly/Mbour, Casamance, Keur Massar, Zac Mbao, Louma, High-Tech, Autos et Vide-greniers).
  - Ajustement de la rotation de fenêtre glissante (`maxGroupes = 15`) : rotation intelligente par cycles de 15 groupes toutes les 6 heures pour couvrir l'intégralité du territoire en 24h sans saturer la RAM ni heurter les limites de débit Meta.
- **Harmonisation UX : Masquage Partiel des Numéros de Téléphone sur l'Immobilier (`/immo/[id]`, `BlocAgenceAnnonce.tsx`)** :
  - **Protection Anti-Spam & Confidentialité Particuliers** : Les numéros de téléphone sur les fiches immobilières sont désormais masqués en partie par défaut au format national sénégalais (ex: `Appeler : 78 589 •• ••` avec badge interactif `[👁️ Afficher]`).
  - **Révélation Instantanée & Événement Lead** : Au premier clic de l'internaute, le numéro se dévoile en clair (`78 589 80 10`) et déclenche un événement analytics de qualification de prospect (`show_phone_number_immo`). Le clic suivant lance l'appel téléphonique direct (`tel:`).
- **Fiabilisation Complète du Crawler Sémantique IA (`backend/services/intelligent-crawler.js`)** :
  - **Résolution Définitive des Photos Floues (Deep Enrichment Ultra-HD 1920w)** : Remplacement des miniatures basse résolution du listing (`listing-thumb-224w`, 224px) par l'extraction des photographies originales de galerie en **1920w Ultra Haute Définition** depuis `srcset` et les pages détaillées. Persistance Cloudinary de 4 à 6 photos studio par bien, éliminant tout flou visuel.
  - **Démasquage Automatique des Contacts Téléphoniques** : Les numéros partiellement masqués par le site source (ex: `776 *** ****`) sont désormais systématiquement démasqués via l'extraction furtive des liens d'appel natifs (`tel:+221...`, WhatsApp, `[data-phone]`) sur les fiches de détail.
  - **Résolution Définitive du Crawl d'Expat-Dakar & Sites d'Annonces** : Passage d'un résultat nul (+0 annonces / +0 leads) à une extraction fluide et intégrale à 100% (titres nettoyés, prix exacts, contacts vérifiés, photos et quartiers).
  - **Cascade de Sélecteurs Prioritaires** : Élimination du faux positif sur les filtres de navigation (`.listing-filters-item`) grâce à un ciblage en cascade des vraies cartes d'annonces (`a[href*="/annonce/"]`, `a.listing-card__inner`, `[class*="listing-card"]`, `a[href*="/ad/"]`, `article`, `.card`).
  - **Protection Anti-Destruction des Boutons d'Appel (`nettoyerBruitHTML`)** : Suppression ciblée uniquement des formulaires et headers globaux parasites (`body > header, body > footer, body > nav`), préservant les micro-formulaires locaux et boutons d'appel (`<a href="tel:...">`, `<form action="/contact/...">`) porteurs des numéros de téléphone.
  - **Immunisation Regex Prix vs Horodatages** : Nouvelle regex anti-pollution horaire évitant la concaténation de l'heure (`17:53 1 600 000 FCFA` extrait désormais rigoureusement `1 600 000 FCFA` et non plus `31 600 000`).
  - **Nettoyage Automatique des Badges de Statut** : Purge systématique des badges parasites (`VIP`, `A La Une`, `Nouveau`, `Promo`) pour isoler le véritable intitulé de l'offre (ex: *Appartement à louer sur la Corniche de Ouakam Mamelles*).
  - **Lancement Multi-Canaux Furtif Playwright** : Cascade automatique avec fallback `channel: 'chrome'`, puis `channel: 'msedge'`, puis Chromium bundled, garantissant une exécution sans faille dans tout environnement serveur ou Windows.
  - **Correction du Pool PostgreSQL & Schéma CRM WhatsApp** : Correction de l'assignation `getPool()` (`db.pool || db`) et alignement complet de la synchronisation SQL sur les colonnes réelles de `prospection_leads` (`nom_boutique`, `telephone`, `telephone_brut`, `operateur`, `categorie`, `ville`, `quartier`, `source`, `statut`, `score`, `notes`).
- **Moteur & Interface Web de Crawling Sémantique Intelligent (`CrawlerAiCard.tsx`, `intelligent-crawler.js`, `scripts/crawl-ai.js`)** :
  - **Interface Web Admin (`/admin/prospection`)** : Ajout du formulaire interactif « Crawler Sémantique IA » dans l'onglet *Import & Sourcing* avec saisie d'URL, choix du volume d'annonces, bouton d'exécution asynchrone et rapport des créations en direct.
  - Implémentation du pattern architectural de Crawl4AI en 100% Node.js / Playwright natif (zéro latence inter-processus, zéro dépendance Python).
  - Nettoyage anti-bruit HTML automatique (suppression scripts, styles, iframes, bannières pubs et popups pour isoler 100% du contenu sémantique).
  - Extraction structurée haute précision pour le Sénégal : détection des prix FCFA, contacts 221 (77/78/76/75/70), quartiers de Dakar et villes du pays, typologies de biens et transactions.
  - Téléchargement binaire Playwright en RAM et téléversement direct vers Cloudinary (`annonces/crawler`) avec filtres anti-trackers.
  - Triple ingestion automatique : `annonces_classifiees`, `annonces_immo` et `prospection_leads` (CRM WhatsApp).
  - Exposition CLI (`scripts/crawl-ai.js --url <URL>`) et route API admin (`POST /api/prospection/crawler-ai`).
- **Tâche Planifiée Windows (`Nopalou_Scraper_Combo`, `gerer-taches-planifiees.ps1`)** :
  - Création et activation de la tâche planifiée sous Windows Task Scheduler s'exécutant automatiquement toutes les 6 heures (`22:00`, `04:00`, `10:00`, `16:00`).
  - Séquence 2-en-1 : Phase 1 Collecte Omnisource (Google Search, Maps, TikTok, Instagram) + Phase 2 Scraping Immo Facebook avec session locale authentifiée et persistance Cloudinary.
  - Résolution des blocages `pause` et redirection propre des logs vers `logs/scraper-task.log`.
- **Persistance Binaire des Photos Facebook vers Cloudinary (`backend/services/scraper-immo-facebook.js`)** :
  - Fin des liens Facebook éphémères (`scontent...fbcdn.net`) et des erreurs 403 Forbidden : téléchargement du buffer binaire des images directement en mémoire vive via le contexte authentifié du navigateur Playwright (`page.request.get(url)`).
  - Téléversement direct du buffer binaire vers Cloudinary (`cloudinaryModule.uploadBuffer(buffer, 'annonces/fb')`) avec watermark automatique `© nopalou.com`.
  - Synchronisation et mise à jour immédiate dans `annonces_immo` et `annonces_classifiees` avec URLs Cloudinary permanentes (`https://res.cloudinary.com/...`).
- **Consolidation Immédiate Catalogue Immo (`backend/scripts/consolidate-immo-classifiees.js`)** :
  - Décloisonnement réussi de 1 154 fiches : passage immédiat de **165 à 373 annonces actives vérifiées** sur le portail public (+126% de biens réels).
  - Détail du catalogue en direct : 326 locations, 47 ventes, 100% avec prix validé (`>= 10 000 FCFA`) et contact téléphonique sénégalais direct vérifié (`77`, `78`, `76`...).
- **Résolution Définitive du Crash Scraper Facebook (`backend/services/scraper-immo-facebook.js`)** :
  - Éradication de la `SyntaxError: Failed to execute 'querySelector' on 'Element': '... [data-ad-preview="message"] - header' is not a valid selector` qui bloquait les 10 groupes Facebook.
  - Remplacement par des sélecteurs CSS valides (`h2 strong, h3 strong, a[href*="/user/"] strong, a[href*="/user/"] span, h2 a, h3 a, [role="heading"] a`) et encapsulation sous `try / catch` préventif.
- **Automatisation Totale Omnisource en Arrière-Plan (`demarrerCronOmnisource`, `scraper.js`)** :
  - Intégration du moteur Omnisource dans le planificateur CRON serveur récurrent (`0 0,6,12,18 * * *`) : capture automatique 4 fois par jour sans intervention humaine des opportunités fraîches sur Google Search, Maps, Instagram, TikTok et Facebook avec injection directe dans le catalogue public et le CRM WhatsApp.

### 📌 Version Précédente (29 septembre 2026 - Refonte Ergonomique & Guidée de la Fiche Commande Mobile Marchand) :
- **Clarification Immédiate du Workflow Marchand (`CommandeCard.tsx`)** :
  - Éradication de la dispersion visuelle et des 7 boutons disparates au même niveau qui semaient le doute chez le marchand.
  - Structuration en 3 zones limpides : Action prioritaire conseillée, Contact client & livraison, Détail financier transparent.
- **Nouveau Composant d'Orientation Guidée (`CommandeNextStepGuide.tsx`)** :
  - Diagnostic et affichage proéminent de l'action suivante attendue du marchand selon le cycle de vie de la commande :
    - *En attente* : Validation de la commande en 1 clic ou relance Wave directe sur WhatsApp / Approbation de vente à crédit dans le carnet.
    - *Confirmée* : Consigne claire de préparation du colis avec bouton principal « Passer en préparation » et bouton secondaire « Assigner livreur Tiak-Tiak ».
    - *En préparation* : Bouton de transmission directe de la course « Dispatch Livreur Tiak-Tiak (WhatsApp) » et « Marquer comme expédiée ».
    - *Expédiée* : Bouton « Confirmer la remise au client (Livrée) ».
- **Optimisation Ergonomique Mobile & Contact Tactile** :
  - Boutons d'action rapide côte à côte au format tactile (40px) : appel direct (`tel:`) et ouverture WhatsApp pré-remplie (`wa.me/`).
  - Décomposition claire et sans équivoque des montants : prix article, frais de transport par zone, mode de règlement explicité (Wave, Espèces, etc.) et total mis en valeur en couleur accentuée Nopalou.
- **Modularisation & Respect Strict des 5 Règles Anti-Slop** :
  - Extraction de la logique métier dans [`useCommandeActions.ts`](file:///frontend-next/src/app/boutique/commandes/useCommandeActions.ts).
  - Épuration de [`CommandeActionsBar.tsx`](file:///frontend-next/src/app/boutique/commandes/CommandeActionsBar.tsx) (actions secondaires et documents) et [`CommandeStatusSelector.tsx`](file:///frontend-next/src/app/boutique/commandes/CommandeStatusSelector.tsx) (correction manuelle discrète).
  - Tous les composants strictement < 450 lignes, zéro émoji unicode (icônes vectorielles SVG `lucide-react`), tokens CSS officiels Nopalou (`--navy`, `--accent`, `--price`).

### 📌 Version Précédente (29 septembre 2026 - Alertes Multi-Canales Versements & Reversements, Diagnostic Wave Payout) :
- **Diagnostic Médicolégal Payout Wave 1-Clic** :
  - Interrogation directe de l'API Wave Payout avec les clés de production : identification précise du code d'erreur Wave `403 { code: 'no-permission', message: 'Your business using API key ending in BHow does not have permission for payouts_api. Please contact your account manager.' }`.
  - Enrichissement du mapping d'erreurs Wave dans [`backend/routes/comptabilite.js`](file:///backend/routes/comptabilite.js) avec un message d'action explicite pour l'administrateur.
- **Système d'Alerte Multi-Canale Dédié aux Versements & Reversements (`backend/services/admin-alerts.js`)** :
  - Création de `alerterPaiementRecu` : alerte instantanée multi-canal (Telegram `@nopaloubot`, WhatsApp `+221 77 720 20 86`, Email `dieteltouba@gmail.com`) lors de tout encaissement / versement client réussi (Wave, Stripe, Orange Money).
  - Création de `alerterReversementMarchand` : traçabilité temps réel des reversements marchands Wave 1-clic et reversements automatiques lors des livraisons (alertes en cas de succès et alertes immédiates en cas d'échec avec motif précis).
- **Câblage Intégral Webhooks & Comptabilité** :
  - Webhooks de paiement ([`backend/routes/paiement.js`](file:///backend/routes/paiement.js)) : déclenchement automatique de `alerterPaiementRecu` dans le webhook Wave et le webhook Stripe (auparavant réservé uniquement aux déclarations de virements manuels).
  - Reversements marchands ([`backend/routes/comptabilite.js`](file:///backend/routes/comptabilite.js)) : intégration de `alerterReversementMarchand` dans le contrôleur de paiement `/admin/reversements/:commandeId/payer` (succès et bloc d'erreur `catch`) ainsi que dans le flux de reversement 100% automatique.
- **Persistance Configuration** : Ajout de `ADMIN_WHATSAPP_PHONE=221777202086` dans `.env`.

### 📌 Version Précédente (29 septembre 2026 - Audit Qualité Données Scraping, Focus Spécial Immobilier, Assainissement DB & Durcissement Scrapers) :
- **Audit Médico-Légal Global & Focus Spécial Immobilier** :
  - Inspection exhaustive DB & Live HTTP : 10 962 produits, 12 441 offres, 4 821 annonces classifiées, 4 058 annonces immo, 144 forfaits télécom.
  - Diagnostic immo prouvé : 90.2% de rejets historiques sur CoinAfrique/Expat-Dakar dus aux numéros de téléphone masqués par JS statique, dédoublonnage Facebook à 24h insuffisant ayant engendré 1 573 doublons de republiants, expiration systématique des CDN `fbcdn.net` (HTTP 403), pollution par accessoires matériels (fenêtres alu, bureaux) et titres corrompus par noms d'auteurs Facebook.
- **Assainissement Transactionnel de la Base de Données (`scripts/assainir-donnees-scraping-v2.js`)** :
  - **S-005 Immo** : Purge définitive de 2 933 annonces orphelines rejetées sans contact ni valeur.
  - **S-001 Immo** : Désactivation de 169 annonces corrompues dont le titre était le nom propre de l'auteur FB.
  - **S-009 Immo** : Rejet de 6 accessoires matériels hors-sujet, redressement de 3 ventes déguisées en location, désactivation de 13 ventes dérisoires (< 1M FCFA) et reclassement de 7 loyers géants (>= 10M FCFA) en vente.
  - **S-007 E-commerce** : Désactivation des 2 marchands défaillants (Kanje : 100% rupture / URLs redirigées ; Univers Cosmetix : HTTP 403 Cloudflare permanent) et passage à `stock=false` de leurs 1 195 offres mortes.
  - **S-006 Immo** : Désactivation de 24 annonces immo obsolètes (> 60 jours sans mise à jour).
  - **Recalcul & Cohérence** : Recalcul en cascade des `prix_min`, `prix_max` et `nb_offres` de 765 fiches produits.
- **Reclassification Catégorielle Intelligente (`scripts/reclasser-produits-divers.js`)** :
  - **930 produits reclassés avec succès hors de "Divers"** vers leurs catégories cibles respectives : `tv-electro` (+318), `maison` (+245), `informatique` (+161), `beaute` (+95), `mode` (+85), `alimentation` (+24), `smartphones` (+2). "Divers" réduit de 4 620 à 3 690 fiches.
- **Refonte & Durcissement du Scraper Immo Facebook (`backend/services/scraper-immo-facebook.js`)** :
  - **`extraireTitreIntelligentFB`** : Préservation de la structure multiligne DOM, purge ciblée des en-têtes d'auteurs, modérateurs et dates relatives/absolues (`EST_DATE_FB`, `EST_NOM_PERSONNE`). Éradication totale des noms d'auteurs dans les titres (8/8 tests unitaires validés).
  - **Dédoublonnage Robuste à 30 jours** : Empreinte pérenne `(contact_tel, titreNormalise, 30 jours)` évitant la réinsertion en boucle des mêmes annonces republiées chaque semaine.
  - **Normalisation des URLs sources** : Suppression des tokens tracking éphémères (`__cft__`, `__tn__`, query params).
  - **Rejet Préventif Non-Immo (`REGEX_NON_IMMO`)** : Filtrage automatique à l'ingestion des fenêtres alu, portes blindées, chaises, armoires, mixeurs et bureaux.
  - **Extraction Séparée Auteur / Post** : Priorité absolue aux permalinks exacts des publications (`postPermalinkLien`) plutôt qu'aux profils d'utilisateurs.
- **Surveillance & Observabilité Active (`backend/services/scraping-health-monitor.js`)** :
  - Création du moniteur de santé automatisé : détection des marchands non scrapés > 48h, anomalies de prix (< 1 000 ou > 20M FCFA), fiches immo corrompues (sans téléphone ou fausses ventes), et images non persistées `fbcdn.net`.
- **Moteur d'Ingestion Omnisource Universel (`backend/services/omnisource-collector.js`, `routes/prospection.js`)** :
  - Double ingestion simultanée : création des annonces dans `annonces_classifiees` (et `annonces_immo`) + synchronisation automatique dans `prospection_leads` pour le CRM WhatsApp.
  - Sourcing multi-canaux : requêtes dorking ciblées sur Instagram, TikTok, Facebook + scanner des commerces physiques géolocalisés (Google Places / Overpass OSM avec rotation de 3 miroirs anti-timeout).
  - SAS de qualification stricte : normalisation des téléphones sénégalais mobiles/WhatsApp (77, 78, 76, 75, 70), extraction intelligente de prix FCFA et loyers mensuels (`extrairePrixTexte`), nettoyage de titres sans emojis ni hashtags parasites (`nettoyerTitreReseauSocial`), dédoublonnage d'empreinte sur 30 jours.
  - Endpoints d'API ajoutés : `POST /api/prospection/omnisource` et `GET /api/prospection/omnisource/stats`. 100% des tests unitaires validés (7/7).

### 📌 Version Précédente (29 septembre 2026 - Résolution Intégrale des Anomalies de Scraping S-001 à S-011 & Assainissement DB) :
- **Audit Médico-Légal & Correction Structurelle des Scrapers (`scraper.js`, `scraper-immo-facebook.js`, `annonces.js`)** :
  - **S-003 — Jiji Sénégal Débloqué (100% fonctionnel)** : Détection et correction du bug de parsing de prix sur les montants anglo-saxons avec virgule séparatrice de milliers (`"CFA 155,000"` → extrait 155000 FCFA au lieu de 155 FCFA). 13 tests unitaires validés, scraper live validé (18 produits réels extraits avec prix conformes et URLs complètes).
  - **S-001 — Plafond Absolu Prix & Éradication des Prix Aberrants** : Mise en quarantaine et déstockage de l'offre aberrante CoinAfrique à 778 millions FCFA (`offres.quarantinee = true`). Implémentation d'un plafond absolu de 20 000 000 FCFA dans `corrigerPrixXOF()` et `sauvegarderProduits()` pour rejeter préventivement toute saisie erronée.
  - **S-007 — Purge Offres Fantômes sans URL & Verrouillage Ingestion** : Suppression SQL définitive de 227 offres mortes sans URL d'achat et hors-stock issues d'Electroménager Dakar et AfriQ Market. Purge de 361 produits orphelins associés. Ajout d'une garde stricte `cleanUrl.startsWith('http')` dans `sauvegarderProduits()` interdisant l'insertion d'offres sans URL.
  - **S-006 — Dé-stockage Kanje Inactif > 30 jours** : 319 offres Kanje inactives passées à `stock = false`, recalcul en cascade des `prix_min` et `nb_offres` de 319 produits.
  - **S-008 — Cron Automatique de Dé-stockage des Offres Obsolètes (> 45 jours)** : Dé-stockage SQL immédiat de 1 910 offres non rafraîchies depuis plus de 45 jours (recalcul de 1 756 produits). Intégration dans le cron quotidien de `scraper.js` de la fonction `destockerOffresObsoletes(45)` à 04h30.
  - **S-005 — Éradication des Descriptions Nulles (10 960 produits mis à jour)** : Backfill SQL de 10 960 descriptions de produits vides avec leur libellé de référence (`description = nom`). Modification de `sauvegarderProduits()` pour insérer systématiquement `item.description || item.titre` sur les nouveaux produits.
  - **S-009 — Normalisation Source Facebook & Compatibilité API** : Ajout de la colonne `source_detail` sur `annonces_classifiees` (4 750 annonces enrichies avec leur groupe d'origine `facebook-group-<id>`). Mise à jour de `routes/annonces.js` pour supporter indifféremment `source = 'facebook'` et `source LIKE 'facebook-%'`.
  - **S-011 — Nettoyage des Titres Facebook Invalides** : Nettoyage SQL de 117 annonces Facebook polluées par des mentions d'horodatage résiduel (`"il y a X heures"`). Durcissement de la regex de parsing dans `scraper-immo-facebook.js` (`extraireTitreIntelligentFB`).
  - **S-002 — Résilience & Diagnostic Jumia** : Ajout de logs détaillés sur la taille HTML reçue et les sélecteurs `article.prd`. Amélioration de la stratégie de retry et contournement des coupures transitoires (test direct : 112 produits extraits).
- **Validation Globale** :
  - `node scripts/verify_all_corrections.js` : **100% des tests validés**.
  - Zéro offre active > 20M, zéro offre fantôme sans URL, zéro produit avec description vide, zéro offre obsolète active > 45j.

### 📌 Version Précédente (29 septembre 2026 - Assainissement Exhaustif Immobilier, Purge Photos Mortes 403 & Faux Immo, Refonte Fallbacks) :
- **Audit Médico-Légal & Assainissement Base de Données (`annonces_immo`, PostgreSQL)** :
  - **Purge Faux Immo & Parasites (111 annonces rejetées)** : Éradication des annonces de recrutement de personnel de maison (nounous, aides-maisons type *THIAMSERVICE*), caissiers/gérants de boutique, vente de mobilier/high-tech (chaises visiteurs, tables de bureau, barres de son, blenders) et commentaires Facebook résiduels (*"Participant(e) anonyme"*, *"Je suis intéressé"*).
  - **Purge Annonces sans Prix (614 annonces rejetées)** : Élimination stricte des annonces sans loyer ou au prix dérisoire `< 10 000 FCFA` responsables de l'invasion de tirets `—` sur le comparateur sectoriel.
  - **Purge Numéros Invalides (4 annonces rejetées)** : Suppression des annonces sans contact téléphonique sénégalais direct vérifié.
  - **Purge URLs Facebook Mortes HTTP 403 (443 annonces remises à `photos: []`)** : Remplacement des URLs `scontent...fbcdn.net` expirées et bloquées par Meta (qui généraient des carrés noirs et alt-texts tronqués `Mam`, `DAK`, `Maga`) par un tableau vide pour basculer sur les placeholders vectoriels propres.
  - **Normalisation des Titres** : Remplacement des noms de profils d'auteurs Facebook (ex: *"Mamadou Sarel"*) par le vrai titre descriptif (*"Showroom & Grand Magasin 250 m² - Les Mamelles"*), suppression des préfixes *"DAKAR, SÉNÉGAL"* sur 21 annonces.
  - **Inventaire Actif Sain** : 395 annonces réelles, vérifiées et joignables.
- **Durcissement Backend & Scripts d'Ingestion (`backend/routes/immo.js`, `backend/scripts/consolidate-immo-classifiees.js`)** :
  - **Comparateur Sectoriel (`/api/immo/:id/similaires`)** : Suppression définitive de `OR prix IS NULL`. Obligation stricte de `prix IS NOT NULL AND prix >= 10000 AND rejete = false`. Zéro annonce sans prix dans le tableau comparatif.
  - **Catalogue Public (`GET /api/immo`)** : Verrouillage sur `ai.rejete = false AND ai.prix IS NOT NULL AND ai.prix >= 10000`.
  - **Script de Consolidation Immo (`consolidate-immo-classifiees.js`)** : Ajout du prédicat `estFauxImmo`, nettoyage de titre `nettoyerTitreImmo`, purge des photos 403 et conditionnement `actif = true` à la présence conjointe d'un prix `>= 10 000` et d'un téléphone sénégalais valide.
- **Refonte UI / UX & Fallbacks Visuels Haute Résilience (`GaleriePhotosFiche.tsx`, `immo/[id]/page.tsx`, `ImmoCard.tsx`)** :
  - **Héro Galerie Immo Fiche Détail (`GaleriePhotosFiche.tsx`)** :
    - Remplacement de l'état `null` vide par une carte héro élégante Nopalou avec icône vectorielle `Building2`, indiquant que les photos récentes sont disponibles sur demande directe via WhatsApp/appel auprès de l'annonceur.
    - Écouteur `onError` sur l'image principale et les miniatures : bascule instantanée en placeholder vectoriel élégant en cas de CDN indisponible, sans aucun carré noir ni icône brisée.
  - **Biens Comparables dans le Secteur (`immo/[id]/page.tsx`)** :
    - Filtrage préventif côté client pour garantir zéro ligne sans prix.
    - Remplacement du `<img alt />` brut par `ExternalImg` avec fallback vectoriel doux `Building2` pour un alignement impeccable sans texte alt débordant.
  - **Cartes Catalogue Vitrine (`ImmoCard.tsx`)** :
    - Remplacement de la boîte grise inerte par un visuel architectural soigné avec icône `Building2` et mention *"Photo sur demande"*.
- **Validation Globale** :
  - `npx tsc --noEmit` : **0 erreur**.
  - `npm run lint:slop` : **0 violation** (aucun émoji Unicode dans l'UI).

### 📌 Version Précédente (29 septembre 2026 - Résolution Complète des Anomalies & Faiblesses Audio Nopalou) :
- **Audit & Remédiation Exhaustive du Moteur Audio & Assistant Vocal (`voice-assistant.ts`, `PosVoiceInput.tsx`, `KalpeSaisieMontant.tsx`, `NavbarSearch.tsx`, `whatsapp-chatbot.js`)** :
  - **Carnet de Dettes & Crédit Client (`voice-assistant.ts`)** :
    - **Correction Bug P0 (Inversion Dette/Remboursement)** : Priorisation stricte de `isRemboursement` sur `isCredit` (ex: *"Paiement dette Amadou 15000"* classé en remboursement et non plus en vente à crédit).
    - **Enrichissement des verbes de paiement** : Ajout de `paiement|paiements|acompte|acomptes|solde|solder|reglement`.
    - **Neutralisation des numéros de téléphone sénégalais dictés** : Regex 9 chiffres `(?:\+?221\s*)?(?:7[05678]|33)...` éliminant le faux montant de dette extrait sur les numéros clients.
    - **Éradication des faux clients de politesse** : Stop-words de salutation (`bonjour`, `bonsoir`, `salam`, `salut`, `allo`, `merci`, etc.) pour éviter la création de fiches clients parasites.
  - **Création & Saisie Produit (`voice-assistant.ts`)** :
    - **Purge intégrale des nombres Wolof & caractères spéciaux non-ASCII** : Nettoyage des suffixes et formes numérales Wolof (`ñaari`, `netti`, `ñetti`, `ñeenti`, `juroomi`, `fukki`) via regex lookaround `(?:^|\s+)` sans faille `\b` sur les caractères UTF-8.
    - **Suppression des verbes d'amorce étendus** : Prise en compte de `créer`, `mettre en vente`, etc.
  - **Saisie Express Comptable & Sama Xaalis (`voice-assistant.ts`, `KalpeSaisieMontant.tsx`)** :
    - **Priorisation Fournitures vs Stock** : `fournitures` (emballages, sacs plastiques, cartons) passe avant `achat de stock`.
    - **Détection Dépenses Dettes / Règlements** : Prise en compte de `remboursement|rembourser|dette|reglement` dans les charges comptables.
    - **Guidage Pédagogique Vocal Sama Xaalis** : Ajout d'une consigne contextuelle dynamique pendant l'écoute (*« Dites un montant, ex : "5000", "10 mille", ou en Wolof "téemeer" / "junni" »*).
  - **Caisse POS Comptoir (`PosVoiceInput.tsx`)** :
    - **Centralisation du moteur de normalisation** : Remplacement des regex ad-hoc par `normaliserTexteVocal` et `extraireMontantCFA` (support natif devises Wolof, abréviations 10k, séparateurs).
    - **Conformité Design System** : Remplacement des couleurs hexadécimales brutes par les variables CSS de la charte Nopalou (`var(--danger)`, `var(--danger-bg)`, `var(--border)`, `var(--price)`, `var(--navy)`).
    - **Bulle d'aide d'écoute active** : Affichage d'un prompt d'exemple lisible (*« Dites : 2 Café Touba ou 5000 FCFA »*).
  - **Recherche Globale Navbar (`NavbarSearch.tsx`)** :
    - **Placeholder dynamique d'écoute** : Affichage de *« Parlez... Ex: Robe Bazin, iPhone... »* dès activation du microphone.
    - **Tokens CSS conformes** : Remplacement des hexadécimaux inline par `var(--accent)` et `var(--text3)`.
  - **WhatsApp Note Vocale Audio (`backend/services/whatsapp-chatbot.js`)** :
    - **Persistance & Traçabilité des Notes Vocales** : Sauvegarde immédiate de `audioUrl` dans `context.derniere_note_vocale_url`.
    - **Rattachement automatique aux commandes** : Liaison de l'audio aux notes de la commande (`creerCommandeBoutique({ note: noteFinale })`) et transmission directe du lien audio au commerçant via `notifierVendeurCommande`.
    - **Réponse contextuelle enrichie** : Confirmation personnalisée informant le client que sa note vocale est rattachée à sa commande en cours auprès de la boutique.
- **Validation & Benchmarks Audio Réels** :
  - `scratch/test_audio_engine.mjs` : **22/22 tests PASSÉS (100%)** — Parsing monétaire, devises Wolof, Saisie Express, Carnet de dettes, Catalogue POS, Création produit, Audio WebAudio sans CDN, Permissions micro, et Stress Test (40 000 opérations de parsing en ~270 ms soit 6,9 µs/op).
  - `scratch/test_dette_parsing.mjs` : **21/21 tests PASSÉS (100%)**.
  - `frontend-next/` `npm test` : **69/69 tests validés (100%)**.
  - `frontend-next/` `npx tsc --noEmit` : **0 erreur**.
  - `frontend-next/` `npm run lint:slop` : **0 violation**.

### 📌 Version Précédente (29 septembre 2026 - Alignement Pleine Largeur Compte & Zéro Espace à Gauche) :
- **Suppression du Centrage Parasite & Espace Vide à Gauche sur le Compte (`globals.css`, `AccountWorkspaceWrapper.tsx`, `AccountTopNavbar.tsx`)** :
  - **Correction Fondamentale de `.account-layout` (`globals.css`)** :
    - Éradication de `max-width: 1260px; margin: 0 auto;` qui provoquait un auto-margin de 130px à gauche et réduisait artificiellement la largeur de la grille sur les sous-onglets compacts (Sama Kalpé, Profil, Annonces).
    - Passage à `width: 100%; max-width: 100%; margin: 0; padding: 20px 20px 80px; box-sizing: border-box;`.
    - Nettoyage du décalage de 4px sur `.account-client-content` (`padding: 0;`).
  - **Verrouillage Pleine Largeur du Wrapper (`AccountWorkspaceWrapper.tsx`)** :
    - Application stricte de `width: '100%', boxSizing: 'border-box'` sur `.account-workspace-root` et sur le container principal `{children}`, empêchant tout rétrécissement cross-axis flexbox.
  - **Harmonisation d'En-tête (`AccountTopNavbar.tsx`)** :
    - Alignement millimétré du padding de la navbar supérieure (`padding: '0 clamp(12px, 1.5vw, 20px)'`) pour que le logo `[N] Nopalou` s'aligne exactement sur la colonne de la barre latérale du compte.
- **Validation & Qualité** :
  - `npx tsc --noEmit` : **0 erreur**.
  - `npm test -- --run` : **69/69 tests validés (100%)**.
  - `npm run lint:slop` : **0 violation**.

### 📌 Version Précédente (28 septembre 2026 - Sama Xaalis : Carte Héro Lumineuse Premium, Gestion Dettes Entités & Catégories Courantes) :
- **Refonte Héro Card Sama Xaalis (Plus Lumineux, Ultra-Premium)** :
  - **Transformation Radicale de la Carte Centrale (`KalpeSituationCards.tsx`)** :
    - Éradication complète du bloc sombre noir/navy opaque (`#1C2B4A` vers `#152238`) qui écrasait l'écran.
    - Remplacement par une carte exécutive lumineuse en dégradé ivoire noble (`linear-gradient(135deg, #FFFFFF 0%, #FCFBF9 50%, #F6EFE5 100%)`), bordure raffinée `1.5px solid var(--border, #E8DDD2)` et halo d'ambiance discret.
    - Typographie haute autorité pour le montant disponible en bleu nuit profond (`var(--navy, #1C2B4A)`), accompagné d'un badge de devise ambré chic `FCFA`.
    - 4 micro-cartes épurées et structurées (Entrées mois, Sorties mois, À recevoir, Épargne totale) avec icônes vectorielles SVG `lucide-react`, fonds pastel ton sur ton et contrastes élevés.
- **Prise en Compte des Entreprises & Entités dans les Dettes & Créances** :
  - **Migration Base de Données (`backend/migrate-inline.js`)** : Ajout sécurisé de la colonne `tiers_type VARCHAR(30) DEFAULT 'particulier'` sur la table `kalpe_dettes`.
  - **Routes Backend (`backend/routes/kalpe.js`)** :
    - Prise en charge de `tiers_type` ('particulier' ou 'entreprise') dans `POST /api/kalpe/dettes`.
    - Message WhatsApp de relance adapté et personnalisé selon qu'il s'agit d'une personne physique ou d'une entreprise/société/école (`"Bonjour l'équipe [Nom]..."`).
  - **Formulaire de Saisie Rapide (`KalpeSaisieFormFields.tsx` & `KalpeSaisieModal.tsx`)** :
    - Sélecteur à 2 états avec icônes Lucide (`User` pour Particulier, `Building2` pour Entreprise/Entité).
    - Libellés et placeholders dynamiques (Ex: "Nom de l'entreprise ou entité *", "Ex: École Sainte-Marie, Senelec, Pressing...").
  - **Gestion & Affichage des Dettes (`KalpeDettesSection.tsx`)** :
    - Badge visuel distinctif sur chaque dossier : `Entreprise / Entité` (`Building2`) ou `Particulier` (`User`).
    - Filtres 1-clic rapides en en-tête : **Tous**, **Particuliers**, **Entreprises & Entités** avec compteurs instantanés.
    - Carnet client boutique (`shop.ts` & `CarnetModalNouveauClient.tsx`) : libellés mis à jour pour expliciter le support client ou entreprise.
- **Extension des Catégories de Dépenses & Revenus du Quotidien** :
  - **Ajout de Catégories Usuelles Clés (`KalpeSaisieFormFields.tsx`)** :
    - `École & Scolarité` (inscriptions, mensualités scolaires, fournitures).
    - `Pressing & Blanchisserie` (nettoyage, repassage, blanchisserie).
    - `Carburant & Essence`, `Communication & Forfait`, `Habillement & Couture`, `Dons & Culte`.
  - **Support Vocal Intelligent (`voice-assistant.ts` & `useKalpeVoice.ts`)** :
    - Détection automatique par mots-clés vocaux (ex: "école 25000", "scolarité", "mensualité", "pressing", "blanchisserie") et attribution automatique de la bonne catégorie lors de la dictée vocale bilingue.
- **Validation & Qualité** : 100% des 69 tests unitaires validés, `npx tsc --noEmit` avec 0 erreur, respect strict des 5 règles d'or Anti-IA-Slop.

### 📌 Version Précédente (28 septembre 2026 - Harmonisation Pleine Largeur Espace Compte) :
- **Harmonisation Pleine Largeur de Tous les Onglets & Pages du Compte** :
  - **Suppression des Restrictions Artificielles (`maxWidth`)** : Éradication des limites étroites (`maxWidth: 1000px`, `1080px`, `1100px`) et marges centrées parasites sur les sous-pages et onglets :
    - `AlertesClientTab.tsx` : passage à `width: 100%, minWidth: 0, boxSizing: border-box`, nettoyage des spans emojis vides.
    - `MesAlertesClient.tsx` : passage à `width: 100%, boxSizing: border-box`.
    - `SamaKalpeClient.tsx` : suppression de `maxWidth: 1080px; margin: 0 auto;`, pleine largeur 100% sans rognage.
    - `FonctionnalitesClient.tsx` : suppression de `maxWidth: 1100px; margin: 0 auto;`, pleine largeur 100%.
  - **Éradication des Vides Blancs à Droite (Règle d'Or #5)** :
    - `produit.css` (`.favs-grid`) : passage de `repeat(auto-fill, minmax(260px, 1fr))` à `repeat(auto-fit, minmax(min(100%, 280px), 1fr))` avec `width: 100%`, éliminant les espaces vides lorsque peu de favoris sont enregistrés.
    - `AnnoncesImmoClient.tsx` : passage de `auto-fill` à `auto-fit` (`minmax(min(100%, 300px), 1fr)`) avec `width: 100%`.
    - `annonces.css` (`.annonces-list`) & `AnnoncesClient.tsx` : verrouillage à `width: 100%, box-sizing: border-box`.
  - **Conteneurs & Sous-Composants Universels** :
    - `MesLocationsClient.tsx`, `SuiviCommandeClient.tsx`, `ProfilClient.tsx`, `ApporteurClient.tsx`, `AccountSubHeader.tsx` et les pages `/deposer-annonce` et `/deposer-immo` configurés en `width: 100%, minWidth: 0, boxSizing: border-box`.
    - `globals.css` : `.account-main` et `.account-client-content` verrouillés en `width: 100%; box-sizing: border-box;`.
  - **Validation & Qualité** : 100% des tests unitaires (69/69) passés, typecheck TS sans erreur (`tsc --noEmit`), linter anti-slop validé.

### 📌 Version Précédente (28 septembre 2026 - Audit Utilité Commerciale du Scraping & Assainissement / Déverrouillage des Canaux) :
- **Audit Forensic de l'Utilité Commerciale et de la Qualité du Scraping** :
  - **Constat d'impact commercial nul** : Sur 22 commandes en base, 0 provient du scraping (100% sont des abonnements SaaS ou boosts). 99,6% des liens d'achat étaient bruts sans tracking d'affiliation, générant 0 FCFA sur 10 955 clics sortants.
  - **Comparateur limité** : 87,7% des produits étaient mono-offres. Seuls 886 produits (8,5%) disposaient d'au moins 2 marchands distincts pour une réelle comparaison.
  - **Données immobilières corrompues & mortes** : 93,1% des annonces CoinAfrique Immo (2 349) avaient le prix injecté dans le champ `quartier` (`'1 100 000CFA'`), 99,9% n'avaient aucun téléphone et étaient figées depuis le 9 juin 2026 (> 110 jours).
  - **Annonces Facebook inexploitables** : 70,9% sans prix, 862 avec `contact_tel = 'Voir sur Facebook'`, et des centaines de titres pollués par les noms de profils ou `Participant(e) anonyme`.
  - **Invisibilité dans la recherche instantanée** : `/api/produits/instantanee` n'interrogeait que `boutique_produits`, masquant les 10 000+ produits comparateur de la barre de recherche.
- **Correctifs Appliqués** :
  - **Script d'Assainissement Global DB (`scripts/assainir-donnees-scraping.js`)** :
    - 2 519 annonces CoinAfrique Immo et 414 annonces Expat-Dakar Immo sans contact désactivées (`actif = false, rejete = true`).
    - 2 349 quartiers corrompus par des montants 'CFA' nettoyés.
    - Suppression de la contrainte `NOT NULL` sur `annonces_classifiees.contact_tel`.
    - 862 numéros corrompus `'Voir sur Facebook'` passés à `NULL`.
    - 3 476 annonces Facebook inexploitables désactivées.
    - 1 prix aberrant (778M FCFA en Mode) mis en quarantaine et 227 offres sans URL désactivées.
    - 811 produits resynchronisés avec recalcul de `prix_min` et `nb_offres`.
  - **Scraper Immo CoinAfrique (`backend/services/scraper-immo-coinafrique.js`)** :
    - Filtrage renforcé des montants CFA et chiffres dans `parseLocalisation` pour le champ quartier.
    - `upsertAnnonce` vérifie la présence d'un téléphone direct valide avant d'activer l'annonce.
  - **Synchronisation Annonces Facebook (`backend/routes/scraper.js`)** :
    - Suppression du placeholder `'Voir sur Facebook'`, validation stricte (titre non pollué, prix > 0, téléphone valide) pour le statut `actif`.
  - **Typeahead Instantané Marketplace (`backend/routes/produits.js` & `frontend-next/src/app/NavbarSearch.tsx`)** :
    - `GET /api/produits/instantanee` enrichi avec les produits phares du catalogue comparateur (priorité 2 après boutiques locales).
    - `NavbarSearch.tsx` gère dynamiquement la redirection vers `/produit/:id` ou `/boutiques/:slug/produits/:id`.
  - **Comparateur WhatsApp (`backend/services/whatsapp-comparator.js`)** :
    - Jointure sur `marchands` pour afficher le nom du marchand réel (Jumia, Kanje, etc.) et ajout du lien web comparateur dans le message WhatsApp.
  - **Attribution de Trafic (`backend/routes/click.js`)** :
    - Injection automatique de paramètres UTM (`utm_source=nopalou&utm_medium=comparator&utm_campaign=product_click`) dans les redirections sortantes.
  - **Sitemap SEO (`frontend-next/src/app/sitemap.ts`)** :
    - Élargissement des quotas d'indexation (jusqu'à 3 000 produits et 1 000 annonces) avec support de `safeLimit` jusqu'à 5 000 dans l'API backend.

### 📌 Version Précédente (28 septembre 2026 - Audit Fraîcheur Réelle des Données Scrapées & Correctifs Détection/Purge) :
- **Audit Forensic de la Fraîcheur Réelle des Données Scrapées** :
  - **Diagnostic** : Confrontation directe de 66 URLs réelles (Jumia, CoinAfrique, Expat-Dakar, Auchan, Kanje) à la base PostgreSQL de Nopalou :
    - 32 % des éléments testés présentaient des anomalies majeures de fraîcheur (18 % de ruptures de stock non détectées, 11 % d'annonces 404 non purgées, 6 % de prix modifiés non actualisés).
    - 0 % des offres en base étaient marquées `stock = false` (12 643 sur 12 643 marquées en stock), en raison d'un court-circuit logique dans `offreEstMorte` avec `validateStatus: null` qui traitait les 404 comme des succès et retournait systématiquement `false`.
    - 75,1 % des annonces immobilières CoinAfrique (1 893 / 2 522) et 95 % des annonces Expat-Dakar n'avaient jamais été mises à jour depuis leur collecte initiale il y a 111 jours.
- **Correctifs Appliqués** :
  - **`offreEstMorte` fiabilisée (`backend/services/scraper.js`)** : Détection explicite des codes HTTP 404/410, des délistages avec redirection vers catalogue/accueil (`jumia.sn/catalog/`, etc.) et des mentions d'expiration/rupture dans le corps HTML sans bloquer sur les challenges Cloudflare (403). Taux de réussite unitaire : 100 % (4/4).
  - **Nettoyeur d'annonces immobilières mortes (`nettoyerAnnoncesImmoExpirees`)** : Fonction périodique parcourant les annonces immobilières scrapées et marquant `actif = false, supprimee = true, updated_at = NOW()` sur les URLs mortes.
  - **Planification Cron Immobilier (`lancerScrapingImmo`)** : Intégration du scraping immobilier (`scraper-immo-expat` et `scraper-immo-coinafrique`) tous les 2 jours à 02h00 (`0 2 */2 * *`) dans `demarrerScraping()`, et passage du nettoyeur immo chaque nuit à 04h30.
  - **Filtrage Strict Affichage Public (`backend/routes/immo.js` & `backend/routes/produits.js`)** :
    - Ajout de `AND (ai.supprimee IS NULL OR ai.supprimee = false)` dans `GET /api/immo`.
    - Remplacement de `HAVING (COUNT(o.id) = 0 OR MIN(o.prix) >= 500)` par `HAVING COUNT(o.id) > 0 AND MIN(o.prix) >= 500` dans `GET /api/produits` pour ne plus servir de fiches scrapées vides d'offres en stock.
  - **Routes d'Administration Dédiées (`backend/routes/scraper.js`)** : Ajout de `POST /api/scraper/nettoyer-immo-mortes` et `POST /api/scraper/lancer-immo`.
  - **Assainissement Immédiat en DB** : Désactivation et marquage immédiat en `supprimee = true, actif = false` des 7 annonces 404 identifiées lors de l'audit.

### 📌 Version Précédente (28 septembre 2026 - Correction Structurelle Déduplication & Idempotence Scraper) :
- **Audit et Résolution du Gonflement Artificiel du Catalogue (`produits`)** :
  - **Diagnostic** : Identification de 42 160 fiches orphelines (79,1 % de la table `produits`) sans aucune offre, générées par un clash d'upsert à deux têtes (`idx_offres_marchand_url` vs `ON CONFLICT (produit_id, marchand_id)`) lors des re-scrapings quotidiens.
  - **Idempotence Stricte dans `backend/services/scraper.js` (`sauvegarderProduits`)** :
    - Étape 0 prioritaire : Vérification si l'offre `(marchand_id, cleanUrl)` existe déjà en base avant toute tentative de matching ou d'insertion.
    - Si existante : mise à jour directe du prix, stock, specs et horodatage sans jamais créer de produit en double.
    - Gestion sécurisée des erreurs : Si un nouveau produit est inséré mais que l'offre échoue, suppression immédiate du produit orphelin créé.
    - Résultat test d'idempotence : 0 erreur, 0 produit fantôme créé, 100 % de mises à jour fluides.
  - **Support des Accents & Priorisation Produits Actifs (`backend/services/matching.js`)** :
    - Création de la fonction PostgreSQL IMMUTABLE `f_unaccent(text)` et de l'index GIN trigramme `idx_produits_nom_unaccent`.
    - Recherche par titre exact et recherche trigramme via `f_unaccent(LOWER(nom))` permettant d'aligner les titres avec accents (ex. "Vêtements", "Réfrigérateur") sur les titres normalisés en minuscules sans accents.
    - Priorisation stricte des produits ayant déjà des offres réelles : `ORDER BY (nb_offres > 0) DESC, created_at ASC`.
  - **Purge Sécurisée des 41 995 Fiches Orphelines (`backend/scripts/assainir-produits-orphelins.js`)** :
    - Purge par lots de 5 000 transactions des scories sans offres (`offres.id IS NULL`), sans alertes et sans clics d'affiliation.
    - Assainissement du catalogue : Réduction de 53 303 à 11 308 fiches produits réelles et vérifiées, avec 12 643 offres marchands actives.

### 📌 Version Précédente (28 septembre 2026 - Audit & Corrections Qualité Données Scraping) :
- **Audit qualité exhaustif (`annonces_classifiees`, 4 819 enregistrements, 40 sources)** : Mesure champ par champ de la conformité des données issues du scraper Facebook. Résultat initial : note 2/10, 8 problèmes structurels identifiés avec preuves reproductibles.
- **8 corrections appliquées dans `backend/services/scraper-immo-facebook.js`** :
  1. **Titre** : Ajout de `PREFIXE_AUTEUR_FB` (regex) + `t.replace(PREFIXE_AUTEUR_FB, '')` dans `extraireTitreIntelligentFB()` — supprime le "Prénom Nom · il y a X jours" en tête de post avant d'extraire la première phrase utile.
  2. **Localisation** : Chaque groupe GROUPES reçoit `ville_defaut` (Saint-Louis, Thiès, Touba, Dakar) ; `parseVilleFB()` accepte ce paramètre comme fallback au lieu du hardcode "Dakar" universel.
  3. **État/condition** : Nouvelle fonction `parseEtatFB()` extrayant l'état (neuf, occasion, bon_etat, reconditionne, defauts) depuis le texte du post ; stocké dans `caracteristiques.etat`.
  4. **Date de publication** : Nouvelle fonction `parseDatePublicationFB()` convertissant les dates relatives FB ("il y a 2 jours", "il y a 3 heures"...) en ISO date absolue ; stocké dans `caracteristiques.date_publication`.
  5. **Vendeur (contact_nom)** : Nouvelle fonction `parseAuteurFB()` extrayant le nom de l'auteur depuis l'en-tête du post (rejette comptes anonymes/machines). Inséré dans la colonne `contact_nom`.
  6. **Photos persistées** : Nouvelle fonction `persistPhotosFB()` — upload chaque image `scontent.fbcdn.net` (URLs signées temporaires, expiry < 24h) vers Cloudinary via `uploadFromUrl()`. Nouvelle fonction `uploadFromUrl(url, folder)` ajoutée dans `backend/services/cloudinary.js`.
  7. **URL source** : Inversion de priorité — `photoLien?.href || userLien?.href` au lieu de `setM ? photoLien.href : userLien?.href`. Les 60 % d'URLs profil-auteur sont désormais remplacées par le permalink du post quand disponible.
  8. **Téléphone / Déduplication** : Suppression du placeholder `'Voir sur Facebook'` (862 occurrences) — stocké `NULL`. Ajout d'une déduplication par titre normalisé (48h) pour les posts sans `ref_externe` (85 % des cas), bloquant les commentaires dupliqués. L'INSERT inclut maintenant `contact_nom` et `caracteristiques` JSONB avec `ON CONFLICT DO UPDATE` pour les mettre à jour.

### 📌 Version Précédente (28 septembre 2026 - Modération Produits & Exclusion Catalogue Accueil) :

- **Supervision & Modération Produits Complète (`/admin/produits`)** :
  - **Correction du bridage d'affichage** : Dans `frontend-next/src/app/admin/(protected)/produits/page.tsx`, remplacement de `?limit=40` par `?limit=500` permettant de charger l'intégralité du catalogue des boutiques (168 articles) et d'inclure les produits suspendus situés au-delà des 40 plus récents.
  - **Compteurs dynamiques synchronisés** : Dans `ProduitsSupervisionClient.tsx`, synchronisation des onglets avec les données réelles (`Tous (168)`, `En vente (150)`, `Suspendus / Modérés (1)`, `Ruptures de stock (17)`) avec réactivité temps réel sur les cartes KPI lors des actions de modération.
- **Sécurisation & Exclusion Stricte des Produits Suspendus (Accueil `/`, Recherche & Fiches)** :
  - **Exclusion du catalogue public (`backend/routes/produits.js`)** : Ajout systématique du filtre `AND (p.statut_moderation IS NULL OR p.statut_moderation = 'actif')` sur la requête d'accueil `baseBoutique`, la recherche instantanée `/instantanee`, les catégories actives `/categories-actives`, ainsi que sur le détail produit (`/:id`) et les offres (`/:id/offres`).
  - **Recherche globale multi-entités (`backend/routes/search.js`)** : Filtrage strict sur `produit_boutique` pour masquer tout article modéré.
  - **Invalidation immédiate du cache Redis (`backend/routes/admin-produits.js`)** : Purge automatique des clés `prod:catalog:*`, `prod:*` et `cat:*` dès qu'un admin suspend, réactive ou supprime un article.
  - **Assainissement des données** : Verrouillage de l'article suspendu "Longrich SOD" (`en_stock = false`) et purge du cache, éliminant sa remontée en première place sur l'accueil due à son prix anomal (6 FCFA).

### 📌 Version Précédente (28 septembre 2026 - Aplatissement Hero Mobile en Rectangle & Refonte Annuaire Boutiques & Agences) :
- **Aplatissement du Hero Mobile en Rectangle Épuré (Modèle Page d'Accueil `/`) (`/boutiques` & `/agences`)** :
  - **Diagnostic** : Sur mobile (`<= 768px`), la section Hero formait une tour verticale de plus de 700px repoussant le contenu sous la ligne de flottaison à cause du carrousel bento et des colonnes empilées.
  - **Aplatissement Rectangulaire (~130px)** :
    - Masquage automatique du carrousel de droite (`.hero-right-block`) et des 3 bento-items desktop (`.hero-trust-bento`) sur mobile.
    - Transformation du bloc en bandeau rectangulaire compact (`border-radius: 14px`, `padding: 12px 14px`).
    - Chips d'assurance réorganisées en ruban horizontal enveloppant sur 2 sous-lignes propres (`✓ 0% commission`, `✓ Catalogues directs`, `✓ WhatsApp direct`, `🏪 71 boutiques`, `🛡️ 100% vérifiés`).
    - Élimination absolue du décalage et de la troncature à gauche via application stricte de `width: 100%; min-width: 0; box-sizing: border-box;` sur tous les conteneurs parents et flex-items.
    - Boutons d'action compacts (`Explorer les boutiques/agences ↓` et `Ouvrir ma boutique` / `Payer mon loyer`).
- **Suppression Complète du Vide Web & Bento Confiance Desktop (`/boutiques` & `/agences`)** :
  - Réduction de la hauteur de `HeroCarousel.tsx` et `ImmoHeroCarousel.tsx` (`minHeight: 175px`, padding compacts).
  - 3 cartes Bento de réassurance interactive avec micro-animations au hover (Commerçants Vérifiés / Agréments Contrôlés, WhatsApp Direct / Quittances Wave-OM, Livraison Express / Mandats Exclusifs).
  - Alignement centré équilibré (`align-items: center`) comblant l'intégralité du vide horizontal.
- **Refonte Bouton de Recherche & CSS Filtres Mobile (`BoutiquesSearch`, `AgencesSearch`, `BoutiquesFilterBar`, `AgenceFilterBar`)** :
  - **Bouton Recherche Mobile** : Remplacement du bouton textuel encombrant par un bouton icône circulaire 34px avec icône `Search` vectorielle de `lucide-react`. Le placeholder dispose de 100% de la largeur sans troncature.
  - **Zéro Troncature des Menus Déroulants** : Paddings internes ajustés (`padding: 0 17px 0 20px !important`), typographie 11px semi-bold et `letter-spacing: -0.25px`. "Toutes les villes" et "Tous les prix" s'affichent intégralement.
  - **Ligne de Tri & Badges** : Ligne de tri occupant 100% de la largeur en ligne 2, et badges filtres avec défilement horizontal fluide.
- **Pépites & Nouveautés en Rail Horizontal Compact (12 articles)** :
  - Carrousel horizontal swipeable (scroll-snap) avec contrôles `‹ ›` sans allonger la page.
  - Cartes compactes 180px (desktop) / 155px (mobile) avec prix FCFA et badges état.
- **Règles d'Or Respectées** : Zéro émoji UI (icônes `lucide-react`), respect strict des tokens (`--navy`, `--accent`), modularisation < 450 lignes, zéro push automatique.

### 📌 Version Précédente (28 septembre 2026 - Reversements Marchands Wave 1-Clic & Supervision Financière Complète) :
- **Reversements Marchands Wave 1-Clic Opérationnels & Résilients (`/admin/reversements` & `/admin/commandes`)** :
  - **Diagnostic** : L'écran de reversements marchands (`/admin/reversements`) pouvait afficher une liste vide ou échouer en raison d'une clause SQL trop restrictive (`paiement_recu = true`), d'une extraction fragile du cookie JWT, ou de l'absence de déclenchement direct du payout Wave depuis la modale d'inspection de commande.
  - **Résilience Moteur Wave Payout (`backend/services/wave.js`)** :
    - Récupération dynamique des clés d'API Wave (`wave_api_key`, `wave_signing_secret`) depuis `settingsCache` en complément des variables d'environnement.
    - Résilience des routes API Wave : prise en charge automatique de l'endpoint standard `https://api.wave.com/v1/payouts` avec repli automatique sur `/v1/payout` en cas de 404.
  - **Supervision & Calculs Financiers Précis (`backend/routes/comptabilite.js`)** :
    - Élargissement de la requête SQL `GET /api/comptabilite/admin/reversements-dus` :
      `WHERE (c.paiement_recu = true OR c.statut IN ('payee', 'livree')) AND c.statut != 'reverse' AND (c.methode_paiement ILIKE '%wave%' OR c.methode_paiement = 'pay_wave')` afin d'intégrer toutes les commandes livrées/payées en ligne éligibles à un virement.
    - Déduction automatique de la commission Nopalou et des frais de transaction Wave (2%) pour déterminer le net exact à reverser.
    - Accès sécurisé étendu aux rôles `'super_admin'`, `'finance'` et `'admin_operationnel'`.
  - **Double Mode d'Exécution & Zéro Risque de Doublon (`POST /api/comptabilite/admin/reversements/:commandeId/payer`)** :
    - *Mode API Wave Direct (`mode: 'wave_api'`)* : Exécution immédiate du virement bancaire Wave vers le compte du commerçant avec verrouillage transactionnel SQL immédiat (`statut = 'reverse'`, `payout_ref`, `payout_date`).
    - *Mode Manuel / Hors-Ligne (`mode: 'manuel'`)* : Possibilité de marquer le reversement comme effectué sans appel API (en cas de virement externe ou règlement en espèces).
    - Traçabilité complète dans `admin_audit_logs`.
  - **Notifications Automatisées Multi-Canales Instantanées** :
    - *Notification WhatsApp Commerçant* : Message de confirmation immédiat avec référence commande et montant net crédité envoyé sur le numéro WhatsApp de la boutique.
    - *Notification Admin Directe* : Alerte instantanée sur le smartphone de l'administrateur (**WhatsApp `+221 77 720 20 86`** et bot **Telegram**) avec récapitulatif du reversement.
  - **Intégration Complète 1-Clic dans la Gestion des Commandes (`/admin/commandes`)** :
    - Ajout du bouton d'action directe « Reversement Wave 1-Clic » dans la modale d'inspection de commande pour toute commande livrée encaissée par Wave.
    - Prise en charge du statut visuel « Reversée » (`statut === 'reverse'`) dans les filtres et tableaux.
  - **Interface Refondue & Standard Anti-IA-Slop (`ReversementsClient.tsx` & composants dédiés)** :
    - Modularisation rigoureuse en sous-composants dédiés sous `components/` (`ReversementsKpiCards.tsx`, `ReversementsTable.tsx`, `ModalConfirmerReversement.tsx`) garantissant tous < 450 lignes.
    - 3 Cartes KPI synthétiques : *Total Net à Reverser (FCFA)*, *Commandes en Attente*, *Commissions Retenues*.
    - Export groupé Wave Bulk Payout aux formats Excel (.xls) et CSV.
    - Recherche instantanée par nom de boutique, téléphone ou référence commande.
    - Liens directs 1-clic d'ouverture WhatsApp (`wa.me/221...`) pour dialoguer avec le commerçant.
    - Modale de confirmation sécurisée avant exécution du virement pour éviter tout clic accidentel.
    - Zéro émoji UI (icônes vectorielles SVG `lucide-react` uniquement), tokens du Design System Nopalou (`--navy`, `--accent`, `--border`).
  - **Correction Build Production Server Actions (`admin-communication.ts` & `types.ts`)** :
    - Élimination de l'erreur Render `Error: A "use server" file can only export async functions, found object` en déplaçant la constante `DEFAULT_SOCIAL_LINKS` hors du fichier Server Action vers `components/types.ts`.
  - **Contrôle Qualité & Résilience** :
    - `npm run build` production : 100% PASS (134 pages générées sans erreur).
    - `npm --prefix frontend-next exec tsc -- -p frontend-next --noEmit` : 100% PASS (0 erreur).
    - `npm --prefix frontend-next run lint:slop` : 100% PASS (advisory clean).
    - `node --check` backend : 100% PASS.

### 📌 Version Précédente (28 septembre 2026 - Système d'Alertes Administratives Multi-Canales WhatsApp 777202086 + Telegram + Email) :
- **Système Centralisé d'Alertes Immédiates Multi-Canales (`backend/services/admin-alerts.js`)** :
  - **Diagnostic** : Les alertes critiques étaient restreintes aux incidents techniques DB/WhatsApp sans prévenir l'administrateur en direct sur son smartphone pour les flux métier vitaux (dépôts Wave/OM, abonnements, signalements de fraude, avis 1-2 étoiles, litiges support).
  - **Moteur Multi-Canal Enrichi** :
    - **Canal WhatsApp officiel** : Envoi direct et garanti 24h/24 vers le numéro de l'administrateur **`+221 77 720 20 86`** (`admin_notification_phone`) via l'API Meta Cloud (`sendWhatsAppNotification` avec template certifié + fallback SMS).
    - **Canal Telegram interactif** : Prise en charge des boutons cliquables *Inline Keyboard* (`reply_markup`) reliant directement à l'écran admin adéquat ou au contact WhatsApp.
    - **Canal Email de traçabilité** vers `contact@nopalou.com`.
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
