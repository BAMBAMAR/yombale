# Plan de Tests Exhaustif de la Plateforme Nopalou

Ce plan de tests constitue le protocole opératoire d'audit pour l'Agent 2. Chaque cas de test est conçu de manière autonome, reproductible, sans ambiguïté et assorti de critères d'acceptation objectifs et de preuves exigées.

---

## SECTION 1 : Authentification, Gestion des Sessions & Conformité RGPD

### TEST-001 : Inscription Utilisateur et Normalisation des Données
* **ID** : `TEST-001`
* **FEATURE** : `FEATURE-001`
* **PARCOURS** : `PARCOURS-07`
* **OBJECTIF** : Vérifier que l'inscription d'un nouvel utilisateur enregistre correctement le compte avec email normalisé en minuscules et numéro de téléphone au format international sénégalais.
* **CRITICITÉ** : P0
* **PRÉCONDITIONS** : Base de données locale active, serveur backend à l'écoute sur port 3000.
* **DONNÉES** : Payload : `{ "nom": "Ndiaye", "prenom": "Aminata", "email": "Aminata.NDIAYE@Example.com", "telephone": "77 123 45 67", "mot_de_passe": "TestPassword2026!" }`.
* **ÉTAPES** :
  1. Émettre une requête `POST /api/auth/inscription` avec le payload de test.
  2. Vérifier le code de réponse HTTP et le payload JSON retourné.
  3. Interroger la base PostgreSQL : `SELECT id, email, telephone, mot_de_passe, jwt_version FROM utilisateurs WHERE email='aminata.ndiaye@example.com'`.
* **RÉSULTAT ATTENDU** : HTTP 201 Created, champ `email` persisté en minuscules strictes (`aminata.ndiaye@example.com`), téléphone persisté normalisé (`+221771234567`), mot de passe haché par bcrypt (débutant par `$2`), `jwt_version` initialisé à 1.
* **CRITÈRE PASS** : Le compte est inséré avec email normalisé, mot de passe non lisible en clair et token de session retourné.
* **CRITÈRE FAIL** : HTTP != 201, mot de passe stocké en clair, email préservant les majuscules, ou plantage serveur 500.
* **PREUVE ATTENDUE** : Extrait de la réponse HTTP JSON et résultat de la requête SQL `SELECT`.
* **DÉPENDANCES** : Aucune.
* **TESTS DE RÉGRESSION ASSOCIÉS** : `TEST-002`, `TEST-003`.

---

### TEST-002 : Invalidation Instantanée de Session JWT sur Déconnexion (Fix AN-002)
* **ID** : `TEST-002`
* **FEATURE** : `FEATURE-002`
* **PARCOURS** : `PARCOURS-07`
* **OBJECTIF** : Vérifier que la déconnexion d'un utilisateur incrémente son `jwt_version` en base et rend immédiatement inutilisable tout token de session précédemment émis.
* **CRITICITÉ** : P0
* **PRÉCONDITIONS** : Compte existant créé via `TEST-001`.
* **DONNÉES** : Identifiants de `TEST-001`.
* **ÉTAPES** :
  1. Se connecter via `POST /api/auth/connexion` et extraire le token JWT retourné (`TOKEN_A`).
  2. Émettre une requête authentifiée `GET /api/auth/profil` (ou alias `GET /api/auth/moi`) avec `Authorization: Bearer TOKEN_A` -> Doit réussir (HTTP 200).
  3. Émettre `POST /api/auth/deconnexion` avec `TOKEN_A`.
  4. Réémettre immédiatement `GET /api/auth/profil` (ou alias `GET /api/auth/moi`) avec le même `TOKEN_A`.
* **RÉSULTAT ATTENDU** : L'étape 4 doit retourner strictement HTTP 401 Unauthorized avec le message `"Session révoquée, veuillez vous reconnecter"`.
* **CRITÈRE PASS** : Le token `TOKEN_A` est immédiatement rejeté post-déconnexion.
* **CRITÈRE FAIL** : L'étape 4 retourne HTTP 200, prouvant que le token demeure actif malgré la déconnexion.
* **PREUVE ATTENDUE** : Traces HTTP montrant la réponse 401 à l'étape 4 et la valeur incrémentée de `jwt_version` dans `utilisateurs`.
* **DÉPENDANCES** : `TEST-001`.
* **TESTS DE RÉGRESSION ASSOCIÉS** : `TEST-004`.

---

