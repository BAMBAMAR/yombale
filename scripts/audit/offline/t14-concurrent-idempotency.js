const S = require('../.local/offline-state.json'); const { Client } = require('../../../node_modules/pg');
(async () => {
  const pw = require('fs').readFileSync(require('path').join(__dirname, '..', '.local', 'pgpass.txt'), 'utf8').trim();
  const c = new Client({ connectionString: `postgresql://postgres:${pw}@127.0.0.1:54329/nopalou_audit` }); await c.connect();
  const bid = S.M.boutique.id; const key = 'AUD-CONC-' + Date.now();
  const stockAvant = Number((await c.query("SELECT stock_quantite s FROM boutique_produits WHERE id=$1", [S.prod.A.id])).rows[0].s);
  const post = () => fetch('http://127.0.0.1:4100/api/boutiques/' + bid + '/pos-vente', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + S.M.token }, body: JSON.stringify({ idempotency_key: key, items: [{ id: S.prod.A.id, nom: 'Robe Bazin Off', quantite: 1, prix: 15000 }], modePaiement: 'especes' }) }).then(async r => ({ s: r.status, b: (await r.json().catch(() => ({}))) }));
  const rs = await Promise.all([1, 2, 3, 4, 5, 6].map(post));
  const v = (await c.query("SELECT count(*) n FROM ventes WHERE reference LIKE $1", [key + '%'])).rows[0].n;
  const d = (await c.query("SELECT count(*) n FROM caisse_documents WHERE reference = $1", [key])).rows[0].n;
  const stockApres = Number((await c.query("SELECT stock_quantite s FROM boutique_produits WHERE id=$1", [S.prod.A.id])).rows[0].s);
  console.log(JSON.stringify({ reponses: rs.map(r => r.s + (r.b.duplicate ? ' duplicate' : r.b.success ? ' created' : ' ' + (r.b.error || '').slice(0, 60))), lignes_ventes: Number(v), documents_caisse: Number(d), stock_decremente_de: stockAvant - stockApres }, null, 1));
  await c.end();
})();
