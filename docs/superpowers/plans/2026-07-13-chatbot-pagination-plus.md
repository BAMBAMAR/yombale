# Chatbot WhatsApp — pagination « plus / encore / d'autres » Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Après une recherche produit ou l'affichage des listes immo/télécom, taper « plus », « encore », « d'autres », « ok », « oui »… montre les résultats **suivants** (jamais déjà vus) au lieu de relancer la même requête.

**Architecture:** Un seul fichier touché : `backend/services/whatsapp-chatbot.js`. Le contexte de session JSONB existant (`whatsapp_sessions.context`) mémorise `{ last: { type: 'search'|'immo'|'telecom', query?, shownIds: [] } }`. Chaque requête d'affichage reçoit un paramètre `excludeIds` (`AND id::text <> ALL($n::text[])`). Un détecteur de mots-clés « plus » en état `MENU` (avant la FAQ et avant le fallback recherche) route vers la relance avec exclusion.

**Tech Stack:** Node.js (CommonJS), `pg` (Pool), API WhatsApp Meta via `./whatsapp`. **Aucun framework de test dans ce repo** — vérification par `node --check` (syntaxe) + scripts `node -e` en lecture seule contre la base (le `.env` racine pointe vers la base de production — requêtes SELECT uniquement, jamais d'écriture).

**Spec:** `docs/superpowers/specs/2026-07-13-chatbot-pagination-plus-design.md`

## Global Constraints

- Un seul fichier de code modifié : `backend/services/whatsapp-chatbot.js`. Aucun changement de schéma DB, aucun template Meta, aucune nouvelle dépendance.
- Mots-clés pagination (correspondance **exacte** sur texte normalisé) : `plus`, `encore`, `d'autres`, `dautres`, `autres`, `autre`, `voir plus`, `la suite`, `suivant`, `ok`, `oui`.
- `ok merci`, `non merci`, etc. restent des clôtures : le bloc `CLOTURE` existant (ligne ~221) est testé AVANT le bloc `MENU` — ne pas le déplacer.
- Tous les messages utilisateur sont en français, même ton/emojis que l'existant.
- Toujours caster le paramètre tableau : `<> ALL($n::text[])` (un tableau JS vide `[]` passé par `pg` sans cast peut être ambigu).
- Après chaque tâche : `node --check backend/services/whatsapp-chatbot.js` doit sortir sans erreur avant de committer.
- Les scripts de vérification `node -e` doivent être écrits dans des fichiers temporaires du scratchpad (`C:\Users\bamba\AppData\Local\Temp\claude\...\scratchpad\`) puis exécutés `node <fichier>` — PowerShell casse les `node -e "..."` multi-lignes.

---

### Task 1: `searchContent(query, excludeIds)` — exclusion des IDs déjà vus

**Files:**
- Modify: `backend/services/whatsapp-chatbot.js:140-182` (fonction `searchContent`)

**Interfaces:**
- Produces: `searchContent(query, excludeIds = [])` → `Promise<rows>` — signature rétrocompatible (l'appel existant `searchContent(query)` reste valide). Chaque `row` a `{ type, id (text), titre, prix, photo, boutique_slug, boutique_nom, ville }` (inchangé).

- [ ] **Step 1: Modifier `searchContent`**

Remplacer la fonction entière (lignes 140-182) par :

```js
// ── Recherche full-text ───────────────────────────────────────────────────────
// excludeIds : IDs (text) déjà montrés à l'utilisateur — exclus pour la pagination "plus".
async function searchContent(query, excludeIds = []) {
  const r = await pool.query(
    `(
      SELECT 'marketplace' AS type, id::text, nom AS titre, prix_min AS prix,
             image_url AS photo, NULL::text AS boutique_slug, NULL::text AS boutique_nom, NULL::text AS ville
      FROM produits
      WHERE to_tsvector('french', nom || ' ' || COALESCE(description,''))
            @@ plainto_tsquery('french', $1)
        AND id::text <> ALL($2::text[])
      LIMIT 3
    )
    UNION ALL
    (
      SELECT 'produit', p.id::text, p.nom AS titre, p.prix,
             p.images[1] AS photo, b.slug AS boutique_slug, b.nom AS boutique_nom, NULL AS ville
      FROM boutique_produits p
      JOIN boutiques b ON b.id = p.boutique_id
      WHERE to_tsvector('french', p.nom || ' ' || COALESCE(p.description,''))
            @@ plainto_tsquery('french', $1)
        AND p.id::text <> ALL($2::text[])
      LIMIT 3
    )
    UNION ALL
    (
      SELECT 'annonce', id::text, titre, prix, (photos->>0), NULL::text, NULL::text, NULL::text
      FROM annonces_classifiees
      WHERE actif=true AND supprimee=false AND jsonb_array_length(photos) > 0
        AND to_tsvector('french', titre || ' ' || COALESCE(description,''))
            @@ plainto_tsquery('french', $1)
        AND id::text <> ALL($2::text[])
      LIMIT 3
    )
    UNION ALL
    (
      SELECT 'immo', id::text, titre, prix, (photos->>0), NULL::text, NULL::text, ville
      FROM annonces_immo
      WHERE actif=true AND jsonb_array_length(photos) > 0
        AND to_tsvector('french', titre || ' ' || COALESCE(description,''))
            @@ plainto_tsquery('french', $1)
        AND id::text <> ALL($2::text[])
      LIMIT 3
    )
    LIMIT 5`,
    [query, excludeIds]
  );
  return r.rows;
}
```

- [ ] **Step 2: Vérifier la syntaxe**

Run: `node --check backend/services/whatsapp-chatbot.js`
Expected: aucune sortie (exit 0)

- [ ] **Step 3: Vérification réelle contre la base (lecture seule)**

Écrire dans le scratchpad un fichier `verif-search.js` :

```js
require('dotenv').config();
const { pool } = require('C:/Users/bamba/Downloads/yombale-CLAUDE/backend/models/db');
const chatbot = require('C:/Users/bamba/Downloads/yombale-CLAUDE/backend/services/whatsapp-chatbot.js');
// searchContent n'est pas exporté — on teste via une requête directe équivalente ? NON :
// l'exporter n'est pas nécessaire ; on duplique l'appel via handleSearchQuery serait un envoi WhatsApp réel.
// => Ajouter temporairement searchContent aux exports N'EST PAS souhaité.
// À la place : test SQL direct de la clause d'exclusion.
(async () => {
  const q = 'samsung';
  const page1 = await pool.query(
    `SELECT id::text, nom FROM produits
     WHERE to_tsvector('french', nom || ' ' || COALESCE(description,'')) @@ plainto_tsquery('french', $1)
       AND id::text <> ALL($2::text[]) LIMIT 3`, [q, []]);
  const ids1 = page1.rows.map(r => r.id);
  const page2 = await pool.query(
    `SELECT id::text, nom FROM produits
     WHERE to_tsvector('french', nom || ' ' || COALESCE(description,'')) @@ plainto_tsquery('french', $1)
       AND id::text <> ALL($2::text[]) LIMIT 3`, [q, ids1]);
  const ids2 = page2.rows.map(r => r.id);
  const chevauchement = ids2.filter(i => ids1.includes(i));
  console.log('page1:', page1.rows.map(r => r.nom));
  console.log('page2:', page2.rows.map(r => r.nom));
  console.log(chevauchement.length === 0 ? 'OK — aucun doublon entre pages' : 'ECHEC — doublons: ' + chevauchement);
  await pool.end();
})();
```

Lancer depuis la racine du projet (`cwd` = racine pour que `dotenv` trouve `.env`) : `node <scratchpad>/verif-search.js`
Expected: `OK — aucun doublon entre pages`, et page2 affiche des produits différents de page1.
Note : ce script ne charge PAS le module chatbot (les lignes commentées expliquent pourquoi) — il valide le motif SQL `<> ALL($2::text[])` avec `pg`, y compris le cas tableau vide.

- [ ] **Step 4: Commit**

```bash
git add backend/services/whatsapp-chatbot.js
git commit -m "feat(chatbot): searchContent accepte une liste d'IDs a exclure (pagination)"
```

---

### Task 2: Listes immo/télécom factorisées avec exclusion + mémoire de session

**Files:**
- Modify: `backend/services/whatsapp-chatbot.js` — extraire les blocs `action === 'immo'` (lignes ~242-265) et `action === 'telecom'` (lignes ~266-279) en fonctions, ajouter `excludeIds` et l'écriture du contexte `last`.

**Interfaces:**
- Consumes: rien de Task 1.
- Produces: `envoyerListeImmo(phone, excludeIds = [])` et `envoyerListeTelecom(phone, excludeIds = [])` → `Promise<void>`. Chacune affiche les résultats, envoie le bouton « Envie de continuer ? », et termine par `setSession(phone, 'MENU', { last: { type: 'immo'|'telecom', shownIds: [...] } })` (ou `{}` si liste vide/épuisée). Task 4 les appelle avec `context.last.shownIds`.

- [ ] **Step 1: Créer les deux fonctions**

Ajouter juste au-dessus de `// ── Dispatcher principal ─` :

```js
// ── Listes immo / télécom (menu + pagination "plus") ─────────────────────────
async function envoyerListeImmo(phone, excludeIds = []) {
  const r = await pool.query(
    `SELECT id, titre, prix, (photos->>0) AS photo FROM annonces_immo
     WHERE actif=true AND jsonb_array_length(photos) > 0
       AND id::text <> ALL($1::text[])
     ORDER BY created_at DESC LIMIT 3`,
    [excludeIds]
  );
  if (!r.rows.length) {
    await sendWhatsAppText(
      phone,
      excludeIds.length
        ? '✅ Vous avez vu toutes les annonces immo disponibles. Revenez bientôt, ou tapez *menu*.'
        : 'Aucune annonce immo disponible pour le moment.'
    );
    await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
    await setSession(phone, 'MENU', {});
    return;
  }
  const cards = r.rows.map(a => ({
    imageUrl: a.photo || null,
    title: a.titre,
    detail: prixFmt(a.prix),
    pageUrl: `${SITE}/immo/${a.id}`,
  }));
  await sendWhatsAppCarousel(phone, 'nopalou_carousel_immo', cards).catch(() =>
    sendWhatsAppText(phone, cards.map(c => `• ${c.title} — ${c.detail}\n${c.pageUrl}`).join('\n\n'))
  );
  await attendre(1200); // laisse le temps aux messages du carousel de s'afficher avant le bouton
  await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ? Tapez *plus* pour d\'autres annonces, ou :').catch(() => {});
  await setSession(phone, 'MENU', {
    last: { type: 'immo', shownIds: excludeIds.concat(r.rows.map(a => String(a.id))) },
  });
}

async function envoyerListeTelecom(phone, excludeIds = []) {
  const r = await pool.query(
    `SELECT id, nom, operateur, prix FROM forfaits_telecom
     WHERE actif=true AND id::text <> ALL($1::text[])
     ORDER BY created_at DESC LIMIT 5`,
    [excludeIds]
  );
  if (!r.rows.length) {
    await sendWhatsAppText(
      phone,
      excludeIds.length
        ? '✅ Vous avez vu toutes les offres télécom disponibles. Revenez bientôt, ou tapez *menu*.'
        : 'Aucune offre télécom disponible pour le moment.'
    );
    await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
    await setSession(phone, 'MENU', {});
    return;
  }
  const lines = r.rows.map(o => `📱 *${o.nom || o.operateur}* — ${prixFmt(o.prix)}\n👉 ${SITE}/telecom`);
  await sendWhatsAppText(phone, lines.join('\n\n'));
  await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ? Tapez *plus* pour d\'autres offres, ou :').catch(() => {});
  await setSession(phone, 'MENU', {
    last: { type: 'telecom', shownIds: excludeIds.concat(r.rows.map(o => String(o.id))) },
  });
}
```

- [ ] **Step 2: Remplacer les blocs inline du MENU**

Le bloc `if (action === 'immo') { ... }` (tout le corps, requête + rendu + `setSession`) devient :

```js
    if (action === 'immo') {
      await envoyerListeImmo(phone);
      return;
    }
```

Le bloc `if (action === 'telecom') { ... }` devient :

```js
    if (action === 'telecom') {
      await envoyerListeTelecom(phone);
      return;
    }
```

- [ ] **Step 3: Vérifier la syntaxe**

Run: `node --check backend/services/whatsapp-chatbot.js`
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add backend/services/whatsapp-chatbot.js
git commit -m "feat(chatbot): listes immo/telecom factorisees avec exclusion d'IDs et memoire de session"
```

---

### Task 3: `handleSearchQuery` — pagination + mémoire de session + message de fin de liste

**Files:**
- Modify: `backend/services/whatsapp-chatbot.js:383-436` (fonction `handleSearchQuery`)

**Interfaces:**
- Consumes: `searchContent(query, excludeIds)` (Task 1).
- Produces: `handleSearchQuery(phone, query, excludeIds = [])` — signature rétrocompatible (les 2 appels existants passent 2 arguments). En fin d'affichage, `setSession(phone, 'MENU', { last: { type: 'search', query, shownIds } })`. Reste exporté dans `module.exports`.

- [ ] **Step 1: Modifier `handleSearchQuery`**

Remplacer la fonction entière par :

```js
async function handleSearchQuery(phone, query, excludeIds = []) {
  if (!query || query.length < 2) {
    await sendWhatsAppText(phone, '⚠️ Entrez au moins 2 caractères.');
    return;
  }
  const results = await searchContent(query, excludeIds);
  if (!results.length) {
    if (excludeIds.length) {
      // Pagination épuisée — tout a déjà été montré.
      await sendWhatsAppText(phone, `✅ Vous avez vu tout ce que j'ai pour *"${query}"*.\n\nEssayez avec d'autres mots-clés ou tapez *menu*.`);
      await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
      await setSession(phone, 'MENU', {});
      return;
    }
    await sendWhatsAppText(phone, `😕 Aucun résultat pour *"${query}"*.\n\nEssayez avec d'autres mots-clés ou tapez *menu*.`);
    await setSession(phone, 'SEARCH_QUERY', {});
    return;
  }

  const produits     = results.filter(r => r.type === 'produit');
  const marketplace  = results.filter(r => r.type === 'marketplace');
  const autres       = results.filter(r => r.type !== 'produit' && r.type !== 'marketplace');

  // Product Messages pour les produits boutique (catalogue Meta)
  for (const p of produits) {
    await sendWhatsAppProduct(
      phone,
      `nopalou-produit-${p.id}`,
      `${p.titre} — ${prixFmt(p.prix)}\n📍 ${p.boutique_nom}`
    ).catch(async () => {
      await sendWhatsAppText(phone, `• *${p.titre}* — ${prixFmt(p.prix)}\n📍 *${p.boutique_nom}*\n👉 ${SITE}/boutiques/${p.boutique_slug}/produits/${p.id}`);
    });
  }

  // Texte pour les produits du comparateur (pas dans le catalogue Meta)
  if (marketplace.length) {
    const lines = marketplace.map(m => `• *${m.titre}* — à partir de ${prixFmt(m.prix)}\n👉 ${SITE}/produit/${m.id}`);
    await sendWhatsAppText(phone, lines.join('\n\n'));
  }

  // Carousel pour annonces/immo
  if (autres.length) {
    const cards = autres.map(a => ({
      imageUrl: a.photo || null,
      title:    a.titre,
      detail:   prixFmt(a.prix),
      pageUrl:  `${SITE}/${a.type === 'immo' ? 'immo' : 'annonces'}/${a.id}`,
    }));
    const template = autres[0]?.type === 'immo' ? 'nopalou_carousel_immo' : 'nopalou_carousel_annonce';
    await sendWhatsAppCarousel(phone, template, cards).catch(async () => {
      const lines = cards.map(c => `• *${c.title}* — ${c.detail}\n${c.pageUrl}`);
      await sendWhatsAppText(phone, lines.join('\n\n'));
    });
  }

  if (produits.length + autres.length > 1) {
    await attendre(1200); // laisse le temps aux messages précédents de s'afficher avant le bouton
  }
  await sendWhatsAppMenuOuFin(phone, 'Tapez *plus* pour d\'autres résultats, faites une nouvelle recherche, ou :').catch(() => {});
  await setSession(phone, 'MENU', {
    last: { type: 'search', query, shownIds: excludeIds.concat(results.map(r => String(r.id))) },
  });
}
```

(Seuls changements vs l'existant : paramètre `excludeIds`, branche « pagination épuisée », libellé du bouton final, et le `setSession` final qui stocke `last` au lieu de `{}`.)

- [ ] **Step 2: Vérifier la syntaxe**

Run: `node --check backend/services/whatsapp-chatbot.js`
Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add backend/services/whatsapp-chatbot.js
git commit -m "feat(chatbot): handleSearchQuery pagine et memorise la derniere recherche en session"
```

---

### Task 4: Détection « plus » en état MENU + routage

**Files:**
- Modify: `backend/services/whatsapp-chatbot.js` — constante de mots-clés près de `CLOTURE` (ligne ~199), nouveau bloc dans l'état `MENU` juste avant `const faq = detecterFAQ(text);` (ligne ~303).

**Interfaces:**
- Consumes: `handleSearchQuery(phone, query, excludeIds)` (Task 3), `envoyerListeImmo(phone, excludeIds)` / `envoyerListeTelecom(phone, excludeIds)` (Task 2). Contexte session `context.last = { type, query?, shownIds }`.

- [ ] **Step 1: Ajouter la constante de mots-clés**

Juste après la ligne `const CLOTURE = [...]` dans `handleIncoming` :

```js
  // Mots de pagination : montrer la suite des derniers résultats (spec 2026-07-13).
  // "ok"/"oui" = réponse naturelle à "Envie de continuer ?". "ok merci" reste une clôture (CLOTURE testée avant).
  const MOTS_PLUS = ['plus', 'encore', 'd\'autres', 'dautres', 'autres', 'autre', 'voir plus', 'la suite', 'suivant', 'ok', 'oui'];
```

- [ ] **Step 2: Ajouter le bloc de routage dans l'état MENU**

Dans le bloc `if (state === 'MENU')`, juste AVANT `// Texte libre reçu en état MENU → question FAQ, sinon traiter comme recherche` :

```js
    // "plus" / "encore" / "d'autres" / "oui"... → paginer les derniers résultats affichés
    if (MOTS_PLUS.includes(normaliserTexte(text))) {
      const last = context?.last;
      if (!last || !last.type) {
        await setSession(phone, 'SEARCH_QUERY', {});
        await sendWhatsAppText(phone, '🔍 Plus de quoi ? Dites-moi ce que vous cherchez (ex: télévision Samsung, canapé, forfait Tigo...)');
        return;
      }
      const shownIds = Array.isArray(last.shownIds) ? last.shownIds : [];
      if (last.type === 'immo')    { await envoyerListeImmo(phone, shownIds); return; }
      if (last.type === 'telecom') { await envoyerListeTelecom(phone, shownIds); return; }
      await handleSearchQuery(phone, last.query, shownIds);
      return;
    }
```

Note : `normaliserTexte(text)` retire les accents mais PAS l'apostrophe — d'où les deux variantes `d'autres`/`dautres`. L'apostrophe typographique `’` n'est pas gérée (claviers mobiles WhatsApp envoient `'`) — assumé.

- [ ] **Step 3: Vérifier la syntaxe**

Run: `node --check backend/services/whatsapp-chatbot.js`
Expected: exit 0

- [ ] **Step 4: Vérification logique hors-ligne du détecteur**

Écrire dans le scratchpad `verif-mots.js` :

```js
function normaliserTexte(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
const MOTS_PLUS = ['plus', 'encore', 'd\'autres', 'dautres', 'autres', 'autre', 'voir plus', 'la suite', 'suivant', 'ok', 'oui'];
const CLOTURE = ['merci', 'merci beaucoup', 'ok merci', 'c\'est bon', 'cest bon', 'au revoir', 'bye', 'a bientot', 'à bientôt', 'non merci', 'ça ira', 'ca ira', 'c\'est tout', 'cest tout'];
const doitPaginer  = ['Plus', 'ENCORE', 'd\'autres', 'Autres', 'voir plus', 'OK', 'Oui', 'la suite'];
const doitCloturer = ['ok merci', 'Non merci', 'merci'];
let ok = true;
for (const t of doitPaginer) {
  const n = normaliserTexte(t);
  if (CLOTURE.includes(n) || !MOTS_PLUS.includes(n)) { console.log('ECHEC pagination:', t); ok = false; }
}
for (const t of doitCloturer) {
  const n = normaliserTexte(t);
  if (!CLOTURE.includes(n)) { console.log('ECHEC cloture:', t); ok = false; }
}
console.log(ok ? 'OK — detection mots-cles correcte' : 'ECHEC');
```

Run: `node <scratchpad>/verif-mots.js`
Expected: `OK — detection mots-cles correcte`

- [ ] **Step 5: Commit**

```bash
git add backend/services/whatsapp-chatbot.js
git commit -m "feat(chatbot): plus/encore/d'autres/oui pagine les derniers resultats affiches"
```

---

### Task 5: Vérification finale de cohérence

**Files:**
- Read only: `backend/services/whatsapp-chatbot.js`

- [ ] **Step 1: Relire le fichier complet et vérifier ces invariants**

1. `CLOTURE` est toujours testée AVANT le bloc `state === 'MENU'` (donc « ok merci » clôture, « ok » seul pagine).
2. Le bloc `MOTS_PLUS` est AVANT `detecterFAQ` et AVANT le fallback recherche dans l'état MENU.
3. Tous les `setSession(..., 'MENU', ...)` qui suivent un affichage paginable (recherche, immo, télécom) stockent `last` ; tous les autres (`fin`, satisfaction, FAQ, support, alerte, commande, guide) restent `{}` — c'est voulu (spec : un détour efface la pagination).
4. `module.exports` inchangé : `{ handleIncoming, cleanupOldMessages, resetInactiveSessions, handleSearchQuery }`.
5. Aucun autre fichier modifié : `git status` ne montre que le fichier chatbot (+ docs/plans).

- [ ] **Step 2: Syntaxe finale**

Run: `node --check backend/services/whatsapp-chatbot.js`
Expected: exit 0

- [ ] **Step 3: Nettoyage éventuel + commit final si des ajustements ont été faits**

```bash
git status
git log --oneline -6
```

**Test manuel WhatsApp (post-déploiement, côté utilisateur)** : recherche « Samsung » → *plus* (nouveaux produits) → *plus* ×n (message « ✅ Vous avez vu tout… ») ; « oui » après « Envie de continuer ? » ; « ok merci » (clôture) ; menu → Annonces immo → *plus* ; menu → Offres télécom → *plus* ; « plus » à froid (« 🔍 Plus de quoi ? »).
