// AUD-144 : masque les valeurs sensibles d'une URL avant journalisation (clé API, jeton, code, numéro de téléphone, e-mail…).
// Les journaux d'accès (Render, Sentry) ne doivent contenir ni secret ni donnée personnelle.
const PARAMS_SENSIBLES = /^(api[_-]?key|apikey|key|token|access[_-]?token|refresh[_-]?token|jeton|lien|sig|signature|code|otp|secret|password|mot_de_passe|motdepasse|tel|telephone|phone|whatsapp|email|mail|session|auth)$/i;

/** @param {string} url chemin + requête (ex. /api/v1/prix?api_key=abc&q=iphone) */
function redigerUrl(url) {
  const s = String(url || '');
  const i = s.indexOf('?');
  if (i === -1) return s;
  const chemin = s.slice(0, i);
  const requete = s.slice(i + 1).split('#')[0];
  const masquee = requete
    .split('&')
    .map((paire) => {
      const eq = paire.indexOf('=');
      if (eq === -1) return paire;
      const cle = paire.slice(0, eq);
      let cleDecodee = cle;
      try { cleDecodee = decodeURIComponent(cle); } catch { /* clé non décodable : conservée telle quelle */ }
      return PARAMS_SENSIBLES.test(cleDecodee) ? `${cle}=[masque]` : paire;
    })
    .join('&');
  return `${chemin}?${masquee}`;
}

module.exports = { redigerUrl };
