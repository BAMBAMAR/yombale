const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../models/db');
const {
  ensureProspectionTables,
  calculerLeadQualityScore,
  calculerNopalouFitScore,
  estLeadEmploiOuInvalide,
} = require('../services/prospection');

async function reconcilier() {
  console.log('===========================================================');
  console.log('=== RÉCONCILIATION CRM PROSPECTION & CONVERSIONS NOPALOU ===');
  console.log('===========================================================\n');

  await ensureProspectionTables();

  // 1. S'assurer de la colonne fit_score
  await pool.query(`ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS fit_score INT DEFAULT 0;`);

  // 2. Identifier et convertir les leads qui possèdent une boutique existante
  console.log('[1/3] Réconciliation des conversions marchands...');
  const matchBoutiques = await pool.query(`
    SELECT DISTINCT p.id as lead_id, p.nom_boutique, p.telephone, b.nom as boutique_nom
    FROM boutiques b
    JOIN prospection_leads p ON (
      REGEXP_REPLACE(b.telephone, '[^0-9]', '', 'g') = REGEXP_REPLACE(p.telephone, '[^0-9]', '', 'g')
      OR REGEXP_REPLACE(b.telephone, '[^0-9]', '', 'g') LIKE '%' || REGEXP_REPLACE(p.telephone, '[^0-9]', '', 'g')
    )
    WHERE p.statut != 'converti'
  `);

  for (const m of matchBoutiques.rows) {
    await pool.query(
      `UPDATE prospection_leads 
       SET statut = 'converti', derniere_action_at = NOW(), updated_at = NOW(),
           notes = COALESCE(notes || ' | ', '') || 'Boutique convertie: ' || $1
       WHERE id = $2`,
      [m.boutique_nom, m.lead_id]
    );
  }
  console.log(`=> ${matchBoutiques.rows.length} nouvelles boutiques rattachées.\n`);

  // 3. Calculer les scores et filtrer les emplois en batch haute performance
  console.log('[2/3] Calcul des scores Qualité & Nopalou Fit et filtrage emploi...');
  const { rows: leads } = await pool.query('SELECT * FROM prospection_leads');
  console.log(`Traitement de ${leads.length} leads en mémoire...`);

  const updates = [];
  let emploisInvalides = 0;

  for (const lead of leads) {
    const isEmploi = estLeadEmploiOuInvalide(lead);
    const scoreQualite = calculerLeadQualityScore(lead);
    const fitScore = calculerNopalouFitScore(lead);

    let nouveauStatut = lead.statut;
    let nouvellesNotes = lead.notes;

    if (isEmploi && lead.statut !== 'converti') {
      nouveauStatut = 'invalide';
      nouvellesNotes = lead.notes ? `${lead.notes} | Hors-cible (Emploi/Recrutement)` : 'Hors-cible (Emploi/Recrutement)';
      emploisInvalides++;
    }

    updates.push({
      id: lead.id,
      score: scoreQualite,
      fit_score: fitScore,
      statut: nouveauStatut,
      notes: nouvellesNotes || null,
    });
  }

  // Batch updates par paquets de 100
  const CHUNK_SIZE = 100;
  for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
    const chunk = updates.slice(i, i + CHUNK_SIZE);
    const values = [];
    const valPlaceholders = chunk.map((u, idx) => {
      const offset = idx * 5;
      values.push(u.id, u.score, u.fit_score, u.statut, u.notes);
      return `($${offset + 1}::uuid, $${offset + 2}::int, $${offset + 3}::int, $${offset + 4}::varchar, $${offset + 5}::text)`;
    }).join(', ');

    const batchQuery = `
      UPDATE prospection_leads AS p
      SET 
        score = v.score,
        fit_score = v.fit_score,
        statut = v.statut,
        notes = v.notes,
        updated_at = NOW()
      FROM (VALUES ${valPlaceholders}) AS v(id, score, fit_score, statut, notes)
      WHERE p.id = v.id
    `;
    await pool.query(batchQuery, values);
  }
  console.log(`=> ${updates.length} leads mis à jour avec leurs scores (/100) et statuts assainis (${emploisInvalides} emplois invalidés).\n`);

  // 4. Statistiques finales CRM
  console.log('[3/3] Nouvelles statistiques globales du CRM:');
  const statsRes = await pool.query(`
    SELECT 
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE statut = 'nouveau') AS nouveaux,
      COUNT(*) FILTER (WHERE statut LIKE 'contacte%') AS contactes,
      COUNT(*) FILTER (WHERE statut = 'en_discussion') AS en_discussion,
      COUNT(*) FILTER (WHERE statut = 'converti') AS convertis,
      COUNT(*) FILTER (WHERE statut = 'invalide') AS invalides,
      COUNT(*) FILTER (WHERE statut = 'desinscrit') AS desinscrits,
      ROUND(AVG(score), 1) as avg_score,
      ROUND(AVG(fit_score), 1) as avg_fit_score
    FROM prospection_leads
  `);
  console.table(statsRes.rows);

  console.log('\n🎉 RÉCONCILIATION TERMINÉE AVEC SUCCÈS !');
  process.exit(0);
}

reconcilier().catch(err => {
  console.error('ERREUR RÉCONCILIATION:', err);
  process.exit(1);
});
