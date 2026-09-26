// backend/routes/boutiques-modules/boutiques-pos.js
const router = require('express').Router();
const { body, param, query, validationResult } = require('express-validator');
const { pool } = require('../../models/db');
const { verifierToken, tokenOptional, adminSecretOnly, requireEmailVerifie } = require('../../middlewares/auth');
const { checkAbonnement, requireAbonnement, requireBusiness } = require('../../middlewares/checkAbonnement');
const { limiterPublication, limiterImport } = require('../../middlewares/rateLimit');
const { uploadBuffer } = require('../../services/cloudinary');
const { scrapeProductFromUrl } = require('../../services/magic-import');
const { syncProduit, deleteProduit } = require('../../services/whatsapp-catalog');
const cfg = require('../../lib/settingsCache');
const { enregistrerAuditLog } = require('../../lib/auditLogger');
const { normalizeSocialUrl } = require('../../services/social-parser');
const {
  checkBoutiqueAccess,
  checkBoutiqueQuotas,
  upload,
  uploadProduitPhotos,
  CATS,
  MAX_BOUTIQUES,
  QUOTA_PRODUITS,
  slugify,
  uniqueSlug,
} = require('./helpers');

// ── File d'attente pour le scanner douchette distant (Smartphone → PC Caisse) ──
// Déclarée localement dans ce module pour éviter le couplage avec boutiques-produits.js
const remoteScannerQueue = new Map();

router.post('/:id/scanner-remote', async (req, res) => {
  const { sessionId, code } = req.body;
  if (!sessionId || !code) return res.status(400).json({ error: 'sessionId et code requis' });
  
  if (!remoteScannerQueue.has(sessionId)) {
    remoteScannerQueue.set(sessionId, []);
  }
  remoteScannerQueue.get(sessionId).push(code);

  setTimeout(() => {
    remoteScannerQueue.delete(sessionId);
  }, 300000);

  res.json({ success: true, message: 'Code-barres transmis à la caisse du PC' });
});

router.get('/:id/scanner-remote', async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'sessionId requis' });

  const codes = remoteScannerQueue.get(sessionId) || [];
  if (codes.length > 0) {
    remoteScannerQueue.set(sessionId, []);
  }
  res.json({ codes });
});

// ── POST /api/boutiques/:id/pos-vente — Enregistrer vente POS & déduire le stock + alimenter la Comptabilité PostgreSQL

// Auto-migration de sécurité : s'assure que les colonnes reference ont bien VARCHAR(100) en production
let _refColMigrated = false;
async function ensureRefColSize() {
  if (_refColMigrated) return;
  try {
    await pool.query(`ALTER TABLE ventes ALTER COLUMN reference TYPE VARCHAR(100)`);
    await pool.query(`ALTER TABLE commandes_boutique ALTER COLUMN reference TYPE VARCHAR(100)`);
    await pool.query(`ALTER TABLE caisse_documents ALTER COLUMN reference TYPE VARCHAR(100)`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_caisse_docs_boutique_ref ON caisse_documents(boutique_id, reference)`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_ventes_boutique_ref ON ventes(boutique_id, reference)`);
    _refColMigrated = true;
  } catch (e) {
    // Ignore si déjà correcte ou si erreur de permission
    _refColMigrated = true;
  }
}

