// SRG-A1-012 : une adresse de notification vient du navigateur de l'appelant. Sans contrôle, n'importe quelle
// adresse était acceptée, et le serveur s'y connectait : de quoi sonder des ports internes depuis l'hébergeur.
// Seuls les services de notification des navigateurs sont admis, en HTTPS et sur le port par défaut.

const HOTES = [
  /^fcm\.googleapis\.com$/,                  // Chrome, Edge sur Android, Brave, Opera, Samsung
  /^android\.googleapis\.com$/,              // anciennes inscriptions de Chrome
  /^updates\.push\.services\.mozilla\.com$/, // Firefox
  /^[a-z0-9-]+\.notify\.windows\.com$/,      // Edge sous Windows
  /^[a-z0-9-]+\.push\.apple\.com$/,          // Safari
];

function hotePushAutorise(adresse) {
  let url;
  try {
    url = new URL(String(adresse || ''));
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.port !== '' || url.username || url.password) return false;
  return HOTES.some((motif) => motif.test(url.hostname.toLowerCase()));
}

module.exports = { hotePushAutorise };
