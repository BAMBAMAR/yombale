// Les listes filtrées placent les boutiques Nopalou avant les offres du comparateur : on le dit (décision du propriétaire).
export const TEXTE_MENTION_CLASSEMENT = 'Les boutiques Nopalou sont affichées en premier.'

/** Ligne discrète au-dessus des résultats ; n'affiche rien si aucun résultat ne vient d'une boutique. */
export default function MentionClassement({ produits }: { produits: Array<{ boutique_id?: string | null }> }) {
  if (!produits.some((p) => p.boutique_id)) return null
  return (
    <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text-subtle, #5A4E42)' }}>
      {TEXTE_MENTION_CLASSEMENT}
    </p>
  )
}
