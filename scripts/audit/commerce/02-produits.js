const { j, db, load, save } = require('./lib');
(async () => {
  const S = load(); const M = S.M, N = S.N; const c = await db();
  const mk = async (who, body) => { const r = await j('POST', `/api/boutiques/${who.boutique.id}/produits`, body, who.token); return { s: r.s, id: r.d.produit && r.d.produit.id, err: r.s >= 300 ? r.d : undefined }; };
  S.prod = {};
  S.prod.P1 = await mk(M, { nom: 'P1 stock1', prix: 1000, stock_quantite: 1 });
  S.prod.P2 = await mk(M, { nom: 'P2 stock10', prix: 2000, stock_quantite: 10 });
  S.prod.P3 = await mk(M, { nom: 'P3 horsvente', prix: 500, en_stock: 'false' });
  S.prod.P4 = await mk(M, { nom: 'P4 prixnull' });
  S.prod.PN = await mk(N, { nom: 'PN autre boutique', prix: 3000, stock_quantite: 5 });
  // zone de livraison 2500 F sur M
  const z = await j('POST', `/api/comptabilite/${M.boutique.id}/zones`, { nom: 'Zone P6', prix: 2500 }, M.token);
  S.zone = { s: z.s, d: z.d };
  // produit P3 : forcer en_stock=false sans stock_quantite (hors vente)
  await c.query('UPDATE boutique_produits SET en_stock=false, stock_quantite=NULL WHERE id=$1', [S.prod.P3.id]);
  const r = await c.query('SELECT nom,prix,stock_quantite,en_stock FROM boutique_produits WHERE boutique_id IN ($1,$2) ORDER BY nom', [M.boutique.id, N.boutique.id]);
  console.log(JSON.stringify(S.prod), JSON.stringify(S.zone)); console.table(r.rows);
  save(S); await c.end();
})();
