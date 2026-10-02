// Matrice de normalisation des prix (AUD-187) : même chaîne source, parseur commun lib/prix.js.
// Avant AUD-187, six parseurs du dépôt donnaient des résultats différents sur ces mêmes chaînes
// (relevé du 01/10/2026 : scraper.js 14 justes / 3 rejets ; nouveaux sites 13 / 4 ; immo Expat et CoinAfrique 11 / 5 / 1 écart
//  `150 000,50` → 15 000 050 ; Facebook 8 / 8 / 1 ; Omnisource 10 / 6 / 1). Après : une seule colonne.
// Usage : node scripts/audit/scraping/price-matrix.js
const path = require('path');
const { parsePrix, parsePrixPlage } = require(path.resolve(__dirname, '../../../backend/lib/prix.js'));

const cas = [
  ['1.500.000 FCFA', 1500000], ['1500000', 1500000], ['1 500 000 F', 1500000], ['1 500 000 FCFA', 1500000],
  ['1,5M', 1500000], ['1,5 million', 1500000], ['CFA 155,000', 155000], ['155 000 CFA', 155000],
  ['150 000,50 F', 150000], ['25.000', 25000], ['25.000 FCFA', 25000], ['2 500 F CFA', 2500], ['15k', 15000],
  ['350000/mois', 350000], ['Prix : 45 000 F', 45000], ['85 000 - 95 000 FCFA', 85000], ['1.250.000F', 1250000],
];
let ok = 0; const ecarts = [];
for (const [entree, attendu] of cas) {
  const v = parsePrix(entree, { min: 100 });
  if (v === attendu) ok++; else ecarts.push({ entree, attendu, obtenu: v });
}
console.log(`parsePrix : ${ok} / ${cas.length} justes`);
if (ecarts.length) console.log('Écarts :', JSON.stringify(ecarts));
console.log('Fourchette « 85 000 - 95 000 FCFA » :', JSON.stringify(parsePrixPlage('85 000 - 95 000 FCFA')));
process.exit(ecarts.length ? 1 : 0);
