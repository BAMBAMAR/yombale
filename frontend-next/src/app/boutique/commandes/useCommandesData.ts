'use client'

import { useState, useEffect, useCallback } from 'react'
import { listCommandes } from '../actions'
import { fmtDateHeure } from '@/lib/format'
import { exportToCSV, printPDFReport } from '@/lib/export'
import type { Commande, PanierAbandonne } from './types'
import { getStatutLabel } from './types'
import { useToast } from '@/context/ToastContext'

export function useCommandesData(boutiqueId: string, t: any) {
  const { toast } = useToast()
  const [subTab, setSubTab] = useState<'commandes' | 'zones'>('commandes')
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [paniersAbandonnes, setPaniersAbandonnes] = useState<PanierAbandonne[]>([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState('')
  const [filtreCanal, setFiltreCanal] = useState<'tous' | 'web' | 'caisse'>('tous')

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  const load = useCallback(async () => {
    const cacheKey = `nopalou_offline_commandes_${boutiqueId}_${filtre}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (filtre === 'abandonne') setPaniersAbandonnes(parsed)
        else setCommandes(parsed)
      } catch (e) {
        console.warn('[Nopalou:useCommandesData]', e)
      }
    }
    if (!cached) setLoading(true)

    if (filtre === 'abandonne') {
      try {
        const res = await fetch(`/api/boutiques/${boutiqueId}/paniers-abandonnes`)
        let data
        if (!res.ok) {
          const directRes = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/paniers-abandonnes`, {
            credentials: 'include',
            headers: { Authorization: `Bearer ${localStorage.getItem('nopalou_token') || ''}` },
          })
          data = await directRes.json()
        } else {
          data = await res.json()
        }
        setPaniersAbandonnes(data.paniers || [])
        localStorage.setItem(cacheKey, JSON.stringify(data.paniers || []))
      } catch {
        if (!cached) setPaniersAbandonnes([])
      }
    } else {
      try {
        const data = await listCommandes(boutiqueId, filtre)
        setCommandes(data || [])
        localStorage.setItem(cacheKey, JSON.stringify(data || []))
      } catch (err) {
        if (!cached) setCommandes([])
      }
    }
    setLoading(false)
  }, [boutiqueId, filtre, backendUrl])

  useEffect(() => {
    load()
  }, [load])

  const commandesFiltrees = commandes.filter((c) => {
    if (filtreCanal === 'caisse') return c.reference?.startsWith('POS') || c.source === 'pos_caisse'
    if (filtreCanal === 'web') return !c.reference?.startsWith('POS') && c.source !== 'pos_caisse'
    return true
  })

  const relancerWhatsApp = async (cartId: string) => {
    try {
      const res = await fetch(
        `${backendUrl}/api/boutiques/${boutiqueId}/paniers-abandonnes/${cartId}/relancer`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('nopalou_token') || ''}`,
          },
        }
      )
      const data = await res.json()
      if (data.lienWhatsapp) {
        window.open(data.lienWhatsapp, '_blank')
        load()
      }
    } catch {
      toast.error('Impossible de générer le lien de relance WhatsApp')
    }
  }

  const exportCommandesCSV = () => {
    const headers = [
      'Référence',
      'Produit',
      'Quantité',
      'Prix Unit (FCFA)',
      'Livraison (FCFA)',
      'Total (FCFA)',
      'Client',
      'Téléphone',
      'Statut',
      'Source',
      'Date',
    ]
    const rows = commandesFiltrees.map((c) => [
      c.reference || `CMD-${c.id.slice(0, 6)}`,
      c.nom_produit,
      c.quantite,
      c.prix_unitaire,
      c.frais_livraison,
      c.montant_total,
      c.client_nom,
      c.client_telephone,
      c.statut.toUpperCase(),
      c.source || 'web',
      fmtDateHeure(c.created_at),
    ])
    exportToCSV(`commandes_boutique_${boutiqueId}`, headers, rows)
  }

  const exportCommandesPDF = () => {
    const headers = ['Réf.', 'Produit', 'Qte', 'Total', 'Client', 'Tel', 'Statut', 'Date']
    const rows = commandesFiltrees.map((c) => [
      c.reference || `CMD-${c.id.slice(0, 6)}`,
      c.nom_produit,
      c.quantite,
      `${Number(c.montant_total).toLocaleString('fr-FR')} FCFA`,
      c.client_nom,
      c.client_telephone,
      getStatutLabel(c.statut, t),
      fmtDateHeure(c.created_at),
    ])
    const totalM = commandesFiltrees.reduce((s, c) => s + Number(c.montant_total), 0)
    const summaryHtml = `
      <div class="summary">
        <h3 style="margin:0 0 6px;">Registre des Commandes Clients</h3>
        <p style="margin:0; font-size:14px; font-weight:bold; color:#C75B00;">Total : ${totalM.toLocaleString('fr-FR')} FCFA (${commandesFiltrees.length} commandes)</p>
      </div>
    `
    printPDFReport('Journal des Commandes Clients', `Boutique ${boutiqueId}`, headers, rows, summaryHtml)
  }

  return {
    subTab,
    setSubTab,
    commandes,
    commandesFiltrees,
    paniersAbandonnes,
    loading,
    filtre,
    setFiltre,
    filtreCanal,
    setFiltreCanal,
    load,
    relancerWhatsApp,
    exportCommandesCSV,
    exportCommandesPDF,
  }
}
