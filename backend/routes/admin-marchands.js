// backend/routes/admin-marchands.js
// Fiches marchands 360° complètes et pilotage individuel

const router = require('express').Router();
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

// ── GET /api/admin/marchands/:id/fiche — Vue 360° du marchand
router.get('/:id/fiche', adminSecretOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Profil Utilisateur
    const userRes = await pool.query(
      `SELECT id, nom, email, telephone, ville, email_verifie, suspendu, supprime_le, created_at, est_apporteur, code_apporteur, quota_annonces
       FROM utilisateurs WHERE id = $1`,
      [id]
    );
    if (!userRes.rows[0]) {
      return res.status(404).json({ error: 'Marchand introuvable' });
    }
    const utilisateur = userRes.rows[0];

    // 2. Boutiques rattachées
    const boutiquesRes = await pool.query(
      `SELECT b.*,
              (SELECT COUNT(*)::int FROM boutique_produits WHERE boutique_id = b.id) AS nb_produits,
              (SELECT COUNT(*)::int FROM boutique_caissiers WHERE boutique_id = b.id) AS nb_caissiers
       FROM boutiques b
       WHERE b.utilisateur_id = $1
       ORDER BY b.created_at DESC`,
      [id]
    );

    const boutiqueIds = boutiquesRes.rows.map(b => b.id);

    // 3. Abonnement actif et historique
    const abmtRes = await pool.query(
      `SELECT id, plan, statut, prix_mensuel, debut, fin, commande_ref, created_at
       FROM abonnements
       WHERE utilisateur_id = $1
       ORDER BY created_at DESC LIMIT 10`,
      [id]
    );

    // 4. Chiffre d'Affaires & Ventes
    let statsVentes = { ca_total: 0, nb_ventes: 0, panier_moyen: 0 };
    let commandesRecentes = [];
    let paiementsRecents = [];

    if (boutiqueIds.length > 0) {
      const vRes = await pool.query(
        `SELECT
           COALESCE(SUM(montant_total), 0) AS ca_total,
           COUNT(*) AS nb_ventes,
           COALESCE(AVG(montant_total), 0) AS panier_moyen
         FROM ventes
         WHERE boutique_id = ANY($1::uuid[]) AND archivee IS NOT TRUE`,
        [boutiqueIds]
      );
      if (vRes.rows[0]) {
        statsVentes = {
          ca_total: Number(vRes.rows[0].ca_total) || 0,
          nb_ventes: parseInt(vRes.rows[0].nb_ventes) || 0,
          panier_moyen: Math.round(Number(vRes.rows[0].panier_moyen) || 0),
        };
      }

      const cRes = await pool.query(
        `SELECT id, reference, boutique_id, nom_produit, montant_total, client_nom, client_telephone, statut, created_at
         FROM commandes_boutique
         WHERE boutique_id = ANY($1::uuid[])
         ORDER BY created_at DESC LIMIT 15`,
        [boutiqueIds]
      );
      commandesRecentes = cRes.rows;
    }

    // 5. Paiements manuels déclarés
    const pmRes = await pool.query(
      `SELECT id, reference, montant, methode, telephone_expediteur, statut, created_at
       FROM paiements_manuels
       WHERE utilisateur_id = $1
       ORDER BY created_at DESC LIMIT 10`,
      [id]
    );
    paiementsRecents = pmRes.rows;

    // 6. Logs récents d'activité boutique
    let logsRecents = [];
    if (boutiqueIds.length > 0) {
      const lRes = await pool.query(
        `SELECT id, boutique_id, auteur_nom, type_action, description, created_at
         FROM boutique_logs
         WHERE boutique_id = ANY($1::uuid[])
         ORDER BY created_at DESC LIMIT 20`,
        [boutiqueIds]
      );
      logsRecents = lRes.rows;
    }

    res.json({
      utilisateur,
      boutiques: boutiquesRes.rows,
      abonnementActuel: abmtRes.rows.find(a => a.statut === 'actif' && new Date(a.fin) > new Date()) || null,
      historiqueAbonnements: abmtRes.rows,
      finances: statsVentes,
      commandesRecentes,
      paiementsRecents,
      logsRecents,
    });
  } catch (err) {
    console.error('[ADMIN_MARCHAND_FICHE_ERR]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/marchands/:id/action-plan — Modification rapide de forfait pour un marchand
router.post('/:id/action-plan', adminSecretOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, jours = 30, note } = req.body;
    if (!plan) return res.status(400).json({ error: 'Plan requis' });

    const user = await pool.query('SELECT nom, email FROM utilisateurs WHERE id = $1', [id]);
    if (!user.rows[0]) return res.status(404).json({ error: 'Marchand introuvable' });

    const fin = new Date(Date.now() + Number(jours) * 24 * 60 * 60 * 1000).toISOString();

    // Annuler l'abonnement actif précédent
    await pool.query(
      `UPDATE abonnements SET statut = 'annule' WHERE utilisateur_id = $1 AND statut = 'actif'`,
      [id]
    );

    const { rows } = await pool.query(
      `INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, fin, commande_ref)
       VALUES ($1, $2, 'actif', 0, $3, $4)
       RETURNING *`,
      [id, plan, fin, `admin_grant_${id}_${Date.now()}`]
    );

    await enregistrerAdminLog({
      action: 'marchand_plan_accorde',
      cibleType: 'utilisateur',
      cibleId: id,
      description: `Attribution manuelle du plan "${plan}" pour ${jours} jours au marchand ${user.rows[0].nom} (${user.rows[0].email}) - Note: ${note || 'Aucune'}`,
      nouvelleValeur: rows[0],
      req,
    });

    res.json({ success: true, abonnement: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
