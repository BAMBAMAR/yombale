const router = require('express').Router();
const { pool } = require('../models/db');
const { verifierToken, adminSecretOnly } = require('../middlewares/auth');
const settingsCache = require('../lib/settingsCache');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // pas de 0/O/1/I pour lisibilité

function genererCode() {
  let code = '';
  for (let i = 0; i < 6; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return code;
}

async function genererCodeUnique() {
  for (let tentative = 0; tentative < 10; tentative++) {
    const code = genererCode();
    const { rows } = await pool.query('SELECT id FROM utilisateurs WHERE code_apporteur=$1', [code]);
    if (!rows[0]) return code;
  }
  throw new Error('Impossible de générer un code apporteur unique');
}

// POST /api/apporteurs/devenir — active le statut apporteur pour l'utilisateur connecté
router.post('/devenir', verifierToken, async (req, res) => {
  try {
    const actif = await settingsCache.getBool('apporteur_actif');
    if (!actif) return res.status(403).json({ error: 'Le programme apporteur d\'affaires n\'est pas actif actuellement.' });

    const userId = req.user.userId;
    const existing = await pool.query('SELECT est_apporteur, code_apporteur FROM utilisateurs WHERE id=$1', [userId]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });

    if (existing.rows[0].est_apporteur && existing.rows[0].code_apporteur) {
      return res.json({ success: true, code_apporteur: existing.rows[0].code_apporteur, deja_apporteur: true });
    }

    const code = await genererCodeUnique();
    await pool.query('UPDATE utilisateurs SET est_apporteur=true, code_apporteur=$1 WHERE id=$2', [code, userId]);
    res.json({ success: true, code_apporteur: code, deja_apporteur: false });
  } catch (err) {
    console.error('[APPORTEURS DEVENIR]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/apporteurs/mes-stats — recrutements et commissions de l'apporteur connecté
router.get('/mes-stats', verifierToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await pool.query('SELECT est_apporteur, code_apporteur FROM utilisateurs WHERE id=$1', [userId]);
    if (!user.rows[0]?.est_apporteur) {
      return res.status(403).json({ error: 'Vous n\'êtes pas encore apporteur d\'affaires.' });
    }

    const boutiques = await pool.query(
      `SELECT b.id, b.nom, a.plan, a.statut AS abonnement_statut
       FROM boutiques b
       LEFT JOIN abonnements a ON a.utilisateur_id = b.utilisateur_id AND a.statut='actif' AND a.fin > NOW()
       WHERE b.apporteur_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );

    const totaux = await pool.query(
      `SELECT
         COALESCE(SUM(montant) FILTER (WHERE statut='du'), 0)   AS total_du,
         COALESCE(SUM(montant) FILTER (WHERE statut='paye'), 0) AS total_paye
       FROM commissions_apporteur WHERE apporteur_id=$1`,
      [userId]
    );

    const taux = await settingsCache.getNum('apporteur_taux_commission');
    const seuil = await settingsCache.getNum('apporteur_seuil_paiement');

    res.json({
      code_apporteur: user.rows[0].code_apporteur,
      boutiques: boutiques.rows,
      total_du: Number(totaux.rows[0].total_du),
      total_paye: Number(totaux.rows[0].total_paye),
      taux_commission: taux,
      seuil_paiement: seuil,
    });
  } catch (err) {
    console.error('[APPORTEURS MES-STATS]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/apporteurs/admin — vue d'ensemble de tous les apporteurs (admin)
router.get('/admin', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.nom, u.email, u.code_apporteur,
             COUNT(b.id) AS nb_boutiques,
             COALESCE(SUM(c.montant) FILTER (WHERE c.statut='du'), 0)   AS total_du,
             COALESCE(SUM(c.montant) FILTER (WHERE c.statut='paye'), 0) AS total_paye
      FROM utilisateurs u
      LEFT JOIN boutiques b ON b.apporteur_id = u.id
      LEFT JOIN commissions_apporteur c ON c.apporteur_id = u.id
      WHERE u.est_apporteur = true
      GROUP BY u.id, u.nom, u.email, u.code_apporteur
      ORDER BY total_du DESC
    `);
    res.json({ apporteurs: rows });
  } catch (err) {
    console.error('[APPORTEURS ADMIN]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