### TEST-003 : Étancheité Stricte des Secrets de Tokens (Fix AN-001)
* **ID** : `TEST-003`
* **FEATURE** : `FEATURE-003`
* **PARCOURS** : `PARCOURS-07`
* **OBJECTIF** : Vérifier qu'un jeton signé avec le secret de réinitialisation (`RESET_SECRET`) ou de vérification (`VERIFY_SECRET`) ne peut en aucun cas être utilisé comme jeton de session pour accéder aux endpoints privés.
* **CRITICITÉ** : P0
* **PRÉCONDITIONS** : Compte utilisateur existant.
* **DONNÉES** : Jeton généré artificiellement ou via la route mot de passe oublié avec `{ userId, type: 'reset' }` signé avec `RESET_SECRET` ou `JWT_SECRET`.
* **ÉTAPES** :
  1. Générer un jeton avec `type: 'reset'` ou déclencher `POST /api/auth/mot-de-passe-oublie`.
  2. Tenter d'accéder à `GET /api/auth/moi` en fournissant ce jeton dans `Authorization: Bearer <TOKEN>`.
* **RÉSULTAT ATTENDU** : HTTP 401 Unauthorized avec le code d'erreur explicite `"Ce jeton ne peut pas être utilisé comme session"`.
* **CRITÈRE PASS** : Rejet catégorique du jeton non-session.
* **CRITÈRE FAIL** : Le backend accepte le jeton et authentifie la requête (HTTP 200).
* **PREUVE ATTENDUE** : Réponse HTTP 401 avec corps JSON capturé.
* **DÉPENDANCES** : `backend/middlewares/auth.js`.
* **TESTS DE RÉGRESSION ASSOCIÉS** : `TEST-002`.

---

### TEST-004 : Suppression Autonome de Compte & Période de Grâce de 30 Jours (RGPD Art. 17)
* **ID** : `TEST-004`
* **FEATURE** : `FEATURE-004`
* **PARCOURS** : `PARCOURS-07`
* **OBJECTIF** : Vérifier qu'un utilisateur peut demander la suppression de son compte, que son accès est gelé avec délai de 30 jours, et qu'il peut annuler cette suppression en 1 clic.
* **CRITICITÉ** : P1
* **PRÉCONDITIONS** : Utilisateur connecté disposant d'un compte de test.
* **DONNÉES** : Mot de passe valide du compte.
* **ÉTAPES** :
  1. Appeler `POST /api/auth/supprimer-compte` avec `{ "mot_de_passe": "TestPassword2026!" }`.
  2. Vérifier en base : `SELECT supprime_le, supprime_par_utilisateur FROM utilisateurs WHERE id=$1`.
  3. Tenter d'appeler `GET /api/auth/statut-suppression` -> Doit indiquer `compte_en_suppression: true` avec le nombre de jours restants (30 jours).
  4. Appeler `POST /api/auth/annuler-suppression`.
  5. Vérifier en base : `SELECT supprime_le FROM utilisateurs WHERE id=$1` -> Doit être `NULL`.
* **RÉSULTAT ATTENDU** : Passage en sursis avec traçabilité `supprime_par_utilisateur = true`, puis restauration complète sans perte de données.
* **CRITÈRE PASS** : Sursis de 30 jours appliqué sans suppression physique immédiate, annulation fonctionnelle réinitialisant `supprime_le`.
* **CRITÈRE FAIL** : Suppression physique immédiate en base (DELETE direct), ou échec de l'annulation.
* **PREUVE ATTENDUE** : Dump des états de la ligne dans `utilisateurs` aux étapes 2 et 5.
* **DÉPENDANCES** : `TEST-001`.
* **TESTS DE RÉGRESSION ASSOCIÉS** : `TEST-002`.

---

## SECTION 2 : Sécurité Multi-Tenant & Contrôle d'Accès (Anti-IDOR)

