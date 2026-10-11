// scripts/audit/scraping/test-wc-store-api.js
const axios = require('axios');

async function testWc(name, url) {
  try {
    console.log(`\nTesting ${name}: ${url}`);
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      timeout: 15000
    });
    console.log(`HTTP ${res.status} | Total headers: X-WP-Total=${res.headers['x-wp-total']}, X-WP-TotalPages=${res.headers['x-wp-totalpages']}`);
    const items = res.data;
    if (Array.isArray(items) && items.length > 0) {
      const p = items[0];
      console.log('Sample item:', {
        id: p.id,
        name: p.name,
        currency_code: p.prices?.currency_code,
        currency_minor_unit: p.prices?.currency_minor_unit,
        price: p.prices?.price,
        regular_price: p.prices?.regular_price,
        sale_price: p.prices?.sale_price,
        formatted_price: p.prices?.price_range?.min_amount || p.prices?.price
      });
    }
  } catch (e) {
    console.error(`Error ${name}:`, e.response?.status || e.message);
  }
}

(async () => {
  await testWc('Soumari', 'https://soumari.com/wp-json/wc/store/v1/products?per_page=2');
  await testWc('Promo.sn', 'https://promo.sn/wp-json/wc/store/v1/products?per_page=2');
  await testWc('Univers Cosmetix', 'https://universcosmetix.com/wp-json/wc/store/v1/products?per_page=2');
  await testWc('Master Office Déco', 'https://masterofficedeco.sn/wp-json/wc/store/v1/products?per_page=2');
})();
