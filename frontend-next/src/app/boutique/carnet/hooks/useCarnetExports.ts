'use client'

import { useCallback } from 'react'
import { exportToCSV, printPDFReport } from '@/lib/export'
import { fcfa, fmtDate, fmtDateHeure } from '@/lib/format'
import { useToast } from '@/context/ToastContext'
import type { ClientCredit, TransactionCredit, BoutiqueCarnetInfo } from '../types'

interface UseCarnetExportsProps {
  boutique: BoutiqueCarnetInfo
  clients: ClientCredit[]
}

export function useCarnetExports({ boutique, clients }: UseCarnetExportsProps) {
  const { toast } = useToast()

  const obtenirClientsAvecHistorique = useCallback(async (): Promise<ClientCredit[]> => {
    try {
      const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients?include_historique=true`)
      if (res.ok) {
        const data = await res.json()
        if (data.clients && Array.isArray(data.clients)) {
          return data.clients
        }
      }
    } catch (err) {
      console.error('Erreur chargement clients avec historique pour export:', err)
    }
    return clients
  }, [boutique.id, clients])

  const handleExportCSV = useCallback(async () => {
    if (clients.length === 0) {
      toast.warning('Aucun client enregistré dans le carnet.')
      return
    }

    const clientsComplets = await obtenirClientsAvecHistorique()
    const headers = [
      'Nom du client',
      'Téléphone',
      'Adresse / Quartier',
      'Statut Client',
      'Solde Actuel (FCFA)',
      'Date & Heure Opération',
      'Type Opération',
      'Mode Paiement',
      'Détails / Produits / Notes',
      'Montant Opération (FCFA)',
    ]

    const rows: (string | number)[][] = []

    clientsComplets.forEach((c) => {
      const statutClient = c.solde > 0 ? 'Dette à encaisser' : c.solde < 0 ? 'Avance client' : 'Solde nul (Réglé)'
      const listHist = c.historique || []

      if (listHist.length > 0) {
        listHist.forEach((h) => {
          const typeOp =
            h.type === 'vente_credit'
              ? 'Vente à crédit'
              : h.type === 'remboursement'
              ? 'Remboursement'
              : 'Dépôt / Avance'
          const details =
            h.note ||
            (h.produits && h.produits.length > 0
              ? h.produits.map((p: any) => `${p.nom} x${p.qte || 1}`).join(', ')
              : '—')
          rows.push([
            c.nom,
            c.telephone,
            c.adresse || '—',
            statutClient,
            c.solde,
            fmtDateHeure(h.created_at),
            typeOp,
            h.mode_paiement || 'Espèces',
            details,
            h.montant,
          ])
        })
      } else {
        rows.push([
          c.nom,
          c.telephone,
          c.adresse || '—',
          statutClient,
          c.solde,
          '—',
          'Aucune transaction enregistrée',
          '—',
          '—',
          0,
        ])
      }
    })

    exportToCSV(`Carnet_Dettes_Detaille_${(boutique.nom || 'Boutique').replace(/\s+/g, '_')}`, headers, rows)
  }, [boutique.nom, clients, obtenirClientsAvecHistorique])

  const handleExportPDF = useCallback(async () => {
    if (clients.length === 0) {
      toast.warning('Aucun client enregistré dans le carnet.')
      return
    }

    const clientsComplets = await obtenirClientsAvecHistorique()
    const headers = [
      'Client',
      'Téléphone',
      'Statut',
      'Solde Actuel',
      'Date Opération',
      'Type',
      'Montant Op.',
      'Détails / Produits',
    ]

    const rows: (string | number)[][] = []

    clientsComplets.forEach((c) => {
      const statutClient = c.solde > 0 ? 'Dette' : c.solde < 0 ? 'Avance' : 'Réglé'
      const listHist = c.historique || []

      if (listHist.length > 0) {
        listHist.forEach((h) => {
          const typeOp =
            h.type === 'vente_credit'
              ? 'Crédit'
              : h.type === 'remboursement'
              ? 'Remboursement'
              : 'Avance'
          const details =
            h.note ||
            (h.produits && h.produits.length > 0
              ? h.produits.map((p: any) => `${p.nom} x${p.qte || 1}`).join(', ')
              : '—')
          rows.push([
            c.nom,
            c.telephone,
            statutClient,
            fcfa(c.solde),
            fmtDate(h.created_at),
            typeOp,
            fcfa(h.montant),
            details,
          ])
        })
      } else {
        rows.push([c.nom, c.telephone, statutClient, fcfa(c.solde), '—', '—', '0 FCFA', 'Aucun historique'])
      }
    })

    const totalDettes = clients.filter((c) => c.solde > 0).reduce((s, c) => s + Number(c.solde), 0)
    const totalAvances = clients.filter((c) => c.solde < 0).reduce((s, c) => s + Math.abs(Number(c.solde)), 0)

    printPDFReport({
      title: `Rapport Complet du Carnet de Dettes - ${boutique.nom || 'Ma Boutique'}`,
      subtitle: `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
      summaryCards: [
        { label: 'Total Créances à Recouvrer', value: fcfa(totalDettes), color: '#dc2626' },
        { label: 'Total Avances Reçues', value: fcfa(totalAvances), color: '#0A5C36' },
        { label: 'Nombre Total de Clients', value: String(clients.length), color: '#1C2B4A' },
      ],
      tableHeaders: headers,
      tableRows: rows,
    })
  }, [boutique.nom, clients, obtenirClientsAvecHistorique])

  const handleExportReleveClientPDF = useCallback(
    (client: ClientCredit, historique: TransactionCredit[]) => {
      if (!client) return

      const headers = ['Date', 'Type Opération', 'Mode', 'Détails / Produits', 'Montant']
      const rows = historique.map((h) => [
        fmtDateHeure(h.created_at),
        h.type === 'vente_credit' ? 'Vente à crédit' : h.type === 'remboursement' ? 'Remboursement' : 'Avance',
        h.mode_paiement || 'Espèces',
        h.note || (h.produits && h.produits.length > 0 ? h.produits.map((p) => `${p.nom} x${p.qte || 1}`).join(', ') : '—'),
        fcfa(h.montant),
      ])

      printPDFReport({
        title: `Relevé de Compte - ${client.nom}`,
        subtitle: `Boutique : ${boutique.nom || 'Ma Boutique'} | Téléphone : ${client.telephone}`,
        summaryCards: [
          {
            label: client.solde > 0 ? 'Dette Restante' : client.solde < 0 ? 'Avance Restante' : 'Solde',
            value: fcfa(Math.abs(client.solde)),
            color: client.solde > 0 ? '#dc2626' : '#0A5C36',
          },
          { label: 'Plafond Accordé', value: fcfa(client.plafond_max || 200000), color: '#1C2B4A' },
          { label: 'Nombre d\'Opérations', value: String(historique.length), color: '#5A4E42' },
        ],
        tableHeaders: headers,
        tableRows: rows,
      })
    },
    [boutique.nom]
  )

  return {
    handleExportCSV,
    handleExportPDF,
    handleExportReleveClientPDF,
  }
}
