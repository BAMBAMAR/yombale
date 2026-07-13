# Comparaison « zéro rejet » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dès le premier produit ajouté à la comparaison, filtrer automatiquement les listes produits sur son groupe (écouteurs, frigos, smartphones…) pour que l'utilisateur ne subisse jamais de rejet « type incompatible ».

**Architecture:** Inférence du groupe par mots-clés côté frontend (portage de `_inferCat` du SPA legacy), filtre serveur via le paramètre `sousType` déjà supporté par `GET /api/produits` (dictionnaire de synonymes `SOUS_TYPE_MOTS`, étendu de 5 groupes), poussé dans l'URL au premier ajout. Bandeau explicatif + boutons ⚖ désactivés (jamais de toast d'erreur après clic).

**Tech Stack:** Next.js 14 App Router (Server Components + client components), Express/PostgreSQL existants. Pas de framework de test dans le repo — vérification par `npx tsc --noEmit`, `curl` contre le backend, et scénario manuel.

**Spec:** `docs/superpowers/specs/2026-07-13-comparaison-zero-rejet-design.md`

## Global Constraints

- Périmètre : produits uniquement. Quand la comparaison active est immo/télécom, le comportement des boutons ⚖ produits reste inchangé.
- Jamais de rejet après clic : tout ⚖ incompatible est rendu **désactivé** avec un `title` explicatif, jamais un clic qui échoue.
- `nopalou_compare` reste un **tableau** JSON (rétrocompatibilité avec `CompareBar`/`CardActions` existants) — on enrichit les entrées, on ne change pas la forme racine.
- Toute tâche frontend se termine par `npx tsc --noEmit` (dans `frontend-next/`) avec **zéro erreur** avant d'être déclarée finie — un `curl` de page qui charge ne suffit pas (incident documenté du 10 juillet).
- Ne jamais lancer `npm run build` pendant que le dev server (port 3001) tourne.
- Clés de groupe partagées frontend/backend : `audio`, `tv`, `froid`, `clim`, `electro`, `tablette`, `smartphones`, `ordinateurs`, `maison`, `mode`, `auto-moto`, `jeux` (+ clés backend préexistantes non utilisées par l'inférence : `iphone`, `samsung`, `xiaomi`, `tecno`).

---

### Task 1: Backend — étendre `SOUS_TYPE_MOTS` avec les 5 groupes manquants

**Files:**
- Modify: `backend/routes/produits.js:36-48`

**Interfaces:**
- Produces: `GET /api/produits?sousType=<g>` accepte désormais `smartphones`, `maison`, `mode`, `auto-moto`, `jeux` en plus des clés existantes. Les tâches 2-5 s'appuient sur ces clés.

- [ ] **Step 1: Ajouter les 5 clés au dictionnaire**

Dans `backend/routes/produits.js`, l'objet `SOUS_TYPE_MOTS` (lignes 36-48) reçoit 5 entrées supplémentaires, après `'ordinateurs'` :

```js
      'smartphones' : ['iphone','galaxy','tecno ','infinix','itel ','vivo ','oppo ','realme','redmi','xiaomi','huawei','nokia ','oneplus','pixel','motorola','smartphone','telephone portable'],
      'maison'      : ['canape','chaise','matelas','lit ','armoire','meuble','fontaine','table basse','commode'],
      'mode'        : ['robe ','chaussure','sac a main','chemise','pantalon','sneaker','basket','parfum','eau de toilette','t-shirt','jean '],
      'auto-moto'   : ['voiture','moto ','scooter','trottinette','piece auto','batterie voiture'],
      'jeux'        : ['playstation','ps4','ps5','xbox','nintendo','manette','jeu video','gaming','casque gamer'],
```

Note : les mots sont comparés via `LOWER(p.nom) LIKE '%mot%'` (l. 68) — les espaces finaux (`'tecno '`, `'lit '`) évitent les faux positifs en milieu de mot, même technique que `'split '` dans la clé `clim` existante.

- [ ] **Step 2: Vérifier contre la base réelle**

Backend local lancé (`npm run dev`, port 3000), pour chaque nouvelle clé :

```bash
curl -s "http://localhost:3000/api/produits?sousType=smartphones&limit=3" | head -c 600
curl -s "http://localhost:3000/api/produits?sousType=jeux&limit=3" | head -c 600
curl -s "http://localhost:3000/api/produits?sousType=inexistant&limit=3"
```

Attendu : les deux premiers renvoient `success: true` avec des produits plausibles (noms contenant les mots-clés) ; le troisième renvoie `{"error":"Sous-type invalide"}` (validation existante, l. 53-55).

Vérifier aussi qu'une clé préexistante n'a pas régressé :

```bash
curl -s "http://localhost:3000/api/produits?sousType=audio&limit=3" | head -c 600
```

- [ ] **Step 3: Commit**

```bash
git add backend/routes/produits.js
git commit -m "feat(produits): 5 nouveaux sousType pour le filtre comparaison (smartphones, maison, mode, auto-moto, jeux)"
```

---

### Task 2: Lib frontend — inférence du groupe et helpers de comparaison

**Files:**
- Create: `frontend-next/src/lib/comparaison.ts`

**Interfaces:**
- Produces (consommé par les tâches 3, 5, 6) :
  - `type CompareEntry = { id: string; nom: string; type: string; groupe?: string; catSlug?: string }`
  - `infererGroupe(nom: string): string` — clé `SOUS_TYPE_MOTS` ou `''`
  - `GROUPE_LABELS: Record<string, string>` — libellés français
  - `CAT_NOM_SLUG: Record<string, string>` — nom DB (`'Telephones'`) → slug (`'smartphones'`)
  - `lireCompare(): CompareEntry[]` — lecture tolérante de `localStorage.nopalou_compare`
  - `MAX_COMPARE = 3`

- [ ] **Step 1: Créer le fichier**

Portage fidèle de `_inferCat` (`frontend/app.js:727-766`) — **l'ordre des tests est significatif** (audio et tv avant smartphones, tablette avant smartphones, froid/clim avant electro) :

```ts
// Inférence du groupe de produit + helpers du mode comparaison.
// Les clés retournées par infererGroupe doivent exister dans SOUS_TYPE_MOTS
// (backend/routes/produits.js) — c'est le contrat qui permet le filtre serveur.

export const MAX_COMPARE = 3

export interface CompareEntry {
  id: string
  nom: string
  type: string
  groupe?: string   // clé sousType backend ('' si indétectable)
  catSlug?: string  // repli : slug de la catégorie DB
}

export const GROUPE_LABELS: Record<string, string> = {
  'audio':       'écouteurs & audio',
  'tv':          'téléviseurs',
  'froid':       'réfrigérateurs & congélateurs',
  'clim':        'climatiseurs',
  'electro':     'électroménager',
  'tablette':    'tablettes',
  'smartphones': 'smartphones',
  'ordinateurs': 'ordinateurs',
  'maison':      'maison & mobilier',
  'mode':        'mode & accessoires',
  'auto-moto':   'auto & moto',
  'jeux':        'jeux & consoles',
}

// Nom DB de catégorie → slug d'URL (même map que produit/[id]/page.tsx)
export const CAT_NOM_SLUG: Record<string, string> = {
  'Telephones':   'smartphones',
  'Informatique': 'informatique',
  'TV & Electro': 'tv-electro',
  'Mode':         'mode',
  'Maison':       'maison',
  'Auto & Moto':  'auto-moto',
  'Jeux':         'jeux',
}

// Portage de _inferCat (frontend/app.js l.727) — l'ordre des tests est significatif :
// audio/tv AVANT smartphones (« Galaxy Buds », « Samsung TV »), tablette AVANT smartphones.
export function infererGroupe(nom: string): string {
  if (!nom) return ''
  const n = nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

  if (/ecouteur|airpod|galaxy.buds|freebuds|redmi.buds|nothing.ear|casque.(audio|bluetooth|sans.fil|anc|noise)|\btws\b|enceinte.(bluetooth|portable|sans.fil)|haut.parleur|soundbar|barre.de.son|montre.connect|smartwatch|bracelet.connect|galaxy.watch|galaxy.fit|redmi.watch|xiaomi.watch/.test(n)) return 'audio'
  if (/television|televiseur|tv.4k|tv.led|tv.oled|tv.qled|smart.tv|android.tv|led.tv|\bpouces?.tv\b|hisense.tv|lg.tv|samsung.tv|tcl.tv|bruhm|skyworth|ecran.tv|astech.tv|finix.tv/.test(n)) return 'tv'
  if (/refrigerat|frigo\b|congelat|armoire.refrig|vitrine.refrig/.test(n)) return 'froid'
  if (/climatiseur|\bsplit\s|\bsplit.inv|pompe.a.chaleur/.test(n)) return 'clim'
  if (/lave.linge|machine.{0,5}laver|seche.linge|lave.vaisselle|micro.onde|four.(electrique|gaz)|chauffe.eau|ventilateur|air.fryer|friteuse|induction|plaque.de.cuisson|mixeur|blender|aspirateur|fer.a.repasser|cafetiere|bouilloire|grille.pain/.test(n)) return 'electro'
  if (/galaxy.tab|samsung.tab|\btablette\b|\bipad\b|lenovo.tab|matepad|xiaomi.pad/.test(n)) return 'tablette'
  if (/iphone|tecno\s|infinix\s|oppo\s|realme\s|\bitel\s|vivo\s|redmi\s|samsung.galaxy.[asmzf]|xiaomi.(mi|poco)\s|huawei.[pyn]|nokia\s|oneplus\s|google.pixel|motorola.moto|smartphone|telephone.portable/.test(n)) return 'smartphones'
  if (/\bgalaxy\b/.test(n) && !/tab|watch|buds|fit/.test(n)) return 'smartphones'
  if (/\blaptop\b|ordinateur|macbook|chromebook|lenovo|dell\s|\bpc\s|\basus\b|\bacer\b|imprimante|disque.dur|\bssd\b|moniteur|routeur|clavier\s|souris\s/.test(n)) return 'ordinateurs'
  if (/canape|\bchaise\b|matelas|\blit\s|\barmoire\b|\bmeuble\b|fontaine|table.basse|commode/.test(n)) return 'maison'
  if (/\brobe\b|chaussure|sac.a.main|chemise\s|\bpantalon\b|sneaker|\bbasket\b|\bparfum\b|eau.de.toilette|jean.homme|t-shirt/.test(n)) return 'mode'
  if (/\bvoiture\b|\bmoto\s|\bscooter\b|trottinette|piece.auto|batterie.voiture/.test(n)) return 'auto-moto'
  if (/playstation|\bps[45]\b|\bxbox\b|nintendo|manette.jeu|jeu.video|\bgaming\b|casque.gamer/.test(n)) return 'jeux'

  return ''
}

// Lecture tolérante : accepte l'ancien format (entrées sans groupe) et le nouveau.
export function lireCompare(): CompareEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem('nopalou_compare') || '[]')
    return Array.isArray(raw) ? raw : []
  } catch { return [] }
}
```

Différence assumée vs legacy : la clé `informatique` du legacy devient `ordinateurs` (la clé qui existe côté backend). `smartphones` correspond bien à la nouvelle clé backend de la Task 1.

- [ ] **Step 2: Vérifier la compilation et le comportement**

```bash
cd frontend-next && npx tsc --noEmit
```

Attendu : zéro erreur.

Vérification comportementale rapide de l'inférence (la fonction est pure — extraire son corps dans un script scratch Node est autorisé pour CE test uniquement, ou tester via la page en Task 3) ; cas à valider au plus tard lors du scénario manuel de la Task 7 :
- « AirPods Pro 2 » → `audio` ; « Samsung Galaxy Buds 2 » → `audio` (pas smartphones)
- « Réfrigérateur Samsung 350L » → `froid` ; « Samsung TV 55 pouces » → `tv`
- « Samsung Galaxy A15 » → `smartphones` ; « Galaxy Tab A9 » → `tablette`
- « Produit mystère » → `''`

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/lib/comparaison.ts
git commit -m "feat(comparaison): lib d'inference du groupe de produit (portage _inferCat legacy)"
```

---

### Task 3: `CardActions` — groupe mémorisé, filtre poussé dans l'URL, boutons désactivés

**Files:**
- Modify: `frontend-next/src/app/CardActions.tsx`
- Modify: `frontend-next/src/app/ProduitsListe.tsx:88` (passer `categorie`)
- Modify: `frontend-next/src/app/categorie/[slug]/page.tsx:234` (passer `categorieSlug`)
- Modify: `frontend-next/src/app/categorie/[slug]/[sousCategorie]/page.tsx:175` (passer `categorieSlug`)

**Interfaces:**
- Consumes: `infererGroupe`, `lireCompare`, `CompareEntry`, `CAT_NOM_SLUG`, `MAX_COMPARE` (Task 2).
- Produces: entrées `nopalou_compare` enrichies (`groupe`, `catSlug`) ; nouvelles props optionnelles `categorie?: string | null` (nom DB) et `categorieSlug?: string` sur `CardActions`. Les tâches 5-6 lisent `lireCompare()[0].groupe`.

- [ ] **Step 1: Réécrire la logique compare de `CardActions.tsx`**

Remplacer les imports, l'interface `Props`, `syncCmp` et `toggleCompare` (la partie favoris ne change pas). Le composant devient :

```tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  infererGroupe, lireCompare, CAT_NOM_SLUG, MAX_COMPARE, GROUPE_LABELS,
  type CompareEntry,
} from '@/lib/comparaison'

