# Méthodologie d'audit et de plan de correction NOPALOU

Méthode appliquée lors de l'audit du 30 septembre 2026 (`AUDIT-NOPALOU-2026-09-30.md`) et de son plan (`PLAN-CORRECTION-NOPALOU-2026-09-30.md`). À suivre pour tout audit futur. Outillage : `scripts/audit/` (voir son README).

## 1. Principes non négociables

1. **Preuve ou rien.** Une anomalie n'existe que si elle est reproduite (requête, sortie, capture, test qui échoue). Ne rien supposer : lire le code, exécuter, mesurer. Ce qui n'a pas pu être vérifié est listé comme « non vérifié », jamais déclaré conforme.
2. **Ne rien corriger pendant l'audit.** Audit et correction sont deux phases distinctes, avec deux livrables.
3. **Jamais la production.** Aucun test, sonde, charge ou écriture contre la base Render ni les API réelles (Wave, WhatsApp, Telegram, Stripe, Resend, Cloudinary, Facebook). Toujours passer par `scripts/audit/audit-env.ps1` (base locale, clés factices non vides, garde réseau en liste blanche bouclée locale). Une fuite d'isolation est divulguée à l'utilisateur dès sa découverte.
4. **Données réelles en lecture seule.** Une copie restaurée d'une sauvegarde de production sert à mesurer la qualité des données ; elle contient des données personnelles : ne jamais la committer ni l'exporter, la supprimer quand elle n'est plus utile.
5. **Chaque correction est prouvée** par un test qui échoue sans elle (contrôle par mutation : retirer le correctif, le test doit échouer) et passe avec.
6. **Recoupement avec l'existant avant toute nouvelle fiche.** Ne jamais signaler une anomalie sans avoir vérifié qu'elle n'est pas déjà corrigée : `git log`/`git diff` sur les fichiers et routes du périmètre depuis le dernier rapport d'audit ou `docs/JOURNAL-LIVRAISONS.md`, puis rejeu effectif (sonde, script de `scripts/audit/`, ou test dédié) de tout correctif antérieur touchant le même périmètre — jamais une simple lecture du message de commit ou du journal. Consigner le résultat du rejeu dans le rapport (« recoupé, tenu » ou « recoupé, régression détectée → nouvelle fiche »).

## 2. Phase d'audit

**Ordre** : (0) état réel du système (recoupement inclus), (1) inventaire exhaustif, (2) sondes automatisées, (3) analyse par domaine, (4) preuves, (5) rapport.