### TEST-005 : Cloisonnement Multi-Tenant des Boutiques (Contrôle Anti-IDOR)
* **ID** : `TEST-005`
* **FEATURE** : `FEATURE-008`, `MOD-08`
* **PARCOURS** : `PARCOURS-02`
* **OBJECTIF** : Démontrer qu'un commerçant authentifié (Utilisateur B) ne peut ni lire ni modifier les commandes, clients ou produits de la boutique d'un autre commerçant (Boutique A).
* **CRITICITÉ** : P0
* **PRÉCONDITIONS** : Deux utilisateurs distincts (`UserA` possédant `BoutiqueA`, `UserB` possédant `BoutiqueB`).
* **DONNÉES** : Token de `UserB`, UUID de `BoutiqueA`.
* **ÉTAPES** :
  1. Avec le token de `UserB`, émettre `GET /api/comptabilite/<ID_BOUTIQUE_A>/commandes`.
  2. Avec le token de `UserB`, émettre `POST /api/boutiques/<ID_BOUTIQUE_A>/produits` avec un payload d'article.
  3. Vérifier la table `security_audit_vault` : `SELECT * FROM security_audit_vault WHERE user_id=$1 AND target_id=$2`.
* **RÉSULTAT ATTENDU** : Les deux requêtes doivent être rejetées en HTTP 403 Forbidden avec `{ "success": false, "error": "Accès non autorisé à cette boutique.", "code": "FORBIDDEN" }`. Deux événements `IDOR_BOUTIQUE_ACCESS_DENIED` doivent être consignés dans `security_audit_vault`.
* **CRITÈRE PASS** : Rejet strict 403 et journalisation de sécurité confirmée en base.
* **CRITÈRE FAIL** : Code HTTP 200, 201 ou fuite de données d'un commerçant vers un autre.
* **PREUVE ATTENDUE** : Réponses HTTP 403 et résultat de la requête SQL dans `security_audit_vault`.
* **DÉPENDANCES** : `backend/middlewares/tenantSecurity.js`.
* **TESTS DE RÉGRESSION ASSOCIÉS** : `TEST-006`.

---

### TEST-006 : Cloisonnement Multi-Tenant des Agences Immobilières
* **ID** : `TEST-006`
* **FEATURE** : `FEATURE-018`, `MOD-08`
* **PARCOURS** : `PARCOURS-05`
* **OBJECTIF** : Vérifier qu'un agent de l'Agence Immobilière X ne peut pas accéder aux baux, quittances ou loyers de l'Agence Y.
* **CRITICITÉ** : P0
* **PRÉCONDITIONS** : Deux agences distinctes (`AgenceX`, `AgenceY`) avec un agent authentifié pour chacune.
* **DONNÉES** : Token de l'agent X, UUID d'un bail appartenant à l'agence Y.
* **ÉTAPES** :
  1. Émettre `GET /api/locatif-immo/baux/<ID_BAIL_AGENCE_Y>` avec le token de l'Agent X.
* **RÉSULTAT ATTENDU** : HTTP 403 Forbidden immédiat.
* **CRITÈRE PASS** : Accès refusé en 403 sans révéler le contenu du bail.
* **CRITÈRE FAIL** : Données du bail retournées à l'agent tiers.
* **PREUVE ATTENDUE** : Code de statut HTTP 403 et payload d'erreur.
* **DÉPENDANCES** : `backend/middlewares/tenantSecurityImmo.js`.
* **TESTS DE RÉGRESSION ASSOCIÉS** : `TEST-005`.

---

## SECTION 3 : E-Commerce, Panier DrawerCart & Pipeline de Commande

### TEST-007 : Respect des 3 Modes de Livraison et Absence du Faux Libellé « Gratuit »
* **ID** : `TEST-007`
* **FEATURE** : `FEATURE-008`
* **PARCOURS** : `PARCOURS-01`
* **OBJECTIF** : Vérifier que le formulaire de panier (`DrawerCart`) présente fidèlement les options de livraison : "Retrait en boutique (Gratuit - 0 FCFA)" toujours disponible, et "Frais à convenir avec le vendeur" sans accoler la mention "Gratuit".
* **CRITICITÉ** : P1
* **PRÉCONDITIONS** : Boutique existante sans grille tarifaire de livraison configurée.
* **DONNÉES** : Consultation de la vitrine `/boutiques/:id`.
* **ÉTAPES** :
  1. Ajouter un article au panier.
  2. Ouvrir le tiroir panier (`DrawerCart`).
  3. Examiner les options de livraison proposées dans la liste déroulante ou les boutons radio.
