// backend/routes/prospection.js — Routes d'administration pour la prospection et collecte de leads
const router = require('express').Router();
const { pool } = require('../models/db');
const { adminSecretOnly: adminOnly } = require('../middlewares/auth');
const {
  ensureProspectionTables,
  normaliserTelephoneSenegal,
  TEMPLATES_PAR_DEFAUT,
  extraireLeadsDepuisTexte,
  autoSourcerDepuisAnnonces,
  genererRequetesDorking,
  lancerCampagne,
  genererLienWhatsApp,
  nettoyerTousLesLeadsBdd,
  reconcilierAgencesEtBoutiquesExistantes,
  traiterRelancesProspectsAutomatiques,
  diagnostiquerCampagne,
  analyserToutesLesCampagnes,
  recommanderProchaineCampagne,
  obtenirTimelineLead,
  auditerQualiteDonneesCRM,
  assainirEtEnrichirDonneesImmo,
} = require('../services/prospection');

// ── GET /api/prospection/leads ────────────────────────────────────────────────
// Liste paginée avec filtres et statistiques globales
router.get('/leads', adminOnly, async (req, res) => {
  try {
    const { search, categorie, statut, sous_profil, ville, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(nom_boutique ILIKE $${pIdx} OR contact_nom ILIKE $${pIdx} OR telephone ILIKE $${pIdx} OR quartier ILIKE $${pIdx})`);
      params.push(`%${search}%`);
      pIdx++;
    }

    if (categorie && categorie !== 'tous') {
      conditions.push(`categorie = $${pIdx}`);
      params.push(categorie);
      pIdx++;
    }

    if (statut && statut !== 'tous') {
      conditions.push(`statut = $${pIdx}`);
      params.push(statut);
      pIdx++;
    }

    if (sous_profil && sous_profil !== 'tous') {
      conditions.push(`sous_profil = $${pIdx}`);
      params.push(sous_profil);
      pIdx++;
    }

    if (ville && ville !== 'tous') {
      conditions.push(`ville = $${pIdx}`);
      params.push(ville);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [resLeads, resTotal, resStats, resBlacklist] = await Promise.all([
      pool.query(
        `SELECT * FROM prospection_leads ${whereClause} ORDER BY created_at DESC LIMIT $${pIdx} OFFSET $${pIdx + 1}`,
        [...params, parseInt(limit, 10), offset]
      ),
      pool.query(`SELECT COUNT(*) FROM prospection_leads ${whereClause}`, params),
      pool.query(`
        SELECT 
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE statut = 'nouveau') AS nouveaux,
          COUNT(*) FILTER (WHERE statut LIKE 'contacte%') AS contactes,
          COUNT(*) FILTER (WHERE statut = 'en_discussion') AS en_discussion,
          COUNT(*) FILTER (WHERE statut = 'converti') AS convertis,
          COUNT(*) FILTER (WHERE statut = 'converti' AND (categorie = 'immo' OR sous_profil = 'agence')) AS agences_converties,
          COUNT(*) FILTER (WHERE statut = 'converti' AND categorie != 'immo' AND (sous_profil != 'agence' OR sous_profil IS NULL)) AS boutiques_converties,
          COUNT(*) FILTER (WHERE statut = 'sans_reponse') AS sans_reponse,
          COUNT(*) FILTER (WHERE statut = 'desinscrit') AS desinscrits,
          COUNT(*) FILTER (WHERE statut = 'invalide') AS invalides,
          ROUND(AVG(score), 0) AS avg_score,
          ROUND(AVG(fit_score), 0) AS avg_fit_score,
          ROUND(AVG(priority_score), 0) AS avg_priority_score,
          COUNT(*) FILTER (WHERE score >= 70) AS qualifies,
          COUNT(*) FILTER (WHERE fit_score >= 70) AS haut_fit,
          COUNT(*) FILTER (WHERE priority_score >= 75) AS priorite_haute,
          COUNT(*) FILTER (WHERE priority_score >= 50 AND priority_score < 75) AS priorite_moyenne,
          COUNT(*) FILTER (WHERE priority_score < 50) AS priorite_basse
        FROM prospection_leads
      `),
      pool.query(`SELECT COUNT(*) AS total_blacklist FROM whatsapp_blacklist`),
    ]);

    res.json({
      leads: resLeads.rows,
      total: parseInt(resTotal.rows[0].count, 10),
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      stats: {
        total: parseInt(resStats.rows[0].total, 10) || 0,
        nouveaux: parseInt(resStats.rows[0].nouveaux, 10) || 0,
        contactes: parseInt(resStats.rows[0].contactes, 10) || 0,
        en_discussion: parseInt(resStats.rows[0].en_discussion, 10) || 0,
        convertis: parseInt(resStats.rows[0].convertis, 10) || 0,
        agences_converties: parseInt(resStats.rows[0].agences_converties, 10) || 0,
        boutiques_converties: parseInt(resStats.rows[0].boutiques_converties, 10) || 0,
        sans_reponse: parseInt(resStats.rows[0].sans_reponse, 10) || 0,
        desinscrits: parseInt(resStats.rows[0].desinscrits, 10) || 0,
        invalides: parseInt(resStats.rows[0].invalides, 10) || 0,
        qualifies: parseInt(resStats.rows[0].qualifies, 10) || 0,
        haut_fit: parseInt(resStats.rows[0].haut_fit, 10) || 0,
        priorite_haute: parseInt(resStats.rows[0].priorite_haute, 10) || 0,
        priorite_moyenne: parseInt(resStats.rows[0].priorite_moyenne, 10) || 0,
        priorite_basse: parseInt(resStats.rows[0].priorite_basse, 10) || 0,
        avg_score: parseFloat(resStats.rows[0].avg_score) || 0,
        avg_fit_score: parseFloat(resStats.rows[0].avg_fit_score) || 0,
        avg_priority_score: parseFloat(resStats.rows[0].avg_priority_score) || 0,
        blacklist: parseInt(resBlacklist.rows[0]?.total_blacklist, 10) || 0,
      }
    });
  } catch (err) {
    console.error('[PROSPECTION GET LEADS ERR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/prospection/leads ───────────────────────────────────────────────
// Ajout manuel d'un lead
router.post('/leads', adminOnly, async (req, res) => {
  try {
    const { nom_boutique, contact_nom, telephone, email, categorie, ville, quartier, notes, statut } = req.body;

    if (!nom_boutique || !telephone) {
      return res.status(400).json({ error: 'Nom de boutique et téléphone requis' });
    }

    const norm = normaliserTelephoneSenegal(telephone);
    if (!norm.valide) {
      return res.status(400).json({ error: `Numéro invalide: ${norm.erreur}` });
    }

    const query = `
      INSERT INTO prospection_leads (
        nom_boutique, contact_nom, telephone, telephone_brut, operateur, email,
        categorie, ville, quartier, source, notes, statut
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'manuel', $10, $11)
      ON CONFLICT (telephone) DO UPDATE SET
        nom_boutique = EXCLUDED.nom_boutique,
        contact_nom = COALESCE(EXCLUDED.contact_nom, prospection_leads.contact_nom),
        email = COALESCE(EXCLUDED.email, prospection_leads.email),
        notes = COALESCE(EXCLUDED.notes, prospection_leads.notes),
        updated_at = NOW()
      RETURNING *
    `;
    const values = [
      nom_boutique,
      contact_nom || null,
      norm.national,
      norm.brut,
      norm.operateur,
      email || null,
      categorie || 'mode',
      ville || 'Dakar',
      quartier || 'Dakar',
      notes || null,
      statut || 'nouveau',
    ];

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT & PATCH /api/prospection/leads/:id ────────────────────────────────────
// Modification complète ou partielle d'un lead
const updateLeadHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Identifiant lead requis' });
    }

    const {
      nom_boutique,
      contact_nom,
      statut,
      notes,
      categorie,
      ville,
      quartier,
      telephone,
      email,
    } = req.body;

    let normTel = null;
    if (telephone !== undefined && telephone !== null && String(telephone).trim() !== '') {
      const norm = normaliserTelephoneSenegal(telephone);
      if (!norm.valide) {
        return res.status(400).json({ error: `Numéro invalide: ${norm.erreur}` });
      }
      normTel = norm;

      // Nettoyage transparent des éventuels doublons préexistants sur ce numéro
      try {
        await pool.query(
          'DELETE FROM prospection_leads WHERE (telephone = $1 OR telephone = $2) AND id != $3',
          [normTel.national, normTel.local, id]
        );
      } catch (errCleanDup) {
        console.warn('[PROSPECTION] Nettoyage doublon mineur:', errCleanDup.message);
      }
    }

    const query = `
      UPDATE prospection_leads
      SET
        nom_boutique   = COALESCE($1, nom_boutique),
        contact_nom    = COALESCE($2, contact_nom),
        statut         = COALESCE($3, statut),
        notes          = COALESCE($4, notes),
        categorie      = COALESCE($5, categorie),
        ville          = COALESCE($6, ville),
        quartier       = COALESCE($7, quartier),
        telephone      = COALESCE($8, telephone),
        telephone_brut = COALESCE($9, telephone_brut),
        operateur      = COALESCE($10, operateur),
        email          = COALESCE($11, email),
        updated_at     = NOW()
      WHERE id = $12
      RETURNING *
    `;

    const values = [
      nom_boutique !== undefined ? nom_boutique : null,
      contact_nom !== undefined ? contact_nom : null,
      statut !== undefined ? statut : null,
      notes !== undefined ? notes : null,
      categorie !== undefined ? categorie : null,
      ville !== undefined ? ville : null,
      quartier !== undefined ? quartier : null,
      normTel ? normTel.national : (telephone !== undefined ? telephone : null),
      normTel ? normTel.brut : null,
      normTel ? normTel.operateur : null,
      email !== undefined ? email : null,
      id,
    ];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lead introuvable' });

    const updatedLead = result.rows[0];

    // A-04 FIX : Si le statut passe en 'en_discussion', enregistrer la réponse maintenant
    // Ceci est le maillon manquant qui cassait toute la logique de relances J+3/J+7/J+14
    if (statut === 'en_discussion' && !updatedLead.derniere_reponse_at) {
      await pool.query(
        `UPDATE prospection_leads SET derniere_reponse_at = NOW(), derniere_action_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [updatedLead.id]
      ).catch(e => console.warn('[PROSPECTION] Mise à jour derniere_reponse_at:', e.message));
      // Refléter le changement dans la réponse JSON
      updatedLead.derniere_reponse_at = new Date().toISOString();
    }

    // Si le statut passe en désinscrit, synchronisation automatique avec whatsapp_blacklist
    if (statut === 'desinscrit' && updatedLead.telephone) {
      try {
        const { ajouterBlacklist } = require('../services/whatsapp');
        await ajouterBlacklist(updatedLead.telephone, 'optout_crm');
      } catch (errBlacklist) {
        console.warn('[PROSPECTION] Sync blacklist warning:', errBlacklist.message);
      }
    }

    res.json(updatedLead);
  } catch (err) {
    console.error('[PROSPECTION PUT LEAD ERR]:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ce numéro de téléphone existe déjà pour un autre prospect dans la base' });
    }
    if (err.code === '22P02') {
      return res.status(400).json({ error: "Format d'identifiant prospect invalide (UUID attendu)" });
    }
    res.status(500).json({ error: err.message || 'Erreur serveur lors de la mise à jour' });
  }
};

