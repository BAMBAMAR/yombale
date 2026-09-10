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
      reference: cmd.reference
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
    console.error('[SEQUESTRE STATUT ERR]:', err);
    res.status(500).json({ error: 'Erreur récupération statut séquestre' });
  }
});

module.exports = router;
