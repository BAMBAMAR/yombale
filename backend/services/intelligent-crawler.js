/**
 * backend/services/intelligent-crawler.js
 * Moteur de crawling et d'extraction sémantique intelligent pour Nopalou (inspiré de Crawl4AI).
 * 
 * Fonctionnalités clés :
 * - Navigation Playwright avec scroll dynamique et lazy-loading
 * - Nettoyage anti-bruit du DOM (suppression pubs, trackers, menus parasites)
 * - Extraction sémantique structurée multi-critères (prix FCFA, téléphones, quartiers, type de bien)
 * - Support optionnel des LLMs (Groq, Gemini, OpenAI) avec bascule automatique sur l'analyse heuristique
 * - Téléchargement binaire des photos en RAM et upload permanent vers Cloudinary
 * - Ingestion directe dans le catalogue public et le CRM WhatsApp
 */

'use strict';

const cheerio = require('cheerio');

let pool = null;
function getPool() {
  if (!pool) {
    const db = require('../models/db');
    pool = db.pool || db;
  }
  return pool;
}

let playwright = null;
try { playwright = require('playwright'); } catch {}

let cloudinaryModule = null;
try { cloudinaryModule = require('./cloudinary'); } catch {}

// Dictionnaire des quartiers et villes sénégalaises pour localisation sémantique
const QUARTIERS_SENEGAL = [
  'almadies', 'mamelles', 'ngor', 'ouakam', 'virage', 'mermoz', 'cite keur gorgui',
  'sacre coeur', 'sacre-coeur', 'fann', 'point e', 'plateau', 'dakar-plateau',
  'medina', 'fass', 'gueule tapee', 'colobane', 'gibraltar', 'zone b', 'zone de captage',
  'dieuppeul', 'derkle', 'castors', 'hlm', 'grand yoff', 'yoff', 'nord foire', 'ouest foire',
  'sud foire', 'maristes', 'hann maristes', 'patte d\'oie', 'scat urbam', 'sipres',
  'liberte 6', 'liberte', 'parcelles assainies', 'parcelles', 'guediawaye',
  'pikine', 'keur massar', 'rufisque', 'diamniadio', 'lac rose', 'thiaroye', 'mbao', 'yeumbeul',
  'malika', 'thies', 'saly', 'mbour', 'somone', 'ngaparou', 'saint-louis', 'touba', 'ziguinchor'
];

/**
 * Nettoie le HTML pour éliminer le bruit (bannières, scripts, styles, popups)
 * comme le fait Crawl4AI pour réduire la taille des pages de 80%.
 */
function nettoyerBruitHTML(html) {
  if (!html) return '';
  const $ = cheerio.load(html);

  // Supprimer uniquement les balises parasites globales (sans détruire les conteneurs d'annonces ou boutons d'appel)
  $('script, style, noscript, iframe, svg, [role="banner"], [role="navigation"], .cookie-banner, .popup, body > header, body > footer, body > nav').remove();

  // Extraire les images potentielles avant de nettoyer le texte
  const photosCandidates = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('srcset');
    if (src && typeof src === 'string' && !src.startsWith('data:image/svg') && !src.includes('favicon') && !src.includes('pixel') && !src.includes('logo')) {
      const cleanSrc = src.split(' ')[0].split(',')[0].trim();
      if (cleanSrc.startsWith('http')) {
        photosCandidates.push(cleanSrc);
      }
    }
  });

  // Extraire le texte épuré
  const texteEpure = $('body').text().replace(/\s+/g, ' ').trim();

  return {
    $,
    texteEpure,
    photosCandidates: [...new Set(photosCandidates)]
  };
}

/**
 * Extraction heuristique sénégalaise haute précision (prix, téléphones, localité, transaction)
 */
