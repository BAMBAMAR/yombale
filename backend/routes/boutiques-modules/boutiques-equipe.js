// backend/routes/boutiques-modules/boutiques-equipe.js
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
router.get('/:id/admins', verifierToken, param('id').isUUID(), async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });
    
    // Renvoyer le propriétaire et les admins
    const { rows } = await pool.query(
      `SELECT u.id, u.nom, u.email, 'propriétaire' as role, b.created_at
       FROM boutiques b JOIN utilisateurs u ON b.utilisateur_id = u.id
       WHERE b.id = $1
       UNION
       SELECT u.id, u.nom, u.email, bu.role, bu.created_at
       FROM boutique_utilisateurs bu JOIN utilisateurs u ON bu.utilisateur_id = u.id
       WHERE bu.boutique_id = $1
       ORDER BY created_at ASC`,
      [bq.id]
    );
    res.json({ admins: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:id/admins', verifierToken, param('id').isUUID(), body('email').isEmail(), async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
  try {
    // Seul le propriétaire ou un admin peut ajouter
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { email } = req.body;
    const userRes = await pool.query('SELECT id FROM utilisateurs WHERE email = $1', [email]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const targetUserId = userRes.rows[0].id;
    
    if (bq.utilisateur_id === targetUserId) return res.status(400).json({ error: 'Déjà propriétaire' });

    await pool.query(
      'INSERT INTO boutique_utilisateurs (boutique_id, utilisateur_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, targetUserId]
    );

    // Audit log
    enregistrerAuditLog(req.params.id, req.user.userId, req.user.nom || 'Marchand', 'admin_ajoute', `Ajout d'un administrateur web (${email})`, { target_user_id: targetUserId, email }, req);

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id/admins/:userId', verifierToken, param('id').isUUID(), param('userId').isUUID(), async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    // On ne peut pas supprimer le propriétaire (utilisateur_id de la boutique)
    if (bq.utilisateur_id === req.params.userId) return res.status(400).json({ error: 'Impossible de supprimer le propriétaire' });

    await pool.query(
      'DELETE FROM boutique_utilisateurs WHERE boutique_id = $1 AND utilisateur_id = $2',
      [req.params.id, req.params.userId]
    );

    // Audit log
    enregistrerAuditLog(req.params.id, req.user.userId, req.user.nom || 'Marchand', 'admin_supprime', `Retrait d'un administrateur web (${req.params.userId})`, { target_user_id: req.params.userId }, req);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/boutiques/:id/avis — Avis & notes certifiés de la boutique
router.get('/:id/caissiers', tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(`SELECT id, nom, utilisateur_id FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`, [idParam]);
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutiqueId = bRes.rows[0].id;
    const utilisateurId = bRes.rows[0].utilisateur_id;

    const r = await pool.query(
      `SELECT id, nom, prenom, code_pin, role, actif, created_at
       FROM boutique_caissiers
       WHERE boutique_id = $1
       ORDER BY created_at ASC`,
      [boutiqueId]
    );

    // Caissiers par défaut si la table est vide
    if (r.rows.length === 0) {
      let gerantNom = 'Propriétaire';
      let gerantPrenom = 'Gérant';

      if (utilisateurId) {
        try {
          const uRes = await pool.query('SELECT nom, prenom FROM utilisateurs WHERE id=$1', [utilisateurId]);
          if (uRes.rows[0]?.nom) gerantNom = uRes.rows[0].nom;
          if (uRes.rows[0]?.prenom) gerantPrenom = uRes.rows[0].prenom;
        } catch (eU) {}
      }

      const def1 = await pool.query(
        `INSERT INTO boutique_caissiers (boutique_id, nom, prenom, code_pin, role)
         VALUES ($1, $2, $3, '0000', 'superviseur'),
                ($1, 'Principal', 'Caissier', '1234', 'caissier')
         RETURNING id, nom, prenom, code_pin, role, actif, created_at`,
        [boutiqueId, gerantNom, gerantPrenom]
      );
      return res.json({ caissiers: def1.rows });
    }

    res.json({ caissiers: r.rows });
  } catch (err) {
    console.error('[GET CAISSIERS ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des caissiers' });
  }
});

// POST /api/boutiques/:id/caissiers — Créer caissier
router.post('/:id/caissiers', tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const { nom, prenom, code_pin, role, terminal_token, superviseur_pin } = req.body;
    if (!nom || !code_pin) return res.status(400).json({ error: 'Nom et Code PIN requis' });

    let bq = null;
    if (req.user?.userId) {
      bq = await checkBoutiqueAccess(idParam, req.user.userId);
    }
    if (!bq) {
      const tokenToTest = terminal_token || req.headers['x-terminal-token'] || req.query.token;
      const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
      const bRes = await pool.query(
        `SELECT id, caisse_token FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`,
        [idParam]
      );
      if (bRes.rows[0]) {
        const boutique = bRes.rows[0];
        if (tokenToTest && (boutique.caisse_token === tokenToTest || boutique.id === tokenToTest)) {
          bq = boutique;
        } else if (superviseur_pin) {
          const supRes = await pool.query(
            `SELECT id FROM boutique_caissiers WHERE boutique_id = $1 AND code_pin = $2 AND (role = 'superviseur' OR role = 'admin') AND actif = TRUE`,
            [boutique.id, String(superviseur_pin).trim()]
          );
          if (supRes.rows[0]) bq = boutique;
        }
      }
    }
    if (!bq) return res.status(403).json({ error: 'Accès refusé ou Boutique introuvable' });

    const pinStr = String(code_pin).trim();
    const codesInterdits = ['1234', '0000', '9999', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '1212'];
    if (codesInterdits.includes(pinStr)) {
      return res.status(400).json({ error: 'Code PIN trop simple ou par défaut. Veuillez choisir un code à 4 chiffres personnalisé.' });
    }
    if (!/^\d{4,6}$/.test(pinStr)) {
      return res.status(400).json({ error: 'Le code PIN doit comporter entre 4 et 6 chiffres numériques.' });
    }

    const r = await pool.query(
      `INSERT INTO boutique_caissiers (boutique_id, nom, prenom, code_pin, role)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'caissier'))
       RETURNING id, nom, prenom, code_pin, role, actif, created_at`,
      [bq.id, nom.trim(), prenom ? prenom.trim() : null, pinStr, role]
    );

    if (req.user?.userId) {
      enregistrerAuditLog(bq.id, req.user.userId, req.user.nom || 'Marchand', 'caissier_cree', `Création du caissier POS "${r.rows[0].prenom || ''} ${r.rows[0].nom}".trim()`, { caissier_id: r.rows[0].id, role: r.rows[0].role }, req);
    }

    res.status(201).json({ success: true, caissier: r.rows[0] });
  } catch (err) {
    console.error('[POST CAISSIER ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la création du caissier' });
  }
});

