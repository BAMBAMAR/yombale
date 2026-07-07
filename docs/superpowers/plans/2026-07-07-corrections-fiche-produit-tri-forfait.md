# Corrections fiche produit, tri des listes et filtre opérateur — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger 4 insuffisances UX remontées sur Nopalou : bouton "Acheter" peu visible sur la fiche produit, lignes non cliquables dans le tableau de produits similaires, absence de tri sur Produits/Annonces/Boutiques, absence de filtre Opérateur dans le wizard "Trouver mon forfait".

**Architecture:** Toutes les modifications sont de l'UI Next.js (App Router, Server Components pour les pages de liste, un petit composant client dédié pour la ligne de tableau interactive) branchées sur des capacités backend déjà largement existantes (`tri` sur `/api/produits`, `/api/telecom`, données `operateur` déjà en base). Seul le tri sur `/api/annonces` nécessite un ajout backend (nouveau paramètre `tri`, même pattern que `produits.js`/`immo.js`). Le tri sur `/api/boutiques` nécessite un ajout backend qui préserve explicitement l'ordre commercial par défaut (plan payant > sponsorisé > récent) quand aucun tri n'est demandé.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Express, PostgreSQL (`pg`).

## Global Constraints

- Toute query de liste reste paginée avec les mêmes limites actuelles (`LIMIT`/`OFFSET`, max 50 par page) — ne pas changer la pagination existante.
- Le style visuel (classes CSS) suit le pattern déjà en place : pills `budget-pill`/`active` pour le tri, cohérent avec `immo/page.tsx` et `telecom/TelecomClient.tsx`.
- Sur `/api/boutiques`, si `tri` n'est pas fourni (absent ou vide), l'`ORDER BY` actuel (plan Business > Pro > gratuit, puis sponsorisé, puis `created_at DESC`) doit rester strictement inchangé — c'est un ordre de mise en avant commerciale, pas un défaut arbitraire.
- Ne jamais imbriquer un `<a>` (Next.js `Link`) directement comme enfant d'un `<tbody>`/`<tr>` en le faisant passer pour une ligne de tableau — c'est du HTML invalide, source de bugs de rendu navigateur. Les lignes de tableau cliquables passent par un composant client avec `onClick` + `useRouter().push(...)`, jamais par un `Link` maquillé en `<tr>`.
- Aucune nouvelle dépendance npm.

---

### Task 1: Déplacer le bouton "Acheter" dans le header de la fiche produit

**Files:**
- Modify: `frontend-next/src/app/produit/[id]/page.tsx:363-419`

