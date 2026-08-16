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
  async (req, res) => {
  try {
    const { produit_id, prix_cible, email, telephone } = req.body;
    const numPrix = Number(prix_cible);
    if (!produit_id || !numPrix || numPrix <= 0) {
      return res.status(400).json({ error: 'ID produit et prix cible valide requis.' });
    }
    if (!email?.trim() && !telephone?.trim()) {
      return res.status(400).json({ error: 'Veuillez saisir un numéro WhatsApp ou un email.' });
    }

    const emailClean = email?.trim() || null;
    const telClean = telephone?.trim() || null;

    const { rows } = await pool.query(
      'INSERT INTO alertes (utilisateur_id, produit_id, prix_cible, email, telephone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.userId, produit_id, numPrix, emailClean, telClean]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[ALERTES POST]', err);
    res.status(500).json({ error: err.message });
  }
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