interface Props {
  id: string | number
  nom: string
  type?: 'produit' | 'immo' | 'telecom' | 'annonce'
  categorie?: string | null   // nom DB ('Telephones') — cartes de l'accueil
  categorieSlug?: string      // slug direct — pages /categorie/[slug]
}
```

⚠️ **Piège Next.js** : ne PAS utiliser `useSearchParams()` dans `CardActions`, `CompareBar` ni le bandeau — ces composants sont montés sur des pages statiques (landing pages SEO `[sousCategorie]`, layout global) et `useSearchParams` sans Suspense boundary fait échouer `next build`. Lire la query string via `window.location.search` **uniquement dans les handlers et les `useEffect`** (jamais pendant le rendu), ce qui est sûr car ils ne s'exécutent que côté client.

Dans le corps du composant, ajouter les hooks de navigation et l'état de compatibilité :

```tsx
  const router       = useRouter()
  const pathname     = usePathname()
  const [blocage, setBlocage] = useState<string | null>(null) // null = cliquable

  const monGroupe  = type === 'produit' ? infererGroupe(nom) : ''
  const monCatSlug = categorieSlug || (categorie ? CAT_NOM_SLUG[categorie] : '') || ''

  function syncCmp() {
    const list = lireCompare()
    setCmp(list.some(i => i.id === sid))
    // Désactivation « zéro rejet » : uniquement quand une comparaison PRODUIT est active.
    if (list.length === 0 || list[0].type !== 'produit' || list.some(i => i.id === sid)) {
      setBlocage(null)
      return
    }
    if (type !== 'produit') {
      setBlocage('Comparaison produits en cours — videz-la pour comparer autre chose')
      return
    }
    const actif    = list[0].groupe || list[0].catSlug || ''
    const mien     = monGroupe || monCatSlug
    if (actif && mien && actif !== mien) {
      const label = GROUPE_LABELS[actif] || actif
      setBlocage(`Comparaison en cours limitée aux ${label}`)
    } else {
      setBlocage(null)
    }
  }
