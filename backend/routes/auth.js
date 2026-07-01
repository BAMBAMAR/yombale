const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { envoyerEmail } = require('../services/email');
const { limiterAuth } = require('../middlewares/rateLimit');
const { verifierToken } = require('../middlewares/auth');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

router.post('/inscription',
  limiterAuth,
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

      // Enregistrer le parrainage si un code ref est présent
      const refCode = req.body.ref_code;
      if (refCode) {
        pool.query(
          `INSERT INTO parrainages (referrer_id, referred_id)
           SELECT id, $2 FROM utilisateurs WHERE id=$1 ON CONFLICT (referred_id) DO NOTHING`,
          [refCode, rows[0].id]
        ).catch(() => {});
      }

      // Email de bienvenue + vérification (envoyé en arrière-plan, n'empêche pas l'inscription)
      const verifToken = jwt.sign({ userId: rows[0].id, type: 'verify' }, process.env.JWT_SECRET, { expiresIn: '24h' });
      const lien = `${FRONTEND_URL}/api/auth/verifier-email?token=${verifToken}`;
      envoyerEmail({
        to: email,
        subject: 'Bienvenue sur Nopalou 🇸🇳 — vérifiez votre email',
        html: `<p>Bonjour ${nom},</p>
               <p>Bienvenue sur Nopalou, le comparateur de prix du Sénégal !</p>
               <p><a href="${lien}">Cliquez ici pour vérifier votre adresse email</a> (lien valide 24h).</p>
               <p>À bientôt sur Nopalou 👋</p>`,
      }).catch(() => {});
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

// GET /api/auth/verifier-email?token=...
router.get('/verifier-email', async (req, res) => {
  try {
    const { token } = req.query;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'verify') throw new Error('Token invalide');
    await pool.query('UPDATE utilisateurs SET email_verifie = true WHERE id = $1', [payload.userId]);
    res.redirect(`${FRONTEND_URL}/?email_verifie=1`);
  } catch (err) {
    res.status(400).send('Lien de vérification invalide ou expiré.');
  }
});

router.post('/connexion',
  limiterAuth,
  body('email').isEmail(),
  body('mot_de_passe').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { email, mot_de_passe } = req.body;
      const { rows } = await pool.query(
        'SELECT id,nom,email,mot_de_passe_hash,email_verifie FROM utilisateurs WHERE email=$1', [email]
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

// POST /api/auth/renvoyer-verification — renvoyer l'email de vérification
router.post('/renvoyer-verification', limiterAuth, verifierToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT nom, email, email_verifie FROM utilisateurs WHERE id=$1', [req.user.userId]);
    if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    if (rows[0].email_verifie) return res.status(400).json({ error: 'Email déjà vérifié' });

    const verifToken = jwt.sign({ userId: req.user.userId, type: 'verify' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const lien = `${FRONTEND_URL}/api/auth/verifier-email?token=${verifToken}`;
    await envoyerEmail({
      to: rows[0].email,
      subject: 'Nopalou — vérifiez votre email',
      html: `<p>Bonjour ${rows[0].nom},</p>
             <p><a href="${lien}">Cliquez ici pour vérifier votre adresse email</a> (lien valide 24h).</p>`,
    });
    res.json({ success: true, message: 'Email de vérification renvoyé.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/mot-de-passe-oublie — demander un lien de réinitialisation
router.post('/mot-de-passe-oublie', limiterAuth, body('email').isEmail(), async (req, res) => {
  try {
    const { email } = req.body;
    const { rows } = await pool.query('SELECT id, nom FROM utilisateurs WHERE email=$1', [email]);

    // Toujours répondre OK pour ne pas révéler si l'email existe
    res.json({ success: true, message: 'Si ce compte existe, un email de réinitialisation a été envoyé.' });

    if (rows.length) {
      const resetToken = jwt.sign({ userId: rows[0].id, type: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const lien = `${FRONTEND_URL}/mot-de-passe-oublie?token=${resetToken}`;
      envoyerEmail({
        to: email,
        subject: 'Nopalou — réinitialisation de votre mot de passe',
        html: `<p>Bonjour ${rows[0].nom},</p>
               <p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe (valide 1h) :</p>
               <p><a href="${lien}">Réinitialiser mon mot de passe</a></p>
               <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
      }).catch(() => {});
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/reinitialiser-mot-de-passe — appliquer le nouveau mot de passe
router.post('/reinitialiser-mot-de-passe', limiterAuth, body('mot_de_passe').isLength({ min: 6 }), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { token, mot_de_passe } = req.body;
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: 'Lien de réinitialisation invalide ou expiré' });
    }
    if (payload.type !== 'reset') return res.status(400).json({ error: 'Lien de réinitialisation invalide' });

    const hash = await bcrypt.hash(mot_de_passe, 12);
    await pool.query('UPDATE utilisateurs SET mot_de_passe_hash=$1 WHERE id=$2', [hash, payload.userId]);
    res.json({ success: true, message: 'Mot de passe mis à jour.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/auth/parrainage — code de parrainage + compteur de filleuls
router.get('/parrainage', verifierToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { rows } = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE statut='actif') AS filleuls_actifs,
              COUNT(*) AS filleuls_total
       FROM parrainages WHERE referrer_id=$1`,
      [userId]
    );
    res.json({
      code_parrainage: userId, // l'UUID est le code de parrainage
      filleuls_actifs: parseInt(rows[0].filleuls_actifs),
      filleuls_total:  parseInt(rows[0].filleuls_total),
      recompense_seuil: 3,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/auth/profil — modifier nom et/ou email
router.put('/profil',
  verifierToken,
  body('nom').optional().trim().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Email invalide'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { nom, email } = req.body;
      if (!nom && !email) return res.status(400).json({ error: 'Au moins un champ à modifier' });

      if (email) {
        const exist = await pool.query(
          'SELECT id FROM utilisateurs WHERE email=$1 AND id!=$2',
          [email, req.user.userId]
        );
        if (exist.rows.length) return res.status(409).json({ error: 'Cet email est déjà utilisé' });
      }

      const sets = [];
      const vals = [];
      let i = 1;
      if (nom)   { sets.push(`nom=$${i++}`);   vals.push(nom); }
      if (email) { sets.push(`email=$${i++}`); vals.push(email); }
      vals.push(req.user.userId);

      const { rows } = await pool.query(
        `UPDATE utilisateurs SET ${sets.join(', ')} WHERE id=$${i} RETURNING id, nom, email`,
        vals
      );
      res.json({ user: rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

module.exports = router;