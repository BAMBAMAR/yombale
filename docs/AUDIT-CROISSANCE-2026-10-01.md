# Audit orienté croissance — Nopalou — 2026-10-01

Périmètre : pourquoi Nopalou peut perdre des visiteurs, prospects, vendeurs, abonnés et clients. Cet audit ne modifie aucune donnée ni aucun code applicatif. Le plan de correction est un livrable séparé : [`PLAN-CROISSANCE-2026-10-01.md`](PLAN-CROISSANCE-2026-10-01.md).

Convention de preuve, reprise dans chaque fiche :

| Mention | Sens |
|---|---|
| **VÉRIFIÉ** | observé dans les données locales, relu dans le code, ou rejoué sur la pile isolée |
| **CAUSE PARTIELLE** | effet vérifié, cause démontrée en partie |
| **HYPOTHÈSE** | plausible, non démontré |
| **À CONFIRMER** | dépend d'une donnée ou d'une configuration de production non accessible ici |
| **NON VALIDÉ — TEST RÉEL IMPOSSIBLE** | le contrôle exige un appareil, un compte réel ou une API externe interdite |

## 1. Méthode, environnement et limites

- Environnement isolé (`scripts/audit/audit-env.ps1`) : PostgreSQL local port 54329, backend :4100, clés externes factices, garde réseau en liste blanche. Aucune requête vers la base Render ni vers Wave, Orange, WhatsApp, Telegram, Meta, Resend ou Cloudinary.
- Données : `nopalou_audit_data`, copie de production en **lecture seule** (`SET default_transaction_read_only = on`). Ne contient que des agrégats dans ce rapport, aucun nom, numéro ni e-mail.
- Rejeux : backend sur `nopalou_audit` avec un numéro factice `770009911`. Les lignes de test (1 utilisateur, 2 boutiques, 2 abonnements, 5 événements) restent dans cette base locale.
- **Limite 1 — la copie date du 2026-09-23/24.** Les tables métier s'arrêtent là (dernier compte 23/09, dernière commande 21/09). Elle précède donc plusieurs livraisons : starter pack et paywall POS (27-28/09), essai ramené à 14 jours dans le code (27/09), redressement prospection (30/09 `26db20a6`), Sonatel OM Pay (01/10). **Tous les chiffres ci-dessous sont une base de référence avant ces livraisons**, pas l'état actuel de la production.
- **Limite 2 — volumes faibles.** 100 comptes, 85 boutiques, 99 commandes, 59 essais. Aucun taux n'est statistiquement robuste ; ils servent à localiser des ruptures, pas à les chiffrer finement.
- **Limite 3 — pas d'accès à GA4 ni au pixel Meta/TikTok.** Le haut du funnel (visiteurs, pages vues, sources) est **NON VALIDÉ — TEST RÉEL IMPOSSIBLE** depuis cet environnement.
- **Limite 4 — comptes de test non isolables.** La copie contient des boutiques et comptes d'audit (le journal du 28/09 en désactive 22). Aucun filtre fiable n'existe ; les chiffres sont bruts, avec les doublons signalés.

### Recoupement avec les livraisons déjà faites (méthode, section 3)

| Sujet | Livraison antérieure | Résultat |
|---|---|---|
| Événements analytiques du funnel | ACQ-001 (21/09) | Backend **tenu** : rejeu local des 5 types (`ajout_panier`, `checkout_initie`, `commande_confirmee`, `clic_telephone`, `vue_produit`) → tous insérés. Émission côté navigateur **non rejouée** (pile front non lancée). Dans la copie, 0 événement de ces types sauf 4 `vue_produit`. |
| UTM sur les commandes | ACQ-002 (21/09) | Copie : 99 commandes sur 99 sans `utm_source`. **À confirmer** après la livraison. |
| Paniers abandonnés | ACQ-003 et ERR-COM-05 (28/09) | Copie : 38 paniers, 266 000 FCFA, 0 relancé. Livraison postérieure à la copie, **non rejouée**. |
| Statuts CRM vs messages | A-07 (30/09) | Copie : 222 leads « nouveau » portent un message réel. Correctif postérieur à la copie : **inconclusif**, à rejouer sur une copie fraîche. |
| Réconciliation boutiques ↔ CRM | A-05/A-06 (30/09) | Copie : 0 boutique avec `crm_lead_id`. Même réserve. |
| Pas de « Gratuit » sur frais à convenir, faux 5.0/5, « N°1 » accueil | 27-28/09 | Tenus sur les pages relues. **Régression partielle** : « N°1 » subsiste dans les gabarits de prospection et des méta (AUD-115). |

