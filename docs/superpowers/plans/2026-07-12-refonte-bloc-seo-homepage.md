# Refonte visuelle du bloc SEO homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le bloc SEO plat de la homepage (`Le comparateur de prix N°1 au Sénégal`) par une carte au style "ticket" cohérent avec le reste du site (perforation, badge, chips avec icônes), sans changer le contenu éditorial ni les liens existants.

**Architecture:** Modification pure front-end Next.js — nouvelles classes CSS ajoutées à `globals.css` (préfixe `.seo-*`/`.chip*`), JSX du bloc SEO dans `page.tsx` restructuré pour les consommer. Aucun changement backend, aucune nouvelle dépendance (icônes = emoji Unicode déjà utilisés ailleurs sur le site, dont `CATEGORIES[].emoji`).

**Tech Stack:** Next.js 14 (App Router, Server Component), CSS classique (pas de CSS-in-JS, le reste du fichier utilise déjà des styles inline + classes globales dans `globals.css`).

## Global Constraints

- Le contenu éditorial (2 paragraphes) et la liste des liens (catégories + longue traîne) restent identiques à l'existant — refonte visuelle uniquement, aucune URL ne doit changer.
- Réutiliser `CATEGORIES[].emoji` déjà défini dans `page.tsx:24-33` (ne pas dupliquer un mapping séparé) — noter que `mode` utilise 👗 et non 👕.
- Icônes = emoji Unicode uniquement (pas de librairie SVG, cohérent avec le reste du site).
- Design validé par maquette : carte perforée (motif déjà utilisé sur `.card-produit--ticket`), en-tête centré (titre + badge), texte 2 colonnes avec icône, chips catégories pleine largeur, chips longue traîne discrètes, pied de carte avec point de statut.
- `.home-seo-cols` (grid 2 colonnes, `globals.css` ~ligne 8069) reste utilisée telle quelle pour le texte — ne pas la supprimer, seulement l'entourer du nouveau style de carte.
- Hover des chips = liseré accent inset + léger `translateY`, cohérent avec le hover déjà utilisé sur les autres cartes du site (`box-shadow: var(--shadow2), inset 3px 0 0 var(--accent)`).

---

### Task 1: CSS de la carte SEO style ticket

**Files:**
- Modify: `frontend-next/src/app/globals.css:8068-8076` (bloc `/* Bloc SEO homepage ... */` existant)

**Interfaces:**
- Consumes: rien (CSS pur, tokens déjà définis dans `:root` — `--card`, `--border`, `--bg`, `--navy`, `--accent`, `--price`, `--text2`, `--text3`, `--shadow`).
- Produces: classes `.seo-card`, `.seo-card::before`, `.seo-head`, `.seo-head h2`, `.seo-head .seo-tag`, `.seo-cols-wrap`, `.seo-blurb`, `.seo-blurb .seo-icon`, `.seo-blurb p`, `.chip-row-label`, `.chip-row`, `.chip`, `.chip:hover`, `.chip.chip-small`, `.chip.chip-small:hover`, `.chip .chip-em`, `.seo-foot`, `.seo-foot .seo-dot`, `.home-seo-cols` (conservée) — consommées par Task 2.

- [ ] **Step 1: Remplacer le bloc CSS existant**

