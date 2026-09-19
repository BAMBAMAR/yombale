// backend/routes/kalpe.js
// SAMA XAALIS — Module Transversal de Gestion Simple de l'Argent
const router = require('express').Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');

// Toutes les routes exigent une authentification stricte
router.use(verifierToken);

// Helper : formatage de référence unique
function genRef(prefix = 'SX') {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

// ── 1. GET /api/kalpe/etat — Statut du compte Sama Xaalis de l'utilisateur
router.get('/etat', async (req, res) => {
  try {
    const userId = req.user.userId;

    const { rows } = await pool.query(
      `SELECT * FROM kalpe_abonnements WHERE utilisateur_id = $1 LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        actif: false,
        abonnement: null,
      });
    }

    const abo = rows[0];
    const estActif = abo.statut === 'actif' && new Date(abo.fin) > new Date();

    // Récupérer s'il possède une boutique pour pré-configurer le mode contexte
    const bqRes = await pool.query(
      `SELECT id, nom, slug FROM boutiques WHERE utilisateur_id = $1 LIMIT 1`,
      [userId]
    );

    res.json({
      success: true,
      actif: estActif,
      abonnement: abo,
      hasBoutique: bqRes.rows.length > 0,
      boutique: bqRes.rows[0] || null,
    });
  } catch (err) {
    console.error('[KALPE_ETAT_ERR]', err);
    res.status(500).json({ error: 'Erreur serveur lors de la vérification de Sama Xaalis' });
  }
});

// ── 2. POST /api/kalpe/activer — Activation 1-Tap de Sama Xaalis
router.post('/activer', async (req, res) => {
  try {
    const userId = req.user.userId;

    const { rows } = await pool.query(
      `INSERT INTO kalpe_abonnements (utilisateur_id, statut, type_acces, is_trial, debut, fin)
       VALUES ($1, 'actif', 'standard', true, NOW(), NOW() + INTERVAL '365 days')
       ON CONFLICT (utilisateur_id) DO UPDATE SET
         statut = 'actif',
         fin = GREATEST(kalpe_abonnements.fin, NOW() + INTERVAL '365 days'),
         updated_at = NOW()
       RETURNING *`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Sama Xaalis activé avec succès ! Bienvenue dans votre portefeuille.',
      abonnement: rows[0],
    });
  } catch (err) {
    console.error('[KALPE_ACTIVER_ERR]', err);
    res.status(500).json({ error: 'Impossible d’activer Sama Xaalis' });
  }
});

// ── 3. GET /api/kalpe/synthese — Synthèse intelligente & bilan temps réel
router.get('/synthese', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { contexte } = req.query; // 'all', 'personnel', 'activite'

    const contexteFilter = contexte && ['personnel', 'activite'].includes(contexte)
      ? `AND contexte = '${contexte}'`
      : '';

    const [dispoRes, moisFluxRes, dettesRes, epargneRes, recentsRes, catsRes] = await Promise.all([
      // 1. Solde disponible cumulé historique (tous temps)
      pool.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN direction = 'entree' THEN montant WHEN direction = 'sortie' THEN -montant ELSE 0 END), 0) AS solde_disponible
        FROM kalpe_operations
        WHERE utilisateur_id = $1 ${contexteFilter}
      `, [userId]),

      // 2. Flux du mois en cours
      pool.query(`
        SELECT 
          COALESCE(SUM(montant) FILTER (WHERE direction = 'entree'), 0) AS total_entrees_mois,
          COALESCE(SUM(montant) FILTER (WHERE direction = 'sortie'), 0) AS total_sorties_mois
        FROM kalpe_operations
        WHERE utilisateur_id = $1 
          AND date_operation >= DATE_TRUNC('month', CURRENT_DATE)
          ${contexteFilter}
      `, [userId]),

      // 3. Créances à recevoir (en_cours)
      pool.query(`
        SELECT 
          COALESCE(SUM(montant_restant), 0) AS total_a_recevoir,
          COUNT(*) FILTER (WHERE statut = 'en_cours')::int AS nb_creances_ouvertes,
          COUNT(*) FILTER (WHERE date_echeance < CURRENT_DATE AND statut = 'en_cours')::int AS nb_creances_retard,
          COALESCE(SUM(montant_restant) FILTER (WHERE date_echeance < CURRENT_DATE AND statut = 'en_cours'), 0) AS montant_retard
        FROM kalpe_dettes
        WHERE utilisateur_id = $1 AND direction = 'a_recevoir' AND statut = 'en_cours'
          ${contexteFilter}
      `, [userId]),

      // 4. Épargne totale accumulée sur objectifs
      pool.query(`
        SELECT 
          COALESCE(SUM(montant_actuel), 0) AS total_epargne,
          COALESCE(SUM(montant_cible), 0) AS total_objectifs_cible,
          COUNT(*)::int AS nb_objectifs
        FROM kalpe_objectifs
        WHERE utilisateur_id = $1 AND statut = 'en_cours'
      `, [userId]),

      // 5. Cinq opérations les plus récentes
      pool.query(`
        SELECT id, type, direction, montant, categorie, libelle, tiers_nom, date_operation, contexte, created_at
        FROM kalpe_operations
        WHERE utilisateur_id = $1 ${contexteFilter}
        ORDER BY date_operation DESC, created_at DESC
        LIMIT 5
      `, [userId]),

      // 6. Top catégories de dépenses du mois (pour conseils factuels)
      pool.query(`
        SELECT categorie, SUM(montant) AS total_cat
        FROM kalpe_operations
        WHERE utilisateur_id = $1 AND direction = 'sortie' AND date_operation >= DATE_TRUNC('month', CURRENT_DATE)
        GROUP BY categorie
        ORDER BY total_cat DESC
        LIMIT 3
      `, [userId]),
    ]);

    const soldeDispo = Number(dispoRes.rows[0]?.solde_disponible || 0);
    const entreesMois = Number(moisFluxRes.rows[0]?.total_entrees_mois || 0);
    const sortiesMois = Number(moisFluxRes.rows[0]?.total_sorties_mois || 0);
    const totalARecevoir = Number(dettesRes.rows[0]?.total_a_recevoir || 0);
    const totalEpargne = Number(epargneRes.rows[0]?.total_epargne || 0);
    const totalCibleEpargne = Number(epargneRes.rows[0]?.total_objectifs_cible || 0);
    const nbRetards = parseInt(dettesRes.rows[0]?.nb_creances_retard || 0, 10);
    const montantRetard = Number(dettesRes.rows[0]?.montant_retard || 0);

    // Moteur de conseils intelligents basé exclusivement sur les données réelles
    const conseils = [];

    if (nbRetards > 0) {
      conseils.push({
        type: 'warning',
        titre: 'Créances en retard',
        message: `Vous avez ${nbRetards} créance(s) dont l'échéance est dépassée (${new Intl.NumberFormat('fr-FR').format(montantRetard)} FCFA). Pensez à envoyer une relance WhatsApp 1-clic.`,
      });
    }

    if (totalCibleEpargne > 0) {
      const pct = Math.min(100, Math.round((totalEpargne / totalCibleEpargne) * 100));
      conseils.push({
        type: 'success',
        titre: 'Progression de votre épargne',
        message: `Vous avez atteint ${pct} % de vos objectifs d'épargne programmés (${new Intl.NumberFormat('fr-FR').format(totalEpargne)} FCFA épargnés).`,
      });
    }

    if (sortiesMois > 0 && catsRes.rows.length > 0) {
      const topCat = catsRes.rows[0];
      const partCat = Math.round((Number(topCat.total_cat) / sortiesMois) * 100);
      if (partCat >= 30) {
        conseils.push({
          type: 'info',
          titre: 'Poste de dépense principal',
          message: `Vos dépenses de « ${topCat.categorie} » représentent ${partCat} % de vos sorties ce mois-ci (${new Intl.NumberFormat('fr-FR').format(Number(topCat.total_cat))} FCFA).`,
        });
      }
    }

    if (conseils.length === 0) {
      conseils.push({
        type: 'neutral',
        titre: 'Portefeuille en équilibre',
        message: 'Enregistrez vos revenus, dépenses et dettes au quotidien pour garder une visibilité financière parfaite.',
      });
    }

    res.json({
      success: true,
      synthese: {
        disponible: soldeDispo,
        entrees_mois: entreesMois,
        sorties_mois: sortiesMois,
        a_recevoir: totalARecevoir,
        epargne_totale: totalEpargne,
        nb_creances: parseInt(dettesRes.rows[0]?.nb_creances_ouvertes || 0, 10),
        nb_objectifs: parseInt(epargneRes.rows[0]?.nb_objectifs || 0, 10),
        operations_recentes: recentsRes.rows,
        conseils,
      },
    });
  } catch (err) {
    console.error('[KALPE_SYNTHESE_ERR]', err);
    res.status(500).json({ error: 'Erreur lors du calcul de la synthèse Sama Xaalis' });
  }
});

