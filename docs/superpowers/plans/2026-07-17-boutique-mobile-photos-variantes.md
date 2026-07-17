# Boutique : responsive mobile, multi-photos et variantes produit — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre la zone de gestion boutique (`/boutique`) utilisable sur mobile, permettre jusqu'à 5 photos par produit du catalogue, et ajouter des variantes simples (options + valeurs, ex. Couleur/Taille) sélectionnables par l'acheteur avant de commander.

**Architecture:** Trois sous-systèmes indépendants livrés dans l'ordre CSS → photos → variantes (chaque tâche est testable seule). Le responsive est un travail de CSS pur (extraction des styles inline vers des classes avec media queries), sans changement de logique React. Les photos multiples réutilisent le pattern dropzone déjà existant dans `FormulaireAnnonce.tsx` (mêmes classes CSS globales) et `upload.array('photos', 5)` déjà utilisé dans `annonces.js`. Les variantes ajoutent une colonne JSONB additive et une UI de sélection obligatoire côté acheteur qui alimente le champ texte `note` déjà existant du formulaire de commande — aucun changement de schéma de commande.

**Tech Stack:** Next.js 14 (App Router), React (Server + Client Components), Express, PostgreSQL (`pg`), Multer + Cloudinary.

## Global Constraints

- Breakpoint mobile : 640px (cohérent avec le reste du site — `globals.css:342`).
- Max 5 photos par produit, 5 Mo chacune (identique aux annonces classifiées).
- Variantes : pas de prix ni de stock par combinaison — un seul `prix`/`stock_quantite` pour tout le produit.
- Aucun changement du schéma `commandes_boutique` — la variante sélectionnée est reportée dans le champ `note` texte existant du formulaire de commande.
- Toute migration DB est additive (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`), dans `backend/migrate-inline.js`, jamais de colonne supprimée ou renommée.
- `npx tsc --noEmit` doit passer sans erreur après chaque tâche touchant `frontend-next/`.

---

## Fichiers concernés

| Fichier | Rôle |
|---|---|
| `frontend-next/src/app/globals.css` | Nouvelles classes CSS responsive pour la sidebar/onglets, les grilles de formulaire, les cartes boutique/produit |
| `frontend-next/src/app/boutique/BoutiqueClient.tsx` | Extraction des styles inline vers classNames (responsive) ; remplacement du champ photo unique par le dropzone multi-photos ; ajout de la section Variantes dans `ProduitForm` |
| `backend/routes/boutiques.js` | `upload.array('photos', 5)` au lieu de `upload.single('image')` sur les 2 routes produit ; lecture/écriture de la colonne `variantes` ; nouvelle instance multer dédiée aux photos produit |
| `backend/migrate-inline.js` | Nouvelle colonne `boutique_produits.variantes JSONB DEFAULT '[]'` |
| `frontend-next/src/app/boutiques/[id]/produits/[produitId]/page.tsx` | Passage de `p.variantes` en prop à `ProduitCTA` |
| `frontend-next/src/app/boutiques/[id]/produits/[produitId]/ProduitCTA.tsx` | Sélecteur de variantes (pills), désactivation du bouton Commander tant que la sélection n'est pas complète, calcul du texte de note |
| `frontend-next/src/app/boutiques/[id]/CommanderModal.tsx` | Nouvelle prop `noteInitiale` pour pré-remplir le champ `note` |

---

### Task 1 : Migration DB — colonne `variantes`

**Files:**
- Modify: `backend/migrate-inline.js`

**Interfaces:**
- Produces: colonne `boutique_produits.variantes JSONB DEFAULT '[]'`, lue/écrite par les tâches 5 et 6.

- [ ] **Step 1: Ajouter la migration**

Repérer le bloc existant autour de la ligne 602-608 de `backend/migrate-inline.js` :
```js
  // Colonnes enrichissement produits (caractéristiques par catégorie)
  for (const sql of [
    `ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS categorie VARCHAR(50)`,
    `ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS caracteristiques JSONB DEFAULT '{}'`,
  ]) {
    try { await pool.query(sql); } catch (e) { console.warn('[MIGRATE] bp_colonnes:', e.message); }
  }
```

Ajouter juste après ce bloc :
```js
  // Variantes simples produit (options + valeurs, ex: Couleur/Taille) — 17 juillet 2026
  try {
    await pool.query(`ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS variantes JSONB DEFAULT '[]'`);
    console.log('[MIGRATE] ✅ Colonne boutique_produits.variantes OK');
  } catch (e) { console.warn('[MIGRATE] bp_variantes:', e.message); }
```

- [ ] **Step 2: Vérifier localement**

Run: `node -e "require('dotenv').config(); require('./backend/migrate-inline.js')().then(() => console.log('OK')).catch(e => { console.error(e); process.exit(1) })"`

Expected: le log affiche `[MIGRATE] ✅ Colonne boutique_produits.variantes OK` sans erreur.

- [ ] **Step 3: Confirmer la colonne en base**

Run: `node -e "require('dotenv').config(); const { pool } = require('./backend/models/db'); pool.query(\"SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name='boutique_produits' AND column_name='variantes'\").then(r => { console.log(r.rows); pool.end(); })"`

Expected: une ligne `{ column_name: 'variantes', data_type: 'jsonb', column_default: "'[]'::jsonb" }`.

- [ ] **Step 4: Commit**

```bash
git add backend/migrate-inline.js
git commit -m "feat(db): ajoute colonne boutique_produits.variantes pour les options produit"
```

---

### Task 2 : Backend — photos multiples (upload.array)

**Files:**
- Modify: `backend/routes/boutiques.js:12-19` (instance multer), `:252` (route POST produit), `:305` (route PUT produit)

**Interfaces:**
- Consumes: `uploadBuffer(buffer, folder)` (déjà défini dans `backend/services/cloudinary.js`, retourne `Promise<string>`).
- Produces: `POST /api/boutiques/:id/produits` et `PUT /api/boutiques/:id/produits/:prodId` acceptent désormais un champ multipart `photos` (jusqu'à 5 fichiers), en plus de `variantes` (traité en Task 3). Le champ `image` (singulier) n'est plus consommé — toute route/appelant existant utilisant `image` doit passer à `photos`.

- [ ] **Step 1: Ajouter une instance multer dédiée aux photos produit**

L'instance `upload` globale (`backend/routes/boutiques.js:12-19`) a `limits: { files: 2 }`, insuffisant pour 5 photos et partagé avec les routes logo/cover de la boutique — ne pas y toucher pour ne pas régresser ces routes. Ajouter juste après le bloc existant (ligne 19) :

```js
const uploadProduitPhotos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(null, false);
  },
});
```

- [ ] **Step 2: Modifier la route POST produit**

Dans `backend/routes/boutiques.js`, remplacer la signature de la route (ligne 252) :
```js
router.post('/:id/produits', verifierToken, param('id').isUUID(), checkAbonnement, requireAbonnement, upload.single('image'), async (req, res) => {
```
par :
```js
router.post('/:id/produits', verifierToken, param('id').isUUID(), checkAbonnement, requireAbonnement, uploadProduitPhotos.array('photos', 5), async (req, res) => {
```

Remplacer le bloc d'upload d'image (lignes 273-276) :
```js
    let images = [];
    if (req.file) {
      try { images = [await uploadBuffer(req.file.buffer, 'boutique_produits')]; } catch {}
    }
```
par :
```js
    let images = [];
    if (req.files && req.files.length) {
      for (const f of req.files) {
        try { images.push(await uploadBuffer(f.buffer, 'boutique_produits')); } catch {}
      }
    }
```

- [ ] **Step 3: Modifier la route PUT produit**

Remplacer la signature (ligne 305) :
```js
router.put('/:id/produits/:prodId', verifierToken, param('id').isUUID(), param('prodId').isUUID(), upload.single('image'), async (req, res) => {
```
par :
```js
router.put('/:id/produits/:prodId', verifierToken, param('id').isUUID(), param('prodId').isUUID(), uploadProduitPhotos.array('photos', 5), async (req, res) => {
```

Remplacer le bloc d'upload d'image (lignes 316-319) :
```js
    let images = existing.rows[0].images;
    if (req.file) {
      try { images = [await uploadBuffer(req.file.buffer, 'boutique_produits')]; } catch {}
    }
```
par :
```js
    let images = existing.rows[0].images;
    if (req.files && req.files.length) {
      images = [];
      for (const f of req.files) {
        try { images.push(await uploadBuffer(f.buffer, 'boutique_produits')); } catch {}
      }
    }
```

Ce comportement conserve la règle du spec : si de nouvelles photos sont envoyées, elles remplacent entièrement le tableau existant ; sinon les images existantes sont conservées.

- [ ] **Step 4: Vérifier avec curl (POST, une seule photo pour rester simple)**

Prérequis : avoir un token JWT valide (`Authorization: Bearer ...`) d'un compte possédant une boutique Pro/Business active, et l'UUID de cette boutique. Adapter les valeurs ci-dessous.

Run (PowerShell) :
```powershell
curl.exe -X POST "http://localhost:3000/api/boutiques/<BOUTIQUE_ID>/produits" `
  -H "Authorization: Bearer <TOKEN>" `
  -F "nom=Test photos multiples" `
  -F "prix=10000" `
  -F "photos=@C:\Users\bamba\Downloads\test1.jpg" `
  -F "photos=@C:\Users\bamba\Downloads\test2.jpg"
```

Expected: réponse `201` avec `produit.images` contenant 2 URLs Cloudinary.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/boutiques.js
git commit -m "feat(boutiques): support jusqu'à 5 photos par produit du catalogue"
```

---

### Task 3 : Backend — lecture/écriture des variantes

**Files:**
- Modify: `backend/routes/boutiques.js` (routes GET catalogue public, GET fiche produit, POST produit, PUT produit)

**Interfaces:**
- Consumes: colonne `boutique_produits.variantes` (Task 1).
- Produces: `GET /api/boutiques/:id/produits/:prodId` renvoie `produit.variantes: { nom: string, valeurs: string[] }[]`. `POST`/`PUT /api/boutiques/:id/produits(/:prodId)` acceptent un champ `variantes` (JSON stringifié) avec la même forme.

- [ ] **Step 1: Exposer `variantes` dans le catalogue public**

Dans `backend/routes/boutiques.js`, ligne 216 (route `GET /:id/produits`), ajouter `p.variantes` à la liste des colonnes sélectionnées :
```js
      `SELECT p.id, p.nom, p.description, p.prix, p.prix_barre, p.images, p.en_stock, p.ordre, p.categorie, p.caracteristiques, p.stock_quantite, p.variantes,
              p.whatsapp_sync_statut, p.whatsapp_sync_erreur
       FROM boutique_produits p
```

- [ ] **Step 2: Exposer `variantes` dans la fiche produit publique**

Ligne 236 (route `GET /:id/produits/:prodId`), ajouter `p.variantes` :
```js
      `SELECT p.id, p.nom, p.description, p.prix, p.prix_barre, p.images, p.en_stock,
              p.categorie, p.caracteristiques, p.variantes, p.ordre, p.created_at,
              b.nom AS boutique_nom, b.telephone AS boutique_telephone,
```

- [ ] **Step 3: Accepter `variantes` en écriture sur POST**

Dans la route POST (autour de la ligne 270), ajouter `variantes` à la déstructuration :
```js
    const { nom, description, prix, prix_barre, en_stock, categorie, caracteristiques, variantes } = req.body;
```

Juste après le bloc `caracJson` existant (après la ligne 281), ajouter :
```js
    let variantesJson = [];
    if (variantes) {
      try {
        const parsed = typeof variantes === 'string' ? JSON.parse(variantes) : variantes;
        if (Array.isArray(parsed)) variantesJson = parsed;
      } catch {}
    }
```

Modifier la requête `INSERT` (lignes 283-288) :
```js
    const r = await pool.query(
      `INSERT INTO boutique_produits (boutique_id, nom, description, prix, prix_barre, images, en_stock, categorie, caracteristiques, variantes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [id, nom.trim(), description||null, prix||null, prix_barre||null,
       images, en_stock !== 'false', categorie||null, caracJson, JSON.stringify(variantesJson)]
    );
```

- [ ] **Step 4: Accepter `variantes` en écriture sur PUT**

Dans la route PUT (autour de la ligne 315), ajouter `variantes` à la déstructuration :
```js
    const { nom, description, prix, prix_barre, en_stock, categorie, caracteristiques, variantes } = req.body;
```

Après le bloc `caracJson` existant (après la ligne 324), ajouter :
```js
    let variantesJson = existing.rows[0].variantes ?? [];
    if (variantes) {
      try {
        const parsed = typeof variantes === 'string' ? JSON.parse(variantes) : variantes;
        if (Array.isArray(parsed)) variantesJson = parsed;
      } catch {}
    }
```

Modifier la requête `UPDATE` (lignes 326-333) :
```js
    const r = await pool.query(
      `UPDATE boutique_produits SET nom=$1, description=$2, prix=$3, prix_barre=$4,
       images=$5, en_stock=$6, categorie=$7, caracteristiques=$8, variantes=$9, updated_at=NOW()
       WHERE id=$10 AND boutique_id=$11 RETURNING *`,
      [nom||existing.rows[0].nom, description||null, prix||null, prix_barre||null,
       images, en_stock !== 'false', categorie||existing.rows[0].categorie||null,
       caracJson, JSON.stringify(variantesJson), prodId, id]
    );
```

- [ ] **Step 5: Vérifier avec curl**

Run (PowerShell), avec un token/boutique valides :
```powershell
curl.exe -X POST "http://localhost:3000/api/boutiques/<BOUTIQUE_ID>/produits" `
  -H "Authorization: Bearer <TOKEN>" `
  -F "nom=Test variantes" `
  -F "prix=15000" `
  -F 'variantes=[{"nom":"Couleur","valeurs":["Rouge","Bleu"]},{"nom":"Taille","valeurs":["S","M","L"]}]'
```

Expected: réponse `201` avec `produit.variantes` égal au tableau envoyé. Puis :
```powershell
curl.exe "http://localhost:3000/api/boutiques/<BOUTIQUE_ID>/produits/<PRODUIT_ID_RETOURNE>"
```
Expected: `produit.variantes` présent avec les mêmes 2 options.

- [ ] **Step 6: Commit**

```bash
git add backend/routes/boutiques.js
git commit -m "feat(boutiques): lecture/écriture des variantes produit (options+valeurs)"
```

---

### Task 4 : CSS responsive — classes globales

**Files:**
- Modify: `frontend-next/src/app/globals.css`

**Interfaces:**
- Produces: classes CSS consommées par la Task 5 : `.bq-manage-layout`, `.bq-sidebar`, `.bq-sidebar-header`, `.bq-nav`, `.bq-nav-item`, `.bq-nav-badge`, `.bq-main`, `.bq-form-grid-2`, `.bq-card`, `.bq-card-actions`, `.bq-produit-row`.

- [ ] **Step 1: Ajouter les classes de layout de gestion boutique**

Ajouter à la fin de `frontend-next/src/app/globals.css` (avant tout media query final existant, ou en toute fin de fichier) :

```css
/* ── Gestion boutique — layout responsive ────────────────────────── */
.bq-manage-layout {
  display: flex;
  gap: 0;
  min-height: 70vh;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.bq-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.bq-sidebar-header {
  padding: 20px 16px 16px;
  border-bottom: 1px solid #f3f4f6;
}

.bq-nav {
  padding: 12px 8px;
  flex: 1;
}

.bq-nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: none;
  color: #374151;
  font-weight: 500;
  font-size: 13px;
  margin-bottom: 2px;
  text-align: left;
  border-left: 3px solid transparent;
  position: relative;
  white-space: nowrap;
}

.bq-nav-item.active {
  background: #fff7f0;
  color: #C75B00;
  font-weight: 700;
  border-left: 3px solid #C75B00;
}

.bq-nav-badge {
  margin-left: auto;
  background: #dc2626;
  color: #fff;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  min-width: 18px;
  text-align: center;
}

.bq-main {
  flex: 1;
  min-width: 0;
  padding: 28px 32px;
  overflow-y: auto;
}

.bq-form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.bq-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,.07);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.bq-card-body {
  padding: 20px 24px;
}

.bq-card-actions {
  margin-top: 18px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  border-top: 1px solid #f3f4f6;
  padding-top: 16px;
}

.bq-produit-row {
  display: flex;
  gap: 12px;
  align-items: center;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px 14px;
}

@media (max-width: 640px) {
  .bq-manage-layout {
    flex-direction: column;
    border-radius: 12px;
  }

  .bq-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }

  .bq-sidebar-header {
    padding: 14px 14px 10px;
  }

  .bq-nav {
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    gap: 4px;
    padding: 8px 10px;
    flex: none;
    -webkit-overflow-scrolling: touch;
  }

  .bq-nav-item {
    flex-shrink: 0;
    width: auto;
    flex-direction: column;
    gap: 2px;
    padding: 8px 12px;
    border-left: none;
    border-bottom: 3px solid transparent;
    font-size: 11px;
    text-align: center;
  }

  .bq-nav-item.active {
    border-left: none;
    border-bottom: 3px solid #C75B00;
  }

  .bq-nav-badge {
    margin-left: 4px;
  }

  .bq-main {
    padding: 18px 16px;
  }

  .bq-form-grid-2 {
    grid-template-columns: 1fr;
  }

  .bq-card-body {
    padding: 16px 16px;
  }

  .bq-produit-row {
    flex-wrap: wrap;
    padding: 10px 12px;
  }
}
```

- [ ] **Step 2: Vérifier que le CSS est syntaxiquement valide**

Run: `cd frontend-next && npx stylelint src/app/globals.css --allow-empty-input 2>&1 | Select-String -Pattern "globals.css" | Select-Object -First 20`

Si `stylelint` n'est pas installé dans le projet (probable), à la place lancer un build Next.js qui échouera sur un CSS invalide :
Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune nouvelle erreur (tsc ne valide pas le CSS mais confirme qu'aucun import n'est cassé). Une revue visuelle rapide du fichier (relire les accolades) suffit ici — le CSS sera vérifié fonctionnellement à la Task 5.

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/app/globals.css
git commit -m "feat(css): classes responsive pour la gestion boutique (sidebar->onglets sous 640px)"
```

---

### Task 5 : Frontend — appliquer le responsive dans BoutiqueClient.tsx

**Files:**
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx`

**Interfaces:**
- Consumes: classes CSS de la Task 4 (`.bq-manage-layout`, `.bq-sidebar`, `.bq-nav`, `.bq-nav-item`, `.bq-nav-badge`, `.bq-main`, `.bq-form-grid-2`, `.bq-card`, `.bq-card-body`, `.bq-card-actions`, `.bq-produit-row`).
- Produces: aucun changement d'interface publique du composant — uniquement le rendu.

- [ ] **Step 1: Remplacer le layout de `BoutiqueManage` (sidebar + main)**

Dans `BoutiqueManage` (`BoutiqueClient.tsx:1048-1136`), remplacer :
```tsx
    <div style={{ display: 'flex', gap: 0, minHeight: '70vh', background: '#f8fafc', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>

      {/* Sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
        {/* Boutique header dans sidebar */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #f3f4f6' }}>
```
par :
```tsx
    <div className="bq-manage-layout">

      {/* Sidebar */}
      <aside className="bq-sidebar">
        {/* Boutique header dans sidebar */}
        <div className="bq-sidebar-header">
```

Remplacer :
```tsx
        {/* Nav */}
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => { setTab(item.key); if (item.key === 'commandes') setNbEnAttente(0) }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', border: 'none', borderRadius: 8, cursor: 'pointer',
              background: tab === item.key ? '#fff7f0' : 'none',
              color: tab === item.key ? '#C75B00' : '#374151',
              fontWeight: tab === item.key ? 700 : 500,
              fontSize: 13, marginBottom: 2, textAlign: 'left' as const,
              borderLeft: tab === item.key ? '3px solid #C75B00' : '3px solid transparent',
              position: 'relative',
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
              {item.key === 'commandes' && nbEnAttente > 0 && (
                <span style={{
                  marginLeft: 'auto', background: '#dc2626', color: '#fff',
                  borderRadius: 20, fontSize: 10, fontWeight: 800,
                  padding: '2px 7px', minWidth: 18, textAlign: 'center',
                }}>
                  {nbEnAttente}
                </span>
              )}
            </button>
          ))}
        </nav>
```
par :
```tsx
        {/* Nav */}
        <nav className="bq-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => { setTab(item.key); if (item.key === 'commandes') setNbEnAttente(0) }} className={`bq-nav-item${tab === item.key ? ' active' : ''}`}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
              {item.key === 'commandes' && nbEnAttente > 0 && (
                <span className="bq-nav-badge">{nbEnAttente}</span>
              )}
            </button>
          ))}
        </nav>
```

Remplacer :
```tsx
      {/* Contenu principal */}
      <main style={{ flex: 1, minWidth: 0, padding: '28px 32px', overflowY: 'auto' }}>
```
par :
```tsx
      {/* Contenu principal */}
      <main className="bq-main">
```

- [ ] **Step 2: Rendre responsive les grilles `1fr 1fr` des formulaires**

Dans `BoutiqueForm`, remplacer chaque occurrence de :
```tsx
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
```
par :
```tsx
      <div className="bq-form-grid-2">
```
Il y a 4 occurrences dans `BoutiqueForm` (adresse/ville, téléphone/whatsapp, facebook/instagram, logo/cover).

Dans `ProduitForm`, la grille prix a un `gridTemplateColumns` conditionnel (`modeRapide ? '1fr' : '1fr 1fr'`) — laisser cette ligne inchangée (elle gère déjà un cas à une seule colonne, la classe `.bq-form-grid-2` ne s'applique qu'à celle-ci si `!modeRapide`) :
```tsx
      <div style={{ display: 'grid', gridTemplateColumns: modeRapide ? '1fr' : '1fr 1fr', gap: 12 }}>
```
remplacer par :
```tsx
      <div className={modeRapide ? '' : 'bq-form-grid-2'} style={modeRapide ? { display: 'grid' } : undefined}>
```

Dans `CaracteristiquesFields` (toutes les fonctions `if (slug === '...')`), remplacer chaque :
```tsx
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
```
par :
```tsx
    <div className="bq-form-grid-2">
```
(9 occurrences — une par catégorie : smartphones, informatique, tv-electro, auto-moto, mode, maison, jeux, alimentation, beaute — le bloc `services` utilise déjà la même structure, à convertir aussi).

- [ ] **Step 3: Appliquer les classes de carte à `BoutiqueCard`**

Dans `BoutiqueCard` (`BoutiqueClient.tsx:868-976`), remplacer :
```tsx
    <div style={{
      background: '#fff', borderRadius: 16,
      boxShadow: '0 2px 12px rgba(0,0,0,.07)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
    }}>
      {/* Bande colorée plan */}
      <div style={{ height: 4, background: planColor }} />

      <div style={{ padding: '20px 24px' }}>
```
par :
```tsx
    <div className="bq-card">
      {/* Bande colorée plan */}
      <div style={{ height: 4, background: planColor }} />

      <div className="bq-card-body">
```

Remplacer le conteneur d'actions :
```tsx
        {/* Actions */}
        <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
```
par :
```tsx
        {/* Actions */}
        <div className="bq-card-actions">
```

- [ ] **Step 4: Appliquer la classe de ligne produit dans `CatalogueProduits`**

Remplacer :
```tsx
            <div key={p.id} style={{
              display: 'flex', gap: 12, alignItems: 'center',
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px',
            }}>
```
par :
```tsx
            <div key={p.id} className="bq-produit-row">
```

- [ ] **Step 5: Vérifier avec tsc**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6: Vérifier visuellement**

Démarrer le dev server (`cd frontend-next && npm run dev`), ouvrir `http://localhost:3001/boutique` avec les DevTools en mode mobile (375px de large) :
- La vue liste des boutiques doit être lisible sans débordement horizontal.
- Cliquer sur "Gérer la boutique →" : la sidebar doit apparaître comme une barre d'onglets horizontale scrollable en haut, pas une colonne étroite à gauche.
- Ouvrir "Créer une boutique" et "Ajouter un produit" : les champs doivent être en 1 colonne.

- [ ] **Step 7: Commit**

```bash
git add frontend-next/src/app/boutique/BoutiqueClient.tsx
git commit -m "feat(boutique): applique le layout responsive (sidebar->onglets, grilles 1 colonne sous 640px)"
```

---

### Task 6 : Frontend — dropzone multi-photos dans ProduitForm

**Files:**
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx` (composant `ProduitForm`)

**Interfaces:**
- Consumes: classes CSS déjà existantes `.photos-zone`, `.photos-dropzone`, `.photos-previews`, `.photo-thumb`, `.photo-remove` (définies dans `globals.css:4034-4090`, utilisées par `FormulaireAnnonce.tsx`).
- Produces: le `FormData` soumis par `ProduitForm` contient un champ `photos` répété (0 à 5 fichiers) au lieu du champ `image` unique.

- [ ] **Step 1: Ajouter les imports et l'état local nécessaires**

En haut du fichier `BoutiqueClient.tsx`, la ligne d'import React hooks (ligne 2) doit inclure `useRef` :
```tsx
import { useState, useEffect, useTransition, useRef } from 'react'
```

- [ ] **Step 2: Ajouter l'état photos dans `ProduitForm`**

`ProduitForm` utilise `useFormState` (`<form action={formAction}>`), qui construit son FormData nativement depuis les éléments `name=` du DOM au moment de la soumission — un `onSubmit` custom ne peut pas s'y substituer. La solution : garder un seul `<input type="file" name="photos" multiple>` natif, et pour permettre le retrait sélectif d'une photo avant envoi (nécessaire pour l'UX de suppression), resynchroniser sa `FileList` via un objet `DataTransfer` à chaque ajout/retrait — c'est la technique standard puisque `input.files` est en lecture seule.

Dans `ProduitForm` (`BoutiqueClient.tsx:429-580`), après la ligne :
```tsx
  const [modeRapide, setModeRapide] = useState(modeInitial === 'rapide' && !produit)
```
ajouter :
```tsx
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [imagesExistantes, setImagesExistantes] = useState<string[]>(produit?.images ?? [])
  const fileRef = useRef<HTMLInputElement>(null)

  function syncFileInput(files: File[]) {
    if (!fileRef.current) return
    const dt = new DataTransfer()
    files.forEach(f => dt.items.add(f))
    fileRef.current.files = dt.files
  }

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const restant = 5 - imagesExistantes.length
    const files = Array.from(e.target.files ?? []).slice(0, Math.max(0, restant))
    setPhotos(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
    syncFileInput(files)
  }

  function removeNouvellePhoto(i: number) {
    const next = photos.filter((_, j) => j !== i)
    setPhotos(next)
    setPreviews(prev => prev.filter((_, j) => j !== i))
    syncFileInput(next)
  }

  function removeImageExistante(i: number) {
    setImagesExistantes(prev => prev.filter((_, j) => j !== i))
  }
```

- [ ] **Step 3: Remplacer le champ photo unique par le dropzone**

Remplacer le bloc (autour de la ligne 527-537) :
```tsx
      {/* Photo */}
      <div>
        <label style={labelStyle}>Photo du produit <span style={{ fontSize: 11, color: '#9ca3af' }}>(max 5 Mo)</span></label>
        <input name="image" type="file" accept="image/*" style={{ fontSize: 14 }} />
        {produit?.images?.[0] && (
          <div style={{ marginTop: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={produit.images[0]} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
          </div>
        )}
      </div>
```
par :
```tsx
      {/* Photos */}
      <div>
        <label style={labelStyle}>Photos du produit <span style={{ fontSize: 11, color: '#9ca3af' }}>(max 5, 5 Mo chacune)</span></label>
        <div className="photos-zone">
          {imagesExistantes.length + photos.length < 5 && (
            <div
              className="photos-dropzone"
              onClick={() => fileRef.current?.click()}
              onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
              tabIndex={0}
              role="button"
              aria-label="Ajouter des photos"
            >
              <span style={{ fontSize: 28 }}>📷</span>
              <p>Cliquez pour ajouter des photos</p>
            </div>
          )}
          <input
            ref={fileRef}
            name="photos"
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handlePhotos}
          />

          {(imagesExistantes.length > 0 || previews.length > 0) && (
            <div className="photos-previews">
              {imagesExistantes.map((src, i) => (
                <div key={`existante-${i}`} className="photo-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Photo ${i + 1}`} />
                  <button type="button" className="photo-remove" onClick={() => removeImageExistante(i)} aria-label="Supprimer">✕</button>
                </div>
              ))}
              {previews.map((src, i) => (
                <div key={`nouvelle-${i}`} className="photo-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Nouvelle photo ${i + 1}`} />
                  <button type="button" className="photo-remove" onClick={() => removeNouvellePhoto(i)} aria-label="Supprimer">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
```

- [ ] **Step 4: Gérer le cas où l'utilisateur retire toutes les images existantes sans en ajouter de nouvelles**

Le backend conserve `existing.rows[0].images` si `req.files` est vide (Task 2, Step 3) — donc si l'utilisateur retire les 3 miniatures existantes via `removeImageExistante` sans sélectionner de nouveau fichier, le formulaire soumettrait un `input[name=photos]` vide et le backend garderait à tort les anciennes images. Pour respecter la règle du spec ("au moins 1 photo requise"), ajouter une validation cliente juste avant la balise de fermeture du formulaire, en désactivant `SubmitButton` dans ce cas précis. Remplacer :
```tsx
      <div style={{ display: 'flex', gap: 12 }}>
        <SubmitButton label={produit ? 'Enregistrer' : 'Ajouter le produit'} />
```
par :
```tsx
      {imagesExistantes.length === 0 && photos.length === 0 && (
        <p style={{ color: '#dc2626', fontSize: 12, margin: 0 }}>Ajoutez au moins une photo.</p>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <SubmitButton label={produit ? 'Enregistrer' : 'Ajouter le produit'} disabled={imagesExistantes.length === 0 && photos.length === 0} />
```

`SubmitButton` (ligne 225-236) doit accepter une prop `disabled` optionnelle. Remplacer sa définition :
```tsx
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} style={{
```
par :
```tsx
function SubmitButton({ label, disabled }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending || disabled} style={{
```

- [ ] **Step 5: Vérifier avec tsc**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6: Vérifier manuellement**

Démarrer le dev server, aller sur `/boutique` → une boutique Pro/Business → Catalogue → "Ajout détaillé" :
- Ajouter 3 photos, vérifier les 3 miniatures avec bouton ✕ fonctionnel.
- Retirer une photo, vérifier qu'elle disparaît de l'aperçu.
- Soumettre le formulaire, vérifier dans la liste du catalogue que le produit a bien été créé avec une image (miniature visible).
- Éditer ce produit, vérifier que la photo existante apparaît en premier dans les miniatures, ajouter 2 photos de plus (total 3), enregistrer, ré-ouvrir en édition pour confirmer les 3 images sont bien persistées.

- [ ] **Step 7: Commit**

```bash
git add frontend-next/src/app/boutique/BoutiqueClient.tsx
git commit -m "feat(boutique): dropzone multi-photos (max 5) pour le formulaire produit"
```

---

### Task 7 : Frontend — section Variantes dans ProduitForm

**Files:**
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx` (composant `ProduitForm`)

**Interfaces:**
- Consumes: Task 3 (backend accepte le champ `variantes`).
- Produces: type `Variante = { nom: string; valeurs: string[] }`, consommé par la Task 8 côté fiche produit publique (même forme JSON).

- [ ] **Step 1: Définir le type `Variante` et l'interface `Produit`**

Dans `BoutiqueClient.tsx`, l'interface `Produit` (lignes 51-63) doit inclure `variantes`. Remplacer :
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
par :
```tsx
interface Variante {
  nom: string
  valeurs: string[]
}

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
  variantes: Variante[] | null
  whatsapp_sync_statut: 'synchronise' | 'en_attente' | 'echec' | null
  whatsapp_sync_erreur: string | null
}
```

- [ ] **Step 2: Ajouter l'état variantes dans `ProduitForm`**

Après le bloc ajouté en Task 6 Step 2 (état `photos`/`previews`/`imagesExistantes`), ajouter :
```tsx
  const [variantes, setVariantes] = useState<Variante[]>(produit?.variantes ?? [])
  const [nouvelleValeur, setNouvelleValeur] = useState<Record<number, string>>({})

  function ajouterOption() {
    setVariantes(prev => [...prev, { nom: '', valeurs: [] }])
  }

  function renommerOption(index: number, nom: string) {
    setVariantes(prev => prev.map((v, i) => i === index ? { ...v, nom } : v))
  }

  function retirerOption(index: number) {
    setVariantes(prev => prev.filter((_, i) => i !== index))
    setNouvelleValeur(prev => { const next = { ...prev }; delete next[index]; return next })
  }

  function ajouterValeur(index: number) {
    const val = (nouvelleValeur[index] ?? '').trim()
    if (!val) return
    setVariantes(prev => prev.map((v, i) => {
      if (i !== index) return v
      if (v.valeurs.includes(val)) return v
      return { ...v, valeurs: [...v.valeurs, val] }
    }))
    setNouvelleValeur(prev => ({ ...prev, [index]: '' }))
  }

  function retirerValeur(index: number, valeur: string) {
    setVariantes(prev => prev.map((v, i) => i === index ? { ...v, valeurs: v.valeurs.filter(x => x !== valeur) } : v))
  }
```

- [ ] **Step 3: Ajouter le champ caché `variantes` et la section UI**

Après le champ caché `caracteristiques` existant :
```tsx
      <input type="hidden" name="categorie" value={cat} />
      <input type="hidden" name="caracteristiques" value={JSON.stringify(carac)} />
```
ajouter :
```tsx
      <input type="hidden" name="variantes" value={JSON.stringify(variantes.filter(v => v.nom.trim() && v.valeurs.length > 0))} />
```

Après le bloc `hasCaracFields` (section Caractéristiques) et avant la section Description, ajouter une nouvelle section (uniquement visible en mode détaillé, cohérent avec Description/Prix barré) :
```tsx
      {/* Variantes (options + valeurs) */}
      {!modeRapide && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Variantes (optionnel)
          </p>
          {variantes.map((v, i) => (
            <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < variantes.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <input
                  type="text" value={v.nom} onChange={e => renommerOption(i, e.target.value)}
                  style={{ ...inputStyle, flex: 1 }} placeholder="Nom de l'option (ex: Couleur, Taille…)"
                />
                <button type="button" onClick={() => retirerOption(i)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 10px', fontSize: 12, cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {v.valeurs.map(val => (
                  <span key={val} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>
                    {val}
                    <button type="button" onClick={() => retirerValeur(i, val)} style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', fontSize: 12, padding: 0 }}>✕</button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={nouvelleValeur[i] ?? ''}
                  onChange={e => setNouvelleValeur(prev => ({ ...prev, [i]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); ajouterValeur(i) } }}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="Valeur (ex: Rouge), Entrée pour ajouter"
                />
                <button type="button" onClick={() => ajouterValeur(i)} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Ajouter
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={ajouterOption} style={{ background: 'none', border: '1px dashed #d1d5db', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
            + Ajouter une option
          </button>
        </div>
      )}
```

- [ ] **Step 4: Vérifier avec tsc**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 5: Vérifier manuellement**

Sur `/boutique` → Catalogue → "Ajout détaillé" :
- Cliquer "+ Ajouter une option", taper "Couleur", ajouter "Rouge" et "Bleu" comme valeurs (Entrée après chacune).
- Ajouter une 2e option "Taille" avec "S"/"M"/"L".
- Soumettre, éditer le produit créé, vérifier que les 2 options et leurs valeurs sont bien rechargées dans le formulaire.

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/app/boutique/BoutiqueClient.tsx
git commit -m "feat(boutique): section variantes (options+valeurs) dans le formulaire produit"
```

---

### Task 8 : Frontend — sélection de variante obligatoire côté acheteur

**Files:**
- Modify: `frontend-next/src/app/boutiques/[id]/produits/[produitId]/page.tsx`, `frontend-next/src/app/boutiques/[id]/produits/[produitId]/ProduitCTA.tsx`, `frontend-next/src/app/boutiques/[id]/CommanderModal.tsx`

**Interfaces:**
- Consumes: `produit.variantes: { nom: string; valeurs: string[] }[] | null` (Task 3).
- Produces: `ProduitCTA` calcule un texte de note (ex: `"Couleur: Rouge, Taille: M"`) et le passe à `CommanderModal` via une nouvelle prop `noteInitiale?: string`.

- [ ] **Step 1: Ajouter `variantes` à l'interface `ProduitDetail` et la transmettre**

Dans `frontend-next/src/app/boutiques/[id]/produits/[produitId]/page.tsx`, l'interface `ProduitDetail` (lignes 12-27) : ajouter après `caracteristiques` :
```tsx
  caracteristiques: Record<string, string> | null
  variantes: { nom: string; valeurs: string[] }[] | null
```

Le rendu de `<ProduitCTA .../>` (lignes 210-216) : ajouter la prop `variantes` :
```tsx
          <ProduitCTA
            boutiqueId={params.id}
            produit={{ id: p.id, nom: p.nom, prix: p.prix }}
            enStock={p.en_stock}
            waUrl={waUrl}
            telUrl={telUrl}
            variantes={p.variantes ?? []}
          />
```

- [ ] **Step 2: Ajouter la prop `noteInitiale` à `CommanderModal`**

Dans `CommanderModal.tsx`, modifier la signature du composant (lignes 15-23) :
```tsx
export default function CommanderModal({
  boutiqueId,
  produit,
  onClose,
}: {
  boutiqueId: string
  produit: Produit
  onClose: () => void
}) {
```
par :
```tsx
export default function CommanderModal({
  boutiqueId,
  produit,
  onClose,
  noteInitiale,
}: {
  boutiqueId: string
  produit: Produit
  onClose: () => void
  noteInitiale?: string
}) {
```

Modifier l'initialisation de l'état `note` (ligne 28) :
```tsx
  const [note, setNote] = useState('')
```
par :
```tsx
  const [note, setNote] = useState(noteInitiale ?? '')
```

- [ ] **Step 3: Réécrire `ProduitCTA` avec le sélecteur de variantes**

Remplacer entièrement le contenu de `ProduitCTA.tsx` :
```tsx
'use client'
import { useState } from 'react'
import CommanderModal from '../../CommanderModal'

interface Variante {
  nom: string
  valeurs: string[]
}

interface Props {
  boutiqueId: string
  produit: { id: string; nom: string; prix: number | null }
  enStock: boolean
  waUrl: string | null
  telUrl: string | null
  variantes: Variante[]
}

export default function ProduitCTA({ boutiqueId, produit, enStock, waUrl, telUrl, variantes }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [selection, setSelection] = useState<Record<string, string>>({})

  const aDesVariantes = variantes.length > 0
  const selectionComplete = !aDesVariantes || variantes.every(v => selection[v.nom])
  const peutCommander = enStock && selectionComplete

  const noteVariantes = aDesVariantes
    ? variantes.map(v => `${v.nom}: ${selection[v.nom] ?? '—'}`).join(', ')
    : undefined

  return (
    <>
      {showModal && (
        <CommanderModal
          boutiqueId={boutiqueId}
          produit={produit}
          onClose={() => setShowModal(false)}
          noteInitiale={noteVariantes}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Sélecteurs de variantes */}
        {aDesVariantes && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {variantes.map(v => (
              <div key={v.nom}>
                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#374151' }}>
                  {v.nom} {!selection[v.nom] && <span style={{ color: '#dc2626', fontWeight: 500 }}>— à choisir</span>}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {v.valeurs.map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSelection(prev => ({ ...prev, [v.nom]: val }))}
                      style={{
                        padding: '7px 16px', borderRadius: 20, border: '2px solid',
                        borderColor: selection[v.nom] === val ? '#C75B00' : '#e5e7eb',
                        background: selection[v.nom] === val ? '#fff7f0' : '#fff',
                        color: selection[v.nom] === val ? '#C75B00' : '#374151',
                        fontWeight: selection[v.nom] === val ? 700 : 500,
                        fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bouton Commander sur le site — prioritaire, en orange */}
        <button
          onClick={() => setShowModal(true)}
          disabled={!peutCommander}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: peutCommander ? '#C75B00' : '#e5e7eb',
            color: peutCommander ? '#fff' : '#9ca3af',
            padding: '14px 24px', borderRadius: 12, border: 'none',
            fontWeight: 800, fontSize: 16, cursor: peutCommander ? 'pointer' : 'not-allowed',
            boxShadow: peutCommander ? '0 4px 14px rgba(199,91,0,.25)' : 'none',
          }}
        >
          🛒 {!enStock ? 'Rupture de stock' : !selectionComplete ? 'Choisissez une option ci-dessus' : 'Commander sur le site'}
        </button>

        {/* WhatsApp — secondaire */}
        {waUrl && (
          <a
            href={waUrl}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#f0fdf4', color: '#16a34a', border: '2px solid #86efac',
              padding: '13px 24px', borderRadius: 12, textDecoration: 'none',
              fontWeight: 700, fontSize: 15,
            }}
          >
            💬 Contacter via WhatsApp
          </a>
        )}

        {/* Téléphone */}
        {telUrl && (
          <a
            href={telUrl}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#fff', color: '#1d4ed8', border: '2px solid #bfdbfe',
              padding: '13px 24px', borderRadius: 12, textDecoration: 'none',
              fontWeight: 700, fontSize: 15,
            }}
          >
            📞 Appeler le vendeur
          </a>
        )}
      </div>
    </>
  )
}
```

Note : les boutons WhatsApp/Téléphone restent cliquables sans sélection complète (canaux hors-site, cf. spec) — seul le bouton "Commander sur le site" est conditionné par `peutCommander`.

- [ ] **Step 4: Vérifier avec tsc**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 5: Vérifier manuellement**

Ouvrir la fiche publique du produit créé en Task 7 (avec Couleur/Taille) :
- Le bouton "Commander sur le site" doit être grisé avec le texte "Choisissez une option ci-dessus".
- Sélectionner une couleur : le bouton reste grisé (taille manquante).
- Sélectionner une taille : le bouton devient actif "Commander sur le site".
- Cliquer dessus : la modale de commande s'ouvre avec le champ "Note / précisions" pré-rempli avec `"Couleur: Rouge, Taille: M"` (éditable).
- Ouvrir la fiche d'un produit sans variantes (créé avant ce chantier) : aucun changement visible, bouton actif dès que le stock est disponible.

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/app/boutiques/[id]/produits/[produitId]/page.tsx frontend-next/src/app/boutiques/[id]/produits/[produitId]/ProduitCTA.tsx frontend-next/src/app/boutiques/[id]/CommanderModal.tsx
git commit -m "feat(boutiques): sélection de variante obligatoire avant commande, reportée dans la note"
```

---

## Auto-revue du plan

**Couverture du spec** :
- Responsive mobile (toute la zone Ma boutique) → Tasks 4 et 5.
- 5 photos par produit → Tasks 2 et 6.
- Variantes simples optionnelles, un seul prix/stock → Tasks 1, 3 et 7.
- Sélection obligatoire côté acheteur + report dans le champ note existant → Task 8.
- Cas limite "au moins 1 photo requise" → Task 6, Step 5.
- Cas limite "nom d'option/valeur dupliqué ignoré silencieusement" → Task 7, Step 2 (`ajouterOption` ne vérifie pas les doublons de nom — c'est volontaire, un vendeur peut vouloir 2 options distinctes ; `ajouterValeur` vérifie `v.valeurs.includes(val)` avant d'ajouter, donc les valeurs dupliquées dans une même option sont bien ignorées, conforme au spec).

**Aucun placeholder** : chaque step contient du code complet, pas de "TODO"/"gérer les erreurs" vague.

**Cohérence des types** : `Variante` défini en Task 7 Step 1 (`BoutiqueClient.tsx`) et redéfini localement en Task 8 Step 3 (`ProduitCTA.tsx`) avec la même forme `{ nom: string; valeurs: string[] }` — cohérent car ce sont deux fichiers/composants indépendants consommant la même donnée JSON, pas d'import croisé nécessaire.
