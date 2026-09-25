// backend/lib/immo-pdf-bail.js
// Moteur officiel de génération PDF des Contrats de Bail Immobiliers Nopalou
// Conforme au Code des Obligations Civiles et Commerciales (COCC) du Sénégal et Décret N° 2023-442

const PDFDocument = require('pdfkit');

const PDF_NAVY = '#1C2B4A';
const PDF_ACCENT = '#C75B00';
const PDF_PRICE_GREEN = '#0A5C36';
const PDF_GRAY = '#4B5563';
const PDF_LIGHT_GRAY = '#64748B';
const PDF_BORDER = '#E2E8F0';
const PDF_BG_CARD = '#F8FAFC';
const PDF_TEXT = '#1F2937';

const cleanPdfText = (str) => String(str || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

const fmtPdfNum = (n) => {
  const num = Math.round(Number(n || 0));
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/**
 * Génère le texte légal standard par défaut pour chaque article du bail
 */
function genererTextesDefautBail(b) {
  const propNom = [b.bailleur_prenom, b.bailleur_nom].filter(Boolean).join(' ') || 'Le Propriétaire';
  const locNom = [b.locataire_prenom, b.locataire_nom].filter(Boolean).join(' ') || 'Le Locataire';
  const dateDeb = b.date_debut ? new Date(b.date_debut).toLocaleDateString('fr-FR') : 'Date de début';
  const dateFin = b.date_fin ? new Date(b.date_fin).toLocaleDateString('fr-FR') : 'Indéterminée (Tacite reconduction)';
  const loyer = Number(b.loyer_mensuel || 0);
  const charges = Number(b.charges || 0);
  const total = loyer + charges;
  const caution = Number(b.depot_garantie || 0);
  const nbMois = b.duree_mois || 12;
  const jour = b.jour_echeance || 5;

  return {
    article1_parties:
`1. LE BAILLEUR : Monsieur/Madame ${propNom}, représenté(e) valablement aux fins des présentes par l'Agence ${b.agence_nom || 'L\'Agence Mandataire'}, mandataire de gestion dument habilité (Agrément : ${b.numero_agrement || 'En cours'}).
2. LE PRENEUR (LOCATAIRE) : Monsieur/Madame ${locNom}, Téléphone : ${b.locataire_tel || 'Non renseigné'}${b.locataire_profession ? `, Profession : ${b.locataire_profession}` : ''}, Email : ${b.locataire_email || 'Non renseigné'}.
3. CAUTION / GARANT SOLIDAIRE : Le preneur déclare contracter à titre personnel et exclusif. Tout garant ou caution solidaire éventuel s'engage expressément solidairement et indivisiblement au paiement régulier des loyers et charges.`,

    article2_bien:
`Le Bailleur donne à bail à usage exclusif d'habitation au Preneur qui accepte les locaux ci-après désignés :
• Désignation : ${b.bien_titre || 'Bien immobilier'}${b.bien_ref ? ` (Réf : ${b.bien_ref})` : ''}
• Type de bien : ${String(b.type_bien || 'Appartement').toUpperCase()} • Surface : ${b.surface_m2 || 'N/A'} m² • Nombre de pièces : ${b.nb_pieces || 'N/A'} (dont ${b.nb_chambres || 'N/A'} chambres)
• Situation géographique : ${b.bien_adresse || 'Sise à'} ${b.bien_quartier ? `(${b.bien_quartier})` : ''} - ${b.bien_ville || 'Dakar'}.
Les locaux loués comprennent toutes les dépendances, installations d'eau, d'électricité, sanitaires et accessoires mentionnés dans l'état des lieux contradictoire dressé à la remise des clés.`,

    article3_duree:
`Le présent contrat de bail est consenti pour une durée ferme de ${nbMois} mois, prenant effet le ${dateDeb} et se terminant le ${dateFin}.
À l'expiration de cette durée, le bail se renouvellera par tacite reconduction pour des périodes successives de même durée, sauf congé délivré par l'une des parties.
PRÉAVIS LÉGAL DE CONGÉ : Conformément au Code des Obligations Civiles et Commerciales (COCC) du Sénégal, le congé doit être notifié avec un préavis d'au moins trois (3) mois par lettre recommandée avec accusé de réception ou par exploit d'huissier de justice.`,

    article4_finances:
`1. LOYER MENSUEL PRINCIPAL : Le loyer nu est fixé à la somme de ${fmtPdfNum(loyer)} FCFA par mois.
2. CHARGES LOCATIVES : Provision mensuelle pour charges communes fixée à ${fmtPdfNum(charges)} FCFA par mois.
3. ÉCHÉANCE : Le montant total mensuel de ${fmtPdfNum(total)} FCFA est exigible au plus tard le ${jour} de chaque mois civil d'avance auprès de l'Agence mandataire.
4. DÉPÔT DE GARANTIE : Le Preneur verse à la signature la somme de ${fmtPdfNum(caution)} FCFA à titre de dépôt de garantie (caution plafonnée conformément au Décret N° 2023-442). Cette garantie sera restituée en fin de location après état des lieux de sortie contradictoire et déduction des éventuelles réparations locatives justifiées.
5. RÉVISION : Toute révision du loyer est soumise aux règles d'ordre public de la législation sénégalaise.`,

    article5_obligations:
`1. OBLIGATIONS DU PRENEUR (LOCATAIRE) :
- Occuper paisiblement les lieux loués conformément à leur destination exclusive d'habitation bourgeoise.
- Payer les loyers et charges aux échéances convenues.
- Assurer les réparations d'entretien locatif courant et répondre des dégradations de son fait.
- Ne pas céder son droit au bail ni sous-louer les lieux sans accord écrit préalable du Bailleur.
- Ne pas apporter de transformations structurelles aux locaux sans accord écrit.
2. OBLIGATIONS DU BAILLEUR :
- Mettre à disposition un logement décent en bon état d'usage et garantir la jouissance paisible des lieux.
- Réaliser les grosses réparations indispensables incombant au propriétaire en vertu de la loi.
3. CLAUSE RÉSOLUTOIRE DE PLEIN DROIT :
À défaut de paiement ponctuel d'un seul terme de loyer ou charges, ou en cas d'inexécution d'une seule des clauses des présentes, le bail sera résilié de plein droit un (1) mois après un commandement de payer ou une sommation d'exécuter demeurée infructueuse, sans préjudice de poursuites et de l'expulsion immédiate.`,

    article6_conditions:
(b.conditions && String(b.conditions).trim())
  ? cleanPdfText(b.conditions)
  : `Aucune condition dérogatoire particulière n'a été stipulée. Les parties déclarent se référer intégralement aux dispositions d'ordre public du Code des Obligations Civiles et Commerciales (COCC) de la République du Sénégal et au règlement de copropriété en vigueur.`
  };
}

/**
 * Génère le flux PDF d'un contrat de bail officiel et le transmet via l'objet Response HTTP Express
 */
function genererPdfContratBailStream(res, b) {
  const bailRef = `BAIL-${(b.id || 'OFFICIEL').slice(0, 8).toUpperCase()}`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="contrat_bail_${bailRef}.pdf"`);

  const doc = new PDFDocument({ margin: 45, size: 'A4', bufferPages: true });
  doc.pipe(res);

  // Parsing des clauses personnalisées
  let cp = {};
  if (b.clauses_personnalisees) {
    if (typeof b.clauses_personnalisees === 'string') {
      try { cp = JSON.parse(b.clauses_personnalisees); } catch { cp = {}; }
    } else if (typeof b.clauses_personnalisees === 'object') {
      cp = b.clauses_personnalisees;
    }
  }

  const defauts = genererTextesDefautBail(b);

  const art1Text = cleanPdfText(cp.article1_parties || defauts.article1_parties);
  const art2Text = cleanPdfText(cp.article2_bien || defauts.article2_bien);
  const art3Text = cleanPdfText(cp.article3_duree || defauts.article3_duree);
  const art4Text = cleanPdfText(cp.article4_finances || defauts.article4_finances);
  const art5Text = cleanPdfText(cp.article5_obligations || defauts.article5_obligations);
  const art6Text = cleanPdfText(cp.article6_conditions || b.conditions || defauts.article6_conditions);
  const art7Text = cleanPdfText(cp.clauses_libres || '');

  const dateDeb = b.date_debut ? new Date(b.date_debut).toLocaleDateString('fr-FR') : 'Date de signature';
  const locNom = [b.locataire_prenom, b.locataire_nom].filter(Boolean).join(' ') || 'Le Locataire';

  // Helper gestion de saut de page sécurisé
  let currentY = 145;
  const ensureSpace = (neededHeight) => {
    if (currentY + neededHeight > 745) {
      doc.addPage();
      currentY = 45;
    }
  };

  // ── En-tête officiel ──
  doc.fillColor(PDF_NAVY).fontSize(7.5).font('Helvetica-Bold')
     .text("RÉPUBLIQUE DU SÉNÉGAL • CODE DES OBLIGATIONS CIVILES ET COMMERCIALES (COCC) • DÉCRET N° 2023-442", 45, 40);

  doc.fillColor(PDF_NAVY).fontSize(16).font('Helvetica-Bold').text(b.agence_nom || 'AGENCE IMMOBILIÈRE', 45, 56);
  doc.fontSize(8.5).font('Helvetica').fillColor(PDF_GRAY)
     .text(`Mandataire de gestion • Agrément : ${b.numero_agrement || 'En règle'} • ${b.agence_ville || 'Dakar'}`, 45, 75);

  doc.moveTo(45, 90).lineTo(550, 90).strokeColor(PDF_NAVY).lineWidth(1.2).stroke();

  // ── Titre ──
  doc.fillColor(PDF_NAVY).fontSize(16).font('Helvetica-Bold')
     .text("CONTRAT DE BAIL À USAGE D'HABITATION", 45, 105, { align: 'center', width: 505 });
  doc.fillColor(PDF_PRICE_GREEN).fontSize(9).font('Helvetica-Bold')
     .text(`RÉFÉRENCE OFFICIELLE : ${bailRef}`, 45, 125, { align: 'center', width: 505 });

  currentY = 145;

  // ── ARTICLE 1 ──
  ensureSpace(40);
  doc.fillColor(PDF_NAVY).fontSize(10).font('Helvetica-Bold').text("ARTICLE 1 - DÉSIGNATION DES PARTIES", 45, currentY);
  currentY += 15;

  const h1 = doc.heightOfString(art1Text, { width: 505, lineGap: 2 });
  ensureSpace(h1 + 10);
  doc.fillColor(PDF_TEXT).fontSize(8.5).font('Helvetica')
     .text(art1Text, 45, currentY, { width: 505, lineGap: 2 });
  currentY += h1 + 16;

  // ── ARTICLE 2 ──
  ensureSpace(40);
  doc.fillColor(PDF_NAVY).fontSize(10).font('Helvetica-Bold').text("ARTICLE 2 - OBJET DU CONTRAT ET DÉSIGNATION DU BIEN", 45, currentY);
  currentY += 15;

  const h2 = doc.heightOfString(art2Text, { width: 505, lineGap: 2 });
  ensureSpace(h2 + 10);
  doc.fillColor(PDF_TEXT).fontSize(8.5).font('Helvetica')
     .text(art2Text, 45, currentY, { width: 505, lineGap: 2 });
  currentY += h2 + 16;

  // ── ARTICLE 3 ──
  ensureSpace(40);
  doc.fillColor(PDF_NAVY).fontSize(10).font('Helvetica-Bold').text("ARTICLE 3 - DURÉE ET RENOUVELLEMENT DU BAIL", 45, currentY);
  currentY += 15;

  const h3 = doc.heightOfString(art3Text, { width: 505, lineGap: 2 });
  ensureSpace(h3 + 10);
  doc.fillColor(PDF_TEXT).fontSize(8.5).font('Helvetica')
     .text(art3Text, 45, currentY, { width: 505, lineGap: 2 });
  currentY += h3 + 16;

  // ── ARTICLE 4 : Tableau Financier + Clauses Financières ──
  ensureSpace(120);
  doc.fillColor(PDF_NAVY).fontSize(10).font('Helvetica-Bold').text("ARTICLE 4 - CONDITIONS FINANCIÈRES, PAIEMENT ET DÉPÔT DE GARANTIE", 45, currentY);
  currentY += 15;

  const loyer = Number(b.loyer_mensuel || 0);
  const charges = Number(b.charges || 0);
  const caution = Number(b.depot_garantie || 0);

  // Tableau récapitulatif
  doc.rect(45, currentY, 505, 18).fillColor(PDF_NAVY).fill();
  doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold')
     .text('RUBRIQUE FINANCIÈRE', 55, currentY + 4)
     .text('PÉRIODICITÉ / MODALITÉ', 280, currentY + 4)
     .text('MONTANT', 460, currentY + 4, { align: 'right', width: 80 });
  currentY += 18;

  const addFinRow = (titre, modalite, montant) => {
    doc.rect(45, currentY, 505, 17).fillColor('#FFFFFF').fill();
    doc.fillColor(PDF_TEXT).fontSize(8.5).font('Helvetica').text(titre, 55, currentY + 4);
    doc.fillColor(PDF_GRAY).text(modalite, 280, currentY + 4);
    doc.fillColor(PDF_NAVY).font('Helvetica-Bold').text(`${fmtPdfNum(montant)} FCFA`, 460, currentY + 4, { align: 'right', width: 80 });
    doc.moveTo(45, currentY + 17).lineTo(550, currentY + 17).strokeColor(PDF_BORDER).lineWidth(0.5).stroke();
    currentY += 17;
  };

  addFinRow('Loyer mensuel principal', `Échéance le ${b.jour_echeance || 5} du mois d'avance`, loyer);
  addFinRow('Provisions sur charges locatives', 'Mensuel avec le loyer', charges);
  addFinRow('Dépôt de garantie (Caution)', 'Versé à la signature (Max 2 mois)', caution);
  currentY += 8;

  const h4 = doc.heightOfString(art4Text, { width: 505, lineGap: 2 });
  ensureSpace(h4 + 10);
  doc.fillColor(PDF_TEXT).fontSize(8.5).font('Helvetica')
     .text(art4Text, 45, currentY, { width: 505, lineGap: 2 });
  currentY += h4 + 16;

  // ── ARTICLE 5 ──
  ensureSpace(50);
  doc.fillColor(PDF_NAVY).fontSize(10).font('Helvetica-Bold').text("ARTICLE 5 - OBLIGATIONS DES PARTIES & CLAUSE RÉSOLUTOIRE DE PLEIN DROIT", 45, currentY);
  currentY += 15;

  const h5 = doc.heightOfString(art5Text, { width: 505, lineGap: 2 });
  ensureSpace(h5 + 10);
  doc.fillColor(PDF_TEXT).fontSize(8.5).font('Helvetica')
     .text(art5Text, 45, currentY, { width: 505, lineGap: 2 });
  currentY += h5 + 16;

  // ── ARTICLE 6 ──
  ensureSpace(40);
  doc.fillColor(PDF_NAVY).fontSize(10).font('Helvetica-Bold').text("ARTICLE 6 - CONDITIONS PARTICULIÈRES & RÈGLEMENT INTÉRIEUR", 45, currentY);
  currentY += 15;

  const h6 = doc.heightOfString(art6Text, { width: 505, lineGap: 2 });
  ensureSpace(h6 + 10);
  doc.fillColor(PDF_TEXT).fontSize(8.5).font('Helvetica')
     .text(art6Text, 45, currentY, { width: 505, lineGap: 2 });
  currentY += h6 + 16;

  // ── ARTICLE 7 / CLAUSES COMPLÉMENTAIRES (Si renseignées) ──
  if (art7Text) {
    ensureSpace(40);
    doc.fillColor(PDF_NAVY).fontSize(10).font('Helvetica-Bold').text("ARTICLE 7 - DISPOSITIONS PARTICULIÈRES ADDITIONNELLES & ANNEXES", 45, currentY);
    currentY += 15;

    const h7 = doc.heightOfString(art7Text, { width: 505, lineGap: 2 });
    ensureSpace(h7 + 10);
    doc.fillColor(PDF_TEXT).fontSize(8.5).font('Helvetica')
       .text(art7Text, 45, currentY, { width: 505, lineGap: 2 });
    currentY += h7 + 16;
  }

  // ── Signatures ──
  ensureSpace(120);
  doc.fillColor(PDF_NAVY).fontSize(9.5).font('Helvetica-Bold')
     .text(`Fait en trois exemplaires originaux à ${b.agence_ville || 'Dakar'}, le ${dateDeb}`, 45, currentY);
  currentY += 16;

  // Cadres de signature
  doc.roundedRect(45, currentY, 240, 80, 4).strokeColor(PDF_NAVY).lineWidth(0.8).stroke();
  doc.fillColor(PDF_NAVY).fontSize(8.5).font('Helvetica-Bold').text("POUR LE PRENEUR (LE LOCATAIRE)", 55, currentY + 8);
  
  if (b.signature_locataire && String(b.signature_locataire).startsWith('data:image/')) {
    try {
      const b64 = String(b.signature_locataire).replace(/^data:image\/\w+;base64,/, '');
      const buf = Buffer.from(b64, 'base64');
      const sigWidth = b.cachet_locataire ? 160 : 220;
      doc.image(buf, 55, currentY + 20, { fit: [sigWidth, 38], align: 'center', valign: 'center' });
    } catch (err) {
      console.warn('[PDF SIGNATURE LOCATAIRE ERR]', err.message);
    }
  }

  if (b.cachet_locataire && String(b.cachet_locataire).startsWith('data:image/')) {
    try {
      const b64 = String(b.cachet_locataire).replace(/^data:image\/\w+;base64,/, '');
      const buf = Buffer.from(b64, 'base64');
      doc.image(buf, 220, currentY + 12, { fit: [55, 52], align: 'center', valign: 'center' });
    } catch (err) {
      console.warn('[PDF CACHET LOCATAIRE ERR]', err.message);
    }
  }

  if (b.date_signature_locataire) {
    const dSigLoc = new Date(b.date_signature_locataire);
    doc.fillColor(PDF_PRICE_GREEN).fontSize(7).font('Helvetica-Bold')
       .text(`Signé numériquement le ${dSigLoc.toLocaleDateString('fr-FR')} à ${dSigLoc.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 55, currentY + 58)
       .fillColor(PDF_TEXT).font('Helvetica').fontSize(7.5)
       .text(b.nom_signataire_locataire || locNom, 55, currentY + 68);
  } else {
    doc.fillColor(PDF_LIGHT_GRAY).fontSize(7.5).font('Helvetica')
       .text("Mention manuscrite 'Lu et approuvé'", 55, currentY + 22)
       .text(locNom, 55, currentY + 62);
  }

  doc.roundedRect(310, currentY, 240, 80, 4).strokeColor(PDF_PRICE_GREEN).lineWidth(0.8).stroke();
  doc.fillColor(PDF_PRICE_GREEN).fontSize(8.5).font('Helvetica-Bold').text("POUR LE BAILLEUR / L'AGENCE (MANDATAIRE)", 320, currentY + 8);

  if (b.signature_bailleur && String(b.signature_bailleur).startsWith('data:image/')) {
    try {
      const b64 = String(b.signature_bailleur).replace(/^data:image\/\w+;base64,/, '');
      const buf = Buffer.from(b64, 'base64');
      const sigWidth = b.cachet_bailleur ? 160 : 220;
      doc.image(buf, 320, currentY + 20, { fit: [sigWidth, 38], align: 'center', valign: 'center' });
    } catch (err) {
      console.warn('[PDF SIGNATURE BAILLEUR ERR]', err.message);
    }
  }

  if (b.cachet_bailleur && String(b.cachet_bailleur).startsWith('data:image/')) {
    try {
      const b64 = String(b.cachet_bailleur).replace(/^data:image\/\w+;base64,/, '');
      const buf = Buffer.from(b64, 'base64');
      doc.image(buf, 485, currentY + 12, { fit: [55, 52], align: 'center', valign: 'center' });
    } catch (err) {
      console.warn('[PDF CACHET BAILLEUR ERR]', err.message);
    }
  }

  if (b.date_signature_bailleur) {
    const dSigBail = new Date(b.date_signature_bailleur);
    doc.fillColor(PDF_PRICE_GREEN).fontSize(7).font('Helvetica-Bold')
       .text(`Signé & certifié le ${dSigBail.toLocaleDateString('fr-FR')} à ${dSigBail.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 320, currentY + 58)
       .fillColor(PDF_TEXT).font('Helvetica').fontSize(7.5)
       .text(cleanPdfText(b.nom_signataire_bailleur || b.agence_nom || 'L\'Agence Mandataire'), 320, currentY + 68);
  } else {
    doc.fillColor(PDF_LIGHT_GRAY).fontSize(7.5).font('Helvetica')
       .text("Cachet et signature du mandataire habilité", 320, currentY + 22)
       .text(cleanPdfText(b.agence_nom || 'L\'Agence Mandataire'), 320, currentY + 62);
  }

  // Numérotation des pages dynamique
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(PDF_LIGHT_GRAY).fontSize(7.5).font('Helvetica')
       .text(
         `Contrat de Bail Réf : ${bailRef} • Page ${i + 1} sur ${range.count} • Document certifié conforme COCC`,
         45,
         805,
         { align: 'center', width: 505 }
       );
  }

  doc.end();
}

module.exports = {
  genererPdfContratBailStream,
  genererTextesDefautBail
};
