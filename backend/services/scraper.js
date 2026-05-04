const axios   = require('axios');
const cheerio = require('cheerio');
const cron    = require('node-cron');
const { pool } = require('../models/db');

async function scraperExpatDakar(categorie = 'electronique') {
  console.log(`[SCRAPER] Expat-Dakar [${categorie}]...`);
  const resultats = [];
  try {
    const { data: html } = await axios.get(
      `https://www.expat-dakar.com/${categorie}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 10000 }
    );
    const $ = cheerio.load(html);
    $('.listing-item').each((i, el) => {
      const titre   = $(el).find('.listing-title').first().text().trim();
      const prixTxt = $(el).find('.listing-price').first().text().trim();
      const prix    = parseInt(prixTxt.replace(/[^0-9]/g, ''));
      const url     = $(el).find('a').first().attr('href');
      if (titre && prix > 0)
        resultats.push({ titre, prix, url: `https://www.expat-dakar.com${url}` });
    });
    console.log(`[OK] ${resultats.length} produits collectés`);
  } catch (err) { console.error('[ERR] Expat-Dakar:', err.message); }
  return resultats;
}

async function fetchJumiaAPI(recherche) {
  try {
    const { data } = await axios.get('https://affiliate-api.jumia.com.sn/products', {
      params: { q: recherche, limit: 50 },
      headers: { Authorization: `Bearer ${process.env.JUMIA_API_KEY}` }
    });
    return data.products.map(p => ({ titre: p.name, prix: p.price, url: p.url, ean: p.ean }));
  } catch (err) { console.error('[ERR] Jumia API:', err.message); return []; }
}

async function sauvegarderProduit(produit, marchandId) {
  const { rows } = await pool.query(
    "SELECT id FROM produits WHERE ean=$1 OR SIMILARITY(nom,$2)>0.8 LIMIT 1",
    [produit.ean || '', produit.titre]
  );
  let produitId;
  if (rows.length) {
    produitId = rows[0].id;
  } else {
    const r = await pool.query(
      'INSERT INTO produits (nom,ean) VALUES ($1,$2) RETURNING id',
      [produit.titre, produit.ean]
    );
    produitId = r.rows[0].id;
  }
  await pool.query(`
    INSERT INTO offres (produit_id,marchand_id,prix,url_achat,scraped_at)
    VALUES ($1,$2,$3,$4,NOW())
    ON CONFLICT (produit_id,marchand_id)
    DO UPDATE SET prix=$3, scraped_at=NOW()`,
    [produitId, marchandId, produit.prix, produit.url]
  );
}

function demarrerScraping() {
  cron.schedule('0 */6 * * *', async () => {
    const p = await scraperExpatDakar('electronique');
    for (const item of p) await sauvegarderProduit(item, process.env.EXPAT_MARCHAND_ID);
  });
  cron.schedule('0 */2 * * *', async () => {
    for (const cat of ['smartphones', 'laptops', 'tv']) {
      const p = await fetchJumiaAPI(cat);
      for (const item of p) await sauvegarderProduit(item, process.env.JUMIA_MARCHAND_ID);
    }
  });
  console.log('[OK] Scraping planifié actif');
}

module.exports = { scraperExpatDakar, fetchJumiaAPI, demarrerScraping };