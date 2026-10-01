// AUD-141 : la marque Nopalou ne peut pas être revendiquée par un vendeur (« Nopalou Officiel - Support Paiement »).
// La comparaison se fait sur une forme normalisée : accents retirés, minuscules, séparateurs supprimés et
// substitutions usuelles (0→o, 1→l, 3→e, 4→a, 5→s, $→s, @→a) pour déjouer « N0palou », « n.o.p.a.l.o.u », « Nopa1ou ».
const MARQUES = ['nopalou', 'yombale'];

const SUBSTITUTIONS = { '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', '$': 's', '@': 'a', '!': 'i', '|': 'l' };

function normaliser(texte) {
  return String(texte || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[01345$@!|]/g, (c) => SUBSTITUTIONS[c])
    .replace(/[^a-z]/g, '');
}

/** @returns {string|null} la marque trouvée dans le texte, ou null */
function marqueReservee(texte) {
  const n = normaliser(texte);
  if (!n) return null;
  return MARQUES.find((m) => n.includes(m)) || null;
}

/** Message d'erreur à renvoyer au vendeur, ou null si le nom est libre. */
function erreurNomReserve(...textes) {
  for (const t of textes) {
    const m = marqueReservee(t);
    if (m) {
      return `Le nom « ${m === 'nopalou' ? 'Nopalou' : 'Yombale'} » est réservé à la plateforme. Choisissez le nom de votre commerce.`;
    }
  }
  return null;
}

module.exports = { marqueReservee, erreurNomReserve, normaliser };
