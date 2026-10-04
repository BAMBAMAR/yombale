// AGENT 8 — Retest indépendant FIX-001 / ANOM-001 (téléphone non persisté à l'inscription) + effets de bord.
const { LABEL, PW, RUN, pool, http, mkToken, inscrire, Suite, saveEvidence } = require('./lib');
const path = require('path');

(async () => {
  const S = new Suite('FIX-001');
  const dbTel = async (email) => (await pool.query('SELECT id, telephone, jwt_version FROM utilisateurs WHERE email=$1', [email])).rows[0];
  // numéros uniques par exécution (9 chiffres sénégalais fictifs 7xxxxxxxx)
  const base = String(Date.now()).slice(-6);
  const n = (suffix) => `77${base}${suffix}`.slice(0, 9); // 9 chiffres

  // V1-01 : scénario original (TEST-001) — numéro local avec espaces
  const tel1 = n('1');
  const fmt = (t) => `${t.slice(0, 2)} ${t.slice(2, 5)} ${t.slice(5, 7)} ${t.slice(7)}`;
  const r1 = await inscrire('t001', { telephone: fmt(tel1) });
  const d1 = await dbTel(r1.email);
  S.rec('V1-01', 'TEST-001 original : inscription avec telephone local formaté => 201 + persisté en DB (E.164)',
    r1.status === 201 && d1 && d1.telephone === `+221${tel1}`,
    { http: 201, db_telephone: `+221${tel1}` }, { http: r1.status, api_user: r1.user, db: d1 });

  // V1-02 : persistance / rechargement : connexion puis GET /profil
  const login = await http('POST', '/api/auth/connexion', { email: r1.email, mot_de_passe: PW });
  const prof = await http('GET', '/api/auth/profil', null, login.data && login.data.token);
  S.rec('V1-02', 'Persistance : reconnexion puis GET /api/auth/profil retourne le téléphone saisi',
    prof.status === 200 && prof.data && prof.data.user && String(prof.data.user.telephone || '').replace(/\D/g, '').endsWith(tel1),
    { telephone_contient: tel1 }, { login_status: login.status, profil_status: prof.status, profil: prof.data });

  // V1-03 : formats d'entrée variés
  const formats = [
    ['+221 77 %s', (t) => `+221 ${t.slice(0, 2)} ${t.slice(2, 5)} ${t.slice(5, 7)} ${t.slice(7)}`],
    ['00221…', (t) => `00221${t}`],
    ['221…', (t) => `221${t}`],
    ['(+221) 77-xxx-xx-xx', (t) => `(+221) ${t.slice(0, 2)}-${t.slice(2, 5)}-${t.slice(5, 7)}-${t.slice(7)}`],
  ];
  const fmtRes = [];
  for (let i = 0; i < formats.length; i++) {
    const t = n(String(2 + i));
    const r = await inscrire(`t001f${i}`, { telephone: formats[i][1](t) });
    const d = await dbTel(r.email);
    fmtRes.push({ format: formats[i][0], http: r.status, db: d && d.telephone, attendu: `+221${t}` });
  }
  S.rec('V1-03', 'Formats d\'entrée (+221 espacé, 00221, 221, parenthèses) normalisés en +221XXXXXXXXX',
    fmtRes.every((x) => x.http === 201 && x.db === x.attendu), 'tous normalisés', fmtRes);

  // V1-04 : cas limites absence / vide / null
  const lim = [];
  for (const [nom, extra] of [['absent', {}], ['vide', { telephone: '' }], ['null', { telephone: null }], ['espaces', { telephone: '   ' }]]) {
    const r = await inscrire(`t001e${nom}`, extra);
    const d = await dbTel(r.email);
    lim.push({ cas: nom, http: r.status, db_telephone: d ? d.telephone : 'USER ABSENT' });
  }
  S.rec('V1-04', 'Cas limites : téléphone absent/vide/null/espaces => 201 sans erreur SQL, NULL stocké',
    lim.every((x) => x.http === 201 && x.db_telephone === null), 'tous 201 + NULL', lim);

  // V1-05 : valeurs invalides
  const inv = [];
  let ii = 0;
  for (const [nom, v] of [['lettres', 'abcdef'], ['trop_court', '123'], ['trop_long_25_chiffres', '1'.repeat(25)], ['injection', "77'; DROP TABLE utilisateurs;--"], ['nombre_json', 771234567], ['objet', { a: 1 }], ['tableau', ['771234567']]]) {
    const r = await inscrire(`t001i${ii++}`, { telephone: v });
    const d = await dbTel(r.email);
    inv.push({ cas: nom, http: r.status, db_telephone: d ? d.telephone : null, reponse: r.status >= 400 ? r.data : undefined });
  }
  const inj = await pool.query("SELECT to_regclass('public.utilisateurs') AS t");
  const rejetOuNull = (x) => x.http >= 400 && x.http < 500 || (x.http === 201 && x.db_telephone === null);
  // Critère attendu : une valeur invalide ne doit JAMAIS produire 500 ni être stockée telle quelle comme numéro.
  S.rec('V1-05', 'Valeurs invalides (lettres, trop court/long, injection, types non-string) : ni 500, ni numéro invalide persisté',
    inv.every((x) => x.http !== 500 && rejetOuNull(x)) && !!inj.rows[0].t,
    'rejet 4xx ou NULL, jamais de 500 / valeur invalide stockée', inv,
    'La table utilisateurs existe toujours: ' + !!inj.rows[0].t);

  // V1-06 : doublon de téléphone (AUD-052/AUD-055 : un numéro = un compte, sinon OTP ambigu)
  const telD = n('7');
  const a = await inscrire('t001dupA', { telephone: telD });
  const b = await inscrire('t001dupB', { telephone: fmt(telD) });
  const dupRows = (await pool.query("SELECT email, telephone FROM utilisateurs WHERE telephone IN ($1,$2) OR REPLACE(telephone,'+','')=$3", [`+221${telD}`, `221${telD}`, `221${telD}`])).rows;
  S.rec('V1-06', 'Doublon : second compte e-mail avec le MÊME numéro doit être refusé (409 explicite), comme PUT /profil',
    b.status === 409 && dupRows.length === 1,
    { second_signup: '409 « numéro déjà associé »', comptes_avec_ce_numero: 1 },
    { first: a.status, second: b.status, second_body: b.data, comptes_avec_ce_numero: dupRows.length, rows: dupRows });

  // V1-07 : régression cachée — collision de format avec un compte OTP/WhatsApp (stocké SANS « + »)
  //   Compte victime provisionné au format OTP historique ('221…' sans +), l'attaquant s'inscrit avec le même numéro.
  const telV = n('8');
  const emailVictime = `victime.${RUN}@audit8.test`;
  const hash = await require('bcryptjs').hash(PW, 10);
  const vic = await pool.query(
    `INSERT INTO utilisateurs (nom,email,mot_de_passe_hash,telephone,email_verifie,jwt_version) VALUES ('Victime OTP',$1,$2,$3,true,1) RETURNING id`,
    [emailVictime, hash, `221${telV}`]);
  const att = await inscrire('t001att', { telephone: telV });
  // connexion OTP légitime de la victime : on génère un code valide via le service réel (sans envoi WhatsApp)
  const otp = require(path.join(__dirname, '..', '..', '..', 'backend', 'services', 'otp.js'));
  const code = await otp.genererOtpPhone(`221${telV}`, 'login');
  const lg = await http('POST', '/api/auth/whatsapp-otp-login', { telephone: `221${telV}`, code });
  S.rec('V1-07', 'Hidden regression : l\'inscription e-mail d\'un tiers avec le numéro de la victime ne doit pas bloquer la connexion OTP du titulaire',
    lg.status === 200 && !!(lg.data && lg.data.token),
    { otp_login_victime: 200 }, { attaquant_signup: att.status, attaquant_db: await dbTel(att.email), otp_login_status: lg.status, otp_login_body: lg.data });

  // V1-08 : cohérence de format avec PUT /api/auth/profil (autre chemin d'écriture de utilisateurs.telephone)
  const r8 = await inscrire('t001put', {});
  const tel8 = n('9');
  const put = await http('PUT', '/api/auth/profil', { telephone: tel8 }, r8.token);
  const d8 = await dbTel(r8.email);
  const r8b = await inscrire('t001fmt', { telephone: tel8 });
  const d8b = await dbTel(r8b.email);
  S.rec('V1-08', 'Cohérence de format : le même numéro saisi doit être stocké identiquement par PUT /profil et par /inscription',
    d8 && d8b && d8.telephone === d8b.telephone,
    'même chaîne en DB', { put_status: put.status, db_via_PUT_profil: d8 && d8.telephone, db_via_inscription: d8b && d8b.telephone });

  // V1-09 : parcours bout-en-bout inscription → session → action → déconnexion → reconnexion
  const lo = await http('POST', '/api/auth/deconnexion', null, r1.token);
  const after = await http('GET', '/api/auth/profil', null, r1.token);
  const relog = await http('POST', '/api/auth/connexion', { email: r1.email, mot_de_passe: PW });
  S.rec('V1-09', 'E2E auth : inscription -> accès compte -> déconnexion (token révoqué 401) -> reconnexion 200',
    lo.status === 200 && after.status === 401 && relog.status === 200,
    { logout: 200, ancien_token: 401, reconnexion: 200 }, { logout: lo.status, ancien_token: after.status, reconnexion: relog.status });

  // V1-10 : e-mail normalisé (non-régression ANOM-001 périmètre TEST-001)
  const emMix = `Mixed.Case.${RUN}@Audit8.TEST`;
  const rm = await http('POST', '/api/auth/inscription', { nom: 'Mixed', email: emMix, mot_de_passe: PW, telephone: n('0') });
  const dm = (await pool.query('SELECT email FROM utilisateurs WHERE lower(email)=lower($1)', [emMix])).rows[0];
  S.rec('V1-10', 'Non-régression normalisation e-mail (minuscules, domaine)', rm.status === 201 && dm && dm.email === emMix.toLowerCase(), emMix.toLowerCase(), { http: rm.status, db_email: dm && dm.email });

  // V1-11 : index unique en base (contexte d'environnement)
  const idx = (await pool.query("SELECT indexname FROM pg_indexes WHERE tablename='utilisateurs' AND indexdef ILIKE '%telephone%'")).rows;
  S.extra.index_telephone_utilisateurs = idx;
  S.extra.colonne_telephone = (await pool.query("SELECT data_type, character_maximum_length FROM information_schema.columns WHERE table_name='utilisateurs' AND column_name='telephone'")).rows[0];
  S.extra.ui_formulaire_inscription_email_a_champ_telephone = require('fs').readFileSync(path.join(__dirname, '..', '..', '..', 'frontend-next', 'src', 'app', 'inscription', 'InscriptionForm.tsx'), 'utf8').split('\n').slice(380, 440).join('\n').includes('name="telephone"');

  S.save();
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
