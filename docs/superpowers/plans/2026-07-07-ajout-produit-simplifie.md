# Simplification de l'ajout de produit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un mode "Ajout rapide" (photo + catégorie + prix, nom généré automatiquement) à côté du formulaire détaillé existant, avec un badge "à compléter" visible dans le dashboard pour les produits créés ainsi.

**Architecture:** Un seul composant `ProduitForm` existant reçoit une nouvelle prop `modeInitial: 'rapide' | 'detaille'` qui contrôle uniquement quels champs sont visibles au premier rendu (état local React, pas de nouveau composant ni nouvelle route API). Deux boutons d'entrée dans `CatalogueProduits` ouvrent ce même formulaire avec un `modeInitial` différent. Un lien "Voir tous les champs" bascule le mode sans perdre la saisie.

**Tech Stack:** Next.js 14 / React (frontend uniquement pour ce chantier — aucun changement backend nécessaire, le champ `nom` est déjà la seule contrainte serveur et un nom généré la satisfait).

## Global Constraints

- Le prix reste obligatoire même en mode rapide (voir spec `docs/superpowers/specs/2026-07-07-ajout-produit-simplifie-design.md`).
- Aucune modification de la validation serveur (`backend/routes/boutiques.js`) — le nom généré satisfait déjà la contrainte `nom` requise.
- Aucune reconnaissance d'image par IA dans ce chantier — explicitement différée en phase 2 (non construite ici).
- Le mode détaillé existant (`ProduitForm` actuel) reste inchangé dans son contenu — seul un mode d'affichage initial différent est ajouté par-dessus.

---

### Task 1: Table des noms par défaut par catégorie

**Files:**
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx:394-406` (juste après `PRODUIT_CATEGORIES`)
- Create: `frontend-next/src/app/boutique/__tests__/nomParDefaut.test.ts`

**Interfaces:**
- Produces: fonction `nomParDefautPourCategorie(categorie: string): string`, consommée par Task 2.

Ce projet Next.js n'a pas de suite de tests frontend identifiée pour `frontend-next/src/app/boutique/`. Vérifier `frontend-next/package.json` pour la présence de `jest`/`vitest`/`@testing-library`. Si aucun n'est présent, ajouter `vitest` (plus rapide à configurer sans dépendances DOM pour cette fonction pure) : `cd frontend-next && npm install --save-dev vitest`.

- [ ] **Step 1: Vérifier la présence d'un test runner**

Run: `cd frontend-next && npx vitest --version`
Expected: affiche un numéro de version. Si la commande échoue, lancer `cd frontend-next && npm install --save-dev vitest` puis relancer la vérification. Si le projet utilise déjà Jest (vérifier `package.json` scripts), utiliser `npx jest --version` à la place et adapter les commandes de test des steps suivants en conséquence (remplacer `npx vitest run` par `npx jest`).

- [ ] **Step 2: Écrire le test qui échoue**

Créer `frontend-next/src/app/boutique/__tests__/nomParDefaut.test.ts` :

```ts
import { describe, it, expect } from 'vitest'
import { nomParDefautPourCategorie } from '../BoutiqueClient'

