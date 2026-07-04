# Programme apporteur d'affaires — Design

Date : 2026-07-03
Statut : **implémenté et fusionné sur `main` le 4 juillet 2026** (9 tâches + revue finale de branche, 1 bug important trouvé et corrigé en revue finale — produit cartésien dans `GET /api/apporteurs/admin`). Voir `docs/superpowers/plans/2026-07-04-programme-apporteur-affaires.md` pour le détail des tâches.

## Contexte

Nopalou veut recruter des apporteurs d'affaires dans le réseau du fondateur pour vulgariser
la plateforme auprès de commerçants/agences (démarchage), moyennant une commission sur les
abonnements Pro/Business qu'ils recrutent. Un kit de présentation (texte, grille tarifaire,
visuel) existe déjà dans `/admin/communication`, mais aucun système de tracking ni de paiement
n'est implémenté — ce document couvre le système technique complet.

## Décisions validées

| Sujet | Décision |
|---|---|
| Taux de commission | Paramétrable via `settings` (défaut 10%), du montant de l'abonnement, récurrent chaque mois tant que l'abonnement recruté reste actif |
| Auth apporteur | Compte utilisateur existant (auth JWT actuelle) + flag `est_apporteur` — pas de nouveau système d'auth |
| Attribution boutique → apporteur | Combinaison des 3 : (1) lien trackable automatique via cookie, (2) champ manuel de secours au dépôt boutique, (3) correction/attribution manuelle par l'admin |
| Déclenchement commission | À chaque paiement d'abonnement réellement encaissé (webhook Wave/Orange), pas à la création de l'abonnement |
| Règlement | Calcul automatique du montant dû, mais versement 100% manuel (Wave/Orange par le fondateur) — un statut `du`/`paye` à cocher en admin, aucun virement automatisé. Un seuil minimum paramétrable bloque le règlement d'un apporteur individuel tant que son cumul `du` ne l'atteint pas. |
| QR code carte de visite | QR générique vers `nopalou.com` (pas personnalisé par apporteur dans ce lot — enrichissement futur possible) |
| Activation du programme | Paramétrable via `settings` — toggle global, comme `paiement_wave`/`paiement_orange` |
| Fenêtre d'attribution (cookie) | Paramétrable via `settings` (défaut 30 jours) |

### Tous les paramètres numériques/toggles du programme sont configurables sans redéploiement

Cohérent avec le système `settings` existant (`backend/lib/settingsCache.js`, cache mémoire 5 min),
utilisé pour `plan_pro_prix`, `plan_business_prix`, `paiement_wave`, etc. Nouvelles clés à ajouter
à l'objet `DEFAULTS` de `settingsCache.js` (comme les clés existantes) :

