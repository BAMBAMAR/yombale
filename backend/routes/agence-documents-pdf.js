// backend/routes/agence-documents-pdf.js
// Moteur de génération des documents légaux et officiels de l'agence immobilière en PDF (PDFKit)
// Quittances de loyer, Contrats de bail, Mandats officiels, Décomptes de gérance bailleur
// ZÉRO fetch externe de polices (100% Helvetica natif sécurisé)

const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');

// Helper de nettoyage de texte (élimine les retours chariot Windows \r parasites dans PDFKit)
const cleanText = (str) => String(str || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

// Formatter FCFA — espace simple pour compatibilité parfaite PDFKit Helvetica
const fmtNum = (n) => {
  const num = Math.round(Number(n || 0));
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

// Couleurs charte Nopalou
const NAVY = '#1C2B4A';
const ACCENT = '#C75B00';
const PRICE_GREEN = '#0A5C36';
const GRAY = '#4B5563';
const LIGHT_GRAY = '#9CA3AF';
const BORDER_COLOR = '#E5E7EB';

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/agences/agence/:slugOrId/documents/quittance/:loyerId.pdf
// ─────────────────────────────────────────────────────────────────────────────
router.get('/agence/:slugOrId/documents/quittance/:loyerId.pdf', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { loyerId } = req.params;

    const { rows } = await pool.query(
      `SELECT le.*,
              bx.id AS bail_id, bx.loyer_mensuel, bx.charges AS charges_bail, bx.depot_garantie,
              b.titre AS bien_titre, b.adresse AS bien_adresse, b.quartier AS bien_quartier, b.ville AS bien_ville, b.reference AS bien_reference,
              c.nom AS locataire_nom, c.prenom AS locataire_prenom, c.telephone AS locataire_tel, c.email AS locataire_email,
              p.nom AS bailleur_nom, p.prenom AS bailleur_prenom, p.telephone AS bailleur_tel,
              a.nom AS agence_nom, a.telephone AS agence_tel, a.email_contact AS agence_email,
              a.adresse AS agence_adresse, a.ville AS agence_ville, a.numero_agrement
       FROM loyers_echeances le
       JOIN baux_immo bx ON le.bail_id = bx.id
       JOIN biens_immo b ON bx.bien_id = b.id
       JOIN contacts_immo c ON bx.locataire_id = c.id
       LEFT JOIN proprietaires_immo p ON b.proprietaire_id = p.id
       JOIN agences_immo a ON le.agence_id = a.id
       WHERE le.id = $1 AND le.agence_id = $2`,
      [loyerId, agenceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Échéance de loyer introuvable' });
    }

    const d = rows[0];
    const quittanceRef = d.quittance_url || `QT-${d.periode}-${d.id.slice(0, 8).toUpperCase()}`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="quittance_${quittanceRef}.pdf"`);

    const doc = new PDFDocument({ margin: 45, size: 'A4' });
    doc.pipe(res);

    // ── En-tête légal ──
    doc.fillColor(PRICE_GREEN).fontSize(7.5).font('Helvetica-Bold')
       .text("RÉPUBLIQUE DU SÉNÉGAL • CODE DES OBLIGATIONS CIVILES ET COMMERCIALES (COCC) • GESTION LOCATIVE CONFORME", 45, 40);

    // ── Bloc Agence (Émetteur) ──
    doc.fillColor(NAVY).fontSize(18).font('Helvetica-Bold').text(d.agence_nom, 45, 58);
    let infoY = 80;
    doc.fontSize(8.5).font('Helvetica').fillColor(GRAY);
    if (d.numero_agrement) { doc.text(`Agrément Professionnel : ${d.numero_agrement}`, 45, infoY); infoY += 12; }
    if (d.agence_adresse) { doc.text(d.agence_adresse + (d.agence_ville ? `, ${d.agence_ville}` : ''), 45, infoY); infoY += 12; }
    if (d.agence_tel) { doc.text(`Tél : ${d.agence_tel}${d.agence_email ? ` • Email : ${d.agence_email}` : ''}`, 45, infoY); infoY += 12; }

    // Ligne séparatrice
    doc.moveTo(45, infoY + 6).lineTo(550, infoY + 6).strokeColor(NAVY).lineWidth(1.5).stroke();

    // ── Titre Quittance ──
    const titleY = infoY + 18;
    doc.fillColor(NAVY).fontSize(18).font('Helvetica-Bold').text('QUITTANCE DE LOYER', 45, titleY);
    doc.fillColor(GRAY).fontSize(9).font('Helvetica')
       .text(`Réf : ${quittanceRef}`, 45, titleY + 22)
       .text(`Période acquittée : ${d.periode}`, 45, titleY + 34)
       .text(`Date d'émission : ${new Date(d.date_paiement || d.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, 45, titleY + 46);

    // ── Blocs Parties (Locataire à droite, Bien à gauche) ──
    const partiesY = titleY + 70;
    
    // Cadre Locataire
    doc.roundedRect(305, partiesY, 245, 95, 6).fillColor('#F8FAFC').fillAndStroke('#E2E8F0');
    doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text('LOCATAIRE (PRENEUR)', 315, partiesY + 10);
    doc.fillColor('#1F2937').fontSize(9.5).font('Helvetica-Bold')
       .text(`${cleanText(d.locataire_prenom)} ${cleanText(d.locataire_nom)}`.trim(), 315, partiesY + 26);
    doc.font('Helvetica').fontSize(8.5).fillColor(GRAY)
       .text(`Téléphone : ${d.locataire_tel || 'N/A'}`, 315, partiesY + 42)
       .text(`Email : ${d.locataire_email || 'N/A'}`, 315, partiesY + 54)
       .text(`Bail Réf : ${d.bail_id.slice(0, 8).toUpperCase()}`, 315, partiesY + 66);

    // Cadre Bien loué
    doc.roundedRect(45, partiesY, 250, 95, 6).fillColor('#F8FAFC').fillAndStroke('#E2E8F0');
    doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text('BIEN LOUÉ & PROPRIÉTAIRE', 55, partiesY + 10);
    doc.fillColor('#1F2937').fontSize(9.5).font('Helvetica-Bold')
       .text(cleanText(d.bien_titre), 55, partiesY + 26, { width: 230 });
    let bY = partiesY + 42;
    if (d.bien_adresse || d.bien_quartier) {
      doc.font('Helvetica').fontSize(8.5).fillColor(GRAY)
         .text(`${d.bien_adresse || ''} ${d.bien_quartier ? `(${d.bien_quartier})` : ''} - ${d.bien_ville || 'Dakar'}`, 55, bY, { width: 230 });
      bY += 24;
    }
    const propNom = [d.bailleur_prenom, d.bailleur_nom].filter(Boolean).join(' ') || 'Propriétaire Mandant';
    doc.font('Helvetica').fontSize(8.5).fillColor(GRAY)
       .text(`Bailleur : ${propNom} (représenté)`, 55, bY);

    // ── Tableau des montants ──
    const tableY = partiesY + 115;
    
    // En-tête tableau
    doc.rect(45, tableY, 505, 24).fillColor(NAVY).fill();
    doc.fillColor('#FFFFFF').fontSize(9.5).font('Helvetica-Bold')
       .text('DÉSIGNATION DES SOMMES ACQUITTÉES', 55, tableY + 7)
       .text('PÉRIODE', 320, tableY + 7)
       .text('MONTANT', 465, tableY + 7, { align: 'right', width: 75 });

    // Lignes du tableau
    let currentY = tableY + 24;
    const loyerNu = Math.max(Number(d.loyer_mensuel || d.montant_du) - Number(d.charges_bail || 0), 0);
    const charges = Number(d.charges_bail || 0);
    const timbre = 100; // Droit de timbre légal sénégalais quittance
    const totalPaye = Number(d.montant_paye || d.montant_du);

    const drawRow = (libelle, detail, montant, isEven) => {
      if (isEven) doc.rect(45, currentY, 505, 22).fillColor('#F8F9FA').fill();
      doc.fillColor('#1F2937').fontSize(9).font('Helvetica').text(libelle, 55, currentY + 6);
      doc.fillColor(GRAY).fontSize(8.5).text(detail, 320, currentY + 6);
      doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold').text(`${fmtNum(montant)} FCFA`, 465, currentY + 6, { align: 'right', width: 75 });
      doc.moveTo(45, currentY + 22).lineTo(550, currentY + 22).strokeColor(BORDER_COLOR).lineWidth(0.5).stroke();
      currentY += 22;
    };

    drawRow('Loyer principal d\'habitation', d.periode, loyerNu, false);
    if (charges > 0) {
      drawRow('Charges locatives forfaitaires', d.periode, charges, true);
    }
    drawRow('Droit de timbre fiscal légal (Art. 544 CGI)', 'Réglementaire', timbre, charges === 0);

    // Ligne Total
    currentY += 4;
    doc.rect(45, currentY, 505, 28).fillColor('#ECFDF5').strokeColor(PRICE_GREEN).lineWidth(1).fillAndStroke();
    doc.fillColor(PRICE_GREEN).fontSize(10.5).font('Helvetica-Bold')
       .text('TOTAL INTÉGRALEMENT ACQUITTÉ', 55, currentY + 8)
       .text(`${fmtNum(totalPaye)} FCFA`, 430, currentY + 8, { align: 'right', width: 110 });

    currentY += 38;

    // ── Déclaration légale et mode de règlement ──
    doc.roundedRect(45, currentY, 505, 65, 6).fillColor('#FAFAFA').strokeColor(BORDER_COLOR).lineWidth(0.5).fillAndStroke();
    doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold')
       .text('DÉTAILS DU PAIEMENT & DÉCHARGE', 55, currentY + 8);
    doc.fillColor(GRAY).fontSize(8.5).font('Helvetica')
       .text(`Mode d'encaissement : ${String(d.mode_paiement || 'Wave / Virement').toUpperCase()}`, 55, currentY + 22)
       .text(`Référence transaction : ${d.reference_paiement || quittanceRef}`, 55, currentY + 34)
       .text(`Date de valeur : ${new Date(d.date_paiement || d.created_at).toLocaleDateString('fr-FR')}`, 55, currentY + 46);

    doc.fillColor(NAVY).fontSize(8.5).font('Helvetica-Bold')
       .text(`Solde restant dû : ${fmtNum(d.montant_restant || 0)} FCFA`, 340, currentY + 22);
    doc.fillColor(PRICE_GREEN).fontSize(8.5).font('Helvetica-Bold')
       .text(`Statut : ${d.statut === 'paye' ? 'INTÉGRALEMENT RÉGLÉ' : 'ACOMPTE ENCAISSÉ'}`, 340, currentY + 34);

    // ── Cadre Visa & Cachet Numérique ──
    const stampY = currentY + 80;
    doc.roundedRect(330, stampY, 220, 95, 6).strokeColor(PRICE_GREEN).lineWidth(1.2).stroke();
    doc.fillColor(PRICE_GREEN).fontSize(9).font('Helvetica-Bold')
       .text('VISA & CACHET DE L\'AGENCE', 340, stampY + 10, { align: 'center', width: 200 });
    doc.fillColor(GRAY).fontSize(7.5).font('Helvetica')
       .text(`Quittance certifiée conforme par`, 340, stampY + 26, { align: 'center', width: 200 })
       .text(cleanText(d.agence_nom), 340, stampY + 37, { align: 'center', width: 200 })
       .text(`Délivrée le ${new Date().toLocaleDateString('fr-FR')}`, 340, stampY + 50, { align: 'center', width: 200 });
    doc.fillColor(PRICE_GREEN).fontSize(8).font('Helvetica-Bold')
       .text('[ DOCUMENT VALIDE SANS SIGNATURE MANUSCRITE ]', 340, stampY + 70, { align: 'center', width: 200 });

    // Mentions légales bas de page
    doc.fillColor(LIGHT_GRAY).fontSize(7).font('Helvetica')
       .text("Cette quittance annule tous les reçus qui auraient pu être donnés pour acompte sur le présent terme. Elle est délivrée sous réserve de tous droits et actions.", 45, 750, { width: 505, align: 'center' })
       .text("Document généré informatiquement par le système de gestion Nopalou Immobilier.", 45, 762, { width: 505, align: 'center' });

    doc.end();
  } catch (err) {
    console.error('[PDF QUITTANCE ERR]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la génération de la quittance PDF' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /api/agences/agence/:slugOrId/documents/bail/:bailId.pdf
// ─────────────────────────────────────────────────────────────────────────────
router.get('/agence/:slugOrId/documents/bail/:bailId.pdf', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { bailId } = req.params;

    const { rows } = await pool.query(
      `SELECT bx.*,
              b.titre AS bien_titre, b.adresse AS bien_adresse, b.quartier AS bien_quartier,
              b.ville AS bien_ville, b.type_bien, b.surface_m2, b.nb_pieces, b.nb_chambres, b.reference AS bien_ref,
              c.nom AS locataire_nom, c.prenom AS locataire_prenom, c.telephone AS locataire_tel,
              c.email AS locataire_email, c.profession AS locataire_profession,
              p.nom AS bailleur_nom, p.prenom AS bailleur_prenom, p.telephone AS bailleur_tel,
              p.adresse AS bailleur_adresse,
              a.nom AS agence_nom, a.telephone AS agence_tel, a.email_contact AS agence_email,
              a.adresse AS agence_adresse, a.ville AS agence_ville, a.numero_agrement
       FROM baux_immo bx
       JOIN biens_immo b ON bx.bien_id = b.id
       JOIN contacts_immo c ON bx.locataire_id = c.id
       LEFT JOIN proprietaires_immo p ON b.proprietaire_id = p.id
       JOIN agences_immo a ON bx.agence_id = a.id
       WHERE bx.id = $1 AND bx.agence_id = $2`,
      [bailId, agenceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contrat de bail introuvable' });
    }

    const b = rows[0];
    const bailRef = `BAIL-${b.id.slice(0, 8).toUpperCase()}`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="contrat_bail_${bailRef}.pdf"`);

    const doc = new PDFDocument({ margin: 45, size: 'A4' });
    doc.pipe(res);

    // ── En-tête officiel ──
    doc.fillColor(NAVY).fontSize(7.5).font('Helvetica-Bold')
       .text("RÉPUBLIQUE DU SÉNÉGAL • CODE DES OBLIGATIONS CIVILES ET COMMERCIALES (COCC) • DÉCRET N° 2023-442", 45, 40);

    doc.fillColor(NAVY).fontSize(16).font('Helvetica-Bold').text(b.agence_nom, 45, 56);
    doc.fontSize(8.5).font('Helvetica').fillColor(GRAY)
       .text(`Mandataire de gestion • Agrément : ${b.numero_agrement || 'En cours'} • ${b.agence_ville || 'Dakar'}`, 45, 75);

    doc.moveTo(45, 90).lineTo(550, 90).strokeColor(NAVY).lineWidth(1.2).stroke();

    // ── Titre ──
    doc.fillColor(NAVY).fontSize(16).font('Helvetica-Bold')
       .text("CONTRAT DE BAIL À USAGE D'HABITATION", 45, 105, { align: 'center', width: 505 });
    doc.fillColor(ACCENT).fontSize(9).font('Helvetica-Bold')
       .text(`RÉFÉRENCE OFFICIELLE : ${bailRef}`, 45, 125, { align: 'center', width: 505 });

    let currentY = 145;

    // ── Article 1 : Les Parties ──
    doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text("ARTICLE 1 - DÉSIGNATION DES PARTIES", 45, currentY);
    currentY += 14;

    const propNom = [b.bailleur_prenom, b.bailleur_nom].filter(Boolean).join(' ') || 'Le Propriétaire';
    const locNom = [b.locataire_prenom, b.locataire_nom].filter(Boolean).join(' ');

    doc.fillColor('#1F2937').fontSize(8.5).font('Helvetica')
       .text(`1. LE BAILLEUR : Monsieur/Madame ${propNom}, représenté(e) valablement aux fins des présentes par l'Agence ${b.agence_nom}, mandataire de gestion dument habilité.`, 45, currentY, { width: 505, lineGap: 2 });
    currentY += 28;

    doc.text(`2. LE PRENEUR (LOCATAIRE) : Monsieur/Madame ${locNom}, Téléphone : ${b.locataire_tel || 'Non renseigné'}${b.locataire_profession ? `, Profession : ${b.locataire_profession}` : ''}, Email : ${b.locataire_email || 'Non renseigné'}.`, 45, currentY, { width: 505, lineGap: 2 });
    currentY += 32;

    // ── Article 2 : Objet du bail & Description ──
    doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text("ARTICLE 2 - OBJET DU CONTRAT ET DÉSIGNATION DU BIEN", 45, currentY);
    currentY += 14;

    doc.fillColor('#1F2937').fontSize(8.5).font('Helvetica')
       .text(`Le Bailleur donne à bail à usage exclusif d'habitation au Preneur qui accepte les locaux désignés ci-après :`, 45, currentY, { width: 505 });
    currentY += 14;

    doc.roundedRect(45, currentY, 505, 52, 4).fillColor('#F8FAFC').strokeColor(BORDER_COLOR).lineWidth(0.5).fillAndStroke();
    doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold')
       .text(cleanText(b.bien_titre), 55, currentY + 8)
       .text(`Type : ${String(b.type_bien || 'Appartement').toUpperCase()} • Surface : ${b.surface_m2 || 'N/A'} m² • Pièces : ${b.nb_pieces || 'N/A'} (Chambres : ${b.nb_chambres || 'N/A'})`, 55, currentY + 22);
    doc.font('Helvetica').fontSize(8.5).fillColor(GRAY)
       .text(`Adresse géographique : ${b.bien_adresse || 'Sise à'} ${b.bien_quartier ? `(${b.bien_quartier})` : ''} - ${b.bien_ville || 'Dakar'} (Réf : ${b.bien_ref || 'BIEN'})`, 55, currentY + 36);

    currentY += 62;

    // ── Article 3 : Durée & Prise d'effet ──
    doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text("ARTICLE 3 - DURÉE ET RENOUVELLEMENT DU BAIL", 45, currentY);
    currentY += 14;

    const dateDeb = new Date(b.date_debut).toLocaleDateString('fr-FR');
    const dateFin = b.date_fin ? new Date(b.date_fin).toLocaleDateString('fr-FR') : 'Indéterminée (Tacite reconduction)';

    doc.fillColor('#1F2937').fontSize(8.5).font('Helvetica')
       .text(`Le présent contrat est consenti pour une durée ferme de ${b.duree_mois || 12} mois, prenant effet le ${dateDeb} et se terminant le ${dateFin}. Sauf congé délivré par l'une des parties par acte d'huissier ou lettre recommandée avec préavis de 3 mois, le contrat sera reconduit tacitement.`, 45, currentY, { width: 505, lineGap: 2 });
    currentY += 32;

    // ── Article 4 : Loyer, Charges & Caution ──
    doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text("ARTICLE 4 - CONDITIONS FINANCIÈRES ET RÈGLEMENT", 45, currentY);
    currentY += 14;

    const loyer = Number(b.loyer_mensuel || 0);
    const charges = Number(b.charges || 0);
    const caution = Number(b.depot_garantie || 0);

    doc.rect(45, currentY, 505, 20).fillColor(NAVY).fill();
    doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold')
       .text('RUBRIQUE FINANCIÈRE', 55, currentY + 5)
       .text('PERIODICITÉ / MODALITÉ', 280, currentY + 5)
       .text('MONTANT', 460, currentY + 5, { align: 'right', width: 80 });
    currentY += 20;

    const addFinRow = (titre, modalite, montant) => {
      doc.rect(45, currentY, 505, 18).fillColor('#FFFFFF').fill();
      doc.fillColor('#1F2937').fontSize(8.5).font('Helvetica').text(titre, 55, currentY + 5);
      doc.fillColor(GRAY).text(modalite, 280, currentY + 5);
      doc.fillColor(NAVY).font('Helvetica-Bold').text(`${fmtNum(montant)} FCFA`, 460, currentY + 5, { align: 'right', width: 80 });
      doc.moveTo(45, currentY + 18).lineTo(550, currentY + 18).strokeColor(BORDER_COLOR).lineWidth(0.5).stroke();
      currentY += 18;
    };

    addFinRow('Loyer mensuel principal', `Échéance le ${b.jour_echeance || 5} du mois d'avance`, loyer);
    addFinRow('Provisions sur charges locatives', 'Mensuel avec le loyer', charges);
    addFinRow('Dépôt de garantie (Caution)', 'Versé à la signature (Max 2 mois)', caution);

    currentY += 10;

    // ── Article 5 : Obligations & Clause résolutoire ──
    doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text("ARTICLE 5 - OBLIGATIONS & CLAUSE RÉSOLUTOIRE DE PLEIN DROIT", 45, currentY);
    currentY += 14;
    doc.fillColor('#1F2937').fontSize(8).font('Helvetica')
       .text("Le Preneur s'engage à user des lieux loués paisiblement et conformément à leur destination d'habitation. Il est expressément convenu qu'à défaut de paiement d'un seul terme de loyer ou charges à son échéance exacte, ou en cas d'inexécution d'une clause du bail, le présent contrat sera résilié de plein droit un mois après un commandement de payer demeuré infructueux.", 45, currentY, { width: 505, lineGap: 2 });
    currentY += 34;

    // ── Signatures ──
    doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text("Fait en trois exemplaires originaux à " + (b.agence_ville || 'Dakar') + ", le " + dateDeb, 45, currentY);
    currentY += 18;

    // Cadres de signature
    doc.roundedRect(45, currentY, 240, 75, 4).strokeColor(NAVY).lineWidth(0.8).stroke();
    doc.fillColor(NAVY).fontSize(8.5).font('Helvetica-Bold').text("POUR LE PRENEUR (LE LOCATAIRE)", 55, currentY + 8);
    doc.fillColor(GRAY).fontSize(7.5).font('Helvetica')
       .text("Mention manuscrite 'Lu et approuvé'", 55, currentY + 22)
       .text(locNom, 55, currentY + 58);

    doc.roundedRect(310, currentY, 240, 75, 4).strokeColor(PRICE_GREEN).lineWidth(0.8).stroke();
    doc.fillColor(PRICE_GREEN).fontSize(8.5).font('Helvetica-Bold').text("POUR LE BAILLEUR / L'AGENCE (MANDATAIRE)", 320, currentY + 8);
    doc.fillColor(GRAY).fontSize(7.5).font('Helvetica')
       .text("Cachet et signature du mandataire habilité", 320, currentY + 22)
       .text(cleanText(b.agence_nom), 320, currentY + 58);

    doc.end();
  } catch (err) {
    console.error('[PDF BAIL ERR]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la génération du contrat de bail PDF' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /api/agences/agence/:slugOrId/documents/mandat/:mandatId.pdf
// ─────────────────────────────────────────────────────────────────────────────
router.get('/agence/:slugOrId/documents/mandat/:mandatId.pdf', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { mandatId } = req.params;

    const { rows } = await pool.query(
      `SELECT m.*,
              b.titre AS bien_titre, b.adresse AS bien_adresse, b.quartier AS bien_quartier,
              b.ville AS bien_ville, b.prix_vente, b.prix_location, b.reference AS bien_ref,
              p.nom AS bailleur_nom, p.prenom AS bailleur_prenom, p.telephone AS bailleur_tel,
              p.adresse AS bailleur_adresse, p.email AS bailleur_email,
              a.nom AS agence_nom, a.telephone AS agence_tel, a.email_contact AS agence_email,
              a.adresse AS agence_adresse, a.ville AS agence_ville, a.numero_agrement
       FROM mandats_immo m
       JOIN biens_immo b ON m.bien_id = b.id
       JOIN proprietaires_immo p ON m.proprietaire_id = p.id
       JOIN agences_immo a ON m.agence_id = a.id
       WHERE m.id = $1 AND m.agence_id = $2`,
      [mandatId, agenceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Mandat introuvable' });
    }

    const m = rows[0];
    const mandatRef = m.reference || `MDT-${m.id.slice(0, 8).toUpperCase()}`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="mandat_${mandatRef}.pdf"`);

    const doc = new PDFDocument({ margin: 45, size: 'A4' });
    doc.pipe(res);

    // En-tête
    doc.fillColor(NAVY).fontSize(7.5).font('Helvetica-Bold')
       .text("RÉPUBLIQUE DU SÉNÉGAL • LOI SUR LA TRANSACTION IMMOBILIÈRE ET LA GESTION DE BIENS", 45, 40);

    doc.fillColor(NAVY).fontSize(16).font('Helvetica-Bold').text(m.agence_nom, 45, 56);
    doc.fontSize(8.5).font('Helvetica').fillColor(GRAY)
       .text(`Agence Immobilière Professionnelle • Agrément : ${m.numero_agrement || 'En règle'}`, 45, 75);

    doc.moveTo(45, 90).lineTo(550, 90).strokeColor(NAVY).lineWidth(1.2).stroke();

    const isVente = m.type_operation === 'vente';
    const isExclusif = m.type_mandat === 'exclusif';
    const titreMandat = `MANDAT DE ${isVente ? 'VENTE' : 'GESTION LOCATIVE'} ${isExclusif ? 'EXCLUSIF' : 'SIMPLE'}`;

    doc.fillColor(NAVY).fontSize(16).font('Helvetica-Bold')
       .text(titreMandat, 45, 105, { align: 'center', width: 505 });
    doc.fillColor(ACCENT).fontSize(9).font('Helvetica-Bold')
       .text(`NUMÉRO D'ENREGISTREMENT AU REGISTRE DES MANDATS : ${mandatRef}`, 45, 125, { align: 'center', width: 505 });

    let currentY = 150;

    // Parties
    doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text("1. IDENTIFICATION DES PARTIES", 45, currentY);
    currentY += 14;

    const propNom = [m.bailleur_prenom, m.bailleur_nom].filter(Boolean).join(' ');
    doc.fillColor('#1F2937').fontSize(8.5).font('Helvetica')
       .text(`LE MANDANT : Monsieur/Madame ${propNom}, Téléphone : ${m.bailleur_tel || 'N/A'}, Adresse : ${m.bailleur_adresse || 'Dakar'}, ci-après dénommé "Le Propriétaire".`, 45, currentY, { width: 505, lineGap: 2 });
    currentY += 24;

    doc.text(`LE MANDATAIRE : L'Agence Immobilière ${m.agence_nom}, sise à ${m.agence_adresse || m.agence_ville || 'Dakar'}, représentée par son directeur dument mandaté.`, 45, currentY, { width: 505, lineGap: 2 });
    currentY += 28;

    // Objet
    doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text("2. OBJET DU MANDAT & DÉSIGNATION DU BIEN", 45, currentY);
    currentY += 14;
    doc.fillColor('#1F2937').fontSize(8.5).font('Helvetica')
       .text(`Le Mandant confie au Mandataire le mandat exclusif de ${isVente ? 'négocier la vente' : 'rechercher des locataires et gérer la location'} du bien suivant :`, 45, currentY, { width: 505 });
    currentY += 14;

    doc.roundedRect(45, currentY, 505, 45, 4).fillColor('#F8FAFC').strokeColor(BORDER_COLOR).lineWidth(0.5).fillAndStroke();
    doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold')
       .text(cleanText(m.bien_titre), 55, currentY + 8);
    doc.font('Helvetica').fontSize(8.5).fillColor(GRAY)
       .text(`Situation : ${m.bien_adresse || ''} ${m.bien_quartier ? `(${m.bien_quartier})` : ''} - ${m.bien_ville || 'Dakar'} (Réf : ${m.bien_ref || 'BIEN'})`, 55, currentY + 22);
    currentY += 55;

    // Conditions financières & Honoraires
    doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text("3. PRIX ET HONORAIRES DE L'AGENCE", 45, currentY);
    currentY += 14;

    const commissionTxt = m.montant_commission_fixe > 0
      ? `${fmtNum(m.montant_commission_fixe)} FCFA forfaitaires`
      : `${m.taux_commission || (isVente ? 5 : 10)}% ${isVente ? 'du prix net de vente' : 'du loyer mensuel hors charges'}`;

    doc.fillColor('#1F2937').fontSize(8.5).font('Helvetica')
       .text(`Prix fixé par le Mandant : ${fmtNum(isVente ? m.prix_vente : m.prix_location)} FCFA ${isVente ? 'net vendeur' : 'par mois'}.`, 45, currentY)
       .text(`Honoraires et rémunération de l'Agence : ${commissionTxt}, exigibles dès la conclusion définitive de la transaction ou lors de l'encaissement de chaque terme de loyer.`, 45, currentY + 14, { width: 505, lineGap: 2 });
    currentY += 40;

    // Durée
    doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text("4. DURÉE DU MANDAT", 45, currentY);
    currentY += 14;
    doc.fillColor('#1F2937').fontSize(8.5).font('Helvetica')
       .text(`Le présent mandat est consenti pour une durée de ${m.duree_mois || 12} mois à compter du ${new Date(m.date_debut).toLocaleDateString('fr-FR')}.`, 45, currentY, { width: 505 });
    currentY += 30;

    // Signatures
    doc.roundedRect(45, currentY, 240, 75, 4).strokeColor(NAVY).lineWidth(0.8).stroke();
    doc.fillColor(NAVY).fontSize(8.5).font('Helvetica-Bold').text("LE MANDANT (PROPRIÉTAIRE)", 55, currentY + 8);
    doc.fillColor(GRAY).fontSize(7.5).font('Helvetica')
       .text("Mention 'Bon pour mandat'", 55, currentY + 22)
       .text(propNom, 55, currentY + 58);

    doc.roundedRect(310, currentY, 240, 75, 4).strokeColor(PRICE_GREEN).lineWidth(0.8).stroke();
    doc.fillColor(PRICE_GREEN).fontSize(8.5).font('Helvetica-Bold').text("LE MANDATAIRE (L'AGENCE)", 320, currentY + 8);
    doc.fillColor(GRAY).fontSize(7.5).font('Helvetica')
       .text("Mention 'Mandat accepté'", 320, currentY + 22)
       .text(cleanText(m.agence_nom), 320, currentY + 58);

    doc.end();
  } catch (err) {
    console.error('[PDF MANDAT ERR]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la génération du mandat PDF' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /api/agences/agence/:slugOrId/documents/decompte-bailleur/:proprietaireId.pdf
// ─────────────────────────────────────────────────────────────────────────────
router.get('/agence/:slugOrId/documents/decompte-bailleur/:proprietaireId.pdf', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { proprietaireId } = req.params;
    const { periode } = req.query; // Ex: '2026-10' ou non spécifié

    // Récupération Propriétaire et Agence
    const propRes = await pool.query(
      `SELECT p.*, a.nom AS agence_nom, a.telephone AS agence_tel, a.email_contact AS agence_email,
              a.adresse AS agence_adresse, a.ville AS agence_ville, a.numero_agrement,
              a.parametres
       FROM proprietaires_immo p
       JOIN agences_immo a ON p.agence_id = a.id
       WHERE p.id = $1 AND p.agence_id = $2`,
      [proprietaireId, agenceId]
    );

    if (propRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Bailleur / Propriétaire introuvable' });
    }

    const p = propRes.rows[0];

    // Récupérer les loyers perçus pour les biens de ce bailleur
    let loyersQuery = `
      SELECT le.*, b.titre AS bien_titre, b.adresse AS bien_adresse,
             c.nom AS locataire_nom, c.prenom AS locataire_prenom
      FROM loyers_echeances le
      JOIN baux_immo bx ON le.bail_id = bx.id
      JOIN biens_immo b ON bx.bien_id = b.id
      JOIN contacts_immo c ON bx.locataire_id = c.id
      WHERE b.proprietaire_id = $1 AND le.agence_id = $2 AND le.statut = 'paye'
    `;
    const qParams = [proprietaireId, agenceId];
    if (periode) {
      loyersQuery += ` AND le.periode = $3`;
      qParams.push(periode);
    }
    loyersQuery += ` ORDER BY le.date_paiement DESC LIMIT 50`;

    const { rows: loyers } = await pool.query(loyersQuery, qParams);

    const decompteRef = `DEC-${periode || new Date().toISOString().slice(0, 7)}-${p.id.slice(0, 6).toUpperCase()}`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="decompte_bailleur_${decompteRef}.pdf"`);

    const doc = new PDFDocument({ margin: 45, size: 'A4' });
    doc.pipe(res);

    // En-tête
    doc.fillColor(NAVY).fontSize(16).font('Helvetica-Bold').text(p.agence_nom, 45, 50);
    doc.fontSize(8.5).font('Helvetica').fillColor(GRAY)
       .text(`Gestion Locative • Compte Rendu de Gestion Bailleur • ${p.agence_ville || 'Dakar'}`, 45, 70);

    doc.moveTo(45, 85).lineTo(550, 85).strokeColor(NAVY).lineWidth(1.2).stroke();

    doc.fillColor(NAVY).fontSize(15).font('Helvetica-Bold')
       .text("DÉCOMPTE DE GÉRANCE MENSUEL", 45, 100, { align: 'center', width: 505 });
    doc.fillColor(PRICE_GREEN).fontSize(9).font('Helvetica-Bold')
       .text(`RAPPORT DE REVERSEMENT • RÉF : ${decompteRef}`, 45, 118, { align: 'center', width: 505 });

    let currentY = 140;

    // Bloc Bailleur
    const propNom = [p.prenom, p.nom].filter(Boolean).join(' ');
    doc.roundedRect(45, currentY, 505, 50, 4).fillColor('#F8FAFC').strokeColor(BORDER_COLOR).lineWidth(0.5).fillAndStroke();
    doc.fillColor(NAVY).fontSize(9.5).font('Helvetica-Bold')
       .text(`BAILLEUR BÉNÉFICIAIRE : ${propNom}`, 55, currentY + 8);
    doc.font('Helvetica').fontSize(8.5).fillColor(GRAY)
       .text(`Téléphone : ${p.telephone || 'N/A'} • Email : ${p.email || 'N/A'}${p.iban ? ` • Compte / RIB : ${p.iban}` : ''}`, 55, currentY + 22)
       .text(`Période de reddition des comptes : ${periode || 'Derniers encaissements'}`, 55, currentY + 34);

    currentY += 65;

    // Tableau des loyers encaissés
    doc.rect(45, currentY, 505, 20).fillColor(NAVY).fill();
    doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold')
       .text('BIEN LOUÉ & LOCATAIRE', 55, currentY + 5)
       .text('PÉRIODE', 280, currentY + 5)
       .text('DATE PAIEMENT', 370, currentY + 5)
       .text('LOYER ENCAISSÉ', 460, currentY + 5, { align: 'right', width: 80 });
    currentY += 20;

    let totalEncaisse = 0;
    if (loyers.length === 0) {
      doc.rect(45, currentY, 505, 24).fillColor('#FFFFFF').fill();
      doc.fillColor(GRAY).fontSize(8.5).font('Helvetica-Oblique')
         .text("Aucun loyer encaissé enregistré pour cette période.", 55, currentY + 7);
      currentY += 24;
    } else {
      loyers.forEach((l, idx) => {
        const montant = Number(l.montant_paye || 0);
        totalEncaisse += montant;
        const loc = [l.locataire_prenom, l.locataire_nom].filter(Boolean).join(' ');
        if (idx % 2 === 1) doc.rect(45, currentY, 505, 18).fillColor('#F9FAFB').fill();
        doc.fillColor('#1F2937').fontSize(8).font('Helvetica')
           .text(`${l.bien_titre} (${loc})`, 55, currentY + 5, { width: 220 })
           .text(l.periode, 280, currentY + 5)
           .text(l.date_paiement ? new Date(l.date_paiement).toLocaleDateString('fr-FR') : 'Payé', 370, currentY + 5);
        doc.fillColor(PRICE_GREEN).font('Helvetica-Bold')
           .text(`${fmtNum(montant)} FCFA`, 460, currentY + 5, { align: 'right', width: 80 });
        doc.moveTo(45, currentY + 18).lineTo(550, currentY + 18).strokeColor(BORDER_COLOR).lineWidth(0.5).stroke();
        currentY += 18;
      });
    }

    currentY += 10;

    // Déductions honoraires de gestion
    const paramsAgence = p.parametres || {};
    const tauxCom = Number(paramsAgence.taux_commission_location_defaut || 10);
    const honoraires = Math.round((totalEncaisse * tauxCom) / 100);
    const netRever = totalEncaisse - honoraires;

    doc.rect(260, currentY, 290, 85).fillColor('#FAFAFA').strokeColor(BORDER_COLOR).lineWidth(0.8).fillAndStroke();
    
    doc.fillColor(NAVY).fontSize(8.5).font('Helvetica')
       .text("Total des loyers bruts encaissés :", 270, currentY + 8)
       .text(`Honoraires de gestion (${tauxCom}%) :`, 270, currentY + 24)
       .text("Débours & charges travaux retenues :", 270, currentY + 40);

    doc.fillColor(NAVY).font('Helvetica-Bold')
       .text(`${fmtNum(totalEncaisse)} FCFA`, 450, currentY + 8, { align: 'right', width: 90 });
    doc.fillColor(ACCENT).font('Helvetica-Bold')
       .text(`- ${fmtNum(honoraires)} FCFA`, 450, currentY + 24, { align: 'right', width: 90 });
    doc.fillColor(GRAY).font('Helvetica')
       .text("0 FCFA", 450, currentY + 40, { align: 'right', width: 90 });

    doc.moveTo(270, currentY + 56).lineTo(540, currentY + 56).strokeColor(BORDER_COLOR).lineWidth(0.5).stroke();

    doc.fillColor(PRICE_GREEN).fontSize(10).font('Helvetica-Bold')
       .text("NET REVERSÉ AU BAILLEUR :", 270, currentY + 64)
       .text(`${fmtNum(netRever)} FCFA`, 440, currentY + 64, { align: 'right', width: 100 });

    currentY += 105;

    // Visa et mention de règlement
    doc.roundedRect(45, currentY, 505, 60, 4).strokeColor(PRICE_GREEN).lineWidth(1).stroke();
    doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold')
       .text("AVIS DE REVERSEMENT & SIGNATURE DE L'AGENCE", 55, currentY + 8);
    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
       .text(`Le montant net de ${fmtNum(netRever)} FCFA a été viré ou mis à disposition du bailleur conformément au mandat de gestion.`, 55, currentY + 22, { width: 485 })
       .text(`Établi à ${p.agence_ville || 'Dakar'}, le ${new Date().toLocaleDateString('fr-FR')} par la direction de ${p.agence_nom}.`, 55, currentY + 36);

    doc.end();
  } catch (err) {
    console.error('[PDF DECOMPTE ERR]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la génération du décompte bailleur PDF' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET /api/agences/agence/:slugOrId/documents/facture/:factureId.pdf
// ─────────────────────────────────────────────────────────────────────────────
router.get('/agence/:slugOrId/documents/facture/:factureId.pdf', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { factureId } = req.params;

    const { rows } = await pool.query(
      `SELECT f.*,
              b.titre AS bien_titre, b.adresse AS bien_adresse, b.quartier AS bien_quartier,
              b.ville AS bien_ville, b.reference AS bien_ref,
              a.nom AS agence_nom, a.telephone AS agence_tel, a.email_contact AS agence_email,
              a.adresse AS agence_adresse, a.ville AS agence_ville, a.numero_agrement
       FROM factures_immo f
       LEFT JOIN biens_immo b ON f.bien_id = b.id
       JOIN agences_immo a ON f.agence_id = a.id
       WHERE f.id = $1 AND f.agence_id = $2`,
      [factureId, agenceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Facture d\'honoraires introuvable' });
    }

    const f = rows[0];
    const numFact = f.numero_facture || `FACT-${f.id.slice(0, 8).toUpperCase()}`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="facture_honoraires_${numFact}.pdf"`);

    const doc = new PDFDocument({ margin: 45, size: 'A4' });
    doc.pipe(res);

    // En-tête légal
    doc.fillColor(NAVY).fontSize(7.5).font('Helvetica-Bold')
       .text("RÉPUBLIQUE DU SÉNÉGAL • CODE DES OBLIGATIONS CIVILES ET COMMERCIALES (COCC) • ACTIVITÉS IMMOBILIÈRES", 45, 40);

    doc.fillColor(NAVY).fontSize(16).font('Helvetica-Bold').text(f.agence_nom, 45, 56);
    let hY = 75;
    doc.fontSize(8.5).font('Helvetica').fillColor(GRAY);
    if (f.numero_agrement) { doc.text(`Agrément Professionnel : ${f.numero_agrement}`, 45, hY); hY += 12; }
    if (f.agence_adresse) { doc.text(`${f.agence_adresse}${f.agence_ville ? `, ${f.agence_ville}` : ''}`, 45, hY); hY += 12; }
    if (f.agence_tel) { doc.text(`Tél : ${f.agence_tel}${f.agence_email ? ` • Email : ${f.agence_email}` : ''}`, 45, hY); hY += 12; }

    doc.moveTo(45, hY + 6).lineTo(550, hY + 6).strokeColor(NAVY).lineWidth(1.2).stroke();

    // Titre Facture Immobilière
    const titleY = hY + 18;
    const typeLabel = f.type_facture === 'honoraires_vente' ? 'FACTURE D\'HONORAIRES DE TRANSACTION IMMOBILIÈRE' :
                      f.type_facture === 'gestion_locative' ? 'FACTURE D\'HONORAIRES DE GESTION LOCATIVE' :
                      f.type_facture === 'honoraires_location' ? 'FACTURE D\'HONORAIRES DE LOCATION & RÉDACTION DE BAIL' :
                      f.type_facture === 'debours_travaux' ? 'FACTURE DE DÉBOURS & INTERVENTIONS TRAVAUX' :
                      f.type_facture === 'expertise' ? 'FACTURE D\'HONORAIRES D\'EXPERTISE & ESTIMATION' :
                      'FACTURE D\'HONORAIRES PROFESSIONNELS IMMOBILIERS';

    doc.fillColor(NAVY).fontSize(14).font('Helvetica-Bold').text(typeLabel, 45, titleY);
    doc.fillColor(ACCENT).fontSize(9).font('Helvetica-Bold')
       .text(`FACTURE OFFICIELLE N° : ${numFact}`, 45, titleY + 20);
    doc.fillColor(GRAY).fontSize(8.5).font('Helvetica')
       .text(`Date d'émission : ${new Date(f.date_emission).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, 45, titleY + 34)
       .text(`Date d'échéance : ${f.date_echeance ? new Date(f.date_echeance).toLocaleDateString('fr-FR') : 'À réception'}`, 45, titleY + 46);

    // Blocs Destinataire (Client/Mandant) et Bien rattaché
    const boxY = titleY + 68;

    // Cadre Client
    doc.roundedRect(305, boxY, 245, 80, 4).fillColor('#F8FAFC').strokeColor(BORDER_COLOR).lineWidth(0.5).fillAndStroke();
    doc.fillColor(NAVY).fontSize(9.5).font('Helvetica-Bold').text('CLIENT / MANDANT FACTURÉ', 315, boxY + 8);
    doc.fillColor('#1F2937').fontSize(9).font('Helvetica-Bold').text(cleanText(f.client_nom), 315, boxY + 24);
    doc.font('Helvetica').fontSize(8.5).fillColor(GRAY)
       .text(`Téléphone : ${f.client_tel || 'Non renseigné'}`, 315, boxY + 38)
       .text(`Email : ${f.client_email || 'Non renseigné'}`, 315, boxY + 50);

    // Cadre Bien immobilier
    doc.roundedRect(45, boxY, 250, 80, 4).fillColor('#F8FAFC').strokeColor(BORDER_COLOR).lineWidth(0.5).fillAndStroke();
    doc.fillColor(NAVY).fontSize(9.5).font('Helvetica-Bold').text('DOSSIER & BIEN CONCERNÉ', 55, boxY + 8);
    if (f.bien_titre) {
      doc.fillColor('#1F2937').fontSize(9).font('Helvetica-Bold').text(cleanText(f.bien_titre), 55, boxY + 24, { width: 230 });
      doc.font('Helvetica').fontSize(8.5).fillColor(GRAY)
         .text(`${f.bien_adresse || ''} ${f.bien_quartier ? `(${f.bien_quartier})` : ''} - ${f.bien_ville || 'Dakar'}`, 55, boxY + 40, { width: 230 })
         .text(`Réf portefeuille : ${f.bien_ref || 'IMMO'}`, 55, boxY + 54);
    } else {
      doc.font('Helvetica').fontSize(8.5).fillColor(GRAY)
         .text('Prestation d\'intermédiation / conseil immobilier général', 55, boxY + 28, { width: 230 });
    }

    // Tableau des prestations
    const tableY = boxY + 100;
    doc.rect(45, tableY, 505, 22).fillColor(NAVY).fill();
    doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold')
       .text('DÉSIGNATION DE LA PRESTATION D\'HONORAIRES IMMOBILIERS', 55, tableY + 6)
       .text('MONTANT H.T.', 455, tableY + 6, { align: 'right', width: 85 });

    let curY = tableY + 22;
    const ht = Number(f.montant_ht || 0);
    const tva = Number(f.montant_tva || 0);
    const timbre = Number(f.timbre_fiscal || 0);
    const ttc = Number(f.montant_ttc || (ht + tva + timbre));

    // Ligne de prestation
    doc.rect(45, curY, 505, 36).fillColor('#FFFFFF').fill();
    doc.fillColor('#1F2937').fontSize(9).font('Helvetica-Bold')
       .text(cleanText(typeLabel), 55, curY + 6);
    doc.font('Helvetica').fontSize(8).fillColor(GRAY)
       .text(f.notes ? cleanText(f.notes) : `Honoraires professionnels d'agence immobilière pour mission d'intermédiation et de gestion.`, 55, curY + 20, { width: 380 });
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9.5)
       .text(`${fmtNum(ht)} FCFA`, 455, curY + 10, { align: 'right', width: 85 });
    doc.moveTo(45, curY + 36).lineTo(550, curY + 36).strokeColor(BORDER_COLOR).lineWidth(0.5).stroke();

    curY += 45;

    // Décompte financier à droite
    doc.rect(260, curY, 290, 80).fillColor('#FAFAFA').strokeColor(BORDER_COLOR).lineWidth(0.8).fillAndStroke();
    doc.fillColor(NAVY).fontSize(8.5).font('Helvetica')
       .text("Total Honoraires Hors Taxes (HT) :", 270, curY + 8)
       .text(`TVA légale (${f.taux_tva || 18}%) :`, 270, curY + 24)
       .text("Droit de timbre fiscal (Art. 544 CGI) :", 270, curY + 40);

    doc.fillColor(NAVY).font('Helvetica-Bold')
       .text(`${fmtNum(ht)} FCFA`, 440, curY + 8, { align: 'right', width: 100 });
    doc.fillColor(GRAY).font('Helvetica-Bold')
       .text(`${fmtNum(tva)} FCFA`, 440, curY + 24, { align: 'right', width: 100 });
    doc.fillColor(GRAY).font('Helvetica')
       .text(`${fmtNum(timbre)} FCFA`, 440, curY + 40, { align: 'right', width: 100 });

    doc.moveTo(270, curY + 54).lineTo(540, curY + 54).strokeColor(BORDER_COLOR).lineWidth(0.5).stroke();

    doc.fillColor(ACCENT).fontSize(10).font('Helvetica-Bold')
       .text("NET À PAYER (TTC) :", 270, curY + 60)
       .text(`${fmtNum(ttc)} FCFA`, 430, curY + 60, { align: 'right', width: 110 });

    curY += 95;

    // Modalités de règlement & Statut
    doc.roundedRect(45, curY, 505, 55, 4).fillColor('#F8FAFC').strokeColor(BORDER_COLOR).lineWidth(0.5).fillAndStroke();
    doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold').text("MODALITÉS DE RÈGLEMENT", 55, curY + 8);
    doc.fillColor(GRAY).fontSize(8.5).font('Helvetica')
       .text(`Mode de paiement accepté : ${String(f.mode_paiement || 'Wave / Virement').toUpperCase()}`, 55, curY + 22)
       .text(`Règlement à réception. Mention légale : Honoraires d'agence exigibles conformément au mandat.`, 55, curY + 34);

    const isPayee = f.statut === 'payee';
    doc.fillColor(isPayee ? PRICE_GREEN : '#B45309').fontSize(9).font('Helvetica-Bold')
       .text(isPayee ? "[ FACTURE INTÉGRALEMENT ACQUITTÉE ]" : "[ EN ATTENTE DE RÈGLEMENT ]", 340, curY + 22);

    // Cachet & Signature
    const stampY = curY + 70;
    doc.roundedRect(330, stampY, 220, 85, 4).strokeColor(NAVY).lineWidth(1).stroke();
    doc.fillColor(NAVY).fontSize(8.5).font('Helvetica-Bold')
       .text("CACHET & SIGNATURE DE L'AGENCE", 340, stampY + 8, { align: 'center', width: 200 });
    doc.fillColor(GRAY).fontSize(7.5).font('Helvetica')
       .text(cleanText(f.agence_nom), 340, stampY + 24, { align: 'center', width: 200 })
       .text(`Délivrée le ${new Date(f.date_emission).toLocaleDateString('fr-FR')}`, 340, stampY + 38, { align: 'center', width: 200 })
       .text("[ DOCUMENT OFFICIEL CERTIFIÉ ]", 340, stampY + 60, { align: 'center', width: 200 });

    doc.end();
  } catch (err) {
    console.error('[PDF FACTURE IMMO ERR]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la génération de la facture d\'honoraires PDF' });
  }
});

module.exports = router;