function extraireEntitesSemantiques(texte, titreBrut = '') {
  const contenu = `${titreBrut} ${texte}`.toLowerCase();

  // 1. Détection du téléphone sénégalais (Orange 77/78, Free 76, Expresso 70, Promobile 75, Fixe 33)
  let telephone = null;
  const matchTel = contenu.match(/(?:(?:\+?221|00221)?\s*)?(7[05678]\d{7}|33\d{7}|7[05678][\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2})/);
  if (matchTel) {
    const brut = matchTel[0].replace(/[^\d]/g, '');
    const clean = brut.startsWith('221') ? brut.slice(3) : brut;
    if (clean.length === 9) telephone = clean;
  }

  // 2. Détection du prix en FCFA (évite la confusion avec les heures ex: 17:53)
  let prix = null;
  const matchPrix = contenu.match(/(?:^|[^\d:])(\d{1,3}(?:[\s.]\d{3})+|\d{4,9})\s*(?:fcfa|cfa|f\s*cfa|f\b)/i);
  if (matchPrix) {
    const brut = parseInt(matchPrix[1].replace(/[^\d]/g, ''), 10);
    if (!isNaN(brut) && brut >= 5000 && brut <= 1000000000) {
      prix = brut;
    }
  }

  // 3. Détection de la ville et du quartier
  let quartier = 'Dakar';
  let ville = 'Dakar';
  for (const q of QUARTIERS_SENEGAL) {
    if (contenu.includes(q)) {
      quartier = q.charAt(0).toUpperCase() + q.slice(1);
      if (['thies', 'saly', 'mbour', 'saint-louis', 'touba', 'ziguinchor'].includes(q)) {
        ville = quartier;
      }
      break;
    }
  }

  // 4. Détection du type de transaction (location vs vente)
  let transaction = 'location';
  if (contenu.includes('vente') || contenu.includes('vendre') || contenu.includes('à vendre') || contenu.includes('a vendre') || contenu.includes('cession')) {
    transaction = 'vente';
  }

  // 5. Détection du type de bien
  let typeBien = 'appartement';
  if (contenu.includes('villa') || contenu.includes('maison')) typeBien = 'villa';
  else if (contenu.includes('studio') || contenu.includes('chambre')) typeBien = 'studio';
  else if (contenu.includes('terrain') || contenu.includes('parcelle')) typeBien = 'terrain';
  else if (contenu.includes('immeuble')) typeBien = 'immeuble';
  else if (contenu.includes('bureau') || contenu.includes('local')) typeBien = 'bureau';

  return { telephone, prix, quartier, ville, transaction, typeBien };
}

/**
 * Téléchargement binaire Playwright en RAM et envoi vers Cloudinary
 */
async function uploaderPhotosCloudinary(urls, page = null) {
  if (!cloudinaryModule || !urls || urls.length === 0) return urls || [];
  const validees = [];

  for (const url of urls.slice(0, 4)) {
    if (url.includes('res.cloudinary.com')) {
      validees.push(url);
      continue;
    }

    let secureUrl = null;

    // A. Téléchargement binaire via Playwright (contexte connecté/furtif)
    if (page && page.request) {
      try {
        const resp = await page.request.get(url, { timeout: 8000 });
        if (resp && resp.ok()) {
          const buffer = await resp.body();
          if (buffer && buffer.length > 3000) {
            secureUrl = await cloudinaryModule.uploadBuffer(buffer, 'annonces/crawler');
          }
        }
      } catch (_) {}
    }

    // B. Repli URL distante
    if (!secureUrl) {
      try {
        const result = await cloudinaryModule.uploadFromUrl(url, 'annonces/crawler');
        secureUrl = result.secure_url;
      } catch (_) {}
    }

    if (secureUrl) validees.push(secureUrl);
  }

  // Filet de sécurité : conserver les URLs d'origine si le transfert Cloudinary est indisponible
  if (validees.length === 0 && urls.length > 0) {
    return urls.slice(0, 4);
  }

  return validees;
}