| Clé settings | Défaut | Description |
|---|---|---|
| `apporteur_actif` | `true` | Active/désactive le programme dans son ensemble — si `false`, `POST /api/apporteurs/devenir` refuse (403) et aucune commission n'est générée |
| `apporteur_taux_commission` | `10` | % appliqué sur chaque paiement d'abonnement encaissé pour une boutique liée à un apporteur |
| `apporteur_seuil_paiement` | `3000` | Montant cumulé minimum (FCFA) de commissions `du` avant que l'admin puisse les marquer `paye` |
| `apporteur_cookie_jours` | `30` | Durée de validité (jours) du cookie d'attribution posé après un clic sur un lien `?apporteur=CODE` |

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
| `POST /api/apporteurs/devenir` | `verifierToken` | 403 si `apporteur_actif=false` (settings). Sinon active `est_apporteur=true`, génère `code_apporteur` si absent. Idempotent (si déjà apporteur, renvoie le code existant). |
| `GET /api/apporteurs/mes-stats` | `verifierToken` | 403 si `est_apporteur=false`. Renvoie : code, lien de partage, liste des boutiques recrutées (nom, plan, statut abonnement), total dû, total payé, taux de commission actuel, seuil de paiement actuel. |
| `GET /api/apporteurs/admin` | `adminSecretOnly` | Liste tous les apporteurs avec total dû/payé, pour vue d'ensemble. |
| `GET /api/apporteurs/admin/commissions` | `adminSecretOnly` | Liste toutes les lignes de commission (filtrable par statut), pour l'écran de règlement. Indique pour chaque apporteur si son cumul `du` atteint `apporteur_seuil_paiement`. |
| `PUT /api/apporteurs/admin/commissions/:id/payer` | `adminSecretOnly` | Passe une ligne `du` → `paye`, fixe `paye_at=NOW()`. Rejette si déjà payée (409). Rejette aussi (422) si le cumul `du` de l'apporteur pour cette ligne est sous `apporteur_seuil_paiement` — sauf si l'admin force via `{ ignorer_seuil: true }` dans le body (cas exceptionnel, ex. départ d'un apporteur). |
| `PUT /api/apporteurs/admin/boutiques/:id/attribuer` | `adminSecretOnly` | Body `{ code_apporteur }` ou `{ apporteur_id: null }` pour dissocier. Résout le code → id, met à jour `boutiques.apporteur_id`. |

### 3. Attribution automatique (lien trackable)

- Le lien partagé par l'apporteur est de la forme `https://nopalou.com/deposer-annonce?apporteur=A3F9K2`
  et équivalents pour `/boutique`, `/deposer-immo` (toute page d'entrée qui mène à la création
  d'une boutique/annonce payante).
- Le middleware Next.js (`middleware.ts`) détecte `?apporteur=CODE` sur ces routes et pose un
  cookie `nopalou_apporteur=CODE` (non-httpOnly, durée lue depuis `apporteur_cookie_jours` via
  `GET /api/settings/public`, pour rester lisible côté Server Action si besoin — mais écrit
  uniquement côté serveur pour éviter la falsification triviale... note : un cookie simple reste
  falsifiable côté client ; acceptable ici car l'enjeu est un abus de commission détectable a
  posteriori par l'admin, pas une faille de sécurité critique).
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
const settingsCache = require('../lib/settingsCache');

const apporteurActif = await settingsCache.getBool('apporteur_actif');
if (apporteurActif) {
  const boutique = await pool.query('SELECT apporteur_id FROM boutiques WHERE utilisateur_id=$1', [userId]);
  if (boutique.rows[0]?.apporteur_id) {
    const taux = await settingsCache.getNum('apporteur_taux_commission');
    const montantCommission = prixPaye * (taux / 100);
    await pool.query(
      `INSERT INTO commissions_apporteur (apporteur_id, boutique_id, abonnement_id, montant)
       VALUES ($1, $2, $3, $4)`,
      [boutique.rows[0].apporteur_id, boutique.rows[0].id, abonnementId, montantCommission]
    );
  }
}
```

Le taux est lu depuis `settings` (clé `apporteur_taux_commission`) à chaque déclenchement, pas
figé à l'insertion — un changement de taux en cours de mois s'applique aux paiements suivants
sans affecter les commissions déjà enregistrées (chaque ligne stocke le `montant` déjà calculé,
donc l'historique reste stable même si le taux global change ensuite).

### 5. Frontend Next.js

**`/compte/apporteur`** (nouvelle page, sous route protégée existante `/compte`)
- Si non-apporteur : bouton "Devenir apporteur d'affaires" → appelle `POST /api/apporteurs/devenir`
- Si apporteur : affiche le code, un lien copiable (`nopalou.com/boutique?apporteur=CODE`),
  liste des boutiques recrutées avec statut, total dû / payé.

**`/admin/apporteurs`** (nouvelle page admin, dans `(protected)/`)
- Bloc configuration en haut de page (lit/écrit `settings` via les routes `/api/settings`
  existantes, même pattern que `/admin/tarifs`) : toggle actif/inactif, taux de commission (%),
  seuil de paiement (FCFA), durée du cookie d'attribution (jours)
- Tableau des apporteurs avec total dû/payé
- Tableau des commissions `du` avec bouton "Marquer payé" — désactivé (grisé, avec tooltip) si
  le cumul de l'apporteur est sous le seuil configuré, avec option "forcer" pour l'admin
- Formulaire d'attribution manuelle boutique → code apporteur (pour corriger les cas où le
  tracking automatique a échoué)

### 6. QR code carte de visite — ✅ déjà livré (hors périmètre de ce lot)

Fait le 2026-07-03 (commit `9c97b76`) : `qrcode-svg` (pure JS, compatible edge runtime) génère un
SVG encodé en data URI, affiché dans `frontend-next/src/app/assets/carte-visite/route.tsx`,
pointant vers `https://nopalou.com` (générique, pas personnalisé par apporteur).

## Hors scope (explicitement exclu de ce lot)

- Virement automatique de la commission (Wave/Orange payout API) — reste manuel
- QR code personnalisé par apporteur (avec son propre code de tracking encodé)
- Paliers de commission automatiques selon volume recruté (ex: 15% après 10 boutiques actives) —
  le taux reste unique et global, ajustable manuellement via `settings`, mais pas de règle
  automatique par palier
- Notifications automatiques (email/WhatsApp) à l'apporteur quand une commission est due ou payée
- Historique/export comptable des commissions (CSV, etc.)

## Risques / points d'attention pour le plan d'implémentation

1. **Cookie falsifiable** : un utilisateur technique pourrait forger `nopalou_apporteur=CODE`
   pour attribuer une fausse commission à un apporteur complice. Accepté comme risque mineur
   (impact financier limité au taux configuré d'un abonnement, détectable en admin) — pas de
   mitigation dans ce lot.
2. **Boutique existante sans apporteur, recrutée rétroactivement** : le formulaire de création
   boutique n'est déclenché qu'à la création — si un apporteur recrute un commerçant qui a
   *déjà* une boutique, l'attribution ne peut se faire que via la route admin manuelle.
3. **Changement de taux en cours de route** : si `apporteur_taux_commission` est modifié en
   admin, les commissions déjà en base gardent leur `montant` figé (calculé au moment du
   paiement) — seuls les paiements futurs utilisent le nouveau taux. Comportement voulu, mais
   à garder en tête si l'admin s'attend à un recalcul rétroactif (ce n'est pas le cas).
