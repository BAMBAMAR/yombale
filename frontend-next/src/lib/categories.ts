export const CATEGORIES = [
  { value: 'mixte',        label: '🛍️ Boutique Mixte / Généraliste' },
  { value: 'smartphones',  label: '📱 Téléphone / Smartphone' },
  { value: 'informatique', label: '💻 Informatique' },
  { value: 'tv-electro',   label: '📺 TV & Électroménager' },
  { value: 'mode',         label: '👗 Mode & Vêtements' },
  { value: 'maison',       label: '🏠 Maison & Décoration' },
  { value: 'auto-moto',    label: '🚗 Auto & Moto' },
  { value: 'jeux',         label: '🎮 Jeux & Consoles' },
  { value: 'alimentation', label: '🍚 Alimentation & Épicerie' },
  { value: 'beaute',       label: '💄 Beauté & Soins' },
  { value: 'parfum',       label: '🌸 Parfumerie & Fragrances' },
  { value: 'optique',      label: '👓 Lunettes & Optique' },
  { value: 'sport',        label: '⚽ Sport & Fitness' },
  { value: 'fournitures',  label: '📚 Fournitures & Bureautique' },
  { value: 'quincaillerie',label: '🧱 Quincaillerie & BTP' },
  { value: 'pieces-rechange',label: '⚙️ Pièces de Rechange' },
  { value: 'bijouterie',   label: '💎 Bijouterie & Horlogerie' },
  { value: 'maraichage',   label: '🥕 Maraîchage & Fruits/Légumes' },
  { value: 'elevage',      label: '🐑 Élevage & Aliments Bétail' },
  { value: 'produits-agricoles', label: '🌾 Produits Agricoles & Intrants' },
  { value: 'solaire-energie', label: '☀️ Solaire & Énergie' },
  { value: 'sante-pharma',  label: '💊 Santé & Pharmacie' },
  { value: 'bebe-enfants',  label: '👶 Bébé & Enfants' },
  { value: 'services',     label: '🛠 Services' },
  { value: 'immo',         label: '🏢 Immobilier & Terrains' },
  { value: 'annonces',     label: '📢 Petites Annonces' },
  { value: 'autre',        label: '📦 Autre' },
]

export const PRODUIT_CATEGORIES = CATEGORIES;

export const POPULAR_CATEGORY_VALUES = [
  'mode',
  'smartphones',
  'alimentation',
  'tv-electro',
  'beaute',
  'mixte',
] as const;

export type PopularCategoryValue = typeof POPULAR_CATEGORY_VALUES[number];

/**
 * Nettoie le label d'une catégorie en enlevant les émojis préfixes
 * afin de respecter scrupuleusement la règle Anti-AI-Slop dans l'UI.
 */
export function cleanCategoryLabel(label: string): string {
  return label.replace(/^[\p{Extended_Pictographic}\u200d\uFE0F\s]+/u, '').trim();
}
