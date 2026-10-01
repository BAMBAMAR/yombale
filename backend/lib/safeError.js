// AUD-145 : une erreur interne ne renvoie jamais son message au client (SQL, chemins, valeurs) ; elle est journalisée
// avec la route et l'identifiant de requête pour le diagnostic.
function erreurPublique(err, req, message = 'Erreur serveur') {
  try {
    const id = (req && req.id) || '-';
    console.error(`[ERREUR][${id}] ${req ? req.method : ''} ${req ? (req.baseUrl || '') + (req.path || '') : ''} :`, err && err.message ? err.message : err);
  } catch { /* la journalisation ne doit jamais casser la réponse */ }
  return message;
}
module.exports = { erreurPublique };
