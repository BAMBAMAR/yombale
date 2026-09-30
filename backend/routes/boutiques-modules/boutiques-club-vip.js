// backend/routes/boutiques-modules/boutiques-club-vip.js
const router = require('express').Router();
const { pool } = require('../../models/db');
const { statutClubVip } = require('../../lib/clubVip');

// ── Spec 09 : GET /api/boutiques/club-vip/statut — Programme Fidélité Plateforme "Nopalou Club VIP"
// Le palier est calculé par lib/clubVip.js (même source que la facturation au checkout).
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
    const s = await statutClubVip(pool, rawPhone);
    res.json({ success: true, ...s });
  } catch (err) {
    console.error('[CLUB VIP STATUT ERR]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération du statut Club VIP' });
  }
});

module.exports = router;
