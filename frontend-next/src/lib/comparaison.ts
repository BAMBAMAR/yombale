// Inférence du groupe de produit + helpers du mode comparaison.
// Les clés retournées par infererGroupe doivent exister dans SOUS_TYPE_MOTS
// (backend/routes/produits.js) — c'est le contrat qui permet le filtre serveur.

export const MAX_COMPARE = 3

export interface CompareEntry {
  id: string
  nom: string
  type: string
  groupe?: string   // clé sousType backend ('' si indétectable)
  catSlug?: string  // repli : slug de la catégorie DB
}

export const GROUPE_LABELS: Record<string, string> = {
  'audio':       'écouteurs & audio',
  'tv':          'téléviseurs',
  'froid':       'réfrigérateurs & congélateurs',
  'clim':        'climatiseurs',
  'electro':     'électroménager',
  'tablette':    'tablettes',
  'smartphones': 'smartphones',
  'ordinateurs': 'ordinateurs',
  'maison':      'maison & mobilier',
  'mode':        'mode & accessoires',
  'auto-moto':   'auto & moto',
  'jeux':        'jeux & consoles',
}

// Nom DB de catégorie → slug d'URL (même map que produit/[id]/page.tsx)
export const CAT_NOM_SLUG: Record<string, string> = {
  'Telephones':   'smartphones',
  'Informatique': 'informatique',
  'TV & Electro': 'tv-electro',
  'Mode':         'mode',
  'Maison':       'maison',
  'Auto & Moto':  'auto-moto',
  'Jeux':         'jeux',
}

// Portage de _inferCat (frontend/app.js l.727) — l'ordre des tests est significatif :
// audio/tv AVANT smartphones (« Galaxy Buds », « Samsung TV »), tablette AVANT smartphones.
export function infererGroupe(nom: string): string {
  if (!nom) return ''
  const n = nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

  if (/ecouteur|airpod|galaxy.buds|freebuds|redmi.buds|nothing.ear|casque.(audio|bluetooth|sans.fil|anc|noise)|\btws\b|enceinte.(bluetooth|portable|sans.fil)|haut.parleur|soundbar|barre.de.son|montre.connect|smartwatch|bracelet.connect|galaxy.watch|galaxy.fit|redmi.watch|xiaomi.watch/.test(n)) return 'audio'
  if (/television|televiseur|tv.4k|tv.led|tv.oled|tv.qled|smart.tv|android.tv|led.tv|\bpouces?.tv\b|hisense.tv|lg.tv|samsung.tv|tcl.tv|bruhm|skyworth|ecran.tv|astech.tv|finix.tv/.test(n)) return 'tv'
  if (/refrigerat|frigo\b|congelat|armoire.refrig|vitrine.refrig/.test(n)) return 'froid'
  if (/climatiseur|\bsplit\s|\bsplit.inv|pompe.a.chaleur/.test(n)) return 'clim'
  if (/lave.linge|machine.{0,5}laver|seche.linge|lave.vaisselle|micro.onde|four.(electrique|gaz)|chauffe.eau|ventilateur|air.fryer|friteuse|induction|plaque.de.cuisson|mixeur|blender|aspirateur|fer.a.repasser|cafetiere|bouilloire|grille.pain/.test(n)) return 'electro'
  if (/galaxy.tab|samsung.tab|\btablette\b|\bipad\b|lenovo.tab|matepad|xiaomi.pad/.test(n)) return 'tablette'
  if (/iphone|tecno\s|infinix\s|oppo\s|realme\s|\bitel\s|vivo\s|redmi\s|samsung.galaxy.[asmzf]|xiaomi.(mi|poco)\s|huawei.[pyn]|nokia\s|oneplus\s|google.pixel|motorola.moto|smartphone|telephone.portable/.test(n)) return 'smartphones'
  if (/\bgalaxy\b/.test(n) && !/tab|watch|buds|fit/.test(n)) return 'smartphones'
  if (/\blaptop\b|ordinateur|macbook|chromebook|lenovo|dell\s|\bpc\s|\basus\b|\bacer\b|imprimante|disque.dur|\bssd\b|moniteur|routeur|clavier\s|souris\s/.test(n)) return 'ordinateurs'
  if (/canape|\bchaise\b|matelas|\blit\s|\barmoire\b|\bmeuble\b|fontaine|table.basse|commode/.test(n)) return 'maison'
  if (/\brobe\b|chaussure|sac.a.main|chemise\s|\bpantalon\b|sneaker|\bbasket\b|\bparfum\b|eau.de.toilette|jean.homme|t-shirt/.test(n)) return 'mode'
  if (/\bvoiture\b|\bmoto\s|\bscooter\b|trottinette|piece.auto|batterie.voiture/.test(n)) return 'auto-moto'
  if (/playstation|\bps[45]\b|\bxbox\b|nintendo|manette.jeu|jeu.video|\bgaming\b|casque.gamer/.test(n)) return 'jeux'

  return ''
}

// Lecture tolérante : accepte l'ancien format (entrées sans groupe) et le nouveau.
export function lireCompare(): CompareEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem('nopalou_compare') || '[]')
    return Array.isArray(raw) ? raw : []
  } catch { return [] }
}