## 2. Funnel mesuré (copie ≤ 2026-09-23)

### 2.1 Acquisition marchande

| Étape | Mesure | Statut |
|---|---|---|
| Visiteurs | non mesurable (voir AUD-116) | NON VALIDÉ |
| Comptes créés | 100 (juin→sept. ; pics semaines du 10/08 : 18, 07/09 : 20, 14/09 : 21) | VÉRIFIÉ |
| … dont e-mail synthétique `…@whatsapp.nopalou.com` | 50 (50 %) | VÉRIFIÉ |
| … dont `est_apporteur = true` | 52, dont 35 à e-mail synthétique | VÉRIFIÉ |
| Comptes avec boutique | 64 propriétaires / 85 boutiques (65 actives) | VÉRIFIÉ |
| Propriétaires à plusieurs boutiques | 10 (6 × 2, 3 × 3, 1 × 5) | VÉRIFIÉ |
| Délai compte → boutique | 60 sur 64 en moins d'un jour, médiane quasi nulle (la boutique est créée avec le compte) | VÉRIFIÉ |
| Boutiques avec ≥ 1 produit | 34 / 85 (40 %), ≥ 3 produits : 12 (14 %) | VÉRIFIÉ (avant starter pack) |
| Boutiques avec ≥ 1 commande ou vente POS | 11 / 85 (13 %) | VÉRIFIÉ |
| Boutiques actives sur les 14 derniers jours de la copie | 8 ; 21 boutiques actives créées avant le 10/09 sans aucune activité depuis | VÉRIFIÉ |
| Essais démarrés | 59 propriétaires ; 12 terminés ; **0 devenu payeur** ; 47 en cours | VÉRIFIÉ |
| Abonnés payants réels | **1** propriétaire, 2 paiements `abmt_` (15 000 FCFA au total), échus avant le 24/09 | VÉRIFIÉ |
| MRR affiché par l'admin au 24/09 | **65 000 FCFA** (4 abonnements non-essai) ; les 4 sont des attributions `admin_test_` ; MRR issu de paiements : **0** | VÉRIFIÉ |

### 2.2 Paiement et commande

| Mesure | Valeur |
|---|---|
| Commandes boutique | 99 : 44 livrées, 29 annulées, 18 en attente, 7 confirmées, 1 en préparation |
| Sources | web 58, web_panier 19, WhatsApp (toutes variantes) 22 |
| `paiement_recu = true` | 1 / 99 |
| Méthode Wave | 27 commandes, 12 annulées (44 %), 1 payée enregistrée |
| Méthode Orange Money | 2 commandes, 0 payée |
| Espèces / cash | 51 commandes |
| Encaissements Nopalou (`commandes`) | 18 lignes, toutes `payee` : annonces 100-500 FCFA, 2 abonnements manuels (15 000 FCFA), boosts, sponsoring |
| Commandes avec `utm_source` | 0 / 99 |
| Paniers abandonnés | 38, 266 000 FCFA, 0 relancé (avant livraison du 28/09) |

### 2.3 Prospection

| Étape | Mesure |
|---|---|
| Leads | 1 649 : nouveau 1 037, contacte_wa 423, invalide 153, converti 25, en_discussion 11 |
| Normalisation | **VÉRIFIÉ** : 1 649 / 1 649 numéros à 12 chiffres, 0 doublon, 0 numéro vide |
| Leads réellement contactés (≥ 1 message) | 735 |
| Messages WhatsApp | envoyé 409, livré 158, lu 157, **échec 172**, simulé 8 ; e-mail 60 (35 « simulé ») |
| Échecs | 126 plafond marketing Meta (131049), 27 numéro invalide (131026), 22 « expérience » Meta |
| Réponses positives | 17 (2,3 % des 735) |
| Inscrits après le 1er message (rapprochement par téléphone) | 17 (2,3 %), dont 14 avec boutique, **0 avec vente, 0 payeur** |
| Opt-out | 0 en base ; la commande `STOP` existe dans le code (`whatsapp-chatbot.js:2349`) |
| Campagnes | 46, toutes intitulées « Campagne WhatsApp Prospection Dakar », toutes `variante_A`, `segment_cible` vide partout, `nb_interesses`/`nb_inscrits`/`nb_optout` = 0 partout |

Taux de réponse positive par source, leads contactés : annonces classifiées 8/336 (2,4 %), dorking 4/99 (4,0 %), sourcing immo 3/106 (2,8 %), import vrac 2/110 (1,8 %), scraper 0/57, Facebook 0/12. **166 leads `osm_places` (commerces physiques géolocalisés) n'ont jamais été contactés.**

