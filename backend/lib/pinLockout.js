// backend/lib/pinLockout.js — Verrouillage progressif des essais de code PIN (caisse).
// Un PIN de 4 à 6 chiffres se devine par force brute en quelques milliers d'essais : après N échecs consécutifs depuis une
// même source, la source est bloquée pendant une durée croissante ; un plafond par boutique protège aussi contre les
// attaques réparties sur plusieurs adresses IP. Stockage en mémoire du processus (une instance) : un redémarrage remet les
// compteurs à zéro, limite connue.

const FENETRE_MS = 15 * 60 * 1000;
const ESSAIS_PAR_SOURCE = 5;
const ESSAIS_PAR_BOUTIQUE = 40;
const BLOCAGE_MAX_MS = 60 * 60 * 1000;

const compteurs = new Map(); // clé -> { echecs, premier, bloqueJusqua, paliers }

function lire(cle, maintenant) {
  const c = compteurs.get(cle);
  if (!c) return null;
  if (c.bloqueJusqua && c.bloqueJusqua <= maintenant) { c.bloqueJusqua = 0; c.echecs = 0; c.premier = 0; }
  if (!c.bloqueJusqua && c.premier && maintenant - c.premier > FENETRE_MS) { c.echecs = 0; c.premier = 0; }
  return c;
}

// Renvoie { bloque: boolean, attenteSecondes: number }
function verifier(boutiqueId, source, maintenant = Date.now()) {
  let attente = 0;
  for (const cle of [`src:${boutiqueId}:${source}`, `bq:${boutiqueId}`]) {
    const c = lire(cle, maintenant);
    if (c && c.bloqueJusqua > maintenant) attente = Math.max(attente, Math.ceil((c.bloqueJusqua - maintenant) / 1000));
  }
  return { bloque: attente > 0, attenteSecondes: attente };
}

function enregistrerEchec(boutiqueId, source, maintenant = Date.now()) {
  for (const [cle, plafond] of [[`src:${boutiqueId}:${source}`, ESSAIS_PAR_SOURCE], [`bq:${boutiqueId}`, ESSAIS_PAR_BOUTIQUE]]) {
    const c = lire(cle, maintenant) || { echecs: 0, premier: 0, bloqueJusqua: 0, paliers: 0 };
    if (!c.premier) c.premier = maintenant;
    c.echecs += 1;
    if (c.echecs >= plafond) {
      c.paliers += 1;
      c.bloqueJusqua = maintenant + Math.min(BLOCAGE_MAX_MS, 60 * 1000 * 2 ** (c.paliers - 1)); // 1, 2, 4, 8… minutes
      c.echecs = 0;
      c.premier = 0;
    }
    compteurs.set(cle, c);
  }
}

// Un PIN correct remet à zéro la source (pas le plafond de boutique, qui reste une protection globale).
function enregistrerSucces(boutiqueId, source) {
  compteurs.delete(`src:${boutiqueId}:${source}`);
}

function reinitialiserTout() { compteurs.clear(); }

module.exports = { verifier, enregistrerEchec, enregistrerSucces, reinitialiserTout, ESSAIS_PAR_SOURCE, ESSAIS_PAR_BOUTIQUE };
