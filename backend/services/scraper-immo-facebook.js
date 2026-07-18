// backend/services/scraper-immo-facebook.js
// Scrape des annonces (toutes catégories) dans des groupes Facebook publics
// et les insère dans annonces_classifiees (catégorie détectée par mots-clés).
//
// ⚠️  PRÉREQUIS
//   - Session Facebook authentifiée, via l'une de ces deux sources :
//       • fichier backend/.fb-session.json (dev local, généré via node scripts/fb-login-setup.js)
//       • variable d'env FB_SESSION_JSON contenant le même JSON (prod/Render — le fichier
//         local est gitignoré, il ne peut pas être déployé tel quel)
//     Sans l'une des deux, la connexion par email/mot de passe (FB_EMAIL, FB_PASSWORD)
//     est tentée en repli mais échoue presque toujours si le compte a la 2FA activée.
//   - Package playwright installé : npm install playwright
//   - Navigateur Chromium : npx playwright install chromium

let playwright;
try { playwright = require('playwright'); }
catch { playwright = null; }

const fs   = require('fs');
const path = require('path');
const { pool } = require('../models/db');
const scrapingLock = require('../lib/scrapingLock');

// Session sauvegardée via `node scripts/fb-login-setup.js` (gère le 2FA manuellement une fois)
const SESSION_FILE = path.join(__dirname, '../.fb-session.json');

// Position de la fenêtre glissante (cf. dernierIndexGroupe plus bas) — persistée sur disque
// car le scraper est relancé en local via `node backend/scripts/scraper-facebook-local.js`,
// un nouveau process à chaque fois, donc une variable en mémoire seule repartirait toujours
// de zéro et ne couvrirait jamais que les 5 premiers groupes.
const STATE_FILE = path.join(__dirname, '../.fb-scraper-state.json');

function lireIndexGroupe() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')).dernierIndexGroupe || 0; }
  catch { return 0; }
}

function ecrireIndexGroupe(index) {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify({ dernierIndexGroupe: index })); }
  catch (e) { console.error('[FB-SCRAPER] Impossible d\'écrire l\'état de rotation :', e.message); }
}

