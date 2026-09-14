// backend/routes/boutiques-modules/boutiques-documents.js
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
  uploadJustificatifAchat,
  CATS,
  MAX_BOUTIQUES,
  QUOTA_PRODUITS,
  slugify,
  uniqueSlug,
} = require('./helpers');
router.get('/:id/documents', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé aux documents de cette boutique' });
    }
    const boutiqueId = b.id;
    const { type } = req.query; // 'devis', 'proforma', 'bon_commande_client', 'facture'

    let query = `
      SELECT d.*, c.nom as client_nom, c.telephone as client_telephone
      FROM caisse_documents d
      LEFT JOIN caisse_clients_credits c ON d.client_id = c.id
      WHERE d.boutique_id = $1
    `;
    const params = [boutiqueId];

    if (type) {
      params.push(type);
      query += ` AND d.type = $2`;
    }
    query += ` ORDER BY d.created_at DESC LIMIT 200`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('[GET DOCUMENTS ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/documents — Créer un document (devis, proforma, facture)
router.post('/:id/documents', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé aux documents de cette boutique' });
    }
    const boutiqueId = b.id;
    const { type, client_id, caissier_id, statut, items, mode_paiement, date_echeance, notes } = req.body;
    
    const bRes = await pool.query(
      `SELECT id, regime_fiscal, prix_tva_incluse, timbre_fiscal_applicable, tva_taux_defaut FROM boutiques WHERE id = $1`,
      [boutiqueId]
    );
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutique = bRes.rows[0];

    let client = null;
    if (client_id && /^[0-9a-f-]{36}$/i.test(client_id)) {
      const cRes = await pool.query(`SELECT id, nom, telephone, exonere_tva FROM caisse_clients_credits WHERE id=$1`, [client_id]);
      client = cRes.rows[0] || null;
    }

    const calculation = calculerFiscaliteDocument(boutique, client, items || []);

    // Calcul timbre fiscal (1% max 5000 FCFA, disons 1% du TTC si payé en cash)
    let timbre = 0;
    if (boutique.timbre_fiscal_applicable && (mode_paiement === 'cash' || mode_paiement === 'especes')) {
      timbre = Number((calculation.total_ttc * 0.01).toFixed(2));
      if (timbre > 5000) timbre = 5000;
    }

    // Calcul BRS
    let retenueBRS = 0;
    if (req.body.appliquer_brs) {
      retenueBRS = Number((calculation.total_ht * 0.01).toFixed(2));
    }

    const netAPayer = calculation.total_ttc + timbre - retenueBRS;

    const prefix = type === 'devis' ? 'DEV' : type === 'proforma' ? 'PRO' : type === 'bon_commande_client' ? 'CMD' : 'FAC';
    const reference = `${prefix}-${Date.now().toString().slice(-8)}`;

    const r = await pool.query(
      `INSERT INTO caisse_documents (
        boutique_id, client_id, caissier_id, type, reference, statut,
        total_ht, total_tva, timbre_fiscal, retenue_brs, total_ttc, net_a_payer,
        mode_paiement, date_echeance, notes, items, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *`,
      [
        boutiqueId, client_id || null, caissier_id || null, type, reference, statut || 'brouillon',
        calculation.total_ht, calculation.total_tva, timbre, retenueBRS, calculation.total_ttc, netAPayer,
        mode_paiement || 'cash', date_echeance || null, notes || null, JSON.stringify(calculation.items)
      ]
    );

    // Si c'est une facture validée/payée, déduire le stock pour les produits du catalogue
    if (type === 'facture' && (statut === 'paye' || statut === 'valide')) {
      for (const item of calculation.items) {
        if (item.id && /^[0-9a-f-]{36}$/i.test(String(item.id))) {
          await pool.query(
            `UPDATE boutique_produits
             SET stock_quantite = GREATEST(0, COALESCE(stock_quantite, 0) - $1),
                 en_stock = (GREATEST(0, COALESCE(stock_quantite, 0) - $1) > 0)
             WHERE id = $2`,
            [Number(item.quantite), item.id]
          );
        }
      }
    }

    enregistrerAuditLog(
      boutiqueId,
      req.user?.userId || null,
      req.user?.nom || null,
      'document_cree',
      `Création du document ${r.rows[0].type.toUpperCase()} #${r.rows[0].reference} (${r.rows[0].total_ttc} FCFA)`,
      { reference: r.rows[0].reference, type: r.rows[0].type, total_ttc: r.rows[0].total_ttc, statut: r.rows[0].statut },
      req
    );

    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('[POST CAISSE DOCUMENT ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/boutiques/:id/documents/:docId — Modifier ou valider
router.put('/:id/documents/:docId', verifierToken, param('id').isUUID(), param('docId').isUUID(), async (req, res) => {
  try {
    const { id: idParam, docId } = req.params;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé aux documents de cette boutique' });
    }
    const boutiqueId = b.id;
    const { statut, type, client_id, caissier_id, items, mode_paiement, date_echeance, notes } = req.body;

    const docRes = await pool.query(`SELECT * FROM caisse_documents WHERE id=$1 AND boutique_id=$2`, [docId, boutiqueId]);
    if (!docRes.rows[0]) return res.status(404).json({ error: 'Document introuvable' });
    const oldDoc = docRes.rows[0];

    const newType = type || oldDoc.type;
    const newStatut = statut || oldDoc.statut;
    const newClientId = client_id !== undefined ? client_id : oldDoc.client_id;
    const newItems = items !== undefined ? items : (typeof oldDoc.items === 'string' ? JSON.parse(oldDoc.items) : oldDoc.items);

    // Get boutique details for calculation
    const bRes = await pool.query(
      `SELECT id, regime_fiscal, prix_tva_incluse, timbre_fiscal_applicable, tva_taux_defaut FROM boutiques WHERE id=$1`,
      [boutiqueId]
    );
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutique = bRes.rows[0];

    let client = null;
    if (newClientId && /^[0-9a-f-]{36}$/i.test(newClientId)) {
      const cRes = await pool.query(`SELECT id, nom, telephone, exonere_tva FROM caisse_clients_credits WHERE id=$1`, [newClientId]);
      client = cRes.rows[0] || null;
    }

    const calculation = calculerFiscaliteDocument(boutique, client, newItems || []);

    let timbre = 0;
    const currentModePaiement = mode_paiement || oldDoc.mode_paiement;
    if (boutique.timbre_fiscal_applicable && (currentModePaiement === 'cash' || currentModePaiement === 'especes')) {
      timbre = Number((calculation.total_ttc * 0.01).toFixed(2));
      if (timbre > 5000) timbre = 5000;
    }

    let retenueBRS = 0;
    if (req.body.appliquer_brs !== undefined ? req.body.appliquer_brs : (oldDoc.retenue_brs > 0)) {
      retenueBRS = Number((calculation.total_ht * 0.01).toFixed(2));
    }

    const netAPayer = calculation.total_ttc + timbre - retenueBRS;

    await pool.query(
      `UPDATE caisse_documents
       SET type = $1, statut = $2, client_id = $3, caissier_id = $4, mode_paiement = $5, date_echeance = $6, notes = $7,
           total_ht = $8, total_tva = $9, timbre_fiscal = $10, retenue_brs = $11, total_ttc = $12, net_a_payer = $13,
           items = $14, updated_at = NOW()
       WHERE id = $15`,
      [
        newType, newStatut, newClientId || null, caissier_id || oldDoc.caissier_id, currentModePaiement, date_echeance || oldDoc.date_echeance, notes || oldDoc.notes,
        calculation.total_ht, calculation.total_tva, timbre, retenueBRS, calculation.total_ttc, netAPayer,
        JSON.stringify(calculation.items), docId
      ]
    );

    // Déduire les stocks si transition vers Facture Validée/Payée
    const oldIsBilling = oldDoc.type === 'facture' && (oldDoc.statut === 'paye' || oldDoc.statut === 'valide');
    const newIsBilling = newType === 'facture' && (newStatut === 'paye' || newStatut === 'valide');

    if (!oldIsBilling && newIsBilling) {
      for (const item of calculation.items) {
        if (item.id && /^[0-9a-f-]{36}$/i.test(String(item.id))) {
          await pool.query(
            `UPDATE boutique_produits
             SET stock_quantite = GREATEST(0, COALESCE(stock_quantite, 0) - $1),
                 en_stock = (GREATEST(0, COALESCE(stock_quantite, 0) - $1) > 0)
             WHERE id = $2`,
            [Number(item.quantite), item.id]
          );
        }
      }
    }

    enregistrerAuditLog(
      boutiqueId,
      req.user?.userId || null,
      req.user?.nom || null,
      'document_modifie',
      `Modification du document ${newType.toUpperCase()} #${oldDoc.reference} (Statut: ${newStatut})`,
      { reference: oldDoc.reference, type: newType, statut: newStatut },
      req
    );

    res.json({ success: true, message: 'Document mis à jour avec succès' });
  } catch (err) {
    console.error('[PUT DOCUMENT ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── DELETE /api/boutiques/:id/documents/:docId — Annuler/Supprimer
router.delete('/:id/documents/:docId', verifierToken, param('id').isUUID(), param('docId').isUUID(), async (req, res) => {
  try {
    const { id: idParam, docId } = req.params;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé aux documents de cette boutique' });
    }
    const boutiqueId = b.id;

    const docRes = await pool.query(`SELECT id, reference, type, statut, items FROM caisse_documents WHERE id=$1 AND boutique_id=$2`, [docId, boutiqueId]);
    if (!docRes.rows[0]) return res.status(404).json({ error: 'Document introuvable' });
    const doc = docRes.rows[0];

    // Remettre le stock si la facture était validée/payée
    if (doc.type === 'facture' && (doc.statut === 'paye' || doc.statut === 'valide')) {
      const items = typeof doc.items === 'string' ? JSON.parse(doc.items) : doc.items;
      for (const item of items) {
        if (item.id && /^[0-9a-f-]{36}$/i.test(String(item.id))) {
          await pool.query(
            `UPDATE boutique_produits
             SET stock_quantite = COALESCE(stock_quantite, 0) + $1,
                 en_stock = ((COALESCE(stock_quantite, 0) + $1) > 0)
             WHERE id = $2`,
            [Number(item.quantite), item.id]
          );
        }
      }
    }

    await pool.query(`DELETE FROM caisse_documents WHERE id = $1`, [docId]);

    enregistrerAuditLog(
      boutiqueId,
      req.user?.userId || null,
      req.user?.nom || null,
      'document_supprime',
      `Suppression du document ${doc.type.toUpperCase()} #${doc.reference || doc.id}`,
      { reference: doc.reference, type: doc.type, statut: doc.statut },
      req
    );

    res.json({ success: true, message: 'Document supprimé et stocks réajustés' });
  } catch (err) {
    console.error('[DELETE DOCUMENT ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/boutiques/:id/bons-achat/:code — Vérifier avoir
router.post('/:id/upload-justificatif', verifierToken, param('id').isUUID(), uploadJustificatifAchat.single('justificatif'), async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });
    const url = await uploadBuffer(req.file.buffer, 'justificatifs_achats');
    res.json({ url });
  } catch (err) {
    console.error('[UPLOAD JUSTIFICATIF ERR]', err);
    res.status(500).json({ error: 'Erreur lors du téléchargement du fichier' });
  }
});

// ── GET /api/boutiques/:id/documents/:docId/pdf — Générer le PDF A4 du document (Facture, Devis, Proforma)
router.get('/:id/documents/:docId/pdf', verifierToken, param('id').isUUID(), param('docId').isUUID(), async (req, res) => {
  try {
    const { id: idParam, docId } = req.params;
    const bAccess = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!bAccess && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé au document PDF' });
    }
    const boutiqueId = bAccess.id;

    const bRes = await pool.query('SELECT * FROM boutiques WHERE id=$1', [boutiqueId]);
    const boutique = bRes.rows[0];
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

    const dRes = await pool.query('SELECT * FROM caisse_documents WHERE id=$1 AND boutique_id=$2', [docId, boutiqueId]);
    const document = dRes.rows[0];
    if (!document) return res.status(404).json({ error: 'Document introuvable' });

    let client = null;
    if (document.client_id) {
      const cRes = await pool.query('SELECT * FROM caisse_clients_credits WHERE id=$1', [document.client_id]);
      client = cRes.rows[0] || null;
    }

    const PDFDocument = require('pdfkit');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.type}-${document.reference}.pdf"`);

    const modele = String(req.query.modele || boutique.modele_facture || 'moderne').toLowerCase();
    const couleurTheme = boutique.couleur_theme || '#1e3a5f';
    const isInstitutionnel = modele === 'institutionnel';

    const NAVY  = isInstitutionnel ? '#0f2942' : couleurTheme;
    const ORANGE = isInstitutionnel ? '#047857' : '#C75B00';
    const GRAY  = '#6b7280';
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // Helper de nettoyage de texte (nettoie les \r de Windows qui créent des "Đ" parasite dans PDFKit)
    const cleanText = (str) => String(str || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

    // Formatter FCFA — espace normal (pas insécable) pour compatibilité PDFKit
    const fmtNum = (n) => {
      const num = Number(n || 0);
      const fixed = num % 1 === 0 ? num.toString() : num.toFixed(2);
      const [entier, decimale] = fixed.split('.');
      const milliers = entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return decimale ? `${milliers},${decimale}` : milliers;
    };

    // ── En-tête émetteur (gauche) ───────────────────────────────────────
    const headerTop = 50;
    if (isInstitutionnel) {
      doc.fillColor('#047857').fontSize(7.5).font('Helvetica-Bold')
         .text('RÉPUBLIQUE DU SÉNÉGAL • CODE GÉNÉRAL DES IMPÔTS • NORME OHADA / SYSCOHADA', 50, headerTop - 15);
    }
    doc.fillColor(NAVY).fontSize(20).font('Helvetica-Bold')
       .text(boutique.nom, 50, headerTop);
    doc.fontSize(10).font('Helvetica').fillColor(GRAY);
    let infoY = headerTop + 26;
    if (boutique.forme_juridique) {
      let juridique = boutique.forme_juridique;
      if (boutique.capital_social) juridique += ` — Capital : ${boutique.capital_social}`;
      doc.text(juridique, 50, infoY);
      infoY += 14;
    }
    if (boutique.adresse) {
      doc.text(boutique.adresse, 50, infoY);
      infoY += 14;
    }
    if (boutique.telephone) {
      doc.text(`Tél : ${boutique.telephone}`, 50, infoY);
      infoY += 14;
    }
    if (boutique.rccm) {
      doc.text(`RCCM : ${boutique.rccm}`, 50, infoY);
      infoY += 14;
    }
    if (boutique.ninea) {
      doc.text(`NINEA : ${boutique.ninea}`, 50, infoY);
      infoY += 14;
    }

    // Ligne séparatrice
    doc.moveTo(50, infoY + 6)
       .lineTo(545, infoY + 6)
       .strokeColor(NAVY).lineWidth(1.5).stroke();

    doc.moveDown(3);

    // ── Titre Document ───────────────────────────────────────────────────
    const docY = Math.max(doc.y + 10, infoY + 20);
    const typeFmt = document.type === 'devis' ? 'DEVIS' : document.type === 'proforma' ? 'FACTURE PROFORMA' : 'FACTURE DE VENTE';
    doc.fillColor(NAVY).fontSize(22).font('Helvetica-Bold').text(typeFmt, 50, docY);
    doc.fillColor(GRAY).fontSize(10).font('Helvetica')
       .text(`Réf : ${document.reference}`, 50, docY + 28)
       .text(`Date : ${new Date(document.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, 50, docY + 42);
    if (document.date_echeance) {
      doc.text(`Échéance : ${new Date(document.date_echeance).toLocaleDateString('fr-FR')}`, 50, docY + 56);
    }

    // Bloc destinataire (droite)
    if (client) {
      doc.fillColor(NAVY).fontSize(11).font('Helvetica-Bold').text('Destinataire', 350, docY);
      doc.fillColor('#374151').fontSize(10).font('Helvetica')
         .text(client.nom, 350, docY + 16);
      let clientInfoY = docY + 30;
      if (client.telephone) {
        doc.text(`Tél : ${client.telephone}`, 350, clientInfoY);
        clientInfoY += 14;
      }
      if (client.adresse) {
        doc.text(client.adresse, 350, clientInfoY);
        clientInfoY += 14;
      }
      if (client.ninea) {
        doc.text(`NINEA : ${client.ninea}`, 350, clientInfoY);
      }
    } else {
      doc.fillColor(NAVY).fontSize(11).font('Helvetica-Bold').text('Destinataire', 350, docY);
      doc.fillColor('#374151').fontSize(10).font('Helvetica')
         .text('Client Passant (Anonyme)', 350, docY + 16);
    }

    doc.moveDown(4);

    // ── Tableau des items ──────────────────────────────────────────────────
    const tableTop = Math.max(doc.y + 15, docY + 75);
    const col = { desc: 50, qty: 310, pu: 370, total: 450 };

    doc.rect(50, tableTop, 495, 24).fill(NAVY);
    doc.fillColor('#fff').fontSize(10).font('Helvetica-Bold');
    doc.text('Désignation',       col.desc + 6, tableTop + 7, { width: 250 });
    doc.text('Qté',              col.qty,       tableTop + 7, { width: 50, align: 'right' });
    doc.text('P.U. (FCFA)',      col.pu,        tableTop + 7, { width: 70, align: 'right' });
    doc.text('Total (FCFA)',     col.total,     tableTop + 7, { width: 90, align: 'right' });

    let currentY = tableTop + 24;
    const itemsList = Array.isArray(document.items) ? document.items : JSON.parse(document.items || '[]');

    itemsList.forEach((item, idx) => {
      const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(50, currentY, 495, 28).fill(bg);
      doc.fillColor('#111').fontSize(10).font('Helvetica');
      const puItem = Number(item.prix_unitaire || item.prix || 0);
      const qteItem = Number(item.quantite || 1);
      doc.text(item.nom || 'Article', col.desc + 6, currentY + 9, { width: 250 });
      doc.text(String(qteItem), col.qty, currentY + 9, { width: 50, align: 'right' });
      doc.text(fmtNum(puItem), col.pu, currentY + 9, { width: 70, align: 'right' });
      doc.text(fmtNum(puItem * qteItem), col.total, currentY + 9, { width: 90, align: 'right' });
      currentY += 28;
    });

    doc.moveTo(50, currentY).lineTo(545, currentY).strokeColor('#e5e7eb').lineWidth(1).stroke();
    currentY += 15;

    // ── Totaux & Taxes ────────────────────────────────────────────────────
    const totalX = 330;
    const labelW = 110;
    const valueW = 100;

    doc.fontSize(10).font('Helvetica');
    
    // Total HT
    doc.fillColor(GRAY).text('Total Hors Taxes :', totalX, currentY, { width: labelW });
    doc.fillColor('#111').font('Helvetica-Bold').text(`${fmtNum(document.total_ht)} FCFA`, totalX + labelW, currentY, { width: valueW, align: 'right' });
    currentY += 16;

    // Total TVA
    if (Number(document.total_tva || 0) > 0) {
      doc.fillColor(GRAY).font('Helvetica').text('TVA :', totalX, currentY, { width: labelW });
      doc.fillColor('#111').font('Helvetica-Bold').text(`${fmtNum(document.total_tva)} FCFA`, totalX + labelW, currentY, { width: valueW, align: 'right' });
      currentY += 16;
    }

    // Timbre Fiscal
    if (Number(document.timbre_fiscal || 0) > 0) {
      doc.fillColor(GRAY).font('Helvetica').text('Timbre Fiscal (1%) :', totalX, currentY, { width: labelW });
      doc.fillColor('#111').font('Helvetica-Bold').text(`${fmtNum(document.timbre_fiscal)} FCFA`, totalX + labelW, currentY, { width: valueW, align: 'right' });
      currentY += 16;
    }

    // Retenue BRS
    if (Number(document.retenue_brs || 0) > 0) {
      doc.fillColor(GRAY).font('Helvetica').text('Retenue BRS :', totalX, currentY, { width: labelW });
      doc.fillColor('#111').font('Helvetica-Bold').text(`-${fmtNum(document.retenue_brs)} FCFA`, totalX + labelW, currentY, { width: valueW, align: 'right' });
      currentY += 16;
    }

    // Net à payer (mis en évidence)
    currentY += 4;
    doc.rect(totalX - 5, currentY - 3, labelW + valueW + 10, 22).fill('#f0f4f8');
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12).text('Net à payer :', totalX, currentY, { width: labelW });
    doc.text(`${fmtNum(document.net_a_payer)} FCFA`, totalX + labelW, currentY, { width: valueW, align: 'right' });
    currentY += 30;

    // ── Notes du document ─────────────────────────────────────────────────
    if (document.notes) {
      doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold').text('Notes :', 50, currentY);
      doc.font('Helvetica').fillColor(GRAY).text(cleanText(document.notes), 50, currentY + 12, { width: 495 });
      currentY = doc.y + 15;
    }

    // ── Coordonnées bancaires ─────────────────────────────────────────────
    if (boutique.compte_bancaire) {
      doc.moveTo(50, currentY).lineTo(545, currentY).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      currentY += 10;
      doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold').text('Coordonnées bancaires pour règlement :', 50, currentY);
      currentY += 13;
      doc.fillColor(GRAY).fontSize(8).font('Helvetica').text(cleanText(boutique.compte_bancaire), 50, currentY, { width: 495 });
      currentY = doc.y + 10;
    }

    // ── Conditions de vente & Mentions de règlement ─────────────────────────
    const isDevisOuProforma = document.type === 'devis' || document.type === 'proforma';

    if (isDevisOuProforma && boutique.conditions_vente) {
      // Pour les Devis & Proformas : Affichage complet des CGV
      if (currentY > 670) {
        doc.addPage();
        currentY = 50;
      }
      doc.moveTo(50, currentY).lineTo(545, currentY).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      currentY += 10;
      doc.fillColor(NAVY).fontSize(8).font('Helvetica-Bold').text('Conditions Générales de Vente :', 50, currentY);
      currentY += 11;
      doc.fillColor(GRAY).fontSize(7).font('Helvetica').text(cleanText(boutique.conditions_vente), 50, currentY, { width: 495, lineGap: 2 });
      currentY = doc.y + 10;
    } else {
      // Pour les Factures de vente : Condensé légal (1 seule page A4)
      if (currentY > 730) {
        doc.addPage();
        currentY = 50;
      }
      doc.moveTo(50, currentY).lineTo(545, currentY).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      currentY += 8;
      doc.fillColor(GRAY).fontSize(7.5).font('Helvetica-Oblique')
         .text("Règlement à réception. Réserve de propriété : les marchandises restent la propriété du vendeur jusqu'au paiement intégral du prix.", 50, currentY, { width: 495, align: 'center' });
      currentY = doc.y + 8;
    }

    // ── Mentions légales TVA ──────────────────────────────────────────────
    if (boutique.regime_fiscal === 'non_assujetti') {
      if (currentY > 720) { doc.addPage(); currentY = 50; }
      doc.fillColor(GRAY).fontSize(8).font('Helvetica-Oblique')
         .text("TVA non applicable - article 286 du Code Général des Impôts (CGI) du Sénégal.", 50, currentY, { align: 'center', width: 495 });
      currentY = doc.y + 8;
    }

    // ── Pied de page personnalisé ─────────────────────────────────────────
    if (boutique.pied_de_page_document) {
      if (currentY > 740) { doc.addPage(); currentY = 50; }
      doc.fillColor('#9ca3af').fontSize(8).font('Helvetica-Oblique')
         .text(cleanText(boutique.pied_de_page_document), 50, currentY, { align: 'center', width: 495 });
    }

    doc.end();
  } catch (err) {
    console.error('[GET DOCUMENT PDF ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
  }
});

router.get('/:id/logs/export.csv', verifierToken, async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé au journal d\'audit' });
    }
    const boutique = b;

    const { type, q } = req.query;
    let queryParts = ['boutique_id = $1'];
    let values = [boutique.id];
    let vIndex = 2;

    if (type && type !== 'tous') {
      queryParts.push(`type_action = $${vIndex++}`);
      values.push(type);
    }
    if (q) {
      queryParts.push(`(auteur_nom ILIKE $${vIndex} OR description ILIKE $${vIndex})`);
      values.push(`%${q}%`);
      vIndex++;
    }

    const r = await pool.query(
      `SELECT created_at, auteur_nom, type_action, description, metadonnees, ip_adresse
       FROM boutique_logs
       WHERE ${queryParts.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT 2000`,
      values
    );

    let csv = '\uFEFFDate;Heure;Auteur;Type d\'action;Description;IP\n';
    r.rows.forEach(l => {
      const d = new Date(l.created_at);
      const dateStr = d.toLocaleDateString('fr-FR');
      const heureStr = d.toLocaleTimeString('fr-FR');
      // Anti CSV-injection : si un champ commence par =, +, -, @, \t, préfixer par une apostrophe
      const sanitizeCell = (txt) => {
        let str = String(txt || '').replace(/;/g, ',').replace(/\n/g, ' ').replace(/"/g, '""');
        if (/^[=+\-@\t\r]/.test(str)) {
          str = "'" + str;
        }
        return `"${str}"`;
      };
      csv += `${dateStr};${heureStr};${sanitizeCell(l.auteur_nom)};${sanitizeCell(l.type_action)};${sanitizeCell(l.description)};${sanitizeCell(l.ip_adresse || '')}\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=journal_audit_${(boutique.nom || 'boutique').replace(/[^a-z0-9]/gi, '_')}.csv`);
    res.status(200).send(csv);
  } catch (err) {
    console.error('[EXPORT LOGS CSV ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l\'exportation CSV' });
  }
});

// GET /api/boutiques/:id/logs
router.get('/:id/logs', verifierToken, async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé au journal d\'audit' });
    }
    const boutiqueId = b.id;

    const { type, q, limit = 100 } = req.query;
    let queryParts = ['boutique_id = $1'];
    let values = [boutiqueId];
    let vIndex = 2;

    if (type && type !== 'tous') {
      queryParts.push(`type_action = $${vIndex++}`);
      values.push(type);
    }
    if (q) {
      queryParts.push(`(auteur_nom ILIKE $${vIndex} OR description ILIKE $${vIndex})`);
      values.push(`%${q}%`);
      vIndex++;
    }

    const limitVal = Math.min(parseInt(limit, 10) || 100, 500);
    const sql = `SELECT id, auteur_nom, type_action, description, metadonnees, ip_adresse, created_at
                 FROM boutique_logs
                 WHERE ${queryParts.join(' AND ')}
                 ORDER BY created_at DESC
                 LIMIT ${limitVal}`;
    const r = await pool.query(sql, values);

    res.json({ success: true, logs: r.rows });
  } catch (err) {
    console.error('[GET LOGS ERR]', err);
    res.status(500).json({ error: 'Erreur de chargement des logs' });
  }
});

// ── ROUTE TERMINAL CAISSIER (ACCÈS SANS SESSION PROPRIÉTAIRE) ────────────────

// GET /api/boutiques/caisse-terminal/:token
module.exports = router;
