# REGISTRE DES INCERTITUDES ET POINTS À ÉLUCIDER — NOPALOU

```text
SESSION-ID: NOPALOU-AUDIT-AGENT-03-20261004-0155
AGENT: AGENT-03
PHASE: FAILURE-ANALYSIS
DATE: 2026-10-04
VERSION DU PROJET: 4c0237273fde2d058d5eabca5f94b79ceb07d37e
PROCHAINE SESSION ATTENDUE: AGENT-04 (CONTRE-EXPERTISE INDÉPENDANTE)
```

---

## 1. PRINCIPE DIRECTEUR

> **Règle fondamentale d'audit** : Une absence de preuve ne doit jamais être transformée en certitude. Tout point dont la démonstration n'est pas absolue à 100% à partir du code, des données ou des traces d'exécution doit être consigné comme une incertitude ouverte soumise à la contre-expertise de l'Agent 4.

---

## 2. REGISTRE DES QUESTIONS NON RÉSOLUES

---

### INCERTITUDE-001

* **ANOMALIE ASSOCIÉE** : `ANOM-004` (Paiement Wave 502 vs Fallback Manuel)
* **QUESTION NON RÉSOLUE** :
  L'annulation de commande avec HTTP 502 dans `catch (waveErr)` a-t-elle été conçue comme une mesure de protection délibérée (ticket `AUD-083`) parce que l'interface du panier web (`DrawerCartCheckout.tsx`) était incapable d'afficher les instructions de repli manuel Wave, ou s'agit-il d'une asymétrie accidentelle qui doit être alignée sur le modèle Orange Money ?
* **ÉLÉMENTS DISPONIBLES** :
  - Le commentaire dans `backend/routes/comptabilite.js:985-986` indique :
    `// AUD-083 : comme la route express, la commande sans session de paiement est annulée et le stock restitué (auparavant : 201 + paiement manuel que le panier n'affichait pas, annulation silencieuse 2 h plus tard).`
  - Le document `CLAUDE.md:58` mentionne au contraire un standard unifié :
    `Fallback Élégant en Cas d'Erreur API Wave/OM : Si l'API Wave ou Orange Money rencontre une clé invalide ou révoquée, le système bascule proprement sur le paiement manuel avec numéro de dépôt...`
  - Orange Money retourne HTTP 201 avec `fallback_manuel: true` et `numero_depot: '777202086'` sans annuler la commande.
* **ÉLÉMENTS MANQUANTS** :
  - Validation du comportement dynamique du composant frontend `DrawerCartCheckout.tsx` et du hook `useDrawerCartCheckout.ts` lorsqu'ils reçoivent une réponse 201 avec `fallback_manuel: true` pour le moyen de paiement Wave.
* **ACTION NÉCESSAIRE POUR CONCLURE (AGENT 4)** :
  - Examiner en détail `frontend-next/src/hooks/useDrawerCartCheckout.ts` pour vérifier si le frontend sait afficher l'encart de paiement manuel lors d'un fallback Wave sans crasher ni bloquer l'utilisateur.

---

### INCERTITUDE-002

* **ANOMALIE ASSOCIÉE** : `ANOM-003` (Périmètre de l'omission de journalisation dans `security_audit_vault`)
* **QUESTION NON RÉSOLUE** :
  Quel est le périmètre exact des endpoints du backend Express qui effectuent une vérification de droits via `checkBoutiqueAccess()` mais omettent d'enregistrer la violation dans `security_audit_vault` ?
* **ÉLÉMENTS DISPONIBLES** :
  - `POST /api/boutiques/:id/produits` est formellement démontré comme omettant l'audit log.
  - L'inspection de `backend/routes/boutiques-modules/boutiques-produits.js` montre que `PUT /:id/produits/:prodId` et `DELETE /:id/produits/:prodId` partagent le même motif de code.
  - Le middleware `requireBoutiqueOwnership()` (`backend/middlewares/tenantSecurity.js`), qui intègre la journalisation automatique, est disponible mais non utilisé sur ce module.
* **ÉLÉMENTS MANQUANTS** :
  - Inventaire exhaustif des 18 autres fichiers sous `backend/routes/boutiques-modules/` (ex: `boutiques-clients.js`, `boutiques-livreurs.js`, `boutiques-promotions.js`, `credits.js`, `boutiques-devises.js`).
* **ACTION NÉCESSAIRE POUR CONCLURE (AGENT 4)** :
  - Scanner l'arborescence complète des routes `backend/routes/boutiques-modules/` pour cartographier exhaustivement toutes les routes non conformes à la politique de journalisation IDOR.

---

### INCERTITUDE-003

* **ANOMALIE ASSOCIÉE** : `ANOM-001` (Inscription et persistance du téléphone)
* **QUESTION NON RÉSOLUE** :
  Le flux d'inscription alternatif par OTP WhatsApp (`/api/auth/whatsapp-otp-register`) persiste-t-il correctement le numéro de téléphone, ou souffre-t-il également d'une lacune similaire ?
* **ÉLÉMENTS DISPONIBLES** :
  - Seul le flux d'inscription classique email/mot-de-passe `POST /api/auth/inscription` a été exécuté dans le cadre de `TEST-001`.
  - La table `utilisateurs` possède bien la colonne `telephone VARCHAR(20)`.
* **ÉLÉMENTS MANQUANTS** :
  - Traces d'exécution et requêtes SQL générées lors du flux `POST /api/auth/whatsapp-otp-register`.
* **ACTION NÉCESSAIRE POUR CONCLURE (AGENT 4)** :
  - Inspecter les lignes 680-750 de `backend/routes/auth.js` pour déterminer si `whatsapp-otp-register` peuple la colonne `telephone` ou uniquement `a2f_telephone`.

---

### INCERTITUDE-004

* **ANOMALIE ASSOCIÉE** : `ANOM-002`, `ANOM-005`, `ANOM-006` (Divergences de routes REST)
* **QUESTION NON RÉSOLUE** :
  Faut-il modifier le plan de tests pour refléter les routes effectives du système, ou convient-il d'introduire des redirections / alias d'API (ex: `router.get('/moi', (req, res) => res.redirect(307, '/api/auth/profil'))` ou alias middleware) pour offrir une surface d'API plus conventionnelle ?
* **ÉLÉMENTS DISPONIBLES** :
  - Le frontend officiel de Nopalou fonctionne de manière totalement synchrone avec les routes réelles (`/api/auth/profil`, `/pos-sessions`, `/locatif-immo/agence/:slugOrId/baux`).
  - Aucun client officiel n'est actuellement en échec en production.
* **ÉLÉMENTS MANQUANTS** :
  - Décision d'architecture produit : Nopalou prévoit-il d'exposer une API publique documentée (OpenAPI/Swagger) pour des développeurs tiers, ce qui justifierait des alias de normalisation REST ?
* **ACTION NÉCESSAIRE POUR CONCLURE (AGENT 4 / ÉQUIPE PRODUIT)** :
  - Confirmer si ces divergences constituent une dette de spécification d'audit (à corriger dans `PLAN_TESTS.md`) ou une opportunité d'enrichissement par alias rétro-compatibles.
