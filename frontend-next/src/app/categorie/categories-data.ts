// ── Données SEO par catégorie ────────────────────────────────────────
// Partagé entre /categorie/[slug], /categorie/[slug]/[sousCategorie] et le sitemap.

export const CATEGORIES: Record<string, {
  label: string
  h1: string
  intro: string
  description: string
  keywords: string[]
  emoji: string
  exemples: string
}> = {
  smartphones: {
    label: 'Téléphones & Smartphones',
    emoji: '📱',
    h1: 'Téléphones & Smartphones au Sénégal',
    intro: 'Comparez les prix de smartphones et téléphones portables chez tous les marchands du Sénégal. Samsung, iPhone, Infinix, Tecno, Xiaomi — trouvez le meilleur prix à Dakar et dans tout le pays sans vous déplacer.',
    description: 'Comparez les prix de smartphones et téléphones portables au Sénégal. Samsung, iPhone, Infinix, Xiaomi — les meilleures offres à Dakar et partout au Sénégal.',
    keywords: [
      'smartphone Sénégal', 'téléphone Dakar', 'prix téléphone Sénégal', 'Samsung Dakar', 'iPhone Sénégal', 'Infinix prix Dakar', 'Tecno Sénégal', 'Xiaomi Dakar',
      'Téléphone 20000 FCFA', 'Jumia Promo Téléphone', 'Téléphone de 30000 FCFA', 'Téléphone moins cher Dakar',
      'Téléphone portable prix Sénégal', 'Téléphone 40000 FCFA', 'Téléphone 10000 FCFA', 'Promo téléphone Orange Senegal',
    ],
    exemples: 'Samsung Galaxy, iPhone, Infinix, Tecno, Xiaomi',
  },
  informatique: {
    label: 'Informatique & Ordinateurs',
    emoji: '💻',
    h1: 'Ordinateurs & Informatique au Sénégal',
    intro: 'Comparez les prix d\'ordinateurs portables, PC de bureau, tablettes, imprimantes et accessoires informatiques au Sénégal. Les meilleures offres HP, Dell, Lenovo, Asus à Dakar et dans tout le pays.',
    description: 'Comparez les prix d\'ordinateurs portables et matériel informatique au Sénégal. HP, Dell, Lenovo — les meilleures offres à Dakar.',
    keywords: ['ordinateur portable Dakar', 'PC Sénégal', 'laptop prix Dakar', 'informatique Sénégal', 'tablette Dakar', 'HP Sénégal', 'Dell Dakar', 'Lenovo Sénégal'],
    exemples: 'Laptops HP, Dell, Lenovo, tablettes Samsung',
  },
  'tv-electro': {
    label: 'Télévisions & Électroménager',
    emoji: '📺',
    h1: 'Télévisions & Électroménager au Sénégal',
    intro: 'Comparez les prix de télévisions, réfrigérateurs, climatiseurs, machines à laver et tout l\'électroménager au Sénégal. Samsung, LG, Hisense, TCL — les meilleures offres TV et électro à Dakar.',
    description: 'Comparez les prix de télévisions et électroménager au Sénégal. TV Samsung, LG, Hisense — réfrigérateurs, climatiseurs, les meilleures offres à Dakar.',
    keywords: [
      'télévision Dakar', 'TV Sénégal', 'réfrigérateur Dakar', 'électroménager Sénégal', 'climatiseur Dakar', 'Samsung TV Sénégal', 'LG prix Dakar', 'Hisense Sénégal', 'machine à laver Dakar',
      'TV Smart 43 pouces Prix Dakar', 'Smart TV 32 pouces Prix Sénégal', 'Télévision Smart TV 32', 'Smart TV prix Sénégal',
      'Jumia TV 43 Pouces', 'Télévision Dakar', 'Télévision Smart TV 43 pouces', 'Jumia TV 32 Pouces',
      'Prix Frigo Sénégal', 'Prix frigo Samsung Sénégal', 'Jumia Frigo Prix', 'Frigo congélateur prix',
      'Prix Frigo ASTECH', 'Frigo deux portes prix', 'Frigo Bar prix Dakar', 'Jumia Frigo bar Prix',
      'Climatiseur 1.5CV prix Dakar', 'Climatiseur 2 chevaux prix Dakar', 'Prix Climatiseur Samsung Sénégal',
      'Climatiseur Inverter 1.5CV prix Dakar', 'Climatiseur 1 CV prix', 'Climatiseur Dakar prix',
      'Climatiseur Inverter prix Dakar', 'Climatiseur Beko Dakar prix',
    ],
    exemples: 'TV Samsung, LG, Hisense, réfrigérateurs, climatiseurs',
  },
  mode: {
    label: 'Mode & Vêtements',
    emoji: '👗',
    h1: 'Mode & Vêtements au Sénégal',
    intro: 'Découvrez et comparez les prix de vêtements, chaussures, sacs et accessoires de mode au Sénégal. Les meilleures offres shopping en ligne à Dakar.',
    description: 'Comparez les prix de vêtements et accessoires de mode au Sénégal. Les meilleures offres à Dakar et partout au Sénégal.',
    keywords: ['mode Dakar', 'vêtements Sénégal', 'shopping Dakar', 'chaussures Dakar', 'mode Sénégal'],
    exemples: 'Vêtements, chaussures, sacs, accessoires',
  },
  maison: {
    label: 'Maison & Décoration',
    emoji: '🏠',
    h1: 'Maison & Décoration au Sénégal',
    intro: 'Comparez les prix de meubles, articles de décoration intérieure et équipements pour la maison au Sénégal. Trouvez les meilleures offres à Dakar et dans toutes les villes.',
    description: 'Comparez les prix de meubles et décoration pour la maison au Sénégal. Les meilleures offres à Dakar.',
    keywords: ['meubles Dakar', 'décoration maison Sénégal', 'ameublement Dakar', 'maison Sénégal', 'mobilier Dakar'],
    exemples: 'Meubles, canapés, décoration, cuisine',
  },
  'auto-moto': {
    label: 'Auto & Moto',
    emoji: '🚗',
    h1: 'Auto & Moto au Sénégal',
    intro: 'Comparez les prix de pièces automobiles, accessoires moto, pneus et équipements pour voitures au Sénégal. Les meilleures offres pour votre véhicule à Dakar.',
    description: 'Comparez les prix de pièces auto et accessoires moto au Sénégal. Les meilleures offres à Dakar.',
    keywords: ['pièces auto Dakar', 'moto Sénégal', 'accessoires voiture Dakar', 'auto Sénégal', 'pneus Dakar'],
    exemples: 'Pièces auto, accessoires, pneus, équipement moto',
  },
  jeux: {
    label: 'Jeux Vidéo & Consoles',
    emoji: '🎮',
    h1: 'Jeux Vidéo & Consoles au Sénégal',
    intro: 'Comparez les prix de jeux vidéo, consoles PlayStation, Xbox, Nintendo Switch et accessoires gaming au Sénégal. Les meilleures offres gaming à Dakar.',
    description: 'Comparez les prix de jeux vidéo et consoles gaming au Sénégal. PlayStation, Xbox, Nintendo — les meilleures offres à Dakar.',
    keywords: ['PlayStation Dakar', 'jeux vidéo Sénégal', 'console jeux Dakar', 'Xbox Sénégal', 'Nintendo Dakar', 'gaming Sénégal'],
    exemples: 'PlayStation, Xbox, Nintendo Switch, manettes, jeux',
  },
  beaute: {
    label: 'Beauté & Santé',
    emoji: '💄',
    h1: 'Beauté & Cosmétiques au Sénégal',
    intro: 'Comparez les prix de cosmétiques, parfums, produits de soin beauté et articles de santé au Sénégal. Les meilleures offres beauté à Dakar et dans tout le pays.',
    description: 'Comparez les prix de cosmétiques et produits beauté au Sénégal. Les meilleures offres à Dakar.',
    keywords: ['cosmétiques Dakar', 'beauté Sénégal', 'parfum Dakar', 'soin beauté Sénégal', 'maquillage Dakar'],
    exemples: 'Parfums, cosmétiques, soins, maquillage',
  },
}