* **RÉSULTAT ATTENDU** : L'option Retrait affiche explicitement "Gratuit" ou "0 FCFA". L'option "Frais à convenir avec le vendeur" affiche son intitulé sans aucun suffixe trompeur "— Gratuit".
* **CRITÈRE PASS** : Les libellés sont conformes à la spécification sans ambiguïté tarifaire pour l'acheteur.
* **CRITÈRE FAIL** : Présence de la chaîne "Gratuit" sur l'option de frais à convenir, ou absence de l'option de retrait.
* **PREUVE ATTENDUE** : Capture d'écran ou extrait DOM du composant `DrawerCartOnlineOrderForm.tsx`.
* **DÉPENDANCES** : `useDrawerCartCheckout.ts`.
* **TESTS DE RÉGRESSION ASSOCIÉS** : `TEST-008`.

---

### TEST-008 : Création d'une Commande Marchande & Non-Crash ReferenceError
* **ID** : `TEST-008`
* **FEATURE** : `FEATURE-009`
* **PARCOURS** : `PARCOURS-01`
* **OBJECTIF** : Valider la création d'une commande complète via panier sur `POST /api/comptabilite/:id/commandes` et certifier la résolution de l'exception `ReferenceError: commande is not defined` dans `notifierVendeurCommande`.
* **CRITICITÉ** : P0
* **PRÉCONDITIONS** : Boutique avec au moins 1 article en stock suffisant.
* **DONNÉES** : Payload de commande : `{ "articles": [{ "id": "<PRODUIT_ID>", "quantite": 2 }], "nom_client": "Moussa Diop", "telephone_client": "771234567", "adresse_livraison": "Médina Rue 6", "mode_paiement": "cash" }`.
* **ÉTAPES** :
  1. Envoyer la requête `POST /api/comptabilite/<BOUTIQUE_ID>/commandes`.
  2. Contrôler le code de réponse HTTP et le JSON.
  3. Vérifier l'insertion dans `commandes_boutique` et `commandes_boutique_items`.
* **RÉSULTAT ATTENDU** : HTTP 201 Created, `{ "success": true, "commande": { "id": "...", "montant_total": ... } }`. Aucune exception 500 dans les logs backend.
* **CRITÈRE PASS** : Commande insérée, total calculé exact, pas d'erreur 500.
* **CRITÈRE FAIL** : Crash HTTP 500 avec `ReferenceError: commande is not defined` ou commande non insérée.
* **PREUVE ATTENDUE** : Réponse HTTP 201 capturée et log serveur vierge d'erreur.
* **DÉPENDANCES** : `backend/services/commande-service.js`.
* **TESTS DE RÉGRESSION ASSOCIÉS** : `TEST-009`, `TEST-010`.

---

### TEST-009 : Initialisation d'un Paiement Wave & Orange Money
* **ID** : `TEST-009`
* **FEATURE** : `FEATURE-009`, `MOD-07`
* **PARCOURS** : `PARCOURS-01`
* **OBJECTIF** : Vérifier que le choix de paiement en ligne (Wave / Orange Money) génère l'URL de paiement correspondante ou bascule élégamment sur le dépôt manuel si les passerelles sont en mode mock/dégradé.
* **CRITICITÉ** : P0
* **PRÉCONDITIONS** : Boutique configurée.
* **DONNÉES** : Payload avec `mode_paiement: "wave"` puis `mode_paiement: "orange_money"`.
* **ÉTAPES** :
  1. Émettre `POST /api/comptabilite/<BOUTIQUE_ID>/commandes` avec mode Wave.
  2. Inspecter les propriétés `wave_launch_url` ou `payment_url` retournées.
* **RÉSULTAT ATTENDU** : Présence d'un lien de paiement valide ou, si en environnement sans clé externe, bascule sur les instructions de dépôt sans bloquer la commande en 500.
* **CRITÈRE PASS** : Réponse JSON cohérente orientant le client vers le paiement.
* **CRITÈRE FAIL** : Crash 500 ou commande créée sans statut de paiement défini.
* **PREUVE ATTENDUE** : Payload JSON de confirmation de commande.
* **DÉPENDANCES** : `backend/services/wave.js`.
* **TESTS DE RÉGRESSION ASSOCIÉS** : `TEST-008`.

---

## SECTION 4 : Caisse Enregistreuse POS & Mode Hors-Ligne (PWA)

