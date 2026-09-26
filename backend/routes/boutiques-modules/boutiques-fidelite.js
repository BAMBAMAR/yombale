// backend/routes/boutiques-modules/boutiques-fidelite.js
const router = require('express').Router();
const { body, param, query, validationResult } = require('express-validator');
const { pool } = require('../../models/db');
const { verifierToken, tokenOptional, adminSecretOnly, requireEmailVerifie } = require('../../middlewares/auth');
const { checkAbonnement, requireAbonnement, requireBusiness } = require('../../middlewares/checkAbonnement');
const { limiterPublication, limiterImport } = require('../../middlewares/rateLimit');
const { uploadBuffer } = require('../../services/cloudinary');
const { scrapeProductFromUrl } = require('../../services/magic-import');
const { syncProduit, deleteProduit } = require('../../services/whatsapp-catalog');
const cfg = require('../../lib/settingsCache');
const { enregistrerAuditLog } = require('../../lib/auditLogger');
const { normalizeSocialUrl } = require('../../services/social-parser');
const {
  checkBoutiqueAccess,
  checkBoutiqueQuotas,
  upload,
  uploadProduitPhotos,
  CATS,
  MAX_BOUTIQUES,
  QUOTA_PRODUITS,
  slugify,
  uniqueSlug,
} = require('./helpers');
router.get('/:id/fidelite/rechercher', tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const { q, terminal_token } = req.query;
    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(
      `SELECT id, caisse_token, fidelite_actif, fidelite_type, fidelite_taux_cashback, fidelite_tampons_max, fidelite_seuil_tampon FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`,
      [idParam]
    );
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutique = bRes.rows[0];

    // Contrôle d'accès : session marchand ou jeton terminal de caisse
    let accessGranted = false;
    if (req.user?.userId) {
      const bqAccess = await checkBoutiqueAccess(idParam, req.user.userId);
      if (bqAccess) accessGranted = true;
    }
    if (!accessGranted) {
      const tokenToTest = terminal_token || req.headers['x-terminal-token'] || req.query.token;
      if (tokenToTest && boutique.caisse_token && boutique.caisse_token === tokenToTest) {
        accessGranted = true;
      }
    }
    if (!accessGranted) {
      const { logSecurityViolation } = require('../../middlewares/tenantSecurity');
      logSecurityViolation({
        eventType: 'UNAUTHORIZED_FIDELITE_ACCESS',
        userId: req.user?.userId || null,
        tenantType: 'boutique',
        targetId: idParam,
        req,
        details: { reason: 'Tentative d\'accès non autorisée aux données clients fidélité' }
      });
      return res.status(403).json({ error: 'Accès refusé : session marchand ou jeton terminal requis.' });
    }

    const cleanQ = (q || '').trim();
    if (!cleanQ) {
      const topClients = await pool.query(
        `SELECT id, telephone, nom, points_solde, cagnotte_fcfa, nb_visites, total_depense, tampons_actuels, rang_fidelite, derniere_visite
         FROM boutique_clients_fidelite
         WHERE boutique_id = $1
         ORDER BY total_depense DESC LIMIT 20`,
        [boutique.id]
      );
      return res.json({ clients: topClients.rows, parametres: boutique });
    }

    const searchNum = cleanQ.replace(/\D/g, '');
    const r = await pool.query(
      `SELECT id, telephone, nom, points_solde, cagnotte_fcfa, nb_visites, total_depense, tampons_actuels, rang_fidelite, derniere_visite
       FROM boutique_clients_fidelite
       WHERE boutique_id = $1 AND (
         LOWER(nom) LIKE LOWER($2) OR
         telephone LIKE $3 OR
         ($4 <> '' AND REPLACE(telephone, ' ', '') LIKE '%' || $4 || '%')
       )
       ORDER BY total_depense DESC LIMIT 15`,
      [boutique.id, `%${cleanQ}%`, `%${cleanQ}%`, searchNum]
    );

    res.json({ clients: r.rows, parametres: boutique });
  } catch (err) {
    console.error('[FIDELITE RECHERCHER ERR]', err);
    res.status(500).json({ error: 'Erreur recherche fidélité' });
  }
});