describe('nomParDefautPourCategorie', () => {
  it('génère un nom par défaut pour chaque catégorie connue', () => {
    expect(nomParDefautPourCategorie('smartphones')).toBe('Smartphone — à modifier')
    expect(nomParDefautPourCategorie('informatique')).toBe('Article informatique — à modifier')
    expect(nomParDefautPourCategorie('tv-electro')).toBe('TV / Électroménager — à modifier')
    expect(nomParDefautPourCategorie('mode')).toBe('Article mode — à modifier')
    expect(nomParDefautPourCategorie('maison')).toBe('Article maison — à modifier')
    expect(nomParDefautPourCategorie('auto-moto')).toBe('Véhicule — à modifier')
    expect(nomParDefautPourCategorie('jeux')).toBe('Jeu / Console — à modifier')
    expect(nomParDefautPourCategorie('alimentation')).toBe('Produit alimentaire — à modifier')
    expect(nomParDefautPourCategorie('beaute')).toBe('Produit beauté — à modifier')
    expect(nomParDefautPourCategorie('services')).toBe('Service — à modifier')
    expect(nomParDefautPourCategorie('autre')).toBe('Produit — à modifier')
  })

  it('retombe sur "Produit — à modifier" si la catégorie est vide ou inconnue', () => {
    expect(nomParDefautPourCategorie('')).toBe('Produit — à modifier')
    expect(nomParDefautPourCategorie('valeur-inconnue')).toBe('Produit — à modifier')
  })
})
```

Note : `nomParDefautPourCategorie` doit être exporté nommément depuis `BoutiqueClient.tsx` pour être testable — ajouter `export` devant sa déclaration à l'étape suivante (le reste du fichier, un composant de page, n'a pas besoin d'être exporté nommément par ailleurs, seule cette fonction utilitaire l'est).

- [ ] **Step 3: Lancer le test pour vérifier qu'il échoue**

Run: `cd frontend-next && npx vitest run src/app/boutique/__tests__/nomParDefaut.test.ts`
Expected: FAIL — `nomParDefautPourCategorie` n'existe pas encore dans `BoutiqueClient.tsx`.

- [ ] **Step 4: Ajouter la fonction dans `BoutiqueClient.tsx`**

Dans `frontend-next/src/app/boutique/BoutiqueClient.tsx`, juste après la déclaration de `PRODUIT_CATEGORIES` (ligne 406, après le `]` de fermeture), ajouter :

```tsx
const NOMS_PAR_DEFAUT: Record<string, string> = {
  'smartphones':  'Smartphone — à modifier',
  'informatique': 'Article informatique — à modifier',
  'tv-electro':   'TV / Électroménager — à modifier',
  'mode':         'Article mode — à modifier',
  'maison':       'Article maison — à modifier',
  'auto-moto':    'Véhicule — à modifier',
  'jeux':         'Jeu / Console — à modifier',
  'alimentation': 'Produit alimentaire — à modifier',
  'beaute':       'Produit beauté — à modifier',
  'services':     'Service — à modifier',
  'autre':        'Produit — à modifier',
}

export function nomParDefautPourCategorie(categorie: string): string {
  return NOMS_PAR_DEFAUT[categorie] ?? 'Produit — à modifier'
}
```

- [ ] **Step 5: Lancer le test pour vérifier qu'il passe**

Run: `cd frontend-next && npx vitest run src/app/boutique/__tests__/nomParDefaut.test.ts`
Expected: PASS — les deux tests réussissent.

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/app/boutique/BoutiqueClient.tsx frontend-next/src/app/boutique/__tests__/nomParDefaut.test.ts
git commit -m "feat(boutique): ajoute la table des noms par défaut par catégorie de produit"
```

---

### Task 2: Mode d'affichage `modeInitial` dans `ProduitForm`

