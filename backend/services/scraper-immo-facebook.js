// backend/services/scraper-immo-facebook.js
// Scrape des annonces (toutes catégories) dans des groupes Facebook publics
// et les insère dans annonces_classifiees (catégorie détectée par mots-clés).
//
// ⚠️  PRÉREQUIS
//   - Variables d'env : FB_EMAIL, FB_PASSWORD (compte Facebook valide)
//   - Package playwright installé : npm install playwright
//   - Navigateur Chromium : npx playwright install chromium

let playwright;
try { playwright = require('playwright'); }
catch { playwright = null; }

const fs   = require('fs');
const path = require('path');
const { pool } = require('../models/db');

// Session sauvegardée via `node scripts/fb-login-setup.js` (gère le 2FA manuellement une fois)
const SESSION_FILE = path.join(__dirname, '../.fb-session.json');

const GROUPES = [
  { id: '252740871421764',   label: 'Groupe immo 1' },
  { id: '4675042465930136',  label: 'Groupe immo 2' },
  { id: '1246400909421367',  label: 'Groupe immo 3' },
  { id: '356818102024748',   label: 'Vente rapide grossistes/detaillants' },
  { id: '263300261466842',   label: "T'ES DE TOUBA OFFICIEL" },
  { id: '263795925782124',   label: 'Je vend je vide on achete et echange' },
  { id: '2193708840910911',  label: 'Market Colobane' },
  { id: '329011281773600',   label: 'Marketplace Senegal' },
  { id: '362598108177086',   label: 'Senegal Shopping' },
  { id: '355049209509795',   label: 'Vendre et Acheter en ligne au Senegal' },
  { id: '542521219189852',   label: 'Achat vente a Dakar' },
  { id: '513266200918066',   label: 'Je vide je vends j\'achete je livre' },
  { id: '368760451655502',   label: 'Vendeur chic' },
  { id: '276857303027165',   label: 'Tout vendre et tout acheter au Senegal' },
  { id: '670553284135014',   label: 'Thies ventes et achats en ligne' },
  { id: 'saintlouisachats',  label: 'Achats et ventes a Saint-Louis' },
];

const VILLES = ['Dakar', 'Thiès', 'Mbour', 'Saint-Louis', 'Ziguinchor',
                'Kaolack', 'Touba', 'Diourbel', 'Louga'];

// Catégories connues (categories.slug en DB) + mots-clés associés, ordre = priorité de match
const CATEGORIES_MOTS = [
  { slug: 'immo',        mots: ['loue', 'location', 'à louer', 'appartement', 'villa', 'studio',
                                 'chambre à louer', 'maison à louer', 'bureau', 'terrain', 'duplex',
                                 'immeuble', 'titre foncier', 'bail', 'caution'] },
  { slug: 'smartphones', mots: ['iphone', 'samsung', 'xiaomi', 'redmi', 'tecno', 'infinix', 'huawei',
                                 'smartphone', 'telephone', 'téléphone', 'portable', 'android'] },
  { slug: 'informatique', mots: ['ordinateur', 'laptop', 'pc portable', 'macbook', 'imprimante',
                                  'clavier', 'souris', 'disque dur', 'ram', 'processeur'] },
  { slug: 'tv-electro',  mots: ['televiseur', 'téléviseur', 'tv ', 'ecran', 'écran', 'climatiseur',
                                 'refrigerateur', 'réfrigérateur', 'congelateur', 'congélateur',
                                 'machine a laver', 'machine à laver', 'ventilateur', 'micro-onde'] },
  { slug: 'mode',        mots: ['robe', 'chaussure', 'sac a main', 'sac à main', 'vetement', 'vêtement',
                                 'boubou', 'basket', 'montre', 'bijoux', 'dressing'] },
  { slug: 'auto-moto',   mots: ['voiture', 'moto', 'scooter', 'jakarta', 'vehicule', 'véhicule',
                                 'pneu', 'moteur voiture'] },
  { slug: 'beaute',      mots: ['parfum', 'maquillage', 'creme', 'crème', 'cosmetique', 'cosmétique',
                                 'perruque', 'meche', 'mèche'] },
  { slug: 'jeux',        mots: ['playstation', 'ps4', 'ps5', 'xbox', 'manette', 'console de jeux', 'nintendo'] },
  { slug: 'maison',      mots: ['meuble', 'canape', 'canapé', 'matelas', 'table a manger',
                                 'table à manger', 'lit', 'armoire', 'tapis', 'rideaux'] },
];

