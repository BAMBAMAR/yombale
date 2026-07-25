const { lancerScraping, lancerScrapingNouveauxSites } = require('./backend/services/scraper');
const { pool } = require('./backend/models/db');

async function force() {
  console.log("Forcing scrape for new sites...");
  try {
    // 1. Run the specific scrapers
    await lancerScraping(['decathlon', 'jiji', 'expat']);
    
    // 2. Run the dynamic new sites scrapers
    await lancerScrapingNouveauxSites(['soumari', 'promosn', 'electromenagerdakar', 'universcosmetix']);
    
    console.log("Force scrape completed successfully!");
  } catch (error) {
    console.error("Error during force scrape:", error);
  } finally {
    // Close the DB pool so the process can exit
    await pool.end();
    process.exit(0);
  }
}

force();