router.post('/:id/pos-vente', tokenOptional, async (req, res) => {
  try {
    await ensureRefColSize();
    const idParam = req.params.id;
    const { items, articles, caissier, caissier_id, session_id, modePaiement, client_id, idempotency_key, fidelite_client_id, deduction_cagnotte_fcfa, terminal_token, superviseur_pin } = req.body;
    const saleItems = (Array.isArray(items) && items.length > 0) ? items : (Array.isArray(articles) && articles.length > 0 ? articles : null);
    
    if (!saleItems || saleItems.length === 0) {
      return res.status(400).json({ error: 'La vente doit contenir au moins un article valide.' });
    }

    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(
      `SELECT id, utilisateur_id, caisse_token, regime_fiscal, prix_tva_incluse, timbre_fiscal_applicable, tva_taux_defaut,
              fidelite_actif, fidelite_type, fidelite_taux_cashback, fidelite_seuil_tampon, fidelite_tampons_max
       FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`,
      [idParam]
    );
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutique = bRes.rows[0];
    const boutiqueId = boutique.id;

    // ── Sécurité Anti-IDOR & Terminal POS : session marchand OU jeton caisse valide ──
    let accessGranted = false;
    if (req.user?.userId) {
      const bqAccess = await checkBoutiqueAccess(idParam, req.user.userId);
      if (bqAccess) accessGranted = true;
    }
    if (!accessGranted) {
      const tokenToTest = terminal_token || req.headers['x-terminal-token'] || req.query.token;
      if (tokenToTest && boutique.caisse_token && boutique.caisse_token === tokenToTest) {
        accessGranted = true;
      }
    }
    if (!accessGranted && superviseur_pin) {
      const supCheck = await pool.query(
        `SELECT id FROM boutique_caissiers WHERE boutique_id = $1 AND code_pin = $2 AND actif = TRUE LIMIT 1`,
        [boutiqueId, String(superviseur_pin).trim()]
      );
      if (supCheck.rows[0]) accessGranted = true;
    }
    if (!accessGranted) {
      const { logSecurityViolation } = require('../../middlewares/tenantSecurity');
      logSecurityViolation({
        eventType: 'UNAUTHORIZED_POS_SALE_ATTEMPT',
        userId: req.user?.userId || null,
        tenantType: 'boutique',
        targetId: idParam,
        req,
        details: { reason: 'Tentative d\'encaissement POS sans autorisation' }
      });
      return res.status(403).json({ error: 'Accès refusé : session marchand ou jeton de caisse terminal requis.' });
    }

    console.log('[POS VENTE] ▶ Requête reçue:', { idParam, nbItems: saleItems.length, caissier, caissier_id, session_id, modePaiement, fidelite_client_id, hasIdempotency: !!idempotency_key });
    console.log('[POS VENTE] ✓ Boutique trouvée:', boutiqueId);
    const idempotencyKey = typeof idempotency_key === 'string' && idempotency_key.length > 0 && idempotency_key.length <= 128
      ? idempotency_key
      : null;

    // Validation multi-tenant du caissier_id
    let validCaissierId = null;
    let nomCaissierFinal = caissier || 'Caissier Principal';
    if (caissier_id && /^[0-9a-f-]{36}$/i.test(String(caissier_id))) {
      const cCheck = await pool.query(
        `SELECT id, nom, prenom FROM boutique_caissiers WHERE id = $1 AND boutique_id = $2 AND actif = TRUE LIMIT 1`,
        [caissier_id, boutiqueId]
      );
      if (cCheck.rows[0]) {
        validCaissierId = cCheck.rows[0].id;
        nomCaissierFinal = `${cCheck.rows[0].prenom || ''} ${cCheck.rows[0].nom || ''}`.trim() || nomCaissierFinal;
      }
    }

    // Une réponse peut être perdue après l'enregistrement d'une vente offline.
    // La même clé doit alors être reconnue avant toute nouvelle déduction de stock.
    if (idempotencyKey) {
      const existingSale = await pool.query(
        `SELECT reference FROM caisse_documents WHERE boutique_id = $1 AND reference = $2 LIMIT 1`,
        [boutiqueId, idempotencyKey]
      );
      if (existingSale.rows[0]) {
        return res.json({ success: true, duplicate: true, reference: existingSale.rows[0].reference });
      }
    }

    let client = null;
    if (client_id && /^[0-9a-f-]{36}$/i.test(client_id)) {
      const cRes = await pool.query(`SELECT id, nom, telephone, exonere_tva FROM caisse_clients_credits WHERE id=$1`, [client_id]);
      client = cRes.rows[0] || null;
    }

    const refVente = idempotencyKey || `POS-${Date.now().toString().slice(-6)}`;

    // T-082/064 : imposer le prix catalogue serveur pour tout article référencé.
    // L'accès par jeton permettait d'envoyer un prix client falsifié (ex: "1").
    // Les articles libres/hors-catalogue (sans id UUID valide) conservent leur prix saisi.
    for (const it of saleItems) {
      const itemId = it.id || it.produit_id;
      if (itemId && /^[0-9a-f-]{36}$/i.test(String(itemId))) {
        const pRes = await pool.query(
          'SELECT prix FROM boutique_produits WHERE id = $1 AND boutique_id = $2',
          [itemId, boutiqueId]
        );
        if (pRes.rows[0] && pRes.rows[0].prix != null) {
          it.prix = Number(pRes.rows[0].prix);
        }
      }
    }

    // Calcul fiscalité globale
    const calculation = calculerFiscaliteDocument(boutique, client, saleItems);

      // Calcul timbre fiscal
      let timbre = 0;
      if (boutique.timbre_fiscal_applicable && (modePaiement === 'cash' || modePaiement === 'especes')) {
        timbre = Number((calculation.total_ttc * 0.01).toFixed(2));
        if (timbre > 5000) timbre = 5000;
      }

      // Calcul BRS
      let retenueBRS = 0;
      if (req.body.appliquer_brs) {
        retenueBRS = Number((calculation.total_ht * 0.01).toFixed(2));
      }

      const netAPayer = calculation.total_ttc + timbre - retenueBRS;

      // ── TRANSACTION ATOMIQUE : stock + ventes + commandes + facture + session ──
      console.log('[POS VENTE] ✓ Calcul fiscal OK. ref:', refVente, 'netAPayer:', netAPayer, 'items:', calculation.items.length);
      let fideliteResult = null;
      const dbClient = await pool.connect();
      try {
        await dbClient.query('BEGIN');
        console.log('[POS VENTE] ✓ BEGIN transaction');

        // Résolution de la session active de la boutique
        let targetSessionId = null;
        if (session_id && /^[0-9a-f-]{36}$/i.test(String(session_id))) {
          const sCheck = await dbClient.query(
            `SELECT id FROM boutique_pos_sessions WHERE id = $1 AND boutique_id = $2 AND statut = 'ouverte' LIMIT 1`,
            [session_id, boutiqueId]
          );
          if (sCheck.rows[0]) {
            targetSessionId = sCheck.rows[0].id;
          }
        }
        if (!targetSessionId) {
          const activeSessionRes = await dbClient.query(
            `SELECT id FROM boutique_pos_sessions WHERE boutique_id = $1 AND statut = 'ouverte' ORDER BY date_ouverture DESC LIMIT 1`,
            [boutiqueId]
          );
          if (activeSessionRes.rows[0]) {
            targetSessionId = activeSessionRes.rows[0].id;
          }
        }

        for (let idx = 0; idx < calculation.items.length; idx++) {
          const item = calculation.items[idx];
          const qte = Number(item.quantite || 1);

          // 1. Décrémenter le stock dans la base PostgreSQL
          let pRes = null;
          if (item.id && /^[0-9a-f-]{36}$/i.test(item.id)) {
            pRes = await dbClient.query(
              `UPDATE boutique_produits
               SET stock_quantite = GREATEST(0, COALESCE(stock_quantite, 10) - $1),
                   en_stock = (GREATEST(0, COALESCE(stock_quantite, 10) - $1) > 0)
               WHERE id = $2 AND boutique_id = $3
               RETURNING id, nom, prix, stock_quantite, prix_achat`,
              [qte, item.id, boutiqueId]
            );
          }

          if (!pRes?.rows[0] && item.nom) {
            pRes = await dbClient.query(
              `UPDATE boutique_produits
               SET stock_quantite = GREATEST(0, COALESCE(stock_quantite, 10) - $1),
                   en_stock = (GREATEST(0, COALESCE(stock_quantite, 10) - $1) > 0)
               WHERE LOWER(nom) = LOWER($2) AND boutique_id = $3
               RETURNING id, nom, prix, stock_quantite, prix_achat`,
              [qte, item.nom.trim(), boutiqueId]
            );
          }

          const nomProduit = item.nom || pRes?.rows[0]?.nom || 'Article POS';
          const prixUnitaire = Number(item.prix_unitaire || pRes?.rows[0]?.prix || 0);
          const prixAchat = item.prix_achat !== undefined && item.prix_achat !== null
            ? Number(item.prix_achat)
            : (pRes?.rows[0]?.prix_achat ? Number(pRes.rows[0].prix_achat) : null);
          const totalLigne = prixUnitaire * qte;
          const prodIdReal = pRes?.rows[0]?.id || (item.id && /^[0-9a-f-]{36}$/i.test(item.id) ? item.id : null);
          const itemRef = calculation.items.length > 1 ? `${refVente}-${idx + 1}` : refVente;

          await dbClient.query(
            `INSERT INTO ventes (reference, boutique_id, produit_id, nom_produit, quantite, prix_unitaire, prix_achat, frais_livraison, montant_total, client_nom, methode_paiement, caissier_nom, caissier_id, session_id, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11, $12, $13, NOW())`,
            [
              itemRef,
              boutiqueId,
              prodIdReal,
              nomProduit,
              qte,
              prixUnitaire,
              prixAchat,
              totalLigne,
              nomCaissierFinal ? `Caisse POS (${nomCaissierFinal})` : 'Caisse POS',
              modePaiement || 'cash',
              nomCaissierFinal,
              validCaissierId,
              targetSessionId
            ]
          );
        }

        console.log('[POS VENTE] ✓ INSERT ventes OK pour', calculation.items.length, 'articles');
        // Insertion consolidée unique dans commandes_boutique
        const resumeNoms = calculation.items.map(i => `${i.nom} × ${i.quantite || 1}`).join(', ');
        const totalQteGlobale = calculation.items.reduce((acc, i) => acc + Number(i.quantite || 1), 0);
        await dbClient.query(
          `INSERT INTO commandes_boutique (reference, boutique_id, client_nom, client_telephone, statut, nom_produit, quantite, montant_total, methode_paiement, created_at)
           VALUES ($1, $2, $3, $4, 'livree', $5, $6, $7, $8, NOW())
           ON CONFLICT (reference) DO NOTHING`,
          [
            refVente,
            boutiqueId,
            nomCaissierFinal ? `Caisse POS (${nomCaissierFinal})` : 'Caisse POS',
            client?.telephone || 'POS',
            resumeNoms.slice(0, 200),
            totalQteGlobale,
            netAPayer,
            modePaiement || 'cash'
          ]
        );

        const validClientId = (client_id && /^[0-9a-f-]{36}$/i.test(String(client_id))) ? String(client_id) : null;

        await dbClient.query(
          `INSERT INTO caisse_documents (
            boutique_id, client_id, caissier_id, session_id, type, reference, statut,
            total_ht, total_tva, timbre_fiscal, retenue_brs, total_ttc, net_a_payer,
            mode_paiement, notes, items, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, 'facture', $5, 'paye', $6, $7, $8, $9, $10, $11, $12, 'Vente directe caisse POS', $13, NOW(), NOW())
          ON CONFLICT (reference) DO NOTHING`,
          [
            boutiqueId, validClientId, validCaissierId, targetSessionId, refVente,
            calculation.total_ht, calculation.total_tva, timbre, retenueBRS, calculation.total_ttc, netAPayer,
            modePaiement || 'cash', JSON.stringify(calculation.items)
          ]
        );

        console.log('[POS VENTE] ✓ INSERT commandes_boutique + caisse_documents OK');
        if (targetSessionId) {
          const mode = (modePaiement || 'cash').toLowerCase();
          let espAmt = 0;
          let waveAmt = 0;
          let omAmt = 0;
          let carteAmt = 0;

          if (mode === 'mixte') {
            espAmt = Number(req.body.especes_mixte) || 0;
            const digitalAmt = Number(req.body.montant_mixte2) || Math.max(0, netAPayer - espAmt);
            const secondMode = (req.body.second_mode_mixte || 'wave').toLowerCase();
            if (secondMode === 'wave') waveAmt = digitalAmt;
            else if (secondMode === 'om' || secondMode === 'orange_money' || secondMode === 'orange') omAmt = digitalAmt;
            else if (secondMode === 'carte' || secondMode === 'cb') carteAmt = digitalAmt;
          } else {
            const isEspeces = mode === 'cash' || mode === 'especes' || mode === 'espece';
            const isWave = mode === 'wave';
            const isOm = mode === 'om' || mode === 'orange_money' || mode === 'orange';
            const isCarte = mode === 'carte' || mode === 'cb';

            if (isEspeces) espAmt = netAPayer;
            if (isWave) waveAmt = netAPayer;
            if (isOm) omAmt = netAPayer;
            if (isCarte) carteAmt = netAPayer;
          }

          await dbClient.query(
            `UPDATE boutique_pos_sessions
             SET ventes_total = COALESCE(ventes_total, 0) + $1,
                 nb_ventes = COALESCE(nb_ventes, 0) + 1,
                 ventes_especes = COALESCE(ventes_especes, 0) + $2,
                 ventes_wave = COALESCE(ventes_wave, 0) + $3,
                 ventes_orange_money = COALESCE(ventes_orange_money, 0) + $4,
                 ventes_carte = COALESCE(ventes_carte, 0) + $5
             WHERE id = $6`,
            [
              netAPayer,
              espAmt,
              waveAmt,
              omAmt,
              carteAmt,
              targetSessionId
            ]
          );
        }

        // ── Comptabilisation Fidélité Client (Cashback / Tampons / Points) ──
        fideliteResult = null;
        const targetFideliteId = fidelite_client_id && /^[0-9a-f-]{36}$/i.test(String(fidelite_client_id)) ? String(fidelite_client_id) : null;
        let fidClientRow = null;

        if (targetFideliteId) {
          const fcRes = await dbClient.query(
            `SELECT * FROM boutique_clients_fidelite WHERE id = $1 AND boutique_id = $2 FOR UPDATE`,
            [targetFideliteId, boutiqueId]
          );
          fidClientRow = fcRes.rows[0] || null;
        } else if (client?.telephone) {
          const fcRes = await dbClient.query(
            `SELECT * FROM boutique_clients_fidelite WHERE boutique_id = $1 AND (telephone = $2 OR telephone = $3) FOR UPDATE`,
            [boutiqueId, client.telephone.trim(), client.telephone.trim().replace(/^221/, '')]
          );
          fidClientRow = fcRes.rows[0] || null;
        }

        if (fidClientRow) {
          const isFideliteActive = boutique.fidelite_actif !== false;
          const fidType = boutique.fidelite_type || 'cagnotte';
          const tauxCashback = Number(boutique.fidelite_taux_cashback !== undefined ? boutique.fidelite_taux_cashback : 3.00);
          const seuilTampon = Number(boutique.fidelite_seuil_tampon || 2000);

          let gainCashback = 0;
          let gainTampons = 0;
          const gainPoints = Math.max(1, Math.floor(netAPayer / 100));

          if (isFideliteActive) {
            if (fidType === 'tampons') {
              gainTampons = Math.floor(netAPayer / Math.max(1, seuilTampon));
            } else {
              gainCashback = Math.round(netAPayer * (tauxCashback / 100));
            }
          }

          // Déduction cagnotte si demandée
          const montantDeduit = Math.max(0, Math.min(Number(deduction_cagnotte_fcfa) || 0, Number(fidClientRow.cagnotte_fcfa || 0)));

          const nouveauCumulDepense = Number(fidClientRow.total_depense || 0) + netAPayer;
          const nouveauNbVisites = Number(fidClientRow.nb_visites || 0) + 1;
          const nouvelleCagnotte = Math.max(0, Number(fidClientRow.cagnotte_fcfa || 0) - montantDeduit + gainCashback);
          const nouveauxPoints = Number(fidClientRow.points_solde || 0) + gainPoints;
          const nouveauxTampons = Number(fidClientRow.tampons_actuels || 0) + gainTampons;

          let nouveauRang = 'bronze';
          if (nouveauCumulDepense >= 500000) nouveauRang = 'vip';
          else if (nouveauCumulDepense >= 200000) nouveauRang = 'or';
          else if (nouveauCumulDepense >= 50000) nouveauRang = 'argent';

          await dbClient.query(
            `UPDATE boutique_clients_fidelite
             SET cagnotte_fcfa = $1,
                 points_solde = $2,
                 tampons_actuels = $3,
                 total_depense = $4,
                 nb_visites = $5,
                 rang_fidelite = $6,
                 derniere_visite = NOW(),
                 updated_at = NOW()
             WHERE id = $7`,
            [nouvelleCagnotte, nouveauxPoints, nouveauxTampons, nouveauCumulDepense, nouveauNbVisites, nouveauRang, fidClientRow.id]
          );

          if (gainCashback > 0 || gainTampons > 0) {
            await dbClient.query(
              `INSERT INTO boutique_fidelite_mouvements (boutique_id, client_fidelite_id, vente_reference, type_mouvement, valeur_fcfa, points, description)
               VALUES ($1, $2, $3, 'credit_achat', $4, $5, $6)`,
              [boutiqueId, fidClientRow.id, refVente, gainCashback, gainPoints, `Gain fidélité sur vente POS ${refVente}`]
            );
          }

          if (montantDeduit > 0) {
            await dbClient.query(
              `INSERT INTO boutique_fidelite_mouvements (boutique_id, client_fidelite_id, vente_reference, type_mouvement, valeur_fcfa, points, description)
               VALUES ($1, $2, $3, 'debit_utilisation', $4, 0, $5)`,
              [boutiqueId, fidClientRow.id, refVente, montantDeduit, `Déduction cagnotte sur vente POS ${refVente}`]
            );
          }

          fideliteResult = {
            clientId: fidClientRow.id,
            nom: fidClientRow.nom,
            cagnotte: nouvelleCagnotte,
            gainCashback,
            gainTampons,
            montantDeduit,
            rang: nouveauRang
          };
        }

        await dbClient.query('COMMIT');

        // Analytics POS : enregistrement asynchrone non bloquant pour le tableau de bord
        pool.query(
          `INSERT INTO analytics_events (type, boutique_id) VALUES ('vente_pos', $1)`,
          [boutiqueId]
        ).catch(e => console.warn('[ANALYTICS POS]', e.message));
      } catch (txErr) {
        await dbClient.query('ROLLBACK');
        console.error('[POS VENTE TX ROLLBACK]', txErr.code, txErr.message, txErr.detail || '');
        throw txErr;
      } finally {
        dbClient.release();
      }

      res.status(201).json({
        success: true,
        message: 'Stock, Comptabilité et Facture POS sauvegardés',
        reference: refVente,
        fidelite: fideliteResult
      });
  } catch (err) {
    console.error('[BOUTIQUE POS VENTE ERREUR]', err.code, err.message, err.detail || '', err.stack?.split('\n').slice(0, 5).join(' | '));
    res.status(500).json({
      error: 'Erreur serveur',
      detail: `[${err.code || 'ERR'}] ${err.message}`
    });
  }
});

