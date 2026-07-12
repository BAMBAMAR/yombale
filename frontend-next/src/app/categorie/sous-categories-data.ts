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
  'smartphones/iphone': {
    categorie: 'smartphones', label: 'iPhone', sousType: 'iphone', emoji: '🍎',
    h1: 'iPhone prix Dakar — tous les modèles au meilleur prix',
    titre: 'iPhone prix Dakar — Comparez tous les modèles au Sénégal',
    description: `iPhone 11, 12, 13, 14, 15 : comparez plus de 1 700 offres iPhone au Sénégal, neufs et occasion. Trouvez le meilleur prix iPhone à Dakar, mis à jour toutes les 6h.`,
    intro: `Combien coûte un iPhone à Dakar ? Nopalou compare en continu les iPhone vendus au Sénégal, du modèle d'occasion abordable au dernier modèle neuf scellé. Les iPhone 11 et 12 d'occasion se trouvent généralement entre 120 000 et 250 000 FCFA, les iPhone 13 et 14 entre 250 000 et 450 000 FCFA, et les modèles récents Pro/Pro Max au-delà. Vérifiez toujours l'état (neuf, occasion, reconditionné) affiché sur chaque offre avant d'acheter.`,
    keywords: ['iPhone prix Dakar', 'iPhone Sénégal', 'iPhone occasion Dakar', 'iPhone 13 prix Sénégal', 'iPhone 14 prix Dakar', 'iPhone pas cher Dakar'],
  },
  'smartphones/samsung': {
    categorie: 'smartphones', label: 'Samsung', sousType: 'samsung', emoji: '📱',
    h1: 'Samsung Galaxy prix Dakar — comparez tous les modèles',
    titre: 'Samsung Galaxy prix Dakar — Téléphones Samsung au Sénégal',
    description: `Galaxy A, S, Note : comparez plus de 800 offres de téléphones Samsung au Sénégal. Trouvez le meilleur prix Samsung Galaxy à Dakar, mis à jour toutes les 6h.`,
    intro: `Les téléphones Samsung Galaxy sont parmi les plus recherchés au Sénégal. La gamme Galaxy A (A05, A15, A25…) offre le meilleur rapport qualité/prix entre 60 000 et 200 000 FCFA ; la gamme S (S22, S23, S24) vise le haut de gamme au-delà de 300 000 FCFA. Nopalou compare chaque modèle chez tous les marchands en ligne du Sénégal pour vous éviter de payer trop cher à Dakar.`,
    keywords: ['Samsung prix Dakar', 'Samsung Galaxy Sénégal', 'Galaxy A prix Dakar', 'Samsung A15 prix Sénégal', 'téléphone Samsung pas cher Dakar'],
  },
  'smartphones/xiaomi-redmi': {
    categorie: 'smartphones', label: 'Xiaomi & Redmi', sousType: 'xiaomi', emoji: '📱',
    h1: 'Xiaomi et Redmi prix Dakar — le meilleur rapport qualité/prix',
    titre: 'Xiaomi Redmi prix Dakar — Comparez les modèles au Sénégal',
    description: `Redmi, Note, Poco : comparez plus de 200 offres Xiaomi au Sénégal. Trouvez le meilleur prix Xiaomi Redmi à Dakar, mis à jour toutes les 6h.`,
    intro: `Xiaomi s'est imposé au Sénégal grâce à ses gammes Redmi et Poco au rapport qualité/prix imbattable. Un Redmi d'entrée de gamme se trouve dès 50 000 à 90 000 FCFA, un Redmi Note entre 100 000 et 180 000 FCFA. Nopalou compare toutes les offres Xiaomi, Redmi et Poco disponibles chez les marchands en ligne du Sénégal pour trouver le prix le plus bas à Dakar.`,
    keywords: ['Xiaomi prix Dakar', 'Redmi prix Sénégal', 'Redmi Note prix Dakar', 'Poco prix Sénégal', 'Xiaomi pas cher Dakar'],
  },
  'smartphones/tecno': {
    categorie: 'smartphones', label: 'Tecno', sousType: 'tecno', emoji: '📱',
    h1: 'Tecno prix Dakar — Spark, Camon et tous les modèles',
    titre: 'Tecno prix Dakar — Téléphones Tecno au Sénégal',
    description: `Tecno Spark, Camon : comparez les offres de téléphones Tecno au Sénégal. Trouvez le meilleur prix Tecno à Dakar, mis à jour toutes les 6h.`,
    intro: `Tecno est l'une des marques les plus vendues au Sénégal, portée par les gammes Spark (entrée de gamme, souvent entre 45 000 et 100 000 FCFA) et Camon (photo, 100 000 à 180 000 FCFA). Nopalou compare les prix Tecno chez tous les marchands en ligne du pays pour vous garantir le meilleur prix à Dakar, que le téléphone soit neuf ou d'occasion.`,
    keywords: ['Tecno prix Dakar', 'Tecno Spark prix Sénégal', 'Tecno Camon prix Dakar', 'téléphone Tecno pas cher'],
  },
  'tv-electro/televiseurs': {
    categorie: 'tv-electro', label: 'Téléviseurs', sousType: 'tv', emoji: '📺',
    h1: 'TV prix Dakar — Smart TV 32, 43, 55 pouces au meilleur prix',
    titre: 'TV prix Dakar — Smart TV Samsung, LG, Hisense au Sénégal',
    description: `Smart TV 32, 43, 50, 55 pouces : comparez les téléviseurs Samsung, LG, Hisense, Astech au Sénégal. Le meilleur prix TV à Dakar, mis à jour toutes les 6h.`,
    intro: `Quel est le prix d'une télévision à Dakar ? Une Smart TV 32 pouces d'entrée de gamme (Astech, Bruhm, Skyworth) se trouve entre 60 000 et 100 000 FCFA, une 43 pouces entre 120 000 et 200 000 FCFA, et les 55 pouces 4K Samsung ou LG au-delà de 250 000 FCFA. Nopalou compare chaque modèle chez tous les marchands en ligne du Sénégal — vérifiez le prix avant d'acheter en boutique.`,
    keywords: ['TV prix Dakar', 'Smart TV 32 pouces prix Sénégal', 'TV 43 pouces prix Dakar', 'télévision Samsung prix Sénégal', 'TV LG Dakar', 'Smart TV pas cher Dakar'],
  },
  'tv-electro/refrigerateurs': {
    categorie: 'tv-electro', label: 'Réfrigérateurs & Congélateurs', sousType: 'froid', emoji: '🧊',
    h1: 'Frigo prix Dakar — réfrigérateurs et congélateurs au Sénégal',
    titre: 'Frigo prix Dakar — Réfrigérateurs et congélateurs au meilleur prix',
    description: `Frigo bar, combiné, congélateur coffre : comparez les prix de réfrigérateurs au Sénégal. Astech, Samsung, Hisense — le meilleur prix frigo à Dakar.`,
    intro: `Le prix d'un frigo à Dakar varie fortement selon le format : un frigo bar démarre autour de 80 000 à 120 000 FCFA, un réfrigérateur deux portes entre 150 000 et 300 000 FCFA, et un congélateur coffre entre 130 000 et 250 000 FCFA selon la capacité en litres. Nopalou compare les modèles Astech, Samsung, Hisense, Enduro et autres chez tous les marchands en ligne du Sénégal.`,
    keywords: ['frigo prix Dakar', 'prix frigo Sénégal', 'frigo Astech prix', 'congélateur prix Dakar', 'frigo bar prix Dakar', 'réfrigérateur Samsung Sénégal'],
  },
  'tv-electro/electromenager': {
    categorie: 'tv-electro', label: 'Électroménager', sousType: 'electro', emoji: '🔌',
    h1: 'Électroménager prix Dakar — machines à laver, micro-ondes, ventilateurs',
    titre: 'Électroménager prix Dakar — Machine à laver, micro-ondes au Sénégal',
    description: `Machine à laver, micro-ondes, ventilateur, air fryer : comparez les prix d'électroménager au Sénégal. Les meilleures offres à Dakar, mises à jour toutes les 6h.`,
    intro: `Nopalou compare tout le petit et gros électroménager vendu au Sénégal : machines à laver (à partir d'environ 130 000 FCFA), micro-ondes (40 000 à 80 000 FCFA), ventilateurs, aspirateurs, air fryers, chauffe-eau et plaques de cuisson. Chaque produit est comparé chez tous les marchands en ligne du pays pour trouver le prix le plus bas à Dakar.`,
    keywords: ['machine à laver prix Dakar', 'micro-ondes prix Sénégal', 'ventilateur prix Dakar', 'air fryer Sénégal', 'électroménager pas cher Dakar'],
  },
  'informatique/ordinateurs': {
    categorie: 'informatique', label: 'Ordinateurs portables', sousType: 'ordinateurs', emoji: '💻',
    h1: 'Ordinateur portable prix Dakar — laptops HP, Dell, Lenovo',
    titre: 'Ordinateur portable prix Dakar — Laptops au meilleur prix au Sénégal',
    description: `Laptops HP, Dell, Lenovo, MacBook : comparez les prix d'ordinateurs portables au Sénégal, neufs et occasion. Le meilleur prix laptop à Dakar.`,
    intro: `Combien coûte un ordinateur portable à Dakar ? Un laptop d'occasion (HP, Dell, Lenovo) pour la bureautique se trouve entre 100 000 et 200 000 FCFA, un modèle neuf milieu de gamme entre 250 000 et 450 000 FCFA, et les MacBook au-delà. Nopalou compare chaque offre chez tous les marchands en ligne du Sénégal — comparez la RAM, le stockage SSD et l'état avant d'acheter.`,
    keywords: ['ordinateur portable prix Dakar', 'laptop prix Sénégal', 'PC portable pas cher Dakar', 'HP prix Dakar', 'MacBook prix Sénégal', 'ordinateur occasion Dakar'],
  },
}
