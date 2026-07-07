# Fiabilisation du catalogue Meta/WhatsApp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre la synchronisation du catalogue boutique vers Meta Commerce (WhatsApp) fiable, complète, et visible — pour le vendeur (badge de statut, filtres) comme pour l'acheteur (nom de la boutique visible dans les résultats).

**Architecture:** Le code de synchro existe déjà (`backend/services/whatsapp-catalog.js`, appelé automatiquement depuis `backend/routes/boutiques.js` à la création/modification/suppression d'un produit boutique). Ce plan : (1) enrichit le payload Meta avec des champs déjà en base mais jamais transmis, (2) ajoute deux colonnes de suivi de statut sur `boutique_produits` mises à jour à chaque tentative de synchro, (3) affiche ce statut et des filtres dans le dashboard boutique existant (`BoutiqueClient.tsx`), (4) fait apparaître le nom de la boutique dans les messages WhatsApp montrant un produit (fiche directe et recherche chatbot).

**Tech Stack:** Node.js/Express (backend), PostgreSQL (`pg`), Next.js 14 / React (frontend), axios pour les appels Graph API Meta, Jest pour les tests backend.

## Global Constraints

- Ne pas construire de connexion de compte Meta personnel par boutique — catalogue partagé uniquement (voir spec `docs/superpowers/specs/2026-07-07-catalogue-meta-fiabilisation-design.md`).
- Toute nouvelle colonne DB suit le pattern `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` déjà utilisé dans `backend/migrate-inline.js`, dans un bloc `try/catch` avec `console.warn` en cas d'échec (jamais bloquant au démarrage).
- Les échecs de synchro Meta ne doivent jamais faire échouer la réponse HTTP au vendeur (pattern `setImmediate` + `.catch(() => {})` déjà en place à conserver).
- Aucune connexion de compte Meta personnel, aucune taxonomie Google Product Category complète, aucun aperçu visuel simulé de la fiche WhatsApp — hors périmètre.
- L'étape 0 (configuration Meta externe : créer/lier le catalogue, poser `WHATSAPP_CATALOG_ID` sur Render) est effectuée par l'utilisateur en dehors de ce plan — les tâches ci-dessous fonctionnent et se testent indépendamment de cette étape (mode dégradé : `guard()` renvoie `false`, le badge affiche "✗ Échec").

---

### Task 1: Colonnes de suivi de statut de synchro sur `boutique_produits`

**Files:**
- Modify: `backend/migrate-inline.js:677` (juste avant `try { await pool.end(); } catch (_) {}`)

**Interfaces:**
- Produces: colonnes `boutique_produits.whatsapp_sync_statut` (`VARCHAR(20)`, défaut `'en_attente'`) et `boutique_produits.whatsapp_sync_erreur` (`TEXT`, nullable) — consommées par les Tasks 2, 3, 4.

- [ ] **Step 1: Ajouter le bloc de migration**

Dans `backend/migrate-inline.js`, juste avant la ligne finale `try { await pool.end(); } catch (_) {}` (ligne 677), ajouter :

```js
  // Statut de synchro catalogue Meta Commerce — visible au vendeur dans le dashboard
  const colonnesSyncCatalogue = [
    `ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS whatsapp_sync_statut VARCHAR(20) DEFAULT 'en_attente'`,
    `ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS whatsapp_sync_erreur TEXT`,
  ];
  for (const sql of colonnesSyncCatalogue) {
    try { await pool.query(sql); }
    catch (e) { console.warn('[MIGRATE] sync_catalogue:', e.message); }
  }
```

- [ ] **Step 2: Démarrer le backend pour appliquer la migration**

Run: `cd backend && npm run dev`
Expected: dans les logs de démarrage, aucune ligne `[MIGRATE] sync_catalogue: ...` (ce qui indiquerait un échec) — la migration se fait silencieusement en succès, comme les autres blocs `colonnesXxx` du fichier. Arrêter le serveur après vérification (Ctrl+C).

- [ ] **Step 3: Confirmer les colonnes en base**

Avec un client connecté à la base locale (`psql` ou équivalent), exécuter :
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'boutique_produits' AND column_name LIKE 'whatsapp_sync%';
```
Expected: deux lignes — `whatsapp_sync_statut` (`character varying`, défaut `'en_attente'::character varying`) et `whatsapp_sync_erreur` (`text`, pas de défaut).

- [ ] **Step 4: Commit**

```bash
git add backend/migrate-inline.js
git commit -m "feat(boutique): ajoute les colonnes de statut de synchro catalogue Meta"
```

---

### Task 2: Compléter le payload envoyé à Meta et enregistrer le statut de synchro

**Files:**
- Modify: `backend/services/whatsapp-catalog.js` (réécriture complète, 67 lignes actuelles)
- Create: `backend/services/__tests__/whatsapp-catalog.test.js`

**Interfaces:**
- Consumes: colonnes `whatsapp_sync_statut`/`whatsapp_sync_erreur` de Task 1 ; `pool` depuis `../models/db`.
- Produces: `syncProduit(produit)` et `deleteProduit(produitId, whatsappCatalogId)` — signatures externes inchangées (mêmes paramètres, toujours appelées depuis `boutiques.js` sans modification d'appel). Nouvel export `mapEtatToCondition(etat: string | undefined): 'new' | 'used' | 'refurbished'`, consommé par aucune autre tâche mais testé directement.

Ce dossier n'a pas de test existant identifié — c'est le premier test de `backend/services/`. Si `jest` n'est pas déjà une dépendance de dev à la racine de `backend/` (vérifier `backend/package.json`), l'ajouter d'abord avec `cd backend && npm install --save-dev jest`.

- [ ] **Step 1: Vérifier la présence de Jest**

Run: `cd backend && npx jest --version`
Expected: affiche un numéro de version. Si la commande échoue avec "command not found" ou équivalent, lancer `cd backend && npm install --save-dev jest` puis relancer la vérification.

- [ ] **Step 2: Écrire le test qui échoue — mapping état → condition Meta**

Créer `backend/services/__tests__/whatsapp-catalog.test.js` :

```js
jest.mock('axios');
jest.mock('../../models/db', () => ({ pool: { query: jest.fn().mockResolvedValue({ rows: [] }) } }));

const axios = require('axios');
const { pool } = require('../../models/db');

describe('mapEtatToCondition', () => {
  const { mapEtatToCondition } = require('../whatsapp-catalog');

  it('mappe les 4 valeurs Nopalou vers les valeurs Meta attendues', () => {
    expect(mapEtatToCondition('Neuf')).toBe('new');
    expect(mapEtatToCondition('Bon état')).toBe('used');
    expect(mapEtatToCondition('Occasion')).toBe('used');
    expect(mapEtatToCondition('Pour pièces')).toBe('refurbished');
  });

  it('retombe sur "used" si la valeur est absente ou inconnue', () => {
    expect(mapEtatToCondition(undefined)).toBe('used');
    expect(mapEtatToCondition('valeur-inconnue')).toBe('used');
  });
});
```

- [ ] **Step 3: Lancer le test pour vérifier qu'il échoue**

Run: `cd backend && npx jest services/__tests__/whatsapp-catalog.test.js`
Expected: FAIL — `mapEtatToCondition is not a function` (la fonction n'existe pas encore ; `whatsapp-catalog.js` n'exporte pour l'instant que `syncProduit`/`deleteProduit`).

- [ ] **Step 4: Réécrire `backend/services/whatsapp-catalog.js` en entier**

```js
// backend/services/whatsapp-catalog.js — Sync vers Meta Commerce Catalog
const axios = require('axios');
const { pool } = require('../models/db');

const TOKEN            = process.env.WHATSAPP_API_TOKEN;
const CATALOG_ID_GLOBAL = process.env.WHATSAPP_CATALOG_ID;
const SITE             = process.env.FRONTEND_URL || 'https://nopalou.com';

function resolveCatalog(produit) {
  // Priorité : catalog_id propre à la boutique, sinon catalog global Nopalou
  return produit.whatsapp_catalog_id || CATALOG_ID_GLOBAL;
}

function guard(catalogId) {
  if (!TOKEN || !catalogId) {
    console.log('[CATALOG] Credentials manquants — sync ignorée');
    return false;
  }
  return true;
}

// Mappe la valeur "état" du formulaire Nopalou vers la valeur "condition" attendue par Meta.
// Valeurs Nopalou possibles (CaracteristiquesFields, BoutiqueClient.tsx) : Neuf / Bon état / Occasion / Pour pièces.
function mapEtatToCondition(etat) {
  if (etat === 'Neuf') return 'new';
  if (etat === 'Pour pièces') return 'refurbished';
  return 'used'; // "Bon état", "Occasion", ou valeur absente/inconnue
}

async function marquerStatutSync(produitId, statut, erreur = null) {
  try {
    await pool.query(
      'UPDATE boutique_produits SET whatsapp_sync_statut=$1, whatsapp_sync_erreur=$2 WHERE id=$3',
      [statut, erreur, produitId]
    );
  } catch (e) {
    console.error('[CATALOG] Impossible d’enregistrer le statut de sync:', e.message);
  }
}

// Crée ou met à jour un produit dans le catalogue Meta Commerce
async function syncProduit(produit) {
  const catalogId = resolveCatalog(produit);
  if (!guard(catalogId)) {
    await marquerStatutSync(produit.id, 'echec', 'WHATSAPP_CATALOG_ID non configuré');
    return;
  }
  const retailerId = `nopalou-produit-${produit.id}`;
  const caracteristiques = produit.caracteristiques || {};
  const payload = {
    retailer_id:  retailerId,
    name:         produit.nom,
    description:  produit.description || produit.nom,
    price:        Math.round((produit.prix || 0) * 100), // en centimes
    currency:     'XOF',
    availability: produit.en_stock !== false ? 'in stock' : 'out of stock',
    url:          `${SITE}/boutiques/${produit.boutique_slug}/produits/${produit.id}`,
    image_url:    produit.images?.[0] || '',
    condition:    mapEtatToCondition(caracteristiques.etat),
  };
  if (caracteristiques.marque) payload.brand = caracteristiques.marque;
  if (produit.categorie) payload.category = produit.categorie;
  if (produit.prix_barre && produit.prix_barre > (produit.prix || 0)) {
    payload.sale_price = Math.round(produit.prix * 100);
    payload.sale_price_effective_date = `${new Date().toISOString().slice(0, 10)}/2099-12-31`;
    payload.price = Math.round(produit.prix_barre * 100); // prix "normal" affiché barré côté Meta
  }

  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${catalogId}/products`,
      payload,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    console.log(`[CATALOG] Sync produit ${retailerId} ✓`);
    await marquerStatutSync(produit.id, 'synchronise', null);
  } catch (err) {
    const message = err.response?.data?.error?.message || err.message;
    console.error('[CATALOG] Erreur sync:', message);
    await marquerStatutSync(produit.id, 'echec', message);
  }
}

// Retire un produit du catalogue Meta Commerce
async function deleteProduit(produitId, whatsappCatalogId = null) {
  const catalogId = whatsappCatalogId || CATALOG_ID_GLOBAL;
  if (!guard(catalogId)) return;
  const retailerId = `nopalou-produit-${produitId}`;
  try {
    await axios.delete(
      `https://graph.facebook.com/v18.0/${catalogId}/products`,
      {
        headers: { Authorization: `Bearer ${TOKEN}` },
        data: { retailer_id: retailerId },
      }
    );
    console.log(`[CATALOG] Suppression ${retailerId} ✓`);
  } catch (err) {
    console.error('[CATALOG] Erreur suppression:', err.response?.data?.error?.message || err.message);
  }
}

