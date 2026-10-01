// Mesure de la déduplication produits (lecture seule, copie locale)
const R = require('path').resolve(__dirname, '../../../') + '/';
const { Client } = require('pg');
const m = require(R + 'backend/services/matching.js');
const url = process.env.DATABASE_URL.replace(/\/[^/]+$/, '/' + (process.env.AUDIT_DATA_DB || 'nopalou_audit_data'));
const unaccentLower = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
(async () => {
  const c = new Client({ connectionString: url }); await c.connect();
  await c.query('SET default_transaction_read_only=on');
  const { rows } = await c.query(`
    SELECT p.id, p.nom, p.marque, p.categorie_id, c.slug cat,
           count(o.id) offres, count(DISTINCT o.marchand_id) marchands, min(o.prix) prix
    FROM produits p JOIN offres o ON o.produit_id=p.id
    LEFT JOIN categories c ON c.id=p.categorie_id
    GROUP BY p.id, c.slug`);
  console.log('produits avec >=1 offre:', rows.length);
  // 1. Etape 3 du matching (titre exact) peut-elle se retrouver elle-même ?
  let selfOK = 0;
  for (const r of rows) {
    if (unaccentLower(r.nom) === m.normaliserTitre(r.nom)) selfOK++;
  }
  console.log('etape3_titre_exact: titres dont f_unaccent(lower(nom)) == normaliserTitre(nom):', selfOK, '/', rows.length,
    (100 * selfOK / rows.length).toFixed(1) + '%');
  // 2. Distribution marchands par produit
  const dist = {};
  for (const r of rows) { const k = Math.min(+r.marchands, 4); dist[k] = (dist[k] || 0) + 1; }
  console.log('marchands distincts par produit (4=4+):', JSON.stringify(dist));
  // 3. Clusters (marque|modele|stockage|ram) non fusionnés
  const clusters = new Map();
  let withKey = 0;
  for (const r of rows) {
    const marque = m.extraireMarque(r.nom); const modele = m.extraireModele(r.nom);
    if (!marque || !modele) continue;
    withKey++;
    const key = [marque.toLowerCase(), modele.toLowerCase().replace(/\+/g, 'plus'), m.extraireStockageGo(r.nom) || '', m.extraireRamGo(r.nom) || ''].join('|');
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key).push(r);
  }
  const multi = [...clusters.values()].filter(a => a.length > 1);
  console.log('produits avec cle marque+modele:', withKey, '| clusters:', clusters.size, '| clusters avec >1 fiche:', multi.length,
    '| fiches en surplus:', multi.reduce((s, a) => s + a.length - 1, 0));
  // 4. Parmi ces clusters, combien de paires l'algorithme sontMemeProduit refuse-t-il (et pourquoi)
  const raisons = {}; let paires = 0, matchOK = 0; const exemples = [];
  for (const a of multi) {
    for (let i = 1; i < a.length; i++) {
      const A = { titre: a[0].nom, prix: a[0].prix }, B = { titre: a[i].nom, prix: a[i].prix };
      const cmp = m.sontMemeProduit(A, B); paires++;
      if (cmp.match) matchOK++; else { raisons[cmp.raison] = (raisons[cmp.raison] || 0) + 1; if (exemples.length < 6) exemples.push([a[0].nom, a[i].nom, cmp.raison]); }
    }
  }
  console.log('paires testees:', paires, '| declarees identiques par sontMemeProduit:', matchOK, '| refusees:', paires - matchOK);
  console.log('raisons de refus:', JSON.stringify(raisons));
  console.log('exemples de refus:', JSON.stringify(exemples, null, 1));
  // 5. Doublons stricts : meme nom normalise, plusieurs fiches
  const byName = new Map();
  for (const r of rows) { const k = m.normaliserTitre(r.nom); if (!byName.has(k)) byName.set(k, []); byName.get(k).push(r); }
  const dupNames = [...byName.values()].filter(a => a.length > 1);
  console.log('fiches produit avec nom normalise identique (>1):', dupNames.length, 'groupes,', dupNames.reduce((s, a) => s + a.length - 1, 0), 'fiches en surplus');
  // 6. produits dont les offres viennent du même marchand (doublon intra-marchand)
  await c.end();
})();
