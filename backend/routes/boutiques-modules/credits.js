// backend/routes/boutiques-modules/credits.js
// Carnet de dettes & crédits clients (Boutique)
const router = require('express').Router();
const { param } = require('express-validator');
const { pool } = require('../../models/db');
const { verifierToken } = require('../../middlewares/auth');
const { checkBoutiqueAccess } = require('../../middlewares/tenantSecurity');

// ── GET /api/boutiques/:id/credits-clients — Liste des clients avec carnet de dettes/avances
router.get('/:id/credits-clients', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const b = await checkBoutiqueAccess(id, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé au carnet de dettes de cette boutique' });
    }

    const includeHistorique = req.query.include_historique === 'true' || req.query.include_historique === '1';
    const boutiqueId = b.id;
    const { rows: clients } = await pool.query(
      `SELECT * FROM caisse_clients_credits WHERE boutique_id=$1 ORDER BY nom ASC`,
      [boutiqueId]
    );

    if (includeHistorique && clients.length > 0) {
      const { rows: historiqueRows } = await pool.query(
        `SELECT * FROM caisse_credit_historique WHERE boutique_id=$1 ORDER BY created_at DESC`,
        [boutiqueId]
      );
      
      const histMap = new Map();
      historiqueRows.forEach(h => {
        if (!histMap.has(h.client_id)) histMap.set(h.client_id, []);
        histMap.get(h.client_id).push(h);
      });

      clients.forEach(c => {
        c.historique = histMap.get(c.id) || [];
      });
    }

    res.json({ success: true, clients });
  } catch (err) {
    console.error('[CREDITS CLIENTS GET]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/boutiques/:id/credits-clients/:clientId/historique — Historique détaillé d'un client
router.get('/:id/credits-clients/:clientId/historique', verifierToken, async (req, res) => {
  try {
    const { id, clientId } = req.params;
    const b = await checkBoutiqueAccess(id, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé à l\'historique de ce débiteur' });
    }

    const { rows } = await pool.query(
      `SELECT * FROM caisse_credit_historique WHERE client_id=$1 AND boutique_id=$2 ORDER BY created_at DESC`,
      [clientId, b.id]
    );

    res.json({ success: true, historique: rows });
  } catch (err) {
    console.error('[CREDITS HISTORIQUE GET]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/credits-clients — Créer un nouveau profil client carnet
router.post('/:id/credits-clients', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const b = await checkBoutiqueAccess(id, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé pour ajouter un débiteur à cette boutique' });
    }

    const { nom, telephone, adresse, plafond_max, note_client } = req.body;
    if (!nom?.trim() || !telephone?.trim()) {
      return res.status(400).json({ error: 'Nom et téléphone du client requis' });
    }

    const r = await pool.query(
      `INSERT INTO caisse_clients_credits (boutique_id, nom, telephone, adresse, plafond_max, note_client, solde)
       VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *`,
      [b.id, nom.trim(), telephone.trim(), adresse?.trim() || null, Number(plafond_max || 200000), note_client?.trim() || null]
    );

    res.status(201).json({ success: true, client: r.rows[0] });
  } catch (err) {
    console.error('[CREDITS CLIENTS POST]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/credits-clients/batch — Import groupé de clients / carnet dettes (Migration)
router.post('/:id/credits-clients/batch', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const { id } = req.params;
    const own = await pool.query('SELECT id FROM boutiques WHERE id=$1 AND utilisateur_id=$2', [id, req.user.userId]);
    if (!own.rows[0]) return res.status(403).json({ error: 'Accès refusé' });

    const { clients } = req.body;
    if (!Array.isArray(clients) || clients.length === 0) {
      return res.status(400).json({ error: 'La liste des clients à importer est vide' });
    }
    if (clients.length > 500) {
      return res.status(400).json({ error: 'La limite est de 500 clients par lot' });
    }

    const dbClient = await pool.connect();
    try {
      await dbClient.query('BEGIN');
      const inseres = [];

      for (const c of clients) {
        if (!c.nom?.trim()) continue;
        const tel = c.telephone?.trim() || 'Non renseigné';
        const soldeInitial = Number(c.solde) || 0;
        const plafond = Number(c.plafond_max) || 200000;

        const r = await dbClient.query(
          `INSERT INTO caisse_clients_credits (boutique_id, nom, telephone, adresse, plafond_max, note_client, solde)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [id, c.nom.trim(), tel, c.adresse?.trim() || null, plafond, c.note_client?.trim() || 'Import migration', soldeInitial]
        );

        const newClient = r.rows[0];
        inseres.push(newClient);

        if (soldeInitial > 0) {
          await dbClient.query(
            `INSERT INTO caisse_credit_historique (client_id, boutique_id, type, montant, mode_paiement, note)
             VALUES ($1, $2, 'vente_credit', $3, 'carnet_initial', 'Report solde initial / Migration')`,
            [newClient.id, id, soldeInitial]
          );
        } else if (soldeInitial < 0) {
          await dbClient.query(
            `INSERT INTO caisse_credit_historique (client_id, boutique_id, type, montant, mode_paiement, note)
             VALUES ($1, $2, 'depot_avance', $3, 'carnet_initial', 'Report avance initiale / Migration')`,
            [newClient.id, id, Math.abs(soldeInitial)]
          );
        }
      }

      await dbClient.query('COMMIT');
      res.status(201).json({ success: true, count: inseres.length, clients: inseres });
    } catch (e) {
      await dbClient.query('ROLLBACK');
      throw e;
    } finally {
      dbClient.release();
    }
  } catch (err) {
    console.error('[CREDITS CLIENTS BATCH ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l’importation des clients' });
  }
});

// ── PUT /api/boutiques/:id/credits-clients/:clientId — Modifier un profil client
router.put('/:id/credits-clients/:clientId', verifierToken, async (req, res) => {
  try {
    const { id, clientId } = req.params;
    const b = await checkBoutiqueAccess(id, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé pour modifier ce débiteur' });
    }

    const { nom, telephone, adresse, plafond_max, note_client } = req.body;
    if (!nom || !telephone) {
      return res.status(400).json({ error: 'Nom et téléphone requis' });
    }

    const r = await pool.query(
      `UPDATE caisse_clients_credits 
       SET nom = $1, telephone = $2, adresse = $3, plafond_max = $4, note_client = $5
       WHERE id = $6 AND boutique_id = $7
       RETURNING *`,
      [nom.trim(), telephone.trim(), adresse?.trim() || null, Number(plafond_max || 200000), note_client?.trim() || null, clientId, b.id]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ error: 'Client introuvable' });
    }

    res.json({ success: true, client: r.rows[0] });
  } catch (err) {
    console.error('[CREDITS CLIENTS PUT]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PATCH /api/boutiques/:id/credits-clients/:clientId/statut — Blacklister/Changer statut d'un client (actif, bloque)
router.patch('/:id/credits-clients/:clientId/statut', verifierToken, async (req, res) => {
  try {
    const { id, clientId } = req.params;
    const b = await checkBoutiqueAccess(id, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé pour modifier le statut de ce débiteur' });
    }

    const { statut } = req.body;
    if (!['actif', 'bloque', 'archive'].includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide (actif, bloque, archive)' });
    }

    const r = await pool.query(
      `UPDATE caisse_clients_credits 
       SET statut = $1, updated_at = NOW()
       WHERE id = $2 AND boutique_id = $3
       RETURNING *`,
      [statut, clientId, b.id]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ error: 'Client introuvable' });
    }

    res.json({ success: true, client: r.rows[0], message: statut === 'bloque' ? 'Client blacklisté' : 'Client réactivé' });
  } catch (err) {
    console.error('[CREDITS CLIENTS STATUT]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── DELETE /api/boutiques/:id/credits-clients/:clientId — Supprimer un client du carnet
router.delete('/:id/credits-clients/:clientId', verifierToken, async (req, res) => {
  try {
    const { id, clientId } = req.params;
    const b = await checkBoutiqueAccess(id, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé pour supprimer ce débiteur' });
    }

    await pool.query(
      `DELETE FROM caisse_credit_historique WHERE client_id = $1 AND boutique_id = $2`,
      [clientId, b.id]
    ).catch(() => {});

    const r = await pool.query(
      `DELETE FROM caisse_clients_credits WHERE id = $1 AND boutique_id = $2 RETURNING *`,
      [clientId, b.id]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ error: 'Client introuvable' });
    }

    res.json({ success: true, message: 'Client supprimé du carnet avec succès' });
  } catch (err) {
    console.error('[CREDITS CLIENTS DELETE]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Auto-migration de sécurité : reference sur caisse_credit_historique
let _creditRefMigrated = false;
async function ensureCreditRefCol() {
  if (_creditRefMigrated) return;
  try {
    await pool.query(`ALTER TABLE caisse_credit_historique ADD COLUMN IF NOT EXISTS reference VARCHAR(128)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_credit_hist_ref ON caisse_credit_historique(boutique_id, reference)`);
    _creditRefMigrated = true;
  } catch {
    _creditRefMigrated = true;
  }
}

// ── POST /api/boutiques/:id/credits-clients/:clientId/transaction — Vente à crédit / Remboursement / Dépôt d'avance
router.post('/:id/credits-clients/:clientId/transaction', verifierToken, async (req, res) => {
  try {
    await ensureCreditRefCol();
    const { id, clientId } = req.params;
    const b = await checkBoutiqueAccess(id, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé pour enregistrer des transactions financières sur cette boutique' });
    }

    const { type, montant, mode_paiement, note, produits, date_echeance, relance_auto_whatsapp, idempotency_key } = req.body;
    const numMontant = Number(montant);
    if (!type || !numMontant || numMontant <= 0) {
      return res.status(400).json({ error: 'Type de transaction et montant valide (> 0) requis' });
    }

    const bqId = b.id;
    const bq = b;
    const idempotencyKey = typeof idempotency_key === 'string' && idempotency_key.length > 0 && idempotency_key.length <= 128
      ? idempotency_key
      : null;

    if (idempotencyKey) {
      const existingTx = await pool.query(
        `SELECT id, montant, type FROM caisse_credit_historique WHERE boutique_id = $1 AND reference = $2 LIMIT 1`,
        [bqId, idempotencyKey]
      );
      if (existingTx.rows[0]) {
        return res.json({ success: true, duplicate: true, transaction: existingTx.rows[0] });
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const c = await client.query('SELECT * FROM caisse_clients_credits WHERE id=$1 AND boutique_id=$2 FOR UPDATE', [clientId, bqId]);
      if (!c.rows[0]) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Client introuvable' });
      }

      let deltaSolde = 0;
      if (type === 'vente_credit') {
        deltaSolde = numMontant;
      } else if (type === 'remboursement' || type === 'depot_avance') {
        deltaSolde = -numMontant;
      }

      const nouveauSolde = Number(c.rows[0].solde) + deltaSolde;

      if (type === 'vente_credit' && nouveauSolde > Number(c.rows[0].plafond_max)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Plafond de crédit dépassé (${c.rows[0].plafond_max} FCFA max)` });
      }

      await client.query('UPDATE caisse_clients_credits SET solde=$1 WHERE id=$2', [nouveauSolde, clientId]);

      const autoRelance = relance_auto_whatsapp !== false;
      const hist = await client.query(
        `INSERT INTO caisse_credit_historique (client_id, boutique_id, type, montant, mode_paiement, note, produits, date_echeance, relance_auto_whatsapp, reference)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [clientId, bqId, type, numMontant, mode_paiement || 'credit', note || null, JSON.stringify(produits || []), date_echeance || null, autoRelance, idempotencyKey]
      );

      if (type === 'vente_credit') {
        const clientNom = c.rows[0].nom || 'Client Carnet';
        const clientTel = c.rows[0].telephone || null;
        const refCredit = idempotencyKey || `CR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        if (Array.isArray(produits) && produits.length > 0) {
          for (let idx = 0; idx < produits.length; idx++) {
            const item = produits[idx];
            const qte = Number(item.quantite || 1);
            const pId = item.id;
            let pRes = null;

            if (pId && /^[0-9a-f-]{36}$/i.test(String(pId))) {
              pRes = await client.query(
                `UPDATE boutique_produits
                 SET stock_quantite = GREATEST(0, COALESCE(stock_quantite, 10) - $1),
                     en_stock = (GREATEST(0, COALESCE(stock_quantite, 10) - $1) > 0)
                 WHERE id = $2 AND boutique_id = $3
                 RETURNING id, nom, prix`,
                [qte, pId, bqId]
              );
            } else if (item.nom) {
              pRes = await client.query(
                `UPDATE boutique_produits
                 SET stock_quantite = GREATEST(0, COALESCE(stock_quantite, 10) - $1),
                     en_stock = (GREATEST(0, COALESCE(stock_quantite, 10) - $1) > 0)
                 WHERE LOWER(nom) = LOWER($2) AND boutique_id = $3
                 RETURNING id, nom, prix`,
                [qte, item.nom.trim(), bqId]
              );
            }

            const itemNom = item.nom || pRes?.rows[0]?.nom || 'Article Crédit';
            const itemPrix = Number(item.prix || pRes?.rows[0]?.prix || 0);
            const totalLigne = itemPrix * qte;
            const itemRef = produits.length > 1 ? `${refCredit}-${idx + 1}` : refCredit;

            await client.query(
              `INSERT INTO ventes (reference, boutique_id, produit_id, nom_produit, quantite, prix_unitaire, frais_livraison, montant_total, client_nom, client_telephone, methode_paiement, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $9, 'credit', NOW())
               ON CONFLICT (reference) DO NOTHING`,
              [itemRef, bqId, pRes?.rows[0]?.id || null, itemNom, qte, itemPrix, totalLigne, clientNom, clientTel]
            );
          }
        } else {
          await client.query(
            `INSERT INTO ventes (reference, boutique_id, nom_produit, quantite, prix_unitaire, frais_livraison, montant_total, client_nom, client_telephone, methode_paiement, created_at)
             VALUES ($1, $2, $3, 1, $4, 0, $4, $5, $6, 'credit', NOW())
             ON CONFLICT (reference) DO NOTHING`,
            [refCredit, bqId, note || 'Vente à crédit (Carnet)', numMontant, clientNom, clientTel]
          );
        }
      }

      await client.query('COMMIT');

      const clientTelNum = c.rows[0].telephone;
      if (clientTelNum) {
        try {
          const { sendWhatsAppNotification } = require('../../services/whatsapp');
          const montantFmt = new Intl.NumberFormat('fr-FR').format(numMontant);
          const soldeFmt = new Intl.NumberFormat('fr-FR').format(nouveauSolde);
          const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
          const nomClient = c.rows[0].nom || 'Client';

          let msgNotif = '';
          let titleTpl = '';
          if (type === 'vente_credit') {
            msgNotif = `💳 *Achat à crédit enregistré — ${bq.nom}*\n\n` +
              `Bonjour *${nomClient}*, un achat à crédit de *${montantFmt} FCFA* a été inscrit dans votre Carnet client.\n\n` +
              `📊 *Votre solde total dû est de : ${soldeFmt} FCFA*.\n\n` +
              `Merci de votre confiance !`;
            titleTpl = `💳 Achat à crédit — ${bq.nom}`;
          } else if (type === 'remboursement' || type === 'depot_avance') {
            msgNotif = `💚 *Règlement enregistré — ${bq.nom}*\n\n` +
              `Bonjour *${nomClient}*, nous confirmons la réception de votre règlement de *${montantFmt} FCFA*.\n\n` +
              `📊 *Votre solde carnet restant est de : ${soldeFmt} FCFA*.\n\n` +
              `Merci pour votre paiement !`;
            titleTpl = `💚 Règlement reçu — ${bq.nom}`;
          }

          if (msgNotif) {
            sendWhatsAppNotification(clientTelNum, {
              textMessage: msgNotif,
              title: titleTpl.slice(0, 60),
              detail: `Montant : ${montantFmt} FCFA. Solde carnet : ${soldeFmt} FCFA.`,
              url: `${SITE}/boutiques/${bq.slug || bq.id}`,
              buttonParam: bq.slug || bq.id,
            })
              .then(() => console.log(`[WHATSAPP CREDIT TRANSACTION SUCCESS] Notif envoyée à ${clientTelNum}`))
              .catch(err => console.error('[WHATSAPP CREDIT TRANSACTION ERR]:', err.message));
          }
        } catch (eWs) {
          console.error('[WHATSAPP TRANSACTION NOTIF ERR]:', eWs.message);
        }
      }

      res.json({ success: true, nouveauSolde, transaction: hist.rows[0] });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[CREDITS TRANSACTION POST]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/credits-clients/:clientId/relance-whatsapp — Déclencher une relance WhatsApp
router.post('/:id/credits-clients/:clientId/relance-whatsapp', verifierToken, async (req, res) => {
  try {
    const { id, clientId } = req.params;
    const bq = await checkBoutiqueAccess(id, req.user.userId);
    if (!bq && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé pour déclencher des relances sur cette boutique' });
    }

    const clientRes = await pool.query(`SELECT * FROM caisse_clients_credits WHERE id=$1 AND boutique_id=$2`, [clientId, bq.id]);
    if (!clientRes.rows[0]) return res.status(404).json({ error: 'Client introuvable' });
    const c = clientRes.rows[0];

    const soldeNum = Number(c.solde);
    if (soldeNum <= 0) {
      return res.status(400).json({ error: 'Le solde du client n’est pas débiteur.' });
    }

    const messageRelance = `Bonjour ${c.nom},\n\nUn rappel amical de *${bq.nom}* : Votre solde du carnet s'élève actuellement à *${soldeNum.toLocaleString('fr-FR')} FCFA*.\nMerci de bien vouloir régulariser ce montant dès que possible.\n\nContacts boutique: ${bq.whatsapp || bq.telephone || ''}`;

    try {
      const whatsappService = require('../../services/whatsapp');
      if (whatsappService && typeof whatsappService.sendWhatsAppNotification === 'function') {
        const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
        await whatsappService.sendWhatsAppNotification(c.telephone, {
          textMessage: messageRelance,
          title: `💳 Rappel de solde — ${bq.nom}`,
          detail: `Solde carnet débiteur : ${soldeNum.toLocaleString('fr-FR')} FCFA. Merci de bien vouloir régulariser auprès de ${bq.nom}.`,
          url: `${SITE}/boutiques/${bq.slug || bq.id}`,
          buttonParam: bq.slug || bq.id,
        });
      } else if (whatsappService && typeof whatsappService.sendWhatsAppText === 'function') {
        await whatsappService.sendWhatsAppText(c.telephone, messageRelance);
      }
    } catch (wsErr) {
      console.warn('[RELANCE WHATSAPP API FAIL] Fallback lien web:', wsErr.message);
    }

    await pool.query(
      `UPDATE caisse_credit_historique SET derniere_relance_whatsapp=NOW() WHERE client_id=$1 AND boutique_id=$2`,
      [clientId, bq.id]
    );

    const telNorm = c.telephone.replace(/[^0-9]/g, '');
    const lienWhatsapp = `https://wa.me/${telNorm}?text=${encodeURIComponent(messageRelance)}`;

    res.json({ success: true, message: 'Relance préparée avec succès', lienWhatsapp, texteMessage: messageRelance });
  } catch (err) {
    console.error('[CREDITS RELANCE WHATSAPP POST]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/credits-clients/relances-echeances — Déclencher les relances automatiques échues de cette boutique
router.post('/:id/credits-clients/relances-echeances', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const bq = await checkBoutiqueAccess(id, req.user.userId);
    if (!bq && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé aux relances automatiques de cette boutique' });
    }

    const { traiterRelancesAutomatiquesWhatsApp } = require('../../services/cron-relances-carnet');
    const result = await traiterRelancesAutomatiquesWhatsApp(bq.id);

    res.json({
      success: true,
      message: `${result.relancesEnvoyees || 0} relance(s) automatique(s) envoyée(s) pour ${bq.nom}`,
      details: result
    });
  } catch (err) {
    console.error('[CREDITS RELANCES ECHEANCES ERR]', err);
    res.status(500).json({ error: 'Erreur lors du traitement des relances' });
  }
});

// ── POST /api/boutiques/:id/credits-clients/approuver-commande — Approbation d'une demande d'achat à crédit
router.post('/:id/credits-clients/approuver-commande', verifierToken, async (req, res) => {
  try {
    const param = req.params.id;
    const bq = await checkBoutiqueAccess(param, req.user.userId);
    if (!bq && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé pour approuver les crédits de cette boutique' });
    }
    const boutiqueId = bq.id;

    const { commande_id, client_nom, client_telephone, montant, nom_produit, quantite, reference } = req.body;

    if (!client_nom || !client_telephone || !montant) {
      return res.status(400).json({ error: 'Nom client, téléphone et montant requis.' });
    }

    const cleanTel = String(client_telephone).replace(/\D/g, '');
    const shortTel = cleanTel.length >= 9 ? cleanTel.slice(-9) : cleanTel;

    const dbClient = await pool.connect();
    try {
      await dbClient.query('BEGIN');

      let clientRes = null;
      if (shortTel) {
        clientRes = await dbClient.query(
          `SELECT * FROM caisse_clients_credits
           WHERE boutique_id = $1
             AND REPLACE(REPLACE(telephone, ' ', ''), '+', '') LIKE '%' || $2
           LIMIT 1`,
          [boutiqueId, shortTel]
        );
      }

      if ((!clientRes || clientRes.rows.length === 0) && !shortTel && client_nom) {
        clientRes = await dbClient.query(
          `SELECT * FROM caisse_clients_credits
           WHERE boutique_id = $1
             AND LOWER(TRIM(nom)) = LOWER(TRIM($2))
           LIMIT 1`,
          [boutiqueId, client_nom.trim()]
        );
      }

      let carnetClient;
      if (!clientRes || clientRes.rows.length === 0) {
        const newClientRes = await dbClient.query(
          `INSERT INTO caisse_clients_credits (boutique_id, nom, telephone, solde, plafond_max)
           VALUES ($1, $2, $3, 0, 250000)
           RETURNING *`,
          [boutiqueId, client_nom.trim(), client_telephone.trim()]
        );
        carnetClient = newClientRes.rows[0];
      } else {
        carnetClient = clientRes.rows[0];
      }

      if (carnetClient && carnetClient.statut === 'bloque') {
        await dbClient.query('ROLLBACK');
        return res.status(400).json({ error: '⛔ Ce client est actuellement blacklisté par la boutique. Impossible de valider un achat à crédit.' });
      }

      const noteTrans = `Achat à crédit Web (Réf: ${reference || 'Commande'}, ${nom_produit || 'Article'} x${quantite || 1})`;
      const prodsTrans = JSON.stringify([{ nom: nom_produit || 'Article', quantite: quantite || 1, prix: Number(montant) / Number(quantite || 1) }]);

      const histRes = await dbClient.query(
        `INSERT INTO caisse_credit_historique (client_id, boutique_id, type, montant, mode_paiement, note, produits, relance_auto_whatsapp)
         VALUES ($1, $2, 'vente_credit', $3, 'credit', $4, $5, true) RETURNING id`,
        [carnetClient.id, boutiqueId, Number(montant), noteTrans, prodsTrans]
      );

      const soldeRes = await dbClient.query(
        `UPDATE caisse_clients_credits
         SET solde = solde + $1, updated_at = NOW()
         WHERE id = $2
         RETURNING solde`,
        [Number(montant), carnetClient.id]
      );

      if (commande_id) {
        const isCmdUUID = /^[0-9a-f-]{36}$/i.test(String(commande_id));
        const cmdCond = isCmdUUID ? '(id = $1 OR reference = $1)' : 'reference = $1';
        await dbClient.query(
          `UPDATE commandes_boutique SET statut = 'confirmee', updated_at = NOW() WHERE ${cmdCond} AND boutique_id = $2`,
          [commande_id, boutiqueId]
        ).catch(() => {});
      }

      if (nom_produit) {
        await dbClient.query(
          `UPDATE boutique_produits
           SET stock_quantite = GREATEST(0, stock_quantite - $1),
               en_stock = CASE WHEN (stock_quantite - $1) <= 0 THEN false ELSE en_stock END
           WHERE boutique_id = $2 AND LOWER(nom) = LOWER($3) AND stock_quantite IS NOT NULL`,
          [quantite || 1, boutiqueId, nom_produit.trim()]
        ).catch(() => {});
      }

      await dbClient.query(
        `INSERT INTO analytics_events (type, boutique_id) VALUES ('vente_credit', $1)`,
        [boutiqueId]
      ).catch(() => {});

      await dbClient.query('COMMIT');

      if (client_telephone) {
        try {
          const { sendWhatsAppNotification } = require('../../services/whatsapp');
          const montantFmt = new Intl.NumberFormat('fr-FR').format(montant);
          const soldeFmt = new Intl.NumberFormat('fr-FR').format(soldeRes.rows[0].solde);
          const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';

          const msgClient = `✅ *Achat à crédit approuvé — ${bq.nom}*\n\n` +
            `Bonjour *${carnetClient.nom}*, votre achat à crédit de *${montantFmt} FCFA* (${nom_produit || 'Article'} × ${quantite || 1}) a été validé et inscrit à votre Carnet client.\n\n` +
            `📊 *Votre solde total dû est de : ${soldeFmt} FCFA*.\n\n` +
            `🙏 Merci de votre confiance !`;

          const titleTpl = `✅ Achat crédit approuvé — ${bq.nom}`.slice(0, 60);
          const detailTpl = `Réf ${reference || 'Crédit'} : ${montantFmt} FCFA inscrits au carnet. Solde dû: ${soldeFmt} FCFA.`.slice(0, 1000);
          const urlTpl = `${SITE}/boutiques/${bq.slug || bq.id}`;

          sendWhatsAppNotification(client_telephone, {
            textMessage: msgClient,
            title: titleTpl,
            detail: detailTpl,
            url: urlTpl,
            buttonParam: bq.slug || bq.id,
          })
            .then(() => console.log(`[WHATSAPP CREDIT APPROBATION SUCCESS] Notif envoyée à ${client_telephone}`))
            .catch(err => console.error('[WHATSAPP CREDIT APPROBATION ERR]:', err.message));
        } catch (eWs) {
          console.error('[WHATSAPP NOTIF ERR]:', eWs.message);
        }
      }

      res.json({
        success: true,
        message: `Demande d'achat à crédit approuvée et ajoutée au carnet de ${carnetClient.nom} !`,
        client: { ...carnetClient, solde: soldeRes.rows[0].solde },
        nouveauSolde: soldeRes.rows[0].solde,
      });
    } catch (e) {
      await dbClient.query('ROLLBACK');
      throw e;
    } finally {
      dbClient.release();
    }
  } catch (err) {
    console.error('Erreur approbation commande credit:', err);
    res.status(500).json({ error: 'Erreur lors de l\'approbation de la commande à crédit.' });
  }
});

module.exports = router;
