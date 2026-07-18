# Formulaire produit boutique — chips, anti-doublon, champs optionnels — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert free-text caractéristique fields in the boutique "Ajouter/Modifier un produit" form into clickable chip selectors with a free-text fallback, remove the caractéristique/variante field doublons (Taille, Couleur, Stockage), and make every caractéristique field optional (only Nom + Prix stay required).

**Architecture:** Single file change to `frontend-next/src/app/boutique/BoutiqueClient.tsx`. A new generic `CaracChips` component replaces `CaracField`/`CaracSelect` calls for fields that have a bounded, known set of common values. `CaracteristiquesFields` gains a `typesVarianteActifs: Set<TypeVarianteId>` prop to conditionally hide the 3 duplicated fields. `ProduitForm` derives that set from the already-existing `typesDejaUtilises` and adds a `useEffect` to strip stale `carac` keys when a matching variant type becomes active.

**Tech Stack:** Next.js 14, React (Client Component), TypeScript, inline `style={}` objects (existing convention in this file), Vitest + Testing Library (already configured, see `src/app/boutique/__tests__/`).

## Global Constraints

- Only `Nom du produit` and `Prix` stay `required` — every other field in `CaracteristiquesFields` loses `required` and its `*` marker.
- No backend/schema changes — `caracteristiques` stays `Record<string,string>`, `variantes` stays the same JSON shape.
- No changes to the public product page or order flow.
- Visual style of chip buttons must reuse the existing pill-button look already used for variant values (`BoutiqueClient.tsx:717-722`: `padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600`, active border `#C75B00`/bg `#fff7f0`/text `#C75B00`, inactive border `#d1d5db`/bg `#fff`/text `#374151`) — no new CSS classes, inline styles only, consistent with the rest of this file.
- Anti-doublon pairs (exactly 3, no others): `mode`+Taille ↔ variant type `taille`; `smartphones`/`tv-electro`+Couleur ↔ variant type `couleur`; `smartphones`/`informatique`+Stockage ↔ variant type `stockage`. Note: `tv-electro` has no `couleur` field today — the pairing only applies where the field actually exists (`smartphones`).
- `jeux` Plateforme field stays a `CaracSelect` (closed list, no free text to replace).
- `État` field (all categories using `ETATS_PRODUIT`) stays a `CaracSelect`, only loses `required`.

---

### Task 1: `CaracChips` component + unit tests for its pure selection logic

**Files:**
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx` (add component near `CaracField`/`CaracSelect`, around line 152)
- Test: `frontend-next/src/app/boutique/__tests__/CaracChips.test.tsx` (new)

**Interfaces:**
- Consumes: none (new leaf component)
- Produces: `CaracChips({ label, name, value, onChange, suggestions, allowAutre = true, required = false }: { label: string; name: string; value: string; onChange: (k: string, v: string) => void; suggestions: string[]; allowAutre?: boolean; required?: boolean })` — exported as a named function alongside `CaracField`/`CaracSelect` (not exported from the module, same visibility as those two siblings — internal to the file, imported directly by the test via a relative path since the test file lives in the same package and Vitest resolves TSX imports the same way `nomParDefauto` does). To make it testable it must be exported the same way `nomParDefautPourCategorie` is (`export function CaracChips(...)`).

- [ ] **Step 1: Write the failing test**

Create `frontend-next/src/app/boutique/__tests__/CaracChips.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CaracChips } from '../BoutiqueClient'

