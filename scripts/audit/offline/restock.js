const S = require('../.local/offline-state.json'); const bid = S.M.boutique.id;
(async () => {
  for (const [id, nom, prix, st] of [[S.prod.A.id, 'Robe Bazin Off', 15000, 50], [S.prod.B.id, 'Boubou Off', 25000, 50], [S.prod.L.id, 'Dernier Article Off', 4000, 1]]) {
    const r = await fetch('http://127.0.0.1:4100/api/boutiques/' + bid + '/produits/' + id, { method: 'PUT', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + S.M.token }, body: JSON.stringify({ nom, prix, stock_quantite: st, en_stock: true }) });
    console.log(nom, r.status);
  }
})();
