// backend/scripts/reconcilier-vrais-donnees-leads.js
require('dotenv').config();
const { pool } = require('../models/db');

async function run() {
  console.log('=== RÉCONCILIATION DES DONNÉES DE PROSPECTION (VRAIES DONNÉES) ===\n');

  // Stats avant
  const statsAvant = await pool.query(`
    SELECT 
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE statut = 'nouveau') AS nouveaux,
      COUNT(*) FILTER (WHERE statut LIKE 'contacte%') AS contactes,
      COUNT(*) FILTER (WHERE statut = 'en_discussion') AS en_discussion,
      COUNT(*) FILTER (WHERE statut = 'converti') AS convertis,
      COUNT(*) FILTER (WHERE statut = 'desinscrit') AS desinscrits,
      COUNT(*) FILTER (WHERE statut = 'invalide') AS invalides,
      COUNT(*) FILTER (WHERE score >= 70) AS qualifies,
      COUNT(*) FILTER (WHERE fit_score >= 70) AS haut_fit,
      ROUND(AVG(score), 0) AS avg_score,
      ROUND(AVG(fit_score), 0) AS avg_fit_score
    FROM prospection_leads
  `);
  console.log('--- STATS AVANT RÉCONCILIATION ---');
  console.table(statsAvant.rows);

  // 1. Corriger les 40 leads bloqués par plafond marketing Meta (131049) -> statut = 'nouveau'
  const resMetaCapping = await pool.query(`
    UPDATE prospection_leads pl
    SET 
      statut = 'nouveau',
      nb_contacts = 0,
      dernier_contact_at = NULL,
      updated_at = NOW()
    WHERE pl.statut = 'contacte_wa'
    AND EXISTS (
      SELECT 1 FROM prospection_messages_log pml
      WHERE pml.lead_id = pl.id 
        AND pml.statut = 'echec'
        AND pml.erreur LIKE '%131049%'
    )
    AND NOT EXISTS (
      SELECT 1 FROM prospection_messages_log pml2
      WHERE pml2.lead_id = pl.id AND pml2.statut IN ('envoye', 'livre', 'lu')
    )
    RETURNING pl.id, pl.telephone, pl.nom_boutique
  `);
  console.log(`\n✅ ${resMetaCapping.rows.length} leads remis à 'nouveau' (rejet plafond Meta 131049 - jamais reçus)`);

  // 2. Corriger le lead non-WhatsApp (131026) -> statut = 'invalide'
  const resInvalide = await pool.query(`
    UPDATE prospection_leads pl
    SET 
      statut = 'invalide',
      nb_contacts = 0,
      dernier_contact_at = NULL,
      updated_at = NOW()
    WHERE pl.statut = 'contacte_wa'
    AND EXISTS (
      SELECT 1 FROM prospection_messages_log pml
      WHERE pml.lead_id = pl.id 
        AND pml.statut = 'echec'
        AND (pml.erreur LIKE '%131026%' OR pml.erreur LIKE '%non-WhatsApp%')
    )
    AND NOT EXISTS (
      SELECT 1 FROM prospection_messages_log pml2
      WHERE pml2.lead_id = pl.id AND pml2.statut IN ('envoye', 'livre', 'lu')
    )
    RETURNING pl.id, pl.telephone, pl.nom_boutique
  `);
  console.log(`✅ ${resInvalide.rows.length} lead passé à 'invalide' (numéro non-WhatsApp 131026)`);

  // 3. Corriger tout autre lead contacte_wa orphelin n'ayant aucun message envoyé avec succès
  const resAutresOrphelins = await pool.query(`
    UPDATE prospection_leads pl
    SET 
      statut = 'nouveau',
      nb_contacts = 0,
      dernier_contact_at = NULL,
      updated_at = NOW()
    WHERE pl.statut = 'contacte_wa'
    AND NOT EXISTS (
      SELECT 1 FROM prospection_messages_log pml
      WHERE pml.lead_id = pl.id AND pml.statut IN ('envoye', 'livre', 'lu')
    )
    RETURNING pl.id, pl.telephone
  `);
  if (resAutresOrphelins.rows.length > 0) {
    console.log(`✅ ${resAutresOrphelins.rows.length} autres leads contacte_wa orphelins remis à 'nouveau'`);
  }

  // 4. Mettre à jour la campagne 11c82adf avec ses vrais chiffres d'envois (9 succès, 41 échecs)
  await pool.query(`
    UPDATE prospection_campagnes
    SET 
      nb_succes = 9,
      nb_echecs = 41,
      taux_delivrabilite = ROUND((9::numeric / 50::numeric) * 100, 2),
      diagnostic = $1::jsonb
    WHERE id = '11c82adf-0b2a-4eef-a6b5-5f5bf70c1dcc'
  `, [JSON.stringify({
    nb_total: 50,
    nb_envoyes: 50,
    nb_succes: 9,
    nb_echecs: 41,
    nb_ignores: 0,
    raison: 'marketing_capping_meta_131049',
    message: '9 messages WhatsApp délivrés avec succès. 40 rejetés par le plafond marketing Meta (Code 131049) et 1 numéro non-WhatsApp.'
  })]);
  console.log(`✅ Campagne 11c82adf mise à jour avec ses chiffres réels (9 succès, 41 échecs)`);

  // Stats après
  const statsApres = await pool.query(`
    SELECT 
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE statut = 'nouveau') AS nouveaux,
      COUNT(*) FILTER (WHERE statut LIKE 'contacte%') AS contactes,
      COUNT(*) FILTER (WHERE statut = 'en_discussion') AS en_discussion,
      COUNT(*) FILTER (WHERE statut = 'converti') AS convertis,
      COUNT(*) FILTER (WHERE statut = 'desinscrit') AS desinscrits,
      COUNT(*) FILTER (WHERE statut = 'invalide') AS invalides,
      COUNT(*) FILTER (WHERE score >= 70) AS qualifies,
      COUNT(*) FILTER (WHERE fit_score >= 70) AS haut_fit,
      ROUND(AVG(score), 0) AS avg_score,
      ROUND(AVG(fit_score), 0) AS avg_fit_score
    FROM prospection_leads
  `);
  console.log('\n--- STATS APRES RÉCONCILIATION (VRAIES DONNÉES) ---');
  console.table(statsApres.rows);

  process.exit(0);
}

run().catch(err => {
  console.error('Erreur réconciliation:', err);
  process.exit(1);
});
