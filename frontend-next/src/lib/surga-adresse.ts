// D77 : Surga a deux adresses publiques, « nopalou.com/surga » et « surga.nopalou.com ». L'application ne vit qu'à
// la première ; le sous-domaine y renvoie. Servir l'application aux deux adresses donnerait deux mémoires : les
// notes gardées sur l'appareil, le portefeuille et la session sont rangés par adresse, et ne se retrouveraient pas
// de l'une à l'autre.

// Adresse à laquelle Surga est servi, pour les liens écrits en entier (adresse canonique, partage, messages).
export const ADRESSE_SURGA = `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com').replace(/\/+$/, '')}/surga`

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
