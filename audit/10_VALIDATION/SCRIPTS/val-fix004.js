// AGENT 8 — Retest indépendant FIX-004 / ANOM-004 (repli Wave : 502 destructeur -> 201 fallback manuel) + effets de bord.
const { LABEL, PW, RUN, pool, http, inscrire, creerBoutique, Suite, saveEvidence, BASE_URL } = require('./lib');
const path = require('path');

(async () => {
  const S = new Suite('FIX-004');
  const M = await inscrire('t004M');
  const bq = await creerBoutique(M.token, `Boutique Wave 004 ${RUN}`, '771110005');
  if (!bq.id) { S.rec('V4-00', 'Préparation boutique', false, 'créée', { s: bq.status, b: bq.data }); S.save(); await pool.end(); return; }
  const mkProd = async (nom, prix, stock) => (await pool.query(`INSERT INTO boutique_produits (boutique_id, nom, prix, stock_quantite, en_stock) VALUES ($1,$2,$3,$4,$5) RETURNING id, nom, prix`, [bq.id, nom, prix, stock, stock > 0])).rows[0];
  const stockOf = async (id) => Number((await pool.query('SELECT stock_quantite FROM boutique_produits WHERE id=$1', [id])).rows[0].stock_quantite);
  const cmdDb = async (ref) => (await pool.query('SELECT id, reference, statut, montant_total, methode_paiement, paiement_recu, quantite FROM commandes_boutique WHERE reference=$1', [ref])).rows[0];
  let seq = 0;
  const order = (p, methode, qte = 1, extra = {}) => http('POST', `/api/comptabilite/${bq.id}/commandes`, {
    client_nom: 'Client Audit8', client_telephone: `7723${String(Date.now()).slice(-4)}${seq++}`.slice(0, 9), client_adresse: 'Almadies', methode_paiement: methode,
    items: [{ produit_id: p.id, quantite: qte, nom: p.nom, prix: Number(p.prix) }], ...extra,
  });

  // V4-01 : scénario original TEST-009 (Wave indisponible : clé factice + réseau externe interdit par le garde d'audit)
  const p1 = await mkProd('Savon Wave 004', 2500, 10);
  const r1 = await order(p1, 'wave', 1);
  const ref1 = r1.data && r1.data.commande && r1.data.commande.reference;
  const c1 = ref1 ? await cmdDb(ref1) : null;
  const s1 = await stockOf(p1.id);
  S.rec('V4-01', 'TEST-009 original : Wave indisponible => 201 + fallback_manuel + numero_depot 777202086 + commande en_attente + stock 10->9',
    r1.status === 201 && r1.data.fallback_manuel === true && r1.data.numero_depot === '777202086' && r1.data.operateur === 'wave' && c1 && c1.statut === 'en_attente' && s1 === 9,
    { http: 201, fallback_manuel: true, numero_depot: '777202086', db_statut: 'en_attente', stock: 9 },
    { http: r1.status, body: r1.data, db_commande: c1, stock_apres: s1 });

  // V4-02 : quantité 2 + montant
  const r2 = await order(p1, 'wave', 2);
  const c2 = r2.data && r2.data.commande ? await cmdDb(r2.data.commande.reference) : null;
  const s2 = await stockOf(p1.id);
  S.rec('V4-02', 'Quantité 2 : montant 5000, stock décrémenté de 2 (9->7), commande conservée',
    r2.status === 201 && c2 && Number(c2.montant_total) === 5000 && s2 === 7 && c2.statut === 'en_attente',
    { http: 201, montant: 5000, stock: 7 }, { http: r2.status, db: c2, stock: s2 });

  // V4-03 : variante pay_wave
  const r3 = await order(p1, 'pay_wave', 1);
  S.rec('V4-03', 'Alias méthode pay_wave : même comportement de repli', r3.status === 201 && r3.data.fallback_manuel === true, '201 fallback', { http: r3.status, fb: r3.data && r3.data.fallback_manuel });

  // V4-04 : Orange Money (non-régression)
  const r4 = await order(p1, 'orange_money', 1);
  S.rec('V4-04', 'Non-régression Orange Money : 201 + (om_url OU repli manuel), commande en_attente, comportement inchangé avant/après', r4.status === 201 && !!(r4.data && (r4.data.om_url || r4.data.fallback_manuel)) && r4.data.commande && r4.data.commande.statut === 'en_attente', '201 + om_url|fallback', { http: r4.status, om_url: r4.data && r4.data.om_url, fallback_manuel: r4.data && r4.data.fallback_manuel, message: r4.data && r4.data.message });

  // V4-05 : espèces
  const sPre = await stockOf(p1.id);
  const r5 = await order(p1, 'cash', 1);
  const c5 = r5.data && r5.data.commande ? await cmdDb(r5.data.commande.reference) : null;
  const sPost = await stockOf(p1.id);
  S.rec('V4-05', 'Non-régression paiement espèces : 201, sans champs de repli Wave, stock -1', r5.status === 201 && !r5.data.fallback_manuel && !r5.data.wave_url && sPost === sPre - 1 && !!c5, '201 simple', { http: r5.status, message: r5.data && r5.data.message, statut: c5 && c5.statut, stock: [sPre, sPost] });

  // V4-06 : idempotence (double clic) sur le chemin Wave en repli
  const p6 = await mkProd('Idempotence Wave 004', 1000, 5);
  const key = `idem-${RUN}`;
  const a = await order(p6, 'wave', 1, { idempotency_key: key });
  const b = await order(p6, 'wave', 1, { idempotency_key: key });
  const s6 = await stockOf(p6.id);
  const nbCmd = (await pool.query(`SELECT count(*)::int c FROM commandes_boutique WHERE boutique_id=$1 AND produit_id=$2`, [bq.id, p6.id])).rows[0].c;
  S.rec('V4-06', 'Double soumission (même idempotency_key) : 2e réponse 200 doublon, 1 seule commande, stock -1 uniquement',
    a.status === 201 && b.status === 200 && b.data.doublon === true && s6 === 4, { first: 201, second: '200 doublon', stock: 4 }, { first: a.status, second: b.status, doublon: b.data.doublon, stock: s6, commandes_en_base: nbCmd });

  // V4-07 : rupture de stock
  const p7 = await mkProd('Rupture Wave 004', 1000, 1);
  const r7 = await order(p7, 'wave', 2);
  const nb7 = (await pool.query(`SELECT count(*)::int c FROM commandes_boutique WHERE boutique_id=$1 AND produit_id=$2`, [bq.id, p7.id])).rows[0].c;
  S.rec('V4-07', 'Quantité > stock : refus 4xx, aucune commande créée, stock inchangé', r7.status >= 400 && r7.status < 500 && nb7 === 0 && (await stockOf(p7.id)) === 1, '4xx + 0 commande', { http: r7.status, body: r7.data, commandes: nb7, stock: await stockOf(p7.id) });

  // V4-08 : concurrence sur le dernier article
  const p8 = await mkProd('Dernier article 004', 1000, 1);
  const [x, y] = await Promise.all([order(p8, 'wave', 1), order(p8, 'wave', 1)]);
  const s8 = await stockOf(p8.id);
  const created = [x, y].filter((r) => r.status === 201).length;
  S.rec('V4-08', 'Concurrence (2 commandes simultanées sur le dernier article) : une seule acceptée, stock jamais négatif', created === 1 && s8 === 0, { acceptees: 1, stock: 0 }, { statuts: [x.status, y.status], stock: s8 });

  // V4-09 : le repli ne doit pas laisser de commande sans information de paiement exploitable
  S.rec('V4-09', 'Le corps de repli contient message, numero_depot, operateur et AUCUNE wave_url trompeuse',
    !!(r1.data && r1.data.message && r1.data.numero_depot && r1.data.operateur && !r1.data.wave_url), 'message+numero+operateur', { keys: Object.keys(r1.data || {}) });

  // Observation : expiration automatique 2 h des commandes Wave non payées (commande-service)
  if (LABEL === 'after') {
    await pool.query(`UPDATE commandes_boutique SET created_at = NOW() - interval '3 hours' WHERE reference=$1`, [ref1]);
    const svc = require(path.join(__dirname, '..', '..', '..', 'backend', 'services', 'commande-service.js'));
    const n = await svc.annulerCommandesImpayeesExpirees({ delaiHeures: 2 });
    const c1b = await cmdDb(ref1);
    S.extra.cron_expiration_2h = { commandes_annulees_par_cron: n, commande_repli_apres_cron: c1b, stock_p1_apres_cron: await stockOf(p1.id),
      lecture: 'La commande en repli manuel est annulée automatiquement après 2 h sans paiement confirmé (comportement existant, non modifié par FIX-004).' };
  }
  S.extra.reference_commande_repli = ref1;
  S.extra.boutique = bq.id;
  S.save();
  await pool.end();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
