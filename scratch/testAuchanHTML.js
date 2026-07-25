const axios = require('axios');
const cheerio = require('cheerio');

async function testAuchanHTML() {
  try {
    const { data } = await axios.get('https://www.auchan.sn/104-epicerie-salee', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    let classes = new Set();
    $('article').each((i, el) => {
      classes.add($(el).attr('class'));
    });
    console.log("Article classes:", Array.from(classes));
    
    let products = [];
    $('.product-miniature, article').each((i, el) => {
      products.push($(el).text().substring(0, 100));
    });
    console.log("Found products:", products.length);
  } catch(e) { console.error(e.message); }
}
testAuchanHTML();
