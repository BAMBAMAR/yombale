const axios = require('axios');
const cheerio = require('cheerio');

async function getCategories() {
  const { data } = await axios.get('https://www.jumia.sn/', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const $ = cheerio.load(data);
  const links = new Set();
  $('a[href^="/"]').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.endsWith('/') && href.split('/').length === 3) {
      links.add(href);
    }
  });
  console.log(Array.from(links));
}
getCategories();
