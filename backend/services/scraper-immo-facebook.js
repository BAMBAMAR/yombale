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

let Tesseract;
try { Tesseract = require('tesseract.js'); }
catch { Tesseract = null; }

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
const STATE_FILE    = path.join(__dirname, '../.fb-scraper-state.json');
const PROGRESS_FILE = path.join(__dirname, '../.fb-scraper-progress.json');

function lireIndexGroupe() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')).dernierIndexGroupe || 0; }
  catch { return 0; }
}

function ecrireIndexGroupe(index) {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify({ dernierIndexGroupe: index })); }
  catch (e) { console.error('[FB-SCRAPER] Impossible d\'écrire l\'état de rotation :', e.message); }
}

function sauverProgression(donnees) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
      ...donnees,
      updatedAt: new Date().toISOString(),
    }, null, 2));
  } catch (e) {
    console.error('[FB-SCRAPER] Impossible d\'écrire la progression :', e.message);
  }
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
  // Pages publiques / profils (type:'page' → URL /pageid, pas /groups/)
  { id: 'ndeyeyacineseckfaye', label: 'Ndeye Yacine Seck Faye (Offres Emploi)', type: 'page', force_categorie: 'emploi' },
  { id: 'badou.diop.587',       label: 'Badou Diop (Offres Emploi)',           type: 'page', force_categorie: 'emploi' },
  // Groupes emploi/recrutement au Sénégal
  { id: '1989058224662026',  label: 'Emploi 1', force_categorie: 'emploi' },
  { id: '234254775016841',   label: 'Emploi 2', force_categorie: 'emploi' },
  { id: '519668123858499',   label: 'Emploi 3', force_categorie: 'emploi' },
  { id: '462589772247046',   label: 'Emploi 4', force_categorie: 'emploi' },
  { id: '1763952164139832',  label: 'Emploi 5', force_categorie: 'emploi' },
  { id: '1462110264598253',  label: 'Emploi 6', force_categorie: 'emploi' },
  { id: '2767116616757898',  label: 'Emploi 7', force_categorie: 'emploi' },
  { id: '1293527887919003',  label: 'Emploi 8', force_categorie: 'emploi' },

  // Autres groupes (Immo, divers)
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
  { slug: 'auto-moto',   mots: ['voiture', 'moto', 'scooter', 'jakarta', 'vehicule', 'véhicule',
                                 'pneu', 'moteur voiture', 'ford', 'toyota', 'hyundai', 'kia', 'peugeot', 'chevrolet', 'fiat',
                                 'renault', 'nissan', 'mercedes', 'bmw', 'suv', '4x4', 'dedouane', 'dédouané', 'venant',
                                 'diesel', 'essence', 'manuelle', 'automatique', 'carburant'] },
  { slug: 'immo',        mots: ['loue', 'location', 'à louer', 'a louer', 'appartement', 'villa', 'studio',
                                 'chambre à louer', 'chambre a louer', 'chambre', 'maison à louer', 'maison', 'bureau',
                                 'terrain', 'duplex', 'immeuble', 'titre foncier', 'bail', 'caution', 'parcelle',
                                 'bâtiment', 'batiment', 'meublé', 'meuble', 'magasin', 'entrepôt', 'entrepot',
                                 'f2', 'f3', 'f4', 'f5', 'salle de bain', 'fond de commerce', 'residence', 'résidence',
                                 'colocation', 'terrain a vendre'] },
  { slug: 'emploi',      mots: ['recrutement', 'recrute', "offre d'emploi", "offres d'emploi", 'offre d emploi',
                                 'stage', 'stagiaire', 'cherche emploi', 'cherche un emploi', 'postuler', 'poste de',
                                 'avis de recrutement', 'souhaite recruter', 'cv', 'embauche', 'job', 'cherche travail',
                                 'cherche boulot', 'urgent recrutement', 'appel a candidature', 'appel à candidature', 
                                 'profil recherche', 'profil recherché', 'technicien', 'chauffeur', 'nounou', 'menagere', 
                                 'ménagère', 'gardien', 'serveuse', 'gérante', 'gerante', 'caissiere'] },
  { slug: 'smartphones', mots: ['iphone', 'samsung', 'xiaomi', 'redmi', 'tecno', 'infinix', 'huawei',
                                 'smartphone', 'portable', 'android', 'galaxy',
                                 'pro max', 'pixel', 'ipad', 'tablette', 'gb', 'go ram', 'oppo', 'realme'] },
  { slug: 'informatique', mots: ['ordinateur', 'laptop', 'pc portable', 'macbook', 'imprimante',
                                  'clavier', 'souris', 'disque dur', 'ram', 'processeur', 'ecran pc', 'écran pc'] },
  { slug: 'tv-electro',  mots: ['televiseur', 'téléviseur', 'tv ', 'tv', 'ecran', 'écran', 'climatiseur',
                                 'refrigerateur', 'réfrigérateur', 'frigo', 'congelateur', 'congélateur',
                                 'machine a laver', 'machine à laver', 'ventilateur', 'micro-onde', 'micro onde',
                                 'cuisiniere', 'cuisinière', 'split', 'gaz'] },
  { slug: 'mode',        mots: ['robe', 'chaussure', 'chaussures', 'shoes', 'sac a main', 'sac à main', 'vetement', 'vêtement',
                                 'boubou', 'basket', 'montre', 'bijoux', 'dressing', 'tissu', 'bazin', 'gagnila', 'habit',
                                 'wax', 'coton', 'getzner', 'tailleur'] },
  { slug: 'beaute',      mots: ['parfum', 'maquillage', 'creme', 'crème', 'cosmetique', 'cosmétique',
                                 'perruque', 'meche', 'mèche', 'savon', 'pommade'] },
  { slug: 'jeux',        mots: ['playstation', 'ps4', 'ps5', 'xbox', 'manette', 'console de jeux', 'nintendo'] },
  { slug: 'maison',      mots: ['meuble', 'canape', 'canapé', 'matelas', 'table a manger',
                                 'table à manger', 'lit', 'armoire', 'tapis', 'rideaux', 'fauteuil', 'salon'] },
];

