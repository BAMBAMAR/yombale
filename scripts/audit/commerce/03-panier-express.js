const { j, db, load, save } = require('./lib');
(async () => {
  const S = load(); const M = S.M, N = S.N, P = S.prod; const c = await db(); const out = {};
  const stock = async (id) => (await c.query('SELECT stock_quantite, en_stock FROM boutique_produits WHERE id=$1', [id])).rows[0];
  const cmd = async (ref) => (await c.query('SELECT reference,statut,montant_total,prix_unitaire,quantite,frais_livraison,methode_paiement,paiement_recu FROM commandes_boutique WHERE reference=$1', [ref])).rows[0];
  const cli = { client_nom: 'Client Test', client_telephone: '770009999' };
  const PAN = `/api/comptabilite/${M.boutique.id}/commandes`;

  // T1 : surconsommation de stock sur la route du panier reel (stock P1 = 1)
  let r = await j('POST', PAN, { ...cli, items: [{ produit_id: P.P1.id, quantite: 5 }], methode_paiement: 'cash' });
  out.T1 = { http: r.s, ref: r.d.commande && r.d.commande.reference, total: r.d.commande && r.d.commande.montant_total, stockApres: await stock(P.P1.id) };

  // T1b : meme demande sur la route express (reference : doit etre refusee 409)
  r = await j('POST', '/api/boutiques/commandes/express', { boutique_id: M.boutique.id, ...cli, methode_paiement: 'cash', articles: [{ produit_id: P.P2.id, quantite: 50 }] });
  out.T1b_express_surstock = { http: r.s, d: r.d.error || r.d.reference };

  // T2 : article libre (sans produit_id) a 1 FCFA sur la route du panier
  r = await j('POST', PAN, { ...cli, items: [{ nom_produit: 'Article libre', prix_unitaire: 1, quantite: 1 }], methode_paiement: 'cash' });
  out.T2_libre = { http: r.s, total: r.d.commande && r.d.commande.montant_total, ref: r.d.commande && r.d.commande.reference };
  // T2b : produit d'une autre boutique (PN, vrai prix 3000) envoye a 1 FCFA
  r = await j('POST', PAN, { ...cli, items: [{ produit_id: P.PN.id, nom_produit: 'PN', prix_unitaire: 1, quantite: 1 }], methode_paiement: 'cash' });
  out.T2b_autre_boutique = { http: r.s, total: r.d.commande && r.d.commande.montant_total, stockPN: await stock(P.PN.id) };
  // T2c : prix du produit legitime (P2 = 2000) envoye a 1 FCFA (doit etre re-tarife)
  r = await j('POST', PAN, { ...cli, items: [{ produit_id: P.P2.id, prix_unitaire: 1, quantite: 1 }], methode_paiement: 'cash' });
  out.T2c_prix_serveur = { http: r.s, total: r.d.commande && r.d.commande.montant_total };

  // T5 : produit hors vente (P3) et produit sans prix (P4) sur les deux routes
  r = await j('POST', PAN, { ...cli, items: [{ produit_id: P.P3.id, quantite: 1 }], methode_paiement: 'cash' });
  out.T5_panier_horsvente = { http: r.s, total: r.d.commande && r.d.commande.montant_total };
  r = await j('POST', '/api/boutiques/commandes/express', { boutique_id: M.boutique.id, ...cli, methode_paiement: 'cash', articles: [{ produit_id: P.P3.id, quantite: 1 }] });
  out.T5_express_horsvente = { http: r.s, ref: r.d.reference, total: r.d.montant_total, err: r.d.error };
  r = await j('POST', '/api/boutiques/commandes/express', { boutique_id: M.boutique.id, ...cli, methode_paiement: 'cash', articles: [{ produit_id: P.P4.id, quantite: 1 }] });
  out.T5_express_sansprix = { http: r.s, ref: r.d.reference, total: r.d.montant_total, err: r.d.error };

  // T3 : frais de livraison fixe par le client sur express (zone reelle 2500 F, aucun lien serveur)
  r = await j('POST', '/api/boutiques/commandes/express', { boutique_id: M.boutique.id, ...cli, methode_paiement: 'cash', frais_livraison: 0, client_adresse: 'Keur Massar', articles: [{ produit_id: P.P2.id, quantite: 1 }] });
  out.T3_express_frais0 = { http: r.s, total: r.d.montant_total, zoneReelle: 2500 };
  // T3b : panier reel : zone_livraison_id valide et frais_livraison=0 dans le corps (frais recalcules serveur ?)
  r = await j('POST', PAN, { ...cli, items: [{ produit_id: P.P2.id, quantite: 1 }], methode_paiement: 'cash', zone_livraison_id: S.zone.d.id, frais_livraison: 0 });
  out.T3b_panier_zone = { http: r.s, total: r.d.commande && r.d.commande.montant_total, frais: r.d.commande && r.d.commande.frais_livraison };

  // T9 : echec Wave sur le panier reel (reseau bloque par la garde) : reponse et etat
  r = await j('POST', PAN, { ...cli, items: [{ produit_id: P.P2.id, quantite: 2 }], methode_paiement: 'wave' });
  out.T9_wave_echec = { http: r.s, fallback: r.d.fallback_manuel, numero_depot: r.d.numero_depot, ref: r.d.commande && r.d.commande.reference, statut: r.d.commande && r.d.commande.statut, stockP2: await stock(P.P2.id) };

  console.log(JSON.stringify(out, null, 1)); S.out1 = out; save(S); await c.end();
})();