module.exports = { syncProduit, deleteProduit, mapEtatToCondition };
```

- [ ] **Step 5: Lancer le test pour vérifier qu'il passe**

Run: `cd backend && npx jest services/__tests__/whatsapp-catalog.test.js`
Expected: PASS — les deux tests de `mapEtatToCondition` réussissent.

- [ ] **Step 6: Ajouter les tests de `syncProduit` (statut échec et statut succès avec champs enrichis)**

Ajouter au même fichier de test, après le `describe('mapEtatToCondition', ...)` existant :

```js
describe('syncProduit', () => {
  const { syncProduit } = require('../whatsapp-catalog');

  beforeEach(() => {
    pool.query.mockClear();
    axios.post.mockClear();
  });

  it('enregistre le statut "echec" si le catalog_id est absent', async () => {
    const produit = { id: 'p1', nom: 'Test', prix: 1000, caracteristiques: {} };
    await syncProduit(produit);
    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE boutique_produits SET whatsapp_sync_statut=$1, whatsapp_sync_erreur=$2 WHERE id=$3',
      ['echec', 'WHATSAPP_CATALOG_ID non configuré', 'p1']
    );
  });

  it('enregistre le statut "synchronise" et envoie brand/condition/category/sale_price quand la sync Meta réussit', async () => {
    process.env.WHATSAPP_API_TOKEN = 'test-token';
    process.env.WHATSAPP_CATALOG_ID = 'cat123';
    axios.post.mockResolvedValue({ data: {} });

    const produit = {
      id: 'p2', nom: 'iPhone 13', prix: 250000, prix_barre: 300000,
      categorie: 'smartphones', images: ['https://x/img.jpg'], en_stock: true,
      caracteristiques: { marque: 'Apple', etat: 'Neuf' },
    };
    await syncProduit(produit);

    expect(axios.post).toHaveBeenCalledWith(
      'https://graph.facebook.com/v18.0/cat123/products',
      expect.objectContaining({
        brand: 'Apple',
        condition: 'new',
        category: 'smartphones',
        sale_price: 25000000,
      }),
      expect.anything()
    );
    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE boutique_produits SET whatsapp_sync_statut=$1, whatsapp_sync_erreur=$2 WHERE id=$3',
      ['synchronise', null, 'p2']
    );

    delete process.env.WHATSAPP_API_TOKEN;
    delete process.env.WHATSAPP_CATALOG_ID;
  });
});
```

- [ ] **Step 7: Lancer tous les tests du fichier pour vérifier qu'ils passent**

Run: `cd backend && npx jest services/__tests__/whatsapp-catalog.test.js`
Expected: PASS — 4 tests au total, tous verts.

- [ ] **Step 8: Commit**

```bash
git add backend/services/whatsapp-catalog.js backend/services/__tests__/whatsapp-catalog.test.js
git commit -m "feat(boutique): enrichit le payload catalogue Meta et trace le statut de synchro"
```

---

### Task 3: Exposer le statut de synchro sur l'API catalogue boutique

**Files:**
- Modify: `backend/routes/boutiques.js:213`

**Interfaces:**
- Consumes: colonnes de Task 1.
- Produces: le champ JSON `whatsapp_sync_statut` et `whatsapp_sync_erreur` apparaissent désormais dans la réponse de `GET /api/boutiques/:id/produits` — consommé par Task 4 (frontend).

- [ ] **Step 1: Modifier le SELECT de la route catalogue**

Dans `backend/routes/boutiques.js`, ligne 213, remplacer :

```js
      `SELECT p.id, p.nom, p.description, p.prix, p.prix_barre, p.images, p.en_stock, p.ordre, p.categorie, p.caracteristiques, p.stock_quantite
```

