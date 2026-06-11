// backend/services/scraper-immo-facebook.js
// Scrape les annonces immobilières dans les groupes Facebook publics
//
// ⚠️  PRÉREQUIS
//   - Variables d'env : FB_EMAIL, FB_PASSWORD (compte Facebook valide)
//   - Package playwright installé : npm install playwright
//   - Navigateur Chromium : npx playwright install chromium
//
// Groupes ciblés (modifiables dans GROUPES ci-dessous) :
//   - "Immobilier Sénégal" / "Location Appartement Dakar" / "Immo Dakar" etc.

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
];

const MOTS_IMMO = [
  'loue', 'location', 'à louer', 'appartement', 'villa', 'studio',
  'chambre', 'maison', 'bureau', 'f2', 'f3', 'f4', 'f5',
  'fcfa', 'xof', 'mensuel', 'caution', 'bail',
];

const VILLES = ['Dakar', 'Thiès', 'Mbour', 'Saint-Louis', 'Ziguinchor',
                'Kaolack', 'Touba', 'Diourbel', 'Louga'];

function parsePrixFB(texte) {
  const m = texte.match(/(\d[\d\s.]*)\s*(?:fcfa|xof|f\b|fr\b)/i);
  if (!m) return null;
  const v = parseInt(m[1].replace(/[\s.]/g, ''), 10);
  return (v > 10000 && v < 100_000_000) ? v : null;
}

function parseLocFB(texte) {
  for (const v of VILLES) {
    if (texte.toLowerCase().includes(v.toLowerCase())) {
      const lines = texte.split('\n');
      for (const l of lines) {
        if (l.toLowerCase().includes(v.toLowerCase())) {
          return { ville: v, quartier: l.trim().slice(0, 200) };
        }
      }
      return { ville: v, quartier: null };
    }
  }
  return { ville: 'Dakar', quartier: null };
}

function detectTypeBien(texte) {
  const t = texte.toLowerCase();
  if (t.includes('villa'))       return 'villa';
  if (t.includes('studio'))      return 'studio';
  if (t.includes('chambre'))     return 'chambre';
  if (t.includes('bureau'))      return 'bureau';
  if (t.includes('terrain'))     return 'terrain';
  if (t.includes('appartement')) return 'appartement';
  if (t.includes('maison'))      return 'maison';
  return 'appartement';
}

function estAnnonceImmo(texte) {
  const t = texte.toLowerCase();
  return MOTS_IMMO.filter(m => t.includes(m)).length >= 2;
}

async function upsertAnnonce(a) {
  await pool.query(`
    INSERT INTO annonces_immo
      (titre, type_bien, transaction, prix, ville, quartier,
       description, photos, url_source, source, ref_externe)
    VALUES ($1,$2,'location',$3,$4,$5,$6,$7::jsonb,$8,$9,$10)
    ON CONFLICT (source, ref_externe) WHERE ref_externe IS NOT NULL
    DO UPDATE SET
      prix       = COALESCE(EXCLUDED.prix, annonces_immo.prix),
      actif      = true,
      updated_at = NOW()
  `, [
    a.titre, a.type_bien, a.prix, a.ville, a.quartier,
    a.description, JSON.stringify(a.photos || []),
    a.url_source, a.source, a.ref_externe,
  ]);
}

async function scraperImmo({ dryRun = false } = {}) {
  if (!playwright) {
    console.error('[FB-IMMO] playwright non installé. Lancez : npm install playwright && npx playwright install chromium');
    return { erreurs: ['playwright non installé'], inseres: 0 };
  }

  const hasSession = fs.existsSync(SESSION_FILE);
  const email    = process.env.FB_EMAIL;
  const password = process.env.FB_PASSWORD;
  if (!hasSession && (!email || !password)) {
    console.error('[FB-IMMO] FB_EMAIL et FB_PASSWORD requis (ou lancez node scripts/fb-login-setup.js)');
    return { erreurs: ['FB_EMAIL/FB_PASSWORD manquants'], inseres: 0 };
  }

  const stats = { scrapes: 0, inseres: 0, erreurs: [], dryRun };
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
      console.log('[FB-IMMO] Session existante — connexion sans formulaire');
      await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 40000 });
    } else {
      // ── Connexion Facebook par formulaire (échouera si 2FA actif) ──────────
      console.log('[FB-IMMO] Connexion Facebook…');
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
    console.log('[FB-IMMO] Connecté :', page.url().split('?')[0]);

    // ── Parcours des groupes ────────────────────────────────────
    for (const groupe of GROUPES) {
      const url = `https://www.facebook.com/groups/${groupe.id}`;
      console.log(`[FB-IMMO] Groupe : ${groupe.label} (${url})`);

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        // Scroller pour charger plus de posts (3 fois)
        for (let i = 0; i < 3; i++) {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(2500);
        }

        // Extraire les posts
        const posts = await page.evaluate(() => {
          const items = [];
          // Sélecteurs Facebook (peuvent changer lors des mises à jour FB)
          document.querySelectorAll('[data-pagelet^="FeedUnit"], [role="article"]').forEach(el => {
            const texte = el.innerText || '';
            const imgs  = Array.from(el.querySelectorAll('img[src*="scontent"]'))
                              .map(img => img.src).slice(0, 5);
            const lien  = el.querySelector('a[href*="/groups/"][href*="/posts/"]');
            const href  = lien ? lien.href : null;
            items.push({ texte, imgs, href });
          });
          return items;
        });

        for (const post of posts) {
          stats.scrapes++;
          if (!estAnnonceImmo(post.texte)) continue;

          const lignes = post.texte.split('\n').filter(l => l.trim());
          const titre  = lignes[0]?.slice(0, 250) || 'Annonce immobilière';
          const prix   = parsePrixFB(post.texte);
          const loc    = parseLocFB(post.texte);
          const type   = detectTypeBien(post.texte);

          // Référence externe = ID du post extrait de l'URL
          const refM = post.href?.match(/\/posts\/(\d+)/);
          const ref_externe = refM ? `fb-${groupe.id}-${refM[1]}` : null;

          const annonce = {
            titre,
            type_bien:   type,
            prix,
            ville:       loc.ville,
            quartier:    loc.quartier,
            description: post.texte.slice(0, 2000),
            photos:      post.imgs,
            url_source:  post.href || url,
            source:      `facebook-${groupe.id}`,
            ref_externe,
          };

          if (dryRun) {
            console.log('[FB-IMMO DRY]', titre, prix, loc.ville);
          } else {
            try { await upsertAnnonce(annonce); } catch (e) { stats.erreurs.push(e.message); }
          }
          stats.inseres++;
        }
      } catch (err) {
        console.warn(`[FB-IMMO] Erreur groupe ${groupe.label}: ${err.message}`);
        stats.erreurs.push(`${groupe.label}: ${err.message}`);
      }

      await page.waitForTimeout(3000);
    }
  } finally {
    await browser.close();
  }

  console.log(`[FB-IMMO] Terminé — scrapes: ${stats.scrapes}, retenus: ${stats.inseres}, erreurs: ${stats.erreurs.length}`);
  return stats;
}

module.exports = { scraperImmo };
