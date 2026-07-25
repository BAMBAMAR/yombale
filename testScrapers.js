const { scraperKaynoo, scraperAuchan, scraperExpatDakar } = require('./backend/services/scraper');

async function tester() {
  console.log("Testing Kaynoo...");
  const k = await scraperKaynoo('produits-hightech', 1);
  console.log("Kaynoo result:", k.slice(0,2));

  console.log("Testing Auchan...");
  const a = await scraperAuchan('104-epicerie-salee', 1);
  console.log("Auchan result:", a.slice(0,2));

  console.log("Testing Expat-Dakar...");
  const e = await scraperExpatDakar('telephones', 1);
  console.log("Expat result:", e.slice(0,2));
}

tester();
