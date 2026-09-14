// frontend-next/src/lib/facettes.ts
// Configuration des filtres dynamiques e-commerce par catégorie

export interface FacetteOption {
  key: string
  label: string
  options: string[]
}

export const FACETTES_CONFIG: Record<string, FacetteOption[]> = {
  smartphones: [
    { key: 'stockage', label: 'Stockage', options: ['64 Go', '128 Go', '256 Go', '512 Go'] },
    { key: 'ram', label: 'RAM', options: ['4 Go', '6 Go', '8 Go', '16 Go'] },
  ],
  informatique: [
    { key: 'stockage', label: 'Disque', options: ['256 Go SSD', '512 Go SSD', '1 To SSD'] },
    { key: 'ram', label: 'Mémoire Vive', options: ['8 Go', '16 Go', '32 Go'] },
  ],
  mode: [
    { key: 'taille', label: 'Taille Vêtement', options: ['S', 'M', 'L', 'XL', 'XXL'] },
    { key: 'pointure', label: 'Pointure Chaussure', options: ['38', '39', '40', '41', '42', '43', '44', '45'] },
  ],
}

export function detecterFamilleFacette(categorie: string): 'tech' | 'mode' | 'immo' | null {
  const cat = (categorie || '').toLowerCase()
  if (cat.includes('smart') || cat.includes('phone') || cat.includes('informatique') || cat.includes('ordinateur')) {
    return 'tech'
  }
  if (cat.includes('mode') || cat.includes('vetement') || cat.includes('chaussure')) {
    return 'mode'
  }
  if (cat.includes('immo')) {
    return 'immo'
  }
  return null
}
