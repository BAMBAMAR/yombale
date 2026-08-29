// backend/routes/admin-export.js
// Export des données de la plateforme en CSV / Excel

const router = require('express').Router();
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function sendCsv(res, filename, headers, rows) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}_${new Date().toISOString().slice(0, 10)}.csv"`);
  
  // UTF-8 BOM pour compatibilité Excel
  res.write('\uFEFF');
  res.write(headers.join(';') + '\n');

  for (const row of rows) {
    const line = headers.map(h => escapeCsv(row[h])).join(';');
    res.write(line + '\n');
  }
  res.end();
}

// ── GET /api/admin/export/utilisateurs
router.get('/utilisateurs', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, nom, email, telephone, ville, email_verifie, suspendu, est_apporteur, code_apporteur, quota_annonces, created_at
      FROM utilisateurs
      ORDER BY created_at DESC
    `);
    const headers = ['id', 'nom', 'email', 'telephone', 'ville', 'email_verifie', 'suspendu', 'est_apporteur', 'code_apporteur', 'quota_annonces', 'created_at'];
    
    await enregistrerAdminLog({
      action: 'export_csv',
      cibleType: 'utilisateur',
      description: `Export CSV de ${rows.length} utilisateurs`,
      req,
    });

    sendCsv(res, 'nopalou_utilisateurs', headers, rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/export/boutiques
router.get('/boutiques', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT b.id, b.nom, b.slug, b.telephone, b.whatsapp, b.categorie, b.ville, b.adresse, b.actif, b.sponsorise, b.mode_fonctionnement,
             u.nom AS proprietaire_nom, u.email AS proprietaire_email,
             (SELECT COUNT(*)::int FROM boutique_produits WHERE boutique_id = b.id) AS nb_produits,
             b.created_at
      FROM boutiques b
      LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
      ORDER BY b.created_at DESC
    `);
    const headers = ['id', 'nom', 'slug', 'telephone', 'whatsapp', 'categorie', 'ville', 'adresse', 'actif', 'sponsorise', 'mode_fonctionnement', 'proprietaire_nom', 'proprietaire_email', 'nb_produits', 'created_at'];

    await enregistrerAdminLog({
      action: 'export_csv',
      cibleType: 'boutique',
      description: `Export CSV de ${rows.length} boutiques`,
      req,
    });

    sendCsv(res, 'nopalou_boutiques', headers, rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/export/ventes
router.get('/ventes', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT v.id, v.reference, b.nom AS boutique_nom, v.nom_produit, v.quantite, v.prix_unitaire, v.frais_livraison, v.montant_total, v.client_nom, v.client_telephone, v.methode_paiement, v.caissier_nom, v.created_at
      FROM ventes v
      LEFT JOIN boutiques b ON b.id = v.boutique_id
      WHERE v.archivee IS NOT TRUE
      ORDER BY v.created_at DESC
      LIMIT 10000
    `);
    const headers = ['id', 'reference', 'boutique_nom', 'nom_produit', 'quantite', 'prix_unitaire', 'frais_livraison', 'montant_total', 'client_nom', 'client_telephone', 'methode_paiement', 'caissier_nom', 'created_at'];

    await enregistrerAdminLog({
      action: 'export_csv',
      cibleType: 'vente',
      description: `Export CSV de ${rows.length} ventes comptoir / POS`,
      req,
    });

    sendCsv(res, 'nopalou_ventes', headers, rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/export/commandes
router.get('/commandes', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.reference, b.nom AS boutique_nom, c.nom_produit, c.quantite, c.prix_unitaire, c.montant_total, c.client_nom, c.client_telephone, c.client_adresse, c.statut, c.methode_paiement, c.source, c.created_at
      FROM commandes_boutique c
      LEFT JOIN boutiques b ON b.id = c.boutique_id
      ORDER BY c.created_at DESC
      LIMIT 10000
    `);
    const headers = ['id', 'reference', 'boutique_nom', 'nom_produit', 'quantite', 'prix_unitaire', 'montant_total', 'client_nom', 'client_telephone', 'client_adresse', 'statut', 'methode_paiement', 'source', 'created_at'];

    await enregistrerAdminLog({
      action: 'export_csv',
      cibleType: 'commande',
      description: `Export CSV de ${rows.length} commandes web`,
      req,
    });

    sendCsv(res, 'nopalou_commandes', headers, rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/export/abonnements
router.get('/abonnements', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.id, a.plan, a.statut, a.prix_mensuel, a.debut, a.fin, a.commande_ref, u.nom AS utilisateur_nom, u.email AS utilisateur_email, u.telephone, a.created_at
      FROM abonnements a
      JOIN utilisateurs u ON u.id = a.utilisateur_id
      ORDER BY a.created_at DESC
    `);
    const headers = ['id', 'plan', 'statut', 'prix_mensuel', 'debut', 'fin', 'commande_ref', 'utilisateur_nom', 'utilisateur_email', 'telephone', 'created_at'];

    await enregistrerAdminLog({
      action: 'export_csv',
      cibleType: 'abonnement',
      description: `Export CSV de ${rows.length} abonnements`,
      req,
    });

    sendCsv(res, 'nopalou_abonnements', headers, rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/export/leads
router.get('/leads', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, nom_boutique, contact_nom, telephone, operateur, categorie, ville, quartier, source, statut, score, notes, created_at
      FROM prospection_leads
      ORDER BY created_at DESC
    `);
    const headers = ['id', 'nom_boutique', 'contact_nom', 'telephone', 'operateur', 'categorie', 'ville', 'quartier', 'source', 'statut', 'score', 'notes', 'created_at'];

    await enregistrerAdminLog({
      action: 'export_csv',
      cibleType: 'prospection',
      description: `Export CSV de ${rows.length} leads de prospection`,
      req,
    });

    sendCsv(res, 'nopalou_prospection_leads', headers, rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
