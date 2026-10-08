# Poste de développement : séparer sa configuration de la production

Fiche `SRG-A5-011` de la campagne d'audit de Surga. Décision de l'utilisateur du 2026-10-08.

## Le problème

Le fichier `.env` à la racine du dépôt contient la configuration de production. Tout ce qui est lancé depuis ce
dossier agit donc sur la vraie base :

- les deux tâches planifiées Windows de collecte (`Nopalou_Scraper_Combo`, `Nopalou_Scraper_Facebook`) : c'est voulu,
  la collecte Facebook a besoin de la session ouverte sur ce poste ;
- un backend lancé pour développer : il démarre aussi toutes les tâches planifiées de production, en double de
  l'hébergeur. C'est arrivé les nuits des 5, 6 et 7 octobre 2026 (constaté pour la sauvegarde) ;
- un essai lancé hors de l'environnement d'audit : il écrit en production.

## Ce qui change

| Fichier | Contenu | Lu par |
|---|---|---|
| `.env.collecte` | La configuration de production, telle qu'elle était dans `.env` | Les seules tâches de collecte |
| `.env` | Une configuration locale : base du poste, services externes factices, collecte coupée | Tout le reste |
| `.env.avant-separation` | L'ancien `.env`, gardé pour revenir en arrière | Personne |

Les trois fichiers sont ignorés par git. Les scripts de collecte (`scripts/sync-immo-local.js`,
`scripts/collecte-omnisource.js`) passent par `scripts/lib/charger-env.js` : ils lisent `.env.collecte` s'il existe,
sinon `.env`. Tant que la séparation n'est pas faite, rien ne change.

`.env.collecte` est une copie entière de l'ancien `.env`, et non une liste réduite : les scripts de collecte chargent
certains modules au fil de l'exécution, et la liste exacte des variables qu'ils lisent ne peut pas être établie
sûrement par lecture du code.

## Faire la séparation

Le PostgreSQL local du poste (port 54329) doit tourner.

1. Voir ce qui sera fait, sans rien modifier :
   `powershell -NoProfile -File scripts\poste\separer-configuration.ps1`
2. Appliquer, en créant la base locale `nopalou_dev` si elle manque :
   `powershell -NoProfile -File scripts\poste\separer-configuration.ps1 -Appliquer -CreerBase`
3. Vérifier, à la prochaine exécution d'une tâche de collecte, que `logs\scraper-task.log` contient
   « Configuration lue : .env.collecte ».
4. Vérifier qu'un backend lancé depuis ce dossier se connecte à la base locale.

Revenir en arrière : `powershell -NoProfile -File scripts\poste\separer-configuration.ps1 -Annuler`.

Le script n'affiche aucune valeur. Il refuse une base locale qui ne serait pas sur ce poste.

## Après la séparation

- `nopalou_dev` est une copie de `nopalou_audit_data` (copie locale de la production) quand celle-ci existe : elle
  contient des données personnelles et ne sort pas du poste.
- Dans le nouveau `.env`, les clés des services réels (WhatsApp, Wave, Cloudinary, Telegram, Resend, Facebook,
  stockage des sauvegardes) valent `factice-poste-local`. Pour essayer un service réel sur le poste, remettre sa clé
  à la main, le temps de l'essai.
- `JWT_SECRET` et les autres secrets internes ne sont pas changés par le script : un jeton émis sur le poste reste
  valable en production. Les remplacer par des valeurs locales demande de changer aussi `SESSION_SECRET` dans
  `frontend-next/.env.local`.
- Les audits gardent leur propre environnement (`scripts/audit/audit-env.ps1`) : il ne dépend pas de `.env`.

## Limites

- Essayé sur un dossier factice et sur une base jetable. La séparation n'a pas été appliquée au poste réel : c'est
  l'utilisateur qui la lance.
- Les tâches planifiées continuent d'écrire en production : c'est leur rôle. Une erreur dans un script de collecte
  écrit toujours dans la vraie base.
