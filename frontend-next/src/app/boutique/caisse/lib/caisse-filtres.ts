/**
 * Utilitaires de filtrage pour le catalogue de caisse POS
 */

const CAISSE_CAT_ALIASES: Record<string, string[]> = {
  'smartphones': ['smartphone', 'smartphones', 'telephone', 'telephones', 'telephonie', 'phone', 'mobile'],
  'informatique': ['informatique', 'ordinateur', 'ordinateurs', 'laptop', 'laptops', 'pc', 'high-tech'],
  'tv-electro': ['tv-electro', 'tv', 'electro', 'electromenager', 'electronique', 'électronique', 'hi-fi'],
  'mode': ['mode', 'vetement', 'vetements', 'habillement', 'chaussure', 'chaussures', 'robe', 'pantalon'],
  'maison': ['maison', 'decoration', 'deco', 'mobilier', 'meuble'],
  'auto-moto': ['auto-moto', 'auto', 'moto', 'vehicule', 'pieces-auto'],
  'jeux': ['jeux', 'consoles', 'gaming', 'jeu-video'],
  'alimentation': ['alimentation', 'epicerie', 'épicerie', 'nourriture', 'agroalimentaire'],
  'beaute': ['beaute', 'cosmetique', 'cosmetiques', 'soin', 'soins'],
  'parfum': ['parfum', 'parfums', 'parfumerie', 'fragrance'],
  'sport': ['sport', 'fitness'],
  'fournitures': ['fournitures', 'bureautique', 'papeterie'],
  'quincaillerie': ['quincaillerie', 'btp', 'outillage'],
  'sante-pharma': ['sante-pharma', 'sante', 'pharmacie'],
  'services': ['services', 'service', 'prestation'],
}

export function matchCaisseCategorie(prodCat?: string | null, filtre?: string | null): boolean {
  if (!filtre || filtre === 'tous' || filtre === 'all') return true
  if (!prodCat) return false
  const p = prodCat.trim().toLowerCase()
  const f = filtre.trim().toLowerCase()
  if (p === f) return true

  const targetAliases = CAISSE_CAT_ALIASES[f] || [f]
  return targetAliases.some(a => p.includes(a) || a.includes(p))
}