Les semaines à 20-21 inscriptions coïncident avec les rafales de messages (180 le 10/09, 205 du 21 au 23/09). **Corrélation temporelle uniquement ; causalité non démontrée** (voir AUD-112).

## 3. Constats (index)

Numérotation à la suite des audits précédents (dernier : AUD-107). Détail, correction et critères de succès : plan de correction.

| ID | Étape | Gravité | Constat | Preuve |
|---|---|---|---|---|
| AUD-108 | Inscription | **P0** | `POST /api/boutiques/taf-taf` sans authentification renvoie le jeton de session d'un compte existant, retrouvé par son seul numéro ; l'OTP du wizard n'est jamais exigé côté serveur | VÉRIFIÉ (rejeu) |
| AUD-109 | Abonnement | P1 | Chaque appel de `taf-taf` ou de `POST /api/boutiques` recrée un essai, annule l'abonnement actif (même payant) et crée une boutique de plus | VÉRIFIÉ (rejeu) |
| AUD-110 | Abonnement / mesure | P1 | MRR « réel » affiché = attributions admin ; conversion essai → payant 0/12 invisible | VÉRIFIÉ |
| AUD-111 | Confiance | P1 | « 30 jours offerts » écrit en dur partout ; défaut du code = 14 jours | VÉRIFIÉ / valeur prod À CONFIRMER |
| AUD-112 | Prospection | P1 | Conversion CRM non attribuable : hook « converti » à la création de boutique, sans lien ni UTM, une seule variante | VÉRIFIÉ |
| AUD-113 | Prospection | P2 | 19 % d'échecs d'envoi, 73 % de ceux-ci dus au plafond marketing Meta | VÉRIFIÉ |
| AUD-114 | Prospection | P2 | Ciblage : commerces physiques jamais contactés, vendeurs particuliers fortement contactés | VÉRIFIÉ / lecture HYPOTHÈSE |
| AUD-115 | Copywriting | P2 | Allégations « N°1 » et « milliers d'acheteurs » non prouvées dans 3 gabarits et plusieurs méta | VÉRIFIÉ |
| AUD-116 | Acquisition / mesure | P1 | Haut du funnel invisible : événements obligatoirement rattachés à une boutique, pas d'identifiant visiteur, pas d'UTM stocké | VÉRIFIÉ |
| AUD-117 | Mesure | P2 | « Vues boutique » = appels API ; le tableau de bord marchand compte `commande_confirmee` alors que le serveur écrit `commande_web` | VÉRIFIÉ |
| AUD-118 | Activation | P1 | Articles de démarrage fictifs, en stock, visibles publiquement ; l'indicateur « a un produit » n'est plus fiable | VÉRIFIÉ |
| AUD-119 | Rétention / parrainage | P2 | 50 % des comptes sans e-mail réel ; 52 « apporteurs », 0 boutique rattachée, 0 commission | VÉRIFIÉ |
| AUD-120 | Paiement | P1 | Paiement initié non tracé : aucune trace de l'abandon, aucune relance possible | VÉRIFIÉ |
| AUD-121 | Paiement | P1 | Orange Money : repli simulé qui mène à une page d'erreur ; retour Sonatel vers `/paiement/erreur` probable | VÉRIFIÉ (simulation) / retour Sonatel À CONFIRMER |
| AUD-122 | Rétention | P2 | Relances J+1/J+7 perdues si le cron manque le jour exact ; réglages d'alerte sans effet ; promesses non vérifiées dans J-1 | VÉRIFIÉ |
| AUD-123 | Inscription | P2 | Wizard 4 étapes avec OTP sans renvoi ; abandon non mesuré | VÉRIFIÉ |
| AUD-124 | Copywriting | P2 | Prix et commission incohérents entre méta, documents internes et configuration | VÉRIFIÉ |
| AUD-125 | Copywriting / confiance | P2 | « 100 % hors-ligne » affiché ; recette Android jamais jouée | NON VALIDÉ — TEST RÉEL IMPOSSIBLE |
| AUD-126 | Copywriting | P3 | Valeur floue ou jargonneuse (accroches, description `/inscription`) | VÉRIFIÉ |
| AUD-127 | Viralité | P2 | Message de partage de vitrine : promesse de livraison non conditionnelle, lien sans suivi | VÉRIFIÉ |
| AUD-128 | Données | P3 | `recherches_logs` dominé par 4 requêtes aux volumes uniformes | VÉRIFIÉ / cause HYPOTHÈSE |
| AUD-129 | Marketing | P2 | Aucun canal social attribuable (0 commande avec UTM, 4 posts sociaux) | VÉRIFIÉ |
| AUD-131 | Prospection / mesure | P2 | Le journal enregistre un texte libre que le destinataire ne reçoit pas (il reçoit un gabarit Meta à deux paramètres) | VÉRIFIÉ (lecture) |
| AUD-130 | Paiement / commande | P2 | 26 commandes Wave sur 27 sans paiement enregistré, 44 % annulées | VÉRIFIÉ / cause À CONFIRMER |