// Résout la session à utiliser : fichier local en priorité (dev), sinon la variable d'env
// (prod). Retourne un objet storageState Playwright, ou null si aucune source disponible.
function resoudreSession() {
  if (fs.existsSync(SESSION_FILE)) {
    try { return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')); }
    catch (e) { console.error('[FB-SCRAPER] .fb-session.json illisible :', e.message); }
  }
  if (process.env.FB_SESSION_JSON) {
    try { return JSON.parse(process.env.FB_SESSION_JSON); }
    catch (e) { console.error('[FB-SCRAPER] FB_SESSION_JSON illisible :', e.message); }
  }
  return null;
}

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

// Numéro sénégalais : 9 chiffres commençant par 7 (mobile), avec ou sans +221/00221, espaces/points/tirets
// tolérés N'IMPORTE OÙ entre les chiffres — pas seulement entre les groupes de fin. Le
// groupement le plus courant sur Facebook est "XX XXX XX XX" (77 617 37 13, 78 332 22 99),
// avec un espace dès après le 2ᵉ chiffre — un séparateur figé uniquement après le 3ᵉ chiffre
// (comme "770 12 34 56") ratait donc la majorité des numéros réels.
function parseTelephoneFB(texte) {
  const m = texte.match(/(?:\+?221|00221)?[\s.-]*(7[\s.-]?[05-8][\s.-]?\d(?:[\s.-]?\d){6})/);
  if (!m) return null;
  const digits = m[1].replace(/[\s.-]/g, '');
  return digits.length === 9 ? digits : null;
}

// Un même post est souvent republié tel quel dans plusieurs groupes Facebook — ref_externe
// (spécifique à un post dans un groupe donné) ne peut pas détecter ces doublons inter-groupes.
// Le numéro de téléphone extrait est en revanche stable d'une republication à l'autre :
// on ignore l'insertion si ce numéro a déjà une annonce Facebook des 7 derniers jours (fenêtre
// courte pour ne pas bloquer un vendeur qui republie légitimement un article différent plus tard).
async function upsertAnnonceClassifiee(a) {
  const { rows } = await pool.query(`
    SELECT 1 FROM annonces_classifiees
    WHERE contact_tel = $1 AND source LIKE 'facebook-%' AND created_at > NOW() - INTERVAL '7 days'
    LIMIT 1
  `, [a.contact_tel]);
  if (rows.length > 0) return { doublon: true };

  await pool.query(`
    INSERT INTO annonces_classifiees
      (categorie_slug, titre, description, prix, ville, contact_tel,
       photos, actif, source, ref_externe, url_source)
    VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,true,$8,$9,$10)
    ON CONFLICT (source, ref_externe) WHERE ref_externe IS NOT NULL
    DO UPDATE SET
      prix       = COALESCE(EXCLUDED.prix, annonces_classifiees.prix),
      updated_at = NOW()
  `, [
    a.categorie_slug, a.titre, a.description, a.prix, a.ville, a.contact_tel,
    JSON.stringify(a.photos || []), a.source, a.ref_externe, a.url_source,
  ]);
  return { doublon: false };
}

// maxGroupes limite le nombre de groupes visités par run (défaut 5) — un navigateur
// Chromium headless est lourd en RAM, et le plan Render free (512 Mo) a connu un OOM
// kill en cours d'exécution quand ce scraper tournait longtemps (16 groupes) en même
// temps que le cron de scraping produits. Relancer le bouton admin plusieurs fois
// couvre progressivement tous les groupes.
async function scraperImmo({ dryRun = false, maxGroupes = 5 } = {}) {
  if (!playwright) {
    console.error('[FB-SCRAPER] playwright non installé. Lancez : npm install playwright && npx playwright install chromium');
    return { erreurs: ['playwright non installé'], inseres: 0 };
  }

  const session  = resoudreSession();
  const email    = process.env.FB_EMAIL;
  const password = process.env.FB_PASSWORD;
  if (!session && (!email || !password)) {
    console.error('[FB-SCRAPER] Aucune session Facebook (fichier ou FB_SESSION_JSON) ni FB_EMAIL/FB_PASSWORD — lancez : node scripts/fb-login-setup.js');
    return { erreurs: ['Session Facebook manquante'], inseres: 0 };
  }

  // Évite un chevauchement avec le scraper produits (axios/cheerio) — les deux en même
  // temps ont provoqué un crash mémoire constaté en prod sur le plan free.
  if (!scrapingLock.tenterAcquerir('facebook')) {
    console.log(`[FB-SCRAPER] Verrou occupé par "${scrapingLock.actif()}", requête ignorée`);
    return { erreurs: ['Un autre scraping est déjà en cours'], inseres: 0 };
  }

  const stats = { scrapes: 0, inseres: 0, doublons: 0, ignores: 0, erreurs: [], dryRun };
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const ctx  = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36',
      locale: 'fr-FR',
      ...(session ? { storageState: session } : {}),
    });
    const page = await ctx.newPage();

    if (session) {
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

    // ── Parcours des groupes (fenêtre glissante, cf. maxGroupes ci-dessus) ──────
    const indexDepart = lireIndexGroupe();
    const groupesDuRun = GROUPES.slice(indexDepart, indexDepart + maxGroupes);
    const prochainIndex = groupesDuRun.length === 0 ? 0 : (indexDepart + groupesDuRun.length) % GROUPES.length;
    ecrireIndexGroupe(prochainIndex);
    console.log(`[FB-SCRAPER] ${groupesDuRun.length} groupe(s) ce run : ${groupesDuRun.map(g => g.label).join(', ')}`);

    for (const groupe of groupesDuRun) {
      const url = `https://www.facebook.com/groups/${groupe.id}`;
      console.log(`[FB-SCRAPER] Groupe : ${groupe.label} (${url})`);

      try {
        // 'networkidle' n'atteint jamais un état stable sur Facebook (polling/websockets
        // permanents) — timeout systématique constaté en test réel. 'domcontentloaded' +
        // attente fixe est le seul mode fiable ici.
        // Timeout 60s (au lieu de 30s) : sur le plan Render free (CPU/bande passante limités),
        // le chargement d'une page de groupe Facebook dépasse régulièrement 30s alors qu'il
        // prend ~17s en local — constaté en observant des timeouts systématiques en prod alors
        // que la même page charge sans souci en local.
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(3000);

        // Scroller pour charger plus de posts (15 fois — avec 6, seulement ~15-25 posts
        // étaient visibles par groupe sur des fils qui en contiennent des milliers, ce qui
        // limitait fortement le nombre d'annonces trouvées malgré un groupe actif)
        for (let i = 0; i < 15; i++) {
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
        // Détecte une session invalidée côté serveur Facebook : les cookies ne sont pas
        // expirés par date mais Facebook sert quand même la vue "déconnecté" sur cette même
        // URL de groupe (formulaire de connexion visible, pas de redirection vers /login) —
        // le contrôle plus haut sur page.url() ne capte donc pas ce cas. Sans cette détection,
        // [role="feed"] est simplement absent et le scraper termine silencieusement avec
        // scrapes:0/erreurs:0 sur tous les groupes, indiscernable d'un groupe réellement vide.
        const sessionInvalidee = await page.evaluate(() => {
          return !document.querySelector('[role="feed"]')
              && !!document.querySelector('input[name="pass"], [data-testid="royal_pass"]');
        });
        if (sessionInvalidee) {
          // Inutile de continuer sur les groupes suivants : la session est invalidée pour
          // toute la durée du run, chaque groupe échouerait de la même façon.
          stats.erreurs.push(`${groupe.label}: Session Facebook invalidée par le serveur (mur de connexion détecté) — relancez : node backend/scripts/fb-login-setup.js`);
          break;
        }

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
            // Coupe avant le fil de commentaires : Facebook affiche "Voir plus de
            // commentaires", puis chaque commentaire suivi de son propre "J'aime Répondre
            // Partager" — sans cette coupe, les noms des commentateurs et leur texte se
            // mélangent au corps réel du post (ex: "Machine à vendre ... Voir plus de
            // commentaires Muslim Balde Prix J'aime Répondre Partager ...").
            texte = texte.split(/Voir plus de commentaires|Voir \d+ commentaires?/)[0];
            // Suffixes d'interface Facebook (placeholder du champ de commentaire, jamais du
            // vrai contenu du post) — toujours en toute fin de texte, simple retrait.
            texte = texte.split(/Envoyez votre premier commentaire|Écrivez un commentaire public/)[0];
            // "En voir plus" / "Voir plus" : boutons de troncature Facebook — le texte réel
            // au-delà n'existe pas dans le DOM tant qu'on ne clique pas dessus, on ne peut que
            // retirer le bouton lui-même du texte visible (le contenu reste tronqué, ce n'est
            // pas récupérable ici). Peut apparaître ailleurs qu'en toute fin (ex: suivi du
            // minuteur vidéo d'un reel), donc retiré n'importe où dans le texte, pas juste en fin.
            texte = texte.replace(/…?\s*(?:En\s+)?[Vv]oir\s+plus\b/g, ' ');
            // Minuteur de lecteur vidéo Facebook ("0:00 / 1:44") — apparaît sur les posts de
            // type reel/vidéo, aucune valeur pour une annonce.
            texte = texte.replace(/\d{1,2}:\d{2}\s*\/\s*\d{1,2}:\d{2}/g, ' ');
            // Hashtags de reels ("#diallovaisselldakar #viralfacebookreels...") — bruit de
            // promotion vidéo, jamais une info produit utile.
            texte = texte.replace(/#\S+/g, ' ');
            // "Envoyer un message" : bouton de contact Facebook Marketplace, toujours en toute
            // fin de post, parfois suivi d'un compteur de réactions/vues isolé — tout ce qui
            // suit ce bouton n'est jamais du contenu de l'annonce.
            texte = texte.split(/Envoyer un message/)[0];
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
          const prix   = parsePrixFB(post.texte);
          const ville  = parseVilleFB(post.texte);
          const tel    = parseTelephoneFB(post.texte);
          // Sans numéro extrait, l'annonce n'est pas exploitable pour un acheteur (le repli
          // "Voir sur Facebook" laissait passer trop de faux positifs — bruit d'obfuscation
          // Facebook non filtré, posts tronqués sans coordonnées réelles) : on l'ignore plutôt
          // que de l'insérer avec un contact non fonctionnel.
          if (!tel) { stats.ignores++; continue; }

          const titre = titreLigne?.slice(0, 250) || 'Annonce';

          const ref_externe = post.refExterneId ? `fb-${groupe.id}-${post.refExterneId}` : null;

          const annonce = {
            categorie_slug,
            titre,
            description: post.texte.slice(0, 2000),
            prix,
            ville,
            contact_tel: tel,
            photos:      post.imgs,
            source:      `facebook-${groupe.id}`,
            ref_externe,
            url_source:  post.href || url,
          };

          if (dryRun) {
            console.log('[FB-SCRAPER DRY]', categorie_slug, '|', titre, '|', prix, '|', ville);
            stats.inseres++;
          } else {
            try {
              const { doublon } = await upsertAnnonceClassifiee(annonce);
              if (doublon) { stats.doublons++; } else { stats.inseres++; }
            } catch (e) { stats.erreurs.push(e.message); }
          }
        }
      } catch (err) {
        console.warn(`[FB-SCRAPER] Erreur groupe ${groupe.label}: ${err.message}`);
        stats.erreurs.push(`${groupe.label}: ${err.message}`);
      }

      await page.waitForTimeout(3000);
    }
  } finally {
    await browser.close();
    scrapingLock.relacher();
  }

  console.log(`[FB-SCRAPER] Terminé — scrapes: ${stats.scrapes}, retenus: ${stats.inseres}, doublons: ${stats.doublons}, ignorés: ${stats.ignores}, erreurs: ${stats.erreurs.length}`);
  return stats;
}

module.exports = { scraperImmo };
