const H = require('./bot-harness.js'); const S = require('../.local/offline-state.json');
(async () => {
  const c = '221770009992';
  await H.dire(c, { type: 'order', order: { catalog_id: 'x', product_items: [ { product_retailer_id: 'nopalou-produit-' + S.prod.A.id, quantity: 2, item_price: 1, currency: 'XOF' }, { product_retailer_id: 'nopalou-produit-' + S.prod.B.id, quantity: 1, item_price: 1, currency: 'XOF' } ] } }, 'B3 panier natif WhatsApp');
  await H.dire(c, H.choix('f_retrait_cash', 'Retrait'), 'B4 formule retrait / espèces');
  await H.dire(c, H.bouton('cmd_confirmer', 'Confirmer'), 'B5 confirmation de la commande');
  const db = await H.pool.query("SELECT reference, client_nom, client_telephone, client_adresse, nom_produit, quantite, prix_unitaire, frais_livraison, montant_total, statut, methode_paiement, source, note FROM commandes_boutique WHERE client_telephone LIKE '%770009992' ORDER BY created_at DESC LIMIT 3");
  console.log('\nBASE commandes_boutique :', JSON.stringify(db.rows, null, 1));
  const it = await H.pool.query("SELECT i.* FROM commandes_boutique_items i JOIN commandes_boutique c ON c.id = i.commande_id WHERE c.client_telephone LIKE '%770009992' ORDER BY i.id").catch(e => ({ rows: ['ERR ' + e.message] }));
  console.log('BASE lignes :', JSON.stringify(it.rows, null, 1));
  const st = await H.pool.query("SELECT nom, stock_quantite FROM boutique_produits WHERE id = ANY($1::uuid[])", [[S.prod.A.id, S.prod.B.id]]); console.log('STOCK :', JSON.stringify(st.rows));
  await H.pool.end(); process.exit(0);
})().catch(e => { console.error('ERREUR', e); process.exit(1); });
