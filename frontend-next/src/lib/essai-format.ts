// Durée de l'essai gratuit : valeur du réglage admin `abonnement_essai_jours` (jamais écrite en dur dans les textes).
// Fichier isomorphe (serveur et navigateur) : ne dépend d'aucun module serveur.

export const ESSAI_DEFAUT = 30

// Sama Xaalis a ses propres réglages admin : `kalpe_essai_jours` et `kalpe_prix_mensuel`.
export const KALPE_ESSAI_DEFAUT = 30
export const KALPE_PRIX_DEFAUT = 1000

/** Durée d'essai Sama Xaalis (1 à 365 jours) ; repli sur le défaut si absente ou invalide. */
export function kalpeEssaiJoursValide(valeur: unknown): number {
  const n = Math.round(Number(valeur))
  return Number.isFinite(n) && n >= 1 && n <= 365 ? n : KALPE_ESSAI_DEFAUT
}

/** Prix mensuel Sama Xaalis (FCFA, entier de 1 à 1 000 000) ; repli sur le défaut si absent ou invalide. */
export function kalpePrixMensuelValide(valeur: unknown): number {
  const n = Math.round(Number(typeof valeur === 'string' ? valeur.trim() : valeur))
  return Number.isFinite(n) && n >= 1 && n <= 1_000_000 ? n : KALPE_PRIX_DEFAUT
}

/** Normalise la valeur du réglage (chaîne ou nombre) ; retombe sur le défaut si absente ou invalide. */
export function essaiJoursValide(valeur: unknown): number {
  const n = Math.round(Number(valeur))
  return Number.isFinite(n) && n >= 1 && n <= 365 ? n : ESSAI_DEFAUT
}
