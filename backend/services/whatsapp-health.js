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
 * Analyse si l'échec est spécifique à un destinataire donné
 * (ex: numéro non inscrit sur WhatsApp, bloqué, éteint, ou fenêtre 24h fermée)
 * Ces erreurs ne constituent PAS une panne de l'infrastructure Nopalou
 * et ne doivent JAMAIS déclencher le circuit-breaker global pour les autres utilisateurs.
 */
function estErreurDestinataire(errObj = {}) {
  const code = Number(errObj.code) || 0;
  const msg = String(errObj.message || errObj.details || '').toLowerCase();
  const title = String(errObj.title || '').toLowerCase();

  // 131026 : Message Undeliverable (numéro non WhatsApp, bloqué, offline, etc.)
  if (code === 131026 || msg.includes('undeliverable') || title.includes('undeliverable')) {
    return {
      destinataire: true,
      motif: 'Numéro injoignable ou non-inscrit sur WhatsApp (Message Undeliverable)',
    };
  }

  // 131047 : Fenêtre 24h Meta fermée pour texte libre
  if (code === 131047 || msg.includes('24 hours') || title.includes('24 hours') || msg.includes('re-engagement')) {
    return {
      destinataire: true,
      motif: 'Fenêtre de conversation 24h fermée pour ce destinataire',
    };
  }

  // 131051 / 131052 / 131053 : Format non supporté ou problème média sur l'appareil du client
  if (code === 131051 || code === 131052 || code === 131053 || msg.includes('unsupported message type')) {
    return {
      destinataire: true,
      motif: 'Message ou format média non supporté par le téléphone du destinataire',
    };
  }

  // 131000 : Échec d'envoi individuel
  if (code === 131000) {
    return {
      destinataire: true,
      motif: 'Échec de distribution vers ce numéro particulier',
    };
  }

  // 130429 : Rate limit individuel par utilisateur (spam/fréquence vers un seul utilisateur)
  if (code === 130429 || msg.includes('rate limit hit')) {
    return {
      destinataire: true,
      motif: 'Limite de messages atteinte vers ce destinataire',
    };
  }

  return { destinataire: false };
}

let _lastRecipientFailure = null;
let _recipientFailuresCount = 0;

/**
 * Enregistrer un échec de livraison ou d'appel API
 */
function recordFailure(errorData = {}) {
  const now = Date.now();

  const errParsed = {
    code: errorData.code || errorData.error_subcode || null,
    message: errorData.message || errorData.title || (typeof errorData === 'string' ? errorData : 'Erreur inconnue'),
    details: errorData.details || errorData.error_data?.details || null,
    href: errorData.href || null,
    recipient_id: errorData.recipient_id || null,
  };

  const analyseCritique = estErreurCritique(errParsed);

  // 1. Panne critique d'infrastructure (impayé Meta, token révoqué, compte suspendu)
  if (analyseCritique.critique) {
    _lastFailureTime = now;
    _consecutiveFailures += 1;
    _lastFailure = errParsed;
    _isHealthy = false;
    console.error(`[WHATSAPP HEALTH] 🚨 PANNE CRITIQUE DÉTECTÉE [${analyseCritique.type}] :`, errParsed.message);

    // Déclencher l'alerte admin immédiate
    alerterWhatsAppPanne({
      codeErreur: errParsed.code,
      motif: analyseCritique.motif,
      details: errParsed.details || errParsed.message,
      lienAction: errParsed.href,
    }).catch(e => console.error('[WHATSAPP HEALTH] Erreur déclenchement alerte:', e.message));
    return;
  }

  // 2. Erreur liée au destinataire (numéro sans WhatsApp, bloqué, etc.)
  // -> Ne doit PAS impacter la santé globale de la plateforme ni bloquer les autres utilisateurs
  const analyseDest = estErreurDestinataire(errParsed);
  if (analyseDest.destinataire) {
    _lastRecipientFailure = {
      ...errParsed,
      motif: analyseDest.motif,
      time: now,
    };
    _recipientFailuresCount += 1;
    const destInfo = errParsed.recipient_id ? `vers ${errParsed.recipient_id}` : 'destinataire individuel';
    console.warn(`[WHATSAPP DELIVERY] ℹ️ Échec livraison ${destInfo} [Code ${errParsed.code}] : ${analyseDest.motif} (Santé globale intacte)`);
    return;
  }

  // 3. Autre erreur système/réseau Meta (500, timeout réseau, etc.)
  _lastFailureTime = now;
  _consecutiveFailures += 1;
  _lastFailure = errParsed;

  if (_consecutiveFailures >= 3) {
    _isHealthy = false;
    console.warn(`[WHATSAPP HEALTH] ⚠️ ${_consecutiveFailures} pannes d'infrastructure consécutives détectées.`);

    alerterAdmin({
      type: 'whatsapp_consecutive_failures',
      priorite: 'ATTENTION',
      titre: 'Plusieurs échecs consécutifs d\'API WhatsApp',
      message: `${_consecutiveFailures} appels API WhatsApp consécutifs ont échoué côté infrastructure.`,
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
    lastRecipientFailure: _lastRecipientFailure,
    recipientFailuresCount: _recipientFailuresCount,
  };
}

module.exports = {
  recordFailure,
  recordSuccess,
  isDegraded,
  getStatus,
  estErreurDestinataire,
  estErreurCritique,
};

