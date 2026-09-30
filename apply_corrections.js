// apply_corrections.js — Exécution autonome de toutes les corrections de l'audit Prospection Commerciale
require('dotenv').config();
const { pool } = require('./backend/models/db');
const {
  ensureProspectionTables,
  reconcilierAgencesEtBoutiquesExistantes,
  nettoyerTousLesLeadsBdd,
} = require('./backend/services/prospection');
const { executerRelancesProspects } = require('./backend/services/cron-relances-prospects');
const { traiterRelancesMarchands } = require('./backend/services/cron-relances-marchands');

async function main() {
  console.log('🚀 [CORRECTIONS] Démarrage du plan de redressement Prospection Commerciale Nopalou...\n');

  await ensureProspectionTables();

  const report = {};

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Fix A-12 : Déblocage des crons bloqués 'en_cours' dans cron_executions
  // ──────────────────────────────────────────────────────────────────────────
  console.log('─── 1. Fix A-12 : Nettoyage des crons bloqués (sauvegarde_quotidienne, etc.) ───');
  const resA12 = await pool.query(`
    UPDATE cron_executions
    SET statut = 'erreur',
        erreur = 'Interrompu / Timeout lors du cycle précédent (débloqué automatiquement)',
        ended_at = NOW()
    WHERE statut = 'en_cours' AND started_at < NOW() - INTERVAL '1 hour'
    RETURNING id, nom_cron, started_at
  `);
  report.cronsDebloques = resA12.rowCount;
  console.log(`✅ ${resA12.rowCount} tâche(s) cron débloquée(s) :`, resA12.rows);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Fix A-07 : Resynchronisation du statut des leads contactés
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n─── 2. Fix A-07 : Resynchronisation des leads contactés restés "nouveau" ───');
  const resA07 = await pool.query(`
    UPDATE prospection_leads
    SET 
      statut = 'contacte_wa',
      nb_contacts = GREATEST(COALESCE(nb_contacts, 0), sub.msg_count),
      dernier_contact_at = COALESCE(dernier_contact_at, sub.max_date),
      derniere_action_at = COALESCE(derniere_action_at, sub.max_date),
      updated_at = NOW()
    FROM (
      SELECT lead_id, COUNT(*) as msg_count, MAX(created_at) as max_date
      FROM prospection_messages_log
      WHERE statut IN ('envoye', 'livre', 'lu') AND lead_id IS NOT NULL
      GROUP BY lead_id
    ) sub
    WHERE prospection_leads.id = sub.lead_id
      AND prospection_leads.statut = 'nouveau'
    RETURNING prospection_leads.id
  `);
  report.leadsContactesResynchronises = resA07.rowCount;
  console.log(`✅ ${resA07.rowCount} lead(s) contacté(s) mis à jour de "nouveau" vers "contacte_wa".`);

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Fix A-10 : Invalidation des leads hors-cible (catégorie 'emploi')
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n─── 3. Fix A-10 : Invalidation des profils hors-cible (Emploi/Recrutement) ───');
  const resA10 = await pool.query(`
    UPDATE prospection_leads
    SET 
      statut = 'invalide',
      score = 0,
      fit_score = 0,
      priority_score = 0,
      next_best_action = 'hors_cible',
      notes = CASE 
        WHEN notes IS NULL OR notes = '' THEN 'Hors-cible (Emploi/Recrutement)'
        WHEN notes NOT LIKE '%Hors-cible%' THEN notes || ' | Hors-cible (Emploi/Recrutement)'
        ELSE notes
      END,
      updated_at = NOW()
    WHERE (categorie = 'emploi' OR categorie = 'recrutement') AND statut != 'converti'
    RETURNING id
  `);
  report.leadsEmploiInvalides = resA10.rowCount;
  console.log(`✅ ${resA10.rowCount} lead(s) hors-cible emploi invalidés.`);

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Fix A-01 : Enrichissement des adresses emails depuis les comptes utilisateurs
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n─── 4. Fix A-01 : Enrichissement des emails depuis la table utilisateurs ───');
  const resA01 = await pool.query(`
    UPDATE prospection_leads
    SET 
      email = u.email,
      updated_at = NOW()
    FROM utilisateurs u
    WHERE (
      u.telephone IS NOT NULL AND u.telephone != ''
      AND (
        prospection_leads.telephone = u.telephone
        OR prospection_leads.telephone = '221' || u.telephone
        OR prospection_leads.telephone = REGEXP_REPLACE(u.telephone, '^(\\+?221)', '')
      )
    )
    AND u.email IS NOT NULL AND u.email != ''
    AND (prospection_leads.email IS NULL OR prospection_leads.email = '')
    RETURNING prospection_leads.id, u.email
  `);
  report.emailsEnrichis = resA01.rowCount;
  console.log(`✅ ${resA01.rowCount} email(s) enrichi(s) :`, resA01.rows.slice(0, 5));

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Fix A-02 : Enrichissement des noms de contact réels depuis les annonces
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n─── 5. Fix A-02 : Enrichissement des noms de contact depuis les annonces ───');
  const resA02 = await pool.query(`
    UPDATE prospection_leads
    SET 
      contact_nom = sub.contact_nom,
      updated_at = NOW()
    FROM (
      SELECT DISTINCT ON (norm_tel) norm_tel, contact_nom
      FROM (
        SELECT 
          CASE 
            WHEN contact_tel LIKE '+221%' THEN SUBSTRING(contact_tel FROM 5)
            WHEN contact_tel LIKE '221%' THEN SUBSTRING(contact_tel FROM 4)
            ELSE contact_tel
          END as norm_tel,
          contact_nom
        FROM annonces_immo
        WHERE contact_nom IS NOT NULL AND contact_nom != '' 
          AND contact_nom !~* '^(responsable|vendeur|particulier|agence|annonce|admin|client)$'
          AND LENGTH(contact_nom) BETWEEN 2 AND 35
        UNION ALL
        SELECT 
          CASE 
            WHEN contact_tel LIKE '+221%' THEN SUBSTRING(contact_tel FROM 5)
            WHEN contact_tel LIKE '221%' THEN SUBSTRING(contact_tel FROM 4)
            ELSE contact_tel
          END as norm_tel,
          contact_nom
        FROM annonces_classifiees
        WHERE contact_nom IS NOT NULL AND contact_nom != ''
          AND contact_nom !~* '^(responsable|vendeur|particulier|agence|annonce|admin|client)$'
          AND LENGTH(contact_nom) BETWEEN 2 AND 35
      ) u
      ORDER BY norm_tel, LENGTH(contact_nom) DESC
    ) sub
    WHERE (
      prospection_leads.telephone = sub.norm_tel 
      OR prospection_leads.telephone = '221' || sub.norm_tel
      OR prospection_leads.telephone LIKE '%' || sub.norm_tel
    )
    AND (prospection_leads.contact_nom IS NULL OR prospection_leads.contact_nom = '' OR prospection_leads.contact_nom = prospection_leads.nom_boutique)
    RETURNING prospection_leads.id, sub.contact_nom
  `);
  report.contactsNomsEnrichis = resA02.rowCount;
  console.log(`✅ ${resA02.rowCount} nom(s) de contact enrichi(s) :`, resA02.rows.slice(0, 5));

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Fix A-05 / A-06 / A-13 : Réconciliation bi-directionnelle Boutiques & Agences
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n─── 6. Fix A-05/A-06/A-13 : Réconciliation bi-directionnelle Boutiques & Agences ───');
  const resReconciliation = await reconcilierAgencesEtBoutiquesExistantes();
  report.reconciliation = resReconciliation;
  console.log('✅ Résultat réconciliation :', resReconciliation);

  // Vérifier le nombre de boutiques et agences avec crm_lead_id
  const checkLiaisons = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM boutiques WHERE crm_lead_id IS NOT NULL) AS boutiques_avec_lead,
      (SELECT COUNT(*) FROM agences_immo WHERE crm_lead_id IS NOT NULL) AS agences_avec_lead,
      (SELECT COUNT(*) FROM prospection_leads WHERE statut = 'converti') AS leads_convertis
  `);
  console.log('📊 Liaisons après réconciliation :', checkLiaisons.rows[0]);

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Fix A-08 / A-09 / A-15 : Nettoyage & Scoring complet (fit_score, priority)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n─── 7. Fix A-08/A-09/A-15 : Nettoyage global, scoring fit_score & quartiers ───');
  const resNettoyage = await nettoyerTousLesLeadsBdd();
  report.nettoyage = resNettoyage;
  console.log('✅ Résultat nettoyage & scoring :', resNettoyage);

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Fix A-03 / A-04 : Test d'exécution et vérification observabilité des crons
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n─── 8. Fix A-03/A-04 : Test d\'exécution des crons relances & monitoring ───');
  
  // Test relances prospects (simulation ou exécution contrôlée)
  console.log('⏰ Exécution test de relances_prospects...');
  try {
    const resRelProspects = await executerRelancesProspects();
    console.log('✅ executerRelancesProspects résultat :', resRelProspects);
  } catch (errRelP) {
    console.warn('⚠️ executerRelancesProspects :', errRelP.message);
  }

  // Test relances marchands
  console.log('⏰ Exécution test de relances_marchands...');
  try {
    const resRelMarchands = await traiterRelancesMarchands();
    console.log('✅ traiterRelancesMarchands résultat :', resRelMarchands);
  } catch (errRelM) {
    console.warn('⚠️ traiterRelancesMarchands :', errRelM.message);
  }

  // Vérifier cron_executions
  const resCronEx = await pool.query(`
    SELECT id, nom_cron, started_at, ended_at, statut, stats, erreur
    FROM cron_executions
    ORDER BY started_at DESC
    LIMIT 6
  `);
  console.log('\n📋 Dernières exécutions dans cron_executions :');
  console.table(resCronEx.rows.map(r => ({
    nom_cron: r.nom_cron,
    started_at: r.started_at,
    statut: r.statut,
    stats: typeof r.stats === 'object' ? JSON.stringify(r.stats).slice(0, 60) : r.stats,
    erreur: r.erreur ? r.erreur.slice(0, 40) : null
  })));

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Métriques finales de validation
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('🎯 VÉRIFICATION FINALE DES MÉTRIQUES DU MODULE PROSPECTION');
  console.log('══════════════════════════════════════════════════════════════');

  const finalCheck = await pool.query(`
    SELECT
      COUNT(*) AS total_leads,
      COUNT(*) FILTER (WHERE statut = 'nouveau') AS statut_nouveau,
      COUNT(*) FILTER (WHERE statut LIKE 'contacte%') AS statut_contacte,
      COUNT(*) FILTER (WHERE statut = 'converti') AS statut_converti,
      COUNT(*) FILTER (WHERE statut = 'invalide') AS statut_invalide,
      COUNT(*) FILTER (WHERE email IS NOT NULL AND email != '') AS avec_email,
      COUNT(*) FILTER (WHERE contact_nom IS NOT NULL AND contact_nom != '' AND contact_nom != nom_boutique) AS avec_vrai_contact_nom,
      COUNT(*) FILTER (WHERE fit_score > 0) AS avec_fit_score,
      COUNT(*) FILTER (WHERE priority_score > 0) AS avec_priority_score,
      ROUND(AVG(fit_score)::numeric, 1) AS moyenne_fit_score,
      ROUND(AVG(score)::numeric, 1) AS moyenne_score
    FROM prospection_leads
  `);

  console.table(finalCheck.rows);

  const checkDiscrepancy = await pool.query(`
    SELECT 
      (SELECT COUNT(DISTINCT lead_id) FROM prospection_messages_log WHERE statut IN ('envoye','livre','lu') AND lead_id IS NOT NULL) AS leads_avec_message_ok,
      (SELECT COUNT(*) FROM prospection_leads WHERE statut LIKE 'contacte%' OR statut = 'converti' OR statut = 'repondu') AS leads_touches_ou_convertis,
      (SELECT COUNT(*) FROM prospection_leads WHERE statut = 'nouveau' AND id IN (
        SELECT DISTINCT lead_id FROM prospection_messages_log WHERE statut IN ('envoye','livre','lu') AND lead_id IS NOT NULL
      )) AS leads_contactes_encore_nouveau
  `);
  console.log('🔍 Cohérence messages / statuts :');
  console.table(checkDiscrepancy.rows);

  console.log('\n🎉 TOUTES LES CORRECTIONS ONT ÉTÉ APPLIQUÉES AVEC SUCCÈS !');
  await pool.end();
}

main().catch(err => {
  console.error('❌ ERREUR LORS DES CORRECTIONS :', err);
  process.exit(1);
});
