// scripts/audit/scraping/test-decathlon-inspect.js
const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const url = 'https://www.decathlon.sn/3756-fitness-cardio';
  console.log('Fetching', url);
  const res = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3'
    },
    timeout: 15000
  });

  const $ = cheerio.load(res.data);
  const cards = $('.product-card, .js-product-card');
  console.log('Found cards:', cards.length);

  cards.slice(0, 3).each((i, el) => {
    const $el = $(el);
    console.log(`\n--- CARD ${i + 1} ---`);
    console.log('card classes:', $el.attr('class'));
    console.log('brand testid:', $el.find('[data-testid="product-card-brand"]').text().trim());
    console.log('h2:', $el.find('h2').text().trim());
    console.log('header.product-card_header:', $el.find('header.product-card_header').text().trim());
    console.log('a.js-product-card-link:', $el.find('a.js-product-card-link').text().trim());
    console.log('current-price text:', $el.find('[data-testid="current-price"]').text().trim());
    console.log('current-price data-value:', $el.find('[data-testid="current-price"]').attr('data-value'));
    console.log('all links:');
    $el.find('a').each((_, a) => {
      console.log('  href:', $(a).attr('href'), 'text:', $(a).text().trim().slice(0, 50));
    });
  });
}

test().catch(e => console.error(e.message));
