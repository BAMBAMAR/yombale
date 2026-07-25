const { lancerScraping } = require('../backend/services/scraper');

async function run() {
  console.log("Démarrage du scraping manuel...");
  await lancerScraping();
  console.log("Scraping terminé !");
  process.exit(0);
}
run().catch(err => {
  console.error("Erreur durant le scraping :", err);
  process.exit(1);
});
