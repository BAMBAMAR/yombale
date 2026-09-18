// scripts/test-security-pen.mjs — Suite de tests de pénétration et d'isolation BOLA/RBAC
import 'dotenv/config';
import http from 'http';

const BASE_URL = 'http://127.0.0.1:3000';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runPenTests() {
  console.log('🛡️  LANCEMENT DE LA BATTERIE DE TESTS DE PÉNÉTRATION MULTI-TENANT & RBAC...\n');

  let passed = 0;
  let failed = 0;

  async function testCase(name, fn) {
    try {
      const result = await fn();
      if (result.success) {
        console.log(`✅ [PASS] ${name}`);
        passed++;
      } else {
        console.error(`❌ [FAIL] ${name} -> ${result.reason}`);
        failed++;
      }
    } catch (err) {
      console.error(`💥 [ERROR] ${name} -> ${err.message}`);
      failed++;
    }
  }

  const BQ_ID = 'd6470623-2372-446c-9823-bf62e118596c'; // misbah-electro
  const BQ_SLUG = 'misbah-electro';
  const TERMINAL_TOKEN = '67883327-4b23-414f-b7fc-19988e13099d';

  // TEST 1 : GET /:id/caissiers anonyme
  await testCase('Chantier 1A : GET /api/boutiques/misbah-electro/caissiers sans token -> 403', async () => {
    const res = await makeRequest(`/api/boutiques/${BQ_SLUG}/caissiers`);
    if (res.status === 403) return { success: true };
    return { success: false, reason: `Status attendu 403, reçu ${res.status}: ${JSON.stringify(res.body)}` };
  });

  // TEST 1B : GET /:id/caissiers avec X-Terminal-Token légitime -> 200
  await testCase('Chantier 1B : GET /api/boutiques/misbah-electro/caissiers avec X-Terminal-Token -> 200', async () => {
    const res = await makeRequest(`/api/boutiques/${BQ_SLUG}/caissiers`, {
      headers: { 'X-Terminal-Token': TERMINAL_TOKEN }
    });
    if (res.status === 200 && Array.isArray(res.body.caissiers)) return { success: true };
    return { success: false, reason: `Status attendu 200 avec caissiers, reçu ${res.status}: ${JSON.stringify(res.body)}` };
  });

  // TEST 2 : GET /:id/pos-historique anonyme
  await testCase('Chantier 2A : GET /api/boutiques/:id/pos-historique sans token -> 403', async () => {
    const res = await makeRequest(`/api/boutiques/${BQ_ID}/pos-historique`);
    if (res.status === 403) return { success: true };
    return { success: false, reason: `Status attendu 403, reçu ${res.status}: ${JSON.stringify(res.body)}` };
  });

  // TEST 3 : POST /:id/pos-vente anonyme
  await testCase('Chantier 2B : POST /api/boutiques/:id/pos-vente sans token -> 403', async () => {
    const res = await makeRequest(`/api/boutiques/${BQ_ID}/pos-vente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { articles: [{ nom: 'Test Pen', prix: 1000, quantite: 1 }], total: 1000 }
    });
    if (res.status === 403) return { success: true };
    return { success: false, reason: `Status attendu 403, reçu ${res.status}: ${JSON.stringify(res.body)}` };
  });

  // TEST 4 : POST /:id/pos-incident anonyme
  await testCase('Chantier 2C : POST /api/boutiques/:id/pos-incident sans token -> 403', async () => {
    const res = await makeRequest(`/api/boutiques/${BQ_ID}/pos-incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { motif: 'Tentative hack' }
    });
    if (res.status === 403) return { success: true };
    return { success: false, reason: `Status attendu 403, reçu ${res.status}: ${JSON.stringify(res.body)}` };
  });

  // TEST 5 : GET /:id/fidelite/rechercher anonyme (Dumping clients)
  await testCase('Chantier 3A : GET /api/boutiques/:id/fidelite/rechercher sans token -> 403', async () => {
    const res = await makeRequest(`/api/boutiques/${BQ_ID}/fidelite/rechercher`);
    if (res.status === 403) return { success: true };
    return { success: false, reason: `Status attendu 403, reçu ${res.status}: ${JSON.stringify(res.body)}` };
  });

  // TEST 6 : POST /:id/fidelite/enroler anonyme
  await testCase('Chantier 3B : POST /api/boutiques/:id/fidelite/enroler sans token -> 403', async () => {
    const res = await makeRequest(`/api/boutiques/${BQ_ID}/fidelite/enroler`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { telephone: '770000000', nom: 'Hacker' }
    });
    if (res.status === 403) return { success: true };
    return { success: false, reason: `Status attendu 403, reçu ${res.status}: ${JSON.stringify(res.body)}` };
  });

  // TEST 7 : GET /api/comptabilite/:boutiqueId/commandes anonyme (Aspiration BOLA)
  await testCase('Chantier 4 : GET /api/comptabilite/:id/commandes sans token -> 401 ou 403', async () => {
    const res = await makeRequest(`/api/comptabilite/${BQ_ID}/commandes`);
    if (res.status === 401 || res.status === 403) return { success: true };
    return { success: false, reason: `Status attendu 401/403, reçu ${res.status}: ${JSON.stringify(res.body)}` };
  });

  // TEST 8 : GET /api/boutiques/commandes/suivi sans query ou trop court
  await testCase('Chantier 5A : GET /api/boutiques/commandes/suivi?q=CMD (recherche floue interdite) -> 400', async () => {
    const res = await makeRequest('/api/boutiques/commandes/suivi?q=CMD');
    if (res.status === 400) return { success: true };
    return { success: false, reason: `Status attendu 400, reçu ${res.status}: ${JSON.stringify(res.body)}` };
  });

  // TEST 9 : GET /api/boutiques/commandes/suivi avec numéro tronqué
  await testCase('Chantier 5B : GET /api/boutiques/commandes/suivi?q=77000 (téléphone partiel) -> 400', async () => {
    const res = await makeRequest('/api/boutiques/commandes/suivi?q=77000');
    if (res.status === 400) return { success: true };
    return { success: false, reason: `Status attendu 400, reçu ${res.status}: ${JSON.stringify(res.body)}` };
  });

  // TEST 10 : Journalisation d'audit de sécurité
  await testCase('Chantier 1 & 2 : Enregistrement de la tentative dans security_audit_vault', async () => {
    const dbModule = await import('../backend/models/db.js');
    const pool = dbModule.default?.pool || dbModule.pool;
    const { rows } = await pool.query(
      `SELECT event_type, tenant_type, target_id, ip_address, created_at FROM security_audit_vault ORDER BY created_at DESC LIMIT 3`
    );
    if (rows.length > 0) {
      console.log(`   ℹ️ Dernière alerte de sécurité enregistrée : [${rows[0].event_type}] IP: ${rows[0].ip_address} Cible: ${rows[0].target_id}`);
      return { success: true };
    }
    return { success: false, reason: 'Aucun log trouvé dans security_audit_vault' };
  });

  console.log(`\n=======================================================`);
  console.log(`   RÉSULTAT DES TESTS : ${passed} RÉUSSIS / ${failed} ÉCHECS`);
  console.log(`=======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runPenTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
