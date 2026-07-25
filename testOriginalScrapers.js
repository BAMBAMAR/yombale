const { scraperExpatDakar, scraperJumia, scraperCoinAfrique } = require('./backend/services/scraper');

async function testAll() {
  console.log("=== Testing Expat-Dakar ===");
  const expat = await scraperExpatDakar('telephones', 1);
  console.log("Expat results:", expat.length);

  console.log("\n=== Testing Jumia ===");
  const jumia = await scraperJumia('telephone-tablette', 1);
  console.log("Jumia results:", jumia.length);

  console.log("\n=== Testing CoinAfrique ===");
  const coinafrique = await scraperCoinAfrique('telephones-et-tablettes', 1);
  console.log("CoinAfrique results:", coinafrique.length);
}

testAll();
