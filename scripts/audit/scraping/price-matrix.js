// Matrice de normalisation des prix : même chaîne source, parseurs différents du dépôt
const fs = require('fs');
const R = require('path').resolve(__dirname, '../../../backend/services') + '/';
function source(fichier, nom) {
  const src = fs.readFileSync(R + fichier, 'utf8');
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('introuvable ' + nom + ' dans ' + fichier);
  let j = src.indexOf('{', i), d = 0, k = j;
  for (; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}') { d--; if (d === 0) break; } }
  return src.slice(i, k + 1);
}
function extraire(fichier, nom, dependances = {}) {
  return new Function(...Object.keys(dependances), 'return ' + source(fichier, nom))(...Object.values(dependances));
}
const purgerUnicodeStealthFB = extraire('scraper-immo-facebook.js', 'purgerUnicodeStealthFB');
const P = {
  'scraper.js nettoyerPrix': extraire('scraper.js', 'nettoyerPrix'),
  'new-sites nettoyerPrix': extraire('scraper-new-sites.js', 'nettoyerPrix'),
  'immo-expat parsePrix': extraire('scraper-immo-expat.js', 'parsePrix'),
  'immo-coin (parseInt digits)': t => { const v = parseInt(String(t).replace(/[^0-9]/g, ''), 10); return (v >= 10000 && v < 999000000) ? v : null; },
  'facebook parsePrixFB': extraire('scraper-immo-facebook.js', 'parsePrixFB', { purgerUnicodeStealthFB }),
  'omnisource extrairePrixTexte': t => require(R + 'omnisource-collector.js').extrairePrixTexte(t, 'smartphones'),
};
const cas = [
  ['1.500.000 FCFA', 1500000], ['1500000', 1500000], ['1 500 000 F', 1500000], ['1 500 000 FCFA', 1500000],
  ['1,5M', 1500000], ['1,5 million', 1500000], ['CFA 155,000', 155000], ['155 000 CFA', 155000],
  ['150 000,50 F', 150000], ['25.000', 25000], ['25.000 FCFA', 25000], ['2 500 F CFA', 2500], ['15k', 15000],
  ['350000/mois', 350000], ['Prix : 45 000 F', 45000], ['85 000 - 95 000 FCFA', 85000], ['1.250.000F', 1250000],
];
const out = [];
for (const [s, attendu] of cas) {
  const row = { entree: s, attendu };
  for (const [nom, f] of Object.entries(P)) {
    let v; try { v = f(s); } catch (e) { v = 'ERR'; }
    row[nom] = (v === null || v === 0 || v === undefined) ? '—' : v;
  }
  out.push(row);
}
const noms = Object.keys(P);
const verdict = {}; for (const n of noms) verdict[n] = { ok: 0, faux: 0, rejet: 0 };
for (const r of out) for (const n of noms) {
  if (r[n] === '—') verdict[n].rejet++; else if (r[n] === r.attendu) verdict[n].ok++; else verdict[n].faux++;
}
console.log(JSON.stringify(out, null, 0).replace(/\},\{/g, '},\n{'));
console.log('\nVERDICT (sur', cas.length, 'cas):'); console.log(JSON.stringify(verdict, null, 1));
