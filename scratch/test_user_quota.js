const path = require('path');
require('dotenv').config();
const { pool } = require(path.resolve(__dirname, '../backend/models/db'));
const cfg = require(path.resolve(__dirname, '../backend/lib/settingsCache'));

async function testQuota() {
  try {
    const userId = '7c921561-e405-4eac-a871-6c1b6c26f6a0';
    const maxCompte = (await cfg.getNum('max_boutiques_par_compte')) || 3;
    const maxTel = (await cfg.getNum('max_boutiques_par_telephone')) || 3;

    console.log(`Setting max_boutiques_par_compte: ${maxCompte}`);
    console.log(`Setting max_boutiques_par_telephone: ${maxTel}`);

    const userRes = await pool.query('SELECT nom, email, telephone FROM utilisateurs WHERE id=$1', [userId]);
    const user = userRes.rows[0];
    console.log('Utilisateur :', user);

    const countRes = await pool.query('SELECT COUNT(*)::int as cnt FROM boutiques WHERE utilisateur_id=$1', [userId]);
    console.log(`Nombre actuel de boutiques pour cet utilisateur: ${countRes.rows[0].cnt}`);

    // Tester la fonction de quota
    const { checkBoutiqueQuotas } = require(path.resolve(__dirname, '../backend/routes/boutiques'));
    
    // Simuler une tentative de création via Taf-Taf ou POST
    const cleanTel = user.telephone || '';
    const cleanEmail = user.email || '';

    const cntCompte = await pool.query('SELECT COUNT(*) FROM boutiques WHERE utilisateur_id=$1', [userId]);
    const isExceeded = parseInt(cntCompte.rows[0].count, 10) >= maxCompte;

    console.log(`\nLa création d'une boutique supplémentaire sera-t-elle BLOQUÉE par le backend ?`);
    console.log(`Dépassé (>= ${maxCompte}) ? ${isExceeded ? 'OUI (BLOQUÉ 🛑)' : 'NON (AUTORISÉ ✅)'}`);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

testQuota();
