const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { envoyerEmail, templateEmail } = require('../services/email');
const { sendWhatsAppText, sendWhatsAppTemplate, sendWhatsAppNotification, normalisePhone } = require('../services/whatsapp');
const whatsappHealth = require('../services/whatsapp-health');
const crypto = require('crypto');
const { limiterAuth } = require('../middlewares/rateLimit');
const { verifierToken, tokenOptional } = require('../middlewares/auth');
const { genererOtp, verifierOtp, genererOtpPhone, verifierOtpPhone } = require('../services/otp');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const RESET_SECRET = process.env.RESET_SECRET || (process.env.JWT_SECRET + '_reset_nopalou_2024');
const VERIFY_SECRET = process.env.VERIFY_SECRET || (process.env.JWT_SECRET + '_verify_nopalou_2024');

const { genererCodeUnique } = require('../lib/codeApporteur');
const { validerForceMotDePasse } = require('../lib/passwordValidator');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

router.post('/inscription',
  limiterAuth,
  body('email').isEmail().normalizeEmail().withMessage('Adresse email invalide'),
  body('mot_de_passe').custom(val => {
    const check = validerForceMotDePasse(val);
    if (!check.valide) throw new Error(check.message);
    return true;
  }),
  body('nom').trim().notEmpty().withMessage('Le nom complet est obligatoire'),
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
        'INSERT INTO utilisateurs (nom,email,mot_de_passe_hash,est_apporteur,code_apporteur,jwt_version) VALUES ($1,$2,$3,true,$4,1) RETURNING id,nom,email,code_apporteur,jwt_version',
        [nom, email, hash, codeApporteur]
      );
      const token = jwt.sign({ userId: rows[0].id, jwtVersion: rows[0].jwt_version || 1 }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.cookie('nopalou_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
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
      const verifToken = jwt.sign({ userId: rows[0].id, type: 'verify' }, VERIFY_SECRET, { expiresIn: '24h' });
      const lien = `${FRONTEND_URL}/api/auth/verifier-email?token=${verifToken}`;
      envoyerEmail({
        to: email,
        subject: 'Bienvenue sur Nopalou — Vérifiez votre adresse email',
        html: templateEmail({
          preheader: 'Activez votre compte Nopalou en un clic',
          titre: `Bienvenue sur Nopalou, ${nom} !`,
          contenuHtml: `
            <p>Votre compte a été créé avec succès.</p>
            <p>Pour sécuriser vos accès et profiter pleinement de tous les services (boutique, annonces, alertes), veuillez confirmer votre adresse email.</p>
          `,
          boutonTexte: 'Vérifier mon adresse email',
          boutonUrl: lien,
          noteBas: 'Ce lien est sécurisé et expire dans 24 heures. Si vous n\'êtes pas à l\'origine de cette inscription, vous pouvez ignorer cet email.',
        }),
      }).catch(e => console.warn('[EMAIL BIENVENUE]', e.message));
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
    const payload = jwt.verify(token, VERIFY_SECRET);
    if (payload.type !== 'verify') throw new Error('Token invalide');
    await pool.query('UPDATE utilisateurs SET email_verifie = true WHERE id = $1', [payload.userId]);
    res.redirect(`${FRONTEND_URL}/?email_verifie=1`);
  } catch (err) {
    res.status(400).send('Lien de vérification invalide ou expiré.');
  }
});

