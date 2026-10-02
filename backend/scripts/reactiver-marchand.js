#!/usr/bin/env node
/**
 * backend/scripts/reactiver-marchand.js : AUD-195
 * Réactive un marchand désactivé par `assainir-donnees-scraping-v2.js` (S-007) à tort. Les OFFRES ne sont pas remises en stock
 * ici : leur prix et leur disponibilité datent d'avant la désactivation. Le prochain passage de collecte les remet en stock une
 * à une si elles existent toujours chez le marchand (sinon elles restent hors stock, ce qui est exact).
 *
 * Usage :
 *   node backend/scripts/reactiver-marchand.js "Univers Cosmetix"             (lecture seule)
 *   node backend/scripts/reactiver-marchand.js "Univers Cosmetix" --execute   (écriture)
 */
require('dotenv').config();
const { pool } = require('../models/db');

const nom = process.argv[2];
const execute = process.argv.includes('--execute');

(async () => {
  if (!nom || nom.startsWith('--')) throw new Error('Nom du marchand requis');
  console.log(`Mode : ${execute ? 'ÉCRITURE' : 'LECTURE SEULE (aucune écriture)'}`);
  const { rows } = await pool.query(
    `SELECT m.id, m.nom, m.actif,
            (SELECT count(*)::int FROM offres o WHERE o.marchand_id = m.id) AS offres,
            (SELECT count(*)::int FROM offres o WHERE o.marchand_id = m.id AND o.stock = true) AS en_stock
       FROM marchands m WHERE m.nom = $1`, [nom]);
  if (!rows.length) { console.log('Marchand introuvable.'); return; }
  console.log(JSON.stringify(rows, null, 2));
  if (execute) {
    const r = await pool.query('UPDATE marchands SET actif = true WHERE nom = $1 AND actif = false', [nom]);
    console.log(`Marchands réactivés : ${r.rowCount}`);
  }
})().catch((e) => { console.error('[REACTIVER]', e.message); process.exitCode = 1; }).finally(() => pool.end());
