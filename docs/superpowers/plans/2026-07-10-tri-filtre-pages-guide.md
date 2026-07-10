# Tri et filtres sur les pages guide — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sort/filter capability to `guide-prix` (currently has none on its results list), and add two filters to `guide-achat` (état, disponibilité minimum) plus a "most recent" sort to `guide-immo`, reusing existing CSS classes and patterns from the 3 guide pages that already have tri/filtre.

**Architecture:** All 4 pages are `'use client'` React components making REST calls to the existing Express backend (`/api/produits`, `/api/immo`) via the Next.js `/api/*` rewrite proxy. Sorting is done client-side on the fetched result array (matching the existing pattern in `guide-achat`/`guide-immo`/`guide-forfait`). The état filter on `guide-achat` requires a backend SQL change to aggregate offer état without N+1 fetches; all other changes are frontend-only, since `prixMin`/`prixMax` (guide-prix) and `created_at`/`tri=recent` (guide-immo) already exist server-side.

**Tech Stack:** Next.js 14 (App Router, client components), Express + `pg` (raw SQL, no ORM), PostgreSQL `jsonb` columns.

## Global Constraints

- Reuse existing CSS classes (`.guide-tri-btns`, `.guide-tri-btn`, `.guide-tri-btn.active`, `.budget-pill`, `.guide-field`, `.guide-label`, `.guide-select`) — do not invent new visual styles for tri/filter controls.
- Client-side sort/filter logic follows the existing pattern: a `triPar` state variable, a `sorted = [...results].sort(...)` (or `.filter().sort()`) computed value used in the render, never mutating `results` directly.
- Degrade silently on invalid/empty filter input (no hard validation errors) — consistent with existing budget filters across the 3 guides.
- No new `created_at` column on `produits` or `forfaits_telecom` (per design decision).
- `guide-forfait` is out of scope — no changes.

---

### Task 1: Backend — expose aggregated `etat` on `GET /api/produits`

**Files:**
- Modify: `backend/routes/produits.js:113-132` (the `buildSQL` function used by the list endpoint)
- Test: manual `curl`/PowerShell verification (no existing automated test suite for this route — confirmed no `backend/**/*.test.js` covers `produits.js`)

