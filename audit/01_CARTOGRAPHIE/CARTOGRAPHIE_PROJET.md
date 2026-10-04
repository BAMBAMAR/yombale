# Cartographie Technique Exhaustive du Projet Nopalou

Ce document établit la cartographie structurelle et technique complète de la plateforme Nopalou à la version/commit `4c0237273fde2d058d5eabca5f94b79ceb07d37e`.

---

## 1. Vue d'Ensemble de l'Architecture Globale

La plateforme Nopalou est un écosystème commercial et financier tout-en-un conçu pour l'Afrique de l'Ouest (Sénégal en premier lieu), composé de trois couches logiques majeures :

1. **Frontend Hybride (Next.js 14 App Router & Serwist PWA)** :
   - Application web réactive, vitrines e-commerce, application de caisse POS tactile, ERP agence immobilière et back-office d'administration.
   - PWA avec Service Worker offline, cache applicatif et persistance locale (IndexedDB / localStorage).
2. **Backend API REST & Temps Réel (Node.js Express & PostgreSQL)** :
   - 74 fichiers de routes API, 19 modules spécialisés boutiques, 63 services métier.
   - Base de données relationnelle PostgreSQL hébergeant 140 tables avec extensions `uuid-ossp` et `pg_trgm`.
   - Redis en couche optionnelle de cache et de rate limiting.
3. **Moteurs Spécialisés d'IA, Voix, Messagerie & Automatisation** :
   - Chatbot WhatsApp bidirectionnel connecté à l'API Meta Cloud (6 600+ lignes de logique métier).
   - Moteur vocal bilingue Wolof/Français (Sama Xaalis & Caisse POS vocale).
   - Scrapers automatisés de données marché (CoinAfrique, Expat-Dakar, Jumia, Decathlon, Jiji, ARTP).
   - Crons de relances commerciales WhatsApp et réconciliation CRM.

---

## 2. Découpage Modulaire Détaillé

### MOD-01 : Frontend Next.js & Interface Utilisateur
* **ID** : `MOD-01`
* **Nom** : Interface Utilisateur Next.js & PWA
* **Localisation** : `frontend-next/src/app`, `frontend-next/src/components`
* **Responsabilité** : Rendu des pages (SSR, SSG, CSR), navigation, formulaires de commande, affichage réactif mobile-first, respect du Design System Nopalou (`--navy`, `--accent`, `--price`, `--bg`, `--border`).
* **Dépendances** : React 18, Next.js 14, Serwist (Service Worker), Lucide React (icônes vectorielles sans emojis), TailwindCSS (tokens stricts).
* **Entrées** : Interactions utilisateur (clavier, tactile, micro, scan douchette), URL, requêtes API.
* **Sorties** : DOM HTML5 accessible, CSS optimisé, états d'hydratation sécurisés, notifications Toast.
* **API** : Appels vers `/api/*` du backend Express via Server Actions ou fetch client sécurisé.
* **DB** : Pas d'accès direct ; proxy via backend API.
* **Risques** : Mismatch d'hydratation SSR/CSR (erreurs React #418, #423, #425), blocage de compilation TypeScript, débordement d'écran sur mobile.
* **Tests nécessaires** : Vérification hydratation sans avertissement console, audit responsive mobile 360px-414px, contrôle des contrastes et accessibilité.

