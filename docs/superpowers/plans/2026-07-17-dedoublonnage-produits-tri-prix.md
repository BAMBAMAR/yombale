# Dédoublonnage produits + tri par défaut « meilleur prix » Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stopper la création quotidienne de doublons produits par le scraper, fusionner les ~5 218 doublons existants (script one-shot), et faire du prix croissant le tri par défaut des listes produits.

**Architecture:** (1) Nouvelle étape de matching « correspondance exacte sur nom normalisé » dans `sauvegarderProduits()` — la normalisation SQL est fournie par une fonction `sqlNomNormalise(col)` exportée de `scraper.js` et réutilisée par (2) le script de fusion `backend/scripts/fusionner-doublons-produits.js` (une transaction par groupe, `--dry-run`). (3) Le tri par défaut de `GET /api/produits` passe de « popularité » à `MIN(o.prix) ASC NULLS LAST`, avec `tri=populaire` pour l'ancien ordre, et pills mises à jour sur l'accueil et la page catégorie.

**Tech Stack:** Node.js CommonJS, `pg`, Next.js 14 (pages serveur). Pas de framework de test — vérification par `node --check`, scripts `node <fichier>` en lecture seule contre la base de production, `npx tsc --noEmit` côté frontend.

**Spec:** `docs/superpowers/specs/2026-07-17-dedoublonnage-produits-tri-prix-design.md`

## Global Constraints

- Fichiers de code touchés, exhaustivement : `backend/services/scraper.js`, `backend/scripts/fusionner-doublons-produits.js` (nouveau), `backend/routes/produits.js`, `frontend-next/src/app/page.tsx`, `frontend-next/src/app/categorie/[slug]/page.tsx`. Aucun changement de schéma DB, aucune nouvelle dépendance.
- La base du `.env` racine est la **PRODUCTION**. Les implémenteurs n'exécutent JAMAIS d'écriture : uniquement `--dry-run` et des SELECT. La fusion réelle est une étape post-merge contrôlée (Task 6, exécutée par le contrôleur avec accord utilisateur).
- La normalisation SQL du nom vient d'une source unique : `sqlNomNormalise(col)` exportée par `backend/services/scraper.js` — jamais recopiée en dur ailleurs.
- Le matching flou existant (seuils 0.65 / `_motsClesCommuns >= 2`, garde-fous marque/pouces) ne doit PAS changer.
- Tri : `tri` absent → `MIN(o.prix) ASC NULLS LAST` ; `tri=populaire` → `COUNT(o.id) DESC NULLS LAST` ; `prix_asc`/`prix_desc`/`nom_asc` inchangés ; le préfixe sponsorisé de l'ORDER BY reste en tête dans tous les cas.
- Après chaque tâche backend : `node --check <fichier>` sans erreur avant commit. Après la tâche frontend : `cd frontend-next && npx tsc --noEmit` sans erreur (PAS de `npm run build` — 10-15 min sur cette machine).
- Scripts de vérification : fichiers dans le scratchpad de session, lancés `node <fichier>` (jamais `node -e` multi-lignes — PowerShell les casse ; préférer le shell Bash). Pour résoudre `dotenv`/`pg` depuis le scratchpad, utiliser des chemins absolus : `require('C:/Users/bamba/Downloads/yombale-CLAUDE/node_modules/dotenv').config({ path: 'C:/Users/bamba/Downloads/yombale-CLAUDE/.env' })` et `require('C:/Users/bamba/Downloads/yombale-CLAUDE/backend/models/db')`.

---

### Task 1: `sqlNomNormalise` + étape 1bis de matching exact dans le scraper

**Files:**
- Modify: `backend/services/scraper.js` — ajout d'une fonction près de `normaliserTitre()` (~ligne 913), nouveau bloc dans `sauvegarderProduits()` entre l'étape EAN (~ligne 777) et l'étape fuzzy (~ligne 780), ajout à `module.exports` (~ligne 1285).

**Interfaces:**
- Produces: `sqlNomNormalise(col: string): string` — retourne l'expression SQL de normalisation d'un nom (colonne ou placeholder). Exportée dans `module.exports`. Task 2 la consomme.
- Le comportement externe de `sauvegarderProduits` est inchangé (mêmes stats, mêmes écritures) — seul le matching gagne une étape.

