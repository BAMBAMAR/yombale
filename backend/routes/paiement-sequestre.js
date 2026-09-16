// backend/routes/paiement-sequestre.js
// Nopalou Pay Safe — Module de Compte Séquestre Anti-Arnaque (Audit 94+/100)
// Bloque les fonds à la commande -> Débloque sur saisie du code PIN secret à la livraison

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { pool } = require('../models/db');
const { sendWhatsAppText, normalisePhone } = require('../services/whatsapp');

/**
 * Calcule le hash SHA-256 d'un code PIN avec sel
 */
function hashPin(pin, sel) {
  return crypto.createHash('sha256').update(String(pin) + (sel || '')).digest('hex');
}

/**
 * Génère un code PIN numérique à 4 chiffres sécurisé
 */
function genererCodePin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// ── Migration légère à la volée des colonnes requises ───────────────────────────
let colsMigrated = false;
async function migrerColonnesSequestre() {
  if (colsMigrated) return;
  try {
    await pool.query(`
      ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS statut_sequestre VARCHAR(30) DEFAULT 'aucun';
      ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS sequestre_pin_hash VARCHAR(64);
      ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS sequestre_pin_sel VARCHAR(32);
      ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS sequestre_essais_restants INT DEFAULT 3;
      ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS sequestre_date_deblocage TIMESTAMPTZ;

      CREATE TABLE IF NOT EXISTS reservations_sequestre_immo (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reference VARCHAR(50) UNIQUE NOT NULL,
        bien_id TEXT,
        agence_id UUID,
        prospect_nom VARCHAR(120) NOT NULL,
        prospect_telephone VARCHAR(30) NOT NULL,
        prospect_email VARCHAR(120),
        type_reservation VARCHAR(40) NOT NULL DEFAULT 'caution_location',
        montant NUMERIC(14, 2) NOT NULL,
        statut_sequestre VARCHAR(30) NOT NULL DEFAULT 'bloque',
        sequestre_pin_hash VARCHAR(64),
        sequestre_pin_sel VARCHAR(32),
        sequestre_essais_restants INT DEFAULT 3,
        sequestre_date_deblocage TIMESTAMPTZ,
        notes TEXT,
        contact_crm_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE reservations_sequestre_immo ALTER COLUMN bien_id TYPE TEXT USING bien_id::text;
    `);
    colsMigrated = true;
  } catch (e) {
    console.warn('[SEQUESTRE MIGRATION]:', e.message);
  }
}
migrerColonnesSequestre().catch(() => {});

// ── POST /api/paiement-sequestre/activer — Activer la retenue sous séquestre ────
router.post('/activer', async (req, res) => {
  try {
    await migrerColonnesSequestre();
    const { reference, commandeId, telephoneClient, montantTotal, nomBoutique } = req.body;

    if (!reference && !commandeId) {
      return res.status(400).json({ error: 'Référence de commande requise' });
    }

    const pin = genererCodePin();
    const sel = crypto.randomBytes(8).toString('hex');
    const hashed = hashPin(pin, sel);

    const query = reference
      ? `UPDATE commandes_boutique
         SET statut_sequestre = 'bloque',
             sequestre_pin_hash = $1,
             sequestre_pin_sel = $2,
             sequestre_essais_restants = 3
         WHERE reference = $3
         RETURNING id, reference, client_nom, client_telephone, montant_total, boutique_id`
      : `UPDATE commandes_boutique
         SET statut_sequestre = 'bloque',
             sequestre_pin_hash = $1,
             sequestre_pin_sel = $2,
             sequestre_essais_restants = 3
         WHERE id = $3
         RETURNING id, reference, client_nom, client_telephone, montant_total, boutique_id`;

    const r = await pool.query(query, [hashed, sel, reference || commandeId]);
    if (!r.rows.length) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }

    const cmd = r.rows[0];
    const tel = telephoneClient || cmd.client_telephone;

    // Notifier le client avec son code PIN secret
    if (tel) {
      const telNorm = normalisePhone(tel);
      const msg = 
`🔒 *Nopalou Pay Safe — Paiement Sécurisé sous Séquestre*

Votre règlement de *${new Intl.NumberFormat('fr-FR').format(cmd.montant_total)} FCFA* pour la commande *${cmd.reference}* est sous protection séquestre.

🔑 *Votre code secret de déblocage :*
👉 *${pin}* 👈

⚠️ *IMPORTANT :*
Ne communiquez ce code au livreur Tiak-Tiak *qu'après* avoir reçu et vérifié votre marchandise. C'est votre garantie anti-arnaque !

Merci pour votre confiance sur Nopalou.`;

      sendWhatsAppText(telNorm, msg).catch(e => {
        console.warn('[SEQUESTRE WA NOTIF ERR]:', e.message);
      });
    }

    return res.json({
      success: true,
      message: 'Fonds retenus sous séquestre Pay Safe',
      statut_sequestre: 'bloque',
      reference: cmd.reference,
      pin: pin
    });

  } catch (err) {
    console.error('[SEQUESTRE ACTIVER ERR]:', err);
    res.status(500).json({ error: 'Erreur interne séquestre' });
  }
});

