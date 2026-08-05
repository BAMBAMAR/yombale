require('dotenv').config();
const { pool } = require('../models/db');

async function main() {
  // Test 1: Plans actifs
  const { rows: plans } = await pool.query(`
    SELECT u.nom, u.telephone, a.plan, a.statut, a.fin
    FROM utilisateurs u
    JOIN abonnements a ON a.utilisateur_id = u.id
    WHERE a.statut = 'actif' AND a.fin > NOW()
    ORDER BY u.nom
  `);
  console.log('=== PLANS ACTIFS ===');
  plans.forEach(p => console.log(p.nom, '|', p.telephone, '|', p.plan, '| exp:', new Date(p.fin).toLocaleDateString('fr-FR')));

  // Test 2: Route catalogues-standards (backend direct)
  const res = await fetch('http://localhost:3000/api/boutiques/catalogues-standards');
  const data = await res.json();
  console.log('\n=== CATALOGUE STANDARD (Backend) ===');
  console.log('success:', data.success, '| nb categories:', Object.keys(data.catalogues || {}).length);
  console.log('Categories:', Object.keys(data.catalogues || {}).join(', '));

  // Test 3: Route via proxy Next.js
  const res2 = await fetch('http://localhost:3001/api/boutiques/catalogues-standards');
  const data2 = await res2.json();
  console.log('\n=== CATALOGUE STANDARD (Frontend Proxy) ===');
  console.log('nb categories:', Object.keys(data2.catalogues || {}).length, data2.error ? '| ERREUR: ' + data2.error : '');

  // Test 4: Protection API sans token
  const res3 = await fetch('http://localhost:3000/api/abonnements/mon-plan');
  console.log('\n=== PROTECTION API mon-plan (sans token) ===');
  console.log('Status HTTP:', res3.status, '(attendu: 401 ou 403)');

  // Test 5: Vérifier les routes boutique existantes
  const res4 = await fetch('http://localhost:3001/boutique/analytics', { redirect: 'manual' });
  console.log('\n=== PROTECTION URL /boutique/analytics ===');
  console.log('Status:', res4.status, '| Location:', res4.headers.get('location') || '(pas de redirection)');

  process.exit();
}

main().catch(err => { console.error(err.message); process.exit(1); });
