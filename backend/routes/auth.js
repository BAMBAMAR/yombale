const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { envoyerEmail } = require('../services/email');
const { sendWhatsAppText, sendWhatsAppTemplate, normalisePhone } = require('../services/whatsapp');
const crypto = require('crypto');
const { limiterAuth } = require('../middlewares/rateLimit');
const { verifierToken } = require('../middlewares/auth');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

const { genererCodeUnique } = require('../lib/codeApporteur');

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
      const codeApporteur = await genererCodeUnique();
      const { rows } = await pool.query(
        'INSERT INTO utilisateurs (nom,email,mot_de_passe_hash,est_apporteur,code_apporteur) VALUES ($1,$2,$3,true,$4) RETURNING id,nom,email,code_apporteur',
        [nom, email, hash, codeApporteur]
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
    } catch (err) {
      console.error('[AUTH INSCRIPTION]', err.message);
      res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
    }
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
        'SELECT id,nom,email,mot_de_passe_hash,email_verifie,suspendu,supprime_le FROM utilisateurs WHERE email=$1', [email]
      );
      if (!rows.length) return res.status(401).json({ error: 'Identifiants incorrects' });
      const ok = await bcrypt.compare(mot_de_passe, rows[0].mot_de_passe_hash);
      if (!ok) return res.status(401).json({ error: 'Identifiants incorrects' });
      if (rows[0].suspendu) return res.status(403).json({ error: 'Compte suspendu. Contactez le support.' });
      if (rows[0].supprime_le) return res.status(403).json({ error: 'Ce compte est en cours de suppression.' });
      const token = jwt.sign({ userId: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const { mot_de_passe_hash, suspendu, supprime_le, ...user } = rows[0];
      res.json({ user, token });
    } catch (err) {
      console.error('[AUTH CONNEXION]', err.message);
      res.status(500).json({ error: 'Erreur serveur, veuillez réessayer plus tard' });
    }
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

// GET /api/auth/statut — renvoie le statut de vérification de l'email de l'utilisateur connecté
router.get('/statut', verifierToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT email_verifie FROM utilisateurs WHERE id=$1',
      [req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ email_verifie: rows[0].email_verifie === true });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

const otps = new Map();

// POST /api/auth/whatsapp-otp-send - Envoyer un code OTP via WhatsApp
// Utilise un Template Meta certifié (catégorie "Authentification") pour pouvoir
// envoyer le code même à un utilisateur qui n'a jamais écrit au bot Nopalou.
// Si le template n'existe pas encore côté Meta, fallback sur texte libre.
router.post('/whatsapp-otp-send', limiterAuth, async (req, res) => {
  try {
    let { telephone, type } = req.body;
    telephone = normalisePhone(telephone);
    if (!telephone) return res.status(400).json({ error: 'Numéro invalide' });

    // ── Vérification préalable selon le flux (login vs inscription) ──
    const cleanPhone = telephone;
    const withPlus = '+' + cleanPhone;
    const raw9Digits = cleanPhone.startsWith('221') ? cleanPhone.slice(3) : cleanPhone;

    if (type === 'login') {
      const { rows } = await pool.query(
        `SELECT id, suspendu, supprime_le FROM utilisateurs 
         WHERE telephone=$1 OR telephone=$2 OR telephone=$3 OR REPLACE(telephone, '+', '')=$1`,
        [cleanPhone, withPlus, raw9Digits]
      );
      if (!rows.length) {
        return res.status(404).json({ error: 'Aucun compte associé à ce numéro WhatsApp. Veuillez d\'abord vous inscrire.' });
      }
      if (rows[0].suspendu) {
        return res.status(403).json({ error: 'Ce compte est suspendu.' });
      }
      if (rows[0].supprime_le) {
        return res.status(403).json({ error: 'Ce compte est en cours de suppression.' });
      }
    } else if (type === 'register') {
      const { rows } = await pool.query(
        `SELECT id FROM utilisateurs 
         WHERE telephone=$1 OR telephone=$2 OR telephone=$3 OR REPLACE(telephone, '+', '')=$1`,
        [cleanPhone, withPlus, raw9Digits]
      );
      if (rows.length) {
        return res.status(409).json({ error: 'Un compte existe déjà avec ce numéro WhatsApp. Veuillez vous connecter.' });
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    otps.set(telephone, { code, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min
    console.log(`[OTP] Code généré pour ${telephone} (${type || 'standard'}) : ${code}`);

    // ── Tentative 1 : Template Meta certifié (fonctionne même à froid) ──
    try {
      await sendWhatsAppTemplate(telephone, 'nopalou_auth_otp', [
        {
          type: 'body',
          parameters: [{ type: 'text', text: code }],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: code }],
        },
      ]);
      console.log(`[OTP] Envoyé via template nopalou_auth_otp à ${telephone}`);
    } catch (templateErr) {
      // ── Tentative 2 : Texte libre (fallback) ──
      console.warn(`[OTP] Template nopalou_auth_otp échoué (${templateErr.message}), fallback texte libre`);
      await sendWhatsAppText(telephone, `Nopalou - Votre code de vérification est : *${code}*.\nCe code expire dans 10 minutes.`);
      console.log(`[OTP] Envoyé via texte libre à ${telephone}`);
    }

    res.json({ success: true, message: 'Code envoyé' });
  } catch (err) {
    console.error('[OTP SEND]', err);
    res.status(500).json({ error: 'Impossible d\'envoyer le code. Vérifiez votre numéro ou réessayez.' });
  }
});

// POST /api/auth/whatsapp-otp-verify - Vérifier le code OTP
router.post('/whatsapp-otp-verify', limiterAuth, async (req, res) => {
  try {
    let { telephone, code } = req.body;
    telephone = normalisePhone(telephone);
    
    const data = otps.get(telephone);
    if (!data) return res.status(400).json({ error: 'Aucun code trouvé ou expiré' });
    if (Date.now() > data.expiresAt) {
      otps.delete(telephone);
      return res.status(400).json({ error: 'Code expiré' });
    }
    if (data.code !== code) return res.status(400).json({ error: 'Code incorrect' });

    otps.delete(telephone);
    res.json({ success: true });
  } catch (err) {
    console.error('[OTP VERIFY]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/whatsapp-otp-login - Vérifier l'OTP et se connecter
router.post('/whatsapp-otp-login', limiterAuth, async (req, res) => {
  try {
    let { telephone, code } = req.body;
    telephone = normalisePhone(telephone);
    
    const data = otps.get(telephone);
    if (!data) return res.status(400).json({ error: 'Aucun code trouvé ou expiré' });
    if (Date.now() > data.expiresAt) {
      otps.delete(telephone);
      return res.status(400).json({ error: 'Code expiré' });
    }
    if (data.code !== code) return res.status(400).json({ error: 'Code incorrect' });

    otps.delete(telephone);
    
    // Trouver l'utilisateur (compatible avec formats +221, 221 et 9 chiffres)
    const cleanPhone = normalisePhone(telephone);
    const withPlus = '+' + cleanPhone;
    const raw9Digits = cleanPhone.startsWith('221') ? cleanPhone.slice(3) : cleanPhone;

    const { rows } = await pool.query(
      `SELECT id, nom, email, email_verifie, suspendu, supprime_le, telephone 
       FROM utilisateurs 
       WHERE telephone=$1 OR telephone=$2 OR telephone=$3 OR REPLACE(telephone, '+', '')=$1`,
      [cleanPhone, withPlus, raw9Digits]
    );
    
    if (!rows.length) return res.status(404).json({ error: 'Aucun compte associé à ce numéro' });
    
    const user = rows[0];
    if (user.suspendu) return res.status(403).json({ error: 'Compte suspendu' });
    if (user.supprime_le) return res.status(403).json({ error: 'Compte en cours de suppression' });
    
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ success: true, user, token });
  } catch (err) {
    console.error('[OTP LOGIN]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/whatsapp-otp-register - Vérifier l'OTP et s'inscrire
router.post('/whatsapp-otp-register', limiterAuth, async (req, res) => {
  try {
    let { telephone, code, nom } = req.body;
    telephone = normalisePhone(telephone);
    
    const data = otps.get(telephone);
    if (!data) return res.status(400).json({ error: 'Aucun code trouvé ou expiré' });
    if (Date.now() > data.expiresAt) {
      otps.delete(telephone);
      return res.status(400).json({ error: 'Code expiré' });
    }
    if (data.code !== code) return res.status(400).json({ error: 'Code incorrect' });

    otps.delete(telephone);
    
    // Vérifier si l'utilisateur existe déjà (compatible formats +221, 221 et 9 chiffres)
    const cleanPhone = normalisePhone(telephone);
    const withPlus = '+' + cleanPhone;
    const raw9Digits = cleanPhone.startsWith('221') ? cleanPhone.slice(3) : cleanPhone;

    const exist = await pool.query(
      `SELECT id FROM utilisateurs WHERE telephone=$1 OR telephone=$2 OR telephone=$3 OR REPLACE(telephone, '+', '')=$1`,
      [cleanPhone, withPlus, raw9Digits]
    );
    if (exist.rows.length) return res.status(409).json({ error: 'Un compte existe déjà avec ce numéro WhatsApp. Veuillez vous connecter.' });
    
    const email = `${telephone}@whatsapp.nopalou.com`;
    const plainPassword = require('crypto').randomBytes(16).toString('hex');
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(plainPassword, 12);
    
    const codeApporteur = await genererCodeUnique();
    const insertRes = await pool.query(
      'INSERT INTO utilisateurs (nom, email, mot_de_passe_hash, telephone, email_verifie, est_apporteur, code_apporteur) VALUES ($1, $2, $3, $4, true, true, $5) RETURNING id, nom, email, telephone, code_apporteur',
      [nom, email, hash, telephone, codeApporteur]
    );
    const user = insertRes.rows[0];
    
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ success: true, user, token });
  } catch (err) {
    console.error('[OTP REGISTER]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/whatsapp-login - Demander un lien magique via WhatsApp
router.post('/whatsapp-login', limiterAuth, async (req, res) => {
  try {
    let { telephone, nom } = req.body;
    if (!telephone) return res.status(400).json({ error: 'Numéro de téléphone requis' });
    
    telephone = normalisePhone(telephone);
    if (telephone.length < 9) return res.status(400).json({ error: 'Numéro invalide' });

    const { rows } = await pool.query('SELECT id, nom, email, code_apporteur FROM utilisateurs WHERE telephone=$1', [telephone]);
    let user;
    
    if (rows.length) {
      user = rows[0];
    } else {
      const dummyEmail = `${telephone}@whatsapp.nopalou.com`;
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hash = await bcrypt.hash(randomPassword, 12);
      const codeApporteur = await genererCodeUnique();
      
      const insertRes = await pool.query(
        'INSERT INTO utilisateurs (nom, email, mot_de_passe_hash, telephone, email_verifie, est_apporteur, code_apporteur) VALUES ($1, $2, $3, $4, true, true, $5) RETURNING id, nom, email, code_apporteur',
        [nom || 'Utilisateur WhatsApp', dummyEmail, hash, telephone, codeApporteur]
      );
      user = insertRes.rows[0];
    }

    const magicToken = jwt.sign({ userId: user.id, type: 'magic' }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const magicLink = `${FRONTEND_URL}/connexion/magique?token=${magicToken}`;
    
    await sendWhatsAppText(telephone, `👋 Bonjour !\\n\\nVoici votre lien de connexion magique à Nopalou.\\nCliquez ici pour accéder à votre compte sans mot de passe :\\n\\n👉 ${magicLink}\\n\\nCe lien est valide 15 minutes.`);
    
    res.json({ success: true, message: 'Lien magique envoyé sur WhatsApp' });
  } catch (err) {
    console.error('[AUTH WHATSAPP]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/magic-login - Échanger le token magique contre un token de session
router.post('/magic-login', limiterAuth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token manquant' });
    
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: 'Lien magique invalide ou expiré' });
    }
    
    if (payload.type !== 'magic') return res.status(400).json({ error: 'Type de token invalide' });

    const { rows } = await pool.query(
      'SELECT id, nom, email, email_verifie, suspendu, supprime_le, telephone FROM utilisateurs WHERE id=$1',
      [payload.userId]
    );
    
    if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const user = rows[0];
    if (user.suspendu) return res.status(403).json({ error: 'Compte suspendu.' });
    if (user.supprime_le) return res.status(403).json({ error: 'Compte en cours de suppression.' });

    const sessionToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token: sessionToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;