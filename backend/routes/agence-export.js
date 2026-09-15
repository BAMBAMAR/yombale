// backend/routes/agence-export.js
// Export universel des données de l'agence immobilière en CSV (compatible Excel & UTF-8)
// Biens, Prospects, Baux, Échéances loyers, Visites, Transactions, Commissions, Bailleurs, Compta

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');
  // Sécurité : Neutralisation de l'injection de formules Excel
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str}"`;
}

function sendCsv(res, filename, headers, rows) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}_${new Date().toISOString().slice(0, 10)}.csv"`);
  
  // UTF-8 BOM pour ouverture directe et accents préservés dans Microsoft Excel
  res.write('\uFEFF');
  res.write(headers.join(';') + '\n');

  for (const row of rows) {
    const line = headers.map(h => escapeCsv(row[h])).join(';');
    res.write(line + '\n');
  }
  res.end();
}

// ── GET /api/agences/:slugOrId/export/:type ──
router.get('/agence/:slugOrId/export/:type', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const agenceNom = req.agence.slug || 'agence';
    const { type } = req.params;

    if (type === 'biens') {
      const { rows } = await pool.query(
        `SELECT b.reference, b.titre, b.type_bien, b.statut, b.statut_occupation,
                b.surface_m2, b.nb_pieces, b.nb_chambres, b.nb_sdb,
                b.prix_location, b.prix_vente, b.charges, b.depot_garantie,
                b.ville, b.quartier, b.adresse,
                p.nom AS proprietaire_nom, b.created_at
         FROM biens_immo b
         LEFT JOIN proprietaires_immo p ON b.proprietaire_id = p.id
         WHERE b.agence_id = $1
         ORDER BY b.created_at DESC`,
        [agenceId]
      );
      const headers = ['reference', 'titre', 'type_bien', 'statut', 'statut_occupation', 'surface_m2', 'nb_pieces', 'nb_chambres', 'nb_sdb', 'prix_location', 'prix_vente', 'charges', 'depot_garantie', 'ville', 'quartier', 'adresse', 'proprietaire_nom', 'created_at'];
      return sendCsv(res, `${agenceNom}_biens`, headers, rows);
    }

    if (type === 'prospects') {
      const { rows } = await pool.query(
        `SELECT nom, prenom, telephone, whatsapp, email, profession, statut_crm,
                type_operation, type_bien_souhaite, budget_min, budget_max,
                delai, source, created_at
         FROM contacts_immo
         WHERE agence_id = $1 AND type_contact = 'prospect'
         ORDER BY created_at DESC`,
        [agenceId]
      );
      const headers = ['nom', 'prenom', 'telephone', 'whatsapp', 'email', 'profession', 'statut_crm', 'type_operation', 'type_bien_souhaite', 'budget_min', 'budget_max', 'delai', 'source', 'created_at'];
      return sendCsv(res, `${agenceNom}_prospects`, headers, rows);
    }

    if (type === 'baux') {
      const { rows } = await pool.query(
        `SELECT bx.id, b.titre AS bien_titre, c.nom AS locataire_nom, c.telephone AS locataire_tel,
                bx.loyer_mensuel, bx.charges, bx.depot_garantie, bx.date_debut, bx.date_fin,
                bx.jour_echeance, bx.statut, bx.created_at
         FROM baux_immo bx
         JOIN biens_immo b ON bx.bien_id = b.id
         JOIN contacts_immo c ON bx.locataire_id = c.id
         WHERE bx.agence_id = $1
         ORDER BY bx.date_debut DESC`,
        [agenceId]
      );
      const headers = ['id', 'bien_titre', 'locataire_nom', 'locataire_tel', 'loyer_mensuel', 'charges', 'depot_garantie', 'date_debut', 'date_fin', 'jour_echeance', 'statut', 'created_at'];
      return sendCsv(res, `${agenceNom}_baux`, headers, rows);
    }

    if (type === 'loyers' || type === 'echeances') {
      const { rows } = await pool.query(
        `SELECT le.periode, b.titre AS bien_titre, c.nom AS locataire_nom,
                le.montant_du, le.montant_paye, le.montant_restant,
                le.date_echeance, le.date_paiement, le.statut, le.mode_paiement,
                le.reference_paiement, le.quittance_url
         FROM loyers_echeances le
         JOIN baux_immo bx ON le.bail_id = bx.id
         JOIN biens_immo b ON bx.bien_id = b.id
         JOIN contacts_immo c ON bx.locataire_id = c.id
         WHERE le.agence_id = $1
         ORDER BY le.date_echeance DESC`,
        [agenceId]
      );
      const headers = ['periode', 'bien_titre', 'locataire_nom', 'montant_du', 'montant_paye', 'montant_restant', 'date_echeance', 'date_paiement', 'statut', 'mode_paiement', 'reference_paiement', 'quittance_url'];
      return sendCsv(res, `${agenceNom}_echeances_loyers`, headers, rows);
    }

    if (type === 'visites') {
      const { rows } = await pool.query(
        `SELECT v.date_visite, b.titre AS bien_titre, c.nom AS contact_nom, c.telephone AS contact_tel,
                u.nom AS agent_nom, v.statut, v.resultat, v.notes, v.created_at
         FROM visites_immo v
         JOIN biens_immo b ON v.bien_id = b.id
         JOIN contacts_immo c ON v.contact_id = c.id
         LEFT JOIN utilisateurs u ON v.agent_id = u.id
         WHERE v.agence_id = $1
         ORDER BY v.date_visite DESC`,
        [agenceId]
      );
      const headers = ['date_visite', 'bien_titre', 'contact_nom', 'contact_tel', 'agent_nom', 'statut', 'resultat', 'notes', 'created_at'];
      return sendCsv(res, `${agenceNom}_visites`, headers, rows);
    }

    if (type === 'transactions') {
      const { rows } = await pool.query(
        `SELECT t.date_transaction, t.type_transaction, b.titre AS bien_titre,
                a.nom AS acheteur_nom, v.nom AS vendeur_nom, t.montant,
                t.statut, t.date_cloture, t.notes
         FROM transactions_immo t
         JOIN biens_immo b ON t.bien_id = b.id
         LEFT JOIN contacts_immo a ON t.acheteur_id = a.id
         LEFT JOIN proprietaires_immo v ON t.vendeur_id = v.id
         WHERE t.agence_id = $1
         ORDER BY t.date_transaction DESC`,
        [agenceId]
      );
      const headers = ['date_transaction', 'type_transaction', 'bien_titre', 'acheteur_nom', 'vendeur_nom', 'montant', 'statut', 'date_cloture', 'notes'];
      return sendCsv(res, `${agenceNom}_transactions`, headers, rows);
    }

    if (type === 'commissions') {
      const { rows } = await pool.query(
        `SELECT b.titre AS bien_titre, u.nom AS agent_nom, c.montant_brut,
                c.montant_paye, c.montant_restant, c.statut, c.date_paiement, c.notes
         FROM commissions_immo c
         JOIN transactions_immo t ON c.transaction_id = t.id
         JOIN biens_immo b ON t.bien_id = b.id
         LEFT JOIN utilisateurs u ON t.agent_id = u.id
         WHERE c.agence_id = $1
         ORDER BY c.created_at DESC`,
        [agenceId]
      );
      const headers = ['bien_titre', 'agent_nom', 'montant_brut', 'montant_paye', 'montant_restant', 'statut', 'date_paiement', 'notes'];
      return sendCsv(res, `${agenceNom}_commissions`, headers, rows);
    }

    if (type === 'bailleurs') {
      const { rows } = await pool.query(
        `SELECT p.nom, p.prenom, p.telephone, p.whatsapp, p.email, p.type_bailleur,
                p.adresse, p.iban,
                (SELECT COUNT(*) FROM biens_immo b WHERE b.proprietaire_id = p.id) AS nb_biens_total,
                (SELECT COUNT(*) FROM biens_immo b WHERE b.proprietaire_id = p.id AND b.statut_occupation = 'loue') AS nb_biens_loues,
                p.created_at
         FROM proprietaires_immo p
         WHERE p.agence_id = $1
         ORDER BY p.nom ASC`,
        [agenceId]
      );
      const headers = ['nom', 'prenom', 'telephone', 'whatsapp', 'email', 'type_bailleur', 'adresse', 'iban', 'nb_biens_total', 'nb_biens_loues', 'created_at'];
      return sendCsv(res, `${agenceNom}_bailleurs`, headers, rows);
    }

    if (type === 'mandats') {
      const { rows } = await pool.query(
        `SELECT b.titre AS bien_titre, p.nom AS proprietaire_nom, m.type_mandat, m.type_operation,
                m.date_debut, m.date_fin, m.duree_mois, m.taux_commission, m.montant_commission_fixe,
                m.statut, m.conditions, m.created_at
         FROM mandats_immo m
         JOIN biens_immo b ON m.bien_id = b.id
         JOIN proprietaires_immo p ON m.proprietaire_id = p.id
         WHERE m.agence_id = $1
         ORDER BY m.created_at DESC`,
        [agenceId]
      );
      const headers = ['bien_titre', 'proprietaire_nom', 'type_mandat', 'type_operation', 'date_debut', 'date_fin', 'duree_mois', 'taux_commission', 'montant_commission_fixe', 'statut', 'conditions', 'created_at'];
      return sendCsv(res, `${agenceNom}_mandats`, headers, rows);
    }

    return res.status(400).json({
      success: false,
      error: `Type d'export non reconnu. Types disponibles : biens, prospects, baux, loyers, visites, transactions, commissions, bailleurs, mandats.`,
    });
  } catch (err) {
    console.error('[GET /api/agences/:slugOrId/export/:type]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la génération de l\'export CSV' });
  }
});

module.exports = router;