// ── 4. POST /api/kalpe/operation — Enregistrement universel 1-Tap
router.post('/operation', async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      type, // 'revenu', 'depense', 'vente_express', 'versement_epargne'
      montant,
      categorie,
      libelle,
      contexte = 'personnel', // 'personnel', 'activite'
      tiers_nom,
      tiers_tel,
      date_operation,
      boutique_id,
      objectif_id, // si type === 'versement_epargne'
    } = req.body;

    const numMontant = Number(montant);
    if (!type || isNaN(numMontant) || numMontant <= 0) {
      return res.status(400).json({ error: 'Type d’opération et montant valide (> 0) obligatoires' });
    }

    if (!categorie || !categorie.trim()) {
      return res.status(400).json({ error: 'Catégorie obligatoire' });
    }

    // Détermination de la direction financière
    let direction = 'entree';
    if (['depense', 'versement_epargne'].includes(type)) {
      direction = 'sortie';
    } else if (['revenu', 'vente_express', 'remboursement_recu'].includes(type)) {
      direction = 'entree';
    }

    const opRef = genRef(type === 'vente_express' ? 'VNT' : type === 'depense' ? 'DEP' : 'OP');
    const finalLibelle = libelle && libelle.trim() ? libelle.trim() : `${type.toUpperCase()} - ${categorie.trim()}`;
    const finalDate = date_operation || new Date().toISOString().slice(0, 10);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const opRes = await client.query(`
        INSERT INTO kalpe_operations (
          utilisateur_id,
          boutique_id,
          contexte,
          type,
          direction,
          montant,
          categorie,
          libelle,
          tiers_nom,
          tiers_tel,
          date_operation,
          reference
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        userId,
        boutique_id || null,
        contexte === 'activite' ? 'activite' : 'personnel',
        type,
        direction,
        numMontant,
        categorie.trim().toLowerCase(),
        finalLibelle,
        tiers_nom?.trim() || null,
        tiers_tel?.trim() || null,
        finalDate,
        opRef,
      ]);

      // Si c'est un versement vers un objectif d'épargne
      if (type === 'versement_epargne' && objectif_id) {
        await client.query(`
          UPDATE kalpe_objectifs
          SET montant_actuel = montant_actuel + $1, updated_at = NOW()
          WHERE id = $2 AND utilisateur_id = $3
        `, [numMontant, objectif_id, userId]);

        await client.query(`
          INSERT INTO kalpe_epargne_mouvements (objectif_id, utilisateur_id, montant, type, note, date_mouvement)
          VALUES ($1, $2, $3, 'versement', $4, $5)
        `, [objectif_id, userId, numMontant, finalLibelle, finalDate]);
      }

      await client.query('COMMIT');
      res.status(201).json({ success: true, operation: opRes.rows[0] });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[KALPE_OPERATION_POST_ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l’enregistrement de l’opération' });
  }
});

// ── 5. GET /api/kalpe/operations — Journal complet filtrable
router.get('/operations', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { contexte, type, categorie, q, from, to, limit = 50, offset = 0 } = req.query;

    const conds = ['utilisateur_id = $1'];
    const params = [userId];

    if (contexte && ['personnel', 'activite'].includes(contexte)) {
      params.push(contexte);
      conds.push(`contexte = $${params.length}`);
    }

    if (type && type.trim()) {
      params.push(type.trim());
      conds.push(`type = $${params.length}`);
    }

    if (categorie && categorie.trim()) {
      params.push(categorie.trim().toLowerCase());
      conds.push(`categorie = $${params.length}`);
    }

    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      conds.push(`(libelle ILIKE $${params.length} OR tiers_nom ILIKE $${params.length} OR reference ILIKE $${params.length})`);
    }

    if (from) {
      params.push(from);
      conds.push(`date_operation >= $${params.length}`);
    }

    if (to) {
      params.push(to);
      conds.push(`date_operation <= $${params.length}`);
    }

    const limitVal = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offsetVal = Math.max(0, parseInt(offset, 10) || 0);
    params.push(limitVal, offsetVal);

    const whereClause = conds.join(' AND ');
    const query = `
      SELECT *
      FROM kalpe_operations
      WHERE ${whereClause}
      ORDER BY date_operation DESC, created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM kalpe_operations
      WHERE ${whereClause}
    `;

    const [rowsRes, countRes] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2)),
    ]);

    res.json({
      success: true,
      total: parseInt(countRes.rows[0]?.total || 0, 10),
      operations: rowsRes.rows,
    });
  } catch (err) {
    console.error('[KALPE_OPS_GET_ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des opérations' });
  }
});

// ── 6. DELETE /api/kalpe/operations/:id — Annuler/Supprimer une opération
router.delete('/operations/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const r = await pool.query(
      `DELETE FROM kalpe_operations WHERE id = $1 AND utilisateur_id = $2 RETURNING *`,
      [id, userId]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ error: 'Opération introuvable' });
    }

    res.json({ success: true, message: 'Opération supprimée avec succès' });
  } catch (err) {
    console.error('[KALPE_OP_DEL_ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── 7. GET /api/kalpe/dettes — Liste des dettes & créances (Bor)
router.get('/dettes', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { direction = 'a_recevoir', statut = 'en_cours', contexte } = req.query;

    const conds = ['d.utilisateur_id = $1'];
    const params = [userId];

    if (direction && ['a_recevoir', 'a_payer'].includes(direction)) {
      params.push(direction);
      conds.push(`d.direction = $${params.length}`);
    }

    if (statut && ['en_cours', 'solde', 'en_retard'].includes(statut)) {
      if (statut === 'en_retard') {
        conds.push(`d.statut = 'en_cours' AND d.date_echeance < CURRENT_DATE`);
      } else {
        params.push(statut);
        conds.push(`d.statut = $${params.length}`);
      }
    }

    if (contexte && ['personnel', 'activite'].includes(contexte)) {
      params.push(contexte);
      conds.push(`d.contexte = $${params.length}`);
    }

    const { rows } = await pool.query(`
      SELECT 
        d.*,
        CASE WHEN d.date_echeance < CURRENT_DATE AND d.statut = 'en_cours' THEN true ELSE false END AS est_en_retard,
        (SELECT json_agg(r ORDER BY r.date_reglement DESC) FROM kalpe_dette_remboursements r WHERE r.dette_id = d.id) AS remboursements
      FROM kalpe_dettes d
      WHERE ${conds.join(' AND ')}
      ORDER BY 
        CASE WHEN d.date_echeance < CURRENT_DATE AND d.statut = 'en_cours' THEN 0 ELSE 1 END,
        d.date_pret DESC
    `, params);

    res.json({ success: true, dettes: rows });
  } catch (err) {
    console.error('[KALPE_DETTES_GET_ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des créances' });
  }
});

// ── 8. POST /api/kalpe/dettes — Noter une dette ou une créance (Bor)
router.post('/dettes', async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      tiers_nom,
      tiers_telephone,
      montant,
      direction = 'a_recevoir', // 'a_recevoir' (on me doit), 'a_payer' (je dois)
      date_echeance,
      note,
      contexte = 'personnel',
      boutique_id,
    } = req.body;

    const numMontant = Number(montant);
    if (!tiers_nom || !tiers_nom.trim() || isNaN(numMontant) || numMontant <= 0) {
      return res.status(400).json({ error: 'Nom de la personne et montant valide (> 0) requis' });
    }

    const { rows } = await pool.query(`
      INSERT INTO kalpe_dettes (
        utilisateur_id,
        boutique_id,
        contexte,
        direction,
        tiers_nom,
        tiers_telephone,
        montant_initial,
        montant_paye,
        montant_restant,
        date_echeance,
        note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $7, $8, $9)
      RETURNING *
    `, [
      userId,
      boutique_id || null,
      contexte === 'activite' ? 'activite' : 'personnel',
      direction === 'a_payer' ? 'a_payer' : 'a_recevoir',
      tiers_nom.trim(),
      tiers_telephone?.trim() || null,
      numMontant,
      date_echeance || null,
      note?.trim() || null,
    ]);

    res.status(201).json({ success: true, dette: rows[0] });
  } catch (err) {
    console.error('[KALPE_DETTES_POST_ERR]', err);
    res.status(500).json({ error: 'Impossible d’enregistrer la dette' });
  }
});

// ── 9. POST /api/kalpe/dettes/:id/remboursement — Acompte ou solde d'une dette
router.post('/dettes/:id/remboursement', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { montant, mode_paiement = 'especes', note } = req.body;

    const numMontant = Number(montant);
    if (isNaN(numMontant) || numMontant <= 0) {
      return res.status(400).json({ error: 'Montant de remboursement valide (> 0) requis' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const dRes = await client.query(
        `SELECT * FROM kalpe_dettes WHERE id = $1 AND utilisateur_id = $2 FOR UPDATE`,
        [id, userId]
      );

      if (dRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Dette introuvable' });
      }

      const dette = dRes.rows[0];
      const nouveauReste = Math.max(0, Number(dette.montant_restant) - numMontant);
      const nouveauPaye = Number(dette.montant_paye) + numMontant;
      const nouveauStatut = nouveauReste === 0 ? 'solde' : 'en_cours';

      // 1. Enregistrer le remboursement
      await client.query(`
        INSERT INTO kalpe_dette_remboursements (dette_id, utilisateur_id, montant, mode_paiement, note)
        VALUES ($1, $2, $3, $4, $5)
      `, [id, userId, numMontant, mode_paiement, note || 'Acompte reçu']);

      // 2. Mettre à jour la dette
      const updatedDette = await client.query(`
        UPDATE kalpe_dettes
        SET montant_paye = $1, montant_restant = $2, statut = $3, updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `, [nouveauPaye, nouveauReste, nouveauStatut, id]);

      // 3. Si c'était une créance à recevoir, encaisser l'acompte dans le solde disponible !
      if (dette.direction === 'a_recevoir') {
        await client.query(`
          INSERT INTO kalpe_operations (
            utilisateur_id,
            boutique_id,
            contexte,
            type,
            direction,
            montant,
            categorie,
            libelle,
            tiers_nom,
            reference
          ) VALUES ($1, $2, $3, 'remboursement_recu', 'entree', $4, 'dette', $5, $6, $7)
        `, [
          userId,
          dette.boutique_id || null,
          dette.contexte || 'personnel',
          numMontant,
          `Acompte reçu de ${dette.tiers_nom}`,
          dette.tiers_nom,
          genRef('RMB'),
        ]);
      }

      await client.query('COMMIT');
      res.json({
        success: true,
        message: nouveauReste === 0 ? 'Dette intégralement soldée ! Félicitations.' : 'Acompte enregistré avec succès.',
        dette: updatedDette.rows[0],
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[KALPE_REMB_ERR]', err);
    res.status(500).json({ error: 'Erreur lors du règlement' });
  }
});

// ── 10. POST /api/kalpe/relance-whatsapp — Génération lien de relance Wave 1-clic
router.post('/relance-whatsapp', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { dette_id } = req.body;

    const { rows } = await pool.query(
      `SELECT * FROM kalpe_dettes WHERE id = $1 AND utilisateur_id = $2`,
      [dette_id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Dette introuvable' });
    }

    const dette = rows[0];
    const montantFmt = new Intl.NumberFormat('fr-FR').format(Number(dette.montant_restant));
    const cleanTel = (dette.tiers_telephone || '').replace(/[^0-9]/g, '');

    // Lien direct Wave de règlement
    const waveUrl = `https://wave.com/send?amount=${dette.montant_restant}`;
    const dateEchFmt = dette.date_echeance ? new Date(dette.date_echeance).toLocaleDateString('fr-FR') : null;

    const message = `Bonjour ${dette.tiers_nom} 🙏\nPetit rappel amical concernant le solde de ${montantFmt} FCFA convenu ensemble${dateEchFmt ? ` (échéance : ${dateEchFmt})` : ''}.\n\nTu peux régler facilement en 1 clic par Wave via ce lien direct :\n${waveUrl}\n\nMerci beaucoup et excellente journée !`;

    const whatsappUrl = `https://wa.me/${cleanTel.startsWith('221') ? cleanTel : '221' + cleanTel}?text=${encodeURIComponent(message)}`;

    await pool.query(
      `UPDATE kalpe_dettes SET derniere_relance = NOW(), updated_at = NOW() WHERE id = $1`,
      [dette_id]
    );

    res.json({
      success: true,
      message_texte: message,
      whatsapp_url: cleanTel ? whatsappUrl : null,
      wave_url: waveUrl,
    });
  } catch (err) {
    console.error('[KALPE_RELANCE_ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la préparation de la relance WhatsApp' });
  }
});