## 4. Analyse par axe

### 4.1 Acquisition
Les chiffres cohérents avec une perte importante **après** la création du compte, pas avant : 60 boutiques sur 64 naissent avec le compte, mais seules 11 enregistrent une commande ou une vente et 8 restent actives sur 14 jours. La création instantanée (AUD-108, 118) gonfle les indicateurs d'entrée sans mesurer d'intention. Le haut du funnel ne peut pas être analysé (AUD-116) : on ne sait ni combien de visiteurs arrivent sur `/creer-boutique`, ni à quelle étape ils partent.

### 4.2 Prospection
Parcours PROSPECT → CONTACT → INTÉRÊT → INSCRIPTION → BOUTIQUE → ABONNEMENT → ACTIVITÉ, sur la copie :

`1 649 → 735 → 17 → 17 → 14 → 0 payeur → 0 activité`

Les blocages mesurables sont : la perte d'envoi (AUD-113), l'absence d'attribution (AUD-112), le ciblage (AUD-114) et surtout l'**activation après inscription** (14 boutiques, 0 vente). Le rapprochement par téléphone surestime l'effet des messages (des leads proviennent d'annonces publiées par des utilisateurs déjà inscrits) ; 17 est un plafond.

### 4.3 Marketing
Les leviers existent dans le code (kit apporteur, kit communication, pages SEO, bot WhatsApp, pixels par boutique) mais aucun n'est mesurable de bout en bout : 0 commande avec UTM, 4 posts sociaux importés (Instagram 2, YouTube 1, TikTok 1, derniers le 16/09), 52 apporteurs sans boutique rattachée. Les messages expliquant « pourquoi Nopalou » sont forts sur la caisse, le carnet de dettes et le paiement Wave, et plus faibles sur « pourquoi revenir chaque jour » : le seul rappel récurrent est le bilan du soir et les relances de dettes, qui exigent des ventes déjà enregistrées.

### 4.4 Abonnements
Valeur perçue : l'essai est consommé sans événement d'activation, et la fin d'essai est annoncée à J-3 et J-1 par un texte générique (aucune donnée du marchand). Friction au paiement : le paiement initié n'est pas tracé (AUD-120), Orange Money mène vraisemblablement à une page d'erreur (AUD-121), le dépôt manuel Wave passe par le numéro personnel de l'administrateur avec validation humaine. Confiance : promesse de durée d'essai contradictoire (AUD-111). Mesure : le tableau de bord affiche un MRR de 65 000 FCFA là où l'encaissement réel est nul (AUD-110).

### 4.5 Copywriting
Voir AUD-111, 115, 124, 125, 126, 127 et les propositions chiffrées dans le plan. Points forts à conserver : le ton direct (« Salam », « Répondez OUI »), l'argument « 85 FCFA par jour », la comparaison à Shopify en FCFA, l'argument de la fin d'essai « vos données sont conservées ».

## 5. Ce qui n'a pas pu être vérifié

- Trafic, sources et comportement des visiteurs (GA4, Meta, TikTok) : NON VALIDÉ.
- Valeur actuelle de `abonnement_essai_jours` en production (copie = 30, code = 14) : À CONFIRMER.
- Comportement réel du retour Orange Money Sonatel : NON VALIDÉ (appel réel interdit).
- Fonctionnement hors-ligne sur téléphone réel : NON VALIDÉ (recette Android non jouée).
- Efficacité des correctifs du 27/09 au 01/10 sur ces indicateurs : à mesurer sur une copie fraîche.
- Émission des événements analytiques côté navigateur : non rejouée.

## 6. Hors périmètre mais à signaler

- `POST /wave/initier` accepte `montant` et `produit_id` fournis par le client (`paiement.js:390`). La vérification de montant du webhook ne couvre que les commandes boutique. Non exploité ni rejoué : à confirmer dans un audit paiement dédié.