par :

```js
      `SELECT p.id, p.nom, p.description, p.prix, p.prix_barre, p.images, p.en_stock, p.ordre, p.categorie, p.caracteristiques, p.stock_quantite,
              p.whatsapp_sync_statut, p.whatsapp_sync_erreur
```

- [ ] **Step 2: Vérifier manuellement la réponse de l'API**

Cette route est publique (pas d'auth requise). Démarrer le backend (`cd backend && npm run dev`), puis avec l'`id` d'une boutique existante en base locale :

Run: `curl.exe http://localhost:3000/api/boutiques/<id-boutique>/produits`
Expected: chaque objet dans `produits` contient désormais les clés `whatsapp_sync_statut` (`"en_attente"` par défaut pour un produit non modifié depuis la migration) et `whatsapp_sync_erreur` (`null` par défaut).

- [ ] **Step 3: Commit**

```bash
git add backend/routes/boutiques.js
git commit -m "feat(boutique): expose le statut de synchro catalogue sur GET /produits"
```

---

### Task 4: Badge de statut + recherche/filtres dans le dashboard boutique

**Files:**
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx:50-60` (interface `Produit`)
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx:541-704` (`CatalogueProduits`)

**Interfaces:**
- Consumes: `whatsapp_sync_statut`/`whatsapp_sync_erreur` de Task 3, sur le même objet `Produit` retourné par `GET /api/boutiques/:id/produits`.
- Produces: rien de consommé par une tâche suivante.

