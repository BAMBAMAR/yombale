// backend/routes/feature-flags.js
// API d'administration et d'interrogation des Feature Flags

const router = require('express').Router();
const { adminSecretOnly } = require('../middlewares/auth');
const featureFlags = require('../lib/featureFlags');

// ── GET /api/feature-flags/public — dictionnaire simple des flags actifs (public)
router.get('/public', async (req, res) => {
  try {
    const flags = await featureFlags.getPublicFlags();
    res.json(flags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/feature-flags/admin/tous — liste détaillée de tous les flags (admin)
router.get('/admin/tous', adminSecretOnly, async (req, res) => {
  try {
    const flags = await featureFlags.getAllFlags();
    res.json({ flags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/feature-flags/admin/:key — mise à jour d'un drapeau (admin)
router.put('/admin/:key', adminSecretOnly, async (req, res) => {
  try {
    const { key } = req.params;
    const { enabled, label, description, categorie, scope, meta } = req.body;
    const updated = await featureFlags.setFlag(key, { enabled, label, description, categorie, scope, meta });
    res.json({ success: true, flag: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/feature-flags/admin — création d'un nouveau drapeau (admin)
router.post('/admin', adminSecretOnly, async (req, res) => {
  try {
    const { key, label, description, categorie, enabled, scope, meta } = req.body;
    if (!key || !label) {
      return res.status(400).json({ error: 'La clé (ex: NOUVEAU_MODULE) et le libellé sont requis.' });
    }
    const cleanKey = String(key).trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const created = await featureFlags.setFlag(cleanKey, {
      label: label.trim(),
      description: description ? description.trim() : '',
      categorie: categorie || 'general',
      enabled: enabled !== undefined ? Boolean(enabled) : true,
      scope: scope || 'global',
      meta: meta || {},
    });
    res.json({ success: true, flag: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/feature-flags/admin/:key — suppression d'un drapeau (admin)
router.delete('/admin/:key', adminSecretOnly, async (req, res) => {
  try {
    const { key } = req.params;
    await featureFlags.deleteFlag(key);
    res.json({ success: true, deletedKey: key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
