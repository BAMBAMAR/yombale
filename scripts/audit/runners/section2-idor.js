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
  console.log('=== DÉBUT EXÉCUTION SECTION 2 (TEST-005 & TEST-006) ===');
  const results = {};

  // ----------------------------------------------------
  // TEST-005 : Cloisonnement Multi-Tenant des Boutiques
  // ----------------------------------------------------
  console.log('\n--- Exécution TEST-005 ---');
  // Créer ou récupérer UserA et BoutiqueA
  const pw = 'Audit!Pass2026x';
  await pool.query('DELETE FROM utilisateurs WHERE email IN ($1, $2)', ['marchand.a.idor@audit.test', 'marchand.b.idor@audit.test']);

  const regA = await request('POST', '/api/auth/inscription', {
    nom: 'Marchand A IDOR',
    email: 'marchand.a.idor@audit.test',
    mot_de_passe: pw
  });
  const userA = regA.data.user;
  const tokenA = regA.data.token;

  const regB = await request('POST', '/api/auth/inscription', {
    nom: 'Marchand B IDOR',
    email: 'marchand.b.idor@audit.test',
    mot_de_passe: pw
  });
  const userB = regB.data.user;
  const tokenB = regB.data.token;

  // Créer Boutique A avec le token de User A
  const bA = await request('POST', '/api/boutiques', {
    nom: 'Boutique A IDOR',
    telephone: '771110001',
    ville: 'Dakar',
    categorie: 'mode'
  }, tokenA);
  const boutiqueAId = bA.data.boutique?.id || bA.data.id;

  // Créer Boutique B avec le token de User B
  const bB = await request('POST', '/api/boutiques', {
    nom: 'Boutique B IDOR',
    telephone: '771110002',
    ville: 'Dakar',
    categorie: 'electronique'
  }, tokenB);
  const boutiqueBId = bB.data.boutique?.id || bB.data.id;

  console.log(`Boutique A ID: ${boutiqueAId} (Propriétaire: ${userA.id})`);
  console.log(`Boutique B ID: ${boutiqueBId} (Propriétaire: ${userB.id})`);

  // Nettoyer security_audit_vault pour isoler les preuves du test
  await pool.query('DELETE FROM security_audit_vault WHERE user_id = $1', [userB.id]);

  // Étape 1 : User B tente de lire les commandes de Boutique A
  const t5GetCmd = await request('GET', `/api/comptabilite/${boutiqueAId}/commandes`, null, tokenB);

  // Étape 2 : User B tente d'insérer un produit dans Boutique A
  const t5PostProd = await request('POST', `/api/boutiques/${boutiqueAId}/produits`, {
    nom: 'Produit Infiltré IDOR',
    prix: 50000,
    quantite: 10
  }, tokenB);

  // Étape 3 : Vérifier la table security_audit_vault
  const t5Vault = await pool.query(
    'SELECT id, event_type, user_id, tenant_type, target_id, endpoint, method, created_at FROM security_audit_vault WHERE user_id=$1 ORDER BY created_at ASC',
    [userB.id]
  );

  const t5Pass =
    t5GetCmd.status === 403 &&
    t5PostProd.status === 403 &&
    t5Vault.rows.length >= 2 &&
    t5Vault.rows.every(r => r.event_type === 'IDOR_BOUTIQUE_ACCESS_DENIED' && r.target_id === boutiqueAId);

  results['TEST-005'] = {
    status: t5Pass ? 'PASS' : 'FAIL',
    observed: {
      get_commandes_cross_attempt: {
        status: t5GetCmd.status,
        body: t5GetCmd.data
      },
      post_produit_cross_attempt: {
        status: t5PostProd.status,
        body: t5PostProd.data
      },
      vault_events_count: t5Vault.rows.length,
      vault_records: t5Vault.rows
    }
  };
  saveProof('TEST-005_preuve-01.json', results['TEST-005']);
  console.log(`TEST-005 Statut : ${results['TEST-005'].status}`);

  // ----------------------------------------------------
  // TEST-006 : Cloisonnement Multi-Tenant des Agences
  // ----------------------------------------------------
  console.log('\n--- Exécution TEST-006 ---');
  // Créer ou récupérer Agence X et Agence Y
  await pool.query('DELETE FROM utilisateurs WHERE email IN ($1, $2)', ['agent.x@audit.test', 'agent.y@audit.test']);

  const regX = await request('POST', '/api/auth/inscription', {
    nom: 'Agent X Immo',
    email: 'agent.x@audit.test',
    mot_de_passe: pw
  });
  const tokenX = regX.data.token;
  const userXId = regX.data.user.id;

  const regY = await request('POST', '/api/auth/inscription', {
    nom: 'Agent Y Immo',
    email: 'agent.y@audit.test',
    mot_de_passe: pw
  });
  const tokenY = regY.data.token;
  const userYId = regY.data.user.id;

  // Créer Agence X
  const agXRes = await pool.query(
    `INSERT INTO agences_immo (utilisateur_id, nom, slug, telephone, ville)
     VALUES ($1, 'Agence X Audit', 'agence-x-audit', '772220001', 'Dakar')
     RETURNING id, slug`,
    [userXId]
  );
  const agenceX = agXRes.rows[0];

  // Créer Agence Y
  const agYRes = await pool.query(
    `INSERT INTO agences_immo (utilisateur_id, nom, slug, telephone, ville)
     VALUES ($1, 'Agence Y Audit', 'agence-y-audit', '772220002', 'Dakar')
     RETURNING id, slug`,
    [userYId]
  );
  const agenceY = agYRes.rows[0];

  console.log(`Agence X ID: ${agenceX.id} (Owner: ${userXId})`);
  console.log(`Agence Y ID: ${agenceY.id} (Owner: ${userYId})`);

  // Nettoyer audit vault pour User X
  await pool.query('DELETE FROM security_audit_vault WHERE user_id = $1', [userXId]);

  // Étape 1 : Agent X tente d'accéder aux baux de Agence Y
  const t6GetBauxCross = await request('GET', `/api/locatif-immo/agence/${agenceY.id}/baux`, null, tokenX);

  // Vérifier également avec le slug de l'agence Y
  const t6GetBauxCrossSlug = await request('GET', `/api/locatif-immo/agence/${agenceY.slug}/baux`, null, tokenX);

  // Vérifier la table security_audit_vault
  const t6Vault = await pool.query(
    'SELECT id, event_type, user_id, tenant_type, target_id, endpoint, method, created_at FROM security_audit_vault WHERE user_id=$1 ORDER BY created_at ASC',
    [userXId]
  );

  const t6Pass =
    t6GetBauxCross.status === 403 &&
    t6GetBauxCrossSlug.status === 403 &&
    t6Vault.rows.length >= 2 &&
    t6Vault.rows.every(r => r.event_type === 'IDOR_AGENCE_ACCESS_DENIED');

  results['TEST-006'] = {
    status: t6Pass ? 'PASS' : 'FAIL',
    observed: {
      get_baux_by_uuid: {
        status: t6GetBauxCross.status,
        body: t6GetBauxCross.data
      },
      get_baux_by_slug: {
        status: t6GetBauxCrossSlug.status,
        body: t6GetBauxCrossSlug.data
      },
      vault_events_count: t6Vault.rows.length,
      vault_records: t6Vault.rows
    }
  };
  saveProof('TEST-006_preuve-01.json', results['TEST-006']);
  console.log(`TEST-006 Statut : ${results['TEST-006'].status}`);

  await pool.end();
  return results;
}

run().catch(err => {
  console.error('Erreur section 2:', err);
  process.exit(1);
});
