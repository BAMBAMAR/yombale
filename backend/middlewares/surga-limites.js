// SRG-A1-014 : limites de débit propres aux écritures et aux déclencheurs publics de Surga. La limite générale de
// l'API (1 000 appels par quart d'heure) laissait écrire cinquante signalements d'affilée sans compte, et lancer
// la collecte de la presse vingt fois de suite.
// Ces limites restent actives hors production, pour pouvoir être rejouées dans l'environnement isolé ; seuls les
// tests unitaires en sont dispensés.

const rateLimit = require('express-rate-limit');

const sousTests = () => Boolean(process.env.JEST_WORKER_ID);

const limite = (max, minutes, message) =>
  rateLimit({
    windowMs: minutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: sousTests,
    message: { success: false, code: 'TROP_DE_DEMANDES', error: message },
  });

module.exports = {
  // Signalements de trafic et d'erreur sur une fiche de démarche, ouverts aux invités.
  limiterSignalement: limite(10, 15, 'Trop de signalements envoyés. Réessayez dans quelques minutes.'),
  // Abonnement, désabonnement et essai des notifications.
  limiterPush: limite(30, 15, 'Trop de demandes de notification. Réessayez dans quelques minutes.'),
  // Bouton « Actualiser » de la presse : chaque passage lance une collecte sur une dizaine de sources.
  limiterDeclencheur: limite(4, 10, 'La presse vient d’être actualisée. Réessayez dans quelques minutes.'),
  // Interprétation d'une commande écrite ou dictée, et assistant.
  limiterInterprete: limite(60, 15, 'Trop de commandes envoyées. Réessayez dans quelques minutes.'),
};
