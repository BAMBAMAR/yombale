// backend/routes/annonces.js — Annonces classifiées multi-catégories
const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { adminSecretOnly, verifierToken } = require('../middlewares/auth');
const { limiterPublication, limiterEcriture } = require('../middlewares/rateLimit');

const PRIX_ANNONCE  = 1500;   // FCFA par annonce payante (après quota gratuit)
const QUOTA_GRATUIT = 2;      // nombre d'annonces gratuites par compte

const CATS_AUTORISEES = [
  'smartphones', 'informatique', 'tv-electro', 'mode',
  'maison', 'auto-moto', 'jeux', 'services',
];

const validationCreation = [
  body('titre').trim().notEmpty().withMessage('Titre requis'),
  body('contact_tel').trim().notEmpty().withMessage('Téléphone requis'),
  body('categorie_slug').isIn(CATS_AUTORISEES).withMessage('Catégorie invalide'),
  body('prix').optional({ checkFalsy: true }).isFloat({ gt: 0 }),
  body('ville').optional({ checkFalsy: true }).isString(),
  body('quartier').optional({ checkFalsy: true }).isString(),
  body('description').optional({ checkFalsy: true }).isString(),
  body('contact_nom').optional({ checkFalsy: true }).isString(),
];

// ── Compte total annonces utilisateur (immo + classifiées)
async function compterAnnoncesUtilisateur(userId) {
  const r = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM annonces_immo         WHERE utilisateur_id=$1 AND supprimee=FALSE) +
      (SELECT COUNT(*) FROM annonces_classifiees  WHERE utilisateur_id=$1 AND supprimee=FALSE)
    AS total
  `, [userId]);
  return parseInt(r.rows[0].total || 0, 10);
}

// ── GET /api/annonces — liste publique paginée
router.get('/', async (req, res) => {
  try {
    const { categorie, ville, q, limit = 20, page = 1 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
    const lim    = Math.min(50, parseInt(limit));

    const conds = ['actif=true', 'supprimee=false'];
    const vals  = [];

    if (categorie) { vals.push(categorie); conds.push(`categorie_slug=$${vals.length}`); }
    if (ville)     { vals.push(ville);     conds.push(`ville ILIKE $${vals.length}`); }
    if (q) {
      vals.push(`%${q}%`);
      conds.push(`(titre ILIKE $${vals.length} OR description ILIKE $${vals.length})`);
    }

    const where = 'WHERE ' + conds.join(' AND ');
    const [rows, cnt] = await Promise.all([
      pool.query(
        `SELECT id, categorie_slug, titre, description, prix, ville, quartier,
                contact_nom, contact_tel, photos, created_at
         FROM annonces_classifiees ${where}
         ORDER BY created_at DESC LIMIT $${vals.length+1} OFFSET $${vals.length+2}`,
        [...vals, lim, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM annonces_classifiees ${where}`, vals),
    ]);
    res.json({ annonces: rows.rows, total: parseInt(cnt.rows[0].count), page: parseInt(page) });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── GET /api/annonces/mine — mes annonces (auth)
router.get('/mine', verifierToken, async (req, res) => {
  try {
    const rows = await pool.query(
      `SELECT id, categorie_slug, titre, prix, ville, actif, payee, supprimee, created_at
       FROM annonces_classifiees
       WHERE utilisateur_id=$1 AND supprimee=false
       ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json({ annonces: rows.rows });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── GET /api/annonces/admin/en-attente (admin)
router.get('/admin/en-attente', adminSecretOnly, async (req, res) => {
  try {
    const rows = await pool.query(
      `SELECT a.*, u.nom AS auteur_nom, u.email AS auteur_email
       FROM annonces_classifiees a
       LEFT JOIN utilisateurs u ON u.id = a.utilisateur_id
       WHERE a.supprimee=false AND (a.actif=false OR a.payee=false)
       ORDER BY a.created_at DESC LIMIT 100`
    );
    res.json({ annonces: rows.rows });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── GET /api/annonces/:id — détail
router.get('/:id', param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const r = await pool.query(
      `SELECT * FROM annonces_classifiees WHERE id=$1 AND actif=true AND supprimee=false`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Annonce introuvable' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── POST /api/annonces — créer annonce (auth, quota gratuit)
router.post('/', limiterPublication, verifierToken, validationCreation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const userId = req.user.userId;
    const { categorie_slug, titre, description, prix, ville, quartier,
            contact_nom, contact_tel } = req.body;

    const total     = await compterAnnoncesUtilisateur(userId);
    const estGratuit = total < QUOTA_GRATUIT;

    const r = await pool.query(
      `INSERT INTO annonces_classifiees
         (utilisateur_id, categorie_slug, titre, description, prix, ville, quartier,
          contact_nom, contact_tel, payee, actif)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false)
       RETURNING id`,
      [userId, categorie_slug, titre, description || null,
       prix || null, ville || 'Dakar', quartier || null,
       contact_nom || null, contact_tel, estGratuit]
    );
    const id = r.rows[0].id;

    if (estGratuit) {
      return res.status(201).json({
        success: true, id,
        besoin_paiement: false,
        message: 'Annonce envoyée — elle sera visible après validation.'
      });
    }

    res.status(201).json({
      success: true, id,
      besoin_paiement: true,
      montant: PRIX_ANNONCE,
      annonces_gratuites_utilisees: total,
      message: `Quota gratuit atteint (${QUOTA_GRATUIT} annonces). Paiement de ${PRIX_ANNONCE} FCFA requis.`
    });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── PUT /api/annonces/mine/:id — modifier la sienne
router.put('/mine/:id', verifierToken, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { titre, description, prix, ville, quartier, contact_nom, contact_tel } = req.body;
    const r = await pool.query(
      `UPDATE annonces_classifiees
       SET titre=$1, description=$2, prix=$3, ville=$4, quartier=$5,
           contact_nom=$6, contact_tel=$7, updated_at=NOW()
       WHERE id=$8 AND utilisateur_id=$9 AND supprimee=false
       RETURNING id`,
      [titre, description, prix || null, ville, quartier, contact_nom, contact_tel,
       req.params.id, req.user.userId]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Annonce introuvable' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── DELETE /api/annonces/mine/:id — supprimer la sienne (soft)
router.delete('/mine/:id', verifierToken, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const r = await pool.query(
      `UPDATE annonces_classifiees SET supprimee=true, actif=false, updated_at=NOW()
       WHERE id=$1 AND utilisateur_id=$2 AND supprimee=false RETURNING id`,
      [req.params.id, req.user.userId]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Annonce introuvable' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── PUT /api/annonces/admin/:id — approuver / rejeter (admin)
router.put('/admin/:id', adminSecretOnly, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { actif } = req.body;
    await pool.query(
      `UPDATE annonces_classifiees SET actif=$1, updated_at=NOW() WHERE id=$2`,
      [!!actif, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

module.exports = router;