// PUT /api/boutiques/:id/caissiers/:caissierId
router.put('/:id/caissiers/:caissierId', tokenOptional, async (req, res) => {
  try {
    const { code_pin, actif, nom, prenom, role, terminal_token, superviseur_pin } = req.body;
    const idParam = req.params.id;

    let bq = null;
    if (req.user?.userId) {
      bq = await checkBoutiqueAccess(idParam, req.user.userId);
    }
    if (!bq) {
      const tokenToTest = terminal_token || req.headers['x-terminal-token'] || req.query.token;
      const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
      const bRes = await pool.query(
        `SELECT id, caisse_token FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`,
        [idParam]
      );
      if (bRes.rows[0]) {
        const boutique = bRes.rows[0];
        if (tokenToTest && (boutique.caisse_token === tokenToTest || boutique.id === tokenToTest)) {
          bq = boutique;
        } else if (superviseur_pin) {
          const supRes = await pool.query(
            `SELECT id FROM boutique_caissiers WHERE boutique_id = $1 AND code_pin = $2 AND (role = 'superviseur' OR role = 'admin') AND actif = TRUE`,
            [boutique.id, String(superviseur_pin).trim()]
          );
          if (supRes.rows[0]) bq = boutique;
        }
      }
    }
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    let queryParts = [];
    let values = [req.params.caissierId, bq.id];
    let vIndex = 3;

    if (nom !== undefined && String(nom).trim()) {
      queryParts.push(`nom = $${vIndex++}`);
      values.push(String(nom).trim());
    }
    if (prenom !== undefined) {
      queryParts.push(`prenom = $${vIndex++}`);
      values.push(prenom ? String(prenom).trim() : null);
    }
    if (role !== undefined && (role === 'caissier' || role === 'superviseur')) {
      queryParts.push(`role = $${vIndex++}`);
      values.push(role);
    }
    if (code_pin !== undefined && String(code_pin).trim()) {
      const pinStr = String(code_pin).trim();
      const codesInterdits = ['1234', '0000', '9999', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '1212'];
      if (codesInterdits.includes(pinStr)) {
        return res.status(400).json({ error: 'Code PIN trop simple ou par défaut. Veuillez choisir un code à 4 chiffres personnalisé.' });
      }
      if (!/^\d{4,6}$/.test(pinStr)) {
        return res.status(400).json({ error: 'Le code PIN doit comporter entre 4 et 6 chiffres numériques.' });
      }
      queryParts.push(`code_pin = $${vIndex++}`);
      values.push(pinStr);
    }
    if (actif !== undefined) {
      queryParts.push(`actif = $${vIndex++}`);
      values.push(Boolean(actif));
    }

    if (queryParts.length === 0) return res.json({ success: true });

    const q = `UPDATE boutique_caissiers SET ${queryParts.join(', ')} WHERE id = $1 AND boutique_id = $2 RETURNING id, nom, prenom, code_pin, role, actif, created_at`;
    const r = await pool.query(q, values);
    if (!r.rows[0]) return res.status(404).json({ error: 'Caissier introuvable' });

    if (req.user?.userId) {
      enregistrerAuditLog(bq.id, req.user.userId, req.user.nom || 'Marchand', 'caissier_modifie', `Modification du caissier POS "${r.rows[0].nom}"`, { caissier_id: req.params.caissierId }, req);
    }

    res.json({ success: true, caissier: r.rows[0] });
  } catch (err) {
    console.error('[PUT CAISSIER ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
});

// PATCH /api/boutiques/:id/caissiers/:caissierId (Alias modification partielle)
router.patch('/:id/caissiers/:caissierId', tokenOptional, async (req, res) => {
  try {
    const { actif, nom, prenom, role, code_pin, terminal_token, superviseur_pin } = req.body;
    const idParam = req.params.id;

    let bq = null;
    if (req.user?.userId) {
      bq = await checkBoutiqueAccess(idParam, req.user.userId);
    }
    if (!bq) {
      const tokenToTest = terminal_token || req.headers['x-terminal-token'] || req.query.token;
      const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
      const bRes = await pool.query(
        `SELECT id, caisse_token FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`,
        [idParam]
      );
      if (bRes.rows[0]) {
        const boutique = bRes.rows[0];
        if (tokenToTest && (boutique.caisse_token === tokenToTest || boutique.id === tokenToTest)) {
          bq = boutique;
        } else if (superviseur_pin) {
          const supRes = await pool.query(
            `SELECT id FROM boutique_caissiers WHERE boutique_id = $1 AND code_pin = $2 AND (role = 'superviseur' OR role = 'admin') AND actif = TRUE`,
            [boutique.id, String(superviseur_pin).trim()]
          );
          if (supRes.rows[0]) bq = boutique;
        }
      }
    }
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    let queryParts = [];
    let values = [req.params.caissierId, bq.id];
    let vIndex = 3;

    if (nom !== undefined && String(nom).trim()) {
      queryParts.push(`nom = $${vIndex++}`);
      values.push(String(nom).trim());
    }
    if (prenom !== undefined) {
      queryParts.push(`prenom = $${vIndex++}`);
      values.push(prenom ? String(prenom).trim() : null);
    }
    if (role !== undefined && (role === 'caissier' || role === 'superviseur')) {
      queryParts.push(`role = $${vIndex++}`);
      values.push(role);
    }
    if (code_pin !== undefined && String(code_pin).trim()) {
      const pinStr = String(code_pin).trim();
      const codesInterdits = ['1234', '0000', '9999', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '1212'];
      if (codesInterdits.includes(pinStr)) {
        return res.status(400).json({ error: 'Code PIN trop simple ou par défaut. Veuillez choisir un code personnalisé.' });
      }
      if (!/^\d{4,6}$/.test(pinStr)) {
        return res.status(400).json({ error: 'Le code PIN doit comporter entre 4 et 6 chiffres numériques.' });
      }
      queryParts.push(`code_pin = $${vIndex++}`);
      values.push(pinStr);
    }
    if (actif !== undefined) {
      queryParts.push(`actif = $${vIndex++}`);
      values.push(Boolean(actif));
    }

    if (queryParts.length === 0) return res.json({ success: true });

    const q = `UPDATE boutique_caissiers SET ${queryParts.join(', ')} WHERE id = $1 AND boutique_id = $2 RETURNING id, nom, prenom, code_pin, role, actif, created_at`;
    const r = await pool.query(q, values);
    if (!r.rows[0]) return res.status(404).json({ error: 'Caissier introuvable' });

    if (req.user?.userId) {
      enregistrerAuditLog(bq.id, req.user.userId, req.user.nom || 'Marchand', 'caissier_modifie', `Modification du caissier POS "${r.rows[0].nom}"`, { caissier_id: req.params.caissierId }, req);
    }

    res.json({ success: true, caissier: r.rows[0] });
  } catch (err) {
    console.error('[PATCH CAISSIER ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
});

// PUT /api/boutiques/:id/caissiers/:caissierId/pin — Modification dédiée du PIN caissier
router.put('/:id/caissiers/:caissierId/pin', tokenOptional, async (req, res) => {
  try {
    const { code_pin, terminal_token, superviseur_pin } = req.body;
    const idParam = req.params.id;
    const pinStr = code_pin ? String(code_pin).trim() : '';

    if (!pinStr) return res.status(400).json({ error: 'Code PIN requis' });

    const codesInterdits = ['1234', '0000', '9999', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '1212'];
    if (codesInterdits.includes(pinStr)) {
      return res.status(400).json({ error: 'Code PIN trop simple ou par défaut. Veuillez choisir un code à 4 chiffres personnalisé.' });
    }
    if (!/^\d{4,6}$/.test(pinStr)) {
      return res.status(400).json({ error: 'Le code PIN doit comporter entre 4 et 6 chiffres numériques.' });
    }

    let bq = null;
    if (req.user?.userId) {
      bq = await checkBoutiqueAccess(idParam, req.user.userId);
    }
    if (!bq) {
      const tokenToTest = terminal_token || req.headers['x-terminal-token'] || req.query.token;
      const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
      const bRes = await pool.query(
        `SELECT id, caisse_token FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`,
        [idParam]
      );
      if (bRes.rows[0]) {
        const boutique = bRes.rows[0];
        if (tokenToTest && (boutique.caisse_token === tokenToTest || boutique.id === tokenToTest)) {
          bq = boutique;
        } else if (superviseur_pin) {
          const supRes = await pool.query(
            `SELECT id FROM boutique_caissiers WHERE boutique_id = $1 AND code_pin = $2 AND (role = 'superviseur' OR role = 'admin') AND actif = TRUE`,
            [boutique.id, String(superviseur_pin).trim()]
          );
          if (supRes.rows[0]) bq = boutique;
        }
      }
    }
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const r = await pool.query(
      `UPDATE boutique_caissiers SET code_pin = $1 WHERE id = $2 AND boutique_id = $3 RETURNING id, nom, prenom, role, actif`,
      [pinStr, req.params.caissierId, bq.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Caissier introuvable' });

    if (req.user?.userId) {
      enregistrerAuditLog(bq.id, req.user.userId, req.user.nom || 'Marchand', 'caissier_pin_modifie', `Modification du code PIN du caissier #${req.params.caissierId}`, { caissier_id: req.params.caissierId }, req);
    }

    res.json({ success: true, caissier: r.rows[0] });
  } catch (err) {
    console.error('[PUT CAISSIER PIN ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la modification du code PIN' });
  }
});

// POST /api/boutiques/:id/caisse/config-pin-initial (avec alias /caissiers/config-pin-initial)
router.post(['/:id/caisse/config-pin-initial', '/:id/caissiers/config-pin-initial', '/:id/config-pin-initial'], tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const { pin_superviseur, pin_caissier, terminal_token } = req.body;

    const pinSup = pin_superviseur ? String(pin_superviseur).trim() : '';
    const pinCai = pin_caissier ? String(pin_caissier).trim() : '';

    if (!pinSup || !pinCai) {
      return res.status(400).json({ success: false, error: 'Les deux codes PIN (Superviseur et Caissier) sont obligatoires.' });
    }

    if (!/^\d{4,6}$/.test(pinSup) || !/^\d{4,6}$/.test(pinCai)) {
      return res.status(400).json({ success: false, error: 'Chaque code PIN doit comporter entre 4 et 6 chiffres numériques.' });
    }

    const codesInterdits = ['1234', '0000', '9999', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '1212'];
    if (codesInterdits.includes(pinSup)) {
      return res.status(400).json({ success: false, error: 'Le code PIN Superviseur est trop trivial. Choisissez un code personnalisé.' });
    }

    let bq = null;
    if (req.user?.userId) {
      bq = await checkBoutiqueAccess(idParam, req.user.userId);
    }
    if (!bq) {
      const tokenToTest = terminal_token || req.headers['x-terminal-token'] || req.query.token;
      const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
      const bRes = await pool.query(
        `SELECT id, caisse_token FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`,
        [idParam]
      );
      if (bRes.rows[0]) {
        const boutique = bRes.rows[0];
        if (tokenToTest && (boutique.caisse_token === tokenToTest || boutique.id === tokenToTest)) {
          bq = boutique;
        }
      }
    }
    if (!bq) return res.status(403).json({ success: false, error: 'Accès non autorisé à cette boutique.' });

    // 1. Mettre à jour ou créer le profil superviseur
    const supRes = await pool.query(
      `SELECT id FROM boutique_caissiers WHERE boutique_id = $1 AND (role = 'superviseur' OR role = 'admin') ORDER BY created_at ASC LIMIT 1`,
      [bq.id]
    );
    if (supRes.rows[0]) {
      await pool.query(
        `UPDATE boutique_caissiers SET code_pin = $1, actif = TRUE WHERE id = $2`,
        [pinSup, supRes.rows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO boutique_caissiers (boutique_id, nom, prenom, code_pin, role, actif)
         VALUES ($1, 'Gérant', 'Superviseur', $2, 'superviseur', TRUE)`,
        [bq.id, pinSup]
      );
    }

    // 2. Mettre à jour ou créer le profil caissier standard
    const caiRes = await pool.query(
      `SELECT id FROM boutique_caissiers WHERE boutique_id = $1 AND role = 'caissier' ORDER BY created_at ASC LIMIT 1`,
      [bq.id]
    );
    if (caiRes.rows[0]) {
      await pool.query(
        `UPDATE boutique_caissiers SET code_pin = $1, actif = TRUE WHERE id = $2`,
        [pinCai, caiRes.rows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO boutique_caissiers (boutique_id, nom, prenom, code_pin, role, actif)
         VALUES ($1, 'Caissier', 'Standard', $2, 'caissier', TRUE)`,
        [bq.id, pinCai]
      );
    }

    if (req.user?.userId) {
      enregistrerAuditLog(
        bq.id,
        req.user.userId,
        req.user.nom || 'Marchand',
        'pos_pin_initialise',
        'Initialisation sécurisée des codes PIN Superviseur et Caissier',
        {},
        req
      );
    }

    return res.json({ success: true, message: 'Codes PIN initialisés avec succès.' });
  } catch (err) {
    console.error('[CONFIG PIN INITIAL ERR]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de l’initialisation des codes PIN.' });
  }
});

// DELETE /api/boutiques/:id/caissiers/:caissierId
router.delete('/:id/caissiers/:caissierId', verifierToken, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const r = await pool.query(
      'DELETE FROM boutique_caissiers WHERE id = $1 AND boutique_id = $2 RETURNING id',
      [req.params.caissierId, bq.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Caissier introuvable' });

    enregistrerAuditLog(bq.id, req.user.userId, req.user.nom || 'Marchand', 'caissier_supprime', `Suppression du caissier POS #${req.params.caissierId}`, { caissier_id: req.params.caissierId }, req);

    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE CAISSIER ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// POST /api/boutiques/:id/caissiers/verifier-pin
router.post('/:id/caissiers/verifier-pin', tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const { code_pin } = req.body;
    if (!code_pin) return res.status(400).json({ error: 'Code PIN requis' });

    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(`SELECT id FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`, [idParam]);
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutiqueId = bRes.rows[0].id;

    // Sécurité P0 : Ne jamais renvoyer code_pin dans l'objet caissier retourné
    const r = await pool.query(
      `SELECT id, nom, prenom, role
       FROM boutique_caissiers
       WHERE boutique_id = $1 AND code_pin = $2 AND actif = TRUE`,
      [boutiqueId, code_pin.trim()]
    );

    if (r.rows[0]) {
      return res.json({ valide: true, caissier: r.rows[0] });
    }

    res.json({ valide: false, message: 'Code PIN incorrect' });
  } catch (err) {
    console.error('[VERIFIER PIN ERR]', err);
    res.status(500).json({ error: 'Erreur de vérification PIN' });
  }
});

// GET /api/boutiques/:id/pos-sessions — Historique filtrable des sessions de caisse (Rapports Z)
module.exports = router;
