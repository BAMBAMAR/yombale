# Signature « ticket » + finition typographique homepage — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Appliquer la signature visuelle « ticket » (cartes promo inclinées et perforées, prix monospace, badge tampon) et un passage de finition typographique (Archivo pour les titres, tabular-nums, interlettrages) à la homepage Nopalou, comme maquette de validation.

**Architecture:** Changements CSS-first dans `globals.css` + swap de police dans `layout.tsx` + classes conditionnelles dans `ProduitsListe.tsx`. Aucun composant React nouveau, aucune dépendance ajoutée, 0 Ko de données supplémentaires (Archivo remplace Sora via `next/font` auto-hébergé ; les prix utilisent la pile monospace système).

**Tech Stack:** Next.js 14 (App Router), `next/font/google`, CSS vanilla dans `globals.css` (~8000 lignes, conventions existantes : variables dans `:root`, classes kebab-case préfixées par page/section).

**Spec:** `docs/superpowers/specs/2026-07-11-design-ticket-homepage-design.md`

## Global Constraints

- Palette existante INTERDITE de modification : `--bg #F8F5F0`, `--navy #1C2B4A`, `--accent #C75B00`, `--price #0A5C36`, `--border #E8DDD2`.
- Interdits explicites (anti « design IA par défaut ») : dégradés violet/bleu, ombres non teintées (noir pur), `border-radius` > 12px, `border: dashed` pour la perforation, emojis-icônes ajoutés, couleurs hors palette.
- Aucune dépendance npm ajoutée. Aucun JS client supplémentaire (hors les ~10 lignes de classes conditionnelles).
- Branche de travail : `feat/design-ticket-homepage` (existe déjà, spec commité dessus). Ne JAMAIS merger dans `main` — la validation finale est le jugement visuel de l'utilisateur.
- Vérification minimale de chaque tâche : `npx tsc --noEmit` → 0 erreur (lancer depuis `frontend-next/`).
- Le serveur dev tourne déjà : backend port 3000, frontend port 3001. `nodemon`/next rechargent seuls.

---

### Task 1: Archivo remplace Sora (layout + variables CSS)

**Files:**
- Modify: `frontend-next/src/app/layout.tsx:2,42-46,108`
- Modify: `frontend-next/src/app/globals.css` (`:root` + 27 occurrences de Sora)

**Interfaces:**
- Produces: variable CSS `--font-archivo` (utilisée par les sélecteurs titres) ; variable CSS `--font-mono` (consommée par les Tasks 2 et 4).

**Contexte pour l'implémenteur :** `next/font` génère un nom de famille scopé (ex: `__Archivo_abc123`) exposé via la variable CSS. Les 19 sélecteurs écrits `font-family: 'Sora', sans-serif` en littéral ne matchaient donc JAMAIS la vraie police — ils retombaient en sans-serif système. Ce task corrige ce bug latent en même temps.

- [ ] **Step 1: Swap de la police dans layout.tsx**

Dans `frontend-next/src/app/layout.tsx`, remplacer :

```tsx
import { Inter, Sora } from 'next/font/google';
```

par :

```tsx
import { Inter, Archivo } from 'next/font/google';
```

Puis remplacer le bloc :

```tsx
const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});
```

par :

```tsx
const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});
```

Puis ligne 108, remplacer :

```tsx
    <html lang="fr" className={`${inter.variable} ${sora.variable}`}>
```

par :

```tsx
    <html lang="fr" className={`${inter.variable} ${archivo.variable}`}>
```

- [ ] **Step 2: Migrer les 27 références Sora dans globals.css**

Depuis `frontend-next/`, exécuter (Git Bash) :

```bash
sed -i "s/var(--font-sora), sans-serif/var(--font-archivo), sans-serif/g; s/'Sora', sans-serif/var(--font-archivo), sans-serif/g" src/app/globals.css
```

Vérifier qu'il ne reste aucune référence :

```bash
grep -c "Sora\|font-sora" src/app/globals.css
```

Expected: `0`

- [ ] **Step 3: Ajouter --font-mono dans :root**

Dans `frontend-next/src/app/globals.css`, dans le bloc `:root` (après la ligne `--shadow2: ...;`), ajouter :