### TEST-010 : Cycle Complet Session de Caisse POS (Ouverture, Mouvements, Clôture Z)
* **ID** : `TEST-010`
* **FEATURE** : `FEATURE-010`
* **PARCOURS** : `PARCOURS-08`
* **OBJECTIF** : Vérifier l'ouverture d'une session de caisse avec fond de caisse, l'enregistrement d'une sortie d'espèces (dépense) et la clôture avec calcul d'écart.
* **CRITICITÉ** : P0
* **PRÉCONDITIONS** : Boutique active avec caissier assigné.
* **DONNÉES** : Fond de caisse initial : 25 000 FCFA. Sortie de caisse : 5 000 FCFA (motif: "Achat monnaie"). Montant physique compté : 20 000 FCFA.
* **ÉTAPES** :
  1. `POST /api/boutiques/:id/pos-sessions/ouvrir` avec `{ "fondDeCaisse": 25000, "caissierNom": "Caissier Principal" }` (HTTP 201).
  2. `POST /api/boutiques/:id/pos-sessions/:sessionId/mouvements` avec `{ "type": "sortie", "montant": 5000, "motif": "Achat monnaie", "caissier_nom": "Caissier Principal" }` (HTTP 200).
  3. `POST /api/boutiques/:id/pos-sessions/cloturer` avec `{ "sessionId": sessionId, "especesComptees": 20000, "ventesEspeces": 0, "caissierNom": "Caissier Principal" }` (HTTP 200).
* **RÉSULTAT ATTENDU** : Session créée, mouvement de tiroir tracé, clôture avec `ecart_caisse = 0`.
* **CRITÈRE PASS** : Session ouverte et clôturée sans divergence, données archivées dans `boutique_pos_sessions`.
* **CRITÈRE FAIL** : Session bloquée, calcul d'écart erroné ou impossibilité de clôturer.
* **PREUVE ATTENDUE** : Objet JSON de bilan de session clôturée retourné par l'API.
* **DÉPENDANCES** : `backend/routes/boutiques-modules/boutiques-pos.js`.
* **TESTS DE RÉGRESSION ASSOCIÉS** : `TEST-011`.

---

### TEST-011 : Résilience Hors-Ligne & Synchronisation Différée POS (IndexedDB)
* **ID** : `TEST-011`
* **FEATURE** : `FEATURE-013`
* **PARCOURS** : `PARCOURS-08`
* **OBJECTIF** : Simuler une perte de connectivité pendant l'encaissement d'une vente en caisse, constater son stockage dans IndexedDB, puis vérifier sa synchronisation idempotente lors du retour du réseau.
* **CRITICITÉ** : P0
* **PRÉCONDITIONS** : Application de caisse ouverte dans un navigateur Chromium sous Playwright avec Service Worker actif.
* **DONNÉES** : Vente d'un article à 3 000 FCFA en espèces.
* **ÉTAPES** :
  1. Couper la connexion réseau du navigateur (`context.setOffline(true)`).
  2. Valider la vente dans l'interface de caisse.
  3. Vérifier la présence du badge visuel "Hors-ligne" et de la transaction en attente dans IndexedDB (`nopalou_pos_offline_db`).
  4. Rétablir la connexion réseau (`context.setOffline(false)`).
  5. Déclencher ou attendre la synchronisation en arrière-plan.
  6. Vérifier l'insertion de la vente dans la table `ventes` sur PostgreSQL.
* **RÉSULTAT ATTENDU** : La vente est conservée localement sans message d'erreur bloquant, puis synchronisée dès retour du réseau avec attribution d'un ID serveur unique.
* **CRITÈRE PASS** : Continuité de vente offline et synchronisation réussie sans doublon.
* **CRITÈRE FAIL** : Blocage de la caisse à l'étape 2 (erreur réseau non interceptée), ou vente perdue à la reconnexion.
* **PREUVE ATTENDUE** : Capture d'écran du mode hors-ligne et requête SQL confirmant l'insertion de la vente post-reconnexion.
* **DÉPENDANCES** : `frontend-next/src/app/sw.ts`, Serwist.
* **TESTS DE RÉGRESSION ASSOCIÉS** : `TEST-010`.

---

## SECTION 5 : Moteur Vocal & Assistant Intelligent (Wolof / Français)

### TEST-012 : Parsing Sémantique Bilingue Wolof/Français (Matrice de Nombres & Devises)
* **ID** : `TEST-012`
* **FEATURE** : `FEATURE-012`, `MOD-04`
* **PARCOURS** : `PARCOURS-04`
* **OBJECTIF** : Valider que le moteur `voice-assistant.ts` convertit fidèlement les expressions mixtes wolof/français en valeurs numériques exactes en Francs CFA.
* **CRITICITÉ** : P1
* **PRÉCONDITIONS** : Module `frontend-next/src/lib/voice-assistant.ts`.
* **DONNÉES** : Échantillon de phrases tests :
  1. `"Vente 2 junni"` -> Quantité: 1, Montant: 10 000 FCFA.
  2. `"Dépense transport benn téemeer"` -> Type: dépense, Montant: 500 FCFA.
  3. `"Bor Moussa 15 000"` -> Type: dette, Client: "Moussa", Montant: 15 000 FCFA.
  4. `"3 savon à deux mille cinq cents"` -> Quantité: 3, Montant: 2 500 FCFA.
