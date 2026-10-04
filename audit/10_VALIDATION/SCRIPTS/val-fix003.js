// AGENT 8 — Retest indépendant FIX-003 / ANOM-003 (journalisation IDOR boutiques) + couverture + faux positifs.
const { LABEL, PW, RUN, pool, http, mkToken, inscrire, creerBoutique, abonnement, Suite, saveEvidence } = require('./lib');

(async () => {
  const S = new Suite('FIX-003');
  const vault = async (uid, tid = null) => (await pool.query(
    `SELECT event_type, user_id, tenant_type, target_id, endpoint, method, ip_address, details, created_at FROM security_audit_vault
      WHERE user_id=$1 ${tid ? 'AND target_id=$2' : ''} ORDER BY created_at ASC`, tid ? [String(uid), String(tid)] : [String(uid)])).rows;

  // Acteurs : A propriétaire, B attaquant (avec abonnement business = pire cas, passe checkAbonnement), C attaquant SANS abonnement, G gérant collaborateur
  const A = await inscrire('t003A'); const B = await inscrire('t003B'); const C = await inscrire('t003C'); const G = await inscrire('t003G');
  await abonnement(A.user.id); await abonnement(B.user.id); await abonnement(G.user.id);
  const bq = await creerBoutique(A.token, `Boutique A 003 ${RUN}`, '771110003');
  const bqB = await creerBoutique(B.token, `Boutique B 003 ${RUN}`, '771110004');
  S.extra.acteurs = { A: A.user.id, B: B.user.id, C: C.user.id, G: G.user.id, boutiqueA: bq.id, boutiqueB: bqB.id, creation_boutique_status: bq.status };
  if (!bq.id) { S.rec('V3-00', 'Préparation : création boutique A', false, 'boutique créée', { status: bq.status, body: bq.data }); S.save(); await pool.end(); return; }

  // Produit légitime de A (insertion DB pour ne pas dépendre du quota/abonnement du chemin testé)
  const prod = (await pool.query(`INSERT INTO boutique_produits (boutique_id, nom, prix, stock_quantite, en_stock) VALUES ($1,'Produit A 003',1000,5,true) RETURNING id`, [bq.id])).rows[0];

  // V3-01 : TEST-005 original — POST produit cross-tenant
  const t0 = Date.now();
  const p1 = await http('POST', `/api/boutiques/${bq.id}/produits`, { nom: 'Produit infiltré', prix: 50000, quantite: 10 }, B.token);
  const v1 = await vault(B.user.id, bq.id);
  S.rec('V3-01', 'TEST-005 original : B POST /boutiques/A/produits => 403 ET 1 ligne IDOR_BOUTIQUE_ACCESS_DENIED dans security_audit_vault',
    p1.status === 403 && v1.length === 1 && v1[0].event_type === 'IDOR_BOUTIQUE_ACCESS_DENIED',
    { http: 403, vault: 1 }, { http: p1.status, ms: p1.ms, vault_rows: v1 });
  const prodIntrus = (await pool.query(`SELECT count(*)::int c FROM boutique_produits WHERE boutique_id=$1 AND nom='Produit infiltré'`, [bq.id])).rows[0].c;
  S.rec('V3-02', 'Intégrité : aucun produit infiltré n\'a été créé chez A', prodIntrus === 0, 0, prodIntrus);

  // V3-03..05 : PUT / DELETE / dupliquer cross-tenant
  const put = await http('PUT', `/api/boutiques/${bq.id}/produits/${prod.id}`, { nom: 'Piraté', prix: 1 }, B.token);
  const dup = await http('POST', `/api/boutiques/${bq.id}/produits/${prod.id}/dupliquer`, { nom: 'Copie' }, B.token);
  const del = await http('DELETE', `/api/boutiques/${bq.id}/produits/${prod.id}`, null, B.token);
  const vAll = await vault(B.user.id, bq.id);
  const stillThere = (await pool.query('SELECT nom, prix FROM boutique_produits WHERE id=$1', [prod.id])).rows[0];
  S.rec('V3-03', 'PUT/DELETE/dupliquer cross-tenant => 403 ×3 et produit de A intact', [put, dup, del].every((r) => r.status === 403) && stillThere && stillThere.nom === 'Produit A 003' && Number(stillThere.prix) === 1000,
    '403 ×3, produit inchangé', { put: put.status, dupliquer: dup.status, delete: del.status, produit_apres: stillThere });
  S.rec('V3-04', 'Chaque mutation refusée est tracée (4 lignes au total : POST+PUT+dupliquer+DELETE) avec action et endpoint',
    vAll.length === 4 && vAll.every((r) => r.event_type === 'IDOR_BOUTIQUE_ACCESS_DENIED' && r.tenant_type === 'boutique' && r.user_id === B.user.id && r.endpoint && r.method),
    4, { rows: vAll.map((r) => ({ type: r.event_type, method: r.method, endpoint: r.endpoint, ip: r.ip_address, details: r.details })) });

  // V3-05 : TEST-005 volet commandes (événement harmonisé)
  const gc = await http('GET', `/api/comptabilite/${bq.id}/commandes`, null, B.token);
  const vCmd = (await vault(B.user.id, bq.id)).filter((r) => /commandes/.test(r.endpoint));
  S.rec('V3-05', 'GET /comptabilite/A/commandes cross-tenant => 403 + trace', gc.status === 403 && vCmd.length >= 1, { http: 403, vault: '>=1' }, { http: gc.status, trace: vCmd.map((r) => r.event_type) },
    'Type d\'événement attendu après FIX : IDOR_BOUTIQUE_ACCESS_DENIED (harmonisé, DEV-001)');
  S.rec('V3-05b', 'Événement harmonisé : le rejet commandes est consigné sous IDOR_BOUTIQUE_ACCESS_DENIED', vCmd.length >= 1 && vCmd.every((r) => r.event_type === 'IDOR_BOUTIQUE_ACCESS_DENIED'), 'IDOR_BOUTIQUE_ACCESS_DENIED', vCmd.map((r) => r.event_type));

  // V3-06 : sites de garde NON couverts par FIX-003 dans le même module (cause étendue DEV-001)
  const before = (await vault(B.user.id)).length;
  const pa = await http('PATCH', `/api/boutiques/${bq.id}/produits/${prod.id}/partage`, {}, B.token);
  const bt = await http('POST', `/api/boutiques/${bq.id}/produits/batch`, { produits: [{ nom: 'x', prix: 1 }] }, B.token);
  const cp = await http('POST', `/api/boutiques/${bq.id}/produits/${prod.id}/composants`, { composants: [] }, B.token);
  const after = (await vault(B.user.id)).length;
  S.rec('V3-06', 'Couverture de la cause : PATCH /partage, POST /batch, POST /composants cross-tenant => 403 ET tracés',
    [pa, bt, cp].every((r) => r.status === 403) && after - before === 3,
    { http: '403 ×3', lignes_vault_ajoutees: 3 }, { http: { partage: pa.status, batch: bt.status, composants: cp.status }, lignes_vault_ajoutees: after - before });

  // V3-07 : non connecté
  const vb = (await pool.query('SELECT count(*)::int c FROM security_audit_vault')).rows[0].c;
  const un = await http('POST', `/api/boutiques/${bq.id}/produits`, { nom: 'anon', prix: 1 });
  const va = (await pool.query('SELECT count(*)::int c FROM security_audit_vault')).rows[0].c;
  S.rec('V3-07', 'Non connecté => 401 sans pollution du vault', un.status === 401 && va === vb, { http: 401, vault_delta: 0 }, { http: un.status, vault_delta: va - vb });

  // V3-08 : attaquant sans abonnement (C) — le contrôle d'abonnement précède le contrôle IDOR
  const vcBefore = (await vault(C.user.id)).length;
  const pc = await http('POST', `/api/boutiques/${bq.id}/produits`, { nom: 'intrus C', prix: 1 }, C.token);
  const vcAfter = (await vault(C.user.id)).length;
  S.rec('V3-08', 'Attaquant SANS abonnement : refusé (403/402) ; observation de la trace IDOR', [402, 403].includes(pc.status), 'refus', { http: pc.status, body: pc.data, vault_delta: vcAfter - vcBefore },
    'Informatif : si la trace est absente ici, la tentative est stoppée par checkAbonnement avant le contrôle de propriété.');

  // V3-09 : propriétaire légitime — pas de faux positif
  const vaB = (await vault(A.user.id)).length;
  const ok = await http('POST', `/api/boutiques/${bq.id}/produits`, { nom: 'Produit légitime', prix: 2500, stock_quantite: 3 }, A.token);
  const okPut = await http('PUT', `/api/boutiques/${bq.id}/produits/${prod.id}`, { nom: 'Produit A 003 maj', prix: 1200 }, A.token);
  const vaA = (await vault(A.user.id)).length;
  S.rec('V3-09', 'Propriétaire : POST + PUT produit autorisés, aucune trace IDOR (pas de faux positif)',
    [200, 201].includes(ok.status) && [200, 201].includes(okPut.status) && vaA === vaB,
    { post: '201', put: '200', vault_delta: 0 }, { post: ok.status, post_body: ok.status >= 400 ? ok.data : undefined, put: okPut.status, put_body: okPut.status >= 400 ? okPut.data : undefined, vault_delta: vaA - vaB });

  // V3-10 : collaborateur (gérant dans boutique_utilisateurs) — pas de faux positif IDOR
  let colRes = {};
  try {
    const cols = (await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='boutique_utilisateurs'")).rows.map((r) => r.column_name);
    colRes.colonnes = cols;
    const fields = ['boutique_id', 'utilisateur_id']; const vals = [bq.id, G.user.id];
    if (cols.includes('role')) { fields.push('role'); vals.push('gerant'); }
    await pool.query(`INSERT INTO boutique_utilisateurs (${fields.join(',')}) VALUES (${vals.map((_, i) => '$' + (i + 1)).join(',')})`, vals);
    const vgB = (await vault(G.user.id)).length;
    const gp = await http('POST', `/api/boutiques/${bq.id}/produits`, { nom: 'Produit gérant', prix: 900, stock_quantite: 2 }, G.token);
    const gu = await http('PUT', `/api/boutiques/${bq.id}/produits/${prod.id}`, { nom: 'Produit A 003 gérant', prix: 1100 }, G.token);
    const vgA = (await vault(G.user.id)).length;
    S.rec('V3-10', 'Collaborateur (gérant) : accès conservé (pas 403), aucune trace IDOR', [200, 201].includes(gp.status) && [200, 201].includes(gu.status) && vgA === vgB, { post: '201', put: '200', vault_delta: 0 }, { post: gp.status, put: gu.status, vault_delta: vgA - vgB, ...colRes });
  } catch (e) { S.rec('V3-10', 'Collaborateur (gérant)', null, 'accès conservé', { erreur: e.message, ...colRes }); }

  // V3-11 : répétition / double clic — chaque rejet est tracé (pas de dédoublonnage ni de plafond : risque de saturation du vault)
  const vr0 = (await vault(B.user.id)).length;
  await Promise.all([1, 2, 3, 4, 5].map(() => http('POST', `/api/boutiques/${bq.id}/produits`, { nom: 'spam', prix: 1 }, B.token)));
  const vr1 = (await vault(B.user.id)).length;
  S.rec('V3-11', 'Rafale de 5 requêtes identiques : 5 rejets 403, traces insérées (observation du volume)', vr1 - vr0 === 5, '5 traces', { traces_ajoutees: vr1 - vr0 },
    'Observation : aucune limite/déduplication de journalisation (risque d\'inondation de security_audit_vault par un attaquant authentifié).');

  // V3-12 : latence du refus (await vault)
  S.extra.latence_refus_ms = { premier_post: p1.ms, put: put.ms, dupliquer: dup.ms, delete: del.ms };

  // V3-13 : Baseline Grappe E — IDOR agences immo (TEST-006) inchangé par le await de tenantSecurityImmo
  const X = await inscrire('t003X'); const Y = await inscrire('t003Y');
  const agY = (await pool.query(`INSERT INTO agences_immo (utilisateur_id, nom, slug, telephone, ville) VALUES ($1,'Agence Y 003',$2,'772220003','Dakar') RETURNING id, slug`, [Y.user.id, `agence-y-003-${RUN}`])).rows[0];
  const g1 = await http('GET', `/api/locatif-immo/agence/${agY.id}/baux`, null, X.token);
  const g2 = await http('GET', `/api/locatif-immo/agence/${agY.slug}/baux`, null, X.token);
  const vx = await vault(X.user.id);
  S.rec('V3-13', 'Grappe E / TEST-006 : accès cross-agence (UUID et slug) => 403 + 2 traces IDOR_AGENCE_ACCESS_DENIED', g1.status === 403 && g2.status === 403 && vx.length === 2 && vx.every((r) => r.event_type === 'IDOR_AGENCE_ACCESS_DENIED'), '403 ×2 + 2 traces', { http: [g1.status, g2.status], vault: vx.map((r) => r.event_type) });
  const own = await http('GET', `/api/locatif-immo/agence/${agY.id}/baux`, null, Y.token);
  S.rec('V3-14', 'Propriétaire de l\'agence : accès aux baux conservé (200)', own.status === 200, 200, own.status);

  S.save();
  saveEvidence('FIX-003', 'db', `vault_${LABEL}.json`, (await pool.query('SELECT event_type,user_id,target_id,endpoint,method,created_at FROM security_audit_vault WHERE user_id = ANY($1) ORDER BY created_at', [[String(B.user.id), String(C.user.id), String(X.user.id)]])).rows);
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