- [ ] **Step 1: Étendre le type `Produit`**

Dans `frontend-next/src/app/boutique/BoutiqueClient.tsx`, ligne 50-60, remplacer :

```tsx
interface Produit {
  id: string
  nom: string
  description: string | null
  prix: number | null
  prix_barre: number | null
  images: string[]
  en_stock: boolean
  categorie: string | null
  caracteristiques: Record<string, string> | null
}
```

par :

```tsx
interface Produit {
  id: string
  nom: string
  description: string | null
  prix: number | null
  prix_barre: number | null
  images: string[]
  en_stock: boolean
  categorie: string | null
  caracteristiques: Record<string, string> | null
  whatsapp_sync_statut: 'synchronise' | 'en_attente' | 'echec' | null
  whatsapp_sync_erreur: string | null
}
```

- [ ] **Step 2: Ajouter l'état de recherche/filtre dans `CatalogueProduits`**

Ligne 541-547, remplacer :

```tsx
function CatalogueProduits({ boutique, planActif, prixPro }: { boutique: Boutique; planActif: 'pro' | 'business' | null; prixPro: number }) {
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'list' | 'create' | { editing: Produit }>('list')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [, startTransition] = useTransition()
```

par :

```tsx
function CatalogueProduits({ boutique, planActif, prixPro }: { boutique: Boutique; planActif: 'pro' | 'business' | null; prixPro: number }) {
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'list' | 'create' | { editing: Produit }>('list')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [rechercheTexte, setRechercheTexte] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'synchronise' | 'en_attente' | 'echec'>('tous')
  const [filtreCategorie, setFiltreCategorie] = useState<string>('toutes')
  const [, startTransition] = useTransition()
```