* **ÉTAPES** :
  1. Exécuter la fonction de normalisation et d'extraction sur chaque phrase test.
  2. Comparer les montants et intentions extraits avec les valeurs attendues.
* **RÉSULTAT ATTENDU** : 100% de concordance sur les 4 cas de figure.
* **CRITÈRE PASS** : Extraction conforme de l'intention, du montant et de la quantité.
* **CRITÈRE FAIL** : Défaillance de parsing, confusion sur les zéros ou montant non converti.
* **PREUVE ATTENDUE** : Rapport d'exécution du test unitaire Jest/Node.
* **DÉPENDANCES** : `tests/unit/voix-audio-whatsapp.test.js`.
* **TESTS DE RÉGRESSION ASSOCIÉS** : Aucun.

---

## SECTION 6 : Chatbot WhatsApp Commercial

### TEST-013 : Traitement Dédupliqué d'un Webhook WhatsApp Entrant
* **ID** : `TEST-013`
* **FEATURE** : `FEATURE-015`, `MOD-05`
* **PARCOURS** : `PARCOURS-03`
* **OBJECTIF** : Vérifier que le webhook WhatsApp traite un message entrant, l'enregistre dans `whatsapp_processed_messages`, et ignore silencieusement tout rejeu identique envoyé par Meta.
* **CRITICITÉ** : P0
* **PRÉCONDITIONS** : Serveur backend démarré avec bypass ou signature Meta mockée.
* **DONNÉES** : Payload webhook Meta simulé contenant un `message_id` unique : `"wamid.HBgLMjIxNzcxMjM0NTY3FQIAERgSMzAy... "`.
* **ÉTAPES** :
  1. Émettre `POST /api/whatsapp/webhook` avec le payload contenant ce `message_id`.
  2. Constater la réponse HTTP 200 immédiate (< 1000ms).
  3. Réémettre exactement le même payload HTTP avec le même `message_id`.
* **RÉSULTAT ATTENDU** : Le premier appel traite le message et insère l'ID dans `whatsapp_processed_messages`. Le second appel répond HTTP 200 sans réexécuter le traitement métier ni envoyer de double réponse.
* **CRITÈRE PASS** : Déduplication stricte confirmée ; aucun double traitement.
* **CRITÈRE FAIL** : Deux messages de réponse émis ou erreur 500 sur clé unique dupliquée.
* **PREUVE ATTENDUE** : Log serveur montrant la détection de doublon et requête `SELECT message_id FROM whatsapp_processed_messages`.
* **DÉPENDANCES** : `backend/services/whatsapp.js`.
* **TESTS DE RÉGRESSION ASSOCIÉS** : `TEST-014`.

---

## SECTION 7 : ERP Immobilier & Gestion Locative

### TEST-014 : Cycle de Vie du Bail Locatif & Émission de Quittance Certifiée PDF
* **ID** : `TEST-014`
* **FEATURE** : `FEATURE-018`, `MOD-11`
* **PARCOURS** : `PARCOURS-05`
* **OBJECTIF** : Créer un bail pour un appartement à Dakar, générer l'échéance du mois en cours, encaisser le règlement et générer le document PDF de quittance de loyer certifiée.
* **CRITICITÉ** : P0
* **PRÉCONDITIONS** : Agence immobilière configurée, bien existant disponible.
* **DONNÉES** : Loyer mensuel : 150 000 FCFA. Locataire : "Abdoulaye Sow".
* **ÉTAPES** :
  1. `POST /api/locatif-immo/agence/:slugOrId/baux` -> Création du bail actif sous le tenant agence.
  2. `POST /api/locatif-immo/agence/:slugOrId/loyers/:id/encaisser` avec `{ "montant": 150000, "mode_paiement": "wave", "reference_paiement": "WAVE-TX-TEST14-OK" }` -> Échéance soldée.
  3. `GET /api/locatif-immo/public/quittance/:id.pdf` -> Récupération du flux binaire PDF.