**Files:**
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx:408-537` (`ProduitForm`)

**Interfaces:**
- Consumes: `nomParDefautPourCategorie` de Task 1.
- Produces: `ProduitForm` accepte une nouvelle prop optionnelle `modeInitial?: 'rapide' | 'detaille'` (défaut `'detaille'` si absente, pour ne rien changer au comportement d'édition d'un produit existant) — consommée par Task 3.

- [ ] **Step 1: Étendre la signature de `ProduitForm` et l'état de mode**

Dans `frontend-next/src/app/boutique/BoutiqueClient.tsx`, ligne 408-424, remplacer :

```tsx
function ProduitForm({ boutiqueId, boutiqueCat, produit, onCancel, onSuccess }: {
  boutiqueId: string
  boutiqueCat?: string | null
  produit?: Produit
  onCancel: () => void
  onSuccess: () => void
}) {
  const action = produit
    ? updateProduit.bind(null, boutiqueId, produit.id)
    : createProduit.bind(null, boutiqueId)
  const [state, formAction] = useFormState<ActionState, FormData>(action, {})
  const [enStock, setEnStock] = useState(produit?.en_stock !== false)
  const [cat, setCat] = useState(produit?.categorie ?? boutiqueCat ?? '')
  const [carac, setCarac] = useState<Record<string, string>>(
    produit?.caracteristiques ?? {}
  )

  useEffect(() => { if (state.success) onSuccess() }, [state.success])

  function handleCarac(k: string, v: string) {
    setCarac(prev => ({ ...prev, [k]: v }))
  }

  const hasCaracFields = cat && cat !== 'autre'
```

par :

```tsx
function ProduitForm({ boutiqueId, boutiqueCat, produit, modeInitial = 'detaille', onCancel, onSuccess }: {
  boutiqueId: string
  boutiqueCat?: string | null
  produit?: Produit
  modeInitial?: 'rapide' | 'detaille'
  onCancel: () => void
  onSuccess: () => void
}) {
  const action = produit
    ? updateProduit.bind(null, boutiqueId, produit.id)
    : createProduit.bind(null, boutiqueId)
  const [state, formAction] = useFormState<ActionState, FormData>(action, {})
  const [enStock, setEnStock] = useState(produit?.en_stock !== false)
  const [cat, setCat] = useState(produit?.categorie ?? boutiqueCat ?? '')
  const [carac, setCarac] = useState<Record<string, string>>(
    produit?.caracteristiques ?? {}
  )
  const [modeRapide, setModeRapide] = useState(modeInitial === 'rapide' && !produit)

  useEffect(() => { if (state.success) onSuccess() }, [state.success])

  function handleCarac(k: string, v: string) {
    setCarac(prev => ({ ...prev, [k]: v }))
  }

  const hasCaracFields = cat && cat !== 'autre' && !modeRapide
```

Note : `modeRapide` est forcé à `false` si `produit` est défini (édition d'un produit existant) — le mode rapide ne s'applique qu'à la création, jamais à l'édition, pour ne jamais masquer des champs déjà remplis d'un produit existant.

- [ ] **Step 2: Masquer le champ Nom en mode rapide et injecter le nom généré**

Ligne 462-466, remplacer :

```tsx
      {/* Nom */}
      <div>
        <label style={labelStyle}>Nom du produit <span style={{ color: '#dc2626' }}>*</span></label>
        <input name="nom" required maxLength={300} defaultValue={produit?.nom} style={inputStyle} placeholder="Ex: iPhone 14 Pro 256 Go" />
      </div>
```

par :

```tsx
      {/* Nom */}
      {modeRapide ? (
        <input type="hidden" name="nom" value={nomParDefautPourCategorie(cat)} />
      ) : (
        <div>
          <label style={labelStyle}>Nom du produit <span style={{ color: '#dc2626' }}>*</span></label>
          <input name="nom" required maxLength={300} defaultValue={produit?.nom ?? (modeInitial === 'rapide' ? nomParDefautPourCategorie(cat) : undefined)} style={inputStyle} placeholder="Ex: iPhone 14 Pro 256 Go" />
        </div>
      )}
```

- [ ] **Step 3: Masquer Description en mode rapide et rendre Prix obligatoire**

Ligne 478-494, remplacer :

```tsx
      {/* Description */}
      <div>
        <label style={labelStyle}>Description</label>
        <textarea name="description" rows={3} defaultValue={produit?.description ?? ''} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Détails supplémentaires, accessoires inclus, garantie…" />
      </div>

      {/* Prix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Prix (FCFA)</label>
          <input name="prix" type="number" min={0} defaultValue={produit?.prix ?? ''} style={inputStyle} placeholder="Ex: 350 000" />
        </div>
        <div>
          <label style={labelStyle}>Prix barré <span style={{ fontSize: 11, color: '#9ca3af' }}>(ancien prix)</span></label>
          <input name="prix_barre" type="number" min={0} defaultValue={produit?.prix_barre ?? ''} style={inputStyle} placeholder="Ex: 400 000" />
        </div>
      </div>
```

par :

```tsx
      {/* Description */}
      {!modeRapide && (
        <div>
          <label style={labelStyle}>Description</label>
          <textarea name="description" rows={3} defaultValue={produit?.description ?? ''} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Détails supplémentaires, accessoires inclus, garantie…" />
        </div>
      )}

      {/* Prix */}
      <div style={{ display: 'grid', gridTemplateColumns: modeRapide ? '1fr' : '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Prix (FCFA) <span style={{ color: '#dc2626' }}>*</span></label>
          <input name="prix" type="number" min={0} required defaultValue={produit?.prix ?? ''} style={inputStyle} placeholder="Ex: 350 000" />
        </div>
        {!modeRapide && (
          <div>
            <label style={labelStyle}>Prix barré <span style={{ fontSize: 11, color: '#9ca3af' }}>(ancien prix)</span></label>
            <input name="prix_barre" type="number" min={0} defaultValue={produit?.prix_barre ?? ''} style={inputStyle} placeholder="Ex: 400 000" />
          </div>
        )}
      </div>
```

Note : le champ `prix` a désormais toujours `required` — c'est un changement de comportement volontaire du mode détaillé aussi (le mode détaillé et le mode rapide partagent le même champ), cohérent avec la décision validée "prix obligatoire même en mode rapide" ; pour un produit existant en édition (`produit` défini), `defaultValue={produit?.prix ?? ''}` reste rempli donc l'attribut `required` ne bloque pas une édition déjà valide.

- [ ] **Step 4: Ajouter le lien "Voir tous les champs" en mode rapide**

Juste après le bloc Photo (après la fermeture du `</div>` ligne 506, avant `{/* En stock toggle */}` ligne 508), insérer :

```tsx
      {modeRapide && (
        <button
          type="button"
          onClick={() => setModeRapide(false)}
          style={{ background: 'none', border: 'none', color: '#1d4ed8', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left', padding: 0 }}
        >
          Voir tous les champs (description, caractéristiques…)
        </button>
      )}
```

- [ ] **Step 5: Masquer le toggle En stock en mode rapide (reste "en stock" par défaut)**

Le hidden input `en_stock` doit continuer à être soumis même quand le toggle visuel est masqué en mode rapide — il faut donc le sortir du bloc conditionnel. Ligne 508-524, remplacer le bloc entier :

```tsx
      {/* En stock toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="hidden" name="en_stock" value={enStock ? 'true' : 'false'} />
        <button type="button" onClick={() => setEnStock(!enStock)} style={{
          width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
          background: enStock ? '#16a34a' : '#d1d5db', transition: 'background .2s', position: 'relative',
        }}>
          <span style={{
            position: 'absolute', top: 3, left: enStock ? 20 : 4,
            width: 16, height: 16, borderRadius: '50%', background: '#fff',
            transition: 'left .2s', display: 'block',
          }} />
        </button>
        <span style={{ fontSize: 13, color: '#374151' }}>
          {enStock ? '✅ En stock' : '❌ Rupture de stock'}
        </span>
      </div>
```

par :

```tsx
      {/* En stock toggle */}
      <input type="hidden" name="en_stock" value={enStock ? 'true' : 'false'} />
      {!modeRapide && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" onClick={() => setEnStock(!enStock)} style={{
            width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
            background: enStock ? '#16a34a' : '#d1d5db', transition: 'background .2s', position: 'relative',
          }}>
            <span style={{
              position: 'absolute', top: 3, left: enStock ? 20 : 4,
              width: 16, height: 16, borderRadius: '50%', background: '#fff',
              transition: 'left .2s', display: 'block',
            }} />
          </button>
          <span style={{ fontSize: 13, color: '#374151' }}>
            {enStock ? '✅ En stock' : '❌ Rupture de stock'}
          </span>
        </div>
      )}
```

- [ ] **Step 6: Vérifier manuellement dans le navigateur**

Run: `cd frontend-next && npm run dev`

Sans encore avoir de bouton d'entrée dédié (ajouté en Task 3), vérifier temporairement en modifiant en dur `modeInitial="rapide"` sur l'appel à `<ProduitForm ... />` dans `CatalogueProduits` (ligne 589-599), recharger la page, ouvrir "+ Ajouter un produit".

Expected : seuls Catégorie, Prix et Photo sont visibles ; le lien "Voir tous les champs" est présent ; cliquer dessus fait apparaître Nom (pré-rempli avec le nom généré), Description, Prix barré, caractéristiques par catégorie, et le toggle En stock, sans perdre la catégorie/prix déjà saisis.

Une fois vérifié, retirer la modification temporaire `modeInitial="rapide"` (elle sera réintroduite proprement en Task 3).

- [ ] **Step 7: Commit**

```bash
git add frontend-next/src/app/boutique/BoutiqueClient.tsx
git commit -m "feat(boutique): ajoute le mode d'affichage rapide/détaillé à ProduitForm"
```

---

### Task 3: Deux boutons d'entrée dans `CatalogueProduits`

**Files:**
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx:544` (état `mode`)
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx:586-602` (rendu conditionnel du formulaire)
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx:604-619` (en-tête avec bouton)

**Interfaces:**
- Consumes: `modeInitial` de Task 2.
- Produces: rien de consommé par une tâche suivante.

- [ ] **Step 1: Étendre le type de l'état `mode` pour porter le mode initial choisi**

Ligne 544, remplacer :

```tsx
  const [mode, setMode] = useState<'list' | 'create' | { editing: Produit }>('list')
```

par :

```tsx
  const [mode, setMode] = useState<'list' | { creating: 'rapide' | 'detaille' } | { editing: Produit }>('list')
```

- [ ] **Step 2: Adapter le rendu conditionnel du formulaire**

Ligne 586-602, remplacer :

```tsx
  if (mode === 'create' || (typeof mode === 'object' && 'editing' in mode)) {
    return (
      <div style={{ maxWidth: 560 }}>
        <ProduitForm
          boutiqueId={boutique.id}
          boutiqueCat={boutique.categorie}
          produit={typeof mode === 'object' ? mode.editing : undefined}
          onCancel={() => setMode('list')}
          onSuccess={() => {
            setMode('list')
            setSuccessMsg(typeof mode === 'object' ? '✅ Produit modifié !' : '✅ Produit ajouté !')
            loadProduits()
          }}
        />
      </div>
    )
  }
```

par :

```tsx
  if (typeof mode === 'object' && ('creating' in mode || 'editing' in mode)) {
    const editing = 'editing' in mode ? mode.editing : undefined
    return (
      <div style={{ maxWidth: 560 }}>
        <ProduitForm
          boutiqueId={boutique.id}
          boutiqueCat={boutique.categorie}
          produit={editing}
          modeInitial={'creating' in mode ? mode.creating : 'detaille'}
          onCancel={() => setMode('list')}
          onSuccess={() => {
            setMode('list')
            setSuccessMsg(editing ? '✅ Produit modifié !' : '✅ Produit ajouté !')
            loadProduits()
          }}
        />
      </div>
    )
  }
```

- [ ] **Step 3: Remplacer le bouton unique par les deux boutons d'entrée**

Ligne 604-619, remplacer :

```tsx
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          {produits.length} produit{produits.length !== 1 ? 's' : ''} / {quota} max
        </p>
        <button
          onClick={() => setMode('create')}
          style={{
            background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          + Ajouter un produit
        </button>
      </div>
```

par :

```tsx
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          {produits.length} produit{produits.length !== 1 ? 's' : ''} / {quota} max
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setMode({ creating: 'rapide' })}
            style={{
              background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            ⚡ Ajout rapide
          </button>
          <button
            onClick={() => setMode({ creating: 'detaille' })}
            style={{
              background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Ajout détaillé
          </button>
        </div>
      </div>
```

- [ ] **Step 4: Mettre à jour le bouton de l'état vide ("Aucun produit dans votre catalogue")**

Ligne 634-644, remplacer :

```tsx
          <button
            onClick={() => setMode('create')}
            style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}
          >
            Ajouter mon premier produit
          </button>
```

par :

```tsx
          <button
            onClick={() => setMode({ creating: 'rapide' })}
            style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}
          >
            Ajouter mon premier produit
          </button>
```

- [ ] **Step 5: Vérifier visuellement dans le navigateur**

Run: `cd frontend-next && npm run dev`

Se connecter avec un compte boutique Pro/Business, aller sur `/boutique` → gérer une boutique → onglet Catalogue.

Expected : deux boutons "⚡ Ajout rapide" et "Ajout détaillé" côte à côte ; cliquer sur "⚡ Ajout rapide" ouvre le formulaire en mode rapide (Catégorie/Prix/Photo uniquement) ; cliquer sur "Ajout détaillé" ouvre le formulaire complet habituel (tous les champs, y compris Nom visible et requis).

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/app/boutique/BoutiqueClient.tsx
git commit -m "feat(boutique): ajoute les boutons d'entrée Ajout rapide / Ajout détaillé"
```

---

### Task 4: Badge "✏️ À compléter" pour les produits au nom généré

**Files:**
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx` (bloc "Infos" de la carte produit dans `CatalogueProduits`, même bloc déjà modifié par le Chantier 1 pour le badge de statut de synchro s'il a été implémenté avant celui-ci ; sinon le bloc "Infos" original)

**Interfaces:**
- Consumes: `nomParDefautPourCategorie` de Task 1 (pour détecter le suffixe généré, via une simple vérification de chaîne — pas besoin de rappeler la fonction).
- Produces: rien de consommé par une tâche suivante — dernière tâche du plan.

- [ ] **Step 1: Localiser le bloc "Infos" actuel de la carte produit**

Ouvrir `frontend-next/src/app/boutique/BoutiqueClient.tsx` et chercher le bloc qui affiche `<p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{p.nom}</p>` à l'intérieur de `CatalogueProduits` (dans le `.map(p => (...))` de la liste des produits). Si le Chantier 1 a déjà été implémenté, ce bloc contient également un badge de statut de synchro WhatsApp (`whatsapp_sync_statut`) ajouté à la même rangée de badges — dans ce cas, ajouter le nouveau badge à la suite des badges existants dans la même rangée `<div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>`. Si le Chantier 1 n'a pas encore été implémenté, ce bloc ne contient que le badge En stock/Rupture — ajouter le nouveau badge à la suite de celui-ci dans la même rangée.

- [ ] **Step 2: Ajouter le badge conditionnel**

Dans la rangée de badges identifiée à l'étape précédente (juste après le dernier badge existant, avant la fermeture du `</div>` de cette rangée), ajouter :

```tsx
                  {p.nom.endsWith('— à modifier') && (
                    <span style={{
                      fontSize: 11, padding: '1px 6px', borderRadius: 20,
                      background: '#fef3c7', color: '#b45309', fontWeight: 700,
                    }}>
                      ✏️ À compléter
                    </span>
                  )}
```

- [ ] **Step 3: Vérifier visuellement dans le navigateur**

Run: `cd frontend-next && npm run dev`

Créer un produit via "⚡ Ajout rapide" (catégorie au choix, prix requis, sans photo si besoin pour aller vite). Retourner à la liste du Catalogue.

Expected : le produit créé affiche le badge "✏️ À compléter" à côté des autres badges. Cliquer "Modifier" sur ce produit → le formulaire s'ouvre en mode détaillé (car `produit` est défini, donc `modeRapide` est forcé à `false` par la logique de Task 2) avec le nom généré pré-rempli et modifiable.

- [ ] **Step 4: Vérifier que le badge disparaît après renommage**

Dans le formulaire d'édition ouvert à l'étape précédente, remplacer le nom généré par un vrai nom (ex. "iPhone 13 128 Go") et enregistrer.

Expected : de retour dans la liste, le badge "✏️ À compléter" n'apparaît plus sur ce produit.

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/app/boutique/BoutiqueClient.tsx
git commit -m "feat(boutique): affiche un badge à compléter pour les produits créés en ajout rapide"
```

---

## Vérification finale (bout en bout)

1. `cd frontend-next && npx vitest run src/app/boutique/__tests__/nomParDefaut.test.ts` — tous les tests passent.
2. `cd frontend-next && npm run dev` — démarre sans erreur.
3. Créer un produit en mode rapide pour chacune des 11 catégories (ou un échantillon représentatif) et vérifier que le nom généré correspond exactement à la table de Task 1.
4. Vérifier qu'un produit créé en mode rapide sans prix ne peut pas être soumis (validation HTML5 `required` bloque, cohérent avec la décision "prix obligatoire même en mode rapide").
5. Vérifier qu'un produit existant ouvert en "Modifier" s'ouvre toujours en mode détaillé complet, jamais en mode rapide, quel que soit la façon dont il a été créé.
