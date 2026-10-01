// AUD-162 : description des fiches produit du comparateur. Le scraper enregistre `description = nom` quand la source
// n'en fournit pas ; reprise telle quelle, elle duplique le titre dans la méta-description et dans la page.
// Fichier pur, isomorphe serveur et navigateur.

const SEUIL_UTILE = 40

function normaliser(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/** Description exploitable : au moins 40 caractères et différente du nom du produit ; sinon chaîne vide. */
export function descriptionProduitUtile(nom: string, description: string | null | undefined): string {
  const d = (description ?? '').replace(/\s+/g, ' ').trim()
  if (d.length < SEUIL_UTILE) return ''
  const nd = normaliser(d)
  const nn = normaliser(nom)
  if (nd === nn || nd.startsWith(nn) && nd.length - nn.length < 15) return ''
  return d
}

/** Méta-description : description utile coupée à 155 caractères, sinon texte de comparaison (prix et nombre d'offres). */
export function descriptionMetaProduit(p: {
  nom: string
  description: string | null | undefined
  prixMinTexte: string | null
  nbOffres: number | null | undefined
}): string {
  const utile = descriptionProduitUtile(p.nom, p.description)
  if (utile) {
    if (utile.length <= 155) return utile
    const brut = utile.slice(0, 155)
    const espace = brut.lastIndexOf(' ')
    return (espace > 100 ? brut.slice(0, espace) : brut).replace(/[\s·,;:\-–—]+$/u, '') + '…'
  }
  const vendeurs = p.nbOffres && p.nbOffres > 1 ? `${p.nbOffres} vendeurs` : 'les vendeurs'
  const prix = p.prixMinTexte ? ` à partir de ${p.prixMinTexte}` : ''
  return `Comparez le prix de ${p.nom} chez ${vendeurs} au Sénégal${prix}. Meilleure offre à Dakar et partout au Sénégal.`
}
