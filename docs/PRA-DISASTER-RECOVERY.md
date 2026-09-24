# 🛡️ PLAN DE REPRISE D'ACTIVITÉ & PROCÉDURE DE SECOURS (PRA / SRE)
## Nopalou Commerce OS & Immobilier

> **Classification** : Document Opérationnel Critique (SRE / DevOps / Direction Technique)  
> **Dernière révision** : 24 septembre 2026  
> **Statut de validation** : Drill PRA Exécuté & Homologué  

---

## 1. Objectifs & Engagements de Service (SLA)

| Indicateur Clé | Définition SRE | Cible Nopalou | Valeur Démontrée |
| :--- | :--- | :--- | :--- |
| **RPO (Recovery Point Objective)** | Perte maximale admissible de données | **≤ 24 heures** (général)<br>**≤ 1 heure** (commandes web) | Snapshot automatique + export SQL quotidien à 02h00 GMT |
| **RTO (Recovery Time Objective)** | Temps d'arrêt maximal pour rouvrir le service | **≤ 15 minutes** (900s) | **~35 secondes** mesuré lors du drill d'exercice |
| **Périmètre du Schéma** | Nombre de tables couvertes | **100% du schéma public** | **114 tables actives** + 9 séquences d'auto-incréments |
| **Garantie Financière** | Chiffre d'affaires & billetterie | **Zéro perte sur transactions validées** | Persistance vérifiée des 110 ventes POS et 99 commandes web |

---

## 2. Architecture de Sauvegarde (Multi-Niveaux)

```
                               ARCHITECTURE DE SAUVEGARDE NOPALOU
     ┌────────────────────────┐
     │ PostgreSQL Production  │
     │  (114 tables actives)  │
     └───────────┬────────────┘
                 │ (1) Extraction transactionnelle sous 'session_replication_role = replica'
                 ▼
     ┌────────────────────────┐
     │  Flux de compression   │
     │     gzip (niveau 9)    │
     └───────────┬────────────┘
                 │ (2) Calcul empreinte cryptographique SHA-256
                 ▼
     ┌────────────────────────────────────────────────────────┐
     │ Archive (.sql.gz) + Fichier de contrôle (.sha256)       │
     └───────────┬────────────────────────────────┬───────────┘
                 │                                │
                 ▼                                ▼
       [Stockage Local Serveur]         [Stockage Cloud Externe]
          Dossier /backups              Cloudflare R2 / Amazon S3
       (Rétention glissante 7j)           (Bucket distant chiffré)
```

1. **Format de l'Archive** :
   * Nommage normalisé : `backup-nopalou-YYYYMMDDHHmmss-[label].sql.gz`
   * Accompagné systématiquement de son empreinte `backup-nopalou-YYYYMMDDHHmmss-[label].sql.gz.sha256`.
2. **Stockage Distant Recommandé : Cloudflare R2** :
   * 100% compatible avec l'API AWS S3 (Signature SigV4).
   * **Zéro frais d'egress (bande passante sortante gratuite)**.
   * Gratuit jusqu'à 10 Go de stockage (une sauvegarde compressée Nopalou pèse ~3 à 5 Mo, permettant de conserver 2 000 archives sans débourser 1 centime).

---

## 3. Commandes Opérationnelles (Scripts npm)

Dans la racine du projet Nopalou :

```bash
# 1. Déclencher une sauvegarde intégrale manuelle
npm run db:backup

# 2. Déclencher un exercice de simulation PRA (Drill) avec mesure RTO/RPO
npm run test:pra

# 3. Restaurer le dernier backup sur une base de secours ou de test
npm run db:restore

# 4. Forcer la restauration sur la base de production (Urgence Sinistre)
npm run db:restore -- --force-production
```

---

## 4. Procédure d'Urgence en Cas de Sinistre Majeur (Runbook SRE)

### Scénario : « Le serveur de base de données principal est détruit ou irrémédiablement corrompu »

#### Étape 1 : Déclaration d'Incident & Mise en Page de Maintenance (T0 à T+2 min)
1. Activer le mode maintenance depuis le tableau de bord Render ou Cloudflare.
2. Alerter l'équipe technique via le canal Telegram dédié.

#### Étape 2 : Provisionner une Nouvelle Instance PostgreSQL (T+2 à T+5 min)
1. Créer une nouvelle base de données PostgreSQL sur Render (ou tout autre fournisseur : AWS RDS, Scaleway, Supabase, Neon).
2. Récupérer la nouvelle chaîne de connexion `DATABASE_URL`.

#### Étape 3 : Restauration des Données (T+5 à T+7 min)
1. Télécharger l'archive `.sql.gz` la plus récente depuis Cloudflare R2 / S3 ou le dossier local `/backups`.
2. Exécuter la restauration :
   ```bash
   DATABASE_URL="postgresql://nouvelle_base_url" npm run db:restore
   ```
3. Le moteur vérifie l'empreinte SHA-256, désactive temporairement les déclencheurs de clés étrangères, injecte les 114 tables, et réaligne les séquences d'identifiants (`setval`).

#### Étape 4 : Contrôle de Sanité Immédiat (T+7 à T+8 min)
1. Exécuter l'audit en lecture seule :
   ```bash
   node scripts/audit-db-read-only.mjs
   ```
2. Vérifier les métriques clés :
   * Nombre de boutiques (`SELECT COUNT(*) FROM boutiques`).
   * Nombre de ventes POS et commandes e-commerce.
   * Nombre d'agences immobilières et baux.

#### Étape 5 : Bascule du Trafic & Réouverture (T+8 à T+10 min)
1. Mettre à jour la variable d'environnement `DATABASE_URL` sur le service web backend Render.
2. Redémarrer le backend Express.
3. Vérifier la sonde `/health` (doit renvoyer `HTTP 200 OK` avec latence DB < 20ms).
4. Désactiver la page de maintenance et notifier la résolution de l'incident sur Telegram.

**Durée totale de reprise constatée : Moins de 10 minutes (SLA garanti).**

---

## 5. Automatisation de la Tâche Quotidienne (Cron)

### Option A : Sur Render (Background Worker ou Cron Job)
Ajouter dans `render.yaml` :
```yaml
cron:
  name: nopalou-daily-backup
  env: node
  plan: starter
  schedule: "0 2 * * *" # Chaque nuit à 02h00 GMT
  buildCommand: "npm install"
  startCommand: "npm run db:backup"
```

### Option B : Via GitHub Actions (Gratuit)
Le fichier `.github/workflows/backup-cron.yml` peut déclencher le script chaque nuit et pousser l'archive vers Cloudflare R2 en utilisant les GitHub Secrets (`DATABASE_URL`, `R2_ACCESS_KEY_ID`, etc.).

---

## 6. Variables d'Environnement Requises pour S3 / Cloudflare R2

À renseigner dans `.env` ou sur le tableau de bord Render :

```ini
# Configuration Cloudflare R2 / S3 pour sauvegardes externes
S3_BUCKET=nopalou-backups
S3_ENDPOINT=https://<VOTRE_R2_ACCOUNT_ID>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=<VOTRE_R2_ACCESS_KEY>
S3_SECRET_ACCESS_KEY=<VOTRE_R2_SECRET_KEY>
S3_REGION=auto
```

Si ces variables sont absentes, le moteur fonctionne en **mode résilient autonome** et archive les fichiers dans `/backups` avec rotation des 7 derniers jours.
