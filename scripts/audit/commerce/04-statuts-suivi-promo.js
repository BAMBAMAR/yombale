const { j, db, load, save } = require('./lib'); const fs = require('fs');
(async () => {
  const S = load(); const M = S.M, P = S.prod; const c = await db(); const out = {};
  const stock = async (id) => Number((await c.query('SELECT stock_quantite FROM boutique_produits WHERE id=$1', [id])).rows[0].stock_quantite);
  const cli = { client_nom: 'Client Test', client_telephone: '770008888' };
  const PAN = `/api/comptabilite/${M.boutique.id}/commandes`;
  const patch = (id, body) => j('PATCH', `/api/comptabilite/${M.boutique.id}/commandes/${id}`, body, M.token);

  // T6 : cycle de statuts annulee -> confirmee -> annulee (stock restitue plusieurs fois, jamais redecremente)
  await c.query('UPDATE boutique_produits SET stock_quantite=10, en_stock=true WHERE id=$1', [P.P2.id]);
  let r = await j('POST', PAN, { ...cli, items: [{ produit_id: P.P2.id, quantite: 3 }], methode_paiement: 'cash' });
  const id = r.d.commande.id; const seq = [{ etape: 'apres commande 3u', stock: await stock(P.P2.id) }];
  for (const st of ['annulee', 'confirmee', 'annulee', 'livree', 'en_attente']) {
    const p = await patch(id, { statut: st }); seq.push({ etape: 'PATCH ' + st, http: p.s, stock: await stock(P.P2.id) });
  }
  out.T6_cycle_statuts = seq;

  // T6c : frais modifies apres paiement recu
  r = await j('POST', PAN, { ...cli, items: [{ produit_id: P.P2.id, quantite: 1 }], methode_paiement: 'wave' });
  const id2 = r.d.commande.id; await c.query("UPDATE commandes_boutique SET paiement_recu=true, statut='payee' WHERE id=$1", [id2]);
  const p2 = await patch(id2, { frais_livraison: 9000 });
  out.T6c_frais_apres_paiement = { http: p2.s, montant_apres: p2.d.commande ? p2.d.commande.montant_total : p2.d, paiement_recu: p2.d.commande && p2.d.commande.paiement_recu };
  const p3 = await patch(id2, { statut: 'annulee' });
  out.T6d_annuler_commande_payee = { http: p3.s, statut: p3.d.commande && p3.d.commande.statut, paiement_recu: p3.d.commande && p3.d.commande.paiement_recu };
  const p4 = await patch(id2, { statut: 'payee' });
  out.T6e_statut_payee_via_patch = { http: p4.s, err: p4.d.error };

  // T7 : suivi public avec jokers
  for (const q of ['CMD-%', 'C-%', 'CMD-2026%']) {
    const s = await j('GET', '/api/boutiques/commandes/suivi?ref=' + encodeURIComponent(q));
    out['T7_suivi_' + q] = { http: s.s, n: s.d.commandes && s.d.commandes.length, exemple: s.d.commandes && s.d.commandes.slice(0, 2).map(x => ({ ref: x.reference, produit: x.nom_produit, montant: x.montant_total, boutique: x.boutique_nom, statut: x.statut, tel: x.client_telephone })) };
  }
  // reference exacte d'une autre boutique, sans aucune preuve de propriete
  const rr = await c.query("select reference from commandes_boutique where boutique_id=$1 limit 1", [S.N.boutique.id]);
  out.T7_rows_boutique_N = rr.rowCount;

  // T4 : promo livraison_offerte (2500) : panier reel vs express
  await c.query("INSERT INTO boutique_promotions (boutique_id, code, type_remise, valeur, actif) VALUES ($1,'LIVROFF','livraison_offerte',2500,true) ON CONFLICT DO NOTHING", [M.boutique.id]);
  r = await j('POST', PAN, { ...cli, items: [{ produit_id: P.P2.id, quantite: 1 }], methode_paiement: 'cash', zone_livraison_id: S.zone.d.id, code_promo: 'LIVROFF' });
  out.T4_panier = { http: r.s, total: r.d.commande && r.d.commande.montant_total, attendu: 2000 };
  r = await j('POST', '/api/boutiques/commandes/express', { boutique_id: M.boutique.id, ...cli, methode_paiement: 'cash', frais_livraison: 2500, code_promo: 'LIVROFF', articles: [{ produit_id: P.P2.id, quantite: 1 }] });
  out.T4_express = { http: r.s, total: r.d.montant_total, attendu: 2000 };

  console.log(JSON.stringify(out, null, 1)); S.out2 = out; save(S); await c.end();
})();