// ── POST /api/boutiques/:id/fidelite/enroler — Créer ou mettre à jour un client fidélité
router.post('/:id/fidelite/enroler', tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const { telephone, nom, client_id, terminal_token } = req.body;
    if (!telephone || !nom) return res.status(400).json({ error: 'Nom et Téléphone requis' });

    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(`SELECT id, caisse_token FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`, [idParam]);
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutique = bRes.rows[0];
    const boutiqueId = boutique.id;

    let accessGranted = false;
    if (req.user?.userId) {
      const bqAccess = await checkBoutiqueAccess(idParam, req.user.userId);
      if (bqAccess) accessGranted = true;
    }
    if (!accessGranted) {
      const tokenToTest = terminal_token || req.headers['x-terminal-token'] || req.query.token;
      if (tokenToTest && boutique.caisse_token && boutique.caisse_token === tokenToTest) {
        accessGranted = true;
      }
    }
    if (!accessGranted) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const cleanTel = telephone.trim();
    const cleanNom = nom.trim();

    const upsertRes = await pool.query(
      `INSERT INTO boutique_clients_fidelite (boutique_id, client_id, telephone, nom)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (boutique_id, telephone)
       DO UPDATE SET nom = EXCLUDED.nom, updated_at = NOW()
       RETURNING *`,
      [boutiqueId, client_id || null, cleanTel, cleanNom]
    );

    res.status(201).json({ success: true, client: upsertRes.rows[0] });
  } catch (err) {
    console.error('[FIDELITE ENROLER ERR]', err);
    res.status(500).json({ error: 'Erreur enrôlement fidélité' });
  }
});

// ── GET /api/boutiques/:id/avoirs/valider/:code — Vérifier la validité d'un bon d'avoir
router.get('/:id/avoirs/valider/:code', tokenOptional, async (req, res) => {
  try {
    const { id, code } = req.params;
    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    const bRes = await pool.query(`SELECT id FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`, [id]);
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutiqueId = bRes.rows[0].id;

    const avRes = await pool.query(
      `SELECT * FROM caisse_avoirs
       WHERE boutique_id = $1 AND UPPER(code) = UPPER($2) AND statut = 'actif'
       AND (date_expiration IS NULL OR date_expiration >= CURRENT_DATE) LIMIT 1`,
      [boutiqueId, code.trim()]
    );

    if (!avRes.rows[0]) {
      return res.status(404).json({ valide: false, error: 'Bon d’avoir introuvable, déjà utilisé ou expiré' });
    }

    res.json({ valide: true, avoir: avRes.rows[0] });
  } catch (err) {
    console.error('[AVOIR VALIDER ERR]', err);
    res.status(500).json({ error: 'Erreur vérification bon d’avoir' });
  }
});

