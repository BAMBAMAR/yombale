// AUD-160 : un contenu sponsorisé (produit, boutique) est toujours signalé « Sponsorisé » dans les listes.
// Fichier pur, isomorphe serveur et navigateur.

/** Vrai si le sponsoring est actif : drapeau levé et date de fin absente ou dans le futur. */
export function sponsoringActif(
  sponsorise: boolean | null | undefined,
  jusquAu: string | null | undefined,
  maintenant: number = Date.now(),
): boolean {
  if (!sponsorise) return false
  if (!jusquAu) return true
  const fin = new Date(jusquAu).getTime()
  return Number.isFinite(fin) && fin > maintenant
}

export const LIBELLE_SPONSORISE = 'Sponsorisé'
