const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { limiterEcriture } = require('../middlewares/rateLimit');

router.get('/user/:userId', verifierToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT a.*, p.nom AS produit_nom FROM alertes a JOIN produits p ON p.id=a.produit_id WHERE a.utilisateur_id=$1 ORDER BY a.created_at DESC',
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/',
  verifierToken,
  limiterEcriture,
  body('produit_id').notEmpty(),
  body('prix_cible').isFloat({ gt: 0 }),
  body('email').isEmail().normalizeEmail(),
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { produit_id, prix_cible, email } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO alertes (utilisateur_id,produit_id,prix_cible,email) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user.userId, produit_id, prix_cible, email]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', verifierToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM alertes WHERE id=$1 AND utilisateur_id=$2',
      [req.params.id, req.user.userId]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;