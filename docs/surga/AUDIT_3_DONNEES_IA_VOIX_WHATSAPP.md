# RAPPORT D'AUDIT 3 — DONNÉES, SOURCES, QUALITÉ, IA, VOIX ET WHATSAPP (SURGA)

> **Document Officiel d'Audit Technique Approfondi**  
> **Auteur** : Agent 3 (Données, Sources, Qualité des Données, IA, Voix, WhatsApp)  
> **Date de réalisation** : 5 Octobre 2026  
> **Branche de travail** : `feature/surga`  
> **Environnement audité** : Windows 11 x64, Node.js v20.18.0 / v24.19.0, PostgreSQL 18.4 (`nopalou_db` connectée), Express 4, Next.js 14.2 App Router  
> **Statut global de l'audit** : **TERMINÉ — PREUVES MATÉRIELLES ÉTABLIES SUR TOUTE LA CHAÎNE**

---

## 1. RÉSUMÉ EXÉCUTIF & FAITS SAILLANTS

L'**Agent 3** a audité de manière empirique et exhaustive l'intégralité de la chaîne de données, des connecteurs externes, du comportement de l'IA, du pipeline vocal et de l'intégration WhatsApp de l'assistant Surga.

Contrairement aux impressions de surface données par la suite de tests unitaires (91/91 Jest, 97/97 Vitest), l'analyse en conditions réelles et l'interrogation directe de PostgreSQL 18.4 et des APIs externes révèlent **trois réalités fondamentales** :

1. **La Déconnexion Persistante de la Base de Données (P0)** : Les quatre services majeurs (`immo-service.js`, `concours-service.js`, `places-service.js`, `trafic-service.js`) importent toujours le chemin erroné `require('../../db')`. En conséquence, les **1 649 annonces immobilières certifiées de Nopalou sont à 100% ignorées**, et le produit sert 3 fausses annonces démo en mémoire. Les tables `surga_concours`, `surga_places` et `surga_trafic_signalements` restent à 0 ligne en base.
2. **Le Mensonge de Persistance WhatsApp (Silent Data Loss - P0)** : Lorsqu'un utilisateur non inscrit préalablement dans la table `utilisateurs` envoie une commande de dépense sur WhatsApp, le bot Surga lui demande confirmation, l'utilisateur répond "OUI", le bot lui répond explicitement *"C'est enregistré. Dépense de X FCFA ajoutée..."*, puis supprime la session. **En réalité, aucune ligne n'est insérée en base de données**. L'utilisateur est trompé par une fausse confirmation de succès.
3. **La Démythification Totale de l'IA & Rupture Vocale WhatsApp (P1)** :
   - Aucun modèle de langage (LLM / Gemini / OpenAI) n'est exécuté dans Surga. Tous les "résumés" et "analyses de langage naturel" sont des heuristiques regex et des découpages de chaînes Cheerio.
   - Les notes vocales WhatsApp (`msg.type === 'audio'`) sont **interceptées par le bot e-commerce de Nopalou** qui répond avec des boutons de boutiques marchandes (`🏪 Nos Boutiques`, `📦 Mes Commandes`). Aucun service de transcription (STT) n'est câblé.
   - La langue wolof n'est absolument pas supportée (0% d'implémentation).

---

## 2. CARTOGRAPHIE DES FLUX DE DONNÉES SURGA

