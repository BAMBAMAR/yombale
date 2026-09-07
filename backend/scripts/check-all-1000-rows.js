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

async function testAll1000() {
  console.log('Fetching 1000 annonces...');
  const resAnnonces = await pool.query(`
    SELECT contact_nom, contact_tel, titre, categorie_slug, quartier, ville
    FROM annonces_classifiees
    WHERE contact_tel IS NOT NULL AND contact_tel != '' AND contact_tel != 'Voir sur Facebook'
    ORDER BY created_at DESC
    LIMIT 1000
  `);

  console.log(`Fetched ${resAnnonces.rows.length} rows. Starting validation...`);
  let errors = [];

  for (let i = 0; i < resAnnonces.rows.length; i++) {
    const a = resAnnonces.rows[i];
    try {
      const norm = normaliserTelephoneSenegal(a.contact_tel);
      if (!norm.valide) continue;

      if (a.categorie_slug === 'emploi' || a.categorie_slug === 'recrutement') continue;

      const quartierDetecte = detecterQuartier(`${a.titre || ''} ${a.quartier || ''} ${a.ville || ''}`) || a.quartier || a.ville || 'Dakar';
      const nomNettoye = a.contact_nom ? toTitleCase(a.contact_nom) : nettoyerNomBoutique(a.titre, a.categorie_slug || 'mode', quartierDetecte);
      const categorie = a.categorie_slug || 'mode';
      const source = 'annonces_classifiees';

      if (!nomNettoye) {
        errors.push({ idx: i, err: 'Empty nomNettoye', item: a });
      }
    } catch (err) {
      errors.push({ idx: i, err: err.message, stack: err.stack, item: a });
    }
  }

  console.log('Validation finished. Total errors in parsing/cleaning:', errors.length);
  if (errors.length > 0) {
    console.table(errors.slice(0, 10));
  }
  process.exit(0);
}

testAll1000();
