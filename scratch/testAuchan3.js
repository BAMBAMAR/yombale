const axios = require('axios');
const cheerio = require('cheerio');

async function scraperAuchan(categorie='137-boissons', maxPages=3) {
  const resultats = [];
  const base = `https://www.auchan.sn/${categorie}`;
  console.log(`\n[AUCHAN] ${base}`);
  
  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? base : `${base}?page=${page}`;
    try {
      const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = cheerio.load(res.data);
      let count = 0;
      
      $('.product-miniature').each((i, el) => {
        const title = $(el).find('.product-title a').text().trim();
        let priceStr = $(el).find('.product-price').text().trim();
        // format: 1 500 CFA
        const price = parseInt(priceStr.replace(/\D/g, ''), 10);
        let link = $(el).find('.product-title a').attr('href');
        let img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
        
        if (title && price && link) {
          resultats.push({
            nom: title,
            prix: price,
            image_url: img,
            url_achat: link,
            site: 'Auchan',
            categorie
          });
          count++;
        }
      });
      console.log(`[AUCHAN] Page ${page}: ${count}`);
      if (count === 0) break;
    } catch (err) {
      console.log(`[AUCHAN] Page ${page}: Error ${err.message}`);
      break;
    }
  }
  return resultats;
}

scraperAuchan('37-electromenager-et-image-son', 1).then(console.log);
