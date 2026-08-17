export type TypeVarianteId = 'couleur' | 'taille' | 'pointure' | 'stockage' | 'capacite' | 'autre'

export const CHAMP_VERS_TYPE_VARIANTE: Record<'taille' | 'couleur' | 'stockage', TypeVarianteId> = {
  taille: 'taille',
  couleur: 'couleur',
  stockage: 'stockage',
}

export function champVisibleSelonVariante(
  champ: 'taille' | 'couleur' | 'stockage',
  typesVarianteActifs: Set<TypeVarianteId>
): boolean {
  return !typesVarianteActifs.has(CHAMP_VERS_TYPE_VARIANTE[champ])
}

export const NOMS_PAR_DEFAUT: Record<string, string> = {
  'smartphones':  'Smartphone — à modifier',
  'informatique': 'Article informatique — à modifier',
  'tv-electro':   'TV / Électroménager — à modifier',
  'mode':         'Article mode — à modifier',
  'maison':       'Article maison — à modifier',
  'auto-moto':    'Véhicule — à modifier',
  'jeux':         'Jeu / Console — à modifier',
  'alimentation': 'Produit alimentaire — à modifier',
  'beaute':       'Produit beauté — à modifier',
  'services':     'Service — à modifier',
  'autre':        'Produit — à modifier',
}

export function nomParDefautPourCategorie(categorie: string): string {
  return NOMS_PAR_DEFAUT[categorie] ?? 'Produit — à modifier'
}