// Doit matcher au moins 1 mot-clé d'une catégorie ET avoir un signal de vente (prix, contact...)
const SIGNAUX_VENTE = ['fcfa', 'xof', 'prix', 'a vendre', 'à vendre', 'vends', 'vend', 'disponible',
                        'dispo', 'livraison', 'contact', 'whatsapp', 'inbox', 'messagez', 'tel', 'tél',
                        'service', 'cmd', 'commande', 'arrivage', 'promo', 'offres', 'offre',
                        'recrutement', 'recrute', 'candidature', 'postuler', 'cv', 'embauche', 'cherche', 'besoin'];

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

function purgerUnicodeStealthFB(txt) {
  if (!txt) return '';
  return txt
    .replace(/[\u0300-\u036F\u0370-\u03FF\u00AD\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function purgerUiFacebook(txt) {
  if (!txt) return '';
  let s = txt;
  s = s.replace(/(?:Facebook\s*){2,}/gi, ' ');
  s = s.replace(/Envoyer un message\s*(?:\d+)?/gi, '');
  s = s.replace(/Voir la traduction\s*(?:\d+)?/gi, '');
  s = s.replace(/…?\s*(?:En\s+)?[Vv]oir\s+plus\b/gi, '');
  s = s.replace(/Voir plus de commentaires|Voir \d+ commentaires?/gi, '');
  s = s.replace(/Envoyez votre premier commentaire|Écrivez un commentaire public/gi, '');
  s = s.replace(/Indicateur de statut\s*En ligne(?:\s*En ligne)?/gi, '');
  s = s.replace(/J'aime\s*Répondre\s*Partager/gi, '');
  s = s.replace(/Commenter en tant que\s*.*$/gi, '');
  s = s.replace(/\b\d{1,2}:\d{2}\s*\/\s*\d{1,2}:\d{2}\b/g, '');
  s = s.replace(/(?:Les commentaires ont été désactivés pour cette publication\.?)/gi, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function decoderChainePlus(txt) {
  if (!txt) return '';
  if (txt.includes('+') && !txt.match(/\+\d{2,3}/)) {
    const parts = txt.split('+').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      return parts.join(' ');
    }
  }
  return txt;
}

function extraireTitreIntelligentFB(texte) {
  if (!texte) return 'Annonce';
  let t = purgerUnicodeStealthFB(texte);
  t = purgerUiFacebook(t);
  t = decoderChainePlus(t);

  const phrases = t.split(/(?:[\n·|•]|\.\s+)/)
    .map(p => p.trim())
    .filter(p => {
      if (p.length < 6) return false;
      if (p.match(/^(bonjour|salut|hello|coucou|disponible|inbox|contact|tél|tel|prix|http|whatsapp)/i)) return false;
      if (p.match(/^[0-9\s\+\.\-\/]{1,15}$/)) return false;
      if (p.match(/cliquez sur le lien|rejoindre ma chaîne/i)) return false;
      return true;
    });

  if (phrases.length > 0) {
    let candidat = phrases[0].replace(/\s*\+\d{1,3}\s*$/, '').trim();
    if (candidat.length >= 6) {
      return candidat.slice(0, 250);
    }
  }

  return (t.slice(0, 100).replace(/\s*\+\d{1,3}\s*$/, '').trim()) || 'Annonce';
}

function parsePrixFB(texte) {
  if (!texte) return null;
  const t = purgerUnicodeStealthFB(texte);
  // Format classique : "150 000 FCFA"
  let m = t.match(/(?:prix\s*[:=-]?\s*)?(\d[\d\s.]{3,12})\s*(?:fcfa|xof|f\b|fr\b)/i);
  if (m) {
    const v = parseInt(m[1].replace(/[\s.]/g, ''), 10);
    if (v >= 500 && v < 500_000_000) return v;
  }
  // Format raccourci : "35k", "35 k", "35.000k" → 35 000
  m = t.match(/(\d+(?:[.,]\d+)?)\s*k\b/i);
  if (m) {
    const v = Math.round(parseFloat(m[1].replace(',', '.')) * 1000);
    if (v >= 500 && v < 500_000_000) return v;
  }
  // Format "Prix 25.000", "Prix: 25000", "A 15000"
  m = t.match(/(?:prix|à|a)\s*[:=-]?\s*(\d{4,9})\b/i);
  if (m) {
    const v = parseInt(m[1], 10);
    if (v >= 1000 && v < 500_000_000) return v;
  }
  return null;
}

function parseVilleFB(texte) {
  for (const v of VILLES) {
    if (texte.toLowerCase().includes(v.toLowerCase())) return v;
  }
  return 'Dakar';
}

// Numéro sénégalais : 9 chiffres commençant par 7 (mobile : 70, 71, 72, 75, 76, 77, 78, 79),
// avec ou sans +221/00221, tolérant espaces, points, tirets, slashs ou underscores entre les chiffres.
function parseTelephoneFB(texte) {
  if (!texte) return null;
  const regex = /(?:\+?221|00221)?[\s._/-]*(7[\s._/-]?[01256789](?:[\s._/-]?\d){7})/g;
  let match;
  while ((match = regex.exec(texte)) !== null) {
    const digits = match[1].replace(/[\s._/-]/g, '');
    if (digits.length === 9) {
      return digits;
    }
  }
  return null;
}

// Beaucoup d'annonces Facebook (bannières colorées type "Babacar Immobilier", "El Hadji Seck")
// incrustent le numéro DANS l'image plutôt que dans le texte du post — invisible pour
// parseTelephoneFB. Repli OCR (tesseract.js), utilisé uniquement quand le texte n'a livré
// aucun numéro (coûteux : ~1-3s par image), sur les 5 premières photos du post au plus,
// arrêt dès qu'un numéro valide est trouvé. Un seul worker Tesseract est créé et réutilisé
// pour tout le run plutôt qu'un par image (l'initialisation du worker est le coût dominant).
let ocrWorker = null;
async function obtenirOcrWorker() {
  if (!Tesseract) return null;
  if (!ocrWorker) ocrWorker = await Tesseract.createWorker('fra');
  return ocrWorker;
}

// Retourne le texte OCR de la première image du post (les bannières colorées portent tout
// leur contenu — titre, prix, tel — sur une seule image ; les photos suivantes d'un même
// post sont généralement des vues complémentaires, pas du texte additionnel utile).
async function ocrPremiereImage(imgs) {
  const worker = await obtenirOcrWorker();
  if (!worker || imgs.length === 0) return '';
  try {
    const { data: { text } } = await worker.recognize(imgs[0]);
    return text || '';
  } catch (e) {
    console.warn('[FB-SCRAPER] OCR échoué sur une image :', e.message);
    return '';
  }
}

// Un post dont le texte DOM ne contient presque aucun mot utile (après nettoyage du bruit
// Facebook) est probablement une bannière colorée où titre/prix/tel sont incrustés dans
// l'image — le texte seul ne permettrait jamais de passer les filtres catégorie/signal-vente.
function texteEstPauvre(texte) {
  return texte.split(/\s+/).filter(Boolean).length < 6;
}

// Un même post est souvent republié tel quel dans plusieurs groupes Facebook — ref_externe
// (spécifique à un post dans un groupe donné) ne peut pas détecter ces doublons inter-groupes.
// Le numéro de téléphone extrait est en revanche stable d'une republication à l'autre :
// Fenêtre réduite à 24h (au lieu de 7 jours) pour permettre à un même vendeur d'être capturé
// dans plusieurs groupes différents — un vendeur sérieux republie souvent dans 3-5 groupes
// le même jour, la fenêtre 7j bloquait toutes ces republications comme doublons.
async function upsertAnnonceClassifiee(a) {
  // On ne dédoublonne pas par téléphone si c'est la valeur de repli pour les offres d'emploi
  if (a.contact_tel !== 'Voir sur Facebook') {
    const { rows } = await pool.query(`
      SELECT 1 FROM annonces_classifiees
      WHERE contact_tel = $1 AND source = $2 AND created_at > NOW() - INTERVAL '24 hours'
      LIMIT 1
    `, [a.contact_tel, a.source]);
    if (rows.length > 0) return { doublon: true };
  }

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
async function scraperImmo({ dryRun = false, maxGroupes = 10 } = {}) {
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
  let indexCompteur = 0;
  let groupesDuRun  = [];
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
    groupesDuRun = GROUPES.slice(indexDepart, indexDepart + maxGroupes);
    const prochainIndex = groupesDuRun.length === 0 ? 0 : (indexDepart + groupesDuRun.length) % GROUPES.length;
    ecrireIndexGroupe(prochainIndex);
    console.log(`[FB-SCRAPER] ${groupesDuRun.length} groupe(s) ce run : ${groupesDuRun.map(g => g.label).join(', ')}`);

    sauverProgression({
      status: 'in_progress',
      mode: dryRun ? 'dry-run' : 'live',
      groupeIndex: 0,
      totalGroupes: groupesDuRun.length,
      pourcentage: 0,
      groupeActuel: 'Démarrage...',
      scrapes: 0,
      inseres: 0,
      doublons: 0,
      ignores: 0,
      erreurs: [],
    });

    for (const groupe of groupesDuRun) {
      indexCompteur++;
      const pct = Math.round((indexCompteur / groupesDuRun.length) * 100);
      const url = groupe.type === 'page' ? `https://www.facebook.com/${groupe.id}` : `https://www.facebook.com/groups/${groupe.id}`;
      console.log(`\n📊 [PROGRES ${indexCompteur}/${groupesDuRun.length} - ${pct}%] ${groupe.type === 'page' ? 'Page' : 'Groupe'} : ${groupe.label} (${url})`);

      sauverProgression({
        status: 'in_progress',
        mode: dryRun ? 'dry-run' : 'live',
        groupeIndex: indexCompteur,
        totalGroupes: groupesDuRun.length,
        pourcentage: pct,
        groupeActuel: groupe.label,
        groupeUrl: url,
        scrapes: stats.scrapes,
        inseres: stats.inseres,
        doublons: stats.doublons,
        ignores: stats.ignores,
        erreurs: stats.erreurs,
      });

      try {
        // 'networkidle' n'atteint jamais un état stable sur Facebook (polling/websockets
        // permanents) — timeout systématique constaté en test réel. 'domcontentloaded' +
        // attente fixe est le seul mode fiable ici.
        // Timeout 60s (au lieu de 30s) : sur le plan Render free (CPU/bande passante limités),
        // le chargement d'une page de groupe Facebook dépasse régulièrement 30s alors qu'il
        // prend ~17s en local — constaté en observant des timeouts systématiques en prod alors
        // que la même page charge sans souci en local.
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
        } catch (err) {
          console.warn(`[FB-SCRAPER] page.goto timeout sur ${url}, tentative de continuer si le DOM est partiellement chargé...`);
        }
        await page.waitForTimeout(4000);

        // Scroller pour charger plus de posts.
        // Pages publiques : attente plus longue entre scrolls (React charge différemment des groupes)
        const scrollPause = groupe.type === 'page' ? 3000 : 2500;
        for (let i = 0; i < 15; i++) {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(scrollPause);
        }

        // Déplier tous les posts tronqués ("Voir plus") directement en JS in-page
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('div[role="button"], span[role="button"], div[action="go"]'))
            .filter(el => /(?:voir plus|en voir plus|see more)/i.test(el.innerText || ''));
          for (const b of btns) {
            try { b.click(); } catch {}
          }
        });
        await page.waitForTimeout(1000);

        // Détection blocage / session invalide
        const urlBlocage = page.url().includes('/sorry.php') || page.url().includes('/checkpoint');
        const { murConnexion, feedAbsent } = await page.evaluate((isPage) => ({
          murConnexion: !!document.querySelector('input[name="pass"], [data-testid="royal_pass"]'),
          // Les pages publiques peuvent ne pas avoir [role="feed"] mais afficher les posts
          // dans un conteneur différent — on ne bloque que si AUCUN contenu article n'est présent.
          feedAbsent: isPage
            ? !document.querySelector('[role="feed"], [role="main"] article, [role="main"] [data-pagelet], [data-pagelet*="ProfileTimeline"], [role="main"]')
            : !document.querySelector('[role="feed"]'),
        }), groupe.type === 'page');
        if (urlBlocage || murConnexion) {
          // Blocage de session confirmé (sorry.php, checkpoint, mur login) :
          // inutile de continuer, chaque groupe suivant échouerait aussi.
          const raison = urlBlocage
            ? `page de blocage Facebook détectée (${page.url().split('?')[0]})`
            : 'mur de connexion détecté';
          stats.erreurs.push(`${groupe.label}: Session Facebook invalidée (${raison}) — relancez : node backend/scripts/fb-login-setup.js`);
          break;
        }
        if (feedAbsent) {
          // Groupe privé, inexistant, ou layout différent — on passe au suivant sans
          // arrêter le run (ça peut être juste un groupe privé parmi d'autres valides).
          console.warn(`[FB-SCRAPER] ${groupe.label}: aucun fil détecté, groupe ignoré`);
          stats.erreurs.push(`${groupe.label}: aucun contenu chargé (groupe privé ou ID invalide)`);
          continue;
        }

        const posts = await page.evaluate((isPage) => {
          // Pour les pages publiques, les posts peuvent être dans des articles hors [role="feed"]
          let feedRoot = document.querySelector('[role="feed"]');
          let feedChildren;
          if (feedRoot) {
            feedChildren = Array.from(feedRoot.children);
          } else if (isPage) {
            // Fallback pages publiques : chercher les articles dans [role="main"] ou le body pour les profils
            const main = document.querySelector('[role="main"], [data-pagelet*="ProfileTimeline"]') || document.body;
            feedChildren = Array.from(main.querySelectorAll('article, [data-pagelet] > div > div, div[role="article"]'));
          } else {
            return [];
          }
          const items = [];
          for (const el of feedChildren) {
            const userLien = el.querySelector('a[href*="/user/"], a[href*="/profile.php"], a[href*="/people/"], a[href*="/groups/"], a[role="link"]');
            const photoLien = el.querySelector('a[href*="set=pcb."], a[href*="/posts/"], a[href*="/permalink/"]');
            if (!userLien && !photoLien) continue; // pas un post top-level identifiable

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

            const setM = photoLien?.href.match(/set=pcb\.(\d+)/);
            const href = setM ? photoLien.href : (userLien?.href || photoLien?.href || '');

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
        }, groupe.type === 'page');

        for (const post of posts) {
          stats.scrapes++;
          if (estFilDeCommentaires(post.texte)) { stats.ignores++; continue; }

          // Bannière colorée : titre/prix/tel incrustés dans l'image, texte DOM quasi vide
          // (juste le bruit "Facebook" répété résiduel) — sans l'OCR ici, ces posts échoueraient
          // systématiquement estAnnoncePotentielle/detecterCategorie faute de mots à y trouver.
          // Fusionné avec le texte DOM (jamais remplacé) : garde les infos déjà présentes en
          // texte (ex: légende ajoutée en commentaire du post) en plus de celles de l'image.
          let texte = post.texte;
          if (texteEstPauvre(texte) && post.imgs.length > 0) {
            const texteOcr = await ocrPremiereImage(post.imgs);
            if (texteOcr) texte = `${texte} ${texteOcr}`.trim();
          }

          let categorie_slug = detecterCategorie(texte);
          if (!categorie_slug) {
            categorie_slug = groupe.force_categorie || 'divers';
          }

          const tel = parseTelephoneFB(texte);
          
          // Dérogation pour l'emploi : s'il n'y a pas de téléphone, on met "Voir sur Facebook"
          const estEmploi = categorie_slug === 'emploi';
          const telFinal = tel || (estEmploi ? 'Voir sur Facebook' : null);

          // Un numéro de téléphone réel + une catégorie détectée sont déjà le signal le plus
          // fort qu'il s'agit d'une vraie annonce — le style local ("45 mille x 3", "prend un
          // homme") omet souvent tout mot de SIGNAUX_VENTE (pas de "prix"/"vends"/"disponible"
          // explicite), donc ce filtre ne s'applique qu'en repli si aucun numéro n'est trouvé.
          if (!telFinal && !estAnnoncePotentielle(texte)) { stats.ignores++; continue; }
          // Sans numéro extrait (et hors dérogation Emploi), l'annonce n'est pas exploitable
          if (!telFinal) { stats.ignores++; continue; }

          const descriptionPropre = purgerUiFacebook(purgerUnicodeStealthFB(texte)).slice(0, 2000);
          const titre = extraireTitreIntelligentFB(texte);
          const prix  = parsePrixFB(texte);
          const ville = parseVilleFB(texte);

          const ref_externe = post.refExterneId ? `fb-${groupe.id}-${post.refExterneId}` : null;

          const annonce = {
            categorie_slug,
            titre: titre || 'Annonce',
            description: descriptionPropre,
            prix,
            ville,
            contact_tel: telFinal,
            photos:      post.imgs,
            source:      groupe.type === 'page' ? `facebook-${groupe.id}` : `facebook-group-${groupe.id}`,
            ref_externe: ref_externe,
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
    if (ocrWorker) { await ocrWorker.terminate(); ocrWorker = null; }
    scrapingLock.relacher();
  }

  sauverProgression({
    status: 'completed',
    mode: dryRun ? 'dry-run' : 'live',
    groupeIndex: indexCompteur,
    totalGroupes: groupesDuRun.length,
    pourcentage: 100,
    groupeActuel: 'Terminé',
    scrapes: stats.scrapes,
    inseres: stats.inseres,
    doublons: stats.doublons,
    ignores: stats.ignores,
    erreurs: stats.erreurs,
  });

  console.log(`\n✅ [PROGRES 100%] Terminé — scrapes: ${stats.scrapes}, retenus: ${stats.inseres}, doublons: ${stats.doublons}, ignorés: ${stats.ignores}, erreurs: ${stats.erreurs.length}`);
  return stats;
}

module.exports = { scraperImmo };
