// scripts/audit/scraping/test-decathlon-collector-live.js
require('dotenv').config();
const DecathlonCollector = require('../../../backend/services/collecte/DecathlonCollector');

(async () => {
  const collector = new DecathlonCollector({
    delaiMs: 500,
    maxPagesParCategorie: 1,
  });

  const url = 'https://www.decathlon.sn/3756-fitness-cardio';
  console.log('Testing extraction with corrected selectors on:', url);
  const { $, status } = await collector.fetchHttp(url);

  const cards = $('.product-card, .js-product-card');
  const items = [];
  const vus = new Set();

  cards.each((_, el) => {
    const $el = $(el);
    const marque = $el.find('[data-testid="product-card-brand"]').text().trim();
    // Correction : h2 contient le titre direct du produit
    const nomBase = $el.find('h2').first().text().trim();
    const titreBrut = marque && !nomBase.toLowerCase().includes(marque.toLowerCase()) 
      ? `${marque} ${nomBase}` 
      : (nomBase || marque);
    const titre = collector.normaliserTitre(titreBrut);

    const currentPriceEl = $el.find('[data-testid="current-price"]');
    const dataVal = currentPriceEl.attr('data-value');
    let prix = dataVal ? parseInt(dataVal, 10) : null;
    if (!prix || isNaN(prix)) {
      // Nettoyer en extrayant la première occurrence de montant
      const rawTxt = currentPriceEl.text() || $el.find('.price_amount').first().text() || '';
      prix = collector.nettoyerPrix(rawTxt);
    }

    let href = $el.find('a[href*="/p/"]').first().attr('href') || $el.find('a.js-product-card-link').attr('href') || '';
    if (href && !href.startsWith('http')) {
      href = `${collector.baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
    }

    if (href && !vus.has(href)) {
      vus.add(href);
      items.push({
        marque,
        nomBase,
        titre,
        prix,
        href: href.slice(0, 60),
      });
    }
  });

  console.log(`Unique items extracted: ${items.length}`);
  console.table(items.slice(0, 10));
  process.exit(0);
})();
