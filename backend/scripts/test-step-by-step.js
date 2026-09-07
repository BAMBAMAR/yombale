const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../models/db');
const {
  normaliserTelephoneSenegal,
  nettoyerNomBoutique,
  toTitleCase,
  detecterQuartier,
} = require('../services/prospection');
const { estDesinscrit } = require('../services/whatsapp');

async function testStepByStep() {
  console.log('[STEP 1] Querying annonces_classifiees...');
  const t0 = Date.now();
  const resAnnonces = await pool.query(`
    SELECT contact_nom, contact_tel, titre, categorie_slug, quartier, ville
    FROM annonces_classifiees
    WHERE contact_tel IS NOT NULL AND contact_tel != '' AND contact_tel != 'Voir sur Facebook'
    ORDER BY created_at DESC
    LIMIT 1000
  `);
  console.log(`[STEP 1 DONE] Found ${resAnnonces.rows.length} rows in ${Date.now() - t0}ms`);

  console.log('[STEP 2] Processing rows...');
  let inseres = 0;
  let doublons = 0;
  let ignores = 0;

  for (let i = 0; i < Math.min(20, resAnnonces.rows.length); i++) {
    const a = resAnnonces.rows[i];
    const tItem = Date.now();
    const norm = normaliserTelephoneSenegal(a.contact_tel);
    if (!norm.valide) { ignores++; continue; }

    const isDes = estDesinscrit ? await estDesinscrit(norm.national) : false;
    if (isDes) { ignores++; continue; }

    if (a.categorie_slug === 'emploi' || a.categorie_slug === 'recrutement') { ignores++; continue; }

    const quartierDetecte = detecterQuartier(`${a.titre || ''} ${a.quartier || ''} ${a.ville || ''}`) || a.quartier || a.ville || 'Dakar';
    const nomNettoye = a.contact_nom ? toTitleCase(a.contact_nom) : nettoyerNomBoutique(a.titre, a.categorie_slug || 'mode', quartierDetecte);
    const categorie = a.categorie_slug || 'mode';
    const source = 'annonces_classifiees';

    const query = `
      INSERT INTO prospection_leads (
        nom_boutique, contact_nom, telephone, telephone_brut, operateur,
        categorie, ville, quartier, source, statut
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'nouveau')
      ON CONFLICT (telephone) DO NOTHING
      RETURNING id
    `;
    const values = [nomNettoye, a.contact_nom ? toTitleCase(a.contact_nom) : null, norm.national, norm.brut, norm.operateur, categorie, a.ville || 'Dakar', quartierDetecte, source];
    const resDb = await pool.query(query, values);
    if (resDb.rows.length > 0) inseres++;
    else doublons++;
    console.log(`  Row ${i+1}/${resAnnonces.rows.length}: ${norm.national} -> ${resDb.rows.length > 0 ? 'INS' : 'DUP'} in ${Date.now() - tItem}ms`);
  }

  console.log(`Finished 20 test rows: inseres=${inseres}, doublons=${doublons}, ignores=${ignores}`);
  process.exit(0);
}

testStepByStep().catch(e => { console.error('CRASH:', e); process.exit(1); });
