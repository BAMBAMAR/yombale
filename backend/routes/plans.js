// backend/routes/plans.js
// CRUD complet des forfaits et abonnements marchands (100% administrable)

const router = require('express').Router();
const { pool } = require('../models/db');
const { requireAdminAuth, requireAdminRole } = require('../middlewares/admin-rbac');
const plansCache = require('../lib/plansCache');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

// Helper slugify
function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// ── GET /api/plans/public — Forfaits publics actifs avec avantages et prix
router.get('/public', async (req, res) => {
  try {
    const plans = await plansCache.getAllPlans(true);
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/plans/admin/tous — Tous les forfaits pour la console d'administration
router.get('/admin/tous', requireAdminAuth, async (req, res) => {
  try {
    const plans = await plansCache.getAllPlans(false);
    
    // Obtenir le nombre d'abonnés actifs par plan (boutiques et agences immobilières)
    const [boutiqueStats, immoStats] = await Promise.all([
      pool.query(`
        SELECT plan, COUNT(*)::int AS nb_actifs
        FROM abonnements
        WHERE statut = 'actif' AND fin > NOW()
        GROUP BY plan
      `),
      pool.query(`
        SELECT abonnement_plan, COUNT(*)::int AS nb_actifs
        FROM agences_immo
        WHERE statut = 'actif'
        GROUP BY abonnement_plan
      `),
    ]);

    const statsMap = Object.fromEntries(boutiqueStats.rows.map(s => [s.plan, s.nb_actifs]));
    const immoStatsMap = Object.fromEntries(immoStats.rows.map(s => [s.abonnement_plan, s.nb_actifs]));
    immoStatsMap['immo_essentiel'] = (immoStatsMap['immo_essentiel'] || 0) + (immoStatsMap['essentiel'] || 0);

    const enriched = plans.map(p => ({
      ...p,
      nb_abonnes_actifs: p.categorie === 'immo' ? (immoStatsMap[p.slug] || 0) : (statsMap[p.slug] || 0),
    }));

    res.json({ plans: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/plans/admin — Création d'un nouveau plan (admin)
router.post('/admin', requireAdminAuth, requireAdminRole('super_admin', 'finance'), async (req, res) => {
  try {
    const { slug: customSlug, label, prix_mensuel, badge, couleur, avantages, limites, ordre, actif, description, categorie } = req.body;
    if (!label || !label.trim()) {
      return res.status(400).json({ error: 'Le libellé du forfait est obligatoire' });
    }

    const finalSlug = customSlug && customSlug.trim() ? slugify(customSlug) : slugify(label);
    const finalPrix = Math.max(0, Number(prix_mensuel) || 0);
    const finalCat = categorie === 'immo' ? 'immo' : 'boutique';

    const { rows } = await pool.query(
      `INSERT INTO plans (slug, label, prix_mensuel, badge, couleur, avantages, limites, ordre, actif, description, categorie, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING *`,
      [
        finalSlug,
        label.trim(),
        finalPrix,
        badge ? badge.trim() : null,
        couleur || '#0284c7',
        JSON.stringify(Array.isArray(avantages) ? avantages : []),
        JSON.stringify(typeof limites === 'object' && limites !== null ? limites : {}),
        parseInt(ordre) || 0,
        actif !== false,
        description ? description.trim() : '',
        finalCat,
      ]
    );

    plansCache.invalidate();

    await enregistrerAdminLog({
      action: 'plan_cree',
      cibleType: 'plan',
      cibleId: rows[0].id,
      description: `Création du nouveau plan tarifaire "${label}" (${finalSlug}, ${finalCat}) à ${finalPrix} FCFA/mois`,
      nouvelleValeur: rows[0],
      req,
    });

    res.json({ success: true, plan: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Un forfait avec cet identifiant technique (slug) existe déjà.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/plans/admin/:id — Mise à jour d'un forfait (admin)
router.put('/admin/:id', requireAdminAuth, requireAdminRole('super_admin', 'finance'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'Identifiant de forfait valide requis.' });
    }
    const { label, prix_mensuel, badge, couleur, avantages, limites, ordre, actif, description, categorie } = req.body;

    const current = await pool.query('SELECT * FROM plans WHERE id::text = $1 OR slug = $1', [id]);
    if (!current.rows[0]) {
      return res.status(404).json({ error: 'Plan introuvable' });
    }

    const cur = current.rows[0];
    const newLabel = label !== undefined ? label.trim() : cur.label;
    const newPrix = prix_mensuel !== undefined ? Math.max(0, Number(prix_mensuel)) : cur.prix_mensuel;
    const newBadge = badge !== undefined ? (badge ? badge.trim() : null) : cur.badge;
    const newCouleur = couleur !== undefined ? couleur : cur.couleur;
    const newAvantages = avantages !== undefined ? JSON.stringify(Array.isArray(avantages) ? avantages : []) : cur.avantages;
    const newLimites = limites !== undefined ? JSON.stringify(typeof limites === 'object' && limites !== null ? limites : {}) : cur.limites;
    const newOrdre = ordre !== undefined ? parseInt(ordre) : cur.ordre;
    const newActif = actif !== undefined ? Boolean(actif) : cur.actif;
    const newDesc = description !== undefined ? description.trim() : cur.description;
    const newCat = categorie !== undefined ? (categorie === 'immo' ? 'immo' : 'boutique') : cur.categorie || 'boutique';

    const { rows } = await pool.query(
      `UPDATE plans
       SET label = $1, prix_mensuel = $2, badge = $3, couleur = $4, avantages = $5, limites = $6, ordre = $7, actif = $8, description = $9, categorie = $10, updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [newLabel, newPrix, newBadge, newCouleur, newAvantages, newLimites, newOrdre, newActif, newDesc, newCat, cur.id]
    );

    plansCache.invalidate();

    await enregistrerAdminLog({
      action: 'plan_modifie',
      cibleType: 'plan',
      cibleId: cur.id,
      description: `Mise à jour du forfait "${newLabel}" (${cur.slug}) — Prix: ${newPrix} FCFA/mois`,
      ancienneValeur: cur,
      nouvelleValeur: rows[0],
      req,
    });

    res.json({ success: true, plan: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/plans/admin/:id — Suppression d'un forfait (admin)
router.delete('/admin/:id', requireAdminAuth, requireAdminRole('super_admin', 'finance'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'Identifiant de forfait valide requis.' });
    }
    const current = await pool.query('SELECT * FROM plans WHERE id::text = $1 OR slug = $1', [id]);
    if (!current.rows[0]) return res.status(404).json({ error: 'Plan introuvable' });

    const plan = current.rows[0];

    // Vérifier si des abonnements actifs utilisent ce plan
    const check = await pool.query(
      `SELECT COUNT(*)::int AS count FROM abonnements WHERE plan = $1 AND statut = 'actif' AND fin > NOW()`,
      [plan.slug]
    );

    if (check.rows[0].count > 0) {
      // Désactiver plutôt que supprimer
      await pool.query('UPDATE plans SET actif = FALSE WHERE id = $1', [plan.id]);
      plansCache.invalidate();
      return res.json({
        success: true,
        desactive: true,
        message: `Le plan "${plan.label}" a été désactivé car ${check.rows[0].count} abonné(s) actif(s) l'utilisent actuellement.`,
      });
    }

    await pool.query('DELETE FROM plans WHERE id = $1', [plan.id]);
    plansCache.invalidate();

    await enregistrerAdminLog({
      action: 'plan_supprime',
      cibleType: 'plan',
      cibleId: id,
      description: `Suppression du forfait "${plan.label}" (${plan.slug})`,
      ancienneValeur: plan,
      req,
    });

    res.json({ success: true, deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