// ── POST /api/boutiques/:id/pos-incident — Annuler ou rembourser une vente POS
router.post('/:id/pos-incident', tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const { ticketId, type, items, terminal_token, superviseur_pin } = req.body;

    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(
      `SELECT id, utilisateur_id, caisse_token FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`,
      [idParam]
    );
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutique = bRes.rows[0];
    const boutiqueId = boutique.id;

    // Contrôle d'accès strict
    let accessGranted = false;
    if (req.user?.userId) {
      const bqAccess = await checkBoutiqueAccess(idParam, req.user.userId);
      if (bqAccess) accessGranted = true;
    }
    if (!accessGranted) {
      const tokenToTest = terminal_token || req.headers['x-terminal-token'] || req.query.token;
      if (tokenToTest && boutique.caisse_token && boutique.caisse_token === tokenToTest) {
        accessGranted = true;
      }
    }
    if (!accessGranted && superviseur_pin) {
      const supCheck = await pool.query(
        `SELECT id FROM boutique_caissiers WHERE boutique_id = $1 AND code_pin = $2 AND actif = TRUE LIMIT 1`,
        [boutiqueId, String(superviseur_pin).trim()]
      );
      if (supCheck.rows[0]) accessGranted = true;
    }
    if (!accessGranted) {
      const { logSecurityViolation } = require('../../middlewares/tenantSecurity');
      logSecurityViolation({
        eventType: 'UNAUTHORIZED_POS_INCIDENT_ATTEMPT',
        userId: req.user?.userId || null,
        tenantType: 'boutique',
        targetId: idParam,
        req,
        details: { reason: 'Tentative d\'annulation de vente POS non autorisée' }
      });
      return res.status(403).json({ error: 'Accès refusé : autorisation requise pour modifier les ventes.' });
    }

    if (!ticketId) return res.status(400).json({ error: 'ID ticket manquant' });

    const posService = require('../../services/pos-service');
    const result = await posService.annulerVentePos({ boutiqueId, ticketId, items });
    res.json(result);
  } catch (err) {
    console.error('[POS INCIDENT ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/boutiques/:id/pos-historique — Historique des ventes de caisse (Sécurisé)
router.get('/:id/pos-historique', tokenOptional, param('id').isUUID(), async (req, res) => {
  try {
    const { id } = req.params;

    const bRes = await pool.query('SELECT id, caisse_token FROM boutiques WHERE id = $1', [id]);
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutique = bRes.rows[0];

    let accessGranted = false;
    if (req.user?.userId) {
      const bqAccess = await checkBoutiqueAccess(id, req.user.userId);
      if (bqAccess) accessGranted = true;
    }
    if (!accessGranted) {
      const tokenToTest = req.headers['x-terminal-token'] || req.query.terminal_token || req.query.token;
      if (tokenToTest && boutique.caisse_token && boutique.caisse_token === tokenToTest) {
        accessGranted = true;
      }
    }

    if (!accessGranted) {
      const { logSecurityViolation } = require('../../middlewares/tenantSecurity');
      logSecurityViolation({
        eventType: 'UNAUTHORIZED_POS_HISTORY_ACCESS',
        userId: req.user?.userId || null,
        tenantType: 'boutique',
        targetId: id,
        req,
        details: { reason: 'Tentative de lecture non autorisée de l\'historique des ventes POS' }
      });
      return res.status(403).json({ error: 'Accès refusé : session marchand ou jeton de caisse terminal requis' });
    }

    const { rows } = await pool.query(
      `SELECT reference AS id,
              TO_CHAR(created_at, 'DD/MM/YYYY') AS date,
              TO_CHAR(created_at, 'HH24:MI') AS heure,
              COALESCE(client_nom, 'Caisse POS') AS caissier,
              COALESCE(methode_paiement, 'cash') AS "modePaiement",
              montant_total AS total,
              'validee' AS statut,
              nom_produit AS "nomProduit",
              quantite,
              prix_unitaire AS "prixUnitaire"
       FROM ventes
       WHERE boutique_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [id]
    );

    const mapTickets = new Map();
    for (const r of rows) {
      if (!mapTickets.has(r.id)) {
        mapTickets.set(r.id, {
          id: r.id,
          date: r.date,
          heure: r.heure,
          caissier: r.caissier,
          modePaiement: r.modePaiement,
          total: Number(r.total),
          statut: 'validee',
          ticket: [],
        });
      }
      const t = mapTickets.get(r.id);
      t.ticket.push({
        produit: { id: r.id, nom: r.nomProduit, prix: Number(r.prixUnitaire), stock: 99, categorie: null },
        quantite: Number(r.quantite),
        prixUnitaire: Number(r.prixUnitaire),
      });
    }

    res.json(Array.from(mapTickets.values()));
  } catch (err) {
    console.error('[BOUTIQUE POS HISTORIQUE ERR]', err);
    res.json([]);
  }
});

// ── 👥 GESTION DES CAISSIERS ET SESSIONS DE CAISSE POS ─────────────────────────

// GET /api/boutiques/:id/caissiers — Gestion des caissiers avec code_pin pour validation POS locale
router.get('/:id/pos-sessions', verifierToken, async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé aux sessions de caisse de cette boutique' });
    }
    const boutiqueId = b.id;

    const { limit = 100, page = 1, from, to, caissier, statut } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conds = ['boutique_id = $1'];
    const params = [boutiqueId];

    if (from) {
      params.push(from);
      conds.push(`date_ouverture >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conds.push(`date_ouverture <= $${params.length}`);
    }
    if (caissier) {
      params.push(caissier);
      conds.push(`(caissier_nom = $${params.length} OR caissier_id::text = $${params.length})`);
    }
    if (statut && statut !== 'tous') {
      params.push(statut);
      conds.push(`statut = $${params.length}`);
    }

    params.push(Number(limit));
    params.push(offset);

    const { rows } = await pool.query(
      `SELECT * FROM boutique_pos_sessions 
       WHERE ${conds.join(' AND ')} 
       ORDER BY date_ouverture DESC 
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ sessions: rows });
  } catch (err) {
    console.error('[GET ALL SESSIONS ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des sessions de caisse' });
  }
});

// GET /api/boutiques/:id/pos-sessions/active — Session en cours
router.get('/:id/pos-sessions/active', verifierToken, async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé à la session active de cette boutique' });
    }
    const boutiqueId = b.id;

    const r = await pool.query(
      `SELECT * FROM boutique_pos_sessions 
       WHERE boutique_id = $1 AND statut = 'ouverte'
       ORDER BY date_ouverture DESC LIMIT 1`,
      [boutiqueId]
    );

    res.json({ session: r.rows[0] || null });
  } catch (err) {
    console.error('[GET ACTIVE SESSION ERR]', err);
    res.status(500).json({ error: 'Erreur de récupération de la session active' });
  }
});

// GET /api/boutiques/:id/pos-sessions/:sessionId — Détail et ventes d'une session
router.get('/:id/pos-sessions/:sessionId', verifierToken, async (req, res) => {
  try {
    const { id: idParam, sessionId } = req.params;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé à cette session de caisse' });
    }
    const boutiqueId = b.id;

    const sRes = await pool.query(
      `SELECT * FROM boutique_pos_sessions WHERE id = $1 AND boutique_id = $2`,
      [sessionId, boutiqueId]
    );
    if (!sRes.rows[0]) return res.status(404).json({ error: 'Session introuvable' });
    const session = sRes.rows[0];

    // Récupérer les ventes enregistrées durant cette session (par session_id direct ou bornes temporelles)
    const dateFin = session.date_cloture || new Date();
    const vRes = await pool.query(
      `SELECT * FROM ventes 
       WHERE boutique_id = $1 
         AND (
           session_id = $2 
           OR (session_id IS NULL AND created_at >= $3 AND created_at <= $4)
         )
         AND archivee IS NOT TRUE
       ORDER BY created_at ASC`,
      [boutiqueId, sessionId, session.date_ouverture, dateFin]
    );

    res.json({ session, ventes: vRes.rows });
  } catch (err) {
    console.error('[GET SESSION DETAIL ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la récupération du détail de session' });
  }
});

// Helper pour vérifier si la boutique a un abonnement Pro/Business actif
async function verifierAbonnementCaisse(boutiqueId) {
  const { rows } = await pool.query(
    `SELECT a.plan
     FROM abonnements a
     JOIN boutiques b ON b.utilisateur_id = a.utilisateur_id
     WHERE b.id = $1 AND a.statut = 'actif' AND a.fin > NOW()
     LIMIT 1`,
    [boutiqueId]
  );
  return rows[0]?.plan || null;
}

// POST /api/boutiques/:id/pos-sessions/ouvrir
router.post('/:id/pos-sessions/ouvrir', verifierToken, async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé pour ouvrir une session sur cette boutique' });
    }
    const boutiqueId = b.id;
    const { caissierNom, fondDeCaisse, caissierId } = req.body;

    const plan = await verifierAbonnementCaisse(boutiqueId);
    if (!plan) {
      return res.status(403).json({ error: 'Un abonnement Pro ou Business actif est requis pour ouvrir la caisse POS.' });
    }

    // Validation multi-tenant du caissier_id si fourni
    let validCaissierId = null;
    let nomCaissierFinal = caissierNom || 'Caissier';
    if (caissierId && /^[0-9a-f-]{36}$/i.test(String(caissierId))) {
      const cCheck = await pool.query(
        `SELECT id, nom, prenom FROM boutique_caissiers WHERE id = $1 AND boutique_id = $2 AND actif = TRUE LIMIT 1`,
        [caissierId, boutiqueId]
      );
      if (cCheck.rows[0]) {
        validCaissierId = cCheck.rows[0].id;
        nomCaissierFinal = `${cCheck.rows[0].prenom || ''} ${cCheck.rows[0].nom || ''}`.trim() || nomCaissierFinal;
      }
    }

    const r = await pool.query(
      `INSERT INTO boutique_pos_sessions (boutique_id, caissier_id, caissier_nom, fond_caisse_initial, date_ouverture, statut)
       VALUES ($1, $2, $3, $4, NOW(), 'ouverte')
       RETURNING *`,
      [boutiqueId, validCaissierId, nomCaissierFinal, Number(fondDeCaisse || 0)]
    );

    // Enregistrement dans le Journal d'Audit & Sécurité
    await enregistrerAuditLog(
      boutiqueId,
      req.user?.userId,
      nomCaissierFinal,
      'pos_session',
      `Ouverture de session de caisse POS par ${nomCaissierFinal} (Fond initial: ${fondDeCaisse || 0} FCFA)`,
      { fondDeCaisse, caissierNom: nomCaissierFinal, caissierId: validCaissierId, sessionId: r.rows[0]?.id },
      req
    );

    res.status(201).json({ success: true, session: r.rows[0] });
  } catch (err) {
    console.error('[POST POS SESSION OUVRIR ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l’ouverture de session' });
  }
});

// POST /api/boutiques/:id/pos-sessions/cloturer
router.post('/:id/pos-sessions/cloturer', verifierToken, async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé pour clôturer une session sur cette boutique' });
    }
    const boutiqueId = b.id;

    const targetSessionId = req.body.sessionId || req.body.session_id || req.params.sessionId;
    const countedCash = req.body.especesComptees ?? req.body.especes_comptees ?? req.body.montant_reel;
    const vEspeces = req.body.ventesEspeces ?? req.body.ventes_especes;
    const vWave = req.body.ventesWave ?? req.body.ventes_wave;
    const vOM = req.body.ventesOrangeMoney ?? req.body.ventes_orange_money;
    const vCarte = req.body.ventesCarte ?? req.body.ventes_carte;
    const vTotal = req.body.ventesTotal ?? req.body.ventes_total;
    const nVentes = req.body.nbVentes ?? req.body.nb_ventes;
    const cNom = req.body.caissierNom || req.body.caissier_nom;

    if (targetSessionId && /^[0-9a-f-]{36}$/i.test(targetSessionId)) {
      // Réconciliation comptable SQL directe sur la session
      const aggRes = await pool.query(
        `SELECT 
           COALESCE(SUM(montant_total), 0) AS sql_total,
           COUNT(*) AS sql_nb,
           COALESCE(SUM(CASE WHEN LOWER(methode_paiement) IN ('cash', 'especes', 'espece') THEN montant_total ELSE 0 END), 0) AS sql_especes,
           COALESCE(SUM(CASE WHEN LOWER(methode_paiement) = 'wave' THEN montant_total ELSE 0 END), 0) AS sql_wave,
           COALESCE(SUM(CASE WHEN LOWER(methode_paiement) IN ('om', 'orange_money', 'orange') THEN montant_total ELSE 0 END), 0) AS sql_om,
           COALESCE(SUM(CASE WHEN LOWER(methode_paiement) IN ('carte', 'cb') THEN montant_total ELSE 0 END), 0) AS sql_carte
         FROM ventes
         WHERE boutique_id = $1 AND session_id = $2 AND archivee IS NOT TRUE`,
        [boutiqueId, targetSessionId]
      );
      const agg = aggRes.rows[0] || {};
      const finalTotal = Number(agg.sql_nb) > 0 ? Number(agg.sql_total) : Number(vTotal || 0);
      const finalNb = Number(agg.sql_nb) > 0 ? Number(agg.sql_nb) : Number(nVentes || 0);
      const finalEspeces = Number(agg.sql_nb) > 0 ? Number(agg.sql_especes) : Number(vEspeces || 0);
      const finalWave = Number(agg.sql_nb) > 0 ? Number(agg.sql_wave) : Number(vWave || 0);
      const finalOM = Number(agg.sql_nb) > 0 ? Number(agg.sql_om) : Number(vOM || 0);
      const finalCarte = Number(agg.sql_nb) > 0 ? Number(agg.sql_carte) : Number(vCarte || 0);

      const updRes = await pool.query(
        `UPDATE boutique_pos_sessions
         SET date_cloture = NOW(),
             statut = 'cloturee',
             especes_comptees = $1,
             ventes_especes = $2,
             ventes_wave = $3,
             ventes_orange_money = $4,
             ventes_carte = $5,
             ventes_total = $6,
             nb_ventes = $7,
             ecart_caisse = ($1 - (fond_caisse_initial + $2 + COALESCE(total_entrees_especes, 0) - COALESCE(total_sorties_especes, 0)))
         WHERE id = $8 AND boutique_id = $9
         RETURNING *`,
        [
          Number(countedCash || 0),
          finalEspeces,
          finalWave,
          finalOM,
          finalCarte,
          finalTotal,
          finalNb,
          targetSessionId,
          boutiqueId
        ]
      );

      // Enregistrement dans le Journal d'Audit & Sécurité
      await enregistrerAuditLog(
        boutiqueId,
        req.user?.userId,
        cNom || updRes.rows[0]?.caissier_nom || 'Caissier',
        'pos_session',
        `Clôture Z de la session de caisse POS par ${cNom || updRes.rows[0]?.caissier_nom || 'Caissier'} (Espèces comptées: ${countedCash || 0} FCFA, Ventes totales: ${finalTotal} FCFA, Tickets: ${finalNb})`,
        { sessionId: targetSessionId, especesComptees: countedCash, ventesTotal: finalTotal, nbVentes: finalNb, ecart: updRes.rows[0]?.ecart_caisse, caissierNom: cNom },
        req
      );
    }

    res.json({ success: true, message: 'Session clôturée avec succès' });
  } catch (err) {
    console.error('[POST POS SESSION CLOTURER ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la clôture de session' });
  }
});

// GET /api/boutiques/:id/pos-sessions/:sessionId/mouvements — Mouvements du tiroir-caisse
router.get('/:id/pos-sessions/:sessionId/mouvements', verifierToken, async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé aux mouvements de caisse' });
    }
    const boutiqueId = b.id;
    const sessionId = req.params.sessionId;

    const mouvRes = await pool.query(
      `SELECT * FROM boutique_pos_mouvements_caisse 
       WHERE boutique_id = $1 AND session_id = $2 
       ORDER BY created_at DESC`,
      [boutiqueId, sessionId]
    );

    res.json({ success: true, mouvements: mouvRes.rows });
  } catch (err) {
    console.error('[GET POS MOUVEMENTS ERR]', err);
    res.status(500).json({ error: 'Erreur récupération mouvements de caisse' });
  }
});

// POST /api/boutiques/:id/pos-sessions/:sessionId/mouvements — Entrée ou Sortie d'espèces
router.post('/:id/pos-sessions/:sessionId/mouvements', verifierToken, async (req, res) => {
  try {
    const idParam = req.params.id;
    const b = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!b && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès non autorisé pour enregistrer un mouvement de caisse' });
    }
    const boutiqueId = b.id;
    const sessionId = req.params.sessionId;
    const { type, montant, motif, beneficiaire, caissier_nom } = req.body;

    if (!type || !['entree', 'sortie'].includes(type)) {
      return res.status(400).json({ error: 'Type invalide (entree ou sortie requis)' });
    }
    const montantNum = Number(montant);
    if (!montantNum || montantNum <= 0) {
      return res.status(400).json({ error: 'Montant supérieur à 0 requis' });
    }
    if (!motif || !motif.trim()) {
      return res.status(400).json({ error: 'Motif obligatoire' });
    }

    // Insérer le mouvement
    const insRes = await pool.query(
      `INSERT INTO boutique_pos_mouvements_caisse 
       (boutique_id, session_id, type, montant, motif, beneficiaire, caissier_nom)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [boutiqueId, sessionId, type, montantNum, motif.trim(), beneficiaire?.trim() || null, caissier_nom || 'Caissier']
    );

    // Mettre à jour les totaux sur la session
    if (type === 'entree') {
      await pool.query(
        `UPDATE boutique_pos_sessions 
         SET total_entrees_especes = COALESCE(total_entrees_especes, 0) + $1 
         WHERE id = $2 AND boutique_id = $3`,
        [montantNum, sessionId, boutiqueId]
      );
    } else {
      await pool.query(
        `UPDATE boutique_pos_sessions 
         SET total_sorties_especes = COALESCE(total_sorties_especes, 0) + $1 
         WHERE id = $2 AND boutique_id = $3`,
        [montantNum, sessionId, boutiqueId]
      );
    }

    // Audit log
    await enregistrerAuditLog(
      boutiqueId,
      req.user?.userId,
      caissier_nom || 'Caissier',
      'pos_tiroir',
      `Mouvement tiroir-caisse ${type.toUpperCase()} de ${montantNum} FCFA (${motif.trim()})`,
      { sessionId, type, montant: montantNum, motif: motif.trim(), beneficiaire },
      req
    );

    res.json({ success: true, mouvement: insRes.rows[0] });
  } catch (err) {
    console.error('[POST POS MOUVEMENTS ERR]', err);
    res.status(500).json({ error: 'Erreur enregistrement mouvement de caisse' });
  }
});

// POST /api/boutiques/:id/pos-sessions/rapport-x/log
router.post('/:id/pos-sessions/rapport-x/log', tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const { caissierNom, totalVentes, nbVentes, terminal_token } = req.body;
    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(`SELECT id, caisse_token FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`, [idParam]);
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutique = bRes.rows[0];
    const boutiqueId = boutique.id;

    let accessGranted = false;
    if (req.user?.userId) {
      const bqAccess = await checkBoutiqueAccess(idParam, req.user.userId);
      if (bqAccess) accessGranted = true;
    }
    if (!accessGranted) {
      const tokenToTest = terminal_token || req.headers['x-terminal-token'] || req.query.token;
      if (tokenToTest && boutique.caisse_token && boutique.caisse_token === tokenToTest) {
        accessGranted = true;
      }
    }
    if (!accessGranted) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    await enregistrerAuditLog(
      boutiqueId,
      req.user?.userId,
      caissierNom || 'Caissier',
      'pos_session',
      `Consultation / Impression du Bilan de Session Rapport X (Caissier: ${caissierNom || 'Caissier'}, CA cumulé: ${totalVentes || 0} FCFA, Tickets: ${nbVentes || 0})`,
      { caissierNom, totalVentes, nbVentes },
      req
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[POST POS SESSION RAPPORT-X LOG ERR]', err);
    res.status(500).json({ error: 'Erreur journalisation Rapport X' });
  }
});

// --- HELPER CALCUL FISCALITÉ ---
function calculerFiscaliteDocument(boutique, client, items) {
  const regime = boutique.regime_fiscal || 'reel';
  const tvaIncluse = boutique.prix_tva_incluse !== false;
  const tvaDefaut = Number(boutique.tva_taux_defaut ?? 18.00);
  
  let totalHT = 0;
  let totalTVA = 0;
  
  const processedItems = items.map(item => {
    const qte = Number(item.quantite || 1);
    const prix = Number(item.prix || 0);
    const itemTvaTaux = item.tva_taux !== undefined && item.tva_taux !== null ? Number(item.tva_taux) : tvaDefaut;
    
    let HT = 0;
    let TVA = 0;
    let TTC = 0;
    
    if (regime === 'non_assujetti' || regime === 'exonere' || (client && client.exonere_tva)) {
      TTC = prix;
      HT = prix;
      TVA = 0;
    } else {
      if (tvaIncluse) {
        TTC = prix;
        HT = TTC / (1 + (itemTvaTaux / 100));
        TVA = TTC - HT;
      } else {
        HT = prix;
        TVA = HT * (itemTvaTaux / 100);
        TTC = HT + TVA;
      }
    }
    
    totalHT += HT * qte;
    totalTVA += TVA * qte;
    
    const validId = (item.id && /^[0-9a-f-]{36}$/i.test(String(item.id))) ? String(item.id) : null;
    return {
      id: validId,
      nom: item.nom || 'Article',
      quantite: qte,
      prix_unitaire: prix,
      prix_ht: Number(HT.toFixed(2)),
      tva_taux: itemTvaTaux,
      tva_montant: Number(TVA.toFixed(2)),
      total_ligne: Number((TTC * qte).toFixed(2))
    };
  });
  
  const totalTTC = totalHT + totalTVA;
  
  return {
    items: processedItems,
    total_ht: Number(totalHT.toFixed(2)),
    total_tva: Number(totalTVA.toFixed(2)),
    total_ttc: Number(totalTTC.toFixed(2))
  };
}

// ── GET /api/boutiques/:id/documents — Lister les documents
router.get('/caisse-terminal/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ error: 'Jeton requis' });

    // T-080/110 : le terminal ne s'amorce QUE via le jeton de caisse dédié (caisse_token),
    // jamais via l'UUID public ni le slug de la boutique (tous deux exposés publiquement).
    const bRes = await pool.query(
      `SELECT id, nom, logo_url, telephone, adresse, ville, caisse_token, regime_fiscal, prix_tva_incluse, timbre_fiscal_applicable, tva_taux_defaut, COALESCE(actif, true) AS actif
       FROM boutiques WHERE caisse_token = $1`,
      [token]
    );
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Terminal caisse introuvable' });
    const boutique = bRes.rows[0];

    if (boutique.actif === false) {
      await pool.query('UPDATE boutiques SET actif = TRUE WHERE id = $1', [boutique.id]);
      boutique.actif = true;
    }

    const plan = await verifierAbonnementCaisse(boutique.id);
    boutique.plan_actif = plan || 'pro';

    // SÉCURITÉ P0 : Exclusion absolue du code_pin dans la liste des caissiers transmise au client
    let cRes = await pool.query(
      `SELECT id, nom, prenom, code_pin, role FROM boutique_caissiers WHERE boutique_id = $1 AND actif = TRUE ORDER BY nom`,
      [boutique.id]
    );

    let caissiers = cRes.rows;
    if (caissiers.length === 0) {
      const defC = await pool.query(
        `INSERT INTO boutique_caissiers (boutique_id, nom, prenom, code_pin, role)
         VALUES ($1, 'Bamba', 'Caissier 1', '1234', 'caissier'),
                ($1, 'Superviseur', 'Gérant', '9999', 'superviseur')
         RETURNING id, nom, prenom, code_pin, role`,
        [boutique.id]
      );
      caissiers = defC.rows;
    }

    const pRes = await pool.query(
      `SELECT p.id, p.nom, p.description, p.prix, p.prix_barre, p.images, p.en_stock, p.ordre, p.categorie, p.caracteristiques, p.stock_quantite, p.variantes, p.code_barre
       FROM boutique_produits p
       WHERE p.boutique_id = $1
       ORDER BY p.ordre ASC, p.created_at DESC`,
      [boutique.id]
    );

    res.json({
      success: true,
      boutique,
      planActif: plan || 'pro',
      caissiers,
      produits: pRes.rows
    });
  } catch (err) {
    console.error('[GET CAISSE TERMINAL ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l\'accès au terminal' });
  }
});

