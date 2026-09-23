// backend/routes/admin-immo-global.js
// Centre de supervision intégrale du vertical Immobilier professionnel et gestion locative

const router = require('express').Router();
const { pool } = require('../models/db');
const { requireAdminAuth, requireAdminRole } = require('../middlewares/admin-rbac');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

router.use(requireAdminAuth);

// ── GET /api/admin/immo-global/stats — Synthèse exécutive du Pôle Immobilier
router.get('/stats', async (req, res) => {
  try {
    const [agencesRes, biensRes, bauxRes, loyersRes, transRes] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total_agences,
          COUNT(*) FILTER (WHERE statut = 'actif') AS agences_actives,
          COUNT(*) FILTER (WHERE sponsorise = TRUE) AS agences_sponsorisees
        FROM agences_immo
      `).catch(() => ({ rows: [{ total_agences: 0, agences_actives: 0, agences_sponsorisees: 0 }] })),
      pool.query(`
        SELECT
          COUNT(*) AS total_biens,
          COUNT(*) FILTER (WHERE statut_occupation = 'disponible') AS biens_disponibles,
          COUNT(*) FILTER (WHERE statut_occupation = 'loue') AS biens_loues,
          COUNT(*) FILTER (WHERE statut_occupation = 'vendu') AS biens_vendus
        FROM biens_immo
      `).catch(() => ({ rows: [{ total_biens: 0, biens_disponibles: 0, biens_loues: 0, biens_vendus: 0 }] })),
      pool.query(`
        SELECT
          COUNT(*) AS total_baux,
          COUNT(*) FILTER (WHERE statut = 'actif') AS baux_actifs,
          COALESCE(SUM(loyer_mensuel) FILTER (WHERE statut = 'actif'), 0) AS volume_loyers_mensuels
        FROM baux_immo
      `).catch(() => ({ rows: [{ total_baux: 0, baux_actifs: 0, volume_loyers_mensuels: 0 }] })),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE statut != 'paye' AND date_echeance < CURRENT_DATE) AS impayes_count,
          COALESCE(SUM(montant_restant) FILTER (WHERE statut != 'paye' AND date_echeance < CURRENT_DATE), 0) AS impayes_montant
        FROM loyers_echeances
      `).catch(() => ({ rows: [{ impayes_count: 0, impayes_montant: 0 }] })),
      pool.query(`
        SELECT
          COUNT(*) AS total_transactions,
          COALESCE(SUM(montant), 0) AS volume_transactions,
          COUNT(*) FILTER (WHERE statut = 'en_cours') AS transactions_en_cours
        FROM transactions_immo
      `).catch(() => ({ rows: [{ total_transactions: 0, volume_transactions: 0, transactions_en_cours: 0 }] })),
    ]);

    res.json({
      success: true,
      stats: {
        agences: agencesRes.rows[0],
        biens: biensRes.rows[0],
        baux: bauxRes.rows[0],
        loyers: loyersRes.rows[0],
        transactions: transRes.rows[0],
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/immo-global/agences — Annuaire des agences immobilières
router.get('/agences', async (req, res) => {
  try {
    const { q, statut, page = 1, limit = 30 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const conditions = [];
    const values = [];
    let i = 1;

    if (q && q.trim()) {
      conditions.push(`(a.nom ILIKE $${i} OR a.ville ILIKE $${i} OR a.telephone ILIKE $${i} OR u.nom ILIKE $${i})`);
      values.push(`%${q.trim()}%`);
      i++;
    }
    if (statut && statut !== 'tous') {
      conditions.push(`a.statut = $${i++}`);
      values.push(statut);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM agences_immo a LEFT JOIN utilisateurs u ON u.id = a.utilisateur_id ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || 0, 10);

    const { rows: agences } = await pool.query(
      `SELECT a.*, u.nom AS proprietaire_nom, u.email AS proprietaire_email,
              (SELECT COUNT(*)::int FROM biens_immo WHERE agence_id = a.id) AS nb_biens,
              (SELECT COUNT(*)::int FROM baux_immo WHERE agence_id = a.id AND statut = 'actif') AS nb_baux_actifs
       FROM agences_immo a
       LEFT JOIN utilisateurs u ON u.id = a.utilisateur_id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, parseInt(limit, 10), offset]
    );

    res.json({ success: true, agences, total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/immo-global/biens — Supervision globale du parc immobilier
router.get('/biens', async (req, res) => {
  try {
    const { q, type_bien, statut_occupation, agence_id, page = 1, limit = 30 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const conditions = [];
    const values = [];
    let i = 1;

    if (q && q.trim()) {
      conditions.push(`(b.titre ILIKE $${i} OR b.quartier ILIKE $${i} OR b.ville ILIKE $${i} OR a.nom ILIKE $${i})`);
      values.push(`%${q.trim()}%`);
      i++;
    }
    if (type_bien && type_bien !== 'tous') {
      conditions.push(`b.type_bien = $${i++}`);
      values.push(type_bien);
    }
    if (statut_occupation && statut_occupation !== 'tous') {
      conditions.push(`b.statut_occupation = $${i++}`);
      values.push(statut_occupation);
    }
    if (agence_id) {
      conditions.push(`b.agence_id = $${i++}`);
      values.push(agence_id);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM biens_immo b LEFT JOIN agences_immo a ON a.id = b.agence_id ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || 0, 10);

    const { rows: biens } = await pool.query(
      `SELECT b.id, b.reference, b.titre, b.type_bien, b.prix_location, b.prix_vente, b.ville, b.quartier,
              b.statut_occupation, b.surface_m2, b.nb_chambres, b.created_at,
              a.id AS agence_id, a.nom AS agence_nom, a.slug AS agence_slug
       FROM biens_immo b
       LEFT JOIN agences_immo a ON a.id = b.agence_id
       ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, parseInt(limit, 10), offset]
    );

    res.json({ success: true, biens, total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/immo-global/baux-loyers — Baux et impayés de loyers
router.get('/baux-loyers', async (req, res) => {
  try {
    const { impayes_seulement, page = 1, limit = 30 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const filter = impayes_seulement === 'true'
      ? "WHERE l.statut != 'paye' AND l.date_echeance < CURRENT_DATE"
      : "";

    const { rows: loyers } = await pool.query(
      `SELECT l.*, b.titre AS bien_titre, a.nom AS agence_nom, a.slug AS agence_slug,
              c.nom AS locataire_nom, c.telephone AS locataire_tel
       FROM loyers_echeances l
       JOIN baux_immo bx ON bx.id = l.bail_id
       JOIN biens_immo b ON b.id = bx.bien_id
       JOIN agences_immo a ON a.id = l.agence_id
       JOIN contacts_immo c ON c.id = bx.locataire_id
       ${filter}
       ORDER BY l.date_echeance DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit, 10), offset]
    );

    res.json({ success: true, loyers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/admin/immo-global/agences/:id/statut — Modérer statut d'une agence
router.put('/agences/:id/statut', requireAdminRole('super_admin', 'admin_operationnel'), async (req, res) => {
  try {
    const { id } = req.params;
    let { statut } = req.body;
    if (statut === 'active') statut = 'actif';
    if (statut === 'suspendue' || statut === 'inactif' || statut === 'desactive') statut = 'suspendu';
    if (!['actif', 'suspendu', 'en_attente'].includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const { rows } = await pool.query(
      'UPDATE agences_immo SET statut = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [statut, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Agence introuvable' });

    await enregistrerAdminLog({
      action: 'agence_immo_statut_modifie',
      cibleType: 'agence_immo',
      cibleId: id,
      description: `Changement de statut de l'agence "${rows[0].nom}" vers "${statut}"`,
      nouvelleValeur: { statut },
      req,
    });

    res.json({ success: true, agence: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/admin/immo-global/agences/:id/forfait — Changer forfait / sponsoring d'une agence
router.put('/agences/:id/forfait', requireAdminRole('super_admin', 'admin_operationnel'), async (req, res) => {
  try {
    const { id } = req.params;
    const { abonnement_plan, sponsorise, jours_sponsoring, jours_abonnement } = req.body;

    const current = await pool.query('SELECT * FROM agences_immo WHERE id = $1', [id]);
    if (!current.rows[0]) {
      return res.status(404).json({ error: 'Agence introuvable' });
    }

    const cur = current.rows[0];
    const newPlan = abonnement_plan !== undefined ? abonnement_plan : cur.abonnement_plan;
    let newSponsorise = sponsorise !== undefined ? Boolean(sponsorise) : cur.sponsorise;
    let newSponsorFin = cur.sponsor_jusqu_au;
    let newAbonnementFin = cur.abonnement_fin;

    if (jours_abonnement) {
      const days = parseInt(jours_abonnement, 10) || 30;
      newAbonnementFin = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
    }

    if (sponsorise === true) {
      const days = parseInt(jours_sponsoring, 10) || 30;
      newSponsorFin = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
    } else if (sponsorise === false) {
      newSponsorFin = null;
    }

    const { rows } = await pool.query(`
      UPDATE agences_immo
      SET
        abonnement_plan = $1,
        abonnement_fin = $2,
        sponsorise = $3,
        sponsor_jusqu_au = $4,
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [newPlan, newAbonnementFin, newSponsorise, newSponsorFin, id]);

    await enregistrerAdminLog({
      action: 'agence_immo_forfait_modifie',
      cibleType: 'agence_immo',
      cibleId: id,
      description: `Mise à jour du forfait de l'agence "${rows[0].nom}" vers "${newPlan}" (Sponsoring: ${newSponsorise ? 'Oui' : 'Non'})`,
      ancienneValeur: { abonnement_plan: cur.abonnement_plan, sponsorise: cur.sponsorise, abonnement_fin: cur.abonnement_fin },
      nouvelleValeur: { abonnement_plan: newPlan, sponsorise: newSponsorise, sponsor_jusqu_au: newSponsorFin, abonnement_fin: newAbonnementFin },
      req,
    });

    res.json({ success: true, agence: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/admin/immo-global/agences/:id — Supprimer une agence immobilière
router.delete('/agences/:id', requireAdminRole('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const agenceRes = await pool.query('SELECT * FROM agences_immo WHERE id = $1', [id]);
    if (!agenceRes.rows[0]) {
      return res.status(404).json({ error: 'Agence introuvable' });
    }
    const agence = agenceRes.rows[0];

    await pool.query('DELETE FROM agences_immo WHERE id = $1', [id]);

    await enregistrerAdminLog({
      action: 'agence_immo_supprimee',
      cibleType: 'agence_immo',
      cibleId: id,
      description: `Suppression définitive de l'agence immobilière "${agence.nom}" (${agence.slug})`,
      ancienneValeur: { nom: agence.nom, slug: agence.slug, utilisateur_id: agence.utilisateur_id },
      req,
    });

    res.json({ success: true, message: 'Agence supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

