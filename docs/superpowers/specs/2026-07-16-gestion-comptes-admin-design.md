# Design : Section "Gestion des comptes" dans l'admin

## Contexte

Aucune section admin n'existe aujourd'hui pour consulter ou agir directement sur les comptes utilisateurs (`utilisateurs` table). Les sections existantes (`/admin/abonnements`, `/admin/boutiques`, `/admin/apporteurs`...) montrent des données liées aux utilisateurs mais ne permettent aucune action sur le compte lui-même (vérifier l'email manuellement, suspendre, supprimer sur demande RGPD).

Besoin exprimé : une section complète couvrant consultation/recherche, support client, modération/sécurité, et suppression RGPD.

## Périmètre

### 1. Consultation / recherche
- Liste paginée des comptes avec recherche texte (nom, email, téléphone)
- Filtres : statut (vérifié / non vérifié / suspendu / en cours de suppression), type (apporteur / a une boutique)
- Tri par date d'inscription (défaut : plus récents en premier)
- Fiche détail par compte : infos de base + résumé d'activité (nb annonces, nb biens immo, boutique, statut apporteur) + abonnement actif

### 2. Support client
Depuis la fiche détail d'un compte :
- Forcer la vérification email (`email_verifie = true` sans lien cliqué)
- Renvoyer l'email de vérification (réutilise la logique d'envoi existante de `POST /api/auth/renvoyer-verification`)
- Générer un lien de réinitialisation de mot de passe, affiché à l'admin pour transmission manuelle (pas d'envoi automatique d'email)

### 3. Modération / sécurité
- Suspension binaire : colonne `suspendu BOOLEAN DEFAULT false`
- Un compte suspendu ne peut plus se connecter (`POST /api/auth/connexion` vérifie et refuse avec message explicite), même avec le bon mot de passe
- Pas d'expiration automatique — réactivation manuelle par l'admin uniquement
- Pas de motif ni d'historique dans cette V1 (scope minimal validé)

### 4. Suppression RGPD réversible
- Suppression en 2 temps : marquage (période de grâce) puis purge définitive
- `supprime_le TIMESTAMPTZ` : NULL = compte actif normal ; rempli = période de grâce en cours (30 jours à partir de cette date)
- Pendant la période de grâce : le compte est traité comme suspendu côté connexion (aucun accès), mais reste restaurable par l'admin en un clic
- Après 30 jours révolus, l'admin peut déclencher la purge définitive manuellement (pas de cron automatique) — action à double confirmation, irréversible
- Purge = **anonymisation**, pas suppression physique : `nom`, `email`, `telephone` remplacés par des valeurs génériques (`Utilisateur supprimé`, `deleted-{id}@nopalou.local`), `mot_de_passe_hash` invalidé, `anonymise_le` rempli. Les données liées (annonces, boutique, commandes historiques) restent intactes mais ne référencent plus d'identité réelle.
- Raison du choix anonymisation vs DELETE physique : évite de casser les FK existantes (`commandes_boutique`, `commissions_apporteur`, `abonnements`, `parrainages`) qui n'ont pas toutes `ON DELETE CASCADE`, et reste conforme à l'esprit RGPD ("droit à l'effacement" = ne plus être identifiable, pas nécessairement zéro trace en base).

## Architecture

### Migration DB (`backend/migrate-inline.js`)
Ajout idempotent sur `utilisateurs` :
```sql
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS suspendu BOOLEAN DEFAULT false;
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMPTZ;
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS anonymise_le TIMESTAMPTZ;
```

### Backend — nouvelle route `backend/routes/admin-utilisateurs.js`
Montée sur `/api/admin/utilisateurs` dans `app.js`, toutes les routes protégées par `adminSecretOnly` :