```

`toggleCompare` devient :

```tsx
  function toggleCompare(e: React.MouseEvent) {
    e.preventDefault()
    if (blocage) return // bouton rendu disabled — garde-fou
    try {
      const list = lireCompare()
      const already = list.some(i => i.id === sid)
      let next: CompareEntry[]
      if (already) {
        next = list.filter(i => i.id !== sid)
      } else {
        if (list.length >= MAX_COMPARE) return
        next = [...list, { id: sid, nom, type, groupe: monGroupe || undefined, catSlug: monCatSlug || undefined }]
      }
      localStorage.setItem('nopalou_compare', JSON.stringify(next))
      setCmp(!already)
      window.dispatchEvent(new CustomEvent('nopalou:compare'))

      // Premier ajout d'un produit : pousser le filtre dans l'URL des pages liste.
      const estListe = pathname === '/' || /^\/categorie\/[^/]+$/.test(pathname)
      if (!already && list.length === 0 && type === 'produit' && estListe) {
        const params = new URLSearchParams(window.location.search)
        params.delete('page')
        if (monGroupe) {
          params.set('sousType', monGroupe)
          router.push(`${pathname}?${params.toString()}`)
        } else if (monCatSlug && pathname === '/') {
          params.set('categorie', monCatSlug)
          router.push(`${pathname}?${params.toString()}`)
        }
      }
    } catch {}
  }
