// backend/routes/admin-export.js
// Export des données de la plateforme en CSV / Excel avec filtrage et contrôle RBAC strict

const router = require('express').Router();
const { pool } = require('../models/db');
const { requireAdminAuth, requireAdminRole } = require('../middlewares/admin-rbac');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

// Protection RBAC : Seuls le Super Admin et le rôle Finance peuvent exporter les données PII / Finances
router.use(requireAdminAuth);
router.use(requireAdminRole('super_admin', 'finance'));

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');
  // SÉCURITÉ P1 : Neutralisation de l'injection de formules (CSV / Excel Injection)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
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
router.get('/utilisateurs', async (req, res) => {
  try {
    const { date_debut, date_fin, statut, q } = req.query;
    const conds = [];
    const vals = [];
    let i = 1;

    if (date_debut) { conds.push(`created_at >= $${i}`); vals.push(date_debut); i++; }
    if (date_fin) { conds.push(`created_at <= $${i}`); vals.push(date_fin); i++; }
    if (statut === 'suspendu') { conds.push(`suspendu = true`); }
    else if (statut === 'actif') { conds.push(`suspendu = false`); }
    else if (statut === 'verifie') { conds.push(`email_verifie = true`); }

    if (q && q.trim()) {
      conds.push(`(nom ILIKE $${i} OR email ILIKE $${i} OR telephone ILIKE $${i} OR ville ILIKE $${i})`);
      vals.push(`%${q.trim()}%`);
      i++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(`
      SELECT id, nom, email, telephone, ville, email_verifie, suspendu, est_apporteur, code_apporteur, quota_annonces, created_at
      FROM utilisateurs
      ${where}
      ORDER BY created_at DESC
      LIMIT 10000
    `, vals);

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
router.get('/boutiques', async (req, res) => {
  try {
    const { date_debut, date_fin, statut, q } = req.query;
    const conds = [];
    const vals = [];
    let i = 1;

    if (date_debut) { conds.push(`b.created_at >= $${i}`); vals.push(date_debut); i++; }
    if (date_fin) { conds.push(`b.created_at <= $${i}`); vals.push(date_fin); i++; }
    if (statut === 'actif') { conds.push(`b.actif = true`); }
    else if (statut === 'inactif') { conds.push(`b.actif = false`); }
    else if (statut === 'sponsorise') { conds.push(`b.sponsorise = true`); }

    if (q && q.trim()) {
      conds.push(`(b.nom ILIKE $${i} OR b.slug ILIKE $${i} OR b.telephone ILIKE $${i} OR u.nom ILIKE $${i} OR u.email ILIKE $${i})`);
      vals.push(`%${q.trim()}%`);
      i++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(`
      SELECT b.id, b.nom, b.slug, b.telephone, b.whatsapp, b.categorie, b.ville, b.adresse, b.actif, b.sponsorise, b.mode_fonctionnement,
             u.nom AS proprietaire_nom, u.email AS proprietaire_email,
             (SELECT COUNT(*)::int FROM boutique_produits WHERE boutique_id = b.id) AS nb_produits,
             b.created_at
      FROM boutiques b
      LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
      ${where}
      ORDER BY b.created_at DESC
      LIMIT 10000
    `, vals);

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
router.get('/ventes', async (req, res) => {
  try {
    const { date_debut, date_fin, methode, q } = req.query;
    const conds = ['v.archivee IS NOT TRUE'];
    const vals = [];
    let i = 1;

    if (date_debut) { conds.push(`v.created_at >= $${i}`); vals.push(date_debut); i++; }
    if (date_fin) { conds.push(`v.created_at <= $${i}`); vals.push(date_fin); i++; }
    if (methode) { conds.push(`v.methode_paiement = $${i}`); vals.push(methode); i++; }

    if (q && q.trim()) {
      conds.push(`(v.reference ILIKE $${i} OR v.nom_produit ILIKE $${i} OR b.nom ILIKE $${i} OR v.client_nom ILIKE $${i})`);
      vals.push(`%${q.trim()}%`);
      i++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(`
      SELECT v.id, v.reference, b.nom AS boutique_nom, v.nom_produit, v.quantite, v.prix_unitaire, v.frais_livraison, v.montant_total, v.client_nom, v.client_telephone, v.methode_paiement, v.caissier_nom, v.created_at
      FROM ventes v
      LEFT JOIN boutiques b ON b.id = v.boutique_id
      ${where}
      ORDER BY v.created_at DESC
      LIMIT 10000
    `, vals);

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
router.get('/commandes', async (req, res) => {
  try {
    const { date_debut, date_fin, statut, methode, q } = req.query;
    const conds = [];
    const vals = [];
    let i = 1;

    if (date_debut) { conds.push(`c.created_at >= $${i}`); vals.push(date_debut); i++; }
    if (date_fin) { conds.push(`c.created_at <= $${i}`); vals.push(date_fin); i++; }
    if (statut) { conds.push(`c.statut = $${i}`); vals.push(statut); i++; }
    if (methode) { conds.push(`c.methode_paiement = $${i}`); vals.push(methode); i++; }

    if (q && q.trim()) {
      conds.push(`(c.reference ILIKE $${i} OR c.nom_produit ILIKE $${i} OR b.nom ILIKE $${i} OR c.client_nom ILIKE $${i} OR c.client_telephone ILIKE $${i})`);
      vals.push(`%${q.trim()}%`);
      i++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(`
      SELECT c.id, c.reference, b.nom AS boutique_nom, c.nom_produit, c.quantite, c.prix_unitaire, c.montant_total, c.client_nom, c.client_telephone, c.client_adresse, c.statut, c.methode_paiement, c.source, c.created_at
      FROM commandes_boutique c
      LEFT JOIN boutiques b ON b.id = c.boutique_id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT 10000
    `, vals);

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
router.get('/abonnements', async (req, res) => {
  try {
    const { date_debut, date_fin, plan, statut, q } = req.query;
    const conds = [];
    const vals = [];
    let i = 1;

    if (date_debut) { conds.push(`a.created_at >= $${i}`); vals.push(date_debut); i++; }
    if (date_fin) { conds.push(`a.created_at <= $${i}`); vals.push(date_fin); i++; }
    if (plan) { conds.push(`a.plan = $${i}`); vals.push(plan); i++; }
    if (statut) { conds.push(`a.statut = $${i}`); vals.push(statut); i++; }

    if (q && q.trim()) {
      conds.push(`(u.nom ILIKE $${i} OR u.email ILIKE $${i} OR u.telephone ILIKE $${i} OR a.commande_ref ILIKE $${i})`);
      vals.push(`%${q.trim()}%`);
      i++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(`
      SELECT a.id, a.plan, a.statut, a.prix_mensuel, a.debut, a.fin, a.commande_ref, u.nom AS utilisateur_nom, u.email AS utilisateur_email, u.telephone, a.created_at
      FROM abonnements a
      JOIN utilisateurs u ON u.id = a.utilisateur_id
      ${where}
      ORDER BY a.created_at DESC
      LIMIT 10000
    `, vals);

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
router.get('/leads', async (req, res) => {
  try {
    const { date_debut, date_fin, statut, operateur, ville, q } = req.query;
    const conds = [];
    const vals = [];
    let i = 1;

    if (date_debut) { conds.push(`created_at >= $${i}`); vals.push(date_debut); i++; }
    if (date_fin) { conds.push(`created_at <= $${i}`); vals.push(date_fin); i++; }
    if (statut) { conds.push(`statut = $${i}`); vals.push(statut); i++; }
    if (operateur) { conds.push(`operateur = $${i}`); vals.push(operateur); i++; }
    if (ville) { conds.push(`ville ILIKE $${i}`); vals.push(`%${ville}%`); i++; }

    if (q && q.trim()) {
      conds.push(`(nom_boutique ILIKE $${i} OR contact_nom ILIKE $${i} OR telephone ILIKE $${i} OR quartier ILIKE $${i})`);
      vals.push(`%${q.trim()}%`);
      i++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(`
      SELECT id, nom_boutique, contact_nom, telephone, operateur, categorie, ville, quartier, source, statut, score, notes, created_at
      FROM prospection_leads
      ${where}
      ORDER BY created_at DESC
      LIMIT 10000
    `, vals);

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