**Interfaces:**
- Consumes: `best` (variable existante dans le composant, objet `Offre | undefined` représentant l'offre au prix le plus bas), `produit` (objet `Produit`).
- Produces: rien de nouveau consommé par d'autres tâches.

- [ ] **Step 1: Repérer le bloc actuel**

Le header actuel (lignes 363-386) :

```tsx
<div className="produit-fiche-header">
  <div className="produit-fiche-top">
    {produit.marque && <span className="marque-badge">{produit.marque}</span>}
    {(produit.categorie_nom ?? produit.categorie) && (
      <Link href={`/?categorie=${produit.categorie}`} className="categ-tag">
        {produit.categorie_nom ?? produit.categorie}
      </Link>
    )}
  </div>
  <div className="produit-fiche-nom-row">
    {produit.image_url && (
      <div className="produit-fiche-img">
        <ExternalImg src={produit.image_url} alt={produit.nom} style={{ width: '100%', height: '100%', objectFit: 'contain' }} loading="eager" />
      </div>
    )}
    <h1 className="produit-fiche-nom">{produit.nom}</h1>
  </div>
  <div className="forfait-fiche-prix-row">
    <span className="forfait-fiche-prix">{prixMin ? fcfa(prixMin) : '—'}</span>
    {best?.marchand_nom && (
      <span className="forfait-fiche-duree">chez {best.marchand_nom}</span>
    )}
  </div>
</div>
```

Le CTA actuel, plus bas (lignes 414-419), à supprimer de cet emplacement :

```tsx
{/* CTA principal */}
{best?.url_achat && (
  <a href={`/api/click/${best.id}`} target="_blank" rel="noopener noreferrer" className="cta-acheter">
    🛒 Acheter au meilleur prix →
  </a>
)}
```

- [ ] **Step 2: Déplacer le CTA dans `.produit-fiche-nom-row`**

Remplacer le bloc `produit-fiche-header` (lignes 363-386) par :

```tsx
<div className="produit-fiche-header">
  <div className="produit-fiche-top">
    {produit.marque && <span className="marque-badge">{produit.marque}</span>}
    {(produit.categorie_nom ?? produit.categorie) && (
      <Link href={`/?categorie=${produit.categorie}`} className="categ-tag">
        {produit.categorie_nom ?? produit.categorie}
      </Link>
    )}
  </div>
  <div className="produit-fiche-nom-row produit-fiche-nom-row--avec-cta">
    {produit.image_url && (
      <div className="produit-fiche-img">
        <ExternalImg src={produit.image_url} alt={produit.nom} style={{ width: '100%', height: '100%', objectFit: 'contain' }} loading="eager" />
      </div>
    )}
    <h1 className="produit-fiche-nom">{produit.nom}</h1>
    {best?.url_achat && (
      <a href={`/api/click/${best.id}`} target="_blank" rel="noopener noreferrer" className="cta-acheter cta-acheter--header">
        🛒 Acheter →
      </a>
    )}
  </div>
  <div className="forfait-fiche-prix-row">
    <span className="forfait-fiche-prix">{prixMin ? fcfa(prixMin) : '—'}</span>
    {best?.marchand_nom && (
      <span className="forfait-fiche-duree">chez {best.marchand_nom}</span>
    )}
  </div>
</div>
```

Puis supprimer entièrement l'ancien bloc CTA (lignes 414-419, le commentaire `{/* CTA principal */}` et les 4 lignes qui suivent).

- [ ] **Step 3: Ajouter le CSS pour le nouveau placement**

Dans `frontend-next/src/app/globals.css`, juste après la règle existante `.produit-fiche-nom-row` (ligne 275-280) :

```css
.produit-fiche-nom-row--avec-cta {
  flex-wrap: wrap;
  justify-content: space-between;
}

.produit-fiche-nom-row--avec-cta .produit-fiche-nom {
  flex: 1 1 auto;
}

.cta-acheter--header {
  display: inline-block;
  width: auto;
  margin-left: auto;
  padding: 10px 20px;
  font-size: 15px;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .cta-acheter--header {
    width: 100%;
    margin-left: 0;
    text-align: center;
  }
}
```

- [ ] **Step 4: Vérifier visuellement**

Run: `cd frontend-next && npm run dev`
Ouvrir `http://localhost:3001/produit/<un-id-existant>` (n'importe quel produit avec au moins une offre valide — vérifier avec `psql` ou l'admin si besoin d'un ID précis).
Expected: le bouton "🛒 Acheter →" apparaît à droite du nom du produit sur desktop (largeur > 640px), et en pleine largeur sous le nom sur une fenêtre réduite à moins de 640px. Le bloc de métriques (marchands/prix min/max) juste en dessous n'a plus de CTA après lui.

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/app/produit/[id]/page.tsx frontend-next/src/app/globals.css
git commit -m "fix: deplace le bouton Acheter a cote du nom sur la fiche produit"
```

---

### Task 2: Rendre cliquables les lignes du tableau "Comparer les prix du marché"

**Files:**
- Create: `frontend-next/src/app/produit/[id]/SimilRow.tsx`
- Modify: `frontend-next/src/app/produit/[id]/page.tsx:589-638`

**Interfaces:**
- Consumes: `lignes[i]` (objet local calculé dans `page.tsx`, forme `{ id: string, nom: string, image_url: string | null, px: number | null, nb: number, courant: boolean }`), `ecartPct: number | null`, `isBest: boolean` — tous déjà calculés dans la boucle `.map()` existante.
- Produces: composant client `SimilRow` avec props `{ id: string, courant: boolean, href: string, children: React.ReactNode }`, consommé uniquement par `page.tsx` dans cette même tâche.

Le fichier `page.tsx` est un Server Component (pas de `'use client'`, pas de `useRouter`). Pour rendre toute la ligne cliquable sans imbriquer un `<a>` invalide dans un `<tbody>`, on extrait un petit composant client `SimilRow` qui rend une vraie `<tr>` avec un `onClick` + navigation via `useRouter().push(...)` — le `<td>` interne "Voir →" reste un simple `<span>` visuel, plus besoin d'un lien séparé.

- [ ] **Step 1: Créer le composant client `SimilRow`**

Créer `frontend-next/src/app/produit/[id]/SimilRow.tsx` :

```tsx
'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode, KeyboardEvent } from 'react'

interface Props {
  id: string
  courant: boolean
  children: ReactNode
}

export default function SimilRow({ id, courant, children }: Props) {
  const router = useRouter()

  if (courant) {
    return <tr className="simil-row simil-row--courant">{children}</tr>
  }

  function goTo() {
    router.push(`/produit/${id}`)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTableRowElement>) {
    if (e.key === 'Enter') goTo()
  }

  return (
    <tr
      className="simil-row simil-row--cliquable"
      onClick={goTo}
      onKeyDown={onKeyDown}
      role="link"
      tabIndex={0}
    >
      {children}
    </tr>
  )
}
```

- [ ] **Step 2: Utiliser `SimilRow` dans `page.tsx`**

Ajouter l'import en haut de `frontend-next/src/app/produit/[id]/page.tsx` (à côté des autres imports, ex. après la ligne `import SponsoringProduitBtn from './SponsoringProduitBtn';`) :

```tsx
import SimilRow from './SimilRow';
```

Remplacer le bloc de rendu de ligne (lignes 594-637) :

```tsx
return (
  <tr key={l.id} className={`simil-row${l.courant ? ' simil-row--courant' : ''}`}>
    <td>
      <div className="simil-produit-cell">
        <div className="simil-img-wrap">
          <ExternalImg src={l.image_url} alt={l.nom} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div>
          <span className="simil-nom">{l.nom}</span>
          {l.courant && <span className="simil-courant-badge">Ce produit</span>}
        </div>
      </div>
    </td>
    <td>
      <span className={`simil-prix-val${isBest ? ' simil-prix-val--best' : ''}`}>
        {l.px ? fcfa(l.px) : '—'}
        {isBest && <span className="simil-best-ico"> 🏆</span>}
      </span>
    </td>
    <td>
      <span className="simil-offres-val">
        {l.nb > 0 ? `${l.nb} offre${l.nb > 1 ? 's' : ''}` : '—'}
      </span>
    </td>
    <td>
      {l.courant ? (
        <span className="simil-ecart simil-ecart--egale">référence</span>
      ) : (
        <span className={`simil-ecart ${ecartPct !== null && ecartPct < -2 ? 'simil-ecart--moins' : ecartPct !== null && ecartPct > 2 ? 'simil-ecart--plus' : 'simil-ecart--egale'}`}>
          {ecartPct === null ? '—'
            : ecartPct < -2 ? `${ecartPct}% moins cher`
            : ecartPct > 2  ? `+${ecartPct}% plus cher`
            : '≈ même prix'}
        </span>
      )}
    </td>
    <td>
      {l.courant
        ? <span className="simil-courant-lbl">Vous êtes ici</span>
        : <Link href={`/produit/${l.id}`} className="simil-voir-btn">Voir →</Link>
      }
    </td>
  </tr>
)
```

Par :

```tsx
return (
  <SimilRow key={l.id} id={l.id} courant={l.courant}>
    <td>
      <div className="simil-produit-cell">
        <div className="simil-img-wrap">
          <ExternalImg src={l.image_url} alt={l.nom} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div>
          <span className="simil-nom">{l.nom}</span>
          {l.courant && <span className="simil-courant-badge">Ce produit</span>}
        </div>
      </div>
    </td>
    <td>
      <span className={`simil-prix-val${isBest ? ' simil-prix-val--best' : ''}`}>
        {l.px ? fcfa(l.px) : '—'}
        {isBest && <span className="simil-best-ico"> 🏆</span>}
      </span>
    </td>
    <td>
      <span className="simil-offres-val">
        {l.nb > 0 ? `${l.nb} offre${l.nb > 1 ? 's' : ''}` : '—'}
      </span>
    </td>
    <td>
      {l.courant ? (
        <span className="simil-ecart simil-ecart--egale">référence</span>
      ) : (
        <span className={`simil-ecart ${ecartPct !== null && ecartPct < -2 ? 'simil-ecart--moins' : ecartPct !== null && ecartPct > 2 ? 'simil-ecart--plus' : 'simil-ecart--egale'}`}>
          {ecartPct === null ? '—'
            : ecartPct < -2 ? `${ecartPct}% moins cher`
            : ecartPct > 2  ? `+${ecartPct}% plus cher`
            : '≈ même prix'}
        </span>
      )}
    </td>
    <td>
      {l.courant
        ? <span className="simil-courant-lbl">Vous êtes ici</span>
        : <span className="simil-voir-btn">Voir →</span>
      }
    </td>
  </SimilRow>
)
```

Note : le `key={l.id}` se déplace de `<tr>` vers `<SimilRow>` (le composant racine de la boucle `.map()`). Le `<span className="simil-voir-btn">` remplace le `<Link>` interne — plus besoin d'un lien séparé puisque toute la ligne l'est désormais via `SimilRow`.

- [ ] **Step 3: CSS — curseur sur les lignes cliquables**

Dans `frontend-next/src/app/globals.css`, juste après la règle existante `.simil-row` (ligne 6963-6968), ajouter :

```css
.simil-row--cliquable {
  cursor: pointer;
}

.simil-row--cliquable:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}
```

- [ ] **Step 4: Vérifier visuellement**

Run: `cd frontend-next && npm run dev` (si pas déjà lancé)
Ouvrir une fiche produit ayant au moins un produit similaire (section "📊 Comparer les prix du marché" visible en bas de page).
Expected: cliquer n'importe où sur une ligne non-courante (pas seulement le badge "Voir →") navigue vers `/produit/{id}` du produit similaire. La ligne "Vous êtes ici" (produit courant) reste non cliquable, sans curseur pointer. Naviguer au clavier (Tab jusqu'à la ligne, puis Entrée) déclenche aussi la navigation.

- [ ] **Step 5: Commit**

```bash
git add "frontend-next/src/app/produit/[id]/page.tsx" "frontend-next/src/app/produit/[id]/SimilRow.tsx" frontend-next/src/app/globals.css
git commit -m "fix: rend cliquable toute la ligne du tableau produits similaires"
```

---

### Task 3: Tri sur la page Produits (accueil)

**Files:**
- Modify: `frontend-next/src/app/page.tsx`
- Modify: `frontend-next/src/app/ProduitsListe.tsx`

**Interfaces:**
- Consumes: aucune nouvelle donnée externe — `tri` est un query param string, déjà accepté par `GET /api/produits` (`backend/routes/produits.js:15,18-21`, valeurs `prix_asc | prix_desc | nom_asc`, défaut popularité).
- Produces: prop `tri: string` ajoutée à `ProduitsListe`, consommée uniquement en interne (pas d'autre tâche n'en dépend).

- [ ] **Step 1: `page.tsx` — lire et propager `tri`**

Dans `frontend-next/src/app/page.tsx`, modifier la signature de `HomePage` (ligne 60-64) :

```tsx
export default async function HomePage({
  searchParams,
}: {
  searchParams: { q?: string; categorie?: string; prixMax?: string; page?: string; tri?: string }
}) {
```

Ajouter la lecture de `tri` juste après `page` (ligne 68) :

```tsx
  const page      = searchParams.page      ?? '1'
  const tri       = searchParams.tri       ?? ''
```

Dans le bloc `try` de fetch (lignes 74-80), ajouter `tri` aux params avant l'appel fetch :

```tsx
  try {
    const params = new URLSearchParams({ limit: '24', page })
    if (q)         params.set('q',         q)
    if (categorie) params.set('categorie', categorie)
    if (prixMax)   params.set('prixMax',   prixMax)
    if (tri)       params.set('tri',       tri)

    const r = await fetch(`${BACKEND}/api/produits?${params}`, { cache: 'no-store', headers: SSR_HEADERS })
```

- [ ] **Step 2: `page.tsx` — ajouter la rangée de pills de tri**

Définir la constante `TRIS` juste après `BUDGETS` (après ligne 41) :

```tsx
const TRIS = [
  { val: '',          label: 'Pertinence' },
  { val: 'prix_asc',  label: 'Prix ↑' },
  { val: 'prix_desc', label: 'Prix ↓' },
  { val: 'nom_asc',   label: 'Nom A-Z' },
]
```

Après la rangée `filtres-bar` existante (lignes 167-187), ajouter une nouvelle rangée juste avant `{/* ── Récemment consultés ── */}` (ligne 189) :

```tsx
      {/* ── Tri ──────────────────────────────────────────────────── */}
      <div className="filtres-bar">
        <span className="filtres-label">Trier :</span>
        {TRIS.map((t) => {
          const ps = new URLSearchParams()
          if (q)         ps.set('q',         q)
          if (categorie) ps.set('categorie', categorie)
          if (prixMax)   ps.set('prixMax',   prixMax)
          if (t.val)     ps.set('tri',       t.val)
          return (
            <Link
              key={t.val || 'defaut'}
              href={`/?${ps}`}
              className={`budget-pill${tri === t.val ? ' active' : ''}`}
            >
              {t.label}
            </Link>
          )
        })}
      </div>
```

- [ ] **Step 3: `page.tsx` — transmettre `tri` à `ProduitsListe` et l'inclure dans la `key`**

Modifier l'appel à `<ProduitsListe>` (lignes 199-206) :

```tsx
        <ProduitsListe
          key={`${q}-${categorie}-${prixMax}-${tri}`}
          initialProduits={produits}
          total={total}
          q={q}
          categorie={categorie}
          prixMax={prixMax}
          tri={tri}
        />
```

- [ ] **Step 4: `ProduitsListe.tsx` — accepter et utiliser `tri`**

Modifier `Props` (lignes 20-26) :

```tsx
interface Props {
  initialProduits: Produit[]
  total: number
  q: string
  categorie: string
  prixMax: string
  tri: string
}
```

Modifier la signature du composant (ligne 28) :

```tsx
export default function ProduitsListe({ initialProduits, total, q, categorie, prixMax, tri }: Props) {
```

Modifier `voirPlus()` (lignes 35-51) pour inclure `tri` dans les params de la page suivante :

```tsx
  async function voirPlus() {
    setLoading(true)
    try {
      const nextPage = page + 1
      const params   = new URLSearchParams({ limit: '24', page: String(nextPage) })
      if (q)         params.set('q',         q)
      if (categorie) params.set('categorie', categorie)
      if (prixMax)   params.set('prixMax',   prixMax)
      if (tri)       params.set('tri',       tri)

      const r    = await fetch(`/api/produits?${params}`)
      const data = await r.json()
      const next: Produit[] = data.produits ?? data.data ?? []
      setProduits(prev => [...prev, ...next])
      setPage(nextPage)
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }
```

- [ ] **Step 5: Vérifier visuellement**

Run: `cd frontend-next && npm run dev` (si pas déjà lancé)
Ouvrir `http://localhost:3001/`
Expected: une rangée "Trier :" apparaît avec les pills Pertinence/Prix ↑/Prix ↓/Nom A-Z. Cliquer sur "Prix ↑" recharge la page avec `?tri=prix_asc` dans l'URL et affiche les produits du moins cher au plus cher. Cliquer sur "Voir plus" charge la page suivante en conservant le même tri (vérifiable en observant que l'ordre reste croissant sur les nouveaux produits chargés).

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/app/page.tsx frontend-next/src/app/ProduitsListe.tsx
git commit -m "feat: ajoute le tri (prix/nom) sur la page d'accueil produits"
```

---

### Task 4: Tri sur la page Annonces (backend + frontend)

**Files:**
- Modify: `backend/routes/annonces.js:109-138`
- Modify: `frontend-next/src/app/annonces/page.tsx`

**Interfaces:**
- Consumes: aucune.
- Produces: nouveau paramètre `tri` accepté par `GET /api/annonces` (valeurs `recent` [défaut] | `prix_asc` | `prix_desc`), consommé uniquement par ce même endpoint.

- [ ] **Step 1: Backend — ajouter le paramètre `tri`**

Dans `backend/routes/annonces.js`, remplacer la route `GET /` (lignes 109-138) :

```js
router.get('/', blockScraperUA, tokenOptional, limiterBulk, async (req, res) => {
  try {
    const { categorie, ville, q, utilisateur_id, tri, limit = 20, page = 1 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
    const lim    = Math.min(50, parseInt(limit));
    const conds  = ['actif=true', 'supprimee=false'];
    const vals   = [];

    if (categorie)      { vals.push(categorie);       conds.push(`categorie_slug=$${vals.length}`); }
    if (ville)          { vals.push(ville);            conds.push(`ville ILIKE $${vals.length}`); }
    if (utilisateur_id) { vals.push(utilisateur_id);   conds.push(`utilisateur_id=$${vals.length}`); }
    if (q) {
      vals.push(`%${q}%`);
      conds.push(`(titre ILIKE $${vals.length} OR description ILIKE $${vals.length})`);
    }

    const orderBy = tri === 'prix_asc'  ? 'prix ASC NULLS LAST'
                  : tri === 'prix_desc' ? 'prix DESC NULLS LAST'
                  :                       'created_at DESC';

    const where = 'WHERE ' + conds.join(' AND ');
    const [rows, cnt] = await Promise.all([
      pool.query(
        `SELECT id, categorie_slug, titre, description, prix, ville, quartier,
                contact_nom, contact_tel, photos, caracteristiques, created_at
         FROM annonces_classifiees ${where}
         ORDER BY ${orderBy} LIMIT $${vals.length+1} OFFSET $${vals.length+2}`,
        [...vals, lim, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM annonces_classifiees ${where}`, vals),
    ]);
    res.json({ annonces: rows.rows, total: parseInt(cnt.rows[0].count), page: parseInt(page) });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});
```

- [ ] **Step 2: Vérifier manuellement l'endpoint backend**

Run (backend démarré sur le port 3000, `npm run dev` à la racine si pas déjà lancé) :

```bash
curl.exe "http://localhost:3000/api/annonces?tri=prix_asc&limit=5"
```

Expected: réponse JSON `{ annonces: [...], total: N, page: 1 }` avec les annonces triées par `prix` croissant (les annonces avec `prix` NULL en fin de liste).

- [ ] **Step 3: Frontend — ajouter `tri` aux searchParams et au fetch**

Dans `frontend-next/src/app/annonces/page.tsx`, modifier `fetchAnnonces` (lignes 34-42) :

```tsx
async function fetchAnnonces(categorie: string, page: number, tri: string) {
  const params = new URLSearchParams({ limit: '24', page: String(page) })
  if (categorie) params.set('categorie', categorie)
  if (tri)       params.set('tri', tri)
  try {
    const r = await fetch(`${BACKEND}/api/annonces?${params}`, { headers: SSR_HEADERS, next: { revalidate: 60 } })
    if (!r.ok) return { annonces: [], total: 0 }
    return r.json()
  } catch { return { annonces: [], total: 0 } }
}
```

Modifier la signature de `AnnoncesPage` et l'appel à `fetchAnnonces` (lignes 83-91) :

```tsx
export default async function AnnoncesPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; page?: string; tri?: string }>
}) {
  const { categorie = '', page: pageStr = '1', tri = '' } = await searchParams
  const page = Math.max(1, parseInt(pageStr))

  const { annonces, total } = await fetchAnnonces(categorie, page, tri)
```

- [ ] **Step 4: Frontend — ajouter la rangée de pills et propager `tri` dans `pageUrl`**

Ajouter la constante `TRIS` après `CATEGORIES` (après ligne 19) :

```tsx
const TRIS = [
  { val: '',          label: 'Récent' },
  { val: 'prix_asc',  label: 'Prix ↑' },
  { val: 'prix_desc', label: 'Prix ↓' },
]
```

Modifier `pageUrl` (lignes 96-102) pour conserver `tri` lors de la pagination :

```tsx
  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (categorie) params.set('categorie', categorie)
    if (tri)       params.set('tri', tri)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/annonces${qs ? `?${qs}` : ''}`
  }
```

Ajouter une rangée de pills juste après le bloc `{/* Filtres catégories */}` (après ligne 135, avant `{/* Grille */}`) :

```tsx
      {/* Tri */}
      <div className="annonces-cats" style={{ marginTop: 8 }}>
        <span className="filtres-label">Trier :</span>
        {TRIS.map(t => {
          const params = new URLSearchParams()
          if (categorie) params.set('categorie', categorie)
          if (t.val)     params.set('tri', t.val)
          const href = `/annonces${params.toString() ? `?${params}` : ''}`
          return (
            <Link
              key={t.val || 'defaut'}
              href={href}
              className={`annonces-cat-pill${tri === t.val ? ' annonces-cat-pill--active' : ''}`}
            >
              {t.label}
            </Link>
          )
        })}
      </div>
```

- [ ] **Step 5: Vérifier visuellement**

Run: `cd frontend-next && npm run dev` (si pas déjà lancé)
Ouvrir `http://localhost:3001/annonces`
Expected: rangée "Trier :" avec pills Récent/Prix ↑/Prix ↓ sous les catégories. Cliquer sur "Prix ↑" recharge avec `?tri=prix_asc`, l'ordre des annonces affichées change en conséquence. Naviguer en page 2 avec un tri actif conserve `tri` dans l'URL.

- [ ] **Step 6: Commit**

```bash
git add backend/routes/annonces.js frontend-next/src/app/annonces/page.tsx
git commit -m "feat: ajoute le tri (recent/prix) sur la page Annonces"
```

---

### Task 5: Tri sur la page Boutiques (backend + frontend, sans casser l'ordre commercial par défaut)

**Files:**
- Modify: `backend/routes/boutiques.js:122-157`
- Modify: `frontend-next/src/app/boutiques/page.tsx`

**Interfaces:**
- Consumes: aucune.
- Produces: nouveau paramètre `tri` accepté par `GET /api/boutiques` (valeurs `''`/absent [défaut = ordre commercial actuel] | `recent` | `nom_asc`), consommé uniquement par ce même endpoint.

- [ ] **Step 1: Backend — ajouter le paramètre `tri` sans casser le défaut**

Dans `backend/routes/boutiques.js`, remplacer la route `GET /` (lignes 122-157) :

```js
router.get('/', async (req, res) => {
  try {
    const { ville, q, tri, limit = 20, page = 1 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
    const lim = Math.min(50, parseInt(limit));
    const conds = ['actif=true'];
    const vals = [];

    if (ville) { vals.push(ville); conds.push(`ville ILIKE $${vals.length}`); }
    if (q) { vals.push(`%${q}%`); conds.push(`(nom ILIKE $${vals.length} OR description ILIKE $${vals.length})`); }

    const orderBy = tri === 'recent'  ? 'b.created_at DESC'
                  : tri === 'nom_asc' ? 'b.nom ASC'
                  : `CASE a.plan WHEN 'business' THEN 0 WHEN 'pro' THEN 1 ELSE 2 END ASC,
                     (b.sponsorise = true AND (b.sponsor_jusqu_au IS NULL OR b.sponsor_jusqu_au > NOW())) DESC,
                     b.created_at DESC`;

    const where = 'WHERE ' + conds.join(' AND ');
    const [rows, cnt] = await Promise.all([
      pool.query(
        `SELECT b.id, b.nom, b.description, b.categorie, b.telephone, b.adresse, b.ville,
                b.logo_url, b.sponsorise, b.sponsor_jusqu_au, b.created_at,
                a.plan AS plan_actif
         FROM boutiques b
         LEFT JOIN LATERAL (
           SELECT plan FROM abonnements
           WHERE utilisateur_id = b.utilisateur_id AND statut='actif' AND fin > NOW()
           ORDER BY fin DESC LIMIT 1
         ) a ON true
         ${where}
         ORDER BY ${orderBy}
         LIMIT $${vals.length+1} OFFSET $${vals.length+2}`,
        [...vals, lim, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM boutiques ${where}`, vals),
    ]);
    res.json({ boutiques: rows.rows, total: parseInt(cnt.rows[0].count), page: parseInt(page) });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});
```

- [ ] **Step 2: Vérifier manuellement que le défaut est inchangé**

Run (backend démarré) :

```bash
curl.exe "http://localhost:3000/api/boutiques?limit=5"
```

Expected: même ordre qu'avant ce chantier — boutiques Business en premier, puis Pro, puis sponsorisées, puis les plus récentes.

```bash
curl.exe "http://localhost:3000/api/boutiques?tri=recent&limit=5"
```

Expected: ordre strictement par `created_at DESC`, sans égard au plan.

- [ ] **Step 3: Frontend — ajouter `tri` et la rangée de pills**

Dans `frontend-next/src/app/boutiques/page.tsx`, modifier la signature de `BoutiquesPage` (lignes 34-41) :

```tsx
export default async function BoutiquesPage({
  searchParams,
}: {
  searchParams: { ville?: string; q?: string; page?: string; tri?: string }
}) {
  const ville = searchParams.ville ?? ''
  const q     = searchParams.q     ?? ''
  const page  = searchParams.page  ?? '1'
  const tri   = searchParams.tri   ?? ''

  const qs = new URLSearchParams({ limit: '24', page })
  if (ville) qs.set('ville', ville)
  if (q)     qs.set('q', q)
  if (tri)   qs.set('tri', tri)
```

Modifier `buildLink` (lignes 58-65) pour inclure `tri` :

```tsx
  function buildLink(params: Record<string, string>) {
    const p = new URLSearchParams()
    if (ville) p.set('ville', ville)
    if (q)     p.set('q', q)
    if (tri)   p.set('tri', tri)
    Object.entries(params).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)))
    const s = p.toString()
    return `/boutiques${s ? `?${s}` : ''}`
  }
```

Ajouter la constante `TRIS` après `VILLES` (après ligne 32) :

```tsx
const TRIS = [
  { val: '',        label: 'Recommandé' },
  { val: 'recent',  label: 'Récent' },
  { val: 'nom_asc', label: 'Nom A-Z' },
]
```

Ajouter une rangée de pills dans le bloc `{/* Filtres */}` (après la rangée Villes, lignes 83-90, avant la fermeture de `</div>` ligne 91) :

```tsx
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <span className="filtres-label">Trier :</span>
          {TRIS.map(t => (
            <Link key={t.val || 'defaut'} href={buildLink({ tri: t.val, page: '1' })} className={`budget-pill${tri === t.val ? ' active' : ''}`}>
              {t.label}
            </Link>
          ))}
        </div>
```

- [ ] **Step 4: Vérifier visuellement**

Run: `cd frontend-next && npm run dev` (si pas déjà lancé)
Ouvrir `http://localhost:3001/boutiques`
Expected: par défaut ("Recommandé" actif), l'ordre des boutiques est identique à avant ce chantier (Business/Pro en premier). Cliquer "Récent" ou "Nom A-Z" change l'ordre en conséquence, sans égard au plan payant.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/boutiques.js frontend-next/src/app/boutiques/page.tsx
git commit -m "feat: ajoute le tri (recent/nom) sur la page Boutiques sans casser l'ordre commercial par defaut"
```

---

### Task 6: Filtre Opérateur dans le wizard "Trouver mon forfait"

**Files:**
- Modify: `frontend-next/src/app/telecom/WizardForfait.tsx`
- Modify: `frontend-next/src/app/telecom/TelecomClient.tsx:144-145,301`

**Interfaces:**
- Consumes: `operateurs: string[]` — déjà chargé et détenu par `TelecomClient` (reçu en prop depuis `frontend-next/src/app/telecom/page.tsx:70`, alimenté par `GET /api/telecom/operateurs`). `GET /api/telecom` accepte déjà `operateur` en query param (`backend/routes/telecom.js:12,24`, `operateur ILIKE $1` — comparaison sans wildcard ajouté côté route, donc passer la valeur exacte retournée par `/operateurs`).
- Produces: prop `operateurs: string[]` ajoutée à `WizardForfait`, nouveau state interne `operateur`, consommés uniquement en interne.

- [ ] **Step 1: `TelecomClient.tsx` — transmettre `operateurs` au wizard**

Le composant reçoit déjà `operateurs` en prop (ligne 145). Modifier l'instanciation du wizard (ligne 301) :

```tsx
      {showWizard && <WizardForfait onClose={() => setShowWizard(false)} operateurs={operateurs} />}
```

- [ ] **Step 2: `WizardForfait.tsx` — accepter la prop et ajouter le state**

Modifier `Props` (lignes 19-21) :

```tsx
interface Props {
  onClose: () => void
  operateurs: string[]
}
```

Modifier la signature du composant (ligne 48) et ajouter le state `operateur` à côté de `validite` (ligne 52) :

```tsx
export default function WizardForfait({ onClose, operateurs }: Props) {
  const [step, setStep]       = useState<1 | 2>(1)
  const [budget, setBudget]   = useState(3000)
  const [profil, setProfil]   = useState('internet')
  const [validite, setValidite] = useState<string>('')
  const [operateur, setOperateur] = useState<string>('')
  const [results, setResults] = useState<Forfait[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
```

- [ ] **Step 3: `WizardForfait.tsx` — inclure `operateur` dans la requête**

Modifier `handleSearch` (lignes 57-82), ajouter le paramètre juste après la construction de `qs` (ligne 61) :

```tsx
  async function handleSearch() {
    setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams({ limit: '100', prixMax: String(budget) })
      if (profil === 'internet') qs.set('type', 'internet')
      else if (profil === 'appels') qs.set('type', 'voix')
      if (operateur) qs.set('operateur', operateur)

      const r = await fetch(`/api/telecom?${qs}`)
```

- [ ] **Step 4: `WizardForfait.tsx` — ajouter le champ Opérateur à l'étape 1**

Ajouter un nouveau bloc `wizard-section` juste après le bloc "Durée de validité" (après la fermeture `</div>` ligne 153, avant `{error && ...}` ligne 155) :

```tsx
            {/* Opérateur */}
            <div className="wizard-section">
              <label className="wizard-label">Opérateur préféré</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setOperateur('')}
                  className={`budget-pill${operateur === '' ? ' active' : ''}`}
                  style={{ fontSize: 13 }}
                >
                  📡 Peu importe
                </button>
                {operateurs.map(op => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setOperateur(op)}
                    className={`budget-pill${operateur === op ? ' active' : ''}`}
                    style={{ fontSize: 13, ...(operateur === op ? { background: OP_COLORS[op] ?? 'var(--accent)', borderColor: OP_COLORS[op] ?? 'var(--accent)' } : {}) }}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>
```

- [ ] **Step 5: `WizardForfait.tsx` — afficher le filtre actif dans le résumé de l'étape 2**

Modifier le résumé de l'étape 2 (lignes 169-171) pour inclure l'opérateur choisi quand il est défini :

```tsx
              <p className="wizard-sous-titre">
                Budget : <strong>{fcfa(budget)}</strong> · Profil : <strong>{PROFILS.find(p => p.val === profil)?.label}</strong>
                {operateur && <> · Opérateur : <strong>{operateur}</strong></>}
              </p>
```

- [ ] **Step 6: Vérifier visuellement**

Run: `cd frontend-next && npm run dev` (si pas déjà lancé)
Ouvrir `http://localhost:3001/telecom`, cliquer "🎯 Trouver mon forfait".
Expected: un nouveau champ "Opérateur préféré" apparaît à l'étape 1, avec "📡 Peu importe" actif par défaut et un bouton par opérateur existant en base (ex. Orange, Free, Expresso). Sélectionner un opérateur puis lancer la recherche ne renvoie que des forfaits de cet opérateur (vérifiable en comparant avec/sans le filtre). Le résumé de l'étape 2 affiche l'opérateur choisi. "Peu importe" renvoie tous les opérateurs comme avant ce chantier.

- [ ] **Step 7: Commit**

```bash
git add frontend-next/src/app/telecom/WizardForfait.tsx frontend-next/src/app/telecom/TelecomClient.tsx
git commit -m "feat: ajoute le filtre operateur dans le wizard Trouver mon forfait"
```

---

### Task 7: Revue finale de branche

**Files:** aucun fichier modifié — vérification transverse uniquement.

- [ ] **Step 1: Vérifier le build complet**

Run:

```bash
cd frontend-next && npm run build
```

Expected: build réussi sans erreur TypeScript ni erreur de lint bloquante.

- [ ] **Step 2: Vérifier le lint**

Run:

```bash
cd frontend-next && npm run lint
```

Expected: pas de nouvelle erreur introduite par les fichiers modifiés dans ce chantier (`page.tsx`, `ProduitsListe.tsx`, `annonces/page.tsx`, `boutiques/page.tsx`, `produit/[id]/page.tsx`, `produit/[id]/SimilRow.tsx`, `telecom/WizardForfait.tsx`, `telecom/TelecomClient.tsx`).

- [ ] **Step 3: Revue manuelle des 4 parcours**

Reprendre dans le navigateur (`npm run dev` sur `frontend-next` + backend démarré) les 4 vérifications déjà faites tâche par tâche (bouton Acheter visible dans le header, ligne cliquable du tableau similaires, tri sur Produits/Annonces/Boutiques, filtre Opérateur dans le wizard) en une seule passe, pour s'assurer qu'aucune régression croisée n'est apparue (ex. le déplacement du CTA n'a pas cassé l'affichage du bloc métriques juste en dessous).

- [ ] **Step 4: Invoquer la revue de code**

Utiliser le skill `superpowers:requesting-code-review` sur l'ensemble des commits de ce chantier avant de proposer la fusion vers `main`.
