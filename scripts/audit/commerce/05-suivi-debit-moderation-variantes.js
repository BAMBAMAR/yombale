const { j, db, load, save } = require('./lib');
(async () => {
  const S = load(); const M = S.M, N = S.N, P = S.prod; const c = await db(); const out = {};
  const cli = { client_nom: 'Client T3', client_telephone: '770007777' };

  // T7b : preuve inter-boutiques du suivi public avec joker
  const rN = await j('POST', `/api/comptabilite/${N.boutique.id}/commandes`, { ...cli, items: [{ produit_id: P.PN.id, quantite: 1 }], methode_paiement: 'cash' });
  const refN = rN.d.commande.reference;
  await c.query("UPDATE commandes_boutique SET reference = 'CMD-20260930-N0B0D1' WHERE reference=$1", [refN]);
  const s = await j('GET', '/api/boutiques/commandes/suivi?ref=' + encodeURIComponent('CMD-20260930-N0B%'));
  out.T7b_suivi_joker_inter_boutique = { http: s.s, n: s.d.commandes && s.d.commandes.length, exemple: s.d.commandes && s.d.commandes.map(x => ({ ref: x.reference, produit: x.nom_produit, montant: x.montant_total, boutique: x.boutique_nom, statut: x.statut })) , appartient: 'boutique N, jamais mentionnee dans la requete' };

  // T8 : limitation de debit sur la creation de commande (panier reel), 60 requetes rafale
  const codes = {};
  const reqs = Array.from({ length: 60 }, (_, i) => j('POST', `/api/comptabilite/${M.boutique.id}/commandes`, { client_nom: 'Spam ' + i, client_telephone: '77000' + String(1000 + i), nom_produit: 'x', prix_unitaire: 1, items: [{ produit_id: P.P2.id, quantite: 1 }], methode_paiement: 'cash' }));
  (await Promise.all(reqs)).forEach(r => { codes[r.s] = (codes[r.s] || 0) + 1; });
  out.T8_rafale_60_commandes_anonymes = codes;
  const nb = (await c.query("select count(*) from commandes_boutique where boutique_id=$1 and client_nom like 'Spam %'", [M.boutique.id])).rows[0].count;
  out.T8_commandes_creees = nb;

  // T10 : POS sans session : forcer le code PIN superviseur (40 essais faux)
  const pcodes = {};
  for (let i = 0; i < 40; i++) {
    const r = await j('POST', `/api/boutiques/${M.boutique.id}/pos-vente`, { items: [{ produit_id: P.P2.id, quantite: 1, prix_unitaire: 1 }], modePaiement: 'especes', superviseur_pin: String(1000 + i) });
    pcodes[r.s] = (pcodes[r.s] || 0) + 1;
  }
  out.T10_pos_pin_40_essais = pcodes;

  // T11 : produit suspendu par moderation : visible et commandable publiquement ?
  await c.query("UPDATE boutique_produits SET statut_moderation='suspendu', motif_moderation='test audit' WHERE id=$1", [P.P2.id]);
  await c.query('DELETE FROM commandes_boutique WHERE boutique_id=$1 AND client_nom like $2', [M.boutique.id, 'Spam %']);
  await c.query('UPDATE boutique_produits SET stock_quantite=10 WHERE id=$1', [P.P2.id]);
  const cat = await j('GET', `/api/boutiques/${M.boutique.id}/produits`);
  const vis = (cat.d.produits || []).find(p => p.id === P.P2.id);
  out.T11_catalogue_public_produit_suspendu = { http: cat.s, visible: !!vis, statut_moderation: vis && vis.statut_moderation };
  const o = await j('POST', '/api/boutiques/commandes/express', { boutique_id: M.boutique.id, ...cli, methode_paiement: 'cash', articles: [{ produit_id: P.P2.id, quantite: 1 }] });
  out.T11_commande_produit_suspendu = { http: o.s, ref: o.d.reference };
  await c.query("UPDATE boutique_produits SET statut_moderation='actif', motif_moderation=NULL WHERE id=$1", [P.P2.id]);

  // T12 : PUT partiel : la description disparait ; stock ecrase par valeur perimee
  const d0 = await j('PUT', `/api/boutiques/${M.boutique.id}/produits/${P.P2.id}`, { nom: 'P2 stock10', prix: 2000, stock_quantite: 10, description: 'Description importante' }, M.token);
  const d1 = await j('PUT', `/api/boutiques/${M.boutique.id}/produits/${P.P2.id}`, { prix: 2100 }, M.token);
  const rowp = (await c.query('select nom,description,prix,stock_quantite,en_stock from boutique_produits where id=$1', [P.P2.id])).rows[0];
  out.T12_put_partiel = { http: [d0.s, d1.s], apres: rowp };
  // stock perime : une commande arrive pendant que le marchand edite la fiche
  await j('POST', '/api/boutiques/commandes/express', { boutique_id: M.boutique.id, ...cli, methode_paiement: 'cash', articles: [{ produit_id: P.P2.id, quantite: 4 }] });
  const apresCmd = (await c.query('select stock_quantite from boutique_produits where id=$1', [P.P2.id])).rows[0].stock_quantite;
  await j('PUT', `/api/boutiques/${M.boutique.id}/produits/${P.P2.id}`, { nom: 'P2 stock10', prix: 2100, stock_quantite: 10, description: 'x' }, M.token);
  out.T12b_stock_ecrase = { stockApresCommande: apresCmd, stockApresEnregistrementFicheObsolete: (await c.query('select stock_quantite from boutique_produits where id=$1', [P.P2.id])).rows[0].stock_quantite };

  // T13 : variantes : le prix de la variante est-il pris en compte ?
  const v = await j('POST', `/api/boutiques/${M.boutique.id}/produits`, { nom: 'P5 variantes', prix: 1000, variantes_skus: JSON.stringify([{ sku: 'XL', attributs: { taille: 'XL' }, prix: 5000, stock_quantite: 2 }]) }, M.token);
  const vr = (await c.query('select id from boutique_produit_variantes where produit_id=$1', [v.d.produit.id])).rows[0];
  const ov = await j('POST', `/api/comptabilite/${M.boutique.id}/commandes`, { ...cli, items: [{ produit_id: v.d.produit.id, variante_id: vr.id, quantite: 1 }], methode_paiement: 'cash' });
  const ox = await j('POST', '/api/boutiques/commandes/express', { boutique_id: M.boutique.id, ...cli, methode_paiement: 'cash', articles: [{ produit_id: v.d.produit.id, variante_id: vr.id, quantite: 1 }] });
  out.T13_variante_prix5000 = { panier_total: ov.d.commande && ov.d.commande.montant_total, express_total: ox.d.montant_total, stockVariante: (await c.query('select stock_quantite from boutique_produit_variantes where id=$1', [vr.id])).rows[0].stock_quantite };

  // T14 : suppression d'un produit ayant des commandes ouvertes, puis annulation
  const od = await j('POST', `/api/comptabilite/${M.boutique.id}/commandes`, { ...cli, items: [{ produit_id: P.P1.id, quantite: 1 }], methode_paiement: 'cash' });
  const del = await j('DELETE', `/api/boutiques/${M.boutique.id}/produits/${P.P1.id}`, null, M.token);
  const after = (await c.query('select produit_id, nom_produit, statut from commandes_boutique where id=$1', [od.d.commande && od.d.commande.id])).rows[0];
  out.T14_suppression_produit_commande_ouverte = { http: del.s, commande: after };

  console.log(JSON.stringify(out, null, 1)); S.out3 = out; save(S); await c.end();
})();