- [ ] **Step 3: Calculer la liste filtrée et les catégories disponibles**

Juste après la ligne `const quota = planActif === 'business' ? '∞' : '50'` (ligne 584), ajouter :

```tsx
  const categoriesDisponibles = Array.from(new Set(produits.map(p => p.categorie).filter(Boolean))) as string[]

  const produitsFiltres = produits.filter(p => {
    if (rechercheTexte.trim() && !p.nom.toLowerCase().includes(rechercheTexte.trim().toLowerCase())) return false
    if (filtreStatut !== 'tous' && (p.whatsapp_sync_statut || 'en_attente') !== filtreStatut) return false
    if (filtreCategorie !== 'toutes' && p.categorie !== filtreCategorie) return false
    return true
  })
```

- [ ] **Step 4: Ajouter les contrôles de recherche/filtre au-dessus de la liste**

Juste après la fermeture du bloc d'en-tête (le `</div>` qui suit le bouton "+ Ajouter un produit", ligne 619), avant `{successMsg && (` (ligne 621), insérer :

```tsx
      {produits.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <input
            type="text"
            placeholder="Rechercher un produit…"
            value={rechercheTexte}
            onChange={e => setRechercheTexte(e.target.value)}
            style={{ flex: '1 1 180px', padding: '7px 10px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8 }}
          />
          <select
            value={filtreStatut}
            onChange={e => setFiltreStatut(e.target.value as typeof filtreStatut)}
            style={{ padding: '7px 10px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8 }}
          >
            <option value="tous">Tous les statuts</option>
            <option value="synchronise">✓ Sur WhatsApp</option>
            <option value="en_attente">⏳ En attente</option>
            <option value="echec">✗ Échec</option>
          </select>
          {categoriesDisponibles.length > 1 && (
            <select
              value={filtreCategorie}
              onChange={e => setFiltreCategorie(e.target.value)}
              style={{ padding: '7px 10px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8 }}
            >
              <option value="toutes">Toutes les catégories</option>
              {categoriesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      )}
```

- [ ] **Step 5: Itérer sur la liste filtrée et afficher le badge de statut**

Ligne 646, remplacer `{produits.map(p => (` par `{produitsFiltres.map(p => (`.

Puis, dans le bloc "Infos" (lignes 660-674), remplacer :

