// AUD-231 : pages où la bulle flottante de l'assistant n'est pas affichée. Sur mobile elle recouvrait des boutons
// d'action (favori d'une carte, « Contacter via WhatsApp », « Continuer » d'un formulaire). Les pages de formulaire,
// de paiement et les espaces de travail (compte, marchand, agence, caisse) n'en ont pas besoin : l'aide reste
// accessible par le bouton WhatsApp de l'en-tête.

const SOUS_ARBORESCENCE = [
  '/creer-boutique', '/deposer-annonce', '/deposer-immo', '/inscription', '/connexion', '/mot-de-passe-oublie',
  '/checkout-express', '/boutique', '/compte', '/agence', '/pos',
]
const PREFIXES = ['/payer-']

export function bulleAssistantMasquee(pathname: string | null | undefined): boolean {
  const p = (pathname || '').split('?')[0].replace(/\/+$/, '') || '/'
  if (SOUS_ARBORESCENCE.some((base) => p === base || p.startsWith(base + '/'))) return true
  return PREFIXES.some((pref) => p.startsWith(pref))
}
