// backend/routes/boutiques-modules/boutiques-club-vip.js
const router = require('express').Router();
const { param, validationResult } = require('express-validator');
const { pool } = require('../../models/db');
const { verifierToken } = require('../../middlewares/auth');
const { checkBoutiqueAccess } = require('./helpers');
const { statutClubVip } = require('../../lib/clubVip');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{5,12}$/i;

// Le Club VIP est une remise sur la livraison à la CHARGE DU MARCHAND, accordée seulement s'il l'active
// (boutiques.club_vip_actif, désactivé par défaut). Sans activation, aucune remise n'est affichée ni facturée.
async function boutiqueAccordeClubVip(ref) {
  if (!ref) return false;
  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(club_vip_actif, false) AS actif FROM boutiques WHERE ${UUID_RE.test(String(ref)) ? 'id = $1' : 'slug = $1'}`,
      [String(ref)]
    );
    return rows[0]?.actif === true;
  } catch (_) {
    return false;
  }
}

// ── Spec 09 : GET /api/boutiques/club-vip/statut?telephone=…&boutique=… — Programme Fidélité "Nopalou Club VIP"
// Le palier est calculé par lib/clubVip.js (même source que la facturation au checkout express).
router.get('/club-vip/statut', async (req, res) => {
  try {
    const rawPhone = String(req.query.telephone || '').trim();
    const vide = {
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
    };
    if (!rawPhone || rawPhone.replace(/\D/g, '').length < 7) return res.json(vide);

    const s = await statutClubVip(pool, rawPhone);
    // Remise affichée seulement si CETTE boutique a activé le Club VIP
    const actif = await boutiqueAccordeClubVip(req.query.boutique);
    if (!actif) {
      return res.json({ success: true, ...s, reduction_livraison: 0, livraison_offerte: false, club_vip_boutique: false,
        description: 'Cette boutique ne propose pas de remise Club VIP.', prochain_palier: null });
    }
    res.json({ success: true, ...s, club_vip_boutique: true });
  } catch (err) {
    console.error('[CLUB VIP STATUT ERR]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération du statut Club VIP' });
  }
});

// ── GET /api/boutiques/:id/club-vip — réglage du marchand
router.get('/:id/club-vip', verifierToken, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const own = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!own) return res.status(403).json({ error: 'Accès refusé' });
    const { rows } = await pool.query('SELECT COALESCE(club_vip_actif, false) AS actif FROM boutiques WHERE id = $1', [req.params.id]);
    res.json({ success: true, actif: rows[0]?.actif === true });
  } catch (err) {
    console.error('[CLUB VIP GET ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/boutiques/:id/club-vip {actif:boolean} — le marchand décide d'offrir (et de financer) la remise
router.put('/:id/club-vip', verifierToken, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  if (typeof req.body?.actif !== 'boolean') return res.status(400).json({ error: 'Le champ "actif" (vrai/faux) est requis' });
  try {
    const own = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!own) return res.status(403).json({ error: 'Accès refusé' });
    await pool.query('UPDATE boutiques SET club_vip_actif = $1 WHERE id = $2', [req.body.actif, req.params.id]);
    res.json({ success: true, actif: req.body.actif });
  } catch (err) {
    console.error('[CLUB VIP PUT ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
