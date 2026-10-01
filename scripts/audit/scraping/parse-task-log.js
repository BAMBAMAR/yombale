// Statistiques des exécutions réelles de la tâche planifiée Windows (logs/scraper-task.log, UTF-16).
// Usage : node scripts/audit/scraping/parse-task-log.js [chemin-du-log]
// Lecture seule : aucun accès réseau ni base.
const fs = require('fs');
const path = require('path');
const fichier = process.argv[2] || path.resolve(__dirname, '../../../logs/scraper-task.log');
// Le journal mélange de l'ASCII et de l'UTF-16LE (redirections PowerShell) : on retire les octets nuls
// puis on lit en latin1, avec des motifs tolérants pour les caractères accentués ou typographiques.
const buf = fs.readFileSync(fichier);
const texte = Buffer.from(buf.filter(x => x !== 0)).toString('latin1');
const L = texte.split(/\r?\n/);
const runs = [];
for (let i = 0; i < L.length; i++) {
  const l = L[i]; let m;
  if ((m = l.match(/Termin.{1,8}scrapes: (\d+), retenus: (\d+), doublons: (\d+), ignor.{1,3}s: (\d+), erreurs: (\d+)/))) {
    runs.push({ type: 'fb', scrapes: +m[1], retenus: +m[2], doublons: +m[3], ignores: +m[4], erreurs: +m[5] });
  }
  if (/\[PHASE 2\/2\] OK \(code 0\)/.test(l)) runs.push({ type: 'phase2ok' });
  if (/\[PHASE 1\/2\] OK \(code 0\)/.test(l)) runs.push({ type: 'phase1ok' });
  if ((m = l.match(/Annonces publiques cr.{1,3}es : (\d+)/))) runs.push({ type: 'omni', annonces: +m[1] });
  if (/erreur fatale/.test(l)) runs.push({ type: 'fatal', msg: l.trim().slice(0, 140) });
}
const fb = runs.filter(r => r.type === 'fb');
const sum = k => fb.reduce((s, r) => s + r[k], 0);
const utiles = fb.filter(r => r.scrapes > 0 && r.retenus > 0);
const somme = (a, k) => a.reduce((s, r) => s + r[k], 0);
console.log('runs Facebook :', fb.length, '| scrapes', sum('scrapes'), 'retenus', sum('retenus'), 'doublons', sum('doublons'), 'ignorés', sum('ignores'), 'erreurs', sum('erreurs'));
console.log('runs à 0 post (session invalide) :', fb.filter(r => r.scrapes === 0).length, '| mentions "Session Facebook invalidée" :', (texte.match(/Session Facebook invalid/g) || []).length);
console.log('runs avec posts lus mais 0 retenu (persistance en échec) :', fb.filter(r => r.scrapes > 0 && r.retenus === 0).map(r => `scrapes=${r.scrapes} erreurs=${r.erreurs}`));
console.log('runs utiles :', utiles.length, '| scrapes/run', (somme(utiles, 'scrapes') / utiles.length).toFixed(1), '| retenus/run', (somme(utiles, 'retenus') / utiles.length).toFixed(1),
  '| retenus/scrapes', (100 * somme(utiles, 'retenus') / somme(utiles, 'scrapes')).toFixed(1) + '%', '| ignorés/scrapes', (100 * somme(utiles, 'ignores') / somme(utiles, 'scrapes')).toFixed(1) + '%');
const om = runs.filter(r => r.type === 'omni');
console.log('runs omnisource :', om.length, '| annonces créées au total :', om.reduce((s, r) => s + r.annonces, 0), '| runs à 0 annonce :', om.filter(r => r.annonces === 0).length);
console.log('phases 1 et 2 déclarées "OK (code 0)" :', runs.filter(r => r.type === 'phase1ok').length, '/', runs.filter(r => r.type === 'phase2ok').length);
console.log('erreurs fatales :', runs.filter(r => r.type === 'fatal').map(r => r.msg));
