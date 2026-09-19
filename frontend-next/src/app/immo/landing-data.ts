// frontend-next/src/app/immo/landing-data.ts
export interface ImmoLandingConfig {
  transaction: 'location' | 'vente'
  typeBien: string
  ville: string
  label: string
  h1: string
  titre: string          // SANS suffixe Nopalou
  description: string
  intro: string
  keywords: string[]
}

export const IMMO_LANDINGS: Record<string, ImmoLandingConfig> = {
  'location-appartement-dakar': {
    transaction: 'location', typeBien: 'appartement', ville: 'Dakar', label: 'Location appartement Dakar',
    h1: 'Location appartement à Dakar — toutes les annonces vérifiées',
    titre: 'Location Appartement Dakar (2026) : Dès 150 000 FCFA/Mois | Annonces Vérifiées',
    description: `Consultez les appartements à louer à Dakar (Plateau, Almadies, Sacré-Cœur, Ouakam, Mermoz). Studios, F2, F3, F4 vérifiés avec photos réelles et contact direct propriétaire ou agence.`,
    intro: `Trouvez un appartement à louer à Dakar parmi des centaines d'annonces mises à jour en continu. Les loyers varient selon le quartier : comptez 150 000 à 300 000 FCFA/mois pour un 2 pièces dans les quartiers populaires, 300 000 à 600 000 FCFA aux Almadies, Ngor ou Plateau. Filtrez par quartier, surface et budget pour cibler votre recherche.`,
    keywords: ['location appartement Dakar', 'appartement à louer Dakar', 'louer appartement Dakar prix', 'appartement Almadies location', 'location appartement Dakar 2026'],
  },
  'location-chambre-dakar': {
    transaction: 'location', typeBien: 'chambre', ville: 'Dakar', label: 'Location chambre Dakar',
    h1: 'Chambre à louer à Dakar — annonces au mois dès 25 000 FCFA',
    titre: 'Chambre à Louer Dakar Dès 25 000 FCFA/Mois (2026) | Annonces au Mois',
    description: `Trouvez une chambre à louer à Dakar au mois : Parcelles Assainies, Médina, Grand Yoff, Pikine. Chambres simples et avec salle de bain privée à petit prix.`,
    intro: `Vous cherchez une chambre à louer à Dakar ? Nopalou regroupe les annonces de chambres au mois dans tous les quartiers : Parcelles Assainies, Médina, Grand Yoff, Pikine. Les prix vont d'environ 25 000 à 50 000 FCFA/mois pour une chambre simple, et 50 000 à 100 000 FCFA avec salle de bain privée.`,
    keywords: ['location chambre Dakar par mois', 'chambre à louer Dakar', 'chambre à louer 30000 par mois', 'chambre salle de bain à louer Dakar', 'chambre etudiant Dakar'],
  },
  'location-studio-dakar': {
    transaction: 'location', typeBien: 'studio', ville: 'Dakar', label: 'Location studio Dakar',
    h1: 'Studio à louer à Dakar — meublé et non meublé dès 75 000 FCFA',
    titre: 'Location Studio Dakar (2026) : Dès 75 000 FCFA Meublé & Non Meublé',
    description: `Studios à louer à Dakar pour étudiants et actifs : Sacré-Cœur, Ouakam, Ngor, Point E. Comparez les prix des studios meublés et contactez directement les bailleurs.`,
    intro: `Le studio est le logement le plus demandé par les jeunes actifs et étudiants à Dakar. Comptez 75 000 à 150 000 FCFA/mois pour un studio simple selon le quartier, et 150 000 à 250 000 FCFA pour un studio meublé dans les zones prisées (Sacré-Cœur, Point E, Ouakam). Comparez les annonces avant de vous déplacer.`,
    keywords: ['location studio Dakar', 'studio à louer Dakar', 'studio meublé Dakar prix', 'studio pas cher Dakar', 'studio Ouakam Dakar'],
  },
  'location-maison-dakar': {
    transaction: 'location', typeBien: 'maison', ville: 'Dakar', label: 'Location maison Dakar',
    h1: 'Maison et villa à louer à Dakar — toutes les offres familiales',
    titre: 'Location Maison & Villa Dakar (2026) : Dès 200 000 FCFA/Mois',
    description: `Maisons familiales et villas avec cour ou piscine à louer à Dakar et sa banlieue. Annonces vérifiées avec loyers transparents et quittances numériques sécurisées.`,
    intro: `Louer une maison à Dakar pour votre famille : Nopalou regroupe les annonces de maisons et villas en location dans tous les quartiers de la capitale et sa banlieue. Les loyers démarrent autour de 200 000 FCFA/mois en périphérie et dépassent 800 000 FCFA/mois pour une villa aux Almadies ou à Fann.`,
    keywords: ['location maison Dakar', 'maison à louer Dakar', 'villa à louer Dakar prix', 'villa Almadies location'],
  },
  'vente-appartement-dakar': {
    transaction: 'vente', typeBien: 'appartement', ville: 'Dakar', label: 'Vente appartement Dakar',
    h1: 'Appartement à vendre à Dakar — programmes neufs & standing',
    titre: 'Appartement à Vendre Dakar (2026) : F2, F3, F4 Titre Foncier Dès 25M',
    description: `Achetez votre appartement à Dakar : programmes neufs et standing aux Almadies, Plateau, Mermoz. Prix au m², plans et vérification des titres de propriété.`,
    intro: `Acheter un appartement à Dakar : les prix varient de 25 à 60 millions FCFA pour un F3 selon le quartier et l'état, et dépassent 100 millions dans les résidences neuves des Almadies ou du Plateau. Nopalou regroupe les annonces de vente pour comparer les prix au m² avant de négocier.`,
    keywords: ['appartement à vendre Dakar', 'vente appartement Dakar', 'prix appartement Dakar', 'acheter appartement Dakar', 'appartement titre foncier Dakar'],
  },
  'vente-maison-dakar': {
    transaction: 'vente', typeBien: 'maison', ville: 'Dakar', label: 'Vente maison Dakar',
    h1: 'Maison & villa à vendre à Dakar — prix au m² et titres fonciers',
    titre: 'Maison & Villa à Vendre Dakar (2026) : Dès 30 Millions FCFA',
    description: `Villas et maisons à vendre à Dakar, Almadies, Keur Massar, Rufisque et Diamniadio. Comparez les prix, surfaces et vérifiez les titres fonciers avant d'acheter.`,
    intro: `Acheter une maison à Dakar est un investissement majeur : les prix s'étalent de 30 millions FCFA en banlieue (Keur Massar, Rufisque) à plusieurs centaines de millions pour une villa aux Almadies. Comparez les annonces disponibles, leur surface et leur titre de propriété avant tout engagement.`,
    keywords: ['maison à vendre Dakar', 'villa à vendre Dakar', 'vente maison Dakar prix', 'achat villa Dakar 2026'],
  },
  'vente-terrain-dakar': {
    transaction: 'vente', typeBien: 'terrain', ville: 'Dakar', label: 'Vente terrain Dakar',
    h1: 'Terrain à vendre à Dakar et région — titres fonciers & baux',
    titre: 'Terrain à Vendre Dakar & Région (2026) : Titre Foncier Dès 15 000F/m²',
    description: `Terrains viabilisés à vendre à Dakar, Diamniadio, Lac Rose, Bambilor, Saly. Comparez les prix au m², statut juridique vérifié (Bail, TF) pour investir sereinement.`,
    intro: `Le terrain reste le placement préféré des Sénégalais. À Dakar et dans sa région (Diamniadio, Lac Rose, Bambilor, Kounoune), les prix au m² varient de 15 000 FCFA en zone non viabilisée à plus de 300 000 FCFA dans les zones loties proches du centre. Vérifiez toujours le statut foncier (bail, titre foncier, délibération) avant d'acheter.`,
    keywords: ['terrain à vendre Dakar', 'vente terrain Dakar', 'prix terrain Dakar m2', 'terrain Diamniadio prix', 'terrain titre foncier Senegal'],
  },
}
