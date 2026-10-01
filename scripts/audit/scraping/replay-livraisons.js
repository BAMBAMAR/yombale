// Harnais n°3 : rejeu des correctifs déjà livrés (recoupement) — copie locale uniquement
const R = require('path').resolve(__dirname, '../../../') + '/';
if (!/nopalou_scrap_audit$/.test(process.env.DATABASE_URL || '')) { console.error('REFUS'); process.exit(2); }
const realST = global.setTimeout;
global.setTimeout = (f, ms, ...a) => realST(f, /backend[\\/]services[\\/]scraper/.test(new Error().stack.split('\n')[2] || '') ? 0 : ms, ...a);
const axios = require('axios');
const origLog = console.log, out = (...a) => origLog(...a);
console.log = () => {}; console.warn = () => {}; console.error = () => {};
let comportement; const reqs = [];
axios.get = async (url, cfg) => { reqs.push(url); return comportement(url, cfg); };
(async () => {
  const sc = require(R + 'backend/services/scraper.js');
  const { pool } = require(R + 'backend/models/db');
  const q = (s, p) => pool.query(s, p).then(r => r.rows);
  await new Promise(r => realST(r, 1500));

  // R1 : idempotence (e8113d0f) — rejouer deux fois le même lot, aucun produit/offre ne doit apparaître au 2e passage
  const tag = 'ZZIDEM' + Date.now();
  const lot = Array.from({ length: 20 }, (_, i) => ({ titre: `Article test unique ${tag} modele${i} gamma${i}`, prix: 20000 + i * 1000, url: `https://www.jumia.sn/${tag}-${i}.html`, image_url: null }));
  const c0 = await q('SELECT (SELECT count(*) FROM produits) p, (SELECT count(*) FROM offres) o');
  const s1 = await sc.sauvegarderProduits(lot, 'Jumia Senegal', 'x');
  const c1 = await q('SELECT (SELECT count(*) FROM produits) p, (SELECT count(*) FROM offres) o');
  const s2 = await sc.sauvegarderProduits(lot, 'Jumia Senegal', 'x');
  const c2 = await q('SELECT (SELECT count(*) FROM produits) p, (SELECT count(*) FROM offres) o');
  out('R1 idempotence: passe1', JSON.stringify(s1), '(+' + (c1[0].p - c0[0].p) + ' produits, +' + (c1[0].o - c0[0].o) + ' offres) | passe2', JSON.stringify(s2), '(+' + (c2[0].p - c1[0].p) + ' produits, +' + (c2[0].o - c1[0].o) + ' offres)');
  const h = await q(`SELECT count(*) n FROM historique_prix h JOIN offres o ON o.id=h.offre_id WHERE o.titre_marchand LIKE $1`, ['%' + tag + '%']);
  out('R1b historique_prix: lignes pour 20 offres inchangées après 2 passes =', h[0].n, '(attendu 20 si pas de bruit)');

  // R2 : filtres d'entrée (S-001 plafond 20M, S-007 URL absente)
  const f = await sc.sauvegarderProduits([
    { titre: 'Produit aberrant 25M ' + tag, prix: 25000000, url: 'https://x.sn/a.html' },
    { titre: 'Produit sans URL ' + tag, prix: 50000, url: '' },
    { titre: 'Produit URL relative ' + tag, prix: 50000, url: '/produit/abc' },
    { titre: 'Produit prix 400 ' + tag, prix: 400, url: 'https://x.sn/b.html' },
  ], 'Jumia Senegal', 'x');
  out('R2 filtres d\'entrée:', JSON.stringify(f), '(attendu filtres=4)');

  // R3 : offreEstMorte (27699f76) — 6 cas simulés
  const mk = (status, body, finalUrl) => ({ status, data: body, request: { res: { responseUrl: finalUrl } } });
  const cas = [
    ['404', () => mk(404, '', 'https://www.jumia.sn/x.html'), true],
    ['410', () => mk(410, '', 'https://www.jumia.sn/x.html'), true],
    ['jumia redirigé vers /catalog/', () => mk(200, '<html>', 'https://www.jumia.sn/catalog/?q=x'), true],
    ['texte "n\'est plus disponible"', () => mk(200, "<html>Ce produit n'est plus disponible</html>", 'https://www.jumia.sn/x.html'), true],
    ['403 Cloudflare (vivant mais bloqué)', () => mk(403, 'Just a moment', 'https://www.jumia.sn/x.html'), false],
    ['200 normal', () => mk(200, '<html>Acheter</html>', 'https://www.jumia.sn/x.html'), false],
    ['429 limite de débit', () => mk(429, 'Too many', 'https://www.jumia.sn/x.html'), false],
    ['200 produit vivant mais "page introuvable" dans le gabarit (faux positif ?)', () => mk(200, '<html><nav>... 404 page introuvable ...</nav><h1>Samsung A15</h1></html>', 'https://www.jumia.sn/x.html'), false],
  ];
  const res = [];
  for (const [nom, fn, attendu] of cas) { comportement = async () => fn(); const v = await sc.offreEstMorte('https://www.jumia.sn/x.html'); res.push(`${nom}: ${v} (attendu ${attendu})${v === attendu ? '' : ' <== ÉCART'}`); }
  out('R3 offreEstMorte:\n  ' + res.join('\n  '));

  // R4 : destockage 45 j (S-008) — effet sur la copie (âges calculés à NOW(), donc +7 j par rapport à T0)
  const avant = await q('SELECT count(*) FILTER (WHERE stock) en_stock, count(*) FILTER (WHERE stock AND NOT quarantinee) visibles FROM offres');
  const r4 = await sc.destockerOffresObsoletes(45);
  const apres = await q('SELECT count(*) FILTER (WHERE stock) en_stock, count(*) FILTER (WHERE stock AND NOT quarantinee) visibles FROM offres');
  const parM = await q(`SELECT m.nom, count(*) FILTER (WHERE NOT o.stock) destockees, count(*) n FROM offres o JOIN marchands m ON m.id=o.marchand_id GROUP BY 1 HAVING count(*) FILTER (WHERE NOT o.stock)>0 ORDER BY 2 DESC LIMIT 6`);
  out('R4 destockage 45j: destockées', r4.destockees, '| en_stock', avant[0].en_stock, '->', apres[0].en_stock, '| par marchand', JSON.stringify(parM));
  await pool.end(); process.exit(0);
})().catch(e => { origLog('H3 ERR', e); process.exit(1); });
