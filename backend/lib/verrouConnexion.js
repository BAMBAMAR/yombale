// AUD-148 : limite des échecs de connexion PAR COMPTE (en plus de la limite par IP, contournable par rotation d'adresses).
// 5 échecs en 15 minutes verrouillent les tentatives sur ce compte jusqu'à la fin de la fenêtre ; une connexion réussie
// remet le compteur à zéro. Les e-mails inconnus comptent aussi (pas d'oracle « ce compte existe »). Mémoire du processus.
const MAX_ECHECS = 5;
const FENETRE_MS = 15 * 60 * 1000;
const echecs = new Map();

const actif = () => process.env.NODE_ENV !== 'test' || !!process.env.FORCE_RATE_LIMITS;
const cle = (email) => String(email || '').trim().toLowerCase();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of echecs) if (now > v.reset) echecs.delete(k);
}, 5 * 60 * 1000).unref();

/** @returns {number} secondes à attendre si le compte est verrouillé, sinon 0 */
function secondesDeVerrou(email) {
  if (!actif()) return 0;
  const e = echecs.get(cle(email));
  if (!e || Date.now() > e.reset || e.n < MAX_ECHECS) return 0;
  return Math.ceil((e.reset - Date.now()) / 1000);
}

function enregistrerEchec(email) {
  if (!actif()) return;
  const k = cle(email);
  const now = Date.now();
  const e = echecs.get(k);
  if (!e || now > e.reset) echecs.set(k, { n: 1, reset: now + FENETRE_MS });
  else e.n += 1;
}

function effacerEchecs(email) {
  echecs.delete(cle(email));
}

module.exports = { secondesDeVerrou, enregistrerEchec, effacerEchecs, MAX_ECHECS };
