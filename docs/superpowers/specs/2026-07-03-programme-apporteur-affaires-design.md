# Programme apporteur d'affaires — Design

Date : 2026-07-03
Statut : validé, prêt pour plan d'implémentation

## Contexte

Nopalou veut recruter des apporteurs d'affaires dans le réseau du fondateur pour vulgariser
la plateforme auprès de commerçants/agences (démarchage), moyennant une commission sur les
abonnements Pro/Business qu'ils recrutent. Un kit de présentation (texte, grille tarifaire,
visuel) existe déjà dans `/admin/communication`, mais aucun système de tracking ni de paiement
n'est implémenté — ce document couvre le système technique complet.

## Décisions validées

| Sujet | Décision |
|---|---|
| Taux de commission | 10% du montant de l'abonnement, récurrent chaque mois tant que l'abonnement recruté reste actif |
| Auth apporteur | Compte utilisateur existant (auth JWT actuelle) + flag `est_apporteur` — pas de nouveau système d'auth |
| Attribution boutique → apporteur | Combinaison des 3 : (1) lien trackable automatique via cookie, (2) champ manuel de secours au dépôt boutique, (3) correction/attribution manuelle par l'admin |
| Déclenchement commission | À chaque paiement d'abonnement réellement encaissé (webhook Wave/Orange), pas à la création de l'abonnement |
| Règlement | Calcul automatique du montant dû, mais versement 100% manuel (Wave/Orange par le fondateur) — un statut `du`/`paye` à cocher en admin, aucun virement automatisé |
| QR code carte de visite | QR générique vers `nopalou.com` (pas personnalisé par apporteur dans ce lot — enrichissement futur possible) |

## Architecture

### 1. Schéma base de données (ajouts à `migrate-inline.js`)

```sql
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS est_apporteur BOOLEAN DEFAULT FALSE;
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS code_apporteur VARCHAR(20);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_utilisateurs_code_apporteur
  ON utilisateurs(code_apporteur) WHERE code_apporteur IS NOT NULL;

ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS apporteur_id UUID REFERENCES utilisateurs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_boutiques_apporteur ON boutiques(apporteur_id);

CREATE TABLE IF NOT EXISTS commissions_apporteur (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apporteur_id   UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  boutique_id    UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  abonnement_id  UUID REFERENCES abonnements(id) ON DELETE SET NULL,
  montant        NUMERIC(10,2) NOT NULL,
  statut         VARCHAR(20) DEFAULT 'du' CHECK (statut IN ('du', 'paye')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  paye_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_commissions_apporteur ON commissions_apporteur(apporteur_id, statut);
```

`code_apporteur` : 6 caractères alphanumériques majuscules générés côté serveur (ex: `A3F9K2`),
regénérés en cas de collision (vérification unicité avant insertion).

### 2. Backend — `backend/routes/apporteurs.js` (nouveau fichier, monté dans `app.js`)

| Route | Auth | Description |
|---|---|---|
| `POST /api/apporteurs/devenir` | `verifierToken` | Active `est_apporteur=true`, génère `code_apporteur` si absent. Idempotent (si déjà apporteur, renvoie le code existant). |
| `GET /api/apporteurs/mes-stats` | `verifierToken` | 403 si `est_apporteur=false`. Renvoie : code, lien de partage, liste des boutiques recrutées (nom, plan, statut abonnement), total dû, total payé. |
| `GET /api/apporteurs/admin` | `adminSecretOnly` | Liste tous les apporteurs avec total dû/payé, pour vue d'ensemble. |
| `GET /api/apporteurs/admin/commissions` | `adminSecretOnly` | Liste toutes les lignes de commission (filtrable par statut), pour l'écran de règlement. |
| `PUT /api/apporteurs/admin/commissions/:id/payer` | `adminSecretOnly` | Passe une ligne `du` → `paye`, fixe `paye_at=NOW()`. Rejette si déjà payée (409). |
| `PUT /api/apporteurs/admin/boutiques/:id/attribuer` | `adminSecretOnly` | Body `{ code_apporteur }` ou `{ apporteur_id: null }` pour dissocier. Résout le code → id, met à jour `boutiques.apporteur_id`. |

### 3. Attribution automatique (lien trackable)

