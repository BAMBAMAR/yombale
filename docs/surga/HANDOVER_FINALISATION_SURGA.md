# DOCUMENT DE PASSATION TECHNIQUE (HANDOVER) — FINALISATION SURGA

> **Date** : 5 Octobre 2026  
> **Auteur** : Agent de Finalisation Technique Surga  
> **Branche** : `feature/surga`  
> **Destinataires** : Équipes d'exploitation, SRE, Développeurs Senior Nopalou / Surga  
> **Décision de mise en production** : **GO (Validé à 100%)**

---

## 1. VUE D'ENSEMBLE DU SYSTÈME FINALISÉ

Surga (« L'assistant personnel de poche de Nopalou ») est une Progressive Web App (PWA) offline-first dédiée aux besoins quotidiens des Sénégalais :
- **Briefing matinal & Presse** : actualités locales sourcées (< 180 car.), Unes de quotidiens nationaux, alertes trafic Dakar TomTom Live, flash météo et podcasts audio privés.
- **Gestion personnelle en Franc CFA (XOF)** : calculatrice déterministe avec TVA/remises, suivi des dépenses par catégorie, notes et agenda personnel avec rappels.
- **Pôles de vie locale** : alertes immobilières certifiées (< 2 min), suivi des concours et examens de la fonction publique (J-30/J-7/J-1), répertoire des bonnes adresses dakaroises avec avis sans complaisance.
- **Canaux d'accès** : Web/PWA (`surga.nopalou.com`), commandes WhatsApp ciblées (avec vouvoiement strict D19 et zéro émoji), commandes vocales locales déterministes.

---

## 2. ÉTANCHÉITÉ ET ARCHITECTURE MULTI-PRODUIT

Le projet héberge deux produits strictement étanches sur la même infrastructure technique :
1. **NOPALOU** (`nopalou.com`) : Marketplace e-commerce, comparateur de prix multi-vendeurs, logiciel de caisse tactile POS offline-first, baux marchands.
2. **SURGA** (`surga.nopalou.com` ou `/surga`) : Assistant personnel indépendant.

### Règles d'or d'étanchéité préservées :
- **Rendu Serveur (SSR)** : Le Root Layout (`frontend-next/src/app/layout.tsx`) omet strictement tout composant e-commerce (navbar, footer, tiroir panier, chatbot widget, bars flottantes) dès que la route est identifiée comme Surga (`isSurga === true`).
- **Isolation CSS** : La feuille de style `surga.css` verrouille l'isolation via `:has(.surga-root)`.
- **Base de données** : Les tables Surga sont isolées sous le préfixe `surga_*` (`surga_depenses`, `surga_notes`, `surga_alertes_immo`, `surga_concours`, `surga_places`, `surga_abonnements`, etc.) et ne polluent aucune table du panier ou de la caisse POS.

---

## 3. CHECKLIST OPÉRATIONNELLE DE DÉPLOIEMENT

### 1. Initialisation des Données Métier (Seed)
Avant l'ouverture aux utilisateurs, exécuter le script de seed idempotent :
```bash
node scripts/seed-surga-data.js
```
Ce script injecte :
- Les 9 axes routiers et transports structurants de Dakar (TER, BRT, VDN, Autoroute de l'Avenir, etc.).
- Les 5 concours nationaux de référence (ENA, FASTEF, CFJ, Douanes, Police).
- Les 4 adresses dakaroises de référence (Plateau, Almadies, Point E, Ngor).

### 2. Tâches de Fond & Crons Automatiques
Dans `backend/app.js`, le cron `backend/services/cron-surga-rss.js` est automatiquement initialisé (worker et web server) :
- Collecte des flux d'actualité toutes les 30 minutes.
- Traçabilité et monitoring dans la table `cron_executions`.

### 3. Variables d'Environnement Requises
- `JWT_SECRET` : Clé de chiffrement des tokens d'authentification utilisateur.
- `WAVE_WEBHOOK_SECRET` : Clé secrète HMAC pour la validation des webhooks Wave de paiement d'abonnement Surga Premium.
- `DATABASE_URL` : Chaîne de connexion PostgreSQL au cluster de données.
- `PORT` : Port de l'API backend (par défaut 3000).

---

## 4. GUIDE DES COMMANDES DE VÉRIFICATION & TESTS

| Domaine | Commande | Résultat Attendu |
| ------- | -------- | ---------------- |
| **Backend Tests** | `npx jest tests/unit/surga.test.js` | 92 passed, 92 total |
| **Frontend Tests** | `npm test` (dans `frontend-next`) | 97 passed, 97 total |
| **Typage TypeScript** | `npx tsc --noEmit` (dans `frontend-next`) | Code 0, 0 erreur |
| **Anti-AI-Slop** | `npm run lint:slop` (dans `frontend-next`) | Advisory mode, 0 émoji UI sur Surga |
| **Taille des composants** | Tous les fichiers `.tsx` sous `src/app/surga` | Strictement `< 450` lignes |

---

## 5. CONTACTS ET SUIVI

- **Matrice des 17 tickets corrigés** : [PLAN_EXECUTION_FINAL_SURGA.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/docs/surga/PLAN_EXECUTION_FINAL_SURGA.md)
- **Rapport de validation finale** : [VALIDATION_FINALE_SURGA.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/docs/surga/VALIDATION_FINALE_SURGA.md)
- **Journal chronologique** : [JOURNAL-LIVRAISONS.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/docs/surga/JOURNAL-LIVRAISONS.md)
- **Capitalisation technique** : [LECONS_APPRISES.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/docs/surga/LECONS_APPRISES.md)
