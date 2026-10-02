// AUD-217 : message de commande WhatsApp et textes de fin selon le mode de livraison.
// Fonctions pures (aucun accès au navigateur) pour pouvoir les tester.
import { fcfa } from '@/lib/format'

export type ModeLivraison = 'retrait' | 'a_convenir' | 'livraison'

export interface LigneCommande {
  nom: string
  quantite: number
  prix: number
  detailsVariante?: string | null
}

export interface EntreeMessage {
  boutiqueNom: string
  items: LigneCommande[]
  sousTotal: number
  fraisLivraison: number
  reduction: number
  codePromo?: string
  total: number
  reference?: string
  mode: ModeLivraison
  zoneNom?: string
}

/** Détermine le mode à partir de la zone choisie (identifiant ou libellé). */
export function modeLivraisonDepuisZone(zone?: { id?: string; nom?: string } | null): ModeLivraison {
  const id = zone?.id ?? ''
  const nom = (zone?.nom ?? '').toLowerCase()
  if (id === 'retrait-boutique' || nom.includes('retrait')) return 'retrait'
  if (id === 'a-convenir' || id === 'a_convenir' || nom.includes('convenir')) return 'a_convenir'
  return 'livraison'
}

/** Dernière phrase du message : elle doit correspondre à ce que le client a réellement choisi. */
export function phraseFinale(mode: ModeLivraison): string {
  if (mode === 'retrait') return 'Je viendrai retirer ma commande en boutique. Pouvez-vous me confirmer la disponibilité et les horaires ?'
  if (mode === 'a_convenir') return 'Quels sont les frais de livraison pour mon quartier ?'
  return 'Pouvez-vous me confirmer la livraison ?'
}

export function construireMessageCommande(e: EntreeMessage): string {
  const lignes = e.items
    .map((i) => `• ${i.quantite}x ${i.nom}${i.detailsVariante ? ` [${i.detailsVariante}]` : ''} (${fcfa(i.prix * i.quantite)})`)
    .join('\n')
  let msg = `Bonjour ${e.boutiqueNom} ! Je souhaite passer la commande suivante${e.reference ? ` (Réf: *${e.reference}*)` : ''} :\n\n${lignes}\n\nSous-total: ${fcfa(e.sousTotal)}\n`
  if (e.reduction > 0 && e.codePromo) msg += `Code Promo (${e.codePromo}): -${fcfa(e.reduction)}\n`

  if (e.fraisLivraison > 0) msg += `Livraison (${e.zoneNom || 'Zone choisie'}): ${fcfa(e.fraisLivraison)}\n`
  else if (e.mode === 'retrait') msg += 'Mode: Retrait en boutique (gratuit)\n'
  else if (e.mode === 'a_convenir') msg += 'Livraison: frais à convenir avec le vendeur\n'

  if (e.mode === 'a_convenir') {
    msg += `TOTAL ARTICLES: ${fcfa(Math.max(0, e.sousTotal - e.reduction))} (livraison non comprise)\n\n`
  } else {
    msg += `TOTAL: ${fcfa(e.total)}\n\n`
  }
  return msg + phraseFinale(e.mode)
}
