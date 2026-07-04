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
             (SELECT COUNT(*) FROM boutiques WHERE apporteur_id = u.id) AS nb_boutiques,
             (SELECT COALESCE(SUM(montant),0) FROM commissions_apporteur WHERE apporteur_id=u.id AND statut='du')   AS total_du,
             (SELECT COALESCE(SUM(montant),0) FROM commissions_apporteur WHERE apporteur_id=u.id AND statut='paye') AS total_paye
      FROM utilisateurs u
      WHERE u.est_apporteur = true
      ORDER BY total_du DESC
    `);
    res.json({ apporteurs: rows });
  } catch (err) {
    console.error('[APPORTEURS ADMIN]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/apporteurs/admin/commissions — toutes les lignes de commission (admin)
router.get('/admin/commissions', adminSecretOnly, async (req, res) => {
  try {
    const statutFiltre = req.query.statut; // 'du' | 'paye' | undefined
    const params = [];
    let where = '';
    if (statutFiltre === 'du' || statutFiltre === 'paye') {
      params.push(statutFiltre);
      where = 'WHERE c.statut = $1';
    }

    const { rows } = await pool.query(`
      SELECT c.id, c.montant, c.statut, c.created_at, c.paye_at,
             u.nom AS apporteur_nom, u.code_apporteur,
             b.nom AS boutique_nom,
             (SELECT COALESCE(SUM(montant),0) FROM commissions_apporteur WHERE apporteur_id = u.id AND statut='du') AS cumul_du_apporteur
      FROM commissions_apporteur c
      JOIN utilisateurs u ON u.id = c.apporteur_id
      JOIN boutiques b ON b.id = c.boutique_id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT 500
    `, params);

    const seuil = await settingsCache.getNum('apporteur_seuil_paiement');
    const enrichi = rows.map(r => ({
      ...r,
      seuil_atteint: Number(r.cumul_du_apporteur) >= seuil,
    }));

    res.json({ commissions: enrichi, seuil_paiement: seuil });
  } catch (err) {
    console.error('[APPORTEURS ADMIN COMMISSIONS]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/apporteurs/admin/commissions/:id/payer — marquer une commission comme payée (admin)
router.put('/admin/commissions/:id/payer', adminSecretOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const ignorerSeuil = req.body?.ignorer_seuil === true;

    const ligne = await pool.query('SELECT id, apporteur_id, statut FROM commissions_apporteur WHERE id=$1', [id]);
    if (!ligne.rows[0]) return res.status(404).json({ error: 'Commission introuvable' });
    if (ligne.rows[0].statut === 'paye') return res.status(409).json({ error: 'Cette commission est déjà payée' });

    if (!ignorerSeuil) {
      const cumul = await pool.query(
        `SELECT COALESCE(SUM(montant),0) AS total FROM commissions_apporteur WHERE apporteur_id=$1 AND statut='du'`,
        [ligne.rows[0].apporteur_id]
      );
      const seuil = await settingsCache.getNum('apporteur_seuil_paiement');
      if (Number(cumul.rows[0].total) < seuil) {
        return res.status(422).json({
          error: `Le cumul dû (${cumul.rows[0].total} FCFA) est sous le seuil de règlement (${seuil} FCFA). Utilisez ignorer_seuil pour forcer.`,
        });
      }
    }

    const { rows } = await pool.query(
      `UPDATE commissions_apporteur SET statut='paye', paye_at=NOW() WHERE id=$1 RETURNING *`,
      [id]
    );
    res.json({ success: true, commission: rows[0] });
  } catch (err) {
    console.error('[APPORTEURS PAYER]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/apporteurs/admin/boutiques/:id/attribuer — attribution manuelle boutique <-> apporteur (admin)
router.put('/admin/boutiques/:id/attribuer', adminSecretOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { code_apporteur, apporteur_id } = req.body;

    const boutique = await pool.query('SELECT id FROM boutiques WHERE id=$1', [id]);
    if (!boutique.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });

    if (apporteur_id === null) {
      await pool.query('UPDATE boutiques SET apporteur_id=NULL WHERE id=$1', [id]);
      return res.json({ success: true, apporteur_id: null });
    }

    if (!code_apporteur) return res.status(400).json({ error: 'code_apporteur ou apporteur_id: null requis' });

    const apporteur = await pool.query(
      'SELECT id FROM utilisateurs WHERE code_apporteur=$1 AND est_apporteur=true',
      [code_apporteur.trim().toUpperCase()]
    );
    if (!apporteur.rows[0]) return res.status(404).json({ error: 'Code apporteur introuvable' });

    await pool.query('UPDATE boutiques SET apporteur_id=$1 WHERE id=$2', [apporteur.rows[0].id, id]);
    res.json({ success: true, apporteur_id: apporteur.rows[0].id });
  } catch (err) {
    console.error('[APPORTEURS ATTRIBUER]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
