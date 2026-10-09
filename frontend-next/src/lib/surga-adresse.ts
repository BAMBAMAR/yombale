// Adresses de Surga.
//
// D77 (état sans réglage) : l'application vit à « nopalou.com/surga » ; « surga.nopalou.com » y renvoie.
//
// D83 (quand NEXT_PUBLIC_SURGA_ORIGINE est posée, par exemple « https://surga.nopalou.com ») : l'application vit à
// sa propre origine, au chemin « /surga » inchangé ; « nopalou.com/surga » y renvoie. Raison : sous la même origine,
// Surga est imbriquée dans la portée de l'application Nopalou (« / ») ; Nopalou installé, le navigateur ne propose
// pas d'installer Surga, lui attribue ses notifications et capte ses liens. Deux origines règlent les trois.
// Le chemin reste « /surga » : liens internes, manifeste et service worker ne changent pas.

const sansBarre = (adresse: string) => adresse.replace(/\/+$/, '')

export const ORIGINE_NOPALOU = sansBarre(process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com')
// Vide : D77.
export const ORIGINE_SURGA = sansBarre(process.env.NEXT_PUBLIC_SURGA_ORIGINE || '')

// Adresse à laquelle Surga est servi, pour les liens écrits en entier (adresse canonique, partage, messages).
export const ADRESSE_SURGA = `${ORIGINE_SURGA || ORIGINE_NOPALOU}/surga`

// Page de l'ancienne adresse qui remet les données gardées sur l'appareil à la nouvelle (voir surga-reprise.ts).
export const CHEMIN_REPRISE = '/surga/reprise'
// Cookie de passage de la session d'une adresse à l'autre : posé au renvoi, converti puis retiré à l'arrivée.
export const COOKIE_PASSAGE_SESSION = 'nopalou_session_passage'

const PREFIXE = /^surga\./i

// Rend l'adresse où renvoyer une demande reçue sur le sous-domaine, ou null si l'hôte n'en est pas un.
// La racine du sous-domaine mène à l'application ; tout autre chemin (une fiche de boutique ouverte depuis le
// Shopping, par exemple) garde son chemin sur le domaine principal, où il retrouve le menu de Nopalou.
export function adresseDepuisSousDomaineSurga(hote: string, chemin: string, requete: string, protocole: string): string | null {
  if (!PREFIXE.test(hote)) return null
  const principal = hote.replace(PREFIXE, '')
  // Pas de renvoi vers l'adresse d'écoute du serveur lui-même (« surga.localhost:3001 » en développement) : Next
  // rend relative une adresse de renvoi qui vise sa propre adresse d'écoute, et le navigateur tournerait en rond.
  if (!principal || /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(principal)) return null
  const proto = protocole.replace(/:$/, '') || 'https'
  return `${proto}://${principal}${chemin === '/' ? '/surga' : chemin}${requete}`
}

const hoteDe = (origine: string) => { try { return new URL(origine).host.toLowerCase() } catch { return '' } }

// Ce que l'origine de Surga sert elle-même : l'application et ses fichiers. Le reste appartient à Nopalou.
function serviParSurga(chemin: string): boolean {
  return chemin === '/surga' || chemin.startsWith('/surga/') || chemin.startsWith('/_next/')
    || chemin === '/icon' || chemin === '/apple-icon' || /\.[a-z0-9]{2,5}$/i.test(chemin)
}

/**
 * D83 : adresse où renvoyer une demande, ou null si elle est servie là où elle arrive.
 * - À l'origine de Surga : la racine mène à l'application ; une page de Nopalou repart vers Nopalou.
 * - Ailleurs : la page « /surga » mène à l'origine de Surga. Ses fichiers (manifeste, icônes, service worker) et la
 *   page de reprise restent servis à l'ancienne adresse : une application déjà installée ne casse pas.
 */
export function renvoiOrigineSurga(
  hote: string,
  chemin: string,
  requete: string,
  origineSurga: string = ORIGINE_SURGA,
  origineNopalou: string = ORIGINE_NOPALOU
): string | null {
  const hoteSurga = hoteDe(origineSurga)
  if (!hoteSurga) return null
  if (hote.toLowerCase() === hoteSurga) {
    if (chemin === '/') return `${origineSurga}/surga${requete}`
    return serviParSurga(chemin) ? null : `${origineNopalou}${chemin}${requete}`
  }
  return chemin === '/surga' ? `${origineSurga}/surga${requete}` : null
}

/** Domaine commun aux deux origines (« .nopalou.com »), pour le cookie de passage de la session ; vide s'il n'y en a pas. */
export function domaineCommun(origineSurga: string = ORIGINE_SURGA, origineNopalou: string = ORIGINE_NOPALOU): string {
  const nom = (o: string) => { try { return new URL(o).hostname.toLowerCase() } catch { return '' } }
  const surga = nom(origineSurga)
  const nopalou = nom(origineNopalou).replace(/^www\./, '')
  return surga && nopalou && surga.endsWith(`.${nopalou}`) ? `.${nopalou}` : ''
}