```css
  /* Pile monospace système — 0 Ko, chiffres tabulaires alignés (prix, compteurs) */
  --font-mono: ui-monospace, 'Cascadia Mono', 'Roboto Mono', Consolas, monospace;
```

- [ ] **Step 4: Vérifier**

```bash
cd frontend-next && npx tsc --noEmit
```

Expected: aucune sortie (0 erreur).

```bash
curl -s http://localhost:3001/ | grep -o "Archivo\|__Archivo[A-Za-z0-9_]*" | head -3
```

Expected: au moins une occurrence (la police est chargée). Si le serveur dev n'a pas rechargé layout.tsx, le redémarrer n'est PAS nécessaire — attendre le hot reload ou recharger la page une fois.

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/app/layout.tsx frontend-next/src/app/globals.css
git commit -m "feat(design): Archivo remplace Sora (titres) + variable --font-mono

Corrige aussi un bug latent : 19 selecteurs utilisaient 'Sora' en litteral,
qui ne matche jamais le nom scope genere par next/font - ces titres
tombaient silencieusement en sans-serif systeme."
```

---

### Task 2: Affinage typographique (prix mono, tabular-nums, interlettrages, balance)

**Files:**
- Modify: `frontend-next/src/app/globals.css:104-124` (`.card-produit .nom/.marque/.prix`), `:1131` (`.hero-home h1`), `:1257` (`.home-section-titre`), `:1322-1330` (`.home-proof-num/.home-proof-lbl`)

**Interfaces:**
- Consumes: `--font-mono` et `--font-archivo` (Task 1).

- [ ] **Step 1: Prix des cartes en monospace**

Dans `globals.css`, remplacer le bloc :

```css
.card-produit .prix {
  font-size: 20px;
  font-weight: 800;
  color: var(--price);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
```

par :

```css
.card-produit .prix {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  color: var(--price);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
```

(18px/700 : les monospaces sont optiquement plus larges que Inter — 20px/800 déborderait sur les cartes de 220px.)

Puis, dans le bloc `.card-produit` (ligne ~87), ajouter la ligne suivante (couvre le « 7 offres » et tout chiffre de la carte, exigence spec « tous les contextes chiffrés ») :

```css
  font-variant-numeric: tabular-nums;
```

- [ ] **Step 2: Labels majuscules — interlettrage élargi**

Remplacer :

```css
.card-produit .marque {
  font-size: 12px;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
```

par :

```css
.card-produit .marque {
  font-size: 11px;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

- [ ] **Step 3: Titres homepage — balance + tracking**

Sur le sélecteur `.hero-home h1` (ligne ~1131) et `.home-section-titre` (ligne ~1257), ajouter DANS chaque bloc existant (sans toucher aux autres propriétés) :

```css
  letter-spacing: -0.02em;
  text-wrap: balance;
```

- [ ] **Step 4: Compteurs preuve sociale en tabular-nums**

Sur `.home-proof-num` (ligne ~1322), ajouter dans le bloc existant :

```css
  font-variant-numeric: tabular-nums;
```

(La famille est déjà migrée vers `var(--font-archivo)` par le sed du Task 1.)

Sur `.home-proof-lbl`, ajouter :

```css
  letter-spacing: 0.08em;
  text-transform: uppercase;
```

Puis vérifier visuellement que les labels (« Sites partenaires », etc.) ne débordent pas — si un label passe sur 3 lignes, réduire `font-size` à `11px` dans ce même bloc.

- [ ] **Step 5: Vérifier et committer**

```bash
cd frontend-next && npx tsc --noEmit
```

Expected: 0 erreur. Contrôle visuel rapide sur http://localhost:3001 : prix alignés en mono, compteurs nets.

```bash
git add frontend-next/src/app/globals.css
git commit -m "feat(design): affinage typo homepage - prix mono, tabular-nums, interlettrages, text-wrap balance"
```

---

### Task 3: Cartes promo « ticket » (tilt alterné + perforation dessinée)

**Files:**
- Modify: `frontend-next/src/app/ProduitsListe.tsx:63-74`
- Modify: `frontend-next/src/app/globals.css` (nouvelles classes, à placer juste après le bloc `.card-produit:hover` ligne ~101)

**Interfaces:**
- Consumes: rien de nouveau.
- Produces: classes CSS `card-produit--ticket`, `tilt-a`, `tilt-b` (réutilisées telles quelles lors de la future généralisation).

- [ ] **Step 1: Classes conditionnelles dans ProduitsListe.tsx**

Remplacer le bloc du map (lignes ~63-74) :

```tsx
      <div className="grid-produits">
        {produits.map((p) => (
          <Link key={p.id} href={`/produit/${p.id}`} style={{ display: 'contents' }}>
            <article className="card-produit">
              <div className="card-img">
                {p.prix_min && p.prix_max && p.prix_max > p.prix_min * 1.1 && (
                  <span className="badge-promo">
                    -{Math.round((1 - p.prix_min / p.prix_max) * 100)}%
                  </span>
                )}
```

par :

```tsx
      <div className="grid-produits">
        {(() => { let promoIdx = 0; return produits.map((p) => {
          const estPromo = !!(p.prix_min && p.prix_max && p.prix_max > p.prix_min * 1.1);
          const ticketClass = estPromo
            ? ` card-produit--ticket ${promoIdx++ % 2 === 0 ? 'tilt-a' : 'tilt-b'}`
            : '';
          return (
          <Link key={p.id} href={`/produit/${p.id}`} style={{ display: 'contents' }}>
            <article className={`card-produit${ticketClass}`}>
              <div className="card-img">
                {estPromo && p.prix_min && p.prix_max && (
                  <span className="badge-promo">
                    -{Math.round((1 - p.prix_min / p.prix_max) * 100)}%
                  </span>
                )}
```

**Attention à la fermeture** : le map devient une IIFE — à la fin du bloc (là où le map actuel se ferme par `))}` juste avant `</div>`), la fermeture devient :

```tsx
          );
        }); })()}
      </div>
```

(L'alternance se fait par index de carte PROMO — `promoIdx` n'avance que sur les cartes promo — pas par index global, conformément au spec.)

- [ ] **Step 2: CSS ticket — tilt + perforation au radial-gradient**

Dans `globals.css`, juste après le bloc `.card-produit:hover { ... }` (ligne ~101), insérer :

```css
/* ── Signature « ticket » — cartes promo uniquement (spec 2026-07-11) ──
   Le tilt signale « bon plan à saisir ». Perforation = vraies encoches
   semi-circulaires de la couleur du fond (papier poinçonné), PAS de
   border dashed. */
.card-produit--ticket {
  transition: transform .25s ease, box-shadow .25s ease;
  will-change: transform;
}
.card-produit--ticket.tilt-a { transform: rotate(-1deg); }
.card-produit--ticket.tilt-b { transform: rotate(1deg); }
.card-produit--ticket:hover  { transform: rotate(0); }

.card-produit--ticket::before {
  content: '';
  display: block;
  height: 5px;
  margin: -16px -16px 6px;   /* annule le padding 16px de la carte pour toucher le bord */
  background:
    radial-gradient(circle at 5px -1px, var(--bg) 3.5px, transparent 4px) repeat-x left top / 14px 5px;
}

@media (prefers-reduced-motion: reduce) {
  .card-produit--ticket,
  .card-produit--ticket.tilt-a,
  .card-produit--ticket.tilt-b { transform: none; transition: none; }
}
```

- [ ] **Step 3: Vérifier**

```bash
cd frontend-next && npx tsc --noEmit
```

Expected: 0 erreur.

```bash
curl -s http://localhost:3001/ | grep -o "card-produit--ticket tilt-[ab]" | sort | uniq -c
```

Expected: des occurrences de `tilt-a` ET de `tilt-b` (les données réelles contiennent toujours des promos — cf. capture homepage : -90%, -32%, -68%…).

Contrôle visuel : cartes promo inclinées avec encoches en haut, cartes normales droites, pas de débordement horizontal (la grille `.grid-produits` n'a pas d'`overflow: hidden` — vérifié).

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/app/ProduitsListe.tsx frontend-next/src/app/globals.css
git commit -m "feat(design): cartes promo en tickets inclines avec perforation dessinee"
```

---

### Task 4: Badge tampon + ombres encre + focus-visible

**Files:**
- Modify: `frontend-next/src/app/globals.css:87-101` (`.card-produit`), `:1451-1462` (`.badge-promo`), + 1 règle globale focus

**Interfaces:**
- Consumes: `--font-mono` (Task 1).

- [ ] **Step 1: Badge promo « tampon encreur »**

Remplacer le bloc `.badge-promo` :

```css
.badge-promo {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 8px;
  z-index: 1;
  pointer-events: none;
```

par :

```css
.badge-promo {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--accent);
  color: #fff;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 3px;
  transform: rotate(-3deg);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.55), inset 0 0 0 2.5px var(--accent), inset 0 0 0 3.5px rgba(255,255,255,.35);
  z-index: 1;
  pointer-events: none;
```

(Le reste du bloc — s'il y a d'autres propriétés après `pointer-events` — reste inchangé. Le double liseré blanc intérieur via `box-shadow inset` donne l'effet tampon sans bordure parfaite.)

- [ ] **Step 2: Ombres 2 couches teintées encre sur les cartes**

Dans le bloc `.card-produit` (ligne ~87), remplacer la ligne :

```css
  box-shadow: var(--shadow);
```

par :

```css
  box-shadow: 0 1px 2px rgba(26,22,18,.08), 0 8px 24px rgba(26,22,18,.10);
```

(Valeurs exactes du spec section 4. Si le rendu paraît trop lourd sur 24 cartes au contrôle visuel, baisser la couche ambiante à `.05` ET reporter la nouvelle valeur dans le spec — les deux documents doivent rester d'accord.)

(Ne PAS modifier la variable `--shadow` elle-même — elle est utilisée par d'autres pages, hors périmètre.)

- [ ] **Step 3: Focus clavier net**

À la fin de `globals.css`, ajouter :

```css
/* ── Focus clavier — anneau net, jamais supprimé (finition 2026-07-11) ── */
a:focus-visible,
button:focus-visible,
.card-produit:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: var(--radius);
}
```

- [ ] **Step 4: Vérifier et committer**

```bash
cd frontend-next && npx tsc --noEmit
```

Expected: 0 erreur. Contrôle visuel : badge -XX% légèrement tourné avec liseré, ombres discrètes chaudes, Tab au clavier montre l'anneau orange.

```bash
git add frontend-next/src/app/globals.css
git commit -m "feat(design): badge promo tampon encreur, ombres 2 couches teintees encre, focus-visible"
```

---

### Task 5: Vérification finale (build, poids de page, mobile)

**Files:** aucun nouveau — corrections éventuelles uniquement.

- [ ] **Step 1: Build complet**

```bash
cd frontend-next && npx tsc --noEmit && npm run build
```

Expected: tsc 0 erreur ; build compile (l'erreur EBUSY sur la copie standalone en toute fin est un verrou antivirus Windows connu, PAS un échec de compilation — l'ignorer si « Generating static pages » affiche 61/61 ✓).

- [ ] **Step 2: Poids de la homepage (critère spec : ±2 Ko)**

```bash
curl -s -o /dev/null -w "HTML: %{size_download} octets\n" http://localhost:3001/
```

Comparer à la valeur avant chantier : **66 313 octets** (mesurée le 11 juillet). Expected: écart < 2048 octets.

- [ ] **Step 3: Contrôle mobile (viewport étroit)**

Vérification CSS statique (pas d'outil navigateur disponible) :

```bash
grep -n "overflow-x\|overflow: hidden" frontend-next/src/app/globals.css | grep -i "grid-produits\|card-produit" || echo "OK: pas d'overflow qui couperait les coins inclines"
```

Expected: `OK: ...`

- [ ] **Step 4: Commit final éventuel + handoff utilisateur**

```bash
git status --short
```

Si des corrections ont été faites aux steps précédents, les committer :

```bash
git add -A frontend-next/src && git commit -m "fix(design): corrections verification finale"
```

Puis STOP : présenter la homepage à l'utilisateur (http://localhost:3001, desktop + rétrécir la fenêtre pour le mobile). **Le merge dans `main` n'a lieu qu'après son GO explicite.**
