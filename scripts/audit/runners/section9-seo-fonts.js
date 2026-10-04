/**
 * TEST-016 : Zéro CDN fonts & Génération OpenGraph native (Règle d'or & SEO)
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

async function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          status: res.statusCode,
          headers: res.headers,
          length: buffer.length,
          isPng: buffer.length > 8 && buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a'
        });
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('=== DÉBUT EXÉCUTION SECTION 9 (TEST-016) ===');
  const results = {
    test_id: 'TEST-016',
    date: new Date().toISOString(),
    status: 'PASS',
    verifications: {}
  };

  // 1. Static Scan - Absence totale de CDN de polices externes
  const forbiddenPatterns = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.jsdelivr.net'
  ];

  const srcDir = path.resolve(__dirname, '../../../frontend-next/src');
  const violations = [];

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scanDir(fullPath);
        }
      } else if (/\.(tsx|ts|jsx|js|css|html)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const pattern of forbiddenPatterns) {
          if (content.includes(pattern)) {
            violations.push({ file: path.relative(srcDir, fullPath), pattern });
          }
        }
      }
    }
  }

  scanDir(srcDir);
  results.verifications.external_cdn_scan = {
    scanned_dir: 'frontend-next/src',
    forbidden_patterns_checked: forbiddenPatterns,
    violations_count: violations.length,
    violations
  };

  // 2. Anti-AI-Slop Linter check
  let linterOutput = '';
  let linterSuccess = false;
  try {
    linterOutput = execSync('node scripts/lint-ai-slop.mjs', {
      cwd: path.resolve(__dirname, '../../../frontend-next'),
      encoding: 'utf8'
    });
    linterSuccess = true;
  } catch (err) {
    linterOutput = err.stdout ? err.stdout.toString() : err.message;
    linterSuccess = false;
  }
  results.verifications.linter_slop = {
    success: linterSuccess,
    output_summary: linterOutput.slice(0, 300)
  };

  // 3. OpenGraph Social Image Endpoint Checks
  // Check Root OpenGraph Image
  try {
    const rootOg = await httpGet('http://localhost:3001/opengraph-image');
    results.verifications.root_opengraph = {
      url: 'http://localhost:3001/opengraph-image',
      status: rootOg.status,
      contentType: rootOg.headers['content-type'],
      bytes: rootOg.length,
      isPng: rootOg.isPng
    };
  } catch (err) {
    results.verifications.root_opengraph = { error: err.message };
  }

  // Check Produit OpenGraph Image
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const prodRes = await pool.query('SELECT id FROM produits ORDER BY id DESC LIMIT 1');
    const prodId = prodRes.rows[0]?.id || '4f4eb347-6219-4e67-8fc7-de8b5b2af68b';
    await pool.end();

    const prodOg = await httpGet(`http://localhost:3001/produit/${prodId}/opengraph-image`);
    results.verifications.produit_opengraph = {
      url: `http://localhost:3001/produit/${prodId}/opengraph-image`,
      status: prodOg.status,
      contentType: prodOg.headers['content-type'],
      bytes: prodOg.length,
      isPng: prodOg.isPng
    };
  } catch (err) {
    results.verifications.produit_opengraph = { error: err.message };
  }

  // Check if OpenGraph returned 200 and image/png
  const rootPass = results.verifications.root_opengraph?.status === 200 &&
                   results.verifications.root_opengraph?.contentType?.includes('image/png');
  const prodPass = results.verifications.produit_opengraph?.status === 200 &&
                   results.verifications.produit_opengraph?.contentType?.includes('image/png');
  const zeroViolations = violations.length === 0;

  if (rootPass && prodPass && zeroViolations) {
    results.status = 'PASS';
  } else {
    results.status = 'FAIL';
  }

  console.log('Résultats TEST-016:', JSON.stringify(results, null, 2));

  // Écriture de la preuve
  const proofDir = path.resolve(__dirname, '../../../audit/04_RESULTATS/PREUVES');
  const altProofDir = path.resolve(__dirname, '../../../audit/03_PREUVES');
  if (!fs.existsSync(proofDir)) fs.mkdirSync(proofDir, { recursive: true });
  if (!fs.existsSync(altProofDir)) fs.mkdirSync(altProofDir, { recursive: true });

  const proofFile1 = path.join(proofDir, 'TEST-016_preuve-01.json');
  const proofFile2 = path.join(altProofDir, 'PREUVE-TEST-016.json');
  fs.writeFileSync(proofFile1, JSON.stringify(results, null, 2));
  fs.writeFileSync(proofFile2, JSON.stringify(results, null, 2));

  console.log(`Preuve enregistrée: ${proofFile1}`);
  process.exit(results.status === 'PASS' ? 0 : 1);
}

run().catch(err => {
  console.error('Erreur section 9:', err);
  process.exit(1);
});
