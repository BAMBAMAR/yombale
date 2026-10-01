// AUD-137 / AUD-142 : le numéro d'un particulier n'est plus envoyé aux listes, aux fiches ni au rendu des pages.
// Le visiteur voit « 78 589 •• •• » ; un clic appelle POST …/contact (limité, journalisé) qui renvoie le numéro.
// Les numéros officiels des agences (agence.telephone / agence.whatsapp) restent publics : ce sont des contacts commerciaux.
const SANS_NUMERO = new Set(['', 'voir sur facebook']);

function chiffres(tel) {
  return String(tel || '').replace(/\D/g, '');
}

/** Numéro national à 9 chiffres (sans indicatif), ou '' si le texte n'est pas un numéro. */
function nationalNeuf(tel) {
  const d = chiffres(tel);
  return d.length >= 9 ? d.slice(-9) : '';
}

/** « 78 589 80 10 » → « 78 589 •• •• » ; texte non numérique → null. */
function masquerTel(tel) {
  const n = nationalNeuf(tel);
  if (!n) return null;
  return `${n.slice(0, 2)} ${n.slice(2, 5)} •• ••`;
}

function telDisponible(tel) {
  return !SANS_NUMERO.has(String(tel || '').trim().toLowerCase()) && nationalNeuf(tel) !== '';
}

// Champs internes qui n'ont pas à figurer dans une liste publique (AUD-142)
const CHAMPS_INTERNES_LISTE = ['utilisateur_id', 'ref_externe', 'motif_rejet', 'rejete', 'supprimee', 'demande_sponsorisation'];

/**
 * Remplace contact_tel par sa version masquée.
 * @param {object} row ligne d'annonce (annonces_immo ou annonces_classifiees)
 * @param {{ liste?: boolean }} opts liste = retirer aussi les champs internes
 */
function protegerContact(row, { liste = false } = {}) {
  if (!row || typeof row !== 'object') return row;
  const { contact_tel, ...reste } = row;
  if (liste) for (const k of CHAMPS_INTERNES_LISTE) delete reste[k];
  return {
    ...reste,
    contact_tel_masque: masquerTel(contact_tel),
    contact_tel_disponible: telDisponible(contact_tel),
    contact_sur_facebook: String(contact_tel || '').trim().toLowerCase() === 'voir sur facebook',
  };
}

module.exports = { protegerContact, masquerTel, telDisponible, nationalNeuf, chiffres };
