const fs = require('fs');
const readline = require('readline');

async function run() {
  const fileStream = fs.createReadStream('backup-railway-2026-06-26.sql');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("=== RECHERCHE DANS LE BACKUP SQL ===");
  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (line.includes('boutiques') || line.includes('whatsapp_catalog_id') || line.includes('DIEVO STYLE') || line.includes('AMAR')) {
      console.log(`Ligne ${lineCount}: ${line.substring(0, 300)}...`);
    }
  }
  console.log("Recherche terminée.");
}

run();
