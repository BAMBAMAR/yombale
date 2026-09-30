// Audit complet module Prospection
require('dotenv').config();
const { pool } = require('./backend/models/db');

async function audit() {
  const results = {};
  
  try {
    // 1. Check tables existence
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'prospection%'
      ORDER BY table_name
    `);
    results.tables_presentes = tables.rows.map(r => r.table_name);
    
    // 2. Table cron_executions
    const cronTable = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'cron_executions'
    `);
    results.cron_table_existe = cronTable.rows.length > 0;
    
    // 3. Volume leads
    const leads = await pool.query(`
      SELECT COUNT(*) as total,
        COUNT(*) FILTER (WHERE statut = 'nouveau') as nouveaux,
        COUNT(*) FILTER (WHERE statut LIKE 'contacte%') as contactes,
        COUNT(*) FILTER (WHERE statut = 'en_discussion') as en_discussion,
        COUNT(*) FILTER (WHERE statut = 'converti') as convertis,
        COUNT(*) FILTER (WHERE statut = 'sans_reponse') as sans_reponse,
        COUNT(*) FILTER (WHERE statut = 'desinscrit') as desinscrits,
        COUNT(*) FILTER (WHERE statut = 'invalide') as invalides,
        MIN(created_at) as premier_lead,
        MAX(created_at) as dernier_lead
      FROM prospection_leads
    `);
    results.leads_volume = leads.rows[0];
    
    // 4. Qualite des donnees
    const qualite = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE telephone IS NOT NULL AND telephone != '') as avec_telephone,
        COUNT(*) FILTER (WHERE email IS NOT NULL AND email != '') as avec_email,
        COUNT(*) FILTER (WHERE contact_nom IS NOT NULL AND contact_nom != '') as avec_contact_nom,
        COUNT(*) FILTER (WHERE quartier IS NOT NULL AND quartier != 'Dakar' AND quartier != '') as avec_quartier_precis,
        COUNT(*) FILTER (WHERE operateur = 'Orange') as orange,
        COUNT(*) FILTER (WHERE operateur = 'Free (Yas)') as free_yas,
        COUNT(*) FILTER (WHERE operateur = 'Expresso') as expresso,
        COUNT(*) FILTER (WHERE operateur = 'Fixe' OR operateur = 'Autre') as fixes_invalides,
        COUNT(*) FILTER (WHERE score >= 70) as score_bon,
        COUNT(*) FILTER (WHERE fit_score >= 70) as fit_bon,
        ROUND(AVG(score), 1) as score_moyen,
        ROUND(AVG(fit_score), 1) as fit_moyen,
        ROUND(AVG(priority_score), 1) as priority_moyen
      FROM prospection_leads
    `);
    results.leads_qualite = qualite.rows[0];
    
    // 5. Sources
    const sources = await pool.query(`
      SELECT source, COUNT(*) as total,
        COUNT(*) FILTER (WHERE statut = 'converti') as convertis
      FROM prospection_leads
      GROUP BY source
      ORDER BY total DESC
    `);
    results.sources = sources.rows;
    
    // 6. Categories
    const cats = await pool.query(`
      SELECT categorie, COUNT(*) as total,
        COUNT(*) FILTER (WHERE statut = 'converti') as convertis,
        COUNT(*) FILTER (WHERE statut LIKE 'contacte%') as contactes
      FROM prospection_leads
      GROUP BY categorie
      ORDER BY total DESC
    `);
    results.categories = cats.rows;
    
    // 7. Campagnes
    const campagnes = await pool.query(`
      SELECT COUNT(*) as total,
        COUNT(*) FILTER (WHERE statut = 'terminee') as terminees,
        COUNT(*) FILTER (WHERE statut = 'en_cours') as en_cours,
        COUNT(*) FILTER (WHERE canal = 'whatsapp') as whatsapp,
        COUNT(*) FILTER (WHERE canal = 'email') as email_canal,
        COALESCE(SUM(nb_total), 0) as leads_cibles,
        COALESCE(SUM(nb_envoyes), 0) as envoyes,
        COALESCE(SUM(nb_succes), 0) as succes,
        COALESCE(SUM(nb_echecs), 0) as echecs,
        MAX(created_at) as derniere_campagne
      FROM prospection_campagnes
    `).catch(e => ({ rows: [{ error: e.message }] }));
    results.campagnes = campagnes.rows[0];
    
    // 8. Messages log
    const logs = await pool.query(`
      SELECT COUNT(*) as total,
        COUNT(*) FILTER (WHERE statut = 'envoye') as envoyes,
        COUNT(*) FILTER (WHERE statut = 'livre') as livres,
        COUNT(*) FILTER (WHERE statut = 'lu') as lus,
        COUNT(*) FILTER (WHERE statut = 'echec') as echecs,
        COUNT(*) FILTER (WHERE statut = 'simule') as simules,
        MAX(created_at) as dernier_envoi
      FROM prospection_messages_log
    `).catch(e => ({ rows: [{ error: e.message }] }));
    results.messages_log = logs.rows[0];
    
    // 9. Blacklist
    const blacklist = await pool.query(`
      SELECT COUNT(*) as total FROM whatsapp_blacklist
    `).catch(e => ({ rows: [{ error: e.message }] }));
    results.blacklist = blacklist.rows[0];
    
    // 10. Cron executions
    const crons = await pool.query(`
      SELECT nom_cron, started_at, ended_at, statut, stats, erreur
      FROM cron_executions
      ORDER BY started_at DESC
      LIMIT 20
    `).catch(e => ({ rows: [{ error: e.message }] }));
    results.cron_history = crons.rows;
    
    // 11. Events timeline
    const events = await pool.query(`
      SELECT type_evenement, COUNT(*) as total
      FROM prospection_lead_events
      GROUP BY type_evenement
      ORDER BY total DESC
    `).catch(e => ({ rows: [{ error: e.message }] }));
    results.events_types = events.rows;
    
    // 12. Doublons potentiels
    const doublons = await pool.query(`
      SELECT telephone, COUNT(*) as count
      FROM prospection_leads
      GROUP BY telephone
      HAVING COUNT(*) > 1
      LIMIT 10
    `);
    results.doublons = { count: doublons.rows.length, exemples: doublons.rows };
    
    // 13. Reconciliation CRM
    const reconciliation = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM prospection_leads WHERE statut = 'converti') as leads_convertis,
        (SELECT COUNT(*) FROM boutiques WHERE actif = true) as boutiques_actives,
        (SELECT COUNT(*) FROM boutiques WHERE crm_lead_id IS NOT NULL) as boutiques_avec_lead_id
    `).catch(e => ({ rows: [{ error: e.message }] }));
    results.reconciliation = reconciliation.rows[0];
    
    // 14. Agences reconciliees
    const agences = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM agences_immo) as total_agences,
        (SELECT COUNT(*) FROM agences_immo WHERE crm_lead_id IS NOT NULL) as agences_avec_lead_id,
        (SELECT COUNT(*) FROM prospection_leads WHERE sous_profil = 'agence' AND statut = 'converti') as agences_leads_convertis
    `).catch(e => ({ rows: [{ error: e.message }] }));
    results.agences = agences.rows[0];
    
    // 15. Coherence statut/contacts
    const coherence = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM prospection_leads WHERE statut LIKE 'contacte%') as leads_statut_contacte,
        (SELECT COUNT(DISTINCT lead_id) FROM prospection_messages_log WHERE statut IN ('envoye','livre','lu')) as leads_avec_message_log,
        (SELECT COUNT(*) FROM prospection_leads WHERE nb_contacts > 0) as leads_nb_contacts_positif
    `).catch(e => ({ rows: [{ error: e.message }] }));
    results.coherence_crm = coherence.rows[0];
    
    // 16. Activite recente
    const derniers = await pool.query(`
      SELECT source, MAX(created_at) as dernier, COUNT(*) as nb_7j
      FROM prospection_leads
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY source
      ORDER BY dernier DESC
    `);
    results.activite_recente = derniers.rows;
    
    // 17. Echantillon recents
    const echantillon = await pool.query(`
      SELECT id, nom_boutique, telephone, operateur, email, categorie, ville, quartier, 
             statut, score, fit_score, priority_score, source, nb_contacts, created_at
      FROM prospection_leads
      ORDER BY created_at DESC
      LIMIT 5
    `);
    results.echantillon_recents = echantillon.rows;
    
    // 18. Config
    results.config = {
      whatsapp_configured: !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_API_TOKEN),
      whatsapp_phone_id_present: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      whatsapp_token_present: !!process.env.WHATSAPP_API_TOKEN,
      email_smtp: !!(process.env.SMTP_HOST || process.env.SMTP_USER),
      sendgrid: !!process.env.SENDGRID_API_KEY,
      database_url: process.env.DATABASE_URL ? 'SET' : 'MISSING',
      node_env: process.env.NODE_ENV || 'not-set',
    };
    
    // 19. Derniere campagne detaillee
    const derniereCamp = await pool.query(`
      SELECT id, titre, canal, statut, nb_total, nb_envoyes, nb_succes, nb_echecs, 
             nb_reponses, nb_boutiques_creees, taux_delivrabilite, created_at, date_fin,
             diagnostic
      FROM prospection_campagnes
      ORDER BY created_at DESC
      LIMIT 3
    `).catch(e => ({ rows: [{ error: e.message }] }));
    results.dernieres_campagnes = derniereCamp.rows;
    
    // 20. Check si cron was run recently
    const cronRecent = await pool.query(`
      SELECT nom_cron, started_at, statut, stats
      FROM cron_executions
      WHERE started_at >= NOW() - INTERVAL '7 days'
      ORDER BY started_at DESC
    `).catch(e => ({ rows: [{ error: e.message }] }));
    results.crons_recents_7j = cronRecent.rows;
    
    console.log(JSON.stringify(results, null, 2));
    
  } catch(e) {
    console.error('AUDIT ERROR:', e.message);
    console.error(e.stack);
  } finally {
    pool.end();
  }
}

audit();