router.post(['/connexion', '/login'],
  limiterAuth,
  body('email').isEmail().normalizeEmail().withMessage('Adresse email invalide'),
  (req, res, next) => {
    if (!req.body.mot_de_passe && req.body.password) {
      req.body.mot_de_passe = req.body.password;
    }
    next();
  },
  body('mot_de_passe').notEmpty().withMessage('Le mot de passe est obligatoire'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const email = req.body.email;
      const mot_de_passe = req.body.mot_de_passe || req.body.password;
      const { rows } = await pool.query(
        'SELECT id,nom,email,telephone,mot_de_passe_hash,email_verifie,suspendu,supprime_le,anonymise_le,COALESCE(jwt_version, 1) AS jwt_version,a2f_actif,a2f_telephone FROM utilisateurs WHERE email=$1', [email]
      );
      if (!rows.length) return res.status(401).json({ error: 'Identifiants incorrects' });
      const ok = await bcrypt.compare(mot_de_passe, rows[0].mot_de_passe_hash);
      if (!ok) return res.status(401).json({ error: 'Identifiants incorrects' });
      if (rows[0].suspendu) return res.status(403).json({ error: 'Compte suspendu. Contactez le support.' });
      if (rows[0].anonymise_le) return res.status(403).json({ error: 'Ce compte a été définitivement supprimé.' });

      // Détection A2F (2FA WhatsApp optionnel pour marchands & admins)
      if (rows[0].a2f_actif) {
        const destPhone = normalisePhone(rows[0].a2f_telephone || rows[0].telephone);
        if (destPhone) {
          const code2FA = await genererOtp(rows[0].id, '2fa_login', destPhone);
          const tempToken = jwt.sign({ userId: rows[0].id, type: '2fa_pending' }, process.env.JWT_SECRET, { expiresIn: '10m' });

          sendWhatsAppText(destPhone, `Nopalou - Votre code d'authentification à double facteur (2FA) est : *${code2FA}*.\nValide pendant 10 minutes.`)
            .catch(err => console.warn('[2FA SEND WARN]', err.message));

          return res.json({
            require2FA: true,
            tempToken,
            telephoneMasque: destPhone.slice(0, 4) + '****' + destPhone.slice(-2),
            message: 'Un code de sécurité à 6 chiffres vous a été envoyé sur WhatsApp.'
          });
        }
      }

      const enCoursDeSuppression = !!rows[0].supprime_le;
      const token = jwt.sign({ userId: rows[0].id, jwtVersion: rows[0].jwt_version || 1 }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.cookie('nopalou_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      const { mot_de_passe_hash, suspendu, ...user } = rows[0];
      user.en_cours_de_suppression = enCoursDeSuppression;
      res.json({ user, token });
    } catch (err) {
      console.error('[AUTH CONNEXION]', err.message);
      res.status(500).json({ error: 'Erreur serveur, veuillez réessayer plus tard' });
    }
  }
);

// Alias d'internationalisation / compatibilité API
router.post('/login', (req, res) => res.redirect(307, '/api/auth/connexion'));
router.post('/register', (req, res) => res.redirect(307, '/api/auth/inscription'));

// POST /api/auth/connexion-2fa — valider le code 2FA WhatsApp
router.post('/connexion-2fa',
  limiterAuth,
  body('tempToken').notEmpty(),
  body('code').trim().isLength({ min: 6, max: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { tempToken, code } = req.body;
      let payload;
      try {
        payload = jwt.verify(tempToken, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Session 2FA expirée ou invalide. Veuillez vous reconnecter.' });
      }

      if (payload.type !== '2fa_pending') {
        return res.status(401).json({ error: 'Token 2FA invalide' });
      }

      const verifResult = await verifierOtp(payload.userId, '2fa_login', code);
      if (!verifResult.valide) {
        return res.status(400).json({ error: verifResult.error });
      }

      const { rows } = await pool.query(
        'SELECT id,nom,email,telephone,email_verifie,suspendu,supprime_le,anonymise_le,COALESCE(jwt_version, 1) AS jwt_version,a2f_actif FROM utilisateurs WHERE id=$1',
        [payload.userId]
      );
      if (!rows.length || rows[0].suspendu || rows[0].anonymise_le) {
        return res.status(403).json({ error: 'Compte inaccessible' });
      }

      const enCoursDeSuppression = !!rows[0].supprime_le;
      const token = jwt.sign({ userId: rows[0].id, jwtVersion: rows[0].jwt_version || 1 }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.cookie('nopalou_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const { suspendu, ...user } = rows[0];
      user.en_cours_de_suppression = enCoursDeSuppression;
      res.json({ user, token });
    } catch (err) {
      console.error('[AUTH 2FA VERIFY]', err.message);
      res.status(500).json({ error: 'Erreur serveur lors de la validation 2FA' });
    }
  }
);

// GET /api/auth/2fa/statut — état de l'A2F
router.get('/2fa/statut', verifierToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT a2f_actif, a2f_telephone, telephone FROM utilisateurs WHERE id=$1',
      [req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({
      a2f_actif: !!rows[0].a2f_actif,
      telephone: rows[0].a2f_telephone || rows[0].telephone || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/2fa/activer — activer le 2FA WhatsApp
router.post('/2fa/activer',
  verifierToken,
  body('telephone').trim().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const normTel = normalisePhone(req.body.telephone);
      if (!normTel) return res.status(400).json({ error: 'Numéro de téléphone invalide pour le Sénégal' });

      await pool.query(
        'UPDATE utilisateurs SET a2f_actif=true, a2f_telephone=$1 WHERE id=$2',
        [normTel, req.user.userId]
      );

      enregistrerAdminLog({
        adminNom: req.user.nom || 'Utilisateur',
        adminRole: 'marchand',
        action: '2fa_active',
        cibleType: 'utilisateur',
        cibleId: req.user.userId,
        description: `Activation de la double authentification WhatsApp (+${normTel})`,
        req,
      }).catch(() => {});

      res.json({ success: true, message: 'Authentification à double facteur (2FA) WhatsApp activée avec succès.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/auth/2fa/desactiver — désactiver le 2FA WhatsApp
router.post('/2fa/desactiver', verifierToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE utilisateurs SET a2f_actif=false WHERE id=$1',
      [req.user.userId]
    );

    enregistrerAdminLog({
      adminNom: req.user.nom || 'Utilisateur',
      adminRole: 'marchand',
      action: '2fa_desactive',
      cibleType: 'utilisateur',
      cibleId: req.user.userId,
      description: 'Désactivation de la double authentification WhatsApp',
      req,
    }).catch(() => {});

    res.json({ success: true, message: 'Authentification à double facteur désactivée.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/deconnexion — purge du cookie HttpOnly et invalidation session
router.post('/deconnexion', tokenOptional, async (req, res) => {
  if (req.user?.userId) {
    try {
      await pool.query('UPDATE utilisateurs SET jwt_version = COALESCE(jwt_version, 1) + 1 WHERE id=$1', [req.user.userId]);
    } catch (e) {
      console.warn('[AUTH DECONNEXION DB]', e.message);
    }
  }
  res.clearCookie('nopalou_session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ message: 'Déconnexion réussie' });
});

// POST /api/auth/renvoyer-verification — renvoyer l'email de vérification
router.post('/renvoyer-verification', limiterAuth, verifierToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT nom, email, email_verifie FROM utilisateurs WHERE id=$1', [req.user.userId]);
    if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    if (rows[0].email_verifie) return res.status(400).json({ error: 'Email déjà vérifié' });

    const verifToken = jwt.sign({ userId: req.user.userId, type: 'verify' }, VERIFY_SECRET, { expiresIn: '24h' });
    const lien = `${FRONTEND_URL}/api/auth/verifier-email?token=${verifToken}`;
    await envoyerEmail({
      to: rows[0].email,
      subject: 'Nopalou — Vérifiez votre adresse email',
      html: templateEmail({
        preheader: 'Vérification de votre compte Nopalou',
        titre: 'Confirmation de votre adresse email',
        contenuHtml: `
          <p>Bonjour ${rows[0].nom},</p>
          <p>Vous avez demandé un nouveau lien de confirmation pour votre compte Nopalou.</p>
        `,
        boutonTexte: 'Confirmer mon adresse email',
        boutonUrl: lien,
        noteBas: 'Ce lien expire dans 24 heures. Si vous n\'avez pas fait cette demande, vous pouvez ignorer cet email en toute sécurité.',
      }),
    });
    res.json({ success: true, message: 'Email de vérification renvoyé.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/mot-de-passe-oublie — demander un lien de réinitialisation
router.post('/mot-de-passe-oublie', limiterAuth, body('email').isEmail().normalizeEmail().withMessage('Adresse email invalide'), async (req, res) => {
  try {
    const { email } = req.body;
    const { rows } = await pool.query('SELECT id, nom FROM utilisateurs WHERE email=$1', [email]);

    // Toujours répondre OK pour ne pas révéler si l'email existe
    res.json({ success: true, message: 'Si ce compte existe, un email de réinitialisation a été envoyé.' });

    if (rows.length) {
      const resetToken = jwt.sign({ userId: rows[0].id, type: 'reset' }, RESET_SECRET, { expiresIn: '1h' });
      const lien = `${FRONTEND_URL}/mot-de-passe-oublie?token=${resetToken}`;
      envoyerEmail({
        to: email,
        subject: 'Nopalou — Réinitialisation de votre mot de passe',
        html: templateEmail({
          preheader: 'Lien de réinitialisation sécurisé pour votre mot de passe',
          titre: 'Réinitialisation de votre mot de passe',
          contenuHtml: `
            <p>Bonjour ${rows[0].nom},</p>
            <p>Nous avons reçu une demande de réinitialisation du mot de passe associé à votre compte Nopalou.</p>
            <p>Cliquez sur le bouton ci-dessous pour choisir votre nouveau mot de passe :</p>
          `,
          boutonTexte: 'Réinitialiser mon mot de passe',
          boutonUrl: lien,
          noteBas: 'Ce lien est strictement personnel et expire dans 1 heure. Si vous n\'êtes pas à l\'origine de cette demande, votre mot de passe actuel reste inchangé.',
        }),
      }).catch(e => console.warn('[EMAIL RESET]', e.message));
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/reinitialiser-mot-de-passe — appliquer le nouveau mot de passe
router.post('/reinitialiser-mot-de-passe',
  limiterAuth,
  body('mot_de_passe').custom(val => {
    const check = validerForceMotDePasse(val);
    if (!check.valide) throw new Error(check.message);
    return true;
  }),
  async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { token, mot_de_passe } = req.body;
    let payload;
    try {
      payload = jwt.verify(token, RESET_SECRET);
    } catch {
      return res.status(400).json({ error: 'Lien de réinitialisation invalide ou expiré' });
    }
    if (payload.type !== 'reset') return res.status(400).json({ error: 'Lien de réinitialisation invalide' });

    const hash = await bcrypt.hash(mot_de_passe, 12);
    // Incrémente jwt_version pour déconnecter tous les appareils existants
    await pool.query('UPDATE utilisateurs SET mot_de_passe_hash=$1, jwt_version=COALESCE(jwt_version, 1) + 1 WHERE id=$2', [hash, payload.userId]);
    res.json({ success: true, message: 'Mot de passe mis à jour avec succès.' });
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

// GET /api/auth/profil — obtenir les informations du profil utilisateur
router.get('/profil', verifierToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nom, email, telephone, email_verifie, created_at FROM utilisateurs WHERE id=$1',
      [req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ user: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/auth/profil — modifier nom, email et/ou telephone
router.put('/profil',
  verifierToken,
  body('nom').optional().trim().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Email invalide'),
  body('telephone').optional().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { nom, email, telephone } = req.body;
      if (!nom && !email && telephone === undefined) return res.status(400).json({ error: 'Au moins un champ à modifier' });

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
      if (nom)                  { sets.push(`nom=$${i++}`);       vals.push(nom); }
      if (email)                { sets.push(`email=$${i++}`);     vals.push(email); }
      if (telephone !== undefined) {
        const cleanTel = telephone ? String(telephone).replace(/[^\d+]/g, '').trim() : null;
        sets.push(`telephone=$${i++}`);
        vals.push(cleanTel);
      }
      vals.push(req.user.userId);

      const { rows } = await pool.query(
        `UPDATE utilisateurs SET ${sets.join(', ')} WHERE id=$${i} RETURNING id, nom, email, telephone`,
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

// POST /api/auth/whatsapp-otp-send - Envoyer un code OTP via WhatsApp
// Utilise un Template Meta certifié (catégorie "Authentification") pour pouvoir
// envoyer le code même à un utilisateur qui n'a jamais écrit au bot Nopalou.
// Si le template n'existe pas encore côté Meta, fallback sur texte libre.
router.post('/whatsapp-otp-send', limiterAuth, async (req, res) => {
  try {
    let { telephone, type } = req.body;
    telephone = normalisePhone(telephone);
    if (!telephone) return res.status(400).json({ error: 'Numéro invalide' });

    // ── Circuit Breaker : Si le service WhatsApp est en panne critique ──
    // Évite de laisser l'utilisateur attendre un code qui ne sera pas délivré
    if (whatsappHealth.isDegraded()) {
      return res.status(503).json({
        error: 'Le service de vérification WhatsApp est momentanément indisponible. Veuillez utiliser la connexion par Email.',
        degraded: true,
        fallback: 'email',
      });
    }

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
        // Vérification si ce numéro correspond à un contact locataire/propriétaire enregistré par une agence
        const short9 = raw9Digits.length >= 9 ? raw9Digits.slice(-9) : raw9Digits;
        const { rows: contactRows } = await pool.query(
          `SELECT id FROM contacts_immo 
           WHERE RIGHT(REGEXP_REPLACE(COALESCE(telephone, ''), '[^0-9]', '', 'g'), 9) = $1
              OR RIGHT(REGEXP_REPLACE(COALESCE(whatsapp, ''), '[^0-9]', '', 'g'), 9) = $1 LIMIT 1`,
          [short9]
        );
        if (!contactRows.length) {
          return res.status(404).json({
            error: 'Aucun compte associé à ce numéro WhatsApp. Veuillez d\'abord vous inscrire.',
            code: 'ACCOUNT_NOT_FOUND',
            telephone: cleanPhone,
          });
        }
      } else if (rows[0].suspendu) {
        return res.status(403).json({ error: 'Ce compte est suspendu.' });
      } else if (rows[0].supprime_le) {
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

    const code = await genererOtpPhone(telephone, type || 'auth');
    // SÉCURITÉ P0 : Masquage strict du numéro et JAMAIS de code en clair dans les logs
    console.log(`[OTP] Code généré pour ${telephone.slice(0, 4)}**** (${type || 'standard'})`);

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
      console.log(`[OTP] Envoyé via template nopalou_auth_otp à ${telephone.slice(0, 4)}****`);
    } catch (templateErr) {
      // ── Tentative 2 : Texte libre (fallback) ──
      console.warn(`[OTP] Template nopalou_auth_otp échoué, fallback texte libre`);
      await sendWhatsAppText(telephone, `Nopalou - Votre code de vérification est : *${code}*.\nCe code expire dans 10 minutes.`);
      console.log(`[OTP] Envoyé via texte libre à ${telephone.slice(0, 4)}****`);
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
    
    const verif = await verifierOtpPhone(telephone, null, code);
    if (!verif.valide) {
      return res.status(verif.tropDeTentatives ? 429 : 400).json({ error: verif.error });
    }
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
    
    const verif = await verifierOtpPhone(telephone, 'login', code);
    if (!verif.valide) {
      return res.status(verif.tropDeTentatives ? 429 : 400).json({ error: verif.error });
    }
    
    // Trouver l'utilisateur (compatible avec formats +221, 221 et 9 chiffres)
    const cleanPhone = normalisePhone(telephone);
    const withPlus = '+' + cleanPhone;
    const raw9Digits = cleanPhone.startsWith('221') ? cleanPhone.slice(3) : cleanPhone;

    const { rows } = await pool.query(
      `SELECT id, nom, email, email_verifie, suspendu, supprime_le, anonymise_le, COALESCE(jwt_version, 1) AS jwt_version, telephone 
       FROM utilisateurs 
       WHERE telephone=$1 OR telephone=$2 OR telephone=$3 OR REPLACE(telephone, '+', '')=$1`,
      [cleanPhone, withPlus, raw9Digits]
    );
    
    let user = rows[0];
    
    if (!user) {
      // Auto-provisioning sécurisé pour un locataire/bailleur reconnu en base contacts_immo
      const short9 = raw9Digits.length >= 9 ? raw9Digits.slice(-9) : raw9Digits;
      const { rows: contactRows } = await pool.query(
        `SELECT id, nom, prenom, email, telephone FROM contacts_immo 
         WHERE RIGHT(REGEXP_REPLACE(COALESCE(telephone, ''), '[^0-9]', '', 'g'), 9) = $1
            OR RIGHT(REGEXP_REPLACE(COALESCE(whatsapp, ''), '[^0-9]', '', 'g'), 9) = $1 LIMIT 1`,
        [short9]
      );
      if (!contactRows.length) {
        return res.status(404).json({ error: 'Aucun compte associé à ce numéro' });
      }
      const c = contactRows[0];
      const userNom = [c.prenom, c.nom].filter(Boolean).join(' ') || 'Locataire Nopalou';
      const dummyEmail = c.email && !c.email.includes('example.com') ? c.email : `${short9}@whatsapp.nopalou.com`;
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hash = await bcrypt.hash(randomPassword, 12);
      const insertUser = await pool.query(
        `INSERT INTO utilisateurs (nom, email, mot_de_passe_hash, telephone, email_verifie, jwt_version)
         VALUES ($1, $2, $3, $4, true, 1)
         ON CONFLICT (telephone) DO UPDATE SET nom = EXCLUDED.nom
         RETURNING id, nom, email, telephone, jwt_version`,
        [userNom, dummyEmail, hash, cleanPhone]
      );
      user = insertUser.rows[0];
      await pool.query(`UPDATE contacts_immo SET utilisateur_id = $1 WHERE id = $2`, [user.id, c.id]);
    }
    
    if (user.suspendu) return res.status(403).json({ error: 'Compte suspendu' });
    if (user.anonymise_le) return res.status(403).json({ error: 'Ce compte a été définitivement supprimé.' });
    
    const enCoursDeSuppression = !!user.supprime_le;
    const token = jwt.sign({ userId: user.id, jwtVersion: user.jwt_version || 1 }, process.env.JWT_SECRET, { expiresIn: '7d' });
    user.en_cours_de_suppression = enCoursDeSuppression;
    
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
    
    const verif = await verifierOtpPhone(telephone, 'register', code);
    if (!verif.valide) {
      return res.status(verif.tropDeTentatives ? 429 : 400).json({ error: verif.error });
    }
    
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
      'INSERT INTO utilisateurs (nom, email, mot_de_passe_hash, telephone, email_verifie, est_apporteur, code_apporteur, jwt_version) VALUES ($1, $2, $3, $4, true, true, $5, 1) RETURNING id, nom, email, telephone, code_apporteur, jwt_version',
      [nom, email, hash, telephone, codeApporteur]
    );
    const user = insertRes.rows[0];
    
    const token = jwt.sign({ userId: user.id, jwtVersion: 1 }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
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
        'INSERT INTO utilisateurs (nom, email, mot_de_passe_hash, telephone, email_verifie, est_apporteur, code_apporteur, jwt_version) VALUES ($1, $2, $3, $4, true, true, $5, 1) RETURNING id, nom, email, code_apporteur, jwt_version',
        [nom || 'Utilisateur WhatsApp', dummyEmail, hash, telephone, codeApporteur]
      );
      user = insertRes.rows[0];
    }

    const magicToken = jwt.sign({ userId: user.id, type: 'magic' }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const magicLink = `${FRONTEND_URL}/connexion/magique?token=${magicToken}`;
    
    await sendWhatsAppNotification(telephone, {
      textMessage: `👋 Bonjour !\n\nVoici votre lien de connexion magique à Nopalou.\nCliquez ici pour accéder à votre compte sans mot de passe :\n\n👉 ${magicLink}\n\nCe lien est valide 15 minutes.`,
      title: `🔑 Connexion Magique — Nopalou`,
      montant: 'Gratuit',
      detail: `Accédez à votre compte en 1 Clic sans mot de passe (lien valide 15 minutes).`,
      url: magicLink,
      buttonParam: `connexion/magique?token=${magicToken}`,
      type: 'service',
    });
    
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
    
    const { validerMagicToken } = require('../lib/magicAuthToken');
    let userId = null;

    const resHmac = validerMagicToken(token);
    if (resHmac.valide) {
      userId = resHmac.userId;
    } else {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload.type === 'magic') userId = payload.userId;
      } catch (_) {}
    }

    if (!userId) {
      return res.status(400).json({ error: 'Lien magique invalide ou expiré' });
    }

    const { rows } = await pool.query(
      'SELECT id, nom, email, email_verifie, suspendu, supprime_le, anonymise_le, COALESCE(jwt_version, 1) AS jwt_version, telephone FROM utilisateurs WHERE id=$1',
      [userId]
    );
    
    if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const user = rows[0];
    if (user.suspendu) return res.status(403).json({ error: 'Compte suspendu.' });
    if (user.anonymise_le) return res.status(403).json({ error: 'Ce compte a été définitivement supprimé.' });

    const enCoursDeSuppression = !!user.supprime_le;
    const sessionToken = jwt.sign({ userId: user.id, jwtVersion: user.jwt_version || 1 }, process.env.JWT_SECRET, { expiresIn: '7d' });
    user.en_cours_de_suppression = enCoursDeSuppression;
    res.json({ user, token: sessionToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/magic-verify - Route pour Next.js Server Components / Handlers
router.post('/magic-verify', limiterAuth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token manquant' });

    const { validerMagicToken } = require('../lib/magicAuthToken');
    let userId = null;

    const resHmac = validerMagicToken(token);
    if (resHmac.valide) {
      userId = resHmac.userId;
    } else {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload.type === 'magic') userId = payload.userId;
      } catch (_) {}
    }

    if (!userId) {
      return res.status(400).json({ error: 'Lien magique invalide ou expiré' });
    }

    const { rows } = await pool.query(
      'SELECT id, nom, email, email_verifie, suspendu, supprime_le, anonymise_le, COALESCE(jwt_version, 1) AS jwt_version, telephone FROM utilisateurs WHERE id=$1',
      [userId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const user = rows[0];
    if (user.suspendu) return res.status(403).json({ error: 'Compte suspendu.' });
    if (user.anonymise_le) return res.status(403).json({ error: 'Ce compte a été définitivement supprimé.' });

    const enCoursDeSuppression = !!user.supprime_le;
    const sessionToken = jwt.sign({ userId: user.id, jwtVersion: user.jwt_version || 1 }, process.env.JWT_SECRET, { expiresIn: '7d' });
    user.en_cours_de_suppression = enCoursDeSuppression;
    res.json({ success: true, user, token: sessionToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/2fa/demander — Générer et envoyer un code OTP WhatsApp
router.post('/2fa/demander', verifierToken, async (req, res) => {
  try {
    const { action = 'operation_sensible', label = 'valider votre opération' } = req.body;
    const { rows } = await pool.query('SELECT id, telephone, nom FROM utilisateurs WHERE id = $1', [req.user.userId]);
    if (!rows.length || !rows[0].telephone) {
      return res.status(400).json({ error: 'Numéro de téléphone introuvable sur votre compte' });
    }
    const { genererOtp, envoyerOtpWhatsApp } = require('../services/otp');
    const code = await genererOtp(req.user.userId, action, rows[0].telephone);
    await envoyerOtpWhatsApp(rows[0].telephone, code, label);
    res.json({ success: true, message: 'Code de sécurité envoyé sur votre WhatsApp', telephone_masque: rows[0].telephone.slice(-4) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/2fa/valider — Vérifier le code OTP saisi
router.post('/2fa/valider', verifierToken, async (req, res) => {
  try {
    const { action = 'operation_sensible', code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code requis' });
    const { verifierOtp } = require('../services/otp');
    const result = await verifierOtp(req.user.userId, action, code);
    if (!result.valide) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, message: 'Opération validée avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/supprimer-compte — Demande autonome de suppression (RGPD Art. 17)
router.post('/supprimer-compte', verifierToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { mot_de_passe, confirmation } = req.body;

    if (!confirmation || confirmation.trim().toUpperCase() !== 'SUPPRIMER') {
      return res.status(400).json({ error: 'Veuillez saisir "SUPPRIMER" pour confirmer la suppression.' });
    }

    const { rows } = await pool.query(
      'SELECT id, nom, email, mot_de_passe_hash, supprime_le, anonymise_le FROM utilisateurs WHERE id=$1',
      [userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const user = rows[0];

    if (user.anonymise_le) {
      return res.status(400).json({ error: 'Ce compte a déjà été supprimé.' });
    }

    // Vérifier mot de passe si le compte a un mot de passe traditionnel
    if (user.mot_de_passe_hash && !user.mot_de_passe_hash.startsWith('$argon2') && !user.email.endsWith('@whatsapp.nopalou.com')) {
      if (!mot_de_passe) {
        return res.status(400).json({ error: 'Veuillez entrer votre mot de passe actuel.' });
      }
      const ok = await bcrypt.compare(mot_de_passe, user.mot_de_passe_hash);
      if (!ok) {
        return res.status(401).json({ error: 'Mot de passe incorrect.' });
      }
    }

    const now = new Date();
    await pool.query(
      'UPDATE utilisateurs SET supprime_le=$1, supprime_par_utilisateur=true, jwt_version=COALESCE(jwt_version, 1) + 1 WHERE id=$2',
      [now, userId]
    );

    const dateLimite = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    if (user.email && !user.email.endsWith('@whatsapp.nopalou.com')) {
      envoyerEmail({
        to: user.email,
        subject: 'Nopalou — Demande de suppression de votre compte',
        html: templateEmail({
          preheader: 'Votre compte est programmé pour suppression dans 30 jours',
          titre: 'Demande de suppression enregistrée',
          contenuHtml: `
            <p>Bonjour ${user.nom},</p>
            <p>Nous vous confirmons que votre demande de suppression de compte a bien été prise en compte.</p>
            <p>Conformément au RGPD et à notre politique de confidentialité, votre compte entre dans une période de grâce de <strong>30 jours</strong>. Durant cette période, vos données sont conservées de façon sécurisée et peuvent être restaurées.</p>
            <p>Si vous changez d'avis, connectez-vous simplement à votre compte avant le <strong>${dateLimite}</strong> et cliquez sur « Annuler la suppression » depuis votre profil.</p>
          `,
          boutonTexte: 'Accéder à mon compte',
          boutonUrl: `${FRONTEND_URL}/compte/profil`,
          noteBas: 'Passé ce délai de 30 jours, votre compte et vos données personnelles seront définitivement purgés.',
        }),
      }).catch(e => console.warn('[EMAIL SUPPRESSION]', e.message));
    }

    res.clearCookie('nopalou_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.json({
      success: true,
      message: `Votre compte sera supprimé dans 30 jours (le ${dateLimite}). Vous pouvez vous reconnecter à tout moment pour annuler cette demande.`,
      supprime_le: now,
      date_limite: dateLimite,
    });
  } catch (err) {
    console.error('[AUTH SUPPRIMER COMPTE]', err);
    res.status(500).json({ error: 'Erreur lors de la demande de suppression.' });
  }
});

// ── POST /api/auth/annuler-suppression — Annuler la suppression pendant les 30 jours
router.post('/annuler-suppression', verifierToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { rows } = await pool.query(
      'SELECT id, nom, email, supprime_le, anonymise_le FROM utilisateurs WHERE id=$1',
      [userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const user = rows[0];

    if (user.anonymise_le) {
      return res.status(400).json({ error: 'Ce compte a déjà été définitivement anonymisé.' });
    }
    if (!user.supprime_le) {
      return res.status(400).json({ error: 'Ce compte n\'est pas en attente de suppression.' });
    }

    await pool.query(
      'UPDATE utilisateurs SET supprime_le=NULL, supprime_par_utilisateur=false WHERE id=$1',
      [userId]
    );

    if (user.email && !user.email.endsWith('@whatsapp.nopalou.com')) {
      envoyerEmail({
        to: user.email,
        subject: 'Nopalou — Suppression de compte annulée',
        html: templateEmail({
          preheader: 'Votre compte Nopalou reste actif',
          titre: 'Suppression annulée avec succès',
          contenuHtml: `
            <p>Bonjour ${user.nom},</p>
            <p>La procédure de suppression de votre compte a bien été annulée à votre demande.</p>
            <p>Votre compte et l'ensemble de vos services restent pleinement actifs.</p>
          `,
          boutonTexte: 'Accéder à mon espace',
          boutonUrl: `${FRONTEND_URL}/compte/profil`,
        }),
      }).catch(e => console.warn('[EMAIL ANNULATION]', e.message));
    }

    res.json({
      success: true,
      message: 'La suppression de votre compte a été annulée avec succès. Votre compte reste actif.',
    });
  } catch (err) {
    console.error('[AUTH ANNULER SUPPRESSION]', err);
    res.status(500).json({ error: 'Erreur lors de l\'annulation de la suppression.' });
  }
});

// ── GET /api/auth/statut-suppression — État de la suppression de compte
router.get('/statut-suppression', verifierToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT supprime_le, supprime_par_utilisateur, anonymise_le FROM utilisateurs WHERE id=$1',
      [req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const u = rows[0];
    const enGrace = !!(u.supprime_le && !u.anonymise_le);
    let joursRestants = null;
    let dateLimite = null;
    if (enGrace) {
      const dateSuppr = new Date(u.supprime_le);
      const echeance = new Date(dateSuppr.getTime() + 30 * 24 * 60 * 60 * 1000);
      joursRestants = Math.max(0, Math.ceil((echeance.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      dateLimite = echeance.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    res.json({
      en_cours_de_suppression: enGrace,
      supprime_le: u.supprime_le,
      supprime_par_utilisateur: u.supprime_par_utilisateur,
      jours_restants: joursRestants,
      date_limite: dateLimite,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;