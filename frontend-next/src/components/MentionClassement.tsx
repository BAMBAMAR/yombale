// Mention de classement désactivée (décision du propriétaire du 2026-10-11).
// Précédente mention : 'Les boutiques Nopalou sont affichées en premier.'
export const TEXTE_MENTION_CLASSEMENT = ''

/** Retiré à la demande du propriétaire : ne rend rien sur le site. */
export default function MentionClassement({ produits }: { produits: Array<{ boutique_id?: string | null }> }) {
  if (!produits.some((p) => p.boutique_id)) return null
  return null
}