// Doit matcher au moins 1 mot-clé d'une catégorie ET avoir un signal de vente (prix, contact...)
const SIGNAUX_VENTE = ['fcfa', 'xof', 'prix', 'a vendre', 'à vendre', 'vends', 'vend', 'disponible',
                        'dispo', 'livraison', 'contact', 'whatsapp', 'inbox', 'messagez'];

// Marqueurs d'un fil de commentaires capturé par erreur au lieu du post lui-même
// (pas de prix/description, juste les boutons de réaction Facebook)
const MARQUEURS_COMMENTAIRE = ['j’aime', "j'aime", 'répondre', 'partager'];

function estFilDeCommentaires(texte) {
  const t = texte.toLowerCase();
  const motsTexte = t.split(/\s+/).filter(Boolean);
  if (motsTexte.length > 15) return false; // un vrai post a généralement plus de contenu
  return MARQUEURS_COMMENTAIRE.filter(m => t.includes(m)).length >= 2;
}

function detecterCategorie(texte) {
  const t = texte.toLowerCase();
  for (const cat of CATEGORIES_MOTS) {
    if (cat.mots.some(m => t.includes(m))) return cat.slug;
  }
  return null;
}

function estAnnoncePotentielle(texte) {
  const t = texte.toLowerCase();
  return SIGNAUX_VENTE.some(s => t.includes(s));
}

function parsePrixFB(texte) {
  // Format classique : "150 000 FCFA"
  let m = texte.match(/(\d[\d\s.]*)\s*(?:fcfa|xof|f\b|fr\b)/i);
  if (m) {
    const v = parseInt(m[1].replace(/[\s.]/g, ''), 10);
    if (v >= 500 && v < 100_000_000) return v;
  }
  // Format raccourci : "35k", "35 k", "35.000k" → 35 000
  m = texte.match(/(\d+(?:[.,]\d+)?)\s*k\b/i);
  if (m) {
    const v = Math.round(parseFloat(m[1].replace(',', '.')) * 1000);
    if (v >= 500 && v < 100_000_000) return v;
  }
  return null;
}

function parseVilleFB(texte) {
  for (const v of VILLES) {
    if (texte.toLowerCase().includes(v.toLowerCase())) return v;
  }
  return 'Dakar';
}

// Numéro sénégalais : 9 chiffres commençant par 7 (mobile), avec ou sans +221/00221, espaces/points/tirets tolérés
function parseTelephoneFB(texte) {
  const m = texte.match(/(?:\+?221|00221)?[\s.-]*(7[05-8]\d(?:[\s.-]?\d{2}){3})/);
  if (!m) return null;
  const digits = ('7' + m[1].slice(1)).replace(/[\s.-]/g, '');
  return digits.length === 9 ? digits : null;
}

async function upsertAnnonceClassifiee(a) {
  await pool.query(`
    INSERT INTO annonces_classifiees
      (categorie_slug, titre, description, prix, ville, contact_tel,
       photos, actif, source, ref_externe)
    VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,true,$8,$9)
    ON CONFLICT (source, ref_externe) WHERE ref_externe IS NOT NULL
    DO UPDATE SET
      prix       = COALESCE(EXCLUDED.prix, annonces_classifiees.prix),
      updated_at = NOW()
  `, [
    a.categorie_slug, a.titre, a.description, a.prix, a.ville, a.contact_tel,
    JSON.stringify(a.photos || []), a.source, a.ref_externe,
  ]);
}

