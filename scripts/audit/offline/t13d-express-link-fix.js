// AUD-100 : le lien « paiement 1-clic » n'est proposé que pour un panier d'un seul article, avec sa quantité.
const H = require('./bot-harness.js'); const S = require('../.local/offline-state.json');
const items = (...l) => ({ type: 'order', order: { catalog_id: 'x', product_items: l.map(([id, q]) => ({ product_retailer_id: 'nopalou-produit-' + id, quantity: q })) } });
(async () => {
  const lien = (out) => (out.map(o => o.contenu).join('\n').match(/checkout-express\?[^\s]+/) || [null])[0];
  const deux = await H.dire('221770009994', items([S.prod.A.id, 2], [S.prod.B.id, 1]), 'panier de 2 articles (55 000 FCFA)');
  const un = await H.dire('221770009995', items([S.prod.A.id, 3]), 'panier d\'1 article, quantité 3');
  console.log('\nRÉSULTAT 2 articles : lien =', lien(deux));
  console.log('RÉSULTAT 1 article  : lien =', lien(un));
  await H.pool.end(); process.exit(0);
})().catch(e => { console.error('ERREUR', e); process.exit(1); });
