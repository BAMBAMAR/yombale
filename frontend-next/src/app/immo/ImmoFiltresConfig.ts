// frontend-next/src/app/immo/ImmoFiltresConfig.ts
// Configuration des filtres et options du moteur de recherche immobilier Nopalou

export const TYPE_BIEN = [
  { val: '',            label: 'Tous types' },
  { val: 'appartement', label: 'Appartement' },
  { val: 'villa',       label: 'Villa' },
  { val: 'maison',      label: 'Maison' },
  { val: 'studio',      label: 'Studio' },
  { val: 'terrain',     label: 'Terrain' },
  { val: 'bureau',      label: 'Bureau' },
]

export const TRIS = [
  { val: 'recent',       label: 'Récent' },
  { val: 'prix_asc',     label: 'Prix ↑' },
  { val: 'prix_desc',    label: 'Prix ↓' },
  { val: 'surface_desc', label: 'Surface ↓' },
]

export const PRIX_MAX_LOCATION = [
  { label: '< 100k',     val: '100000'  },
  { label: '< 250k',     val: '250000'  },
  { label: '< 500k',     val: '500000'  },
  { label: '< 1M',       val: '1000000' },
]

export const PRIX_MAX_VENTE = [
  { label: '< 20M',  val: '20000000'  },
  { label: '< 50M',  val: '50000000'  },
  { label: '< 100M', val: '100000000' },
  { label: '< 200M', val: '200000000' },
]

export const SURFACE_MIN = [
  { label: '20 m²',  val: '20'  },
  { label: '40 m²',  val: '40'  },
  { label: '60 m²',  val: '60'  },
  { label: '100 m²', val: '100' },
]

export const NB_PIECES = [
  { label: '1+', val: '1' },
  { label: '2+', val: '2' },
  { label: '3+', val: '3' },
  { label: '4+', val: '4' },
]

export const NB_CHAMBRES = [
  { label: '1+', val: '1' },
  { label: '2+', val: '2' },
  { label: '3+', val: '3' },
  { label: '4+', val: '4' },
]

export const VILLES_SN = [
  'Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès',
  'Mbour', 'Saint-Louis', 'Ziguinchor', 'Kaolack', 'Touba'
]
