// backend/routes/annonces.js — Annonces classifiées multi-catégories
const router  = require('express').Router();
const multer  = require('multer');
const { body, param, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { adminSecretOnly, verifierToken, tokenOptional, requireEmailVerifie } = require('../middlewares/auth');
const { limiterPublication, limiterEcriture, limiterBulk, blockScraperUA, limiterRecherche } = require('../middlewares/rateLimit');
const { uploadBuffer } = require('../services/cloudinary');
const { sendWhatsAppCarousel, sendWhatsAppTemplate } = require('../services/whatsapp');
const cfg = require('../lib/settingsCache');


const CATS_AUTORISEES = [
  'smartphones', 'informatique', 'tv-electro', 'mode',
  'maison', 'auto-moto', 'jeux', 'services', 'immo', 'beaute', 'emploi', 'divers',
];

// Champs requis par catégorie (clés dans caracteristiques JSONB)
const CHAMPS_REQUIS_CAT = {
  smartphones: ['marque', 'etat'],
  informatique: ['marque', 'etat'],
  'tv-electro':  ['marque', 'etat'],
  'auto-moto':   ['marque', 'modele', 'annee', 'etat'],
  jeux:          ['plateforme', 'etat'],
  mode:          ['taille', 'genre', 'etat'],
  maison:        ['type_article', 'etat'],
  services:      ['type_service'],
};

// Multer — mémoire (max 5 fichiers, 5 Mo chacun)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: function(req, file, cb) {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Seules les images sont acceptées'));
  },
});

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

