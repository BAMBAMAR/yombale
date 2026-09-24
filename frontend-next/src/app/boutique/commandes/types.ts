export interface Commande {
  id: string
  reference: string
  nom_produit: string
  quantite: number
  prix_unitaire: number
  montant_total: number
  frais_livraison: number
  client_nom: string
  client_telephone: string
  client_adresse: string | null
  note: string | null
  statut: string
  source: string
  created_at: string
  methode_paiement: string | null
  groupe_commande: string | null
  statut_sequestre?: string | null
  produit_id?: string | null
}

export interface PanierAbandonne {
  id: string
  client_nom: string | null
  client_tel: string
  articles: { nom: string; quantite: number; prix: number }[]
  total: number
  relance_envoyee: boolean
  created_at: string
}

export const STATUTS_META: { key: string; color: string; bg: string }[] = [
  { key: 'en_attente', color: '#92400e', bg: '#fef3c7' },
  { key: 'confirmee', color: '#1d4ed8', bg: '#eff6ff' },
  { key: 'en_preparation', color: '#6d28d9', bg: '#f5f3ff' },
  { key: 'expediee', color: '#0369a1', bg: '#e0f2fe' },
  { key: 'livree', color: '#16a34a', bg: '#dcfce7' },
  { key: 'annulee', color: '#dc2626', bg: '#fef2f2' },
]

export const TRANSITIONS: Record<string, string[]> = {
  en_attente: ['confirmee', 'annulee'],
  confirmee: ['en_preparation', 'annulee'],
  en_preparation: ['expediee', 'annulee'],
  expediee: ['livree', 'annulee'],
  livree: [],
  annulee: [],
}

export function getStatutLabel(key: string, t: any) {
  switch (key) {
    case 'en_attente':
      return t('shop.statusPending')
    case 'confirmee':
      return t('shop.statusConfirmed')
    case 'en_preparation':
      return t('shop.statusPreparing')
    case 'expediee':
      return t('shop.statusShipped')
    case 'livree':
      return t('shop.statusDelivered')
    case 'annulee':
      return t('shop.statusCancelled')
    default:
      return key
  }
}

export function statutStyle(statut: string) {
  const s = STATUTS_META.find((x) => x.key === statut)
  return s
    ? {
        color: s.color,
        background: s.bg,
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
      }
    : {}
}

export function regrouperCommandes(commandes: Commande[]): (Commande | Commande[])[] {
  const groupes = new Map<string, Commande[]>()
  const resultat: (Commande | Commande[])[] = []
  for (const c of commandes) {
    if (!c.groupe_commande) {
      resultat.push(c)
      continue
    }
    if (!groupes.has(c.groupe_commande)) {
      const groupe: Commande[] = []
      groupes.set(c.groupe_commande, groupe)
      resultat.push(groupe)
    }
    groupes.get(c.groupe_commande)!.push(c)
  }
  return resultat
}