- [ ] **Step 1: Ajouter `sqlNomNormalise` juste au-dessus de `normaliserTitre`**

```js
// Expression SQL de nom normalisé — DOIT produire le même résultat que normaliserTitre()
// côté JS (minuscules, apostrophes/guillemets/parenthèses/crochets retirés, espaces réduits).
// Source unique : réutilisée par backend/scripts/fusionner-doublons-produits.js — ne pas dupliquer.
function sqlNomNormalise(col) {
  return `TRIM(LOWER(regexp_replace(regexp_replace(${col}, '[''’‘“”"()\\[\\]]', '', 'g'), '\\s+', ' ', 'g')))`;
}
```

(Dans la chaîne SQL, `''` est une apostrophe droite échappée ; les variantes typographiques `’ ‘ “ ”` sont incluses car présentes dans les noms en base — ex « J'adore EDP 100ml ».)

- [ ] **Step 2: Ajouter l'étape 1bis dans `sauvegarderProduits`**

Juste après le bloc `// 1. Correspondance exacte EAN` et avant `// 2. Correspondance par similarité` :

```js
      // 1bis. Correspondance EXACTE sur nom normalisé — couvre les titres composés
      // uniquement de mots génériques ("Split Haier", "iPhone X") pour lesquels
      // motsCles est vide et l'étape 2 est sautée, ainsi que les apostrophes
      // ("J'adore EDP 100ml") que le LIKE de l'étape 2 ne matche jamais.
      if(!produitId){
        const {rows:byNom}=await pool.query(
          `SELECT id FROM produits WHERE ${sqlNomNormalise('nom')} = ${sqlNomNormalise('$1')} LIMIT 1`,
          [normaliserTitre(item.titre)]
        );
        if(byNom.length>0){ produitId=byNom[0].id; stats.mis_a_jour++; }
      }
```

- [ ] **Step 3: Exporter `sqlNomNormalise`**

Dans le `module.exports = { ... }` final (ligne ~1285), ajouter `sqlNomNormalise` à la liste existante (ne rien retirer).

- [ ] **Step 4: Vérifier la syntaxe**

Run: `node --check backend/services/scraper.js`
Expected: exit 0

- [ ] **Step 5: Vérification réelle contre la base (lecture seule)**

Écrire `<scratchpad>/verif-match-exact.js` :

```js
require('C:/Users/bamba/Downloads/yombale-CLAUDE/node_modules/dotenv').config({ path: 'C:/Users/bamba/Downloads/yombale-CLAUDE/.env' });
const { pool } = require('C:/Users/bamba/Downloads/yombale-CLAUDE/backend/models/db');
const { sqlNomNormalise } = require('C:/Users/bamba/Downloads/yombale-CLAUDE/backend/services/scraper');
(async () => {
  // Titres réels connus pour être dupliqués en base — l'étape 1bis doit les retrouver.
  const cas = ['Split Haier', 'iPhone X', "J'adore EDP 100ml", 'Apple iPhone 16'];
  let ok = true;
  for (const titre of cas) {
    // normaliserTitre simplifié pour le test (le vrai est appelé dans sauvegarderProduits)
    const norm = titre.toLowerCase().replace(/['’‘“”"()\[\]]/g,'').replace(/\s+/g,' ').trim();
    const { rows } = await pool.query(
      `SELECT id, nom FROM produits WHERE ${sqlNomNormalise('nom')} = ${sqlNomNormalise('$1')} LIMIT 1`,
      [norm]
    );
    console.log(rows.length ? `OK  "${titre}" → ${rows[0].id} (${rows[0].nom})` : `ECHEC "${titre}" → aucun match`);
    if (!rows.length) ok = false;
  }
  // Contre-cas : un titre inexistant ne doit rien matcher
  const { rows: absent } = await pool.query(
    `SELECT id FROM produits WHERE ${sqlNomNormalise('nom')} = ${sqlNomNormalise('$1')} LIMIT 1`,
    ['zzz produit totalement inexistant 12345']
  );
  console.log(absent.length === 0 ? 'OK  contre-cas inexistant → aucun match' : 'ECHEC contre-cas → match inattendu');
  if (absent.length) ok = false;
  console.log(ok ? 'RESULTAT: OK' : 'RESULTAT: ECHEC');
  await pool.end();
})().catch(e => { console.error(e.message); process.exit(1); });
```

Run: `node <scratchpad>/verif-match-exact.js`
Expected: 4× `OK "…" → <uuid>`, `OK contre-cas`, `RESULTAT: OK`

- [ ] **Step 6: Commit**

```bash
git add backend/services/scraper.js
git commit -m "fix(scraper): matching exact sur nom normalise avant le fuzzy (stoppe les doublons quotidiens)"
```

---

### Task 2: Script de fusion `fusionner-doublons-produits.js`

**Files:**
- Create: `backend/scripts/fusionner-doublons-produits.js`

**Interfaces:**
- Consumes: `sqlNomNormalise(col)` exportée de `../services/scraper` (Task 1).
- Produces: script CLI `node backend/scripts/fusionner-doublons-produits.js [--dry-run]`. Task 6 (post-merge) l'exécute en réel.

- [ ] **Step 1: Écrire le script complet**

```js
#!/usr/bin/env node
// Fusion one-shot des produits en doublon (même nom normalisé).
// Usage : node backend/scripts/fusionner-doublons-produits.js [--dry-run]
// --dry-run : affiche les groupes et ce qui serait fusionné, AUCUNE écriture.
//
// Canonique par groupe : fiche avec EAN, sinon le plus d'offres, sinon la plus ancienne.
// Rattache offres (conflit UNIQUE(produit_id,marchand_id) : l'offre la plus récente gagne,
// l'historique_prix de la perdante est rattaché à la gagnante), alertes, clics_affiliation.
// Une transaction PAR GROUPE. Recalcul final prix_min/nb_offres des canoniques.
// ⚠️ À n'exécuter en réel qu'APRÈS déploiement du fix de matching (sinon les doublons reviennent).

require('dotenv').config();
const { pool } = require('../models/db');
const { sqlNomNormalise } = require('../services/scraper');

const DRY_RUN = process.argv.includes('--dry-run');
const NORM = sqlNomNormalise('p.nom');

async function listerGroupes() {
  const { rows } = await pool.query(`
    SELECT ${NORM} AS cle,
           json_agg(json_build_object('id', p.id, 'nom', p.nom, 'ean', p.ean, 'nb', p.nb, 'created_at', p.created_at)
                    ORDER BY (p.ean IS NOT NULL) DESC, p.nb DESC, p.created_at ASC, p.id ASC) AS membres
    FROM (
      SELECT p.*, (SELECT COUNT(*) FROM offres o WHERE o.produit_id = p.id)::int AS nb
      FROM produits p
    ) p
    GROUP BY 1
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `);
  return rows;
}

async function fusionnerGroupe(client, canon, doublons) {
  let offresSupprimees = 0;
  for (const dup of doublons) {
    // Conflits UNIQUE(produit_id, marchand_id) : le canonique a déjà une offre du même marchand
    const { rows: conflits } = await client.query(
      `SELECT od.id AS dup_offre, od.scraped_at AS dup_at, oc.id AS can_offre, oc.scraped_at AS can_at
       FROM offres od
       JOIN offres oc ON oc.produit_id = $1 AND oc.marchand_id = od.marchand_id
       WHERE od.produit_id = $2`,
      [canon.id, dup.id]
    );
    for (const c of conflits) {
      // L'offre la plus récemment scrapée gagne ; l'historique de la perdante est rattaché à la gagnante.
      const dupGagne = new Date(c.dup_at) > new Date(c.can_at);
      const gagnante = dupGagne ? c.dup_offre : c.can_offre;
      const perdante = dupGagne ? c.can_offre : c.dup_offre;
      await client.query('UPDATE historique_prix SET offre_id = $1 WHERE offre_id = $2', [gagnante, perdante]);
      await client.query('DELETE FROM offres WHERE id = $1', [perdante]);
      offresSupprimees++;
    }
    // Plus aucun conflit : rattacher le reste
    await client.query('UPDATE offres SET produit_id = $1 WHERE produit_id = $2', [canon.id, dup.id]);
    await client.query('UPDATE alertes SET produit_id = $1 WHERE produit_id = $2', [canon.id, dup.id]);
    await client.query('UPDATE clics_affiliation SET produit_id = $1 WHERE produit_id = $2', [canon.id, dup.id]);
    await client.query('DELETE FROM produits WHERE id = $1', [dup.id]);
  }
  return offresSupprimees;
}

async function main() {
  console.log(DRY_RUN ? '[DRY-RUN] Simulation — aucune modification en base' : '[LIVE] Fusion en base de production');

  const groupes = await listerGroupes();
  const totalDoublons = groupes.reduce((s, g) => s + g.membres.length - 1, 0);
  console.log(`${groupes.length} groupe(s) de doublons, ${totalDoublons} fiche(s) à supprimer.\n`);
  console.log('Top 15 :');
  for (const g of groupes.slice(0, 15)) {
    console.log(`  ${String(g.membres.length).padStart(4)}x  ${g.cle}`);
  }

  if (DRY_RUN) {
    console.log('\nExemples détaillés (3 premiers groupes) :');
    for (const g of groupes.slice(0, 3)) {
      const [canon, ...doublons] = g.membres;
      console.log(`\n« ${g.cle} » — canonique ${canon.id} (ean:${canon.ean || '—'}, offres:${canon.nb}, créé:${canon.created_at})`);
      console.log(`  ${doublons.length} doublon(s), dont offres cumulées: ${doublons.reduce((s, d) => s + d.nb, 0)}`);
    }
    console.log(`\n[DRY-RUN] Terminé. Relancer sans --dry-run pour fusionner.`);
    await pool.end();
    return;
  }

  let groupesOk = 0, groupesKo = 0, fichesSupprimees = 0, offresSupprimees = 0;
  const canonsTouches = [];
  for (const g of groupes) {
    const [canon, ...doublons] = g.membres;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      offresSupprimees += await fusionnerGroupe(client, canon, doublons);
      await client.query('COMMIT');
      groupesOk++; fichesSupprimees += doublons.length; canonsTouches.push(canon.id);
    } catch (err) {
      await client.query('ROLLBACK');
      groupesKo++;
      console.error(`[ECHEC] groupe « ${g.cle} » :`, err.message);
    } finally {
      client.release();
    }
  }

  // Recalcul prix_min / nb_offres des canoniques (même requête que le batch du scraper)
  if (canonsTouches.length) {
    await pool.query(`
      UPDATE produits SET
        prix_min = sub.prix_min,
        nb_offres = sub.nb_offres
      FROM (
        SELECT p.id,
          MIN(CASE WHEN o.stock THEN o.prix END) AS prix_min,
          COUNT(o.id) AS nb_offres
        FROM produits p
        LEFT JOIN offres o ON o.produit_id = p.id
        WHERE p.id = ANY($1::uuid[])
        GROUP BY p.id
      ) sub
      WHERE produits.id = sub.id`,
      [canonsTouches]
    );
  }

  console.log(`\nRésultat : ${groupesOk} groupe(s) fusionné(s), ${groupesKo} échec(s), ${fichesSupprimees} fiche(s) supprimée(s), ${offresSupprimees} offre(s) en conflit supprimée(s), ${canonsTouches.length} canonique(s) recalculé(s).`);
  await pool.end();
}

main().catch(err => {
  console.error('[ERREUR]', err.message);
  pool.end();
  process.exit(1);
});
```

- [ ] **Step 2: Vérifier la syntaxe**

Run: `node --check backend/scripts/fusionner-doublons-produits.js`
Expected: exit 0

- [ ] **Step 3: Dry-run réel contre la base de production (lecture seule)**

Run (depuis la racine du repo) : `node backend/scripts/fusionner-doublons-produits.js --dry-run`
Expected : ~35 groupes et ~5 218 fiches à supprimer (ordres de grandeur du diagnostic du 17 juillet — les chiffres exacts auront bougé avec le scraping), top 15 avec « split haier » / « climatiseur haier » en tête, 3 exemples détaillés, mention `[DRY-RUN] Terminé`, et **aucune écriture** (le script ne contient aucun UPDATE/DELETE hors du bloc `if (!DRY_RUN)`-équivalent — vérifier que le chemin dry-run sort avant la boucle de fusion).
⚠️ NE PAS lancer sans `--dry-run` — la fusion réelle est la Task 6, post-merge.

- [ ] **Step 4: Commit**

```bash
git add backend/scripts/fusionner-doublons-produits.js
git commit -m "feat(scripts): fusion one-shot des produits en doublon (meme nom normalise)"
```

---

### Task 3: Tri par défaut prix croissant + `tri=populaire` (backend)

**Files:**
- Modify: `backend/routes/produits.js:18-21`

**Interfaces:**
- Produces: `GET /api/produits` — `tri` absent ⇒ tri prix croissant ; `tri=populaire` ⇒ ancien classement. Task 4 (pills) en dépend.

- [ ] **Step 1: Modifier le calcul de `orderBy`**

Remplacer (lignes 18-21) :

```js
    const orderBy = tri === 'prix_asc'  ? 'MIN(o.prix) ASC NULLS LAST'
                  : tri === 'prix_desc' ? 'MIN(o.prix) DESC NULLS LAST'
                  : tri === 'nom_asc'   ? 'p.nom ASC'
                  :                      'COUNT(o.id) DESC NULLS LAST';
```

par :

```js
    // Défaut = meilleur prix d'abord (demande produit, 17/07/2026). L'ancien défaut
    // "popularité" (nb d'offres) reste accessible via tri=populaire.
    const orderBy = tri === 'prix_asc'  ? 'MIN(o.prix) ASC NULLS LAST'
                  : tri === 'prix_desc' ? 'MIN(o.prix) DESC NULLS LAST'
                  : tri === 'nom_asc'   ? 'p.nom ASC'
                  : tri === 'populaire' ? 'COUNT(o.id) DESC NULLS LAST'
                  :                       'MIN(o.prix) ASC NULLS LAST';
```

Ne toucher à rien d'autre dans le fichier (le préfixe sponsorisé ligne ~145 reste tel quel).

- [ ] **Step 2: Vérifier la syntaxe**

Run: `node --check backend/routes/produits.js`
Expected: exit 0

- [ ] **Step 3: Vérification réelle (backend local éphémère contre la base de prod)**

En Bash, depuis la racine :

```bash
SCRAPING_DISABLED=true PORT=3000 node backend/app.js > /tmp/backend-test.log 2>&1 &
BPID=$!
sleep 8
curl -s "http://localhost:3000/api/produits?limit=5" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log((j.produits||j.data).map(p=>p.prix_min).join(' | '))})"
curl -s "http://localhost:3000/api/produits?limit=5&tri=populaire" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log((j.produits||j.data).map(p=>p.nb_offres).join(' | '))})"
kill $BPID
```

Expected : 1ʳᵉ ligne = des `prix_min` croissants (les sponsorisés éventuels en tête peuvent déroger — vérifier que le reste est croissant) ; 2ᵉ ligne = des `nb_offres` décroissants. Si le port 3000 est occupé, libérer d'abord (`Get-NetTCPConnection -LocalPort 3000` + `Stop-Process` côté PowerShell).

- [ ] **Step 4: Commit**

```bash
git add backend/routes/produits.js
git commit -m "feat(produits): tri par defaut = prix croissant, ancien classement via tri=populaire"
```

---

### Task 4: Pills de tri frontend (accueil + catégorie)

**Files:**
- Modify: `frontend-next/src/app/page.tsx:44-49` (constante `TRIS`)
- Modify: `frontend-next/src/app/categorie/[slug]/page.tsx:135-139` (constante `TRIS`)

**Interfaces:**
- Consumes: `tri=populaire` côté backend (Task 3).
- Aucun autre fichier : la landing `[sousCategorie]` et la SPA legacy n'ont pas de pills et héritent du nouveau défaut backend sans changement.

- [ ] **Step 1: Accueil — `frontend-next/src/app/page.tsx`**

Remplacer (lignes 44-49) :

```ts
const TRIS = [
  { val: '',          label: 'Pertinence' },
  { val: 'prix_asc',  label: 'Prix ↑' },
  { val: 'prix_desc', label: 'Prix ↓' },
  { val: 'nom_asc',   label: 'Nom A-Z' },
]
```

par :

```ts
const TRIS = [
  { val: '',          label: '💰 Prix ↑' },
  { val: 'populaire', label: '⭐ Populaires' },
  { val: 'prix_desc', label: 'Prix ↓' },
  { val: 'nom_asc',   label: 'Nom A-Z' },
]
```

(La pill `prix_asc` disparaît : elle est devenue identique au défaut. Un lien externe `?tri=prix_asc` continue de fonctionner côté backend — seule la pill active ne le reflétera pas, assumé.)

- [ ] **Step 2: Catégorie — `frontend-next/src/app/categorie/[slug]/page.tsx`**

Remplacer (lignes 135-139) :

```ts
  const TRIS = [
    { val: 'pertinence', label: 'Pertinence' },
    { val: 'prix_asc',   label: 'Prix ↑' },
    { val: 'prix_desc',  label: 'Prix ↓' },
  ]
```

par :

```ts
  // 'pertinence' est la sentinelle historique "aucun paramètre tri envoyé au backend"
  // (voir buildLink / construction de qs plus haut) — le défaut backend est désormais prix croissant.
  const TRIS = [
    { val: 'pertinence', label: '💰 Prix ↑' },
    { val: 'populaire',  label: '⭐ Populaires' },
    { val: 'prix_desc',  label: 'Prix ↓' },
  ]
```

Ne PAS toucher aux lignes `if (tri !== 'pertinence') qs.set('tri', tri)` (ligne ~80) ni `buildLink` (ligne ~104) — elles fonctionnent telles quelles avec `populaire`.

- [ ] **Step 3: Vérifier TypeScript**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: exit 0, aucune erreur. (PAS de `npm run build`.)

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/app/page.tsx "frontend-next/src/app/categorie/[slug]/page.tsx"
git commit -m "feat(ui): pill par defaut 'Prix' + pill 'Populaires' sur accueil et categorie"
```

---

### Task 5: Vérification finale de cohérence (lecture seule)

**Files:**
- Read only.

- [ ] **Step 1: Invariants à vérifier en relisant le code**

1. `sqlNomNormalise` est définie UNE fois (`scraper.js`), exportée, et le script de fusion l'importe (aucune copie de l'expression SQL ailleurs) : `grep -rn "regexp_replace" backend/ | grep -v node_modules` ne doit montrer l'expression de normalisation que dans `scraper.js`.
2. L'étape 1bis est bien APRÈS le bloc EAN et AVANT le bloc fuzzy, et le bloc fuzzy est inchangé (seuils/garde-fous).
3. `backend/routes/produits.js` : seul le calcul d'`orderBy` a changé ; `git diff main -- backend/routes/produits.js` ne montre que ce bloc.
4. `module.exports` de `scraper.js` contient toujours toutes les entrées d'avant + `sqlNomNormalise`.
5. `git status` : rien d'autre que les 5 fichiers du plan (+ docs).

- [ ] **Step 2: Syntaxe/type global**

```bash
node --check backend/services/scraper.js && node --check backend/routes/produits.js && node --check backend/scripts/fusionner-doublons-produits.js && cd frontend-next && npx tsc --noEmit
```
Expected: exit 0 partout.

- [ ] **Step 3: Commit éventuel des ajustements**

```bash
git status; git log --oneline -6
```

---

### Task 6: POST-MERGE — fusion réelle en production (contrôleur + utilisateur, PAS un subagent)

À exécuter uniquement après merge dans `main` + push (le fix de matching doit être dans le code que le scraping utilise — Render redéployé et/ou repo local à jour si le scraping tourne en local).

- [ ] **Step 1:** `node backend/scripts/fusionner-doublons-produits.js --dry-run` — noter les chiffres.
- [ ] **Step 2:** Avec accord explicite de l'utilisateur : `node backend/scripts/fusionner-doublons-produits.js` (LIVE).
- [ ] **Step 3:** Vérifications post-fusion (lecture seule) : re-run du diagnostic doublons (doit retomber à ~0 groupe), comptes `SELECT COUNT(*) FROM alertes` / `offres` avant/après cohérents (aucune perte hors conflits marchands logués), `GET /api/produits?q=samsung&limit=10` et `q=split haier` sans doublon visible, prix croissants sur `GET /api/produits?limit=10`.
- [ ] **Step 4:** Surveiller le run de scraping suivant : `stats.inseres` doit s'effondrer au profit de `mis_a_jour` ; re-vérifier qu'aucun nouveau groupe doublon n'apparaît le lendemain.
