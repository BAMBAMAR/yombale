// Durée de l'essai gratuit : valeur du réglage admin `abonnement_essai_jours` (jamais écrite en dur dans les textes).
// Fichier isomorphe (serveur et navigateur) : ne dépend d'aucun module serveur.

export const ESSAI_DEFAUT = 30

/** Normalise la valeur du réglage (chaîne ou nombre) ; retombe sur le défaut si absente ou invalide. */
export function essaiJoursValide(valeur: unknown): number {
  const n = Math.round(Number(valeur))
  return Number.isFinite(n) && n >= 1 && n <= 365 ? n : ESSAI_DEFAUT
}