| Brique / Donnée | Source Primaire | Mécanisme de Récupération | Transformation / Normalisation | Stockage Persistant | Moteur Déterministe vs IA | Mode d'Affichage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Actualités Générales** | Flux RSS (APS, Le Soleil, Google News) | HTTP GET via Axios (timeout 5s) | Cheerio XML parse, regex rubriques, troncature 180 car. | Table `surga_briefing_items` (PostgreSQL) | Déterministe (Regex) | Cartes défilement Aujourd'hui & Revue de presse |
| **Kiosque des Unes** | Fichiers JPG locaux quotidiens | Système de fichiers `/public/surga/unes/` | Association titre/description | Table `surga_unes_presse` (PostgreSQL) | Déterministe | Grille responsive avec Lightbox plein écran |
| **Scores & Matchs** | Événements sportifs sénégalais | `SPORT_EVENEMENTS_DEFAUT` | Formatage date UTC et statut | Table `surga_sport_events` (PostgreSQL) | Déterministe | Cartes score dans le briefing matinal |
| **Trafic Dakar** | TomTom Traffic API + Heures de pointe | HTTPS Routing API (coordonnées GPS) | Vitesse réelle km/h, temps de parcours, niveau fluide/dense/bouché | Cache mémoire TTL 6m + fallback heuristique | Déterministe heuristique | Modal Trafic avec badge temps réel et corridor |
| **Immobilier Dakar** | Table Nopalou `annonces_immo` | SQL via pool DB | `conditionImmoPubliable('ai')`, filtrage par quartier | Table `annonces_immo` (1 649 biens) | Déterministe (Mocks démo actifs à tort) | Modal Immo avec badge vérifié et contact WhatsApp |
| **Concours État** | Calendriers officiels Ministères | Manuel via Admin `/admin/surga` | Décompte J-30 / J-7 / J-1, checklist dossier | Table `surga_concours` (PostgreSQL) | Déterministe | Fiches concours avec programmation agenda |
| **Bonnes Adresses** | Catalogue adresses dakaroises | Manuel via Admin `/admin/surga` | Détection d'ambiance, budget max, quartier | Table `surga_places` (PostgreSQL) | Déterministe | Cartes avec avis 3 lignes et contact direct |
| **Radios en Direct** | Flux Icecast/Shoutcast FM | Streaming HTTP audio direct | Proxy relais backend Express pour HTTPS | Pas de stockage (Flux continu) | Déterministe | Lecteur audio persistant avec bouton arrêt direct |
| **Dépenses FCFA** | Saisie utilisateur (Voix, WA, Manuel) | Web Speech API, WhatsApp Webhook, Clavier | Normalisation chiffres, calculatrice arithmétique | Table `surga_depenses` + `localStorage` | Moteur déterministe `calculator.js` | Graphiques dépenses, jauge budget, historique |
| **Notes & Mémos** | Dictée vocale ou saisie texte | Web Speech API, WhatsApp Webhook, Clavier | Nettoyage texte, extraction titre | Table `surga_notes` + `localStorage` | Déterministe | Liste de notes avec recherche instantanée |
| **Agenda & Rappels** | Dictée vocale, WhatsApp, Concours | Formulaire ou commande vocale | Parsing horaire (`14h30`), date ISO | Table `surga_agenda` + Service Worker | Déterministe | Timeline des événements et rappels locaux |
| **Abonnements** | Paiement Wave / Orange Money | API Wave / OM (SDK) | Génération référence `SURGA-PLAN-...` | Table `surga_abonnements` | Déterministe | Statut Premium avec déblocage des quotas |

---

## 3. QUALITÉ DES DONNÉES & ANALYSE DES SOURCES

### 3.1 Presse et Actualités : 4 Flux Brisés sur 6
Lors du test direct des 9 URLs de `SOURCES_DEFAUT`, 159 articles réels ont été récupérés, mais une fragilité critique a été prouvée :
- **APS (`https://aps.sn/feed/`)** : 100% fonctionnel (10 articles récents du 5 octobre 2026, récupérés en 407 ms).
- **Le Soleil (`https://lesoleil.sn/feed/`)** : 100% fonctionnel (24 articles récents, récupérés en 1 059 ms).
- **Google News Sénégal (Éco, Tech, Institutions)** : 100% fonctionnel (125 articles récents au total).
- **Dakaractu (`https://www.dakaractu.com/feed`)** : **Échec permanent HTTP 404** (l'URL du feed n'existe plus).
- **Seneweb (`https://www.seneweb.com/news/rss.xml`)** : **Échec permanent HTTP 404**.
- **Le Quotidien (`https://lequotidien.sn/feed/`)** : **Échec permanent HTTP 403 Forbidden** (blocage pare-feu / Cloudflare sur User-Agent).
- **Sud Quotidien (`https://www.sudquotidien.sn/feed/`)** : **Échec permanent DNS (`getaddrinfo ENOTFOUND`)**.

> **Impact** : Plus de 40% des requêtes d'ingestion lèvent des exceptions réseau et rallongent la collecte de plusieurs secondes. De plus, comme aucun cron n'appelle `collecterTousLesFlux()` en tâche de fond, la table en production reste vide jusqu'au premier appel manuel.

