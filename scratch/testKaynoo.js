const axios = require('axios');
const cheerio = require('cheerio');

async function testKaynoo() {
  try {
    const { data } = await axios.get('https://kaynoo.sn/shop', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);
    
    let products = [];
    $('.product-item').each((i, el) => {
      if (i >= 5) return;
      const title = $(el).find('.product-item-name a').text().trim();
      const priceStr = $(el).find('.price').first().text().trim();
      const price = parseInt(priceStr.replace(/\D/g, ''), 10);
      const link = $(el).find('.product-item-name a').attr('href');
      const img = $(el).find('.product-image-photo').attr('src');
      
      products.push({ title, price, link, img });
    });
    console.log(products);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
testKaynoo();
