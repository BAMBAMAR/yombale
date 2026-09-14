// frontend-next/src/lib/pos-escpos-printer.js
// Générateur de commandes binaires ESC/POS pour imprimantes thermiques (WebBluetooth & WebUSB)

/**
 * @typedef {Object} ReceiptLine
 * @property {string} nom
 * @property {number} quantite
 * @property {number} prixUnitaire
 * @property {number} total
 */

/**
 * @typedef {Object} ReceiptData
 * @property {string} boutiqueNom
 * @property {string} [boutiqueAdresse]
 * @property {string} [boutiqueTel]
 * @property {string} referenceTicket
 * @property {string} date
 * @property {ReceiptLine[]} articles
 * @property {number} totalFCFA
 * @property {string} modePaiement
 * @property {string} [messageBasTicket]
 */

/**
 * Nettoie les caractères accentués pour la compatibilité avec les imprimantes thermiques ASCII
 * @param {string} str
 * @returns {string}
 */
function removeAccents(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s#.:\-\/]/g, ' ');
}

/**
 * Formate deux colonnes de texte alignées (ex: Article ... 15 000 FCFA)
 * @param {string} left
 * @param {string} right
 * @param {number} width
 * @returns {string}
 */
function formatTwoColumns(left, right, width = 32) {
  const cleanLeft = removeAccents(left);
  const cleanRight = removeAccents(right);
  const spaceNeeded = width - (cleanLeft.length + cleanRight.length);
  if (spaceNeeded <= 0) {
    return cleanLeft.substring(0, width - cleanRight.length - 1) + ' ' + cleanRight;
  }
  return cleanLeft + ' '.repeat(spaceNeeded) + cleanRight;
}

/**
 * Génère le buffer binaire ESC/POS prêt à être envoyé par Bluetooth ou USB
 * @param {ReceiptData} data
 * @param {boolean} [openDrawer=true]
 * @returns {Uint8Array}
 */
function generateEscPosReceipt(data, openDrawer = true) {
  const bytes = [];

  // 1. En-tête ESC/POS : Initialisation (ESC @)
  bytes.push(0x1b, 0x40);

  // 2. Impulsion ouverture tiroir-caisse RJ11 (ESC p 0 25 255)
  if (openDrawer) {
    bytes.push(0x1b, 0x70, 0x00, 0x19, 0xff);
  }

  // 3. Alignement centré (ESC a 1) + Gras (ESC E 1)
  bytes.push(0x1b, 0x61, 0x01);
  bytes.push(0x1b, 0x45, 0x01);

  // Nom de la boutique (Double taille : GS ! 17)
  bytes.push(0x1d, 0x21, 0x11);
  const nomClean = removeAccents((data.boutiqueNom || '').toUpperCase()) + '\n';
  for (let i = 0; i < nomClean.length; i++) bytes.push(nomClean.charCodeAt(i));

  // Retour à la taille normale (GS ! 0) & fin du gras
  bytes.push(0x1d, 0x21, 0x00);
  bytes.push(0x1b, 0x45, 0x00);

  if (data.boutiqueAdresse) {
    const adr = removeAccents(data.boutiqueAdresse) + '\n';
    for (let i = 0; i < adr.length; i++) bytes.push(adr.charCodeAt(i));
  }
  if (data.boutiqueTel) {
    const tel = 'TEL: ' + removeAccents(data.boutiqueTel) + '\n';
    for (let i = 0; i < tel.length; i++) bytes.push(tel.charCodeAt(i));
  }

  // Ligne de séparation
  const separator = '-'.repeat(32) + '\n';
  for (let i = 0; i < separator.length; i++) bytes.push(separator.charCodeAt(i));

  // Alignement à gauche (ESC a 0)
  bytes.push(0x1b, 0x61, 0x00);

  // Info ticket
  const refLine = `TICKET: ${removeAccents(data.referenceTicket || '')}\nDATE:   ${removeAccents(data.date || '')}\n`;
  for (let i = 0; i < refLine.length; i++) bytes.push(refLine.charCodeAt(i));

  for (let i = 0; i < separator.length; i++) bytes.push(separator.charCodeAt(i));

  // Liste des articles
  if (Array.isArray(data.articles)) {
    for (const item of data.articles) {
      const itemTitle = `${item.quantite}x ${item.nom}`;
      const priceStr = `${(item.total || 0).toLocaleString('fr-FR')} F`;
      const formatted = formatTwoColumns(itemTitle, priceStr, 32) + '\n';
      for (let i = 0; i < formatted.length; i++) bytes.push(formatted.charCodeAt(i));
    }
  }

  for (let i = 0; i < separator.length; i++) bytes.push(separator.charCodeAt(i));

  // Alignement à droite (ESC a 2) + Gras (ESC E 1)
  bytes.push(0x1b, 0x61, 0x02);
  bytes.push(0x1b, 0x45, 0x01);

  const totalLine = `TOTAL: ${(data.totalFCFA || 0).toLocaleString('fr-FR')} FCFA\n`;
  for (let i = 0; i < totalLine.length; i++) bytes.push(totalLine.charCodeAt(i));

  bytes.push(0x1b, 0x45, 0x00);

  const modeLine = `PAIEMENT: ${removeAccents((data.modePaiement || '').toUpperCase())}\n`;
  for (let i = 0; i < modeLine.length; i++) bytes.push(modeLine.charCodeAt(i));

  for (let i = 0; i < separator.length; i++) bytes.push(separator.charCodeAt(i));

  // Message bas de ticket centré
  bytes.push(0x1b, 0x61, 0x01);
  const msg = removeAccents(data.messageBasTicket || 'Merci pour votre visite !') + '\n\n\n';
  for (let i = 0; i < msg.length; i++) bytes.push(msg.charCodeAt(i));

  // Coupe papier partielle/totale (GS V 0)
  bytes.push(0x1d, 0x56, 0x00);

  return new Uint8Array(bytes);
}

module.exports = {
  generateEscPosReceipt,
  removeAccents,
  formatTwoColumns
};