```tsx
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{p.nom}</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                  {p.prix && <span style={{ fontSize: 13, color: '#C75B00', fontWeight: 700 }}>{fcfa(p.prix)}</span>}
                  {p.prix_barre && <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>{fcfa(p.prix_barre)}</span>}
                  <span style={{
                    fontSize: 11, padding: '1px 6px', borderRadius: 20,
                    background: p.en_stock ? '#dcfce7' : '#fee2e2',
                    color: p.en_stock ? '#16a34a' : '#dc2626', fontWeight: 700,
                  }}>
                    {p.en_stock ? 'En stock' : 'Rupture'}
                  </span>
                </div>
              </div>
```

par :

```tsx
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{p.nom}</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
                  {p.prix && <span style={{ fontSize: 13, color: '#C75B00', fontWeight: 700 }}>{fcfa(p.prix)}</span>}
                  {p.prix_barre && <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>{fcfa(p.prix_barre)}</span>}
                  <span style={{
                    fontSize: 11, padding: '1px 6px', borderRadius: 20,
                    background: p.en_stock ? '#dcfce7' : '#fee2e2',
                    color: p.en_stock ? '#16a34a' : '#dc2626', fontWeight: 700,
                  }}>
                    {p.en_stock ? 'En stock' : 'Rupture'}
                  </span>
                  <span
                    title={p.whatsapp_sync_statut === 'echec' ? (p.whatsapp_sync_erreur || 'Échec de synchronisation') : undefined}
                    style={{
                      fontSize: 11, padding: '1px 6px', borderRadius: 20, fontWeight: 700,
                      background: p.whatsapp_sync_statut === 'synchronise' ? '#dcfce7' : p.whatsapp_sync_statut === 'echec' ? '#fee2e2' : '#f1f5f9',
                      color: p.whatsapp_sync_statut === 'synchronise' ? '#16a34a' : p.whatsapp_sync_statut === 'echec' ? '#dc2626' : '#64748b',
                    }}
                  >
                    {p.whatsapp_sync_statut === 'synchronise' ? '✓ Sur WhatsApp' : p.whatsapp_sync_statut === 'echec' ? '✗ Échec' : '⏳ En attente'}
                  </span>
                </div>
              </div>
```

- [ ] **Step 6: Vérifier visuellement dans le navigateur**

Run: `cd frontend-next && npm run dev`

Se connecter avec un compte boutique existant ayant un plan Pro/Business actif et au moins 2-3 produits, aller sur `/boutique` → gérer une boutique → onglet Catalogue.

Expected: chaque produit affiche un badge de statut supplémentaire (⏳ En attente si jamais modifié depuis la migration, car le défaut DB est `'en_attente'`) ; taper dans le champ recherche filtre la liste en direct ; changer le filtre de statut/catégorie filtre la liste en conséquence.

- [ ] **Step 7: Commit**

```bash
git add frontend-next/src/app/boutique/BoutiqueClient.tsx
git commit -m "feat(boutique): badge de statut catalogue + recherche/filtres dans le dashboard vendeur"
```

---

### Task 5: Nom de la boutique visible dans les messages WhatsApp produit (fiche directe + recherche chatbot)