Ouvrir `frontend-next/src/app/globals.css` et remplacer les lignes 8068-8076 (le commentaire `/* Bloc SEO homepage ... */` jusqu'à la fermeture du `@media`) par :

```css

/* ── Bloc SEO homepage : carte style ticket (perforation, badge, chips) ── */
.seo-card {
  position: relative;
  padding: 30px 30px 26px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow);
}
.seo-card::before {
  content: "";
  position: absolute; top: -1px; left: 16px; right: 16px; height: 5px;
  background: radial-gradient(circle at 5px -1px, var(--bg) 3.5px, transparent 4px) repeat-x left top / 14px 5px;
}
.seo-head {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  gap: 8px; margin-bottom: 22px;
}
.seo-head h2 {
  font-size: 19px; font-weight: 800; color: var(--navy); margin: 0;
}
.seo-head .seo-tag {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11px; font-weight: 600; color: var(--price);
  background: #EAF5EE; border: 1px solid #CFE9D9;
  padding: 2px 8px; border-radius: 20px; letter-spacing: .02em;
}
.seo-cols-wrap { margin-bottom: 22px; }
.seo-blurb { display: flex; gap: 12px; align-items: flex-start; }
.seo-blurb .seo-icon {
  flex: none; width: 34px; height: 34px; border-radius: 50%;
  background: #FBEFE4; display: flex; align-items: center; justify-content: center;
  font-size: 16px;
}
.seo-blurb p { font-size: 14px; color: var(--text2); line-height: 1.75; margin: 0; }

.chip-row-label {
  font-size: 11px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase;
  color: var(--text3); margin: 0 0 10px;
}
.chip-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
.chip-row:last-child { margin-bottom: 0; }

.chip {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: var(--navy);
  background: #fff; border: 1px solid var(--border);
  padding: 7px 13px; border-radius: 20px; text-decoration: none;
  transition: box-shadow .15s ease, border-color .15s ease, transform .15s ease;
}
.chip:hover {
  border-color: var(--accent);
  box-shadow: inset 3px 0 0 var(--accent);
  transform: translateY(-1px);
}
.chip.chip-small {
  font-size: 12px; font-weight: 500; color: var(--text2);
  padding: 5px 11px; background: var(--bg);
}
.chip.chip-small:hover { color: var(--navy); }
.chip .chip-em { font-size: 13px; }

.seo-foot {
  margin-top: 20px; padding-top: 16px; border-top: 1px dashed var(--border);
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: var(--text3);
}
.seo-foot .seo-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--price); display: inline-block; }

/* Bloc SEO homepage : texte en 2 colonnes sur desktop (lignes lisibles
   malgré la largeur 1200px alignée sur les autres sections) */
.home-seo-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 0 40px; align-items: start; }
@media (max-width: 900px) {
  .home-seo-cols { grid-template-columns: 1fr; }
  .home-seo-cols p:first-child { margin-bottom: 12px; }
}
```

- [ ] **Step 2: Vérifier qu'il n'y a pas de doublon de classe**

Run: `grep -n "\.home-seo-cols\|\.seo-card\|\.chip-row\b" frontend-next/src/app/globals.css`
Expected: chaque sélecteur n'apparaît qu'une seule fois dans le fichier (dans le nouveau bloc).

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/app/globals.css
git commit -m "style(home): CSS carte ticket pour le bloc SEO homepage"
```

---

### Task 2: JSX du bloc SEO refondu

**Files:**
- Modify: `frontend-next/src/app/page.tsx:437-485` (bloc `{/* ── Bloc SEO ── */}`)

**Interfaces:**
- Consumes: classes CSS produites par Task 1 (`.seo-card`, `.seo-head`, `.seo-tag`, `.seo-cols-wrap`, `.seo-blurb`, `.seo-icon`, `.chip-row-label`, `.chip-row`, `.chip`, `.chip-small`, `.chip-em`, `.seo-foot`, `.seo-dot`, `.home-seo-cols`), `CATEGORIES` déjà défini en haut du fichier (`page.tsx:24-33`, champs `slug`/`label`/`emoji`).
- Produces: rien (feuille de l'arbre de rendu, pas de nouvel export).

- [ ] **Step 1: Remplacer le JSX du bloc SEO**

Dans `frontend-next/src/app/page.tsx`, remplacer les lignes 437-485 (du commentaire `{/* ── Bloc SEO ── */}` jusqu'à la fermeture `)}` du bloc) par :

```tsx
      {/* ── Bloc SEO ─────────────────────────────────────────────── */}
      {!hasFiltre && (
        <section style={{ maxWidth: 1200, margin: '24px auto 24px', padding: '0 20px' }}>
          <div className="seo-card">
            <div className="seo-head">
              <h2>Le comparateur de prix N°1 au Sénégal</h2>
              <span className="seo-tag">6800+ produits · maj / 6h</span>
            </div>

            <div className="seo-cols-wrap">
              <div className="home-seo-cols">
                <div className="seo-blurb">
                  <span className="seo-icon">📊</span>
                  <p>
                    <strong>Nopalou</strong> est le premier comparateur de prix dédié au marché sénégalais.
                    Vous cherchez le <strong>prix le moins cher</strong> pour un téléphone, une télévision, un réfrigérateur ou un ordinateur ?
                    Nopalou compare en temps réel les prix de milliers de produits chez tous les grands marchands en ligne au Sénégal.
                  </p>
                </div>
                <div className="seo-blurb">
                  <span className="seo-icon">📍</span>
                  <p>
                    Que vous soyez à <strong>Dakar</strong>, Thiès, Saint-Louis, Ziguinchor ou Kaolack — trouvez le meilleur prix avant d&apos;acheter.
                    Nos prix sont mis à jour automatiquement toutes les 6 heures depuis Jumia, Expat-Dakar, CoinAfrique et d&apos;autres marchands.
                    Comparer les prix au Sénégal n&apos;a jamais été aussi simple : recherchez votre produit, voyez toutes les offres côte à côte, et choisissez le vendeur le moins cher. <strong>Gratuit, sans inscription, sans pub intrusive.</strong>
                  </p>
                </div>
              </div>
            </div>

            <p className="chip-row-label">Comparer par catégorie</p>
            <div className="chip-row">
              {CATEGORIES.filter(c => c.slug !== 'telecom').map(c => (
                <Link key={c.slug} href={`/categorie/${c.slug}`} className="chip">
                  <span className="chip-em">{c.emoji}</span>
                  {c.label}
                </Link>
              ))}
            </div>

            <p className="chip-row-label">Recherches populaires à Dakar</p>
            <div className="chip-row">
              {[
                { href: '/categorie/tv-electro/climatiseurs', label: 'Climatiseur prix Dakar', emoji: '❄️' },
                { href: '/categorie/smartphones/iphone', label: 'iPhone prix Dakar', emoji: '📱' },
                { href: '/categorie/smartphones/samsung', label: 'Samsung Galaxy prix Dakar', emoji: '📱' },
                { href: '/categorie/tv-electro/televiseurs', label: 'TV prix Dakar', emoji: '📺' },
                { href: '/categorie/tv-electro/refrigerateurs', label: 'Frigo prix Dakar', emoji: '🧊' },
                { href: '/categorie/informatique/ordinateurs', label: 'Ordinateur portable prix Dakar', emoji: '💻' },
                { href: '/immo/location-appartement-dakar', label: 'Location appartement Dakar', emoji: '🏢' },
                { href: '/immo/location-chambre-dakar', label: 'Chambre à louer Dakar', emoji: '🛏️' },
              ].map(l => (
                <Link key={l.href} href={l.href} className="chip chip-small">
                  <span className="chip-em">{l.emoji}</span>
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="seo-foot">
              <span className="seo-dot" />
              Prix vérifiés automatiquement toutes les 6 heures sur tous les grands marchands sénégalais
            </div>
          </div>
        </section>
      )}
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune erreur (sortie vide, code de retour 0).

- [ ] **Step 3: Vérifier qu'aucun href n'a changé**

Run: `git diff frontend-next/src/app/page.tsx | grep -E "^\+.*href=" | grep -oE "'/[^']*'|\`[^\`]*\`" | sort`
puis comparer visuellement à :
Run: `git diff frontend-next/src/app/page.tsx | grep -E "^\-.*href=" | grep -oE "'/[^']*'|\`[^\`]*\`" | sort`
Expected: les deux listes contiennent les mêmes chemins (`/categorie/${c.slug}` pour les 7 catégories hors telecom, et les 8 URLs longue traîne inchangées).

- [ ] **Step 4: Lancer le serveur de dev et vérifier visuellement**

Si un serveur dev tourne déjà sur le port 3001, ne pas relancer `npm run build` en parallèle (corrompt `.next` — piège documenté dans `CLAUDE.md`). Sinon :

Run: `cd frontend-next && npm run dev`

Ouvrir `http://localhost:3001/` dans un navigateur, scroller jusqu'au bloc "Le comparateur de prix N°1 au Sénégal", vérifier :
- la perforation est visible en haut de la carte
- le titre + badge sont centrés
- les 2 paragraphes ont chacun une icône ronde à gauche
- les chips catégories et longue traîne sont cliquables avec un hover (liseré orange à gauche)
- en réduisant la fenêtre sous 900px, le texte repasse en 1 colonne

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/app/page.tsx
git commit -m "feat(home): refonte visuelle du bloc SEO en carte style ticket"
```

---

## Vérification finale

- [ ] `cd frontend-next && npx tsc --noEmit` sans erreur (déjà vérifié Task 2 Step 2, revérifier après les deux commits).
- [ ] Diff complet relu : `git diff HEAD~2 -- frontend-next/src/app/page.tsx frontend-next/src/app/globals.css` — confirmer qu'aucun contenu éditorial ni aucune URL n'a changé, seulement la structure/le style.
- [ ] Rendu visuel confirmé en dev (Task 2 Step 4).
