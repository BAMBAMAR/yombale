// Variante du garde d'isolation pour la recette sur téléphone (frontend à l'écoute sur le Wi-Fi local).
// Le garde d'origine (../audit-guard.js) reste entièrement actif : toute résolution ou connexion sortante hors
// boucle locale est refusée. Cette variante n'autorise en plus QUE les adresses d'écoute génériques `0.0.0.0` et `::`,
// que Node résout au démarrage du serveur (`listen(port, host)`). Aucune ouverture vers l'extérieur.
require('../audit-guard.js');
const dns = require('dns');
const gardeLookup = dns.lookup;
dns.lookup = function (h, o, cb) {
  if (h === '0.0.0.0' || h === '::') {
    if (typeof o === 'function') { cb = o; o = {}; }
    const famille = h === '::' ? 6 : 4;
    return process.nextTick(() => (o && o.all ? cb(null, [{ address: h, family: famille }]) : cb(null, h, famille)));
  }
  return gardeLookup.apply(this, arguments);
};
