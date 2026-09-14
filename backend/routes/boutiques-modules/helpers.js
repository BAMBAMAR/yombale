// backend/routes/boutiques-modules/helpers.js — Fonctions et constantes partagées pour les modules boutiques
const { pool } = require('../../models/db');
const multer = require('multer');
const cfg = require('../../lib/settingsCache');

async function checkBoutiqueAccess(boutiqueIdOrSlug, userId) {
  const isUUID = /^[0-9a-f-]{36}$/i.test(boutiqueIdOrSlug);
  const { rows } = await pool.query(
    `SELECT b.* 
     FROM boutiques b
     LEFT JOIN boutique_utilisateurs bu ON b.id = bu.boutique_id
     WHERE ${isUUID ? 'b.id = $1' : 'b.slug = $1'} AND (b.utilisateur_id = $2 OR bu.utilisateur_id = $2)`,
    [boutiqueIdOrSlug, userId]
  );
  return rows[0];
}

async function checkBoutiqueQuotas(userId, telephoneInput, emailInput) {
  const maxCompte = (await cfg.getNum('max_boutiques_par_compte')) || 3;
  const maxTel = (await cfg.getNum('max_boutiques_par_telephone')) || 3;

  if (userId) {
    const cntCompte = await pool.query('SELECT COUNT(*) FROM boutiques WHERE utilisateur_id=$1', [userId]);
    if (parseInt(cntCompte.rows[0].count, 10) >= maxCompte) {
      return { allowed: false, error: `Limite de ${maxCompte} boutique(s) par compte atteinte.` };
    }
  }

  const inputTelRaw = telephoneInput?.trim() || '';
  const userEmailRaw = (emailInput || '').trim().toLowerCase();
  const cleanTel = inputTelRaw.replace(/\D/g, '').slice(-9);

  if (cleanTel || userEmailRaw) {
    const cntTel = await pool.query(
      `SELECT COUNT(DISTINCT b.id)
       FROM boutiques b
       JOIN utilisateurs u ON b.utilisateur_id = u.id
       WHERE (
         ($1::text != '' AND (
           RIGHT(REGEXP_REPLACE(COALESCE(u.telephone, ''), '[^0-9]', '', 'g'), 9) = $1
           OR
           RIGHT(REGEXP_REPLACE(COALESCE(b.telephone, ''), '[^0-9]', '', 'g'), 9) = $1
         ))
         OR
         ($2::text != '' AND LOWER(COALESCE(u.email, '')) = $2)
       )`,
      [cleanTel, userEmailRaw]
    );
    const totalBoutiquesTrouvees = parseInt(cntTel.rows[0].count, 10);
    if (totalBoutiquesTrouvees >= maxTel) {
      return {
        allowed: false,
        error: `Limite atteinte : ${totalBoutiquesTrouvees} boutique(s) sont déjà enregistrées avec ce numéro de téléphone (${inputTelRaw || 'non renseigné'}) ou e-mail (${userEmailRaw}). La limite autorisée par l'administration est de ${maxTel} boutique(s).`
      };
    }
  }

  return { allowed: true };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 2 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(null, false);
  },
});

const uploadProduitPhotos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(null, false);
  },
});

const uploadJustificatifAchat = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const CATS = [
  'mixte',
  'smartphones',
  'informatique',
  'tv-electro',
  'mode',
  'maison',
  'auto-moto',
  'jeux',
  'alimentation',
  'beaute',
  'sport',
  'fournitures',
  'quincaillerie',
  'pieces-rechange',
  'bijouterie',
  'maraichage',
  'elevage',
  'produits-agricoles',
  'solaire-energie',
  'sante-pharma',
  'bebe-enfants',
  'services',
  'autre'
];

const MAX_BOUTIQUES = 3;
const QUOTA_PRODUITS = { pro: 50, business: Infinity };

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

async function uniqueSlug(base, excludeId = null) {
  let slug = base;
  let n = 2;
  while (true) {
    const cond = excludeId
      ? 'SELECT id FROM boutiques WHERE slug=$1 AND id!=$2'
      : 'SELECT id FROM boutiques WHERE slug=$1';
    const params = excludeId ? [slug, excludeId] : [slug];
    const r = await pool.query(cond, params);
    if (!r.rows[0]) return slug;
    slug = `${base}-${n++}`;
  }
}

module.exports = {
  checkBoutiqueAccess,
  checkBoutiqueQuotas,
  upload,
  uploadProduitPhotos,
  uploadJustificatifAchat,
  CATS,
  MAX_BOUTIQUES,
  QUOTA_PRODUITS,
  slugify,
  uniqueSlug,
};
