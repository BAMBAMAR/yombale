// backend/routes/boutiques-modules/boutiques-fournisseurs.js
const router = require('express').Router();
const { param, validationResult } = require('express-validator');
const { pool } = require('../../models/db');
const { verifierToken } = require('../../middlewares/auth');
const { syncProduit } = require('../../services/whatsapp-catalog');
const { enregistrerAuditLog } = require('../../lib/auditLogger');
const { checkBoutiqueAccess } = require('./helpers');

router.get('/:id/fournisseurs', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé aux fournisseurs' });
    }
    const { rows } = await pool.query(`SELECT * FROM fournisseurs WHERE boutique_id = $1 ORDER BY nom ASC`, [b.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:id/fournisseurs', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    const { nom, telephone, email, adresse, ninea } = req.body;
    const r = await pool.query(
      `INSERT INTO fournisseurs (boutique_id, nom, telephone, email, adresse, ninea)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [b.id, nom, telephone || null, email || null, adresse || null, ninea || null]
    );

    enregistrerAuditLog(b.id, req.user?.userId || null, req.user?.nom || null, 'fournisseur_cree', `Création du fournisseur "${nom}"`, { nom, telephone, email }, req);

    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/fournisseurs/:fId', verifierToken, param('id').isUUID(), param('fId').isUUID(), async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    const { nom, telephone, email, adresse, ninea, solde_du } = req.body;
    await pool.query(
      `UPDATE fournisseurs
       SET nom = $1, telephone = $2, email = $3, adresse = $4, ninea = $5, solde_du = $6
       WHERE id = $7 AND boutique_id = $8`,
      [nom, telephone, email, adresse, ninea, solde_du !== undefined ? Number(solde_du) : 0, req.params.fId, b.id]
    );

    enregistrerAuditLog(b.id, req.user?.userId || null, req.user?.nom || null, 'fournisseur_modifie', `Modification du fournisseur "${nom}"`, { nom, solde_du }, req);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id/fournisseurs/:fId', verifierToken, param('id').isUUID(), param('fId').isUUID(), async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    await pool.query(`DELETE FROM fournisseurs WHERE id = $1 AND boutique_id = $2`, [req.params.fId, b.id]);

    enregistrerAuditLog(b.id, req.user?.userId || null, req.user?.nom || null, 'fournisseur_supprime', `Suppression du fournisseur #${req.params.fId}`, {}, req);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── CRUD Commandes Fournisseurs
router.get('/:id/commandes-fournisseurs', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé aux commandes fournisseurs' });
    }
    const { rows } = await pool.query(
      `SELECT c.*, f.nom as fournisseur_nom
       FROM bons_commande_fournisseur c
       JOIN fournisseurs f ON c.fournisseur_id = f.id
       WHERE c.boutique_id = $1 ORDER BY c.created_at DESC`,
      [b.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:id/commandes-fournisseurs', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé aux commandes fournisseurs' });
    }
    const { fournisseur_id, items, date_livraison, justificatif_url } = req.body;
    const itemsArray = Array.isArray(items) ? items : [];
    const total = itemsArray.reduce((acc, item) => acc + (Number(item.prix_achat || item.prixAchat || 0) * Number(item.quantite || 1)), 0);
    const reference = `CMD-FOURN-${Date.now().toString().slice(-8)}`;

    const r = await pool.query(
      `INSERT INTO bons_commande_fournisseur (boutique_id, fournisseur_id, reference, items, montant_total, date_livraison, justificatif_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [b.id, fournisseur_id, reference, JSON.stringify(itemsArray), total, date_livraison || null, justificatif_url || null]
    );

    enregistrerAuditLog(b.id, req.user?.userId || null, req.user?.nom || null, 'commande_fournisseur_creee', `Création d'un bon de commande fournisseur #${reference} (${total} FCFA)`, { reference, montant: total }, req);

    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('[POST CMD FOURN ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/commandes-fournisseurs/:cId', verifierToken, param('id').isUUID(), param('cId').isUUID(), async (req, res) => {
  try {
    const { id: idParam, cId } = req.params;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé aux commandes fournisseurs' });
    }
    const boutiqueId = b.id;
    const { statut, date_livraison, fournisseur_id, items, justificatif_url } = req.body;

    const cmdRes = await pool.query(`SELECT * FROM bons_commande_fournisseur WHERE id=$1 AND boutique_id=$2`, [cId, boutiqueId]);
    if (!cmdRes.rows[0]) return res.status(404).json({ error: 'Commande introuvable' });
    const cmd = cmdRes.rows[0];

    const currentStatut = cmd.statut;
    const itemsArray = items !== undefined ? (Array.isArray(items) ? items : []) : null;
    const total = itemsArray ? itemsArray.reduce((acc, item) => acc + (Number(item.prix_achat || item.prixAchat || 0) * Number(item.quantite || 1)), 0) : Number(cmd.montant_total);

    await pool.query(
      `UPDATE bons_commande_fournisseur
       SET statut = COALESCE($1, statut),
           date_livraison = COALESCE($2, date_livraison),
           fournisseur_id = COALESCE($3, fournisseur_id),
           items = COALESCE($4, items),
           montant_total = $5,
           justificatif_url = COALESCE($6, justificatif_url),
           updated_at = NOW()
       WHERE id = $7`,
      [
        statut || null,
        date_livraison || null,
        fournisseur_id || null,
        itemsArray ? JSON.stringify(itemsArray) : null,
        total,
        justificatif_url || null,
        cId
      ]
    );

    const isTargetRecu = statut === 'recu' || statut === 'recue';
    const isAlreadyRecu = currentStatut === 'recu' || currentStatut === 'recue';

    // Stock & dépenses automatiques si reçue
    if (!isAlreadyRecu && isTargetRecu) {
      const activeItems = itemsArray || (typeof cmd.items === 'string' ? JSON.parse(cmd.items) : cmd.items);
      for (const item of activeItems) {
        let pMaj = null;
        if (item.id) {
          const upRes = await pool.query(
            `UPDATE boutique_produits
             SET stock_quantite = COALESCE(stock_quantite, 0) + $1,
                 en_stock = ((COALESCE(stock_quantite, 0) + $1) > 0),
                 updated_at = NOW()
             WHERE id = $2 AND boutique_id = $3
             RETURNING *`,
            [Number(item.quantite), item.id, boutiqueId]
          );
          pMaj = upRes.rows[0];
        } else if (item.nom) {
          const upRes = await pool.query(
            `UPDATE boutique_produits
             SET stock_quantite = COALESCE(stock_quantite, 0) + $1,
                 en_stock = ((COALESCE(stock_quantite, 0) + $1) > 0),
                 updated_at = NOW()
             WHERE LOWER(nom) = LOWER($2) AND boutique_id = $3
             RETURNING *`,
            [Number(item.quantite), item.nom.trim(), boutiqueId]
          );
          pMaj = upRes.rows[0];
        }

        if (pMaj) {
          setImmediate(async () => {
            try {
              const bQ = await pool.query('SELECT slug, whatsapp_catalog_id FROM boutiques WHERE id=$1', [boutiqueId]);
              await syncProduit({ ...pMaj, boutique_slug: bQ.rows[0]?.slug, whatsapp_catalog_id: bQ.rows[0]?.whatsapp_catalog_id });
            } catch {}
          });
        }
      }

      const justUrl = justificatif_url || cmd.justificatif_url || null;
      await pool.query(
        `INSERT INTO depenses (boutique_id, montant, categorie, description, date_depense, justificatif_url, bon_commande_id)
         VALUES ($1, $2, 'achat_marchandises', $3, CURRENT_DATE, $4, $5)`,
        [boutiqueId, total, `Achat fournisseur réf: ${cmd.reference}`, justUrl, cId]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[PUT CMD FOURN ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id/commandes-fournisseurs/:cId', verifierToken, param('id').isUUID(), param('cId').isUUID(), async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    await pool.query(`DELETE FROM bons_commande_fournisseur WHERE id = $1 AND boutique_id = $2`, [req.params.cId, b.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
module.exports = router;