describe('CaracChips', () => {
  it('affiche les suggestions en boutons cliquables', () => {
    render(<CaracChips label="Marque" name="marque" value="" onChange={() => {}} suggestions={['Zara', 'Nike']} />)
    expect(screen.getByRole('button', { name: 'Zara' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nike' })).toBeInTheDocument()
  })

  it('appelle onChange avec la valeur cliquée', () => {
    const onChange = vi.fn()
    render(<CaracChips label="Marque" name="marque" value="" onChange={onChange} suggestions={['Zara', 'Nike']} />)
    fireEvent.click(screen.getByRole('button', { name: 'Zara' }))
    expect(onChange).toHaveBeenCalledWith('marque', 'Zara')
  })

  it('désélectionne en recliquant la valeur déjà active', () => {
    const onChange = vi.fn()
    render(<CaracChips label="Marque" name="marque" value="Zara" onChange={onChange} suggestions={['Zara', 'Nike']} />)
    fireEvent.click(screen.getByRole('button', { name: 'Zara' }))
    expect(onChange).toHaveBeenCalledWith('marque', '')
  })

  it('affiche un bouton Autre qui révèle un champ texte', () => {
    const onChange = vi.fn()
    render(<CaracChips label="Marque" name="marque" value="" onChange={onChange} suggestions={['Zara']} />)
    fireEvent.click(screen.getByRole('button', { name: 'Autre' }))
    const input = screen.getByPlaceholderText('Autre valeur…')
    fireEvent.change(input, { target: { value: 'Uniqlo' } })
    expect(onChange).toHaveBeenCalledWith('marque', 'Uniqlo')
  })

  it("active automatiquement le mode Autre si la valeur ne correspond à aucune suggestion", () => {
    render(<CaracChips label="Marque" name="marque" value="Uniqlo" onChange={() => {}} suggestions={['Zara', 'Nike']} />)
    expect(screen.getByDisplayValue('Uniqlo')).toBeInTheDocument()
  })

  it('ne propose pas de bouton Autre si allowAutre=false', () => {
    render(<CaracChips label="Genre" name="genre" value="" onChange={() => {}} suggestions={['Homme', 'Femme']} allowAutre={false} />)
    expect(screen.queryByRole('button', { name: 'Autre' })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend-next && npx vitest run src/app/boutique/__tests__/CaracChips.test.tsx`
Expected: FAIL — `CaracChips` is not exported / does not exist.

- [ ] **Step 3: Write the implementation**

In `frontend-next/src/app/boutique/BoutiqueClient.tsx`, add this component right after `CaracSelect` (after line 152, before `CaracteristiquesFields`):

```tsx
export function CaracChips({ label, name, value, onChange, suggestions, allowAutre = true, required: req = false }: {
  label: string; name: string; value: string; onChange: (k: string, v: string) => void
  suggestions: string[]; allowAutre?: boolean; required?: boolean
}) {
  const estSuggestion = suggestions.includes(value)
  const [modeAutre, setModeAutre] = useState(!!value && !estSuggestion)

  function choisir(val: string) {
    setModeAutre(false)
    onChange(name, value === val ? '' : val)
  }

  function activerAutre() {
    setModeAutre(true)
    onChange(name, '')
  }

  return (
    <div>
      <label style={labelStyle}>{label}{req && <span style={{ color: '#dc2626' }}> *</span>}</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: modeAutre ? 8 : 0 }}>
        {suggestions.map(val => {
          const selectionnee = !modeAutre && value === val
          return (
            <button
              key={val} type="button" onClick={() => choisir(val)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: selectionnee ? '2px solid #C75B00' : '1px solid #d1d5db',
                background: selectionnee ? '#fff7f0' : '#fff',
                color: selectionnee ? '#C75B00' : '#374151',
              }}
            >
              {val}
            </button>
          )
        })}
        {allowAutre && (
          <button
            type="button" onClick={activerAutre}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: modeAutre ? '2px solid #C75B00' : '1px dashed #d1d5db',
              background: modeAutre ? '#fff7f0' : '#fff',
              color: modeAutre ? '#C75B00' : '#374151',
            }}
          >
            Autre
          </button>
        )}
      </div>
      {allowAutre && modeAutre && (
        <input
          type="text" value={value} onChange={e => onChange(name, e.target.value)}
          style={inputStyle} placeholder="Autre valeur…"
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend-next && npx vitest run src/app/boutique/__tests__/CaracChips.test.tsx`
Expected: PASS (6 tests)

- [ ] **Step 5: Typecheck**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/app/boutique/BoutiqueClient.tsx frontend-next/src/app/boutique/__tests__/CaracChips.test.tsx
git commit -m "feat(boutique): ajoute le composant CaracChips (choix cliquable + Autre)"
```

---

### Task 2: Anti-doublon helper `champVisibleSelonVariante` + unit tests

**Files:**
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx` (add pure helper near `TYPES_VARIANTE`, around line 122)
- Test: `frontend-next/src/app/boutique/__tests__/champVisibleSelonVariante.test.ts` (new)

**Interfaces:**
- Consumes: `TypeVarianteId` type already defined at `BoutiqueClient.tsx:105`.
- Produces: `export function champVisibleSelonVariante(champ: 'taille' | 'couleur' | 'stockage', typesVarianteActifs: Set<TypeVarianteId>): boolean` — used by Task 3's `CaracteristiquesFields` to decide whether to render the corresponding simple field. Also exports `const CHAMP_VERS_TYPE_VARIANTE: Record<'taille' | 'couleur' | 'stockage', TypeVarianteId>` mapping used internally and by the test.

- [ ] **Step 1: Write the failing test**

Create `frontend-next/src/app/boutique/__tests__/champVisibleSelonVariante.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { champVisibleSelonVariante } from '../BoutiqueClient'

describe('champVisibleSelonVariante', () => {
  it('reste visible si aucune variante correspondante n\'est active', () => {
    expect(champVisibleSelonVariante('taille', new Set())).toBe(true)
    expect(champVisibleSelonVariante('couleur', new Set())).toBe(true)
    expect(champVisibleSelonVariante('stockage', new Set())).toBe(true)
  })

  it('se masque si la variante correspondante est active', () => {
    expect(champVisibleSelonVariante('taille', new Set(['taille']))).toBe(false)
    expect(champVisibleSelonVariante('couleur', new Set(['couleur']))).toBe(false)
    expect(champVisibleSelonVariante('stockage', new Set(['stockage']))).toBe(false)
  })

  it('ne se masque pas si une autre variante (non correspondante) est active', () => {
    expect(champVisibleSelonVariante('taille', new Set(['couleur']))).toBe(true)
    expect(champVisibleSelonVariante('couleur', new Set(['stockage']))).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend-next && npx vitest run src/app/boutique/__tests__/champVisibleSelonVariante.test.ts`
Expected: FAIL — `champVisibleSelonVariante` is not exported / does not exist.

- [ ] **Step 3: Write the implementation**

In `frontend-next/src/app/boutique/BoutiqueClient.tsx`, add right after the `TYPES_VARIANTE` array (after line 122):

```ts
export const CHAMP_VERS_TYPE_VARIANTE: Record<'taille' | 'couleur' | 'stockage', TypeVarianteId> = {
  taille: 'taille',
  couleur: 'couleur',
  stockage: 'stockage',
}

export function champVisibleSelonVariante(champ: 'taille' | 'couleur' | 'stockage', typesVarianteActifs: Set<TypeVarianteId>): boolean {
  return !typesVarianteActifs.has(CHAMP_VERS_TYPE_VARIANTE[champ])
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend-next && npx vitest run src/app/boutique/__tests__/champVisibleSelonVariante.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Typecheck**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/app/boutique/BoutiqueClient.tsx frontend-next/src/app/boutique/__tests__/champVisibleSelonVariante.test.ts
git commit -m "feat(boutique): ajoute champVisibleSelonVariante pour eviter les doublons Caracteristiques/Variantes"
```

---

### Task 3: Rewrite `CaracteristiquesFields` — chips, optional fields, anti-doublon wiring

**Files:**
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx:154-262` (the whole `CaracteristiquesFields` function body and its category branches)

**Interfaces:**
- Consumes: `CaracChips` (Task 1), `champVisibleSelonVariante` (Task 2), existing `CaracField`/`CaracSelect`/`ETATS_PRODUIT`/`GENRES_MODE`/`PLATEFORMES`/`POUR_QUI`/`STOCKAGES_RAM`/`COULEURS_PALETTE` constants already in the file.
- Produces: `CaracteristiquesFields` gains a new required prop `typesVarianteActifs: Set<TypeVarianteId>`. Signature becomes:
  `function CaracteristiquesFields({ slug, values, onChange, typesVarianteActifs }: { slug: string; values: Record<string, string>; onChange: (k: string, v: string) => void; typesVarianteActifs: Set<TypeVarianteId> })`
  This is consumed by Task 4 (`ProduitForm`'s render call).

- [ ] **Step 1: Replace the `CaracteristiquesFields` function**

Replace the entire function (lines 154–262 in the original file — from `function CaracteristiquesFields({ slug, values, onChange }: {` down to the closing `return null\n}` before the style helpers section) with:

```tsx
const MARQUES_MODE = ['Zara', 'Nike', 'Adidas', 'H&M', 'Shein']
const MARQUES_SMARTPHONE = ['Samsung', 'Apple', 'Xiaomi', 'Tecno', 'Infinix']
const MARQUES_INFORMATIQUE = ['Dell', 'Lenovo', 'HP', 'Asus', 'Apple']
const MARQUES_TV_ELECTRO = ['Samsung', 'LG', 'Hisense', 'TCL']
const MARQUES_AUTO = ['Toyota', 'Yamaha', 'Hyundai', 'Kia']
const MARQUES_MAISON = ['IKEA', 'Broyhill']
const MATIERES_MODE = ['Coton', 'Lin', 'Cuir', 'Synthétique', 'Denim']
const MATIERES_MAISON = ['Bois', 'Métal', 'Tissu', 'Verre', 'Plastique']
const TYPES_ARTICLE_MAISON = ['Canapé', 'Lit', 'Table', 'Armoire', 'Chaise']
const TYPES_ARTICLE_TV_ELECTRO = ['TV', 'Frigo', 'Clim', 'Machine à laver', 'Congélateur']
const CARBURANTS = ['Essence', 'Diesel', 'Hybride', 'Électrique']
const CONDITIONNEMENTS = ['Sachet', 'Boîte', 'Vrac', 'Bouteille']
const TYPES_BEAUTE = ['Crème', 'Parfum', 'Shampoing', 'Savon', 'Maquillage']

function CaracteristiquesFields({ slug, values, onChange, typesVarianteActifs }: {
  slug: string; values: Record<string, string>; onChange: (k: string, v: string) => void
  typesVarianteActifs: Set<TypeVarianteId>
}) {
  const f = (k: string) => values[k] ?? ''

  if (slug === 'smartphones') return (
    <div className="bq-form-grid-2">
      <CaracChips  label="Marque"   name="marque"   value={f('marque')}   onChange={onChange} suggestions={MARQUES_SMARTPHONE} />
      <CaracField  label="Modèle"   name="modele"   value={f('modele')}   onChange={onChange} placeholder="iPhone 14 Pro…" />
      {champVisibleSelonVariante('stockage', typesVarianteActifs) && (
        <CaracChips label="Stockage" name="stockage" value={f('stockage')} onChange={onChange} suggestions={STOCKAGES_RAM} />
      )}
      <CaracField  label="RAM"      name="ram"      value={f('ram')}      onChange={onChange} placeholder="8 Go…" />
      {champVisibleSelonVariante('couleur', typesVarianteActifs) && (
        <CaracChips label="Couleur" name="couleur" value={f('couleur')} onChange={onChange} suggestions={COULEURS_PALETTE.map(c => c.nom)} />
      )}
      <CaracSelect label="État"     name="etat"     value={f('etat')}     onChange={onChange} options={ETATS_PRODUIT} />
    </div>
  )

  if (slug === 'informatique') return (
    <div className="bq-form-grid-2">
      <CaracChips  label="Marque"     name="marque"     value={f('marque')}     onChange={onChange} suggestions={MARQUES_INFORMATIQUE} />
      <CaracField  label="Modèle"     name="modele"     value={f('modele')}     onChange={onChange} placeholder="XPS 15…" />
      <CaracField  label="Processeur" name="processeur" value={f('processeur')} onChange={onChange} placeholder="Intel i7, AMD Ryzen…" />
      <CaracField  label="RAM"        name="ram"        value={f('ram')}        onChange={onChange} placeholder="16 Go…" />
      {champVisibleSelonVariante('stockage', typesVarianteActifs) && (
        <CaracChips label="Stockage" name="stockage" value={f('stockage')} onChange={onChange} suggestions={STOCKAGES_RAM} />
      )}
      <CaracSelect label="État"       name="etat"       value={f('etat')}       onChange={onChange} options={ETATS_PRODUIT} />
    </div>
  )

  if (slug === 'tv-electro') return (
    <div className="bq-form-grid-2">
      <CaracChips  label="Marque"       name="marque"       value={f('marque')}       onChange={onChange} suggestions={MARQUES_TV_ELECTRO} />
      <CaracField  label="Modèle"       name="modele"       value={f('modele')}       onChange={onChange} placeholder="55QN90B…" />
      <CaracChips  label="Type"         name="type_article" value={f('type_article')} onChange={onChange} suggestions={TYPES_ARTICLE_TV_ELECTRO} />
      <CaracField  label="Taille/Capa." name="taille"       value={f('taille')}       onChange={onChange} placeholder="55 pouces, 300 L…" />
      <CaracSelect label="État"         name="etat"         value={f('etat')}         onChange={onChange} options={ETATS_PRODUIT} />
    </div>
  )

  if (slug === 'auto-moto') return (
    <div className="bq-form-grid-2">
      <CaracChips  label="Marque"      name="marque"      value={f('marque')}      onChange={onChange} suggestions={MARQUES_AUTO} />
      <CaracField  label="Modèle"      name="modele"      value={f('modele')}      onChange={onChange} placeholder="Corolla, R1…" />
      <div>
        <label style={labelStyle}>Année</label>
        <input type="number" min={1970} max={2026} value={f('annee')} onChange={e => onChange('annee', e.target.value)}
          style={inputStyle} placeholder="2020" />
      </div>
      <CaracField  label="Kilométrage" name="kilometrage" value={f('kilometrage')} onChange={onChange} placeholder="45 000 km" />
      <CaracChips  label="Carburant"   name="carburant"   value={f('carburant')}   onChange={onChange} suggestions={CARBURANTS} />
      <CaracSelect label="État"        name="etat"        value={f('etat')}        onChange={onChange} options={ETATS_PRODUIT} />
    </div>
  )

  if (slug === 'mode') return (
    <div className="bq-form-grid-2">
      <CaracChips  label="Marque"  name="marque"  value={f('marque')}  onChange={onChange} suggestions={MARQUES_MODE} />
      {champVisibleSelonVariante('taille', typesVarianteActifs) && (
        <CaracChips label="Taille" name="taille" value={f('taille')} onChange={onChange} suggestions={TAILLES_VETEMENT} />
      )}
      <CaracChips  label="Genre"   name="genre"   value={f('genre')}   onChange={onChange} suggestions={GENRES_MODE} allowAutre={false} />
      <CaracChips  label="Matière" name="matiere" value={f('matiere')} onChange={onChange} suggestions={MATIERES_MODE} />
      <CaracSelect label="État"    name="etat"    value={f('etat')}    onChange={onChange} options={ETATS_PRODUIT} />
    </div>
  )

  if (slug === 'maison') return (
    <div className="bq-form-grid-2">
      <CaracChips  label="Type d'article" name="type_article" value={f('type_article')} onChange={onChange} suggestions={TYPES_ARTICLE_MAISON} />
      <CaracChips  label="Marque"         name="marque"       value={f('marque')}       onChange={onChange} suggestions={MARQUES_MAISON} />
      <CaracChips  label="Matière"        name="matiere"      value={f('matiere')}      onChange={onChange} suggestions={MATIERES_MAISON} />
      <CaracField  label="Dimensions"     name="dimensions"   value={f('dimensions')}   onChange={onChange} placeholder="120×80×75 cm" />
      <CaracSelect label="État"           name="etat"         value={f('etat')}         onChange={onChange} options={ETATS_PRODUIT} />
    </div>
  )

  if (slug === 'jeux') return (
    <div className="bq-form-grid-2">
      <CaracSelect label="Plateforme" name="plateforme" value={f('plateforme')} onChange={onChange} options={PLATEFORMES} />
      <CaracField  label="Éditeur"    name="editeur"    value={f('editeur')}    onChange={onChange} placeholder="EA, Ubisoft…" />
      <CaracSelect label="État"       name="etat"       value={f('etat')}       onChange={onChange} options={ETATS_PRODUIT} />
    </div>
  )

  if (slug === 'alimentation') return (
    <div className="bq-form-grid-2">
      <CaracField label="Poids / Quantité"   name="poids_quantite"  value={f('poids_quantite')}  onChange={onChange} placeholder="500g, 1L, 12 unités…" />
      <CaracChips label="Conditionnement"    name="conditionnement" value={f('conditionnement')} onChange={onChange} suggestions={CONDITIONNEMENTS} />
      <CaracField label="Date de péremption" name="date_peremption" value={f('date_peremption')} onChange={onChange} placeholder="12/2025" />
      <CaracField label="Origine / Marque"   name="marque"          value={f('marque')}          onChange={onChange} placeholder="Dakar Produits…" />
    </div>
  )

  if (slug === 'beaute') return (
    <div className="bq-form-grid-2">
      <CaracField  label="Marque"       name="marque"       value={f('marque')}       onChange={onChange} placeholder="L'Oréal, Nivea…" />
      <CaracChips  label="Type"         name="type_produit" value={f('type_produit')} onChange={onChange} suggestions={TYPES_BEAUTE} />
      <CaracChips  label="Pour qui"     name="pour_qui"     value={f('pour_qui')}     onChange={onChange} suggestions={POUR_QUI} allowAutre={false} />
      <CaracField  label="Contenance"   name="contenance"   value={f('contenance')}   onChange={onChange} placeholder="200 ml, 50 g…" />
    </div>
  )

  if (slug === 'services') return (
    <div className="bq-form-grid-2">
      <CaracChips label="Type de service"    name="type_service"     value={f('type_service')}     onChange={onChange} suggestions={['Plomberie', 'Cours', 'Transport', 'Ménage', 'Réparation']} />
      <CaracField label="Zone d'intervention" name="zone_intervention" value={f('zone_intervention')} onChange={onChange} placeholder="Dakar, Plateau…" />
      <CaracField label="Durée / Fréquence"  name="duree"            value={f('duree')}            onChange={onChange} placeholder="1h, par séance…" />
      <CaracField label="Disponibilité"      name="disponibilite"    value={f('disponibilite')}    onChange={onChange} placeholder="Lun-Ven 8h-18h…" />
    </div>
  )

  return null
}
```

Note: `required` is dropped from every `CaracField`/`CaracSelect`/`CaracChips` call above (none of them pass `required`), satisfying the "only Nom + Prix required" constraint.

- [ ] **Step 2: Typecheck**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: errors at the call site in `ProduitForm` (missing `typesVarianteActifs` prop) — expected at this point, fixed in Task 4. Confirm no *other* new errors appear (e.g. no leftover reference to removed `required` variables).

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/app/boutique/BoutiqueClient.tsx
git commit -m "feat(boutique): champs Caracteristiques en chips, optionnels, anti-doublon variante"
```

(This commit intentionally leaves a known, temporary type error at the `CaracteristiquesFields` call site — resolved in Task 4 immediately after.)

---

### Task 4: Wire `typesVarianteActifs` into `ProduitForm` + clean stale `carac` keys on variant activation

**Files:**
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx` (inside `ProduitForm`, around lines 571 and 646-653)

**Interfaces:**
- Consumes: `champVisibleSelonVariante`, `CHAMP_VERS_TYPE_VARIANTE` (Task 2), `typesDejaUtilises` (already computed at `BoutiqueClient.tsx:571`), `CaracteristiquesFields` (Task 3, now requiring `typesVarianteActifs`).
- Produces: nothing new consumed by later tasks — this closes the wiring.

- [ ] **Step 1: Locate the existing `typesDejaUtilises` line and use it directly as the new prop**

In `ProduitForm`, line 571 already computes:
```ts
const typesDejaUtilises = new Set(variantes.filter(v => v.typeId && v.typeId !== 'autre').map(v => v.typeId))
```
This is exactly the `Set<TypeVarianteId>` needed — no new state required. Pass it straight through.

- [ ] **Step 2: Add a `useEffect` to strip stale `carac` keys when a matching variant becomes active**

Immediately after the `typesDejaUtilises` line (after line 572, right after `typesDisponibles`), add:

```ts
useEffect(() => {
  setCarac(prev => {
    let changed = false
    const next = { ...prev }
    for (const champ of ['taille', 'couleur', 'stockage'] as const) {
      if (!champVisibleSelonVariante(champ, typesDejaUtilises) && champ in next) {
        delete next[champ]
        changed = true
      }
    }
    return changed ? next : prev
  })
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [typesDejaUtilises.size, Array.from(typesDejaUtilises).join(',')])
```

(Dependency array uses primitive values derived from the Set, since a `Set` object reference changes every render and would cause an infinite loop if used directly as a dependency.)

- [ ] **Step 3: Pass the prop at the `CaracteristiquesFields` render call**

Find the render call around (originally) line 651:
```tsx
<CaracteristiquesFields slug={cat} values={carac} onChange={handleCarac} />
```
Replace with:
```tsx
<CaracteristiquesFields slug={cat} values={carac} onChange={handleCarac} typesVarianteActifs={typesDejaUtilises} />
```

- [ ] **Step 4: Typecheck**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Run the full existing test suite for this directory**

Run: `cd frontend-next && npx vitest run src/app/boutique/`
Expected: all tests pass (existing `nomParDefaut.test.ts` + the two new test files from Tasks 1–2).

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/app/boutique/BoutiqueClient.tsx
git commit -m "feat(boutique): masque le champ simple quand la variante correspondante est active"
```

---

### Task 5: Manual smoke test + final verification

**Files:** none (verification only)

**Interfaces:** none

- [ ] **Step 1: Start the dev server**

Run: `cd frontend-next && npm run dev` (background — do not block on it; the project has no browser automation tool available in this environment per prior sessions, so this is a manual/visual check by the user or a curl-based sanity check, not an automated assertion)

- [ ] **Step 2: Full workspace typecheck**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: 0 errors (confirms no other file references the old `CaracteristiquesFields` 4-prop signature or removed exports).

Run: `cd frontend-next && npx vitest run`
Expected: all tests pass, including the pre-existing `BoutonPartager.test.tsx`.

- [ ] **Step 3: Manual check checklist (report to user, don't assume)**

Navigate to `/boutique` → "Gérer la boutique" → "Ajouter un produit", category "Mode":
- Marque/Matière/Genre render as clickable chips, no red `*` on any field except Nom/Prix.
- Clicking "Autre" on Marque reveals a text input; typing a custom brand and submitting keeps that value.
- Add a "Taille (vêtement)" variant in the Variantes section → the standalone "Taille" chip field in Caractéristiques disappears.
- Remove that variant → the "Taille" chip field reappears, empty.
- Repeat the couleur check on category "Smartphones" (Couleur chip field toggles off/on with a "🎨 Couleur" variant) and the stockage check (Stockage chip field toggles off/on with a "💾 Stockage / RAM" variant).
- Submit a product with only Nom + Prix filled (no caractéristiques) → succeeds.

- [ ] **Step 4: Report results**

State plainly which of the manual checks passed/failed — do not claim "done" without having actually exercised the flow, consistent with this project's documented limitation (no browser automation tool in this environment).
