const axios = require('axios');
const cheerio = require('cheerio');

const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
];
const randUA = () => UA_POOL[Math.floor(Math.random() * UA_POOL.length)];

const SITES = [
  { nom: 'Decathlon', url: 'https://www.decathlon.sn/' },
  { nom: 'Jiji Sénégal', url: 'https://jiji.sn/' },
  { nom: 'Soumari', url: 'https://soumari.com/' },
  { nom: 'Promo.sn', url: 'https://promo.sn/' },
  { nom: 'Electroménager Dakar', url: 'https://electromenager-dakar.com/' },
  { nom: 'Univers Cosmetix', url: 'https://universcosmetix.com/' }
];

async function testSites() {
  for (const site of SITES) {
    try {
      console.log(`\nTesting ${site.nom} (${site.url})...`);
      const response = await axios.get(site.url, {
        headers: {
          'User-Agent': randUA(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });
      
      const title = cheerio.load(response.data)('title').text();
      console.log(`✅ SUCCESS! Status: ${response.status}`);
      console.log(`Title: ${title.trim()}`);
      if (title.toLowerCase().includes('just a moment') || title.toLowerCase().includes('cloudflare')) {
        console.log(`⚠️ WARNING: Cloudflare challenge detected in title.`);
      }
    } catch (error) {
      console.log(`❌ FAILED! Status: ${error.response ? error.response.status : error.code}`);
      if (error.response) {
        const title = cheerio.load(error.response.data)('title').text();
        console.log(`Error Page Title: ${title.trim()}`);
      }
    }
  }
}

testSites();
