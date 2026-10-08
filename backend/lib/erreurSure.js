// backend/lib/erreurSure.js
// SRG-A1-026 : une erreur du client HTTP (axios) porte la requête entière : l'en-tête Authorization (jeton de l'API
// WhatsApp), le corps du message (avec le code de connexion à 6 chiffres) et le numéro complet. Écrite telle quelle
// dans le journal (`console.error('[OTP SEND]', err)`), elle livre ces trois secrets à qui lit les journaux de
// l'hébergeur : le code ouvre le compte visé pendant 10 minutes, le jeton envoie des messages au nom de la plateforme.
//
// - erreurPourJournal(err) : ce qui peut être écrit dans un journal (message, statut, code), jamais la requête.
// - purgerErreurHttp(err)  : retire de l'erreur elle-même la requête et ses en-têtes avant qu'elle soit relancée, pour que
//   les appelants qui la journalisent sans précaution n'exposent rien. Le statut et le corps de la réponse restent
//   (les appelants lisent err.response.status et err.response.data.error).

function erreurPourJournal(err) {
  if (err == null) return 'erreur inconnue';
  if (typeof err !== 'object') return String(err).slice(0, 300);
  const morceaux = [];
  if (err.name && err.name !== 'Error') morceaux.push(err.name);
  const statut = err.response && err.response.status;
  if (statut) morceaux.push(`HTTP ${statut}`);
  if (err.code) morceaux.push(String(err.code));
  const metaMessage = err.response && err.response.data && err.response.data.error && err.response.data.error.message;
  const message = metaMessage || err.message || 'erreur';
  morceaux.push(String(message).replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [masqué]').replace(/\b\d{6}\b/g, '[6 chiffres]').slice(0, 300));
  return morceaux.join(' | ');
}

function purgerErreurHttp(err) {
  try {
    if (err && typeof err === 'object') {
      if (err.config) err.config = { url: err.config.url, method: err.config.method };
      if (err.request) err.request = undefined;
      if (err.response && typeof err.response === 'object') {
        err.response = { status: err.response.status, statusText: err.response.statusText, data: err.response.data };
      }
    }
  } catch { /* l'erreur d'origine reste relancée telle quelle */ }
  return err;
}

module.exports = { erreurPourJournal, purgerErreurHttp };