0. **État réel** : branche, dernier commit, dépendances, variables d'environnement attendues (noms seulement), versions, suites de tests existantes et leur état de départ (nombre de suites/tests en échec), ce qui démarre ou non. **Recoupement** (principe 6) : identifier les commits touchant le périmètre depuis le dernier audit/journal et rejouer leurs preuves de correction avant de sonder quoi que ce soit de neuf.
1. **Inventaire** : routes (`enum-routes.js` : toutes les routes Express avec leurs middlewares), pages frontend, tables et colonnes, crons, intégrations externes, rôles et permissions.
2. **Sondes** :
   - non authentifié : `probe.js` sur toutes les routes (hors liste de routes à risque en écriture) ;
   - multi-tenant / IDOR : `seed.js` (marchands A et B, acheteur C) puis `idor.js` : A et C contre les ressources de B ;
   - RBAC admin : `verify-rbac.js` (rôle × route, « refusé » doit égaler l'absence de permission) ;
   - injections (SQL, XSS stocké, SSRF), en-têtes, limitation de débit, échecs de secrets ;
   - migrations : `freshmig.js` (base vide + migrations = schéma attendu) et `schemadiff.js` (écart avec le schéma de production) ;
   - sauvegarde : `roundtrip.js` (sauvegarde puis restauration, comparaison table par table).
3. **Domaines** : sécurité (authentification, autorisation, secrets, injections), paiements et argent (montants, idempotence, webhooks, compensation), intégrité des données et schéma, sauvegarde et reprise, tests et CI, performance, SEO et accessibilité, UX mobile, conformité (données personnelles, mentions), exploitation (journaux, crons, alertes).
4. **Preuves** : pour les défauts d'interface, preuve navigateur (Playwright, y compris mobile) ; pour les défauts de données, requête SQL et comptage.

**Fiche par anomalie** (obligatoire) : identifiant `AUD-NNN`, titre, composant et fichier:ligne, preuve reproductible, impact (qui, quoi, combien), cause racine, gravité, correctif recommandé, test de non-régression proposé, effort.

**Gravité** : P0 = perte d'argent, fuite ou prise de contrôle exploitable sans authentification, arrêt du service ; P1 = contournement d'autorisation ou d'intégrité avec authentification, donnée corrompue, sauvegarde inexploitable ; P2 = défaut fonctionnel ou robustesse ; P3 = amélioration, dette.

**Rapport** : résumé, méthode et périmètre, état de départ, liste des anomalies triées par gravité, ce qui est conforme (avec preuve), ce qui n'a pas pu être vérifié et pourquoi, actions hors code (exploitation, rotation de secrets), annexes (commandes rejouables). Fichier : `docs/AUDIT-NOPALOU-AAAA-MM-JJ.md`.

## 3. Phase de plan de correction

Livrable : `docs/PLAN-CORRECTION-NOPALOU-AAAA-MM-JJ.md`, sans modifier le code. Contenu pour chaque lot et chaque anomalie :

1. Périmètre et hypothèses, ce qui est hors périmètre.
2. **Phases** ordonnées par risque et dépendances : Phase 0 (filet : environnement, tests de référence), puis P0, P1, P2, P3, puis régression globale. Une correction qui en suppose une autre vient après elle.
3. Par anomalie : fichiers à modifier, approche retenue et alternatives écartées, **risque de régression**, compatibilité (alias à conserver, migration de données), test de validation, critère d'acceptation mesurable, procédure de retour arrière, effort.
4. Actions d'exploitation à part (rotation de secrets, variables Render, décisions métier), avec la personne qui décide.
5. Stratégie de test : unitaires (simulations), intégration contre la base locale (`DATABASE_URL_TEST`), mutation, navigateur, non-régression.
6. Indicateurs de sortie : suites vertes, zéro table/colonne manquante, matrices IDOR et RBAC conformes, sondes non authentifiées sans écart.

## 4. Phase d'exécution

- Branche dédiée, **commits locaux uniquement, jamais de `git push`** sans ordre explicite.
- Un commit par anomalie ou lot cohérent, message `fix(zone): AUD-NNN …`.
- Avant chaque commit : `tsc --noEmit` du frontend, suites backend et frontend, `npm run lint:slop`, et la preuve propre à la correction.
- Après chaque lot : entrée en tête de `docs/JOURNAL-LIVRAISONS.md` (et non dans CLAUDE.md).
- Corrections de schéma : toujours idempotentes (`IF NOT EXISTS`), validées sur base vide puis sur base existante, deuxième exécution sans erreur. Le retrait d'un DDL exécuté à la volée ne se fait qu'après validation de la migration en production.
- Ne jamais lancer un test qui dépend de l'environnement du poste : les tests suppriment ou simulent eux-mêmes les clés externes.

## 5. Entretien de l'environnement d'audit

- Conserver la base `nopalou_audit` (schéma + graines), `nopalou_audit_data` (copie de la production, données personnelles, à rafraîchir depuis une sauvegarde récente avant un audit) et les bases jetables `nopalou_fresh`, `nopalou_restore_test`.
- Après une évolution du schéma, reconstruire `nopalou_fresh` avec `freshmig.js` pour confirmer la reproductibilité.
- Redémarrer le backend d'audit entre deux gros balayages (limiteur global 1 000 requêtes/15 min/IP).
- Mettre à jour `scripts/audit/` quand une sonde est ajoutée, et ce document quand la méthode change.
