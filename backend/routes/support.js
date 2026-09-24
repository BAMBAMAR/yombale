// backend/routes/support.js
// Centre public et authentifié de signalement d'incidents, helpdesk et SAV Nopalou

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { tokenOptional, verifierToken } = require('../middlewares/auth');
const rateLimit = require('express-rate-limit');
const cfg = require('../lib/settingsCache');
const { sendWhatsAppText, normalisePhone } = require('../services/whatsapp');
const { alerterAdmin } = require('../services/admin-alerts');
const { envoyerEmail } = require('../services/email');

// Limiteur de requêtes pour prévenir le spam de tickets et signalements
const supportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes au support. Veuillez patienter 15 minutes.' },
});

/**
 * Génère un identifiant séquentiel lisible pour le ticket (ex: TCK-20260924-A3B9Z)
 */
function genererNumeroTicket() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `TCK-${dateStr}-${randPart}`;
}

// ── 1. POST /api/support/tickets — Créer un ticket (Client, Marchand ou Visiteur) ──
router.post('/tickets', supportLimiter, tokenOptional, async (req, res) => {
  try {
    const {
      sujet,
      message,
      description,
      categorie = 'autre',
      priorite: prioriteInit,
      commande_ref,
      commande_id,
      boutique_id,
      nom,
      contact_nom,
      email,
      contact_email,
      telephone,
      contact_telephone,
      canal = 'web',
      pieces_jointes = [],
    } = req.body;

    const rawSujet = (sujet || '').trim();
    const rawMessage = (message || description || '').trim();

    if (!rawSujet || !rawMessage) {
      return res.status(400).json({
        success: false,
        error: 'Sujet et description du problème obligatoires.',
      });
    }

    const userId = req.user?.userId || req.user?.id || null;
    let contactNom = (contact_nom || nom || '').trim() || null;
    let contactEmail = (contact_email || email || '').trim().toLowerCase() || null;
    let contactTel = (contact_telephone || telephone || '').trim() || null;

    // Si utilisateur connecté et contact absent, récupérer les coordonnées du compte
    if (userId && (!contactNom || !contactEmail || !contactTel)) {
      try {
        const { rows: uRows } = await pool.query(
          'SELECT nom, email, telephone FROM utilisateurs WHERE id = $1',
          [userId]
        );
        if (uRows.length > 0) {
          contactNom = contactNom || uRows[0].nom;
          contactEmail = contactEmail || uRows[0].email;
          contactTel = contactTel || uRows[0].telephone;
        }
      } catch (errU) {
        console.warn('[SUPPORT USER LOOKUP WARN]:', errU.message);
      }
    }

    // Si visiteur non connecté, exiger au moins un téléphone ou un email
    if (!userId && !contactTel && !contactEmail) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez indiquer un numéro de téléphone ou un email de contact pour le suivi de votre dossier.',
      });
    }

    // Résolution contextuelle automatique si référence de commande fournie
    let effectiveCmdId = commande_id || null;
    let effectiveBoutiqueId = boutique_id || null;
    let cmdRefAffichee = commande_ref || null;

    const refToLookup = commande_ref || commande_id;
    if (refToLookup) {
      try {
        const cRes = await pool.query(
          `SELECT id, reference, boutique_id, client_nom, client_telephone
           FROM commandes_boutique
           WHERE reference = $1 OR id::text = $1 LIMIT 1`,
          [refToLookup]
        );
        const cRows = cRes?.rows || [];
        if (cRows.length > 0) {
          effectiveCmdId = cRows[0].id;
          effectiveBoutiqueId = effectiveBoutiqueId || cRows[0].boutique_id;
          cmdRefAffichee = cRows[0].reference;
          contactNom = contactNom || cRows[0].client_nom;
          contactTel = contactTel || cRows[0].client_telephone;
        }
      } catch (errC) {
        console.warn('[SUPPORT CMD LOOKUP WARN]:', errC.message);
      }
    }

    // Auto-qualification de la priorité si non fournie explicitement
    let priorite = prioriteInit || 'normale';
    const textCorpus = `${rawSujet} ${rawMessage}`.toLowerCase();
    if (!prioriteInit) {
      if (/bloqu|arnaqu|escroq|double debit|urgent|vol/i.test(textCorpus)) {
        priorite = 'urgente';
      } else if (/paiement|rembours|wave|orange money|om|argent|non recu/i.test(textCorpus)) {
        priorite = 'haute';
      }
    }

    const numeroTicket = genererNumeroTicket();
    const premierMessage = {
      auteur: contactNom || 'Client',
      role: 'client',
      email: contactEmail,
      texte: rawMessage,
      message: rawMessage,
      date: new Date().toISOString(),
    };

    const insertRes = await pool.query(
      `INSERT INTO support_tickets (
        numero_ticket, utilisateur_id, commande_id, boutique_id,
        sujet, categorie, priorite, statut, contact_nom, contact_email,
        contact_telephone, canal, pieces_jointes, messages, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ouvert', $8, $9, $10, $11, $12::jsonb, $13::jsonb, NOW(), NOW())
      RETURNING *`,
      [
        numeroTicket,
        userId,
        effectiveCmdId,
        effectiveBoutiqueId,
        rawSujet,
        categorie,
        priorite,
        contactNom,
        contactEmail,
        contactTel,
        canal,
        JSON.stringify(Array.isArray(pieces_jointes) ? pieces_jointes : []),
        JSON.stringify([premierMessage]),
      ]
    );
    const newTicket = insertRes?.rows || [];

    // Notification de l'administrateur
    try {
      const adminTel = await cfg.get('admin_notification_phone');
      if (adminTel) {
        const notifAdmin =
          `🎫 *Nouveau Ticket Support Nopalou (${numeroTicket})*\n\n` +
          `📌 Sujet : *${rawSujet}*\n` +
          `👤 Demandeur : *${contactNom || 'Anonyme'}* (${contactTel || 'N/A'})\n` +
          `⚡ Priorité : *${priorite.toUpperCase()}*\n` +
          (cmdRefAffichee ? `📦 Réf Commande : ${cmdRefAffichee}\n` : '') +
          `\n👉 Traiter dans le Helpdesk : https://nopalou.com/admin/support`;
        sendWhatsAppText(normalisePhone(adminTel), notifAdmin).catch(() => {});
      }

      if (priorite === 'urgente') {
        alerterAdmin({
          type: 'support_ticket_urgent',
          titre: `Ticket d'urgence reçu : ${numeroTicket}`,
          message: `Nouveau ticket prioritaire créé par ${contactNom || 'Client'} : "${rawSujet}"`,
          details: rawMessage,
          priorite: 'CRITIQUE',
        }).catch(() => {});
      }
    } catch (_) {}

    // Confirmation automatique par email si email disponible
    if (contactEmail) {
      envoyerEmail({
        to: contactEmail,
        subject: `[Nopalou Support] Ticket ${numeroTicket} bien enregistré`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1C2B4A;line-height:1.6">
            <h2 style="color:#C75B00">Votre demande d'assistance a été enregistrée</h2>
            <p>Bonjour ${contactNom || ''},</p>
            <p>Votre ticket <strong>${numeroTicket}</strong> a bien été pris en compte par notre équipe d'assistance.</p>
            <div style="background:#F8F5F0;border:1px solid #E8DDD2;padding:16px;border-radius:8px;margin:18px 0">
              <p style="margin:0 0 8px"><strong>Sujet :</strong> ${rawSujet}</p>
              <p style="margin:0"><strong>Priorité :</strong> ${priorite}</p>
            </div>
            <p>Un conseiller traitera votre demande sous 24h ouvrées. Vous recevrez une notification dès qu'une réponse vous sera apportée.</p>
            <p style="color:#64748b;font-size:12px;margin-top:24px">Équipe Support Nopalou — Dakar, Sénégal</p>
          </div>
        `,
      }).catch(errE => console.warn('[SUPPORT CLIENT EMAIL CONFIRM ERR]:', errE.message));
    }

    const t = newTicket && newTicket[0] ? newTicket[0] : { numero_ticket: numeroTicket, id: 'temp' };

    res.status(201).json({
      success: true,
      message: 'Votre ticket de support a été créé avec succès.',
      ticket: {
        id: t.id,
        numero: t.numero_ticket || numeroTicket,
        numero_ticket: t.numero_ticket || numeroTicket,
        sujet: t.sujet || rawSujet,
        priorite: t.priorite || priorite,
        statut: t.statut || 'ouvert',
        created_at: t.created_at || new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[POST /api/support/tickets ERR]:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la création du ticket de support.' });
  }
});

// ── 2. GET /api/support/tickets/mes-tickets — Tickets de l'utilisateur connecté ──
router.get('/tickets/mes-tickets', verifierToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { rows } = await pool.query(
      `SELECT st.id, st.numero_ticket, st.sujet, st.categorie, st.priorite, st.statut,
              st.created_at, st.updated_at,
              b.nom AS boutique_nom,
              cmd.reference AS commande_ref,
              jsonb_array_length(st.messages) AS nb_messages
       FROM support_tickets st
       LEFT JOIN boutiques b ON b.id = st.boutique_id
       LEFT JOIN commandes_boutique cmd ON cmd.id = st.commande_id
       WHERE st.utilisateur_id = $1
       ORDER BY st.updated_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      tickets: rows.map(r => ({ ...r, numero: r.numero_ticket })),
    });
  } catch (err) {
    console.error('[GET /api/support/tickets/mes-tickets ERR]:', err);
    res.status(500).json({ success: false, error: 'Erreur récupération des tickets.' });
  }
});

