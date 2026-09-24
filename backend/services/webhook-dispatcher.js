// backend/services/webhook-dispatcher.js — Redirection de rétrocompatibilité
// @deprecated Utiliser backend/services/webhookDispatcher.js directement.
// Conservé pour rétrocompatibilité avec les tests et anciens modules.

const webhookDispatcher = require('./webhookDispatcher');

module.exports = {
  ...webhookDispatcher,
  dispatchWebhookEvent: webhookDispatcher.dispatchWebhookEvent || webhookDispatcher.dispatchBoutiqueWebhook,
};
