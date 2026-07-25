const { scraperCoinAfrique, scraperJumia } = require('../backend/services/scraper');

async function run() {
  console.log("Testing CoinAfrique scraper on 'ordinateurs'...");
  const coin = await scraperCoinAfrique('ordinateurs', 1);
  console.log(`Found ${coin.length} products on CoinAfrique.`);

  console.log("\nTesting Jumia scraper on 'ordinateurs-accessoires-informatique'...");
  const jumia = await scraperJumia('ordinateurs-accessoires-informatique', 1);
  console.log(`Found ${jumia.length} products on Jumia.`);
  
  process.exit(0);
}
run();
