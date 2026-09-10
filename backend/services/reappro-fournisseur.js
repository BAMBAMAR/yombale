// backend/services/reappro-fournisseur.js
// Automatisation Réapprovisionnement Fournisseur & Alertes Stock Critique (Audit 94+/100)

const { pool } = require('../models/db');
const { normalisePhone } = require('./whatsapp');

/**
 * Détecte les articles dont le stock a atteint le seuil critique
 * @param {string} boutiqueId
 */
async function detecterStocksCritiques(boutiqueId) {
  if (!boutiqueId) return [];

  try {
    const res = await pool.query(
      `SELECT p.id, p.nom, p.stock_quantite, p.prix, p.prix_achat,
              COALESCE(p.seuil_alerte_stock, 5) as seuil_alerte,
              f.id as fournisseur_id, f.nom as fournisseur_nom, f.telephone as fournisseur_telephone
       FROM boutique_produits p
       LEFT JOIN boutique_fournisseurs f ON p.fournisseur_id = f.id
       WHERE p.boutique_id = $1
         AND p.actif = true
         AND (p.stock_quantite IS NOT NULL AND p.stock_quantite <= COALESCE(p.seuil_alerte_stock, 5))
       ORDER BY p.stock_quantite ASC`,
      [boutiqueId]
    );

    return res.rows;
  } catch (err) {
    console.error('[REAPPRO FOURNISSEUR] Erreur détection stocks:', err);
    return [];
  }
}

/**
 * Génère le message WhatsApp et le lien direct pour passer commande au grossiste
 * @param {Object} options
 * @param {string} options.nomBoutique
 * @param {string} options.fournisseurTelephone
 * @param {string} [options.fournisseurNom]
 * @param {Array} options.articles - Liste des articles à réapprovisionner [{ nom, quantiteSouhaitee, stockActuel }]
 */
function genererBonCommandeWhatsApp({ nomBoutique, fournisseurTelephone, fournisseurNom = 'Cher Partenaire', articles = [] }) {
  if (!fournisseurTelephone || articles.length === 0) return null;

  const telNorm = normalisePhone(fournisseurTelephone);

  const lignesArticles = articles.map((a, i) => {
    const qte = a.quantiteSouhaitee || 20;
    const actuel = a.stockActuel !== undefined ? ` (Reste : ${a.stockActuel} pcs)` : '';
    return `${i + 1}. *${a.nom}* — *Qté : ${qte} pcs*${actuel}`;
  }).join('\n');

  const texte = 
`Bonjour ${fournisseurNom},

C'est *${nomBoutique}* via Nopalou.
Nous avons un besoin urgent de réapprovisionnement pour notre stock :

📦 *Bandeau de commande :*
${lignesArticles}

Merci de nous confirmer la disponibilité, le montant global ainsi que le délai de livraison prévu.

Excellente journée !`;

  const lienWhatsApp = `https://wa.me/${telNorm}?text=${encodeURIComponent(texte)}`;

  return {
    telephone: telNorm,
    texte,
    lienWhatsApp
  };
}

module.exports = {
  detecterStocksCritiques,
  genererBonCommandeWhatsApp
};
