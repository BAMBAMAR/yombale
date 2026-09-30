const { j, db, load, save } = require('./lib');
(async () => {
  const S = load(); const M = S.M, P = S.prod; const c = await db(); const out = {};
  const cols = (await c.query("select column_name from information_schema.columns where table_name='boutique_caissiers'")).rows.map(r => r.column_name);
  out.cols = cols.join(',');
  await c.query("INSERT INTO boutique_caissiers (boutique_id, nom, prenom, code_pin, actif) VALUES ($1,'Caissier','Test','9876',true)", [M.boutique.id]).catch(e => { out.insErr = e.message; });
  // abonnement POS requis : la boutique d'essai doit etre autorisee
  const codes = {}; let trouve = null;
  for (let i = 0; i < 120; i++) {
    const pin = String(9700 + i); // contient 9876 a l'essai i = 176 ? non : on cible 9876 a la fin
    const r = await j('POST', `/api/boutiques/${M.boutique.id}/pos-vente`, { items: [{ produit_id: P.P2.id, quantite: 1, prix_unitaire: 1 }], modePaiement: 'especes', superviseur_pin: pin });
    codes[r.s] = (codes[r.s] || 0) + 1;
  }
  const ok = await j('POST', `/api/boutiques/${M.boutique.id}/pos-vente`, { items: [{ produit_id: P.P2.id, quantite: 1, prix_unitaire: 1 }], modePaiement: 'especes', superviseur_pin: '9876' });
  out.pin = { essais_faux: codes, essai_correct_apres: { http: ok.s, d: JSON.stringify(ok.d).slice(0, 200) } };
  const pm = require('fs').readFileSync(require('path').join(__dirname,'../../../backend/models/db.js'), 'utf8').match(/max\s*:\s*[^,\n]+/);
  out.pool_max = pm && pm[0];
  console.log(JSON.stringify(out, null, 1)); await c.end();
})();
