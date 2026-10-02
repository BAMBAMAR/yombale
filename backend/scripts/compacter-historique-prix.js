#!/usr/bin/env node
/**
 * backend/scripts/compacter-historique-prix.js : AUD-190
 * Supprime les lignes de `historique_prix` situées au milieu d'un palier de prix (voir lib/compactionHistorique.js).
 *
 * Usage :
 *   node backend/scripts/compacter-historique-prix.js                    (lecture seule : compte seulement)
 *   node backend/scripts/compacter-historique-prix.js --execute          (suppression réelle, par lots)
 *   node backend/scripts/compacter-historique-prix.js --jours-min 60     (ne touche que les lignes de plus de 60 jours, défaut 35)
 *
 * À FAIRE AVANT --execute en production : sauvegarde de la base (suppression en masse, irréversible), exécution en heures creuses.
 */
require('dotenv').config();
const { pool } = require('../models/db');
const { compacterHistorique } = require('../lib/compactionHistorique');

const args = process.argv.slice(2);
const execute = args.includes('--execute');
const i = args.indexOf('--jours-min');
const joursMin = i >= 0 ? parseInt(args[i + 1], 10) : 35;

(async () => {
  console.log(`Mode : ${execute ? 'SUPPRESSION RÉELLE' : 'LECTURE SEULE (aucune écriture)'} | lignes de plus de ${joursMin} jours`);
  const b = await compacterHistorique(pool, { execute, joursMin });
  console.log(JSON.stringify(b, null, 2));
  console.log(`${execute ? 'Supprimées' : 'Supprimables'} : ${b.supprimables} sur ${b.lignesAvant} (${(100 * b.supprimables / Math.max(1, b.lignesAvant)).toFixed(1)} %)`);
})().catch((e) => { console.error('[COMPACTION]', e.message); process.exitCode = 1; }).finally(() => pool.end());