// ── POST /api/boutiques/:id/avoirs/creer — Émettre un bon d'avoir suite à un retour
router.post('/:id/avoirs/creer', tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const { montant, client_nom, client_telephone, ticket_origine_ref, jours_validite, terminal_token } = req.body;
    if (!montant || Number(montant) <= 0) return res.status(400).json({ error: 'Montant invalide' });

    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(`SELECT id, caisse_token FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`, [idParam]);
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutique = bRes.rows[0];
    const boutiqueId = boutique.id;

    let accessGranted = false;
    if (req.user?.userId) {
      const bqAccess = await checkBoutiqueAccess(idParam, req.user.userId);
      if (bqAccess) accessGranted = true;
    }
    if (!accessGranted) {
      const tokenToTest = terminal_token || req.headers['x-terminal-token'] || req.query.token;
      if (tokenToTest && boutique.caisse_token && boutique.caisse_token === tokenToTest) {
        accessGranted = true;
      }
    }
    if (!accessGranted) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const codeAvoir = `AV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const jours = Number(jours_validite) || 90;

    const avRes = await pool.query(
      `INSERT INTO caisse_avoirs (
         boutique_id, code, montant_initial, montant_restant,
         client_nom, client_telephone, ticket_origine_ref,
         statut, date_expiration, created_at, updated_at
       ) VALUES ($1, $2, $3, $3, $4, $5, $6, 'actif', CURRENT_DATE + ($7 || ' days')::INTERVAL, NOW(), NOW())
       RETURNING *`,
      [boutiqueId, codeAvoir, Number(montant), client_nom || null, client_telephone || null, ticket_origine_ref || null, jours]
    );

    res.status(201).json({ success: true, avoir: avRes.rows[0] });
  } catch (err) {
    console.error('[AVOIR CREER ERR]', err);
    res.status(500).json({ error: 'Erreur création bon d’avoir' });
  }
});

// ── GET /api/boutiques/:id/pos-historique — Récupérer l'historique des ventes POS
router.get('/:id/bons-achat/:code', tokenOptional, param('id').isUUID(), async (req, res) => {
  try {
    const { id: boutiqueId, code } = req.params;
    const r = await pool.query(
      `SELECT * FROM caisse_bons_achat WHERE boutique_id=$1 AND code=$2 AND actif=true AND (date_expiration IS NULL OR date_expiration >= CURRENT_DATE)`,
      [boutiqueId, code.trim()]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Bon d’achat invalide ou expiré' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('[GET BON ACHAT ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/bons-achat — Émettre avoir
router.post('/:id/bons-achat', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé aux avoirs de cette boutique' });
    }
    const boutiqueId = b.id;
    const { client_id, valeur, code, date_expiration } = req.body;

    const uniqueCode = code || `AVOIR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const r = await pool.query(
      `INSERT INTO caisse_bons_achat (boutique_id, client_id, code, valeur_initiale, solde_restant, date_expiration)
       VALUES ($1, $2, $3, $4, $4, $5) RETURNING *`,
      [boutiqueId, client_id || null, uniqueCode, Number(valeur), date_expiration || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('[POST BON ACHAT ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── CRUD Fournisseurs
router.get('/:id/promotions', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const r = await pool.query(
      `SELECT * FROM boutique_promotions WHERE boutique_id = $1 ORDER BY created_at DESC`,
      [bq.id]
    );
    res.json({ promotions: r.rows });
  } catch (err) {
    console.error('[GET PROMOTIONS ERR]', err);
    res.status(500).json({ error: 'Erreur lors du chargement des promotions' });
  }
});

// ── Spec 03 : POST /api/boutiques/:id/promotions — Créer un code promo (Marchand)
router.post('/:id/promotions', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { code, type_remise, valeur, min_achat, limite_utilisation, fin } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Le code promo est obligatoire.' });
    }
    if (!type_remise || !['pourcentage', 'fixe', 'livraison_offerte'].includes(type_remise)) {
      return res.status(400).json({ error: 'Type de remise invalide. Choix: pourcentage, fixe, livraison_offerte.' });
    }
    if (valeur === undefined || isNaN(Number(valeur)) || Number(valeur) < 0) {
      return res.status(400).json({ error: 'La valeur de la remise doit être un nombre positif.' });
    }

    const cleanCode = code.trim().toUpperCase();

    const r = await pool.query(
      `INSERT INTO boutique_promotions (
        boutique_id, code, type_remise, valeur, min_achat, limite_utilisation, fin
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        bq.id, cleanCode, type_remise, Number(valeur),
        Number(min_achat) || 0,
        limite_utilisation ? Number(limite_utilisation) : null,
        fin ? new Date(fin) : null
      ]
    );

    res.status(201).json({ success: true, promotion: r.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Un code promo portant ce nom existe déjà pour cette boutique.' });
    }
    console.error('[POST PROMOTION ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la création du code promo' });
  }
});

// ── Spec 03 : DELETE /api/boutiques/:id/promotions/:promoId — Supprimer un code promo
router.delete('/:id/promotions/:promoId', verifierToken, param('id').isUUID(), param('promoId').isUUID(), async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    await pool.query(
      `DELETE FROM boutique_promotions WHERE id = $1 AND boutique_id = $2`,
      [req.params.promoId, bq.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE PROMOTION ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// ── Spec 03 : POST /api/promotions/valider (ou /api/boutiques/:id/promotions/valider)
router.post(['/promotions/valider', '/valider', '/:id/promotions/valider'], async (req, res) => {
  try {
    const boutique_id = req.params.id || req.body.boutique_id;
    const { code, total_panier } = req.body;

    if (!boutique_id) return res.status(400).json({ valide: false, error: 'Boutique ID requis' });
    if (!code || !code.trim()) return res.status(400).json({ valide: false, error: 'Code promo requis' });

    const total = Number(total_panier) || 0;
    const cleanCode = code.trim().toUpperCase();

    // 1. Vérification du code promo global plateforme (Admin Settings)
    const platformPromoActive = await cfg.getBool('promo_active');
    const platformPromoCode = ((await cfg.get('promo_code')) || '').trim().toUpperCase();
    const platformPromoReduc = (await cfg.getNum('promo_reduction')) || 0;

    // Si l'utilisateur saisit le code promo plateforme (ex: SOLDE20 / NOPALOU25)
    if (platformPromoCode && cleanCode === platformPromoCode) {
      if (!platformPromoActive) {
        return res.status(400).json({ valide: false, error: 'Ce code promo a été désactivé dans l\'administration.' });
      }
      const reduction = Math.round((total * platformPromoReduc) / 100);
      const nouveauTotal = Math.max(0, total - reduction);
      return res.json({
        valide: true,
        code: platformPromoCode,
        type_remise: 'pourcentage',
        valeur: platformPromoReduc,
        montant_reduction: reduction,
        nouveau_total: nouveauTotal,
        message: 'Code promo plateforme appliqué avec succès !'
      });
    }

    // 2. Vérification dans les promotions propres à la boutique
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(boutique_id);
    let targetBoutiqueId = boutique_id;
    if (!isUUID) {
      const bqRes = await pool.query('SELECT id FROM boutiques WHERE slug = $1', [boutique_id]);
      if (bqRes.rows[0]) targetBoutiqueId = bqRes.rows[0].id;
    }

    const r = await pool.query(
      `SELECT * FROM boutique_promotions
       WHERE boutique_id = $1 AND UPPER(code) = $2 AND actif = true`,
      [targetBoutiqueId, cleanCode]
    );

    if (!r.rows[0]) {
      return res.status(400).json({ valide: false, error: 'Code promo expiré ou invalide.' });
    }

    const promo = r.rows[0];

    if (promo.fin && new Date(promo.fin) < new Date()) {
      return res.status(400).json({ valide: false, error: 'Ce code promo a expiré.' });
    }

    if (promo.limite_utilisation !== null && promo.fois_utilise >= promo.limite_utilisation) {
      return res.status(400).json({ valide: false, error: 'La limite d\'utilisation de ce code est atteinte.' });
    }

    if (promo.min_achat && total < Number(promo.min_achat)) {
      return res.status(400).json({
        valide: false,
        error: `Ce code nécessite un achat minimum de ${Number(promo.min_achat).toLocaleString('fr-FR')} FCFA.`
      });
    }

    let reduction = 0;
    if (promo.type_remise === 'pourcentage') {
      reduction = Math.round((total * Number(promo.valeur)) / 100);
    } else if (promo.type_remise === 'fixe') {
      reduction = Math.min(total, Number(promo.valeur));
    } else if (promo.type_remise === 'livraison_offerte') {
      reduction = Number(promo.valeur) || 0;
    }

    const nouveauTotal = Math.max(0, total - reduction);

    res.json({
      valide: true,
      code: promo.code,
      type_remise: promo.type_remise,
      valeur: Number(promo.valeur),
      montant_reduction: reduction,
      nouveau_total: nouveauTotal,
      message: 'Code promo appliqué avec succès !'
    });
  } catch (err) {
    console.error('[PROMO VALIDATE ERR]', err);
    res.status(500).json({ valide: false, error: 'Erreur lors de la vérification du code promo' });
  }
});

// ── Spec 04 : PUT /api/boutiques/:id/pixels — Enregistrer les Pixel IDs (Marchand)
module.exports = router;
