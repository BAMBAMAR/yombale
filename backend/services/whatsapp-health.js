// backend/services/whatsapp-health.js — Suivi de santé de l'API WhatsApp & Circuit Breaker
const { alerterWhatsAppPanne, alerterAdmin } = require('./admin-alerts');

let _isHealthy = true;
let _lastFailure = null;
let _lastFailureTime = 0;
let _lastSuccessTime = Date.now();
let _consecutiveFailures = 0;

const DEGRADED_WINDOW_MS = 30 * 60 * 1000; // 30 minutes de mode dégradé après échec critique

/**
 * Analyse si une erreur est critique (bloquante pour tous les messages)
 */
function estErreurCritique(errObj = {}) {
  const code = Number(errObj.code) || 0;
  const msg = String(errObj.message || errObj.details || '').toLowerCase();
  const title = String(errObj.title || '').toLowerCase();

  // 131056 : Meta WhatsApp Business unsettled payments / impayé
  if (code === 131056 || msg.includes('unsettled payments') || msg.includes('billing_hub') || title.includes('payment issue')) {
    return {
      critique: true,
      type: 'PAIEMENT_IMPAYE',
      motif: 'Compte WhatsApp Business bloqué pour facture impayée sur Meta (unsettled payments).',
    };
  }

  // 190 : Token d'accès expiré ou révoqué
  if (code === 190 || msg.includes('session has expired') || msg.includes('access token')) {
    return {
      critique: true,
      type: 'TOKEN_EXPIRE',
      motif: 'Jeton d\'accès Meta (WHATSAPP_API_TOKEN) expiré ou révoqué.',
    };
  }

  // 131042 / 131045 : Numéro suspendu ou restriction de compte
  if (code === 131042 || code === 131045 || msg.includes('account has been restricted') || msg.includes('spam')) {
    return {
      critique: true,
      type: 'COMPTE_RESTREINT',
      motif: 'Numéro WhatsApp Business restreint ou suspendu par Meta.',
    };
  }

  return { critique: false };
}

/**
 * Enregistrer un échec de livraison ou d'appel API
 */
function recordFailure(errorData = {}) {
  const now = Date.now();
  _lastFailureTime = now;
  _consecutiveFailures += 1;

  const errParsed = {
    code: errorData.code || errorData.error_subcode || null,
    message: errorData.message || errorData.title || (typeof errorData === 'string' ? errorData : 'Erreur inconnue'),
    details: errorData.details || errorData.error_data?.details || null,
    href: errorData.href || null,
  };

  _lastFailure = errParsed;

  const analyse = estErreurCritique(errParsed);

  if (analyse.critique) {
    _isHealthy = false;
    console.error(`[WHATSAPP HEALTH] 🚨 PANNE CRITIQUE DÉTECTÉE [${analyse.type}] :`, errParsed.message);

    // Déclencher l'alerte admin immédiate
    alerterWhatsAppPanne({
      codeErreur: errParsed.code,
      motif: analyse.motif,
      details: errParsed.details || errParsed.message,
      lienAction: errParsed.href,
    }).catch(e => console.error('[WHATSAPP HEALTH] Erreur déclenchement alerte:', e.message));

  } else if (_consecutiveFailures >= 3) {
    _isHealthy = false;
    console.warn(`[WHATSAPP HEALTH] ⚠️ ${_consecutiveFailures} échecs consécutifs détectés.`);

    alerterAdmin({
      type: 'whatsapp_consecutive_failures',
      priorite: 'ATTENTION',
      titre: 'Plusieurs échecs consécutifs d\'envoi WhatsApp',
      message: `${_consecutiveFailures} messages WhatsApp consécutifs n'ont pas pu être livrés.`,
      details: errParsed.details || errParsed.message,
      cooldownMs: 60 * 60 * 1000,
    }).catch(() => {});
  }
}

/**
 * Enregistrer un succès d'envoi ou de livraison
 */
function recordSuccess() {
  const now = Date.now();
  _lastSuccessTime = now;
  _consecutiveFailures = 0;

  if (!_isHealthy) {
    console.log('[WHATSAPP HEALTH] ✅ Le service WhatsApp a repris : rétablissement du statut sain.');
    _isHealthy = true;

    alerterAdmin({
      type: 'whatsapp_retabli',
      priorite: 'INFO',
      titre: 'Service WhatsApp Rétabli',
      message: 'Les messages WhatsApp sont à nouveau délivrés avec succès par Meta.',
      cooldownMs: 30 * 60 * 1000,
    }).catch(() => {});
  }
}

/**
 * Indique si le service WhatsApp est actuellement dégradé
 */
function isDegraded() {
  if (_isHealthy) return false;
  // Si le dernier échec critique remonte à moins de 30 min, on reste en mode dégradé
  if (Date.now() - _lastFailureTime < DEGRADED_WINDOW_MS) {
    return true;
  }
  // Au-delà de 30 min sans nouveau signal d'échec, on permet une tentative de reprise
  return false;
}

/**
 * Récupérer l'état complet de santé
 */
function getStatus() {
  return {
    healthy: _isHealthy,
    degraded: isDegraded(),
    consecutiveFailures: _consecutiveFailures,
    lastFailure: _lastFailure,
    lastFailureTime: _lastFailureTime,
    lastSuccessTime: _lastSuccessTime,
  };
}

module.exports = {
  recordFailure,
  recordSuccess,
  isDegraded,
  getStatus,
};
