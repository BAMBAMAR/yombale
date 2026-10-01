// Harnais n°2 : immobilier (expat, coinafrique, miroir Facebook) — faux sites + copie locale
const R = require('path').resolve(__dirname, '../../../') + '/';
if (!/nopalou_scrap_audit$/.test(process.env.DATABASE_URL || '')) { console.error('REFUS : DATABASE_URL doit viser la copie nopalou_scrap_audit'); process.exit(2); }
const realST = global.setTimeout;
global.setTimeout = (f, ms, ...a) => realST(f, /backend[\\/]services[\\/]scraper/.test(new Error().stack.split('\n')[2] || '') ? 0 : ms, ...a);
const axios = require('axios');
const origLog = console.log, out = (...a) => origLog(...a);
console.log = () => {}; console.warn = () => {};
let requetes = []; let comportement;
axios.get = async (url) => { requetes.push(url); return comportement(url); };
axios.post = async () => { throw new Error('POST bloqué'); };
const mkErr = s => Object.assign(new Error('HTTP ' + s), { response: { status: s } });

(async () => {
  const { pool } = require(R + 'backend/models/db');
  const q = (s, p) => pool.query(s, p).then(r => r.rows);
  await new Promise(r => realST(r, 1500));

  // ── Pagination immo : faux Expat-Dakar 20 pages x 10 annonces par section
  const TOTAL = 20;
  comportement = (url) => {
    const m = url.match(/expat-dakar\.com(\/[^?]+)(?:\?page=(\d+))?/);
    const page = m && m[2] ? +m[2] : 1;
    if (page > TOTAL) return { data: '<html><body>fin</body></html>' };
    let h = '<html><body>';
    for (let i = 0; i < 10; i++) h += `<div class="listing-card"><a href="/annonce/x-${m[1].replace(/\W/g, '')}-p${page}-${i}-${100000 + page * 100 + i}">l</a><span class="listing-card__header__title">Appartement F3 ${m[1]} p${page} n${i}</span><span class="listing-card__info-bar__price">${150000 + i * 1000} FCFA</span><span class="listing-card__header__location">Mermoz, Dakar</span></div>`;
    return { data: h + '</body></html>' };
  };
  const expat = require(R + 'backend/services/scraper-immo-expat.js');
  requetes = [];
  const e = await expat.scraperImmo({ dryRun: true });
  out('I1 expat-immo pagination: pages demandées', requetes.length, '| annonces extraites', e.scrapes, '| théorique faux site = 8 sections x', TOTAL, 'pages x 10 =', 8 * TOTAL * 10, '| couverture', (100 * e.scrapes / (8 * TOTAL * 10)).toFixed(1) + '%');

  // ── Erreur HTTP 500 sur page 1 d'une section : traitée comme "page vide -> arrêt section", compteur d'erreur = 0
  comportement = () => { throw mkErr(500); };
  requetes = [];
  const e2 = await expat.scraperImmo({ dryRun: true });
  out('I2 expat-immo HTTP 500 partout: annonces', e2.scrapes, '| erreurs comptées', e2.erreurs.length, '| requêtes', requetes.length, '(1 par section, aucun retry)');

  // ── CoinAfrique immo : upsert d'une annonce existante sans téléphone (cas de TOUS les scrapes, car extraireContactDetail n'est jamais appelé)
  const coin = require(R + 'backend/services/scraper-immo-coinafrique.js');
  const ex = (await q(`SELECT id, titre, ref_externe, url_source, prix, actif, rejete, contact_tel, type_bien, transaction, ville, quartier FROM annonces_immo WHERE source='coinafrique' AND actif AND NOT rejete AND prix>=10000 ORDER BY id LIMIT 1`))[0];
  const nActifAvant = +(await q(`SELECT count(*) n FROM annonces_immo WHERE source='coinafrique' AND actif`))[0].n;
  await coin.upsertAnnonce({ titre: ex.titre, type_bien: ex.type_bien, transaction: ex.transaction, prix: Number(ex.prix), ville: ex.ville, quartier: ex.quartier, photos: [], url_source: ex.url_source, source: 'coinafrique', ref_externe: ex.ref_externe, meuble: false, nb_pieces: null });
  const apres = (await q(`SELECT actif, rejete, motif_rejet FROM annonces_immo WHERE id=$1`, [ex.id]))[0];
  const nActifApres = +(await q(`SELECT count(*) n FROM annonces_immo WHERE source='coinafrique' AND actif`))[0].n;
  out('I3 coinafrique-immo re-scrape (sans téléphone, comme le code le fait): avant actif=' + ex.actif + ' rejete=' + ex.rejete + ' | après', JSON.stringify(apres), '| actives coinafrique', nActifAvant, '->', nActifApres);

  // ── Expat immo : réactivation d'une annonce rejetée
  const rej = (await q(`SELECT id, titre, ref_externe, url_source, prix, ville, quartier FROM annonces_immo WHERE source='expat-dakar' LIMIT 1`))[0];
  await pool.query(`UPDATE annonces_immo SET actif=false, rejete=true, motif_rejet='Faux immo (test)' WHERE id=$1`, [rej.id]);
  await expat.upsertAnnonce({ titre: rej.titre, type_bien: 'appartement', transaction: 'location', prix: Number(rej.prix), ville: rej.ville, quartier: rej.quartier, photos: [], url_source: rej.url_source, source: 'expat-dakar', ref_externe: rej.ref_externe, meuble: false });
  const a2 = (await q(`SELECT actif, rejete, motif_rejet FROM annonces_immo WHERE id=$1`, [rej.id]))[0];
  out('I4 expat-immo: annonce rejetée par la modération puis re-scrapée ->', JSON.stringify(a2), '(actif=true ET rejete=true = état contradictoire ; les consommateurs qui ne filtrent que sur actif la comptent : tableau de bord admin, facettes immo)');

  // ── Miroir Facebook -> annonces_immo : transaction "à vendre"
  const fb = require(R + 'backend/services/scraper-immo-facebook.js');
  const tag = 'ZZFB' + Date.now();
  const cas = [
    ['Terrain à vendre 300m2 Keur Massar ' + tag + 'a', 'Vend terrain de 300 m2 titre foncier, 12 000 000 FCFA, appelez 77 123 45 67'],
    ['Villa a vendre Almadies ' + tag + 'b', 'Villa 5 chambres à vendre, 150 000 000 FCFA'],
    ['Appartement à louer Mermoz ' + tag + 'c', 'F3 à louer 250 000 FCFA par mois'],
    ['Vente appartement Ngor ' + tag + 'd', 'Vente appartement F4 Ngor 45 000 000 FCFA'],
  ];
  let i = 0;
  for (const [titre, desc] of cas) {
    i++;
    await fb.upsertAnnonceClassifiee({ categorie_slug: 'immo', titre, description: desc, prix: /(\d[\d ]+) FCFA/.test(desc) ? parseInt(desc.match(/(\d[\d ]+) FCFA/)[1].replace(/ /g, ''), 10) : 100000, ville: 'Dakar', contact_tel: '7712345' + (60 + i), contact_nom: 'Test', photos: [], caracteristiques: {}, source: 'facebook-group-test', ref_externe: 'fb-test-' + tag + i, url_source: 'https://www.facebook.com/groups/test/posts/' + tag + i });
  }
  const mir = await q(`SELECT titre, transaction, type_bien, quartier FROM annonces_immo WHERE ref_externe LIKE $1 ORDER BY ref_externe`, ['fb-test-' + tag + '%']);
  out('I5 miroir FB -> immo:', JSON.stringify(mir));

  await pool.end(); process.exit(0);
})().catch(e => { origLog('HARNAIS2 ERR', e); process.exit(1); });
