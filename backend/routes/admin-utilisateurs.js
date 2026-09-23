const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../models/db');
const { requireAdminAuth, requireAdminRole } = require('../middlewares/admin-rbac');
const { envoyerEmail } = require('../services/email');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// GET /api/admin/utilisateurs — liste paginée, recherche, filtres
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    const { q, statut, type, tri = 'recent', page = 1 } = req.query;
    const limit = 30;
    const offset = (Math.max(1, parseInt(page)) - 1) * limit;

    const conditions = [];
    const values = [];
    let i = 1;

    if (q) {
      conditions.push(`(nom ILIKE $${i} OR email ILIKE $${i} OR telephone ILIKE $${i})`);
      values.push(`%${q}%`);
      i++;
    }
    if (statut === 'verifie')     conditions.push('email_verifie = TRUE');
    if (statut === 'non_verifie') conditions.push('email_verifie = FALSE');
    if (statut === 'suspendu')    conditions.push('suspendu = TRUE');
    if (statut === 'en_grace')    conditions.push('supprime_le IS NOT NULL');
    if (type === 'apporteur')     conditions.push('est_apporteur = TRUE');
    if (type === 'boutique')      conditions.push('EXISTS (SELECT 1 FROM boutiques b WHERE b.utilisateur_id = utilisateurs.id)');
    if (type === 'agence')        conditions.push('EXISTS (SELECT 1 FROM agences_immo a WHERE a.utilisateur_id = utilisateurs.id)');

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = tri === 'ancien' ? 'ORDER BY created_at ASC' : 'ORDER BY created_at DESC';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM utilisateurs ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0].count);

    const listRes = await pool.query(
      `SELECT id, nom, email, telephone, email_verifie, suspendu, supprime_le, created_at,
              EXISTS (SELECT 1 FROM boutiques b WHERE b.utilisateur_id = utilisateurs.id) AS a_boutique,
              EXISTS (SELECT 1 FROM agences_immo a WHERE a.utilisateur_id = utilisateurs.id) AS a_agence
       FROM utilisateurs ${whereClause} ${orderClause}
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, limit, offset]
    );

    res.json({ utilisateurs: listRes.rows, total, page: parseInt(page) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/utilisateurs/:id — fiche détail
router.get('/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userRes = await pool.query(
      `SELECT id, nom, email, telephone, ville, email_verifie, suspendu, supprime_le, anonymise_le, est_apporteur, code_apporteur, quota_annonces, created_at
       FROM utilisateurs WHERE id = $1`,
      [id]
    );
    if (!userRes.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const activiteRes = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM annonces_classifiees WHERE utilisateur_id=$1 AND supprimee=FALSE) AS nb_annonces,
        (SELECT COUNT(*) FROM annonces_immo        WHERE utilisateur_id=$1 AND supprimee=FALSE) AS nb_immo,
        EXISTS(SELECT 1 FROM boutiques WHERE utilisateur_id=$1) AS a_boutique,
        EXISTS(SELECT 1 FROM agences_immo WHERE utilisateur_id=$1) AS a_agence`,
      [id]
    );

    const [abonnementRes, agenceRes] = await Promise.all([
      pool.query(
        `SELECT plan, fin FROM abonnements WHERE utilisateur_id=$1 AND statut='actif' AND fin > NOW() ORDER BY fin DESC LIMIT 1`,
        [id]
      ),
      pool.query(
        `SELECT id, nom, slug, statut, abonnement_plan FROM agences_immo WHERE utilisateur_id=$1 LIMIT 1`,
        [id]
      ).catch(() => ({ rows: [] })),
    ]);

    res.json({
      utilisateur: userRes.rows[0],
      activite: {
        nb_annonces: parseInt(activiteRes.rows[0].nb_annonces),
        nb_immo: parseInt(activiteRes.rows[0].nb_immo),
        a_boutique: activiteRes.rows[0].a_boutique,
        a_agence: activiteRes.rows[0].a_agence,
        agence: agenceRes.rows[0] || null,
        est_apporteur: userRes.rows[0].est_apporteur,
      },
      abonnement: abonnementRes.rows[0] || null,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/utilisateurs/:id/verifier-email — force email_verifie=true
router.put('/:id/verifier-email', requireAdminAuth, requireAdminRole('super_admin', 'admin_operationnel'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE utilisateurs SET email_verifie=true WHERE id=$1 RETURNING id, nom, email',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });

    await enregistrerAdminLog({
      action: 'utilisateur_email_verifie',
      cibleType: 'utilisateur',
      cibleId: req.params.id,
      description: `Vérification manuelle de l'email pour ${rows[0].email}`,
      req,
    });

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/utilisateurs/:id/renvoyer-verification
router.post('/:id/renvoyer-verification', requireAdminAuth, requireAdminRole('super_admin', 'admin_operationnel'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT nom, email, email_verifie FROM utilisateurs WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
    if (rows[0].email_verifie) return res.status(400).json({ error: 'Email déjà vérifié' });

    const verifToken = jwt.sign({ userId: req.params.id, type: 'verify' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const lien = `${FRONTEND_URL}/api/auth/verifier-email?token=${verifToken}`;
    await envoyerEmail({
      to: rows[0].email,
      subject: 'Nopalou — vérifiez votre email',
      html: `<p>Bonjour ${rows[0].nom},</p>
             <p><a href="${lien}">Cliquez ici pour vérifier votre adresse email</a> (lien valide 24h).</p>`,
    });

    await enregistrerAdminLog({
      action: 'utilisateur_renvoi_verification',
      cibleType: 'utilisateur',
      cibleId: req.params.id,
      description: `Renvoi de l'email de vérification à ${rows[0].email}`,
      req,
    });

    res.json({ success: true, message: 'Email de vérification renvoyé.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/utilisateurs/:id/lien-reset — génère un lien de réinitialisation (AUDIT+EMAIL)
router.post('/:id/lien-reset', requireAdminAuth, requireAdminRole('super_admin', 'admin_operationnel'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nom, email FROM utilisateurs WHERE id=$1',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const user = rows[0];

    const resetToken = jwt.sign(
      { userId: user.id, type: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    const lien = `${FRONTEND_URL}/mot-de-passe-oublie?token=${resetToken}`;

    const adminNom = req.adminUser?.nom || 'Admin';
    await enregistrerAdminLog({
      adminNom,
      adminRole: req.adminUser?.role || 'super_admin',
      action: 'admin_lien_reset',
      cibleType: 'utilisateur',
      cibleId: user.id,
      description: `Lien de réinitialisation de mot de passe généré pour ${user.email} par admin ${adminNom}. Expire dans 15 minutes.`,
      req,
    }).catch(() => {});

    if (user.email) {
      envoyerEmail({
        to: user.email,
        subject: 'Nopalou — Réinitialisation de votre mot de passe demandée',
        html: `<p>Bonjour ${user.nom},</p>
               <p>Un administrateur Nopalou a généré un lien de réinitialisation de votre mot de passe.</p>
               <p><a href="${lien}">Cliquez ici pour réinitialiser votre mot de passe</a> (lien valide 15 minutes).</p>
               <p>Si vous n'avez pas fait cette demande, ignorez ce message ou contactez le support.</p>`,
      }).catch(() => {});
    }

    res.json({ success: true, lien });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/utilisateurs/:id/suspendre
router.put('/:id/suspendre', requireAdminAuth, requireAdminRole('super_admin', 'admin_operationnel'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE utilisateurs SET suspendu=true WHERE id=$1 RETURNING id, nom, email',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });

    await enregistrerAdminLog({
      action: 'utilisateur_suspendu',
      cibleType: 'utilisateur',
      cibleId: req.params.id,
      description: `Suspension du compte ${rows[0].email} (${rows[0].nom})`,
      req,
    });

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/utilisateurs/:id/reactiver
router.put('/:id/reactiver', requireAdminAuth, requireAdminRole('super_admin', 'admin_operationnel'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE utilisateurs SET suspendu=false WHERE id=$1 RETURNING id, nom, email',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });

    await enregistrerAdminLog({
      action: 'utilisateur_reactive',
      cibleType: 'utilisateur',
      cibleId: req.params.id,
      description: `Réactivation du compte ${rows[0].email} (${rows[0].nom})`,
      req,
    });

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/utilisateurs/:id/marquer-supprime — démarre la période de grâce (30j)
router.post('/:id/marquer-supprime', requireAdminAuth, requireAdminRole('super_admin', 'admin_operationnel'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE utilisateurs SET supprime_le=NOW() WHERE id=$1 AND anonymise_le IS NULL RETURNING id, nom, email, supprime_le`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable ou déjà purgé' });

    await enregistrerAdminLog({
      action: 'utilisateur_marque_supprime',
      cibleType: 'utilisateur',
      cibleId: req.params.id,
      description: `Marquage suppression (période de grâce 30j) pour ${rows[0].email}`,
      req,
    });

    res.json({ success: true, supprime_le: rows[0].supprime_le });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/utilisateurs/:id/restaurer — annule la suppression pendant la période de grâce
router.post('/:id/restaurer', requireAdminAuth, requireAdminRole('super_admin', 'admin_operationnel'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE utilisateurs SET supprime_le=NULL WHERE id=$1 AND anonymise_le IS NULL RETURNING id, nom, email`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable ou déjà purgé' });

    await enregistrerAdminLog({
      action: 'utilisateur_restaure',
      cibleType: 'utilisateur',
      cibleId: req.params.id,
      description: `Restauration du compte (annulation de suppression) pour ${rows[0].email}`,
      req,
    });

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/utilisateurs/:id/purger — anonymisation définitive après 30j révolus
router.post('/:id/purger', requireAdminAuth, requireAdminRole('super_admin'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nom, email, supprime_le, anonymise_le FROM utilisateurs WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
    if (!rows[0].supprime_le) return res.status(400).json({ error: 'Ce compte n\'est pas marqué pour suppression' });
    if (rows[0].anonymise_le) return res.status(400).json({ error: 'Ce compte a déjà été purgé' });

    const joursEcoules = (Date.now() - new Date(rows[0].supprime_le).getTime()) / (1000 * 60 * 60 * 24);
    if (joursEcoules < 30) {
      return res.status(400).json({ error: `Période de grâce en cours (${Math.ceil(30 - joursEcoules)} jour(s) restant(s))` });
    }

    const id = req.params.id;
    const purgeRes = await pool.query(
      `UPDATE utilisateurs
       SET nom = 'Utilisateur supprimé',
           email = 'deleted-' || id || '@nopalou.local',
           telephone = NULL,
           mot_de_passe_hash = 'INVALIDATED',
           anonymise_le = NOW()
       WHERE id = $1 AND anonymise_le IS NULL
       RETURNING id`,
      [id]
    );
    if (!purgeRes.rows[0]) return res.status(400).json({ error: 'Ce compte a déjà été purgé' });

    await enregistrerAdminLog({
      action: 'utilisateur_purge_definitive',
      cibleType: 'utilisateur',
      cibleId: id,
      description: `Purge et anonymisation définitive du compte après 30 jours de grâce révolus`,
      req,
    });

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/utilisateurs/:id/quota — modifie le quota personnalisé (NULL pour hériter de la config globale)
router.put('/:id/quota', requireAdminAuth, requireAdminRole('super_admin', 'admin_operationnel'), async (req, res) => {
  try {
    const quota = req.body.quota === '' || req.body.quota === null || req.body.quota === undefined
      ? null
      : parseInt(req.body.quota);
    
    if (quota !== null && (isNaN(quota) || quota < 0)) {
      return res.status(400).json({ error: 'Quota invalide' });
    }

    const { rows } = await pool.query(
      'UPDATE utilisateurs SET quota_annonces=$1 WHERE id=$2 RETURNING id, quota_annonces',
      [quota, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });

    await enregistrerAdminLog({
      action: 'utilisateur_quota_modifie',
      cibleType: 'utilisateur',
      cibleId: req.params.id,
      description: `Modification du quota d'annonces à ${quota === null ? 'Par défaut' : quota}`,
      req,
    });

    res.json({ success: true, quota_annonces: rows[0].quota_annonces });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