| Route | Effet |
|---|---|
| `GET /` | Liste paginée (`?q=&statut=&type=&tri=&page=`) |
| `GET /:id` | Fiche détail : infos + résumé activité (COUNT annonces/immo, EXISTS boutique, est_apporteur) + abonnement actif (`JOIN` sur `abonnements` statut=actif) |
| `PUT /:id/verifier-email` | `UPDATE utilisateurs SET email_verifie = true WHERE id = $1` |
| `POST /:id/renvoyer-verification` | Génère un token + envoie l'email (même logique que la route utilisateur existante) |
| `POST /:id/lien-reset` | Génère et **retourne** le lien de reset (pas d'envoi email) — même format de token que `/api/auth/mot-de-passe-oublie` |
| `PUT /:id/suspendre` | `suspendu = true` |
| `PUT /:id/reactiver` | `suspendu = false` |
| `POST /:id/marquer-supprime` | `supprime_le = NOW()` |
| `POST /:id/restaurer` | `supprime_le = NULL` |
| `POST /:id/purger` | Refuse si `supprime_le` est NULL ou si moins de 30 jours se sont écoulés. Sinon : anonymise nom/email/téléphone/mot_de_passe_hash, pose `anonymise_le = NOW()` |

### Middleware connexion (`backend/routes/auth.js`)
`POST /api/auth/connexion` : après vérification du mot de passe, si `suspendu = true` ou `supprime_le IS NOT NULL` → `403` avec message distinct pour chaque cas ("Compte suspendu, contactez le support" / "Ce compte est en cours de suppression").

### Frontend — `/admin/comptes`
Nouveau dossier `frontend-next/src/app/admin/(protected)/comptes/`, suit le pattern déjà établi par `abonnements` :

- **`page.tsx`** (Server Component) : fetch `GET /api/admin/utilisateurs` avec `searchParams`, affiche barre de recherche (input texte, soumission GET), pills de filtre statut/type (pattern `budget-pill` réutilisé), table avec colonnes Nom/Email/Tel, Statuts (badges), Inscrit le, lien vers la fiche
- **`[id]/page.tsx`** (Server Component) : fetch `GET /api/admin/utilisateurs/:id`, affiche infos de base, bloc résumé activité, bloc abonnement, puis `<ActionsCompteClient />`
- **`[id]/ActionsCompteClient.tsx`** (Client Component) : boutons d'action groupés par bloc (Support / Modération / Suppression), chacun avec `useFormState` + confirmation JS native (`confirm()`) pour les actions destructives (suspendre, marquer supprimé, purger). Le lien de reset généré s'affiche dans un encart avec bouton copier, pas de redirection.
- **`layout.tsx`** : ajout de l'entrée menu `<a href="/admin/comptes" className="admin-nav-link">👥 Comptes utilisateurs</a>`, positionnée juste avant "⭐ Abonnements"

## Hors scope (explicite)
- Pas de motif de suspension ni d'historique des actions admin (audit log) dans cette V1
- Pas de purge automatique programmée (cron) — déclenchement manuel uniquement
- Pas de notification email automatique à l'utilisateur lors de la suspension ou de la suppression
- Pas de export CSV / bulk actions sur plusieurs comptes à la fois
- Le lien de reset généré n'est jamais envoyé par email depuis l'admin — l'admin le transmet par le canal de son choix (l'email existe déjà comme option séparée)

## Vérification
- Migration testée en local (colonnes ajoutées, idempotence vérifiée par double exécution)
- Chaque route backend testée via `curl` avec `X-Admin-Secret` (cas succès + cas d'erreur : id inexistant, purge avant 30j)
- `npx tsc --noEmit` propre côté frontend-next
- Parcours manuel : suspendre un compte de test → tentative de connexion refusée → réactiver → connexion de nouveau possible
- Parcours manuel : marquer supprimé → vérifier connexion refusée → restaurer → connexion de nouveau possible
- Purge testée uniquement avec une date `supprime_le` forcée dans le passé (via SQL direct) pour simuler les 30 jours écoulés, sur un compte de test créé pour l'occasion, jamais sur un compte réel