### MOD-02 : Caisse Enregistreuse POS & Vente Physique
* **ID** : `MOD-02`
* **Nom** : Logiciel de Caisse POS & Encaissement Boutique
* **Localisation** : `frontend-next/src/app/boutique/caisse`, `backend/routes/boutiques-modules/boutiques-pos.js`
* **Responsabilité** : Gestion des sessions de caisse (ouverture, fond de caisse, clôture, bilans X et Z), encaissement multi-moyens (Cash, Wave, Orange Money, Chèque, Carnet de dettes), gestion des remises, saisie libre et impression tickets de caisse.
* **Dépendances** : `PosPanierSidebar`, `PosNumpad`, `PosVoiceInput`, ESC/POS printer driver.
* **Entrées** : Sélection articles catalogue, scan codes-barres douchette, transcription vocale, montant reçu.
* **Sorties** : Ventes enregistrées, tickets imprimables, mise à jour instantanée des stocks.
* **API** : `POST /api/boutiques/:id/pos/sessions`, `POST /api/boutiques/:id/pos/ventes`, `GET /api/boutiques/:id/pos/historique`.
* **DB** : `boutique_pos_sessions`, `ventes`, `boutique_pos_mouvements_caisse`, `caisse_avoirs`.
* **Risques** : Désynchronisation de caisse, duplication de vente sur double clic (absence d'idempotency key), décalage du stock en direct.
* **Tests nécessaires** : Ouverture de session avec fond de caisse, enchaînement vente cash avec rendu de monnaie, vente mixte et clôture avec contrôle d'écart de caisse.

### MOD-03 : Mode Hors-Ligne & Synchronisation PWA
* **ID** : `MOD-03`
* **Nom** : Résilience Offline & Cache Serwist
* **Localisation** : `frontend-next/src/app/sw.ts`, `frontend-next/src/app/boutique/caisse/hooks/usePosOfflineSync.ts`
* **Responsabilité** : Fonctionnement complet de la caisse et consultation du catalogue en l'absence de réseau internet ; mise en file d'attente des transactions dans IndexedDB ; synchronisation automatique dès retour de la connectivité.
* **Dépendances** : Service Worker (Serwist), IndexedDB, API `navigator.onLine`.
* **Entrées** : Requêtes réseau interceptées, événements `online`/`offline`.
* **Sorties** : Données servies depuis le cache local, rejeu des requêtes POST en différé sans conflit.
* **API** : Endpoints POS et Catalogue en mode replay.
* **DB** : IndexedDB côté client (`nopalou_pos_offline_db`) répliqué vers PostgreSQL.
* **Risques** : Perte de ventes offline en cas de fermeture du navigateur avant synchronisation, conflits de stock si deux caisses vendent le dernier article hors-ligne.
* **Tests nécessaires** : Coupure totale du réseau en cours de vente, validation de ticket en local, rétablissement réseau et contrôle de réconciliation sans doublon.

### MOD-04 : Moteur Vocal & Assistant Sama Xaalis
* **ID** : `MOD-04`
* **Nom** : Reconnaissance Vocale & Parsing Bilingue Wolof/Français
* **Localisation** : `frontend-next/src/lib/voice-assistant.ts`, `frontend-next/src/app/sama-xaalis`, `backend/services/whatsapp-chatbot.js`
* **Responsabilité** : Transcription et compréhension en temps réel des commandes vocales mixtes français-wolof ("Vente 2 junni", "Dépense transport benn téemeer", "Bor Moussa 10 000") pour alimenter la caisse et la comptabilité.
* **Dépendances** : Web Speech API (`SpeechRecognition`), dictionnaires phonétiques Wolof (`teemeer` = 500, `junni` = 5 000), Cloudinary audio buffer.
* **Entrées** : Flux audio microphone ou notes vocales WhatsApp OGG/Opus.
* **Sorties** : Intention extraite (`type: 'vente' | 'depense' | 'dette'`), nom article/client, montant normalisé en FCFA, quantité.
* **API** : `/api/comptabilite/:id/depenses`, `/api/comptabilite/:id/ventes`.
* **DB** : `depenses`, `ventes`, `caisse_clients_credits`.
* **Risques** : Mauvaise interprétation phonétique menant à une écriture comptable erronée, rejet de permission micro.
* **Tests nécessaires** : Matrice de phrases Wolof (dizaines de variantes), test de séparation quantité/montant, rejet propre des bruits inaudibles.

### MOD-05 : Chatbot WhatsApp & Commerce Conversationnel
* **ID** : `MOD-05`
* **Nom** : Bot WhatsApp Métier & Sessions Clientes
* **Localisation** : `backend/services/whatsapp-chatbot.js`, `backend/routes/whatsapp.js`
* **Responsabilité** : Interface commerciale complète sur WhatsApp (recherche produit, constitution de panier, commande interactive, gestion de carnet de dettes commerçant, fiches immobilières).
* **Dépendances** : Meta Graph API Cloud WhatsApp v18.0, Cloudinary (photos produits), `commande-service.js`.
* **Entrées** : Webhooks JSON Meta entrants (messages texte, boutons interactifs, géolocalisations, audios).
* **Sorties** : Messages WhatsApp formatés (boutons, listes interactives, modèles de messages approuvés).
* **API** : `POST /api/whatsapp/webhook`, `GET /api/whatsapp/webhook` (vérification token).
* **DB** : `whatsapp_sessions`, `whatsapp_processed_messages`, `whatsapp_conversation_log`, `commandes_boutique`.
* **Risques** : Boucle infinie de messages, duplication de commandes sur rejeu de webhook Meta, blocage compte WhatsApp Business si dépassement quotas.
* **Tests nécessaires** : Parcours commande complet via simulation de webhooks, déduplication stricte des messages traités (`whatsapp_processed_messages`), vérification signature HMAC SHA-256.

### MOD-06 : Gestion des Commandes & Panier E-commerce
* **ID** : `MOD-06`
* **Nom** : Pipeline de Commande & Panier Marchand
* **Localisation** : `frontend-next/src/components/cart/DrawerCart.tsx`, `backend/services/commande-service.js`, `backend/routes/comptabilite.js`
* **Responsabilité** : Calcul du total panier, application des frais de livraison (zones fixes, retrait gratuit en boutique, ou frais à convenir), validation des stocks, réservation, génération session de paiement.
* **Dépendances** : Service Wave, Service Orange Money, Service SMS, Service WhatsApp notifications.
* **Entrées** : Identifiant boutique, liste des items (id produit, quantité, variante), coordonnées client, zone de livraison.
* **Sorties** : Commande créée avec statut `en_attente`, lien de paiement Wave/OM ou confirmation retrait, notifications marchand/client.
* **API** : `POST /api/comptabilite/:id/commandes`, `POST /api/boutiques/:id/commandes/express`, `GET /api/comptabilite/:id/commandes/:cmdId`.
* **DB** : `commandes_boutique`, `commandes_boutique_items`, `zones_livraison`.
* **Risques** : Erreur de référence variable (`ReferenceError: commande is not defined`), faux libellé gratuit sur frais à convenir, calcul faussé avec remises.
* **Tests nécessaires** : Création commande panier standard, commande express 1-clic, test des 3 modes de livraison (retrait 0F, zone fixe, frais à convenir).

### MOD-07 : Passerelles de Paiement (Wave, Orange Money, Cash)
* **ID** : `MOD-07`
* **Nom** : Module Paiement & Réconciliation
* **Localisation** : `backend/services/wave.js`, `backend/services/orange-money.js`, `backend/routes/paiement.js`
* **Responsabilité** : Création des sessions de paiement en ligne (checkout Wave, web payment Orange Money), réception des webhooks de notification, mise à jour des statuts de commande et déclenchement des reversements marchands.
* **Dépendances** : API REST Wave, API Orange Money, pool PostgreSQL.
* **Entrées** : Montant en FCFA, référence commande, devise XOF, URLs de retour et d'annulation.
* **Sorties** : URL de redirection paiement, accusé de réception webhook, mise à jour du statut `payee`.
* **API** : `POST /api/paiement/wave/create-checkout`, `POST /api/paiement/wave/webhook`, `POST /api/paiement/orange-money/create`.
* **DB** : `commandes_boutique`, `paiements_inities`, `abonnements`.
* **Risques** : Validation frauduleuse de paiement sans vérification de signature webhook, perte d'argent en cas de double déclenchement, blocage si clé API expirée.
* **Tests nécessaires** : Simulation de webhook de paiement Wave réussi avec signature valide, test de rejet de signature invalide, bascule automatique sur paiement manuel en cas d'indisponibilité API.

### MOD-08 : Sécurité Multi-Tenant & Contrôle d'Accès (Anti-IDOR)
* **ID** : `MOD-08`
* **Nom** : Cloisonnement Multi-Boutiques & Protection IDOR
* **Localisation** : `backend/middlewares/tenantSecurity.js`, `backend/middlewares/tenantSecurityImmo.js`, `backend/middlewares/auth.js`
* **Responsabilité** : Contrôle strict de l'appartenance des boutiques et agences à l'utilisateur authentifié sur chaque endpoint d'API ; journalisation immédiate des tentatives d'accès illicites dans le coffre d'audit.
* **Dépendances** : JWT auth, PostgreSQL `pool`.
* **Entrées** : `req.user.userId`, `req.params.id` ou `req.params.boutiqueId`.
* **Sorties** : Continuation du middleware (`next()`) ou rejet HTTP 403 Forbidden avec code d'erreur strict.
* **API** : Appliqué à l'ensemble des routes sous `/api/boutiques/:id/*`, `/api/comptabilite/:id/*`, `/api/agences/:id/*`.
* **DB** : `boutique_utilisateurs`, `agence_membres`, `security_audit_vault`.
* **Risques** : Faille IDOR permettant à un commerçant A de visualiser ou modifier les commandes, clients ou stocks d'un commerçant B.
* **Tests nécessaires** : Injection croisée de tokens d'un utilisateur B sur les ressources de la boutique A (lecture, modification, suppression) avec vérification de l'alerte dans `security_audit_vault`.

### MOD-09 : Super-Administration & RBAC Opérationnel
* **ID** : `MOD-09`
* **Nom** : Tableau de Bord d'Administration & Gestion des Droits
* **Localisation** : `frontend-next/src/app/admin/(protected)`, `backend/middlewares/admin-rbac.js`, `backend/routes/admin-*.js`
* **Responsabilité** : Pilotage centralisé de la plateforme (41 modules administratifs), surveillance des métriques, modération des contenus (produits, annonces, agences), gestion des litiges, déclenchement des reversements.
* **Dépendances** : Cookie sécurisé `nopalou_admin_jwt`, permissions fines RBAC (`ROLE_PERMISSIONS`).
* **Entrées** : Identifiants administrateur, jeton JWT signé avec scope `nopalou_admin`.
* **Sorties** : Tableaux de bord financiers, exports CSV/Excel, actions de modération.
* **API** : `/api/admin/dashboard`, `/api/admin/produits`, `/api/admin/utilisateurs`, `/api/admin/reversements`.
* **DB** : `admin_utilisateurs`, `admin_audit_logs`, `plans`, `feature_flags`.
* **Risques** : Fuite de données globale si compromission admin, exécution non tracée d'opérations sensibles.
* **Tests nécessaires** : Contrôle des restrictions de permissions par rôle (`finance` ne peut pas modifier les annonces, `moderateur` ne peut pas toucher aux reversements), traçabilité dans `admin_audit_logs`.

### MOD-10 : Moteur de Scraping & Déduplication Produits
* **ID** : `MOD-10`
* **Nom** : Omnisource Scraping & Algorithme de Matching
* **Localisation** : `backend/services/scraper.js`, `backend/services/matching.js`, `backend/lib/scrapingRun.js`
* **Responsabilité** : Extraction automatique des prix et caractéristiques des produits depuis les principales places de marché (Expat-Dakar, Jumia, CoinAfrique, etc.), normalisation des libellés et déduplication/regroupement sous une même fiche produit.
* **Dépendances** : Axios, Cheerio, rotation d'User-Agents, PostgreSQL trigram index (`pg_trgm`).
* **Entrées** : Pages HTML distantes, flux de catégories.
* **Sorties** : Offres insérées/mises à jour dans `offres`, produits maîtres créés ou rattachés, historique de prix.
* **API** : `/api/scraper/lancer`, `/api/scraper/statut`.
* **DB** : `marchands`, `offres`, `produits`, `historique_prix`, `quarantines_log`.
* **Risques** : Blocage IP (403 Cloudflare, 429 Too Many Requests), pollution du catalogue par regroupement erroné (ex: fusion d'un accessoire et d'un smartphone), prix outliers faussant les comparaisons.
* **Tests nécessaires** : Parsing sélecteur CSS sur chaque source, test de l'algorithme de déduplication avec marques génériques, contrôle de mise en quarantaine des offres aberrantes.

### MOD-11 : ERP Immobilier & Gestion Locative
* **ID** : `MOD-11`
* **Nom** : Module Agences Immobilières & Baux
* **Localisation** : `frontend-next/src/app/agence/[slug]`, `backend/routes/agences.js`, `backend/routes/locatif-immo.js`
* **Responsabilité** : Gestion complète pour agences immobilières et bailleurs (portefeuille de biens, mandats, baux de location, échéances de loyers, génération de quittances de loyer PDF, états des lieux et maintenance).
* **Dépendances** : PDFKit (génération de documents légaux), Cloudinary (photos et baux scannés).
* **Entrées** : Fiches biens, identifiants locataires/bailleurs, montants des loyers et charges, relevés de paiement.
* **Sorties** : Baux contractuels, quittances certifiées PDF, alertes d'impayés, bilans financiers d'agence.
* **API** : `/api/agences/:slug/biens`, `/api/locatif-immo/baux`, `/api/locatif-immo/quittance/:id/pdf`.
* **DB** : `agences_immo`, `biens_immo`, `proprietaires_immo`, `baux_immo`, `loyers_echeances`, `factures_immo`.
* **Risques** : Émission de quittance pour un loyer non soldé, accès non autorisé d'un locataire aux baux d'autres locataires.
* **Tests nécessaires** : Cycle de vie complet d'un bail (création, génération de l'échéancier, paiement partiel, paiement total, émission PDF quittance conforme).

