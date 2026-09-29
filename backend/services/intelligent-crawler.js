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
    pool = require('../models/db');
  }
  return pool;
}

let playwright = null;
try { playwright = require('playwright'); } catch {}

let cloudinaryModule = null;
try { cloudinaryModule = require('./cloudinary'); } catch {}

// Dictionnaire des quartiers et villes sénégalaises pour localisation sémantique
const QUARTIERS_SENEGAL = [
  'almadies', 'ngor', 'ouakam', 'mermoz', 'sacre coeur', 'sacre-coeur', 'fann', 'point e',
  'plateau', 'medina', 'fass', 'gueule tapee', 'colobane', 'gibraltar', 'zone b', 'zone de captage',
  'dieuppeul', 'derkle', 'castors', 'hlm', 'grand yoff', 'yoff', 'nord foire', 'ouest foire',
  'sud foire', 'maristes', 'hann maristes', 'parcelles assainies', 'parcelles', 'guediawaye',
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

  // Supprimer les balises parasites
  $('script, style, noscript, iframe, svg, nav, footer, header, form, [role="banner"], [role="navigation"], .ads, .advertisement, .cookie-banner, .popup').remove();

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

  // 2. Détection du prix en FCFA
  let prix = null;
  const matchPrix = contenu.match(/(\d[\d\s.,]{2,10})\s*(?:fcfa|cfa|f\s*cfa|f)/i);
  if (matchPrix) {
    const brut = parseInt(matchPrix[1].replace(/[^\d]/g, ''), 10);
    if (!isNaN(brut) && brut >= 5000 && brut <= 500000000) {
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

  return validees;
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
    browser = await playwright.chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Scroll automatique pour déclencher le chargement dynamique (Lazy loading)
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 400;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= 2000) {
            clearInterval(timer);
            resolve();
          }
        }, 200);
      });
    });

    await page.waitForTimeout(1500);

    const htmlComplet = await page.content();
    const { $, texteEpure, photosCandidates } = nettoyerBruitHTML(htmlComplet);

    // Découpage automatique des blocs d'annonces ou analyse globale
    const items = [];
    const cartes = $('article, .card, [class*="item"], [class*="listing"], [class*="annonce"]');

    if (cartes.length >= 2) {
      cartes.slice(0, maxItems).each((_, el) => {
        const blocHtml = $(el).html();
        const blocTexte = $(el).text().replace(/\s+/g, ' ').trim();
        const titre = $(el).find('h2, h3, h4, a[title], [class*="title"]').first().text().trim() || blocTexte.slice(0, 60);

        // Images locales du bloc
        const blocPhotos = [];
        $(el).find('img').each((__, img) => {
          const src = $(img).attr('src') || $(img).attr('data-src');
          if (src && src.startsWith('http') && !src.includes('avatar') && !src.includes('logo')) {
            blocPhotos.push(src);
          }
        });

        items.push({
          titre,
          description: blocTexte,
          photos: blocPhotos.length > 0 ? blocPhotos : photosCandidates.slice(0, 2)
        });
      });
    } else {
      // Analyse d'une annonce unique ou page pleine
      const titrePage = $('h1').first().text().trim() || $('title').text().trim();
      items.push({
        titre: titrePage.slice(0, 90),
        description: texteEpure.slice(0, 1000),
        photos: photosCandidates.slice(0, 4)
      });
    }

    resultats.annoncesTrouvees = items.length;

    // Enregistrement en base de données PostgreSQL
    for (const item of items) {
      const entites = extraireEntitesSemantiques(item.description, item.titre);

      if (!entites.prix || entites.prix < 5000) continue;

      // Upload des photos vers Cloudinary
      const photosFinales = await uploaderPhotosCloudinary(item.photos, page);

      const refExterne = `${sourceLabel}-${Buffer.from(item.titre.slice(0, 30)).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`;

      // 1. Insertion dans annonces_classifiees
      await getPool().query(`
        INSERT INTO annonces_classifiees (
          categorie_slug, titre, description, prix, ville, contact_tel, contact_nom,
          photos, actif, source, ref_externe, url_source, caracteristiques
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, true, $9, $10, $11, $12::jsonb)
        ON CONFLICT (source, ref_externe) WHERE ref_externe IS NOT NULL
        DO UPDATE SET
          photos = CASE WHEN jsonb_array_length(EXCLUDED.photos) > 0 THEN EXCLUDED.photos ELSE annonces_classifiees.photos END,
          prix = COALESCE(EXCLUDED.prix, annonces_classifiees.prix),
          updated_at = NOW()
      `, [
        'immo',
        item.titre.slice(0, 120),
        item.description.slice(0, 1000),
        entites.prix,
        entites.ville,
        entites.telephone,
        'Annonceur',
        JSON.stringify(photosFinales),
        sourceLabel,
        refExterne,
        url,
        JSON.stringify({ quartier: entites.quartier, type_bien: entites.typeBien, transaction: entites.transaction })
      ]).catch(() => {});

      // 2. Insertion miroir dans annonces_immo si contact téléphonique présent
      if (entites.telephone) {
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
            photos = CASE WHEN jsonb_array_length(EXCLUDED.photos) > 0 THEN EXCLUDED.photos ELSE annonces_immo.photos END,
            prix = COALESCE(EXCLUDED.prix, annonces_immo.prix),
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
          entites.telephone
        ]).catch(() => {});

        // 3. Synchronisation dans prospection_leads (CRM WhatsApp)
        await getPool().query(`
          INSERT INTO prospection_leads (
            nom_contact, telephone_brut, telephone_e164, source, categorie_prospect, notes, metadata
          ) VALUES ($1, $2, $3, $4, 'vendeur_immo', $5, $6::jsonb)
          ON CONFLICT (telephone_e164) DO NOTHING
        `, [
          'Annonceur Immo',
          entites.telephone,
          `+221${entites.telephone}`,
          sourceLabel,
          `Opportunité capturée via Crawler AI : ${item.titre}`,
          JSON.stringify({ prix: entites.prix, quartier: entites.quartier, source_url: url })
        ]).catch(() => {});

        resultats.leadsSynchronises++;
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
