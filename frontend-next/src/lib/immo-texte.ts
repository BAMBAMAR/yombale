// AUD-156 : titre et méta-description des fiches immobilières. Fichier pur, isomorphe serveur et navigateur.

const RE_QUARTIER_PRIX = /cfa|fcfa|^[\d\s.,]{4,}$/i

/** Localité affichable : quartier (sauf s'il contient un prix, donnée corrompue des sources) puis ville ; jamais de ville inventée. */
export function localiteImmo(quartier: string | null | undefined, ville: string | null | undefined): string {
  const q = (quartier ?? '').trim()
  const v = (ville ?? '').trim()
  return [q && !RE_QUARTIER_PRIX.test(q) ? q : '', v].filter(Boolean).join(', ')
}

function majuscule(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

function coupe(t: string, max: number): string {
  if (t.length <= max) return t
  const brut = t.slice(0, max)
  const espace = brut.lastIndexOf(' ')
  return (espace > max * 0.6 ? brut.slice(0, espace) : brut).replace(/[\s·,;:\-–—]+$/u, '') + '…'
}

/** Méta-description : description de l'annonce si elle est assez longue, sinon phrase correcte (« à louer » / « à vendre »).
 *  descriptionPropre doit déjà être nettoyée (nettoyerTexteAnnonce, AUD-155) : ce fichier n'importe rien pour rester testable sans bundler. */
export function descriptionMetaImmo(p: {
  descriptionPropre: string
  typeBien: string | null | undefined
  transaction: string | null | undefined
  localite: string
  prixTexte: string
}): string {
  if (p.descriptionPropre.length >= 40) return coupe(p.descriptionPropre, 155)
  const type = majuscule((p.typeBien ?? '').trim()) || 'Bien immobilier'
  const verbe = p.transaction === 'location' ? ' à louer' : p.transaction === 'vente' ? ' à vendre' : ''
  const lieu = p.localite ? ` à ${p.localite}` : ' au Sénégal'
  return `${type}${verbe}${lieu}. Prix : ${p.prixTexte}.`
}
