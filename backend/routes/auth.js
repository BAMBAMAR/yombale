const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/db');

router.post('/inscription',
  body('email').isEmail().normalizeEmail(),
  body('mot_de_passe').isLength({ min: 6 }),
  body('nom').trim().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { nom, email, mot_de_passe } = req.body;
      const exist = await pool.query('SELECT id FROM utilisateurs WHERE email=$1', [email]);
      if (exist.rows.length) return res.status(409).json({ error: 'Email déjà utilisé' });
      const hash = await bcrypt.hash(mot_de_passe, 12);
      const { rows } = await pool.query(
        'INSERT INTO utilisateurs (nom,email,mot_de_passe_hash) VALUES ($1,$2,$3) RETURNING id,nom,email',
        [nom, email, hash]
      );
      const token = jwt.sign({ userId: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ user: rows[0], token });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

router.post('/connexion',
  body('email').isEmail(),
  body('mot_de_passe').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { email, mot_de_passe } = req.body;
      const { rows } = await pool.query(
        'SELECT id,nom,email,mot_de_passe_hash FROM utilisateurs WHERE email=$1', [email]
      );
      if (!rows.length) return res.status(401).json({ error: 'Identifiants incorrects' });
      const ok = await bcrypt.compare(mot_de_passe, rows[0].mot_de_passe_hash);
      if (!ok) return res.status(401).json({ error: 'Identifiants incorrects' });
      const token = jwt.sign({ userId: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const { mot_de_passe_hash, ...user } = rows[0];
      res.json({ user, token });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

module.exports = router;