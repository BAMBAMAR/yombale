const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:4100';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function saveProof(filename, data) {
  const dir04 = path.join(__dirname, '../../../audit/04_RESULTATS/PREUVES');
  const dir03 = path.join(__dirname, '../../../audit/03_PREUVES');
  fs.mkdirSync(dir04, { recursive: true });
  fs.mkdirSync(dir03, { recursive: true });
  fs.writeFileSync(path.join(dir04, filename), JSON.stringify(data, null, 2));
  fs.writeFileSync(path.join(dir03, filename.replace('TEST-', 'PREUVE-TEST-')), JSON.stringify(data, null, 2));
}

async function request(method, endpoint, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, headers: Object.fromEntries(res.headers.entries()), data: json };
}

async function run() {
  console.log('=== DÉBUT EXÉCUTION SECTION 1 (TEST-001 à TEST-004) ===');
  const results = {};

  // ----------------------------------------------------
  // TEST-001 : Inscription Utilisateur et Normalisation
  // ----------------------------------------------------
  console.log('\n--- Exécution TEST-001 ---');
  const emailTest = 'aminata.ndiaye@example.com';
  // Nettoyage préalable pour reproductibilité
  await pool.query('DELETE FROM utilisateurs WHERE lower(email) = lower($1)', [emailTest]);

  const t1Payload = {
    nom: 'Ndiaye',
    prenom: 'Aminata',
    email: 'Aminata.NDIAYE@Example.com',
    telephone: '77 123 45 67',
    mot_de_passe: 'TestPassword2026!'
  };

  const t1Res = await request('POST', '/api/auth/inscription', t1Payload);
  const t1Db = await pool.query(
    'SELECT id, email, telephone, mot_de_passe_hash, jwt_version FROM utilisateurs WHERE email=$1',
    [emailTest]
  );

  const t1Record = t1Db.rows[0];
  const t1Pass = 
    t1Res.status === 201 &&
    t1Record &&
    t1Record.email === 'aminata.ndiaye@example.com' &&
    t1Record.telephone === '+221771234567' &&
    t1Record.mot_de_passe_hash &&
    t1Record.mot_de_passe_hash.startsWith('$2') &&
    t1Record.jwt_version === 1;

  results['TEST-001'] = {
    status: t1Pass ? 'PASS' : 'FAIL',
    observed: {
      http_status: t1Res.status,
      response_data: t1Res.data,
      db_record: t1Record
    }
  };
  saveProof('TEST-001_preuve-01.json', results['TEST-001']);
  console.log(`TEST-001 Statut : ${results['TEST-001'].status}`);

  // ----------------------------------------------------
  // TEST-002 : Invalidation Session JWT sur Déconnexion
  // ----------------------------------------------------
  console.log('\n--- Exécution TEST-002 ---');
  // 1. Connexion
  const t2Login = await request('POST', '/api/auth/connexion', {
    email: 'aminata.ndiaye@example.com',
    mot_de_passe: 'TestPassword2026!'
  });
  const tokenA = t2Login.data.token;

  // 2. Appel strict original GET /api/auth/moi
  const t2MoiOriginalBefore = await request('GET', '/api/auth/moi', null, tokenA);
  // Appel adapté sur endpoint réel GET /api/auth/profil
  const t2ProfilAdaptedBefore = await request('GET', '/api/auth/profil', null, tokenA);

  // 3. Déconnexion POST /api/auth/deconnexion
  const t2Logout = await request('POST', '/api/auth/deconnexion', null, tokenA);

  // 4. Ré-appel strict original GET /api/auth/moi avec le même tokenA
  const t2MoiOriginalAfter = await request('GET', '/api/auth/moi', null, tokenA);
  // Ré-appel adapté sur GET /api/auth/profil avec le même tokenA
  const t2ProfilAdaptedAfter = await request('GET', '/api/auth/profil', null, tokenA);

  // Vérification en base du jwt_version
  const t2Db = await pool.query(
    'SELECT id, email, jwt_version FROM utilisateurs WHERE email=$1',
    ['aminata.ndiaye@example.com']
  );
  const t2Record = t2Db.rows[0];

  // Le test strict original échoue car /api/auth/moi renvoie 404 au lieu de 200/401
  // Avec l'adaptation sur /api/auth/profil, le comportement de révocation JWT est validé
  const t2StrictPass = 
    t2Login.status === 200 &&
    t2MoiOriginalBefore.status === 200 &&
    t2Logout.status === 200 &&
    t2MoiOriginalAfter.status === 401 &&
    t2Record && t2Record.jwt_version === 2;

  const t2AdaptedPass = 
    t2Login.status === 200 &&
    t2ProfilAdaptedBefore.status === 200 &&
    t2Logout.status === 200 &&
    t2ProfilAdaptedAfter.status === 401 &&
    t2Record && t2Record.jwt_version === 2;

  results['TEST-002'] = {
    status: t2StrictPass ? 'PASS' : 'FAIL',
    strict_status: t2StrictPass ? 'PASS' : 'FAIL',
    adapted_status: t2AdaptedPass ? 'PASS' : 'FAIL',
    adaptation_note: "Le plan de test spécifiait GET /api/auth/moi qui n'existe pas (HTTP 404). L'adaptation sur l'endpoint authentifié réel GET /api/auth/profil démontre le rejet HTTP 401 après déconnexion.",
    observed: {
      login_status: t2Login.status,
      moi_original_before: t2MoiOriginalBefore,
      profil_adapted_before: t2ProfilAdaptedBefore,
      logout_status: t2Logout.status,
      moi_original_after: t2MoiOriginalAfter,
      profil_adapted_after: t2ProfilAdaptedAfter,
      db_jwt_version: t2Record ? t2Record.jwt_version : null
    }
  };
  saveProof('TEST-002_preuve-01.json', results['TEST-002']);
  console.log(`TEST-002 Statut Strict : ${results['TEST-002'].strict_status} | Statut Adapté : ${results['TEST-002'].adapted_status}`);

  // ----------------------------------------------------
  // TEST-003 : Étancheité Stricte des Secrets de Tokens
  // ----------------------------------------------------
  console.log('\n--- Exécution TEST-003 ---');
  const userId = t1Record ? t1Record.id : '00000000-0000-0000-0000-000000000000';
  const jwtSecret = process.env.JWT_SECRET || 'audit-jwt-secret-not-prod';
  const resetSecret = process.env.RESET_SECRET || 'audit-reset';

  // Token signé avec type: 'reset'
  const fakeResetToken = jwt.sign(
    { userId, email: 'aminata.ndiaye@example.com', type: 'reset' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  // Token signé avec RESET_SECRET
  const resetSecretToken = jwt.sign(
    { userId, email: 'aminata.ndiaye@example.com' },
    resetSecret,
    { expiresIn: '1h' }
  );

  // Appel original sur /api/auth/moi
  const t3ResResetTypeOriginal = await request('GET', '/api/auth/moi', null, fakeResetToken);
  const t3ResResetSecretOriginal = await request('GET', '/api/auth/moi', null, resetSecretToken);

  // Appel adapté sur endpoint protégé /api/auth/profil
  const t3ResResetTypeAdapted = await request('GET', '/api/auth/profil', null, fakeResetToken);
  const t3ResResetSecretAdapted = await request('GET', '/api/auth/profil', null, resetSecretToken);

  const t3Pass = 
    t3ResResetTypeAdapted.status === 401 &&
    t3ResResetSecretAdapted.status === 401 &&
    t3ResResetTypeAdapted.data.error === 'Ce jeton ne peut pas être utilisé comme session';

  results['TEST-003'] = {
    status: t3Pass ? 'PASS' : 'FAIL',
    adaptation_note: "Testé sur /api/auth/profil car /api/auth/moi n'existe pas.",
    observed: {
      original_endpoint_moi: {
        reset_type: t3ResResetTypeOriginal.status,
        reset_secret: t3ResResetSecretOriginal.status
      },
      adapted_endpoint_profil: {
        reset_type: {
          status: t3ResResetTypeAdapted.status,
          body: t3ResResetTypeAdapted.data
        },
        reset_secret: {
          status: t3ResResetSecretAdapted.status,
          body: t3ResResetSecretAdapted.data
        }
      }
    }
  };
  saveProof('TEST-003_preuve-01.json', results['TEST-003']);
  console.log(`TEST-003 Statut : ${results['TEST-003'].status}`);

  // ----------------------------------------------------
  // TEST-004 : Suppression Autonome & Période de Grâce (RGPD)
  // ----------------------------------------------------
  console.log('\n--- Exécution TEST-004 ---');
  // Se reconnecter pour avoir un token frais (jwt_version mis à jour)
  const t4Login = await request('POST', '/api/auth/connexion', {
    email: 'aminata.ndiaye@example.com',
    mot_de_passe: 'TestPassword2026!'
  });
  const tokenFresh = t4Login.data.token;

  // 1. Demande de suppression avec confirmation requise par l'API
  const t4DeleteOriginalPayload = await request('POST', '/api/auth/supprimer-compte', {
    mot_de_passe: 'TestPassword2026!'
  }, tokenFresh);

  // Appel adapté avec la confirmation 'SUPPRIMER' requise par la route
  const t4DeleteAdaptedPayload = await request('POST', '/api/auth/supprimer-compte', {
    mot_de_passe: 'TestPassword2026!',
    confirmation: 'SUPPRIMER'
  }, tokenFresh);

  // 2. Vérification DB
  const t4DbStep2 = await pool.query(
    'SELECT id, email, supprime_le, supprime_par_utilisateur FROM utilisateurs WHERE email=$1',
    ['aminata.ndiaye@example.com']
  );

  // 3. Après suppression, l'API révoque la session précédente via jwt_version + 1.
  // Reconnexion pour obtenir le nouveau jeton valide pendant la période de grâce :
  const t4ReLogin = await request('POST', '/api/auth/connexion', {
    email: 'aminata.ndiaye@example.com',
    mot_de_passe: 'TestPassword2026!'
  });
  const tokenGrace = t4ReLogin.data.token;

  // 4. Statut suppression avec la nouvelle session
  const t4StatutRes = await request('GET', '/api/auth/statut-suppression', null, tokenGrace);

  // 5. Annulation de suppression
  const t4CancelRes = await request('POST', '/api/auth/annuler-suppression', null, tokenGrace);

  // 6. Vérification DB après annulation
  const t4DbStep5 = await pool.query(
    'SELECT id, email, supprime_le, supprime_par_utilisateur FROM utilisateurs WHERE email=$1',
    ['aminata.ndiaye@example.com']
  );

  const t4Pass = 
    t4DeleteAdaptedPayload.status === 200 &&
    t4DbStep2.rows[0] &&
    t4DbStep2.rows[0].supprime_le !== null &&
    t4DbStep2.rows[0].supprime_par_utilisateur === true &&
    t4ReLogin.status === 200 &&
    t4ReLogin.data.user.en_cours_de_suppression === true &&
    t4StatutRes.status === 200 &&
    t4StatutRes.data.en_cours_de_suppression === true &&
    t4CancelRes.status === 200 &&
    t4DbStep5.rows[0] &&
    t4DbStep5.rows[0].supprime_le === null;

  results['TEST-004'] = {
    status: t4Pass ? 'PASS' : 'FAIL',
    adaptation_note: "1) Le payload original exigeait { confirmation: 'SUPPRIMER' }. 2) Comme /api/auth/supprimer-compte révoque immédiatement les sessions existantes en incrémentant jwt_version, l'utilisateur doit se reconnecter pour récupérer sa session de grâce avant d'annuler.",
    observed: {
      original_payload_call: { status: t4DeleteOriginalPayload.status, body: t4DeleteOriginalPayload.data },
      adapted_payload_call: { status: t4DeleteAdaptedPayload.status, body: t4DeleteAdaptedPayload.data },
      db_step2: t4DbStep2.rows[0],
      relogin_grace: { status: t4ReLogin.status, user: t4ReLogin.data.user },
      statut_call: { status: t4StatutRes.status, body: t4StatutRes.data },
      cancel_call: { status: t4CancelRes.status, body: t4CancelRes.data },
      db_step5: t4DbStep5.rows[0]
    }
  };
  saveProof('TEST-004_preuve-01.json', results['TEST-004']);
  console.log(`TEST-004 Statut : ${results['TEST-004'].status}`);

  await pool.end();
  return results;
}

run().catch(err => {
  console.error('Erreur section 1:', err);
  process.exit(1);
});
