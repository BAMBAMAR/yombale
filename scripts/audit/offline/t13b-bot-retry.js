const H = require('./bot-harness.js'); const S = require('../.local/offline-state.json');
(async () => {
  const c = '221770009993';
  const compter = async () => Number((await H.pool.query("SELECT count(*) n FROM commandes_boutique WHERE client_telephone LIKE '%770009993'")).rows[0].n);
  const stock = async () => (await H.pool.query("SELECT nom, stock_quantite FROM boutique_produits WHERE id = ANY($1::uuid[]) ORDER BY nom", [[S.prod.A.id, S.prod.B.id]])).rows.map(r => r.nom + '=' + r.stock_quantite).join(', ');
  console.log('stock avant :', await stock());
  await H.dire(c, { type: 'order', order: { catalog_id: 'x', product_items: [ { product_retailer_id: 'nopalou-produit-' + S.prod.A.id, quantity: 1 }, { product_retailer_id: 'nopalou-produit-' + S.prod.B.id, quantity: 1 } ] } }, 'panier 1x Robe + 1x Boubou');
  await H.dire(c, H.choix('f_retrait_cash', 'Retrait'), 'formule');
  await H.dire(c, H.bouton('cmd_confirmer', 'Confirmer'), 'confirmation n°1 (le client reçoit un message d\'erreur)');
  console.log('\nCOMMANDES en base après confirmation n°1 :', await compter(), '| stock :', await stock());
  await H.dire(c, H.bouton('cmd_confirmer', 'Confirmer'), 'le client réessaie : confirmation n°2');
  console.log('\nCOMMANDES en base après confirmation n°2 :', await compter(), '| stock :', await stock());
  await H.pool.end(); process.exit(0);
})().catch(e => { console.error('ERREUR', e); process.exit(1); });
