const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../models/db');

async function runFullAudit() {
  const report = {};

  try {
    // 1. STATS GLOBALES
    const globalStats = await pool.query(`
      SELECT 
        COUNT(*) AS total_leads,
        COUNT(DISTINCT telephone) AS distinct_tel,
        COUNT(*) FILTER (WHERE telephone IS NULL OR telephone = '') AS missing_tel,
        COUNT(*) FILTER (WHERE email IS NOT NULL AND email != '') AS with_email,
        COUNT(*) FILTER (WHERE contact_nom IS NOT NULL AND contact_nom != '') AS with_contact_nom,
        COUNT(*) FILTER (WHERE score IS NOT NULL AND score > 0) AS with_score,
        AVG(score) AS avg_score,
        MIN(created_at) AS premier_lead,
        MAX(created_at) AS dernier_lead
      FROM prospection_leads
    `);
    report.globalStats = globalStats.rows[0];

    // 2. STATUTS
    const statusStats = await pool.query(`
      SELECT statut, COUNT(*) AS count, ROUND(COUNT(*)*100.0 / SUM(COUNT(*)) OVER(), 2) as pct
      FROM prospection_leads
      GROUP BY statut
      ORDER BY count DESC
    `);
    report.statusStats = statusStats.rows;

    // 3. SOURCES
    const sourceStats = await pool.query(`
      SELECT source, COUNT(*) AS count, 
        COUNT(*) FILTER (WHERE statut LIKE 'contacte%') AS contactes,
        COUNT(*) FILTER (WHERE statut = 'converti') AS convertis,
        COUNT(*) FILTER (WHERE statut = 'desinscrit') AS desinscrits,
        COUNT(*) FILTER (WHERE statut = 'invalide') AS invalides,
        COUNT(*) FILTER (WHERE statut = 'nouveau') AS nouveaux,
        ROUND(COUNT(*)*100.0 / SUM(COUNT(*)) OVER(), 2) as pct
      FROM prospection_leads
      GROUP BY source
      ORDER BY count DESC
    `);
    report.sourceStats = sourceStats.rows;

    // 4. CATÉGORIES
    const catStats = await pool.query(`
      SELECT categorie, COUNT(*) AS count,
        COUNT(*) FILTER (WHERE statut LIKE 'contacte%') AS contactes,
        COUNT(*) FILTER (WHERE statut = 'converti') AS convertis,
        COUNT(*) FILTER (WHERE statut = 'invalide') AS invalides,
        ROUND(COUNT(*)*100.0 / SUM(COUNT(*)) OVER(), 2) as pct
      FROM prospection_leads
      GROUP BY categorie
      ORDER BY count DESC
    `);
    report.catStats = catStats.rows;

    // 5. OPÉRATEURS
    const opStats = await pool.query(`
      SELECT operateur, COUNT(*) AS count,
        ROUND(COUNT(*)*100.0 / SUM(COUNT(*)) OVER(), 2) as pct
      FROM prospection_leads
      GROUP BY operateur
      ORDER BY count DESC
    `);
    report.opStats = opStats.rows;

    // 6. VILLES ET QUARTIER
    const villeStats = await pool.query(`
      SELECT ville, COUNT(*) AS count, ROUND(COUNT(*)*100.0 / SUM(COUNT(*)) OVER(), 2) as pct
      FROM prospection_leads
      GROUP BY ville
      ORDER BY count DESC
    `);
    report.villeStats = villeStats.rows;

    const quartierStats = await pool.query(`
      SELECT quartier, COUNT(*) AS count, ROUND(COUNT(*)*100.0 / SUM(COUNT(*)) OVER(), 2) as pct
      FROM prospection_leads
      GROUP BY quartier
      ORDER BY count DESC
      LIMIT 25
    `);
    report.quartierStats = quartierStats.rows;

    // 7. ANALYSE DE LA QUALITÉ DES NOMS
    const genericNameAnalysis = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE nom_boutique IN ('Mode', 'Véhicules', 'Immobilière', 'Commerce Général', 'Téléphonie & Tech', 'Électroménager', 'Alimentation & Supérette', 'Commerce & Boutique', 'Emploi', 'De Livraison', 'Services')) AS generic_names,
        COUNT(*) FILTER (WHERE contact_nom IS NULL OR contact_nom = '') AS without_contact_nom,
        COUNT(*) FILTER (WHERE nom_boutique ~* '^[0-9+ ]+$') AS number_as_name,
        COUNT(*) FILTER (WHERE LENGTH(nom_boutique) < 3) AS too_short_names,
        COUNT(*) FILTER (WHERE LENGTH(nom_boutique) > 40) AS too_long_names
      FROM prospection_leads
    `);
    report.nameQuality = genericNameAnalysis.rows[0];

    // Top noms de boutique
    const topNames = await pool.query(`
      SELECT nom_boutique, COUNT(*) as count
      FROM prospection_leads
      GROUP BY nom_boutique
      ORDER BY count DESC
      LIMIT 25
    `);
    report.topNames = topNames.rows;

    // 8. LOGS DE MESSAGES
    const msgLogs = await pool.query(`
      SELECT 
        canal, statut, COUNT(*) as count,
        COUNT(*) FILTER (WHERE erreur IS NOT NULL AND erreur != '') as errors
      FROM prospection_messages_log
      GROUP BY canal, statut
    `);
    report.msgLogs = msgLogs.rows;

    const sampleErrors = await pool.query(`
      SELECT erreur, COUNT(*) as count
      FROM prospection_messages_log
      WHERE erreur IS NOT NULL AND erreur != ''
      GROUP BY erreur
      ORDER BY count DESC
    `);
    report.msgErrors = sampleErrors.rows;

    // 9. CAMPAGNES
    const campagnes = await pool.query(`
      SELECT * FROM prospection_campagnes ORDER BY created_at DESC LIMIT 10
    `);
    report.campagnes = campagnes.rows;

    // 10. BLACKLIST
    const blacklist = await pool.query(`
      SELECT * FROM whatsapp_blacklist ORDER BY created_at DESC
    `);
    report.blacklist = blacklist.rows;

    // 11. BOUTIQUES CRÉÉES ET CONVERSION CHECK
    const totalBoutiques = await pool.query(`
      SELECT COUNT(*) as total, 
        COUNT(*) FILTER (WHERE actif = true) as actives,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '60 days') as recentes
      FROM boutiques
    `);
    report.boutiquesStats = totalBoutiques.rows[0];

    // Check match between leads and boutiques
    const leadBoutiqueMatch = await pool.query(`
      SELECT 
        b.id as boutique_id, b.nom as boutique_nom, b.telephone as boutique_tel,
        p.id as lead_id, p.nom_boutique as lead_nom, p.telephone as lead_tel, p.statut as lead_statut, p.source as lead_source
      FROM boutiques b
      JOIN prospection_leads p ON (
        REGEXP_REPLACE(b.telephone, '[^0-9]', '', 'g') = REGEXP_REPLACE(p.telephone, '[^0-9]', '', 'g')
        OR REGEXP_REPLACE(b.telephone, '[^0-9]', '', 'g') LIKE '%' || REGEXP_REPLACE(p.telephone, '[^0-9]', '', 'g')
      )
    `);
    report.leadBoutiqueMatch = leadBoutiqueMatch.rows;

    // 12. WHATSAPP CONVERSATIONS & INCOMING MESSAGES
    const tableExists = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('whatsapp_messages', 'whatsapp_conversations', 'whatsapp_logs', 'messages')
    `);
    report.existingTables = tableExists.rows.map(r => r.table_name);

    if (report.existingTables.includes('whatsapp_conversations')) {
      const convs = await pool.query(`SELECT COUNT(*) FROM whatsapp_conversations`);
      report.totalWhatsappConvs = convs.rows[0].count;
    }

    // 13. AUDIT ÉCHANTILLON 100 LEADS REPRÉSENTATIFS
    const sample100 = await pool.query(`
      SELECT 
        id, nom_boutique, contact_nom, telephone, operateur, 
        categorie, ville, quartier, source, statut, score, notes,
        created_at
      FROM prospection_leads
      ORDER BY id
      LIMIT 100
    `);
    report.sample100 = sample100.rows;

    // Écriture du rapport JSON
    const outputPath = path.join(__dirname, 'audit-output.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log('Rapport généré avec succès dans:', outputPath);

  } catch (err) {
    console.error('Erreur audit:', err);
  } finally {
    await pool.end();
  }
}

runFullAudit();
