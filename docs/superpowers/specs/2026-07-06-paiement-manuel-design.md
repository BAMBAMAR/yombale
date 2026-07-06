# Paiement manuel (sans clé API Wave/Orange) — Design

**Date** : 2026-07-06
**Contexte** : Wave Business et Orange Money marchand ne sont pas encore ouverts (KYC en cours). En attendant les clés API, il faut pouvoir encaisser des paiements réels via dépôt/transfert direct vers un numéro Wave/Orange personnel ou marchand simple, avec validation humaine côté admin, sur **tous** les flux de paiement existants du site.

## Périmètre

Les 6 flux de paiement existants, tous construits sur le même patron (`client_reference` préfixée → activation en base) :

| Flux | Préfixe ref | Effet |
|---|---|---|
| Annonce classifiée | `ann_` | `annonces_classifiees.actif=true, payee=true` |
| Boost annonce 7j | `boost_` | `annonces_classifiees.boost_until` (+7j) |
| Sponsoring immo 30j | `immo_` | `annonces_immo.sponsorisee=true` |
| Sponsoring boutique 30j | `bout_` | `boutiques.sponsorise=true` |
| Sponsoring produit 30j | `prod_` | `produits.sponsorise=true` |
| Abonnement Pro/Business | `abmt_` | `abonnements` (INSERT) + `commission_rate` + commission apporteur |

Le flux **boost annonce** n'a aujourd'hui aucune UI (bouton) côté site — il sera ajouté dans `/mes-annonces` avec les 3 modes de paiement, dans le cadre de ce chantier.

Les toggles `paiement_wave` / `paiement_orange` existent déjà dans `settings` mais ne sont jamais lus côté backend (juste cosmétiques dans `/admin/tarifs`). Ils seront rendus fonctionnels : le backend refusera l'initiation Wave/Orange si le toggle correspondant est désactivé, et le frontend masquera le bouton correspondant.

## Architecture

### 1. Factorisation : `appliquerPaiementReussi(reference, montant, methode)`

Le bloc `if (ref.startsWith('ann_')) {...} else if (ref.startsWith('boost_')) {...} ...` actuellement dupliqué dans le webhook Wave (`paiement.js:67-180`) et le webhook Orange (`paiement.js:347-451`) est extrait dans une fonction unique, ajoutée à `paiement.js` et exportée pour être réutilisée par la route de validation manuelle. Les deux webhooks existants l'appellent après leur vérification de signature respective — comportement inchangé, zéro divergence future entre Wave/Orange/manuel.

`methode` devient un troisième cas valide : `'wave' | 'orange' | 'manuel'`, écrit tel quel dans `commandes.methode_paiement` pour que `/api/paiement/stats` distingue les trois sans confondre un paiement manuel avec un vrai encaissement Wave.

### 2. Table `paiements_manuels`

```sql
CREATE TABLE IF NOT EXISTS paiements_manuels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id),
  reference TEXT NOT NULL,          -- même format que client_reference (ann_/boost_/immo_/bout_/prod_/abmt_)
  montant INTEGER NOT NULL,
  methode TEXT NOT NULL,            -- 'wave' | 'orange' (moyen utilisé par le client pour le dépôt)
  telephone_expediteur TEXT NOT NULL,
  transaction_id_client TEXT,       -- référence/ID de transaction fourni par le client (facultatif si preuve fournie)
  preuve_url TEXT,                  -- capture d'écran Cloudinary (facultatif si transaction_id fourni)
  statut TEXT NOT NULL DEFAULT 'en_attente',  -- 'en_attente' | 'valide' | 'rejete'
  motif_rejet TEXT,
  valide_par TEXT,                  -- identifiant admin (pas de table admin dédiée — on stocke un libellé)
  valide_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_paiements_manuels_statut ON paiements_manuels(statut);
```

Au moins un des deux champs `transaction_id_client` / `preuve_url` doit être renseigné (validé côté route, pas en contrainte SQL — cohérent avec le style du projet qui valide en JS).

### 3. Routes backend (`paiement.js`)

- **`POST /api/paiement/manuel/declarer`** (authentifié, `limiterEcriture`)
  Body : `{ reference, montant, methode, telephone_expediteur, transaction_id_client?, preuve_base64? }`.
  Valide que `reference` correspond à une entité réellement possédée par l'utilisateur (même vérification que chaque route `.../initier` existante — réutilise les mêmes requêtes `SELECT ... WHERE id=$1 AND utilisateur_id=$2`). Si `preuve_base64` fourni, upload Cloudinary (réutilise le pattern déjà utilisé pour les photos d'annonces). Insert en base, statut `en_attente`. Retourne `{ ok: true }`.

