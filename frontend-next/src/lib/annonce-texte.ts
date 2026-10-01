// AUD-155 : nettoyage du texte libre des annonces importées (Facebook, sites tiers) avant tout affichage public
// (titre, description, méta-description, JSON-LD). Fichier pur, isomorphe serveur et navigateur.
//
// Ce qui est retiré : liens, numéros sénégalais (le numéro d'un particulier ne sort que par la révélation au clic,
// AUD-137), lettres éparpillées (texte anti-copie de Facebook importé tel quel) et en-tête d'auteur.
// Ce qui est conservé : prix, surfaces, années, tout nombre qui n'est pas un numéro de téléphone.

const RE_URL = /(?:https?:\/\/|www\.|wa\.me\/)\S+/gi
// Mobiles 70, 75-78 et fixes 33, indicatif facultatif, séparateurs espace, point ou tiret ; exactement 9 chiffres
const RE_TEL = /(?<!\d)(?:(?:\+|00)?221[\s.\-]?)?(?:7[05-8]|33)(?:[\s.\-]?\d){7}(?!\d)/g
// Préfixe de localité en majuscules collé au titre (« DAKAR, SÉNÉGAL Hyundai … »)
const RE_PREFIXE_LOCALITE = /^\s*[A-ZÉÈÀÂÎÔÛÇ' \-]{3,30},\s*S[ÉE]N[ÉE]GAL\s+/
const SEUIL_LETTRES_EPARPILLEES = 6

function compacter(t: string): string {
  return t
    .replace(/\s+/g, ' ')
    .replace(/(?:\s*[·|•\-–—:,;]\s*)+$/u, '')
    .replace(/^(?:\s*[·|•\-–—:,;]\s*)+/u, '')
    .trim()
}

/** Retire les suites de 6 caractères isolés ou plus ; renvoie le texte et un indicateur de présence. */
function retirerLettresEparpillees(t: string): { texte: string; trouve: boolean } {
  const jetons = t.split(/\s+/).filter(Boolean)
  const sortie: string[] = []
  let trouve = false
  let i = 0
  while (i < jetons.length) {
    let j = i
    while (j < jetons.length && /^[\p{L}\d]$/u.test(jetons[j])) j++
    if (j - i >= SEUIL_LETTRES_EPARPILLEES) { trouve = true; i = j; continue }
    sortie.push(jetons[i])
    i++
  }
  return { texte: sortie.join(' '), trouve }
}

/** Retire les segments d'en-tête courts, sans chiffre (nom d'auteur, « Suivre ») placés avant le contenu. */
function retirerEnteteAuteur(t: string): string {
  const segments = t.split(/\s·\s/)
  while (segments.length > 1) {
    const s = segments[0].trim()
    const mots = s.split(/\s+/).filter(Boolean).length
    if (s === '' || s.toLowerCase() === 'suivre' || (mots <= 4 && s.length <= 40 && !/\d/.test(s))) segments.shift()
    else break
  }
  return segments.join(' · ')
}

function motsEtChiffres(s: string): { mots: number; chiffres: boolean } {
  return { mots: s.split(/\s+/).filter(Boolean).length, chiffres: /\d/.test(s) }
}

function coupe(t: string, max: number): string {
  if (t.length <= max) return t
  const brut = t.slice(0, max)
  const espace = brut.lastIndexOf(' ')
  return (espace > max * 0.6 ? brut.slice(0, espace) : brut).replace(/[\s·,;:\-–—]+$/u, '') + '…'
}

/** Texte d'annonce prêt à afficher publiquement. Chaîne vide si rien d'exploitable ne reste. */
export function nettoyerTexteAnnonce(texte: string | null | undefined): string {
  if (!texte) return ''
  let t = String(texte).replace(RE_URL, ' ').replace(RE_TEL, ' ')
  const eparpille = retirerLettresEparpillees(t)
  t = eparpille.texte
  if (eparpille.trouve || /(?:^|\s·\s)Suivre(?:\s·\s|$)/i.test(t)) t = retirerEnteteAuteur(t)
  return compacter(t)
}

/** Titre d'annonce nettoyé : sans préfixe de localité en majuscules, ni numéro, ni lien. */
export function nettoyerTitreAnnonce(titre: string | null | undefined): string {
  if (!titre) return ''
  const t = String(titre).replace(RE_URL, ' ').replace(RE_TEL, ' ')
  return compacter(t.replace(RE_PREFIXE_LOCALITE, '')).replace(RE_PREFIXE_LOCALITE, '')
}

/**
 * Titre à afficher. Quand le titre importé n'est qu'un nom d'auteur (courts mots sans chiffre) et que la description
 * en dit plus, on prend le début de la description ; si rien d'exploitable ne reste, on retourne `repli`.
 */
export function titreAffichableAnnonce(
  titre: string | null | undefined,
  description: string | null | undefined,
  repli: string,
): string {
  const t = nettoyerTitreAnnonce(titre)
  const estUnNom = t !== '' && motsEtChiffres(t).mots <= 3 && !motsEtChiffres(t).chiffres
  if (t !== '' && !estUnNom) return t
  const brut = description ? String(description) : ''
  const debutDescription = t !== '' && brut.toLowerCase().startsWith(t.toLowerCase())
  if (estUnNom && debutDescription) {
    const reste = nettoyerTexteAnnonce(brut.slice(t.length).replace(/^\s*·\s*/, ''))
    if (reste.length >= 15) return coupe(reste, 70)
  }
  return t !== '' && estUnNom ? t : repli
}

/** Méta-description : texte nettoyé coupé à 155 caractères ; `repli` si moins de 25 caractères exploitables. */
export function descriptionMetaAnnonce(description: string | null | undefined, repli: string): string {
  const t = nettoyerTexteAnnonce(description)
  return t.length >= 25 ? coupe(t, 155) : repli
}
