const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../models/db');
const {
  normaliserTelephoneSenegal,
  nettoyerNomBoutique,
  toTitleCase,
  detecterQuartier,
  estLeadEmploiOuInvalide,
} = require('../services/prospection');
const { estDesinscrit } = require('../services/whatsapp');

async function testFastAutoSource() {
  const start = Date.now();
  console.log('[FAST AUTO-SOURCE] Début...');

  const resAnnonces = await pool.query(`
    SELECT contact_nom, contact_tel, titre, categorie_slug, quartier, ville
    FROM annonces_classifiees
    WHERE contact_tel IS NOT NULL AND contact_tel != '' AND contact_tel != 'Voir sur Facebook'
    ORDER BY created_at DESC
    LIMIT 1000
  `);
  console.log(`[1] Récupéré ${resAnnonces.rows.length} annonces en ${Date.now() - start}ms`);

  // 1. Parsing & Déduplication en mémoire
  const leadsParTel = new Map();

  for (const a of resAnnonces.rows) {
    const norm = normaliserTelephoneSenegal(a.contact_tel);
    if (!norm.valide || norm.operateur === 'Fixe') continue;

    // Déjà vu dans ce lot
    if (leadsParTel.has(norm.national)) continue;

    // Filtrer emploi
    if (a.categorie_slug === 'emploi' || a.categorie_slug === 'recrutement') continue;
    if (estLeadEmploiOuInvalide({ nom_boutique: a.titre, notes: a.contact_nom, categorie: a.categorie_slug })) continue;

    const quartierDetecte = detecterQuartier(`${a.titre || ''} ${a.quartier || ''} ${a.ville || ''}`) || a.quartier || a.ville || 'Dakar';
    const nomNettoye = a.contact_nom ? toTitleCase(a.contact_nom) : nettoyerNomBoutique(a.titre, a.categorie_slug || 'mode', quartierDetecte);
    const categorie = a.categorie_slug || 'mode';

    leadsParTel.set(norm.national, {
      nom_boutique: nomNettoye,
      contact_nom: a.contact_nom ? toTitleCase(a.contact_nom) : null,
      telephone: norm.national,
      telephone_brut: norm.brut,
      operateur: norm.operateur,
      categorie,
      ville: a.ville || 'Dakar',
      quartier: quartierDetecte,
      source: 'annonces_classifiees',
    });
  }

  const uniqueLeads = Array.from(leadsParTel.values());
  console.log(`[2] Normalisé et dédupliqué en mémoire : ${uniqueLeads.length} leads uniques en ${Date.now() - start}ms`);

  // 2. Vérifier les téléphones déjà existants en BDD en 1 seule requête
  const tousTels = uniqueLeads.map(l => l.telephone);
  const resExistants = await pool.query(
    'SELECT telephone FROM prospection_leads WHERE telephone = ANY($1::text[])',
    [tousTels]
  );
  const existantsSet = new Set(resExistants.rows.map(r => r.telephone));
  console.log(`[3] Téléphones déjà en BDD : ${existantsSet.size} en ${Date.now() - start}ms`);

  // 3. Filtrer uniquement les nouveaux
  const aInserer = uniqueLeads.filter(l => !existantsSet.has(l.telephone));
  console.log(`[4] Nouveaux leads à insérer : ${aInserer.length}`);

  let inseres = 0;
  if (aInserer.length > 0) {
    // Insertion par batch de 50 pour performance maximale et zéro timeout
    const CHUNK_SIZE = 50;
    for (let i = 0; i < aInserer.length; i += CHUNK_SIZE) {
      const chunk = aInserer.slice(i, i + CHUNK_SIZE);
      const values = [];
      const placeholders = chunk.map((l, idx) => {
        const offset = idx * 9;
        values.push(l.nom_boutique, l.contact_nom, l.telephone, l.telephone_brut, l.operateur, l.categorie, l.ville, l.quartier, l.source);
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, 'nouveau')`;
      }).join(', ');

      const query = `
        INSERT INTO prospection_leads (
          nom_boutique, contact_nom, telephone, telephone_brut, operateur,
          categorie, ville, quartier, source, statut
        ) VALUES ${placeholders}
        ON CONFLICT (telephone) DO NOTHING
        RETURNING id
      `;
      const resIns = await pool.query(query, values);
      inseres += resIns.rows.length;
    }
  }

  const dureeTotale = Date.now() - start;
  console.log(`\n🎉 SUCCÈS TOTAL en ${dureeTotale}ms !`);
  console.log({
    trouves: resAnnonces.rows.length,
    uniques: uniqueLeads.length,
    doublons: existantsSet.size,
    inseres,
    dureeMs: dureeTotale,
  });

  process.exit(0);
}

testFastAutoSource().catch(e => { console.error('ERR:', e); process.exit(1); });
