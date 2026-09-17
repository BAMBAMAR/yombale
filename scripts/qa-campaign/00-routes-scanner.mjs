import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.LOCAL_FRONTEND_URL || 'http://localhost:3001';

// Extraction récursive de toutes les routes de frontend-next/src/app
function getFrontendRoutes(dir, base = '') {
  let routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
        routes.push(...getFrontendRoutes(fullPath, base));
      } else if (!entry.name.startsWith('_') && !entry.name.startsWith('.')) {
        routes.push(...getFrontendRoutes(fullPath, base + '/' + entry.name));
      }
    } else if (entry.isFile()) {
      if (entry.name === 'page.tsx' || entry.name === 'page.js' || entry.name === 'page.jsx') {
        routes.push(base || '/');
      }
    }
  }
  return routes;
}

async function main() {
  console.log('======================================================================');
  console.log('🔍 PHASE 0 & 26 : SCANNER EXHAUSTIF DES ROUTES & LIENS FRONTEND');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('======================================================================\n');

  const appDir = path.resolve('frontend-next/src/app');
  const rawRoutes = getFrontendRoutes(appDir);
  rawRoutes.sort();

  console.log(`📋 Total des pages Next.js détectées: ${rawRoutes.length}\n`);

  // Données de test pour les paramètres dynamiques
  const sampleParams = {
    '[id]': '9f51e682-296f-4f57-ac86-98116487a3ed', // Id utilisateur ou ressource
    '[slug]': 'amar-immo',                          // Agence existante en DB
    '[bienId]': 'b0000000-0000-0000-0000-000000000001',
    '[produitId]': 'p0000000-0000-0000-0000-000000000001',
    '[sousCategorie]': 'telephones-portables',
    '[a]': 'samsung-s23',
    '[b]': 'iphone-15',
  };

  const results = {
    pass: [],
    fail: [],
    redirect: [],
    authRequired: [],
    notFound: [],
  };

  for (const rawRoute of rawRoutes) {
    // Remplacement des paramètres dynamiques
    let testUrl = rawRoute;
    for (const [param, val] of Object.entries(sampleParams)) {
      testUrl = testUrl.replaceAll(param, val);
    }

    const fullUrl = `${BASE_URL}${testUrl}`;
    const start = Date.now();
    try {
      const res = await fetch(fullUrl, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NopalouQABot/1.0',
        },
        redirect: 'manual', // Pour capturer les 307 / 308
      });
      const duration = Date.now() - start;
      const status = res.status;

      if (status === 200) {
        results.pass.push({ route: rawRoute, url: testUrl, status, duration });
        console.log(`✅ [200 OK] ${rawRoute.padEnd(45)} (${duration}ms)`);
      } else if (status === 301 || status === 302 || status === 307 || status === 308) {
        const loc = res.headers.get('location') || '';
        results.redirect.push({ route: rawRoute, url: testUrl, status, loc, duration });
        console.log(`🔀 [${status} REDIR] ${rawRoute.padEnd(45)} -> ${loc}`);
      } else if (status === 401 || status === 403) {
        results.authRequired.push({ route: rawRoute, url: testUrl, status, duration });
        console.log(`🔒 [${status} AUTH] ${rawRoute.padEnd(45)}`);
      } else if (status === 404) {
        results.notFound.push({ route: rawRoute, url: testUrl, status, duration });
        console.log(`❌ [404 DEAD] ${rawRoute.padEnd(45)}`);
      } else {
        results.fail.push({ route: rawRoute, url: testUrl, status, duration });
        console.log(`⚠️ [${status} FAIL] ${rawRoute.padEnd(45)}`);
      }
    } catch (err) {
      results.fail.push({ route: rawRoute, url: testUrl, error: err.message });
      console.log(`💥 [ERR] ${rawRoute.padEnd(45)}: ${err.message}`);
    }
  }

  console.log('\n======================================================================');
  console.log('📊 SYNTHÈSE DU SCAN DES ROUTES FRONTEND');
  console.log('======================================================================');
  console.log(`Total testées   : ${rawRoutes.length}`);
  console.log(`✅ 200 OK       : ${results.pass.length}`);
  console.log(`🔀 Redirections : ${results.redirect.length}`);
  console.log(`🔒 Protégées    : ${results.authRequired.length}`);
  console.log(`❌ 404 Not Found: ${results.notFound.length}`);
  console.log(`⚠️ Erreurs/Fail : ${results.fail.length}`);

  const reportPath = path.resolve('scripts/qa-campaign/report-routes-scan.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`💾 Rapport détaillé sauvegardé dans : ${reportPath}\n`);

  if (results.fail.length > 0 || results.notFound.length > 0) {
    console.log('⚠️ Attention : des routes 404 ou défaillantes ont été détectées.');
  }
}

main().catch(console.error);
