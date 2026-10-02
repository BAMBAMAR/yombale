#!/usr/bin/env node
/**
 * backend/scripts/assainir-residus-collecte.js : AUD-193
 * Remet à NULL les numéros « Voir sur Facebook » de annonces_immo et retire les paramètres de suivi des URL d'achat existantes.
 *
 * Usage :
 *   node backend/scripts/assainir-residus-collecte.js             (lecture seule : compte)
 *   node backend/scripts/assainir-residus-collecte.js --execute   (écriture)
 */
require('dotenv').config();
const { pool } = require('../models/db');
const { nettoyerResidus } = require('../lib/residusCollecte');

const execute = process.argv.includes('--execute');
(async () => {
  console.log(`Mode : ${execute ? 'ÉCRITURE' : 'LECTURE SEULE (aucune écriture)'}`);
  console.log(JSON.stringify(await nettoyerResidus(pool, { execute }), null, 2));
})().catch((e) => { console.error('[RESIDUS]', e.message); process.exitCode = 1; }).finally(() => pool.end());