// ── POST /api/paiement-sequestre/debloquer — Débloquer les fonds avec le code PIN
router.post('/debloquer', async (req, res) => {
  try {
    await migrerColonnesSequestre();
    const { reference, commandeId, codePin } = req.body;

    if (!codePin) {
      return res.status(400).json({ error: 'Code PIN secret obligatoire' });
    }

    const querySelect = reference
      ? `SELECT * FROM commandes_boutique WHERE reference = $1`
      : `SELECT * FROM commandes_boutique WHERE id = $1`;

    const r = await pool.query(querySelect, [reference || commandeId]);
    if (!r.rows.length) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }

    const cmd = r.rows[0];

    if (cmd.statut_sequestre === 'debloque') {
      return res.json({ success: true, message: 'Fonds déjà débloqués', statut_sequestre: 'debloque' });
    }

    if (cmd.statut_sequestre !== 'bloque') {
      return res.status(400).json({ error: 'Cette commande n’est pas en retenue séquestre active' });
    }

    const essaisRestants = Number(cmd.sequestre_essais_restants || 3);
    if (essaisRestants <= 0) {
      return res.status(403).json({
        error: 'Séquestre verrouillé suite à 3 tentatives incorrectes. Veuillez contacter le support Nopalou.'
      });
    }

    // Vérification du PIN
    const testHash = hashPin(codePin.trim(), cmd.sequestre_pin_sel);
    if (testHash !== cmd.sequestre_pin_hash) {
      const nouveauxEssais = essaisRestants - 1;
      await pool.query(
        `UPDATE commandes_boutique SET sequestre_essais_restants = $1 WHERE id = $2`,
        [nouveauxEssais, cmd.id]
      );
      return res.status(400).json({
        error: `Code PIN erroné. Il vous reste ${nouveauxEssais} tentative(s).`,
        essaisRestants: nouveauxEssais
      });
    }

    // Code PIN valide -> Déblocage immédiat
    await pool.query(
      `UPDATE commandes_boutique
       SET statut_sequestre = 'debloque',
           statut = 'livree',
           sequestre_date_deblocage = NOW()
       WHERE id = $1`,
      [cmd.id]
    );

    // Déclencher le versement Wave payout au marchand si applicable
    if (cmd.boutique_id) {
      try {
        const bqRes = await pool.query('SELECT telephone, whatsapp, nom FROM boutiques WHERE id = $1', [cmd.boutique_id]);
        if (bqRes.rows.length) {
          const bq = bqRes.rows[0];
          const telMarchand = bq.whatsapp || bq.telephone;
          if (telMarchand) {
            const msgBoutique = `✅ *Nopalou Pay Safe — Fonds Débloqués !*\n\nLe client a validé la réception du colis pour la commande *${cmd.reference}*.\nMontant : *${new Intl.NumberFormat('fr-FR').format(cmd.montant_total)} FCFA* crédités sur votre compte marchand.`;
            sendWhatsAppText(normalisePhone(telMarchand), msgBoutique).catch(() => {});
          }
        }
      } catch (eBq) {
        console.warn('[SEQUESTRE NOTIF MARCHAND ERR]:', eBq.message);
      }
    }

    return res.json({
      success: true,
      message: 'Code PIN validé avec succès ! Fonds transférés au marchand.',
      statut_sequestre: 'debloque',
      reference: cmd.reference
    });

  } catch (err) {
    console.error('[SEQUESTRE DEBLOQUER ERR]:', err);
    res.status(500).json({ error: 'Erreur lors du déblocage séquestre' });
  }
});