- **`GET /api/paiement/manuel/liste`** (`adminSecretOnly`)
  Liste paginée par statut (défaut `en_attente`), avec infos utilisateur jointes (nom, téléphone, email).

- **`POST /api/paiement/manuel/:id/valider`** (`adminSecretOnly`)
  Charge la ligne, vérifie qu'elle est encore `en_attente`, appelle `appliquerPaiementReussi(reference, montant, 'manuel')`, marque `statut='valide', valide_par, valide_at`.

- **`POST /api/paiement/manuel/:id/rejeter`** (`adminSecretOnly`)
  Body `{ motif }`. Marque `statut='rejete', motif_rejet`. Aucun effet en base métier.

### 4. Garde-fous sur les toggles Wave/Orange

Dans chaque route `.../initier` existante (annonce, boost, immo-sponsoring, produit-sponsoring, boutique-sponsoring, abonnement) et dans `abonnements.js`, ajout d'une vérification en tête :
- Route Wave → `if (!(await cfg.getBool('paiement_wave'))) return res.status(403).json({ error: 'Paiement Wave temporairement indisponible' })`
- Route Orange (générique `/orange/initier`) → même vérification sur `paiement_orange`.

Nouveau settings : `paiement_manuel_actif` (bool, défaut `true`), `paiement_manuel_numero_wave` (text), `paiement_manuel_numero_om` (text) — édités depuis `/admin/tarifs` comme les prix existants.

### 5. Frontend

**`frontend-next/src/app/actions/paiement.ts`** — nouvelle Server Action `declarerPaiementManuel(reference, montant, methode, telephoneExpediteur, transactionId?, preuveFile?)`, suivant le même pattern (`getOptionalSession` + `backendAuthFetch`-like token mint) que les fonctions existantes.

**Composant partagé `ModalPaiementManuel.tsx`** (nouveau, `frontend-next/src/components/`) : affiche le numéro Wave/OM à créditer (depuis un `GET /api/settings/public` déjà existant), un formulaire (téléphone expéditeur, méthode, ID transaction OU upload preuve), soumet via la Server Action, affiche un message "Déclaration reçue, activation sous peu après vérification". Réutilisé tel quel dans les 6 écrans de paiement, en 3ᵉ option à côté des boutons Wave/Orange (masqués individuellement si leur toggle settings est désactivé).

**Écrans à modifier** : `PaiementClient.tsx` (annonce), `AbonnementClient.tsx`, `SponsoringImmoBtn.tsx`, `SponsoringProduitBtn.tsx`, `BoutiqueClient.tsx` (bloc sponsoring), et nouveau bouton boost dans `/mes-annonces` (à créer, réutilisant le composant modal).

**Admin** : nouvelle page `frontend-next/src/app/admin/(protected)/paiements-manuels/` — liste des déclarations en attente (téléphone, montant, référence, méthode, lien preuve), boutons Valider/Rejeter. Lien ajouté au menu admin.

### 6. Abonnement — cas particulier

La route existante `POST /api/abonnements/admin/activer` reste en l'état (activation manuelle sans trace de paiement, cas "geste commercial"), mais n'est **pas** utilisée par le nouveau flux — la validation d'un `paiements_manuels` de type `abmt_` passe exclusivement par `appliquerPaiementReussi()`, qui est la seule source de vérité pour la commission apporteur et `commission_rate`.

## Erreurs & cas limites

- Déclaration en double sur la même référence → autorisée en insertion (l'utilisateur peut se tromper et redéclarer), mais `appliquerPaiementReussi` protège déjà nativement les effets (ex. `ON CONFLICT (commande_ref) DO NOTHING` pour les abonnements, re-`UPDATE` idempotent pour les autres) donc valider deux déclarations pour la même ref ne double pas l'effet — sauf la commission apporteur sur abonnement, déjà protégée par le `RETURNING id` conditionnel existant.
- Montant déclaré par le client ne correspond pas au prix réel (`getPrix()`) → la route de validation admin recalcule le prix attendu côté serveur et ignore le montant déclaré par le client pour l'activation (le montant déclaré n'est affiché qu'à titre indicatif pour l'admin qui vérifie le dépôt réel).
- Admin rejette → aucun impact DB métier, statut `rejete` conservé pour historique/audit.

## Hors scope

- Pas de notification automatique (email/WhatsApp) au client à la validation — l'admin informe manuellement pour l'instant, cohérent avec le reste du projet à ce stade.
- Pas de rate-limiting spécifique au-delà de `limiterEcriture` déjà standard.
- Pas de suppression/retrait du mode manuel une fois Wave/Orange opérationnels — il reste disponible en permanence (toggle `paiement_manuel_actif` permet de le désactiver si besoin).
