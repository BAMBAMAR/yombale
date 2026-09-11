// backend/services/otp.js
// Nopalou — Service Double Authentification 2FA par Code OTP (WhatsApp / SMS)
// Sécurisation des opérations sensibles marchands (clôture caisse, virement Wave, export données)

const crypto = require('crypto');
const { pool } = require('../models/db');
const { sendWhatsAppText, normalisePhone } = require('./whatsapp');

let _migrated = false;
async function assurerTableOtp() {
  if (_migrated) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auth_otps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        utilisateur_id UUID NOT NULL,
        action VARCHAR(64) NOT NULL,
        code_hash VARCHAR(64) NOT NULL,
        code_sel VARCHAR(32) NOT NULL,
        telephone VARCHAR(32) NOT NULL,
        essais_restants INT DEFAULT 3,
        expire_a TIMESTAMPTZ NOT NULL,
        utilise BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_auth_otps_user_action ON auth_otps(utilisateur_id, action, utilise);
    `);
    _migrated = true;
  } catch (e) {
    _migrated = true;
  }
}

function hashOtp(code, sel) {
  return crypto.createHash('sha256').update(String(code) + (sel || '')).digest('hex');
}

/**
 * Génère un code OTP à 6 chiffres et l'enregistre en base
 */
async function genererOtp(utilisateurId, action, telephone) {
  await assurerTableOtp();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const sel = crypto.randomBytes(8).toString('hex');
  const hashed = hashOtp(code, sel);
  const expireA = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalider les anciens codes non utilisés pour cette action
  await pool.query(`
    UPDATE auth_otps
    SET utilise = TRUE
    WHERE utilisateur_id = $1 AND action = $2 AND utilise = FALSE
  `, [utilisateurId, action]);

  await pool.query(`
    INSERT INTO auth_otps (utilisateur_id, action, code_hash, code_sel, telephone, expire_a)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [utilisateurId, action, hashed, sel, normalisePhone(telephone), expireA]);

  return code;
}

/**
 * Envoie le code OTP par WhatsApp
 */
async function envoyerOtpWhatsApp(telephone, code, actionLabel = 'sécuriser votre opération') {
  const normPhone = normalisePhone(telephone);
  const msg = 
`🔐 *Code de Sécurité Nopalou (2FA)*

Voici votre code à 6 chiffres pour ${actionLabel} :
👉 *${code}* 👈

⏱️ Ce code expire dans 10 minutes.
⚠️ *Ne partagez jamais ce code*, même avec un agent de support Nopalou.`;

  return sendWhatsAppText(normPhone, msg);
}

/**
 * Vérifie un code OTP soumis
 */
async function verifierOtp(utilisateurId, action, codeSaisi) {
  await assurerTableOtp();
  const cleanCode = String(codeSaisi || '').trim();
  if (cleanCode.length !== 6) {
    return { valide: false, error: 'Le code doit comporter 6 chiffres' };
  }

  const { rows } = await pool.query(`
    SELECT id, code_hash, code_sel, essais_restants, expire_a
    FROM auth_otps
    WHERE utilisateur_id = $1 AND action = $2 AND utilise = FALSE
    ORDER BY created_at DESC
    LIMIT 1
  `, [utilisateurId, action]);

  if (!rows.length) {
    return { valide: false, error: 'Aucun code OTP en attente ou code déjà utilisé' };
  }

  const otpRecord = rows[0];

  if (new Date() > new Date(otpRecord.expire_a)) {
    await pool.query('UPDATE auth_otps SET utilise = TRUE WHERE id = $1', [otpRecord.id]);
    return { valide: false, error: 'Code expiré. Veuillez en demander un nouveau.' };
  }

  if (otpRecord.essais_restants <= 0) {
    await pool.query('UPDATE auth_otps SET utilise = TRUE WHERE id = $1', [otpRecord.id]);
    return { valide: false, error: 'Nombre maximal de tentatives dépassé.' };
  }

  const computedHash = hashOtp(cleanCode, otpRecord.code_sel);
  if (computedHash !== otpRecord.code_hash) {
    await pool.query('UPDATE auth_otps SET essais_restants = essais_restants - 1 WHERE id = $1', [otpRecord.id]);
    return { valide: false, error: `Code incorrect (${otpRecord.essais_restants - 1} essai(s) restant(s))` };
  }

  // Code valide : marquer comme consommé
  await pool.query('UPDATE auth_otps SET utilise = TRUE WHERE id = $1', [otpRecord.id]);
  return { valide: true };
}

module.exports = {
  genererOtp,
  envoyerOtpWhatsApp,
  verifierOtp,
  hashOtp
};
