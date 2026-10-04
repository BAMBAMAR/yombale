// AGENT 8 — Retest indépendant FIX-005 / ANOM-005 (nomenclature POS) + comportement réel de la caisse + TEST-011 offline.
const fs = require('fs');
const path = require('path');
const { LABEL, PW, RUN, pool, http, inscrire, creerBoutique, abonnement, Suite } = require('./lib');

(async () => {
  const S = new Suite('FIX-005');
  const A = await inscrire('t005A'); const B = await inscrire('t005B');
  await abonnement(A.user.id); await abonnement(B.user.id);
  const bq = await creerBoutique(A.token, `Boutique POS 005 ${RUN}`, '771110006');
  await creerBoutique(B.token, `Boutique POS 005B ${RUN}`, '771110007');
  if (!bq.id) { S.rec('V5-00', 'Préparation', false, 'boutique', { s: bq.status, b: bq.data }); S.save(); await pool.end(); return; }
  const base = `/api/boutiques/${bq.id}`;
  const sess = async (id) => (await pool.query('SELECT * FROM boutique_pos_sessions WHERE id=$1', [id])).rows[0];

  // V5-01 : URLs strictes du plan initial => 404 attendu (la spécification a été corrigée, le produit n'a pas changé)
  const s1 = await http('POST', `${base}/pos/sessions/ouvrir`, { fond_caisse: 25000 }, A.token);
  const s2 = await http('POST', `${base}/pos/tiroir`, { type: 'sortie', montant: 5000, motif: 'x' }, A.token);
  const s3 = await http('POST', `${base}/pos/sessions/fermer`, { montant_cloture_reel: 20000 }, A.token);
  S.rec('V5-01', 'Les anciennes URLs du plan (/pos/sessions/ouvrir, /pos/tiroir, /pos/sessions/fermer) restent 404 : le correctif est documentaire, aucune route produit ajoutée',
    [s1, s2, s3].every((r) => r.status === 404), '404 ×3', { ouvrir: s1.status, tiroir: s2.status, fermer: s3.status });

  // V5-02 : cycle nominal sur routes réelles
  const open = await http('POST', `${base}/pos-sessions/ouvrir`, { fondDeCaisse: 25000, caissierNom: 'Caissier Principal' }, A.token);
  const sid = open.data && open.data.session && open.data.session.id;
  S.rec('V5-02', 'Ouverture de session (routes réelles) => 201 + session persistée avec fond 25 000', open.status === 201 && sid && Number((await sess(sid)).fond_caisse_initial) === 25000, { http: 201, fond: 25000 }, { http: open.status, body: open.data });

  // V5-03 : double ouverture
  const open2 = await http('POST', `${base}/pos-sessions/ouvrir`, { fondDeCaisse: 1000, caissierNom: 'Autre' }, A.token);
  const nbOuvertes = (await pool.query(`SELECT count(*)::int c FROM boutique_pos_sessions WHERE boutique_id=$1 AND statut='ouverte'`, [bq.id])).rows[0].c;
  S.rec('V5-03', 'Double ouverture : refusée (4xx) ou idempotente — jamais deux sessions ouvertes simultanées', nbOuvertes <= 1, '<=1 session ouverte', { http: open2.status, body: open2.data, sessions_ouvertes: nbOuvertes });

  // V5-04 : mouvements (nominal + invalides)
  const mv = await http('POST', `${base}/pos-sessions/${sid}/mouvements`, { type: 'sortie', montant: 5000, motif: 'Achat monnaie', caissier_nom: 'Caissier Principal' }, A.token);
  const mvNeg = await http('POST', `${base}/pos-sessions/${sid}/mouvements`, { type: 'sortie', montant: -100, motif: 'neg' }, A.token);
  const mvType = await http('POST', `${base}/pos-sessions/${sid}/mouvements`, { type: 'bidon', montant: 100, motif: 'x' }, A.token);
  const dbS = await sess(sid);
  S.rec('V5-04', 'Mouvement de tiroir : sortie 5 000 acceptée (200) ; montant négatif et type invalide refusés (4xx) ; total_sorties = 5 000',
    mv.status === 200 && mvNeg.status >= 400 && mvNeg.status < 500 && mvType.status >= 400 && mvType.status < 500 && Number(dbS.total_sorties_especes) === 5000,
    { nominal: 200, negatif: '4xx', type_invalide: '4xx', total_sorties: 5000 }, { nominal: mv.status, negatif: mvNeg.status, type_invalide: mvType.status, total_sorties_db: dbS.total_sorties_especes });

  // V5-05 : clôture exacte
  const clo = await http('POST', `${base}/pos-sessions/cloturer`, { sessionId: sid, especesComptees: 20000, ventesEspeces: 0, caissierNom: 'Caissier Principal' }, A.token);
  const dbC = await sess(sid);
  S.rec('V5-05', 'TEST-010 original : clôture 20 000 comptés => 200, statut clôturé, écart 0,00 FCFA en base',
    clo.status === 200 && /clotur|ferm/i.test(dbC.statut) && Number(dbC.ecart_caisse) === 0 && Number(dbC.especes_comptees) === 20000,
    { http: 200, ecart: 0 }, { http: clo.status, statut: dbC.statut, ecart: dbC.ecart_caisse, comptes: dbC.especes_comptees, body: clo.data });

  // V5-06 : écart non nul (calcul réel de l'écart)
  const o2 = await http('POST', `${base}/pos-sessions/ouvrir`, { fondDeCaisse: 10000, caissierNom: 'C2' }, A.token);
  const sid2 = o2.data && o2.data.session && o2.data.session.id;
  const c2 = await http('POST', `${base}/pos-sessions/cloturer`, { sessionId: sid2, especesComptees: 9000, ventesEspeces: 0, caissierNom: 'C2' }, A.token);
  const d2 = await sess(sid2);
  S.rec('V5-06', 'Écart non nul : fond 10 000, comptés 9 000 => écart -1 000 calculé et persisté', c2.status === 200 && Number(d2.ecart_caisse) === -1000, { ecart: -1000 }, { http: c2.status, ecart: d2 && d2.ecart_caisse });

  // V5-07 : mouvement sur session close
  const mvClosed = await http('POST', `${base}/pos-sessions/${sid}/mouvements`, { type: 'sortie', montant: 100, motif: 'après clôture' }, A.token);
  S.rec('V5-07', 'Mouvement sur session clôturée refusé (4xx) et totaux inchangés', mvClosed.status >= 400 && mvClosed.status < 500 && Number((await sess(sid)).total_sorties_especes) === 5000, '4xx', { http: mvClosed.status, body: mvClosed.data });

  // V5-08 : isolation multi-tenant POS (TEST-005 grappe B)
  const xo = await http('POST', `${base}/pos-sessions/ouvrir`, { fondDeCaisse: 1, caissierNom: 'Intrus' }, B.token);
  const xs = await http('GET', `${base}/pos-sessions/${sid}`, null, B.token);
  const xc = await http('POST', `${base}/pos-sessions/cloturer`, { sessionId: sid, especesComptees: 0, ventesEspeces: 0 }, B.token);
  S.rec('V5-08', 'Isolation : B ne peut ni ouvrir, ni lire, ni clôturer une session de la boutique de A (403/404)', [xo, xs, xc].every((r) => [403, 404].includes(r.status)), '403/404 ×3', { ouvrir: xo.status, lire: xs.status, cloturer: xc.status });

  // V5-09 : non authentifié
  const un = await http('POST', `${base}/pos-sessions/ouvrir`, { fondDeCaisse: 1 });
  S.rec('V5-09', 'Non connecté : 401', un.status === 401, 401, un.status);

  // V5-10 : TEST-011 (offline, idempotence) — Grappe B
  const prod = (await pool.query(`INSERT INTO boutique_produits (boutique_id, nom, prix, stock_quantite, en_stock) VALUES ($1,'Article offline 005',3000,10,true) RETURNING id, nom, prix`, [bq.id])).rows[0];
  const o3 = await http('POST', `${base}/pos-sessions/ouvrir`, { fondDeCaisse: 5000, caissierNom: 'Off' }, A.token);
  const sid3 = o3.data && o3.data.session && o3.data.session.id;
  const key = `audit8-offline-${RUN}`;
  const payload = { idempotency_key: key, sessionId: sid3, client_date: new Date().toISOString(), modePaiement: 'especes', montant_recu: 3000, rendu_monnaie: 0, items: [{ id: prod.id, nom: prod.nom, prix: 3000, quantite: 1 }] };
  const v1 = await http('POST', `${base}/pos-vente`, payload, A.token);
  const v2 = await http('POST', `${base}/pos-vente`, payload, A.token);
  const nbV = (await pool.query('SELECT count(*)::int c FROM ventes WHERE reference=$1', [key])).rows[0].c;
  const st = Number((await pool.query('SELECT stock_quantite FROM boutique_produits WHERE id=$1', [prod.id])).rows[0].stock_quantite);
  S.rec('V5-10', 'TEST-011 (Grappe B) : vente rejouée => 1ère 200/201, 2e 200 duplicate:true, 1 vente en base, stock 10->9', [200, 201].includes(v1.status) && v2.status === 200 && v2.data.duplicate === true && nbV === 1 && st === 9, 'idempotent', { v1: v1.status, v2: v2.status, duplicate: v2.data && v2.data.duplicate, ventes: nbV, stock: st });
  await http('POST', `${base}/pos-sessions/cloturer`, { sessionId: sid3, especesComptees: 8000, ventesEspeces: 3000 }, A.token);

  // V5-11 : cohérence documentaire du plan
  const plan = fs.readFileSync(path.join(__dirname, '..', '..', '02_PLAN_TESTS', 'PLAN_TESTS.md'), 'utf8');
  const L = plan.split('\n').filter((l) => /pos-sessions|pos\/sessions/.test(l));
  S.rec('V5-11', 'PLAN_TESTS.md référence les routes réelles /pos-sessions/ouvrir, /:sessionId/mouvements, /cloturer et plus les routes fantômes', /pos-sessions\/ouvrir/.test(plan) && /mouvements/.test(plan) && /cloturer/.test(plan) && !/\/pos\/sessions\/ouvrir/.test(plan.split('TEST-010')[1] ? plan.split('TEST-010')[1].slice(0, 1500) : ''), 'routes réelles', L.slice(0, 6));
  S.save();
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
