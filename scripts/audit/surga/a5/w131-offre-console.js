// A5-131 — Offre pilotée par la console : un prix, une durée, un quota gratuit et l'ouverture des ventes changés par
// l'API d'administration se retrouvent dans l'application (offre publique, droits d'emploi, souscription) et en base.
// Toutes les valeurs d'origine sont rétablies à la fin. Backend 4100 redémarré sur le code courant, base nopalou_audit.
// Usage : $env:A5_DB='nopalou_audit'; $env:A5_BACK='http://127.0.0.1:4100'; run5.ps1 a5\w131-offre-console.js -Base nopalou_audit
const { rec, end, pool, PASS, BACK } = require('./lib5');
const ts = Date.now().toString(36);
const SECRET = { 'x-admin-secret': 'audit-admin-secret' };

async function http(method, url, { token, headers = {}, body, xff = '10.250.131.1' } = {}) {
  const h = { ...headers, 'x-forwarded-for': xff };
  if (body !== undefined) h['content-type'] = 'application/json';
  if (token) h.authorization = 'Bearer ' + token;
  try {
    const r = await fetch(BACK + url, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined });
    const t = await r.text(); let d; try { d = JSON.parse(t); } catch { d = t.slice(0, 200); }
    return { s: r.status, d };
  } catch (e) { return { s: 'ERR', d: String(e.cause && e.cause.code || e.message) }; }
}

