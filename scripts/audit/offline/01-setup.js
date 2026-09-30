// Jeu de données de l'audit hors-ligne/PWA (base nopalou_audit uniquement). Écrit scripts/audit/.local/offline-state.json (ignoré par git).
const fs = require('fs'); const path = require('path');
const { j, db } = require('../commerce/lib');
const STATE = path.join(__dirname, '..', '.local', 'offline-state.json');
(async () => {
  const sfx = Date.now().toString(36); const pw = 'Audit!Pass2026x'; const S = { sfx, pw };
  const c = await db();
  // Marchand M (boutique active, essai gratuit = POS autorisé), acheteur Z
  for (const [k, tel] of [['M', '7714' + Math.floor(10000 + Math.random() * 89999)], ['X', '7715' + Math.floor(10000 + Math.random() * 89999)], ['Z', '7716' + Math.floor(10000 + Math.random() * 89999)]]) {
    const email = `off${k.toLowerCase()}.${sfx}@audit.test`;
    const r = await j('POST', '/api/auth/inscription', { nom: 'Off ' + k, email, mot_de_passe: pw });
    S[k] = { reg: r.s, email, token: r.d.token, uid: r.d.user && r.d.user.id, tel };
    if (k !== 'Z') {
      const b = await j('POST', '/api/boutiques', { nom: `Boutique Off ${k} ${sfx}`, telephone: tel, ville: 'Dakar', categorie: 'mode' }, S[k].token);
      S[k].boutique = { s: b.s, id: (b.d.boutique && b.d.boutique.id) || b.d.id, slug: b.d.boutique && b.d.boutique.slug };
    }
  }
  // Produits de M
  const mk = async (body) => { const r = await j('POST', `/api/boutiques/${S.M.boutique.id}/produits`, body, S.M.token); return { s: r.s, id: r.d.produit && r.d.produit.id, err: r.s >= 300 ? r.d : undefined }; };
  S.prod = { A: await mk({ nom: 'Robe Bazin Off', prix: 15000, stock_quantite: 10 }), B: await mk({ nom: 'Boubou Off', prix: 25000, stock_quantite: 5 }), L: await mk({ nom: 'Dernier Article Off', prix: 4000, stock_quantite: 1 }) };
  // Client du carnet de dettes
  const cl = await j('POST', `/api/boutiques/${S.M.boutique.id}/credits-clients`, { nom: 'Client Carnet Off', telephone: '771119999' }, S.M.token);
  S.clientCarnet = cl.d.client && cl.d.client.id;
  // Boutique X : abonnement expiré (POS refusé côté serveur)
  await c.query("UPDATE abonnements SET fin = NOW() - interval '2 days', statut='expire' WHERE utilisateur_id=$1", [S.X.uid]);
  const a = await c.query('SELECT utilisateur_id, plan, statut, fin, is_trial FROM abonnements WHERE utilisateur_id = ANY($1)', [[S.M.uid, S.X.uid]]);
  S.abos = a.rows;
  const pX = await j('POST', `/api/boutiques/${S.X.boutique.id}/produits`, { nom: 'Article X Off', prix: 3000, stock_quantite: 7 }, S.X.token);
  S.prodX = pX.d.produit && pX.d.produit.id;
  fs.writeFileSync(STATE, JSON.stringify(S, null, 1)); console.log(JSON.stringify(S, (k, v) => k === 'token' ? '<tok>' : v, 1)); await c.end();
})();