async function scraperImmo({ dryRun = false } = {}) {
  if (!playwright) {
    console.error('[FB-SCRAPER] playwright non installé. Lancez : npm install playwright && npx playwright install chromium');
    return { erreurs: ['playwright non installé'], inseres: 0 };
  }

  const hasSession = fs.existsSync(SESSION_FILE);
  const email    = process.env.FB_EMAIL;
  const password = process.env.FB_PASSWORD;
  if (!hasSession && (!email || !password)) {
    console.error('[FB-SCRAPER] FB_EMAIL et FB_PASSWORD requis (ou lancez node scripts/fb-login-setup.js)');
    return { erreurs: ['FB_EMAIL/FB_PASSWORD manquants'], inseres: 0 };
  }

  const stats = { scrapes: 0, inseres: 0, ignores: 0, erreurs: [], dryRun };
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const ctx  = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36',
      locale: 'fr-FR',
      ...(hasSession ? { storageState: SESSION_FILE } : {}),
    });
    const page = await ctx.newPage();

    if (hasSession) {
      // ── Session déjà connectée (cookies sauvegardés via fb-login-setup.js) ──
      console.log('[FB-SCRAPER] Session existante — connexion sans formulaire');
      await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 40000 });
    } else {
      // ── Connexion Facebook par formulaire (échouera si 2FA actif) ──────────
      console.log('[FB-SCRAPER] Connexion Facebook…');
      await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 40000 });

      try {
        await page.click('[data-testid="cookie-policy-manage-dialog-accept-button"], [aria-label*="cookie"], button:has-text("Autoriser"), button:has-text("Accept")', { timeout: 5000 });
      } catch {}

      const emailSel = '#email, input[name="email"], input[type="email"], [data-testid="royal_email"], [autocomplete="username"]';
      const passSel  = '#pass,  input[name="pass"],  input[type="password"], [data-testid="royal_pass"],  [autocomplete="current-password"]';
      const loginSel = '[name="login"], [data-testid="royal_login_button"], [aria-label="Se connecter"], [aria-label="Log in"], button[type="submit"], input[type="submit"]';

      await page.waitForSelector(emailSel, { timeout: 30000 });
      await page.fill(emailSel, email);
      await page.fill(passSel,  password);
      await page.click(loginSel);

      try {
        await page.waitForURL(url => !url.includes('/login'), { timeout: 25000 });
      } catch {}

      if (page.url().includes('/login') || page.url().includes('/checkpoint') || page.url().includes('two_step_verification')) {
        throw new Error('Connexion Facebook échouée (2FA requis) — lancez : node scripts/fb-login-setup.js');
      }
    }

    if (page.url().includes('/login') || page.url().includes('two_step_verification')) {
      throw new Error('Session Facebook expirée — relancez : node scripts/fb-login-setup.js');
    }
    console.log('[FB-SCRAPER] Connecté :', page.url().split('?')[0]);

    // ── Parcours des groupes ────────────────────────────────────
    for (const groupe of GROUPES) {
      const url = `https://www.facebook.com/groups/${groupe.id}`;
      console.log(`[FB-SCRAPER] Groupe : ${groupe.label} (${url})`);

      try {
        // 'networkidle' n'atteint jamais un état stable sur Facebook (polling/websockets
        // permanents) — timeout systématique constaté en test réel. 'domcontentloaded' +
        // attente fixe est le seul mode fiable ici.
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);

        // Scroller pour charger plus de posts (6 fois)
        for (let i = 0; i < 6; i++) {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(2500);
        }

        // Extraire les posts depuis le fil (`[role="feed"]`). Chaque enfant direct qui contient
        // un lien /user/ est un post top-level (les commentaires n'ont pas ce lien). Le texte
        // brut (`innerText`) contient deux types de bruit injectés par Facebook contre le
        // scraping : le mot "Facebook" répété (alt-text des vignettes photo) et des horodatages
        // obfusqués en tokens 1-2 caractères espacés — les deux sont filtrés ci-dessous.
        // Identifiant stable du post : Facebook n'expose plus d'ID /posts/N dans ce rendu ; on
        // récupère plutôt `set=pcb.<id>` depuis un lien photo (même id pour toutes les photos
        // d'un même post).
        const posts = await page.evaluate(() => {
          const feedRoot = document.querySelector('[role="feed"]');
          if (!feedRoot) return [];
          const items = [];
          for (const el of Array.from(feedRoot.children)) {
            const userLien = el.querySelector('a[href*="/user/"], a[href*="/profile.php"]');
            if (!userLien) continue; // pas un post top-level identifiable

            let texte = el.innerText || '';
            texte = texte.replace(/(?:Facebook\s*){2,}/g, ' ');
            texte = texte.split(/Commenter en tant que/)[0];
            texte = texte.replace(/(?:\b[a-zA-Z0-9]{1,2}\b[\s]+){6,}/g, ' ');
            texte = texte.replace(/\s+/g, ' ').trim();
            if (!texte) continue;

            const imgs = Array.from(el.querySelectorAll('img[src*="scontent"]'))
                              .map(img => img.src).slice(0, 5);

            const photoLien = el.querySelector('a[href*="set=pcb."]');
            const setM = photoLien?.href.match(/set=pcb\.(\d+)/);
            const href = setM ? photoLien.href : userLien.href;

            items.push({ texte, imgs, href, refExterneId: setM ? setM[1] : null });
          }
          // Dédoublonner par identifiant de post (plusieurs photos d'un même post partagent le même set=pcb.)
          const vus = new Set();
          return items.filter(p => {
            const cle = p.refExterneId || p.href;
            if (vus.has(cle)) return false;
            vus.add(cle);
            return true;
          });
        });

        for (const post of posts) {
          stats.scrapes++;
          if (estFilDeCommentaires(post.texte)) { stats.ignores++; continue; }
          if (!estAnnoncePotentielle(post.texte)) { stats.ignores++; continue; }
          const categorie_slug = detecterCategorie(post.texte);
          if (!categorie_slug) { stats.ignores++; continue; }

          // Le dernier segment "·" est en général le corps de l'annonce, mais peut parfois
          // être un fragment résiduel (date de republication type "12 juil") sur les posts
          // partagés depuis un autre groupe — on retombe alors sur l'avant-dernier segment utile.
          const DATE_FRAGMENT = /^\d{1,2}\s+(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)/i;
          const lignes = post.texte.split('·').map(l => l.trim()).filter(Boolean);
          let titreLigne = lignes[lignes.length - 1];
          if (titreLigne && (DATE_FRAGMENT.test(titreLigne) || titreLigne.length < 8)) {
            titreLigne = lignes.slice(0, -1).reverse().find(l => !DATE_FRAGMENT.test(l) && l.length >= 8);
          }
          const titre = titreLigne?.slice(0, 250) || 'Annonce';
          const prix   = parsePrixFB(post.texte);
          const ville  = parseVilleFB(post.texte);
          const tel    = parseTelephoneFB(post.texte);

          const ref_externe = post.refExterneId ? `fb-${groupe.id}-${post.refExterneId}` : null;

          const annonce = {
            categorie_slug,
            titre,
            description: post.texte.slice(0, 2000),
            prix,
            ville,
            contact_tel: tel || 'Voir sur Facebook',
            photos:      post.imgs,
            source:      `facebook-${groupe.id}`,
            ref_externe,
          };

          if (dryRun) {
            console.log('[FB-SCRAPER DRY]', categorie_slug, '|', titre, '|', prix, '|', ville);
          } else {
            try { await upsertAnnonceClassifiee(annonce); } catch (e) { stats.erreurs.push(e.message); }
          }
          stats.inseres++;
        }
      } catch (err) {
        console.warn(`[FB-SCRAPER] Erreur groupe ${groupe.label}: ${err.message}`);
        stats.erreurs.push(`${groupe.label}: ${err.message}`);
      }

      await page.waitForTimeout(3000);
    }
  } finally {
    await browser.close();
  }

  console.log(`[FB-SCRAPER] Terminé — scrapes: ${stats.scrapes}, retenus: ${stats.inseres}, ignorés: ${stats.ignores}, erreurs: ${stats.erreurs.length}`);
  return stats;
}

module.exports = { scraperImmo };
