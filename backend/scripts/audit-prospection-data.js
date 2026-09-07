const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../models/db');

async function runAudit() {
  try {
    console.log('====================================================');
    console.log('=== AUDIT EXHAUSTIF BDD PROSPECTION NOPALOU ===');
    console.log('====================================================\n');

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
    console.log('1. STATS GLOBALES:');
    console.table(globalStats.rows);

    // 2. DISTRIBUTION PAR STATUT
    const statusStats = await pool.query(`
      SELECT statut, COUNT(*) AS count, ROUND(COUNT(*)*100.0 / SUM(COUNT(*)) OVER(), 2) as pct
      FROM prospection_leads
      GROUP BY statut
      ORDER BY count DESC
    `);
    console.log('\n2. DISTRIBUTION PAR STATUT:');
    console.table(statusStats.rows);

    // 3. DISTRIBUTION PAR SOURCE
    const sourceStats = await pool.query(`
      SELECT source, COUNT(*) AS count, 
        COUNT(*) FILTER (WHERE statut LIKE 'contacte%') AS contactes,
        COUNT(*) FILTER (WHERE statut = 'converti') AS convertis,
        COUNT(*) FILTER (WHERE statut = 'desinscrit') AS desinscrits,
        COUNT(*) FILTER (WHERE statut = 'invalide') AS invalides,
        ROUND(COUNT(*)*100.0 / SUM(COUNT(*)) OVER(), 2) as pct
      FROM prospection_leads
      GROUP BY source
      ORDER BY count DESC
    `);
    console.log('\n3. DISTRIBUTION PAR SOURCE:');
    console.table(sourceStats.rows);

    // 4. DISTRIBUTION PAR CATÉGORIE
    const catStats = await pool.query(`
      SELECT categorie, COUNT(*) AS count,
        COUNT(*) FILTER (WHERE statut LIKE 'contacte%') AS contactes,
        ROUND(COUNT(*)*100.0 / SUM(COUNT(*)) OVER(), 2) as pct
      FROM prospection_leads
      GROUP BY categorie
      ORDER BY count DESC
    `);
    console.log('\n4. DISTRIBUTION PAR CATÉGORIE:');
    console.table(catStats.rows);

    // 5. DISTRIBUTION PAR OPÉRATEUR
    const opStats = await pool.query(`
      SELECT operateur, COUNT(*) AS count,
        ROUND(COUNT(*)*100.0 / SUM(COUNT(*)) OVER(), 2) as pct
      FROM prospection_leads
      GROUP BY operateur
      ORDER BY count DESC
    `);
    console.log('\n5. DISTRIBUTION PAR OPÉRATEUR:');
    console.table(opStats.rows);

    // 6. DISTRIBUTION PAR VILLE ET QUARTIER (TOP 15)
    const locStats = await pool.query(`
      SELECT COALESCE(quartier, ville, 'Inconnu') as localisation, COUNT(*) AS count
      FROM prospection_leads
      GROUP BY localisation
      ORDER BY count DESC
      LIMIT 15
    `);
    console.log('\n6. TOP 15 LOCALISATIONS (VILLE / QUARTIER):');
    console.table(locStats.rows);

    // 7. ANALYSE DES NUMÉROS DE TÉLÉPHONE (VALIDITÉ + PRÉFIXES)
    const phoneAnalysis = await pool.query(`
      SELECT 
        LENGTH(telephone) as len,
        SUBSTRING(telephone FROM 1 FOR 5) as prefix5,
        COUNT(*) as count
      FROM prospection_leads
      GROUP BY len, prefix5
      ORDER BY count DESC
      LIMIT 20
    `);
    console.log('\n7. ANALYSE PRÉFIXES & LONGUEURS TÉLÉPHONE:');
    console.table(phoneAnalysis.rows);

    // 8. DÉTECTION DE DOUBLONS (NOM, NOM NORMALISÉ, SIMILITUDES)
    const dupNames = await pool.query(`
      SELECT LOWER(TRIM(nom_boutique)) as nom_norm, COUNT(*) as count, ARRAY_AGG(telephone) as phones
      FROM prospection_leads
      GROUP BY LOWER(TRIM(nom_boutique))
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 15
    `);
    console.log('\n8. DOUBLONS PAR NOM DE BOUTIQUE:');
    console.table(dupNames.rows.map(r => ({ nom_norm: r.nom_norm, count: r.count, phones: r.phones.slice(0, 3).join(', ') })));

    // 9. DÉTECTION DE FAUX POSITIFS / EMPLOI / PARTICULIERS / TITRES D'ANNONCES
    const suspectTitles = await pool.query(`
      SELECT id, nom_boutique, categorie, quartier, telephone, notes
      FROM prospection_leads
      WHERE 
        LOWER(nom_boutique) ~* '(emploi|recrut|cherche|travail|chauffeur|stage|securite|demande|call center|urgent|particulier|anonyme)'
        OR LOWER(COALESCE(notes, '')) ~* '(emploi|recrut|cherche|travail|chauffeur|stage|securite|demande|call center)'
        OR LENGTH(nom_boutique) > 40
      LIMIT 20
    `);
    console.log('\n9. ÉCHANTILLON DE LEADS SUSPECTS (EMPLOI / TITRES LONGS / HORS-CIBLE):', suspectTitles.rows.length);
    console.table(suspectTitles.rows.slice(0, 10));

    // 10. ANALYSE DES MESSAGES ENVOYÉS (PROSPECTION_MESSAGES_LOG)
    const msgLogs = await pool.query(`
      SELECT 
        canal, statut, COUNT(*) as count,
        MIN(created_at) as first_msg,
        MAX(created_at) as last_msg
      FROM prospection_messages_log
      GROUP BY canal, statut
    `);
    console.log('\n10. MESSAGES ENVOYÉS (LOGS CAMPAGNES):');
    console.table(msgLogs.rows);

    // 11. ERREURS D'ENVOI ÉVENTUELLES
    const errLogs = await pool.query(`
      SELECT erreur, COUNT(*) as count
      FROM prospection_messages_log
      WHERE erreur IS NOT NULL AND erreur != ''
      GROUP BY erreur
      ORDER BY count DESC
      LIMIT 10
    `);
    console.log('\n11. ERREURS RENCONTRÉES LORS DES ENVOIS:');
    console.table(errLogs.rows);

    // 12. BLACKLIST STATS
    const blStats = await pool.query(`
      SELECT reason, COUNT(*) as count
      FROM whatsapp_blacklist
      GROUP BY reason
    `);
    console.log('\n12. BLACKLIST WHATSAPP:');
    console.table(blStats.rows);

    // 13. VÉRIFIER LES BOUTIQUES CRÉÉES ET LE LIEN AVEC LES LEADS
    const boutiquesCheck = await pool.query(`
      SELECT COUNT(*) as total_boutiques FROM boutiques
    `);
    console.log('\n13. TOTAL BOUTIQUES EXISTANTES EN BDD:', boutiquesCheck.rows[0].total_boutiques);

    // Match entre boutiques existantes et téléphones de leads
    const matchBoutiques = await pool.query(`
      SELECT b.id, b.nom, b.telephone, p.telephone as lead_tel, p.statut as lead_statut, p.nom_boutique as lead_nom
      FROM boutiques b
      JOIN prospection_leads p ON (
        REGEXP_REPLACE(b.telephone, '[^0-9]', '', 'g') = REGEXP_REPLACE(p.telephone, '[^0-9]', '', 'g')
        OR REGEXP_REPLACE(b.telephone, '[^0-9]', '', 'g') LIKE '%' || REGEXP_REPLACE(p.telephone, '[^0-9]', '', 'g')
      )
    `);
    console.log('13b. MATCHES BOUTIQUES / PROSPECTION_LEADS:');
    console.table(matchBoutiques.rows);

    // 14. ÉCHANTILLON ALÉATOIRE QUALITATIF DE 25 LEADS
    const sampleLeads = await pool.query(`
      SELECT id, nom_boutique, contact_nom, telephone, operateur, categorie, ville, quartier, source, statut, score
      FROM prospection_leads
      ORDER BY RANDOM()
      LIMIT 25
    `);
    console.log('\n14. ÉCHANTILLON ALÉATOIRE REPRÉSENTATIF (25 LEADS):');
    console.table(sampleLeads.rows);

  } catch (err) {
    console.error('Audit Error:', err);
  } finally {
    await pool.end();
  }
}

runAudit();