### MOD-12 : CRM Prospection Commerciale & Relances
* **ID** : `MOD-12`
* **Nom** : Prospection Intelligente & Crons d'Acquisition
* **Localisation** : `backend/services/prospection.js`, `backend/services/scraper-prospection.js`, `backend/services/cron-relances-prospects.js`
* **Responsabilité** : Découverte et qualification automatique de commerçants locaux sur les annuaires et réseaux sociaux, calcul d'un score de pertinence (`fit_score`), et orchestration de campagnes de relance WhatsApp personnalisées.
* **Dépendances** : WhatsApp Cloud API, cron scheduler Node.js.
* **Entrées** : Données publiques de marchands scrapés (nom, téléphone, catégorie, volume de produits).
* **Sorties** : Leads qualifiés en base, messages de contact envoyés, conversion mesurée vers création de boutique Nopalou.
* **API** : `/api/prospection/leads`, `/api/prospection/campagnes`, `/api/prospection/stats`.
* **DB** : `prospection_leads`, `prospection_campagnes`, `prospection_messages_log`, `prospection_lead_events`.
* **Risques** : Envoi non sollicité répété (spam), violation des règles d'opt-out WhatsApp, désalignement entre statut CRM et message réel.
* **Tests nécessaires** : Calcul du `fit_score`, vérification de la déduplication par numéro normalisé international (`+221...`), arrêt immédiat des relances si mot-clé STOP reçu.

