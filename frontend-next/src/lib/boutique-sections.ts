/**
 * Configuration canonique des sections de vitrine Nopalou
 * Utilisé par le Studio de Personnalisation, la vitrine publique et les tests.
 */

export interface SectionItem {
  id: string
  nom: string
  description: string
  visible: boolean
}

export const SECTIONS_PAR_DEFAUT: SectionItem[] = [
  {
    id: 'banniere',
    nom: 'Bannière & Profil Boutique',
    description: 'Photo de couverture, logo, nom officiel, slogan et badges de confiance',
    visible: true,
  },
  {
    id: 'recherche_filtres',
    nom: 'Barre de Recherche & Filtres',
    description: 'Recherche textuelle instantanée, pastilles de catégories et filtres de prix',
    visible: true,
  },
  {
    id: 'produits',
    nom: 'Catalogue Produits & Articles',
    description: 'Grille d\'affichage des produits en vente avec boutons d\'achat express',
    visible: true,
  },
  {
    id: 'social',
    nom: 'Social Shop (Réseaux Sociaux)',
    description: 'Publications vidéo TikTok / Instagram associées aux produits',
    visible: true,
  },
  {
    id: 'contact',
    nom: 'Coordonnées, Horaires & Avis',
    description: 'WhatsApp direct, plan d\'accès, horaires d\'ouverture et avis vérifiés',
    visible: true,
  },
]