```

Le bouton ⚖ du JSX prend l'état désactivé :

```tsx
      <button
        onClick={toggleCompare}
        disabled={!!blocage}
        className={`card-action-btn${cmp ? ' active' : ''}`}
        title={blocage ?? (cmp ? 'Retirer de la comparaison' : 'Comparer')}
        aria-label="Comparer"
        aria-disabled={!!blocage}
        style={blocage ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
      >
        ⚖
      </button>
```

Garder `syncFav`/`toggleFav`/`lireFavs` strictement inchangés. Le `useEffect` existant appelle déjà `syncCmp` sur l'événement `nopalou:compare` — la désactivation se met donc à jour en direct sur toutes les cartes.

- [ ] **Step 2: Passer la catégorie aux trois points d'appel produits**

`ProduitsListe.tsx:88` :
```tsx
              <CardActions id={p.id} nom={p.nom} categorie={p.categorie} />
```

`categorie/[slug]/page.tsx:234` et `categorie/[slug]/[sousCategorie]/page.tsx:175` :
```tsx
                  <CardActions id={p.id} nom={p.nom} categorieSlug={params.slug} />
```

Les appels immo/télécom/annonces ne changent pas — la désactivation cross-type est gérée dans `CardActions` lui-même.

- [ ] **Step 3: Vérifier**

```bash
cd frontend-next && npx tsc --noEmit
```

Attendu : zéro erreur. Puis, dev server lancé (port 3001, backend sur 3000) :
1. Sur `/`, cliquer ⚖ sur un écouteur → l'URL devient `/?sousType=audio` et la liste ne montre plus que de l'audio **(ne fonctionnera qu'après la Task 4 — à ce stade, vérifier seulement que l'URL change et qu'aucune erreur console n'apparaît)**.
2. Ouvrir `/annonces` : les ⚖ des cartes annonces sont grisés avec le title explicatif.
3. Vider `localStorage.nopalou_compare` (console) → les ⚖ redeviennent actifs.

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/app/CardActions.tsx frontend-next/src/app/ProduitsListe.tsx "frontend-next/src/app/categorie/[slug]/page.tsx" "frontend-next/src/app/categorie/[slug]/[sousCategorie]/page.tsx"
git commit -m "feat(comparaison): groupe memorise au 1er ajout, filtre pousse dans l'URL, boutons incompatibles desactives"
```

---

### Task 4: Pages liste — transmettre `sousType` au backend

**Files:**
- Modify: `frontend-next/src/app/page.tsx:70-103`
- Modify: `frontend-next/src/app/categorie/[slug]/page.tsx:65-102`
- Modify: `frontend-next/src/app/ProduitsListe.tsx` (prop `sousType` pour « Voir plus »)

**Interfaces:**
- Consumes: paramètre d'URL `?sousType=` poussé par la Task 3 ; backend Task 1.
- Produces: `ProduitsListe` accepte une prop `sousType: string` (l'accueil la transmet).

- [ ] **Step 1: Accueil (`page.tsx`)**

Ajouter `sousType` au type des `searchParams` et le lire :

```tsx
  searchParams: { q?: string; categorie?: string; prixMax?: string; page?: string; tri?: string; sousType?: string }
```
```tsx
  const sousType  = searchParams.sousType  ?? ''
```

Le transmettre au fetch (après la ligne `if (tri) params.set('tri', tri)`) :

```tsx
    if (sousType)  params.set('sousType',  sousType)
```

Inclure le filtre dans `hasFiltre` (l. 103) pour que la vue résultats s'affiche :

```tsx
  const hasFiltre = q || categorie || prixMax || sousType
```

Et le passer à `<ProduitsListe … sousType={sousType} />` (l. 229).

- [ ] **Step 2: Page catégorie (`categorie/[slug]/page.tsx`)**

```tsx
  searchParams: { page?: string; prixMax?: string; tri?: string; sousType?: string }
```
```tsx
  const sousType = searchParams.sousType ?? ''
```
Après `if (tri !== 'pertinence') qs.set('tri', tri)` :
```tsx
  if (sousType) qs.set('sousType', sousType)
```
Et préserver le paramètre dans la pagination, dans `buildLink` après la ligne `if (tri !== 'pertinence') ps.set('tri', tri)` :
```tsx
    if (sousType) ps.set('sousType', sousType)
```

- [ ] **Step 3: `ProduitsListe.tsx` — « Voir plus » filtré**

Ajouter à l'interface `Props` et à la signature :

```tsx
  sousType?: string
```
```tsx
export default function ProduitsListe({ initialProduits, total, q, categorie, prixMax, tri, sousType = '' }: Props) {
```

Dans `voirPlus()`, après `if (tri) params.set('tri', tri)` :

```tsx
      if (sousType)  params.set('sousType', sousType)
```

- [ ] **Step 4: Vérifier**

```bash
cd frontend-next && npx tsc --noEmit
```

Zéro erreur. Puis en navigateur : `http://localhost:3001/?sousType=audio` ne montre que des produits audio, compteur de résultats cohérent, « Voir plus » ne charge que de l'audio. `http://localhost:3001/categorie/tv-electro?sousType=froid` ne montre que du froid. Rejouer le scénario Task 3 step 3.1 : cette fois la liste se filtre réellement au clic ⚖.

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/app/page.tsx "frontend-next/src/app/categorie/[slug]/page.tsx" frontend-next/src/app/ProduitsListe.tsx
git commit -m "feat(produits): parametre sousType transmis au backend sur accueil et pages categorie"
```

---

### Task 5: Bandeau « Comparaison active » + synchronisation du filtre

**Files:**
- Create: `frontend-next/src/components/CompareFilterBanner.tsx`
- Modify: `frontend-next/src/app/page.tsx` (monter le bandeau au-dessus de `<ProduitsListe>`)
- Modify: `frontend-next/src/app/categorie/[slug]/page.tsx` (au-dessus de la grille produits)
- Modify: `frontend-next/src/app/globals.css` (styles du bandeau)

**Interfaces:**
- Consumes: `lireCompare`, `GROUPE_LABELS` (Task 2) ; paramètre `sousType` (Task 4).
- Produces: composant `<CompareFilterBanner />` sans props, autonome (client).

- [ ] **Step 1: Créer le composant**

Même piège que Task 3 : pas de `useSearchParams()` — lecture via `window.location.search` dans les effets/handlers uniquement.

```tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { lireCompare, GROUPE_LABELS, type CompareEntry } from '@/lib/comparaison'

// Bandeau affiché sur les pages liste produits quand une comparaison produit est active.
// Rôle double : expliquer pourquoi la liste est filtrée, et synchroniser le filtre
// d'URL si la comparaison a été démarrée ailleurs (ex: autre page, autre session).
export default function CompareFilterBanner() {
  const router       = useRouter()
  const pathname     = usePathname()
  const [items, setItems] = useState<CompareEntry[]>([])

  function read() { setItems(lireCompare()) }

  useEffect(() => {
    read()
    window.addEventListener('nopalou:compare', read)
    return () => window.removeEventListener('nopalou:compare', read)
  }, [])

  const actif  = items.length > 0 && items[0].type === 'produit' ? items[0] : null
  const groupe = actif?.groupe || ''

  // Synchronise l'URL : comparaison active avec groupe, mais paramètre absent.
  useEffect(() => {
    if (!groupe) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('sousType') === groupe) return
    params.set('sousType', groupe)
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`)
  }, [groupe, pathname, router])

  if (!actif) return null

  const label   = GROUPE_LABELS[groupe] || actif.catSlug || ''
  const premier = actif.nom.length > 40 ? actif.nom.slice(0, 40) + '…' : actif.nom

  function vider(e: React.MouseEvent) {
    e.preventDefault()
    localStorage.removeItem('nopalou_compare')
    window.dispatchEvent(new CustomEvent('nopalou:compare'))
    const params = new URLSearchParams(window.location.search)
    params.delete('sousType')
    params.delete('page')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="compare-filter-banner" role="status">
      <span className="compare-filter-banner-titre">⚖ Comparaison active</span>
      <span className="compare-filter-banner-texte">
        {label
          ? <>Affichage limité aux <strong>{label}</strong> (similaires à « {premier} »)</>
          : <>Sélection en cours : « {premier} »</>}
      </span>
      <button onClick={vider} className="compare-filter-banner-vider">✕ Vider</button>
    </div>
  )
}
```

- [ ] **Step 2: Styles dans `globals.css`**

À la suite des styles `.compare-bar*` existants, en réutilisant les variables du thème (`--accent`, `--text2`…) :

```css
/* Bandeau « Comparaison active » au-dessus des listes produits */
.compare-filter-banner {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  border: 1.5px solid var(--accent); border-radius: 10px;
  background: color-mix(in srgb, var(--accent) 8%, var(--bg, #fff));
  padding: 10px 16px; margin: 0 0 14px; font-size: 13px;
}
.compare-filter-banner-titre { font-weight: 700; color: var(--accent); }
.compare-filter-banner-texte { flex: 1; color: var(--text2); min-width: 200px; }
.compare-filter-banner-vider {
  border: 1px solid var(--border, #e2e8f0); background: transparent;
  border-radius: 8px; padding: 5px 12px; font-size: 12px; cursor: pointer;
  color: var(--text2);
}
.compare-filter-banner-vider:hover { color: #ef4444; border-color: #ef4444; }
```

(Si `color-mix` pose problème avec les variables du projet, un fond fixe clair type `#fff7ed` est un repli acceptable — regarder comment `.compare-bar` gère son fond et rester cohérent.)

- [ ] **Step 3: Monter le bandeau sur les deux pages**

`page.tsx` (accueil) — import en tête, puis juste avant `<ProduitsListe`:
```tsx
import CompareFilterBanner from '@/components/CompareFilterBanner'
```
```tsx
        <CompareFilterBanner />
        <ProduitsListe
```

`categorie/[slug]/page.tsx` — même import, monté immédiatement au-dessus de la grille de produits (la `div` qui contient les cartes, vers la ligne 230).

- [ ] **Step 4: Vérifier**

```bash
cd frontend-next && npx tsc --noEmit
```

Zéro erreur. En navigateur :
1. Ajouter un écouteur à la comparaison depuis `/` → bandeau visible, liste filtrée.
2. Naviguer vers `/categorie/tv-electro` → le bandeau se remonte et **pousse** `?sousType=audio` (liste vide probable + bandeau qui l'explique).
3. Cliquer « ✕ Vider » → bandeau disparaît, paramètre retiré, liste complète restaurée, barre de comparaison du bas disparue aussi.

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/components/CompareFilterBanner.tsx frontend-next/src/app/page.tsx "frontend-next/src/app/categorie/[slug]/page.tsx" frontend-next/src/app/globals.css
git commit -m "feat(comparaison): bandeau Comparaison active avec synchronisation du filtre et bouton Vider"
```

---

### Task 6: `CompareBar` — retirer le filtre d'URL quand la sélection se vide

**Files:**
- Modify: `frontend-next/src/app/CompareBar.tsx`

**Interfaces:**
- Consumes: `lireCompare`, `CompareEntry` (Task 2).

- [ ] **Step 1: Brancher la navigation et nettoyer le paramètre**

Dans `CompareBar.tsx`, remplacer l'interface locale `Item` par `CompareEntry` importé, et ajouter les hooks :

Même piège que Task 3 : `CompareBar` est monté globalement (layout via `BottomBars`) — pas de `useSearchParams()`, lecture via `window.location.search` dans les handlers.

```tsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { lireCompare, type CompareEntry } from '@/lib/comparaison'
```

```tsx
  const router       = useRouter()
  const pathname     = usePathname()
  const [items, setItems] = useState<CompareEntry[]>([])

  function read() { setItems(lireCompare()) }
```

Nouvelle fonction utilitaire dans le composant, appelée quand la sélection devient vide :

```tsx
  function retirerFiltreUrl() {
    const params = new URLSearchParams(window.location.search)
    if (!params.get('sousType')) return
    params.delete('sousType')
    params.delete('page')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }
```

`clear()` appelle `retirerFiltreUrl()` après le `dispatchEvent`. `removeOne(id)` l'appelle aussi quand `next.length === 0`.

- [ ] **Step 2: Vérifier**

```bash
cd frontend-next && npx tsc --noEmit
```

Zéro erreur. En navigateur : depuis `/?sousType=audio` avec 1 écouteur sélectionné, retirer l'élément depuis la barre du bas → le paramètre disparaît de l'URL et la liste complète revient. Même chose avec « ✕ Vider » de la barre.

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/app/CompareBar.tsx
git commit -m "feat(comparaison): CompareBar retire le filtre sousType de l'URL quand la selection se vide"
```

---

### Task 7: Vérification de bout en bout

**Files:** aucun nouveau — scénario complet + revue.

- [ ] **Step 1: Compilation stricte**

```bash
cd frontend-next && npx tsc --noEmit
```
Zéro erreur.

- [ ] **Step 2: Scénario manuel complet (dev servers 3000 + 3001)**

1. `/` → ⚖ sur un écouteur (ex: contient « écouteur », « airpods » ou « casque bluetooth ») → URL `/?sousType=audio`, bandeau visible, liste 100% audio, compteur cohérent.
2. ⚖ sur un 2ᵉ écouteur → barre du bas propose « Comparer → » vers `/comparaison?ids=…`.
3. Chercher `?q=sony` dans la liste filtrée → recherche ET filtre combinés.
4. « Voir plus » → uniquement de l'audio.
5. `/annonces`, `/immo`, `/telecom` → boutons ⚖ grisés avec title explicatif.
6. Page catégorie `/categorie/tv-electro` → bandeau + filtre synchronisés.
7. « ✕ Vider » (bandeau puis barre, sur deux essais séparés) → filtre retiré, tout redevient normal.
8. Sélectionner un produit au nom inclassable (aucun groupe détecté) → pas de `sousType` dans l'URL ; si sa catégorie DB est connue, `?categorie=<slug>` sur l'accueil ; sinon aucun filtre — et rien n'est bloqué.
9. Comparaison **immo** en cours (2 biens) → les ⚖ des produits se comportent comme avant (non modifiés).

- [ ] **Step 3: Revue finale de branche**

Utiliser superpowers:requesting-code-review sur l'ensemble des commits du chantier, corriger les findings Critical/Important, puis re-vérifier `npx tsc --noEmit`.