// ── 11. Objectifs d'Épargne (GET, POST, VERSER)
router.get('/objectifs', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { rows } = await pool.query(`
      SELECT 
        o.*,
        ROUND((o.montant_actuel / GREATEST(o.montant_cible, 1)) * 100) AS pourcentage,
        GREATEST(0, o.montant_cible - o.montant_actuel) AS reste_a_epargner
      FROM kalpe_objectifs o
      WHERE o.utilisateur_id = $1
      ORDER BY o.created_at DESC
    `, [userId]);

    res.json({ success: true, objectifs: rows });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des objectifs' });
  }
});

router.post('/objectifs', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { titre, montant_cible, date_echeance, categorie = 'projet' } = req.body;

    const cible = Number(montant_cible);
    if (!titre || !titre.trim() || isNaN(cible) || cible <= 0) {
      return res.status(400).json({ error: 'Titre et montant cible (> 0) obligatoires' });
    }

    const { rows } = await pool.query(`
      INSERT INTO kalpe_objectifs (utilisateur_id, titre, montant_cible, date_echeance, categorie)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, titre.trim(), cible, date_echeance || null, categorie]);

    res.status(201).json({ success: true, objectif: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Impossible de créer l’objectif' });
  }
});

router.post('/objectifs/:id/verser', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { montant, note } = req.body;

    const numMontant = Number(montant);
    if (isNaN(numMontant) || numMontant <= 0) {
      return res.status(400).json({ error: 'Montant valide (> 0) requis' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const objRes = await client.query(
        `SELECT * FROM kalpe_objectifs WHERE id = $1 AND utilisateur_id = $2 FOR UPDATE`,
        [id, userId]
      );
      if (objRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Objectif introuvable' });
      }

      const obj = objRes.rows[0];
      const nouveauTotal = Number(obj.montant_actuel) + numMontant;
      const atteint = nouveauTotal >= Number(obj.montant_cible);

      // 1. Mettre à jour l'objectif
      const updated = await client.query(`
        UPDATE kalpe_objectifs
        SET montant_actuel = $1, statut = CASE WHEN $2 THEN 'atteint' ELSE 'en_cours' END, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `, [nouveauTotal, atteint, id]);

      // 2. Enregistrer le mouvement d'épargne
      await client.query(`
        INSERT INTO kalpe_epargne_mouvements (objectif_id, utilisateur_id, montant, type, note)
        VALUES ($1, $2, $3, 'versement', $4)
      `, [id, userId, numMontant, note || `Versement sur ${obj.titre}`]);

      // 3. Enregistrer la sortie correspondante dans le cash disponible
      await client.query(`
        INSERT INTO kalpe_operations (
          utilisateur_id,
          contexte,
          type,
          direction,
          montant,
          categorie,
          libelle,
          reference
        ) VALUES ($1, 'personnel', 'versement_epargne', 'sortie', $2, 'epargne', $3, $4)
      `, [
        userId,
        numMontant,
        `Épargne : ${obj.titre}`,
        genRef('EPR'),
      ]);

      await client.query('COMMIT');
      res.json({
        success: true,
        message: atteint ? 'Félicitations ! Votre objectif d’épargne est atteint !' : 'Versement enregistré avec succès.',
        objectif: updated.rows[0],
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du versement' });
  }
});

// ── 12. GET /api/kalpe/stats — Statistiques réelles consolidées
// ── 12. GET /api/kalpe/stats — Statistiques réelles consolidées avec séparation Contexte, Tendances & Conseils
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { periode = 'mois', contexte = 'all' } = req.query; // 'jour', 'semaine', 'mois', 'annee' ; 'all', 'personnel', 'activite'

    let dateCond = "date_operation >= DATE_TRUNC('month', CURRENT_DATE)";
    if (periode === 'jour') dateCond = "date_operation = CURRENT_DATE";
    else if (periode === 'semaine') dateCond = "date_operation >= DATE_TRUNC('week', CURRENT_DATE)";
    else if (periode === 'annee') dateCond = "date_operation >= DATE_TRUNC('year', CURRENT_DATE)";

    // Condition contexte
    let ctxCond = "";
    if (contexte === 'personnel') ctxCond = "AND contexte = 'personnel'";
    else if (contexte === 'activite') ctxCond = "AND contexte = 'activite'";

    const [fluxRes, catsRes, ratioRes, dettesRes, epargneRes] = await Promise.all([
      // Total entrées & sorties période selon filtre contexte
      pool.query(`
        SELECT 
          COALESCE(SUM(montant) FILTER (WHERE direction = 'entree'), 0) AS entrees,
          COALESCE(SUM(montant) FILTER (WHERE direction = 'sortie'), 0) AS sorties
        FROM kalpe_operations
        WHERE utilisateur_id = $1 AND ${dateCond} ${ctxCond}
      `, [userId]),

      // Répartition par catégorie de dépense selon filtre contexte
      pool.query(`
        SELECT 
          categorie,
          SUM(montant) AS montant,
          COUNT(*)::int AS count
        FROM kalpe_operations
        WHERE utilisateur_id = $1 AND direction = 'sortie' AND ${dateCond} ${ctxCond}
        GROUP BY categorie
        ORDER BY montant DESC
        LIMIT 6
      `, [userId]),

      // Détails complets Personnel vs Activité
      pool.query(`
        SELECT 
          COALESCE(SUM(montant) FILTER (WHERE contexte = 'personnel' AND direction = 'entree'), 0) AS entrees_perso,
          COALESCE(SUM(montant) FILTER (WHERE contexte = 'personnel' AND direction = 'sortie'), 0) AS sorties_perso,
          COALESCE(SUM(montant) FILTER (WHERE contexte = 'activite' AND direction = 'entree'), 0) AS entrees_act,
          COALESCE(SUM(montant) FILTER (WHERE contexte = 'activite' AND direction = 'sortie'), 0) AS sorties_act
        FROM kalpe_operations
        WHERE utilisateur_id = $1 AND ${dateCond}
      `, [userId]),

      // Créances en retard et imminentes (à relancer)
      pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE date_echeance IS NOT NULL AND date_echeance < CURRENT_DATE)::int AS nb_retard,
          COALESCE(SUM(montant_restant) FILTER (WHERE date_echeance IS NOT NULL AND date_echeance < CURRENT_DATE), 0) AS montant_retard,
          COUNT(*) FILTER (WHERE date_echeance IS NOT NULL AND date_echeance BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days')::int AS nb_imminent,
          COALESCE(SUM(montant_restant) FILTER (WHERE date_echeance IS NOT NULL AND date_echeance BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'), 0) AS montant_imminent
        FROM kalpe_dettes
        WHERE utilisateur_id = $1 AND direction = 'a_recevoir' AND statut = 'en_cours'
      `, [userId]),

      // Épargne versée sur la période
      pool.query(`
        SELECT COALESCE(SUM(montant), 0) AS epargne_periode
        FROM kalpe_epargne_mouvements
        WHERE utilisateur_id = $1 AND type = 'versement' AND ${dateCond.replace(/date_operation/g, 'date_mouvement')}
      `, [userId]),
    ]);

    const entrees = Number(fluxRes.rows[0]?.entrees || 0);
    const sorties = Number(fluxRes.rows[0]?.sorties || 0);
    const soldeNet = entrees - sorties;

    const totalSorties = sorties > 0 ? sorties : 1;
    const categories = catsRes.rows.map(c => ({
      categorie: c.categorie,
      montant: Number(c.montant),
      pourcentage: Math.round((Number(c.montant) / totalSorties) * 100),
    }));

    const rRow = ratioRes.rows[0] || {};
    const entreesPerso = Number(rRow.entrees_perso || 0);
    const sortiesPerso = Number(rRow.sorties_perso || 0);
    const entreesAct = Number(rRow.entrees_act || 0);
    const sortiesAct = Number(rRow.sorties_act || 0);

    const totalRatio = (sortiesPerso + sortiesAct) || 1;
    const personnelPct = Math.round((sortiesPerso / totalRatio) * 100);
    const activitePct = Math.round((sortiesAct / totalRatio) * 100);

    const dettesRow = dettesRes.rows[0] || {};
    const nbRetard = Number(dettesRow.nb_retard || 0);
    const montantRetard = Number(dettesRow.montant_retard || 0);
    const nbImminent = Number(dettesRow.nb_imminent || 0);
    const epargnePeriode = Number(epargneRes.rows[0]?.epargne_periode || 0);

    const tauxEpargne = entrees > 0 ? Math.round((epargnePeriode / entrees) * 100) : 0;
    const topDepense = categories[0] || null;

    // Moteur d'Alertes et Conseils personnalisés intelligents
    const alertes = [];
    const conseils = [];

    // Alerte 1 : Créances en retard
    if (nbRetard > 0) {
      alertes.push({
        type: 'danger',
        titre: `${nbRetard} créance${nbRetard > 1 ? 's' : ''} en retard (${new Intl.NumberFormat('fr-FR').format(montantRetard)} FCFA)`,
        description: 'Des paiements ont dépassé leur date d’échéance. Envoyez une relance WhatsApp avec lien Wave direct en 1 clic.',
        actionLabel: 'Relancer les impayés',
        actionTab: 'dettes',
      });
    } else if (nbImminent > 0) {
      alertes.push({
        type: 'warning',
        titre: `${nbImminent} échéance${nbImminent > 1 ? 's' : ''} dans les 72h`,
        description: 'Des règlements arrivent à échéance prochainement. Un rappel préventif courtois améliore le taux de recouvrement.',
        actionLabel: 'Voir les créances',
        actionTab: 'dettes',
      });
    }

    // Alerte 2 : Déficit net sur la période
    if (soldeNet < 0) {
      alertes.push({
        type: 'warning',
        titre: `Déficit de trésorerie (-${new Intl.NumberFormat('fr-FR').format(Math.abs(soldeNet))} FCFA)`,
        description: `Vos dépenses dépassent vos rentrées d'argent sur cette période. Votre premier poste de dépense est "${topDepense?.categorie || 'divers'}" (${topDepense?.pourcentage || 0}% du total).`,
        actionLabel: 'Analyser les sorties',
        actionTab: 'journal',
      });
      conseils.push({
        type: 'warning',
        titre: 'Priorité : Freiner les sorties non vitales',
        message: `Votre poste principal "${topDepense?.categorie || 'divers'}" représente ${new Intl.NumberFormat('fr-FR').format(topDepense?.montant || 0)} F. Réduire ce poste de 15% rééquilibrerait instantanément votre solde.`,
        impact: `Économie potentielle : +${new Intl.NumberFormat('fr-FR').format(Math.round((topDepense?.montant || 0) * 0.15))} F`,
      });
    }

    // Conseil 3 : Taux d'épargne & surplus
    if (soldeNet > 0) {
      if (tauxEpargne < 10) {
        conseils.push({
          type: 'info',
          titre: 'Opportunité d’épargne',
          message: `Vous avez un excédent de +${new Intl.NumberFormat('fr-FR').format(soldeNet)} FCFA mais votre taux d'épargne est de seulement ${tauxEpargne}%. Placez au moins 10% dans vos cagnottes sécurisées.`,
          impact: `Conseil : Verser ${new Intl.NumberFormat('fr-FR').format(Math.round(soldeNet * 0.15))} F vers vos objectifs`,
        });
      } else {
        conseils.push({
          type: 'success',
          titre: 'Excellente gestion d’épargne',
          message: `Félicitations ! Vous avez épargné ${tauxEpargne}% de vos revenus cette période. Vos réserves grandissent sainement.`,
        });
      }
    }

    // Alerte 4 : Équilibre Personnel vs Activité (Ce qu'il faut éviter)
    if (contexte === 'all' && entreesAct > 0 && sortiesPerso > (entreesPerso + (entreesAct * 0.5))) {
      conseils.push({
        type: 'warning',
        titre: 'Vigilance : Dépenses perso financées par l’activité',
        message: 'Vos dépenses personnelles absorbent une grande part des recettes de votre activité. Séparez rigoureusement votre argent de poche des fonds de roulement du commerce pour éviter une rupture de stock.',
      });
    }

    res.json({
      success: true,
      stats: {
        periode,
        contexte,
        entrees,
        sorties,
        solde_net: soldeNet,
        categories,
        ratio: {
          personnel_pct: personnelPct,
          activite_pct: activitePct,
        },
        details_contexte: {
          personnel: {
            entrees: entreesPerso,
            sorties: sortiesPerso,
            solde: entreesPerso - sortiesPerso,
          },
          activite: {
            entrees: entreesAct,
            sorties: sortiesAct,
            solde: entreesAct - sortiesAct,
          },
        },
        tendances: {
          top_depense: topDepense,
          dettes_retard_nb: nbRetard,
          dettes_retard_montant: montantRetard,
          dettes_imminentes_nb: nbImminent,
          taux_epargne: tauxEpargne,
          epargne_periode: epargnePeriode,
        },
        alertes,
        conseils,
      },
    });
  } catch (err) {
    console.error('[KALPE_STATS_ERR]', err);
    res.status(500).json({ error: 'Erreur lors du calcul des statistiques' });
  }
});

module.exports = router;
