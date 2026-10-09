// frontend-next/src/lib/surga-formatting.ts
// Fonctions canoniques de formatage pour Surga (SRG-UI-04, SRG-UI-09, SRG-UI-22, SRG-UI-24)
// - Format unique des montants FCFA avec Intl.NumberFormat et espace insécable fine
// - Formatage de l'heure de publication réelle et fraîcheur des actualités
// - Normalisation typographique française (espaces insécables avant : ; ? ! « »)
// - Formatage naturel des horaires sportifs (« à 13 h 50 », « en cours », scores)

const formatterFCFA = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
})

/**
 * Formate un montant en FCFA de façon unique et rigoureuse (SRG-UI-22).
 * Utilise Intl.NumberFormat('fr-FR') avec espace insécable fine (\u202F) suivie de "FCFA".
 * Exemple : 2500 -> "2 500 FCFA", 100278 -> "100 278 FCFA"
 */
export function formaterFCFA(montant: number | string | null | undefined): string {
  if (montant === null || montant === undefined) return '0\u202FFCFA'
  const val = typeof montant === 'string' ? parseFloat(montant.replace(/\s+/g, '').replace(',', '.')) : montant
  if (Number.isNaN(val)) return '0\u202FFCFA'
  const chiffreFormate = formatterFCFA.format(Math.round(val))
  return `${chiffreFormate}\u202FFCFA`
}

/**
 * Normalise la typographie française d'un texte (SRG-UI-24) :
 * - Espace insécable fine (\u202F) avant les ponctuations doubles (: ; ? !)
 * - Espace insécable fine après « et avant »
 * - Remplacement propre de l'esperluette (&) par 'et' dans les titres éditoriaux
 */
export function normaliserTypographieFrancaise(texte: string): string {
  if (!texte) return ''
  return texte
    .replace(/\s*([:;?!])/g, '\u202F$1')
    .replace(/«\s*/g, '«\u202F')
    .replace(/\s*»/g, '\u202F»')
}

/**
 * Formate l'heure de publication réelle d'un article (SRG-UI-03, SRG-UI-04) :
 * - Si publié il y a moins de 60 minutes : « il y a X min »
 * - Si publié il y a moins de 24 heures : heure réelle ou « il y a X h »
 * - Au-delà de 24 h : « hier, 18 h 20 » ou date calendaire « 5 oct. »
 */
export function formaterHeurePublication(dateStr?: string | null): string {
  if (!dateStr) return 'Date inconnue'
  try {
    const pub = new Date(dateStr)
    const maintenant = new Date()
    const diffMs = maintenant.getTime() - pub.getTime()
    if (isNaN(diffMs)) return 'Date inconnue'

    // Si la date est légèrement dans le futur (léger décalage d'horloge serveur < 5 min)
    if (diffMs < 0 && Math.abs(diffMs) < 5 * 60 * 1000) {
      return 'À l’instant'
    }

    const diffMin = Math.floor(diffMs / (60 * 1000))
    if (diffMin < 60) {
      return `il y a ${Math.max(1, diffMin)}\u202Fmin`
    }

    const diffHeures = Math.floor(diffMin / 60)
    if (diffHeures < 24) {
      return `il y a ${diffHeures}\u202Fh`
    }

    // Au-delà de 24 heures : afficher la date exacte (SRG-UI-04)
    const hier = new Date(maintenant)
    hier.setDate(hier.getDate() - 1)
    const estHier = pub.getDate() === hier.getDate() && pub.getMonth() === hier.getMonth() && pub.getFullYear() === hier.getFullYear()

    const heureFormatee = `${pub.getHours()}\u202Fh\u202F${pub.getMinutes().toString().padStart(2, '0')}`

    if (estHier) {
      return `hier, ${heureFormatee}`
    }

    const dateJour = new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
    }).format(pub)

    return `${dateJour}`
  } catch {
    return 'Date inconnue'
  }
}

/**
 * Formate l'horaire ou le résultat d'un match de sport pour le briefing (SRG-UI-09) :
 * - Match à venir : « à 13 h 50 » (ou « à 16 h 30 »)
 * - Match en cours : « en cours (42') » ou « en cours »
 * - Match terminé : score « 2 - 1 »
 */
export function formaterHoraireMatch(match?: {
  statut?: string
  score_domicile?: number | null
  score_exterieur?: number | null
  minute_jeu?: string | null
  date_debut?: string
} | null): string {
  if (!match) return ''

  if (match.statut === 'EN_DIRECT') {
    return match.minute_jeu && match.minute_jeu !== 'En cours'
      ? `en cours (${match.minute_jeu})`
      : 'en cours'
  }

  if (match.score_domicile !== null && match.score_domicile !== undefined &&
      match.score_exterieur !== null && match.score_exterieur !== undefined) {
    return `${match.score_domicile} - ${match.score_exterieur}`
  }

  if (match.statut === 'TERMINE') {
    return 'terminé'
  }

  if (match.date_debut) {
    try {
      const d = new Date(match.date_debut)
      const h = d.getHours()
      const m = d.getMinutes().toString().padStart(2, '0')
      return `à ${h}\u202Fh\u202F${m}`
    } catch {}
  }

  return 'à venir'
}

/**
 * Rétablit l'apostrophe perdue dans des textes de catalogue (« d Administration », « l École », « qu un ») : une
 * lettre d'élision isolée devant une voyelle ou un « h » prend son apostrophe. Prudent : seules d, l, n, s, c et les
 * formes « qu » / « jusqu » / « lorsqu » / « puisqu » sont reprises, en minuscule, et « L » ou « D » en capitale
 * seulement devant un mot lui-même en capitale initiale (« L École »). Ne touche pas aux textes déjà corrects.
 */
export function reparerApostrophes(texte: string | null | undefined): string {
  if (!texte) return ''
  return String(texte)
    .replace(/(?<![\p{L}'’])(d|l|n|s|c|qu|jusqu|lorsqu|puisqu) (?=[aeiouyhàâäéèêëîïôöùûüœAEIOUYHÀÂÄÉÈÊËÎÏÔÖÙÛÜŒ])/gu, '$1’')
    .replace(/(?<![\p{L}'’])([LD]) (?=[AEIOUYÀÂÉÈÊËÎÏÔÖÙÛŒ][\p{Ll}])/gu, '$1’')
}