### MOD-13 : SEO & Rendu Métadonnées Sociales
* **ID** : `MOD-13`
* **Nom** : Moteur SEO, Sitemaps & OpenGraph Satori
* **Localisation** : `frontend-next/src/app/sitemap.ts`, `frontend-next/src/app/robots.ts`, `frontend-next/src/app/produit/[id]/opengraph-image.tsx`
* **Responsabilité** : Indexation maximale par les moteurs de recherche, fourniture de sitemaps XML dynamiques, balisage Schema.org JSON-LD (Product, Offer, Store) et génération dynamique d'images OpenGraph pour le partage WhatsApp/Facebook.
* **Dépendances** : Next.js Metadata API, `@vercel/og` / Satori.
* **Entrées** : Fiches produits, catégories, profils boutiques.
* **Sorties** : Sitemaps paginés, métadonnées canonical/robots, bannières PNG générées à la volée.
* **API** : `/sitemap.xml`, `/robots.txt`, `/api/sitemap`.
* **DB** : `produits`, `boutiques`, `categories`, `annonces_immo`.
* **Risques** : Crash Satori ImageResponse ("Image size cannot be determined"), sitemap trop lourd dépassant le quota de 50 000 URL, URLs canoniques erronées.
* **Tests nécessaires** : Validation syntaxique XML du sitemap, génération d'image OpenGraph pour un produit avec photo distante et sans photo, vérification des balises JSON-LD valides.

---

## 3. Matrice d'Intégration et Dépendances Externes

| Service Externe | Protocole / Interface | Rôle dans Nopalou | Fallback / Résilience Prévu |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | TCP / SSL Port 5432 / pool pg | Stockage relationnel principal (140 tables) | Pool de secours, timeouts stricts 30s |
| **Meta WhatsApp Cloud API** | Webhooks HTTPS & Graph REST v18.0 | Conversationnel client, commandes, alertes | SMS fallback via Twilio/Orange, file d'attente |
| **Wave API** | REST API v1 (Checkout & Reversements) | Paiement mobile money instantané | Bascule sur Dépôt Manuel avec reçu |
| **Orange Money** | REST Web Payment API | Paiement mobile money alternatif | Bascule sur Dépôt Manuel |
| **Cloudinary** | HTTPS SDK / Upload API | Stockage médias (photos produits, notes audio) | Stockage temporaire buffer local |
| **Sentry** | HTTPS DSN | Télémétrie d'erreurs et alertes runtime | Masquage de données sensibles (`redactUrl`) |
| **Google Tag Manager** | JS lazyOnload | Statistiques de fréquentation et conversions | Chargement asynchrone non bloquant |
