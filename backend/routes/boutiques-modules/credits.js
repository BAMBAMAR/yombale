// backend/routes/boutiques-modules/credits.js
// Carnet de dettes & crédits clients (Boutique)
const router = require('express').Router();
const { param } = require('express-validator');
const { pool } = require('../../models/db');
const { verifierToken, tokenOptional } = require('../../middlewares/auth');
const { checkBoutiqueAccess } = require('../../middlewares/tenantSecurity');
const creditCalc = require('../../lib/creditCalculator');

// Auto-migration de sécurité : tables et colonnes d'échelonnement
let _creditSchemaMigrated = false;
async function ensureCreditSchema() {
  if (_creditSchemaMigrated) return;
  try {
    await pool.query(`
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS echelonnement_actif BOOLEAN DEFAULT FALSE;
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS echelonnement_config JSONB DEFAULT '{
        "actif": false,
        "montant_min_vente": 10000,
        "montant_max_vente": 5000000,
        "apport_min_pct": 20,
        "apport_min_fcfa": 5000,
        "echeance_min_fcfa": 5000,
        "nb_echeances_autorisees": [2, 3, 4, 6],
        "frequences_autorisees": ["mensuel", "bimensuel", "hebdomadaire"],
        "delai_premiere_echeance_jours": 30,
        "frais_dossier_fixes": 0,
        "frais_pourcentage": 0
      }'::jsonb;

      CREATE TABLE IF NOT EXISTS caisse_credit_plans (
        id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id      UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        client_id        UUID NOT NULL REFERENCES caisse_clients_credits(id) ON DELETE CASCADE,
        commande_id      UUID REFERENCES commandes_boutique(id) ON DELETE SET NULL,
        reference        VARCHAR(100) UNIQUE NOT NULL,
        montant_total    NUMERIC(12,2) NOT NULL,
        frais_dossier    NUMERIC(12,2) NOT NULL DEFAULT 0,
        apport_initial   NUMERIC(12,2) NOT NULL DEFAULT 0,
        montant_finance  NUMERIC(12,2) NOT NULL,
        montant_paye     NUMERIC(12,2) NOT NULL DEFAULT 0,
        montant_restant  NUMERIC(12,2) NOT NULL,
        nb_echeances     INT NOT NULL DEFAULT 3,
        frequence        VARCHAR(30) NOT NULL DEFAULT 'mensuel',
        statut           VARCHAR(30) NOT NULL DEFAULT 'en_cours',
        date_debut       DATE NOT NULL DEFAULT CURRENT_DATE,
        snapshot_regles  JSONB NOT NULL DEFAULT '{}'::jsonb,
        articles         JSONB NOT NULL DEFAULT '[]'::jsonb,
        notes            TEXT,
        idempotency_key  VARCHAR(128),
        created_at       TIMESTAMPTZ DEFAULT NOW(),
        updated_at       TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_credit_plans_bq_client ON caisse_credit_plans(boutique_id, client_id);
      CREATE INDEX IF NOT EXISTS idx_credit_plans_statut ON caisse_credit_plans(boutique_id, statut);
      CREATE INDEX IF NOT EXISTS idx_credit_plans_ref ON caisse_credit_plans(boutique_id, reference);

      CREATE TABLE IF NOT EXISTS caisse_credit_echeances (
        id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        plan_id                    UUID NOT NULL REFERENCES caisse_credit_plans(id) ON DELETE CASCADE,
        boutique_id                UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        client_id                  UUID NOT NULL REFERENCES caisse_clients_credits(id) ON DELETE CASCADE,
        numero_echeance            INT NOT NULL,
        date_echeance              DATE NOT NULL,
        montant_prevu              NUMERIC(12,2) NOT NULL,
        montant_paye               NUMERIC(12,2) NOT NULL DEFAULT 0,
        montant_restant            NUMERIC(12,2) NOT NULL,
        statut                     VARCHAR(30) NOT NULL DEFAULT 'a_venir',
        date_paiement_complet      TIMESTAMPTZ,
        derniere_relance_whatsapp  TIMESTAMPTZ,
        created_at                 TIMESTAMPTZ DEFAULT NOW(),
        updated_at                 TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_credit_ech_plan ON caisse_credit_echeances(plan_id, numero_echeance);
      CREATE INDEX IF NOT EXISTS idx_credit_ech_date ON caisse_credit_echeances(boutique_id, date_echeance, statut);
      CREATE INDEX IF NOT EXISTS idx_credit_ech_client ON caisse_credit_echeances(client_id, statut);
      ALTER TABLE caisse_credit_historique ADD COLUMN IF NOT EXISTS reference VARCHAR(128);
      CREATE INDEX IF NOT EXISTS idx_credit_hist_ref ON caisse_credit_historique(boutique_id, reference);
    `);
    _creditSchemaMigrated = true;
  } catch {
    _creditSchemaMigrated = true;
  }
}

const creditService = require('../../services/credit-service');