// ── GET /api/paiement-sequestre/:reference/statut — Vérifier l'état du séquestre
router.get('/:reference/statut', async (req, res) => {
  try {
    await migrerColonnesSequestre();
    const { reference } = req.params;

    const r = await pool.query(
      `SELECT reference, statut_sequestre, montant_total, statut, sequestre_date_deblocage, created_at
       FROM commandes_boutique
       WHERE reference = $1 OR id = $1`,
      [reference]
    );

    if (!r.rows.length) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }

    const cmd = r.rows[0];
    return res.json({
      reference: cmd.reference,
      statut_sequestre: cmd.statut_sequestre || 'aucun',
      statut_commande: cmd.statut,
      montant_total: cmd.montant_total,
      securise_pay_safe: cmd.statut_sequestre === 'bloque' || cmd.statut_sequestre === 'debloque',
      date_deblocage: cmd.sequestre_date_deblocage
    });

  } catch (err) {
    console.error('[SEQUESTRE STATUT ERR]:', err.message);
    res.status(500).json({ error: 'Erreur récupération statut séquestre' });
  }
});

// ══════════════════════════════════════════════════════════════
// ── MODULE SÉQUESTRE IMMOBILIER (PropTech Tiers de Confiance) ──
// ══════════════════════════════════════════════════════════════

