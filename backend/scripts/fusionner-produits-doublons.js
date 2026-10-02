#!/usr/bin/env node
/**
 * backend/scripts/fusionner-produits-doublons.js : AUD-181
 * Fusionne les fiches `produits` dont le nom normalisé est identique (voir lib/fusionProduits.js).
 *
 * Usage :
 *   node backend/scripts/fusionner-produits-doublons.js                     (lecture seule : plan + 40 exemples à relire)
 *   node backend/scripts/fusionner-produits-doublons.js --execute           (exécution réelle, une transaction par groupe)
 *   node backend/scripts/fusionner-produits-doublons.js --limite 20 --execute
 *   node backend/scripts/fusionner-produits-doublons.js --annuler <ancien_id>   (recrée la fiche supprimée)
 *
 * À FAIRE AVANT --execute en production : relire les exemples du plan (taux de faux positifs à mesurer sur ~200 paires,
 * cible < 2 %), sauvegarder la base, vérifier `produits_alias` après un premier lot (--limite).
 */
require('dotenv').config();
const { pool } = require('../models/db');
const { fusionnerDoublons, annulerFusion, remplirNomsNormalises, nettoyerNomsEntites } = require('../lib/fusionProduits');

const args = process.argv.slice(2);
const execute = args.includes('--execute');
const iLimite = args.indexOf('--limite');
const limite = iLimite >= 0 ? parseInt(args[iLimite + 1], 10) : Infinity;
const iAnnuler = args.indexOf('--annuler');

(async () => {
  if (iAnnuler >= 0) {
    console.log(JSON.stringify(await annulerFusion(pool, args[iAnnuler + 1]), null, 2));
    return;
  }
  console.log(`Mode : ${execute ? 'EXÉCUTION RÉELLE' : 'LECTURE SEULE (aucune écriture)'}`);
  const remplis = await remplirNomsNormalises(pool);
  console.log(`Noms normalisés calculés (colonne dérivée nom_normalise, seule écriture du mode lecture seule) : ${remplis}`);
  const nbEntites = await nettoyerNomsEntites(pool, { execute });
  console.log(`Noms contenant des entités HTML ${execute ? 'décodés' : 'à décoder'} : ${nbEntites}`);
  const bilan = await fusionnerDoublons(pool, { execute, limiteGroupes: limite });
  console.log(JSON.stringify({ ...bilan, exemples: undefined }, null, 2));
  console.log('\nExemples à relire (canonique / doublon) :');
  bilan.exemples.slice(0, 40).forEach((e) => console.log(`  ${e.nom_canonique.slice(0, 55)} | ${e.nom_doublon.slice(0, 55)} | offres ${e.offres_doublon}${e.conflits ? ` | CONFLITS ${e.conflits}` : ''}`));
})().catch((e) => { console.error('[FUSION]', e.message); process.exitCode = 1; }).finally(() => pool.end());