// ── 3. GET /api/support/tickets/suivi/:numero — Consulter l'état d'un ticket ──
router.get('/tickets/suivi/:numero', tokenOptional, async (req, res) => {
  try {
    const { numero } = req.params;
    const { tel, email, contact } = req.query;

    const { rows } = await pool.query(
      `SELECT st.id, st.numero_ticket, st.sujet, st.description, st.categorie, st.priorite, st.statut,
              st.contact_nom, st.contact_telephone, st.contact_email, st.messages,
              st.utilisateur_id,
              st.created_at, st.updated_at,
              b.nom AS boutique_nom,
              cmd.reference AS commande_ref
       FROM support_tickets st
       LEFT JOIN boutiques b ON b.id = st.boutique_id
       LEFT JOIN commandes_boutique cmd ON cmd.id = st.commande_id
       WHERE st.numero_ticket = $1 OR st.id::text = $1`,
      [numero.trim()]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Ticket introuvable.' });
    }

    const t = rows[0];
    const userId = req.user?.userId || req.user?.id || null;

    // Protection Anti-IDOR : si l'utilisateur n'est pas le créateur connecté
    const isOwner = userId && String(t.utilisateur_id) === String(userId);
    if (!isOwner) {
      const contactVal = contact || tel || email;
      if (!contactVal) {
        return res.status(403).json({
          success: false,
          error: 'Veuillez renseigner votre numéro de téléphone ou votre adresse email pour consulter ce dossier.',
        });
      }

      const cleanInput = String(contactVal).replace(/\D/g, '').slice(-8);
      const cleanTel = t.contact_telephone ? String(t.contact_telephone).replace(/\D/g, '').slice(-8) : '';
      const emailMatches = t.contact_email && t.contact_email.toLowerCase() === String(contactVal).trim().toLowerCase();
      const telMatches = cleanTel && cleanInput && (cleanTel === cleanInput);

      if (!telMatches && !emailMatches) {
        return res.status(403).json({
          success: false,
          error: 'Coordonnées de vérification non correspondantes.',
        });
      }
    }

    const normalizedMessages = (t.messages || []).map(m => ({
      ...m,
      message: m.message || m.texte || '',
      texte: m.texte || m.message || '',
    }));

    res.json({
      success: true,
      ticket: {
        id: t.id,
        numero: t.numero_ticket || t.numero,
        numero_ticket: t.numero_ticket || t.numero,
        sujet: t.sujet,
        description: t.description || (normalizedMessages[0]?.message || ''),
        categorie: t.categorie,
        priorite: t.priorite,
        statut: t.statut,
        boutique_nom: t.boutique_nom,
        commande_ref: t.commande_ref,
        contact_nom: t.contact_nom,
        created_at: t.created_at,
        updated_at: t.updated_at,
        messages: normalizedMessages,
      },
    });
  } catch (err) {
    console.error('[GET /api/support/tickets/suivi ERR]:', err);
    res.status(500).json({ success: false, error: 'Erreur lors du suivi du ticket.' });
  }
});