**Interfaces:**
- Consumes: existing `offres.specs` JSONB column (already populated by `extraireSpecs()` per project docs — `specs->>'etat'` is `'neuf'|'occasion'|'reconditionne'|null`).
- Produces: `GET /api/produits` response rows gain a new field `etats: string[]` (distinct non-null états across the product's in-stock offers, e.g. `["neuf"]`, `["neuf","occasion"]`, or `[]`). A new optional query param `etat` filters rows to those having at least one offer with that état.

- [ ] **Step 1: Read current `buildSQL` and query param destructuring**

Confirm current state at `backend/routes/produits.js:15` (`const { q, categorie, sousType, limit = 20, page = 1, tri, prixMax, prixMin } = req.query;`) and `:113-132` (the `buildSQL` function). No test to run yet — this is a read-only confirmation step.

- [ ] **Step 2: Add `etat` to destructured query params**

In `backend/routes/produits.js`, change line 15 from:

```js
const { q, categorie, sousType, limit = 20, page = 1, tri, prixMax, prixMin } = req.query;
```

to:

```js
const { q, categorie, sousType, limit = 20, page = 1, tri, prixMax, prixMin, etat } = req.query;
```

- [ ] **Step 3: Extend `buildSQL` to aggregate `etats` and filter by `etat`**

In `backend/routes/produits.js`, replace the `buildSQL` function (currently lines 113-132):

```js
    function buildSQL(qCond) {
      return `
        SELECT p.*, c.nom AS categorie_nom,
               MIN(o.prix) AS prix_min,
               MAX(o.prix) AS prix_max,
               COUNT(o.id) AS nb_offres,
               COUNT(*) OVER() AS total_count
        FROM produits p
        LEFT JOIN categories c ON c.id = p.categorie_id
        LEFT JOIN offres o     ON o.produit_id = p.id AND o.stock = true
        WHERE ${qCond}
          AND ${catCondition}
          AND ($3::numeric IS NULL OR o.prix <= $3::numeric)
          AND ($4::numeric IS NULL OR o.prix >= $4::numeric)
          ${sousTypeCondition}
        GROUP BY p.id, c.nom
        HAVING COUNT(o.id) = 0 OR MIN(o.prix) >= 500
        ORDER BY (p.sponsorise = true AND (p.sponsor_jusqu_au IS NULL OR p.sponsor_jusqu_au > NOW())) DESC, ${orderBy}
        LIMIT $5 OFFSET $6`;
    }
```

with:

```js
    function buildSQL(qCond) {
      return `
        SELECT p.*, c.nom AS categorie_nom,
               MIN(o.prix) AS prix_min,
               MAX(o.prix) AS prix_max,
               COUNT(o.id) AS nb_offres,
               COALESCE(jsonb_agg(DISTINCT o.specs->>'etat') FILTER (WHERE o.specs->>'etat' IS NOT NULL), '[]'::jsonb) AS etats,
               COUNT(*) OVER() AS total_count
        FROM produits p
        LEFT JOIN categories c ON c.id = p.categorie_id
        LEFT JOIN offres o     ON o.produit_id = p.id AND o.stock = true
        WHERE ${qCond}
          AND ${catCondition}
          AND ($3::numeric IS NULL OR o.prix <= $3::numeric)
          AND ($4::numeric IS NULL OR o.prix >= $4::numeric)
          AND ($7::text IS NULL OR EXISTS (
                SELECT 1 FROM offres o2
                WHERE o2.produit_id = p.id AND o2.stock = true AND o2.specs->>'etat' = $7
              ))
          ${sousTypeCondition}
        GROUP BY p.id, c.nom
        HAVING COUNT(o.id) = 0 OR MIN(o.prix) >= 500
        ORDER BY (p.sponsorise = true AND (p.sponsor_jusqu_au IS NULL OR p.sponsor_jusqu_au > NOW())) DESC, ${orderBy}
        LIMIT $5 OFFSET $6`;
    }
```

- [ ] **Step 4: Pass `etat` as `$7` when tokens.length <= 1, and shift token params when tokens.length > 1**

The existing code (lines 94-96, 134-135) reserves `$7` onward for search tokens when `tokens.length > 1`. Adding `etat` as a fixed `$7` collides with token params. Read the current logic:

```js
    const tokenParams = tokens.map(t => '%' + t + '%');
    const baseParams  = [q||null, categorieNorm, prixMax||null, prixMin||null, limit, offset];
    ...
    const allParams = tokens.length > 1 ? [...baseParams, ...tokenParams] : baseParams;
```

Replace with `etat` inserted into `baseParams` at position 7, and shift the token placeholder index in `buildQCond` from `7 + i` to `8 + i`:

```js
    const tokenParams = tokens.map(t => '%' + t + '%');
    const baseParams  = [q||null, categorieNorm, prixMax||null, prixMin||null, limit, offset, etat || null];
```

And in `buildQCond` (currently `backend/routes/produits.js:99-111`), change:

```js
      const clauses = tokens.map((_, i) => {
        const pidx = 7 + i;
        return `(p.nom ILIKE $${pidx} OR p.marque ILIKE $${pidx})`;
      });
```

to:

```js
      const clauses = tokens.map((_, i) => {
        const pidx = 8 + i;
        return `(p.nom ILIKE $${pidx} OR p.marque ILIKE $${pidx})`;
      });
```

- [ ] **Step 5: Verify no other `$7`+ references were missed**

Run: `grep -n '\$7\|\$8\|\$9' backend/routes/produits.js` (or use the Grep tool) restricted to the `router.get('/', ...)` handler (lines 13-156). Confirm the only occurrences are the ones just edited (the new `$7::text` etat filter and the shifted `$8 + i` token placeholders). The `similaires` and other routes use their own separate `$` numbering scopes starting fresh — do not touch those.

- [ ] **Step 6: Manual verification — start backend and query**

Run: `npm run dev` (from repo root, starts backend on port 3000). In a separate terminal:

```bash
curl "http://localhost:3000/api/produits?limit=3"
```

Expected: JSON response where each item in `produits` has a new `etats` field (an array, possibly empty `[]`).

```bash
curl "http://localhost:3000/api/produits?etat=neuf&limit=3"
```

Expected: 200 OK, `produits` array where every row's `etats` includes `"neuf"` (or empty array if no neuf products exist in the dev DB — check no 500 error either way).

```bash
curl "http://localhost:3000/api/produits?q=iphone&limit=5"
```

Expected: 200 OK, same multi-token search behavior as before (unaffected by the `$` renumbering) — confirms Step 4 did not break the existing token search path.

- [ ] **Step 7: Commit**

```bash
git add backend/routes/produits.js
git commit -m "feat(produits): expose etats agreges et filtre etat sur GET /api/produits"
```

---

### Task 2: guide-prix — add sort pills to results list

**Files:**
- Modify: `frontend-next/src/app/guide-prix/GuidePrixContent.tsx`

**Interfaces:**
- Consumes: existing `Produit` interface (`id, nom, prix_min, prix_max?, nb_offres, image_url?, categorie?`) already defined at `GuidePrixContent.tsx:8-16`.
- Produces: no new exports; purely internal state (`triPar`) and a `sorted` computed array used in place of `results` in the render.

- [ ] **Step 1: Add `triPar` state**

In `frontend-next/src/app/guide-prix/GuidePrixContent.tsx`, after the existing state declarations (around line 53, after `const [searched, setSearched] = useState(false)`), add:

```tsx
  const [triPar, setTriPar] = useState<'pertinence' | 'prix_asc' | 'prix_desc' | 'nb_offres'>('pertinence')
```

- [ ] **Step 2: Add the `sorted` computed array**

After the `variation` computation (currently ends around line 128, `const variation = ...`), add:

```tsx
  const sortedResults = [...results].sort((a, b) => {
    if (triPar === 'prix_asc')  return a.prix_min - b.prix_min
    if (triPar === 'prix_desc') return b.prix_min - a.prix_min
    if (triPar === 'nb_offres') return b.nb_offres - a.nb_offres
    return 0
  })
```

- [ ] **Step 3: Render sort pills above the results list**

In the JSX, find the results list container (currently starts at line 168: `<div className="guide-prix-liste">`). Immediately before it (still inside `<div className="guide-prix-body">`), add a sort bar. Replace:

```tsx
      <div className="guide-prix-body">
        {/* Liste résultats */}
        <div className="guide-prix-liste">
```

with:

```tsx
      <div className="guide-prix-body">
        {/* Liste résultats */}
        <div>
          {searched && results.length > 0 && (
            <div className="guide-results-header" style={{ marginBottom: 10 }}>
              <span className="guide-results-count">{results.length} résultat{results.length > 1 ? 's' : ''}</span>
              <div className="guide-tri-btns">
                {([
                  ['pertinence', 'Pertinence'],
                  ['prix_asc', '💰 Prix ↑'],
                  ['prix_desc', '💰 Prix ↓'],
                  ['nb_offres', '🏪 Plus d’offres'],
                ] as const).map(([val, label]) => (
                  <button key={val} className={`guide-tri-btn${triPar === val ? ' active' : ''}`} onClick={() => setTriPar(val)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="guide-prix-liste">
```

Then find the closing of that list container. Currently the list `<div className="guide-prix-liste">` closes right before `{/* Détail */}` (around line 203-205):

```tsx
        </div>

        {/* Détail */}
```

Change to add one more closing `</div>` for the new wrapper:

```tsx
          </div>
        </div>

        {/* Détail */}
```

- [ ] **Step 4: Replace `results.map` with `sortedResults.map` in the render**

Find (currently line 181): `{results.map(p => (` inside the results list. Change to:

```tsx
          {sortedResults.map(p => (
```

- [ ] **Step 5: Manual verification in browser**

Run: `cd frontend-next && npm run dev` (port 3001), with backend running on port 3000 (`npm run dev` from repo root in a separate terminal).

Navigate to `http://localhost:3001/guide-prix`, search for a common product (e.g. "iphone"). Confirm:
- The 4 sort pills appear above the result list once results exist.
- Clicking "💰 Prix ↑" reorders the list ascending by `prix_min`.
- Clicking "💰 Prix ↓" reorders descending.
- Clicking "🏪 Plus d'offres" puts the highest `nb_offres` first.
- Clicking a result still opens its detail panel as before (unaffected by the wrapper div change).

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/app/guide-prix/GuidePrixContent.tsx
git commit -m "feat(guide-prix): ajoute le tri (pertinence/prix/nb offres) sur la liste de resultats"
```

---

### Task 3: guide-prix — add price range filter

**Files:**
- Modify: `frontend-next/src/app/guide-prix/GuidePrixContent.tsx`

**Interfaces:**
- Consumes: `GET /api/produits` `prixMin`/`prixMax` query params (already supported server-side, confirmed at `backend/routes/produits.js:15,96,125-126` — no backend change needed).
- Produces: two new state variables `prixMinFiltre`/`prixMaxFiltre`, wired into the existing `search()` function's query string construction.

- [ ] **Step 1: Add price filter state**

In `frontend-next/src/app/guide-prix/GuidePrixContent.tsx`, alongside the `triPar` state added in Task 2, add:

```tsx
  const [prixMinFiltre, setPrixMinFiltre] = useState('')
  const [prixMaxFiltre, setPrixMaxFiltre] = useState('')
```

- [ ] **Step 2: Wire the filter into the `search()` function**

Find the existing `search` function (currently lines 55-70):

```tsx
  async function search(e?: React.FormEvent) {
    e?.preventDefault()
    if (!q.trim() && !categorie) return
    setLoading(true)
    setSelected(null)
    setSearched(true)
    try {
      const qs = new URLSearchParams({ limit: '20' })
      if (q.trim()) qs.set('q', q.trim())
      if (categorie) qs.set('categorie', categorie)
      const r = await fetch(`/api/produits?${qs}`)
      const data = await r.json()
      setResults(data.produits ?? [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }
```

Replace with:

```tsx
  async function search(e?: React.FormEvent) {
    e?.preventDefault()
    if (!q.trim() && !categorie) return
    setLoading(true)
    setSelected(null)
    setSearched(true)
    try {
      const qs = new URLSearchParams({ limit: '20' })
      if (q.trim()) qs.set('q', q.trim())
      if (categorie) qs.set('categorie', categorie)
      const pMin = Number(prixMinFiltre)
      const pMax = Number(prixMaxFiltre)
      const prixValide = !(prixMinFiltre && prixMaxFiltre && pMin > pMax)
      if (prixValide && prixMinFiltre) qs.set('prixMin', prixMinFiltre)
      if (prixValide && prixMaxFiltre) qs.set('prixMax', prixMaxFiltre)
      const r = await fetch(`/api/produits?${qs}`)
      const data = await r.json()
      setResults(data.produits ?? [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }
```

This implements the "min > max → skip filtering silently" rule from the design doc.

- [ ] **Step 3: Render the price filter inputs**

Find the categories row (currently lines 152-162):

```tsx
          <div className="guide-prix-cats">
            <button type="button" onClick={() => { setCategorie(''); search() }}
              className={`budget-pill${categorie === '' ? ' active' : ''}`}>Tous</button>
            {CATEGORIES.map(c => (
              <button key={c.slug} type="button"
                onClick={() => { setCategorie(c.slug); }}
                className={`budget-pill${categorie === c.slug ? ' active' : ''}`}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
```

Immediately after this closing `</div>`, add a price filter row:

```tsx
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <input
              type="number"
              placeholder="Prix min"
              value={prixMinFiltre}
              onChange={e => setPrixMinFiltre(e.target.value)}
              className="guide-prix-input"
              style={{ maxWidth: 140 }}
            />
            <span style={{ color: 'var(--text3)' }}>—</span>
            <input
              type="number"
              placeholder="Prix max"
              value={prixMaxFiltre}
              onChange={e => setPrixMaxFiltre(e.target.value)}
              className="guide-prix-input"
              style={{ maxWidth: 140 }}
            />
            <button type="button" className="guide-prix-btn" onClick={() => search()} disabled={loading}>
              Filtrer
            </button>
          </div>
```

- [ ] **Step 4: Also apply the price filter when a category pill is clicked**

The category "Tous" button already calls `search()` directly (line 153-154), but individual category pills (lines 155-160) only call `setCategorie(c.slug)` without triggering `search()` — this relies on `categorie` being a dependency elsewhere. Confirm this by reading the current file behavior: since `categorie` is plain `useState` with no `useEffect` watching it, clicking a category pill alone does NOT auto-search today (pre-existing behavior, not part of this task). No change needed here — the price filter integrates into `search()`, which is already the single search trigger point (called by form submit and the "Tous" button). Skip this step; it is a no-op confirmation, not a code change.

- [ ] **Step 5: Manual verification in browser**

With both dev servers running, navigate to `http://localhost:3001/guide-prix`. Enter "samsung" in the search box, set Prix min = 50000, Prix max = 200000, click "🔍 Rechercher" (form submit). Confirm the results only include products whose `prix_min`/`prix_max` fall in range (spot-check a couple of result prices). Then set Prix min = 200000, Prix max = 50000 (inverted) and click "Filtrer" — confirm results are NOT empty (the invalid range should be ignored, not applied).

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/app/guide-prix/GuidePrixContent.tsx
git commit -m "feat(guide-prix): ajoute le filtre prix min/max sur la recherche"
```

---

### Task 4: guide-achat — add état filter

**Files:**
- Modify: `frontend-next/src/app/guide-achat/GuideAchatContent.tsx`

**Interfaces:**
- Consumes: `etats: string[]` field now returned by `GET /api/produits` (added in Task 1) — must be added to the local `Produit` interface.
- Consumes: `GET /api/produits?etat=...` query param (added in Task 1).
- Produces: new state `etatFiltre`, included in the `lancer()` fetch's query params.

- [ ] **Step 1: Add `etats` to the `Produit` interface**

In `frontend-next/src/app/guide-achat/GuideAchatContent.tsx`, find the interface (currently lines 30-33):

```tsx
interface Produit {
  id: string; nom: string; prix_min: number; nb_offres: number; image_url?: string; categorie?: string
  _score?: number; _sPrix?: number; _sDispo?: number
}
```

Replace with:

```tsx
interface Produit {
  id: string; nom: string; prix_min: number; nb_offres: number; image_url?: string; categorie?: string
  etats?: string[]
  _score?: number; _sPrix?: number; _sDispo?: number
}
```

- [ ] **Step 2: Add `etatFiltre` state**

Find the state declarations block (currently lines 65-77, ending with `const [triPar, setTriPar] = useState<'score' | 'prix' | 'dispo'>('score')`). Add immediately after:

```tsx
  const [etatFiltre, setEtatFiltre] = useState(searchParams.get('etat') ?? '')
```

- [ ] **Step 3: Wire `etatFiltre` into the URL sync and API call inside `lancer()`**

Find the URL param sync block inside `lancer` (currently lines 90-99):

```tsx
    const urlParams = new URLSearchParams()
    if (q)         urlParams.set('q', q)
    if (cat)       urlParams.set('cat', cat)
    if (budgetMin) urlParams.set('bMin', budgetMin)
    if (budgetMax) urlParams.set('bMax', budgetMax)
    if (profilActif) urlParams.set('profil', profilActif)
    urlParams.set('pp', String(poidsPrix))
    urlParams.set('ps', String(poidsSpecs))
    urlParams.set('pd', String(poidsDispo))
```

Add after `if (budgetMax) urlParams.set('bMax', budgetMax)`:

```tsx
    if (etatFiltre) urlParams.set('etat', etatFiltre)
```

Then find the backend fetch params (currently lines 103-106):

```tsx
      const params = new URLSearchParams({
        q: q || '', categorie: cat, limit: '48', page: '1',
        prixMin: budgetMin || '', prixMax: budgetMax || '', tri: 'pertinence',
      })
```

Replace with:

```tsx
      const params = new URLSearchParams({
        q: q || '', categorie: cat, limit: '48', page: '1',
        prixMin: budgetMin || '', prixMax: budgetMax || '', tri: 'pertinence',
      })
      if (etatFiltre) params.set('etat', etatFiltre)
```

- [ ] **Step 4: Add `etatFiltre` to the `useCallback` dependency array**

Find the closing dependency array of `lancer` (currently line 143):

```tsx
  }, [q, cat, budgetMin, budgetMax, poidsPrix, poidsSpecs, poidsDispo, profilActif, router])
```

Replace with:

```tsx
  }, [q, cat, budgetMin, budgetMax, etatFiltre, poidsPrix, poidsSpecs, poidsDispo, profilActif, router])
```

- [ ] **Step 5: Render the état select in the left panel**

Find the Catégorie field (currently lines 206-214):

```tsx
          <div className="guide-field">
            <label className="guide-label">Catégorie</label>
            <select className="guide-select" value={cat} onChange={e => setCat(e.target.value)}>
              <option value="">Toutes les catégories</option>
              {CATEGORIES.map(c => (
                <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
```

Immediately after this closing `</div>`, add:

```tsx
          <div className="guide-field">
            <label className="guide-label">État</label>
            <select className="guide-select" value={etatFiltre} onChange={e => setEtatFiltre(e.target.value)}>
              <option value="">Tous</option>
              <option value="neuf">Neuf</option>
              <option value="occasion">Occasion</option>
              <option value="reconditionne">Reconditionné</option>
            </select>
          </div>
```

- [ ] **Step 6: Auto-relaunch search when URL already has `etat` param**

Find the auto-launch `useEffect` (currently lines 146-151):

```tsx
  useEffect(() => {
    if (searchParams.get('q') || searchParams.get('cat') || searchParams.get('bMax')) {
      lancer()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
```

Replace the condition with:

```tsx
  useEffect(() => {
    if (searchParams.get('q') || searchParams.get('cat') || searchParams.get('bMax') || searchParams.get('etat')) {
      lancer()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
```

- [ ] **Step 7: Manual verification in browser**

With backend (Task 1 changes applied) and frontend dev servers running, navigate to `http://localhost:3001/guide-achat`. Select "Neuf" in the new État select, enter a search term (e.g. "samsung"), click "🔍 Trouver les meilleurs produits". Confirm the request includes `etat=neuf` (check Network tab) and results load without error. Switch to "Occasion" and re-run — confirm the result set changes (fewer or different products, assuming occasion-tagged offers exist in the dev DB; if the dev DB has none, confirm it returns an empty/valid list rather than a 500).

- [ ] **Step 8: Commit**

```bash
git add frontend-next/src/app/guide-achat/GuideAchatContent.tsx
git commit -m "feat(guide-achat): ajoute le filtre etat (neuf/occasion/reconditionne)"
```

---

### Task 5: guide-achat — add disponibilité minimum filter

**Files:**
- Modify: `frontend-next/src/app/guide-achat/GuideAchatContent.tsx`

**Interfaces:**
- Consumes: existing `nb_offres` field on `Produit` (already present).
- Produces: new state `dispoMin`, applied as a client-side filter on the `scored` array before `setResults`.

- [ ] **Step 1: Add `dispoMin` state**

Add alongside `etatFiltre` (from Task 4, Step 2):

```tsx
  const [dispoMin, setDispoMin] = useState(searchParams.get('dispoMin') ?? '')
```

- [ ] **Step 2: Sync `dispoMin` to the URL**

In the same URL sync block edited in Task 4 Step 3, add after `if (etatFiltre) urlParams.set('etat', etatFiltre)`:

```tsx
    if (dispoMin) urlParams.set('dispoMin', dispoMin)
```

- [ ] **Step 3: Apply the filter client-side after scoring**

Find where `scored` is computed and passed to `setResults` (currently lines 125-136):

```tsx
      const scored = liste.map((p, i) => {
        const sPrix  = prixMinRef / +p.prix_min
        const sp     = specsListe[i]
        const specWins = specKeys.filter(k => sp[k] != null && specMaxes[k] > 0 && sp[k] >= specMaxes[k] * 0.9).length
        const sSpecs = specKeys.length > 0 ? specWins / specKeys.length : 0.5
        const sDispo = (+(p.nb_offres) || 0) / nbOffresMaxRef
        const score  = Math.round(((poidsPrix * sPrix + poidsSpecs * sSpecs + poidsDispo * sDispo) / totalPoids) * 100) / 10
        return { ...p, _score: score, _sPrix: Math.round(sPrix * 100), _sDispo: Math.round(sDispo * 100) }
      })

      setResults(scored)
      setTotal(data.total || scored.length)
```

Replace with:

```tsx
      const scored = liste.map((p, i) => {
        const sPrix  = prixMinRef / +p.prix_min
        const sp     = specsListe[i]
        const specWins = specKeys.filter(k => sp[k] != null && specMaxes[k] > 0 && sp[k] >= specMaxes[k] * 0.9).length
        const sSpecs = specKeys.length > 0 ? specWins / specKeys.length : 0.5
        const sDispo = (+(p.nb_offres) || 0) / nbOffresMaxRef
        const score  = Math.round(((poidsPrix * sPrix + poidsSpecs * sSpecs + poidsDispo * sDispo) / totalPoids) * 100) / 10
        return { ...p, _score: score, _sPrix: Math.round(sPrix * 100), _sDispo: Math.round(sDispo * 100) }
      })

      const dispoMinNum = Number(dispoMin) || 0
      const filtered = dispoMinNum > 0 ? scored.filter(p => (+p.nb_offres || 0) >= dispoMinNum) : scored

      setResults(filtered)
      setTotal(dispoMinNum > 0 ? filtered.length : (data.total || scored.length))
```

- [ ] **Step 4: Add `dispoMin` to the `useCallback` dependency array**

In the same dependency array edited in Task 4 Step 4, add `dispoMin`:

```tsx
  }, [q, cat, budgetMin, budgetMax, etatFiltre, dispoMin, poidsPrix, poidsSpecs, poidsDispo, profilActif, router])
```

- [ ] **Step 5: Render the disponibilité minimum input**

Add immediately after the État select block (from Task 4 Step 5):

```tsx
          <div className="guide-field">
            <label className="guide-label">Disponible chez au moins</label>
            <input
              className="guide-input" type="number" min={0}
              placeholder="ex: 2 marchands"
              value={dispoMin} onChange={e => setDispoMin(e.target.value)}
            />
          </div>
```

- [ ] **Step 6: Extend the auto-launch `useEffect` condition**

In the `useEffect` edited in Task 4 Step 6, add `dispoMin` to the condition:

```tsx
  useEffect(() => {
    if (searchParams.get('q') || searchParams.get('cat') || searchParams.get('bMax') || searchParams.get('etat') || searchParams.get('dispoMin')) {
      lancer()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
```

- [ ] **Step 7: Manual verification in browser**

Navigate to `http://localhost:3001/guide-achat`. Search "samsung" with "Disponible chez au moins" = 2, click "Trouver". Confirm every result card shown corresponds to a product with `nb_offres >= 2` (cross-check by opening a couple of result product pages and counting merchant offers, or by temporarily logging `nb_offres` in the browser console). Set the field to 0 or empty and re-run — confirm the filter no longer restricts results (back to the full scored list).

- [ ] **Step 8: Commit**

```bash
git add frontend-next/src/app/guide-achat/GuideAchatContent.tsx
git commit -m "feat(guide-achat): ajoute le filtre disponibilite minimum (nb marchands)"
```

---

### Task 6: guide-immo — add "Plus récent" sort

**Files:**
- Modify: `frontend-next/src/app/guide-immo/GuideImmoContent.tsx`

**Interfaces:**
- Consumes: `created_at` field, already present in the raw API response from `GET /api/immo` (`SELECT *` includes it per `backend/routes/immo.js:55`) but not yet declared in the local `AnnonceImmo` interface.
- Produces: extends the existing `triPar` union type with `'recent'`, adds a 4th sort button.

- [ ] **Step 1: Add `created_at` to the `AnnonceImmo` interface**

In `frontend-next/src/app/guide-immo/GuideImmoContent.tsx`, find the interface (currently lines 31-36):

```tsx
interface AnnonceImmo {
  id: string; titre: string; prix: number; transaction: string; type_bien: string
  ville?: string; surface?: number; image_url?: string; description?: string
  nb_pieces?: number; meuble?: boolean
  _score?: number; _sPrix?: number; _sSurface?: number
}
```

Replace with:

```tsx
interface AnnonceImmo {
  id: string; titre: string; prix: number; transaction: string; type_bien: string
  ville?: string; surface?: number; image_url?: string; description?: string
  nb_pieces?: number; meuble?: boolean; created_at?: string
  _score?: number; _sPrix?: number; _sSurface?: number
}
```

- [ ] **Step 2: Extend the `triPar` type and the `sorted` computation**

Find the `triPar` state declaration (currently line 55):

```tsx
  const [triPar, setTriPar]             = useState<'score' | 'prix' | 'surface'>('score')
```

Replace with:

```tsx
  const [triPar, setTriPar]             = useState<'score' | 'prix' | 'surface' | 'recent'>('score')
```

Find the `sorted` computation (currently lines 126-130):

```tsx
  const sorted = [...results].sort((a, b) => {
    if (triPar === 'prix')    return +a.prix - +b.prix
    if (triPar === 'surface') return (b.surface ?? 0) - (a.surface ?? 0)
    return (b._score ?? 0) - (a._score ?? 0)
  })
```

Replace with:

```tsx
  const sorted = [...results].sort((a, b) => {
    if (triPar === 'prix')    return +a.prix - +b.prix
    if (triPar === 'surface') return (b.surface ?? 0) - (a.surface ?? 0)
    if (triPar === 'recent')  return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    return (b._score ?? 0) - (a._score ?? 0)
  })
```

- [ ] **Step 3: Add the 4th sort button**

Find the tri buttons render (currently lines 284-290):

```tsx
                <div className="guide-tri-btns">
                  {(['score', 'prix', 'surface'] as const).map(t => (
                    <button key={t} className={`guide-tri-btn${triPar === t ? ' active' : ''}`} onClick={() => setTriPar(t)}>
                      {t === 'score' ? '🏆 Score' : t === 'prix' ? '💰 Prix' : '📐 Surface'}
                    </button>
                  ))}
                </div>
```

Replace with:

```tsx
                <div className="guide-tri-btns">
                  {(['score', 'prix', 'surface', 'recent'] as const).map(t => (
                    <button key={t} className={`guide-tri-btn${triPar === t ? ' active' : ''}`} onClick={() => setTriPar(t)}>
                      {t === 'score' ? '🏆 Score' : t === 'prix' ? '💰 Prix' : t === 'surface' ? '📐 Surface' : '🆕 Récent'}
                    </button>
                  ))}
                </div>
```

- [ ] **Step 4: Manual verification in browser**

With backend and frontend dev servers running, navigate to `http://localhost:3001/guide-immo`. Set a broad filter (e.g. Ville = Dakar, Budget max = a high number) and click "🏡 Trouver mon logement idéal". Once results appear, click "🆕 Récent" and confirm the order changes to most-recently-created annonces first. Click back to "🏆 Score" and confirm it reverts correctly.

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/app/guide-immo/GuideImmoContent.tsx
git commit -m "feat(guide-immo): ajoute le tri par date de publication (plus recent)"
```

---

## Self-Review Notes

- **Spec coverage:** guide-prix tri (Task 2) ✓, guide-prix filtre prix (Task 3) ✓, guide-achat filtre état + backend support (Tasks 1, 4) ✓, guide-achat filtre disponibilité (Task 5) ✓, guide-immo tri récent (Task 6) ✓, guide-forfait no changes ✓ (no task needed).
- **Placeholder scan:** no TBD/TODO; every step has literal before/after code blocks with exact line references from the files as read during planning.
- **Type consistency:** `Produit.etats?: string[]` (Task 4) matches the backend's `jsonb_agg(...) AS etats` (Task 1) which serializes to a JSON array of strings. `AnnonceImmo.created_at?: string` (Task 6) matches Postgres `timestamptz` serialized as ISO string over JSON, consumed via `new Date(...)`. `triPar` union types are extended consistently between state declaration and the `sorted`/button-render usages within each file.
- **Line numbers are current as of this plan's authoring** — if prior tasks in this same plan shift line numbers within the same file (e.g. Task 5 edits code that Task 4 already touched in `GuideAchatContent.tsx`), Task 5's steps reference the state/logic by content (not stale absolute line numbers) to stay correct after Task 4's edits land.
