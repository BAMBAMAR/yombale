const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { validerCreditToken } = require('../lib/creditPaymentToken');
const wave = require('../services/wave');
const { sendWhatsAppNotification, sendWhatsAppText } = require('../services/whatsapp');

// ── GET /api/public-credit/:token — Détails de la créance pour la page de paiement public
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const auth = validerCreditToken(token);
    if (!auth.valide) {
      return res.status(400).json({ success: false, error: auth.error || 'Lien invalide ou expiré.' });
    }

    const { clientId, boutiqueId } = auth;

    // 1. Récupérer le client
    const clientRes = await pool.query(
      `SELECT id, nom, telephone, adresse, solde, created_at 
       FROM caisse_clients_credits 
       WHERE id = $1 AND boutique_id = $2`,
      [clientId, boutiqueId]
    );

    if (!clientRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'Dossier client introuvable.' });
    }

    const client = clientRes.rows[0];

    // 2. Récupérer la boutique
    const bqRes = await pool.query(
      `SELECT id, nom, slug, telephone, whatsapp, logo_url, adresse, ville 
       FROM boutiques 
       WHERE id = $1`,
      [boutiqueId]
    );

    if (!bqRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'Boutique introuvable.' });
    }

    const boutique = bqRes.rows[0];

    // 3. Récupérer les échéances éventuelles en cours
    let echeances = [];
    try {
      const echRes = await pool.query(
        `SELECT id, date_echeance, montant_prevu, montant_paye, montant_restant, statut, numero_echeance
         FROM caisse_credit_echeances
         WHERE client_id = $1 AND boutique_id = $2 AND statut NOT IN ('payee', 'annulee', 'soldee_par_anticipation')
         ORDER BY date_echeance ASC`,
        [clientId, boutiqueId]
      );
      echeances = echRes.rows;
    } catch (_) {
      // Table echeances optionnelle selon les plans
    }

    // 4. Dernières transactions pour transparence
    let dernieresOperations = [];
    try {
      const opsRes = await pool.query(
        `SELECT id, type, montant, mode_paiement, note, created_at
         FROM caisse_credit_historique
         WHERE client_id = $1 AND boutique_id = $2
         ORDER BY created_at DESC
         LIMIT 5`,
        [clientId, boutiqueId]
      );
      dernieresOperations = opsRes.rows;
    } catch (_) {}

    return res.json({
      success: true,
      client: {
        id: client.id,
        nom: client.nom,
        telephone: client.telephone,
        solde: Number(client.solde || 0)
      },
      boutique: {
        id: boutique.id,
        nom: boutique.nom,
        slug: boutique.slug,
        telephone: boutique.whatsapp || boutique.telephone,
        adresse: boutique.adresse,
        ville: boutique.ville,
        logo_url: boutique.logo_url
      },
      echeances,
      dernieresOperations
    });
  } catch (err) {
    console.error('[PUBLIC CREDIT GET ERR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération du dossier de crédit.' });
  }
});

// ── POST /api/public-credit/:token/initier-wave — Initier une session Wave Checkout
router.post('/:token/initier-wave', async (req, res) => {
  try {
    const { token } = req.params;
    const auth = validerCreditToken(token);
    if (!auth.valide) {
      return res.status(400).json({ success: false, error: auth.error || 'Lien invalide.' });
    }

    const { clientId, boutiqueId } = auth;
    const { montant } = req.body;
    const numMontant = Math.round(Number(montant));

    if (!numMontant || numMontant <= 0) {
      return res.status(400).json({ success: false, error: 'Montant invalide.' });
    }

    const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
    const clientRef = `CREDIT_REGLEMENT_${clientId.slice(0, 8)}_${Date.now()}`;

    try {
      const session = await wave.createCheckoutSession({
        amount: numMontant,
        currency: 'XOF',
        client_reference: clientRef,
        success_url: `${SITE}/payer-credit/${token}?paiement_succes=1&montant=${numMontant}&ref=${clientRef}`,
        error_url: `${SITE}/payer-credit/${token}?paiement_erreur=1`,
      });

      return res.json({
        success: true,
        wave_url: session.wave_url,
        session_id: session.session_id,
        client_reference: clientRef
      });
    } catch (waveErr) {
      console.warn('[WAVE CHECKOUT NOT AVAILABLE FOR CREDIT]:', waveErr.message);
      // Fallback si la clé API Wave directe n'est pas activée en sandbox
      return res.json({
        success: true,
        simulation: true,
        client_reference: clientRef,
        message: 'Passerelle Wave prête pour validation manuelle ou simulation.'
      });
    }
  } catch (err) {
    console.error('[INITIER WAVE CREDIT ERR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de l’initialisation du paiement Wave.' });
  }
});