- Le lien partagé par l'apporteur est de la forme `https://nopalou.com/deposer-annonce?apporteur=A3F9K2`
  et équivalents pour `/boutique`, `/deposer-immo` (toute page d'entrée qui mène à la création
  d'une boutique/annonce payante).
- Le middleware Next.js (`middleware.ts`) détecte `?apporteur=CODE` sur ces routes et pose un
  cookie `nopalou_apporteur=CODE` (non-httpOnly, 30 jours, pour rester lisible côté Server Action
  si besoin — mais écrit uniquement côté serveur pour éviter la falsification triviale... note :
  un cookie simple reste falsifiable côté client ; acceptable ici car l'enjeu est un abus de
  commission détectable a posteriori par l'admin, pas une faille de sécurité critique).
- Le formulaire de création boutique (`/boutique` — création initiale) inclut un champ optionnel
  "Code apporteur (si recommandé par quelqu'un)" pré-rempli depuis le cookie si présent, modifiable
  par l'utilisateur.
- Backend `POST /api/boutiques` (création) : lit `req.body.code_apporteur` (venant du champ,
  pré-rempli ou saisi manuellement), résout vers `apporteur_id`, l'attache à la nouvelle boutique.
  Code invalide ou absent → boutique créée sans apporteur (pas d'erreur bloquante).

### 4. Déclenchement de la commission

Dans `backend/routes/paiement.js`, aux points où un paiement d'abonnement Wave/Orange est
confirmé (webhook) et où `abonnements` passe à `statut='actif'` avec succès :

```js
const boutique = await pool.query('SELECT apporteur_id FROM boutiques WHERE utilisateur_id=$1', [userId]);
if (boutique.rows[0]?.apporteur_id) {
  const montantCommission = prixPaye * 0.10;
  await pool.query(
    `INSERT INTO commissions_apporteur (apporteur_id, boutique_id, abonnement_id, montant)
     VALUES ($1, $2, $3, $4)`,
    [boutique.rows[0].apporteur_id, boutique.rows[0].id, abonnementId, montantCommission]
  );
}
```

Le taux 10% est en dur dans le code pour ce lot (pas dans `settings`, contrairement aux autres
tarifs) — cohérent avec la décision produit actuelle ; migration vers `settings` possible plus
tard sans casser le schéma.

### 5. Frontend Next.js

**`/compte/apporteur`** (nouvelle page, sous route protégée existante `/compte`)
- Si non-apporteur : bouton "Devenir apporteur d'affaires" → appelle `POST /api/apporteurs/devenir`
- Si apporteur : affiche le code, un lien copiable (`nopalou.com/boutique?apporteur=CODE`),
  liste des boutiques recrutées avec statut, total dû / payé.

**`/admin/apporteurs`** (nouvelle page admin, dans `(protected)/`)
- Tableau des apporteurs avec total dû/payé
- Tableau des commissions `du` avec bouton "Marquer payé"
- Formulaire d'attribution manuelle boutique → code apporteur (pour corriger les cas où le
  tracking automatique a échoué)

### 6. QR code carte de visite

- Ajout dépendance `qrcode` (génère SVG serveur, compatible edge runtime `next/og` à vérifier —
  si incompatible avec `runtime = 'edge'`, basculer cette route spécifique en `runtime = 'nodejs'`).
- `frontend-next/src/app/assets/carte-visite/route.tsx` : remplace le placeholder texte
  `[QR code nopalou.com]` par le SVG généré, pointant vers `https://nopalou.com` (générique,
  pas personnalisé par apporteur dans ce lot).

## Hors scope (explicitement exclu de ce lot)

- Virement automatique de la commission (Wave/Orange payout API) — reste manuel
- QR code personnalisé par apporteur (avec son propre code de tracking encodé)
- Paliers de commission variables selon volume recruté
- Notifications automatiques (email/WhatsApp) à l'apporteur quand une commission est due ou payée
- Historique/export comptable des commissions (CSV, etc.)

## Risques / points d'attention pour le plan d'implémentation

1. **Cookie falsifiable** : un utilisateur technique pourrait forger `nopalou_apporteur=CODE`
   pour attribuer une fausse commission à un apporteur complice. Accepté comme risque mineur
   (impact financier limité au 10% d'un abonnement, détectable en admin) — pas de mitigation
   dans ce lot.
2. **Compatibilité edge runtime + `qrcode`** : à vérifier en implémentation ; certaines
   librairies QR ne fonctionnent pas en edge runtime (dépendance à `canvas` ou Buffer Node).
   Si incompatible, utiliser une génération SVG pure sans dépendance native.
3. **Boutique existante sans apporteur, recrutée rétroactivement** : le formulaire de création
   boutique n'est déclenché qu'à la création — si un apporteur recrute un commerçant qui a
   *déjà* une boutique, l'attribution ne peut se faire que via la route admin manuelle.
