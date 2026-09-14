import type { TypeVarianteId } from '../boutiqueHelpers'

export const inputStyle = {
  padding: '10px 14px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
  width: '100%',
  background: '#fff',
  boxSizing: 'border-box' as const,
}

export const labelStyle = {
  fontSize: 13,
  fontWeight: 600 as const,
  color: '#374151',
  display: 'block' as const,
  marginBottom: 4,
}

export const ETATS_PRODUIT = ['Neuf', 'Bon état', 'Occasion', 'Pour pièces']
export const GENRES_MODE   = ['Homme', 'Femme', 'Enfant', 'Unisexe']
export const PLATEFORMES   = ['PS4', 'PS5', 'Xbox One', 'Xbox Series', 'Nintendo Switch', 'PC', 'Mobile']
export const POUR_QUI      = ['Homme', 'Femme', 'Mixte']

export const COULEURS_PALETTE: { nom: string; hex: string }[] = [
  { nom: 'Noir',        hex: '#111111' },
  { nom: 'Blanc',       hex: '#ffffff' },
  { nom: 'Gris',        hex: '#9ca3af' },
  { nom: 'Rouge',       hex: '#dc2626' },
  { nom: 'Bleu',        hex: '#2563eb' },
  { nom: 'Bleu marine', hex: '#1e3a5f' },
  { nom: 'Vert',        hex: '#16a34a' },
  { nom: 'Jaune',       hex: '#eab308' },
  { nom: 'Orange',      hex: '#f97316' },
  { nom: 'Rose',        hex: '#ec4899' },
  { nom: 'Violet',      hex: '#9333ea' },
  { nom: 'Marron',      hex: '#78350f' },
  { nom: 'Beige',       hex: '#e7d7c1' },
  { nom: 'Or',          hex: '#d4af37' },
  { nom: 'Argent',      hex: '#c0c0c0' },
  { nom: 'Bordeaux',    hex: '#7f1d1d' },
]

export const TAILLES_VETEMENT = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
export const POINTURES_CHAUSSURE = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46']
export const STOCKAGES_RAM = ['4 Go', '8 Go', '16 Go', '32 Go', '64 Go', '128 Go', '256 Go', '512 Go', '1 To']
export const CAPACITES_PUISSANCE = ['0,75 CV', '1 CV', '1,5 CV', '2 CV', '2,5 CV', '3 CV', '100 L', '150 L', '200 L', '300 L', '400 L']

export const FORMATS_CONDITIONNEMENT = ['Unité', 'Pack de 6', 'Carton de 12', 'Sachet 250g', 'Sachet 500g', 'Sachet 1kg', 'Sac 5kg', 'Sac 25kg', 'Sac 50kg', 'Bouteille 50cl', 'Bouteille 1.5L', 'Bidon 5L', 'Bidon 20L']

export interface TypeVariante {
  id: TypeVarianteId
  label: string
  nomVariante: string
  suggestions: string[]
  repetable: boolean
}

export const TYPES_VARIANTE: TypeVariante[] = [
  { id: 'couleur',         label: 'Couleur',                  nomVariante: 'Couleur',         suggestions: COULEURS_PALETTE.map(c => c.nom), repetable: false },
  { id: 'taille',          label: 'Taille (vêtement)',         nomVariante: 'Taille',          suggestions: TAILLES_VETEMENT,     repetable: false },
  { id: 'pointure',        label: 'Pointure (chaussure)',      nomVariante: 'Pointure',        suggestions: POINTURES_CHAUSSURE,  repetable: false },
  { id: 'stockage',        label: 'Stockage / RAM',            nomVariante: 'Stockage',        suggestions: STOCKAGES_RAM,        repetable: false },
  { id: 'capacite',        label: 'Capacité / Puissance',      nomVariante: 'Capacité',        suggestions: CAPACITES_PUISSANCE,  repetable: false },
  { id: 'conditionnement', label: 'Conditionnement / Format',  nomVariante: 'Conditionnement', suggestions: FORMATS_CONDITIONNEMENT, repetable: false },
  { id: 'autre',           label: 'Autre (personnalisé)',       nomVariante: '',                suggestions: [],                   repetable: true },
]

export const MARQUES_MODE = ['Zara', 'Nike', 'Adidas', 'H&M', 'Shein']
export const MARQUES_SMARTPHONE = ['Samsung', 'Apple', 'Xiaomi', 'Tecno', 'Infinix']
export const MARQUES_INFORMATIQUE = ['Dell', 'Lenovo', 'HP', 'Asus', 'Apple']
export const MARQUES_TV_ELECTRO = ['Samsung', 'LG', 'Hisense', 'TCL']
export const MARQUES_AUTO = ['Toyota', 'Yamaha', 'Hyundai', 'Kia']
export const MARQUES_MAISON = ['IKEA', 'Broyhill']
export const MATIERES_MODE = ['Coton', 'Lin', 'Cuir', 'Synthétique', 'Denim']
export const MATIERES_MAISON = ['Bois', 'Métal', 'Tissu', 'Verre', 'Plastique']
export const TYPES_ARTICLE_MAISON = ['Canapé', 'Lit', 'Table', 'Armoire', 'Chaise']
export const TYPES_ARTICLE_TV_ELECTRO = ['TV', 'Frigo', 'Clim', 'Machine à laver', 'Congélateur']
export const CARBURANTS = ['Essence', 'Diesel', 'Hybride', 'Électrique']
export const CONDITIONNEMENTS = ['Sachet', 'Boîte', 'Vrac', 'Bouteille']
export const TYPES_BEAUTE = ['Crème', 'Parfum', 'Shampoing', 'Savon', 'Maquillage']
export const MARQUES_PARFUM = ['Dior', 'Chanel', 'Lattafa', 'Tom Ford', 'YSL', 'Armani', 'Guerlain', 'Hugo Boss']
export const CONCENTRATIONS_PARFUM = ['Extrait de Parfum', 'Eau de Parfum (EDP)', 'Eau de Toilette (EDT)', 'Eau de Cologne', 'Brume']
export const FAMILLES_OLFACTIVES = ['Boisé / Oud', 'Floral', 'Ambré / Oriental', 'Frais / Hespéridé', 'Gourmand / Vanillé', 'Épicé']
export const MARQUES_OPTIQUE = ['Ray-Ban', 'Oakley', 'Gucci', 'Prada', 'Tom Ford', 'Persol', 'Dior']
export const TYPES_LUNETTES = ['Lunettes de soleil', 'Lunettes de vue / Repos', 'Anti-lumière bleue', 'Monture créateur']
export const FORMES_MONTURE = ['Aviateur', 'Ronde', 'Carrée / Rectangulaire', 'Papillon / Cat-Eye', 'Wayfarer', 'Hexagonale']
export const PROTECTIONS_UV = ['UV400 (Catégorie 3)', 'Polarisé UV400', 'Verres Photochromiques', 'Sans protection']