// POST /api/boutiques/:id/regenere-caisse-token
router.post('/:id/regenere-caisse-token', verifierToken, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const crypto = require('crypto');
    const newToken = crypto.randomUUID();
    await pool.query('UPDATE boutiques SET caisse_token = $1 WHERE id = $2', [newToken, bq.id]);

    await enregistrerAuditLog(bq.id, req.user.userId, req.user.nom, 'token_regenere', 'Régénération de la clé de terminal caisse POS', {}, req);

    res.json({ success: true, caisse_token: newToken });
  } catch (err) {
    console.error('[REGENERE TOKEN ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation de la clef' });
  }
});

router.get('/:id/pos-regles-remises', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nom, 
              COALESCE(pos_remise_max_caissier, 10.00) AS pos_remise_max_caissier,
              COALESCE(pos_remise_seuil_auto_montant, 0) AS pos_remise_seuil_auto_montant,
              COALESCE(pos_remise_seuil_auto_pct, 0) AS pos_remise_seuil_auto_pct,
              COALESCE(pos_remise_motifs, '[{"id":"anti_gaspi","nom":"🍌 Date courte / Anti-gaspi","pct":30},{"id":"defaut","nom":"📦 Défaut emballage","pct":15},{"id":"personnel","nom":"👥 Personnel / Employé","pct":10},{"id":"geste","nom":"👑 Geste commercial","pct":5}]'::jsonb) AS pos_remise_motifs,
              COALESCE(fidelite_actif, true) AS fidelite_actif,
              COALESCE(fidelite_taux_cashback, 3.00) AS fidelite_taux_cashback
       FROM boutiques WHERE id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    res.json({ ok: true, regles: rows[0] });
  } catch (err) {
    console.error('[GET POS REGLES REMISES ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des règles de remises' });
  }
});

