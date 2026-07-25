const axios = require('axios');
const cheerio = require('cheerio');

async function getAuchanCats() {
  try {
    const { data } = await axios.get('https://www.auchan.sn/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    const links = new Set();
    $('a[href^="https://www.auchan.sn/"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && (href.match(/\/\d+-/) || href.match(/\/c\//))) {
        links.add(href);
      }
    });
    console.log("Auchan categories:", Array.from(links).slice(0, 30));
  } catch (err) {
    console.error("Error:", err.message);
  }
}
getAuchanCats();