**Files:**
- Modify: `backend/services/whatsapp.js:232-244` (fonction `sendFiche`, branche `type === 'produit'`)
- Modify: `backend/services/whatsapp-chatbot.js:139-181` (`searchContent`)
- Modify: `backend/services/whatsapp-chatbot.js:379-392` (boucle d'envoi dans `handleSearchQuery`)
- Create: `backend/services/__tests__/whatsapp-chatbot-search.test.js`

**Interfaces:**
- Consumes: rien de nouveau côté DB — `boutiques.nom` existe déjà et `boutique_slug` est déjà joint dans les deux requêtes concernées ; il suffit d'ajouter la colonne à la sélection.
- Produces: rien de consommé par une tâche suivante — dernière tâche du plan.

- [ ] **Step 1: Ajouter `boutique_nom` à la requête de `sendFiche('produit', ...)`**

Dans `backend/services/whatsapp.js`, ligne 233-243, remplacer :

```js
    const r = await pool.query(
      'SELECT p.*, b.slug AS boutique_slug FROM boutique_produits p JOIN boutiques b ON b.id=p.boutique_id WHERE p.id=$1',
      [id]
    );
    const p = r.rows[0];
    if (!p) throw new Error('Produit introuvable');
    return sendWhatsAppProduct(
      phone,
      `nopalou-produit-${p.id}`,
      `${p.nom} — ${prixFmt(p.prix)}\n\n👉 ${SITE}/boutiques/${p.boutique_slug}/produits/${p.id}`
    );
```

par :

```js
    const r = await pool.query(
      'SELECT p.*, b.slug AS boutique_slug, b.nom AS boutique_nom FROM boutique_produits p JOIN boutiques b ON b.id=p.boutique_id WHERE p.id=$1',
      [id]
    );
    const p = r.rows[0];
    if (!p) throw new Error('Produit introuvable');
    return sendWhatsAppProduct(
      phone,
      `nopalou-produit-${p.id}`,
      `${p.nom} — ${prixFmt(p.prix)}\n📍 *${p.boutique_nom}*\n\n👉 ${SITE}/boutiques/${p.boutique_slug}/produits/${p.id}`
    );
```

- [ ] **Step 2: Ajouter `boutique_nom` à la requête `searchContent` du chatbot**

Dans `backend/services/whatsapp-chatbot.js`, ligne 139-181, remplacer entièrement la fonction par :

```js
async function searchContent(query) {
  const r = await pool.query(
    `(
      SELECT 'marketplace' AS type, id::text, nom AS titre, prix_min AS prix,
             image_url AS photo, NULL::text AS boutique_slug, NULL::text AS boutique_nom, NULL::text AS ville
      FROM produits
      WHERE to_tsvector('french', nom || ' ' || COALESCE(description,''))
            @@ plainto_tsquery('french', $1)
      LIMIT 3
    )
    UNION ALL
    (
      SELECT 'produit', p.id::text, p.nom AS titre, p.prix,
             p.images[1] AS photo, b.slug AS boutique_slug, b.nom AS boutique_nom, NULL AS ville
      FROM boutique_produits p
      JOIN boutiques b ON b.id = p.boutique_id
      WHERE to_tsvector('french', p.nom || ' ' || COALESCE(p.description,''))
            @@ plainto_tsquery('french', $1)
      LIMIT 3
    )
    UNION ALL
    (
      SELECT 'annonce', id::text, titre, prix, (photos->>0), NULL::text, NULL::text, NULL::text
      FROM annonces_classifiees
      WHERE actif=true AND supprimee=false AND jsonb_array_length(photos) > 0
        AND to_tsvector('french', titre || ' ' || COALESCE(description,''))
            @@ plainto_tsquery('french', $1)
      LIMIT 3
    )
    UNION ALL
    (
      SELECT 'immo', id::text, titre, prix, (photos->>0), NULL::text, NULL::text, ville
      FROM annonces_immo
      WHERE actif=true AND jsonb_array_length(photos) > 0
        AND to_tsvector('french', titre || ' ' || COALESCE(description,''))
            @@ plainto_tsquery('french', $1)
      LIMIT 3
    )
    LIMIT 5`,
    [query]
  );
  return r.rows;
}
```

(Le seul changement est l'ajout de `b.nom AS boutique_nom` / `NULL::text AS boutique_nom` à chacune des 4 sous-requêtes de l'UNION, pour garder le même nombre de colonnes dans chaque branche — condition requise par `UNION ALL` en PostgreSQL.)

- [ ] **Step 3: Vérifier l'export de `handleSearchQuery`**

Ouvrir `backend/services/whatsapp-chatbot.js` et localiser le bloc `module.exports` en fin de fichier. Si `handleSearchQuery` n'y figure pas déjà, l'ajouter à la liste des exports sans retirer aucune clé existante (le fichier peut exporter par ailleurs `handleIncoming`, `searchContent`, etc. — ne conserver que l'ajout, ne pas réordonner ni supprimer d'autres exports).

- [ ] **Step 4: Écrire le test qui échoue pour le texte du message incluant le nom de la boutique**

Créer `backend/services/__tests__/whatsapp-chatbot-search.test.js` :

```js
jest.mock('../../models/db', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({
      rows: [{ type: 'produit', id: 'p1', titre: 'iPhone 13', prix: 250000, photo: 'https://x/i.jpg', boutique_slug: 'techdakar', boutique_nom: 'Boutique TechDakar', ville: null }],
    }),
  },
}));
jest.mock('../whatsapp', () => ({
  sendWhatsAppText: jest.fn().mockResolvedValue({}),
  sendWhatsAppProduct: jest.fn().mockRejectedValue(new Error('no catalog')), // force le fallback texte
  sendReadReceipt: jest.fn().mockResolvedValue({}),
  sendWhatsAppCarousel: jest.fn().mockResolvedValue({}),
}));

const { sendWhatsAppText } = require('../whatsapp');
const { handleSearchQuery } = require('../whatsapp-chatbot');

describe('handleSearchQuery — fallback texte produit boutique', () => {
  it('inclut le nom de la boutique dans le message de secours', async () => {
    await handleSearchQuery('+221700000000', 'iphone');
    const appel = sendWhatsAppText.mock.calls.find(c => c[1].includes('iPhone 13'));
    expect(appel).toBeDefined();
    expect(appel[1]).toContain('Boutique TechDakar');
  });
});
```

- [ ] **Step 5: Lancer le test pour vérifier qu'il échoue**

Run: `cd backend && npx jest services/__tests__/whatsapp-chatbot-search.test.js`
Expected: FAIL — le message envoyé ne contient pas encore "Boutique TechDakar" (le texte de fallback actuel, ligne 390 avant modification, ne montre que `${p.titre} — ${prixFmt(p.prix)}\n👉 ...`).

- [ ] **Step 6: Modifier le texte du fallback et du corps du Product Message dans `handleSearchQuery`**

Dans `backend/services/whatsapp-chatbot.js`, ligne 384-392, remplacer :

```js
  for (const p of produits) {
    await sendWhatsAppProduct(
      phone,
      `nopalou-produit-${p.id}`,
      `${p.titre} — ${prixFmt(p.prix)}`
    ).catch(async () => {
      await sendWhatsAppText(phone, `• *${p.titre}* — ${prixFmt(p.prix)}\n👉 ${SITE}/boutiques/${p.boutique_slug}/produits/${p.id}`);
    });
  }
```

par :

```js
  for (const p of produits) {
    await sendWhatsAppProduct(
      phone,
      `nopalou-produit-${p.id}`,
      `${p.titre} — ${prixFmt(p.prix)}\n📍 ${p.boutique_nom}`
    ).catch(async () => {
      await sendWhatsAppText(phone, `• *${p.titre}* — ${prixFmt(p.prix)}\n📍 *${p.boutique_nom}*\n👉 ${SITE}/boutiques/${p.boutique_slug}/produits/${p.id}`);
    });
  }
```

- [ ] **Step 7: Lancer le test pour vérifier qu'il passe**

Run: `cd backend && npx jest services/__tests__/whatsapp-chatbot-search.test.js`
Expected: PASS.

- [ ] **Step 8: Lancer toute la suite de tests backend pour vérifier l'absence de régression**

Run: `cd backend && npx jest`
Expected: PASS — tous les tests (ceux des Tasks 2 et 5 inclus) passent.

- [ ] **Step 9: Commit**

```bash
git add backend/services/whatsapp.js backend/services/whatsapp-chatbot.js backend/services/__tests__/whatsapp-chatbot-search.test.js
git commit -m "feat(boutique): affiche le nom de la boutique dans les messages WhatsApp produit"
```

---

## Vérification finale (bout en bout)

1. `cd backend && npx jest` — tous les tests passent.
2. `cd backend && npm run dev` puis `cd frontend-next && npm run dev` — les deux serveurs démarrent sans erreur.
3. Dans le navigateur (`/boutique`, compte Pro/Business) : ajouter un produit avec marque + état + prix barré renseignés → badge "⏳ En attente" visible immédiatement (car `WHATSAPP_CATALOG_ID` n'est probablement pas configuré en local) — confirme que le badge fonctionne indépendamment de la config Meta réelle.
4. Une fois `WHATSAPP_CATALOG_ID` posé (étape 0 de la spec, faite séparément par l'utilisateur), relancer `POST /api/boutiques/admin/sync-catalog` et vérifier dans Meta Commerce Manager que le produit de test apparaît avec `brand`, `condition`, `category`, `sale_price` renseignés — et que le badge dashboard repasse à "✓ Sur WhatsApp" après une nouvelle modification du produit (qui redéclenche `syncProduit`).
5. Envoyer une recherche chatbot de test réelle (sur un numéro autorisé) et confirmer que le nom de la boutique apparaît dans le résultat reçu.