(async () => {
  const r = rec('A5-131'); const res = {}; const ok = [];
  const verif = (nom, cond) => { res[nom] = Boolean(cond); ok.push(Boolean(cond)); };
  const plan0 = (await http('GET', '/api/admin/surga/plans', { headers: SECRET })).d.plans.find((p) => p.id === 'b2c_premium');
  const reg0 = Object.fromEntries((await http('GET', '/api/admin/surga/reglages', { headers: SECRET })).d.reglages.map((x) => [x.cle, x.valeur]));
  res.etat_initial = { tarifs: plan0 && plan0.tarifs, actif: plan0 && plan0.actif, reglages: reg0 };

  // Compte de test
  const email = `a5-131-${ts}@audit.test`;
  await http('POST', '/api/auth/inscription', { body: { nom: 'A5 131', email, mot_de_passe: PASS } });
  const l = await http('POST', '/api/auth/login', { body: { email, mot_de_passe: PASS, password: PASS } });
  const token = l.d && (l.d.token || (l.d.data && l.d.data.token));
  const userId = (await pool.query('select id from utilisateurs where email = $1', [email])).rows[0].id;

  const offre = async () => (await http('GET', '/api/surga/abonnements/offre')).d;
  const cyc = (o, nom) => { const p = (o.plans || []).find((x) => x.id === 'b2c_premium'); return p && p.cycles.find((c) => c.cycle === nom); };

  try {
    // 1. Prix : 7 jours à 700, 30 jours à 1 800
    const put1 = await http('PUT', '/api/admin/surga/plans/b2c_premium', { headers: SECRET, body: { tarifHebdo: 700, tarifMensuel: 1800 } });
    verif('prix_modifie_accepte', put1.s === 200);
    let o = await offre();
    verif('offre_publique_7j_700', cyc(o, 'hebdomadaire') && cyc(o, 'hebdomadaire').montant === 700);
    verif('offre_publique_30j_1800', cyc(o, 'mensuel') && cyc(o, 'mensuel').montant === 1800);
    verif('enregistrer_des_prix_ne_change_pas_la_visibilite', (await http('GET', '/api/admin/surga/plans', { headers: SECRET })).d.plans.find((p) => p.id === 'b2c_premium').actif === plan0.actif);

    // 2. La souscription encaisse le prix de la console
    await http('POST', '/api/surga/abonnements/initier', { token, body: { plan: 'b2c_premium', cycle: 'hebdomadaire', provider: 'wave' } });
    const lignes = (await pool.query("select cycle, montant_xof from surga_abonnements where user_id = $1 order by created_at desc nulls last limit 1", [userId])).rows;
    res.ligne_souscription = lignes[0] || null;
    verif('souscription_au_prix_de_la_console', lignes[0] && lignes[0].montant_xof === 700 && lignes[0].cycle === 'hebdomadaire');

    // 3. Durée retirée : tarif à 0 = cycle absent de l'offre et refusé à la souscription
    await http('PUT', '/api/admin/surga/plans/b2c_premium', { headers: SECRET, body: { tarifHebdo: 0 } });
    o = await offre();
    verif('duree_a_zero_absente_de_l_offre', !cyc(o, 'hebdomadaire'));
    const refus = await http('POST', '/api/surga/abonnements/initier', { token, body: { plan: 'b2c_premium', cycle: 'hebdomadaire', provider: 'wave' } });
    verif('duree_a_zero_refusee', refus.s === 400);

    // 4. Quotas gratuits : lettres 3/mois, CV 2
    const put2 = await http('PUT', '/api/admin/surga/reglages', { headers: SECRET, body: { reglages: { emploi_lettres_gratuites_mois: 3, emploi_cv_gratuits: 2 } } });
    verif('reglages_acceptes', put2.s === 200);
    o = await offre();
    verif('offre_publique_lettres_3', o.gratuit && o.gratuit.lettres_par_mois === 3);
    verif('offre_publique_cv_2', o.gratuit && o.gratuit.cv === 2);
    const droits = (await http('GET', '/api/surga/emploi/droits', { token })).d.droits || {};
    res.droits_compte = droits;
    verif('droits_du_compte_lettres_3', droits.lettresLimite === 3);
    verif('droits_du_compte_cv_2', droits.cvLimite === 2);

    // 5. Valeur refusée : hors bornes, rien n'est écrit
    const hors = await http('PUT', '/api/admin/surga/reglages', { headers: SECRET, body: { reglages: { emploi_lettres_gratuites_mois: 9999, emploi_cv_gratuits: 5 } } });
    verif('hors_bornes_refuse', hors.s === 400);
    verif('lot_refuse_n_ecrit_rien', (await offre()).gratuit.cv === 2);

    // 6. Ventes fermées
    await http('PUT', '/api/admin/surga/reglages', { headers: SECRET, body: { reglages: { ventes_ouvertes: false } } });
    o = await offre();
    verif('offre_dit_ventes_fermees', o.ventes_ouvertes === false);
    const ferme = await http('POST', '/api/surga/abonnements/initier', { token, body: { plan: 'b2c_premium', cycle: 'mensuel', provider: 'wave' } });
    verif('souscription_refusee_ventes_fermees', ferme.s === 403 && ferme.d.code === 'VENTES_FERMEES');

    // 7. Formule retirée de la vente : absente de l'offre, listée (hors vente) dans la console
    await http('PUT', '/api/admin/surga/reglages', { headers: SECRET, body: { reglages: { ventes_ouvertes: true } } });
    await http('PUT', '/api/admin/surga/plans/b2c_premium', { headers: SECRET, body: { actif: false } });
    o = await offre();
    verif('formule_retiree_absente_de_l_offre', !(o.plans || []).some((p) => p.id === 'b2c_premium'));
    const cons = (await http('GET', '/api/admin/surga/plans', { headers: SECRET })).d.plans.find((p) => p.id === 'b2c_premium');
    verif('formule_retiree_visible_en_console', cons && cons.actif === false);

    // 8. Persistance : les valeurs viennent de la base, pas de la mémoire du processus
    const base = (await pool.query("select valeur from surga_reglages where cle = 'emploi_cv_gratuits'")).rows[0];
    verif('reglage_ecrit_en_base', base && Number(base.valeur) === 2);
    const planBase = (await pool.query("select tarif_hebdo_xof, tarif_mensuel_xof, actif from surga_plans where id = 'b2c_premium'")).rows[0];
    res.plan_en_base = planBase;
    verif('plan_ecrit_en_base', planBase && planBase.tarif_mensuel_xof === 1800 && planBase.actif === false);
  } finally {
    // Rétablissement des valeurs d'origine
    await http('PUT', '/api/admin/surga/plans/b2c_premium', { headers: SECRET, body: { tarifHebdo: plan0.tarifs.hebdomadaire, tarifMensuel: plan0.tarifs.mensuel, tarifAnnuel: plan0.tarifs.annuel, actif: plan0.actif } });
    await http('PUT', '/api/admin/surga/reglages', { headers: SECRET, body: { reglages: Object.fromEntries(Object.entries(reg0).filter(([k]) => ['ventes_ouvertes', 'emploi_cv_gratuits', 'emploi_lettres_gratuites_mois'].includes(k))) } });
    await pool.query('delete from surga_abonnements where user_id = $1', [userId]);
    const apres = (await http('GET', '/api/admin/surga/plans', { headers: SECRET })).d.plans.find((p) => p.id === 'b2c_premium');
    res.retabli = JSON.stringify(apres.tarifs) === JSON.stringify(plan0.tarifs) && apres.actif === plan0.actif;
  }

  r.mesure('relevés', res);
  const tout = ok.every(Boolean) && res.retabli === true;
  r.verdict(tout ? 'PASS' : 'FAIL', `${ok.filter(Boolean).length}/${ok.length} vérifications tenues ; valeurs d'origine rétablies : ${res.retabli}`);
  console.log(JSON.stringify(res, null, 1));
  r.save('offre-console');
  await end();
})().catch(async (e) => { console.error(e); await end(); process.exit(1); });
