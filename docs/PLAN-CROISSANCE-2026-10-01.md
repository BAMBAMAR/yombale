# Plan de correction — audit croissance — 2026-10-01

Rapport source : [`AUDIT-CROISSANCE-2026-10-01.md`](AUDIT-CROISSANCE-2026-10-01.md). Aucun code n'a été modifié pendant l'audit.

## Règles du plan

- Chaque amélioration est une **hypothèse mesurable** : HYPOTHÈSE → MODIFICATION → KPI → TEST → MESURE → DÉCISION. Aucune ne promet une hausse d'abonnements.
- **Volumes réels (copie du 24/09)** : ~100 comptes, ~60 boutiques créées en 3 mois, 735 leads contactés. Un test A/B classique n'est pas faisable sur l'inscription ou l'abonnement. Pour comparer deux messages de prospection sur le taux de réponse (2,3 % de départ), il faudrait environ 1 700 envois par bras pour détecter 2,3 % → 4 %, et environ 220 par bras pour détecter 2,3 % → 8 %. Règle retenue : **avant/après sur au moins 4 semaines avec indicateurs de contrôle**, et A/B uniquement quand le volume le permet.
- Correctifs de code : branche dédiée, commits locaux `fix(zone): AUD-NNN …`, test qui échoue sans le correctif, migrations idempotentes, pas de `git push` sans ordre.
- **Actions d'exploitation (hors code)** listées en fin de document.

## Ordre d'exécution

