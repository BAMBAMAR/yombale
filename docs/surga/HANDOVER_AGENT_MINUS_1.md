# 🤝 PROTOCOLE DE TRANSMISSION & HANDOVER — AGENT -1
## De la Capitalisation Nopalou vers les Audits Spécialisés (Agent 0 & Agent 1)

```text
DOCUMENT        : HANDOVER_AGENT_MINUS_1.md
ÉMETTEUR        : AGENT -1 — Audit Préalable de Capitalisation Nopalou → Surga
DESTINATAIRES   : AGENT 0 (Audit Post-Implémentation), AGENT 1 (Architecture & Technique), 
                  LEAD DEVELOPER & DIRECTION PRODUIT
DATE            : 5 Octobre 2026
STATUT          : HANDOVER OFFICIEL DE CLÔTURE DE L'AGENT -1
LIVRABLES LIÉS  : 1. docs/surga/CAPITALISATION_NOPALOU.md
                  2. docs/surga/AUDIT_CAPITALISATION.md
                  3. docs/surga/MATRICE_LECONS_NOPALOU_SURGA.md
```

---

## 1. SYNTHÈSE DE LA MISSION DE L'AGENT -1

L'**Agent -1** a été mandaté pour auditer la capitalisation réelle de l'expérience Nopalou sur le nouveau produit Surga avant toute nouvelle phase de développement ou de correction.

