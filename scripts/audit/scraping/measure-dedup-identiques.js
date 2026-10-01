const R = require('path').resolve(__dirname, '../../../') + '/';
const { Client } = require('pg');
const m = require(R + 'backend/services/matching.js');
const url = process.env.DATABASE_URL.replace(/\/[^/]+$/, '/nopalou_audit_data');
(async () => {
  const c = new Client({ connectionString: url }); await c.connect(); await c.query('SET default_transaction_read_only=on');
  const { rows } = await c.query(`SELECT p.id, p.nom, array_agg(DISTINCT o.marchand_id) marchands, min(o.prix) prix FROM produits p JOIN offres o ON o.produit_id=p.id GROUP BY p.id`);
  const by = new Map();
  for (const r of rows) { const k = m.normaliserTitre(r.nom); if (!k) continue; if (!by.has(k)) by.set(k, []); by.get(k).push(r); }
  const g = [...by.values()].filter(a => a.length > 1);
  let memeMarchand = 0, marchandsDiff = 0, ratioRefuse = 0, fiches = 0, ficheSurplus = 0, memeMarchandFiches = 0;
  for (const a of g) {
    fiches += a.length; ficheSurplus += a.length - 1;
    const sets = a.map(x => x.marchands.join(','));
    const uniq = new Set(sets);
    const overlap = a.some((x, i) => a.some((y, j) => i < j && x.marchands.some(mm => y.marchands.includes(mm))));
    if (overlap) memeMarchand++; else marchandsDiff++;
    const prices = a.map(x => Number(x.prix)).filter(Boolean);
    const ratio = Math.max(...prices) / Math.min(...prices);
    if (ratio > 2.8) ratioRefuse++;
  }
  console.log('groupes de fiches a nom normalise identique:', g.length, '| fiches:', fiches, '| surplus:', ficheSurplus);
  console.log('  - partageant un meme marchand (deux annonces du meme marchand, fiches separees):', memeMarchand);
  console.log('  - marchands tous differents (jamais compares entre eux alors que meme titre):', marchandsDiff);
  console.log('  - ecart de prix > x2.8 entre fiches (verrou "ecart_prix_excessif" qui prime sur titre identique):', ratioRefuse);
  // titres tronques a 255 / entites html / noms courts parmi produits avec offres
  const ent = rows.filter(r => /&#?[a-z0-9]+;/i.test(r.nom)).length;
  const court = rows.filter(r => r.nom.trim().length < 8).length;
  console.log('produits avec offre dont le nom contient une entite HTML:', ent, '| nom < 8 caracteres:', court);
  await c.end();
})();