// ── POST /api/public-credit/:token/confirmer — Enregistrer le règlement après paiement
router.post('/:token/confirmer', async (req, res) => {
  const dbClient = await pool.connect();
  try {
    const { token } = req.params;
    const auth = validerCreditToken(token);
    if (!auth.valide) {
      return res.status(400).json({ success: false, error: auth.error || 'Lien invalide.' });
    }

    const { clientId, boutiqueId } = auth;
    const { montant, mode_paiement = 'wave', reference_transaction, note_client } = req.body;
    const numMontant = Math.round(Number(montant));

    if (!numMontant || numMontant <= 0) {
      return res.status(400).json({ success: false, error: 'Montant invalide.' });
    }

    await dbClient.query('BEGIN');

    // 1. Verrouiller le client pour éviter les double-déductions
    const cRes = await dbClient.query(
      `SELECT * FROM caisse_clients_credits WHERE id = $1 AND boutique_id = $2 FOR UPDATE`,
      [clientId, boutiqueId]
    );

    if (!cRes.rows[0]) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Client introuvable.' });
    }

    const client = cRes.rows[0];
    const soldeActuel = Number(client.solde || 0);
    const nouveauSolde = Math.max(0, soldeActuel - numMontant);

    // 2. Mettre à jour le solde
    await dbClient.query(
      `UPDATE caisse_clients_credits SET solde = $1, updated_at = NOW() WHERE id = $2`,
      [nouveauSolde, clientId]
    );

    // 3. Imputer sur les échéances éventuelles (FIFO)
    try {
      const { rows: echeances } = await dbClient.query(
        `SELECT * FROM caisse_credit_echeances 
         WHERE boutique_id = $1 AND client_id = $2 AND statut NOT IN ('payee', 'annulee', 'soldee_par_anticipation')
         ORDER BY date_echeance ASC FOR UPDATE`,
        [boutiqueId, clientId]
      );

      let montantRestantAImputer = numMontant;
      for (const ech of echeances) {
        if (montantRestantAImputer <= 0) break;
        const due = Number(ech.montant_restant || ech.montant_prevu || 0);
        const dejaPaye = Number(ech.montant_paye || 0);
        const montantAPayerSurEch = Math.min(due, montantRestantAImputer);
        const nouveauPaye = dejaPaye + montantAPayerSurEch;
        const nouveauRestant = due - montantAPayerSurEch;
        const statut = nouveauRestant <= 0 ? 'payee' : 'en_cours';

        await dbClient.query(
          `UPDATE caisse_credit_echeances 
           SET montant_paye = $1, montant_restant = $2, statut = $3, 
               date_paiement_complet = CASE WHEN $3 = 'payee' THEN NOW() ELSE NULL END, 
               updated_at = NOW()
           WHERE id = $4`,
          [nouveauPaye, nouveauRestant, statut, ech.id]
        );

        montantRestantAImputer -= montantAPayerSurEch;
      }
    } catch (_) {}

    // 4. Enregistrer dans caisse_credit_historique
    const histRes = await dbClient.query(
      `INSERT INTO caisse_credit_historique (
        client_id, boutique_id, type, montant, mode_paiement, note, reference, created_at
      ) VALUES ($1, $2, 'remboursement', $3, $4, $5, $6, NOW()) RETURNING *`,
      [
        clientId,
        boutiqueId,
        numMontant,
        mode_paiement,
        note_client || 'Règlement en ligne sécurisé 1-clic',
        reference_transaction || `WEB_PAY_${Date.now()}`
      ]
    );

    await dbClient.query('COMMIT');

    // 5. Récupérer infos boutique pour notifications WhatsApp
    const bqRes = await pool.query(
      `SELECT nom, telephone, whatsapp FROM boutiques WHERE id = $1`,
      [boutiqueId]
    );
    const bq = bqRes.rows[0];

    const montantFmt = numMontant.toLocaleString('fr-FR');
    const nouveauSoldeFmt = nouveauSolde.toLocaleString('fr-FR');

    // Notification WhatsApp au Marchand
    const telMarchand = bq?.whatsapp || bq?.telephone;
    if (telMarchand) {
      const msgMarchand = 
        `🟢 *RÈGLEMENT DE CRÉANCE ENCAISSÉ — NOPALOU*\n\n` +
        `🏪 *${bq?.nom || 'Votre boutique'}*\n` +
        `👤 Client : *${client.nom}* (${client.telephone})\n` +
        `💰 Montant réglé : *${montantFmt} FCFA* (${mode_paiement.toUpperCase()})\n` +
        `📊 *Nouveau solde restant du client : ${nouveauSoldeFmt} FCFA*\n\n` +
        `Le montant a été déduit de votre carnet de dettes automatiquement.`;

      sendWhatsAppText(telMarchand, msgMarchand).catch(e => console.warn('[NOTIF MARCHAND REGLEMENT WA ERR]:', e.message));
    }

    // Confirmation WhatsApp au Client Débiteur
    if (client.telephone) {
      const msgClient = 
        `💚 *REÇU DE RÈGLEMENT — ${bq?.nom || 'NOPALOU'}*\n\n` +
        `Bonjour *${client.nom}*,\n` +
        `Nous confirmons la bonne réception de votre règlement de *${montantFmt} FCFA* (${mode_paiement.toUpperCase()}).\n\n` +
        `📊 *Votre solde impayé est désormais de : ${nouveauSoldeFmt} FCFA*.\n\n` +
        `Merci pour votre confiance ! 🤝`;

      sendWhatsAppText(client.telephone, msgClient).catch(e => console.warn('[NOTIF CLIENT REGLEMENT WA ERR]:', e.message));
    }

    return res.json({
      success: true,
      nouveau_solde: nouveauSolde,
      montant_paye: numMontant,
      transaction: histRes.rows[0]
    });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error('[CONFIRMER REGLEMENT CREDIT ERR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de la confirmation du règlement.' });
  } finally {
    dbClient.release();
  }
});

module.exports = router;
