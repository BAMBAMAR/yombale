const axios = require('axios');
const cheerio = require('cheerio');

async function testAuchan() {
  try {
    const { data } = await axios.get('https://www.auchan.sn/37-electromenager-et-image-son', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const $ = cheerio.load(data);
    const products = [];
    
    // Attempting common Prestashop/Magento/WooCommerce selectors
    $('.product-miniature, .item, .product, article').each((i, el) => {
      if (i > 5) return;
      const title = $(el).find('h3, h2, .product-title, .name').text().trim();
      const price = $(el).find('.price, .product-price, [itemprop="price"]').text().trim();
      const link = $(el).find('a').attr('href');
      products.push({ title, price, link });
    });
    
    console.log(`Found ${products.length} products`);
    console.log(products);
  } catch (err) {
    console.error("Auchan Error:", err.message);
  }
}
testAuchan();
