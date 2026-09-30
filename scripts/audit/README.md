# Kit d'audit isolé NOPALOU

Méthode : `docs/METHODOLOGIE-AUDIT.md`. Ce kit ne touche jamais la production : base PostgreSQL locale (port 54329), clés externes factices, garde réseau en liste blanche (seule la boucle locale est résolue).

## Installation (une fois par poste)

1. PostgreSQL 16 local : service `postgresql-x64-16`, port 54329, utilisateur `postgres`.
2. Créer `scripts/audit/.local/pgpass.txt` contenant uniquement le mot de passe local (le dossier `.local/` est ignoré par git : ne jamais le committer).
3. Créer les bases : `nopalou_audit` (schéma : `node scripts/audit/freshmig.js 1` construit `nopalou_fresh` ; pour `nopalou_audit`, appliquer la même séquence), puis, si besoin de données réelles, `nopalou_audit_data` restaurée depuis une sauvegarde (contient des données personnelles).

## Mot de passe perdu ou `pgpass.txt` absent

`.local/` n'est ni versionné ni sauvegardé : s'il disparaît, le kit refuse de démarrer (`check-pg.ps1` le signale). Réinitialisation, sans perte de données, pour cette instance locale uniquement (le rôle `postgres` du port 54329) :

1. Sauvegarder `C:\Program Files\PostgreSQL\16\data\pg_hba.conf`, puis passer la ligne `host all all 127.0.0.1/32` de `scram-sha-256` à `trust` et recharger la configuration (`pg_ctl reload`, ou `Restart-Service postgresql-x64-16` en administrateur).
2. `psql -h 127.0.0.1 -p 54329 -U postgres -c "ALTER USER postgres PASSWORD '<aléatoire>'"` et écrire ce mot de passe seul sur une ligne dans `scripts/audit/.local/pgpass.txt`.
3. Restaurer `pg_hba.conf` **immédiatement** et vérifier que `psql -w` sans mot de passe est de nouveau refusé (`fe_sendauth: no password supplied`). Ne jamais laisser `trust` en place.
4. `powershell -File scripts\audit\check-pg.ps1` doit afficher `OK`.

## Utilisation

| Commande | Rôle |
|---|---|
| `powershell -File scripts\audit\check-pg.ps1` | vérifie service, port, mot de passe et bases avant tout audit |
| `. scripts\audit\audit-env.ps1` | charge l'environnement isolé dans le shell courant (à faire avant toute commande node) |
| `powershell -File scripts\audit\start-stack.ps1 [-Frontend] [-Db nopalou_audit_data]` / `stop-stack.ps1` | démarre / arrête backend :4100 et frontend :3001 |
| `node scripts/audit/enum-routes.js <sortie.json>` | inventaire de toutes les routes et middlewares |
| `node scripts/audit/probe.js <routes.json> <sortie.json>` | sonde non authentifiée |
| `node scripts/audit/seed.js <seed.json>` | crée marchands A/B et acheteur C |
| `node scripts/audit/idor.js <routes.json> <seed.json> <A\|C> <sortie.json>` | sonde IDOR multi-tenant |
| `node scripts/audit/verify-rbac.js` | matrice rôle × route |
| `MIGRATE_STRICT=true node scripts/audit/freshmig.js <passes> nobase` | base vide + migrations, compte des erreurs |
| `node scripts/audit/schemadiff.js <base> <backup.sql.gz>` | tables et colonnes de la production absentes de la base |
| `node scripts/audit/roundtrip.js` | sauvegarde puis restauration, comparaison table par table |
| `node scripts/audit/commerce/01-setup.js` puis `02` à `06` | sondes du parcours commercial (voir `scripts/audit/commerce/README.md`) |

Les sorties volumineuses vont dans le dossier temporaire de session, pas dans le dépôt.