// ── PUT /api/boutiques/:id/pos-regles-remises — Mise à jour des règles de remises POS
router.put('/:id/pos-regles-remises', verifierToken, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const {
      pos_remise_max_caissier,
      pos_remise_seuil_auto_montant,
      pos_remise_seuil_auto_pct,
      pos_remise_motifs
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE boutiques
       SET pos_remise_max_caissier = COALESCE($1, pos_remise_max_caissier, 10.00),
           pos_remise_seuil_auto_montant = COALESCE($2, pos_remise_seuil_auto_montant, 0),
           pos_remise_seuil_auto_pct = COALESCE($3, pos_remise_seuil_auto_pct, 0),
           pos_remise_motifs = COALESCE($4, pos_remise_motifs),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, pos_remise_max_caissier, pos_remise_seuil_auto_montant, pos_remise_seuil_auto_pct, pos_remise_motifs`,
      [
        pos_remise_max_caissier !== undefined ? Number(pos_remise_max_caissier) : null,
        pos_remise_seuil_auto_montant !== undefined ? Number(pos_remise_seuil_auto_montant) : null,
        pos_remise_seuil_auto_pct !== undefined ? Number(pos_remise_seuil_auto_pct) : null,
        pos_remise_motifs ? JSON.stringify(pos_remise_motifs) : null,
        bq.id
      ]
    );

    res.json({ ok: true, regles: rows[0], message: 'Règles de remises enregistrées avec succès.' });
  } catch (err) {
    console.error('[PUT POS REGLES REMISES ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l’enregistrement des règles de remises' });
  }
});

// ── GET /api/boutiques/:id/export-complet — Portabilité Totale : Exporter toute la boutique en 1 Clic
module.exports = router;