### 3.2 Falsification Dynamique des Dates sur les Données de Secours
L'audit confirme formellement la réintroduction de l'anomalie `AUD-096` de Nopalou :
- Dans `backend/services/surga/rss-collector.js` (lignes 85-121) : Si aucun article n'est disponible en base, le système renvoie `ITEMS_SECOURS` dont la date de publication est générée dynamiquement à la volée : `published_at: new Date().toISOString()`.
- Dans `backend/services/surga/kiosque-service.js` (lignes 70 et 103) : Les Unes de presse d'archives (datant d'août et septembre 2026) sont injectées en base ou renvoyées avec `CURRENT_DATE`.
- **Règle violée** : Décision d'architecture `D21` interdisant formellement de maquiller des archives en actualités fraîches.

### 3.3 Immobilier : 1 649 Annonces Ignorées au Profit de 3 Mocks
- La base de données PostgreSQL contient **1 649 annonces réelles** dans la table `annonces_immo`.
- Dans `backend/services/surga/immo-service.js`, la ligne 8 fait :
  ```javascript
  let pool = null;
  try { pool = require('../../db'); } catch {}
  ```
  Le module `../../db` n'existe pas. L'instruction lève une erreur `MODULE_NOT_FOUND`, captée par le bloc `catch` vide. `pool` reste `null`.
- La fonction `rechercherBiens()` bascule directement sur `BIENS_DEMO` (3 biens fictifs avec photos Unsplash).
- **Couverture réelle des annonces Nopalou** : **0,18 % (3 / 1649)**.

---

## 4. AUDIT DE L'IA : RÔLE, LIMITES ET DÉMYTHIFICATION

### 4.1 Absence Totale de Modèle d'IA Générative dans Surga
Une analyse exhaustive du code source backend et frontend prouve que **Surga n'appelle aucun modèle de fondation (Gemini, Claude, GPT, Mistral)** pour ses opérations.
- **Résumés de presse** : Simple troncature mécanique à 180 caractères du texte fourni par les flux RSS (`nettoyerResume`).
- **Analyse du langage naturel (Immo, Adresses)** : Fonctions procédurales basées sur des conditions `t.includes('studio')`, `t.includes('almadies')`, `t.match(/(\d+)\s*k/)`.
- **Classification de dépenses** : Regex par mots-clés (`devinerCategorie`).
- **Évaluation des risques d'hallucination** : **0 % d'hallucination**, car aucune donnée n'est générée par un modèle probabiliste. En revanche, le risque est un **défaut d'exhaustivité et de flexibilité** : toute formulation orale ou écrite qui ne correspond pas exactement aux dictionnaires codés en dur est classée en `INCONNU` ou `Autre`.

---

## 5. AUDIT DE LA VOIX : DU MICRO À LA PERSISTANCE

### 5.1 Chaîne Vocale Web (Application PWA)
La chaîne vocale de l'application Web est articulée autour de `SurgaVoiceModal.tsx` et `surga-voice.ts` :
1. **Transcription** : Exécutée par la Web Speech API native du navigateur client (`webkitSpeechRecognition`).
2. **Langue** : Paramètre codé en dur `instance.lang = 'fr-FR'`. **Le Wolof n'est pas supporté**.
3. **Normalisation orale** : Moteur regex performant pour convertir les expressions françaises en chiffres (`"deux mille cinq cents"` ➔ `2500`, `"divisé par"` ➔ `/`).
4. **Calculatrice vocale** : « Calcule 100 divisé par 3 » ➔ Exécuté immédiatement de manière déterministe avec affichage exact de `33.33`. Aucune modale de confirmation n'est demandée (comportement conforme).
5. **Dépense & Note vocale** : « Note 2 500 de taxi » ➔ Détection conforme (`ADD_EXPENSE`, 2500 FCFA, Transport). Déclenchement obligatoire de `SurgaVoiceConfirmation.tsx`. L'enregistrement n'a lieu que si l'utilisateur clique sur "Valider".
6. **Bug d'extraction de paramètre constaté** : Sur la phrase « Note deux mille cinq cents FCFA de taxi », le montant est bien extrait (2500), mais le libellé de la note enregistré en base est `"deux mille cinq cents taxi"`, car le remplacement regex cherchait `"2500"` dans le texte brut d'origine non normalisé.
7. **Service Backend Orphelin (`voice-interpreter.js`)** : Le fichier backend de 204 lignes n'est relié à aucune route Express. Seul le code TypeScript frontend est exécuté.

