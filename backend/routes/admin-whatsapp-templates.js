// backend/routes/admin-whatsapp-templates.js
// Administration des templates WhatsApp de notification et de relance

const router = require('express').Router();
const { adminSecretOnly } = require('../middlewares/auth');
const cfg = require('../lib/settingsCache');
const { TEMPLATE_DEFINITIONS, getTemplateText } = require('../lib/whatsappTemplates');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

// ── GET /api/admin/whatsapp-templates — Liste des templates avec textes actuels
router.get('/', adminSecretOnly, async (req, res) => {
  try {
    const list = await Promise.all(
      TEMPLATE_DEFINITIONS.map(async def => {
        const customText = await cfg.get(def.key);
        return {
          ...def,
          currentText: customText || def.defaultText,
          isCustom: Boolean(customText && customText.trim() && customText !== def.defaultText),
        };
      })
    );
    res.json({ templates: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/admin/whatsapp-templates/:key — Mise à jour d'un template
router.put('/:key', adminSecretOnly, async (req, res) => {
  try {
    const { key } = req.params;
    const { text } = req.body;

    const def = TEMPLATE_DEFINITIONS.find(t => t.key === key);
    if (!def) return res.status(404).json({ error: 'Template introuvable' });

    const ancienneValeur = await getTemplateText(key);
    await cfg.set(key, text || def.defaultText);

    await enregistrerAdminLog({
      action: 'whatsapp_template_update',
      cibleType: 'whatsapp',
      cibleId: key,
      description: `Mise à jour du template WhatsApp "${def.label}"`,
      ancienneValeur,
      nouvelleValeur: text,
      req,
    });

    res.json({ success: true, key, text: text || def.defaultText });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/whatsapp-templates/:key/reset — Réinitialiser au texte par défaut
router.post('/:key/reset', adminSecretOnly, async (req, res) => {
  try {
    const { key } = req.params;
    const def = TEMPLATE_DEFINITIONS.find(t => t.key === key);
    if (!def) return res.status(404).json({ error: 'Template introuvable' });

    await cfg.set(key, def.defaultText);

    await enregistrerAdminLog({
      action: 'whatsapp_template_reset',
      cibleType: 'whatsapp',
      cibleId: key,
      description: `Réinitialisation au texte par défaut du template WhatsApp "${def.label}"`,
      req,
    });

    res.json({ success: true, key, text: def.defaultText });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
