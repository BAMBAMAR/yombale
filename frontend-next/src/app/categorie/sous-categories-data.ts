// ── Landing pages sous-catégories produits ───────────────────────────
// Consommé par /categorie/[slug]/[sousCategorie], le sitemap et le maillage interne.

export interface SousCategorieConfig {
  categorie: string      // slug de la catégorie parente
  label: string          // libellé court (liens, fil d'Ariane)
  h1: string
  titre: string          // <title> — SANS suffixe Nopalou (le template l'ajoute)
  description: string
  intro: string          // paragraphe sous le H1
  sousType: string       // paramètre sousType de l'API /api/produits
  emoji: string
  keywords: string[]
}

// Clé = "<slugCategorie>/<slugSousCategorie>" — l'URL est /categorie/<clé>
export const SOUS_CATEGORIES: Record<string, SousCategorieConfig> = {
  'tv-electro/climatiseurs': {
    categorie: 'tv-electro',
    label: 'Climatiseurs',
    h1: 'Climatiseur prix Dakar — comparez tous les modèles au Sénégal',
    titre: 'Climatiseur prix Dakar — Split, mobile, inverter au meilleur prix',
    description: `Comparez plus de 2 000 climatiseurs au Sénégal : split, mobile, inverter. Astech, Samsung, Hisense, Roch — trouvez le meilleur prix climatiseur à Dakar, mis à jour toutes les 6h.`,
    intro: `Quel est le prix d'un climatiseur à Dakar ? Nopalou compare en continu les climatiseurs split, mobiles et inverter vendus au Sénégal chez tous les grands marchands en ligne. Comptez environ 100 000 à 160 000 FCFA pour un split 1 CV d'entrée de gamme (Astech, Roch, Enduro), 150 000 à 250 000 FCFA pour un 1.5 CV, et davantage pour les modèles inverter Samsung ou Hisense, plus économes en électricité. Les climatiseurs mobiles (sans installation) démarrent autour de 100 000 FCFA.`,
    sousType: 'clim',
    emoji: '❄️',
    keywords: ['climatiseur prix Dakar', 'climatiseur mobile Dakar', 'climatiseur mobile prix Dakar', 'split 1.5cv prix Sénégal', 'climatiseur inverter Dakar', 'climatiseur Astech prix', 'mini climatiseur Dakar', 'climatiseur sans évacuation Dakar'],
  },
}
