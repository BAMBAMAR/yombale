# MATRICE EXHAUSTIVE DES SERVICES & APIS — SURGA (NOPALOU)

> **Document Officiel de Décision Technologique & Arbitrage Économique**  
> **Auteur** : Expert Senior International en Architecture Cloud, APIs & Systèmes Distribués  
> **Date** : 6 Octobre 2026  
> **Objectif** : Comparer pour chaque fonction vitale de Surga les solutions actuelles face aux meilleures alternatives gratuites, open source et payantes du marché en 2026.

---

## 1. PRINCIPE DIRECTEUR : LA RÈGLE ÉCONOMIQUE SURGA
1. **Priorité 1** : Meilleure solution gratuite réellement suffisante (0 FCFA, pérenne).
2. **Priorité 2** : Solution open source auto-hébergée à coût d'infrastructure marginal sur VPS.
3. **Priorité 3** : Service payant extrêmement peu coûteux apportant un saut qualitatif prouvé.
4. **Priorité 4** : Service premium uniquement lorsqu'il crée un moment « WOW » décisif pour la rétention.
5. **Critère Suprême** : $\text{Ratio} = \frac{\text{Qualité & Rétention Utilisateur}}{\text{Coût Total d'Acquisition \& Opération}}$

---

## 2. MATRICE COMPARATIVE MULTIDIMENSIONNELLE DES SERVICES

| Service / API | Fournisseur | Fonction dans Surga | Qualité Actuelle | Limites & Risques | Dispo Sénégal | Free Tier Réel | Prix Unitaire / Volume | Latence P95 | Dépendance / Lock-in | Migration Facile ? | Ratio Qualité / Coût | Décision Finale |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Moteur Arithmétique & FCFA** | Moteur interne (`calculator.js`) | Calcul exact sans IA, pourcentages | **9.5/10** | Limité aux maths (ne comprend pas le texte) | 100% (Local) | Illimité (0 FCFA) | 0 FCFA | < 1 ms | Nulle (Code interne) | Immédiate | **10 / 10** | **CONSERVER (Pépite)** |
| **Compréhension Intention L0** | Regex procédurales | Détection rapide dépenses/rappels | **6.5/10** | Rejette toute formulation atypique | 100% (Local) | Illimité (0 FCFA) | 0 FCFA | < 1 ms | Nulle | Immédiate | **8.5 / 10** | **CONSERVER EN FAST-PATH** |
| **Compréhension Intention L1 (Fallback)** | Google AI Studio (Gemini 2.0 Flash Lite) | Interprétation langage naturel familier | *À intégrer* | Quota gratuit 1 500 req/jour | 100% | 1 500 RPD gratuit sans CB | 0,075 $ / 1M input (~0,02 FCFA/req) | ~ 380 ms | Faible (Schéma JSON standard) | Oui (vers Llama ou Claude) | **9.8 / 10** | **RECOMMANDÉ (Adopter)** |
| **Transcription Vocale (STT Web)** | Web Speech API (`webkitSpeechRecognition`) | Dictée vocale dans la PWA | **6.0/10** | Inopérant sur Firefox/certains Webviews, pas de Wolof | Dépend du terminal | Gratuit (Navigateur) | 0 FCFA | ~ 800 ms | Nulle | Oui | **7.0 / 10** | **CONSERVER AVEC FALLBACK** |
| **Transcription Vocale (STT WhatsApp)** | Groq Cloud (Whisper-large-v3-turbo) | Dictée de dépenses par notes vocales WA | *À intégrer* | Nécessite envoi du buffer audio | 100% | 2 000 req/jour gratuites | 0,04 $ / heure audio (~0,40 FCFA/vocal) | ~ 320 ms | Faible (Format OpenAI Whisper) | Immédiate vers OpenAI | **9.9 / 10** | **RECOMMANDÉ (Adopter)** |
| **Synthèse Vocale (TTS Local)** | Web Speech Synthesis (`speechSynthesis`) | Lecture audio du briefing dans la PWA | **4.5/10** | Voix robotique sur smartphones entrée de gamme | Dépend du terminal | Gratuit (Navigateur) | 0 FCFA | Immédiat | Nulle | Immédiate | **5.0 / 10** | **REMPLACER PAR EDGE-TTS** |
| **Synthèse Vocale (TTS Podcast & Briefing)** | Microsoft Edge Neural TTS (`edge-tts`) | Audio haute fidélité pour briefing et podcast | *À intégrer* | Nécessite génération Node.js/Python sur serveur | 100% | Illimité (Open source) | 0 FCFA | ~ 1,2 s (mis en cache) | Faible (Génère du pur MP3) | Oui vers ElevenLabs | **9.7 / 10** | **RECOMMANDÉ (Adopter)** |
| **Météo & Climat Local** | Open-Meteo | Prévisions Dakar, 14 régions, UV, marées | **9.2/10** | Aucune pour les besoins de Surga | 100% | 10 000 appels/jour gratuits | 0 FCFA (Free tier) | ~ 180 ms | Nulle (REST ouvert) | Immédiate | **10 / 10** | **CONSERVER (Exemplaire)** |
| **Trafic & Déplacements Dakar** | Heuristiques Heures de Pointe + TomTom Live | Temps de trajet, corridors A1/VDN/RN1/BRT | **7.5/10** | TomTom manque de sondes FCD à Dakar | 100% | 2 500 req/jour (TomTom) | 0 FCFA (Dans le quota) | ~ 240 ms | Faible | Oui vers Google Routes | **8.5 / 10** | **CONSERVER LE MODÈLE HYBRIDE** |
| **Presse & Ingestion Actualités** | Google News RSS + APS + Le Soleil | Revue de presse matinale sénégalaise | **7.0/10** | 4 flux tiers en 403/404 ; troncatures à 180 car. | 100% | Gratuit (Flux RSS) | 0 FCFA | ~ 450 ms | Nulle (Flux publics) | Immédiate | **7.5 / 10** | **CONSERVER + AJOUTER SYNTHÈSE LLM** |
| **Sport & Scores en Direct** | ESPN Scoreboards Public API | Matchs des Lions de la Teranga, UCL, grands clubs | **7.5/10** | Championnat Ligue 1 SN non couvert en direct | 100% | Gratuit (Endpoints publics) | 0 FCFA | ~ 210 ms | Faible | Oui vers API-Football | **8.5 / 10** | **CONSERVER POUR L'INTERNATIONAL** |
| **Immobilier Certifié** | Base de données Nopalou (`annonces_immo`) | 1 649 biens vérifiés à Dakar sans commission | **9.0/10** | Dépend du volume de prospection interne | 100% (Local) | Interne (0 FCFA) | 0 FCFA | < 15 ms | Nulle (Données propriétaires) | — | **10 / 10** | **ACTIF MAJEUR (À Valoriser)** |
| **Notifications Push Web** | Web Push VAPID (`web-push` RFC 8291) | Rappels programmés et alertes immo | *À intégrer* | Demande autorisation navigateur | 100% | Illimité (Norme W3C) | 0 FCFA | < 150 ms | Nulle (Standard W3C) | Immédiate | **10 / 10** | **RECOMMANDÉ D'URGENCE (P0)** |
| **Messagerie WhatsApp** | Meta Cloud API (Graph API) | Commandes par texte, alertes de rappel | **7.0/10** | Coût de 10 à 20 FCFA/message au-delà de 1k/mois | 100% | 1 000 msgs service/mois | ~ 11 FCFA / message sortant | ~ 900 ms | Moyenne (API Meta) | Vers Telegram ou SMS | **6.5 / 10** | **BRIDER QUOTAS & PRIORISER PWA** |
| **Paiement Mobile Money** | Wave Direct SDK + OM Sonatel | Abonnements Surga Premium (1 500 FCFA/m) | **9.0/10** | Frais marchand 1% (Wave) | 100% (Natif Sénégal) | Pas d'abonnement | 1% par transaction (15 FCFA) | ~ 1,5 s | Faible (Multi-fournisseurs) | Immédiate | **9.5 / 10** | **CONSERVER (Parfaitement adapté)** |
| **Base de Données Relationnelle** | PostgreSQL 18.4 via `pg` brut | Persistance notes, dépenses, agenda, users | **9.5/10** | Nécessite index bien dimensionnés | 100% (Local/VPS) | Open source | 0 FCFA additionnel | < 5 ms | Nulle (SQL ANSI) | Immédiate | **10 / 10** | **CONSERVER (Haut débit)** |

---

## 3. ANALYSE CRITIQUE DES CANDIDATS ÉVALUÉS & REJETÉS

### 1. OpenAI ChatGPT / GPT-4o pour la Conversation Générale sur WhatsApp :
- **Pourquoi rejeté** :
  1. Coût prohibitif : facturation au token + facturation au message WhatsApp Meta ($0.018/msg) = déficit immédiat.
  2. Latence élevée (1,5s à 3s).
  3. Violation directe des règles Meta du 15 janvier 2026 interdisant les assistants conversationnels ouverts sans workflow métier défini sur WhatsApp Business.
- **Remplacement** : Parser déterministe en ligne 1 + fallback Gemini Flash Lite avec Structured Outputs stricts.

### 2. Google Maps / Routes API pour le Trafic de Dakar :
- **Pourquoi rejeté** :
  1. Facturation Google Maps à 5,00 $ pour 1 000 requêtes. Avec des rafraîchissements réguliers, le coût atteindrait plusieurs centaines de dollars par mois.
  2. Google Maps n'offre aucun moyen d'alimenter les signalements communautaires locaux dakaroises (accidents au péage, travaux sur l'Échangeur Aliou Sow).
- **Remplacement** : Moteur heuristique basé sur les cycles d'heures de pointe réelles de Dakar (06h45-10h15 entrant / 15h00-20h45 sortant) couplé aux 2 500 requêtes gratuites/jour de TomTom et aux signalements de la communauté.

### 3. ElevenLabs pour la Synthèse Vocale du Briefing :
- **Pourquoi rejeté** :
  1. Coût minimum de 5 à 22 $ / mois pour des quotas très restreints (100 000 caractères = environ 2 heures d'audio par mois).
  2. Avec 1 000 utilisateurs quotidiens, la facture exploserait à plus de 250 $ / mois (150 000 FCFA).
- **Remplacement** : `edge-tts` (Microsoft Neural Voices) en tâche de fond sur le serveur : voix française d'un naturel équivalent, latence imperceptible grâce à la mise en cache, et **0 FCFA de coût d'API**.

### 4. Prisma ORM :
- **Pourquoi rejeté** :
  1. Surchauffe mémoire (overhead Prisma Client de 40 à 60 Mo de RAM sous Node.js).
  2. Latence de démarrage et requêtes complexes moins optimisées que le pool brut `pg` avec migrations SQL idempotentes (`migrate-inline.js`).
- **Remplacement** : Maintien de PostgreSQL natif via `pg` (`backend/models/db.js`), éprouvé et ultra-rapide.

---

## 4. TABLEAU DE SYNTHÈSE DES RECOMMANDATIONS

| Domaine | Service Recommandé | Statut Actuel | Effort d'Intégration | Impact Utilisateur |
| :--- | :--- | :---: | :---: | :--- |
| **STT WhatsApp** | `Groq Whisper-large-v3-turbo` | À brancher | 2 heures | Rétention massive sur WhatsApp par les vocaux |
| **Rappels Fond** | `web-push` (VAPID) + Cron | À implémenter | 3 heures | Élimination du risque de rendez-vous manqué |
| **Intelligence** | `Gemini 2.0 Flash Lite` (Fallback) | À brancher | 2 heures | Compréhension fluide du français sénégalais |
| **Synthèse Audio** | `edge-tts` (Cache serveur) | À implémenter | 2 heures | Briefing agréable à écouter, flux podcast réparé |
| **Presse** | Synthèse quotidienne 3 thèmes | À automatiser | 1 heure | Fin des résumés tronqués à 180 caractères |

---

> **Bilan Stratégique** :  
> L'ensemble de cette architecture modernisée préserve le coût de fonctionnement de Surga **en-dessous de 50 FCFA par utilisateur actif par mois**, tout en éliminant l'intégralité des faiblesses perçues face aux applications concurrentes.
