# Brochure commerciale PDF — Programme apporteur d'affaires — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fournir à chaque apporteur d'affaires une brochure PDF téléchargeable (5 pages A4) présentant Nopalou, ses fonctionnalités, le programme apporteur et un guide pratique de démarrage — qu'il peut envoyer tel quel à un commerçant prospect.

**Architecture:** Une route Next.js HTML (`/assets/brochure-apporteur`) sert de source unique éditable pour le contenu des 5 pages, stylée avec les mêmes styles inline React que le reste du kit `/admin/communication`. Un script local (`scripts/generer-brochure-apporteur.js`) utilise Playwright pour convertir cette page en PDF et écrire `public/brochure-apporteur.pdf`, committé dans le repo. Le PDF est ensuite servi comme fichier statique — aucune génération à la volée, aucun risque mémoire côté Render (Playwright a déjà été abandonné sur Render pour cause d'OOM sur ce projet).

**Tech Stack:** Next.js 14 (App Router), React (styles inline, cohérent avec `/admin/communication`), Playwright (devDependency existante), Node script CLI.

## Global Constraints

- Toujours communiquer en français dans ce projet (CLAUDE.md) — tout le texte de la brochure, les commentaires de commit, et les messages aux revues sont en français.
- Palette couleur obligatoire, reprise du kit existant : bleu marine `#1C2B4A`, orange accent `#C75B00`, gris texte `#64748B`, gris clair `#94A3B8`, bordures `#E2E8F0`, fond clair `#F8FAFC`. Police : `system-ui, sans-serif` (cohérent avec `/admin/communication`, pas de police custom).
- Le PDF ne doit **jamais** être généré à la volée en production — uniquement via le script local, committé en tant que fichier statique dans `public/`. Aucune route ne doit invoquer Playwright au runtime.
- La route HTML `/assets/brochure-apporteur` doit rester en `runtime` Node par défaut (ne pas ajouter `export const runtime = 'edge'`) — cohérent avec le piège documenté sur `/assets/carte-visite` (edge incompatible avec certaines dépendances Node).
- Valeurs de repli si `/api/settings/public` échoue : `prixPro = 15000`, `prixBusiness = 35000`, `commissionBusiness = 2`, `tauxApporteur = 10` (mêmes valeurs que `frontend-next/src/app/admin/(protected)/communication/page.tsx:346-361`).
- Format cible : A4, impression avec fonds colorés (`printBackground: true`), 5 pages exactement, séparées par `break-after: page` en CSS.

---

## File Structure

- **Create** `frontend-next/src/app/assets/brochure-apporteur/route.tsx` — route HTML des 5 pages (contenu + styles).
- **Create** `frontend-next/scripts/generer-brochure-apporteur.js` — script Playwright de génération du PDF (usage local uniquement, non exécuté en CI/build).
- **Create** `frontend-next/public/brochure-apporteur.pdf` — fichier PDF généré, committé.
- **Modify** `frontend-next/src/app/(account)/compte/apporteur/ApporteurClient.tsx` — ajoute un bouton de téléchargement.
- **Modify** `frontend-next/src/app/admin/(protected)/communication/page.tsx` — ajoute un lien vers la brochure dans la section apporteur existante.
- **Modify** `c:\Users\bamba\Downloads\yombale-CLAUDE\CLAUDE.md` — documente le nouveau chantier et le processus de régénération manuelle du PDF (dette assumée).

---

### Task 1: Route HTML des 5 pages de la brochure

**Files:**
- Create: `frontend-next/src/app/assets/brochure-apporteur/route.tsx`

**Interfaces:**
- Consumes: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/settings/public` — GET, retourne `{ plan_pro_prix, plan_business_prix, commission_business, ... }` (types `string`, à parser en `Number`). Cette route existe déjà (`backend/routes/settings.js:32-43`) mais ne renvoie **pas** `apporteur_taux_commission` (absent de la liste `keys` de cette route). Il faut donc soit ajouter cette clé à la route backend, soit fixer `tauxApporteur` en dur à `10` avec un commentaire expliquant pourquoi. Ce plan choisit d'ajouter la clé côté backend (cohérence avec le reste du kit qui l'affiche dynamiquement).
- Produces: page HTML complète accessible à `GET /assets/brochure-apporteur`, consommée par le script Playwright de la Task 2.

- [ ] **Step 1: Ajouter `apporteur_taux_commission` à la route publique des settings**

Modifier `backend/routes/settings.js` ligne 34-38 pour ajouter la clé manquante :

```javascript
    const keys = ['prix_annonce','prix_sponsoring','prix_boost','boost_duree_jours',
                  'plan_pro_prix','plan_business_prix','plan_pro_label','plan_business_label',
                  'promo_active','promo_reduction',
                  'paiement_wave','paiement_orange','paiement_manuel_actif',
                  'paiement_manuel_numero_wave','paiement_manuel_numero_om',
                  'apporteur_taux_commission'];
```

- [ ] **Step 2: Vérifier que le backend démarre toujours correctement**

Run: `cd backend && node -e "require('./routes/settings.js'); console.log('OK')"`
Expected: `OK` (pas d'erreur de syntaxe)

- [ ] **Step 3: Créer la route HTML de la brochure**

Créer `frontend-next/src/app/assets/brochure-apporteur/route.tsx` :

```tsx
const COULEURS = {
  marine: '#1C2B4A',
  orange: '#C75B00',
  gris: '#64748B',
  grisClair: '#94A3B8',
  bordure: '#E2E8F0',
  fondClair: '#F8FAFC',
}

async function getSettings() {
  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
  let prixPro = 15000
  let prixBusiness = 35000
  let commissionBusiness = 2
  let tauxApporteur = 10
  try {
    const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
    if (r.ok) {
      const s = await r.json()
      prixPro = Number(s.plan_pro_prix) || 15000
      prixBusiness = Number(s.plan_business_prix) || 35000
      commissionBusiness = Number(s.commission_business) || 2
      tauxApporteur = Number(s.apporteur_taux_commission) || 10
    }
  } catch {
    // valeurs de repli
  }
  return { prixPro, prixBusiness, commissionBusiness, tauxApporteur }
}

function fcfa(n: number) {
  return `${n.toLocaleString('fr-FR')} FCFA`
}

const VERTICALES = [
  { emoji: '📱', titre: 'Produits', detail: 'Comparez les prix de milliers de produits chez tous les marchands en ligne au Sénégal — téléphones, TV, électro, mode.' },
  { emoji: '🏠', titre: 'Immobilier', detail: 'Location et vente d\'appartements, villas, terrains — annonces vérifiées avec photos et prix.' },
  { emoji: '📶', titre: 'Télécom', detail: 'Comparez les forfaits Orange, Yas, Expresso, Promobile en un coup d\'œil.' },
  { emoji: '🛍️', titre: 'Boutiques en ligne', detail: 'Les commerçants créent leur boutique et reçoivent leurs commandes directement sur WhatsApp.' },
  { emoji: '📋', titre: 'Annonces classifiées', detail: 'Vente entre particuliers — véhicules, meubles, équipements.' },
]

const ETAPES_APPORTEUR = [
  { titre: 'Activez votre statut', detail: 'Rendez-vous sur nopalou.com/compte/apporteur et activez votre statut d\'apporteur en un clic.' },
  { titre: 'Récupérez votre lien', detail: 'Un code et un lien unique vous sont attribués automatiquement — aucune configuration nécessaire.' },
  { titre: 'Partagez-le', detail: 'Envoyez votre lien par WhatsApp, en personne ou sur les réseaux à un commerçant, une agence ou un vendeur de votre réseau.' },
  { titre: 'Suivez vos commissions', detail: 'Dès que votre contact passe en abonnement Pro ou Business payant, vous touchez une commission chaque mois, visible depuis votre espace apporteur.' },
]

function PagePied({ page }: { page: number }) {
  return (
    <div style={{
      position: 'absolute', bottom: 24, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-between', padding: '0 48px',
      fontSize: 11, color: COULEURS.grisClair,
    }}>
      <span>nopalou.com</span>
      <span>{page} / 5</span>
    </div>
  )
}

export async function GET() {
  const { prixPro, prixBusiness, commissionBusiness, tauxApporteur } = await getSettings()

  const commissionPro = Math.round(prixPro * tauxApporteur / 100)
  const commissionBiz = Math.round(prixBusiness * tauxApporteur / 100)

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Brochure apporteur d'affaires — Nopalou</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; }
  .page { width: 210mm; height: 297mm; position: relative; overflow: hidden; break-after: page; }
  .page:last-child { break-after: auto; }
</style>
</head>
<body>

<!-- PAGE 1 — Couverture -->
<div class="page" style="background: linear-gradient(160deg, ${COULEURS.marine} 0%, #0f1d35 60%, #1a1a2e 100%); display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff; padding: 60px;">
  <div style="position:absolute; right:-80px; top:-80px; width:360px; height:360px; border-radius:50%; background: radial-gradient(circle, rgba(199,91,0,0.3) 0%, transparent 70%);"></div>
  <div style="position:absolute; left:-60px; bottom:-60px; width:300px; height:300px; border-radius:50%; background: radial-gradient(circle, rgba(199,91,0,0.2) 0%, transparent 70%);"></div>
  <div style="display:flex; align-items:center; gap:16px; margin-bottom:56px;">
    <div style="width:64px; height:64px; border-radius:14px; background:${COULEURS.orange}; display:flex; align-items:center; justify-content:center; font-size:36px; font-weight:900; color:#fff;">N</div>
    <span style="font-size:40px; font-weight:900;">Nopa<span style="color:${COULEURS.orange};">lou</span></span>
  </div>
  <p style="font-size:44px; font-weight:900; text-align:center; margin:0 0 20px; max-width:600px; line-height:1.2;">Devenez apporteur d'affaires Nopalou</p>
  <p style="font-size:20px; color:#CBD5E1; text-align:center; margin:0; max-width:520px; line-height:1.6;">Présentez Nopalou aux commerçants de votre réseau et touchez une commission chaque mois.</p>
  <div style="margin-top:56px; background:${COULEURS.orange}; border-radius:16px; padding:16px 40px; font-size:20px; font-weight:800;">nopalou.com/compte/apporteur</div>
</div>

<!-- PAGE 2 — C'est quoi Nopalou -->
<div class="page" style="background:#fff; padding:56px 48px;">
  <h1 style="font-size:28px; font-weight:900; color:${COULEURS.marine}; margin:0 0 8px;">C'est quoi Nopalou ?</h1>
  <p style="font-size:15px; color:${COULEURS.gris}; line-height:1.7; margin:0 0 32px; max-width:640px;">
    Nopalou est la plateforme sénégalaise qui compare les prix de milliers de produits, annonces immobilières et forfaits télécom au Sénégal — 100% gratuite pour les acheteurs, avec des boutiques en ligne pour les commerçants. L'objectif : aider chacun à mieux acheter, et aider chaque marchand à être visible auprès de clients déjà en recherche active.
  </p>
  <div style="display:flex; flex-direction:column; gap:14px;">
    ${VERTICALES.map(v => `
    <div style="display:flex; gap:16px; align-items:flex-start; border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:16px 20px; background:${COULEURS.fondClair};">
      <span style="font-size:26px;">${v.emoji}</span>
      <div>
        <p style="font-size:15px; font-weight:700; color:${COULEURS.marine}; margin:0 0 4px;">${v.titre}</p>
        <p style="font-size:13px; color:${COULEURS.gris}; margin:0; line-height:1.5;">${v.detail}</p>
      </div>
    </div>`).join('')}
  </div>
  <div>${PagePiedString(2)}</div>
</div>

<!-- PAGE 3 — Le programme apporteur -->
<div class="page" style="background:#fff; padding:56px 48px;">
  <h1 style="font-size:28px; font-weight:900; color:${COULEURS.marine}; margin:0 0 8px;">Le programme apporteur d'affaires</h1>
  <div style="display:inline-block; background:#FFF7ED; border:1.5px solid ${COULEURS.orange}; border-radius:30px; padding:8px 20px; font-size:14px; color:${COULEURS.orange}; font-weight:700; margin-bottom:24px;">
    ${tauxApporteur}% de commission récurrente
  </div>
  <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:32px;">
    <thead>
      <tr style="background:${COULEURS.fondClair}; border-bottom:2px solid ${COULEURS.bordure};">
        <th style="padding:10px 14px; text-align:left; color:${COULEURS.gris}; font-weight:700;">Formule recrutée</th>
        <th style="padding:10px 14px; text-align:left; color:${COULEURS.gris}; font-weight:700;">Prix</th>
        <th style="padding:10px 14px; text-align:left; color:${COULEURS.gris}; font-weight:700;">Votre commission</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid #F1F5F9;">
        <td style="padding:12px 14px; font-weight:700; color:${COULEURS.marine};">Boutique Pro</td>
        <td style="padding:12px 14px; color:${COULEURS.gris};">${fcfa(prixPro)}/mois</td>
        <td style="padding:12px 14px; color:${COULEURS.orange}; font-weight:700;">${fcfa(commissionPro)}/mois</td>
      </tr>
      <tr style="border-bottom:1px solid #F1F5F9;">
        <td style="padding:12px 14px; font-weight:700; color:${COULEURS.marine};">Boutique Business</td>
        <td style="padding:12px 14px; color:${COULEURS.gris};">${fcfa(prixBusiness)}/mois</td>
        <td style="padding:12px 14px; color:${COULEURS.orange}; font-weight:700;">${fcfa(commissionBiz)}/mois</td>
      </tr>
    </tbody>
  </table>
  <h2 style="font-size:16px; font-weight:700; color:${COULEURS.marine}; margin:0 0 14px;">Comment ça marche</h2>
  <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:24px;">
    ${ETAPES_APPORTEUR.map((e, i) => `
    <div style="display:flex; gap:14px; align-items:flex-start;">
      <span style="font-size:12px; font-weight:800; color:${COULEURS.orange}; background:#FFF7ED; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${i + 1}</span>
      <div>
        <p style="font-size:13px; font-weight:700; color:${COULEURS.marine}; margin:0 0 2px;">${e.titre}</p>
        <p style="font-size:12px; color:${COULEURS.gris}; margin:0; line-height:1.5;">${e.detail}</p>
      </div>
    </div>`).join('')}
  </div>
  <h2 style="font-size:14px; font-weight:700; color:${COULEURS.marine}; margin:0 0 10px;">Quoi dire à un commerçant</h2>
  <div style="border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:16px 20px; background:${COULEURS.fondClair};">
    <p style="font-size:13px; color:${COULEURS.marine}; margin:0; line-height:1.7;">
      « Je te recommande Nopalou — ça te permet d'avoir une boutique en ligne et de recevoir tes commandes directement sur WhatsApp, l'outil que tu utilises déjà. Le premier mois est gratuit, sans engagement, et il n'y a pas de commission cachée. »
    </p>
  </div>
  <div>${PagePiedString(3)}</div>
</div>

<!-- PAGE 4 — Guide pratique -->
<div class="page" style="background:#fff; padding:56px 48px;">
  <h1 style="font-size:28px; font-weight:900; color:${COULEURS.marine}; margin:0 0 8px;">Démarrez en 4 étapes</h1>
  <p style="font-size:14px; color:${COULEURS.gris}; margin:0 0 32px;">Ce guide est pour vous, l'apporteur — suivez ces étapes pour commencer à recruter dès aujourd'hui.</p>
  <div style="display:flex; flex-direction:column; gap:18px;">
    ${ETAPES_APPORTEUR.map((e, i) => `
    <div style="display:flex; gap:18px; align-items:flex-start; border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:20px 24px; background:${COULEURS.fondClair};">
      <span style="font-size:16px; font-weight:900; color:#fff; background:${COULEURS.orange}; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${i + 1}</span>
      <div>
        <p style="font-size:16px; font-weight:700; color:${COULEURS.marine}; margin:0 0 4px;">${e.titre}</p>
        <p style="font-size:13px; color:${COULEURS.gris}; margin:0; line-height:1.6;">${e.detail}</p>
      </div>
    </div>`).join('')}
  </div>
  <div>${PagePiedString(4)}</div>
</div>

<!-- PAGE 5 — Contact -->
<div class="page" style="background: linear-gradient(160deg, ${COULEURS.marine} 0%, #0f1d35 60%, #1a1a2e 100%); display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff; padding:60px;">
  <p style="font-size:32px; font-weight:900; text-align:center; margin:0 0 20px;">Prêt à commencer ?</p>
  <p style="font-size:16px; color:#CBD5E1; text-align:center; margin:0 0 40px; max-width:480px; line-height:1.7;">
    Aucun investissement · Paiement mensuel · Sans limite de recrutement
  </p>
  <div style="background:${COULEURS.orange}; border-radius:16px; padding:18px 44px; font-size:22px; font-weight:800; margin-bottom:20px;">
    nopalou.com/compte/apporteur
  </div>
  <p style="font-size:14px; color:${COULEURS.grisClair};">💬 Contact WhatsApp officiel Nopalou</p>
  <div>${PagePiedString(5)}</div>
</div>

</body>
</html>`

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

function PagePiedString(page: number) {
  return `<div style="position:absolute; bottom:24px; left:0; right:0; display:flex; justify-content:space-between; padding:0 48px; font-size:11px; color:${COULEURS.grisClair};"><span>nopalou.com</span><span>${page} / 5</span></div>`
}
```

Note d'implémentation : `PagePied` (composant React défini plus haut) est inutilisé dans la version finale — la génération passe par un template string HTML brut (pas de JSX/`ImageResponse`) car Playwright a besoin de vraie navigation HTTP sur du HTML statique, pas d'un composant React server-rendered isolé. Supprimer le composant `PagePied` React mort du fichier et ne garder que `PagePiedString`.

- [ ] **Step 4: Nettoyer le composant React mort**

Dans le fichier créé à l'étape 3, supprimer entièrement le bloc :

```tsx
function PagePied({ page }: { page: number }) {
  return (
    <div style={{
      position: 'absolute', bottom: 24, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-between', padding: '0 48px',
      fontSize: 11, color: COULEURS.grisClair,
    }}>
      <span>nopalou.com</span>
      <span>{page} / 5</span>
    </div>
  )
}
```

(Il ne doit rester que `PagePiedString`, utilisée dans les template strings.)

- [ ] **Step 5: Vérifier la compilation TypeScript**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: 0 erreur liée à `src/app/assets/brochure-apporteur/route.tsx`

- [ ] **Step 6: Vérifier le rendu HTML réel en local**

Run (dans un terminal, backend doit tourner sur le port 3000) :
```bash
cd frontend-next && npm run dev
```
Puis dans un navigateur ou via curl, ouvrir `http://localhost:3001/assets/brochure-apporteur` et vérifier visuellement les 5 pages (`Ctrl+F` / scroll) : logo, titre couverture, 5 verticales page 2, tableau commission page 3 avec vrais montants, 4 étapes page 4, contact page 5. Confirmer qu'aucune balise ne s'affiche brute (pas de `undefined`/`NaN`).

- [ ] **Step 7: Commit**

```bash
git add backend/routes/settings.js frontend-next/src/app/assets/brochure-apporteur/route.tsx
git commit -m "feat(brochure-apporteur): ajoute la page HTML source de la brochure 5 pages"
```

---

### Task 2: Script de génération du PDF (Playwright, usage local)

**Files:**
- Create: `frontend-next/scripts/generer-brochure-apporteur.js`

**Interfaces:**
- Consumes: `http://localhost:3001/assets/brochure-apporteur` (route HTML de la Task 1), doit être servie par un `npm run dev` actif au moment de l'exécution.
- Produces: `frontend-next/public/brochure-apporteur.pdf` — fichier binaire, consommé par la Task 3 (bouton de téléchargement) et Task 4 (lien admin).

- [ ] **Step 1: Écrire le script**

Créer `frontend-next/scripts/generer-brochure-apporteur.js` :

```javascript
// Génère public/brochure-apporteur.pdf à partir de la route HTML /assets/brochure-apporteur.
// Usage : lancer `npm run dev` dans un terminal, puis `node scripts/generer-brochure-apporteur.js` dans un autre.
// Ce script n'est JAMAIS exécuté en build/CI — Playwright ne doit pas tourner sur Render (voir CLAUDE.md).
const { chromium } = require('playwright');
const path = require('path');

const URL = process.env.BROCHURE_URL || 'http://localhost:3001/assets/brochure-apporteur';
const OUT = path.join(__dirname, '..', 'public', 'brochure-apporteur.pdf');

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const res = await page.goto(URL, { waitUntil: 'networkidle' });
  if (!res || !res.ok()) {
    throw new Error(`Impossible de charger ${URL} — code ${res ? res.status() : 'aucune réponse'}. Le serveur npm run dev tourne-t-il sur le port 3001 ?`);
  }
  await page.pdf({ path: OUT, format: 'A4', printBackground: true });
  await browser.close();
  console.log(`Brochure générée : ${OUT}`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Vérifier que Playwright et ses navigateurs sont installés localement**

Run: `cd frontend-next && npx playwright install chromium`
Expected: confirmation d'installation ou "already installed"

- [ ] **Step 3: Lancer le serveur de dev et générer le PDF**

Dans un premier terminal :
```bash
cd frontend-next && npm run dev
```

Dans un second terminal, une fois le serveur prêt :
```bash
cd frontend-next && node scripts/generer-brochure-apporteur.js
```
Expected: `Brochure générée : .../frontend-next/public/brochure-apporteur.pdf`, fichier présent et non vide (`ls -la public/brochure-apporteur.pdf`, taille > 0).

- [ ] **Step 4: Vérifier visuellement le PDF généré**

Ouvrir `frontend-next/public/brochure-apporteur.pdf` dans un lecteur PDF (ou navigateur). Confirmer : 5 pages exactement, format A4, fonds colorés visibles (pas de fond blanc là où un dégradé était prévu), pas de contenu tronqué/coupé entre pages, tableau de commission lisible avec les vrais montants.

- [ ] **Step 5: Commit**

```bash
git add frontend-next/scripts/generer-brochure-apporteur.js frontend-next/public/brochure-apporteur.pdf
git commit -m "feat(brochure-apporteur): ajoute le script de generation PDF et le PDF genere"
```

---

### Task 3: Bouton de téléchargement sur `/compte/apporteur`

**Files:**
- Modify: `frontend-next/src/app/(account)/compte/apporteur/ApporteurClient.tsx:106-134`

**Interfaces:**
- Consumes: fichier statique `/brochure-apporteur.pdf` (produit par la Task 2, servi depuis `public/`).
- Produces: aucune interface consommée par d'autres tâches — modification terminale de l'UI.

- [ ] **Step 1: Ajouter le bouton de téléchargement**

Dans `frontend-next/src/app/(account)/compte/apporteur/ApporteurClient.tsx`, localiser le bloc de boutons de partage (lignes 106-134, entre `copierLien` et le lien "🖼 Télécharger le visuel"). Ajouter un nouveau lien juste après le bouton "🖼 Télécharger le visuel" :

```tsx
          <a
            href="/assets/apporteur-affaires"
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '10px 18px', background: '#fff', color: '#C75B00',
              border: '1px solid #C75B00', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center' }}
          >
            🖼 Télécharger le visuel
          </a>
          <a
            href="/brochure-apporteur.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '10px 18px', background: '#fff', color: '#1C2B4A',
              border: '1px solid #1C2B4A', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center' }}
          >
            📄 Télécharger la brochure PDF
          </a>
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: 0 erreur liée à `ApporteurClient.tsx`

- [ ] **Step 3: Vérifier visuellement**

Avec `npm run dev` actif et un compte de test connecté ayant le statut apporteur actif, ouvrir `/compte/apporteur` et confirmer que le bouton "📄 Télécharger la brochure PDF" est visible à côté des autres boutons de partage, et qu'un clic ouvre bien le PDF.

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/app/\(account\)/compte/apporteur/ApporteurClient.tsx
git commit -m "feat(brochure-apporteur): ajoute le bouton de telechargement sur /compte/apporteur"
```

---

### Task 4: Lien vers la brochure dans le kit admin `/admin/communication`

**Files:**
- Modify: `frontend-next/src/app/admin/(protected)/communication/page.tsx:614-627`

**Interfaces:**
- Consumes: fichier statique `/brochure-apporteur.pdf`.
- Produces: aucune — modification terminale de l'UI admin.

- [ ] **Step 1: Ajouter le lien dans la section programme apporteur**

Dans `frontend-next/src/app/admin/(protected)/communication/page.tsx`, localiser la section "📢 Texte de recrutement" du programme apporteur (lignes 614-627). Ajouter un paragraphe avec le lien juste avant le `<pre>` du texte de recrutement :

```tsx
      <section>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          📢 Texte de recrutement (à partager par WhatsApp/réseaux)
        </h2>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
          Brochure complète à remettre à un apporteur pour qu&apos;il puisse démarcher directement :{' '}
          <a href="/brochure-apporteur.pdf" target="_blank" rel="noopener noreferrer" style={{ color: '#C75B00', fontWeight: 700 }}>
            /brochure-apporteur.pdf
          </a>
        </p>
        <pre style={{
          fontSize: 13, color: '#1C2B4A', whiteSpace: 'pre-wrap',
          background: '#F8FAFC', border: '1px solid #E2E8F0',
          borderRadius: 8, padding: '20px', margin: 0, lineHeight: 1.8,
          fontFamily: 'system-ui, sans-serif',
        }}>
          {apporteurTexte}
        </pre>
      </section>
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: 0 erreur liée à `communication/page.tsx`

- [ ] **Step 3: Vérifier visuellement**

Avec `npm run dev` actif et une session admin valide, ouvrir `/admin/communication`, descendre à la section "💼 Programme apporteur d'affaires" → "📢 Texte de recrutement", confirmer que le lien vers la brochure est visible et fonctionnel.

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/app/admin/\(protected\)/communication/page.tsx
git commit -m "feat(brochure-apporteur): ajoute le lien vers la brochure dans le kit admin"
```

---

### Task 5: Documentation CLAUDE.md

**Files:**
- Modify: `c:\Users\bamba\Downloads\yombale-CLAUDE\CLAUDE.md`

**Interfaces:**
- Consumes: rien (tâche de documentation pure).
- Produces: rien — tâche finale du chantier.

- [ ] **Step 1: Ajouter une entrée d'état du projet**

Ajouter une nouvelle section juste après la ligne `## Prochain chantier` existante (ou en tête des entrées "État du projet"), suivant le même format que les entrées précédentes du fichier :

```markdown
## État du projet (20 juillet 2026 — brochure PDF pour les apporteurs d'affaires)

Le kit `/admin/communication` ne fournissait rien qu'un apporteur actif puisse remettre lui-même à un commerçant prospect. Ajout d'une brochure PDF de 5 pages (couverture, présentation Nopalou, programme apporteur avec grille de commission dynamique, guide pratique en 4 étapes, contact) — process complet brainstorming → spec → plan. Spec : `docs/superpowers/specs/2026-07-20-brochure-apporteur-affaires-design.md`. Plan : `docs/superpowers/plans/2026-07-20-brochure-apporteur-affaires.md`.

**Décision technique notable** : la génération du PDF a d'abord été conçue pour tourner à la volée sur une route Next.js via Playwright, puis abandonnée avant implémentation — Playwright a déjà causé des OOM sur Render côté backend (scraper Facebook, voir entrée du 13 juillet 2026), et le service frontend Render (`output: 'standalone'`) n'a pas Chromium installé. À la place : une route HTML normale (`/assets/brochure-apporteur`, sans Playwright, sert aussi d'aperçu) + un script local (`frontend-next/scripts/generer-brochure-apporteur.js`) qui utilise Playwright uniquement en développement pour produire `frontend-next/public/brochure-apporteur.pdf`, committé et servi comme fichier statique — zéro dépendance runtime en production.

**Dette assumée** : le PDF n'est **pas régénéré automatiquement** si les tarifs (`plan_pro_prix`, `plan_business_prix`, `commission_business`, `apporteur_taux_commission`) changent depuis `/admin/tarifs` — contrairement au reste du kit `/admin/communication` qui est dynamique. Si les tarifs changent, relancer manuellement : `npm run dev` (frontend-next) puis `node scripts/generer-brochure-apporteur.js`, et committer le nouveau `public/brochure-apporteur.pdf`.

**Ajout complémentaire** : `apporteur_taux_commission` a été ajouté à la liste des clés exposées par `GET /api/settings/public` (`backend/routes/settings.js`) — cette route existait déjà mais n'exposait pas ce taux, contrairement à ce que `/admin/communication` (qui lit `/api/settings` en admin, pas `/public`) laissait supposer.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: documente le chantier brochure PDF apporteur d'affaires"
```

---

## Self-Review Notes

- **Spec coverage** : couverture (Task 1), page "c'est quoi Nopalou" (Task 1), programme apporteur + grille commission dynamique (Task 1 + backend Step 1), guide pratique 4 étapes (Task 1), contact (Task 1), génération PDF (Task 2), intégration `/compte/apporteur` (Task 3), intégration `/admin/communication` (Task 4). Tout le contenu de la spec est couvert.
- **Écart assumé par rapport à la spec initiale** : la spec v1 prévoyait une route PDF à la volée (`/assets/brochure-apporteur.pdf`) ; la spec a été corrigée en amont de ce plan (voir section "Génération technique" mise à jour) suite à la découverte du risque OOM Render — ce plan implémente la version corrigée (fichier statique).
- **Cohérence des noms** : `apporteurTexte`, `PagePiedString`, `COULEURS`, `VERTICALES`, `ETAPES_APPORTEUR` utilisés de façon cohérente à l'intérieur de la Task 1 (un seul fichier). Le chemin du PDF (`/brochure-apporteur.pdf`) est identique dans Task 2 (sortie), Task 3 (lien bouton) et Task 4 (lien admin).
- **Pas de placeholder** : chaque step contient le code complet à écrire, pas de "TODO"/"à compléter".
