import { describe, it, expect } from 'vitest'

interface ClientCredit {
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

describe('Carnet de Dettes - Métier & Calculs Financiers', () => {
  const mockClients: ClientCredit[] = [
    { id: '1', nom: 'Amadou Basse', telephone: '777202086', solde: 77, plafond_max: 250000, statut: 'actif' },
    { id: '2', nom: 'Fatou Diop', telephone: '781234567', solde: -5000, plafond_max: 100000, statut: 'actif' },
    { id: '3', nom: 'Moussa Ndiaye', telephone: '765554433', solde: 0, plafond_max: 50000, statut: 'bloque' },
    { id: '4', nom: 'Ousmane Sow', telephone: '701112233', solde: 15000, plafond_max: 200000, statut: 'actif' },
  ]

  it('calcule correctement les dettes totales et avances totales', () => {
    const { totalDettes, totalAvances, nbDebiteurs, nbAvances } = calculerKpisCarnet(mockClients)
    expect(totalDettes).toBe(15077) // 77 + 15000
    expect(totalAvances).toBe(5000) // |-5000|
    expect(nbDebiteurs).toBe(2)
    expect(nbAvances).toBe(1)
  })

  it('détermine le CTA principal et le badge selon le solde', () => {
    const actionDebiteur = determinerActionClient(77)
    expect(actionDebiteur.label).toBe('Encaisser / Rembourser')
    expect(actionDebiteur.badge).toBe('Doit la boutique')
    expect(actionDebiteur.color).toBe('danger')

    const actionAvance = determinerActionClient(-5000)
    expect(actionAvance.label).toBe('Déduire sur Achat')
    expect(actionAvance.badge).toBe('Avance client')
    expect(actionAvance.color).toBe('success')

    const actionNul = determinerActionClient(0)
    expect(actionNul.label).toBe('+ Donner Crédit')
    expect(actionNul.badge).toBe('Solde nul')
  })

  it('filtre correctement les clients par recherche textuelle (nom et téléphone)', () => {
    const resNom = filtrerClientsCarnet(mockClients, 'basse', 'tous')
    expect(resNom).toHaveLength(1)
    expect(resNom[0].nom).toBe('Amadou Basse')

    const resTel = filtrerClientsCarnet(mockClients, '78123', 'tous')
    expect(resTel).toHaveLength(1)
    expect(resTel[0].nom).toBe('Fatou Diop')
  })

  it('filtre correctement par onglets (Débiteurs vs En Avance)', () => {
    const debiteurs = filtrerClientsCarnet(mockClients, '', 'retard')
    expect(debiteurs).toHaveLength(2)
    expect(debiteurs.map(d => d.nom)).toEqual(['Amadou Basse', 'Ousmane Sow'])

    const avances = filtrerClientsCarnet(mockClients, '', 'credits')
    expect(avances).toHaveLength(1)
    expect(avances[0].nom).toBe('Fatou Diop')
  })
})
