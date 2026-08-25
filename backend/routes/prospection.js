// backend/routes/prospection.js — Routes d'administration pour la prospection et collecte de leads
const router = require('express').Router();
const { pool } = require('../models/db');
const { adminSecretOnly: adminOnly } = require('../middlewares/auth');
const {
  normaliserTelephoneSenegal,
  TEMPLATES_PAR_DEFAUT,
  extraireLeadsDepuisTexte,
  autoSourcerDepuisAnnonces,
  genererRequetesDorking,
  lancerCampagne,
  genererLienWhatsApp,
  nettoyerTousLesLeadsBdd,
} = require('../services/prospection');

// ── GET /api/prospection/leads ────────────────────────────────────────────────
// Liste paginée avec filtres et statistiques globales
router.get('/leads', adminOnly, async (req, res) => {
  try {
    const { search, categorie, statut, ville, page = 1, limit = 50 } = req.query;
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
          COUNT(*) FILTER (WHERE statut = 'converti') AS convertis,
          COUNT(*) FILTER (WHERE statut = 'desinscrit') AS desinscrits
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
        convertis: parseInt(resStats.rows[0].convertis, 10) || 0,
        desinscrits: parseInt(resStats.rows[0].desinscrits, 10) || 0,
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

      // Vérifier si le nouveau numéro est déjà pris par un autre prospect
      const checkDoublon = await pool.query(
        'SELECT id FROM prospection_leads WHERE (telephone = $1 OR telephone = $2) AND id != $3',
        [normTel.national, normTel.local, id]
      );
      if (checkDoublon.rows.length > 0) {
        return res.status(409).json({ error: 'Ce numéro de téléphone est déjà associé à un autre prospect dans la base' });
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
    await pool.query('DELETE FROM prospection_leads WHERE id = ANY($1::uuid[])', [ids]);
    res.json({ success: true, count: ids.length });
  } catch (err) {
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

// ── POST /api/prospection/leads/auto-source ───────────────────────────────────
// Auto-sourcing depuis les annonces classifiées de la plateforme
router.post('/leads/auto-source', adminOnly, async (req, res) => {
  try {
    const stats = await autoSourcerDepuisAnnonces();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
// Liste des campagnes de prospection
router.get('/campagnes', adminOnly, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM prospection_campagnes
      ORDER BY created_at DESC
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

    if (!templateMessage || !leadIds || leadIds.length === 0) {
      return res.status(400).json({ error: 'Message et leadIds[] requis' });
    }

    // Création de la campagne en BDD
    const resCampagne = await pool.query(`
      INSERT INTO prospection_campagnes (
        titre, canal, statut, template_message, sujet_email, nb_total
      ) VALUES ($1, $2, 'en_cours', $3, $4, $5)
      RETURNING id
    `, [titre || `Campagne ${canal} - ${new Date().toLocaleDateString('fr-FR')}`, canal, templateMessage, sujetEmail || null, leadIds.length]);

    const campagneId = resCampagne.rows[0].id;

    // Lancer la campagne
    const resultat = await lancerCampagne({
      campagneId,
      leadIds,
      canal,
      templateMessage,
      simulation,
    });

    res.json({
      success: true,
      campagneId,
      resultat,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/prospection/relances/lancer ─────────────────────────────────────
// Déclenchement manuel immédiat des relances marchands & carnet de dettes
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

// ── POST /api/prospection/scraper/lancer ──────────────────────────────────────
// Déclenchement manuel immédiat du scraper de prospection
router.post('/scraper/lancer', adminOnly, async (req, res) => {
  try {
    const { zone = 'Sandaga', categorie = 'all', limite = 30 } = req.body;
    const { lancerScrapingProspection } = require('../services/scraper-prospection');

    const resultats = await lancerScrapingProspection({ zone, categorie, limite: parseInt(limite, 10) || 30 });
    res.json(resultats);
  } catch (err) {
    console.error('[PROSPECTION SCRAPER ERR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/prospection/crons/status ─────────────────────────────────────────
// Statut global et monitoring en direct des crons et automatisations
router.get('/crons/status', adminOnly, async (_req, res) => {
  try {
    const [rLeads, rLogs, rBoutiques, rBlacklist] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*) AS total_leads,
          COUNT(*) FILTER (WHERE statut = 'nouveau') AS nouveaux,
          COUNT(*) FILTER (WHERE statut = 'contacte_wa') AS contactes_wa,
          COUNT(*) FILTER (WHERE statut = 'converti') AS convertis,
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
      `)
    ]);

    const { DIRECTOIRE_MARCHES_DAKAR } = require('../services/scraper-prospection');

    res.json({
      crons: {
        relancesMarchands: {
          nom: 'Relances Marchands (J+1, J+7, J+25)',
          statut: 'actif',
          frequence: 'Toutes les 24h',
          description: 'Onboarding J+1, Découverte caisse J+7, Offre -25% J+25',
        },
        relancesDettes: {
          nom: 'Relances Carnet de Dettes ("Bor")',
          statut: 'actif',
          frequence: 'Toutes les 12h',
          description: 'Rappels WhatsApp automatiques aux clients débiteurs',
        },
        scraperProspection: {
          nom: 'Scraper & Sourcing Dakar en Continu',
          statut: 'actif',
          frequence: 'À la demande & Quotidien',
          description: 'Indexation continue des commerces de Dakar',
        },
        chatbotTafTaf: {
          nom: 'Bot WhatsApp Onboarding Taf-Taf & +produit',
          statut: 'actif',
          frequence: 'Temps réel (24h/24)',
          description: 'Création de boutique et catalogue en direct sur WhatsApp',
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

module.exports = router;

