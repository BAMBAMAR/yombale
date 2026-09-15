export type TypeVarianteId = 'couleur' | 'taille' | 'pointure' | 'stockage' | 'capacite' | 'conditionnement' | 'autre'

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

export function isNomParDefaut(nom?: string | null): boolean {
  if (!nom) return false
  const trimmed = nom.trim().toLowerCase()
  if (trimmed.includes('à modifier') || trimmed.includes('a modifier')) return true
  return Object.values(NOMS_PAR_DEFAUT).some(
    (defaultNom) => defaultNom.toLowerCase() === trimmed
  )
}

export function genererSVGCodeBarresEAN13(codeStr: string): string {
  let code = (codeStr || '2001234567890').replace(/\D/g, '')
  if (code.length < 13) code = code.padEnd(13, '0')

  const L = ["0001101","0011001","0010011","0111101","0100011","0110001","0101111","0111011","0110111","0001011"]
  const G = ["0100111","0110011","0011011","0100001","0011101","0111001","0000101","0010001","0001001","0010111"]
  const R = ["1110010","1100110","1101100","1000010","1011100","1001110","1010000","1000100","1001000","1110100"]

  const parities = [
    "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLGLG",
    "LGLGGL", "LGGLGL", "LGLGLG", "LGLGLG", "LGGLGG"
  ]

  const firstDigit = parseInt(code[0], 10) || 0
  const parity = parities[firstDigit] || "LLLLLL"

  let bin = "101" // Guard gauche

  for (let i = 1; i <= 6; i++) {
    const digit = parseInt(code[i], 10) || 0
    bin += (parity[i - 1] === 'L') ? L[digit] : G[digit]
  }

  bin += "01010" // Guard centre

  for (let i = 7; i <= 12; i++) {
    const digit = parseInt(code[i], 10) || 0
    bin += R[digit]
  }

  bin += "101" // Guard droite

  let svgRects = ''
  const barWidth = 2
  const height = 45

  for (let i = 0; i < bin.length; i++) {
    if (bin[i] === '1') {
      const isGuard = (i < 3) || (i >= 45 && i < 50) || (i >= 92)
      const h = isGuard ? height + 6 : height
      svgRects += `<rect x="${i * barWidth}" y="0" width="${barWidth}" height="${h}" fill="#000000" />`
    }
  }

  const totalWidth = bin.length * barWidth
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height + 8}" width="${totalWidth}" height="${height + 8}">${svgRects}</svg>`
}