// ── 4. POST /api/support/tickets/:numero/repondre — Répondre à un ticket existant ──
router.post('/tickets/:numero/repondre', supportLimiter, tokenOptional, async (req, res) => {
  try {
    const { numero } = req.params;
    const { message, auteur_nom, contact } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message requis. Le message ne peut pas être vide.' });
    }

    const { rows } = await pool.query(
      `SELECT * FROM support_tickets WHERE numero_ticket = $1 OR id::text = $1`,
      [numero.trim()]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Ticket introuvable.' });
    }

    const ticket = rows[0];

    if (ticket.statut === 'ferme') {
      return res.status(400).json({
        success: false,
        error: 'Ce ticket est clôturé. Veuillez ouvrir un nouveau ticket pour votre nouvelle demande.',
      });
    }

    const messages = Array.isArray(ticket.messages) ? ticket.messages : [];
    const clientReply = {
      id: `msg-${Date.now()}`,
      auteur: 'client',
      nom: auteur_nom || ticket.contact_nom || 'Client',
      role: 'client',
      message: message.trim(),
      texte: message.trim(),
      date: new Date().toISOString(),
    };
    messages.push(clientReply);

    let updatedTicket = ticket;
    try {
      const { rows: updateRows } = await pool.query(
        `UPDATE support_tickets
         SET messages = $1::jsonb,
             statut = 'ouvert',
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [JSON.stringify(messages), ticket.id]
      );
      if (updateRows && updateRows.length > 0) {
        updatedTicket = updateRows[0];
      }
    } catch (dbErr) {
      console.warn('[SUPPORT DB UPDATE MSG WARN]:', dbErr.message);
    }

    // Alerter l'admin si configuré
    try {
      const adminTel = await cfg.get('admin_notification_phone');
      if (adminTel) {
        sendWhatsAppText(
          normalisePhone(adminTel),
          `💬 *Nouvelle réponse client sur le ticket ${ticket.numero_ticket}*\n"${message.trim().slice(0, 120)}..."\n👉 https://nopalou.com/admin/support`
        ).catch(() => {});
      }
    } catch (_) {}

    res.json({
      success: true,
      message: clientReply,
      ticket: {
        id: updatedTicket.id,
        numero: updatedTicket.numero_ticket || ticket.numero_ticket,
        numero_ticket: updatedTicket.numero_ticket || ticket.numero_ticket,
        statut: updatedTicket.statut || 'ouvert',
        messages,
        updated_at: updatedTicket.updated_at || new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[POST /api/support/tickets/repondre ERR]:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'envoi de la réponse.' });
  }
});

