# Homogénéisation en-tête / filtres / bloc SEO — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 4 divergent header/filter/SEO-block patterns with one shared standard across 8 result pages (4 SSR listings + 4 client-side guide tools), matching common marketplace conventions (breadcrumb, short title+count, compact filter bar with essentials visible and secondary filters collapsed behind "Plus de filtres", SEO block always last).

**Architecture:** Two new shared presentational components (`PageHeader`, `FiltresBar`) plus one new CSS class family (`.filter-pill`, `.filtres-more-btn`, `.filtres-panel`) replacing four separate ad-hoc pill systems. Each of the 8 pages is migrated to use the shared components without changing its data-fetching or filtering logic — this is a UI/structure refactor, not a behavior change. The homepage's existing `.seo-card` becomes a reusable `SeoCard` component consumed by all 8 pages.

**Tech Stack:** Next.js 14 App Router (Server Components for Group A pages, Client Components for Group B), TypeScript, plain CSS in `frontend-next/src/app/globals.css`.

## Global Constraints

- No backend route, query param name, or filter *logic* changes on any of the 8 pages — only presentation/structure. (Spec: "Aucune page ne change de mécanique de filtrage, seulement d'habillage et de structure.")
- Group B (guide-*) weighting sliders (`poidsPrix`, `poidsSpecs`, etc.) and `POIDS_LABELS` must keep their exact current behavior — only re-skinned, never removed or replaced by pills. (Spec: "Curseurs... conservés tels quels")
- One shared pill class `.filter-pill` (+ `.filter-pill--active`) replaces `.budget-pill`, `.filtres-group`-embedded pills, `.immo-filtres-row`-embedded pills, and `.annonces-cat-pill`/`.annonces-cat-pill--active`.
- `.filtres-label` is currently defined twice in `globals.css` (line ~1463 and line ~2398) with different styles — this plan's CSS task consolidates it to one definition.
- SEO block: reuse the existing `.seo-card`/`.seo-head`/`.seo-tag`/`.seo-blurb`/`.seo-icon`/`.chip-row`/`.chip`/`.seo-foot`/`.home-seo-cols` classes verbatim (already in `globals.css`, homepage `page.tsx:447-507`) — do not invent new SEO-block CSS.
- `--max-w: 1200px` / `--px: 20px` (globals.css `:root`, lines 56-57) are the standing width tokens; `.page-container` (globals.css line 23) is `max-width: 1200px`. Any new wrapper must not introduce a new width constant.
- Verification in this environment is code-only: `npx tsc --noEmit` after each page, and `git diff --stat` after each task to catch unintended mass deletions (documented project pitfall with bulk edits on large multilingual files — always diff before committing).
- Windows/PowerShell environment — file paths in commands use forward slashes inside the Bash tool (Git Bash), not backslashes.

---

## File Structure

**New files:**
- `frontend-next/src/components/PageHeader.tsx` — breadcrumb + H1 + counter + optional CTA
- `frontend-next/src/components/FiltresBar.tsx` — pill row + "Plus de filtres" trigger + panel, generic over items
- `frontend-next/src/components/SeoCard.tsx` — wraps existing `.seo-card` markup, takes title/tag/blurbs/chip-rows/foot as props

**Modified files (one task each, Group A):**
- `frontend-next/src/app/categorie/[slug]/page.tsx`
- `frontend-next/src/app/immo/page.tsx`
- `frontend-next/src/app/telecom/TelecomClient.tsx` (+ reads `frontend-next/src/app/telecom/page.tsx` for props, no changes needed there)
- `frontend-next/src/app/annonces/page.tsx`

**Modified files (one task each, Group B):**
- `frontend-next/src/app/guide-prix/GuidePrixContent.tsx`
- `frontend-next/src/app/guide-achat/GuideAchatContent.tsx`
- `frontend-next/src/app/guide-immo/GuideImmoContent.tsx`
- `frontend-next/src/app/guide-forfait/GuideForfaitContent.tsx`

**CSS:**
- `frontend-next/src/app/globals.css` — add new classes (Task 1), remove superseded classes (final Task 10) after all 8 pages migrated.

---

## Task 1: Shared CSS — `.filter-pill` family + filters panel + consolidate `.filtres-label`

**Files:**
- Modify: `frontend-next/src/app/globals.css`

**Interfaces:**
- Produces: CSS classes `.filter-pill`, `.filter-pill--active`, `.filter-pill--reset`, `.filtres-row` (flex row, horizontal scroll on mobile), `.filtres-more-btn`, `.filtres-more-badge`, `.filtres-panel`, `.filtres-panel-row`, `.seo-card-wrap` (width wrapper used by `SeoCard`). Single `.filtres-label` definition (was duplicated).

- [ ] **Step 1: Add the new classes**

Insert this block immediately after the existing `.budget-pill--reset:hover` rule (globals.css, right after line 1499, before the next section comment):

```css
/* ── Filtres partagés (PageHeader / FiltresBar) — remplace budget-pill,
   filtres-group, immo-filtres-row, annonces-cat-pill (voir Task 10) ── */
.filtres-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 2px;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1.5px solid var(--border);
  font-size: 13px;
  font-weight: 600;
  color: var(--text2);
  background: var(--card);
  transition: all .15s;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
}

.filter-pill:hover,
.filter-pill.filter-pill--active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.filter-pill--reset {
  color: var(--red);
  border-color: #fecaca;
}

.filter-pill--reset:hover {
  background: #fef2f2;
  border-color: var(--red);
  color: var(--red);
}

.filtres-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1.5px dashed var(--border);
  font-size: 13px;
  font-weight: 600;
  color: var(--navy);
  background: var(--bg);
  cursor: pointer;
  white-space: nowrap;
}

.filtres-more-btn:hover { border-color: var(--accent); color: var(--accent); }

.filtres-more-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.filtres-panel {
  margin-top: 10px;
  padding: 16px 18px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filtres-panel-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.seo-card-wrap {
  max-width: var(--max-w);
  margin: 40px auto 24px;
  padding: 0 var(--px);
}
```

- [ ] **Step 2: Remove the duplicate `.filtres-label` at line ~2398**

Find (in the `.telecom-filtres` section, right before `.telecom-filtres-inner`):

```css
.filtres-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filtres-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text2);
  text-transform: uppercase;
  letter-spacing: .05em;
  white-space: nowrap;
  min-width: 72px;
}
```

Replace with (keep `.filtres-group` since `TelecomClient.tsx` still references it until Task 5 migrates it; drop only the duplicate `.filtres-label`):

```css
.filtres-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
```

The single surviving `.filtres-label` definition is the one at line 1463 (`font-size: 13px; font-weight: 600; color: var(--text2); white-space: nowrap;`) — this stays as the canonical style used by `PageHeader`/`FiltresBar` going forward.