---

## 6. AUDIT WHATSAPP : DU WEBHOOK À LA PERSISTANCE

### 6.1 Rupture Totale sur les Notes Vocales WhatsApp (`SURGA-005` / `LEC-06`)
Le test du webhook entrant sur `backend/services/whatsapp-chatbot.js` révèle une rupture absolue :
- Lorsqu'un utilisateur envoie un message audio WhatsApp (`msg.type === 'audio'`), le code l'intercepte aux lignes 2268-2346 **avant même d'atteindre le routeur Surga** (situé ligne 2661).
- Le bot Nopalou répond avec un menu e-commerce :
  ```text
  🎙️ Note vocale reçue — Jërëjëf !
  Si votre note vocale concerne une commande, le commerçant écoutera directement vos consignes.
  [🏪 Nos Boutiques] [📦 Mes Commandes] [🌐 Menu Principal]
  ```
- **Constat** : Aucun moteur Speech-to-Text (Whisper, Gemini Audio) n'est connecté. La promesse de dicter ses dépenses ou notes par message vocal WhatsApp est inexistante.

### 6.2 Perte Silencieuse de Données sur les Utilisateurs Inconnus (Faille Critique P0)
Dans `backend/services/surga/whatsapp-handler.js` (lignes 241-285) :
1. Lorsqu'un message textuel arrive d'un numéro WhatsApp, le bot cherche l'utilisateur dans la table `utilisateurs` via `trouverUserIdParTelephone(normPh)`.
2. Si le numéro n'est pas encore inscrit sur Nopalou, `userId` vaut `null`.
3. L'utilisateur dicte sa dépense, le bot lui demande de confirmer par OUI ou NON.
4. L'utilisateur répond "OUI". Le code exécute :
   ```javascript
   if (userId) {
     await pool.query('INSERT INTO surga_depenses ...', [userId, montant, categorie, note]);
   }
   await sendWhatsAppText(normPh, `Surga : C'est enregistré. Dépense de ${formaterFCFA(montant)} ajoutée...`);
   await pool.query('DELETE FROM surga_whatsapp_sessions WHERE phone = $1', [normPh]);
   ```
5. **Preuve matérielle constatée lors du test réel** : Comme `userId` est `null`, la requête `INSERT` n'est pas exécutée. Le bot confirme que c'est enregistré, supprime la session d'attente, mais **aucune ligne n'est enregistrée en base**. L'utilisateur perd définitivement sa saisie sans le savoir.

---

## 7. REGISTRE COMPLET DES ANOMALIES (FORMAT OBLIGATOIRE § 34)

### ANOMALIE 1 : Perte Silencieuse des Données WhatsApp sur Utilisateurs Non Inscrits
- **ID** : `ANOM-A3-01`
- **Domaine** : WhatsApp / Données
- **Fonction** : Enregistrement de dépenses, notes et rappels via WhatsApp (`traiterMessageWhatsAppSurga`)
- **Fait observé** : Le bot WhatsApp renvoie une confirmation de succès alors qu'aucune ligne n'est insérée en base si le numéro de téléphone n'est pas pré-existant dans `utilisateurs`.
- **Preuve** : Exécution du script `test_wa_flow.js` : Dépenses insérées = 0, message reçu = "Surga : C'est enregistré", session supprimée.
- **Scénario de reproduction** :
  1. Envoyer un message WhatsApp depuis un numéro non inscrit : « Note 3500 repas ».
  2. Le bot demande la confirmation OUI/NON.
  3. Répondre « OUI ».
  4. Vérifier la table `surga_depenses` : 0 ligne insérée.
- **Cause démontrée** : Condition `if (userId)` dans `whatsapp-handler.js` sans bloc `else` et sans provisionnement automatique de compte, suivie d'un message inconditionnel de succès.
- **Impact** : Perte silencieuse de données financières et déception critique de l'utilisateur.
- **Sévérité** : **CRITIQUE**
- **Priorité** : **P0**
- **Correction proposée** : Auto-provisionner un compte utilisateur avec mot de passe temporaire et téléphone lié (comme le fait l'OTP WhatsApp Nopalou), ou bloquer explicitement avec un message invitant à lier son compte.
- **Fichiers concernés** : `backend/services/surga/whatsapp-handler.js` (lignes 241-285).

---

### ANOMALIE 2 : Déconnexion Silencieuse de la Base sur 4 Services Métier
- **ID** : `ANOM-A3-02`
- **Domaine** : Données / Architecture
- **Fonction** : Services Immobilier, Concours, Bonnes Adresses et Trafic
- **Fait observé** : Les 4 services tournent en permanence sur des mocks mémoire statiques et ignorent la base de données. 1 649 annonces réelles sont masquées.
- **Preuve** : Recherche grep globale : `pool = require('../../db')` dans les 4 fichiers. Le fichier `backend/db.js` n'existe pas.
- **Scénario de reproduction** : Appeler `GET /api/surga/immo/recherche` : seuls les 3 biens de `BIENS_DEMO` sont retournés, jamais les 1 649 annonces de `annonces_immo`.
- **Cause démontrée** : Erreur de chemin d'importation masquée par un bloc `catch {}` vide.
- **Impact** : 99,82% des données réelles immobilières indisponibles ; modifications admin inopérantes.
- **Sévérité** : **CRITIQUE**
- **Priorité** : **P0**
- **Correction proposée** : Remplacer `require('../../db')` par `const { pool } = require('../../models/db')`.
- **Fichiers concernés** :
  - `backend/services/surga/immo-service.js` (l. 8)
  - `backend/services/surga/concours-service.js` (l. 7)
  - `backend/services/surga/places-service.js` (l. 8)
  - `backend/services/surga/trafic-service.js` (l. 10)

---

### ANOMALIE 3 : Interception et Abandon des Notes Vocales WhatsApp par le Bot Nopalou
- **ID** : `ANOM-A3-03`
- **Domaine** : Voix / WhatsApp
- **Fonction** : Transcription et traitement des notes vocales WhatsApp
- **Fait observé** : L'envoi d'un vocal sur WhatsApp reçoit des boutons de commande e-commerce de marchandises et aucun traitement Surga n'est initié.
- **Preuve** : Lignes 2268-2346 de `backend/services/whatsapp-chatbot.js` : traitement direct du type `'audio'` avec `return` avant l'évaluation de Surga (ligne 2661).
- **Scénario de reproduction** : Envoyer un message vocal sur le numéro WhatsApp officiel du bot.
- **Cause démontrée** : Absence de routage audio vers Surga et absence complète de connecteur Speech-to-Text (Whisper / Gemini Speech).
- **Impact** : Promesse centrale du produit (« assistant de poche vocal sur WhatsApp ») rompue.
- **Sévérité** : **MAJEURE**
- **Priorité** : **P1**
- **Correction proposée** : Déplacer l'aiguillage Surga en amont du traitement audio dans `whatsapp-chatbot.js`, intégrer un appel STT (Whisper API ou Gemini Speech) et répondre honnêtement si l'audio n'a pas pu être transcrit.
- **Fichiers concernés** : `backend/services/whatsapp-chatbot.js`, `backend/services/surga/whatsapp-handler.js`.

---

### ANOMALIE 4 : Absence de Cron d'Ingestion RSS et Falsification des Horodatages
- **ID** : `ANOM-A3-04`
- **Domaine** : Sources / Qualité des données
- **Fonction** : Ingestion quotidienne de la presse et fraîcheur des actualités
- **Fait observé** : `surga_briefing_items` reste vide jusqu'à action manuelle ; les articles de secours génèrent de fausses dates actuelles avec `new Date()`.
- **Preuve** : Exécution du test DB initial : 0 ligne dans `surga_briefing_items`. Test de collecte : 159 articles récupérés. Lignes 85-121 de `rss-collector.js` générant `new Date().toISOString()`.
- **Scénario de reproduction** : Démarrer un serveur neuf et consulter `/api/surga/briefing` : les articles renvoyés ont pour date l'heure exacte de la requête alors qu'ils sont rédigés depuis plusieurs mois.
- **Cause démontrée** : Aucun cron `node-cron` planifié pour appeler `collecterTousLesFlux()` dans `backend/app.js` ; utilisation de `new Date()` dans `ITEMS_SECOURS`.
- **Impact** : Tromperie de l'utilisateur sur la fraîcheur de l'information (violation D21 / réplique AUD-096).
- **Sévérité** : **MAJEURE**
- **Priorité** : **P1**
- **Correction proposée** : Ajouter un cron d'ingestion toutes les 30 minutes dans `backend/app.js` et figer des dates immuables historiques sur les données de secours avec avertissement UI « Mode archive locale ».
- **Fichiers concernés** : `backend/app.js`, `backend/services/surga/rss-collector.js`.

---

### ANOMALIE 5 : Service Vocal Backend Orphelin (`voice-interpreter.js`)
- **ID** : `ANOM-A3-05`
- **Domaine** : Voix / Architecture
- **Fonction** : Interprétation vocale centralisée côté serveur
- **Fait observé** : Le fichier `backend/services/surga/voice-interpreter.js` (204 lignes) n'est importé nulle part dans le serveur Express.
- **Preuve** : Recherche grep globale : aucune occurrence dans `backend/routes/`.
- **Scénario de reproduction** : Tenter d'appeler l'API de reconnaissance vocale backend : aucune route n'existe.
- **Cause démontrée** : Omission de création de la route `POST /api/surga/audio/interpret` dans `backend/routes/surga/audio.js`.
- **Impact** : Duplication de code entre le client et le serveur, impossibilité pour un client tiers ou WhatsApp de réutiliser le parseur vocal.
- **Sévérité** : **MOYENNE**
- **Priorité** : **P1**
- **Correction proposée** : Créer et exporter l'endpoint dans `backend/routes/surga/audio.js`.
- **Fichiers concernés** : `backend/routes/surga/audio.js`, `backend/services/surga/voice-interpreter.js`.

---

### ANOMALIE 6 : Pollution du Libellé des Dépenses Dictées avec Nombres en Lettres
- **ID** : `ANOM-A3-06`
- **Domaine** : Voix / Données
- **Fonction** : Extraction des paramètres de dépense vocale (`interpreterCommandeVocale`)
- **Fait observé** : Sur la phrase « Note deux mille cinq cents FCFA de taxi », le libellé enregistré est `"deux mille cinq cents taxi"` au lieu de `"taxi"`.
- **Preuve** : Résultat du test `test_calc_voice.js` : `Note: "deux mille cinq cents   taxi"`.
- **Scénario de reproduction** : Dicter une dépense avec un montant en lettres françaises.
- **Cause démontrée** : Dans `surga-voice.ts` (l. 140) et `voice-interpreter.js` (l. 126), le code retire `matchMontant[1]` (qui vaut `"2500"`) de `texteBrut` (qui contient `"deux mille cinq cents"`). Le remplacement échoue et les mots nombres restent dans le libellé.
- **Impact** : Données polluées dans le carnet de dépenses de l'utilisateur.
- **Sévérité** : **MOYENNE**
- **Priorité** : **P2**
- **Correction proposée** : Nettoyer le libellé à partir de `texteNorm` (où les nombres ont été normalisés en chiffres) plutôt qu'à partir de `texteBrut`.
- **Fichiers concernés** : `frontend-next/src/lib/surga-voice.ts`, `backend/services/surga/voice-interpreter.js`.

---

## 8. RÉPONSES FACTUELLES AUX 16 QUESTIONS FINALES (§ 39)

1. **Les données utilisées par Surga sont-elles fiables ?**  
   *Réponse factuelle* : **Non, pas dans l'état actuel**. Les calculs mathématiques sont fiables à 100%, mais les données immobilières (1 649 annonces) sont masquées au profit de 3 fiches fictives, les flux RSS souffrent de 4 sources mortes sur 9, et les données de concours et adresses sont figées en mémoire sans synchronisation DB.

2. **Les sources sont-elles réellement traçables ?**  
   *Réponse factuelle* : **Partiellement**. Lorsque l'ingestion RSS réussit, les articles conservent leur URL canonique d'origine (APS, Le Soleil). En revanche, les articles de secours utilisent des URLs fictives, et les avis des bonnes adresses sont des synthèses manuelles non reliées à des profils Google Maps vérifiables.

3. **Les données sont-elles suffisamment fraîches ?**  
   *Réponse factuelle* : **Non par défaut**. Sans cron d'ingestion actif dans `backend/app.js`, la table d'actualités reste vide et sert des articles d'archives déguisés en actualités fraîches par `new Date()`. Le trafic TomTom est en revanche très frais (< 6 min de cache).

4. **La couverture est-elle suffisante ?**  
   *Réponse factuelle* : **Non**. 4 des principaux journaux sénégalais (Dakaractu, Seneweb, Le Quotidien, Sud Quotidien) sont inaccessibles. Le pôle immobilier ne couvre que 0,18% du catalogue réel.

5. **Existe-t-il des pertes silencieuses ?**  
   *Réponse factuelle* : **Oui, critique**. Sur WhatsApp, toute dépense, note ou rappel confirmé par un utilisateur dont le numéro n'est pas déjà dans `utilisateurs` est abandonné sans enregistrement SQL, tout en recevant un message WhatsApp affirmant le succès de l'opération.

6. **Les doublons sont-ils maîtrisés ?**  
   *Réponse factuelle* : **Oui sur le stockage RSS**, grâce à la contrainte d'unicité `ON CONFLICT (url) DO NOTHING` (0 doublon sur 159 articles testés). Sur WhatsApp, le risque de double écriture existe en cas de double clic rapide sur "OUI" (absence de transaction SQL isolée).

7. **L'IA invente-t-elle des informations dans certains scénarios ?**  
   *Réponse factuelle* : **Non**. Il n'y a aucun modèle génératif ou LLM dans Surga. Le système n'hallucine pas ; en revanche, le code injecte délibérément de fausses données d'horodatage (`new Date()`) sur des flux de secours statiques.

8. **Les résumés sont-ils fidèles aux sources ?**  
   *Réponse factuelle* : **Oui**. Le résumé est un extrait brut tronqué par Cheerio à 180 caractères issu de la balise `<description>` de l'article source. Aucun fait n'est déformé.

9. **Les calculs sont-ils réellement déterministes ?**  
   *Réponse factuelle* : **Oui, à 100%**. `evaluerCalcul` de `calculator.js` n'utilise ni `eval`, ni appel LLM, gère parfaitement la priorité des opérateurs, les pourcentages et la division par zéro (`100 divisé par 3` = `33.33`).

10. **La voix fonctionne-t-elle de bout en bout ?**  
    *Réponse factuelle* : **Dans l'application Web : OUI** (Web Speech API + modale confirmation + stockage local et API). **Sur WhatsApp : NON (Échec total)** car les vocaux sont détournés par le bot e-commerce de Nopalou.

11. **Les commandes vocales remplissent-elles réellement les données attendues ?**  
    *Réponse factuelle* : **Oui en français standard**, avec une scorie sur les nombres en lettres polluant le libellé de la note. En wolof, le taux de reconnaissance est de 0%.

12. **WhatsApp exécute-t-il réellement les actions demandées ?**  
    *Réponse factuelle* : **Uniquement pour les utilisateurs déjà inscrits**. Pour les autres, l'action est ignorée. Les notes vocales ne sont jamais exécutées.

13. **Les actions WhatsApp sont-elles persistées ?**  
    *Réponse factuelle* : **Oui pour les utilisateurs existants** (vérifié en base PostgreSQL pour les dépenses), **Non pour les utilisateurs inconnus**.

14. **Les doublons et retries sont-ils maîtrisés ?**  
    *Réponse factuelle* : **Oui au niveau transport Meta** (`whatsapp_processed_messages`), mais **incomplet au niveau applicatif** lors de la confirmation d'écriture.

15. **Quelles faiblesses reproduisent des erreurs déjà rencontrées sur Nopalou ?**  
    *Réponse factuelle* :
    - Falsification des dates sur les flux en panne (`AUD-096` / `LEC-08`).
    - Capture et boutons e-commerce sur les vocaux WhatsApp (`AUD-201` / `LEC-06`).
    - Déconnexion silencieuse de la DB par catch vide sur mauvais chemin (`AUD-017` / `LEC-03`).
    - Perte silencieuse de données utilisateur sans validation d'auth (`AUD-132` / `LEC-01`).

16. **Quelles corrections sont indispensables avant l'Agent 4 ?**  
    *Réponse factuelle* :
    - **P0** : Corriger le chemin du pool DB `../../models/db` dans `immo-service`, `concours-service`, `places-service`, `trafic-service`.
    - **P0** : Sécuriser la persistance WhatsApp (créer le compte utilisateur ou bloquer l'écriture sans fausse confirmation).
    - **P1** : Planifier le cron d'ingestion des flux RSS dans `backend/app.js` et corriger les URLs de flux 404/403.
    - **P1** : Router les audios WhatsApp vers Surga ou renvoyer un message honnête sans boutons marketplace.
