/**
 * Nopalou — Moteur de Recherche Phonétique et Synonymes Wolof / Sénégalais
 * Permet la compréhension des requêtes transcrites phonétiquement (ceeb/thieb, dall/chaussures, etc.)
 * et enrichit la pertinence des résultats sans latence réseau.
 */

// Normalise un texte en supprimant accents, ponctuation superflue et espaces multiples
export function normaliserTexteRecherche(str: string): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les diacritiques (é, è, ê, ë, etc.)
    .replace(/['’`-]/g, ' ') // Remplace apostrophes et tirets par des espaces
    .replace(/[^a-z0-9\s]/g, '') // Supprime les caractères spéciaux
    .replace(/\s+/g, ' ')
    .trim()
}

// Table des équivalences phonétiques courantes Wolof <-> Français <-> Orthographe officielle
const PHONETIQUE_WOLOF_EQUIVALENCES: Array<{ regex: RegExp; replacement: string }> = [
  { regex: /th/g, replacement: 'c' },
  { regex: /kh/g, replacement: 'x' },
  { regex: /dj/g, replacement: 'j' },
  { regex: /gn/g, replacement: 'n' },
  { regex: /ou/g, replacement: 'u' },
  { regex: /ie/g, replacement: 'e' },
  { regex: /ee/g, replacement: 'e' },
  { regex: /oo/g, replacement: 'o' },
  { regex: /aa/g, replacement: 'a' },
  { regex: /ck/g, replacement: 'k' },
]

export function genererFormePhonetiqueWolof(mot: string): string {
  let res = normaliserTexteRecherche(mot)
  for (const eq of PHONETIQUE_WOLOF_EQUIVALENCES) {
    res = res.replace(eq.regex, eq.replacement)
  }
  return res
}

// Dictionnaire sémantique local (synonymes et termes usuels au Sénégal)
export const DICTIONNAIRE_SYNONYMES_SENEGAL: Record<string, string[]> = {
  // Mode & Habillement
  boubou: ['bubu', 'yeure', 'yere', 'caftan', 'kaftan', 'bazin', 'ganila', 'getzner', 'thioup', 'tenue', 'couture'],
  yeure: ['boubou', 'bubu', 'habit', 'vetement', 'robe', 'pantalon', 'chemise', 'tenue'],
  bazin: ['getzner', 'ganila', 'boubou', 'tissu', 'brode'],
  dall: ['chaussure', 'sandale', 'tapette', 'mule', 'babouche', 'escarpin', 'basket', 'sneaker', 'dallou'],
  chaussure: ['dall', 'sandale', 'tapette', 'mule', 'babouche', 'basket', 'sneaker', 'dallou'],
  sandale: ['dall', 'tapette', 'mule', 'babouche', 'chaussure'],
  voile: ['foulard', 'hijab', 'moussor', 'musor', 'moussorou'],
  moussor: ['voile', 'foulard', 'hijab', 'musor'],
  sac: ['pochette', 'sacoche', 'valise', 'sac a main'],

  // Alimentation, Épicerie & Cuisines locales
  riz: ['ceeb', 'thieb', 'tieb', 'thiep', 'thieboudienne', 'ceebu jen', 'ceebu yapp', 'riz brise', 'goree'],
  ceeb: ['riz', 'thieb', 'tieb', 'thiep', 'thieboudienne', 'ceebu jen', 'ceebu yapp'],
  thieb: ['riz', 'ceeb', 'tieb', 'thiep', 'thieboudienne', 'ceebu jen', 'ceebu yapp'],
  tieb: ['riz', 'ceeb', 'thieb', 'thiep', 'thieboudienne'],
  ataya: ['the', 'attaya', 'the vert', 'nana', 'menthe'],
  the: ['ataya', 'attaya', 'the vert', 'lipton', 'kinkeliba'],
  kinkeliba: ['tisane', 'the', 'quinqueliba', 'sante'],
  cafe: ['cafe touba', 'touba', 'djar', 'nescafe'],
  touba: ['cafe touba', 'cafe', 'djar'],
  bissap: ['jus', 'hibiscus', 'fleurs de bissap', 'boisson'],
  bouye: ['jus', 'pain de singe', 'baobab', 'boisson'],
  gingembre: ['djinjer', 'djinja', 'jus de gingembre'],
  pastels: ['fataya', 'beignets', 'pastel', 'chausson'],
  fataya: ['pastels', 'beignets', 'chausson'],
  pain: ['mburu', 'tapalapa', 'baguette'],
  mburu: ['pain', 'tapalapa'],
  viande: ['yapp', 'dibi', 'dibiterie', 'mouton', 'boeuf', 'poulet', 'guinar'],
  yapp: ['viande', 'dibi', 'mouton', 'boeuf'],
  guinar: ['poulet', 'volaille', 'coq'],
  dibi: ['viande', 'dibiterie', 'mouton', 'grillade'],
  ndambe: ['haricot', 'haricots', 'ndambe'],
  haricot: ['ndambe', 'haricots'],
  guerte: ['arachide', 'cacahuete', 'pate d arachide', 'tigadeguene', 'mafe'],
  arachide: ['guerte', 'cacahuete', 'pate d arachide', 'mafe'],
  thiacry: ['thiakry', 'caakri', 'degue', 'arraw', 'fonde', 'dessert'],
  thiakry: ['thiacry', 'caakri', 'degue', 'arraw', 'fonde'],

  // Beauté & Cosmétiques
  savon: ['saboun', 'savon noir', 'dudu osun', 'savon carotte', 'savon papaye', 'gel douche'],
  teint: ['kheucc', 'kheuc', 'eclaircissant', 'clarifiant', 'glow', 'lait corps', 'creme'],
  kheucc: ['teint', 'eclaircissant', 'clarifiant', 'lait corps', 'savon'],
  cheveux: ['karite', 'meche', 'tissage', 'perruque', 'tresse', 'huile de ricin', 'pommade'],
  karite: ['beurre de karite', 'creme', 'huile', 'cheveux'],
  parfum: ['thiouraye', 'curay', 'encens', 'musc', 'oud', 'bakhour', 'eau de parfum'],
  thiouraye: ['parfum', 'encens', 'curay', 'bakhour', 'gowe'],

  // Électronique & Maison
  telephone: ['portable', 'smartphone', 'mobile', 'iphone', 'samsung', 'tecno', 'infinix'],
  portable: ['telephone', 'smartphone', 'mobile'],
  television: ['tele', 'tv', 'ecran', 'smart tv'],
  tv: ['television', 'tele', 'ecran'],
  ventilateur: ['brasseur', 'ventilo', 'clim', 'climatiseur'],
  frigo: ['refrigerateur', 'congelateur'],
  refrigerateur: ['frigo', 'congelateur'],
}

/**
 * Génère toutes les variantes d'une recherche (forme brute, phonétique, et synonymes associés)
 */
export function expandRechercheSenegal(terme: string): string[] {
  const norm = normaliserTexteRecherche(terme)
  if (!norm) return []

  const mots = norm.split(' ').filter(m => m.length > 0)
  const variantes = new Set<string>()

  // Ajouter la requête entière normalisée
  variantes.add(norm)

  // Pour chaque mot
  for (const mot of mots) {
    variantes.add(mot)

    // Forme phonétique wolof
    const phon = genererFormePhonetiqueWolof(mot)
    if (phon && phon !== mot) {
      variantes.add(phon)
    }

    // Synonymes directs
    const directSyn = DICTIONNAIRE_SYNONYMES_SENEGAL[mot]
    if (directSyn) {
      for (const s of directSyn) variantes.add(s)
    }

    // Synonymes inversés (si le mot est dans les synonymes d'une entrée)
    for (const [cle, liste] of Object.entries(DICTIONNAIRE_SYNONYMES_SENEGAL)) {
      if (liste.includes(mot)) {
        variantes.add(cle)
        for (const cousin of liste) {
          variantes.add(cousin)
        }
      }
    }
  }

  return Array.from(variantes)
}

/**
 * Teste si un produit correspond à une requête de recherche avec support phonétique et synonymes
 */
export function matcherProduitRecherche(
  produit: { nom: string; description?: string | null; categorie?: string | null; code_barre?: string | null },
  query: string
): boolean {
  if (!query || !query.trim()) return true

  const queryNorm = normaliserTexteRecherche(query)
  if (!queryNorm) return true

  // 1. Match code-barre exact direct
  if (produit.code_barre && produit.code_barre.toLowerCase().includes(queryNorm)) {
    return true
  }

  const nomNorm = normaliserTexteRecherche(produit.nom || '')
  const descNorm = normaliserTexteRecherche(produit.description || '')
  const catNorm = normaliserTexteRecherche(produit.categorie || '')

  // 2. Match textuel direct classique (nom, description, categorie)
  if (nomNorm.includes(queryNorm) || descNorm.includes(queryNorm) || catNorm.includes(queryNorm)) {
    return true
  }

  // 3. Match phonétique direct
  const queryPhon = genererFormePhonetiqueWolof(queryNorm)
  const nomPhon = genererFormePhonetiqueWolof(nomNorm)
  if (nomPhon.includes(queryPhon)) {
    return true
  }

  // 4. Match par expansion de synonymes et variantes
  const variantes = expandRechercheSenegal(query)
  for (const v of variantes) {
    if (v.length >= 3) {
      const vNorm = normaliserTexteRecherche(v)
      if (nomNorm.includes(vNorm) || descNorm.includes(vNorm) || catNorm.includes(vNorm)) {
        return true
      }
      const vPhon = genererFormePhonetiqueWolof(vNorm)
      if (nomPhon.includes(vPhon)) {
        return true
      }
    }
  }

  return false
}

/**
 * Calcule un score de pertinence pour classer les meilleurs résultats en tête
 */
export function scorePertinenceProduit(
  produit: { nom: string; description?: string | null; categorie?: string | null },
  query: string
): number {
  if (!query || !query.trim()) return 0

  const queryNorm = normaliserTexteRecherche(query)
  const nomNorm = normaliserTexteRecherche(produit.nom || '')
  const descNorm = normaliserTexteRecherche(produit.description || '')
  const catNorm = normaliserTexteRecherche(produit.categorie || '')

  // Match exact du nom entier
  if (nomNorm === queryNorm) return 100

  // Nom commence par la requête
  if (nomNorm.startsWith(queryNorm)) return 80

  // Nom contient la requête exacte
  if (nomNorm.includes(queryNorm)) return 60

  // Catégorie correspond exactement
  if (catNorm === queryNorm || catNorm.includes(queryNorm)) return 40

  // Match phonétique
  const queryPhon = genererFormePhonetiqueWolof(queryNorm)
  const nomPhon = genererFormePhonetiqueWolof(nomNorm)
  if (nomPhon === queryPhon) return 55
  if (nomPhon.includes(queryPhon)) return 45

  // Match par synonymes
  const variantes = expandRechercheSenegal(query)
  for (const v of variantes) {
    if (v.length >= 3) {
      const vNorm = normaliserTexteRecherche(v)
      if (nomNorm.includes(vNorm)) return 30
      if (descNorm.includes(vNorm)) return 15
    }
  }

  // Description contient la requête
  if (descNorm.includes(queryNorm)) return 10

  return 0
}