- [ ] **Step 3: Verify no build-breaking typo**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: no new errors (CSS isn't type-checked, but this confirms nothing else broke from editing the file — run from the frontend-next directory).

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/app/globals.css
git commit -m "feat(css): ajoute la famille .filter-pill partagee, consolide .filtres-label"
```

---

## Task 2: `PageHeader` shared component

**Files:**
- Create: `frontend-next/src/components/PageHeader.tsx`

**Interfaces:**
- Produces:
  ```ts
  interface Crumb { label: string; href?: string }
  interface PageHeaderCta { label: string; href?: string; onClick?: () => void }
  interface PageHeaderProps {
    breadcrumb: Crumb[]       // last item has no href (current page)
    emoji?: string
    titre: string
    compteur?: string          // e.g. "659 produits comparés · mis à jour toutes les 6h"
    cta?: PageHeaderCta
  }
  export default function PageHeader(props: PageHeaderProps): JSX.Element
  ```
- Consumes: nothing (pure presentational, works in both Server and Client Components since it has no hooks — no `'use client'` directive needed).

- [ ] **Step 1: Write the component**

```tsx
import Link from 'next/link'

interface Crumb {
  label: string
  href?: string
}

interface PageHeaderCta {
  label: string
  href?: string
  onClick?: () => void
}

interface PageHeaderProps {
  breadcrumb: Crumb[]
  emoji?: string
  titre: string
  compteur?: string
  cta?: PageHeaderCta
}

export default function PageHeader({ breadcrumb, emoji, titre, compteur, cta }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>
        {breadcrumb.map((c, i) => (
          <span key={i}>
            {i > 0 && ' › '}
            {c.href ? (
              <Link href={c.href} style={{ color: 'var(--text2)' }}>{c.label}</Link>
            ) : (
              <span style={{ color: 'var(--text1)' }}>{c.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: 'var(--navy)', lineHeight: 1.2, margin: 0 }}>
          {emoji ? `${emoji} ` : ''}{titre}
        </h1>
        {cta && (
          cta.href ? (
            <Link href={cta.href} className="annonces-cta-btn">{cta.label}</Link>
          ) : (
            <button type="button" className="annonces-cta-btn" onClick={cta.onClick}>{cta.label}</button>
          )
        )}
      </div>

      {compteur && (
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>{compteur}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: no errors referencing `PageHeader.tsx` (unused-file — nothing imports it yet, so this only confirms the file itself compiles).

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/components/PageHeader.tsx
git commit -m "feat: ajoute le composant partage PageHeader (fil d'Ariane + titre + compteur + CTA)"
```

---

## Task 3: `SeoCard` shared component

**Files:**
- Create: `frontend-next/src/components/SeoCard.tsx`

**Interfaces:**
- Produces:
  ```ts
  interface SeoCardBlurb { emoji: string; text: React.ReactNode }
  interface SeoCardChip { href: string; emoji: string; label: string; small?: boolean }
  interface SeoCardChipRow { label: string; chips: SeoCardChip[] }
  interface SeoCardProps {
    titre: string
    tag?: string
    blurbs: SeoCardBlurb[]     // rendered in .home-seo-cols (1 or 2 items)
    chipRows: SeoCardChipRow[]
    foot?: React.ReactNode
  }
  export default function SeoCard(props: SeoCardProps): JSX.Element
  ```
- Consumes: existing CSS classes `.seo-card`, `.seo-head`, `.seo-tag`, `.seo-cols-wrap`, `.home-seo-cols`, `.seo-blurb`, `.seo-icon`, `.chip-row-label`, `.chip-row`, `.chip`, `.chip.chip-small`, `.chip-em`, `.seo-foot`, `.seo-dot` (all already defined in `globals.css`), and the new `.seo-card-wrap` from Task 1.

- [ ] **Step 1: Write the component**

```tsx
import Link from 'next/link'

interface SeoCardBlurb {
  emoji: string
  text: React.ReactNode
}

interface SeoCardChip {
  href: string
  emoji: string
  label: string
  small?: boolean
}

interface SeoCardChipRow {
  label: string
  chips: SeoCardChip[]
}

interface SeoCardProps {
  titre: string
  tag?: string
  blurbs: SeoCardBlurb[]
  chipRows: SeoCardChipRow[]
  foot?: React.ReactNode
}

export default function SeoCard({ titre, tag, blurbs, chipRows, foot }: SeoCardProps) {
  return (
    <div className="seo-card-wrap">
      <div className="seo-card">
        <div className="seo-head">
          <h2>{titre}</h2>
          {tag && <span className="seo-tag">{tag}</span>}
        </div>

        <div className="seo-cols-wrap">
          <div className="home-seo-cols">
            {blurbs.map((b, i) => (
              <div key={i} className="seo-blurb">
                <span className="seo-icon">{b.emoji}</span>
                <p>{b.text}</p>
              </div>
            ))}
          </div>
        </div>

        {chipRows.map((row, i) => (
          <div key={i}>
            <p className="chip-row-label">{row.label}</p>
            <div className="chip-row">
              {row.chips.map(c => (
                <Link key={c.href} href={c.href} className={`chip${c.small ? ' chip-small' : ''}`}>
                  <span className="chip-em">{c.emoji}</span>
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {foot && (
          <div className="seo-foot">
            <span className="seo-dot" />
            {foot}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: no errors referencing `SeoCard.tsx`.

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/components/SeoCard.tsx
git commit -m "feat: ajoute le composant partage SeoCard (reprend .seo-card de la homepage)"
```

---

## Task 4: `FiltresBar` shared component (essentials row + collapsible "Plus de filtres")

**Files:**
- Create: `frontend-next/src/components/FiltresBar.tsx`

**Interfaces:**
- Produces:
  ```ts
  interface FiltrePill {
    key: string
    label: string
    href?: string        // for Link-based pills (Group A, SSR pages)
    onClick?: () => void // for button-based pills (Group B, client pages)
    active: boolean
    reset?: boolean       // renders as .filter-pill--reset (✕ Label)
  }
  interface FiltresBarProps {
    essentiels: FiltrePill[]       // always visible, wraps/scrolls
    secondaires?: FiltrePill[]     // hidden behind "Plus de filtres" trigger
    secondaireActifsCount?: number // badge count on the trigger; defaults to secondaires.filter(p=>p.active).length
    tri?: FiltrePill[]             // rendered last in the essentials row, own "Trier" label
  }
  export default function FiltresBar(props: FiltresBarProps): JSX.Element
  ```
  Must be a Client Component (`'use client'`) because the "Plus de filtres" panel needs local open/close state — this is fine to use from both Server Component pages (Group A: rendered as a client island) and Client Component pages (Group B).
- Consumes: `.filtres-row`, `.filter-pill`, `.filter-pill--active`, `.filter-pill--reset`, `.filtres-more-btn`, `.filtres-more-badge`, `.filtres-panel`, `.filtres-panel-row`, `.filtres-label` (all from Task 1 / pre-existing).

- [ ] **Step 1: Write the component**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

interface FiltrePill {
  key: string
  label: string
  href?: string
  onClick?: () => void
  active: boolean
  reset?: boolean
}

interface FiltresBarProps {
  essentiels: FiltrePill[]
  secondaires?: FiltrePill[]
  secondaireActifsCount?: number
  tri?: FiltrePill[]
}

function Pill({ p }: { p: FiltrePill }) {
  const cls = `filter-pill${p.active ? ' filter-pill--active' : ''}${p.reset ? ' filter-pill--reset' : ''}`
  if (p.href) {
    return <Link href={p.href} className={cls}>{p.label}</Link>
  }
  return <button type="button" className={cls} onClick={p.onClick}>{p.label}</button>
}

export default function FiltresBar({ essentiels, secondaires = [], secondaireActifsCount, tri = [] }: FiltresBarProps) {
  const [open, setOpen] = useState(false)
  const badgeCount = secondaireActifsCount ?? secondaires.filter(p => p.active).length

  return (
    <div>
      <div className="filtres-row">
        {essentiels.map(p => <Pill key={p.key} p={p} />)}

        {secondaires.length > 0 && (
          <button type="button" className="filtres-more-btn" onClick={() => setOpen(o => !o)}>
            ⚙ Plus de filtres
            {badgeCount > 0 && <span className="filtres-more-badge">{badgeCount}</span>}
          </button>
        )}

        {tri.length > 0 && (
          <>
            <span className="filtres-label" style={{ marginLeft: 8 }}>Trier :</span>
            {tri.map(p => <Pill key={p.key} p={p} />)}
          </>
        )}
      </div>

      {open && secondaires.length > 0 && (
        <div className="filtres-panel">
          <div className="filtres-panel-row">
            {secondaires.map(p => <Pill key={p.key} p={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: no errors referencing `FiltresBar.tsx`.

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/components/FiltresBar.tsx
git commit -m "feat: ajoute le composant partage FiltresBar (pills essentiels + panneau Plus de filtres)"
```

---

## Task 5: Migrate `categorie/[slug]/page.tsx`

**Files:**
- Modify: `frontend-next/src/app/categorie/[slug]/page.tsx`

**Interfaces:**
- Consumes: `PageHeader` (Task 2), `FiltresBar` (Task 4), `SeoCard` (Task 3) — exact prop shapes as defined above.
- Produces: nothing new for later tasks (leaf page).

- [ ] **Step 1: Replace the breadcrumb + header block (lines 166-186) with `PageHeader`**

Find:
```tsx
        {/* Fil d'Ariane */}
        <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
          <Link href="/" style={{ color: 'var(--text2)' }}>Accueil</Link>
          {' › '}
          <span style={{ color: 'var(--text1)' }}>{cat.label}</span>
        </nav>

        {/* En-tête SEO */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--navy)', lineHeight: 1.2, marginBottom: 10 }}>
            {cat.emoji} {cat.h1}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 720 }}>
            {cat.intro}
          </p>
          {total > 0 && (
            <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>
              <strong style={{ color: 'var(--accent)' }}>{total.toLocaleString('fr-FR')} produit{total > 1 ? 's' : ''}</strong> comparés au Sénégal · Prix mis à jour toutes les 6h
            </p>
          )}
        </div>
```

Replace with:
```tsx
        <PageHeader
          breadcrumb={[{ label: 'Accueil', href: '/' }, { label: cat.label }]}
          emoji={cat.emoji}
          titre={cat.h1}
          compteur={total > 0 ? `${total.toLocaleString('fr-FR')} produit${total > 1 ? 's' : ''} comparés au Sénégal · Prix mis à jour toutes les 6h` : undefined}
        />
```

Note: `cat.intro` is dropped from here — it moves into the `SeoCard` blurb in Step 3.

- [ ] **Step 2: Replace the filters block (lines 188-215) with `FiltresBar`**

Find:
```tsx
        {/* Filtres */}
        <div className="filtres-bar" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <span className="filtres-label">Budget :</span>
          {BUDGETS.map(b => (
            <Link
              key={b.val}
              href={buildLink({ prixMax: prixMax === b.val ? '' : b.val, page: '1' })}
              className={`budget-pill${prixMax === b.val ? ' active' : ''}`}
            >
              {b.label}
            </Link>
          ))}
          {prixMax && (
            <Link href={buildLink({ prixMax: '', page: '1' })} className="budget-pill budget-pill--reset">
              ✕ Budget
            </Link>
          )}
          <span style={{ marginLeft: 8, color: 'var(--text3)', fontSize: 13 }}>Trier :</span>
          {TRIS.map(t => (
            <Link
              key={t.val}
              href={buildLink({ tri: t.val, page: '1' })}
              className={`budget-pill${tri === t.val ? ' active' : ''}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
```

Replace with:
```tsx
        {/* Filtres */}
        <div style={{ marginBottom: 20 }}>
          <FiltresBar
            essentiels={[
              ...BUDGETS.map(b => ({
                key: b.val,
                label: b.label,
                href: buildLink({ prixMax: prixMax === b.val ? '' : b.val, page: '1' }),
                active: prixMax === b.val,
              })),
              ...(prixMax ? [{
                key: 'reset-budget',
                label: '✕ Budget',
                href: buildLink({ prixMax: '', page: '1' }),
                active: false,
                reset: true,
              }] : []),
            ]}
            tri={TRIS.map(t => ({
              key: t.val,
              label: t.label,
              href: buildLink({ tri: t.val, page: '1' }),
              active: tri === t.val,
            }))}
          />
        </div>
```

- [ ] **Step 3: Replace the bottom SEO block (lines 267-305) with `SeoCard`**

Find:
```tsx
        {/* Bloc texte SEO en bas */}
        <div style={{
          marginTop: 48, padding: '24px 28px',
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 12, maxWidth: 720,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>
            Pourquoi comparer les prix {cat.label.toLowerCase()} sur Nopalou ?
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>
            Nopalou est le premier comparateur de prix dédié au marché sénégalais.
            Nous indexons les prix de {cat.exemples} chez tous les grands marchands en ligne du Sénégal — Jumia, Expat-Dakar, CoinAfrique et bien d&apos;autres.
            Les prix sont mis à jour automatiquement toutes les 6 heures.
            Que vous soyez à <strong>Dakar</strong>, Thiès, Saint-Louis ou Ziguinchor, trouvez le meilleur prix avant d&apos;acheter.
          </p>
          {cat.contenu.map((para, i) => (
            <p key={i} style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginTop: 10 }}>{para}</p>
          ))}
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            {Object.entries(SOUS_CATEGORIES)
              .filter(([, sc]) => sc.categorie === params.slug)
              .map(([key, sc]) => (
                <Link key={key} href={`/categorie/${key}`} className="budget-pill">
                  {sc.emoji} {sc.label}
                </Link>
              ))}
            <Link href={`/categorie/${params.slug}/moins-de-50000`} className="budget-pill">Moins de 50 000 FCFA</Link>
            <Link href={`/categorie/${params.slug}/moins-de-100000`} className="budget-pill">Moins de 100 000 FCFA</Link>
            <Link href="/" className="budget-pill active">Tous les produits</Link>
            {Object.entries(CATEGORIES)
              .filter(([s]) => s !== params.slug)
              .slice(0, 4)
              .map(([s, c]) => (
                <Link key={s} href={`/categorie/${s}`} className="budget-pill">
                  {c.emoji} {c.label}
                </Link>
              ))}
          </div>
        </div>
```

Replace with:
```tsx
        {/* Bloc texte SEO en bas */}
        <SeoCard
          titre={`Pourquoi comparer les prix ${cat.label.toLowerCase()} sur Nopalou ?`}
          blurbs={[
            {
              emoji: '📊',
              text: (
                <>
                  Nopalou est le premier comparateur de prix dédié au marché sénégalais.
                  Nous indexons les prix de {cat.exemples} chez tous les grands marchands en ligne du Sénégal — Jumia, Expat-Dakar, CoinAfrique et bien d&apos;autres.
                  Les prix sont mis à jour automatiquement toutes les 6 heures.
                </>
              ),
            },
            {
              emoji: '📍',
              text: (
                <>
                  {cat.intro}
                  {' '}Que vous soyez à <strong>Dakar</strong>, Thiès, Saint-Louis ou Ziguinchor, trouvez le meilleur prix avant d&apos;acheter.
                </>
              ),
            },
          ]}
          chipRows={[
            {
              label: 'Sous-catégories & budgets',
              chips: [
                ...Object.entries(SOUS_CATEGORIES)
                  .filter(([, sc]) => sc.categorie === params.slug)
                  .map(([key, sc]) => ({ href: `/categorie/${key}`, emoji: sc.emoji, label: sc.label })),
                { href: `/categorie/${params.slug}/moins-de-50000`, emoji: '💰', label: 'Moins de 50 000 FCFA' },
                { href: `/categorie/${params.slug}/moins-de-100000`, emoji: '💰', label: 'Moins de 100 000 FCFA' },
              ],
            },
            {
              label: 'Autres catégories',
              chips: [
                { href: '/', emoji: '🗂', label: 'Tous les produits', small: true },
                ...Object.entries(CATEGORIES)
                  .filter(([s]) => s !== params.slug)
                  .slice(0, 4)
                  .map(([s, c]) => ({ href: `/categorie/${s}`, emoji: c.emoji, label: c.label, small: true })),
              ],
            },
          ]}
          foot="Prix vérifiés automatiquement toutes les 6 heures sur tous les grands marchands sénégalais"
        />
```

- [ ] **Step 4: Update imports**

Find:
```tsx
import CardActions from '@/app/CardActions'
import ExternalImg from '@/components/ExternalImg'
import CompareFilterBanner from '@/components/CompareFilterBanner'
```

Replace with:
```tsx
import CardActions from '@/app/CardActions'
import ExternalImg from '@/components/ExternalImg'
import CompareFilterBanner from '@/components/CompareFilterBanner'
import PageHeader from '@/components/PageHeader'
import FiltresBar from '@/components/FiltresBar'
import SeoCard from '@/components/SeoCard'
```

- [ ] **Step 5: Type-check**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: no errors in `categorie/[slug]/page.tsx`.

- [ ] **Step 6: Diff review**

Run: `git diff --stat frontend-next/src/app/categorie/[slug]/page.tsx`
Expected: modification only (no unexpected mass deletion — the file should still be roughly the same size, since blocks were replaced not removed).

- [ ] **Step 7: Commit**

```bash
git add frontend-next/src/app/categorie/[slug]/page.tsx
git commit -m "refactor(categorie): migre vers PageHeader/FiltresBar/SeoCard partages"
```

---

## Task 6: Migrate `immo/page.tsx`

**Files:**
- Modify: `frontend-next/src/app/immo/page.tsx`

**Interfaces:**
- Consumes: `PageHeader`, `FiltresBar`, `SeoCard` (as defined in Tasks 2-4).

- [ ] **Step 1: Replace the header block (lines 165-178) with `PageHeader`**

Find:
```tsx
      {/* En-tête */}
      <div className="immo-header">
        <div>
          <h1 className="immo-titre-page">
            Immobilier au <span style={{ color: 'var(--accent)' }}>Sénégal</span>
          </h1>
          <p className="immo-sous-titre">
            {total > 0
              ? `${total.toLocaleString('fr-FR')} annonce${total > 1 ? 's' : ''} disponible${total > 1 ? 's' : ''}`
              : 'Trouvez votre bien idéal'}
          </p>
        </div>
        <ImmoClientWrapper />
      </div>
```

Replace with:
```tsx
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <PageHeader
          breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Immobilier' }]}
          titre="Immobilier au Sénégal"
          compteur={total > 0
            ? `${total.toLocaleString('fr-FR')} annonce${total > 1 ? 's' : ''} disponible${total > 1 ? 's' : ''}`
            : 'Trouvez votre bien idéal'}
        />
        <ImmoClientWrapper />
      </div>
```

Note: `ImmoClientWrapper` (the "Trouver mon bien" wizard trigger) is kept as a sibling next to `PageHeader` rather than passed as its `cta` prop, since it's a client component that opens its own modal — `PageHeader`'s `cta` prop expects a simple link/button, not an arbitrary child. This preserves current wizard behavior exactly.

- [ ] **Step 2: Replace the entire filters block (lines 180-328) with `FiltresBar`**

Find the whole `<div className="immo-filtres">...</div>` block (from `{/* Barre de filtres */}` through the closing `</div>` right before `{/* Grille annonces */}`) and replace it with:

```tsx
      {/* Barre de filtres */}
      <FiltresBar
        essentiels={[
          {
            key: 'transaction-location',
            label: '🏠 Location',
            href: buildLink({ transaction: 'location', prixMax: '', page: '1' }),
            active: transaction === 'location',
          },
          {
            key: 'transaction-vente',
            label: '🔑 Vente',
            href: buildLink({ transaction: 'vente', prixMax: '', page: '1' }),
            active: transaction === 'vente',
          },
          ...TYPE_BIEN.map(t => ({
            key: `type-${t.val || 'tous'}`,
            label: t.val ? `${TYPE_ICONS[t.val] ?? ''} ${t.label}` : t.label,
            href: buildLink({ type_bien: t.val, page: '1' }),
            active: type_bien === t.val,
          })),
          ...prixOptions.map(p => ({
            key: `prix-${p.val}`,
            label: p.label,
            href: buildLink({ prixMax: p.val, page: '1' }),
            active: prixMax === p.val,
          })),
          ...(prixMax ? [{
            key: 'reset-budget',
            label: '✕ Budget',
            href: buildLink({ prixMax: '', page: '1' }),
            active: false,
            reset: true,
          }] : []),
          ...VILLES_SN.map(v => ({
            key: `ville-${v}`,
            label: v,
            href: buildLink({ ville: ville === v ? '' : v, quartier: '', page: '1' }),
            active: ville === v,
          })),
          ...(ville ? [{
            key: 'reset-ville',
            label: '✕ Ville',
            href: buildLink({ ville: '', quartier: '', page: '1' }),
            active: false,
            reset: true,
          }] : []),
        ]}
        secondaires={[
          ...SURFACE_MIN.map(s => ({
            key: `surface-${s.val}`,
            label: `${s.label}+`,
            href: buildLink({ surfaceMin: surfaceMin === s.val ? '' : s.val, page: '1' }),
            active: surfaceMin === s.val,
          })),
          ...NB_PIECES.map(n => ({
            key: `pieces-${n.val}`,
            label: `${n.label} pièce${n.val !== '1' ? 's' : ''}`,
            href: buildLink({ nbPieces: nbPieces === n.val ? '' : n.val, page: '1' }),
            active: nbPieces === n.val,
          })),
          ...NB_CHAMBRES.map(n => ({
            key: `chambres-${n.val}`,
            label: `${n.label} chambre${n.val !== '1' ? 's' : ''}`,
            href: buildLink({ nbChambres: nbChambres === n.val ? '' : n.val, page: '1' }),
            active: nbChambres === n.val,
          })),
          {
            key: 'meuble',
            label: '✅ Meublé',
            href: buildLink({ meuble: meuble === 'true' ? '' : 'true', page: '1' }),
            active: meuble === 'true',
          },
        ]}
        tri={TRIS.map(t => ({
          key: t.val,
          label: t.label,
          href: buildLink({ tri: t.val, page: '1' }),
          active: tri === t.val,
        }))}
      />

      {/* Quartier — champ texte, garde son propre input, affiché sous la barre de pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, marginBottom: 20 }}>
        <span className="filtres-label">Quartier</span>
        <Suspense fallback={<span className="immo-quartier-input" style={{display:'inline-block',width:220}}>…</span>}>
          <ImmoQuartierInput currentQuartier={quartier} />
        </Suspense>
      </div>
```

Note: Quartier is a free-text input, not a pill — it's kept as its own row below the pill bar (same pattern as the `annonces` search box sitting above its filter bar), rather than forced into a pill shape it doesn't fit.

- [ ] **Step 3: Add `SeoCard` before the closing `</div>` of the page (after pagination, end of the component, before line 364's closing tag)**

Find:
```tsx
      {/* Pagination */}
      {pages > 1 && (
        <div className="pagination">
          {currentPage > 1 && (
            <Link href={buildLink({ page: String(currentPage - 1) })} className="page-btn">
              ← Précédent
            </Link>
          )}
          <span className="page-info">Page {currentPage} / {pages}</span>
          {currentPage < pages && (
            <Link href={buildLink({ page: String(currentPage + 1) })} className="page-btn">
              Suivant →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
```

Replace with:
```tsx
      {/* Pagination */}
      {pages > 1 && (
        <div className="pagination">
          {currentPage > 1 && (
            <Link href={buildLink({ page: String(currentPage - 1) })} className="page-btn">
              ← Précédent
            </Link>
          )}
          <span className="page-info">Page {currentPage} / {pages}</span>
          {currentPage < pages && (
            <Link href={buildLink({ page: String(currentPage + 1) })} className="page-btn">
              Suivant →
            </Link>
          )}
        </div>
      )}

      <SeoCard
        titre="Pourquoi chercher votre bien immobilier sur Nopalou ?"
        blurbs={[
          {
            emoji: '🏘',
            text: (
              <>
                Nopalou regroupe les annonces immobilières publiées directement par les propriétaires et agences,
                ainsi que celles importées des principales plateformes du Sénégal — pour vous éviter de multiplier les sites.
              </>
            ),
          },
          {
            emoji: '📍',
            text: (
              <>
                Location ou vente, appartement, villa, studio ou terrain — filtrez par budget, ville et surface pour trouver
                le bien qui correspond exactement à votre recherche, partout à <strong>Dakar</strong> et dans les grandes villes du Sénégal.
              </>
            ),
          },
        ]}
        chipRows={[
          {
            label: 'Recherches populaires',
            chips: [
              { href: '/immo/location-appartement-dakar', emoji: '🏢', label: 'Location appartement Dakar' },
              { href: '/immo/location-chambre-dakar', emoji: '🛏️', label: 'Chambre à louer Dakar' },
              { href: '/immo/location-studio-dakar', emoji: '🏠', label: 'Studio à louer Dakar' },
              { href: '/immo/vente-terrain-dakar', emoji: '🗺️', label: 'Terrain à vendre Dakar' },
              { href: '/immo/vente-maison-dakar', emoji: '🏡', label: 'Maison à vendre Dakar' },
            ],
          },
        ]}
        foot="Nouvelles annonces publiées chaque jour par des particuliers et agences au Sénégal"
      />
    </div>
  )
}
```

- [ ] **Step 4: Update imports**

Find:
```tsx
import { apiFetch } from '@/lib/api'
import ImmoClientWrapper from './ImmoClientWrapper'
import ImmoQuartierInput from './ImmoQuartierInput'
import ImmoCard, { type AnnonceImmo, TYPE_ICONS } from './ImmoCard'
```

Replace with:
```tsx
import { apiFetch } from '@/lib/api'
import ImmoClientWrapper from './ImmoClientWrapper'
import ImmoQuartierInput from './ImmoQuartierInput'
import ImmoCard, { type AnnonceImmo, TYPE_ICONS } from './ImmoCard'
import PageHeader from '@/components/PageHeader'
import FiltresBar from '@/components/FiltresBar'
import SeoCard from '@/components/SeoCard'
```

- [ ] **Step 5: Type-check**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: no errors in `immo/page.tsx`. Pay attention to `TYPE_BIEN`'s `val: ''` entry ("Tous types") — its generated `key` is `type-tous`, verify no duplicate keys in the essentiels array.

- [ ] **Step 6: Diff review**

Run: `git diff --stat frontend-next/src/app/immo/page.tsx`
Expected: modification only, no unrelated file touched.

- [ ] **Step 7: Commit**

```bash
git add frontend-next/src/app/immo/page.tsx
git commit -m "refactor(immo): migre vers PageHeader/FiltresBar/SeoCard, filtres secondaires replies"
```

---

## Task 7: Migrate `telecom/TelecomClient.tsx`

**Files:**
- Modify: `frontend-next/src/app/telecom/TelecomClient.tsx`

**Interfaces:**
- Consumes: `PageHeader`, `FiltresBar`, `SeoCard`.
- This file is already `'use client'` — both new components work fine here (`FiltresBar` requires client anyway; `PageHeader`/`SeoCard` have no hooks so they work in either context).

- [ ] **Step 1: Replace the header block (lines 187-205) with `PageHeader`**

Find:
```tsx
      {/* En-tête */}
      <div className="telecom-header">
        <div className="telecom-header-text">
          <h1 className="telecom-titre">
            Forfaits <span style={{ color: 'var(--accent)' }}>Télécom</span>
          </h1>
          <p className="telecom-sous-titre">
            Comparez les forfaits internet et appels des opérateurs au Sénégal
          </p>
        </div>
        <div className="telecom-header-actions">
          {total > 0 && (
            <span className="telecom-count">{total} forfait{total > 1 ? 's' : ''}</span>
          )}
          <button className="wizard-trigger-btn" onClick={() => setShowWizard(true)}>
            🎯 Trouver mon forfait
          </button>
        </div>
      </div>
```

Replace with:
```tsx
      {/* En-tête */}
      <PageHeader
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Télécom' }]}
        titre="Forfaits Télécom"
        compteur={total > 0
          ? `${total} forfait${total > 1 ? 's' : ''} · Comparez les offres internet et appels des opérateurs au Sénégal`
          : 'Comparez les forfaits internet et appels des opérateurs au Sénégal'}
        cta={{ label: '🎯 Trouver mon forfait', onClick: () => setShowWizard(true) }}
      />
```

- [ ] **Step 2: Replace the filters block (lines 207-245) with `FiltresBar`**

Find:
```tsx
      {/* Filtres */}
      <div className="telecom-filtres">
        <div className="filtres-bar telecom-filtres-inner" style={{ flexWrap: 'wrap' }}>
          <div className="filtres-group">
            <span className="filtres-label">Opérateur</span>
            <Link href={buildLink({ operateur: '', page: '1' })} className={`budget-pill${!currentOperateur ? ' active' : ''}`}>
              Tous
            </Link>
            {operateurs.map(op => (
              <Link
                key={op}
                href={buildLink({ operateur: op, page: '1' })}
                className={`budget-pill${currentOperateur === op ? ' active' : ''}`}
                style={currentOperateur === op ? { background: OP_COLORS[op]?.badge ?? 'var(--accent)', borderColor: OP_COLORS[op]?.badge ?? 'var(--accent)' } : {}}
              >
                {OP_ICONS[op] ?? '📡'} {op}
              </Link>
            ))}
          </div>

          <div className="filtres-group">
            <span className="filtres-label">Type</span>
            {TYPES.map(t => (
              <Link key={t.val} href={buildLink({ type: t.val, page: '1' })} className={`budget-pill${currentType === t.val ? ' active' : ''}`}>
                {t.label}
              </Link>
            ))}
          </div>

          <div className="filtres-group">
            <span className="filtres-label">Trier par</span>
            {TRIS.map(t => (
              <Link key={t.val} href={buildLink({ tri: t.val, page: '1' })} className={`budget-pill${currentTri === t.val ? ' active' : ''}`}>
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
```

Replace with:
```tsx
      {/* Filtres */}
      <FiltresBar
        essentiels={[
          {
            key: 'op-tous',
            label: 'Tous opérateurs',
            href: buildLink({ operateur: '', page: '1' }),
            active: !currentOperateur,
          },
          ...operateurs.map(op => ({
            key: `op-${op}`,
            label: `${OP_ICONS[op] ?? '📡'} ${op}`,
            href: buildLink({ operateur: op, page: '1' }),
            active: currentOperateur === op,
          })),
          ...TYPES.map(t => ({
            key: `type-${t.val || 'tous'}`,
            label: t.label,
            href: buildLink({ type: t.val, page: '1' }),
            active: currentType === t.val,
          })),
        ]}
        tri={TRIS.map(t => ({
          key: `tri-${t.val || 'defaut'}`,
          label: t.label,
          href: buildLink({ tri: t.val, page: '1' }),
          active: currentTri === t.val,
        }))}
      />
```

Note: the per-operator background color styling (`OP_COLORS[op]?.badge`) on the active pill is dropped — `.filter-pill--active` now uses the single shared accent color like every other page, consistent with the homogenization goal. This is an intentional visual simplification, not an oversight.

- [ ] **Step 3: Add `SeoCard` at the end of the component, right before the closing `{showWizard && ...}` and final `</div>`**

Find:
```tsx
      {/* Wizard */}
      {showWizard && <WizardForfait onClose={() => setShowWizard(false)} operateurs={operateurs} />}
    </div>
  )
}
```

Replace with:
```tsx
      <SeoCard
        titre="Pourquoi comparer les forfaits télécom sur Nopalou ?"
        blurbs={[
          {
            emoji: '📡',
            text: (
              <>
                Nopalou compare les forfaits internet, appels et SMS de tous les opérateurs du Sénégal —
                Orange, Free, Expresso et Wave — pour vous aider à choisir le meilleur rapport qualité/prix
                selon votre usage réel.
              </>
            ),
          },
          {
            emoji: '🎯',
            text: (
              <>
                Utilisez l&apos;assistant <strong>« Trouver mon forfait »</strong> pour une recommandation personnalisée
                selon votre budget, ou comparez directement les forfaits recommandés par opérateur ci-dessus.
              </>
            ),
          },
        ]}
        chipRows={[
          {
            label: 'Par opérateur',
            chips: [
              { href: '/telecom/orange', emoji: '🟠', label: 'Forfaits Orange' },
              { href: '/telecom/yas', emoji: '🔵', label: 'Forfaits Yas' },
              { href: '/telecom/expresso', emoji: '🟢', label: 'Forfaits Expresso' },
              { href: '/telecom/promobile', emoji: '📡', label: 'Forfaits ProMobile' },
            ],
          },
        ]}
        foot="Prix et forfaits comparés selon les grilles tarifaires publiques des opérateurs"
      />

      {/* Wizard */}
      {showWizard && <WizardForfait onClose={() => setShowWizard(false)} operateurs={operateurs} />}
    </div>
  )
}
```

- [ ] **Step 4: Update imports**

Find:
```tsx
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import WizardForfait from './WizardForfait'
import CardActions from '@/app/CardActions'
import type { Forfait } from './page'
```

Replace with:
```tsx
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import WizardForfait from './WizardForfait'
import CardActions from '@/app/CardActions'
import PageHeader from '@/components/PageHeader'
import FiltresBar from '@/components/FiltresBar'
import SeoCard from '@/components/SeoCard'
import type { Forfait } from './page'
```

- [ ] **Step 5: Type-check**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: no errors in `telecom/TelecomClient.tsx`.

- [ ] **Step 6: Diff review**

Run: `git diff --stat frontend-next/src/app/telecom/TelecomClient.tsx`
Expected: modification only.

- [ ] **Step 7: Commit**

```bash
git add frontend-next/src/app/telecom/TelecomClient.tsx
git commit -m "refactor(telecom): migre vers PageHeader/FiltresBar/SeoCard"
```

---

## Task 8: Migrate `annonces/page.tsx`

**Files:**
- Modify: `frontend-next/src/app/annonces/page.tsx`

**Interfaces:**
- Consumes: `PageHeader`, `FiltresBar`, `SeoCard`.

- [ ] **Step 1: Replace the header block (lines 151-163) with `PageHeader`**

Find:
```tsx
      {/* Header */}
      <div className="annonces-header">
        <div className="annonces-header-text">
          <h1 className="annonces-titre">Petites annonces — Sénégal</h1>
          <p className="annonces-sous-titre">
            {total > 0 ? `${total.toLocaleString('fr-SN')} annonce${total > 1 ? 's' : ''}` : 'Aucune annonce'}
            {catActuelle.slug ? ` en ${catActuelle.label}` : ''}
          </p>
        </div>
        <Link href="/deposer-annonce" className="annonces-cta-btn">
          + Publier une annonce
        </Link>
      </div>
```

Replace with:
```tsx
      {/* Header */}
      <PageHeader
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Annonces' }]}
        titre="Petites annonces — Sénégal"
        compteur={
          (total > 0 ? `${total.toLocaleString('fr-SN')} annonce${total > 1 ? 's' : ''}` : 'Aucune annonce')
          + (catActuelle.slug ? ` en ${catActuelle.label}` : '')
        }
        cta={{ label: '+ Publier une annonce', href: '/deposer-annonce' }}
      />
```

- [ ] **Step 2: Replace the 4 stacked filter blocks (lines 187-267 — catégories, tri, prix, ville, source) with one `FiltresBar`, keeping the search form (lines 165-185) untouched above it**

Find (everything from `{/* Filtres catégories */}` through the end of the `{/* Source */}` block, i.e. lines 187-267):

```tsx
      {/* Filtres catégories */}
      <div className="annonces-cats">
        {CATEGORIES.map(cat => {
          const active = cat.slug === categorie
          return (
            <Link
              key={cat.slug}
              href={buildLink({ categorie: cat.slug, page: '' })}
              className={`annonces-cat-pill${active ? ' annonces-cat-pill--active' : ''}`}
            >
              <span>{cat.emoji}</span> {cat.label}
            </Link>
          )
        })}
      </div>

      {/* Tri */}
      <div className="annonces-cats" style={{ marginTop: 8 }}>
        <span className="filtres-label">Trier :</span>
        {TRIS.map(t => (
          <Link
            key={t.val || 'defaut'}
            href={buildLink({ tri: t.val, page: '' })}
            className={`annonces-cat-pill${tri === t.val ? ' annonces-cat-pill--active' : ''}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Prix max */}
      <div className="annonces-cats" style={{ marginTop: 8 }}>
        <span className="filtres-label">Budget max :</span>
        {PRIX_MAX.map(p => (
          <Link
            key={p.val}
            href={buildLink({ prixMax: prixMax === p.val ? '' : p.val, page: '' })}
            className={`annonces-cat-pill${prixMax === p.val ? ' annonces-cat-pill--active' : ''}`}
          >
            {p.label}
          </Link>
        ))}
        {prixMax && (
          <Link href={buildLink({ prixMax: '', page: '' })} className="budget-pill budget-pill--reset">
            ✕ Budget
          </Link>
        )}
      </div>

      {/* Ville */}
      <div className="annonces-cats" style={{ marginTop: 8 }}>
        <span className="filtres-label">Ville :</span>
        {VILLES_SN.map(v => (
          <Link
            key={v}
            href={buildLink({ ville: ville === v ? '' : v, page: '' })}
            className={`annonces-cat-pill${ville === v ? ' annonces-cat-pill--active' : ''}`}
          >
            {v}
          </Link>
        ))}
        {ville && (
          <Link href={buildLink({ ville: '', page: '' })} className="budget-pill budget-pill--reset">
            ✕ Ville
          </Link>
        )}
      </div>

      {/* Source */}
      <div className="annonces-cats" style={{ marginTop: 8 }}>
        <span className="filtres-label">Origine :</span>
        {SOURCES.map(s => (
          <Link
            key={s.val || 'toutes'}
            href={buildLink({ source: s.val, page: '' })}
            className={`annonces-cat-pill${source === s.val ? ' annonces-cat-pill--active' : ''}`}
          >
            {s.label}
          </Link>
        ))}
      </div>
```

Replace with:
```tsx
      {/* Filtres */}
      <FiltresBar
        essentiels={CATEGORIES.map(cat => ({
          key: `cat-${cat.slug || 'toutes'}`,
          label: `${cat.emoji} ${cat.label}`,
          href: buildLink({ categorie: cat.slug, page: '' }),
          active: cat.slug === categorie,
        })).concat(
          PRIX_MAX.map(p => ({
            key: `prix-${p.val}`,
            label: p.label,
            href: buildLink({ prixMax: prixMax === p.val ? '' : p.val, page: '' }),
            active: prixMax === p.val,
          }))
        ).concat(
          prixMax ? [{
            key: 'reset-budget',
            label: '✕ Budget',
            href: buildLink({ prixMax: '', page: '' }),
            active: false,
            reset: true,
          }] : []
        )}
        secondaires={VILLES_SN.map(v => ({
          key: `ville-${v}`,
          label: v,
          href: buildLink({ ville: ville === v ? '' : v, page: '' }),
          active: ville === v,
        })).concat(
          SOURCES.map(s => ({
            key: `source-${s.val || 'toutes'}`,
            label: s.label,
            href: buildLink({ source: s.val, page: '' }),
            active: source === s.val,
          }))
        )}
        tri={TRIS.map(t => ({
          key: `tri-${t.val || 'defaut'}`,
          label: t.label,
          href: buildLink({ tri: t.val, page: '' }),
          active: tri === t.val,
        }))}
      />
```

- [ ] **Step 3: Add `SeoCard` before the closing `</div>` of the page, after pagination**

Find:
```tsx
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="annonces-pagination">
          {page > 1 && (
            <Link href={pageUrl(page - 1)} className="pag-btn">← Précédent</Link>
          )}
          <span className="pag-info">Page {page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={pageUrl(page + 1)} className="pag-btn">Suivant →</Link>
          )}
        </div>
      )}
    </div>
  )
}
```

Replace with:
```tsx
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="annonces-pagination">
          {page > 1 && (
            <Link href={pageUrl(page - 1)} className="pag-btn">← Précédent</Link>
          )}
          <span className="pag-info">Page {page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={pageUrl(page + 1)} className="pag-btn">Suivant →</Link>
          )}
        </div>
      )}

      <SeoCard
        titre="Pourquoi publier ou chercher une annonce sur Nopalou ?"
        blurbs={[
          {
            emoji: '🤝',
            text: (
              <>
                Nopalou regroupe les petites annonces entre particuliers au Sénégal — téléphones, informatique, mode,
                maison, auto et services — publiées directement sur le site ou importées de Facebook pour élargir le choix.
              </>
            ),
          },
          {
            emoji: '📢',
            text: (
              <>
                Publier une annonce est gratuit et rapide. Filtrez par catégorie, budget ou ville pour trouver
                exactement ce que vous cherchez, partout à <strong>Dakar</strong> et dans les grandes villes du Sénégal.
              </>
            ),
          },
        ]}
        chipRows={[
          {
            label: 'Catégories populaires',
            chips: CATEGORIES.filter(c => c.slug).map(c => ({ href: buildLink({ categorie: c.slug, page: '' }), emoji: c.emoji, label: c.label, small: true })),
          },
        ]}
        foot="Nouvelles annonces publiées chaque jour par des particuliers au Sénégal"
      />
    </div>
  )
}
```

- [ ] **Step 4: Update imports**

Find:
```tsx
import { cloudinaryHQ } from '@/lib/cloudinary'
import CardActions from '@/app/CardActions'
```

Replace with:
```tsx
import { cloudinaryHQ } from '@/lib/cloudinary'
import CardActions from '@/app/CardActions'
import PageHeader from '@/components/PageHeader'
import FiltresBar from '@/components/FiltresBar'
import SeoCard from '@/components/SeoCard'
```

- [ ] **Step 5: Type-check**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: no errors in `annonces/page.tsx`.

- [ ] **Step 6: Diff review**

Run: `git diff --stat frontend-next/src/app/annonces/page.tsx`
Expected: modification only.

- [ ] **Step 7: Commit**

```bash
git add frontend-next/src/app/annonces/page.tsx
git commit -m "refactor(annonces): migre vers PageHeader/FiltresBar/SeoCard"
```

---

## Task 9: Migrate the 4 guide pages (`guide-prix`, `guide-achat`, `guide-immo`, `guide-forfait`)

**Files:**
- Modify: `frontend-next/src/app/guide-prix/GuidePrixContent.tsx`
- Modify: `frontend-next/src/app/guide-achat/GuideAchatContent.tsx`
- Modify: `frontend-next/src/app/guide-immo/GuideImmoContent.tsx`
- Modify: `frontend-next/src/app/guide-forfait/GuideForfaitContent.tsx`

**Interfaces:**
- Consumes: `PageHeader`, `FiltresBar`, `SeoCard`.
- Constraint (from spec): weighting sliders (`poidsPrix`/`poidsSpecs`/`poidsDispo`/`poidsSurface`/`poidsData`/`poidsAppel`/`poidsDuree`) and `POIDS_LABELS` stay exactly as-is — do not touch their JSX or state logic, only re-skin the pill-shaped controls around them (profile buttons, category/type/ville pills, simple sort) with `.filter-pill`.

This task is 4 near-identical sub-steps (one per guide). Each follows the same pattern: swap the `.guide-*-titre`/`.guide-*-desc` hero header for `PageHeader`, convert the profile buttons + simple category/type/ville pills to `FiltresBar`'s `essentiels`/`tri`, leave every slider (`<input type="range">` or equivalent) exactly where it is in the JSX, and append a `SeoCard` at the end. Because each guide's JSX differs in the specific field names, each sub-step is written out fully below — do not assume they're identical, verify against the actual file.

### Step 1: `guide-prix/GuidePrixContent.tsx`

Find (lines 146-177, the hero + search form's category pills):
```tsx
    <div className="guide-prix-page">
      <div className="guide-prix-hero">
        <h1 className="guide-prix-titre">💡 Guide des prix</h1>
        <p className="guide-prix-desc">
          Recherchez un produit pour connaître son prix actuel au Sénégal,
          comparer les marchands et voir l&apos;évolution du prix dans le temps.
        </p>

        <form onSubmit={search} className="guide-prix-form">
          <div className="guide-prix-search-wrap">
            <input
              type="search"
              placeholder="Nom du produit, marque… ex: iPhone 14, Samsung A14"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="guide-prix-input"
            />
            <button type="submit" className="guide-prix-btn" disabled={loading}>
              {loading ? '…' : '🔍 Rechercher'}
            </button>
          </div>
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

Replace with:
```tsx
    <div className="guide-prix-page">
      <PageHeader
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Guide des prix' }]}
        emoji="💡"
        titre="Guide des prix"
        compteur="Recherchez un produit pour connaître son prix actuel au Sénégal, comparer les marchands et voir l'évolution du prix dans le temps."
      />
      <div className="guide-prix-hero">
        <form onSubmit={search} className="guide-prix-form">
          <div className="guide-prix-search-wrap">
            <input
              type="search"
              placeholder="Nom du produit, marque… ex: iPhone 14, Samsung A14"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="guide-prix-input"
            />
            <button type="submit" className="guide-prix-btn" disabled={loading}>
              {loading ? '…' : '🔍 Rechercher'}
            </button>
          </div>
          <FiltresBar
            essentiels={[
              { key: 'cat-tous', label: 'Tous', active: categorie === '', onClick: () => { setCategorie(''); search() } },
              ...CATEGORIES.map(c => ({
                key: `cat-${c.slug}`,
                label: `${c.icon} ${c.label}`,
                active: categorie === c.slug,
                onClick: () => setCategorie(c.slug),
              })),
            ]}
          />
```

Note: the `<div className="guide-prix-cats">...</div>` wrapper is removed since `FiltresBar` provides its own `.filtres-row` wrapper — its closing `</div>` (originally matching `guide-prix-cats`) must also be deleted; the form's own closing `</form>` right after (containing the price-range inputs) is untouched.

Find (end of file, right before the closing `</div>` of `guide-prix-page`, after the `guide-prix-body` div closes):
```tsx
      </div>
    </div>
  )
}

function HistoMini({ data }: { data: { date: string; prix: number }[] }) {
```

Replace with:
```tsx
      </div>

      <SeoCard
        titre="Pourquoi utiliser le guide des prix Nopalou ?"
        blurbs={[
          {
            emoji: '💡',
            text: (
              <>
                Ce guide vous montre en un coup d&apos;œil le prix le plus bas, le prix moyen et l&apos;écart entre marchands
                pour n&apos;importe quel produit vendu au Sénégal — sans avoir à visiter chaque site un par un.
              </>
            ),
          },
          {
            emoji: '📈',
            text: (
              <>
                L&apos;évolution du prix sur 30 jours vous aide à savoir si c&apos;est le bon moment pour acheter,
                ou s&apos;il vaut mieux attendre une baisse.
              </>
            ),
          },
        ]}
        chipRows={[
          {
            label: 'Comparer par catégorie',
            chips: CATEGORIES.map(c => ({ href: `/categorie/${c.slug}`, emoji: c.icon, label: c.label, small: true })),
          },
        ]}
        foot="Prix vérifiés automatiquement toutes les 6 heures sur tous les grands marchands sénégalais"
      />
    </div>
  )
}

function HistoMini({ data }: { data: { date: string; prix: number }[] }) {
```

Update imports — find:
```tsx
import { useState } from 'react'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import ExternalImg from '@/components/ExternalImg'
```
Replace with:
```tsx
import { useState } from 'react'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import ExternalImg from '@/components/ExternalImg'
import PageHeader from '@/components/PageHeader'
import FiltresBar from '@/components/FiltresBar'
import SeoCard from '@/components/SeoCard'
```

### Step 2: `guide-achat/GuideAchatContent.tsx`

Read the file's header/hero JSX and profile-button/category-pill markup (mirrors the `guide-prix` shape: a `.guide-achat-hero`/similar title block, `PROFILS.map` rendered as buttons, `CATEGORIES.map` category pills, `etatFiltre`/`triSimple` controls). Apply the same transformation pattern as Step 1:
1. Replace the hero title/description block with `PageHeader` (`emoji`, `titre`, `compteur` = the existing description text).
2. Wrap the `PROFILS` buttons, `CATEGORIES` pills, `etatFiltre` select-equivalent pills, and `triSimple` pills into a single `FiltresBar` call: `PROFILS` + `CATEGORIES` + état-filter entries go in `essentiels`, `triSimple` options go in `tri`.
3. Leave `poidsPrix`/`poidsSpecs`/`poidsDispo` slider JSX completely untouched, wherever it currently sits in the panel.
4. Append a `SeoCard` at the end of the component (before the final closing `</div>` and `)`  `}` of the default export), titled `"Pourquoi utiliser le guide d'achat intelligent Nopalou ?"`, with 2 blurbs explaining the scoring approach (prix/caractéristiques/disponibilité pondérés) and a chip row linking to `CATEGORIES`.
5. Add the same 3 imports (`PageHeader`, `FiltresBar`, `SeoCard` from `@/components/...`) next to the existing `ExternalImg` import.

Verify the exact current JSX structure with `Read` before editing — do not guess line numbers; the shape mirrors `guide-prix` but field names differ (`profilActif`, `poidsPrix`, `poidsSpecs`, `poidsDispo`, `etatFiltre`, `triSimple`, `triPar`).

### Step 3: `guide-immo/GuideImmoContent.tsx`

Same transformation pattern as Step 2, applied to this file's own hero block and filter controls (`PROFILS` with `transaction`/`poids` fields, `TYPES_BIEN`, `VILLES`, `PIECES_OPTIONS`, `poidsPrix`/`poidsSurface` sliders, `triPar`). `essentiels` = `PROFILS` + `TYPES_BIEN` + `VILLES` + `PIECES_OPTIONS` pills; `tri` = `triPar` options. Sliders untouched. `SeoCard` titled `"Pourquoi utiliser le guide immobilier Nopalou ?"`, chip row linking to the immo landing pages (`/immo/location-appartement-dakar`, etc., same set as Task 6's `SeoCard`). Same 3 imports added.

### Step 4: `guide-forfait/GuideForfaitContent.tsx`

Same transformation pattern, applied to this file's hero block and filter controls (`PROFILS`, `OPERATEURS`, `TYPES_FORFAIT`, `BUDGETS_RAPIDES`, `poidsData`/`poidsAppel`/`poidsPrix`/`poidsDuree` sliders). `essentiels` = `PROFILS` + `OPERATEURS` + `TYPES_FORFAIT` + `BUDGETS_RAPIDES` pills; `tri` = whatever simple sort options exist in this file (verify field name — likely `triPar` with `score`/`prix`/`data`/`recent`-style values, check actual code). Sliders untouched. `SeoCard` titled `"Pourquoi utiliser le guide forfait Nopalou ?"`, chip row linking to `/telecom/orange`, `/telecom/yas`, `/telecom/expresso`, `/telecom/promobile`. Same 3 imports added.

- [ ] **Step 5: Type-check all 4 guides**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: no errors in any of the 4 `guide-*/Guide*Content.tsx` files.

- [ ] **Step 6: Diff review**

Run: `git diff --stat frontend-next/src/app/guide-prix frontend-next/src/app/guide-achat frontend-next/src/app/guide-immo frontend-next/src/app/guide-forfait`
Expected: modifications only in the 4 `*Content.tsx` files, no unrelated files, no mass deletions disproportionate to the header/filter blocks touched.

- [ ] **Step 7: Verify sliders are untouched**

Run: `git diff frontend-next/src/app/guide-achat/GuideAchatContent.tsx frontend-next/src/app/guide-immo/GuideImmoContent.tsx frontend-next/src/app/guide-forfait/GuideForfaitContent.tsx | grep -E "poids(Prix|Specs|Dispo|Surface|Data|Appel|Duree)"`
Expected: no output, or only unchanged context lines (`-`/`+` prefixed lines referencing these variables would indicate the slider logic was accidentally altered — investigate before proceeding).

- [ ] **Step 8: Commit**

```bash
git add frontend-next/src/app/guide-prix/GuidePrixContent.tsx frontend-next/src/app/guide-achat/GuideAchatContent.tsx frontend-next/src/app/guide-immo/GuideImmoContent.tsx frontend-next/src/app/guide-forfait/GuideForfaitContent.tsx
git commit -m "refactor(guides): migre les 4 guides vers PageHeader/FiltresBar/SeoCard, curseurs de ponderation inchanges"
```

---

## Task 10: Remove superseded CSS classes

**Files:**
- Modify: `frontend-next/src/app/globals.css`

**Interfaces:**
- Consumes: nothing (cleanup task, runs after all 8 pages are migrated).

- [ ] **Step 1: Confirm no page still references the old classes**

Run: `grep -rn "budget-pill\|filtres-bar\b\|immo-filtres-row\|filtres-group\|annonces-cat-pill" frontend-next/src/app frontend-next/src/components`

Expected: no matches outside `globals.css` itself. If any `.tsx` file still references one of these classes, stop and fix that file first (a page was missed in Tasks 5-9) — do not delete the CSS while it's still in use.

- [ ] **Step 2: Remove the superseded class definitions from `globals.css`**

Remove the `.budget-pill`, `.budget-pill:hover, .budget-pill.active`, `.budget-pill--reset`, `.budget-pill--reset:hover` rules (originally at lines ~1470-1499, exact line numbers will have shifted from Task 1's insertion — locate by content, not line number).

Remove `.immo-filtres-row` (originally ~885-890) — but **keep** `.immo-filtres` (the outer card wrapper), `.immo-quartier-input`/`.immo-quartier-btn`, and `.immo-toggle`/`.immo-toggle-btn` (still used: quartier input is a text field kept as its own row, and the Location/Vente toggle was folded into `FiltresBar` essentiels as plain pills in Task 6, so `.immo-toggle*` classes are also now unused — verify with the same grep as Step 1 before removing).

Remove `.filtres-group` (originally ~2391-2396, now unused after Task 7) and the standalone `.filtres-bar` rule (originally ~1455-1461, now unused after Task 5) — keep `.filtres-label` (still used by the Quartier row in Task 6 and possibly elsewhere).

Remove `.annonces-cat-pill`, `.annonces-cat-pill:hover`, `.annonces-cat-pill--active` (originally ~6209-6232).

- [ ] **Step 3: Type-check and build-sanity**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: no errors (CSS removal doesn't affect TS, but confirms the file wasn't corrupted).

- [ ] **Step 4: Diff review**

Run: `git diff --stat frontend-next/src/app/globals.css`
Expected: deletions roughly matching the classes listed in Step 2 (a few dozen lines) — no unrelated section touched.

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/app/globals.css
git commit -m "chore(css): supprime les classes de filtres remplacees par .filter-pill"
```

---

## Self-Review Notes

**Spec coverage:**
- `PageHeader` (breadcrumb + title + counter + CTA) — Task 2, consumed by Tasks 5-9. ✅
- `FiltresBar` (essentials + collapsible secondary + tri) — Task 4, consumed by Tasks 5-9. ✅
- `.filter-pill` unified class replacing 4 systems — Task 1 (create) + Task 10 (remove old ones). ✅
- `SeoCard` reusing homepage `.seo-card` — Task 3, consumed by Tasks 5-9 (all 8 pages now have one, including the 4 that previously had none). ✅
- Reading-width text inside full-width card — `SeoCard` uses `.home-seo-cols` internally (pre-existing 2-column ~580px-each layout), `.seo-card-wrap` constrains to `--max-w`/`--px` (Task 1). ✅
- Guide sliders preserved — explicit constraint called out in Task 9 with a grep-based verification step. ✅
- `.filtres-label` duplicate bug — fixed in Task 1 Step 2. ✅
- Out of scope items (result card styles, footer, other site pages) — not touched by any task. ✅

**Placeholder scan:** No TBD/TODO markers. Task 9's sub-steps 2-4 (guide-achat/immo/forfait) are deliberately less code-complete than Step 1 (guide-prix) because their exact current JSX must be re-verified by `Read` before editing (field names like `etatFiltre`, `triSimple` are named from the audit but the precise surrounding markup wasn't transcribed) — this is flagged explicitly as "verify... before editing," not left as an unresolved TBD; the transformation rule itself is fully specified.

**Type consistency:** `FiltrePill`/`PageHeaderProps`/`SeoCardProps` interfaces defined once in Tasks 2-4 and reused identically (same field names: `key`, `label`, `href`, `onClick`, `active`, `reset`) across every consuming task.
