// backend/routes/boutiques-modules/boutiques-club-vip.js
const router = require('express').Router();
const { param, validationResult } = require('express-validator');
const { pool } = require('../../models/db');
const { verifierToken } = require('../../middlewares/auth');
const { checkBoutiqueAccess } = require('./helpers');
const { statutClubVip, normaliserConfig, configEffective, CONFIG_DEFAUT, MAX_PALIERS } = require('../../lib/clubVip');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Le Club VIP est une remise sur la livraison à la CHARGE DU MARCHAND, accordée seulement s'il l'active
// (boutiques.club_vip_actif, désactivé par défaut) et selon SA configuration (boutiques.club_vip_config).
async function lireReglage(ref) {
  if (!ref) return null;
  try {
    const { rows } = await pool.query(
      `SELECT id, COALESCE(club_vip_actif, false) AS actif, club_vip_config AS config
         FROM boutiques WHERE ${UUID_RE.test(String(ref)) ? 'id = $1' : 'slug = $1'}`,
      [String(ref)]
    );
    return rows[0] || null;
  } catch (_) {
    return null;
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
      description: 'Passez votre 1ère commande pour débloquer les avantages Club VIP',
      prochain_palier: null,
    };
    if (!rawPhone || rawPhone.replace(/\D/g, '').length < 7) return res.json(vide);

    const reglage = await lireReglage(req.query.boutique);
    // Remise affichée seulement si CETTE boutique a activé le Club VIP
    if (!reglage || reglage.actif !== true) {
      const s = await statutClubVip(pool, rawPhone, { config: reglage?.config, boutiqueId: reglage?.id });
      return res.json({ success: true, ...s, reduction_livraison: 0, livraison_offerte: false, club_vip_boutique: false,
        description: 'Cette boutique ne propose pas de remise Club VIP.', prochain_palier: null });
    }
    const s = await statutClubVip(pool, rawPhone, { config: reglage.config, boutiqueId: reglage.id });
    res.json({ success: true, ...s, club_vip_boutique: true });
  } catch (err) {
    console.error('[CLUB VIP STATUT ERR]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération du statut Club VIP' });
  }
});

// ── GET /api/boutiques/:id/club-vip — réglage complet du marchand (activation + paliers)
router.get('/:id/club-vip', verifierToken, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const own = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!own) return res.status(403).json({ error: 'Accès refusé' });
    const reglage = await lireReglage(req.params.id);
    res.json({ success: true, actif: reglage?.actif === true, config: configEffective(reglage?.config), defaut: CONFIG_DEFAUT, max_paliers: MAX_PALIERS });
  } catch (err) {
    console.error('[CLUB VIP GET ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/boutiques/:id/club-vip {actif?:boolean, config?:{portee, paliers[]}} — le marchand décide d'offrir (et de financer) la remise
router.put('/:id/club-vip', verifierToken, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  const { actif, config } = req.body || {};
  if (actif !== undefined && typeof actif !== 'boolean') return res.status(400).json({ error: 'Le champ "actif" doit être vrai ou faux' });
  if (actif === undefined && config === undefined) return res.status(400).json({ error: 'Indiquez "actif" et/ou "config"' });
  try {
    const own = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!own) return res.status(403).json({ error: 'Accès refusé' });
    let configNormalisee;
    if (config !== undefined) {
      try { configNormalisee = normaliserConfig(config); } catch (e) { return res.status(400).json({ error: e.message }); }
    }
    await pool.query(
      `UPDATE boutiques SET club_vip_actif = COALESCE($1::boolean, club_vip_actif),
                            club_vip_config = COALESCE($2::jsonb, club_vip_config) WHERE id = $3`,
      [actif === undefined ? null : actif, configNormalisee ? JSON.stringify(configNormalisee) : null, req.params.id]
    );
    const reglage = await lireReglage(req.params.id);
    res.json({ success: true, actif: reglage?.actif === true, config: configEffective(reglage?.config) });
  } catch (err) {
    console.error('[CLUB VIP PUT ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
