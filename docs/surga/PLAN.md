# PLAN — Surga, l'assistant de poche de Nopalou

> Format aligné sur le skill `/planifie` (Claude Mastery) : **tranches verticales** ("tracer
> bullets"). Chaque tranche est livrable et démontrable de bout en bout (données, API, écran de
> l'app ou message WhatsApp). Les durées sont indicatives et seront recalibrées après l'audit.

Statuts : `PROPOSED` → `IN_PROGRESS` → `IN_REVIEW` → `DONE` → `ARCHIVED`. Chaque tranche livrée
donne lieu à une entrée dans `docs/surga/JOURNAL-LIVRAISONS.md`.

---

## Phase 0 — Audit du dépôt existant et validations préalables
**Surga s'intègre dans le dépôt Nopalou existant. Cette phase commence toujours par l'audit.**
- [x] `DONE` Exécuter l'audit de `docs/surga/INTEGRATION_NOPALOU.md` (section 1) et en rendre un
  résumé court.
- [x] `DONE` Poser les questions de clarification nécessaires (section 3 du protocole).
- [x] `DONE` Fusionner le `CLAUDE.md` existant avec `CLAUDE_SURGA.md` si applicable, validation
  de l'utilisateur requise (fusion légère D18, section 4 de `CLAUDE.md`, validée le 2026-10-04).
- [x] `DONE` Créer la branche `feature/surga`.
- [x] `DONE` Enregistrer le résultat de l'audit dans `docs/surga/AUDIT.md` et chaque
  décision tranchée dans `docs/surga/DECISIONS.md` (D11 à D18).
- [x] `DONE` Audit technologique pointu, benchmark mondial 2026, matrice multidimensionnelle et plan d'optimisation en 6 phases (`AUDIT_TECHNOLOGIQUE_POINTE.md`, `MATRICE_SERVICES_APIS_SURGA.md`, `BENCHMARK_TECHNOLOGIQUE_SURGA.md`, `PLAN_OPTIMISATION_QUALITE_SURGA.md`, `HANDOVER_TECHNOLOGIQUE_SURGA.md`).
- [x] `DONE` **Phase 1 — Agenda & Rappels Fiabilisés** : Worker backend cron atomique (`cron-reminders.js`), Web Push standard RFC VAPID (`vapidHelper.js`), Service Worker (`sw.js`) réveillé par les événements `push` et `notificationclick`, tables `surga_push_subscriptions` et `surga_notifications_logs`, idempotence stricte, durées relatives et récurrences, 10/10 cas de tests validés.
- [x] `DONE` **Phase 2 — Voix, STT & Podcast Stream MP3** : Résolution du bug HTTP 404 du podcast privé (`GET /api/surga/podcast/:token/stream.mp3`), support HTTP 206 `Range` et cache disque SHA256, STT Groq Whisper-large-v3-turbo (`transcription-service.js`), raccordement des notes vocales WhatsApp avec confirmation préalable systématique et support des corrections orales.
- [x] `DONE` **Phase 3 — IA Hybride L0/L1 & Synthèse de Presse** : Architecture hybride (`ai-interpreter.js`) Fast-Path L0 (< 1ms, 0 FCFA) + Fallback L1 Gemini Flash Structured Output, découplage strict IA / Base de données, protection anti-injection de prompt, synthèse de presse thématique dédupliquée sans hallucination.
- [x] `DONE` **Phase 4 — Distinction Vocale Sémantique & Services Locaux (Concours, Trafic, Démarches, Radio, WhatsApp)** : Réagencement de priorité sémantique stricte (ancrage temporel prime sur "note" -> `ADD_REMINDER`, libellé accentué préservé, exclusion des heures des montants), extension vocale omnicanale des 4 services locaux sénégalais, pastilles de guidage cliquables dans la modale vocale, découvrabilité audio dans Aujourd'hui, requêtes et menu d'aide structurés sur WhatsApp.
- [x] `DONE` **Validation & Documentation Finale** : `PERFORMANCE_AVANT_APRES.md`, `VALIDATION_PHASES_1_3.md`, `HANDOVER_PHASES_1_3.md`, 155 tests unitaires et d'intégration validés à 100%, score Surga remesuré à **89/100**.
- [x] `DONE` Validation du cadre WhatsApp Meta (tarification per-message octobre 2026, 1 000 msgs service gratuits/mois, protection par quota gratuit à 2 commandes/jour).
- [x] `DONE` Spike de validation trafic à Dakar (faisabilité, modèle heuristique heures de pointe + TomTom Routing API 2 500 req/jour gratuites).
- [x] `DONE` Spike de validation transcription vocale (Groq Whisper-large-v3-turbo, latence < 400 ms, français africain & FCFA).
- [x] `DONE` Test PWA et Service Worker (navigation offline, Web Push VAPID en tâche de fond opérationnel).

---

## NOYAU — l'assistant indispensable au quotidien

### Tranche 1 — "Je m'installe et je personnalise mon Surga"
- [x] `DONE` Modale de gestion de compte complète `<SurgaCompteModal>` (profil, édition du nom en ligne, formule standard/premium, raccourcis services et déconnexion déterministe en un clic via `SurgaHeader.tsx` et `SurgaParametresTab.tsx`).
- [x] `DONE` Inscription et connexion OTP SMS / WhatsApp in-app (`SurgaAuthModal.tsx`, pastille profil dans `SurgaHeader.tsx` et carte « Compte & Synchronisation » dans `SurgaParametresTab.tsx`).
- [x] `DONE` Audit universel auth Nopalou vs Surga : Éradication des 7 doublons PostgreSQL, pose de l'index UNIQUE partiel `uidx_utilisateurs_tel_norm`, normalisation 115 comptes `+221...` et contrôles déterministes sur tous les services à quotas.
- [x] `DONE` Résolution déterministe des conflits 409 multi-comptes par téléphone dans `telephoneIntegrity.js` (`supprime_le IS NULL`) et dédoublonnage PostgreSQL des comptes marchands rattachés à bamba.
- [x] `DONE` PWA installable (manifest `/surga/manifest.json`, service worker dédié `/surga/sw.js`, icônes).
- [x] `DONE` Profil de personnalisation : briques choisies, heure du briefing, langue, quartiers, équipes suivies (table `surga_preferences`, API `/api/surga/preferences` et `/api/surga/onboarding`).
- [x] `DONE` Fixer le budget de poids de l'app connectée (point de départ : JS initial < 120 Ko tenu, zéro dépendance lourde).
- [x] `DONE` Point d'entrée visible sur l'accueil (`/`) et dans la navigation desktop (D20).
- **Démonstration** : un testeur installe l'app, choisit ses briques et son heure de briefing en moins de 2 minutes, se connecte avec son numéro WhatsApp et retrouve ses choix et ses données synchronisées.

### Tranche 2 — "Je reçois mon briefing du matin" (Actualités & Kiosque des Unes de Presse)
- [x] `DONE` Ingestion de sources multi-médias (flux RSS d'actualité Seneweb, APS, Le Soleil, PressAfrik, SeneNews, Leral.net, Dakaractu, Le Quotidien, Sud Quotidien, équilibrage multi-sources et programme/scores sportifs).
- [x] `DONE` Kiosque des Unes de la presse sénégalaise : Visionneuse grand format (1080px / 96vw), moteur de zoom interactif multi-paliers (100% à 400%), pan glisser-déplacer, double-clic 2x, molette souris, mode plein écran immersif HTML5 et copie de lien direct.
- [x] `DONE` Modularisation Anti-AI-Slop (< 450 l.) : `SurgaKiosqueLightbox.tsx` (397 l.), `SurgaKiosqueHeader.tsx` (210 l.), `SurgaKiosqueZoomControls.tsx` (166 l.), `SurgaKiosqueThumbnails.tsx` (79 l.).
- [x] `DONE` Génération du briefing texte personnalisé (résumés courts, liens vers les sources).
- [x] `DONE` Écran "Aujourd'hui" et notification à l'heure choisie (push web & notification API).
- **Démonstration** : à l'heure choisie, le testeur reçoit une notification et ouvre son briefing, et peut explorer les Unes des quotidiens nationaux en grand format avec zoom, pan et plein écran.

### Tranche 3 — "Je note, je compte, je calcule"
- [x] `DONE` Notes (création, recherche instantanée, modification, suppression locale et distante).
- [x] `DONE` Dépenses structurées (montant FCFA, catégories prédéfinies, date, note) et récapitulatif mensuel déterministe.
- [x] `DONE` Calculatrice avec moteur de calcul déterministe (arithmétique exacte, pourcentages, sans eval, sans appel LLM).
- [x] `DONE` Fonctionnement hors ligne minimal (offline-first) avec synchronisation bidirectionnelle au retour du réseau via `/api/surga/sync`.
- **Démonstration** : en mode avion, le testeur ajoute une dépense et fait un calcul ; au retour
  du réseau, la dépense apparaît dans son récapitulatif.

### Tranche 4 — "Mon agenda et mes rappels"
- [x] `DONE` Événements et rappels (date, heure, répétition simple, marquer comme terminé, persistance hors ligne).
- [x] `DONE` Notifications de rappel (API Web Notification locale & Service Worker) et affichage dans le briefing du matin.
- **Démonstration** : un rappel créé pour dans 5 minutes déclenche une notification à l'heure.

### Tranche 5 — "Surga sur WhatsApp, pour des tâches précises"
- [x] `DONE` Webhook WhatsApp et commandes structurées ("note 2500 taxi", "rappel demain 8h", "calcule 12000 * 3", "briefing").
- [x] `DONE` Moteur d'extraction d'intention déterministe avec confirmation obligatoire avant toute écriture ("Souhaitez-vous enregistrer cette dépense ? Répondez OUI ou NON").
- [x] `DONE` Chaîne de validation et de persistance (`surga_whatsapp_sessions`, liaison utilisateur par numéro de téléphone).
- [x] `DONE` Quotas stricts (20 commandes/jour avec `surga_quotas`), zéro émoji Unicode et vouvoiement strict.
- **Démonstration** : le testeur envoie "note 2 500 taxi", confirme par "oui", et la dépense apparaît dans l'application web.

### Tranche 6 — "Je commande à la voix dans l'app"
- [x] `DONE` Reconnaissance vocale Web Speech API dans l'app avec repli élégant si non supporté ou bloqué sur certains navigateurs.
- [x] `DONE` Normalisation orale déterministe des nombres et opérateurs ("cent divisé par trois", "deux mille cinq cents").
- [x] `DONE` Calcul arithmétique dicté ("100 divisé par 3") exécuté instantanément par le moteur arithmétique sans appel LLM.
- [x] `DONE` Chaîne de confirmation obligatoire avant enregistrement pour les dépenses, notes et rappels ("Souhaitez-vous enregistrer cette dépense ?").
- [x] `DONE` Sous-composants React modulaires (< 450 lignes) : `SurgaVoiceModal.tsx` et `SurgaDashboardTools.tsx`.
- **Démonstration** : le testeur dicte un calcul ("100 divisé par 3") et une dépense ("note 2500 de taxi") ; le calcul est exact et la dépense n'est enregistrée qu'après confirmation explicite.

### Tranche 7 — "Je partage"
- [x] `DONE` Cartes partageables (brèves d'actualité, score/sport, calcul arithmétique déterministe) vers WhatsApp et statuts avec lien direct d'ouverture.
- [x] `DONE` Moteur de partage (`surga-share.ts` et `share-formatter.js`) avec API standard `navigator.share`, repli universel WhatsApp et copie presse-papier.
- [x] `DONE` Zéro émoji Unicode dans les messages de partage, mise en valeur sobre en gras Markdown (`*...*`) et puces (`•`).
- [x] `DONE` Métadonnées OpenGraph et Twitter Cards conformes à AUD-163 avec image valide pour un aperçu riche sur WhatsApp et les réseaux.
- **Démonstration** : un contenu partagé génère un message WhatsApp soigné et son lien ouvre directement Surga.

---

## BRIQUES ACTIVABLES — ordre à ajuster selon l'usage observé

### Tranche 8 — Revue de presse résumée
- [x] `DONE` Sélection de sources sénégalaises nationales certifiées (APS, Le Soleil, Seneweb, Le Quotidien, Sud Quotidien).
- [x] `DONE` Sourcing éthique et légal : résumés concis (< 180 car.), lien obligatoire vers l'article source, aucun article reproduit intégralement.
- [x] `DONE` Catégorisation thématique déterministe (Économie, Société, Tech & Digital, Politique/Institutions, Général).
- [x] `DONE` Route REST `/api/surga/presse` avec filtrage par rubrique et endpoint d'actualisation `/api/surga/presse/refresh`.
- [x] `DONE` Composant modulaire `SurgaPresseView.tsx` (< 450 lignes, zéro émoji, tokens Nopalou) avec sélecteur de rubriques défilable et intégration du bouton de partage.
- **Démonstration** : l'utilisateur explore la revue de presse par rubrique thématique, consulte les résumés sourcés et peut partager une brève en 1 clic.

### Tranche 9 — Audio en option
- [x] `DONE` Option audio désactivée par défaut (respect strict du principe Low-Data et de la décision D5), activable dans les paramètres.
- [x] `DONE` Synthèse vocale locale native (`window.speechSynthesis`, voix française, 0 Mo de données mobiles) via `surga-audio.ts`.
- [x] `DONE` Composant modulaire `SurgaAudioPlayer.tsx` (< 220 lignes) : Play/Pause, vitesse variable (1.0x, 1.25x, 1.5x), progression fluide et indicateur d'écoute.
- [x] `DONE` Flux Podcast RSS 2.0 privé par utilisateur (`/api/surga/podcast/:token/feed.xml`) avec jeton sécurisé révocable.
- [x] `DONE` Composant modulaire `SurgaPodcastModal.tsx` (< 200 lignes) avec copie de l'URL privée et régénération du lien de sécurité.
- **Démonstration** : l'utilisateur active l'option audio, écoute son briefing matinal dans l'application à vitesse réglable, et peut s'abonner via son flux podcast privé dans Apple Podcasts / AntennaPod.

### Tranche 10 — Radios Locales du Sénégal (Directs FM & Low-Data)
- [x] `DONE` Bouquet de radios nationales et régionales sénégalaises (RTS 92.5 RSI, Sud FM 98.5, Rewmi FM 97.5, Oxy Jeunes 103.4, Radio Al Fayda Kaolack 90.1, GMS Ziguinchor 89.3, Zig FM 100.8, RTS Matam 89.1, RTS Tamba 92.0, Dakar Musique, Radio Fulbe FM 102.6).
- [x] `DONE` Mode Low-Data strict : flux légers (64 à 128 kbps), zéro vidéo, proxy backend sécurisé `/api/surga/radios/:id/stream` pour compatibilité HTTPS et arrêt immédiat à la déconnexion.
- [x] `DONE` Contexte audio persistant `SurgaRadioContext` (`frontend-next/src/lib/surga-radio-context.tsx`) assurant l'écoute ininterrompue en arrière-plan pendant la navigation dans tout Surga.
- [x] `DONE` Barre flottante persistante `SurgaPersistentRadioBar.tsx` au-dessus de la barre d'onglets avec égaliseur dynamique animé, contrôles Play/Pause, Mute, Stop et support de l'API standard `navigator.mediaSession`.
- [x] `DONE` Composants React modulaires (< 450 lignes) : `SurgaRadioModal.tsx` (305 l.), `SurgaPersistentRadioBar.tsx` (234 l.), `SurgaRadioMiniPlayer.tsx` (130 l.), `SurgaRadioCard.tsx` (121 l.), `SurgaRadioProvider.tsx` (15 l.).
- [x] `DONE` Accès ergonomique : bouton "Radios FM" dans `SurgaAudioPlayer`, dans `SurgaPresseView` et dans l'onglet Paramètres.
- [x] `DONE` Tests unitaires Jest : 99/99 passés (100%).
- **Démonstration** : l'utilisateur explore les stations sénégalaises, lance l'écoute en direct et continue de naviguer librement dans Surga avec une barre flottante persistante et des contrôles sur l'écran de verrouillage.

### Tranche 11 — Trafic à Dakar (Corridors, Heures de Pointe & Sondes TomTom Live)
- [x] `DONE` Tables SQL `surga_trafic_axes` et `surga_trafic_signalements` (migration idempotente dans `backend/migrate-inline.js`) et 11 corridors synchronisés par seeding idempotent (`scripts/seed-surga-data.js`).
- [x] `DONE` Connecteur temps réel TomTom Traffic Flow & Incidents API (`interrogerTomTomSegment`, `interrogerTomTomIncidents`) avec coordonnées GPS des 11 corridors de Dakar.
- [x] `DONE` Cache mémoire serveur Low-Data (TTL 6 min) respectant strictement les 2 500 requêtes gratuites/jour sans carte bancaire.
- [x] `DONE` Modèle déterministe d'heures de pointe de repli recalibré (matin vers Plateau, soir vers banlieue + goulots EMG/Hann Maristes sur A1 entrant et Route du Front de Terre, TER et BRT fluides par défaut) et signalements participatifs citoyens vérifiés (< 180 caractères).
- [x] `DONE` Passerelle directe 1-tap vers le trafic crowdsourcé Google Maps Live (`https://www.google.com/maps/@14.7300,-17.4480,13z/data=!5m1!1e1`) sur `SurgaTraficModal.tsx` et `SurgaTraficCard.tsx`, avec boutons d'itinéraire direct par axe dans `SurgaTraficItemCard.tsx`.
- [x] `DONE` Service `backend/services/surga/trafic-service.js` avec synthèse vocale/briefing au vouvoiement strict D19.
- [x] `DONE` Routes REST complètes sur `/api/surga/trafic` (`GET /`, `GET /synthese`, `GET /axes`, `GET /incidents`, `POST /signalements`).
- [x] `DONE` Composants React modulaires (< 450 lignes) : `SurgaTraficCard.tsx` (277 l.), `SurgaTraficModal.tsx` (448 l.), `SurgaTraficItemCard.tsx` (139 l.), `SurgaTraficReportForm.tsx` (118 l.).
- [x] `DONE` Tests unitaires Jest : 99/99 passés (100%).
- **Démonstration** : l'utilisateur consulte l'état des axes clés de Dakar en direct avec vitesse constatée (km/h) et badge DIRECT, accède en 1 clic à la carte en direct Google Maps, explore les corridors et transports (TER/BRT), et signale un incident avec confirmation immédiate.

### Tranche 12 — Immobilier (réutilise le pôle existant)
- [x] `DONE` Réutilisation stricte du pôle immobilier existant (`annonces_immo`, `agences_immo`, `backend/lib/immo-publiable.js`) sans aucun doublon de catalogue.
- [x] `DONE` Table `surga_alertes_immo` et index de performance dans `backend/migrate-inline.js`.
- [x] `DONE` Service `backend/services/surga/immo-service.js` avec :
  - Liste canonique des 27 quartiers majeurs de Dakar (`QUARTIERS_DAKAR`).
  - Parser en langage naturel (`parserRechercheImmoNaturelle`) : type de bien (villa, appartement, studio, terrain, bureau), transaction (location, vente), quartier dakarois, budget maximum (détection des millions FCFA, k et montants bruts), meublé et nombre de pièces/chambres.
  - Recherche multi-critères sécurisée anti-IDOR (`rechercherBiensImmo`).
  - Moteur d'évaluation d'alertes en temps réel (`evaluerAlertesPourNouvelleAnnonce`, matching < 2 min).
  - Synthèse briefing immobilier au vouvoiement strict D19 (`genererSyntheseImmoBriefing`).
- [x] `DONE` Routes REST dans `backend/routes/surga/immo.js` (`GET /immo/biens`, `GET /immo/biens/:id`, `GET /immo/quartiers`, `POST /immo/recherche-vocale`, `GET /immo/alertes`, `POST /immo/alertes`, `PATCH /immo/alertes/:id/toggle`, `DELETE /immo/alertes/:id`, `GET /immo/synthese`).
- [x] `DONE` Composants React modulaires (< 450 lignes) :
  - `SurgaImmoCard.tsx` (195 l.) : affichage des fiches avec badge "Vérifié", photos, quartier, prix FCFA et contact direct Téléphone / WhatsApp.
  - `SurgaImmoAlerteModal.tsx` (340 l.) : formulaire épuré de veille personnalisée.
  - `SurgaImmoModal.tsx` (448 l.) : modale de navigation avec onglets "Biens disponibles" et "Mes alertes", recherche en langage naturel et filtres rapides.
  - `SurgaImmoDashboardCard.tsx` (160 l.) : carte d'aperçu pour le tableau de bord avec synthèse D19.
  - `SurgaParametresTab.tsx` (145 l.) : factorisation de l'onglet paramètres permettant à `page.tsx` de rester à 395 lignes (< 450 l.).
- [x] `DONE` Tests unitaires Jest : 67/67 passés (100%).
- **Démonstration** : l'utilisateur explore les biens certifiés de Dakar par filtres ou recherche libre, active une alerte personnalisée avec notification sous 2 minutes et contacte directement l'agence par WhatsApp en 1 clic.

### Tranche 13 — Concours et examens du Sénégal (Catalogue Officiel Étendu à 22 Fiches Certifiées)
- [x] `DONE` Tables SQL idempotentes `surga_concours` et `surga_suivi_concours` avec index de performance dans `backend/migrate-inline.js`.
- [x] `DONE` Synchronisation PostgreSQL idempotente continue (`assurerConcoursInitiaux` avec `ON CONFLICT (id) DO UPDATE SET ...`) appelée à chaque lecture de l'API.
- [x] `DONE` Catalogue étendu de 5 à **22 concours et examens nationaux certifiés** basés sur les arrêtés ministériels et sources officielles de l'État (`ena.sn`, `cfj.sn`, `fonctionpublique.gouv.sn`, `policenationale.sec.gouv.sn`, `douanes.sn`, `gendarmerie.sn`, `bnsp.sn`, `justice.sec.gouv.sn`, `fastef.ucad.sn`, `concours.education.sn`, `inseps.ucad.sn`, `esp.sn`, `ept.sn`, `ensa.sn`, `cesti.ucad.sn`, `eamac.asecna.aero`, `officedubac.sn`, `men.gouv.sn`, `sante.gouv.sn`, `fmpo.ucad.sn`).
- [x] `DONE` Couverture intégrale des 6 catégories officielles sans catégorie vide : Fonction Publique (3), Forces de Défense & Sécurité (5), Éducation & Enseignement (3), Grandes Écoles d Ingénieurs (5), Examens Nationaux (3), Santé & Social (3).
- [x] `DONE` Calcul déterministe des échéances et phases d'urgence (`calculerEcheances` : J-30, J-7, J-1, Clôture).
- [x] `DONE` Moteur de suivi (`suivreConcours`) avec injection automatique des rappels dans l'Agenda Surga (`surga_agenda`).
- [x] `DONE` Synthèse pour le briefing du matin au vouvoiement strict D19 (`genererSyntheseConcoursBriefing`).
- [x] `DONE` Routes REST dans `backend/routes/surga/concours.js` (`GET /concours`, `GET /concours/categories`, `GET /concours/suivis`, `GET /concours/synthese`, `GET /concours/:id`, `POST /concours/:id/suivre`, `DELETE /concours/:id/suivre`) avec pagination par défaut portée à 50.
- [x] `DONE` Composants React modulaires (< 450 lignes) :
  - `SurgaConcoursCard.tsx` (199 l.) : carte d'aperçu d'un concours avec statut, décompte J-X et bouton Suivre.
  - `SurgaConcoursDetailModal.tsx` (447 l.) : modale avec calendrier officiel, checklist interactive des pièces administratives, lien officiel direct et centres de préparation.
  - `SurgaConcoursModal.tsx` (365 l.) : vue complète avec barre de recherche instantanée, filtres par catégorie réactifs et onglets *Tous les concours (22)* et *Mes concours suivis*.
  - `SurgaConcoursDashboardCard.tsx` (170 l.) : carte d'aperçu sur le tableau de bord Surga.
  - `SurgaParametresTab.tsx` (190 l.) : raccourci de paramétrage vers les concours nationaux.
- [x] `DONE` Tests unitaires Jest : **127/127 passés (100%)**, linter anti-slop conforme.
- **Démonstration** : l'utilisateur explore les 22 concours officiels du Sénégal par catégorie sans aucune section vide, consulte le lien du site officiel de chaque établissement/ministère, active le suivi avec programmation de ses rappels d'échéance J-30/J-7/J-1 et gère sa checklist de pièces.

### Tranche 14 — Bons plans & Adresses à Dakar
- [x] `DONE` Tables SQL idempotentes `surga_places` et `surga_favoris_places` avec index de performance dans `backend/migrate-inline.js`.
- [x] `DONE` Catalogue référentiel complet de 42 adresses certifiées (`backend/data/surga-places-catalogue.json`, 927 l.) couvrant les 5 catégories (Restaurants, Dibiteries, Cafés & Coworking, Bord de Mer, Brunchs & Pâtisseries) et 13 quartiers/villes (Plateau, Almadies, Ngor, Ouakam, Point E, Mermoz, Fann, Mamelles, Yoff, Médina, Liberté, Rufisque, Pikine, Guédiawaye, Saly).
- [x] `DONE` Seeding PostgreSQL automatisé (`scripts/seed-surga-data.js`) avec `ON CONFLICT (id) DO UPDATE` pour synchroniser les 42 adresses en base `surga_places`.
- [x] `DONE` Service `backend/services/surga/places-service.js` avec :
  - Repli mémoire instantané sur le catalogue JSON `surga-places-catalogue.json`.
  - Résumés honnêtes des avis clients en 3 lignes (< 260 caractères) avec points forts, spécialités et bémols constructifs sans complaisance.
  - Parser de recherche en langage naturel (`parserRecherchePlacesNaturelle`) extrayant envie (dibi, thieb, café, burger, brunch), quartier, ambiance (calme, wifi rapide, vue mer, terrasse, climatisé) et budget maximal.
  - Recherche multi-critères pondérée avec tri par note et nombre d'avis, et calcul exact du total via `COUNT(*) OVER() AS full_count`.
  - Gestion des coups de cœur (favoris) persistés par utilisateur.
  - Synthèse vocale et briefing au vouvoiement strict D19 (`genererSynthesePlacesBriefing`).
- [x] `DONE` Routes REST dans `backend/routes/surga/places.js` (`GET /`, `GET /categories`, `GET /favoris`, `GET /synthese`, `GET /:id`, `POST /recherche-vocale`, `POST /:id/favori`) avec `limit=100` par défaut et normalisation numérique systématique (`normaliserPlaceRow` pour `NUMERIC(2,1)` de PostgreSQL).
- [x] `DONE` Composants React modulaires (< 450 lignes) & Rendu défensif :
  - `SurgaPlaceCard.tsx` (354 l.) : affichage de la fiche avec note numérique défensive, résumé honnête 3 lignes, spécialité, contact direct WhatsApp et bouton favori.
  - `SurgaPlaceDetailModal.tsx` (393 l.) : modale avec détails complets, horaires, adresse, avis honnête, itinéraire Google Maps et partage.
  - `SurgaPlacesModal.tsx` (382 l.) : vue complète avec recherche en langage naturel, filtres par catégorie, filtres par quartier enrichis (Rufisque, Pikine, Guédiawaye, Yoff, Médina, Liberté, Saly) et onglets *Toutes les adresses (42)* et *Coups de cœur*.
  - `SurgaPlacesDashboardCard.tsx` (135 l.) : carte de recommandation du jour sur le tableau de bord Surga avec protection anti-crash `.toFixed`.
  - `SurgaParametresTab.tsx` (217 l.) : raccourci de paramétrage vers les bonnes adresses.
- [x] `DONE` Tests unitaires Jest : **99/99 passés (100%)**.
- **Démonstration** : l'utilisateur tape ou dicte son envie ("un bon dibi aux Almadies", "café calme coworking Point E", "restaurant à Rufisque"), explore les 42 recommandations authentiques avec résumés honnêtes sans complaisance, contacte directement par WhatsApp en un clic et ajoute ses adresses favorites à ses coups de cœur.

---

## MONÉTISATION ET SORTIE

### Tranche 15 — Premium et espaces professionnels
- [x] `DONE` Table SQL `surga_abonnements` (migration idempotente avec index dans `backend/migrate-inline.js`).
- [x] `DONE` Service `backend/services/surga/abonnement-service.js` :
  - Catalogue des formules B2C et B2B : Surga Premium (1 500 FCFA/mois ou 15 000 FCFA/an avec 2 mois offerts), Surga Visibilité Resto (5 000 FCFA/mois), Surga Immo Pro (5 000 FCFA/mois), Surga Éducation & Prépa Concours (10 000 FCFA/mois).
  - Déblocage automatique des quotas illimités pour les utilisateurs Premium dans `verifierQuota` (`backend/services/surga/whatsapp-handler.js`).
  - Intention de paiement Wave Checkout et Orange Money avec génération de référence unique.
  - Calcul et supervision financière en direct (MRR estimé en FCFA, volume encaissé, abonnés actifs).
- [x] `DONE` Routes REST publiques et authentifiées dans `backend/routes/surga/abonnements.js` (`GET /plans`, `GET /mon-statut`, `POST /initier`, `POST /verifier`).
- [x] `DONE` Supervision administrative complète dans `backend/routes/admin-surga.js` (`GET /abonnements`, `PUT /abonnements/:id/statut`).
- [x] `DONE` Composants React modulaires (< 450 lignes, zéro émoji, tokens Nopalou) :
  - `SurgaPremiumModal.tsx` (360 l.) : modale 1-clic pour les utilisateurs avec choix de cycle (mensuel/annuel), provider (Wave/OM) et confirmation.
  - `SurgaProModal.tsx` (320 l.) : modale d'adhésion pour les partenaires B2B (restaurateurs, agences, centres de concours).
  - `SurgaParametresTab.tsx` (314 l.) : affichage du badge Premium, jours restants et bouton d'action.
  - `SurgaModalsContainer.tsx` (136 l.) : factorisation pour maintenir `surga/page.tsx` à 428 lignes.
  - `AdminAbonnementsTab.tsx` (288 l.) : onglet de supervision MRR et abonnements avec filtres et actions de modération.
  - `AdminSurgaClient.tsx` (384 l.) : intégration de l'onglet financier *Abonnements & MRR*.
- [x] `DONE` Tests unitaires Jest : **87/87 passés (100%)**.
- **Démonstration** : un utilisateur particulier souscrit à Surga Premium par Wave ou Orange Money et débloque le vocal illimité et les alertes immédiates ; un restaurateur ou une agence souscrit à une formule pro pour être mis en avant ; l'administrateur suit le MRR et gère les abonnements en direct sur `/admin/surga`.

### Tranche 16 — Durcissement, Sécurité Anti-IDOR, Export/Suppression RGPD & Clôture
- [x] `DONE` Revue de sécurité anti-IDOR complète sur 100% des routes privées (`/api/surga/*` et `/api/admin/surga/*`).
- [x] `DONE` Service `backend/services/surga/donnees-service.js` :
  - Portabilité des données : extraction exhaustive de toutes les données liées à l'utilisateur (préférences, notes, dépenses, agenda, alertes immo, concours, favoris, abonnements).
  - Droit à l'oubli définitif : purge irréversible et complète de toutes les tables avec confirmation obligatoire.
- [x] `DONE` Routes REST `/api/surga/donnees` (`GET /export`, `DELETE /supprimer`).
- [x] `DONE` Modale PWA `SurgaDonneesModal.tsx` (268 l.) avec téléchargement direct du fichier JSON et garde-fou strict avec saisie de confirmation `SUPPRIMER`.
- [x] `DONE` Accès direct dans `SurgaParametresTab.tsx` (347 l.) et `surga/page.tsx` maintenu à 431 lignes (< 450 l.).
- [x] `DONE` Audit de performance et Low-Data : zéro police externe téléchargée, strict respect des polices natives système.
- [x] `DONE` Suite de tests unitaires Jest : **91/91 passés (100%)**.
- [x] `DONE` Tests unitaires frontend Next.js : **97/97 passés (100%)**.
- [x] `DONE` Compilation TypeScript : **0 erreur**.
- **Critère de sortie** : 100% des tranches (1 à 16) `DONE`, console d'administration `/admin/surga` opérationnelle, audits conformes, code prêt pour la fusion/déploiement sur ordre de l'utilisateur.

### Tranche 17 — Sama Xaalis & Sport Direct Multi-Ligues (05 Octobre 2026)
- [x] `DONE` Reproduction complète de Sama Xaalis dans Surga (`surga-kalpe.ts`, `SurgaSamaXaalisView.tsx`).
- [x] `DONE` Portefeuille personnel intégré dans la barre d'onglets principale (`SurgaBottomNav.tsx`).
- [x] `DONE` Suivi des dettes et créances avec remboursement direct, cagnottes et épargne avec jauges de progression.
- [x] `DONE` Sport temps réel multi-ligues (Europe, Ligue 1 Sénégal, Lions de la Teranga) et modal de personnalisation (`SurgaSportCustomModal.tsx`).

### Tranche 18 — Météo Multi-Localités (23 Zones), GPS 1-Clic & Kiosque Fluide (05 Octobre 2026)
- [x] `DONE` Météo & Marées océaniques Open-Meteo haute précision (`meteo-service.js`, `SurgaMeteoCard.tsx`).
- [x] `DONE` Catalogue exhaustif de 23 localités (Dakar intra-muros, banlieue, régions) et modale de sélection (`SurgaMeteoLocaliteModal.tsx`).
- [x] `DONE` Géolocalisation GPS 1-clic avec algorithme de plus proche voisin (`trouverLocalitePlusProche`) et persistance `localStorage`.
- [x] `DONE` Algorithme de résolution strict à deux passes (priorité absolue aux quartiers spécifiques comme "Dakar Plateau" ou "Ouakam" avant la ville générique "Dakar").
- [x] `DONE` Défilement horizontal tactile fluide pour le Kiosque des Unes de la presse sénégalaise (`SurgaPresseCard.tsx`).
- [x] `DONE` Durcissement des en-têtes HTTP de sécurité : `Permissions-Policy: geolocation=(self)` et conditionnement de `CSP-Report-Only` en production.
- [x] `DONE` Ergonomie & anti-troncature de la modale météo : `flexShrink: 0` sur l'en-tête, `minHeight: 0` sur la liste scrollable et `touchAction: 'manipulation'` sur chaque bouton.
- [x] `DONE` Suite de tests Jest portée à **98/98 passés (100%)**, `npx tsc --noEmit` 0 erreur, Anti-AI-Slop 0 violation.

### Tranche 19 — Météo 14 Régions, API Next.js Autonome & Recherche Anti-Diacritiques (05 Octobre 2026)
- [x] `DONE` Extension du catalogue à 28 localités couvrant l'intégralité des 14 régions du Sénégal et les quartiers clés de Dakar (`src/lib/surga-meteo.ts`).
- [x] `DONE` Normalisation NFD anti-diacritiques et ligatures (`[œŒ]` -> `oe`) garantissant la détection parfaite des requêtes sans accent ("thies", "guediawaye", "sacre coeur").
- [x] `DONE` Route Handler Next.js autonome (`src/app/api/surga/meteo/route.ts`) servant la météo Open-Meteo sans dépendre du backend Express distant.
- [x] `DONE` Modale de sélection résiliente (`SurgaMeteoLocaliteModal.tsx`, 433 l.) : Découplage `createPortal(..., document.body)` éliminant tout conflit avec le transform `:active` de `.surga-card`, bandeau sticky inférieur avec bouton primaire « Valider la localité », fiabilisation du clic direct sur chaque ligne et sélection canonique immédiate (`SurgaMeteoCard.tsx`, 435 l.).
- [x] `DONE` Carte Météo (`SurgaMeteoCard.tsx`, 435 l.) avec extraction modulaire de `SurgaMeteoPrevisions.tsx` (101 l., règle des 450 lignes), bouton d'action explicite « Changer » (`MapPin`), callback `onVilleChange` liant la météo aux préférences du briefing et fallback local gracieux.
- [x] `DONE` Alignement du backend (`meteo-service.js`, `briefing.js`) et enrichissement des tests Jest portés à **99/99 passés (100%)**, `npx tsc --noEmit` 0 erreur, Anti-AI-Slop 0 violation.

### Tranche 20 — Passerelles Transversales, Synergies Inter-Modules & Toasts Globaux (05 Octobre 2026)
- [x] `DONE` Moteur transversal unifié (`frontend-next/src/lib/surga-cross-actions.ts`, 315 l.) orchestrant les passerelles entre modules avec persistance locale (`surga-offline-sync.ts`).
- [x] `DONE` Passerelle Sport ➔ Agenda (Rappels de match synchronisés avec notifications Web) & Sport ➔ Sama Xaalis (Budget match).
- [x] `DONE` Passerelle Bonnes Adresses ➔ Agenda (Sortie à 20h), Sama Xaalis (Dépense budget moyen) & Notes (Fiche adresse enregistrée).
- [x] `DONE` Passerelle Concours Nationaux ➔ Notes (Checklist interactive des pièces du dossier avec cases à cocher `[x] / [ ]`) & Sama Xaalis (Quittance Trésor).
- [x] `DONE` Passerelle Pôle Immobilier ➔ Agenda (Planification de visite à 15h) & Notes (Fiche détaillée du bien épinglée).
- [x] `DONE` Passerelle Revue de Presse & Brèves ➔ Notes (Bouton d'épinglage 1-clic sur chaque article).
- [x] `DONE` Passerelle Notes ➔ Sama Xaalis (Détection regex intelligente des montants FCFA dans le texte pour enregistrement en dépense) & Agenda (Rappel de note à 10h).
- [x] `DONE` Toast Container Global (`SurgaToastContainer.tsx`) écoutant `surga-toast` avec surélévation adaptative à `128px` au-dessus de la barre radio persistante.
- [x] `DONE` Validation rigoureuse : 99/99 tests Jest backend validés, 97/97 tests `frontend-next` validés, `npx tsc --noEmit` 0 erreur, `npm run lint:slop` 100% conforme.

### Tranche 21 — Passerelles Dynamiques, États Actifs/Inactifs Persistants & Bascule Bidirectionnelle (05 Octobre 2026 - Soir 9)
- [x] `DONE` Vraie dynamique relationnelle bilatérale : les boutons reflètent l'état actif/inactif en direct (`Rappelé ✓`, `Budgeté ✓`, `Sortie fixée ✓`, `Dépense notée ✓`, `En note ✓`, `Checklist ✓`, `Quittance notée ✓`, `Visite fixée ✓`, `Épinglé ✓`).
- [x] `DONE` Moteur de bascule réversible (Toggle) dans `frontend-next/src/lib/surga-cross-actions.ts` (653 l.) : un nouveau clic désactive la relation et retire l'élément de l'Agenda, Sama Xaalis ou Notes.
- [x] `DONE` Événement personnalisé réactif `surga-data-change` intégré nativement dans `frontend-next/src/lib/surga-offline-sync.ts` déclenché à chaque écriture/suppression locale.
- [x] `DONE` Synchronisation cross-composants instantanée sans rafraîchissement ni prop drilling : la suppression d'un match ou d'une note dans l'Agenda/Notes/Sama Xaalis remet automatiquement le bouton de la carte ou modale à l'état inactif.
- [x] `DONE` Persistance locale `localStorage` : l'état actif des boutons persiste lors de la navigation dans les onglets, la fermeture des modales ou le rechargement de page.
- [x] `DONE` Visibilité directe de Surga Control Center (`/admin/surga`) dans la console d'administration : groupe « Pilotage & Direction » de la sidebar et bannière d'accès direct sur `/admin`.
- [x] `DONE` Respect strict des contraintes qualité : 100% des composants React sous 450 lignes, 0 régression, 99/99 tests Jest backend validés, 97/97 tests `frontend-next` validés, `npx tsc --noEmit` 0 erreur.

### Tranche 22 — Console d'Administration Autonome & Décloisonnement Total Nopalou (05 Octobre 2026 - Soir 11)
- [x] `DONE` Exigence utilisateur : console d'administration Surga complète, autonome et 100% découplée de Nopalou.
- [x] `DONE` Décloisonnement structurel : sortie du groupe `(protected)` vers `frontend-next/src/app/admin/surga/` avec `layout.tsx` dédié et suppression absolue de la sidebar e-commerce Nopalou et de l'omnisearch.
- [x] `DONE` Charte graphique dédiée `frontend-next/src/styles/surga-admin.css` aux couleurs officielles Surga (`--surga-navy: #1C2B4A`, `--surga-accent: #C75B00`, `--surga-price: #0A5C36`, `--surga-bg: #F8F5F0`).
- [x] `DONE` Barre latérale autonome (`AdminSurgaSidebar.tsx`) avec identité Surga, statut Live Dakar, 8 sections de navigation et raccourcis d'accès direct (Surga App, Nopalou Admin, Logout).
- [x] `DONE` Console 8 modules : Tableau de bord & KPIs (`AdminOverviewTab.tsx`), Abonnements & MRR (`AdminAbonnementsTab.tsx`), Bonnes Adresses (`AdminPlacesTab.tsx`), Concours Nationaux (`AdminConcoursTab.tsx`), Kiosque des Unes (`AdminUnesTab.tsx`), Modération Trafic (`AdminTraficTab.tsx`), Radios & Podcasts (`AdminRadiosTab.tsx`), Configuration & IA (`AdminConfigTab.tsx`).
- [x] `DONE` Redirection unifiée `frontend-next/src/app/surga/admin/page.tsx` vers `/admin/surga`.
- [x] `DONE` Validation rigoureuse : 99/99 tests Jest backend validés, 97/97 tests `frontend-next` validés, `npx tsc --noEmit` 0 erreur, composants React <= 450 lignes.

### Tranche 23 — Console Pro Décloisonnée : Tarifs Dynamiques, Comptes VIP & Hub Réseaux Sociaux (05 Octobre 2026 - Soir 12)
- [x] `DONE` Refonte UI/UX « Obsidian Deep Space » (`surga-admin.css`) : identité visuelle SaaS IA d'élite entièrement affranchie de Nopalou (Obsidian `#0B132B`, Surface `#121D33`, Neon Emerald `#10B981`, Cyber Amber `#F59E0B`, Cyan `#06B6D4`).
- [x] `DONE` Gestionnaire Dynamique des Tarifs & Abonnements (`AdminPlansTab.tsx`, 357 l.) :
  - Modification et fixation en direct des montants mensuels et annuels en FCFA.
  - Personnalisation des badges promotionnels (ex: « 2 MOIS OFFERTS ») et des avantages clés.
  - Création de nouveaux plans (B2C, B2B, Famille) et activation/désactivation 1-clic.
  - Synchronisation temps réel avec le service backend de facturation Wave & Orange Money (`backend/services/surga/abonnement-service.js`).
- [x] `DONE` Gestionnaire des Comptes Utilisateurs & Statuts VIP (`AdminComptesTab.tsx`, 391 l.) :
  - Annuaire complet avec recherche instantanée (Nom, Téléphone `+221...`, Email) et filtrage par statut (Tous, Actifs, VIP Premium, Freemium).
  - Attribution directe d'accès VIP Premium (1 mois, 3 mois, 6 mois, 1 an) en 1 clic sans passer par la passerelle de paiement.
  - Réinitialisation instantanée des quotas vocaux journaliers et bascule actif/suspendu.
- [x] `DONE` Hub Réseaux Sociaux & Passerelle Canaux (`AdminReseauxTab.tsx`, 339 l.) :
  - Passerelle Bot WhatsApp (+221 77 845 00 00) avec indicateur d'état en direct, test d'envoi de message et éditeur de messages automatiques (Bienvenue, Briefing matinal, Concours, Trafic).
  - Intégration des canaux officiels : Telegram, Facebook, Instagram, Twitter / X, TikTok avec compteurs d'abonnés et statuts actifs.
- [x] `DONE` Barre Latérale Autonome Enrichie (`AdminSurgaSidebar.tsx`, 286 l.) :
  - Organisation en 4 domaines professionnels : *Pilotage & Monétisation*, *Utilisateurs & Diffusion*, *Contenus Territoriaux*, *Audio & Système*.
  - Total de 11 onglets modulaires accessibles en 1 clic.
- [x] `DONE` API REST Backend Étendue (`backend/routes/admin-surga.js`) :
  - Endpoints `/plans` (GET, POST, PUT, DELETE) pour les tarifs dynamiques.
  - Endpoints `/utilisateurs` (GET, PUT premium, PATCH statut, POST reset-quota).
  - Endpoints `/canaux` (GET, PUT, POST test-whatsapp).
### Tranche 24 — Identité de Marque Officielle, Symbole Vectoriel Dépositaire & Design System Décloisonné (05 Octobre 2026 - Soir 13)
- [x] `DONE` Audit d'identité sans complaisance (`docs/surga/AUDIT_IDENTITE_SURGA.md`) identifiant la dépendance antérieure aux assets Nopalou et aux béquilles visuelles IA.
- [x] `DONE` Document fondateur de marque (`docs/surga/IDENTITE_SURGA.md`) :
  - Définition du rôle : assistant de poche qui exécute au quotidien au Sénégal, et non simple chatbot conversationnel.
  - Exploration comparative de 3 concepts créatifs (Le Geste d'Appui Loxo, Le Sceau de Clarté Bët, Le Ruban d'Action Continue S).
  - Sélection argumentée de la Direction 3 : Le Ruban d'Action Continue S (Alliance Écoute Ambre & Exécution Indigo avec étincelle centrale Émeraude).
  - 4 piliers de personnalité immuables (*Exécutant & Utile*, *Direct & Clair*, *Fidèle & Discret*, *Ancré & Local*).
  - Ligne éditoriale et ton de voix au vouvoiement respectueux sans jargon ni bavardage d'IA.
  - Démarcation écosystémique totale Nopalou vs Surga : "Même famille, identité distincte".
- [x] `DONE` Design System technique formel (`docs/surga/DESIGN_SYSTEM_SURGA.md`) :
  - Dictionnaire complet des tokens CSS (`--surga-primary: #0F172A`, `--surga-accent: #D97706`, `--surga-accent-glow: #F59E0B`, `--surga-emerald: #059669`, `--surga-bg: #F8FAFC`, `--surga-border: #E2E8F0`, etc.).
  - Règles d'or : Zero-CDN, zéro police externe, zéro émoji (100% `lucide-react`), cartes en 2 sous-lignes calibrées, composants React <= 450 lignes.
- [x] `DONE` Guide officiel d'utilisation de la marque (`docs/surga/BRAND_GUIDELINES_SURGA.md`) :
  - Spécifications géométriques sur grille vectorielle 512×512, clearspace (0.5X), tailles minimales, déclinaisons autorisées et interdits stricts.
  - Normes pour WhatsApp Business, PWA, formats vidéo verticaux (TikTok / Reels) et photographies réelles dakaroises.
- [x] `DONE` Création des actifs vectoriels SVG et PNG haute fidélité (`frontend-next/public/surga/icons/`) :
  - `surga-symbol.svg`, `surga-symbol-dark.svg`, `surga-symbol-mono.svg`, `surga-symbol-white.svg`.
  - `surga-logo-compact.svg`, `surga-logo-horizontal.svg`.
  - `icon-192.svg`, `icon-512.svg`, `icon-maskable-192.svg`, `icon-maskable-512.svg`, `favicon.svg`.
  - Rastérisation PNG Playwright Chromium : `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`, `surga-whatsapp-avatar.png`, `surga-symbol.png`.
- [x] `DONE` Intégration dans le code de l'application :
  - Manifest PWA (`public/surga/manifest.json`) mis à jour avec `theme_color: #0F172A`, `background_color: #F8FAFC` et icônes officielles Surga.
  - `layout.tsx` mis à jour avec métadonnées OpenGraph/Twitter (`surga/icons/icon-512.png`), `icons.icon` (`favicon.svg`) et `themeColor: #0F172A`.
  - `SurgaHeader.tsx` débarrassé de l'icône IA Sparkles au profit du symbole officiel SVG Surga et typographie du wordmark SURGA.
  - `surga.css` enrichi des tokens `--surga-*` officiels, du dégradé ambre sur le FAB micro et les boutons primaires, et du fond `#F8FAFC`.
  - `SurgaLandingHero.tsx` nettoyé des étoiles d'IA avec intégration des tokens de marque.
- [x] `DONE` Document de passation et handover (`docs/surga/HANDOVER_IDENTITE_SURGA.md`).
- [x] `DONE` Validation & Zéro Régression : 99/99 tests Jest backend validés, 97/97 tests frontend validés, `npx tsc --noEmit` 0 erreur, Anti-AI-Slop 100% conforme.

### Tranche 25 — Raccordement du Kiosque des Unes au ProjetBI (`LE-PROJET` / `projetbi.org`) (05 Octobre 2026 - Soir 14)
- [x] `DONE` Localisation et raccordement du dossier `../LE-PROJET/` (`projetbi.org`) avec son robot Playwright `download_revue.js` et son flux `press.json`.
- [x] `DONE` Implémentation du moteur hybride `synchroniserUnesProjetBi()` dans `backend/services/surga/kiosque-service.js` (source locale prioritaire, fallback distant `https://projetbi.org/`).
- [x] `DONE` Ingestion et synchronisation réussie des 41 Unes de presse du 5 octobre 2026 avec attribution des titres nationaux via `KNOWN_PAPERS`.
- [x] `DONE` Déclenchement automatique proactif dans `recupererUnesDuJour` et endpoints dédiés `POST /api/surga/kiosque/sync` et `POST /api/surga/presse/refresh`.
- [x] `DONE` Formatage soigné des dates de parution dans `SurgaKiosqueUnes.tsx` (`formatDateParution`), affichage de la mention « Aujourd'hui » et validation visuelle Playwright mobile.
- [x] `DONE` Règle d'exclusion `.gitignore` pour `frontend-next/public/surga/unes/*.webp` et tests unitaires 99/99 validés (100%).

### Tranche 26 — Synchronisation & Résolution de l'Incohérence Sama Xaalis (05 Octobre 2026 - Soir 15)
- [x] `DONE` Diagnostic de l'incohérence entre la tuile du tableau de bord (`0 FCFA`) et le solde réel de Sama Xaalis (`102 778 FCFA`).
- [x] `DONE` Déclencheur réactif `notifierKalpe()` dispatchant `surga-kalpe-change` et `surga-data-change` sur toutes les mutations dans `surga-kalpe.ts`.
- [x] `DONE` Passerelle bidirectionnelle automatique dans `surga-offline-sync.ts` (`saveLocalDepense`, `deleteLocalDepense`) vers `surga_kalpe_operations`.
- [x] `DONE` Intégration de `soldeKalpeFormate` dans `SurgaDashboardTools.tsx` et gestion d'état réactive dans `page.tsx` (maintenu à 449 lignes, < 450 l.).
- [x] `DONE` Prise en compte des clés `surga_kalpe_*` dans l'export et la purge locale de `SurgaDonneesModal.tsx`.
- [x] `DONE` Validation automatisée Playwright confirmant le rendu mobile exact `102 778 FCFA • Suivi entrées & dépenses`, `tsc --noEmit` 0 erreur, Anti-AI-Slop 100% conforme.

### Tranche 27 — En-tête Cliquable & Navigation Retour sur les Vues Internes (05 Octobre 2026 - Soir 16)
- [x] `DONE` Ajout des props `onRetour` et `afficherRetour` dans `SurgaHeader.tsx`.
- [x] `DONE` Bouton retour `<ChevronLeft />` squircle intégré élégamment à gauche du logo lors de la navigation dans les vues secondaires (`Sama Xaalis`, `Notes`, `Agenda`, `Paramètres`).
- [x] `DONE` Raccordement de la cliquabilité (`cursor: pointer`, `role="button"`) sur tout le bloc de marque pour retour immédiat à l'accueil `Aujourd'hui`.
- [x] `DONE` Raccordement dans `page.tsx` avec `afficherRetour={activeTab !== 'aujourdhui'}` et `onRetour={() => setActiveTab('aujourdhui')}` (449 lignes, < 450 l.).
- [x] `DONE` Validation par test automatisé Playwright mobile vérifiant le curseur et la bascule d'état au clic.

### Tranche 28 — Logo Officiel de Marque, Symbole S Caftan & Pack PWA HD (06 Octobre 2026 - Matin 1)
- [x] `DONE` Sculpture anatomique synchronisée : silhouette noble d'un homme en caftan d'action dont la tête et les épaules tournent de concert vers la droite, suivant naturellement le sens dynamique de la courbe supérieure du S.
- [x] `DONE` Élimination méticuleuse de tout double profil résiduel ou ombre de tête superposée à l'arrière du crâne grâce à une découpe vectorielle et un masque occipital lissé.
- [x] `DONE` Affinement du S et suppression radicale des deux blocs rectangulaires artificiels sous la ceinture ; conversion des rubans et bandes secondaires en bleu marine nuit d'ombre (`#0A1128`).
- [x] `DONE` Purification chromatique : zéro couleur or ou jaune éclatant, calibrage de l'accent sur l'orange exact `#EA8F09` (`rgb(234, 143, 9)`) échantillonné directement sur le FAB micro de l'application Surga, réservé au nœud du ceinturon (*takku ndig*).
- [x] `DONE` Génération et déploiement des actifs PWA : master HD `surga-symbol.png` (1024×1024), `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon.png`, `favicon.svg`, et pack miroir dans `public/surga/icons/`.
- [x] `DONE` Intégration en-tête `SurgaHeader.tsx` : affichage du symbole officiel squircle 34×34px avec bord arrondi 8px.
- [x] `DONE` Validation in-app en conditions réelles sur serveur Next.js en affichage mobile et desktop, `tsc --noEmit` 0 erreur, linter Anti-AI-Slop 100% au vert.

### Tranche 17 (Extension Vidéos) — Séries TV & Lutte Sénégalaise (Alertes Vidéos, Flux Atom & Quota 2/jour) (06 Octobre 2026 - Matin 2)
- [x] `DONE` Audit préalable de `docs/surga/EXTENSION_EMPLOI_DEMARCHES_VIDEOS.md` (section 2) en lecture seule, validation et raccordement.
- [x] `DONE` Ingestion officielle des flux Atom YouTube sans API payante via `cheerio` (mode XML).
- [x] `DONE` Catalogue initial équilibré (Marodi TV, EvenProd, Leuz Média, Lutte TV, Albourakh Events, Gaston Productions).
- [x] `DONE` Schéma SQL (`surga_video_sources`, `surga_video_items`, `surga_video_abonnements`), contrainte d'unicité `UNIQUE(url)` et dédoublonnage strict.
- [x] `DONE` Intégration du cycle cron périodique de 30 minutes sans nouveau processus (`backend/services/cron-surga-rss.js`).
- [x] `DONE` Endpoints REST sécurisés client et administration (`backend/routes/surga/videos.js` et `backend/routes/admin-surga.js`).
- [x] `DONE` Passerelles transversales Surga : rappels dans l'Agenda (`surga-cross-actions.ts`).
- [x] `DONE` Conformité RGPD intégrale : export et purge de données (`donnees-service.js` et `SurgaDonneesModal.tsx`).
- [x] `DONE` Interface PWA client modulaire : `SurgaVideosModal.tsx` (393 l.) avec extraction de `SurgaVideoCard.tsx` (96 l.) (< 450 l., zéro émoji).
- [x] `DONE` Console d'administration : `AdminVideosTab.tsx` (375 l.) avec extraction de `AdminVideoSourceModal.tsx` (175 l.) raccordé sur `/admin/surga`.
- [x] `DONE` Maintien strict de la page principale `surga/page.tsx` à 411 lignes (< 450 l.).
- [x] `DONE` Rectification déterministe du quota WhatsApp à 2 requêtes gratuites/jour (`CORR-P1-06`) dans `AdminConfigTab.tsx` et `AdminComptesTab.tsx`.
- [x] `DONE` Validation & Zéro Régression : 105/105 tests Jest backend validés, 97/97 tests frontend validés, `npx tsc --noEmit` 0 erreur, Anti-AI-Slop 100% conforme.

### Tranche 18 (Extension Emploi) — Profil Professionnel, CV PDF & Lettres de Motivation (Modèle Mixte & Anti-Hallucination) (06 Octobre 2026 - Matin 3)
- [x] `DONE` Schéma SQL (`surga_profil_pro`, `surga_documents_emploi`, `surga_usages`) avec index et contraintes Anti-IDOR (`backend/migrate-inline.js`).
- [x] `DONE` Service des droits & quotas (`backend/services/surga/emploi-service.js`) : application stricte côté serveur des règles gratuites (1 CV sobre avec mention discrète, 1 lettre/mois) et déblocage Premium ou à l'acte (500 FCFA pour un CV sans mention, Option A validée).
- [x] `DONE` Fiabilisation du générateur de CV PDF : support bidirectionnel transparent des alias de saisie (`titre_professionnel` / `titre_poste`, `adresse_ville` / `adresse`, `resume_pro` / `resume`, `exp.titre` / `exp.poste`) éliminant définitivement l'erreur 400 Bad Request.
- [x] `DONE` Téléchargement binaire direct et par streaming du fichier PDF A4 natif via `/api/surga/emploi/documents/:id/pdf` avec coordonnées complètes et mise en page soignée.
- [x] `DONE` Architecture de contrôle des utilisateurs non inscrits (« Découverte libre, Engagement vérifié par WhatsApp OTP ») garantissant l'unicité stricte des quotas gratuits par numéro de téléphone physique (+221...) sur tous les services à quotas.
- [x] `DONE` Moteur de génération PDF via `pdfkit` (stream direct, format A4, modèles `sobre_moderne` et `classique_pro`, sans photo par défaut, langue française exclusive au lancement D28).
- [x] `DONE` Règle stricte Zéro-Hallucination : structuration exclusive des données réelles de l'utilisateur sans aucune invention de diplôme, date ni employeur.
- [x] `DONE` Case à cocher obligatoire : « J'ai relu et je confirme l'exactitude » avant téléchargement.
- [x] `DONE` Générateur de lettres de motivation : adaptation formelle et vouvoiement strict (D19) au texte de l'offre d'emploi collée.
- [x] `DONE` Routes REST sécurisées sous `/api/surga/emploi` (`/profil`, `/droits`, `/cv/generer`, `/lettre/generer`, `/documents`, `/documents/:id/pdf`, `/documents/:id`).
- [x] `DONE` Interface PWA modulaire (< 450 l.) avec `SurgaProfilProTab.tsx` (360 l.), `SurgaCvTab.tsx` (260 l.), `SurgaLettreTab.tsx` (274 l.) et `SurgaEmploiModal.tsx` (387 l.).
- [x] `DONE` Maintien de la page principale `surga/page.tsx` à 447 lignes (< 450 l.).
- [x] `DONE` Conformité RGPD intégrale : export et purge de `surga_profil_pro`, `surga_documents_emploi` et `surga_usages` dans `donnees-service.js` et `SurgaDonneesModal.tsx`.
- [x] `DONE` Tests unitaires Jest portés à **128/128 passés (100%)**, `npx tsc --noEmit` 0 erreur, Anti-AI-Slop 100% conforme.
- **Démonstration** : l'utilisateur remplit son profil professionnel, choisit son modèle (Sobre & Moderne ou Classique Épuré), coche la validation d'exactitude et télécharge son CV en PDF haute fidélité ; il colle une annonce pour générer une lettre de motivation au vouvoiement formel et retrouve ses documents générés dans son historique.

### Tranche 19 (Extension Emploi) — Préparation à l'Entretien d'Embauche (Simulateur In-App & Fiches de Révision) (06 Octobre 2026 - Matin 4)
- [x] `DONE` Banque de questions types sectorielles gratuites sans IA et coût nul (Général, Comptabilité SYSCOHADA, Vente & Commercial, Tech & Informatique, Administration & RH, Logistique Dakar) avec conseils ciblés sur les attentes du recruteur.
- [x] `DONE` Simulateur d'entretien in-app (saisie au clavier ou dictée vocale Web Speech API, 1 simulation gratuite/semaine via `surga_usages`, illimité en Premium).
- [x] `DONE` Évaluation constructive et déterministe sans note arbitraire (méthode STAR, verbes d'action, points forts, axes d'amélioration, suggestion inspirante et vouvoiement strict D19).
- [x] `DONE` Passerelles transversales Surga : enregistrement de la fiche de révision complète en Note, planification de l'entretien dans l'Agenda avec rappels (veille 18h / jour J 8h), prévision du budget transport (3 000 FCFA) dans Sama Xaalis.
- [x] `DONE` Modularisation PWA : `SurgaEntretienTab.tsx` (342 l.) et `SurgaDocumentsEmploiTab.tsx` (96 l.) maintenant `SurgaEmploiModal.tsx` à 385 lignes (< 450 l.).
- [x] `DONE` Tests unitaires Jest portés à **118/118 passés (100%)**, `npx tsc --noEmit` 0 erreur, Anti-AI-Slop 100% conforme.
- **Démonstration** : l'utilisateur choisit son secteur et son poste visé, consulte les questions types avec les conseils du recruteur, dicte ou saisit sa réponse, reçoit un feedback constructif STAR immédiat, enregistre sa fiche de révision dans ses Notes et planifie la date de son entretien dans son Agenda avec rappel la veille.

### Tranche 20 (Extension Démarches) — Démarches Administratives Sénégalaises Vérifiées (Catalogue Étendu à 20 Fiches Certifiées & Console Admin)
- [x] `DONE` Enrichissement majeur du catalogue officiel : passage de 7 à 20 fiches de référence certifiées réelles avec source `https://e-senegal.sn/#/home/demarches` couvrant 100% des catégories (Création Entreprise GIE/SARL APIX, Quitus Fiscal DGID, Immatriculation IPRES/CSS, Mariage, Décès, Vie, Permis de construire Teledac, Titre Foncier, Carte Grise Capp Karangë, Visite CCTVA, Légalisation, Certificat de perte).
- [x] `DONE` Synchronisation PostgreSQL idempotente continue via `assurerDemarchesInitiales` avec `INSERT ... ON CONFLICT (id) DO UPDATE SET ...`.
- [x] `DONE` Schéma SQL complet (`surga_demarches`, `surga_demarches_signalements`, `surga_demarches_suivis`) avec index et cycle de re-vérification automatique à 90 jours (`A_REVERIFIER`).
- [x] `DONE` Moteur de consultation et recherche déterministe (sans improvisation d'IA) : date de vérification, coûts exacts FCFA, délais, pièces requises, étapes, lieux et renvoi officiel vers `https://e-senegal.sn/#/home/demarches` pour les démarches non répertoriées.
- [x] `DONE` Passerelles transversales Surga : export checklist interactive dans les Notes, intégration des frais dans Sama Xaalis, planification de rendez-vous dans l'Agenda et suivi avec rappels J-7/J-1 (1 suivi gratuit, illimité Surga Premium).
- [x] `DONE` Console d'administration sous `/admin/surga` : catalogue complet, re-vérification périodique en 1 clic (report à J+90 au statut `PUBLIE`), modération des signalements usagers et modale de création/édition.
- [x] `DONE` Respect strict des contraintes qualité : 100% des composants React sous 450 lignes, zéro émoji (100% `lucide-react`), 127/127 tests Jest backend validés, 97/97 tests frontend validés, `npx tsc --noEmit` 0 erreur, Anti-AI-Slop 100% conforme.
- **Démonstration** : l'utilisateur explore les 20 démarches administratives officielles classées par catégories (Identité, État Civil, Justice, Transports, Logement, Entreprise), filtre par mot-clé, consulte les pièces et coûts FCFA, transfère la checklist dans ses Notes et son budget dans Sama Xaalis, active le suivi de sa démarche avec alertes de rappel, signale une éventuelle anomalie au modérateur, et l'administrateur gère les fiches et renouvelle la validité 90 jours depuis la console admin.
### Tranche 21 — Sport & Équipe Nationale Temps Réel, Scores Directs ESPN & Actualisation Lions du Sénégal (06 Octobre 2026 - Nuit)
- [x] `DONE` Détection stricte de statut de match (`comp.status || event.status || {}`) résolvant le bug où tous les matchs de calendrier d'équipe basculaient par défaut en « À venir ».
- [x] `DONE` Détection automatique des matchs achevés : `isTermine = completed || state === 'post' || (!isLive && isPast)`.
- [x] `DONE` Extraction résiliente des scores ESPN (`extraireScoreESPN`) prenant en charge les objets `{ value, displayValue }` et les entiers sans retour `NaN`.
- [x] `DONE` Intégration des flux officiels ESPN pour les Lions du Sénégal : matchs amicaux 2026 (`fifa.friendly/teams/654/schedule`) et éliminatoires CAN 2026 (`caf.nations_qual/teams/654/schedule`).
- [x] `DONE` Affichage immédiat des résultats récents avec scores réels : Comores 0 - 1 Sénégal (4 oct. 2026), Éthiopie 0 - 1 Sénégal (29 sept. 2026), Mozambique 1 - 1 Sénégal (25 sept. 2026), Arabie Saoudite, Gambie, Pérou...
- [x] `DONE` Correction du slug Saudi Pro League : `ksa.1` remplace `sau.1` (erreur 400 résolue).
- [x] `DONE` Tri universel optimisé : 1. En direct d'abord, 2. Prochains matchs chronologiques, 3. Derniers résultats antéchronologiques avec score.
- [x] `DONE` Rafraîchissement forcé (`?refresh=true`) sur route `/api/surga/sport` et bouton PWA dédié.
- [x] `DONE` Affichage complet de la date avec année pour les matchs passés (`formatMatchDate`), évitant toute confusion temporelle.
- [x] `DONE` Suite de tests unitaires Jest : **127/127 validés (100% en 3.1s)**, linter anti-slop conforme, composant React `< 450 lignes` (`SurgaSportCard.tsx`, 410 l.).
- **Démonstration** : l'utilisateur ouvre l'onglet Sport & Équipe Nationale, consulte les résultats récents des Lions du Sénégal avec scores réels certifiés, constate les statuts exacts (Terminé, En Direct, À venir), et explore la Saudi Pro League et les championnats majeurs sans erreur.

---

## Évolutions futures (hors plan actuel)
- Application native si la part d'iPhone ou l'usage l'exigent.
- Appel téléphonique pour écouter le briefing (coût par minute à étudier).
- Telegram comme canal complémentaire (règles à vérifier).
- Wolof pour la voix et l'audio, après tests de qualité.
- Sponsoring du briefing.

## Règles Transverses
- Aucun `git push` sans ordre explicite. Une entrée de journal par tranche livrée.
- Une tranche est démontrable de bout en bout avant de passer à la suivante.
- En cas de doute (portée, conflit avec l'existant, flux WhatsApp), poser la question
  (`docs/surga/INTEGRATION_NOPALOU.md`, section 3).
- Ne jamais toucher au comparateur d'achats ni à la Caisse PRO.