* **RÉSULTAT ATTENDU** : Échéance marquée `statut = 'paye'`, flux binaire PDF retourné avec `Content-Type: application/pdf` et taille > 2 500 octets (PDF vectoriel compact sans polices CDN externes).
* **CRITÈRE PASS** : Quittance PDF générée sans erreur et accessible.
* **CRITÈRE FAIL** : Échec de génération PDF (erreur PDFKit ou police absente) ou échéance restant impayée.
* **PREUVE ATTENDUE** : Headers HTTP de la réponse PDF et enregistrement de l'échéance soldée en base.
* **DÉPENDANCES** : `backend/routes/locatif-immo.js`.
* **TESTS DE RÉGRESSION ASSOCIÉS** : `TEST-006`.

---

## SECTION 8 : Scraping Omnisources & Déduplication

### TEST-015 : Robustesse du Scraper & Matching Trigramme Dédupliqué
* **ID** : `TEST-015`
* **FEATURE** : `FEATURE-019`, `FEATURE-020`, `MOD-10`
* **PARCOURS** : `PARCOURS-09`
* **OBJECTIF** : Vérifier que le scraper parse correctement une page d'annonces simulée et que l'algorithme de matching regroupe les offres identiques sans fusionner des produits incompatibles.
* **CRITICITÉ** : P1
* **PRÉCONDITIONS** : Serveur local mockant une réponse HTML d'Expat-Dakar.
* **DONNÉES** : HTML contenant 2 offres pour "Samsung Galaxy S23 128Go" à des prix différents et 1 offre pour "Coque silicone Samsung Galaxy S23".
* **ÉTAPES** :
  1. Exécuter le pipeline de collecte et matching sur cette source.
  2. Interroger la table `produits` et `offres`.
* **RÉSULTAT ATTENDU** : 2 fiches produits distinctes créées : le smartphone (avec 2 offres concurrentes associées) et la coque (1 offre). La coque ne doit pas être fusionnée avec le smartphone.
* **CRITÈRE PASS** : Déduplication sémantique exacte ; séparation nette accessoires/téléphones.
* **CRITÈRE FAIL** : La coque est fusionnée avec le smartphone, faussant le prix minimum à quelques milliers de francs.
* **PREUVE ATTENDUE** : Requête SQL démontrant les deux produits maîtres distincts et leurs offres respectives.
* **DÉPENDANCES** : `backend/services/matching.js`.
* **TESTS DE RÉGRESSION ASSOCIÉS** : Aucun.

---

## SECTION 9 : SEO, Métadonnées Dynamiques & Bannissement Polices Externes

### TEST-016 : Absence Totale de Téléchargement Externe de Polices & Rendu OpenGraph
* **ID** : `TEST-016`
* **FEATURE** : `MOD-13`
* **PARCOURS** : Tous
* **OBJECTIF** : Vérifier l'application stricte de la règle Nopalou interdisant tout `fetch` ou `@import` de polices externes (Google Fonts, CDN jsDelivr) et vérifier que les routes d'images dynamiques `@vercel/og` ne crashent pas.
* **CRITICITÉ** : P1
* **PRÉCONDITIONS** : Application Next.js construite ou en cours d'exécution.
* **DONNÉES** : Requête vers `GET /produit/:id/opengraph-image` et inspection des feuilles de styles CSS.
* **ÉTAPES** :
  1. Rechercher tout appel réseau ou occurrence de CDN de polices dans le code généré : `grep -rn "fonts.googleapis.com" frontend-next/`.
  2. Émettre une requête vers une route OpenGraph d'un produit avec et sans photo distante.
* **RÉSULTAT ATTENDU** : Zéro dépendance CDN externe de police (utilisation exclusive de polices système). La route OpenGraph répond HTTP 200 avec une image PNG valide même si l'image distante est inaccessible.
* **CRITÈRE PASS** : Zéro police externe, aucune erreur 500 Satori (`Image size cannot be determined`).
* **CRITÈRE FAIL** : Présence d'un appel réseau vers un CDN de police, ou crash 500 sur génération d'image OpenGraph.
* **PREUVE ATTENDUE** : Rapport grep 0 occurrence et en-tête `Content-Type: image/png` retourné.
* **DÉPENDANCES** : `frontend-next/src/app/produit/[id]/opengraph-image.tsx`.
* **TESTS DE RÉGRESSION ASSOCIÉS** : Aucun.
