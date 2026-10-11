// backend/services/collecte/DecathlonCollector.js
// ══════════════════════════════════════════════════════════════════════════════
// ARCHITECTURE DE COLLECTE V2 — ADAPTATEUR DÉDIÉ DECATHLON SÉNÉGAL
// Sélecteurs BEM réels, multi-catégories sports, prix FCFA directs
// ══════════════════════════════════════════════════════════════════════════════

const BaseCollector = require('./BaseCollector');
const { parsePrix } = require('../../lib/prix');

const CATEGORIES_DECATHLON = [
  { slug: 'fitness-cardio',             path: '/3756-fitness-cardio' },
  { slug: 'course-a-pied',              path: '/3081-course-a-pied' },
  { slug: 'natation',                   path: '/3279-natation' },
  { slug: 'football',                   path: '/1734-football' },
  { slug: 'basketball',                 path: '/3371-basketball' },
  { slug: 'volleyball',                 path: '/1396-volleyball' },
  { slug: 'handball',                   path: '/1461-handball' },
  { slug: 'randonnee',                  path: '/1484-randonnee' },
  { slug: 'equipements-randonnee',      path: '/1419-equipements-de-randonnee' },
  { slug: 'chaussures-homme',           path: '/3109-chaussures-homme' },
  { slug: 'chaussures-femme',           path: '/3110-chaussures-femme' },
];

class DecathlonCollector extends BaseCollector {
  constructor(config = {}) {
    super({
      sourceId: 'decathlon',
      nom: 'Decathlon',
      baseUrl: 'https://www.decathlon.sn',
      systeme: 'produits',
      delaiMs: 2500,
      timeoutMs: 25000,
      ...config,
    });
    this.maxPagesParCategorie = config.maxPagesParCategorie || 10;
    this.categories = config.categories || CATEGORIES_DECATHLON;
  }

  getHeaders(customHeaders = {}) {
    return super.getHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      ...customHeaders,
    });
  }

  async collecter({ run = null, dryRun = false } = {}) {
    const resultats = [];
    const vusUrls = new Set();

    console.log(`[DecathlonCollector] Début collecte Decathlon Sénégal (${this.categories.length} catégories)`);

    for (const cat of this.categories) {
      let articlesCat = 0;
      for (let page = 1; page <= this.maxPagesParCategorie; page++) {
        const pageUrl = page === 1
          ? `${this.baseUrl}${cat.path}`
          : `${this.baseUrl}${cat.path}?page=${page}`;

        try {
          const { $, status } = await this.fetchHttp(pageUrl);
          if (!$) break;

          const cards = $('.product-card, .js-product-card');
          if (!cards.length) {
            console.log(`[DecathlonCollector] ${cat.slug} p${page} : Fin (0 carte)`);
            break;
          }

          let itemsPageCount = 0;
          cards.each((_, el) => {
            const $el = $(el);
            const marque = $el.find('[data-testid="product-card-brand"]').text().trim();
            const nomBase = $el.find('h2').first().text().trim() || $el.find('.product-title, .title').first().text().trim();
            const titreBrut = marque && !nomBase.toLowerCase().includes(marque.toLowerCase()) 
              ? `${marque} ${nomBase}` 
              : (nomBase || marque);
            const titre = this.normaliserTitre(titreBrut);

            // Prix : chercher en priorité l'attribut data-value sur current-price
            const currentPriceEl = $el.find('[data-testid="current-price"]');
            const dataVal = currentPriceEl.attr('data-value');
            let prix = null;
            if (dataVal && !isNaN(parseInt(dataVal, 10))) {
              prix = parseInt(dataVal, 10);
            } else {
              const rawTxt = currentPriceEl.text() || $el.find('.price_amount').first().text() || '';
              // Éviter la concaténation de prix multiples (ex: "1000 CFA 1000 CFA")
              const premierPrixMatch = rawTxt.match(/(\d[\d\s.,]{0,8}\d|\d+)\s*(?:cfa|f|xof)?/i);
              prix = parsePrix(premierPrixMatch ? premierPrixMatch[0] : rawTxt, { min: 500 });
            }

            // Lien produit canonique
            let href = $el.find('a[href*="/p/"]').first().attr('href') || $el.find('a.js-product-card-link').attr('href') || '';
            if (href && !href.startsWith('http')) {
              href = `${this.baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
            }

            // Image
            const imgEl = $el.find('img').first();
            const img = imgEl.attr('src') || imgEl.attr('data-src') || null;

            if (titre.length > 3 && prix >= 500 && href && !vusUrls.has(href)) {
              vusUrls.add(href);
              resultats.push({
                titre,
                prix,
                url: href,
                image_url: img,
                description: `${titre} disponible chez Decathlon Sénégal`,
                prix_brut: `${dataVal || rawTxt} CFA`.trim(),
                categorie_slug: cat.slug,
                source: this.sourceId,
              });
              itemsPageCount++;
              articlesCat++;
            }
          });

          console.log(`[DecathlonCollector] ${cat.slug} p${page} : ${itemsPageCount} nouveaux items (total cat: ${articlesCat})`);
          if (itemsPageCount === 0) break;

          await this.sleep(this.delaiMs);
        } catch (err) {
          const code = err.response?.status;
          console.warn(`[DecathlonCollector] ${cat.slug} p${page} : Erreur ${code || err.code || err.message}`);
          break;
        }
      }

      if (run) {
        run.noterCategorie(cat.slug, articlesCat);
      }
      await this.sleep(this.delaiMs);
    }

    console.log(`[DecathlonCollector] Fin collecte Decathlon — Total extrait: ${resultats.length}`);
    return resultats;
  }
}

DecathlonCollector.CATEGORIES = CATEGORIES_DECATHLON;
module.exports = DecathlonCollector;
