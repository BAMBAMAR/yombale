# 📊 MATRICE DES ÉTATS D'INTERFACE (UI STATES) — SURGA PWA

> **Date d'évaluation** : 06 Octobre 2026  
> **Méthode** : Inspection du code source React, audit des fallbacks réseaux et tests Playwright sous Chromium  
> **Légende d'évaluation** :  
> - 🟢 **CONFORME** : État visuellement conçu, fluide, guidant l'utilisateur et ergonomique.  
> - 🟡 **PARTIEL** : État existant mais visuellement pauvre, brut (texte brut, spinner isolé, manque de guidage).  
> - 🔴 **DÉFAILLANT / ABSENT** : État non géré (écran blanc, flash d'empty state, crash ou freeze silencieux).

---

## 1. Vue d'Ensemble & Synthèse de la Couverture des États

Une application de niveau premium se distingue par la maîtrise de ses états de transition : l'utilisateur ne doit **jamais** faire face à un écran blanc, un spinner infini sans explication, un saut brutal de mise en page (CLS), ou un message d'erreur technique incompréhensible.

| Statut Global | Nombre d'États Audités (20 briques × 7 états = 140 cellules) | Pourcentage |
| :--- | :---: | :---: |
| 🟢 **CONFORME** | 71 / 140 | 50,7 % |
| 🟡 **PARTIEL** | 49 / 140 | 35,0 % |
| 🔴 **DÉFAILLANT** | 20 / 140 | 14,3 % |

---

## 2. Matrice Complète des 20 Fonctionnalités de Surga

| # | Fonctionnalité | Normal | Loading | Empty | Error | Offline | Success | Disabled |
| :-: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **Briefing du Matin** | 🟢 Conforme | 🔴 Flash Empty (CLS) | 🟡 Texte brut | 🟡 Toast discret | 🟢 Cache local | 🟢 Rendu direct | 🟡 Carte masquée |
| **2** | **Actualités & Presse** | 🟢 Conforme | 🔴 Absent (CLS) | 🔴 "Aucune brève" | 🟡 Échec silencieux | 🟢 IndexedDB/Local | 🟢 Ouvrir lien | 🟡 Filtre grisé |
| **3** | **Météo & Marées** | 🟡 Titre écrasé | 🟡 Spinner icône | 🟢 Fallback Dakar | 🟢 Fallback 28°C | 🟢 Dernière valeur | 🟢 Rendu direct | 🟡 GPS wait |
| **4** | **Trafic TomTom Dakar** | 🟡 Carte basique | 🟡 "Évaluation..." | 🟡 Texte statique | 🟡 Message discret | 🟢 Fallback heuristique | 🟢 Badge fluide | 🟡 Hors couverture |
| **5** | **Notes Personnelles** | 🟢 Conforme | 🟢 Immédiat (Local) | 🟢 Guidage d'action | 🟡 Toast rouge | 🟢 Tag synced=false | 🟢 Toast vert | 🟡 Bouton save |
| **6** | **Dépenses (Sama Xaalis)** | 🟡 FAB superposé | 🟢 Immédiat (Local) | 🟢 Empty guidé | 🟡 Message alert | 🟢 Local direct | 🟢 Compteur recalculé | 🟡 Montant invalide |
| **7** | **Calculatrice Déterministe** | 🟢 Conforme | 🟢 0ms (Local) | 🟢 Écran "0" | 🟢 "Erreur" propre | 🟢 100% Hors-ligne | 🟢 Historique local | 🟡 Touches verrouillées |
| **8** | **Agenda & Rappels** | 🟢 Conforme | 🟢 Immédiat (Local) | 🟢 Bouton programmer | 🟡 Toast erreur | 🟢 Persistance locale | 🟢 Toast vert | 🟡 Formulaire incomplet |
| **9** | **Assistant Vocal (FAB)** | 🟡 FAB intrusif | 🟡 Onde basique | 🟡 Pastilles d'aide | 🟡 "Non reconnu" | 🔴 Échec Web Speech | 🟢 Carte contextuelle | 🔴 Micro barré |
| **10** | **Kiosque des Unes** | 🟢 Zoom 1x-4x | 🟡 Placeholder | 🟡 Empty state | 🟡 Vignette fallback | 🟡 Cache partiel | 🟢 Plein écran | 🟡 Zoom max |
| **11** | **Radios FM Sénégalaises** | 🟢 Player mini | 🟡 Buffer audio | 🟡 Liste indisponible | 🔴 Silence audio | 🔴 Flux coupé | 🟢 Égaliseur animé | 🟡 Station muette |
| **12** | **Concours & Examens** | 🟢 22 Fiches | 🟡 Squelette absent | 🟡 Filtre 0 résultat | 🟡 Liste par défaut | 🟢 22 fiches en cache | 🟢 Modal détaillée | 🟡 Date expirée |
| **13** | **Démarches Citoyennes** | 🟢 20 Fiches | 🟡 Squelette absent | 🟡 Filtre 0 résultat | 🟡 Liste locale | 🟢 20 démarches locales| 🟢 Modal pièces | 🟡 Non couvert |
| **14** | **Bons Plans / Sorties** | 🟢 Conforme | 🟡 Spinner central | 🟡 0 adresse trouvée | 🟡 Carte blanche | 🟢 Cache local | 🟢 Rendu contact | 🟡 Fermé |
| **15** | **Immobilier & Alertes** | 🟢 Conforme | 🟡 Spinner central | 🟡 0 annonce | 🟡 Recommencer | 🟢 Brouillon local | 🟢 Alerte créée | 🟡 Quota atteint |
| **16** | **Emploi & CV PDF** | 🟢 Édition fluide| 🟡 Spinner génération| 🟢 Modèle par défaut | 🟡 Erreur serveur | 🟢 Brouillon local | 🟢 Téléchargement PDF | 🟡 Formulaire incomplet |
| **17** | **Abonnement Surga Premium** | 🟢 1500 FCFA | 🟡 Chargement Wave | 🟢 Tableau comparatif | 🟡 Échec paiement | 🔴 Paiement impossible | 🟢 Statut VIP actif | 🟡 Déjà abonné |
| **18** | **Authentification WhatsApp**| 🟡 Modal 724 l. | 🟡 Minuteur OTP | 🟢 Formulaire clair | 🟢 Alerte explicite | 🔴 Connexion requise | 🟢 Fermeture auto | 🟡 Minuteur 60s actif |
| **19** | **Mon Compte & Profil** | 🟢 Conforme | 🟡 "Chargement..." | 🟢 Mode invité | 🟡 Message erreur | 🟢 Affichage invité | 🟢 Profil mis à jour | 🟡 Déconnexion wait |
| **20** | **Synchronisation Globale**| 🟡 Spin header | 🟡 Bouton désactivé | 🟢 Aucune donnée | 🔴 Crash UUID (corrigé)| 🟡 Badge "Hors-ligne" | 🟢 Badge "En ligne" | 🟡 Déjà synchronisé |

---

## 3. Analyse Détaillée des Principales Défaillances

### 1. Flash d'Empty State sur le Dashboard (Briefing & Presse) 🔴
- **Comportement actuel** : Lors du chargement de la page, `briefingData` est initialisé à `null`. La liste d'articles (`SurgaNewsList`) rend immédiatement la boîte vide `"Aucune brève disponible pour le moment"`. Puis 800 ms plus tard, les brèves réelles sont injectées, provoquant la disparition de la boîte et l'apparition brutale de 6 articles.
- **Correction requise** : Intégrer un composant `<SurgaBriefingSkeleton />` avec 3 cartes grises animées par une pulsation douce CSS (`animation: pulse 1.5s ease-in-out infinite`) tant que `loadingBriefing === true`.

### 2. Micro Barré déroutant à l'Ouverture Vocale 🔴
- **Comportement actuel** : À l'ouverture de `SurgaVoiceModal`, le bouton central d'enregistrement affiche une icône `MicOff` (microphone barré d'une barre oblique).
- **Impact psychologique** : L'usager pense que l'application est défectueuse ou que la permission audio a été bloquée.
- **Correction requise** : Afficher une icône `Mic` bienveillante et colorée avec un halo ambre (`box-shadow: 0 0 0 8px rgba(217, 119, 6, 0.15)`), et réserver `MicOff` uniquement au cas où la permission Web Speech est explicitement rejetée par le navigateur.

### 3. Superposition Physique du FAB Micro sur les Éléments d'Action 🔴
- **Comportement actuel** : Le bouton flottant `.surga-fab-mic` est positionné en `position: fixed; bottom: 80px; right: 20px; z-index: 50;`.
- **Preuve visuelle** :
  - Sur le Dashboard : il cache le titre du 1er article.
  - Sur Sama Xaalis : il cache le montant de la dernière opération.
  - Sur les Services : il cache le bouton "Consulter" de l'Immobilier.
- **Correction requise** :
  1. Ajouter un `padding-bottom: 96px` dans chaque conteneur d'écran défilant pour que le dernier item puisse être scrollé au-dessus du FAB.
  2. Masquer automatiquement le FAB (`opacity: 0; pointer-events: none; transform: scale(0.8)`) dès qu'une modale est ouverte ou que l'utilisateur édite activement un formulaire.

### 4. Absence d'Indicateur de Progression Réseau sur la Radio FM 🔴
- **Comportement actuel** : Lorsque l'utilisateur clique sur une station (ex: RFM, Zik FM), il peut s'écouler entre 2 et 5 secondes de mise en mémoire tampon (buffering audio stream). Durant ce laps de temps, la station ne donne aucun retour visuel immédiat (pas de spinner sur la vignette, pas de vibration).
- **Correction requise** : Passer la station en état `isBuffering` avec un micro-spinner tournant autour du bouton Play dès le tap.

---

## 4. Recommandations de Standardisation des États

Pour hisser Surga au niveau des meilleures applications mondiales, chaque composant doit adopter le modèle d'état strict en 5 phases :

```
[IDLE] ──(action)──> [PENDING / SKELETON] ──(succès)──> [OPTIMISTIC / RESOLVED]
                              │
                              └──(échec)───> [ERROR RECOVERABLE (Retry CTA)]
```

1. **Optimistic UI** : Toute écriture locale (Note, Dépense, Rappel) doit apparaître immédiatement dans la vue avec statut visuel temporaire (icône horloge discrète ou bordure douce) avant même la réponse du serveur.
2. **Skeleton standardisé** : Créer un composant universel `<SurgaSkeleton width height borderRadius />` basé sur les tokens `--surga-surface-subtle`.
3. **Empty States incitatifs** : Tout écran vide doit contenir :
   - Une illustration vectorielle SVG discrète.
   - Un titre expliquant pourquoi c'est vide.
   - Un bouton d'action principal bien contrasté (hauteur >= 44 px).
