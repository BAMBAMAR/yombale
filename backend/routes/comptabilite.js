// backend/routes/comptabilite.js — Comptabilité boutique (stock, zones de livraison, ventes, factures PDF)
const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');
const axios = require('axios');
const multer = require('multer');
const { pool } = require('../models/db');
const { verifierToken, adminSecretOnly } = require('../middlewares/auth');
const { uploadBuffer } = require('../services/cloudinary');
const { enregistrerAuditLog } = require('../lib/auditLogger');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

async function fetchImageBuffer(url) {
  try {
    const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
    return Buffer.from(r.data);
  } catch { return null; }
}

// ── GET /api/comptabilite/admin/stats — agrégats ventes toutes boutiques (admin)
router.get('/admin/stats', adminSecretOnly, async (req, res) => {
  try {
    const [global, parBoutique, recentes] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int                          AS total_ventes,
          COALESCE(SUM(montant_total), 0)        AS chiffre_affaires_total,
          COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', NOW()) THEN montant_total END), 0) AS ca_mois,
          COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days'  THEN montant_total END), 0) AS ca_semaine,
          COUNT(DISTINCT boutique_id)::int       AS boutiques_actives
        FROM ventes
      `),
      pool.query(`
        SELECT b.nom AS boutique_nom, b.slug,
               COUNT(v.id)::int                   AS nb_ventes,
               COALESCE(SUM(v.montant_total), 0)  AS ca_total
        FROM boutiques b
        JOIN ventes v ON v.boutique_id = b.id
        GROUP BY b.id, b.nom, b.slug
        ORDER BY ca_total DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT v.reference, v.nom_produit, v.montant_total, v.methode_paiement,
               v.created_at, b.nom AS boutique_nom
        FROM ventes v
        JOIN boutiques b ON b.id = v.boutique_id
        ORDER BY v.created_at DESC
        LIMIT 30
      `),
    ]);

    res.json({
      global: global.rows[0],
      top_boutiques: parBoutique.rows,
      recentes: recentes.rows,
    });
  } catch (err) {
    console.error('[COMPTA ADMIN]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

async function ownsBoutique(boutiqueId, userId) {
  const r = await pool.query('SELECT id, nom, logo_url, telephone, adresse, ville FROM boutiques WHERE id=$1 AND utilisateur_id=$2', [boutiqueId, userId]);
  return r.rows[0] || null;
}

function genReference() {
  return `V-${Date.now().toString(36).toUpperCase()}`;
}

// ── Zones de livraison ─────────────────────────────────────────────────────

// GET /api/comptabilite/:boutiqueId/zones
router.get('/:boutiqueId/zones', verifierToken, param('boutiqueId').isUUID(), async (req, res) => {
  try {
    const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
    if (!boutique) return res.status(403).json({ error: 'Accès refusé' });
    const { rows } = await pool.query(
      'SELECT * FROM zones_livraison WHERE boutique_id=$1 ORDER BY created_at',
      [req.params.boutiqueId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/comptabilite/:boutiqueId/zones
router.post(
  '/:boutiqueId/zones',
  verifierToken,
  param('boutiqueId').isUUID(),
  body('nom').trim().isLength({ min: 1, max: 100 }),
  body('prix').isFloat({ min: 0 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    try {
      const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
      if (!boutique) return res.status(403).json({ error: 'Accès refusé' });
      const { rows } = await pool.query(
        'INSERT INTO zones_livraison (boutique_id, nom, prix) VALUES ($1,$2,$3) RETURNING *',
        [req.params.boutiqueId, req.body.nom, req.body.prix]
      );

      enregistrerAuditLog(req.params.boutiqueId, req.user?.userId || null, req.user?.nom || null, 'zone_livraison_creee', `Création de la zone de livraison "${req.body.nom}" (${req.body.prix} FCFA)`, { nom: req.body.nom, prix: req.body.prix }, req);

      res.status(201).json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// DELETE /api/comptabilite/:boutiqueId/zones/:zoneId
router.delete(
  '/:boutiqueId/zones/:zoneId',
  verifierToken,
  param('boutiqueId').isUUID(),
  param('zoneId').isUUID(),
  async (req, res) => {
    try {
      const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
      if (!boutique) return res.status(403).json({ error: 'Accès refusé' });
      await pool.query('DELETE FROM zones_livraison WHERE id=$1 AND boutique_id=$2', [req.params.zoneId, req.params.boutiqueId]);

      enregistrerAuditLog(req.params.boutiqueId, req.user?.userId || null, req.user?.nom || null, 'zone_livraison_supprimee', `Suppression de la zone de livraison #${req.params.zoneId}`, {}, req);

      res.json({ message: 'Zone supprimée' });
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ── Ventes ──────────────────────────────────────────────────────────────────

// POST /api/comptabilite/:boutiqueId/ventes — déclarer une vente
router.post(
  '/:boutiqueId/ventes',
  verifierToken,
  param('boutiqueId').isUUID(),
  body('quantite').isInt({ min: 1 }),
  body('prix_unitaire').isFloat({ min: 0 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    try {
      const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
      if (!boutique) return res.status(403).json({ error: 'Accès refusé' });

      const { produit_id, quantite, prix_unitaire, zone_livraison_id, client_nom, client_telephone, methode_paiement } = req.body;

      let nomProduit = req.body.nom_produit || 'Produit';
      let fraisLivraison = 0;

      if (produit_id) {
        const p = await pool.query('SELECT nom, stock_quantite FROM boutique_produits WHERE id=$1 AND boutique_id=$2', [produit_id, req.params.boutiqueId]);
        if (!p.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });
        nomProduit = p.rows[0].nom;
        if (p.rows[0].stock_quantite !== null && p.rows[0].stock_quantite < quantite) {
          return res.status(400).json({ error: 'Stock insuffisant' });
        }
      }

      if (zone_livraison_id) {
        const z = await pool.query('SELECT prix FROM zones_livraison WHERE id=$1 AND boutique_id=$2', [zone_livraison_id, req.params.boutiqueId]);
        if (z.rows[0]) fraisLivraison = Number(z.rows[0].prix);
      }

      const montantTotal = Number(prix_unitaire) * Number(quantite) + fraisLivraison;

      const { rows } = await pool.query(
        `INSERT INTO ventes (reference, boutique_id, produit_id, nom_produit, quantite, prix_unitaire,
                              zone_livraison_id, frais_livraison, montant_total, client_nom, client_telephone, methode_paiement)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [genReference(), req.params.boutiqueId, produit_id || null, nomProduit, quantite, prix_unitaire,
         zone_livraison_id || null, fraisLivraison, montantTotal, client_nom || null, client_telephone || null, methode_paiement || 'cash']
      );

      if (produit_id) {
        await pool.query(
          `UPDATE boutique_produits SET stock_quantite = GREATEST(stock_quantite - $1, 0)
           WHERE id=$2 AND stock_quantite IS NOT NULL`,
          [quantite, produit_id]
        );
      }

      res.status(201).json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// GET /api/comptabilite/:boutiqueId/ventes — liste (filtrable par date)
router.get('/:boutiqueId/ventes', verifierToken, param('boutiqueId').isUUID(), async (req, res) => {
  try {
    const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
    if (!boutique) return res.status(403).json({ error: 'Accès refusé' });

    const { from, to } = req.query;
    const conditions = ['boutique_id=$1'];
    const params = [req.params.boutiqueId];
    if (from) { params.push(from); conditions.push(`created_at >= $${params.length}`); }
    if (to) { params.push(to); conditions.push(`created_at <= $${params.length}`); }

    conditions.push('archivee IS NOT TRUE');
    const { rows } = await pool.query(
      `SELECT * FROM ventes WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/comptabilite/:boutiqueId/ventes/export.csv
router.get('/:boutiqueId/ventes/export.csv', verifierToken, param('boutiqueId').isUUID(), async (req, res) => {
  try {
    const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
    if (!boutique) return res.status(403).json({ error: 'Accès refusé' });

    const { rows } = await pool.query(
      'SELECT * FROM ventes WHERE boutique_id=$1 AND archivee IS NOT TRUE ORDER BY created_at DESC',
      [req.params.boutiqueId]
    );

    const header = ['reference', 'date', 'produit', 'quantite', 'prix_unitaire', 'frais_livraison', 'montant_total', 'client', 'telephone', 'paiement'];
    const lines = [header.join(',')];
    for (const v of rows) {
      lines.push([
        v.reference,
        v.created_at.toISOString(),
        `"${(v.nom_produit || '').replace(/"/g, '""')}"`,
        v.quantite,
        v.prix_unitaire,
        v.frais_livraison,
        v.montant_total,
        `"${(v.client_nom || '').replace(/"/g, '""')}"`,
        v.client_telephone || '',
        v.methode_paiement,
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="ventes-${req.params.boutiqueId}.csv"`);
    res.send(lines.join('\n'));
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/comptabilite/:boutiqueId/ventes/:venteId — modifier une vente
router.put(
  '/:boutiqueId/ventes/:venteId',
  verifierToken,
  param('boutiqueId').isUUID(),
  param('venteId').isUUID(),
  body('quantite').optional().isInt({ min: 1 }),
  body('prix_unitaire').optional().isFloat({ min: 0 }),
  body('frais_livraison').optional().isFloat({ min: 0 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    try {
      const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
      if (!boutique) return res.status(403).json({ error: 'Accès refusé' });

      const { nom_produit, quantite, prix_unitaire, frais_livraison, client_nom, client_telephone, methode_paiement } = req.body;

      // Recalcule le total si quantite/prix/livraison changent
      const { rows: [current] } = await pool.query('SELECT * FROM ventes WHERE id=$1 AND boutique_id=$2', [req.params.venteId, req.params.boutiqueId]);
      if (!current) return res.status(404).json({ error: 'Vente introuvable' });

      const newQty   = quantite      !== undefined ? Number(quantite)       : current.quantite;
      const newPrix  = prix_unitaire !== undefined ? Number(prix_unitaire)  : Number(current.prix_unitaire);
      const newFrais = frais_livraison !== undefined ? Number(frais_livraison) : Number(current.frais_livraison);
      const newTotal = newQty * newPrix + newFrais;

      const { rows } = await pool.query(
        `UPDATE ventes SET
           nom_produit=$1, quantite=$2, prix_unitaire=$3, frais_livraison=$4, montant_total=$5,
           client_nom=$6, client_telephone=$7, methode_paiement=$8
         WHERE id=$9 AND boutique_id=$10 RETURNING *`,
        [
          nom_produit      ?? current.nom_produit,
          newQty, newPrix, newFrais, newTotal,
          client_nom       !== undefined ? client_nom       : current.client_nom,
          client_telephone !== undefined ? client_telephone : current.client_telephone,
          methode_paiement ?? current.methode_paiement,
          req.params.venteId, req.params.boutiqueId,
        ]
      );
      res.json(rows[0]);
    } catch (err) {
      console.error('[PUT VENTE]', err.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// DELETE /api/comptabilite/:boutiqueId/ventes/:venteId — archiver (soft delete)
router.delete(
  '/:boutiqueId/ventes/:venteId',
  verifierToken,
  param('boutiqueId').isUUID(),
  param('venteId').isUUID(),
  async (req, res) => {
    try {
      const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
      if (!boutique) return res.status(403).json({ error: 'Accès refusé' });
      const { rowCount } = await pool.query(
        'UPDATE ventes SET archivee=true WHERE id=$1 AND boutique_id=$2',
        [req.params.venteId, req.params.boutiqueId]
      );
      if (rowCount === 0) return res.status(404).json({ error: 'Vente introuvable' });
      res.json({ message: 'Vente archivée' });
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// GET /api/comptabilite/:boutiqueId/ventes/:venteId/facture.pdf
router.get(
  '/:boutiqueId/ventes/:venteId/facture.pdf',
  verifierToken,
  param('boutiqueId').isUUID(),
  param('venteId').isUUID(),
  async (req, res) => {
    try {
      const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
      if (!boutique) return res.status(403).json({ error: 'Accès refusé' });

      const { rows } = await pool.query('SELECT * FROM ventes WHERE id=$1 AND boutique_id=$2', [req.params.venteId, req.params.boutiqueId]);
      const vente = rows[0];
      if (!vente) return res.status(404).json({ error: 'Vente introuvable' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="facture-${vente.reference}.pdf"`);

      // Charger le logo en avance (peut être null)
      const logoBuffer = boutique.logo_url ? await fetchImageBuffer(boutique.logo_url) : null;

      const NAVY  = '#1e3a5f';
      const ORANGE = '#C75B00';
      const GRAY  = '#6b7280';
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      doc.pipe(res);

      // ── En-tête boutique ──────────────────────────────────────────────────
      const headerTop = 50;
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 50, headerTop, { width: 60, height: 60 });
          doc.moveDown(0.5);
        } catch (_) { /* ignore si format non supporté */ }
      }
      const textX = logoBuffer ? 125 : 50;
      doc.fillColor(NAVY).fontSize(20).font('Helvetica-Bold')
         .text(boutique.nom, textX, headerTop, { lineBreak: false });
      doc.fontSize(10).font('Helvetica').fillColor(GRAY);
      let infoY = headerTop + 28;
      if (boutique.adresse || boutique.ville) {
        doc.text(`${boutique.adresse || ''} ${boutique.ville || ''}`.trim(), textX, infoY);
        infoY += 14;
      }
      if (boutique.telephone) { doc.text(`Tél : ${boutique.telephone}`, textX, infoY); infoY += 14; }

      // Ligne de séparation
      doc.moveTo(50, Math.max(infoY, headerTop + 70) + 8)
         .lineTo(545, Math.max(infoY, headerTop + 70) + 8)
         .strokeColor(NAVY).lineWidth(1.5).stroke();

      doc.moveDown(3);

      // ── Titre FACTURE + référence ─────────────────────────────────────────
      const facY = doc.y;
      doc.fillColor(NAVY).fontSize(22).font('Helvetica-Bold').text('FACTURE', 50, facY);
      doc.fillColor(GRAY).fontSize(10).font('Helvetica')
         .text(`Réf : ${vente.reference}`, 50, facY + 28)
         .text(`Date : ${vente.created_at.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, 50, facY + 42);

      // Bloc client (droite)
      if (vente.client_nom || vente.client_telephone) {
        doc.fillColor(NAVY).fontSize(11).font('Helvetica-Bold').text('Client', 350, facY);
        doc.fillColor('#374151').fontSize(10).font('Helvetica');
        if (vente.client_nom)      doc.text(vente.client_nom, 350, facY + 16);
        if (vente.client_telephone) doc.text(vente.client_telephone, 350, facY + (vente.client_nom ? 30 : 16));
      }

      doc.moveDown(4);

      // ── Tableau produit ───────────────────────────────────────────────────
      const tableTop = doc.y;
      const col = { desc: 50, qty: 310, pu: 370, total: 450 };

      // Header tableau
      doc.rect(50, tableTop, 495, 24).fill(NAVY);
      doc.fillColor('#fff').fontSize(10).font('Helvetica-Bold');
      doc.text('Description',      col.desc + 6, tableTop + 7, { width: 250 });
      doc.text('Qté',              col.qty,       tableTop + 7, { width: 50, align: 'right' });
      doc.text('Prix unit.',       col.pu,        tableTop + 7, { width: 70, align: 'right' });
      doc.text('Montant',          col.total,     tableTop + 7, { width: 90, align: 'right' });

      // Ligne produit
      const row1Y = tableTop + 24;
      doc.rect(50, row1Y, 495, 28).fill('#f8fafc');
      doc.fillColor('#111').fontSize(10).font('Helvetica');
      doc.text(vente.nom_produit, col.desc + 6, row1Y + 9, { width: 250 });
      doc.text(String(vente.quantite), col.qty, row1Y + 9, { width: 50, align: 'right' });
      doc.text(`${Number(vente.prix_unitaire).toLocaleString('fr-FR')} FCFA`, col.pu, row1Y + 9, { width: 70, align: 'right' });
      doc.text(`${(Number(vente.prix_unitaire) * Number(vente.quantite)).toLocaleString('fr-FR')} FCFA`, col.total, row1Y + 9, { width: 90, align: 'right' });

      let nextY = row1Y + 28;

      // Ligne livraison (si zone sélectionnée ou frais > 0)
      if (vente.zone_livraison_id || Number(vente.frais_livraison) > 0) {
        doc.rect(50, nextY, 495, 28).fill('#fff');
        doc.fillColor(GRAY).fontSize(10).font('Helvetica-Oblique');
        doc.text('Frais de livraison', col.desc + 6, nextY + 9, { width: 250 });
        doc.text('—', col.qty, nextY + 9, { width: 50, align: 'right' });
        doc.text('—', col.pu, nextY + 9, { width: 70, align: 'right' });
        doc.fillColor('#374151').font('Helvetica');
        const livraisonAmt = Number(vente.frais_livraison);
        doc.text(livraisonAmt > 0 ? `${livraisonAmt.toLocaleString('fr-FR')} FCFA` : 'Gratuit', col.total, nextY + 9, { width: 90, align: 'right' });
        nextY += 28;
      }

      // Séparation
      doc.moveTo(50, nextY).lineTo(545, nextY).strokeColor('#e5e7eb').lineWidth(1).stroke();
      nextY += 6;

      // Total
      doc.rect(350, nextY, 195, 32).fill(ORANGE);
      doc.fillColor('#fff').fontSize(13).font('Helvetica-Bold')
         .text('TOTAL', 360, nextY + 10, { width: 80 })
         .text(`${Number(vente.montant_total).toLocaleString('fr-FR')} FCFA`, 360, nextY + 10, { width: 175, align: 'right' });

      nextY += 50;

      // ── Paiement ─────────────────────────────────────────────────────────
      const methodes = { cash: 'Espèces', wave: 'Wave', orange_money: 'Orange Money', virement: 'Virement' };
      doc.fillColor(GRAY).fontSize(9).font('Helvetica')
         .text(`Mode de paiement : ${methodes[vente.methode_paiement] || vente.methode_paiement}`, 50, nextY);

      // ── Pied de page ──────────────────────────────────────────────────────
      doc.moveTo(50, 760).lineTo(545, 760).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      doc.fillColor(GRAY).fontSize(8).font('Helvetica')
         .text('Document généré par Nopalou — nopalou.com', 50, 768, { align: 'center', width: 495 });

      doc.end();
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ── Commandes boutique ────────────────────────────────────────────────────────

const STATUTS_VALIDES = ['en_attente', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee'];

function genRefCommande() {
  return `C-${Date.now().toString(36).toUpperCase()}`;
}

// Construit et envoie le message WhatsApp de notification au vendeur.
// Extrait de creerCommandeBoutique pour permettre à un appelant (ex: panier
// multi-articles) de notifier une seule fois après plusieurs insertions.
async function notifierVendeurCommande(boutique, {
  reference, nomProduit, quantite, montantTotal, fraisLivraison,
  methodePaiement, clientNom, clientTelephone, clientAdresse, note,
}) {
  const vendeurTel = boutique.whatsapp || boutique.telephone;
  if (!vendeurTel) return;
  const { sendWhatsAppText } = require('../services/whatsapp');
  const methodeLabel = { wave: 'Wave', orange_money: 'Orange Money', cash: 'Espèces', virement: 'Virement' };
  const msg = `🛒 *Nouvelle commande — ${boutique.nom}*\n\nRéf : *${reference}*\nProduit : ${nomProduit} × ${quantite}${montantTotal > 0 ? `\nMontant : *${new Intl.NumberFormat('fr-FR').format(montantTotal)} FCFA*` : ''}${fraisLivraison > 0 ? `\nLivraison : ${new Intl.NumberFormat('fr-FR').format(fraisLivraison)} FCFA` : ''}\n💳 Paiement souhaité : ${methodeLabel[methodePaiement] || methodePaiement}\n\n👤 Client : ${clientNom}\n📞 ${clientTelephone}${clientAdresse ? `\n📍 ${clientAdresse}` : ''}${note ? `\n📝 ${note}` : ''}\n\n⚡ Répondez vite pour confirmer !`;
  sendWhatsAppText(vendeurTel, msg).catch(() => {});
}

// Logique de création de commande, partagée entre la route HTTP publique
// (POST /:boutiqueId/commandes, source='web') et le chatbot WhatsApp (source='whatsapp').
// Lève une erreur avec .status (404/400) et .message (message utilisateur) en cas d'échec.
// N'envoie PAS de notification elle-même — l'appelant appelle notifierVendeurCommande()
// séparément (permet de grouper la notification pour un panier multi-articles).
async function creerCommandeBoutique({
  boutiqueId, produitId, quantite = 1, clientNom, clientTelephone, clientAdresse,
  note, source = 'web', methodePaiement = 'wave', zoneLivraisonId,
  nomProduitManuel, prixUnitaireManuel, groupeCommande,
}) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(boutiqueId);
  const bQuery = isUUID
    ? 'SELECT id, nom, telephone, whatsapp, utilisateur_id FROM boutiques WHERE id=$1 AND actif=true'
    : 'SELECT id, nom, telephone, whatsapp, utilisateur_id FROM boutiques WHERE slug=$1 AND actif=true';

  const { rows: [boutique] } = await pool.query(bQuery, [boutiqueId]);
  if (!boutique) {
    const e = new Error('Boutique introuvable');
    e.status = 404;
    throw e;
  }

  const actualBoutiqueId = boutique.id;
  let nomProduit = nomProduitManuel || 'Produit';
  let prixUnitaire = Number(prixUnitaireManuel) || 0;
  let fraisLivraison = 0;

  if (zoneLivraisonId) {
    const { rows: [zone] } = await pool.query(
      'SELECT prix, nom FROM zones_livraison WHERE (id::text=$1 OR id=$1) AND boutique_id=$2',
      [zoneLivraisonId, actualBoutiqueId]
    );
    if (zone) fraisLivraison = Number(zone.prix);
  }

  if (produitId) {
    const { rows: [p] } = await pool.query(
      'SELECT nom, prix, stock_quantite FROM boutique_produits WHERE (id::text=$1 OR id=$1) AND boutique_id=$2',
      [produitId, actualBoutiqueId]
    );
    if (!p) {
      const e = new Error('Produit introuvable');
      e.status = 404;
      throw e;
    }
    nomProduit = p.nom;
    if (!prixUnitaire && p.prix) prixUnitaire = Number(p.prix);
    if (p.stock_quantite !== null && p.stock_quantite < quantite) {
      const e = new Error('Stock insuffisant');
      e.status = 400;
      throw e;
    }
  }

  const montantTotal = prixUnitaire * quantite + fraisLivraison;
  const ref = genRefCommande();

  const validProduitId = (produitId && produitId.length === 36) ? produitId : null;
  const validZoneId = (zoneLivraisonId && zoneLivraisonId.length === 36) ? zoneLivraisonId : null;

  const { rows: [commande] } = await pool.query(
    `INSERT INTO commandes_boutique
       (reference, boutique_id, produit_id, nom_produit, quantite, prix_unitaire, montant_total,
        client_nom, client_telephone, client_adresse, note, source, methode_paiement, zone_livraison_id, frais_livraison, groupe_commande)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [ref, actualBoutiqueId, validProduitId, nomProduit, quantite, prixUnitaire, montantTotal,
     clientNom, clientTelephone, clientAdresse || null, note || null, source,
     methodePaiement, validZoneId, fraisLivraison, groupeCommande || null]
  );

  return { commande, boutique };
}

// POST /api/comptabilite/:boutiqueId/commandes — public, client passe commande
router.post(
  '/:boutiqueId/commandes',
  body('client_nom').trim().isLength({ min: 2, max: 150 }),
  body('client_telephone').trim().isLength({ min: 6, max: 30 }),
  body('produit_id').optional(),
  body('nom_produit').optional().trim().isLength({ max: 300 }),
  body('quantite').optional().isInt({ min: 1, max: 100 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    try {
      const { produit_id, quantite = 1, client_nom, client_telephone, client_adresse, note, source = 'web', methode_paiement = 'wave', zone_livraison_id } = req.body;

      const { commande, boutique } = await creerCommandeBoutique({
        boutiqueId: req.params.boutiqueId,
        produitId: produit_id,
        quantite,
        clientNom: client_nom,
        clientTelephone: client_telephone,
        clientAdresse: client_adresse,
        note,
        source,
        methodePaiement: methode_paiement,
        zoneLivraisonId: zone_livraison_id,
        nomProduitManuel: req.body.nom_produit,
        prixUnitaireManuel: req.body.prix_unitaire,
      });

      await notifierVendeurCommande(boutique, {
        reference: commande.reference,
        nomProduit: commande.nom_produit,
        quantite: commande.quantite,
        montantTotal: Number(commande.montant_total),
        fraisLivraison: Number(commande.frais_livraison),
        methodePaiement: commande.methode_paiement,
        clientNom: commande.client_nom,
        clientTelephone: commande.client_telephone,
        clientAdresse: commande.client_adresse,
        note: commande.note,
      });

      // Si le paiement Wave est sélectionné et l'API Wave est disponible, initialiser le checkout Wave
      if ((methode_paiement === 'wave' || methode_paiement === 'pay_wave') && process.env.WAVE_API_KEY && !process.env.WAVE_API_KEY.includes('xxxxxxxx')) {
        try {
          const wave = require('../services/wave');
          const waveSession = await wave.createCheckoutSession({
            amount: Number(commande.montant_total),
            currency: 'XOF',
            success_url: `${process.env.FRONTEND_URL || 'https://nopalou.com'}/paiement/succes?ref=${commande.reference}&type=commande-boutique`,
            error_url: `${process.env.FRONTEND_URL || 'https://nopalou.com'}/paiement/erreur`,
            client_reference: commande.reference,
          });
          return res.status(201).json({ commande, wave_url: waveSession.wave_url, session_id: waveSession.session_id, message: 'Commande créée. Redirection vers Wave…' });
        } catch (waveErr) {
          const waveMsg = waveErr.response?.data?.message || waveErr.response?.data?.code || waveErr.message;
          console.error('[COMMANDE WAVE INIT ERR]:', waveMsg);
          return res.status(400).json({
            error: `Erreur Wave API: ${waveMsg}. (Vérifiez la liste blanche IP dans le portail Wave).`
          });
        }
      }

      res.status(201).json({ commande, message: 'Commande envoyée avec succès' });
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      console.error('[COMMANDE]', err.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// GET /api/comptabilite/:boutiqueId/commandes — vendeur voit ses commandes
router.get('/:boutiqueId/commandes', verifierToken, param('boutiqueId').isUUID(), async (req, res) => {
  try {
    const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
    if (!boutique) return res.status(403).json({ error: 'Accès refusé' });

    const { statut } = req.query;
    const conds = ['boutique_id=$1'];
    const params = [req.params.boutiqueId];
    if (statut) { params.push(statut); conds.push(`statut=$${params.length}`); }

    const { rows } = await pool.query(
      `SELECT * FROM commandes_boutique WHERE ${conds.join(' AND ')} ORDER BY created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/comptabilite/:boutiqueId/commandes/:commandeId — vendeur change le statut
router.patch(
  '/:boutiqueId/commandes/:commandeId',
  verifierToken,
  param('boutiqueId').isUUID(),
  param('commandeId').isUUID(),
  body('statut').isIn(STATUTS_VALIDES),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    try {
      const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
      if (!boutique) return res.status(403).json({ error: 'Accès refusé' });

      const { rows: [commande] } = await pool.query(
        `UPDATE commandes_boutique SET statut=$1, updated_at=NOW()
         WHERE id=$2 AND boutique_id=$3 RETURNING *`,
        [req.body.statut, req.params.commandeId, req.params.boutiqueId]
      );
      if (!commande) return res.status(404).json({ error: 'Commande introuvable' });

      // Alimenter la Comptabilité et la commission si la commande passe à "livree"
      if (req.body.statut === 'livree' && commande.montant_total > 0) {
        const { rows: [b] } = await pool.query('SELECT commission_rate FROM boutiques WHERE id=$1', [req.params.boutiqueId]);
        if (b?.commission_rate > 0) {
          const commission = (commande.montant_total * b.commission_rate / 100).toFixed(2);
          pool.query(
            'UPDATE commandes_boutique SET montant_commission=$1 WHERE id=$2',
            [commission, commande.id]
          ).catch(() => {});
        }

        try {
          await pool.query(
            `INSERT INTO ventes (reference, boutique_id, nom_produit, quantite, prix_unitaire, frais_livraison, montant_total, client_nom, client_telephone, methode_paiement, created_at)
             VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, $9, NOW())
             ON CONFLICT DO NOTHING`,
            [
              commande.reference || `CMD-${commande.id.slice(0,6)}`,
              req.params.boutiqueId,
              commande.nom_produit || 'Commande Web',
              commande.quantite || 1,
              commande.prix_unitaire || commande.montant_total,
              commande.montant_total,
              commande.client_nom || 'Client Web',
              commande.client_telephone || null,
              commande.mode_paiement || 'cash'
            ]
          );
        } catch (eComptaCmd) {
          console.error('[CMD LIVREE COMPTA ERR]', eComptaCmd.message);
        }

        // Reversement 100% Automatique Wave Payout vers le marchand si activé
        if ((commande.methode_paiement === 'wave' || commande.methode_paiement === 'pay_wave') && process.env.REVERSEMENT_AUTOMATIQUE_WAVE !== 'false' && process.env.WAVE_API_KEY && !process.env.WAVE_API_KEY.includes('xxxxxxxx')) {
          try {
            const mobile = boutique.whatsapp || boutique.telephone;
            if (mobile) {
              const commission = (b?.commission_rate > 0) ? (commande.montant_total * b.commission_rate / 100) : 0;
              const netAmount = Number(commande.montant_total) - commission;
              const wave = require('../services/wave');
              await wave.sendPayout({
                amount: netAmount,
                mobile,
                client_reference: `auto_payout_${commande.reference}`,
              });
              console.log(`[AUTO PAYOUT WAVE SUCCESS] ⚡ ${netAmount} FCFA transférés automatiquement à ${boutique.nom} (${mobile})`);
            }
          } catch (autoErr) {
            console.error('[AUTO PAYOUT WAVE ERR]:', autoErr.message);
          }
        }
      }

      // Notifier le client du changement de statut sur WhatsApp
      if (commande.client_telephone) {
        const { sendWhatsAppText } = require('../services/whatsapp');
        const msgs = {
          confirmee:      `✅ *Commande confirmée — ${boutique.nom}*\n\nVotre commande *${commande.reference}* (${commande.nom_produit}) a été confirmée. Nous préparons votre colis !`,
          en_preparation: `📦 *En préparation — ${boutique.nom}*\n\nVotre commande *${commande.reference}* est en cours de préparation.`,
          expediee:       `🚚 *Commande expédiée — ${boutique.nom}*\n\nVotre commande *${commande.reference}* est en route ! Vous serez livré(e) prochainement.`,
          livree:         `🎉 *Livraison confirmée — ${boutique.nom}*\n\nVotre commande *${commande.reference}* a été livrée. Merci pour votre achat !`,
          annulee:        `❌ *Commande annulée — ${boutique.nom}*\n\nVotre commande *${commande.reference}* a été annulée. Contactez la boutique pour plus d'informations.`,
        };
        const msg = msgs[req.body.statut];
        if (msg) {
          sendWhatsAppText(commande.client_telephone, msg)
            .then(() => console.log(`[WHATSAPP CLIENT NOTIF SUCCESS] Statut ${req.body.statut} envoyé au ${commande.client_telephone}`))
            .catch(err => console.error('[WHATSAPP CLIENT NOTIF ERR]:', err.message));
        }
      }

      // Notifier également le marchand sur son WhatsApp
      const vendeurMobile = boutique.whatsapp || boutique.telephone;
      if (vendeurMobile) {
        const { sendWhatsAppText } = require('../services/whatsapp');
        const msgVendeur = `📢 *Statut Commande Mis à Jour — ${boutique.nom}*\n\nCommande : *${commande.reference}*\nNouveau statut : *${req.body.statut.toUpperCase()}*\nClient : ${commande.client_nom} (${commande.client_telephone})`;
        sendWhatsAppText(vendeurMobile, msgVendeur)
          .then(() => console.log(`[WHATSAPP VENDEUR STATUS NOTIF SUCCESS] Envoyé au ${vendeurMobile}`))
          .catch(err => console.error('[WHATSAPP VENDEUR STATUS NOTIF ERR]:', err.message));
      }

      res.json(commande);
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
// GET /api/comptabilite/:boutiqueId/dashboard
router.get('/:boutiqueId/dashboard', verifierToken, param('boutiqueId').isUUID(), async (req, res) => {
  try {
    const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
    if (!boutique) return res.status(403).json({ error: 'Accès refusé' });
    const id = req.params.boutiqueId;

    const [statsVentes, statsDepenses, topProduit, stockAlerte] = await Promise.all([
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN date_trunc('month', created_at) = date_trunc('month', NOW()) THEN montant_total END), 0) AS ca_mois,
          COALESCE(SUM(CASE WHEN date_trunc('month', created_at) = date_trunc('month', NOW() - INTERVAL '1 month') THEN montant_total END), 0) AS ca_mois_precedent,
          COUNT(CASE WHEN date_trunc('month', created_at) = date_trunc('month', NOW()) THEN 1 END)::int AS nb_ventes_mois,
          COALESCE(SUM(montant_total), 0) AS ca_total
        FROM ventes WHERE boutique_id=$1
      `, [id]),
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN date_trunc('month', date_depense) = date_trunc('month', CURRENT_DATE) THEN montant END), 0) AS depenses_mois,
          COALESCE(SUM(montant), 0) AS depenses_total
        FROM depenses WHERE boutique_id=$1
      `, [id]),
      pool.query(`
        SELECT nom_produit, SUM(quantite)::int AS total_vendu, SUM(montant_total) AS ca
        FROM ventes WHERE boutique_id=$1
          AND date_trunc('month', created_at) = date_trunc('month', NOW())
        GROUP BY nom_produit ORDER BY total_vendu DESC LIMIT 5
      `, [id]),
      pool.query(`
        SELECT id, nom, stock_quantite FROM boutique_produits
        WHERE boutique_id=$1 AND stock_quantite IS NOT NULL AND stock_quantite <= 3
        ORDER BY stock_quantite ASC
      `, [id]),
    ]);

    const v = statsVentes.rows[0];
    const d = statsDepenses.rows[0];
    res.json({
      ca_mois: Number(v.ca_mois),
      ca_mois_precedent: Number(v.ca_mois_precedent),
      nb_ventes_mois: v.nb_ventes_mois,
      ca_total: Number(v.ca_total),
      depenses_mois: Number(d.depenses_mois),
      depenses_total: Number(d.depenses_total),
      benefice_mois: Number(v.ca_mois) - Number(d.depenses_mois),
      top_produits: topProduit.rows,
      stock_alerte: stockAlerte.rows,
    });
  } catch (err) {
    console.error('[DASHBOARD]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Dépenses ──────────────────────────────────────────────────────────────────

// GET /api/comptabilite/:boutiqueId/depenses
router.get('/:boutiqueId/depenses', verifierToken, param('boutiqueId').isUUID(), async (req, res) => {
  try {
    const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
    if (!boutique) return res.status(403).json({ error: 'Accès refusé' });
    const { from, to } = req.query;
    const conds = ['boutique_id=$1'];
    const params = [req.params.boutiqueId];
    if (from) { params.push(from); conds.push(`date_depense >= $${params.length}`); }
    if (to)   { params.push(to);   conds.push(`date_depense <= $${params.length}`); }
    conds.push('archivee IS NOT TRUE');
    const { rows } = await pool.query(
      `SELECT * FROM depenses WHERE ${conds.join(' AND ')} ORDER BY date_depense DESC, created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/comptabilite/:boutiqueId/depenses
router.post(
  '/:boutiqueId/depenses',
  verifierToken,
  param('boutiqueId').isUUID(),
  body('montant').isFloat({ min: 1 }),
  body('categorie').trim().isLength({ min: 1, max: 50 }),
  body('description').optional().trim().isLength({ max: 300 }),
  body('date_depense').optional().isDate(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    try {
      const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
      if (!boutique) return res.status(403).json({ error: 'Accès refusé' });
      const { montant, categorie, description, date_depense } = req.body;
      const { rows } = await pool.query(
        `INSERT INTO depenses (boutique_id, montant, categorie, description, date_depense)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [req.params.boutiqueId, montant, categorie, description || null, date_depense || new Date().toISOString().slice(0,10)]
      );

      enregistrerAuditLog(req.params.boutiqueId, req.user?.userId || null, req.user?.nom || null, 'depense_creee', `Saisie d'une dépense de ${montant} FCFA (${categorie})`, { montant, categorie, description }, req);

      res.status(201).json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// PUT /api/comptabilite/:boutiqueId/depenses/:depenseId — modifier une dépense
router.put(
  '/:boutiqueId/depenses/:depenseId',
  verifierToken,
  param('boutiqueId').isUUID(),
  param('depenseId').isUUID(),
  body('montant').optional().isFloat({ min: 1 }),
  body('categorie').optional().trim().isLength({ min: 1, max: 50 }),
  body('description').optional().trim().isLength({ max: 300 }),
  body('date_depense').optional().isDate(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    try {
      const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
      if (!boutique) return res.status(403).json({ error: 'Accès refusé' });
      const { montant, categorie, description, date_depense } = req.body;
      const { rows: [current] } = await pool.query('SELECT * FROM depenses WHERE id=$1 AND boutique_id=$2', [req.params.depenseId, req.params.boutiqueId]);
      if (!current) return res.status(404).json({ error: 'Dépense introuvable' });
      const { rows } = await pool.query(
        `UPDATE depenses SET montant=$1, categorie=$2, description=$3, date_depense=$4
         WHERE id=$5 AND boutique_id=$6 RETURNING *`,
        [
          montant      !== undefined ? montant      : current.montant,
          categorie    !== undefined ? categorie    : current.categorie,
          description  !== undefined ? description  : current.description,
          date_depense !== undefined ? date_depense : current.date_depense,
          req.params.depenseId, req.params.boutiqueId,
        ]
      );

      enregistrerAuditLog(req.params.boutiqueId, req.user?.userId || null, req.user?.nom || null, 'depense_modifiee', `Modification d'une dépense (#${req.params.depenseId})`, { montant, categorie }, req);

      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// DELETE /api/comptabilite/:boutiqueId/depenses/:depenseId — archiver (soft delete)
router.delete(
  '/:boutiqueId/depenses/:depenseId',
  verifierToken,
  param('boutiqueId').isUUID(),
  param('depenseId').isUUID(),
  async (req, res) => {
    try {
      const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
      if (!boutique) return res.status(403).json({ error: 'Accès refusé' });
      await pool.query('UPDATE depenses SET archivee=true WHERE id=$1 AND boutique_id=$2', [req.params.depenseId, req.params.boutiqueId]);

      enregistrerAuditLog(req.params.boutiqueId, req.user?.userId || null, req.user?.nom || null, 'depense_supprimee', `Archivage / Suppression d'une dépense (#${req.params.depenseId})`, {}, req);

      res.json({ message: 'Dépense archivée' });
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// POST /api/comptabilite/:boutiqueId/depenses/:depenseId/justificatif
router.post(
  '/:boutiqueId/depenses/:depenseId/justificatif',
  verifierToken,
  param('boutiqueId').isUUID(),
  param('depenseId').isUUID(),
  upload.single('justificatif'),
  async (req, res) => {
    try {
      const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
      if (!boutique) return res.status(403).json({ error: 'Accès refusé' });
      if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });

      const url = await uploadBuffer(req.file.buffer, 'justificatifs');
      const { rows } = await pool.query(
        'UPDATE depenses SET justificatif_url=$1 WHERE id=$2 AND boutique_id=$3 RETURNING *',
        [url, req.params.depenseId, req.params.boutiqueId]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Dépense introuvable' });
      res.json(rows[0]);
    } catch (err) {
      console.error('[JUSTIFICATIF]', err.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// POST /api/comptabilite/:boutiqueId/ventes/:venteId/justificatif
router.post(
  '/:boutiqueId/ventes/:venteId/justificatif',
  verifierToken,
  param('boutiqueId').isUUID(),
  param('venteId').isUUID(),
  upload.single('justificatif'),
  async (req, res) => {
    try {
      const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
      if (!boutique) return res.status(403).json({ error: 'Accès refusé' });
      if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });

      const url = await uploadBuffer(req.file.buffer, 'justificatifs');
      const { rows } = await pool.query(
        'UPDATE ventes SET justificatif_url=$1 WHERE id=$2 AND boutique_id=$3 RETURNING *',
        [url, req.params.venteId, req.params.boutiqueId]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Vente introuvable' });
      res.json(rows[0]);
    } catch (err) {
      console.error('[JUSTIFICATIF_VENTE]', err.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ── Stock ─────────────────────────────────────────────────────────────────────

// PATCH /api/comptabilite/:boutiqueId/stock/:produitId
router.patch(
  '/:boutiqueId/stock/:produitId',
  verifierToken,
  param('boutiqueId').isUUID(),
  param('produitId').isUUID(),
  body('stock_quantite').isInt({ min: 0 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    try {
      const boutique = await ownsBoutique(req.params.boutiqueId, req.user.userId);
      if (!boutique) return res.status(403).json({ error: 'Accès refusé' });

      // Récupérer ancien stock & nom du produit
      const oldRes = await pool.query(
        `SELECT id, nom, stock_quantite FROM boutique_produits WHERE id=$1 AND boutique_id=$2`,
        [req.params.produitId, req.params.boutiqueId]
      );
      if (!oldRes.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });
      const pOld = oldRes.rows[0];
      const ancienStock = pOld.stock_quantite ?? 0;
      const nouveauStock = parseInt(req.body.stock_quantite, 10);

      const { rows } = await pool.query(
        `UPDATE boutique_produits SET stock_quantite=$1 WHERE id=$2 AND boutique_id=$3 RETURNING id, nom, stock_quantite`,
        [nouveauStock, req.params.produitId, req.params.boutiqueId]
      );

      // Log d'audit de modification de stock
      enregistrerAuditLog(
        req.params.boutiqueId,
        req.user.userId,
        req.user.nom || 'Marchand',
        'produit_modifie',
        `Ajustement du stock de "${pOld.nom}" : ${ancienStock} ➔ ${nouveauStock}`,
        { produit_id: req.params.produitId, ancien_stock: ancienStock, nouveau_stock: nouveauStock },
        req
      );

      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// GET /api/comptabilite/:boutiqueId/zones/public — zones de livraison publiques (pas d'auth)
router.get('/:boutiqueId/zones/public', async (req, res) => {
  try {
    const bId = req.params.boutiqueId;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bId);
    let targetBoutiqueId = bId;
    if (!isUUID) {
      const bqRes = await pool.query('SELECT id FROM boutiques WHERE slug = $1', [bId]);
      if (bqRes.rows[0]) targetBoutiqueId = bqRes.rows[0].id;
    }

    const { rows } = await pool.query(
      'SELECT id, nom, prix FROM zones_livraison WHERE boutique_id=$1 ORDER BY prix ASC',
      [targetBoutiqueId]
    );
    res.json(rows);
  } catch (err) {
    console.error('[ZONES PUBLIC ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/comptabilite/admin/reversements-dus — Liste des commandes livrées en attente de reversement marchand
router.get('/admin/reversements-dus', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.reference, c.montant_total, c.montant_commission, c.methode_paiement, c.statut, c.created_at,
             b.nom AS boutique_nom, b.telephone AS boutique_telephone, b.whatsapp AS boutique_whatsapp, b.id AS boutique_id
      FROM commandes_boutique c
      JOIN boutiques b ON b.id = c.boutique_id
      WHERE c.statut = 'livree' AND (c.methode_paiement = 'wave' OR c.methode_paiement = 'pay_wave')
      ORDER BY c.created_at DESC
      LIMIT 100
    `);
    res.json({ reversements: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/comptabilite/admin/reversements/:commandeId/payer — Déclencher le Payout Wave vers le marchand
router.post('/admin/reversements/:commandeId/payer', adminSecretOnly, async (req, res) => {
  try {
    const { rows: [commande] } = await pool.query(`
      SELECT c.id, c.reference, c.montant_total, c.montant_commission, c.methode_paiement, c.statut,
             b.nom AS boutique_nom, b.telephone AS boutique_telephone, b.whatsapp AS boutique_whatsapp
      FROM commandes_boutique c
      JOIN boutiques b ON b.id = c.boutique_id
      WHERE c.id = $1
    `, [req.params.commandeId]);

    if (!commande) return res.status(404).json({ error: 'Commande introuvable' });

    const mobile = commande.boutique_whatsapp || commande.boutique_telephone;
    if (!mobile) return res.status(400).json({ error: 'Numéro de téléphone du marchand introuvable' });

    const netAmount = Number(commande.montant_total) - (Number(commande.montant_commission) || 0);

    const wave = require('../services/wave');
    const payoutResult = await wave.sendPayout({
      amount: netAmount,
      mobile,
      client_reference: `payout_${commande.reference}`,
    });

    res.json({ success: true, payout: payoutResult, net_amount: netAmount, mobile });
  } catch (err) {
    console.error('[ADMIN PAYOUT ERR]', err);
    res.status(500).json({ error: err.message || 'Erreur lors du transfert Wave Payout' });
  }
});

module.exports = router;
module.exports.creerCommandeBoutique = creerCommandeBoutique;
module.exports.notifierVendeurCommande = notifierVendeurCommande;
