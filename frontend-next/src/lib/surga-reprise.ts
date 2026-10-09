// D83 : reprise des données de l'appareil quand Surga passe de « nopalou.com/surga » à sa propre origine.
// Le navigateur range ce que Surga garde sur l'appareil (réglages, notes et dépenses hors ligne, portefeuille Sama
// Xaalis, qui n'existe nulle part ailleurs) par origine : rien ne suit tout seul d'une adresse à l'autre.
// La nouvelle origine ouvre, dans un cadre invisible, la page de reprise de l'ancienne ; celle-ci lui remet ses clés
// « surga_ » par un message adressé à la seule origine de Surga. Rien n'est effacé à l'ancienne adresse.

export const TYPE_MESSAGE_REPRISE = 'surga-reprise'
// Sur la nouvelle origine : « faite », ou le nombre d'essais sans réponse.
export const CLE_REPRISE = 'surga_reprise_appareil'
export const ESSAIS_MAX = 3
const TAILLE_MAX = 4 * 1024 * 1024

// Compte auquel appartiennent les données gardées sur l'appareil (surga-offline-sync.ts).
const CLE_PROPRIETAIRE = 'surga_offline_proprietaire'

// Une clé absente, ou qu'un écran vient de créer vide à sa première ouverture (« [] », « {} »), ne porte rien.
const estVide = (valeur: string | null) => valeur === null || ['', '[]', '{}', 'null'].includes(valeur.trim())

/**
 * Ce qu'il faut écrire sur la nouvelle origine, ou null s'il n'y a rien à reprendre.
 * Seules les clés absentes de la nouvelle adresse sont reprises : rien n'y est jamais remplacé. Un compte connecté
 * y reçoit ses réglages du serveur avant la reprise ; ce qui n'existe que sur l'appareil (portefeuille, code de
 * Sama Xaalis, saisies pas encore envoyées) le rejoint quand même. Si les deux adresses portent les données de
 * deux comptes différents, rien n'est repris : on ne mêle pas deux comptes.
 */
export function donneesAReprendre(recu: unknown, lire: (cle: string) => string | null): Record<string, string> | null {
  if (!recu || typeof recu !== 'object') return null
  const recues = recu as Record<string, unknown>
  const ici = lire(CLE_PROPRIETAIRE)
  const laBas = recues[CLE_PROPRIETAIRE]
  if (ici && typeof laBas === 'string' && laBas && laBas !== ici) return null
  const retenues: Record<string, string> = {}
  let taille = 0
  for (const [cle, valeur] of Object.entries(recues)) {
    if (!cle.startsWith('surga_') || cle === CLE_REPRISE || typeof valeur !== 'string' || estVide(valeur) || !estVide(lire(cle))) continue
    taille += cle.length + valeur.length
    if (taille > TAILLE_MAX) return null
    retenues[cle] = valeur
  }
  return Object.keys(retenues).length > 0 ? retenues : null
}

/** Page remise par l'ancienne adresse : elle lit ses clés « surga_ » et les adresse à l'origine de Surga, à elle seule. */
export function pageDeReprise(origineSurga: string): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Surga</title></head><body><script>
(function () {
  if (window.parent === window) return;
  var donnees = {};
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var cle = localStorage.key(i);
      if (cle && cle.indexOf('surga_') === 0) donnees[cle] = localStorage.getItem(cle);
    }
  } catch (e) {}
  window.parent.postMessage({ type: ${JSON.stringify(TYPE_MESSAGE_REPRISE)}, donnees: donnees }, ${JSON.stringify(origineSurga)});
})();
</script></body></html>`
}
