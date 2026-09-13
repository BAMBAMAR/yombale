// backend/routes/boutiques-modules/boutiques-club-vip.js
const router = require('express').Router();
const { pool } = require('../../models/db');

// ── Spec 09 : GET /api/boutiques/club-vip/statut — Programme Fidélité Plateforme "Nopalou Club VIP"
router.get('/club-vip/statut', async (req, res) => {
  try {
    const rawPhone = String(req.query.telephone || '').trim();
    if (!rawPhone || rawPhone.replace(/\D/g, '').length < 7) {
      return res.json({
        success: true,
        telephone: '',
        nb_commandes: 0,
        total_depense: 0,
        palier: 'Bronze',
        badge: 'Acheteur Bronze',
        reduction_livraison: 0,
        livraison_offerte: false,
        description: 'Passez votre 1ère commande pour débloquer les avantages Tiak-Tiak Club VIP',
        prochain_palier: { nom: 'Silver', commandes_restantes: 2, reduction_livraison: 500 }
      });
    }

    const digits = rawPhone.replace(/\D/g, '');
    const clean9 = digits.slice(-9);
    const clean221 = clean9.length === 9 ? '221' + clean9 : digits;
    const cleanPlus = clean9.length === 9 ? '+221' + clean9 : '+' + digits;

    let nbCommandes = 0;
    let totalDepense = 0;

    try {
      const { rows } = await pool.query(
        `SELECT COUNT(*) as nb_commandes, COALESCE(SUM(total), 0) as total_depense
         FROM commandes
         WHERE (client_telephone = $1 OR client_telephone = $2 OR client_telephone = $3)
           AND statut NOT IN ('annulee', 'rejetee')`,
        [clean9, clean221, cleanPlus]
      );
      if (rows && rows[0]) {
        nbCommandes = parseInt(rows[0].nb_commandes || 0, 10);
        totalDepense = parseInt(rows[0].total_depense || 0, 10);
      }
    } catch (dbErr) {
      console.warn('[CLUB VIP QUERY FALLBACK]', dbErr.message);
    }

    let palier = 'Bronze';
    let badge = 'Acheteur Bronze';
    let reductionLivraison = 0;
    let livraisonOfferte = false;
    let description = 'Effectuez encore 1 commande pour passer Silver et économiser 500 FCFA sur vos livraisons Tiak-Tiak';
    let prochainPalier = { nom: 'Silver', commandes_restantes: Math.max(1, 2 - nbCommandes), reduction_livraison: 500 };

    if (nbCommandes >= 10 || totalDepense >= 300000) {
      palier = 'Platine VIP';
      badge = 'Acheteur Platine VIP';
      reductionLivraison = 2500;
      livraisonOfferte = true;
      description = 'Livraison Tiak-Tiak 100% offerte (jusqu\'à 2 500 FCFA pris en charge par Nopalou)';
      prochainPalier = null;
    } else if (nbCommandes >= 5 || totalDepense >= 150000) {
      palier = 'Gold';
      badge = 'Acheteur Vérifié Gold';
      reductionLivraison = 1000;
      livraisonOfferte = false;
      description = 'Remise de 1 000 FCFA déduite sur toutes vos livraisons Tiak-Tiak';
      prochainPalier = { nom: 'Platine VIP', commandes_restantes: Math.max(1, 10 - nbCommandes), reduction_livraison: 2500 };
    } else if (nbCommandes >= 2 || totalDepense >= 50000) {
      palier = 'Silver';
      badge = 'Acheteur Silver';
      reductionLivraison = 500;
      livraisonOfferte = false;
      description = 'Remise de 500 FCFA déduite sur votre livraison Tiak-Tiak';
      prochainPalier = { nom: 'Gold', commandes_restantes: Math.max(1, 5 - nbCommandes), reduction_livraison: 1000 };
    }

    res.json({
      success: true,
      telephone: clean9,
      nb_commandes: nbCommandes,
      total_depense: totalDepense,
      palier,
      badge,
      reduction_livraison: reductionLivraison,
      livraison_offerte: livraisonOfferte,
      description,
      prochain_palier: prochainPalier
    });
  } catch (err) {
    console.error('[CLUB VIP STATUT ERR]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération du statut Club VIP' });
  }
});

module.exports = router;
