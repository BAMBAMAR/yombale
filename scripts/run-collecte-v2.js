#!/usr/bin/env node
/**
 * scripts/run-collecte-v2.js
 * Exécute la collecte automatisée Nopalou V2 (Store API, Cheerio, Keur-Immo)
 * Utilisable directement en ligne de commande ou via le Planificateur de tâches Windows.
 */

'use strict';

require('dotenv').config();
const { lancerCollecteV2 } = require('../backend/services/scraper');
const { pool } = require('../backend/models/db');

async function main() {
  const args = process.argv.slice(2);
  const sourcesDemandees = args.length > 0 ? args.filter(a => !a.startsWith('--')) : null;

  console.log('============================================================');
  console.log('  COLLECTE AUTOMATISÉE NOPALOU V2 (PLANIFICATEUR / TÂCHE)');
  console.log('============================================================\n');

  try {
    const rapport = await lancerCollecteV2(sourcesDemandees && sourcesDemandees.length > 0 ? sourcesDemandees : null);
    
    let nbOk = 0;
    let nbEchecs = 0;
    for (const [id, res] of Object.entries(rapport.sources)) {
      if (res.statut === 'ok' || res.statut === 'degrade') {
        nbOk++;
      } else {
        nbEchecs++;
      }
    }

    console.log(`\nBilan de la tâche V2 : ${nbOk} source(s) réussie(s), ${nbEchecs} en échec.`);
    console.log(`Durée totale : ${rapport.duree_s} secondes.`);

    await pool.end();
    // Succès si au moins une source a réussi ou si aucune n'a échoué mortellement
    process.exit(nbOk > 0 ? 0 : 1);
  } catch (err) {
    console.error('Erreur fatale exécution V2:', err.message);
    try { await pool.end(); } catch {}
    process.exit(1);
  }
}

main();