// ── 5. POST /api/support/signalements — Déposer un signalement d'abus / fraude ──
router.post('/signalements', supportLimiter, tokenOptional, async (req, res) => {
  try {
    const {
      type_cible,
      type_entite,
      cible_id,
      entite_id,
      motif,
      description,
      telephone,
      contact_telephone,
      email,
      contact_email,
      pieces_jointes = [],
    } = req.body;

    const effectiveType = (type_cible || type_entite || '').toLowerCase().trim();
    const effectiveCibleId = cible_id || entite_id;

    if (!effectiveType || !effectiveCibleId || !motif) {
      return res.status(400).json({
        success: false,
        error: 'type d\'entité et motif requis pour déposer un signalement.',
      });
    }

    const validTypes = ['annonce', 'boutique', 'utilisateur', 'immo'];
    if (!validTypes.includes(effectiveType)) {
      return res.status(400).json({ success: false, error: 'Type de cible invalide.' });
    }

    const userId = req.user?.userId || req.user?.id || null;
    const authorTel = (contact_telephone || telephone) ? String(contact_telephone || telephone).trim() : null;
    const authorEmail = (contact_email || email) ? String(contact_email || email).trim().toLowerCase() : null;

    const { rows } = await pool.query(
      `INSERT INTO signalements (
        type_cible, cible_id, signale_par, auteur_telephone, auteur_email,
        motif, description, pieces_jointes, statut, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, 'en_attente', NOW(), NOW())
      RETURNING id, type_cible, cible_id, motif, statut, created_at`,
      [
        effectiveType,
        String(effectiveCibleId),
        userId,
        authorTel,
        authorEmail,
        motif.trim(),
        description ? description.trim() : null,
        JSON.stringify(Array.isArray(pieces_jointes) ? pieces_jointes : []),
      ]
    );

    // Alerter l'équipe de modération si motif grave
    if (/arnaque|fraude|faux|escroquerie|usurpation/i.test(motif)) {
      alerterAdmin({
        type: 'signalement_fraude',
        titre: `Signalement d'abus prioritaire : ${motif}`,
        message: `Signalement déposé sur ${effectiveType} #${effectiveCibleId} : "${description || motif}"`,
        priorite: 'ATTENTION',
      }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: 'Votre signalement a bien été transmis à l\'équipe de modération Nopalou. Merci pour votre vigilance.',
      signalement: rows[0],
    });
  } catch (err) {
    console.error('[POST /api/support/signalements ERR]:', err);
    res.status(500).json({ success: false, error: 'Erreur lors du dépôt du signalement.' });
  }
});

module.exports = router;