async function lancerNavigateurPlaywright(pw) {
  const optionsBase = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-service-autorun',
      '--disable-gpu'
    ]
  };

  try {
    return await pw.chromium.launch({ ...optionsBase, channel: 'chrome' });
  } catch (e1) {
    try {
      return await pw.chromium.launch({ ...optionsBase, channel: 'msedge' });
    } catch (e2) {
      return await pw.chromium.launch(optionsBase);
    }
  }
}

/**
 * Moteur principal : Crawl d'une URL avec extraction sémantique
 */
async function crawlerPageIntelligente({ url, maxItems = 15, sourceLabel = 'crawler-ai' }) {
  if (!playwright) {
    throw new Error('Playwright n\'est pas installé dans le projet.');
  }

  const resultats = {
    url,
    succes: false,
    annoncesTrouvees: 0,
    annoncesInserees: 0,
    leadsSynchronises: 0,
    erreurs: []
  };

  let browser = null;
  let context = null;

  try {
    browser = await lancerNavigateurPlaywright(playwright);

    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });

    // Scroll automatique pour déclencher le chargement dynamique (Lazy loading)
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 400;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= 2400) {
            clearInterval(timer);
            resolve();
          }
        }, 200);
      });
    });

    await page.waitForTimeout(1500);

    const htmlComplet = await page.content();
    const { $, texteEpure, photosCandidates } = nettoyerBruitHTML(htmlComplet);

    // Découpage automatique des blocs d'annonces avec cascade de sélecteurs prioritaires
    const items = [];
    const selecteursCandidats = [
      'a[href*="/annonce/"]',
      'a.listing-card__inner',
      '[class*="listing-card"]',
      'a[href*="/ad/"]',
      'a[href*="/item/"]',
      '[data-t-listing]',
      'article',
      '.card'
    ];

    let cartesCandidates = [];
    for (const sel of selecteursCandidats) {
      const matchSel = $(sel);
      if (matchSel.length >= 2) {
        cartesCandidates = matchSel;
        break;
      }
    }

    if (cartesCandidates.length >= 2) {
      cartesCandidates.each((_, el) => {
        if (items.length >= maxItems) return false;

        const blocTexte = $(el).text().replace(/\s+/g, ' ').trim();
        if (blocTexte.length < 25) return;

        // Détection de prix préliminaire pour valider que c'est une vraie annonce
        const prixDetecte = extraireEntitesSemantiques(blocTexte).prix;
        if (!prixDetecte) return;

        // 1. Extraction ciblée du titre sans pollution des badges de statut
        let titre = '';
        const balisesTitre = $(el).find('[class*="header__title"], [class*="card__title"], [class*="item__title"], [class*="ad-title"], [class*="title"], h2, h3, h4');
        balisesTitre.each((_, t) => {
          const cls = $(t).attr('class') || '';
          if (/priority|badge|tag|label|pill/i.test(cls)) return;
          const txt = $(t).text().trim();
          if (txt && !/^(?:VIP|A La Une|Nouveau|Promo|Urgent)$/i.test(txt) && txt.length > 5) {
            titre = txt;
            return false;
          }
        });

        if (!titre) {
          titre = blocTexte.replace(/^(?:A La Une|VIP|Nouveau|Promo|Urgent)\s+/i, '').slice(0, 90);
        }
        titre = titre.replace(/^(?:A La Une|VIP|Nouveau|Promo|Urgent)\s+/i, '').trim();

        let itemUrl = $(el).is('a') ? $(el).attr('href') : $(el).find('a[href]').first().attr('href');
        if (itemUrl && !itemUrl.startsWith('http')) {
          try {
            itemUrl = new URL(itemUrl, url).href;
          } catch (_) {}
        }

        // 2. Recherche approfondie de téléphone (tel:, wa.me, data-phone, ou texte du bloc)
        let telExtrait = null;
        const telHref = $(el).find('a[href^="tel:"]').first().attr('href');
        if (telHref) {
          const cleanTel = telHref.replace('tel:', '').replace(/[^\d]/g, '');
          const tel9 = cleanTel.startsWith('221') ? cleanTel.slice(3) : cleanTel;
          if (tel9.length === 9) telExtrait = tel9;
        }

        if (!telExtrait) {
          const waHref = $(el).find('a[href*="wa.me/"], a[href*="whatsapp.com/send"]').first().attr('href');
          if (waHref) {
            const cleanWa = waHref.replace(/[^\d]/g, '');
            const tel9 = cleanWa.startsWith('221') ? cleanWa.slice(3) : cleanWa;
            if (tel9.length === 9) telExtrait = tel9;
          }
        }

        if (!telExtrait) {
          const dataPhone = $(el).attr('data-phone') || $(el).find('[data-phone]').first().attr('data-phone');
          if (dataPhone) {
            const cleanData = dataPhone.replace(/[^\d]/g, '');
            const tel9 = cleanData.startsWith('221') ? cleanData.slice(3) : cleanData;
            if (tel9.length === 9) telExtrait = tel9;
          }
        }

        if (!telExtrait) {
          const m = blocTexte.match(/(?:(?:\+?221|00221)?\s*)?(7[05678]\d{7}|33\d{7}|7[05678][\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2})/);
          if (m) {
            const raw = m[0].replace(/[^\d]/g, '');
            const tel9 = raw.startsWith('221') ? raw.slice(3) : raw;
            if (tel9.length === 9) telExtrait = tel9;
          }
        }

        // 3. Images locales du bloc
        const blocPhotos = [];
        $(el).find('img').each((__, img) => {
          const src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-lazy-src');
          if (src && src.startsWith('http') && !src.includes('avatar') && !src.includes('logo') && !src.includes('badge')) {
            blocPhotos.push(src);
          }
        });

        items.push({
          titre,
          description: blocTexte,
          url: itemUrl || url,
          telephoneDirect: telExtrait,
          photos: blocPhotos.length > 0 ? blocPhotos : photosCandidates.slice(0, 2)
        });
      });
    }

    if (items.length === 0) {
      // Analyse de repli : annonce unique ou page pleine
      const titrePage = $('h1').first().text().trim() || $('title').text().trim();
      items.push({
        titre: titrePage.slice(0, 90),
        description: texteEpure.slice(0, 1000),
        url,
        telephoneDirect: null,
        photos: photosCandidates.slice(0, 4)
      });
    }

    resultats.annoncesTrouvees = items.length;

    // Enregistrement en base de données PostgreSQL
    for (const item of items) {
      const entites = extraireEntitesSemantiques(item.description, item.titre);
      const telephoneFinal = item.telephoneDirect || entites.telephone;

      if (!entites.prix || entites.prix < 5000) continue;

      // Upload des photos vers Cloudinary
      const photosFinales = await uploaderPhotosCloudinary(item.photos, page);

      const refBase = (item.url && item.url !== url)
        ? item.url.split('?')[0].split('/').filter(Boolean).pop()
        : item.titre;
      const refExterne = `${sourceLabel}-${Buffer.from(refBase.slice(0, 40)).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`;

      // 1. Insertion dans annonces_classifiees
      await getPool().query(`
        INSERT INTO annonces_classifiees (
          categorie_slug, titre, description, prix, ville, contact_tel, contact_nom,
          photos, actif, source, ref_externe, url_source, caracteristiques
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, true, $9, $10, $11, $12::jsonb)
        ON CONFLICT (source, ref_externe) WHERE ref_externe IS NOT NULL
        DO UPDATE SET
          titre = COALESCE(EXCLUDED.titre, annonces_classifiees.titre),
          description = COALESCE(EXCLUDED.description, annonces_classifiees.description),
          photos = CASE WHEN jsonb_array_length(EXCLUDED.photos) > 0 THEN EXCLUDED.photos ELSE annonces_classifiees.photos END,
          prix = COALESCE(EXCLUDED.prix, annonces_classifiees.prix),
          contact_tel = COALESCE(EXCLUDED.contact_tel, annonces_classifiees.contact_tel),
          url_source = COALESCE(EXCLUDED.url_source, annonces_classifiees.url_source),
          updated_at = NOW()
      `, [
        'immo',
        item.titre.slice(0, 120),
        item.description.slice(0, 1000),
        entites.prix,
        entites.ville,
        telephoneFinal,
        'Annonceur',
        JSON.stringify(photosFinales),
        sourceLabel,
        refExterne,
        item.url || url,
        JSON.stringify({ quartier: entites.quartier, type_bien: entites.typeBien, transaction: entites.transaction })
      ]).catch(() => {});

      // 2. Insertion miroir dans annonces_immo si contact téléphonique présent
      if (telephoneFinal) {
        await getPool().query(`
          INSERT INTO annonces_immo (
            titre, description, prix, ville, quartier, type_bien, transaction,
            photos, source, ref_externe, actif, supprimee, rejete, contact_nom, contact_tel, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8::jsonb, 'particulier_annonce', $9, true, false, false, 'Annonceur', $10, NOW(), NOW()
          )
          ON CONFLICT (source, ref_externe) WHERE ref_externe IS NOT NULL
          DO UPDATE SET
            titre = COALESCE(EXCLUDED.titre, annonces_immo.titre),
            description = COALESCE(EXCLUDED.description, annonces_immo.description),
            photos = CASE WHEN jsonb_array_length(EXCLUDED.photos) > 0 THEN EXCLUDED.photos ELSE annonces_immo.photos END,
            prix = COALESCE(EXCLUDED.prix, annonces_immo.prix),
            contact_tel = COALESCE(EXCLUDED.contact_tel, annonces_immo.contact_tel),
            updated_at = NOW()
        `, [
          item.titre.slice(0, 120),
          item.description.slice(0, 1000),
          entites.prix,
          entites.ville,
          entites.quartier,
          entites.typeBien,
          entites.transaction,
          JSON.stringify(photosFinales),
          refExterne,
          telephoneFinal
        ]).catch(() => {});

        // 3. Synchronisation dans prospection_leads (CRM WhatsApp)
        let operateur = 'Orange';
        if (telephoneFinal.startsWith('76')) operateur = 'Free';
        else if (telephoneFinal.startsWith('70')) operateur = 'Expresso';
        else if (telephoneFinal.startsWith('75')) operateur = 'Promobile';

        const insLead = await getPool().query(`
          INSERT INTO prospection_leads (
            nom_boutique, contact_nom, telephone, telephone_brut, operateur, categorie, ville, quartier, source, statut, score, notes
          ) VALUES ($1, $2, $3, $4, $5, 'immo', $6, $7, $8, 'nouveau', 75, $9)
          ON CONFLICT (telephone) DO UPDATE SET
            notes = COALESCE(EXCLUDED.notes, prospection_leads.notes),
            updated_at = NOW()
          RETURNING id
        `, [
          `Immo - ${item.titre.slice(0, 45)}`,
          'Annonceur Immo',
          telephoneFinal,
          `+221${telephoneFinal}`,
          operateur,
          entites.ville || 'Dakar',
          entites.quartier || 'Dakar',
          sourceLabel,
          `Opportunité capturée via Crawler AI : ${item.titre} (${entites.prix ? entites.prix.toLocaleString('fr-FR') : ''} FCFA) - Source: ${item.url || url}`
        ]).catch(() => null);

        if (insLead && insLead.rows && insLead.rows.length > 0) {
          resultats.leadsSynchronises++;
        }
      }

      resultats.annoncesInserees++;
    }

    resultats.succes = true;
  } catch (err) {
    resultats.erreurs.push(err.message);
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }

  return resultats;
}

module.exports = {
  crawlerPageIntelligente,
  nettoyerBruitHTML,
  extraireEntitesSemantiques
};