// Compte total annonces utilisateur (immo + classifiées)
async function compterAnnoncesUtilisateur(userId) {
  const r = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM annonces_immo        WHERE utilisateur_id=$1 AND supprimee=FALSE) +
      (SELECT COUNT(*) FROM annonces_classifiees WHERE utilisateur_id=$1 AND supprimee=FALSE)
    AS total
  `, [userId]);
  return parseInt(r.rows[0].total || 0, 10);
}

// Valide les champs requis d'une catégorie dans caracteristiques
function validerCaracteristiques(slug, car) {
  const requis = CHAMPS_REQUIS_CAT[slug] || [];
  const manquants = requis.filter(function(c) { return !car[c] || !String(car[c]).trim(); });
  return manquants;
}

// Auto-modération légère — retourne { ok, raison }
function autoModerer({ titre, description, contact_tel, prix }) {
  // 1. Titre trop court
  if (!titre || titre.trim().length < 8)
    return { ok: false, raison: 'Titre trop court (< 8 caractères)' };

  // 2. Titre entièrement en majuscules (souvent spam)
  if (titre.trim() === titre.trim().toUpperCase() && titre.trim().length > 6)
    return { ok: false, raison: 'Titre entièrement en majuscules' };

  // 3. Téléphone invalide (doit contenir 7 à 15 chiffres)
  const telClean = (contact_tel || '').replace(/[\s\-\+\.]/g, '');
  if (!/^\d{7,15}$/.test(telClean))
    return { ok: false, raison: 'Numéro de téléphone invalide' };

  // 4. Prix hors limites raisonnables (si renseigné)
  if (prix) {
    const p = parseFloat(prix);
    if (p < 100 || p > 500_000_000)
      return { ok: false, raison: 'Prix hors limites (< 100 ou > 500 000 000 FCFA)' };
  }

  // 5. Mots/expressions interdits (escroqueries courantes)
  const INTERDITS = [
    'arnaque', 'escroquerie', 'western union', 'moneygram', 'money gram',
    'avance requise', 'avance nécessaire', 'frais de transfert',
    'gagner de l\'argent', 'revenus garantis', 'investissement garanti',
    'cliquez ici', 'click here', 'http://', 'bit.ly', 't.me/',
  ];
  const texte = ((titre || '') + ' ' + (description || '')).toLowerCase();
  for (const mot of INTERDITS) {
    if (texte.includes(mot))
      return { ok: false, raison: `Contenu suspect : "${mot}"` };
  }

  return { ok: true };
}

// ── GET /api/annonces/categories-actives
router.get('/categories-actives', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT categorie_slug as slug
      FROM annonces_classifiees
      WHERE actif = true AND supprimee = false
    `);
    const activeSlugs = rows.map(r => r.slug).filter(Boolean);
    res.json(activeSlugs);
  } catch (err) {
    console.error('[GET /api/annonces/categories-actives]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/annonces — liste publique paginée
router.get('/', blockScraperUA, tokenOptional, limiterBulk, async (req, res) => {
  try {
    const { categorie, ville, q, utilisateur_id, tri, prixMin, prixMax, source, limit = 20, page = 1 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
    const lim    = Math.min(50, parseInt(limit));
    const conds  = ['actif=true', 'supprimee=false'];
    const vals   = [];

    if (categorie)      { vals.push(categorie);       conds.push(`categorie_slug=$${vals.length}`); }
    if (ville)          { vals.push(ville);            conds.push(`ville ILIKE $${vals.length}`); }
    if (utilisateur_id) { vals.push(utilisateur_id);   conds.push(`utilisateur_id=$${vals.length}`); }
    if (q) {
      vals.push(`%${q}%`);
      conds.push(`(titre ILIKE $${vals.length} OR description ILIKE $${vals.length})`);
    }
    if (prixMin && !isNaN(parseFloat(prixMin))) { vals.push(parseFloat(prixMin)); conds.push(`prix >= $${vals.length}`); }
    if (prixMax && !isNaN(parseFloat(prixMax))) { vals.push(parseFloat(prixMax)); conds.push(`prix <= $${vals.length}`); }
    if (source === 'facebook') { conds.push(`source LIKE 'facebook-%'`); }
    else if (source === 'manuel') { conds.push(`(source IS NULL OR source NOT LIKE 'facebook-%')`); }

    const orderBy = tri === 'prix_asc'  ? 'prix ASC NULLS LAST'
                  : tri === 'prix_desc' ? 'prix DESC NULLS LAST'
                  :                       'CASE WHEN utilisateur_id IS NOT NULL THEN 0 ELSE 1 END, created_at DESC';

    const where = 'WHERE ' + conds.join(' AND ');
    const [rows, cnt] = await Promise.all([
      pool.query(
        `SELECT id, categorie_slug, titre, description, prix, ville, quartier,
                contact_nom, contact_tel, photos, caracteristiques, source, created_at
         FROM annonces_classifiees ${where}
         ORDER BY ${orderBy} LIMIT $${vals.length+1} OFFSET $${vals.length+2}`,
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
      `SELECT id, categorie_slug, titre, description, prix, ville, quartier,
              contact_nom, contact_tel, actif, payee, supprimee,
              rejete, photos, caracteristiques, created_at
       FROM annonces_classifiees
       WHERE utilisateur_id=$1 AND supprimee=false
       ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json({ annonces: rows.rows });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── GET /api/annonces/admin/en-attente (admin) — toutes les annonces non supprimées avec filtres
router.get('/admin/en-attente', adminSecretOnly, async (req, res) => {
  try {
    const { q, categorie, statut, ville, payee, tri, limit = 5000 } = req.query;
    const conds = ['a.supprimee = false'];
    const vals = [];

    if (categorie) {
      vals.push(categorie);
      conds.push(`a.categorie_slug = $${vals.length}`);
    }
    if (ville) {
      vals.push(`%${ville}%`);
      conds.push(`a.ville ILIKE $${vals.length}`);
    }
    if (payee === 'true') {
      conds.push(`a.payee = true`);
    } else if (payee === 'false') {
      conds.push(`a.payee = false`);
    }
    if (statut === 'attente') {
      conds.push(`(a.actif = false AND (a.rejete IS NOT TRUE))`);
    } else if (statut === 'actif') {
      conds.push(`a.actif = true`);
    } else if (statut === 'rejete') {
      conds.push(`a.rejete = true`);
    }

    if (q && q.trim()) {
      vals.push(`%${q.trim()}%`);
      const idx = vals.length;
      conds.push(`(
        a.titre ILIKE $${idx} OR
        a.description ILIKE $${idx} OR
        a.contact_nom ILIKE $${idx} OR
        a.contact_tel ILIKE $${idx} OR
        a.ville ILIKE $${idx} OR
        a.quartier ILIKE $${idx} OR
        u.nom ILIKE $${idx} OR
        u.email ILIKE $${idx} OR
        a.id::text ILIKE $${idx}
      )`);
    }

    let orderBy = 'a.created_at DESC';
    if (tri === 'ancien') {
      orderBy = 'a.created_at ASC';
    } else if (tri === 'prix_asc') {
      orderBy = 'a.prix ASC NULLS LAST';
    } else if (tri === 'prix_desc') {
      orderBy = 'a.prix DESC NULLS LAST';
    }

    const lim = Math.min(10000, parseInt(limit) || 5000);
    vals.push(lim);

    const where = 'WHERE ' + conds.join(' AND ');
    const rows = await pool.query(
      `SELECT a.id, a.categorie_slug, a.titre, a.description, a.prix, a.ville, a.quartier,
              a.contact_nom, a.contact_tel, a.photos, a.actif, a.payee, a.rejete,
              a.created_at, a.updated_at,
              u.nom AS auteur_nom, u.email AS auteur_email
       FROM annonces_classifiees a
       LEFT JOIN utilisateurs u ON u.id = a.utilisateur_id
       ${where}
       ORDER BY ${orderBy} LIMIT $${vals.length}`,
      vals
    );
    res.json({ annonces: rows.rows });
  } catch (err) {
    console.error('[ADMIN GET /annonces]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
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

// ── POST /api/annonces — créer annonce (auth, multipart, photos, quota)
router.post('/', limiterPublication, verifierToken, requireEmailVerifie, upload.array('photos', 5), validationCreation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const userId = req.user.userId;
    const { categorie_slug, titre, description, prix, ville, quartier,
            contact_nom, contact_tel } = req.body;

    // Caractéristiques spécifiques à la catégorie
    let caracteristiques = {};
    try { caracteristiques = JSON.parse(req.body.caracteristiques || '{}'); } catch {}

    const manquants = validerCaracteristiques(categorie_slug, caracteristiques);
    if (manquants.length) {
      return res.status(400).json({
        error: 'Champs obligatoires manquants pour cette catégorie : ' + manquants.join(', ')
      });
    }

    // Upload des photos vers Cloudinary
    const photoUrls = [];
    if (req.files && req.files.length) {
      for (const f of req.files) {
        try {
          const url = await uploadBuffer(f.buffer, 'annonces/' + categorie_slug);
          photoUrls.push(url);
        } catch (e) {
          console.error('[CLOUDINARY] upload error:', e.message);
        }
      }
    }

    const total      = await compterAnnoncesUtilisateur(userId);
    const userReq    = await pool.query('SELECT quota_annonces FROM utilisateurs WHERE id=$1', [userId]);
    const customQuota = userReq.rows[0]?.quota_annonces;

    let quotaGratuit = (customQuota !== null && customQuota !== undefined)
      ? customQuota
      : await cfg.getNum('quota_annonces_gratuit');

    // Prise en compte du plan actif de l'utilisateur (5 pour Pro, 15 pour Business VIP)
    const aboRes = await pool.query(
      `SELECT plan FROM abonnements WHERE utilisateur_id=$1 AND statut='actif' AND fin > NOW() ORDER BY fin DESC LIMIT 1`,
      [userId]
    );
    const planActif = aboRes.rows[0]?.plan;
    if (planActif === 'business') {
      quotaGratuit = Math.max(quotaGratuit, 15);
    } else if (planActif === 'pro') {
      quotaGratuit = Math.max(quotaGratuit, 5);
    }

    const prixAnnonce  = await cfg.getNum('prix_annonce') || 1500;
    const estGratuit = total < quotaGratuit;

    // Auto-modération pour les annonces gratuites
    let autoActif = false;
    let raisonRejet = null;
    if (estGratuit) {
      const mod = autoModerer({ titre, description, contact_tel, prix });
      if (mod.ok) {
        autoActif = true;
      } else {
        raisonRejet = mod.raison;
        console.log(`[AUTO-MOD] Annonce rejetée (${userId}): ${mod.raison}`);
      }
    }

    const r = await pool.query(
      `INSERT INTO annonces_classifiees
         (utilisateur_id, categorie_slug, titre, description, prix, ville, quartier,
          contact_nom, contact_tel, photos, caracteristiques, payee, actif)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,false)
       RETURNING id`,
      [userId, categorie_slug, titre, description || null,
       prix || null, ville || 'Dakar', quartier || null,
       contact_nom || null, contact_tel,
       JSON.stringify(photoUrls),
       JSON.stringify(caracteristiques),
       estGratuit]
    );
    const id = r.rows[0].id;

    // Activer immédiatement si auto-modération OK
    if (autoActif) {
      await pool.query('UPDATE annonces_classifiees SET actif=true WHERE id=$1', [id]);
    }

    if (estGratuit) {
      return res.status(201).json({
        success: true, id,
        besoin_paiement: false,
        auto_approuve: autoActif,
        message: autoActif
          ? 'Annonce publiée et visible immédiatement !'
          : 'Annonce envoyée — en attente de validation manuelle.',
      });
    }

    res.status(201).json({
      success: true, id,
      besoin_paiement: true,
      montant: prixAnnonce,
      annonces_gratuites_utilisees: total,
      message: `Quota gratuit atteint (${quotaGratuit} annonces). Paiement de ${prixAnnonce} FCFA requis.`
    });
  } catch (err) {
    console.error('[ANNONCES POST]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/annonces/mine/:id — modifier la sienne
router.put('/mine/:id', verifierToken, param('id').isUUID(), upload.array('photos', 5), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { titre, description, prix, ville, quartier, contact_nom, contact_tel } = req.body;

    let caracteristiques = {};
    try { caracteristiques = JSON.parse(req.body.caracteristiques || '{}'); } catch {}

    // Récup photos existantes si pas de nouvelles
    const existing = await pool.query(
      'SELECT photos, categorie_slug FROM annonces_classifiees WHERE id=$1 AND utilisateur_id=$2',
      [req.params.id, req.user.userId]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Annonce introuvable' });

    let photoUrls = existing.rows[0].photos || [];
    if (req.files && req.files.length) {
      photoUrls = [];
      for (const f of req.files) {
        try {
          const url = await uploadBuffer(f.buffer, 'annonces/' + existing.rows[0].categorie_slug);
          photoUrls.push(url);
        } catch {}
      }
    }

    const r = await pool.query(
      `UPDATE annonces_classifiees
       SET titre=$1, description=$2, prix=$3, ville=$4, quartier=$5,
           contact_nom=$6, contact_tel=$7, photos=$8, caracteristiques=$9,
           rejete=false, actif=false, updated_at=NOW()
       WHERE id=$10 AND utilisateur_id=$11 AND supprimee=false
       RETURNING id`,
      [titre, description, prix || null, ville, quartier, contact_nom, contact_tel,
       JSON.stringify(photoUrls), JSON.stringify(caracteristiques),
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

// ── PUT /api/annonces/admin/:id — approuver / rejeter / remettre (admin)
router.put('/admin/:id', adminSecretOnly, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { actif, rejete } = req.body;
    const newActif  = !!actif;
    // rejete explicitement fourni (true/false) ou déduit : si on approuve → false, si on rejette → true
    const newRejete = rejete !== undefined ? !!rejete : !newActif;

    try {
      await pool.query(
        `UPDATE annonces_classifiees SET actif=$1, rejete=$2, updated_at=NOW() WHERE id=$3`,
        [newActif, newRejete, req.params.id]
      );
    } catch (e) {
      // Fallback si colonne rejete absente (migration pas encore exécutée)
      console.warn('[ADMIN] fallback sans rejete:', e.message);
      await pool.query(
        `UPDATE annonces_classifiees SET actif=$1, updated_at=NOW() WHERE id=$2`,
        [newActif, req.params.id]
      );
    }
    res.json({ success: true });

    // Notification WhatsApp au déposant si approbation (fire-and-forget)
    if (newActif) {
      setImmediate(async () => {
        try {
          const ann = await pool.query('SELECT * FROM annonces_classifiees WHERE id=$1', [req.params.id]);
          const a = ann.rows[0];
          if (!a?.contact_tel) return;
          const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
          const card = {
            imageUrl: a.photos?.[0] || null,
            title:    a.titre,
            detail:   a.prix ? new Intl.NumberFormat('fr-FR').format(a.prix) + ' FCFA' : 'Prix non précisé',
            pageUrl:  `${SITE}/annonces/${a.id}`,
          };
          if (card.imageUrl) {
            await sendWhatsAppCarousel(a.contact_tel, 'nopalou_carousel_annonce', [card]);
          } else {
            await sendWhatsAppTemplate(a.contact_tel, 'nopalou_fiche_texte', [
              { type: 'body', parameters: [
                { type: 'text', text: card.title },
                { type: 'text', text: card.detail },
                { type: 'text', text: card.pageUrl },
              ]},
              { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: a.id }] },
            ]);
          }
        } catch {}
      });
    }
  } catch (err) {
    console.error('[ADMIN PUT]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── DELETE /api/annonces/admin/:id — supprimer annonce classifiée (admin)
router.delete('/admin/:id', adminSecretOnly, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { rows } = await pool.query('DELETE FROM annonces_classifiees WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Annonce introuvable' });
    res.json({ success: true });
  } catch (err) {
    console.error('[ADMIN DELETE /annonces]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

