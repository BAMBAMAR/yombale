const { scraperTousNouveauxSites, SITES_CONFIG } = require('../backend/services/scraper-new-sites');

async function testSites() {
  const targetIds = ['soumari', 'promosn', 'electromenagerdakar', 'universcosmetix'];
  await scraperTousNouveauxSites(targetIds, (config, items) => {
    console.log(`\nResults for ${config.nom}: ${items.length} items found.`);
    if (items.length > 0) {
      console.log(items.slice(0, 2));
    }
  });
}

testSites();
