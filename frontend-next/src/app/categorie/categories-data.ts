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
  contenu: string[]
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
    contenu: [
      `Le marché du téléphone au Sénégal est dominé par cinq marques : Samsung et sa gamme Galaxy A, Tecno et Infinix très populaires pour leur rapport qualité/prix, Xiaomi/Redmi en forte progression, et l'iPhone qui reste la référence du haut de gamme, souvent acheté d'occasion. Les prix s'étalent de 40 000 FCFA pour un smartphone d'entrée de gamme neuf à plus de 800 000 FCFA pour un iPhone récent scellé.`,
      `Avant d'acheter un téléphone à Dakar, comparez toujours l'état (neuf, occasion, reconditionné — affiché sur chaque offre Nopalou), la RAM et le stockage réels, et le prix chez plusieurs marchands : pour un même modèle, l'écart entre vendeurs dépasse souvent 30 000 FCFA. Les alertes prix Nopalou vous préviennent dès qu'une offre passe sous votre budget.`,
    ],
  },
  informatique: {
    label: 'Informatique & Ordinateurs',
    emoji: '💻',
    h1: 'Ordinateurs & Informatique au Sénégal',
    intro: 'Comparez les prix d\'ordinateurs portables, PC de bureau, tablettes, imprimantes et accessoires informatiques au Sénégal. Les meilleures offres HP, Dell, Lenovo, Asus à Dakar et dans tout le pays.',
    description: 'Comparez les prix d\'ordinateurs portables et matériel informatique au Sénégal. HP, Dell, Lenovo — les meilleures offres à Dakar.',
    keywords: ['ordinateur portable Dakar', 'PC Sénégal', 'laptop prix Dakar', 'informatique Sénégal', 'tablette Dakar', 'HP Sénégal', 'Dell Dakar', 'Lenovo Sénégal'],
    exemples: 'Laptops HP, Dell, Lenovo, tablettes Samsung',
    contenu: [
      `Ordinateurs portables HP, Dell et Lenovo dominent le marché sénégalais, en neuf comme en occasion — le marché de l'occasion (souvent importé d'Europe) offre d'excellentes affaires entre 100 000 et 200 000 FCFA pour de la bureautique. Pour du graphisme ou du développement, visez 8 à 16 Go de RAM et un SSD, entre 250 000 et 500 000 FCFA.`,
      `Nopalou compare aussi les imprimantes, écrans, routeurs et accessoires. Vérifiez le clavier (AZERTY/QWERTY) et la génération du processeur sur les offres d'occasion — deux modèles au même prix peuvent avoir 5 ans d'écart.`,
    ],
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
    contenu: [
      `TV, climatiseurs, réfrigérateurs et machines à laver : l'électroménager représente l'essentiel du budget équipement d'un foyer sénégalais. Les marques locales et régionales (Astech, Enduro, Finix, Bruhm) cassent les prix face à Samsung, LG et Hisense — souvent 30 à 50% moins cher à taille égale, avec des garanties locales de 12 mois.`,
      `Pour un climatiseur, comparez la puissance en CV/BTU et privilégiez l'inverter si vous l'utilisez chaque jour : il consomme jusqu'à 40% de moins. Pour une TV, le prix au pouce est le meilleur repère ; pour un frigo, la capacité en litres. Ces caractéristiques sont extraites automatiquement sur les offres Nopalou pour comparer à specs égales.`,
    ],
  },
  mode: {
    label: 'Mode & Vêtements',
    emoji: '👗',
    h1: 'Mode & Vêtements au Sénégal',
    intro: 'Découvrez et comparez les prix de vêtements, chaussures, sacs et accessoires de mode au Sénégal. Les meilleures offres shopping en ligne à Dakar.',
    description: 'Comparez les prix de vêtements et accessoires de mode au Sénégal. Les meilleures offres à Dakar et partout au Sénégal.',
    keywords: ['mode Dakar', 'vêtements Sénégal', 'shopping Dakar', 'chaussures Dakar', 'mode Sénégal'],
    exemples: 'Vêtements, chaussures, sacs, accessoires',
    contenu: [
      `Vêtements, chaussures, sacs et parfums : la mode en ligne au Sénégal se partage entre les grandes plateformes et les vendeurs Instagram/WhatsApp. Nopalou regroupe les offres des marchands en ligne établis pour comparer les prix réels, notamment sur les sneakers et les parfums où les écarts sont les plus forts.`,
      `Attention aux contrefaçons sur les articles de marque : un prix anormalement bas (moins de 30% du prix boutique) est un signal d'alerte. Privilégiez les vendeurs notés et les boutiques vérifiées.`,
    ],
  },
  maison: {
    label: 'Maison & Décoration',
    emoji: '🏠',
    h1: 'Maison & Décoration au Sénégal',
    intro: 'Comparez les prix de meubles, articles de décoration intérieure et équipements pour la maison au Sénégal. Trouvez les meilleures offres à Dakar et dans toutes les villes.',
    description: 'Comparez les prix de meubles et décoration pour la maison au Sénégal. Les meilleures offres à Dakar.',
    keywords: ['meubles Dakar', 'décoration maison Sénégal', 'ameublement Dakar', 'maison Sénégal', 'mobilier Dakar'],
    exemples: 'Meubles, canapés, décoration, cuisine',
    contenu: [
      `Meubles, canapés, matelas et équipement de cuisine : le mobilier au Sénégal combine production locale (menuiseries de Dakar, souvent sur commande) et importation. Les prix en ligne sont surtout intéressants sur les matelas, la literie et le petit équipement.`,
      `Comparez les dimensions exactes et les matériaux avant d'acheter : deux canapés au même prix peuvent aller du simple au double en qualité de mousse et de structure.`,
    ],
  },
  'auto-moto': {
    label: 'Auto & Moto',
    emoji: '🚗',
    h1: 'Auto & Moto au Sénégal',
    intro: 'Comparez les prix de pièces automobiles, accessoires moto, pneus et équipements pour voitures au Sénégal. Les meilleures offres pour votre véhicule à Dakar.',
    description: 'Comparez les prix de pièces auto et accessoires moto au Sénégal. Les meilleures offres à Dakar.',
    keywords: ['pièces auto Dakar', 'moto Sénégal', 'accessoires voiture Dakar', 'auto Sénégal', 'pneus Dakar'],
    exemples: 'Pièces auto, accessoires, pneus, équipement moto',
    contenu: [
      `Pièces détachées, pneus, batteries et accessoires : l'entretien automobile à Dakar passe de plus en plus par l'achat en ligne des pièces, montées ensuite par votre mécanicien. Les scooters et motos (très demandés pour la livraison) apparaissent aussi dans les annonces.`,
      `Pour les pièces, vérifiez toujours la compatibilité exacte avec votre modèle et l'origine (neuve, occasion, adaptable) — le prix seul ne suffit pas à comparer.`,
    ],
  },
  jeux: {
    label: 'Jeux Vidéo & Consoles',
    emoji: '🎮',
    h1: 'Jeux Vidéo & Consoles au Sénégal',
    intro: 'Comparez les prix de jeux vidéo, consoles PlayStation, Xbox, Nintendo Switch et accessoires gaming au Sénégal. Les meilleures offres gaming à Dakar.',
    description: 'Comparez les prix de jeux vidéo et consoles gaming au Sénégal. PlayStation, Xbox, Nintendo — les meilleures offres à Dakar.',
    keywords: ['PlayStation Dakar', 'jeux vidéo Sénégal', 'console jeux Dakar', 'Xbox Sénégal', 'Nintendo Dakar', 'gaming Sénégal'],
    exemples: 'PlayStation, Xbox, Nintendo Switch, manettes, jeux',
    contenu: [
      `PlayStation domine le gaming au Sénégal : PS4 d'occasion (autour de 120 000 à 180 000 FCFA) et PS5 (350 000 FCFA et plus selon l'édition) constituent l'essentiel du marché, complétées par les manettes, les jeux et les cartes PSN.`,
      `Sur les consoles d'occasion, vérifiez l'état du lecteur de disque et la version (Slim, Pro, édition digitale). Nopalou compare les offres de tous les vendeurs en ligne pour repérer le prix juste avant de négocier.`,
    ],
  },
  beaute: {
    label: 'Beauté & Santé',
    emoji: '💄',
    h1: 'Beauté & Cosmétiques au Sénégal',
    intro: 'Comparez les prix de cosmétiques, parfums, produits de soin beauté et articles de santé au Sénégal. Les meilleures offres beauté à Dakar et dans tout le pays.',
    description: 'Comparez les prix de cosmétiques et produits beauté au Sénégal. Les meilleures offres à Dakar.',
    keywords: ['cosmétiques Dakar', 'beauté Sénégal', 'parfum Dakar', 'soin beauté Sénégal', 'maquillage Dakar'],
    exemples: 'Parfums, cosmétiques, soins, maquillage',
    contenu: [
      `Parfums, cosmétiques et soins : la beauté en ligne au Sénégal est en pleine croissance, portée par les parfums de marque et leurs déclinaisons (eau de parfum, musc, huiles).`,
      `Comparez la contenance (ml) et la concentration avant d'acheter : un « même » parfum peut exister en trois formats à des prix très différents.`,
    ],
  },
  alimentation: {
    label: 'Alimentation & Épicerie',
    emoji: '🍚',
    h1: 'Alimentation & Épicerie au Sénégal',
    intro: 'Comparez les prix des produits alimentaires, courses et épicerie au Sénégal.',
    description: 'Comparez les prix de l\'alimentation et épicerie au Sénégal. Trouvez les meilleures offres pour vos courses.',
    keywords: ['alimentation Dakar', 'épicerie Sénégal', 'courses Dakar', 'prix riz Sénégal'],
    exemples: 'Riz, huile, sucre, produits frais',
    contenu: [
      `Faites vos courses au meilleur prix en comparant les offres des supermarchés et boutiques en ligne au Sénégal.`,
    ],
  },
  sport: {
    label: 'Sport & Fitness',
    emoji: '⚽',
    h1: 'Sport & Fitness au Sénégal',
    intro: 'Comparez les prix des équipements sportifs, vêtements de sport et accessoires fitness au Sénégal.',
    description: 'Comparez les prix des articles de sport et fitness au Sénégal. Équipez-vous au meilleur prix.',
    keywords: ['sport Dakar', 'fitness Sénégal', 'équipement sportif Dakar', 'musculation Sénégal'],
    exemples: 'Haltères, tapis de course, maillots',
    contenu: [
      `Trouvez tout votre équipement de sport, fitness et musculation au meilleur prix au Sénégal.`,
    ],
  },
  fournitures: {
    label: 'Fournitures & Bureautique',
    emoji: '📚',
    h1: 'Fournitures & Bureautique au Sénégal',
    intro: 'Comparez les prix des fournitures scolaires, de bureau et papeterie au Sénégal.',
    description: 'Comparez les prix des fournitures de bureau et matériel scolaire au Sénégal. Équipez votre entreprise au meilleur prix.',
    keywords: ['fournitures Dakar', 'bureautique Sénégal', 'matériel scolaire Dakar', 'papeterie Sénégal'],
    exemples: 'Cahiers, stylos, imprimantes, papier',
    contenu: [
      `Équipez vos bureaux ou préparez la rentrée scolaire au meilleur prix en comparant les offres des papeteries et marchands spécialisés.`,
    ],
  },
  quincaillerie: {
    label: 'Quincaillerie & BTP',
    emoji: '🧱',
    h1: 'Quincaillerie & BTP au Sénégal',
    intro: 'Comparez les prix des matériaux de construction, outils et quincaillerie au Sénégal.',
    description: 'Comparez les prix de la quincaillerie, outillage et BTP au Sénégal. Matériaux de construction au meilleur prix.',
    keywords: ['quincaillerie Dakar', 'BTP Sénégal', 'matériaux construction Dakar', 'outillage Sénégal'],
    exemples: 'Ciment, fer, outils, peinture',
    contenu: [
      `Trouvez vos matériaux de construction et outils de quincaillerie aux meilleurs prix pour tous vos chantiers au Sénégal.`,
    ],
  },
  services: {
    label: 'Services',
    emoji: '🛠',
    h1: 'Services professionnels au Sénégal',
    intro: 'Découvrez les offres de services, réparations, prestations professionnelles au Sénégal.',
    description: 'Trouvez les meilleurs services, artisans et professionnels au Sénégal.',
    keywords: ['services Dakar', 'artisan Sénégal', 'réparation Dakar', 'professionnels Sénégal'],
    exemples: 'Plomberie, réparation, nettoyage',
    contenu: [
      `Trouvez le professionnel adapté à votre besoin en comparant les différentes offres de services disponibles au Sénégal.`,
    ],
  },
  autre: {
    label: 'Autres Produits',
    emoji: '📦',
    h1: 'Autres Produits au Sénégal',
    intro: 'Explorez diverses offres et produits au Sénégal.',
    description: 'Comparez divers produits et offres au Sénégal.',
    keywords: ['produits Dakar', 'divers Sénégal', 'shopping Dakar'],
    exemples: 'Divers produits',
    contenu: [
      `Retrouvez ici tous les produits qui ne rentrent pas dans les catégories principales, toujours aux meilleurs prix.`,
    ],
  }
}
