// backend/services/pos-service.js — Service Métier Caisse POS & Sessions de Caisse
const { pool } = require('../models/db');

/**
 * Annule une vente enregistrée sur la caisse POS (restauration stock & archivage comptable)
 */
async function annulerVentePos({ boutiqueId, ticketId, items = [] }) {
  if (!ticketId || !boutiqueId) {
    throw new Error('ticketId et boutiqueId requis pour annuler une vente POS');
  }

  // 1. Archiver l'écriture comptable dans ventes pour réajuster le CA
  await pool.query('UPDATE ventes SET archivee = true WHERE reference = $1 AND boutique_id = $2', [
    ticketId,
    boutiqueId,
  ]);

  // 2. Marquer la commande comme annulée dans commandes_boutique
  await pool.query(
    "UPDATE commandes_boutique SET statut = 'annulee' WHERE reference = $1 AND boutique_id = $2",
    [ticketId, boutiqueId]
  );

  // 3. Ré-incrémenter le stock physique si articles renseignés
  if (Array.isArray(items) && items.length > 0) {
    for (const item of items) {
      const prodId = item.id || item.produit?.id;
      const prodNom = item.nom || item.produit?.nom;
      const qte = Number(item.quantite || 1);

      if (prodId && /^[0-9a-f-]{36}$/i.test(prodId)) {
        await pool.query(
          `UPDATE boutique_produits
           SET stock_quantite = COALESCE(stock_quantite, 0) + $1,
               en_stock = true
           WHERE id = $2 AND boutique_id = $3`,
          [qte, prodId, boutiqueId]
        );
      } else if (prodNom) {
        await pool.query(
          `UPDATE boutique_produits
           SET stock_quantite = COALESCE(stock_quantite, 0) + $1,
               en_stock = true
           WHERE nom = $2 AND boutique_id = $3`,
          [qte, prodNom, boutiqueId]
        );
      }
    }
  }

  return { success: true, message: 'Ticket POS annulé avec succès' };
}

/**
 * Récupère l'historique des ventes POS formaté pour la caisse
 */
async function getHistoriqueVentesPos(boutiqueId, limit = 100) {
  const { rows } = await pool.query(
    `SELECT reference AS id,
            TO_CHAR(created_at, 'DD/MM/YYYY') AS date,
            TO_CHAR(created_at, 'HH24:MI') AS heure,
            COALESCE(client_nom, 'Caisse POS') AS caissier,
            COALESCE(methode_paiement, 'cash') AS "modePaiement",
            montant_total AS total,
            'validee' AS statut,
            nom_produit AS "nomProduit",
            articles AS items
     FROM commandes_boutique
     WHERE boutique_id = $1 AND statut != 'annulee'
     ORDER BY created_at DESC
     LIMIT $2`,
    [boutiqueId, limit]
  );
  return rows;
}

module.exports = {
  annulerVentePos,
  getHistoriqueVentesPos,
};
