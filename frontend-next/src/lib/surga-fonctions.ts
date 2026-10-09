// Fonctions de Surga qui ne font pas partie du lancement (décisions D51, D52, D54).
// Éteintes par défaut : une fonction n'apparaît à l'écran que si sa variable vaut exactement « true » au build.
// Le serveur a ses propres interrupteurs (backend/services/surga/interrupteurs.js) : masquer ici ne suffit pas,
// et allumer ici sans allumer là-bas mène à une erreur.

/** Assistant de rédaction : barre « Demandez à Surga » du bureau et sa fenêtre */
export const SURGA_ASSISTANT_ACTIF = process.env.NEXT_PUBLIC_SURGA_ASSISTANT_ACTIF === 'true'

/** Voix : bouton micro flottant et fenêtre de commande vocale */
export const SURGA_VOIX_ACTIVE = process.env.NEXT_PUBLIC_SURGA_VOIX_ACTIVE === 'true'

/** Podcast privé */
export const SURGA_PODCAST_ACTIF = process.env.NEXT_PUBLIC_SURGA_PODCAST_ACTIF === 'true'
