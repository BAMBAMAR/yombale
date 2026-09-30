// AUD-096 : date réelle d'une opération saisie hors-ligne et synchronisée plus tard.
// L'horloge d'un appareil n'est pas fiable : on n'accepte la date client que dans une fenêtre bornée
// (30 jours dans le passé, 5 minutes dans le futur). Hors de la fenêtre ou illisible : null, l'appelant
// retombe sur l'instant du serveur (COALESCE($n::timestamptz, NOW())).
const PASSE_MAX_MS = 30 * 24 * 3600 * 1000;
const FUTUR_MAX_MS = 5 * 60 * 1000;

function parseClientDate(valeur, maintenant = Date.now()) {
  if (!valeur || typeof valeur !== 'string' || valeur.length > 40) return null;
  const t = Date.parse(valeur);
  if (Number.isNaN(t)) return null;
  if (t < maintenant - PASSE_MAX_MS || t > maintenant + FUTUR_MAX_MS) return null;
  return new Date(t).toISOString();
}

module.exports = { parseClientDate, PASSE_MAX_MS, FUTUR_MAX_MS };
