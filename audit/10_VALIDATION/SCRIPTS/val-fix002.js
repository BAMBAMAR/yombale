// AGENT 8 — Retest indépendant FIX-002 / ANOM-002 (GET /api/auth/moi vs /profil) + sécurité des sessions.
const { LABEL, PW, RUN, pool, http, mkToken, inscrire, Suite } = require('./lib');
const jwt = require('jsonwebtoken');

(async () => {
  const S = new Suite('FIX-002');
  const reg = await inscrire('t002');
  const token = reg.token;
  const uid = reg.user.id;
  const jv = async () => (await pool.query('SELECT jwt_version FROM utilisateurs WHERE id=$1', [uid])).rows[0].jwt_version;

  const moi = await http('GET', '/api/auth/moi', null, token);
  const prof = await http('GET', '/api/auth/profil', null, token);
  S.rec('V2-01', 'TEST-002 original (strict) : GET /api/auth/moi avec session valide => 200 + objet user',
    moi.status === 200 && moi.data && moi.data.user && moi.data.user.id === uid, { http: 200 }, { status: moi.status, body: moi.data });
  S.rec('V2-02', '/profil reste 200 et renvoie le MÊME corps que /moi (alias strict)',
    prof.status === 200 && moi.status === 200 && JSON.stringify(prof.data) === JSON.stringify(moi.data), 'corps identiques', { profil: prof.data, moi: moi.data });

  // Refus sans authentification / jeton falsifié
  const anonMoi = await http('GET', '/api/auth/moi');
  const anonProf = await http('GET', '/api/auth/profil');
  S.rec('V2-03', 'Non connecté : /moi et /profil => 401 (aucune fuite de données)', anonMoi.status === 401 && anonProf.status === 401, { moi: 401, profil: 401 }, { moi: anonMoi.status, profil: anonProf.status, body: anonMoi.data });
  const garb = await http('GET', '/api/auth/moi', null, 'abc.def.ghi');
  const forged = await http('GET', '/api/auth/moi', null, jwt.sign({ userId: uid, jwtVersion: 1 }, 'mauvais-secret', { expiresIn: '1h' }));
  const expired = await http('GET', '/api/auth/moi', null, jwt.sign({ userId: uid, jwtVersion: 1 }, process.env.JWT_SECRET, { expiresIn: -10 }));
  S.rec('V2-04', 'Jeton invalide / signé avec un mauvais secret / expiré => 401 sur /moi', [garb, forged, expired].every((r) => r.status === 401), 'trois 401', { garbage: garb.status, forge: forged.status, expire: expired.status });
  const resetTok = jwt.sign({ userId: uid, email: reg.email, type: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const resetSecret = jwt.sign({ userId: uid, email: reg.email }, process.env.RESET_SECRET || 'audit-reset', { expiresIn: '1h' });
  const rt1 = await http('GET', '/api/auth/moi', null, resetTok);
  const rt2 = await http('GET', '/api/auth/moi', null, resetSecret);
  S.rec('V2-05', 'TEST-003 sur l\'alias : jeton reset/verify refusé comme session (401) sur /moi', rt1.status === 401 && rt2.status === 401, { 401: 2 }, { type_reset: rt1.status, secret_reset: rt2.status, msg: rt1.data });

  // méthodes non prévues
  const post = await http('POST', '/api/auth/moi', {}, token);
  const put = await http('PUT', '/api/auth/moi', {}, token);
  S.rec('V2-06', 'L\'alias ne doit exposer que GET (POST/PUT /moi => 404/405, pas d\'écriture parasite)', ![200, 201].includes(post.status) && ![200, 201].includes(put.status), 'pas de 2xx', { post: post.status, put: put.status });

  // Cycle de révocation JWT
  const v0 = await jv();
  const lo = await http('POST', '/api/auth/deconnexion', null, token);
  const v1 = await jv();
  const mAfter = await http('GET', '/api/auth/moi', null, token);
  const pAfter = await http('GET', '/api/auth/profil', null, token);
  S.rec('V2-07', 'Déconnexion : jwt_version +1 en DB, ancien token => 401 sur /moi ET /profil (persistance de la révocation)',
    lo.status === 200 && v1 === v0 + 1 && mAfter.status === 401 && pAfter.status === 401,
    { logout: 200, jwt_version: v0 + 1, moi: 401, profil: 401 }, { logout: lo.status, jwt_version_avant: v0, jwt_version_apres: v1, moi: mAfter.status, profil: pAfter.status, msg: mAfter.data });

  // Reconnexion, nouveau token valide, ancien toujours invalide
  const relog = await http('POST', '/api/auth/connexion', { email: reg.email, mot_de_passe: PW });
  const m2 = await http('GET', '/api/auth/moi', null, relog.data && relog.data.token);
  const mOld = await http('GET', '/api/auth/moi', null, token);
  S.rec('V2-08', 'Reconnexion : nouveau token 200 sur /moi ; ancien token reste 401', relog.status === 200 && m2.status === 200 && mOld.status === 401, { nouveau: 200, ancien: 401 }, { login: relog.status, nouveau: m2.status, ancien: mOld.status });

  // Compte supprimé (période de grâce) — l'alias ne doit pas contourner la règle de session
  const sup = await http('POST', '/api/auth/supprimer-compte', { mot_de_passe: PW, confirmation: 'SUPPRIMER' }, relog.data.token);
  const mSup = await http('GET', '/api/auth/moi', null, relog.data.token);
  S.rec('V2-09', 'Après demande de suppression de compte, l\'ancien token est révoqué sur /moi (401)', sup.status === 200 && mSup.status === 401, { sup: 200, moi: 401 }, { sup: sup.status, moi: mSup.status });
  // restauration pour ne pas laisser de compte en suppression
  const rel2 = await http('POST', '/api/auth/connexion', { email: reg.email, mot_de_passe: PW });
  await http('POST', '/api/auth/annuler-suppression', null, rel2.data && rel2.data.token);

  // Isolation : un utilisateur ne voit que son propre profil via /moi
  const other = await inscrire('t002o');
  const mo = await http('GET', '/api/auth/moi', null, other.token);
  S.rec('V2-10', 'Isolation : /moi renvoie uniquement le profil du porteur du jeton (pas d\'IDOR)', mo.status === 200 && mo.data.user.id === other.user.id && mo.data.user.id !== uid, 'id = porteur', { id: mo.data.user && mo.data.user.id, attendu: other.user.id });

  // Champs sensibles absents de la réponse
  const sens = JSON.stringify(mo.data);
  S.rec('V2-11', 'La réponse /moi n\'expose ni hash de mot de passe ni jwt_version', !/mot_de_passe|hash|jwt_version/i.test(sens), 'aucun champ sensible', { champs: Object.keys(mo.data.user || {}) });

  S.save();
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