| Phase | Contenu |
|---|---|
| 0 — Filet | Mesure : AUD-116, 117, 110, 112 (champs d'attribution), copie fraîche de production pour la base de référence |
| 1 — P0 | AUD-108 |
| 2 — P1 | AUD-109, 111, 118, 120, 121 |
| 3 — Activation et copywriting | AUD-122, 123, 114, 113, 115, 124, 126, 127, 125 |
| 4 — P2/P3 restants | AUD-119, 128, 129, 130 |
| Régression globale | Rejeu `verify-rbac`, `freshmig`, tests unitaires, parcours wizard + abonnement sur pile isolée |

---

## Fiches

### AUD-108 — Prise de contrôle de compte via `taf-taf` (P0)
- **Étape** : inscription.
- **Preuve** : VÉRIFIÉ. Rejeu : 1er appel avec `770009911` crée compte et boutique ; 2e appel sans mot de passe ni OTP renvoie un jeton dont le `userId` est identique ; `GET /api/boutiques/mine` avec ce jeton renvoie la boutique du compte. Code : `boutiques-crud.js:113` (recherche par `telephone` ou `email`) et `:207-211` (jeton renvoyé). L'OTP du wizard (`creer-boutique/page.tsx:118-148`) n'est pas transmis à `taf-taf`.
- **Métrique** : comptes créés, intégrité du fichier clients.
- **Cause** : route publique qui réutilise un compte existant et émet une session.
- **Impact** : toute personne connaissant le numéro d'un marchand obtient 7 jours d'accès à son compte, ses ventes, ses clients, ses dettes. Effet commercial : perte de confiance dès la première fuite.
- **Correction** : exiger une preuve de possession du numéro (jeton à usage unique émis par `whatsapp-otp-verify`, lié au numéro, court) pour toute création ou reprise ; si le compte existe, ne jamais émettre de jeton : renvoyer « ce numéro a déjà un compte, connectez-vous ».
- **Modification** : `backend/routes/boutiques-modules/boutiques-crud.js` (route `/taf-taf`), `backend/routes/auth.js` (émission du jeton OTP), `frontend-next/src/app/creer-boutique/page.tsx` (transmettre la preuve).
- **Données nécessaires** : aucune ; rejeu sur pile isolée.
- **KPI de validation** : 0 jeton émis sans preuve ; taux de réussite du wizard inchangé (±3 points) sur 4 semaines.
- **Test A/B** : non pertinent (sécurité).
- **Critères de succès** : test automatisé qui échoue sans le correctif (appel sans preuve → 401/409), contrôle par mutation ; wizard complet toujours fonctionnel.
- **Observation** : 4 semaines après déploiement.
- **Régression** : création via WhatsApp (`whatsapp-chatbot.js`) et wizard ; apporteurs ; hook CRM.
- **Retour arrière** : feature flag sur l'exigence de preuve.

### AUD-109 — Essai recyclé, abonnement payant annulé, boutiques en double (P1)
- **Étape** : abonnement.
- **Preuve** : VÉRIFIÉ. Rejeu : deux lignes `abonnements` (1 `annule`, 1 `actif`), deux boutiques pour le même `userId`. Code : `boutiques-crud.js:187-196` (annule tout abonnement actif puis insère un essai) et `:982-987`. Copie : 10 propriétaires avec 2 à 5 boutiques.
- **Métrique** : conversion essai → payant, nombre de boutiques, abonnés payants.
- **Cause** : pas de test d'existence d'essai ou d'abonnement avant insertion.
- **Impact** : un marchand peut renouveler son essai indéfiniment ; un abonné payant qui repasse par le wizard perd son plan ; KPI de boutiques gonflés.
- **Correction** : un seul essai par utilisateur (contrainte et test) ; ne jamais annuler un abonnement `is_trial = false` ; réutiliser la boutique existante du même numéro et nom.
- **Modification** : mêmes routes qu'AUD-108 ; migration idempotente (index unique partiel sur essai par utilisateur) après nettoyage des doublons existants (validation préalable, jamais de suppression automatique).
- **Données nécessaires** : liste des doublons en production (lecture seule).
- **KPI** : 0 utilisateur avec plus d'un essai ; boutiques par propriétaire ≈ 1.
- **A/B** : non.
- **Succès** : test qui échoue sans correctif ; migration validée sur base vide puis existante.
- **Observation** : 4 semaines.
- **Régression** : upgrade de plan, WhatsApp, paiement d'abonnement.
- **Retour arrière** : retrait de l'index ; code précédent.

### AUD-110 — MRR affiché faux, conversion invisible (P1)
- **Étape** : abonnement / mesure.
- **Preuve** : VÉRIFIÉ. `abonnements.js:136` : MRR = abonnements `is_trial = FALSE` actifs, sans exclure `commande_ref LIKE 'admin_test_%'`. Copie au 24/09 : 65 000 FCFA affichés, 4 abonnements, 4 attributions admin, 0 paiement.
- **Métrique** : MRR, conversion essai → payant (0/12 sur la copie), nombre de payants.
- **Cause** : l'attribution admin est enregistrée comme un abonnement payant sans indicateur d'origine.
- **Impact** : décisions de pilotage fondées sur un revenu inexistant.
- **Correction** : colonne `origine` (`paiement`, `admin`, `essai`, `legacy`) ; MRR = `paiement` seulement ; tableau « essais terminés → convertis » dans l'admin ; classer les 15 lignes `is_trial = false` sans référence comme `legacy`.
- **Modification** : `backend/routes/abonnements.js`, migration, page admin abonnements.
- **Données nécessaires** : aucune de plus.
- **KPI** : MRR admin = somme des encaissements `abmt_` actifs ; conversion essai → payant calculée.
- **A/B** : non.
- **Succès** : test sur jeu de données mêlant admin et paiements.
- **Observation** : immédiate.
- **Régression** : exports comptables, alertes d'expiration.
- **Retour arrière** : colonne laissée, ancien calcul restauré.

### AUD-111 — Durée d'essai annoncée ≠ durée appliquée (P1)
- **Étape** : confiance, inscription, abonnement.
- **Preuve** : VÉRIFIÉ. Défaut code 14 jours (`settingsCache.js:19`, `boutiques-crud.js:185,982`). Copie : réglage = 30, essais de 29-30 jours. Texte « 30 jours offerts » en dur dans `marchands`, `whatsapp`, `vendre-sur-whatsapp`, kit apporteur, kit communication et gabarits de prospection (`prospection.js:15,58,98`) ; repli `'30'` dans `creer-boutique/page.tsx:54` ; chatbot : repli 30 si réglage absent. 33 occurrences dans 17 pages/layouts.
- **Valeur de production** : À CONFIRMER (non lue).
- **Métrique** : plaintes, taux de paiement à J-3/J-1, désabonnements à l'expiration.
- **Cause** : promesse dupliquée dans des textes statiques.
- **Impact** : un marchand à qui on promet 30 jours et qui est coupé à J14 perd confiance au moment précis de la conversion.
- **Correction** : décision produit (14 ou 30 jours) puis **une seule source** : le réglage public. Remplacer les textes en dur par la valeur lue ; aligner défauts et gabarits.
- **Modification** : pages listées ci-dessus, `prospection.js`, `whatsapp-chatbot.js`, `ApporteurClient.tsx`, `KitCom*`.
- **Données nécessaires** : valeur réelle du réglage en production ; décision de durée.
- **KPI** : 0 occurrence littérale dans le code (contrôle par grep dans `lint:slop` ou test) ; taux de paiement entre J-3 et J+7.
- **A/B** : 14 vs 30 jours seulement si le volume le permet ; sinon avant/après.
- **Succès** : texte affiché = durée appliquée, vérifié par test sur la page et le bot.
- **Observation** : 4 semaines.
- **Régression** : SEO (méta), relances J-3/J-1.
- **Retour arrière** : valeurs précédentes.

### AUD-112 — Prospection non attribuable (P1)
- **Étape** : prospect → inscription.
- **Preuve** : VÉRIFIÉ. Hook `UPDATE prospection_leads SET statut='converti' … WHERE telephone LIKE …` à toute création de boutique (`boutiques-crud.js:160-168, 958-966`), sans test de contact préalable : 12 leads « converti » sur 25 jamais contactés. Aucun lien des gabarits ne porte `utm_*` ni code de suivi. 46 campagnes, une seule variante, `nb_interesses`/`nb_inscrits`/`nb_optout` jamais renseignés. 0 boutique avec `crm_lead_id` dans la copie (réconciliation du 30/09 non rejouée).
- **Métrique** : taux réponse, intérêt, inscription, boutique, abonnement par campagne/variante.
- **Cause** : conversion déduite du seul numéro, sans identifiant de campagne dans le lien.
- **Impact** : impossible de savoir quel message ou quelle source rapporte ; le CRM surévalue les conversions.
- **Correction** : lien court par lead (`/r/<code>` ou `?l=<code>`) enregistrant le clic, conservé jusqu'à l'inscription ; `converti` seulement si lead contacté avant la création ; renseigner les compteurs de campagne depuis les événements ; nommer les campagnes et variantes.
- **Modification** : `backend/services/prospection.js`, hook dans `boutiques-crud.js`, `routes/prospection.js`, frontend (capture du code, comme `UtmTracker`).
- **Données nécessaires** : copie fraîche postérieure au 30/09.
- **KPI** : part des inscriptions attribuées à un lead ou à « direct » ≥ 95 % ; coût et conversion par campagne lisibles.
- **A/B** : variantes de message une fois l'attribution en place (voir limites de volume).
- **Succès** : test d'intégration lead → clic → inscription → boutique ; 0 « converti » sans message.
- **Observation** : 4 semaines.
- **Régression** : crons de relance, opt-out.
- **Retour arrière** : flag sur le nouveau lien.

### AUD-113 — Échecs d'envoi WhatsApp (P2)
- **Étape** : contact.
- **Preuve** : VÉRIFIÉ. 172 échecs sur ~896 envois WhatsApp (19 %) : 126 `131049` (plafond marketing par destinataire), 27 `131026` (numéro non WhatsApp), 22 « expérience ». Campagnes de 50 envois avec 38 à 47 échecs.
- **Métrique** : taux de livraison, qualité du numéro Meta.
- **Cause** : envois en rafales ; pas de plafond par destinataire ni de repli.
- **Impact** : temps perdu, risque pour la qualité du numéro, leads brûlés.
- **Correction** : ne pas réenvoyer un lead en `131049` avant délai ; marquer `131026` en invalide et ne plus l'enchaîner ; étaler les envois ; mesurer la qualité du numéro dans l'admin.
- **Modification** : `prospection.js`, `whatsapp.js` (gestion des codes).
- **Données nécessaires** : état de qualité du numéro côté Meta.
- **KPI** : échecs < 8 % ; 0 relance d'un lead en `131026`.
- **A/B** : non.
- **Succès** : tests unitaires par code d'erreur.
- **Observation** : 4 semaines.
- **Régression** : volume utile envoyé.
- **Retour arrière** : seuils configurables.

### AUD-114 — Ciblage (P2)
- **Étape** : prospect.
- **Preuve** : VÉRIFIÉ pour les chiffres : 166 leads `osm_places` jamais contactés ; 336 leads issus d'annonces classifiées contactés (8 réponses positives, 2,4 %), 206 leads « immo » et 83 « auto-moto » contactés avec un discours boutique/caisse ; « emploi » bien écarté (1 contacté sur 108).
- **Lecture** : HYPOTHÈSE — des commerces physiques répondent mieux à un discours caisse/carnet de dettes ; écarts de taux non significatifs vu les volumes.
- **Correction** : segmenter par `sous_profil` et catégorie, essayer d'abord un lot de commerces `osm_places` avec le message adapté, mesurer.
- **Modification** : sélection de campagne dans `routes/prospection.js` et écran admin.
- **Données nécessaires** : AUD-112 d'abord.
- **KPI** : taux de réponse positive du lot (référence 2,3 %), inscriptions avec première vente.
- **A/B** : lots de 220 par segment pour viser un écart d'au moins 6 points ; sinon décision qualitative.
- **Succès** : au moins 20 réponses par segment avant toute conclusion.
- **Observation** : 6 semaines.
- **Régression** : bouclier anti-harcèlement.
- **Retour arrière** : retour à la sélection actuelle.

### AUD-115 — Allégations non prouvées (P2)
- **Étape** : contact, SEO.
- **Preuve** : VÉRIFIÉ. « comparateur N°1 au Sénégal » (`prospection.js:93`), « portail auto n°1 » (`:116`), « référencée N°1 » (`:213`), « milliers d'acheteurs », « tapez Nopalou sur Google » ; `marchands/page.tsx` « Caisse POS N°1 au Sénégal » ; `creer-boutique/layout.tsx` « Alternative N°1 à Shopify ». Le journal du 27/09 a retiré cette allégation de l'accueil comme non prouvée.
- **Correction** : remplacer par des faits vérifiables (voir propositions).
- **Modification** : `prospection.js`, `marchands/page.tsx`, `creer-boutique/layout.tsx`.
- **KPI** : 0 occurrence de « N°1 » hors citation sourcée.
- **Succès** : grep dans la CI. **Régression** : méta SEO (indexation, à surveiller 4 semaines).
- **Propositions** :
  - « référencé sur le comparateur de prix » → « vos produits apparaissent dans la recherche de Nopalou ».
  - « milliers d'acheteurs » → supprimer ou citer un chiffre mesuré.

### AUD-116 — Haut du funnel invisible (P1)
- **Étape** : acquisition.
- **Preuve** : VÉRIFIÉ. `analytics.js:9` : `boutique_id` obligatoire (400 sinon) ; table `analytics_events (type, boutique_id, annonce_id, created_at)` sans visiteur ni UTM ; aucun événement pour accueil, tarifs, inscription, étapes du wizard, abonnement.
- **Métrique** : visiteurs, étapes, abandon, source.
- **Cause** : tracking pensé par boutique.
- **Impact** : impossible de localiser les départs ; toute décision de copywriting est faite sans mesure.
- **Correction** : événements de funnel sans boutique (`wizard_etape_N`, `wizard_abandon`, `inscription`, `abonnement_ouvert`, `paiement_initie`), identifiant de session anonyme, UTM et `ref` stockés ; respecter la politique de confidentialité (mesure d'audience anonymisée).
- **Modification** : `backend/routes/analytics.js`, migration, `frontend-next/src/lib/analytics.ts`, wizard, tarifs, abonnement.
- **Données nécessaires** : accès GA4 pour comparer.
- **KPI** : taux de passage par étape disponibles pour 100 % des sessions du wizard.
- **A/B** : non (instrument).
- **Succès** : rejeu pile isolée + navigateur ; événement par étape visible en base.
- **Observation** : 2 semaines de collecte avant toute décision.
- **Régression** : limiteur de débit, vie privée (mise à jour de `/confidentialite` si identifiant ajouté).
- **Retour arrière** : désactivation par flag.

### AUD-117 — Vues et commandes mal comptées (P2)
- **Preuve** : VÉRIFIÉ. `boutiques-crud.js:753-756` insère `vue_boutique` à chaque `GET /api/boutiques/:id` (SSR, robots, propriétaire inclus) : 7 480 événements sur 84 boutiques, jusqu'à 746 sur une seule. `analytics.js:71` lit `commande_confirmee` ; le serveur écrit `commande_web` (`commande-service.js:406`, `boutiques-commandes.js:388`) : le tableau de bord marchand sous-compte les commandes web, surtout celles passées par WhatsApp.
- **Correction** : compter les vues côté page publique (hors robots, hors propriétaire), additionner `commande_web` et `commande_confirmee` sans doublon (clé de commande).
- **KPI** : écart tableau de bord / base de commandes = 0. **Succès** : test sur jeu mêlant les deux types. **Régression** : stats existantes. **Observation** : immédiate.

### AUD-118 — Starter pack : indicateur d'activation contaminé (P1)
- **Preuve** : VÉRIFIÉ. `starter-catalogues.js` insère les articles avec `en_stock = true` et quantités 20 à 50, sans marque « exemple ». Prix génériques (riz 25 kg 17 500). Copie antérieure au pack : 34/85 boutiques avec produit, 12 avec ≥ 3.
- **Impact** : une vitrine publique propose des articles que le marchand ne vend pas ; une commande peut arriver sur un faux article ; « boutique avec produit » ne mesure plus l'activation.
- **Correction** : colonne `origine = 'exemple'`, vitrine publique masquée tant que le marchand n'a pas confirmé ou modifié l'article ; KPI d'activation = « 1er produit saisi par le marchand » et « 1re vente ».
- **Modification** : `starter-catalogues.js`, requêtes publiques de produits, tableau de bord.
- **Données nécessaires** : aucune.
- **KPI** : part des boutiques avec 1er produit réel dans les 48 h ; part avec 1re vente dans les 7 jours (références copie : 40 % et 13 %, à recalculer sur copie fraîche).
- **A/B** : pack masqué vs affiché à partir de 60 nouvelles boutiques par bras ; sinon avant/après.
- **Succès** : aucune commande possible sur un article `exemple` en vitrine publique.
- **Observation** : 6 semaines. **Régression** : caisse POS (usage de ces articles pour démarrer). **Retour arrière** : flag.

### AUD-119 — E-mails synthétiques et parrainage inerte (P2)
- **Preuve** : VÉRIFIÉ. 50/100 comptes en `…@whatsapp.nopalou.com`, `email_verifie = true` d'office ; 52 `est_apporteur`, 0 boutique avec `apporteur_id`, 0 commission, 0 parrainage.
- **Cause** : création par `taf-taf` : e-mail fabriqué, `est_apporteur` à vrai.
- **Impact** : aucun canal e-mail pour la moitié des comptes (WhatsApp seul) ; le programme apporteur ne produit rien et ses chiffres sont gonflés.
- **Correction** : ne pas activer `est_apporteur` par défaut ; demander un e-mail facultatif plus tard dans l'espace marchand ; message d'invitation à parrainer après la 1re vente.
- **Modification** : `boutiques-crud.js`, espace compte.
- **KPI** : e-mails réels collectés ; boutiques rattachées à un apporteur actif. **A/B** : non. **Succès** : test création. **Observation** : 6 semaines. **Régression** : accès aux commissions des apporteurs existants (vérifier avant de retirer le statut).

### AUD-120 — Paiement initié non tracé (P1)
- **Preuve** : VÉRIFIÉ. `commandes` n'est alimentée que par `appliquerPaiementReussi` en `payee` (`paiement.js:116-121`) ; `POST /wave/initier` ne persiste rien. Copie : 18 lignes, toutes payées.
- **Impact** : abandon au paiement invisible, aucune relance « vous avez commencé à payer ».
- **Correction** : enregistrer l'initiation (`initie`, référence, plan, méthode, horodatage) et la faire passer à `payee`/`expire` ; relance WhatsApp à 30 minutes si l'initiation n'est pas payée (dans la plage horaire autorisée).
- **Modification** : `paiement.js`, `abonnements.js`, migration.
- **KPI** : taux initié → payé ; temps jusqu'au paiement. **A/B** : non. **Succès** : test webhook de bout en bout (signature factice). **Observation** : 4 semaines. **Régression** : idempotence des webhooks. **Retour arrière** : table laissée, écriture désactivée.

### AUD-121 — Orange Money (P1)
- **Preuve** : VÉRIFIÉ pour le repli : rejeu local sans identifiants → `mode: sandbox_simulation`, `payment_url = return_url`. `retour-paiement/page.tsx` lit `status` et `order_id` ; l'initiation fournit `?ref=` : redirection vers `/paiement/erreur`. Voie Sonatel : `successUrl = return_url` (même paramètre `ref`) → **CAUSE PARTIELLE**, comportement réel du fournisseur À CONFIRMER (NON VALIDÉ, appel réel interdit). Usage : 2 commandes Orange sur 99, 0 payée.
- **Impact** : un client qui paie par Orange peut atterrir sur une page d'erreur ; le texte « paiement Wave & Orange Money » est affiché sur ~50 fichiers.
- **Correction** : page de retour qui lit `ref` et interroge l'état réel de la commande ; refuser le repli simulé en production (erreur explicite plutôt que simulation) ; retirer Orange des textes tant que la production n'est pas validée en sandbox Sonatel.
- **Modification** : `orange-money.js`, `paiement.js`, `retour-paiement/page.tsx`.
- **KPI** : parcours OM complet en sandbox ; 0 retour vers erreur après paiement.
- **Test** : sandbox Sonatel par l'exploitation. **Régression** : Wave. **Retour arrière** : désactiver `paiement_orange`.

### AUD-122 — Relances fragiles (P2)
- **Preuve** : VÉRIFIÉ. `cron-relances-marchands.js:42,116` cible `created_at::date = CURRENT_DATE - 1/7` ; `:28` coupe hors 09h-21h UTC : un passage manqué perd la relance. Déduplication par `message_envoye LIKE '%Astuce N°1%'`. Réglages `alertes_abonnement_*` lus nulle part (dead settings). J-1 : « le catalogue sera suspendu » non vérifié (seule la caisse POS est bloquée, vérifiée par le journal du 27/09) et « Pro 5 000 FCFA » en dur.
- **Correction** : fenêtre glissante (créées entre 20 et 48 h, jamais relancées) ; table d'envois par type de relance ; brancher ou retirer les réglages ; texte J-1 conforme aux effets réels.
- **KPI** : part des boutiques créées qui reçoivent J+1 (cible 100 % de celles à numéro valide) ; paiement entre J-3 et J+3. **A/B** : non. **Succès** : test avec cron décalé d'un jour. **Observation** : 4 semaines. **Régression** : bouclier anti-harcèlement (3 messages sans réponse).

### AUD-123 — Wizard (P2)
- **Preuve** : VÉRIFIÉ. 4 étapes ; `StepContactVerify.tsx` n'a ni renvoi du code ni changement de numéro ; `code.length < 4` alors que le texte annonce 6 chiffres ; l'étape 3 dépend d'un envoi Meta ; aucune mesure d'abandon (AUD-116).
- **HYPOTHÈSE** : l'OTP et la case de contrat font perdre des créations. Non mesurable aujourd'hui.
- **Modification** : après AUD-108, garder l'OTP (il devient utile) avec renvoi après 30 s, « mauvais numéro ? », saisie 6 chiffres ; regrouper nom + numéro sur un écran.
- **KPI** : taux étape 1 → boutique créée (référence à mesurer pendant 2 semaines). **A/B** : 2 écrans vs 4 si ≥ 150 démarrages par bras, sinon avant/après. **Régression** : sécurité AUD-108.

### AUD-124 — Prix et commission incohérents (P2)
- **Preuve** : VÉRIFIÉ. `creer-boutique/layout.tsx` : « Taf Taf 5.000 FCFA/mois » et « dès 5.000 FCFA/mois » (réel 2 500). `STRATEGIE-COMMERCIALE.md` : Pro 15 000, Business 35 000 + 2 %, annonce 1 500 (réel : 5 000, 10 000, 0 %, `prix_annonce` = 100 en copie). `commission_business` : 10 (copie), 2.0 (défaut), 0 (repli) ; `commission_rate` = 0 sur 83 boutiques sur 85. Le « 0 % de commission » affiché est vrai dans les faits.
- **Correction** : méta lues depuis les réglages ; mettre à jour la stratégie et le plan marketing ; retirer ou fixer `commission_business`.
- **KPI** : 0 prix en dur divergent (test). **Régression** : SEO.

### AUD-125 — « 100 % hors-ligne » (P2)
- **Preuve** : `HeroMarchandView.tsx:23,27`, `marchands/page.tsx` (méta). La recette Android (23 scénarios, `RECETTE-ANDROID-OFFLINE-2026-10-01.md`) n'a pas été jouée. **NON VALIDÉ — TEST RÉEL IMPOSSIBLE** ici.
- **Correction** : jouer la recette ; en attendant, formulation prudente. **KPI** : recette signée. **Régression** : aucune.

### AUD-126 — Valeur floue (P3)
- **Preuve** : « Le Système d'Exploitation du Commerçant Sénégalais » (`HeroMarchandView.tsx:99`), « Investissez dans votre succès, sans surprise » (H1 tarifs), description `/inscription` : « gérer vos annonces et favoris ».
- **KPI** : taux de clic sur « Créer ma boutique » (à mesurer via AUD-116). **A/B** : seulement si trafic suffisant ; sinon avant/après.

### AUD-127 — Message de partage de vitrine (P2)
- **Preuve** : `ModalBoutiqueCreeeSucces.tsx:27` : « Livraison rapide partout au Sénégal ! » pour toutes les boutiques ; lien sans suivi.
- **Correction** : phrase de livraison seulement si la boutique a des zones ; ajouter `?utm_source=whatsapp&utm_medium=partage_vitrine`.
- **KPI** : vues et commandes issues de ce lien. **Régression** : aucune.

### AUD-128 — `recherches_logs` (P3)
- **Preuve** : VÉRIFIÉ. 4 requêtes (« iphone 15 » 4 879, « samsung s24 » 4 572, « smart tv 4k » 4 449, « climatiseurs » 4 393) = 80 % des 22 892 recherches. **HYPOTHÈSE** : trafic automatisé ou amorçage.
- **Correction** : tracer l'origine ; ne pas piloter le contenu avec ces volumes. **KPI** : requêtes distinctes par jour.

### AUD-129 — Réseaux sociaux non attribuables (P2)
- **Preuve** : 0/99 commandes avec `utm_source` ; 4 posts importés. Livraison ACQ-002 non confirmée.
- **Correction** : AUD-116 et 127 ; lien UTM par publication dans le kit communication.
- **KPI** : commandes et inscriptions par `utm_source` après 4 semaines.

### AUD-130 — Commandes Wave sans paiement (P2)
- **Preuve** : VÉRIFIÉ. 27 commandes « wave », 1 `paiement_recu`, 12 annulées. **Cause À CONFIRMER** : le webhook fail-closed et l'expiration des impayés datent du 28/09, postérieurs à la copie.
- **Correction** : rejouer sur copie fraîche ; si l'écart persiste, comparer webhooks reçus et sessions créées. **KPI** : part des commandes Wave payées.

---

## Propositions de formulation (à tester, sans fonctionnalité inventée)

| Emplacement | Aujourd'hui | Proposition |
|---|---|---|
| Premier message de prospection | 5 lignes à emojis, « N°1 », « 30 jours » en dur | « Salam {nom}, c'est l'équipe Nopalou à Dakar. On aide les commerçants à recevoir leurs commandes sur WhatsApp et à noter ventes et dettes au même endroit. Essai gratuit de {X} jours, sans carte. Voulez-vous voir comment ça marche en 1 minute ? Répondez OUI. STOP pour ne plus recevoir. » |
| Fin d'essai J-3 | « se termine dans 3 jours… à partir de 2 500 FCFA » | « Salam {nom}, votre essai finit dans 3 jours. Depuis votre inscription : {n} ventes et {m} clients au carnet. Pour les garder actifs : {lien}. 2 500 FCFA/mois, soit moins de 85 FCFA par jour. » (n et m lus dans la base, jamais inventés ; si 0, parler de la 1re vente) |
| Relance J+1 | « Félicitations pour votre 1er jour… » | « Salam {nom}, votre boutique est en ligne. Prochaine étape : ajouter votre premier article avec sa photo (1 minute) : {lien magique}. » |
| Description `/inscription` | « gérer vos annonces et favoris » | « Créez votre compte Nopalou : comparez les prix, suivez vos commandes et, si vous vendez, ouvrez votre boutique WhatsApp. » |
| Méta `/creer-boutique` | « Taf Taf 5.000 FCFA/mois… Alternative N°1 à Shopify » | « Ouvrez votre boutique en ligne et vendez sur WhatsApp. Essai gratuit {X} jours. Formules dès {prix Taf Taf} FCFA/mois, paiement Wave. » (valeurs lues dans les réglages) |
| Hero marchand | « Système d'Exploitation du Commerçant Sénégalais » | « Vendez sur WhatsApp, encaissez par Wave, notez vos dettes : tout au même endroit sur votre téléphone. » |
| Message de partage de vitrine | « Livraison rapide partout au Sénégal ! » | « Commandez directement sur WhatsApp ou payez par Wave. » + livraison seulement si configurée |
| Erreur OTP | « Code de vérification incorrect. » | « Ce code ne correspond pas. Vérifiez le message WhatsApp reçu, ou demandez un nouveau code dans 30 secondes. » |

Réserve : « hors-ligne » à n'écrire qu'après la recette Android ; Orange Money à n'afficher qu'après validation Sonatel.

## Actions d'exploitation (hors code)

1. Lire la valeur de `abonnement_essai_jours` en production et trancher 14 ou 30 jours (AUD-111).
2. Valider le parcours Orange Money Sonatel en sandbox, vérifier la présence des identifiants en production (AUD-121).
3. Jouer la recette Android (AUD-125).
4. Rafraîchir `nopalou_audit_data` depuis la production pour mesurer l'effet des livraisons du 27/09 au 01/10.
5. Donner accès en lecture à GA4 pour comparer avec la mesure interne (AUD-116).
6. Vérifier la qualité du numéro WhatsApp et les paliers Meta (AUD-113).
7. Après correction d'AUD-108, invalider les sessions de comptes éventuellement exposées si un abus est suspecté (incrément de `jwt_version`).