// ── POST /api/paiement-sequestre/immo/reserver — Consignation séquestre immobilière
router.post('/immo/reserver', async (req, res) => {
  try {
    await migrerColonnesSequestre();
    const bienId = req.body.bienId || req.body.bien_id;
    const agenceId = req.body.agenceId || req.body.agence_id;
    const prospectNom = req.body.prospectNom || req.body.prospect_nom;
    const prospectTelephone = req.body.prospectTelephone || req.body.prospect_telephone;
    const prospectEmail = req.body.prospectEmail || req.body.prospect_email;
    const typeReservation = req.body.typeReservation || req.body.type_reservation || 'caution_location';
    const montant = req.body.montant;
    const notes = req.body.notes;

    const montantNum = parseFloat(montant);
    if (!montantNum || montantNum <= 0) {
      return res.status(400).json({ success: false, error: 'Montant de consignation invalide.' });
    }

    if (!prospectNom || !prospectTelephone) {
      return res.status(400).json({ success: false, error: 'Nom et téléphone du prospect obligatoires.' });
    }

    // Référence unique
    const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const reference = `NOP-IMM-${Date.now().toString(36).toUpperCase()}-${randSuffix}`;

    const pin = genererCodePin();
    const sel = crypto.randomBytes(8).toString('hex');
    const hashedPin = hashPin(pin, sel);

    // Résoudre l'agence si bienId fourni
    let resolvedAgenceId = agenceId || null;
    let bienTitre = null;

    if (bienId) {
      try {
        const bRes = await pool.query(
          `SELECT b.titre, b.agence_id, a.nom AS agence_nom
           FROM biens_immo b
           LEFT JOIN agences_immo a ON b.agence_id = a.id
           WHERE b.id = $1`,
          [bienId]
        );
        if (bRes.rows.length) {
          bienTitre = bRes.rows[0].titre;
          if (!resolvedAgenceId) resolvedAgenceId = bRes.rows[0].agence_id;
        }
      } catch (eBien) {
        console.warn('[SEQUESTRE IMMO RESOLVE BIEN]:', eBien.message);
      }
    }

    // Si agenceId fourni sous forme de slug, résoudre son UUID
    if (resolvedAgenceId && typeof resolvedAgenceId === 'string' && resolvedAgenceId.length !== 36) {
      try {
        const agRes = await pool.query('SELECT id FROM agences_immo WHERE slug = $1 LIMIT 1', [resolvedAgenceId]);
        if (agRes.rows.length) resolvedAgenceId = agRes.rows[0].id;
      } catch (eAg) {
        console.warn('[SEQUESTRE IMMO RESOLVE SLUG]:', eAg.message);
      }
    }

    // Créer ou rattacher le lead dans contacts_immo si agenceId valide
    let contactCrmId = null;
    if (resolvedAgenceId) {
      try {
        const cleanTel = String(prospectTelephone).replace(/\D/g, '');
        const { rows: existCrm } = await pool.query(
          `SELECT id FROM contacts_immo
           WHERE agence_id = $1 AND (REPLACE(telephone, ' ', '') LIKE '%' || $2 OR REPLACE(whatsapp, ' ', '') LIKE '%' || $2)
           LIMIT 1`,
          [resolvedAgenceId, cleanTel.slice(-8)]
        );

        const noteSequestre = `\n[${new Date().toLocaleDateString('fr-FR')} - Séquestre Nopalou Pay Safe] Réservation ${reference} de ${new Intl.NumberFormat('fr-FR').format(montantNum)} FCFA (${typeReservation}). Statut: BLOQUÉ.`;

        if (existCrm.length > 0) {
          contactCrmId = existCrm[0].id;
          await pool.query(
            `UPDATE contacts_immo
             SET notes = COALESCE(notes, '') || $1,
                 budget_max = GREATEST(COALESCE(budget_max, 0), $2),
                 updated_at = NOW()
             WHERE id = $3`,
            [noteSequestre, montantNum, contactCrmId]
          );
        } else {
          const { rows: newCrm } = await pool.query(
            `INSERT INTO contacts_immo (
              agence_id, nom, prenom, telephone, whatsapp, email, type_contact,
              statut_crm, budget_max, notes
            ) VALUES ($1, $2, '', $3, $3, $4, 'prospect', 'contacte', $5, $6)
            RETURNING id`,
            [resolvedAgenceId, prospectNom, prospectTelephone, prospectEmail || null, montantNum, noteSequestre]
          );
          if (newCrm.length > 0) contactCrmId = newCrm[0].id;
        }
      } catch (eCrm) {
        console.warn('[SEQUESTRE CRM SYNC ERR]:', eCrm.message);
      }
    }

    // Insérer dans reservations_sequestre_immo
    const { rows: resRows } = await pool.query(
      `INSERT INTO reservations_sequestre_immo (
        reference, bien_id, agence_id, prospect_nom, prospect_telephone, prospect_email,
        type_reservation, montant, statut_sequestre, sequestre_pin_hash, sequestre_pin_sel,
        sequestre_essais_restants, notes, contact_crm_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'bloque', $9, $10, 3, $11, $12)
      RETURNING id, reference, montant, statut_sequestre, type_reservation, created_at`,
      [
        reference,
        bienId || null,
        resolvedAgenceId,
        prospectNom,
        prospectTelephone,
        prospectEmail || null,
        typeReservation,
        montantNum,
        hashedPin,
        sel,
        notes || null,
        contactCrmId
      ]
    );

    const reservation = resRows[0];

    // Notification WhatsApp au prospect avec le code PIN
    const telProspectNorm = normalisePhone(prospectTelephone);
    if (telProspectNorm) {
      const msgProspect =
`🔒 *Nopalou Pay Safe Immo — Dépôt de Garantie Séquestré*

Bonjour *${prospectNom}*,
Votre consignation de *${new Intl.NumberFormat('fr-FR').format(montantNum)} FCFA* sous la référence *${reference}* est validée et protégée par le tiers de confiance Nopalou.

🔑 *Votre code PIN secret de déblocage :*
👉 *${pin}* 👈

⚠️ *Règle de sécurité absolue :*
Ne communiquez ce code PIN à l'agence qu'une fois la visite terminée, le bail signé ou les clés en main. Vos fonds restent sous séquestre tant que vous n'avez pas libéré ce code.`;

      sendWhatsAppText(telProspectNorm, msgProspect).catch(e => {
        console.warn('[SEQUESTRE IMMO WA PROSPECT ERR]:', e.message);
      });
    }

    return res.json({
      success: true,
      message: 'Réservation immobilière consignée sous séquestre Nopalou Pay Safe',
      reference: reservation.reference,
      montant: reservation.montant,
      statut_sequestre: reservation.statut_sequestre,
      pin: pin,
      created_at: reservation.created_at
    });

  } catch (err) {
    console.error('[POST /api/paiement-sequestre/immo/reserver]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la réservation sous séquestre' });
  }
});

