const axios = require('axios');
const cheerio = require('cheerio');

async function testScrapers() {
  console.log('--- Test HTTP des sites cibles ---');
  
  // 1. CoinAfrique
  try {
    const res = await axios.get('https://sn.coinafrique.com/categorie/telephones-et-tablettes', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000
    });
    const $ = cheerio.load(res.data);
    const count = $('a[href*="/annonce/"]').length || $('[data-cy="ad-card"]').length;
    console.log(`✅ CoinAfrique: HTTP ${res.status} — ${count} annonces trouvées`);
  } catch (err) {
    console.error(`❌ CoinAfrique: ${err.message}`);
  }

  // 2. Expat-Dakar
  try {
    const res = await axios.get('https://www.expat-dakar.com/telephones', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000
    });
    const $ = cheerio.load(res.data);
    const count = $('[data-t-listing_item]').length || $('a[href*="/annonce/"]').length;
    console.log(`✅ Expat-Dakar: HTTP ${res.status} — ${count} annonces trouvées`);
  } catch (err) {
    console.error(`❌ Expat-Dakar: ${err.message}`);
  }

  // 3. Jumia
  try {
    const res = await axios.get('https://www.jumia.sn/telephone-tablette/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000
    });
    const $ = cheerio.load(res.data);
    const count = $('article.prd').length;
    console.log(`✅ Jumia SN: HTTP ${res.status} — ${count} produits trouvés`);
  } catch (err) {
    console.error(`❌ Jumia SN: ${err.message}`);
  }
}

testScrapers();
