const axios = require('axios');
const cheerio = require('cheerio');

async function getCategories() {
  const { data } = await axios.get('https://sn.coinafrique.com');
  const $ = cheerio.load(data);
  const filterForm = $('#filter-modal-form');
  const catData = filterForm.attr('data-catpage-subcatlist');
  if (catData) {
    const cats = JSON.parse(catData);
    cats.forEach(cat => {
      console.log(`Catégorie principale: ${cat.name}`);
      if (cat.children) {
        cat.children.forEach(sub => {
          console.log(`  - ${sub.name}`);
        });
      }
    });
  } else {
    console.log("no catData");
  }
}
getCategories();
