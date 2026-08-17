export interface ClientCredit {
  id: string
  nom: string
  telephone: string
  solde: number
  plafond_max: number
  statut?: 'actif' | 'bloque' | 'archive'
}

// Logique de calcul et de décision métier du Carnet de Dettes
export function calculerKpisCarnet(clients: ClientCredit[]) {
  const totalDettes = clients.reduce((acc, c) => acc + (Number(c.solde) > 0 ? Number(c.solde) : 0), 0)
  const totalAvances = clients.reduce((acc, c) => acc + (Number(c.solde) < 0 ? Math.abs(Number(c.solde)) : 0), 0)
  const nbDebiteurs = clients.filter(c => Number(c.solde) > 0).length
  const nbAvances = clients.filter(c => Number(c.solde) < 0).length
  return { totalDettes, totalAvances, nbDebiteurs, nbAvances }
}

export function determinerActionClient(solde: number) {
  if (solde > 0) return { type: 'remboursement', label: 'Encaisser / Rembourser', badge: 'Doit la boutique', color: 'danger' }
  if (solde < 0) return { type: 'vente_credit', label: 'Déduire sur Achat', badge: 'Avance client', color: 'success' }
  return { type: 'vente_credit', label: '+ Donner Crédit', badge: 'Solde nul', color: 'neutral' }
}

export function filtrerClientsCarnet(clients: ClientCredit[], recherche: string, filtreStatut: 'tous' | 'retard' | 'credits') {
  const q = recherche.trim().toLowerCase()
  return clients.filter(c => {
    const matchText = !q || c.nom.toLowerCase().includes(q) || c.telephone.includes(q)
    const matchStatus = 
      filtreStatut === 'tous' ? true :
      filtreStatut === 'retard' ? Number(c.solde) > 0 :
      filtreStatut === 'credits' ? Number(c.solde) < 0 : true
    return matchText && matchStatus
  })
}
