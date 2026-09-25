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
  const bufExpected = Buffer.from(otpRecord.code_hash, 'hex');
  const bufActual = Buffer.from(computedHash, 'hex');
  const isMatch = bufExpected.length === bufActual.length && crypto.timingSafeEqual(bufExpected, bufActual);

  if (!isMatch) {
    const restants = Math.max(0, otpRecord.essais_restants - 1);
    await pool.query('UPDATE auth_otps SET essais_restants = $1 WHERE id = $2', [restants, otpRecord.id]);
    if (restants === 0) {
      await pool.query('UPDATE auth_otps SET utilise = TRUE WHERE id = $1', [otpRecord.id]);
      return { valide: false, error: 'Nombre maximal de tentatives dépassé.' };
    }
    return { valide: false, error: `Code incorrect (${restants} essai(s) restant(s))` };
  }

  // Code valide : marquer comme consommé
  await pool.query('UPDATE auth_otps SET utilise = TRUE WHERE id = $1', [otpRecord.id]);
  return { valide: true };
}

let _migratedPhone = false;
async function assurerTableOtpPhone() {
  if (_migratedPhone) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auth_otp_phones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        telephone VARCHAR(32) NOT NULL,
        action VARCHAR(64) NOT NULL,
        code_hash VARCHAR(64) NOT NULL,
        code_sel VARCHAR(32) NOT NULL,
        essais_restants INT DEFAULT 5,
        expire_a TIMESTAMPTZ NOT NULL,
        utilise BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE auth_otp_phones ADD COLUMN IF NOT EXISTS verifie_le TIMESTAMPTZ;
      CREATE INDEX IF NOT EXISTS idx_auth_otp_phones_tel_act ON auth_otp_phones(telephone, action, utilise);
    `);
    _migratedPhone = true;
  } catch (e) {
    _migratedPhone = true;
  }
}

/**
 * Génère un code OTP à 6 chiffres pour un numéro de téléphone (pré-authentification / inscription)
 */
async function genererOtpPhone(telephone, action = 'auth') {
  await assurerTableOtpPhone();
  const normPhone = normalisePhone(telephone);
  const cleanPh = String(telephone || '').replace(/\D/g, '');
  const shortPh = cleanPh.length >= 9 ? cleanPh.slice(-9) : cleanPh;
  const code = crypto.randomInt(100000, 1000000).toString();
  const sel = crypto.randomBytes(8).toString('hex');
  const hashed = hashOtp(code, sel);
  const expireA = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalider les codes déjà expirés pour ce numéro
  await pool.query(`
    UPDATE auth_otp_phones
    SET utilise = TRUE
    WHERE (
      telephone = $1
      OR RIGHT(REGEXP_REPLACE(telephone, '[^0-9]', '', 'g'), 9) = $2
    )
    AND expire_a < NOW()
    AND utilise = FALSE
  `, [normPhone, shortPh]);

  await pool.query(`
    INSERT INTO auth_otp_phones (telephone, action, code_hash, code_sel, expire_a)
    VALUES ($1, $2, $3, $4, $5)
  `, [normPhone, action, hashed, sel, expireA]);

  return code;
}

/**
 * Vérifie un code OTP soumis pour un numéro de téléphone
 */
async function verifierOtpPhone(telephone, action, codeSaisi) {
  await assurerTableOtpPhone();
  const normPhone = normalisePhone(telephone);
  const cleanPh = String(telephone || '').replace(/\D/g, '');
  const shortPh = cleanPh.length >= 9 ? cleanPh.slice(-9) : cleanPh;
  const cleanCode = String(codeSaisi || '').trim();

  if (cleanCode.length !== 6) {
    return { valide: false, error: 'Le code doit comporter 6 chiffres' };
  }

  // 1. Chercher les codes actifs (non utilisés et non expirés) pour ce numéro
  // Tolérance d'action : accepte l'action demandée, 'auth', 'login', 'locataire_portal'
  const { rows } = await pool.query(`
    SELECT id, code_hash, code_sel, essais_restants, expire_a, action, created_at
    FROM auth_otp_phones
    WHERE (
      telephone = $1
      OR RIGHT(REGEXP_REPLACE(telephone, '[^0-9]', '', 'g'), 9) = $2
    )
    AND ($3::VARCHAR IS NULL OR action = $3::VARCHAR OR action = 'auth' OR action = 'locataire_portal' OR action = 'login')
    AND utilise = FALSE
    AND expire_a > NOW()
    ORDER BY created_at DESC
    LIMIT 5
  `, [normPhone, shortPh, action || null]);

  // 2. Si aucun code en attente trouvé, vérifier la fenêtre d'idempotence (anti-double-soumission / race condition)
  if (!rows.length) {
    const { rows: recentValid } = await pool.query(`
      SELECT id, code_hash, code_sel, expire_a, verifie_le
      FROM auth_otp_phones
      WHERE (
        telephone = $1
        OR RIGHT(REGEXP_REPLACE(telephone, '[^0-9]', '', 'g'), 9) = $2
      )
      AND utilise = TRUE
      AND expire_a > NOW()
      AND (verifie_le IS NOT NULL AND verifie_le > NOW() - INTERVAL '60 seconds')
      ORDER BY verifie_le DESC
      LIMIT 1
    `, [normPhone, shortPh]);

    if (recentValid.length > 0) {
      const computedHash = hashOtp(cleanCode, recentValid[0].code_sel);
      const bufExpected = Buffer.from(recentValid[0].code_hash, 'hex');
      const bufActual = Buffer.from(computedHash, 'hex');
      if (bufExpected.length === bufActual.length && crypto.timingSafeEqual(bufExpected, bufActual)) {
        return { valide: true, dejaValide: true };
      }
    }

    return { valide: false, error: 'Aucun code trouvé ou expiré. Veuillez demander un nouveau code.' };
  }

  // 3. Vérifier le code saisi parmi les codes actifs
  let matchedRecord = null;
  for (const record of rows) {
    if (record.essais_restants <= 0) continue;
    const computedHash = hashOtp(cleanCode, record.code_sel);
    const bufExpected = Buffer.from(record.code_hash, 'hex');
    const bufActual = Buffer.from(computedHash, 'hex');
    if (bufExpected.length === bufActual.length && crypto.timingSafeEqual(bufExpected, bufActual)) {
      matchedRecord = record;
      break;
    }
  }

  if (matchedRecord) {
    // Code valide : marquer comme consommé et enregistrer verifie_le pour l'idempotence
    await pool.query('UPDATE auth_otp_phones SET utilise = TRUE, verifie_le = NOW() WHERE id = $1', [matchedRecord.id]);
    // Invalider les autres codes non utilisés pour ce numéro
    await pool.query(`
      UPDATE auth_otp_phones
      SET utilise = TRUE
      WHERE (
        telephone = $1
        OR RIGHT(REGEXP_REPLACE(telephone, '[^0-9]', '', 'g'), 9) = $2
      )
      AND utilise = FALSE
    `, [normPhone, shortPh]);

    return { valide: true };
  }

  // 4. Si le code ne correspond pas, décrémenter le nombre d'essais sur le code le plus récent
  const latestRecord = rows[0];
  const restants = Math.max(0, latestRecord.essais_restants - 1);
  await pool.query('UPDATE auth_otp_phones SET essais_restants = $1 WHERE id = $2', [restants, latestRecord.id]);
  if (restants === 0) {
    await pool.query('UPDATE auth_otp_phones SET utilise = TRUE WHERE id = $1', [latestRecord.id]);
    return { valide: false, error: 'Trop de tentatives incorrectes. Ce code a été invalidé par sécurité.', tropDeTentatives: true };
  }

  return { valide: false, error: `Code incorrect (${restants} tentative(s) restante(s))`, essaisRestants: restants };
}

module.exports = {
  genererOtp,
  envoyerOtpWhatsApp,
  verifierOtp,
  genererOtpPhone,
  verifierOtpPhone,
  hashOtp
};
