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

### 📌 Dernière Version Locale (28 septembre 2026 - Nuit - Audit Réel Mobile & Réseau Extrême & Corrections 100% Validées) :
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



