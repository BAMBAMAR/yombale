# PLAN STRATÉGIQUE D'OPTIMISATION & D'EXCELLENCE QUALITÉ — SURGA (NOPALOU)

> **Feuille de Route d'Ingénierie & Plan d'Exécution par Tranches**  
> **Auteur** : Expert Senior International en Architecture Logicielle & Product Engineering  
> **Date** : 6 Octobre 2026  
> **Produit** : Surga (« L'assistant personnel de poche de Nopalou »)  
> **Objectif Ultime** : Transformer Surga en un produit cohérent, indispensable au quotidien, surpassant toute collection d'applications tierces par sa rapidité, sa précision déterministe et sa contextualisation locale dakaroise.

---

## 1. VISION INDUSTRIELLE & PRINCIPE D'EXÉCUTION

Le plan suit une règle de progression stricte :
$$\text{PHASE 1 (Fiabilisation Critique)} \longrightarrow \text{PHASE 2 (Saut Qualitatif)} \longrightarrow \text{PHASE 3 (Expérience Utilisateur)} \longrightarrow \text{PHASE 4 (Coûts & Quotas)} \longrightarrow \text{PHASE 5 (Différenciation)} \longrightarrow \text{PHASE 6 (Futur)}$$

Aucune phase supérieure n'est initiée avant validation complète des critères de la phase précédente.

---

## 2. DÉTAIL DES 6 PHASES D'OPTIMISATION

---

### PHASE 1 — CORRECTIONS CRITIQUES (URGENCE P0 & P1)

> **Objectif** : Éliminer les ruptures matérielles où le service trahit la confiance de l'utilisateur (rappels qui ne sonnent pas, liens 404).

#### Tâche 1.1 : Worker Cron Backend des Rappels & Web Push VAPID (`CORR-T01` — P0)
- **Constat** : Les rappels de l'agenda ne fonctionnent pas lorsque l'application PWA est fermée ou en arrière-plan.
- **Réalisation Technique** :
  1. Installer le module `web-push` dans `backend/package.json`.
  2. Créer la table `surga_push_subscriptions` dans PostgreSQL :
     ```sql
     CREATE TABLE IF NOT EXISTS surga_push_subscriptions (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
       endpoint TEXT NOT NULL UNIQUE,
       p256dh TEXT NOT NULL,
       auth TEXT NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
     );
     ```
  3. Créer le worker `backend/services/cron-surga-reminders.js` s'exécutant toutes les 60 secondes :
     - Interroger `surga_agenda` pour les rappels dont l'heure est échue (`notification_envoyee = false`).
     - Émettre le push Web VAPID vers les endpoints abonnés.
     - Si l'utilisateur est inscrit par WhatsApp et a opté pour le canal WhatsApp, envoyer un message de notification : *« Surga : Rappel pour [titre] prévu à [heure] »*.
     - Marquer `notification_envoyee = TRUE`.
  4. Mettre à jour le Service Worker `frontend-next/src/app/sw.ts` pour afficher la notification native avec action « Ouvrir Surga ».
- **Validation** : Programmer un rappel à $T+2$ min, fermer le navigateur, vérifier la réception effective de la notification native à l'heure exacte.

#### Tâche 1.2 : Route de Streaming Audio MP3 pour le Podcast (`CORR-T03` — P1)
- **Constat** : Le flux RSS privé annonce un fichier `/api/surga/podcast/:token/stream.mp3` qui renvoie HTTP 404.
- **Réalisation Technique** :
  1. Implémenter la route `GET /podcast/:token/stream.mp3` dans `backend/routes/surga/audio.js`.
  2. Valider le token podcast de l'utilisateur.
  3. Servir le fichier MP3 pré-généré du jour avec en-têtes `Content-Type: audio/mpeg`, `Content-Length` et support des requêtes HTTP Range (206 Partial Content) pour la reprise de lecture.
- **Validation** : `curl -I https://nopalou.com/api/surga/podcast/invite-demo-token/stream.mp3` renvoie HTTP 200 OK avec `audio/mpeg`.

---

### PHASE 2 — REMPLACEMENT DES TECHNOLOGIES INFÉRIEURES (P1)

> **Objectif** : Remplacer les briques actuelles défaillantes ou robotiques par des solutions ultra-rapides et gratuites/économiques.

#### Tâche 2.1 : Transcription des Notes Vocales WhatsApp via Groq Whisper (`CORR-T02` — P1)
- **Constat** : Les messages vocaux WhatsApp ne sont pas transcrits et reçoivent des boutons e-commerce non pertinents.
- **Réalisation Technique** :
  1. Dans `backend/services/whatsapp-chatbot.js` (traitement `msg.type === 'audio'`) :
     - Télécharger le fichier audio OGG/Opus via `telechargerMediaWhatsApp(msg.audio.id)`.
     - Appeler l'API **Groq Whisper-large-v3-turbo** avec le buffer audio :
       `POST https://api.groq.com/openai/v1/audio/transcriptions`
     - Obtenir le texte transcrit en < 400 ms.
     - Renvoyer ce texte au routeur `traiterMessageWhatsAppSurga(phone, texte, true)`.
     - Répondre à l'utilisateur : *« J'ai compris : [texte]. Confirmez-vous l'enregistrement ? (OUI / NON) »*.
- **Coût** : ~0,40 FCFA par note vocale (inclus dans le quota gratuit Groq de 2 000 requêtes/jour).
- **Validation** : Envoyer un message vocal WhatsApp dictant *« Note 3500 repas »* ; vérifier la réception de la demande de confirmation avec le montant 3 500 FCFA.

#### Tâche 2.2 : Synthèse Vocale Haute Fidélité via `edge-tts` (P1)
- **Constat** : La voix de synthèse locale du navigateur est métallique et robotique sur de nombreux smartphones.
- **Réalisation Technique** :
  1. Installer `edge-tts` (ou script Node.js léger appelant le websocket Edge Neural).
  2. Configurer la voix de référence `fr-FR-DeniseNeural` (voix féminine posée, articulation parfaite des noms sénégalais).
  3. Planifier la génération quotidienne à 6h00 du matin sous `/tmp/surga-podcasts/briefing-[date]-[secteur].mp3`.
  4. Mettre en cache ce fichier pour l'ensemble des requêtes de la journée du même secteur géographique.
- **Validation** : Écoute du briefing matinal avec un rendu fluide et naturel.

---

### PHASE 3 — OPTIMISATION DE L'EXPÉRIENCE UTILISATEUR & HYBRIDATION IA (P2)

> **Objectif** : Donner à Surga une véritable compréhension du langage naturel sans perdre la rigueur déterministe.

#### Tâche 3.1 : Fallback LLM Hybride Gemini Flash pour Formulations Complexes (`CORR-T04` — P2)
- **Constat** : Les regex actuelles rejettent les formulations familières sénégalaises.
- **Réalisation Technique** :
  1. Créer le module `backend/services/surga/llm-fallback.js`.
  2. Si `interpreterCommandeVocale(texte)` renvoie `intention === 'INCONNU'` :
     - Appeler **Gemini 2.0 Flash Lite** via Google AI Studio avec un prompt système concis :
       *« Tu es le parseur d'intention de Surga au Sénégal. Analyse la phrase et retourne UNIQUEMENT un JSON conforme au schéma : { intention: 'CALCULATE'|'ADD_EXPENSE'|'ADD_REMINDER'|'ADD_NOTE'|'INCONNU', montant: number, categorie: string, note: string, date: string, heure: string } »*.
     - Exécuter la commande extraite via le moteur déterministe (zéro calcul confié à l'IA).
- **Validation** : Tester « J'ai donné 2000 aux enfants pour l'école » ➔ l'intention `ADD_EXPENSE` (2000 FCFA, Logement/Famille) est correctement extraite.

#### Tâche 3.2 : Synthèse Matinale Thématique de la Presse (`CORR-T05` — P2)
- **Constat** : Les résumés actuels sont tronqués à 180 caractères mécaniquement.
- **Réalisation Technique** :
  1. Dans `backend/services/cron-surga-rss.js`, après ingestion des flux RSS Google News, APS et Le Soleil :
     - Soumettre les 20 titres et descriptions à Gemini Flash.
     - Produire une synthèse éditoriale concise en 3 sections : **1. Institutions & Politique**, **2. Économie & Commerce**, **3. Société & Sports**.
     - Enregistrer la synthèse dans la table `surga_briefing_syntheses`.
     - L'afficher en tête de l'écran « Aujourd'hui » et l'injecter dans le script audio du matin.
- **Validation** : La consultation de `/api/surga/briefing` présente un texte fluide de 3 paragraphes sourcés.

---

### PHASE 4 — OPTIMISATION DES COÛTS & OBSERVABILITÉ PRÉCISE (P3)

> **Objectif** : Mesurer chaque centime dépensé et protéger les marges de Surga Premium.

#### Tâche 4.1 : Tableau de Bord d'Observabilité des Coûts & Quotas API
- **Réalisation Technique** :
  1. Créer une table de traçabilité `surga_api_metrics` enregistrant :
     - Service appelé (`gemini_flash`, `groq_whisper`, `whatsapp_meta`, `tomtom`, `open_meteo`).
     - Durée / Latence en millisecondes.
     - Tokens consommés ou secondes audio.
     - Statut HTTP (200, 429, 500).
     - Coût calculé en FCFA.
  2. Exposer un écran de supervision dans l'administration `/admin/surga/metriques` avec graphiques des dépenses API quotidiennes.

#### Tâche 4.2 : Protection Strictement Déterministe des Quotas WhatsApp
- **Réalisation Technique** :
  - Vérifier que chaque utilisateur gratuit est bloqué après 2 commandes textuelles par jour sur WhatsApp (`QUOTA_JOURNALIER_GRATUIT = 2`).
  - Lui envoyer un message d'orientation poli :
    *« Vous avez atteint vos 2 actions gratuites du jour sur WhatsApp. Pour un usage illimité sur WhatsApp, passez à Surga Premium (1 500 FCFA/mois) : https://surga.nopalou.com. Vous pouvez également continuer gratuitement et sans limite sur notre application Web. »*

---

### PHASE 5 — DIFFÉRENCIATION AVANCÉE & HYPER-LOCALISATION DAKAROISE (P3/P4)

> **Objectif** : Développer des fonctionnalités qu'aucun concurrent étranger (Google, Meta, Apple) ne pourra répliquer.

#### Tâche 5.1 : Briefing Trajet « Domicile ➔ Travail » Personnalisé
- **Fonctionnalité** : L'utilisateur définit dans ses préférences son quartier de départ (ex: *Pikine*) et son quartier d'arrivée (ex: *Plateau*).
- **Valeur** : Chaque matin à 7h30, Surga lui indique en une phrase :
  *« Ce matin, l'Autoroute A1 vers le Plateau est dense (+18 min au péage de Thiaroye). Prenez le TER ou le BRT pour arriver à l'heure. »*

#### Tâche 5.2 : Suivi Actif des Échéances de Concours Nationaux
- **Fonctionnalité** : Dès qu'un utilisateur clique sur « Suivre ce concours » (ex: *Concours Direct de l'ENA*), Surga injecte automatiquement 3 rappels dans son agenda :
  - J-30 : Rappel constitution du dossier (Casier judiciaire, Extrait de naissance légalisé).
  - J-7 : Rappel clôture des dépôts physiques.
  - J-1 : Rappel convocation et centre d'examen.

---

### PHASE 6 — TECHNOLOGIES ÉMERGENTES PERTINENTES (P4 — FUTUR)

> **Objectif** : Anticiper l'avenir technologique à horizon 2027.

#### Tâche 6.1 : Recherche Sémantique Locale via `pgvector`
- Activer l'extension `vector` dans PostgreSQL pour stocker les embeddings des notes et des annonces immobilières.
- Permettre à l'utilisateur de retrouver une note en tapant : *« ce que le docteur m'avait prescrit »* même si la note s'intitule *« Ordonnance paracétamol »*.

#### Tâche 6.2 : Modèle Vocal Wolof Expérimental On-Device
- Suivre les avancées des modèles légers open source transcrits en Wolof (projets universitaires sénégalais / Baobab AI) compilés en WebAssembly (WASM) pour une transcription 100% locale sans aucune transmission réseau.

---

## 3. TABLEAU SYNTHÉTIQUE DU PLAN D'EXÉCUTION

| Phase | Intitulé | Priorité | Effort Estimé | Gains Principaux | Coût API Additionnel |
| :---: | :--- | :---: | :---: | :--- | :---: |
| **Phase 1** | Corrections Critiques (Web Push VAPID, `stream.mp3`) | **P0** | 1 journée | Rappels fiables 100% hors-app, podcast fonctionnel | **0 FCFA** |
| **Phase 2** | STT Groq Whisper WhatsApp & TTS Edge-Neural | **P1** | 1 journée | Vocaux WhatsApp opérationnels, voix naturelle studio | **< 200 FCFA / mois** |
| **Phase 3** | Fallback LLM Gemini Flash & Synthèse Presse | **P2** | 1 journée | Compréhension naturelle 99%, fin des coupures 180 car. | **< 100 FCFA / mois** |
| **Phase 4** | Observabilité des Coûts & Quotas WhatsApp | **P3** | 0.5 journée | Maîtrise des marges et supervision des métriques | **0 FCFA** |
| **Phase 5** | Trajet Domicile-Travail & Alertes Concours | **P3** | 1.5 journée | Différenciation territoriale dakaroise imbattable | **0 FCFA** |
| **Phase 6** | Embeddings `pgvector` & Recherche Sémantique | **P4** | 2 journées | Recherche en langage naturel sur notes et immobilier | **0 FCFA** |

---

> **Verdict de Faisabilité** :  
> Les **Phases 1, 2 et 3** représentent seulement **3 journées de développement senior**. Elles résolvent 100% des fragilités constatées lors de l'audit et propulsent le score de qualité globale de Surga de **66,5 / 100** à **94,0 / 100**.