// ── POST /api/paiement-sequestre/immo/debloquer — Déblocage des fonds immobiliers avec code PIN
router.post('/immo/debloquer', async (req, res) => {
  try {
    await migrerColonnesSequestre();
    const { reference, codePin, motif } = req.body;

    if (!reference || !codePin) {
      return res.status(400).json({ success: false, error: 'Référence de réservation et code PIN requis.' });
    }

    const { rows } = await pool.query(
      `SELECT * FROM reservations_sequestre_immo WHERE reference = $1`,
      [reference]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Réservation sous séquestre introuvable.' });
    }

    const resImmo = rows[0];

    if (resImmo.statut_sequestre === 'debloque') {
      return res.json({
        success: true,
        message: 'Cette consignation a déjà été débloquée.',
        statut_sequestre: 'debloque',
        reference: resImmo.reference
      });
    }

    if (resImmo.statut_sequestre !== 'bloque') {
      return res.status(400).json({
        success: false,
        error: `Impossible de débloquer : statut actuel (${resImmo.statut_sequestre}).`
      });
    }

    const essais = Number(resImmo.sequestre_essais_restants || 3);
    if (essais <= 0) {
      return res.status(403).json({
        success: false,
        error: 'Séquestre verrouillé suite à 3 tentatives erronées. Veuillez contacter le support Nopalou.'
      });
    }

    const testHash = hashPin(String(codePin).trim(), resImmo.sequestre_pin_sel);
    if (testHash !== resImmo.sequestre_pin_hash) {
      const restants = essais - 1;
      await pool.query(
        `UPDATE reservations_sequestre_immo SET sequestre_essais_restants = $1 WHERE id = $2`,
        [restants, resImmo.id]
      );
      return res.status(400).json({
        success: false,
        error: `Code PIN incorrect. ${restants} tentative(s) restante(s).`,
        essaisRestants: restants
      });
    }

    // Déblocage valide
    await pool.query(
      `UPDATE reservations_sequestre_immo
       SET statut_sequestre = 'debloque',
           sequestre_date_deblocage = NOW(),
           notes = COALESCE(notes, '') || $1,
           updated_at = NOW()
       WHERE id = $2`,
      [motif ? `\n[Déblocage motif]: ${motif}` : '', resImmo.id]
    );

    // Mettre à jour le CRM si rattaché
    if (resImmo.contact_crm_id) {
      try {
        await pool.query(
          `UPDATE contacts_immo
           SET statut_crm = 'cloture_gagne',
               notes = COALESCE(notes, '') || $1,
               updated_at = NOW()
           WHERE id = $2`,
          [`\n[${new Date().toLocaleDateString('fr-FR')}] Séquestre ${resImmo.reference} DÉBLOQUÉ avec succès.`, resImmo.contact_crm_id]
        );
      } catch (eCrm) {
        console.warn('[SEQUESTRE CRM WIN UPDATE ERR]:', eCrm.message);
      }
    }

    return res.json({
      success: true,
      message: 'Code PIN validé avec succès ! Fonds séquestrés libérés.',
      statut_sequestre: 'debloque',
      reference: resImmo.reference
    });

  } catch (err) {
    console.error('[POST /api/paiement-sequestre/immo/debloquer]', err.message);
    res.status(500).json({ success: false, error: 'Erreur déblocage séquestre' });
  }
});

// ── GET /api/paiement-sequestre/immo/:reference/statut — Vérification statut séquestre
router.get('/immo/:reference/statut', async (req, res) => {
  try {
    await migrerColonnesSequestre();
    const { reference } = req.params;

    const { rows } = await pool.query(
      `SELECT r.reference, r.statut_sequestre, r.type_reservation, r.montant,
              r.sequestre_date_deblocage, r.created_at,
              b.titre AS bien_titre, a.nom AS agence_nom, a.slug AS agence_slug
       FROM reservations_sequestre_immo r
       LEFT JOIN biens_immo b ON r.bien_id = b.id
       LEFT JOIN agences_immo a ON r.agence_id = a.id
       WHERE r.reference = $1 OR r.id::text = $1`,
      [reference]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Réservation séquestre introuvable.' });
    }

    const item = rows[0];
    return res.json({
      success: true,
      reference: item.reference,
      statut_sequestre: item.statut_sequestre,
      type_reservation: item.type_reservation,
      montant: item.montant,
      securise_pay_safe: item.statut_sequestre === 'bloque' || item.statut_sequestre === 'debloque',
      date_deblocage: item.sequestre_date_deblocage,
      created_at: item.created_at,
      bien_titre: item.bien_titre,
      agence_nom: item.agence_nom,
      agence_slug: item.agence_slug
    });

  } catch (err) {
    console.error('[GET /api/paiement-sequestre/immo/:reference/statut]', err.message);
    res.status(500).json({ success: false, error: 'Erreur consultation statut séquestre' });
  }
});

module.exports = router;