router.put('/leads/:id', adminOnly, updateLeadHandler);
router.patch('/leads/:id', adminOnly, updateLeadHandler);

// ── DELETE /api/prospection/leads/:id ─────────────────────────────────────────
// Suppression d'un lead
router.delete('/leads/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM prospection_leads WHERE id = $1', [id]);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/prospection/leads/batch-delete ──────────────────────────────────
// Suppression groupée de leads
router.post('/leads/batch-delete', adminOnly, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids[] requis' });
    }
    const cleanIds = ids.map(String).filter(Boolean);
    await pool.query('DELETE FROM prospection_leads WHERE id::text = ANY($1::text[])', [cleanIds]);
    res.json({ success: true, count: cleanIds.length });
  } catch (err) {
    console.error('[PROSPECTION BATCH DELETE ERR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/prospection/leads/nettoyer ─────────────────────────────────────
// Nettoyage intelligent des noms, enrichissement des quartiers et filtrage des leads invalides (emploi/particuliers)
router.post('/leads/nettoyer', adminOnly, async (req, res) => {
  try {
    const stats = await nettoyerTousLesLeadsBdd();
    res.json({
      success: true,
      message: `Nettoyage terminé : ${stats.nettoyes} prospects mis à jour, ${stats.invalidesEmploi} profils hors-cible classés, ${stats.quartiersEnrichis} quartiers identifiés.`,
      stats,
    });
  } catch (err) {
    console.error('[PROSPECTION NETTOYER ERR]:', err);
    res.status(500).json({ error: err.message || 'Erreur lors du nettoyage de la base de prospects' });
  }
});

// ── POST /api/prospection/leads/reconcilier-agences ──────────────────────────
// Réconciliation manuelle des agences et boutiques clientes avec la table prospection_leads
router.post('/leads/reconcilier-agences', adminOnly, async (_req, res) => {
  try {
    const stats = await reconcilierAgencesEtBoutiquesExistantes();
    res.json({
      success: true,
      message: `Réconciliation terminée : ${stats.agences_reconciliees} agence(s) et ${stats.boutiques_reconciliees} boutique(s) réconciliées avec le CRM.`,
      stats,
    });
  } catch (err) {
    console.error('[PROSPECTION RECONCILIER ERR]:', err);
    res.status(500).json({ error: err.message || 'Erreur lors de la réconciliation' });
  }
});

// ── GET /api/prospection/audit-qualite ───────────────────────────────────────
// Audit approfondi de la santé et qualité des données (Génériques, Flous, Immo)
router.get('/audit-qualite', adminOnly, async (_req, res) => {
  try {
    const audit = await auditerQualiteDonneesCRM();
    res.json({ success: true, audit });
  } catch (err) {
    console.error('[PROSPECTION AUDIT QUALITE ERR]:', err);
    res.status(500).json({ error: err.message || 'Erreur lors de l\'audit de qualité des données' });
  }
});

// ── POST /api/prospection/leads/assainir-immo ─────────────────────────────────
// Assainissement, enrichissement des quartiers et sourcing ciblé pour agences immobilières
router.post('/leads/assainir-immo', adminOnly, async (_req, res) => {
  try {
    const resultats = await assainirEtEnrichirDonneesImmo();
    res.json({
      success: true,
      message: `Assainissement Immo terminé : ${resultats.leadsImmoImportes} nouveaux contacts importés, ${resultats.quartiersEnrichis} quartiers identifiés, ${resultats.nomsAssainis} enseignes assainies. Score santé : ${resultats.scoreSanteAvant}% ➔ ${resultats.scoreSanteApres}%.`,
      ...resultats,
    });
  } catch (err) {
    console.error('[PROSPECTION ASSAINIR IMMO ERR]:', err);
    res.status(500).json({ error: err.message || 'Erreur lors de l\'assainissement des données immobilières' });
  }
});

// ── POST /api/prospection/leads/auto-source ───────────────────────────────────
// Auto-sourcing depuis les annonces classifiées de la plateforme
router.post('/leads/auto-source', adminOnly, async (req, res) => {
  try {
    const stats = await autoSourcerDepuisAnnonces();
    res.json(stats);
  } catch (err) {
    console.error('[PROSPECTION AUTO-SOURCE ERR]:', err);
    res.status(500).json({ error: err.message || 'Erreur lors de l\'auto-sourcing' });
  }
});

// ── POST /api/prospection/auto-collecte ───────────────────────────────────────
// Auto-collecte ultra-légère pour Render (< 3 MB RAM, 0 Chromium) : OpenStreetMap Places & Dorking API
router.post('/auto-collecte', adminOnly, async (req, res) => {
  try {
    const { source = 'all' } = req.body;
    const { lancerAutoCollecte } = require('../services/auto-collecte');
    const resultats = await lancerAutoCollecte({ source });
    res.json({ success: true, ...resultats });
  } catch (err) {
    console.error('[PROSPECTION AUTO-COLLECTE ERR]:', err);
    res.status(500).json({ error: err.message || 'Erreur lors de l\'auto-collecte' });
  }
});

// ── POST /api/prospection/leads/import-vrac ───────────────────────────────────
// Importation de texte brut / exports de groupes WhatsApp / CSV
router.post('/leads/import-vrac', adminOnly, async (req, res) => {
  try {
    const { rawText, categorie = 'mode', ville = 'Dakar', quartier = 'Dakar', source = 'import_vrac' } = req.body;

    if (!rawText || typeof rawText !== 'string') {
      return res.status(400).json({ error: 'Texte brut requis' });
    }

    const leads = extraireLeadsDepuisTexte(rawText, { categorie, ville, quartier, source });
    if (leads.length === 0) {
      return res.status(400).json({ error: 'Aucun numéro sénégalais valide détecté dans le texte.' });
    }

    let inseres = 0;
    let doublons = 0;

    for (const l of leads) {
      try {
        const query = `
          INSERT INTO prospection_leads (
            nom_boutique, contact_nom, telephone, telephone_brut, operateur,
            email, categorie, ville, quartier, source, statut
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'nouveau')
          ON CONFLICT (telephone) DO NOTHING
          RETURNING id
        `;
        const values = [l.nom_boutique, l.contact_nom, l.telephone, l.telephone_brut, l.operateur, l.email, l.categorie, l.ville, l.quartier, l.source];
        const resDb = await pool.query(query, values);
        if (resDb.rows.length > 0) inseres++;
        else doublons++;
      } catch (_) {}
    }

    res.json({
      success: true,
      totalDetectes: leads.length,
      inseres,
      doublons,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/prospection/templates ────────────────────────────────────────────
// Liste des modèles pré-rédigés
router.get('/templates', adminOnly, (_req, res) => {
  res.json({ templates: TEMPLATES_PAR_DEFAUT });
});

// ── GET /api/prospection/dorking ──────────────────────────────────────────────
// Générateur de requêtes Google Dorking / Maps
router.get('/dorking', adminOnly, (req, res) => {
  const { categorie, quartier } = req.query;
  const requetes = genererRequetesDorking(categorie, quartier);
  res.json({ requetes });
});

// ── GET /api/prospection/campagnes ────────────────────────────────────────────
// Liste des campagnes de prospection réconciliée en direct avec les logs réels
router.get('/campagnes', adminOnly, async (_req, res) => {
  try {
    // Watchdog de réconciliation automatique : clore en base les campagnes figées depuis plus de 30 minutes
    await pool.query(`
      UPDATE prospection_campagnes
      SET statut = 'terminee',
          date_fin = COALESCE(date_fin, NOW())
      WHERE statut = 'en_cours' AND created_at < NOW() - INTERVAL '30 minutes'
    `).catch(() => {});

    const { rows } = await pool.query(`
      SELECT 
        c.id,
        c.titre,
        c.canal,
        CASE 
          WHEN c.statut = 'en_cours' AND (COALESCE(l.total_logs, 0) >= c.nb_total OR c.created_at < NOW() - INTERVAL '15 minutes')
          THEN 'terminee'
          ELSE c.statut
        END AS statut,
        c.template_message,
        c.sujet_email,
        c.nb_total,
        COALESCE(l.total_logs, c.nb_envoyes, 0)::int AS nb_envoyes,
        COALESCE(l.nb_succes, c.nb_succes, 0)::int AS nb_succes,
        COALESCE(l.nb_echecs, c.nb_echecs, 0)::int AS nb_echecs,
        COALESCE(l.nb_lus, 0)::int AS nb_lus,
        COALESCE(l.nb_livres, 0)::int AS nb_livres,
        CASE 
          WHEN COALESCE(l.total_logs, c.nb_envoyes, 0) > 0 
          THEN ROUND((COALESCE(l.nb_succes, c.nb_succes, 0)::numeric / COALESCE(l.total_logs, c.nb_envoyes, 0)::numeric) * 100, 2)
          ELSE 0 
        END AS taux_delivrabilite,
        COALESCE(c.nb_reponses, 0)::int AS nb_reponses,
        COALESCE(c.nb_reponses_positives, 0)::int AS nb_reponses_positives,
        COALESCE(conv.nb_convertis, 0)::int AS nb_convertis,
        COALESCE(conv.nb_en_discussion, 0)::int AS nb_en_discussion,
        c.created_at,
        c.date_fin,
        jsonb_build_object(
          'nb_ignores', COALESCE((c.diagnostic->>'nb_ignores')::int, 0),
          'nb_lus', COALESCE(l.nb_lus, 0),
          'nb_livres', COALESCE(l.nb_livres, 0),
          'nb_echecs', COALESCE(l.nb_echecs, c.nb_echecs, 0),
          'nb_reponses', COALESCE(c.nb_reponses, 0),
          'nb_convertis', COALESCE(conv.nb_convertis, 0),
          'message', CASE 
            WHEN COALESCE(conv.nb_convertis, 0) > 0
              THEN CONCAT('🎉 ', COALESCE(conv.nb_convertis, 0), ' boutique(s) créée(s) ! • ', COALESCE(l.nb_succes, c.nb_succes, 0), ' délivrés')
            WHEN COALESCE(conv.nb_en_discussion, 0) > 0 OR COALESCE(c.nb_reponses, 0) > 0
              THEN CONCAT('💬 ', GREATEST(COALESCE(c.nb_reponses, 0), COALESCE(conv.nb_en_discussion, 0)), ' réponse(s) / discussion(s) en cours • ', COALESCE(l.nb_succes, c.nb_succes, 0), ' délivrés')
            WHEN COALESCE(l.total_logs, c.nb_envoyes, 0) = 0 AND COALESCE((c.diagnostic->>'nb_ignores')::int, 0) > 0 
              THEN 'Tous les prospects étaient déjà contactés (anti-doublon)'
            WHEN COALESCE(l.nb_echecs, c.nb_echecs, 0) > 0 
              THEN CONCAT(
                COALESCE(l.nb_succes, c.nb_succes, 0), ' délivrés (', COALESCE(l.nb_lus, 0), ' lus, ', COALESCE(l.nb_livres, 0), ' livrés) • ',
                COALESCE(l.nb_echecs, c.nb_echecs, 0), ' rejetés par Meta'
              )
            WHEN COALESCE(l.total_logs, c.nb_envoyes, 0) > 0 
              THEN CONCAT(COALESCE(l.nb_succes, c.nb_succes, 0), ' messages délivrés avec succès (100%)')
            ELSE COALESCE(c.diagnostic->>'message', '—')
          END
        ) AS diagnostic
      FROM prospection_campagnes c
      LEFT JOIN (
        SELECT 
          campagne_id,
          COUNT(*) AS total_logs,
          COUNT(*) FILTER (WHERE statut IN ('envoye', 'livre', 'lu')) AS nb_succes,
          COUNT(*) FILTER (WHERE statut = 'echec') AS nb_echecs,
          COUNT(*) FILTER (WHERE statut = 'lu') AS nb_lus,
          COUNT(*) FILTER (WHERE statut = 'livre') AS nb_livres
        FROM prospection_messages_log
        WHERE campagne_id IS NOT NULL
        GROUP BY campagne_id
      ) l ON l.campagne_id = c.id
      LEFT JOIN (
        SELECT 
          l.campagne_id,
          COUNT(DISTINCT l.lead_id) FILTER (WHERE p.statut = 'converti') AS nb_convertis,
          COUNT(DISTINCT l.lead_id) FILTER (WHERE p.statut = 'en_discussion') AS nb_en_discussion
        FROM prospection_messages_log l
        JOIN prospection_leads p ON l.lead_id = p.id
        WHERE l.campagne_id IS NOT NULL
        GROUP BY l.campagne_id
      ) conv ON conv.campagne_id = c.id
      ORDER BY c.created_at DESC
      LIMIT 50
    `);
    res.json({ campagnes: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/prospection/campagnes/lancer ────────────────────────────────────
// Déclenche une campagne (simulation ou réelle)
router.post('/campagnes/lancer', adminOnly, async (req, res) => {
  try {
    const { titre, canal = 'whatsapp', templateMessage, sujetEmail, leadIds, simulation = true } = req.body;

    if (!templateMessage || !leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'Message et leadIds[] requis' });
    }

    // Auto-guérison du schéma BDD
    await ensureProspectionTables();

    let campagneId = null;
    try {
      // Création de la campagne en BDD
      const resCampagne = await pool.query(`
        INSERT INTO prospection_campagnes (
          titre, canal, statut, template_message, sujet_email, nb_total
        ) VALUES ($1, $2, 'en_cours', $3, $4, $5)
        RETURNING id
      `, [titre || `Campagne ${canal} - ${new Date().toLocaleDateString('fr-FR')}`, canal, templateMessage, sujetEmail || null, leadIds.length]);

      campagneId = resCampagne.rows[0]?.id;
    } catch (cmpInsertErr) {
      console.warn('[PROSPECTION] Insert campagne table warning (continuation en mode direct):', cmpInsertErr.message);
    }

    // Lancer la campagne en arrière-plan pour éviter les timeouts API (500)
    lancerCampagne({
      campagneId,
      leadIds,
      canal,
      templateMessage,
      simulation,
    }).catch(async (err) => {
      console.error('[PROSPECTION] Erreur background campagne:', err);
      if (campagneId) {
        try {
          await pool.query(
            `UPDATE prospection_campagnes SET statut = 'erreur', diagnostic = jsonb_build_object('erreur', $1::text, 'date', NOW()), date_fin = NOW() WHERE id = $2`,
            [err.message, campagneId]
          );
        } catch (_) {}
      }
      try {
        const { alerterAdmin } = require('../services/admin-alerts');
        alerterAdmin({
          type: `campagne_echec_${campagneId || 'generique'}`,
          titre: 'Échec de campagne de prospection',
          message: `La campagne ${campagneId || ''} a échoué en tâche de fond : ${err.message}`,
          details: err.stack,
          priorite: 'ATTENTION',
        }).catch(() => {});
      } catch (_) {}
    });

    res.json({
      success: true,
      campagneId,
      resultat: {
        en_arriere_plan: true,
        message: 'La campagne a été lancée en arrière-plan avec succès.'
      },
    });
  } catch (err) {
    console.error('[PROSPECTION CAMPAGNES LANCER ERR]:', err);
    res.status(500).json({ error: err.message || 'Erreur interne lors du lancement de la campagne' });
  }
});

// ── POST /api/prospection/relances/lancer ─────────────────────────────────────
// Déclenchement manuel immédiat des relances marchands, carnet de dettes & prospects
router.post('/relances/lancer', adminOnly, async (req, res) => {
  try {
    const { type = 'tout' } = req.body;
    const { traiterRelancesMarchands } = require('../services/cron-relances-marchands');
    const { traiterRelancesAutomatiquesWhatsApp } = require('../services/cron-relances-carnet');

    const resultats = {};

    if (type === 'tout' || type === 'marchands') {
      resultats.marchands = await traiterRelancesMarchands();
    }

    if (type === 'tout' || type === 'dettes') {
      resultats.dettes = await traiterRelancesAutomatiquesWhatsApp();
    }

    if (type === 'tout' || type === 'prospects') {
      resultats.prospects = await traiterRelancesProspectsAutomatiques({ limite: 30, simulation: false });
    }

    res.json({
      success: true,
      resultats,
      horodatage: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[PROSPECTION RELANCES ERR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/prospection/relances/prospects ──────────────────────────────────
// Déclenchement spécifique des relances automatiques prospects (J+3, J+7, clôture J+14)
router.post('/relances/prospects', adminOnly, async (req, res) => {
  try {
    const { limite = 30, simulation = false } = req.body;
    const stats = await traiterRelancesProspectsAutomatiques({ limite: parseInt(limite, 10) || 30, simulation });
    res.json({
      success: true,
      message: `Relances prospects exécutées : ${stats.relancesJ3} à J+3, ${stats.relancesJ7} à J+7, ${stats.cloturesJ14} clôturés J+14.`,
      stats,
    });
  } catch (err) {
    console.error('[PROSPECTION RELANCES PROSPECTS ERR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/prospection/scraper/lancer ──────────────────────────────────────
// Déclenchement manuel du scraper pour une zone donnée
router.post('/scraper/lancer', adminOnly, async (req, res) => {
  try {
    const { zone = 'Sandaga', limite = 20 } = req.body;
    const { sourcerZoneDakar } = require('../services/scraper-prospection');
    const stats = await sourcerZoneDakar(zone, parseInt(limite, 10) || 20);
    res.json(stats);
  } catch (err) {
    console.error('[PROSPECTION SCRAPER ERR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/prospection/crons/status ─────────────────────────────────────────
// Statut global et monitoring en DIRECT des crons et automatisations (A-05 FIX)
router.get('/crons/status', adminOnly, async (_req, res) => {
  try {
    const [rLeads, rLogs, rBoutiques, rBlacklist, rCronHistory] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*) AS total_leads,
          COUNT(*) FILTER (WHERE statut = 'nouveau') AS nouveaux,
          COUNT(*) FILTER (WHERE statut = 'contacte_wa') AS contactes_wa,
          COUNT(*) FILTER (WHERE statut = 'converti') AS convertis,
          COUNT(*) FILTER (WHERE statut = 'converti' AND (categorie = 'immo' OR sous_profil = 'agence')) AS agences_converties,
          COUNT(*) FILTER (WHERE statut = 'sans_reponse') AS sans_reponse,
          COUNT(*) FILTER (WHERE statut = 'desinscrit') AS desinscrits
        FROM prospection_leads
      `),
      pool.query(`
        SELECT 
          COUNT(*) AS total_messages,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS messages_aujourdhui,
          MAX(created_at) AS dernier_envoi_at
        FROM prospection_messages_log
      `),
      pool.query(`
        SELECT 
          COUNT(*) AS total_boutiques,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS creees_7j,
          COUNT(*) FILTER (WHERE actif = true) AS actives
        FROM boutiques
      `),
      pool.query(`
        SELECT COUNT(*) AS total_blacklist FROM whatsapp_blacklist
      `),
      // A-05 FIX : Lire les vraies exécutions depuis cron_executions
      pool.query(`
        SELECT DISTINCT ON (nom_cron)
          nom_cron, started_at, ended_at, statut, stats, erreur
        FROM cron_executions
        ORDER BY nom_cron, started_at DESC
      `).catch(() => ({ rows: [] })),
    ]);

    const { DIRECTOIRE_MARCHES_DAKAR } = require('../services/scraper-prospection');

    // Indexer l'historique par nom de cron pour lookup rapide
    const cronHistIdx = {};
    for (const row of (rCronHistory.rows || [])) {
      cronHistIdx[row.nom_cron] = row;
    }

    const buildCronInfo = (nomCron, label, frequence, description) => {
      const hist = cronHistIdx[nomCron] || null;
      return {
        nom: label,
        statut: hist ? (hist.statut === 'erreur' ? 'erreur' : 'actif') : 'jamais_execute',
        frequence,
        description,
        derniere_execution: hist ? hist.started_at : null,
        derniere_fin: hist ? hist.ended_at : null,
        dernier_statut: hist ? hist.statut : null,
        dernieres_stats: hist ? hist.stats : null,
        derniere_erreur: hist ? hist.erreur : null,
      };
    };

    res.json({
      crons: {
        relancesProspects: buildCronInfo(
          'relances_prospects',
          'Relances Automatiques Prospects (J+3, J+7, J+14)',
          'Lun-Sam à 11h00',
          'Relance 1 à J+3, Relance 2 à J+7, Clôture sans_reponse à J+14'
        ),
        relancesMarchands: buildCronInfo(
          'relances_marchands',
          'Relances Marchands (J+1, J+7, J+25)',
          'Toutes les 24h',
          'Onboarding J+1, Découverte caisse J+7, Offre -25% J+25'
        ),
        relancesDettes: buildCronInfo(
          'relances_carnet',
          'Relances Carnet de Dettes ("Bor")',
          'Toutes les 12h',
          'Rappels WhatsApp automatiques aux clients débiteurs'
        ),
        scraperProspection: buildCronInfo(
          'scraper_prospection',
          'Scraper & Sourcing Dakar en Continu',
          'À la demande & Quotidien',
          'Indexation continue des commerces de Dakar'
        ),
        chatbotTafTaf: {
          nom: 'Bot WhatsApp Onboarding Taf-Taf & +produit',
          statut: 'actif',
          frequence: 'Temps réel (24h/24)',
          description: 'Création de boutique et catalogue en direct sur WhatsApp',
          derniere_execution: null,
          derniere_erreur: null,
        }
      },
      stats: {
        leads: rLeads.rows[0],
        messages: rLogs.rows[0],
        boutiques: rBoutiques.rows[0],
        blacklist: rBlacklist.rows[0]?.total_blacklist || 0,
      },
      marchesDisponibles: DIRECTOIRE_MARCHES_DAKAR.map(m => m.zone),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/prospection/blacklist ────────────────────────────────────────────
// Liste des numéros blacklistés avec enrichissement des infos prospect/lead
router.get('/blacklist', adminOnly, async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        b.phone,
        b.reason,
        b.created_at,
        l.id AS lead_id,
        l.nom_boutique,
        l.contact_nom,
        l.categorie,
        l.ville,
        l.quartier,
        l.operateur,
        l.statut AS lead_statut
      FROM whatsapp_blacklist b
      LEFT JOIN prospection_leads l ON b.phone = l.telephone
    `;
    const params = [];
    if (search && search.trim()) {
      query += ` WHERE (b.phone ILIKE $1 OR b.reason ILIKE $1 OR l.nom_boutique ILIKE $1 OR l.contact_nom ILIKE $1 OR l.quartier ILIKE $1)`;
      params.push(`%${search.trim()}%`);
    }
    query += ` ORDER BY b.created_at DESC LIMIT 500`;

    const { rows } = await pool.query(query, params);
    res.json({ blacklist: rows, total: rows.length });
  } catch (err) {
    console.error('[PROSPECTION GET BLACKLIST ERR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/prospection/blacklist ───────────────────────────────────────────
// Ajouter manuellement un numéro à la blacklist
router.post('/blacklist', adminOnly, async (req, res) => {
  try {
    const { phone, reason = 'manuel_admin' } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Numéro de téléphone requis' });
    }
    const { normalisePhone, ajouterBlacklist } = require('../services/whatsapp');
    const norm = normalisePhone(phone);
    await ajouterBlacklist(norm, reason);

    // Mettre à jour le lead en 'desinscrit' s'il existe dans la table des prospects
    await pool.query(
      "UPDATE prospection_leads SET statut = 'desinscrit', updated_at = NOW() WHERE telephone = $1",
      [norm]
    );

    res.json({ success: true, phone: norm, reason });
  } catch (err) {
    console.error('[PROSPECTION POST BLACKLIST ERR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/prospection/blacklist/:phone ──────────────────────────────────
// Retirer un numéro de la blacklist (déblocage)
router.delete('/blacklist/:phone', adminOnly, async (req, res) => {
  try {
    const { phone } = req.params;
    const { normalisePhone, retirerBlacklist } = require('../services/whatsapp');
    const norm = normalisePhone(phone);
    await retirerBlacklist(norm);

    res.json({ success: true, phone: norm });
  } catch (err) {
    console.error('[PROSPECTION DELETE BLACKLIST ERR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/prospection/logs ─────────────────────────────────────────────────
// Historique des messages envoyés
router.get('/logs', adminOnly, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const { rows } = await pool.query(`
      SELECT 
        l.*,
        p.nom_boutique,
        p.contact_nom,
        p.telephone,
        p.categorie,
        p.quartier
      FROM prospection_messages_log l
      LEFT JOIN prospection_leads p ON l.lead_id = p.id
      ORDER BY l.created_at DESC
      LIMIT $1
    `, [parseInt(limit, 10) || 100]);

    res.json({ logs: rows });
  } catch (err) {
    console.error('[PROSPECTION GET LOGS ERR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/prospection/intelligence/overview ────────────────────────────────
// Vue 360° des performances, diagnostics, entonnoir global, top segments et top sources
router.get('/intelligence/overview', adminOnly, async (_req, res) => {
  try {
    const data = await analyserToutesLesCampagnes();
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('[PROSPECTION INTELLIGENCE OVERVIEW ERR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/prospection/intelligence/recommandation ──────────────────────────
// Recommandation intelligente de la prochaine campagne Nopalou
router.get('/intelligence/recommandation', adminOnly, async (_req, res) => {
  try {
    const reco = await recommanderProchaineCampagne();
    res.json({ success: true, recommandation: reco });
  } catch (err) {
    console.error('[PROSPECTION RECOMMANDATION ERR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/prospection/campagnes/:id/status ─────────────────────────────────
// Statut temps réel d'une campagne (polling depuis le frontend)
// Permet de suivre l'avancement d'une campagne lancée en arrière-plan (A-01 FIX)
router.get('/campagnes/:id/status', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const [resCampagne, resLogs] = await Promise.all([
      pool.query(
        `SELECT id, titre, canal, statut, nb_total, nb_envoyes, nb_succes, nb_echecs, nb_reponses, nb_boutiques_creees, created_at, date_fin
         FROM prospection_campagnes WHERE id::text = $1`,
        [String(id)]
      ),
      pool.query(
        `SELECT
           COUNT(*)::int AS total_traites,
           COUNT(*) FILTER (WHERE statut IN ('envoye', 'livre', 'lu'))::int AS envoyes,
           COUNT(*) FILTER (WHERE statut = 'echec')::int AS echecs,
           COUNT(*) FILTER (WHERE statut = 'simule')::int AS simules,
           COUNT(*) FILTER (WHERE statut = 'lu')::int AS lus,
           COUNT(*) FILTER (WHERE statut = 'livre')::int AS livres,
           MAX(created_at) AS dernier_log_at
         FROM prospection_messages_log
         WHERE campagne_id::text = $1`,
        [String(id)]
      ),
    ]);

    if (!resCampagne.rows.length) {
      return res.status(404).json({ error: 'Campagne introuvable' });
    }

    const cmp = resCampagne.rows[0];
    const logs = resLogs.rows[0] || {};
    const totalTraites = parseInt(logs.total_traites, 10) || 0;
    const nbTotal = parseInt(cmp.nb_total, 10) || 0;

    // Calcul de la progression
    const progression = nbTotal > 0 ? Math.min(100, Math.round((totalTraites / nbTotal) * 100)) : 0;

    // Détection automatique de fin de campagne (A-12 FIX — nettoie les zombies)
    const enCours = cmp.statut === 'en_cours';
    const semble_terminee = enCours && (
      totalTraites >= nbTotal ||
      (logs.dernier_log_at && new Date(logs.dernier_log_at) < new Date(Date.now() - 10 * 60 * 1000))
    );

    if (semble_terminee) {
      await pool.query(
        `UPDATE prospection_campagnes SET statut = 'terminee', date_fin = COALESCE(date_fin, NOW()),
         nb_envoyes = $1, nb_succes = $2, nb_echecs = $3,
         taux_delivrabilite = CASE WHEN $1 > 0 THEN ROUND(($2::numeric/$1::numeric)*100,2) ELSE 0 END
         WHERE id::text = $4 AND statut = 'en_cours'`,
        [totalTraites, logs.envoyes, logs.echecs, String(id)]
      ).catch(() => {});
      cmp.statut = 'terminee';
    }

    res.json({
      success: true,
      campagne_id: cmp.id,
      titre: cmp.titre,
      statut: cmp.statut,
      nb_total: nbTotal,
      progression,
      logs: {
        total_traites: totalTraites,
        envoyes: parseInt(logs.envoyes, 10) || 0,
        echecs: parseInt(logs.echecs, 10) || 0,
        simules: parseInt(logs.simules, 10) || 0,
        lus: parseInt(logs.lus, 10) || 0,
        livres: parseInt(logs.livres, 10) || 0,
        dernier_log_at: logs.dernier_log_at || null,
      },
      taux_delivrabilite: totalTraites > 0
        ? Math.round(((parseInt(logs.envoyes, 10) || 0) / totalTraites) * 100)
        : 0,
    });
  } catch (err) {
    console.error('[PROSPECTION CAMPAGNE STATUS ERR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/prospection/campagnes/:id/diagnostic ─────────────────────────────

// Diagnostic d'une campagne spécifique
router.get('/campagnes/:id/diagnostic', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const diag = await diagnostiquerCampagne(id);
    if (!diag) return res.status(404).json({ error: 'Campagne introuvable' });
    res.json({ success: true, diagnostic: diag });
  } catch (err) {
    console.error('[PROSPECTION CAMPAGNE DIAGNOSTIC ERR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/prospection/leads/:id/timeline ───────────────────────────────────
// Timeline chronologique et explication du score pour un lead spécifique
router.get('/leads/:id/timeline', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const timelineData = await obtenirTimelineLead(id);
    if (!timelineData) return res.status(404).json({ error: 'Lead introuvable' });
    res.json({ success: true, ...timelineData });
  } catch (err) {
    console.error('[PROSPECTION LEAD TIMELINE ERR]:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


