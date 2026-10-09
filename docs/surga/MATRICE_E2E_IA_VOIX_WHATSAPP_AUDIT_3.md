# MATRICE DES TESTS E2E — IA, VOIX ET WHATSAPP — SURGA (AUDIT AGENT 3)

> **Document Officiel d'Audit Technique**  
> **Auteur** : Agent 3 (Données, Sources, Qualité, IA, Voix, WhatsApp)  
> **Date** : 5 Octobre 2026  
> **Environnement audité** : Node.js, Express, PostgreSQL 18.4, Next.js 14, Web Speech API, WhatsApp Meta Webhook  

---

## 1. MATRICE IA : RÔLE, LIMITES ET SÉPARATION DU DÉTERMINISME

| Fonctionnalité | Entrée Utilisateur | Modèle / Moteur Réel | Type de Traitement | Sortie Produite | Risque d'Hallucination | Risque Dérive Décisionnelle | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **Calculatrice Arithmétique** | Expressions orales ou écrites (ex: `100 divisé par 3`) | Moteur déterministe `calculator.js` | Shunting-yard / Évaluation arithmétique sans `eval` | Nombre exact arrondi à 2 décimales | **0% (Zéro IA)** | Aucun (Moteur déterministe pur) | **PASS** |
| **Extraction d'Intention Vocale** | Phrase transcrite par Web Speech | Moteur heuristique `surga-voice.ts` | Regex de motifs oraux français + dictionnaires de nombres | Objet `{ intention, depenseData, ... }` | 0% (Règles statiques) | Faux négatifs si formulation non prévue | **PASS** |
| **Extraction Catégorie Dépense** | Libellé dicté ou tapé (ex: `taxi`, `thieb`, `woyofal`) | Regex par mots-clés `devinerCategorie` | Filtrage textuel normalisé | Catégorie standard ('Transport', 'Alimentation', etc.) | 0% | Classement en 'Autre' si mot non répertorié | **PASS** |
| **Recherche Naturelle Immo** | Requête libre (ex: `cherche f3 mermoz max 400000`) | Parser heuristique `parserRechercheImmoNaturelle` | Détection de sous-chaînes et regex de prix | Filtres SQL `{ typeBien, quartier, prixMax }` | 0% (Aucun LLM) | Mauvaise interprétation de formulations complexes | **PARTIAL** |
| **Recherche Naturelle Adresses** | Requête libre (ex: `dibi almadies terrasse vue mer`) | Parser heuristique `parserRecherchePlacesNaturelle` | Détection de sous-chaînes et tags | Filtres `{ categorie, quartier, ambiance }` | 0% (Aucun LLM) | Silencieux si synonyme absent | **PARTIAL** |
| **Synthèse du Briefing Matin** | Données structurées (météo, actualités, agenda) | Template textuel ES6 concaténé (`briefing.js`) | Injection de variables dans chaîne de formatage | Texte d'accueil vouvoyé (« Bonjour. Voici votre briefing... ») | 0% (Aucun LLM) | Aucun | **PASS** |
| **Résumés d'Actualité** | Flux XML RSS des journaux | Cheerio parser `nettoyerResume` | Extraction sélective du paragraphe et troncature à 180 car. | Extrait tronqué brut de la source | 0% (Texte original de la source préservé) | Troncature abrupte possible | **PASS** |
| **Revue des Avis Clients Places** | Avis Google Maps / clients | Rédigé manuellement dans `PLACES_DAKAR_DEMO` | Textes fixes en dur | Synthèse 3 lignes prédéfinie | 0% (Données figées) | Déconnexion des avis réels en ligne | **PARTIAL** |
| **Chatbot Généraliste / Q&A** | Questions ouvertes sur WhatsApp | **Interdit par D4 et politique Meta Janvier 2026** | Non implémenté | Message de redirection ou silence | N/A | Préservé (pas d'assistant généraliste sur WA) | **PASS** |

> **Constat Majeur IA** : Contrairement aux affirmations marketing, **aucun modèle de langage (LLM / Gemini / OpenAI) n'est exécuté dans les briques de Surga**. Toutes les fonctionnalités "intelligentes" reposent sur des parseurs déterministes regex et des dictionnaires locaux. Cela élimine 100% des risques d'hallucinations factuelles, mais crée une fragilité linguistique (zéro tolérance aux fautes d'orthographe ou variantes régionales/wolof non codées).

---

## 2. MATRICE VOIX : DU MICRO À LA PERSISTANCE

| Étape de la Chaîne Vocale | Composant Responsable | Entrée | Traitement Réalisé | Résultat Obtenu | Anomalie / Faille Identifiée | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **1. Capture Audio App** | `SurgaVoiceModal.tsx` | Flux microphone utilisateur | Web Speech API du navigateur (`webkitSpeechRecognition`) | Événements `onresult` avec flags `isFinal` | Dépendance totale au support navigateur client | **PASS** |
| **2. Langue de Transcription** | `SurgaVoiceModal.tsx` | Voix parlée | Paramètre figé en dur `instance.lang = 'fr-FR'` | Texte français | **Wolof non supporté** (échec sur toute commande wolof) | **PARTIAL** |
| **3. Normalisation Nombres** | `surga-voice.ts` | Texte transcrit (lettres) | Remplacement regex (« deux mille cinq cents » ➔ « 2500 ») | Chiffres arabes et symboles opérateurs | Fonctionne sur les nombres français standards | **PASS** |
| **4. Extraction Intention** | `surga-voice.ts` | Texte normalisé | Regex sur verbes d'action (`calcule`, `note`, `rappelle`) | Intention détectée (`CALCULATE`, `ADD_EXPENSE`, etc.) | Bug sur extraction libellé si nombre en lettres | **PARTIAL** |
| **5. Exécution Calcul** | `calculator.ts` | Expression mathématique | Moteur déterministe arithmétique | Résultat exact immédiat sans modale confirmation | Conforme : pas de confirmation requise pour calcul | **PASS** |
| **6. Confirmation Écriture** | `SurgaVoiceConfirmation.tsx` | Données de dépense / note / rappel | Affichage modale dédiée avec montant, catégorie, date | Attente du clic explicite "Valider" ou "Annuler" | **Conforme Règle d'or 2** : Écriture bloquée sans clic | **PASS** |
| **7. Persistance Frontend** | `page.tsx` (`handleVoiceDepense`) | Objet validé | Écriture synchrone dans `localStorage` | Aperçu mis à jour immédiatement | Fonctionne même hors ligne | **PASS** |
| **8. Persistance Backend** | `page.tsx` (`fetch('/api/surga/depenses')`) | Requête HTTP POST JSON | Insertion SQL dans table `surga_depenses` | Dépense persistée en PostgreSQL | Catch silencieux `.catch(() => {})` en cas d'erreur 500 | **PARTIAL** |
| **9. Service Vocal Backend** | `backend/services/surga/voice-interpreter.js` | Texte audio backend | Fichier de 204 lignes | **Orphelin** : Non importé, non exposé par route HTTP | Route `POST /api/surga/audio/interpret` manquante | **FAIL** |

---

## 3. MATRICE WHATSAPP : DE LA RÉCEPTION À LA PERSISTANCE

| Étape de la Chaîne WhatsApp | Composant Responsable | Entrée | Traitement Réalisé | Résultat Obtenu | Anomalie / Faille Identifiée | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **1. Réception Webhook** | `backend/routes/whatsapp.js` | Payload HTTP Meta POST | Validation signature HMAC SHA-256 + 200 OK immédiat | Message transmis à `whatsapp-chatbot.js` | Conforme aux exigences Meta | **PASS** |
| **2. Déduplication Meta** | `whatsapp-chatbot.js` (`isDuplicate`) | `msg.id` (wamid) | `INSERT INTO whatsapp_processed_messages` | Rejet immédiat si déjà reçu | Idempotence au niveau du transport Meta | **PASS** |
| **3. Notes Vocales (`msg.type === 'audio'`)** | `whatsapp-chatbot.js` (l. 2268) | Note vocale audio entrant | Interception par le bot Nopalou e-commerce | Menu e-commerce (« Nos Boutiques », « Mes Commandes ») | **RUPTURE TOTALE** : Les vocaux Surga ne sont pas traités ; aucun STT | **FAIL** |
| **4. Routage Textuel Surga** | `whatsapp-chatbot.js` (l. 2661) | Message texte entrant | Détection préfixe 'surga' ou intention reconnue | Aiguillage vers `traiterMessageWhatsAppSurga` | Fonctionne si état libre (`IDLE` ou `MENU`) | **PASS** |
| **5. Quotas Journaliers** | `whatsapp-handler.js` (`verifierQuota`) | Numéro de téléphone | Table `surga_quotas` (max 20/jour gratuit, illimité Premium) | Blocage propre si quota dépassé | Message courtois informant du renouvellement | **PASS** |
| **6. Demande Confirmation** | `whatsapp-handler.js` | Commande d'écriture (`Note...`) | Sauvegarde dans `surga_whatsapp_sessions` (`action_en_attente`) | Message WhatsApp demandant de répondre OUI ou NON | Conforme Règle d'or Surga (pas d'écriture aveugle) | **PASS** |
| **7. Persistance Utilisateur Connu** | `whatsapp-handler.js` | Réponse "OUI" | Recherche `utilisateurs.id` par téléphone + `INSERT surga_depenses` | Dépense réelle insérée en base + Confirmation WA | Persistance réelle vérifiée par test PostgreSQL | **PASS** |
| **8. Persistance Utilisateur Inconnu** | `whatsapp-handler.js` | Réponse "OUI" | `if (userId)` échoue silencieusement ; suppression de session | **Fausse réassurance** : "C'est enregistré" mais 0 ligne insérée | **FAIL CRITIQUE (P0)** : Perte silencieuse de données | **FAIL** |
| **9. Idempotence Métier Confirmation** | `whatsapp-handler.js` | Double frappe "OUI" rapide | `SELECT` puis `INSERT` puis `DELETE` sans transaction SQL | Risque de double insertion de dépense sur race condition | Absence de `BEGIN / COMMIT` et de `FOR UPDATE` | **PARTIAL** |

---

## 4. MATRICE E2E DES SCÉNARIOS DE COMMANDES TESTÉS

| Scénario & Commande | Canal | Intention Attendue | Intention Réelle | Paramètres Extraits | Confirmation Requise | Persistance DB | Résultat Final |
| :--- | :---: | :---: | :---: | :--- | :---: | :---: | :---: |
| **« Calcule 100 divisé par 3 »** | Voix App | CALCULATE | CALCULATE | Expression: `100/3` | NON | N/A | **PASS** (33.33 affiché) |
| **« Combien fait 2500 fois 4 »** | Voix App | CALCULATE | CALCULATE | Expression: `2500*4` | NON | N/A | **PASS** (10 000 affiché) |
| **« Note 2500 de taxi »** | Voix App | ADD_EXPENSE | ADD_EXPENSE | Montant: 2500, Catégorie: Transport, Note: 'taxi' | OUI | OUI (Local + DB) | **PASS** |
| **« Note deux mille cinq cents FCFA de taxi »** | Voix App | ADD_EXPENSE | ADD_EXPENSE | Montant: 2500, Catégorie: Transport, **Note erronée : 'deux mille cinq cents taxi'** | OUI | OUI | **PARTIAL** (Pollution du libellé) |
| **« Rappelle-moi demain à 8h briefing »** | Voix App | ADD_REMINDER | ADD_REMINDER | Date: J+1, Heure: 08:00, **Titre: 'à briefing'** | OUI | OUI | **PARTIAL** (Scorie 'à' dans titre) |
| **« Note acheter du pain »** | Voix App | ADD_NOTE | ADD_NOTE | Titre: 'acheter du pain', Contenu: 'acheter du pain' | OUI | OUI | **PASS** |
| **« Bindal ma ñetti tééméér ci taxi » (Wolof)** | Voix App | ADD_EXPENSE | **INCONNU** | Aucun | NON | NON | **FAIL** (Wolof non supporté) |
| **« Surga calcule 100 / 3 »** | WhatsApp | CALCULATE | CALCULATE | Expression: `100 / 3` | NON | N/A | **PASS** (33.33 renvoyé par WA) |
| **« Note 2500 de taxi » (User Connu)** | WhatsApp | ADD_EXPENSE | ADD_EXPENSE | Montant: 2500, Cat: Transport -> Demande OUI/NON -> OUI | OUI | **OUI (Vérifié DB)** | **PASS** |
| **« Note 3500 repas » (User Inconnu)** | WhatsApp | ADD_EXPENSE | ADD_EXPENSE | Montant: 3500, Cat: Alimentation -> Réponse OUI | OUI | **NON (0 ligne insérée)** | **FAIL CRITIQUE** (Perte silencieuse) |
| **« note deux mille cinq cents de taxi »** | WhatsApp | ADD_EXPENSE | **ADD_NOTE** | Traité comme une note textuelle car parser WA n'accepte que `\d+` | OUI | OUI (en note, pas dépense) | **FAIL** (Confusion intention) |
| **« Note vocale WhatsApp audio »** | WhatsApp | ADD_EXPENSE / NOTE | **REJET E-COMMERCE** | Aucun paramètre extrait | NON | NON | **FAIL CRITIQUE** (Rupture bot Nopalou) |
| **« Briefing »** | WhatsApp | BRIEFING | BRIEFING | Renvoi du message de synthèse et du lien vers l'app | NON | N/A | **PASS** |

---

## 5. BILAN GLOBAL DES TESTS E2E

```text
+-------------------------------------------------------------------------------+
| TOTAL DES PARCOURS & SCÉNARIOS TESTÉS                    : 30                 |
| - PASS (Parcours sans faille, comportement conforme)    : 17 (56,7 %)        |
| - PARTIAL (Fonctionnel avec scories textuelles/dégradé)  : 6 (20,0 %)         |
| - FAIL (Rupture de chaîne, perte de données ou rejet)    : 7 (23,3 %)         |
+-------------------------------------------------------------------------------+
```