// ── GET /api/boutiques/:id/credits-clients — Liste des clients avec carnet de dettes/avances
router.get('/:id/credits-clients', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const b = await checkBoutiqueAccess(id, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé au carnet de dettes de cette boutique' });
    }

    const includeHistorique = req.query.include_historique === 'true' || req.query.include_historique === '1';
    const clients = await creditService.getClientsAvecHistorique(b.id, includeHistorique);

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

    const historique = await creditService.getHistoriqueClient(b.id, clientId);
    res.json({ success: true, historique });
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
    const b = await checkBoutiqueAccess(id, req.user.userId);
    if (!b) return res.status(403).json({ error: 'Accès refusé' });

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
    // T-094 : liste blanche stricte des types (évite les lignes d'historique fantômes avec delta 0).
    const TYPES_TRANSACTION_VALIDES = ['vente_credit', 'remboursement', 'depot_avance'];
    if (!type || !TYPES_TRANSACTION_VALIDES.includes(type) || !numMontant || numMontant <= 0) {
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

      const soldeCourant = Number(c.rows[0].solde);
      const nouveauSolde = soldeCourant + deltaSolde;

      if (type === 'vente_credit' && nouveauSolde > Number(c.rows[0].plafond_max)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Plafond de crédit dépassé (${c.rows[0].plafond_max} FCFA max)` });
      }

      // T-095/098 : un remboursement ne peut pas dépasser la dette due (borne solde ≥ 0).
      // Un versement d'avance client (depot_avance) peut, lui, créer un solde négatif légitime.
      if (type === 'remboursement' && numMontant > soldeCourant) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Le remboursement (${new Intl.NumberFormat('fr-FR').format(numMontant)} FCFA) dépasse la dette due (${new Intl.NumberFormat('fr-FR').format(soldeCourant)} FCFA). Utilisez « dépôt / avance » pour un trop-perçu.` });
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
              montant: `${montantFmt} FCFA`,
              detail: `Montant : ${montantFmt} FCFA. Solde carnet : ${soldeFmt} FCFA.`,
              url: `${SITE}/boutiques/${bq.slug || bq.id}`,
              buttonParam: `boutiques/${bq.slug || bq.id}`,
              type: 'rappel',
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
          montant: `${soldeNum.toLocaleString('fr-FR')} FCFA`,
          detail: `Solde carnet débiteur : ${soldeNum.toLocaleString('fr-FR')} FCFA. Merci de bien vouloir régulariser auprès de ${bq.nom}.`,
          url: `${SITE}/boutiques/${bq.slug || bq.id}`,
          buttonParam: `boutiques/${bq.slug || bq.id}`,
          type: 'rappel',
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
            montant: `${montantFmt} FCFA`,
            detail: detailTpl,
            url: urlTpl,
            buttonParam: `boutiques/${bq.slug || bq.id}`,
            type: 'rappel',
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

// ── GET /api/boutiques/:id/credits-config — Obtenir la configuration du paiement échelonné
router.get('/:id/credits-config', tokenOptional, async (req, res) => {
  try {
    await ensureCreditSchema();
    const { id } = req.params;
    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    const b = await pool.query(
      `SELECT id, nom, slug, echelonnement_actif, echelonnement_config FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`,
      [id]
    );
    if (!b.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });

    const boutique = b.rows[0];
    const config = {
      ...creditCalc.CONFIG_DEFAUT,
      ...(boutique.echelonnement_config || {}),
      actif: boutique.echelonnement_actif === true || boutique.echelonnement_config?.actif === true,
    };

    res.json({ success: true, config, boutique: { id: boutique.id, nom: boutique.nom, slug: boutique.slug } });
  } catch (err) {
    console.error('[CREDITS CONFIG GET]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/boutiques/:id/credits-config — Mettre à jour la configuration échelonnement (Marchand)
router.put('/:id/credits-config', verifierToken, async (req, res) => {
  try {
    await ensureCreditSchema();
    const { id } = req.params;
    const b = await checkBoutiqueAccess(id, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé pour configurer les crédits de cette boutique' });
    }

    const {
      actif,
      montant_min_vente,
      montant_max_vente,
      apport_min_pct,
      apport_min_fcfa,
      echeance_min_fcfa,
      nb_echeances_autorisees,
      frequences_autorisees,
      delai_premiere_echeance_jours,
      frais_dossier_fixes,
      frais_pourcentage,
    } = req.body;

    const newConfig = {
      actif: Boolean(actif),
      montant_min_vente: Math.max(0, Number(montant_min_vente) || 10000),
      montant_max_vente: montant_max_vente ? Math.max(0, Number(montant_max_vente)) : 5000000,
      apport_min_pct: Math.min(100, Math.max(0, Number(apport_min_pct !== undefined ? apport_min_pct : 20))),
      apport_min_fcfa: Math.max(0, Number(apport_min_fcfa) || 0),
      echeance_min_fcfa: Math.max(0, Number(echeance_min_fcfa) || 5000),
      nb_echeances_autorisees: Array.isArray(nb_echeances_autorisees) && nb_echeances_autorisees.length > 0
        ? nb_echeances_autorisees.map(Number).filter(n => n >= 2 && n <= 24)
        : [2, 3, 4, 6],
      frequences_autorisees: Array.isArray(frequences_autorisees) && frequences_autorisees.length > 0
        ? frequences_autorisees
        : ['mensuel', 'bimensuel', 'hebdomadaire'],
      delai_premiere_echeance_jours: Math.max(1, Number(delai_premiere_echeance_jours) || 30),
      frais_dossier_fixes: Math.max(0, Number(frais_dossier_fixes) || 0),
      frais_pourcentage: Math.max(0, Number(frais_pourcentage) || 0),
    };

    await pool.query(
      `UPDATE boutiques 
       SET echelonnement_actif = $1, echelonnement_config = $2, updated_at = NOW() 
       WHERE id = $3`,
      [newConfig.actif, JSON.stringify(newConfig), b.id]
    );

    res.json({ success: true, message: 'Conditions de paiement échelonné mises à jour avec succès', config: newConfig });
  } catch (err) {
    console.error('[CREDITS CONFIG PUT]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/credits-calculer — Moteur de simulation d'échéancier (Acheteur / Marchand)
router.post('/:id/credits-calculer', tokenOptional, async (req, res) => {
  try {
    await ensureCreditSchema();
    const { id } = req.params;
    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    const b = await pool.query(
      `SELECT id, nom, slug, echelonnement_actif, echelonnement_config FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`,
      [id]
    );
    if (!b.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });

    const boutique = b.rows[0];
    const config = {
      ...creditCalc.CONFIG_DEFAUT,
      ...(boutique.echelonnement_config || {}),
      actif: boutique.echelonnement_actif === true || boutique.echelonnement_config?.actif === true,
    };

    const { montantTotal, apport, nbEcheances, frequence, dateDebut } = req.body;
    const numTotal = Number(montantTotal) || 0;

    // Génération des formules recommandées + calcul personnalisé
    const formules = creditCalc.genererFormulesRecommandees(numTotal, config, dateDebut);

    let calculPersonnalise = null;
    if (apport !== undefined && nbEcheances !== undefined) {
      calculPersonnalise = creditCalc.calculerEcheancier({
        montantTotal: numTotal,
        apport: Number(apport),
        nbEcheances: Number(nbEcheances),
        frequence: frequence || 'mensuel',
        dateDebut: dateDebut || new Date(),
        config,
      });
    }

    res.json({
      success: true,
      config,
      formules,
      calcul: calculPersonnalise,
    });
  } catch (err) {
    console.error('[CREDITS CALCULER POST]', err);
    res.status(500).json({ error: 'Erreur lors du calcul de l\'échéancier' });
  }
});

// ── GET /api/boutiques/:id/credits-clients/:clientId/plans — Obtenir les plans et échéances d'un client
router.get('/:id/credits-clients/:clientId/plans', verifierToken, async (req, res) => {
  try {
    await ensureCreditSchema();
    const { id, clientId } = req.params;
    const b = await checkBoutiqueAccess(id, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé aux dossiers de crédit' });
    }

    const { rows: plans } = await pool.query(
      `SELECT * FROM caisse_credit_plans 
       WHERE boutique_id = $1 AND client_id = $2 
       ORDER BY created_at DESC`,
      [b.id, clientId]
    );

    const { rows: echeances } = await pool.query(
      `SELECT * FROM caisse_credit_echeances 
       WHERE boutique_id = $1 AND client_id = $2 
       ORDER BY date_echeance ASC, numero_echeance ASC`,
      [b.id, clientId]
    );

    const echMap = new Map();
    const todayStr = new Date().toISOString().split('T')[0];

    echeances.forEach(ech => {
      // Calcul automatique de retard
      if (ech.statut !== 'payee' && ech.statut !== 'soldee_par_anticipation' && ech.statut !== 'annulee') {
        const echDateStr = typeof ech.date_echeance === 'string' ? ech.date_echeance.split('T')[0] : new Date(ech.date_echeance).toISOString().split('T')[0];
        if (echDateStr < todayStr) {
          ech.statut = 'en_retard';
          const diffJours = Math.floor((new Date(todayStr).getTime() - new Date(echDateStr).getTime()) / (1000 * 60 * 60 * 24));
          ech.jours_retard = diffJours;
        } else if (echDateStr === todayStr) {
          ech.statut = 'bientot_due';
          ech.jours_retard = 0;
        }
      }
      if (!echMap.has(ech.plan_id)) echMap.set(ech.plan_id, []);
      echMap.get(ech.plan_id).push(ech);
    });

    plans.forEach(p => {
      const rawEchs = echMap.get(p.id) || []
      p.solde_restant = Number(p.montant_restant !== undefined ? p.montant_restant : p.solde_restant) || 0
      p.montant_total = Number(p.montant_total) || 0
      p.montant_apport = Number(p.apport_initial !== undefined ? p.apport_initial : p.montant_apport) || 0
      p.montant_paye = Number(p.montant_paye) || 0
      p.montant_finance = Number(p.montant_finance) || (p.montant_total - p.montant_apport)
      p.echeances = rawEchs.map(ech => ({
        ...ech,
        numero: ech.numero_echeance || ech.numero || 1,
        numero_echeance: ech.numero_echeance || ech.numero || 1,
        montant_total: Number(ech.montant_prevu !== undefined ? ech.montant_prevu : ech.montant_total) || 0,
        montant_prevu: Number(ech.montant_prevu !== undefined ? ech.montant_prevu : ech.montant_total) || 0,
        montant_restant: Number(ech.montant_restant !== undefined ? ech.montant_restant : (ech.montant_prevu - ech.montant_paye)) || 0,
        montant_paye: Number(ech.montant_paye) || 0,
      }))
      p.nb_payees = p.echeances.filter(e => e.statut === 'payee').length
      p.has_retard = p.echeances.some(e => e.statut === 'en_retard')
    });

    res.json({ success: true, plans, echeances });
  } catch (err) {
    console.error('[CREDITS PLANS GET]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/credits-clients/:clientId/creer-plan — Créer un plan de crédit avec échéancier
router.post('/:id/credits-clients/:clientId/creer-plan', verifierToken, async (req, res) => {
  try {
    await ensureCreditSchema();
    const { id, clientId } = req.params;
    const b = await checkBoutiqueAccess(id, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé pour créer un dossier de crédit' });
    }

    const {
      montant_total,
      apport_initial,
      nb_echeances,
      frequence,
      date_debut,
      articles,
      notes,
      mode_paiement_apport,
      commande_id,
      idempotency_key,
    } = req.body;

    const numTotal = Number(montant_total) || 0;
    const numApport = Number(apport_initial) || 0;
    const numNb = Number(nb_echeances) || 3;
    const freq = String(frequence || 'mensuel').toLowerCase();

    if (numTotal <= 0) {
      return res.status(400).json({ error: 'Montant total de la vente valide (> 0) requis.' });
    }

    // Gestion de l'idempotence
    if (idempotency_key) {
      const existingPlan = await pool.query(
        `SELECT id, reference, montant_total, montant_restant FROM caisse_credit_plans WHERE boutique_id = $1 AND idempotency_key = $2 LIMIT 1`,
        [b.id, idempotency_key]
      );
      if (existingPlan.rows[0]) {
        return res.json({ success: true, duplicate: true, plan: existingPlan.rows[0] });
      }
    }

    // Récupération de la config de la boutique
    const bqConfigRes = await pool.query(`SELECT echelonnement_actif, echelonnement_config FROM boutiques WHERE id = $1`, [b.id]);
    const bqConfig = {
      ...creditCalc.CONFIG_DEFAUT,
      ...(bqConfigRes.rows[0]?.echelonnement_config || {}),
      actif: bqConfigRes.rows[0]?.echelonnement_actif === true || bqConfigRes.rows[0]?.echelonnement_config?.actif === true,
    };

    // Validation stricte des règles
    const validation = creditCalc.validerReglesEchelonnement(bqConfig, {
      montantTotal: numTotal,
      apport: numApport,
      nbEcheances: numNb,
      frequence: freq,
    });

    if (!validation.valide) {
      return res.status(400).json({ error: validation.erreur });
    }

    // Calcul de l'échéancier exact
    const calcul = creditCalc.calculerEcheancier({
      montantTotal: numTotal,
      apport: numApport,
      nbEcheances: numNb,
      frequence: freq,
      dateDebut: date_debut || new Date(),
      config: bqConfig,
    });

    const dbClient = await pool.connect();
    try {
      await dbClient.query('BEGIN');

      // Verrouillage du client
      const cRes = await dbClient.query(
        `SELECT * FROM caisse_clients_credits WHERE id = $1 AND boutique_id = $2 FOR UPDATE`,
        [clientId, b.id]
      );
      if (!cRes.rows[0]) {
        await dbClient.query('ROLLBACK');
        return res.status(404).json({ error: 'Client introuvable' });
      }
      const clientCarnet = cRes.rows[0];

      if (clientCarnet.statut === 'bloque') {
        await dbClient.query('ROLLBACK');
        return res.status(400).json({ error: '⛔ Ce client est actuellement bloqué/blacklisté.' });
      }

      // Vérification plafond de crédit
      const soldeActuel = Number(clientCarnet.solde || 0);
      const plafondMax = Number(clientCarnet.plafond_max || 200000);
      const montantFinance = calcul.montant_finance;
      const nouveauSolde = soldeActuel + montantFinance;

      if (nouveauSolde > plafondMax) {
        await dbClient.query('ROLLBACK');
        return res.status(400).json({
          error: `Le plafond de crédit du client (${plafondMax.toLocaleString('fr-FR')} FCFA) serait dépassé. Nouveau solde : ${nouveauSolde.toLocaleString('fr-FR')} FCFA.`,
        });
      }

      const planRef = idempotency_key || `CRD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // 1. Insertion du plan de crédit (avec snapshot des règles figées)
      const planRes = await dbClient.query(
        `INSERT INTO caisse_credit_plans (
          boutique_id, client_id, commande_id, reference, montant_total, frais_dossier,
          apport_initial, montant_finance, montant_paye, montant_restant, nb_echeances,
          frequence, statut, date_debut, snapshot_regles, articles, notes, idempotency_key, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $8, $9, $10, 'en_cours', $11, $12, $13, $14, $15, NOW(), NOW())
        RETURNING *`,
        [
          b.id,
          clientId,
          commande_id || null,
          planRef,
          calcul.total_a_payer,
          calcul.frais_dossier,
          numApport,
          montantFinance,
          numNb,
          freq,
          date_debut || new Date().toISOString().split('T')[0],
          JSON.stringify(bqConfig),
          JSON.stringify(articles || []),
          notes || null,
          idempotency_key || null,
        ]
      );
      const createdPlan = planRes.rows[0];

      // 2. Insertion des échéances contractuelles
      const insertedEcheances = [];
      for (const ech of calcul.echeances) {
        const echRes = await dbClient.query(
          `INSERT INTO caisse_credit_echeances (
            plan_id, boutique_id, client_id, numero_echeance, date_echeance,
            montant_prevu, montant_paye, montant_restant, statut, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, 0, $6, 'a_venir', NOW(), NOW())
          RETURNING *`,
          [createdPlan.id, b.id, clientId, ech.numero_echeance, ech.date_echeance, ech.montant_prevu]
        );
        insertedEcheances.push(echRes.rows[0]);
      }

      // 3. Écriture comptable dans caisse_credit_historique pour la vente à crédit
      await dbClient.query(
        `INSERT INTO caisse_credit_historique (
          client_id, boutique_id, type, montant, mode_paiement, note, produits,
          date_echeance, relance_auto_whatsapp, reference, created_at
        ) VALUES ($1, $2, 'vente_credit', $3, 'credit', $4, $5, $6, true, $7, NOW())`,
        [
          clientId,
          b.id,
          numTotal,
          `Plan ${numNb}x (${freq}) — Réf: ${planRef}${notes ? ` | ${notes}` : ''}`,
          JSON.stringify(articles || []),
          calcul.prochaine_echeance,
          planRef,
        ]
      );

      // 4. Si un apport initial a été versé immédiatement, enregistrement du reçu
      if (numApport > 0) {
        await dbClient.query(
          `INSERT INTO caisse_credit_historique (
            client_id, boutique_id, type, montant, mode_paiement, note, reference, created_at
          ) VALUES ($1, $2, 'remboursement', $3, $4, $5, $6, NOW())`,
          [
            clientId,
            b.id,
            numApport,
            mode_paiement_apport || 'especes',
            `Apport initial sur plan ${planRef}`,
            `${planRef}-APPORT`,
          ]
        );
      }

      // 5. Mise à jour du solde du client
      await dbClient.query(
        `UPDATE caisse_clients_credits SET solde = $1, updated_at = NOW() WHERE id = $2`,
        [nouveauSolde, clientId]
      );

      // 6. Décrémentation de stock pour chaque article et insertion dans ventes
      if (Array.isArray(articles) && articles.length > 0) {
        for (let idx = 0; idx < articles.length; idx++) {
          const item = articles[idx];
          const qte = Number(item.quantite || 1);
          const pId = item.id || item.produit_id;

          let pRes = null;
          if (pId && /^[0-9a-f-]{36}$/i.test(String(pId))) {
            pRes = await dbClient.query(
              `UPDATE boutique_produits
               SET stock_quantite = GREATEST(0, COALESCE(stock_quantite, 10) - $1),
                   en_stock = (GREATEST(0, COALESCE(stock_quantite, 10) - $1) > 0)
               WHERE id = $2 AND boutique_id = $3
               RETURNING id, nom, prix`,
              [qte, pId, b.id]
            );
          }

          const itemNom = item.nom || item.nom_produit || pRes?.rows[0]?.nom || 'Article Échelonné';
          const itemPrix = Number(item.prix || item.prix_unitaire || pRes?.rows[0]?.prix || 0);
          const totalLigne = itemPrix * qte;
          const itemRef = articles.length > 1 ? `${planRef}-${idx + 1}` : planRef;

          await dbClient.query(
            `INSERT INTO ventes (
              reference, boutique_id, produit_id, nom_produit, quantite,
              prix_unitaire, frais_livraison, montant_total, client_nom, client_telephone, methode_paiement, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $9, 'credit_echelonne', NOW())
            ON CONFLICT (reference) DO NOTHING`,
            [itemRef, b.id, pRes?.rows[0]?.id || null, itemNom, qte, itemPrix, totalLigne, clientCarnet.nom, clientCarnet.telephone]
          );
        }
      }

      await dbClient.query('COMMIT');

      // Notification WhatsApp au client
      if (clientCarnet.telephone) {
        try {
          const { sendWhatsAppNotification } = require('../../services/whatsapp');
          const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
          const totalFmt = new Intl.NumberFormat('fr-FR').format(numTotal);
          const apportFmt = new Intl.NumberFormat('fr-FR').format(numApport);
          const financeFmt = new Intl.NumberFormat('fr-FR').format(montantFinance);
          const prochainFmt = new Intl.NumberFormat('fr-FR').format(calcul.prochain_montant);
          const dateEchFmt = calcul.prochaine_echeance ? new Date(calcul.prochaine_echeance).toLocaleDateString('fr-FR') : 'à définir';

          const msgWA = `🎉 *Formule de paiement échelonné confirmée — ${b.nom}*\n\n` +
            `Bonjour *${clientCarnet.nom}*,\n` +
            `Votre formule de paiement en *${numNb} fois* a été validée pour votre achat de *${totalFmt} FCFA*.\n\n` +
            (numApport > 0 ? `💵 *Apport réglé : ${apportFmt} FCFA*\n` : '') +
            `📊 *Montant restant financé : ${financeFmt} FCFA*\n` +
            `📅 *Prochaine échéance : ${prochainFmt} FCFA le ${dateEchFmt}*\n\n` +
            `Merci de votre fidélité !`;

          sendWhatsAppNotification(clientCarnet.telephone, {
            textMessage: msgWA,
            title: `💳 Paiement échelonné validé — ${b.nom}`.slice(0, 60),
            montant: `${totalFmt} FCFA`,
            detail: `Achat ${totalFmt} FCFA en ${numNb}x. Prochaine échéance: ${prochainFmt} FCFA le ${dateEchFmt}.`,
            url: `${SITE}/boutiques/${b.slug || b.id}`,
            buttonParam: `boutiques/${b.slug || b.id}`,
            type: 'rappel',
          }).catch(err => console.error('[WHATSAPP PLAN NOTIF ERR]:', err.message));
        } catch (eWs) {
          console.error('[WHATSAPP PLAN NOTIF ERR]:', eWs.message);
        }
      }

      res.status(201).json({
        success: true,
        message: `Plan de paiement échelonné créé avec succès (${numNb} échéances)`,
        plan: createdPlan,
        echeances: insertedEcheances,
        nouveauSolde,
      });
    } catch (e) {
      await dbClient.query('ROLLBACK');
      throw e;
    } finally {
      dbClient.release();
    }
  } catch (err) {
    console.error('[CREDITS CREER PLAN ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la création du plan de crédit' });
  }
});

// ── POST /api/boutiques/:id/credits-clients/:clientId/encaisser — Encaisser un règlement sur échéance(s)
router.post('/:id/credits-clients/:clientId/encaisser', verifierToken, async (req, res) => {
  try {
    await ensureCreditSchema();
    const { id, clientId } = req.params;
    const b = await checkBoutiqueAccess(id, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé pour encaisser des règlements' });
    }

    const { montant, mode_paiement, note, plan_id, echeance_id, idempotency_key } = req.body;
    const numMontant = Number(montant) || 0;
    if (numMontant <= 0) {
      return res.status(400).json({ error: 'Montant valide (> 0) requis pour l’encaissement.' });
    }

    if (idempotency_key) {
      const existingTx = await pool.query(
        `SELECT id, montant, type FROM caisse_credit_historique WHERE boutique_id = $1 AND reference = $2 LIMIT 1`,
        [b.id, idempotency_key]
      );
      if (existingTx.rows[0]) {
        return res.json({ success: true, duplicate: true, transaction: existingTx.rows[0] });
      }
    }

    const dbClient = await pool.connect();
    try {
      await dbClient.query('BEGIN');

      const cRes = await dbClient.query(
        `SELECT * FROM caisse_clients_credits WHERE id = $1 AND boutique_id = $2 FOR UPDATE`,
        [clientId, b.id]
      );
      if (!cRes.rows[0]) {
        await dbClient.query('ROLLBACK');
        return res.status(404).json({ error: 'Client introuvable' });
      }
      const clientCarnet = cRes.rows[0];

      // Récupération des échéances non soldées (filtrées par plan si spécifié)
      let queryEch = `
        SELECT * FROM caisse_credit_echeances 
        WHERE boutique_id = $1 AND client_id = $2 AND statut NOT IN ('payee', 'annulee', 'soldee_par_anticipation')
      `;
      const paramsEch = [b.id, clientId];
      if (plan_id) {
        paramsEch.push(plan_id);
        queryEch += ` AND plan_id = $${paramsEch.length}`;
      }
      queryEch += ` ORDER BY date_echeance ASC, numero_echeance ASC FOR UPDATE`;

      const { rows: echeancesNonSoldees } = await dbClient.query(queryEch, paramsEch);

      // Imputation FIFO
      const { echeancesUpdated } = creditCalc.imputerPaiementSurEcheances(echeancesNonSoldees, numMontant);

      for (const ech of echeancesUpdated) {
        await dbClient.query(
          `UPDATE caisse_credit_echeances 
           SET montant_paye = $1, montant_restant = $2, statut = $3, date_paiement_complet = $4, updated_at = NOW()
           WHERE id = $5`,
          [ech.montant_paye, ech.montant_restant, ech.statut, ech.date_paiement_complet || null, ech.id]
        );
      }

      // Mise à jour du plan de crédit si présent
      const planIdsTouches = [...new Set(echeancesUpdated.map(e => e.plan_id))];
      for (const pId of planIdsTouches) {
        const { rows: allPlanEch } = await dbClient.query(
          `SELECT statut, montant_paye, montant_restant FROM caisse_credit_echeances WHERE plan_id = $1`,
          [pId]
        );
        const totalPayePlan = allPlanEch.reduce((s, e) => s + Number(e.montant_paye || 0), 0);
        const totalRestantPlan = allPlanEch.reduce((s, e) => s + Number(e.montant_restant || 0), 0);
        const toutPaye = allPlanEch.every(e => e.statut === 'payee' || e.statut === 'soldee_par_anticipation');

        await dbClient.query(
          `UPDATE caisse_credit_plans 
           SET montant_paye = $1, montant_restant = $2, statut = $3, updated_at = NOW()
           WHERE id = $4`,
          [totalPayePlan, totalRestantPlan, toutPaye ? 'solde' : 'en_cours', pId]
        );
      }

      // Mise à jour du solde global du client (Solde = Solde - Montant)
      const nouveauSolde = Math.max(0, Number(clientCarnet.solde || 0) - numMontant);
      await dbClient.query(
        `UPDATE caisse_clients_credits SET solde = $1, updated_at = NOW() WHERE id = $2`,
        [nouveauSolde, clientId]
      );

      // Enregistrement dans caisse_credit_historique
      const histRes = await dbClient.query(
        `INSERT INTO caisse_credit_historique (
          client_id, boutique_id, type, montant, mode_paiement, note, reference, created_at
        ) VALUES ($1, $2, 'remboursement', $3, $4, $5, $6, NOW()) RETURNING *`,
        [
          clientId,
          b.id,
          numMontant,
          mode_paiement || 'especes',
          note || 'Règlement échéance carnet',
          idempotency_key || null,
        ]
      );

      await dbClient.query('COMMIT');

      // Notification WhatsApp
      if (clientCarnet.telephone) {
        try {
          const { sendWhatsAppNotification } = require('../../services/whatsapp');
          const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
          const montantFmt = new Intl.NumberFormat('fr-FR').format(numMontant);
          const soldeFmt = new Intl.NumberFormat('fr-FR').format(nouveauSolde);

          const msgWA = `💚 *Règlement enregistré — ${b.nom}*\n\n` +
            `Bonjour *${clientCarnet.nom}*,\n` +
            `Nous confirmons la bonne réception de votre paiement de *${montantFmt} FCFA* (${mode_paiement || 'Règlement'}).\n\n` +
            `📊 *Votre solde restant est désormais de : ${soldeFmt} FCFA*.\n\n` +
            `Merci pour votre paiement !`;

          sendWhatsAppNotification(clientCarnet.telephone, {
            textMessage: msgWA,
            title: `💚 Règlement reçu — ${b.nom}`.slice(0, 60),
            montant: `${montantFmt} FCFA`,
            detail: `Paiement de ${montantFmt} FCFA reçu. Solde restant : ${soldeFmt} FCFA.`,
            url: `${SITE}/boutiques/${b.slug || b.id}`,
            buttonParam: `boutiques/${b.slug || b.id}`,
            type: 'rappel',
          }).catch(err => console.error('[WHATSAPP ENCAISSEMENT ERR]:', err.message));
        } catch (eWs) {
          console.error('[WHATSAPP ENCAISSEMENT ERR]:', eWs.message);
        }
      }

      res.json({
        success: true,
        message: 'Encaissement validé avec succès',
        nouveauSolde,
        transaction: histRes.rows[0],
        echeancesMisesAJour: echeancesUpdated,
      });
    } catch (e) {
      await dbClient.query('ROLLBACK');
      throw e;
    } finally {
      dbClient.release();
    }
  } catch (err) {
    console.error('[CREDITS ENCAISSER ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l’encaissement' });
  }
});

// ── POST /api/boutiques/:id/credits-clients/:clientId/solder-anticipe — Règlement anticipé du solde
router.post('/:id/credits-clients/:clientId/solder-anticipe', verifierToken, async (req, res) => {
  try {
    await ensureCreditSchema();
    const { id, clientId } = req.params;
    const b = await checkBoutiqueAccess(id, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé pour solder ce crédit' });
    }

    const { plan_id, mode_paiement, note, idempotency_key } = req.body;

    const dbClient = await pool.connect();
    try {
      await dbClient.query('BEGIN');

      const cRes = await dbClient.query(
        `SELECT * FROM caisse_clients_credits WHERE id = $1 AND boutique_id = $2 FOR UPDATE`,
        [clientId, b.id]
      );
      if (!cRes.rows[0]) {
        await dbClient.query('ROLLBACK');
        return res.status(404).json({ error: 'Client introuvable' });
      }
      const clientCarnet = cRes.rows[0];

      let planCondition = '';
      const params = [b.id, clientId];
      if (plan_id) {
        params.push(plan_id);
        planCondition = ` AND id = $${params.length}`;
      }

      const { rows: plans } = await dbClient.query(
        `SELECT * FROM caisse_credit_plans WHERE boutique_id = $1 AND client_id = $2 AND statut != 'solde'${planCondition} FOR UPDATE`,
        params
      );

      let totalSoldeVerse = 0;

      for (const plan of plans) {
        const montantRestantPlan = Number(plan.montant_restant || 0);
        totalSoldeVerse += montantRestantPlan;

        // Mise à jour de toutes les échéances non payées
        await dbClient.query(
          `UPDATE caisse_credit_echeances 
           SET statut = 'soldee_par_anticipation', montant_restant = 0, updated_at = NOW()
           WHERE plan_id = $1 AND statut NOT IN ('payee', 'annulee')`,
          [plan.id]
        );

        // Clôture du plan
        await dbClient.query(
          `UPDATE caisse_credit_plans 
           SET statut = 'solde', montant_paye = montant_total, montant_restant = 0, updated_at = NOW()
           WHERE id = $1`,
          [plan.id]
        );
      }

      // Si aucun plan structuré, solder le montant débiteur global
      if (plans.length === 0 && Number(clientCarnet.solde) > 0) {
        totalSoldeVerse = Number(clientCarnet.solde);
      }

      // Remise à zéro du solde client
      await dbClient.query(
        `UPDATE caisse_clients_credits SET solde = 0, updated_at = NOW() WHERE id = $1`,
        [clientId]
      );

      // Écriture d'historique
      await dbClient.query(
        `INSERT INTO caisse_credit_historique (
          client_id, boutique_id, type, montant, mode_paiement, note, reference, created_at
        ) VALUES ($1, $2, 'remboursement', $3, $4, $5, $6, NOW())`,
        [
          clientId,
          b.id,
          totalSoldeVerse,
          mode_paiement || 'especes',
          note || 'Règlement total anticipé — Crédit soldé',
          idempotency_key || null,
        ]
      );

      await dbClient.query('COMMIT');

      // Notification WhatsApp
      if (clientCarnet.telephone) {
        try {
          const { sendWhatsAppNotification } = require('../../services/whatsapp');
          const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
          const montantFmt = new Intl.NumberFormat('fr-FR').format(totalSoldeVerse);

          const msgWA = `🎉 *Félicitations ! Votre crédit est 100% soldé — ${b.nom}*\n\n` +
            `Bonjour *${clientCarnet.nom}*,\n` +
            `Votre règlement anticipé de *${montantFmt} FCFA* a été enregistré avec succès.\n\n` +
            `✅ *Votre compte est entièrement à jour (Solde restant : 0 FCFA)*.\n\n` +
            `Merci pour votre confiance exemplaire !`;

          sendWhatsAppNotification(clientCarnet.telephone, {
            textMessage: msgWA,
            title: `✅ Crédit 100% Soldé — ${b.nom}`.slice(0, 60),
            montant: `${montantFmt} FCFA`,
            detail: `Votre crédit chez ${b.nom} est entièrement réglé (Solde : 0 FCFA). Merci !`,
            url: `${SITE}/boutiques/${b.slug || b.id}`,
            buttonParam: `boutiques/${b.slug || b.id}`,
            type: 'rappel',
          }).catch(err => console.error('[WHATSAPP SOLDER NOTIF ERR]:', err.message));
        } catch (eWs) {
          console.error('[WHATSAPP SOLDER NOTIF ERR]:', eWs.message);
        }
      }

      res.json({
        success: true,
        message: 'Crédit soldé par anticipation avec succès',
        montantRegle: totalSoldeVerse,
        nouveauSolde: 0,
      });
    } catch (e) {
      await dbClient.query('ROLLBACK');
      throw e;
    } finally {
      dbClient.release();
    }
  } catch (err) {
    console.error('[CREDITS SOLDER ANTICIPE ERR]', err);
    res.status(500).json({ error: 'Erreur lors du règlement anticipé' });
  }
});

module.exports = router;

