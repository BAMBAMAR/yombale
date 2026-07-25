const axios = require('axios');
const cheerio = require('cheerio');

async function checkSite(url) {
  try {
    const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    console.log(`\n--- ${url} ---`);
    console.log("Length:", data.length);
    const $ = cheerio.load(data);
    let classes = new Set();
    $('a, div, li').each((i, el) => {
      const c = $(el).attr('class');
      if (c && c.includes('product')) classes.add(c);
    });
    console.log("Product classes:", Array.from(classes).slice(0, 10));
  } catch(e) {
    console.error(url, "Error:", e.message);
  }
}

checkSite('https://kaynoo.sn/shop');
checkSite('https://www.decathlon.sn/');