Le résultat de nos investigations est sans appel :
1. **Capitalisation de surface réussie** : Les contraintes formelles visibles (interdiction des émojis Unicode dans l'UI Web, séparation déterministe de la calculatrice, découpage des composants < 450 lignes, respect de la charte CSS) ont été intégrées.
2. **Capitalisation structurelle en échec critique (Taux de conformité sur règles obligatoires : 30%)** :
   - Surga a réintroduit **5 failles majeures** qui sont des répliques exactes de bugs historiques sévèrement corrigés sur Nopalou :
     - IDOR sur données personnelles (`LEC-01` / `AUD-132`)
     - Activation d'abonnement sans validation Wave/OM (`LEC-02` / `AUD-108`)
     - Déconnexion silencieuse de la base de données via `catch` vides (`LEC-03` / `AUD-017`)
     - Abandon muet et boutons e-commerce sur les vocaux WhatsApp (`LEC-06` / `AUD-201`)
     - Falsification dynamique des dates sur les flux en panne (`LEC-08` / `AUD-096`)

---

## 2. LES 5 BLOQUANTS CRITIQUES (P0) TRANSMIS À L'AGENT 0 ET L'AGENT 1

Ces 5 points sont classés **P0**. Aucun déploiement ni extension de fonctionnalités ne doit avoir lieu avant leur résolution étanche :

```text
+---------------------------------------------------------------------------------------------------+
| ID BLOQUANT | FICHIERS CONCERNÉS               | CONSTAT MATÉRIEL                                  |
+-------------+----------------------------------+---------------------------------------------------+
| BLOC-P0-01  | backend/routes/surga/donnees.js  | Export et suppression des données personnelles    |
|             | backend/services/donnees-service | accessibles sur simple paramètre ?phone= sans JWT |
+-------------+----------------------------------+---------------------------------------------------+
| BLOC-P0-02  | backend/routes/surga/abonn...    | /api/surga/abonnements/verifier active 1 an       |
|             | backend/services/abonnement...   | Premium sans webhook ni vérification Wave/OM     |
+-------------+----------------------------------+---------------------------------------------------+
| BLOC-P0-03  | backend/services/surga/immo...   | 4 services importent require('../../db')          |
|             | .../concours, .../places, .../tr | inexistant et tournent sur mocks en mémoire       |
+-------------+----------------------------------+---------------------------------------------------+
| BLOC-P0-04  | backend/services/whatsapp-cha... | Les vocaux WhatsApp sont captés par le vieux bot  |
|             | backend/services/surga/whatsa... | Nopalou qui sert des boutons e-commerce           |
+-------------+----------------------------------+---------------------------------------------------+
| BLOC-P0-05  | backend/services/surga/rss-co... | Briefing servant des articles de secours avec     |
|             |                                  | date réécrite par new Date()                      |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. PROPOSITIONS DE MODIFICATIONS DOCUMENTAIRES OBLIGATOIRES

Conformément aux directives de la mission (§ 26 et § 27), l'Agent -1 propose formellement les amendements suivants pour transformer les leçons Nopalou en **mémoire permanente des spécifications Surga** :

### Proposition 1 : `CLAUDE_SURGA.md` — Section 9 (Sécurité Multi-Tenant & API)
- **Règle à ajouter** :
  > *« Interdiction formelle du middleware `tokenOptional` sur toute route d'exportation, de consultation ou de suppression de données privées (`/api/surga/donnees/*`). L'accès à ces routes exige obligatoirement une session JWT active et valide (`requireAuth`), ou une vérification préalable par OTP WhatsApp avec signature de session temporaire. Un numéro de téléphone fourni en query string ou en body ne constitue en aucun cas une preuve d'identité valide. »*
- **Raison** : Bloquer définitivement la réincarnation de la faille `AUD-132` (portail locataire sans OTP).
- **Priorité** : **P0 (Immédiate)**.

### Proposition 2 : `docs/surga/CAHIER_DES_CHARGES.md` — Section 5 (Monétisation & Abonnements)
- **Règle à ajouter** :
  > *« L'activation de tout abonnement Premium (B2C) ou Partenaire (B2B) ne peut s'effectuer que par l'un des deux canaux sécurisés suivants : 1) Réception et validation cryptographique d'un webhook officiel Wave / Orange Money avec signature HMAC vérifiée ; ou 2) Interrogation synchrone et certifiée de l'état de la transaction via l'API officielle de la passerelle (`wave.getCheckoutSession`). Toute route activant un abonnement sur simple fourniture d'une référence textuelle non corroborée est strictement proscrite. »*
- **Raison** : Empêcher le contournement financier des abonnements (`AUD-108/109`).
- **Priorité** : **P0 (Immédiate)**.

### Proposition 3 : `docs/surga/INTEGRATION_NOPALOU.md` — Section 1.2 & 2 (Stack & Connecteurs DB)
- **Règle à ajouter** :
  > *« Tout service Surga manipulant des données persistantes doit impérativement importer le pool PostgreSQL centralisé via `require('../../models/db')` (ou `const { pool } = require('../../models/db')`). Il est formellement interdit d'utiliser un bloc `catch` vide masquant l'absence du connecteur DB pour basculer sur des mocks statiques en production. En cas d'indisponibilité de la base, le service doit émettre un log d'erreur explicite et renvoyer une erreur structurée `{ success: false, error: 'Base de données indisponible' }`. »*
- **Raison** : Éradiquer les erreurs 500 muettes et l'exécution sur mocks fantômes (`AUD-012/017`).
- **Priorité** : **P0 (Immédiate)**.

### Proposition 4 : `docs/surga/PRD.md` — Section 4 (User Story US4 & US11 — Audio & Voix)
- **Règle à ajouter** :
  > *« La chaîne de traitement audio WhatsApp doit être strictement dissociée du bot e-commerce de Nopalou. Toute note vocale entrante adressée à Surga doit faire l'objet d'une séquence technique séquentielle : Téléchargement sécurisé → Transcription Speech-to-Text (STT) → Analyse d'intention → Formulation d'une demande de confirmation textuelle. Si le service STT est temporairement indisponible, le système doit notifier clairement son incapacité technique et inviter l'utilisateur à taper son message, sans jamais promettre une prise en compte imaginaire ni afficher des options de commande de marchandises. »*
- **Raison** : Traiter la rupture `AUD-201` sur les vocaux WhatsApp.
- **Priorité** : **P1 (Élevée)**.

### Proposition 5 : `docs/surga/DECISIONS.md` — Nouvelle Décision D21 (Fraîcheur des Données de Presse)
- **Règle à ajouter** :
  > *« Décision D21 : Intégrité temporelle et transparence des sources. Tout contenu affiché dans le briefing quotidien Surga doit obligatoirement être rattaché à son URL source canonique et conserver son horodatage de publication d'origine immuable. Il est rigoureusement interdit de réécrire la date de publication avec l'heure courante `new Date()` sur du contenu archivé ou issu de jeux de secours. Si aucune actualité de moins de 24h n'est disponible, l'interface doit afficher explicitement la mention 'Briefing en mode archive locale'. »*
- **Raison** : Préserver la réassurance utilisateur et respecter la déontologie éditoriale (`AUD-096/173`).
- **Priorité** : **P1 (Élevée)**.

---

## 4. CHECKLIST D'ENGAGEMENT POUR LES AGENTS SUIVANTS

Pour garantir que la chaîne d'audit et de correction ne dévie pas, les agents spécialisés doivent valider cette checklist :

### 🎯 Pour l'Agent 0 (Audit Post-Implémentation) :
- [ ] Confirmer les 5 points de rupture matérielle sur la base locale et l'API Express.
- [ ] Vérifier que le statut de Surga n'est pas déclaré "100% fonctionnel" sur la seule base des tests unitaires Jest.
- [ ] Rejouer les tests `TEST-CAP-01` à `TEST-CAP-07` définis dans la Matrice de Capitalisation.

### 🏗️ Pour l'Agent 1 (Architecture & Technique) :
- [ ] Corriger immédiatement les imports `require('../../models/db')` dans les 4 services déconnectés.
- [ ] Remplacer les 4 annonces immo factices par l'interrogation de la vraie table `annonces_immo` (1 649 biens).
- [ ] Supprimer les blocs `catch` silencieux et brancher `safeError.js` ou un logger centralisé.

### 🔒 Pour l'Agent 7 (Sécurité & Confidentialité) :
- [ ] Supprimer l'usage de `tokenOptional` dans `/api/surga/donnees/*`.
- [ ] Verrouiller l'endpoint `/api/surga/abonnements/verifier` avec validation HMAC Wave ou interrogation API.
- [ ] Vérifier qu'aucun numéro de téléphone d'utilisateur ne peut être scanné de manière itérative.

### 🎙️ Pour l'Agent 5 (Voix & WhatsApp) :
- [ ] Router les messages audio WhatsApp vers un service de transcription dédié.
- [ ] Isoler totalement la réponse WhatsApp pour empêcher l'affichage de boutons Nopalou marketplace.

---

## 5. RÈGLE FINALE DE DÉPLOIEMENT

> **Rappel de la Règle Absolue du Dépôt** :  
> L'assistant et les agents ne doivent **JAMAIS exécuter de `git push`** de leur propre initiative.  
> Toute modification de code doit être testée localement, documentée dans `CLAUDE.md`, et attendre une instruction explicite de l'utilisateur pour être poussée sur la branche de déploiement.
