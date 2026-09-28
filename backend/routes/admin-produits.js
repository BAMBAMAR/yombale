// backend/routes/admin-produits.js
// Centre de modération et supervision globale du catalogue marchands, des stocks et de la communication marchande

const router = require('express').Router();
const { pool } = require('../models/db');
const { requireAdminAuth } = require('../middlewares/admin-rbac');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');
const { envoyerEmail } = require('../services/email');
const { sendWhatsAppNotification, normalisePhone } = require('../services/whatsapp');

const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';

router.use(requireAdminAuth);

// Helper: formater le numéro WhatsApp international propre
function formatWhatsAppLink(phone, message) {
  if (!phone) return null;
  const cleanPhone = normalisePhone(phone);
  if (!cleanPhone) return null;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message || '')}`;
}

// ── GET /api/admin/produits — Liste paginée avec recherche et filtres multi-critères
router.get('/', async (req, res) => {
  try {
    const { q, boutique_id, categorie, en_stock, statut_moderation, page = 1, limit = 30 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const conditions = [];
    const values = [];
    let i = 1;

    if (q && q.trim()) {
      conditions.push(`(p.nom ILIKE $${i} OR p.description ILIKE $${i} OR b.nom ILIKE $${i} OR u.nom ILIKE $${i} OR u.telephone ILIKE $${i} OR b.telephone ILIKE $${i})`);
      values.push(`%${q.trim()}%`);
      i++;
    }
    if (boutique_id) {
      conditions.push(`p.boutique_id = $${i++}`);
      values.push(boutique_id);
    }
    if (categorie && categorie !== 'tous') {
      conditions.push(`p.categorie = $${i++}`);
      values.push(categorie);
    }
    if (en_stock === 'true') {
      conditions.push(`p.en_stock = TRUE`);
    } else if (en_stock === 'false') {
      conditions.push(`(p.en_stock = FALSE OR p.stock_quantite <= 0)`);
    }

    if (statut_moderation && statut_moderation !== 'tous') {
      if (statut_moderation === 'suspendu') {
        conditions.push(`(COALESCE(p.statut_moderation, 'actif') IN ('suspendu', 'rejete') OR (p.en_stock = FALSE AND p.motif_moderation IS NOT NULL))`);
      } else if (statut_moderation === 'actif') {
        conditions.push(`COALESCE(p.statut_moderation, 'actif') = 'actif' AND p.en_stock = TRUE`);
      } else {
        conditions.push(`COALESCE(p.statut_moderation, 'actif') = $${i++}`);
        values.push(statut_moderation);
      }
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM boutique_produits p
       JOIN boutiques b ON b.id = p.boutique_id
       LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
       ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || 0, 10);

    const { rows: produits } = await pool.query(
      `SELECT p.id, p.nom, p.description, p.prix, p.prix_barre, p.prix_achat,
              p.images, p.en_stock, p.stock_quantite, p.categorie, p.has_variants, p.created_at, p.updated_at,
              COALESCE(p.statut_moderation, 'actif') AS statut_moderation,
              p.motif_moderation, p.modere_le, p.modere_par,
              b.id AS boutique_id, b.nom AS boutique_nom, b.slug AS boutique_slug, b.telephone AS boutique_tel,
              u.id AS proprietaire_id, u.nom AS proprietaire_nom, u.email AS proprietaire_email, u.telephone AS proprietaire_tel,
              (SELECT COUNT(*)::int FROM boutique_produit_variantes WHERE produit_id = p.id) AS nb_variantes
       FROM boutique_produits p
       JOIN boutiques b ON b.id = p.boutique_id
       LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, parseInt(limit, 10), offset]
    );

    // Statistiques rapides catalogue marchands
    const { rows: statsRows } = await pool.query(`
      SELECT
        COUNT(*) AS total_produits,
        COUNT(*) FILTER (WHERE en_stock = TRUE AND COALESCE(statut_moderation, 'actif') = 'actif') AS en_stock,
        COUNT(*) FILTER (WHERE en_stock = FALSE OR stock_quantite <= 0) AS en_rupture,
        COUNT(*) FILTER (WHERE COALESCE(statut_moderation, 'actif') IN ('suspendu', 'rejete') OR (en_stock = FALSE AND motif_moderation IS NOT NULL)) AS nb_suspendus,
        COUNT(*) FILTER (WHERE has_variants = TRUE) AS avec_variantes,
        COALESCE(ROUND(AVG(prix)), 0)::int AS prix_moyen
      FROM boutique_produits
    `);

    res.json({
      success: true,
      produits,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      stats: statsRows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/produits/:id — Fiche détaillée produit marchand avec historique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prodRes = await pool.query(
      `SELECT p.*, COALESCE(p.statut_moderation, 'actif') AS statut_moderation,
              b.nom AS boutique_nom, b.slug AS boutique_slug, b.telephone AS boutique_tel,
              u.id AS proprietaire_id, u.nom AS proprietaire_nom, u.email AS proprietaire_email, u.telephone AS proprietaire_tel
       FROM boutique_produits p
       JOIN boutiques b ON b.id = p.boutique_id
       LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
       WHERE p.id = $1`,
      [id]
    );
    if (!prodRes.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });

    const [variantesRes, stocksEntrepotsRes, avisRes, auditLogsRes] = await Promise.all([
      pool.query('SELECT * FROM boutique_produit_variantes WHERE produit_id = $1 ORDER BY ordre ASC', [id]),
      pool.query(`
        SELECT se.*, e.nom AS entrepot_nom
        FROM boutique_produit_stocks_entrepots se
        JOIN boutique_entrepots e ON e.id = se.entrepot_id
        WHERE se.produit_id = $1
      `, [id]),
      pool.query('SELECT * FROM boutique_avis WHERE produit_id = $1 ORDER BY created_at DESC LIMIT 10', [id]),
      pool.query(`
        SELECT id, action, description, ancienne_valeur, nouvelle_valeur, admin_nom, created_at
        FROM admin_audit_logs
        WHERE cible_type = 'boutique_produit' AND cible_id = $1
        ORDER BY created_at DESC LIMIT 10
      `, [id]).catch(() => ({ rows: [] })),
    ]);

    res.json({
      success: true,
      produit: prodRes.rows[0],
      variantes: variantesRes.rows,
      stocksEntrepots: stocksEntrepotsRes.rows,
      avis: avisRes.rows,
      auditLogs: auditLogsRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/admin/produits/:id/moderation — Action de modération admin complète
router.put('/:id/moderation', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      action, // 'desactiver' | 'reactiver' | 'modifier' | 'supprimer'
      statut_moderation,
      motif,
      message_personnalise,
      notifier_marchand = true,
      canal = 'whatsapp_et_email', // 'whatsapp_et_email' | 'whatsapp' | 'email' | 'aucun'
      en_stock,
      stock_quantite,
      prix,
      prix_barre,
      nom,
      categorie,
    } = req.body;

    const cur = await pool.query(
      `SELECT p.*,
              b.id AS boutique_id, b.nom AS boutique_nom, b.slug AS boutique_slug, b.telephone AS boutique_tel,
              u.id AS proprietaire_id, u.nom AS proprietaire_nom, u.email AS proprietaire_email, u.telephone AS proprietaire_tel
       FROM boutique_produits p
       JOIN boutiques b ON b.id = p.boutique_id
       LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
       WHERE p.id = $1`,
      [id]
    );
    if (!cur.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });
    const prodActuel = cur.rows[0];

    const adminUser = req.user?.nom || req.user?.email || 'Administrateur';
    const telMarchand = prodActuel.proprietaire_tel || prodActuel.boutique_tel;
    const emailMarchand = prodActuel.proprietaire_email;
    const nomMarchand = prodActuel.proprietaire_nom || prodActuel.boutique_nom || 'Marchand Nopalou';

    // ── 1. Action Suppression Définitive ─────────────────────────
    if (action === 'supprimer') {
      await pool.query('DELETE FROM boutique_produits WHERE id = $1', [id]);

      await enregistrerAdminLog({
        action: 'produit_marchand_supprime',
        cibleType: 'boutique_produit',
        cibleId: id,
        description: `Suppression administrative du produit "${prodActuel.nom}" (Boutique: ${prodActuel.boutique_nom}) - Motif: ${motif || 'Non précisé'}`,
        ancienneValeur: { nom: prodActuel.nom, prix: prodActuel.prix, boutique_id: prodActuel.boutique_id },
        req,
      });

      // Notification au marchand si activée
      if (notifier_marchand) {
        const textMsg = `Bonjour ${nomMarchand},\n\nVotre article "${prodActuel.nom}" dans la boutique "${prodActuel.boutique_nom}" a été supprimé par l'administration Nopalou.\n\n📝 Motif : ${motif || 'Non-respect des règles de diffusion'}${message_personnalise ? `\n💬 Note complémentaire : ${message_personnalise}` : ''}\n\nPour toute réclamation, contactez le support Nopalou via votre espace boutique : ${SITE}/boutique`;

        if ((canal === 'whatsapp_et_email' || canal === 'whatsapp') && telMarchand) {
          sendWhatsAppNotification(telMarchand, {
            textMessage: textMsg,
            title: 'Article supprimé - Nopalou',
            montant: 'RETRAIT',
            detail: motif || 'Non-respect des règles',
            url: `${SITE}/boutique`,
            buttonParam: 'boutique',
            type: 'service',
          }).catch(e => console.warn('[ADMIN WA SUPPR ERR]', e.message));
        }

        if ((canal === 'whatsapp_et_email' || canal === 'email') && emailMarchand) {
          envoyerEmail({
            to: emailMarchand,
            subject: `Information importante : retrait de votre article "${prodActuel.nom}"`,
            html: `
              <div style="font-family: sans-serif; line-height: 1.6; color: #1c2b4a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8ddd2; border-radius: 10px;">
                <h2 style="color: #c75b00; margin-top: 0;">Retrait d'un article de votre boutique</h2>
                <p>Bonjour <strong>${nomMarchand}</strong>,</p>
                <p>L'équipe d'administration Nopalou a procédé à la suppression de l'article suivant sur votre boutique <strong>${prodActuel.boutique_nom}</strong> :</p>
                <div style="background: #f8fafc; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                  <p style="margin: 0; font-weight: 700; font-size: 15px;">${prodActuel.nom}</p>
                  <p style="margin: 6px 0 0; color: #475569; font-size: 13px;"><strong>Motif :</strong> ${motif || 'Non-respect des conditions d\'utilisation'}</p>
                  ${message_personnalise ? `<p style="margin: 6px 0 0; color: #1c2b4a; font-size: 13px;"><strong>Précision admin :</strong> ${message_personnalise}</p>` : ''}
                </div>
                <p>Vous pouvez consulter votre catalogue et vos autres produits depuis votre espace marchand.</p>
                <p><a href="${SITE}/boutique" style="display: inline-block; background: #1c2b4a; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 10px;">Accéder à ma boutique</a></p>
                <p style="font-size: 12px; color: #64748b; margin-top: 24px;">L'équipe Nopalou reste à votre disposition pour toute question.</p>
              </div>
            `,
          }).catch(e => console.warn('[ADMIN EMAIL SUPPR ERR]', e.message));
        }
      }

      return res.json({ success: true, deleted: true });
    }

    // ── 2. Détermination des mises à jour SQL ───────────────────────
    const updates = [];
    const values = [];
    let i = 1;

    let targetStatut = statut_moderation;
    let targetEnStock = en_stock;
    let targetMotif = motif;

    if (action === 'desactiver') {
      targetStatut = 'suspendu';
      targetEnStock = false;
      targetMotif = motif || 'Non-respect des règles de conformité';
    } else if (action === 'reactiver') {
      targetStatut = 'actif';
      targetEnStock = true;
      targetMotif = null;
    }

    if (targetStatut !== undefined) {
      updates.push(`statut_moderation = $${i++}`);
      values.push(targetStatut);
      updates.push(`modere_le = NOW()`);
      updates.push(`modere_par = $${i++}`);
      values.push(adminUser);
    }

    if (targetMotif !== undefined) {
      updates.push(`motif_moderation = $${i++}`);
      values.push(targetMotif ? targetMotif.trim() : null);
    }

    if (targetEnStock !== undefined) {
      updates.push(`en_stock = $${i++}`);
      values.push(Boolean(targetEnStock));
    }

    if (stock_quantite !== undefined) {
      updates.push(`stock_quantite = $${i++}`);
      values.push(stock_quantite === null || stock_quantite === '' ? null : parseInt(stock_quantite, 10));
    }

    if (prix !== undefined) {
      updates.push(`prix = $${i++}`);
      values.push(Number(prix));
    }

    if (prix_barre !== undefined) {
      updates.push(`prix_barre = $${i++}`);
      values.push(prix_barre === null || prix_barre === '' ? null : Number(prix_barre));
    }

    if (nom && nom.trim()) {
      updates.push(`nom = $${i++}`);
      values.push(nom.trim());
    }

    if (categorie) {
      updates.push(`categorie = $${i++}`);
      values.push(categorie.trim());
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE boutique_produits SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    const updatedProduit = rows[0];

    // Enregistrement Audit Log
    await enregistrerAdminLog({
      action: action === 'desactiver' ? 'produit_marchand_suspendu' : action === 'reactiver' ? 'produit_marchand_reactive' : 'produit_marchand_modere',
      cibleType: 'boutique_produit',
      cibleId: id,
      description: `Action modération "${action || 'maj'}" sur "${updatedProduit.nom}" (Motif: ${targetMotif || 'Aucun'})`,
      ancienneValeur: {
        en_stock: prodActuel.en_stock,
        statut: prodActuel.statut_moderation,
        motif: prodActuel.motif_moderation,
        prix: prodActuel.prix,
      },
      nouvelleValeur: {
        en_stock: updatedProduit.en_stock,
        statut: updatedProduit.statut_moderation,
        motif: updatedProduit.motif_moderation,
        prix: updatedProduit.prix,
      },
      req,
    });

    // ── 3. Notification Pédagogique au Marchand ───────────────────
    let notifResult = { email_envoye: false, whatsapp_envoye: false, whatsapp_direct_url: null };
    let messagePourMarchand = '';

    if (targetStatut === 'suspendu' || action === 'desactiver') {
      messagePourMarchand = `Bonjour ${nomMarchand},\n\nVotre article "${updatedProduit.nom}" sur votre boutique "${prodActuel.boutique_nom}" a été temporairement désactivé par l'équipe de modération Nopalou.\n\n📝 Motif : ${targetMotif || 'Photos non conformes ou informations incomplètes'}\n${message_personnalise ? `💬 Précisions de l'administrateur : ${message_personnalise}\n\n` : '\n'}👉 Vous pouvez corriger directement votre article pour demander sa réactivation : ${SITE}/boutique`;
    } else if (targetStatut === 'actif' || action === 'reactiver') {
      messagePourMarchand = `Bonjour ${nomMarchand},\n\nBonne nouvelle ! Votre article "${updatedProduit.nom}" a été vérifié et réactivé sur votre boutique "${prodActuel.boutique_nom}". Il est à nouveau disponible à la vente.\n\n👉 Voir votre boutique : ${SITE}/boutiques/${prodActuel.boutique_slug}`;
    } else if (message_personnalise) {
      messagePourMarchand = `Bonjour ${nomMarchand},\n\nMessage de l'administration Nopalou concernant votre article "${updatedProduit.nom}" (Boutique ${prodActuel.boutique_nom}) :\n\n${message_personnalise}\n\n👉 Accéder à votre espace : ${SITE}/boutique`;
    }

    if (telMarchand && messagePourMarchand) {
      notifResult.whatsapp_direct_url = formatWhatsAppLink(telMarchand, messagePourMarchand);
    }

    if (notifier_marchand && messagePourMarchand) {
      // Notification WhatsApp automatique
      if ((canal === 'whatsapp_et_email' || canal === 'whatsapp') && telMarchand) {
        try {
          const detailCourt = (targetMotif || message_personnalise || 'Mise à jour modération').slice(0, 80);
          await sendWhatsAppNotification(telMarchand, {
            textMessage: messagePourMarchand,
            title: targetStatut === 'suspendu' ? 'Article désactivé' : 'Article validé',
            montant: targetStatut === 'suspendu' ? 'MODÉRATION' : 'ACTIF',
            detail: detailCourt,
            url: `${SITE}/boutique`,
            buttonParam: 'boutique',
            type: 'service',
          });
          notifResult.whatsapp_envoye = true;
        } catch (e) {
          console.warn('[ADMIN NOTIF WA PRODUIT ERR]', e.message);
        }
      }

      // Notification Email automatique
      if ((canal === 'whatsapp_et_email' || canal === 'email') && emailMarchand) {
        try {
          const isSuspension = targetStatut === 'suspendu' || action === 'desactiver';
          const sujet = isSuspension
            ? `Action requise sur votre article "${updatedProduit.nom}" — Nopalou`
            : `Votre article "${updatedProduit.nom}" a été validé sur Nopalou`;

          await envoyerEmail({
            to: emailMarchand,
            subject: sujet,
            html: `
              <div style="font-family: sans-serif; line-height: 1.6; color: #1c2b4a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8ddd2; border-radius: 10px;">
                <h2 style="color: ${isSuspension ? '#c75b00' : '#0a5c36'}; margin-top: 0;">
                  ${isSuspension ? 'Suspension temporaire d\'un article' : 'Article réactivé avec succès'}
                </h2>
                <p>Bonjour <strong>${nomMarchand}</strong>,</p>
                <p>
                  ${isSuspension
                    ? `Votre article <strong>${updatedProduit.nom}</strong> dans votre boutique <strong>${prodActuel.boutique_nom}</strong> a été désactivé par l'équipe de modération.`
                    : `Votre article <strong>${updatedProduit.nom}</strong> est désormais en ligne et disponible à la commande.`}
                </p>
                ${isSuspension ? `
                  <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #991b1b; font-weight: 700; font-size: 14px;">Motif de désactivation :</p>
                    <p style="margin: 4px 0 0; color: #1c2b4a; font-size: 13px;">${targetMotif || 'Non-conformité aux critères de publication'}</p>
                    ${message_personnalise ? `<p style="margin: 8px 0 0; color: #475569; font-size: 13px;"><strong>Note de l'administrateur :</strong> ${message_personnalise}</p>` : ''}
                  </div>
                  <p>Il vous suffit de rectifier les éléments signalés dans votre espace de gestion pour réactiver l'article.</p>
                ` : `
                  <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 13px;">Votre produit respecte désormais les standards de la plateforme.</p>
                  </div>
                `}
                <p><a href="${SITE}/boutique" style="display: inline-block; background: #1c2b4a; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 10px;">Accéder à ma boutique</a></p>
                <p style="font-size: 12px; color: #64748b; margin-top: 24px;">L'équipe Nopalou est à votre disposition pour vous accompagner dans la réussite de vos ventes.</p>
              </div>
            `,
          });
          notifResult.email_envoye = true;
        } catch (e) {
          console.warn('[ADMIN NOTIF EMAIL PRODUIT ERR]', e.message);
        }
      }
    }

    res.json({
      success: true,
      produit: {
        ...updatedProduit,
        boutique_nom: prodActuel.boutique_nom,
        boutique_slug: prodActuel.boutique_slug,
        proprietaire_nom: prodActuel.proprietaire_nom,
        proprietaire_tel: prodActuel.proprietaire_tel,
        proprietaire_email: prodActuel.proprietaire_email,
        boutique_tel: prodActuel.boutique_tel,
      },
      notification: notifResult,
    });
  } catch (err) {
    console.error('[ADMIN MODERATION PRODUIT ERR]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/produits/:id/message-marchand — Échange direct avec le marchand
router.post('/:id/message-marchand', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, objet, canal = 'whatsapp_et_email' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Le message est obligatoire' });
    }

    const cur = await pool.query(
      `SELECT p.id, p.nom, b.nom AS boutique_nom, b.slug AS boutique_slug, b.telephone AS boutique_tel,
              u.nom AS proprietaire_nom, u.email AS proprietaire_email, u.telephone AS proprietaire_tel
       FROM boutique_produits p
       JOIN boutiques b ON b.id = p.boutique_id
       LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
       WHERE p.id = $1`,
      [id]
    );
    if (!cur.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });
    const p = cur.rows[0];

    const telMarchand = p.proprietaire_tel || p.boutique_tel;
    const emailMarchand = p.proprietaire_email;
    const nomMarchand = p.proprietaire_nom || p.boutique_nom || 'Marchand Nopalou';

    const texteMessage = `Bonjour ${nomMarchand},\n\nMessage de l'équipe Nopalou concernant votre article "${p.nom}" (Boutique ${p.boutique_nom}) :\n\n${message.trim()}\n\n👉 Accéder à votre espace marchand : ${SITE}/boutique`;

    let waEnvoye = false;
    let emailEnvoye = false;
    const waDirectUrl = formatWhatsAppLink(telMarchand, texteMessage);

    if ((canal === 'whatsapp_et_email' || canal === 'whatsapp') && telMarchand) {
      try {
        await sendWhatsAppNotification(telMarchand, {
          textMessage: texteMessage,
          title: objet || 'Message Modération Produit',
          montant: 'MESSAGE',
          detail: message.trim().slice(0, 80),
          url: `${SITE}/boutique`,
          buttonParam: 'boutique',
          type: 'service',
        });
        waEnvoye = true;
      } catch (e) {
        console.warn('[MSG MARCHAND WA ERR]', e.message);
      }
    }

    if ((canal === 'whatsapp_et_email' || canal === 'email') && emailMarchand) {
      try {
        await envoyerEmail({
          to: emailMarchand,
          subject: objet || `Message de l'administration concernant "${p.nom}"`,
          html: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #1c2b4a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8ddd2; border-radius: 10px;">
              <h2 style="color: #1c2b4a; margin-top: 0;">Message de l'équipe Nopalou</h2>
              <p>Bonjour <strong>${nomMarchand}</strong>,</p>
              <p>L'administration Nopalou vous a envoyé un message au sujet de votre article <strong>${p.nom}</strong> :</p>
              <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 14px 18px; margin: 16px 0; border-radius: 6px;">
                <p style="margin: 0; white-space: pre-wrap; font-size: 14px; color: #1c2b4a;">${message.trim()}</p>
              </div>
              <p><a href="${SITE}/boutique" style="display: inline-block; background: #1c2b4a; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 10px;">Répondre / Voir mon article</a></p>
            </div>
          `,
        });
        emailEnvoye = true;
      } catch (e) {
        console.warn('[MSG MARCHAND EMAIL ERR]', e.message);
      }
    }

    await enregistrerAdminLog({
      action: 'produit_message_marchand_envoye',
      cibleType: 'boutique_produit',
      cibleId: id,
      description: `Message envoyé au marchand de "${p.nom}" : ${message.trim().slice(0, 100)}`,
      req,
    });

    res.json({
      success: true,
      whatsapp_envoye: waEnvoye,
      email_envoye: emailEnvoye,
      whatsapp_direct_url: waDirectUrl,
    });
  } catch (err) {
    console.error('[POST /message-marchand ERR]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
