'use client'

import { useState, useEffect } from 'react'
import { fcfa, fmtDate, fmtDateHeure } from '@/lib/format'
import { exportToCSV, printPDFReport } from '@/lib/export'


interface ClientCredit {
  id: string
  boutique_id: string
  nom: string
  telephone: string
  adresse?: string | null
  solde: number
  plafond_max: number
  note_client?: string | null
  created_at?: string
  historique?: TransactionCredit[]
}

interface TransactionCredit {
  id: string
  client_id: string
  boutique_id: string
  type: 'vente_credit' | 'remboursement' | 'depot_avance'
  montant: number
  mode_paiement: string
  note?: string | null
  produits?: any[]
  date_echeance?: string | null
  relance_auto_whatsapp?: boolean
  derniere_relance_whatsapp?: string | null
  created_at: string
}

interface ProduitBoutique {
  id: string
  nom: string
  prix: number | null
  prix_promo?: number | null
  images?: string[] | null
  photo_url?: string | null
  image_url?: string | null
  stock_quantite?: number | null
  quantite_stock?: number | null
}

interface CarnetDettesProps {
  boutique: {
    id: string
    nom: string
    slug?: string | null
    telephone?: string | null
    whatsapp?: string | null
    currency?: string
  }
  planActif?: string | null
}

export default function CarnetDettes({ boutique, planActif }: CarnetDettesProps) {
  // États principaux
  const [clients, setClients] = useState<ClientCredit[]>([])
  const [produits, setProduits] = useState<ProduitBoutique[]>([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtreStatus, setFiltreStatus] = useState<'tous' | 'retard' | 'credits'>('tous')
  
  // Client sélectionné & Historique
  const [clientSelectionne, setClientSelectionne] = useState<ClientCredit | null>(null)
  const [historique, setHistorique] = useState<TransactionCredit[]>([])
  const [loadingHist, setLoadingHist] = useState(false)

  // Modales
  const [showModalNouveauClient, setShowModalNouveauClient] = useState(false)
  const [showModalEditClient, setShowModalEditClient] = useState(false)
  const [showModalTransaction, setShowModalTransaction] = useState(false)
  const [typeTransaction, setTypeTransaction] = useState<'vente_credit' | 'remboursement'>('vente_credit')

  // Formulaire Client (Création)
  const [nomClient, setNomClient] = useState('')
  const [telClient, setTelClient] = useState('')
  const [adresseClient, setAdresseClient] = useState('')
  const [plafondClient, setPlafondClient] = useState('200000')
  const [noteClient, setNoteClient] = useState('')

  // Formulaire Client (Édition / Modification)
  const [clientAEditer, setClientAEditer] = useState<ClientCredit | null>(null)
  const [editNom, setEditNom] = useState('')
  const [editTel, setEditTel] = useState('')
  const [editAdresse, setEditAdresse] = useState('')
  const [editPlafond, setEditPlafond] = useState('200000')
  const [editNote, setEditNote] = useState('')
  const [submittingEdit, setSubmittingEdit] = useState(false)

  // Formulaire Transaction & Sélecteur Catalogue
  const [modeSaisie, setModeSaisie] = useState<'catalogue' | 'manuel'>('catalogue')
  const [panierProduits, setPanierProduits] = useState<Record<string, number>>({}) // produitId -> qte
  const [rechercheProduitModal, setRechercheProduitModal] = useState('')
  const [categorieProduitModal, setCategorieProduitModal] = useState('tous')
  const [montantManuel, setMontantManuel] = useState('')
  const [descriptionManuelle, setDescriptionManuelle] = useState('')
  const [modePaiement, setModePaiement] = useState('especes')
  const [dateEcheance, setDateEcheance] = useState('')
  const [relanceAutoWa, setRelanceAutoWa] = useState(true)
  const [submittingTrans, setSubmittingTrans] = useState(false)

  // Détection réactive de la largeur d'écran (Mobile < 768px)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Charger les données (clients + catalogue)
  const chargerDonnees = async () => {
    setLoading(true)
    try {
      // 1. Clients du carnet
      const resClients = await fetch(`/api/boutiques/${boutique.id}/credits-clients`)
      if (resClients.ok) {
        const dataC = await resClients.json()
        if (dataC.clients) setClients(dataC.clients)
      }

      // 2. Produits pour le sélecteur catalogue
      const resProds = await fetch(`/api/boutiques/${boutique.id}/produits`)
      if (resProds.ok) {
        const dataP = await resProds.json()
        const prodsList = dataP.produits || dataP.data || (Array.isArray(dataP) ? dataP : [])
        setProduits(prodsList)
      }
    } catch (err) {
      console.error('Erreur chargement carnet:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (boutique.id) {
      chargerDonnees()
    }
  }, [boutique.id])

  // Charger l'historique d'un client
  const chargerHistoriqueClient = async (clientId: string) => {
    setLoadingHist(true)
    try {
      const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${clientId}/historique`)
      if (res.ok) {
        const data = await res.json()
        setHistorique(data.historique || [])
      }
    } catch (e) {
      console.error('Erreur chargement historique client:', e)
    } finally {
      setLoadingHist(false)
    }
  }

  const ouvrirFicheClient = (c: ClientCredit) => {
    setClientSelectionne(c)
    chargerHistoriqueClient(c.id)
  }

  const ouvrirModalEditClient = (c: ClientCredit) => {
    setClientAEditer(c)
    setEditNom(c.nom || '')
    setEditTel(c.telephone || '')
    setEditAdresse(c.adresse || '')
    setEditPlafond(String(c.plafond_max || 200000))
    setEditNote(c.note_client || '')
    setShowModalEditClient(true)
  }

  const ouvrirModalTransaction = (type: 'vente_credit' | 'remboursement', client?: ClientCredit) => {
    if (client) {
      setClientSelectionne(client)
      chargerHistoriqueClient(client.id)
    } else if (!clientSelectionne && clients.length > 0) {
      setClientSelectionne(clients[0])
    }
    setTypeTransaction(type)
    setMontantManuel('')
    setDescriptionManuelle('')
    setPanierProduits({})
    setDateEcheance('')
    setModeSaisie(type === 'vente_credit' ? 'catalogue' : 'manuel')
    setShowModalTransaction(true)
  }

  // Calculs KPI généraux
  const totalDettesAEncaisser = clients.reduce((acc, c) => acc + (Number(c.solde) > 0 ? Number(c.solde) : 0), 0)
  const totalAvancesClients = clients.reduce((acc, c) => acc + (Number(c.solde) < 0 ? Math.abs(Number(c.solde)) : 0), 0)
  const nbClientsDebiteurs = clients.filter(c => Number(c.solde) > 0).length

  // Calcul du montant total du panier catalogue dans la modale
  const totalPanierCatalogue = Object.entries(panierProduits).reduce((sum, [pId, qte]) => {
    const p = produits.find(item => item.id === pId)
    const prix = p ? Number(p.prix_promo || p.prix || 0) : 0
    return sum + (prix * qte)
  }, 0)

  const totalTransactionCourante = (typeTransaction === 'vente_credit' && modeSaisie === 'catalogue') 
    ? totalPanierCatalogue 
    : (Number(montantManuel) || 0)

  // Gestion Création Client
  const handleCreerClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomClient.trim() || !telClient.trim()) {
      alert('Le nom et le téléphone sont obligatoires.')
      return
    }

    try {
      const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: nomClient.trim(),
          telephone: telClient.trim(),
          adresse: adresseClient.trim() || null,
          plafond_max: Number(plafondClient || 200000),
          note_client: noteClient.trim() || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setNomClient('')
        setTelClient('')
        setAdresseClient('')
        setNoteClient('')
        setShowModalNouveauClient(false)
        await chargerDonnees()
        if (data.client) {
          ouvrirFicheClient(data.client)
        }
      } else {
        const err = await res.json()
        alert(err.error || 'Erreur lors de la création du profil client.')
      }
    } catch (err) {
      console.error('Erreur création client carnet:', err)
    }
  }

  // Gestion Édition / Modification Client
  const handleEnregistrerEditClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientAEditer) return
    if (!editNom.trim() || !editTel.trim()) {
      alert('Le nom et le téléphone sont obligatoires.')
      return
    }

    setSubmittingEdit(true)
    try {
      const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${clientAEditer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: editNom.trim(),
          telephone: editTel.trim(),
          adresse: editAdresse.trim() || null,
          plafond_max: Number(editPlafond || 200000),
          note_client: editNote.trim() || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setShowModalEditClient(false)
        await chargerDonnees()
        if (data.client) {
          if (clientSelectionne?.id === data.client.id) {
            setClientSelectionne(data.client)
          }
        }
        alert('Profil client mis à jour avec succès !')
      } else {
        const err = await res.json()
        alert(err.error || 'Erreur lors de la modification du client.')
      }
    } catch (err) {
      console.error('Erreur modification client carnet:', err)
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Soumettre une Transaction (Vente à crédit / Remboursement)
  const handleValiderTransaction = async () => {
    if (!clientSelectionne) {
      alert('Veuillez d’abord choisir un client du carnet.')
      return
    }

    const montantFinal = totalTransactionCourante
    if (!montantFinal || montantFinal <= 0) {
      alert('Veuillez ajouter au moins un produit du catalogue ou saisir un montant valide.')
      return
    }

    let produitsListe: any[] = []
    if (typeTransaction === 'vente_credit' && modeSaisie === 'catalogue') {
      produitsListe = Object.entries(panierProduits).map(([pId, qte]) => {
        const p = produits.find(item => item.id === pId)
        return {
          id: pId,
          nom: p?.nom || 'Article catalogue',
          quantite: qte,
          prix: Number(p?.prix_promo || p?.prix || 0),
        }
      })
    } else {
      const nomParDefaut = typeTransaction === 'remboursement' ? 'Remboursement' : 'Vente directe'
      produitsListe = [{ nom: descriptionManuelle.trim() || nomParDefaut, quantite: 1, prix: montantFinal }]
    }

    setSubmittingTrans(true)
    try {
      const noteFinal = (typeTransaction === 'vente_credit' && modeSaisie === 'catalogue')
        ? `Achat catalogue (${produitsListe.length} article(s))`
        : (descriptionManuelle.trim() || (typeTransaction === 'remboursement' ? 'Remboursement client' : 'Vente directe'))

      const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${clientSelectionne.id}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: typeTransaction,
          montant: montantFinal,
          mode_paiement: modePaiement,
          note: noteFinal,
          produits: produitsListe,
          date_echeance: dateEcheance || null,
          relance_auto_whatsapp: relanceAutoWa,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setShowModalTransaction(false)
        setPanierProduits({})
        setMontantManuel('')
        setDescriptionManuelle('')
        setDateEcheance('')
        
        const nouveauSolde = data.nouveauSolde
        setClientSelectionne(prev => prev ? { ...prev, solde: nouveauSolde } : null)
        await chargerDonnees()
        await chargerHistoriqueClient(clientSelectionne.id)
      } else {
        const err = await res.json()
        alert(err.error || 'Erreur lors de l’enregistrement de la transaction.')
      }
    } catch (e) {
      console.error('Erreur transaction carnet:', e)
    } finally {
      setSubmittingTrans(false)
    }
  }

  // Déclencher Relance WhatsApp 1-Clic
  const handleRelancerWhatsApp = async (c: ClientCredit) => {
    try {
      const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${c.id}/relance-whatsapp`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        if (data.lienWhatsapp) {
          window.open(data.lienWhatsapp, '_blank')
        } else {
          alert('Relance WhatsApp envoyée !')
        }
      } else {
        const err = await res.json()
        alert(err.error || 'Impossible d’envoyer la relance.')
      }
    } catch (e) {
      console.error('Erreur relance whatsapp:', e)
    }
  }

  // Filtrage des clients
  const clientsFiltres = clients.filter(c => {
    const textMatch = !recherche.trim() || 
      c.nom.toLowerCase().includes(recherche.toLowerCase()) || 
      c.telephone.includes(recherche) ||
      (c.adresse && c.adresse.toLowerCase().includes(recherche.toLowerCase()))
    
    if (!textMatch) return false

    if (filtreStatus === 'retard') {
      return Number(c.solde) > 0
    }
    if (filtreStatus === 'credits') {
      return Number(c.solde) < 0
    }
    return true
  })

  // Charger l'historique complet pour tous les clients du carnet avant export
  const obtenirClientsAvecHistorique = async (): Promise<ClientCredit[]> => {
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
  }

  // Fonctions d'exportation du carnet avec l'historique détaillé de chaque client
  const handleExportCSV = async () => {
    if (clients.length === 0) {
      alert('Aucun client enregistré dans le carnet.')
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
      'Montant Opération (FCFA)'
    ]

    const rows: (string | number)[][] = []

    clientsComplets.forEach(c => {
      const statutClient = c.solde > 0 ? 'Dette à encaisser' : c.solde < 0 ? 'Avance client' : 'Solde nul (Réglé)'
      const listHist = c.historique || []

      if (listHist.length > 0) {
        listHist.forEach(h => {
          const typeOp = h.type === 'vente_credit' ? 'Vente à crédit' : h.type === 'remboursement' ? 'Remboursement' : 'Dépôt / Avance'
          const details = h.note || (h.produits && h.produits.length > 0 ? h.produits.map((p: any) => `${p.nom} x${p.qte || 1}`).join(', ') : '—')
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
            h.montant
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
          0
        ])
      }
    })

    exportToCSV(`Carnet_Dettes_Detaille_${(boutique.nom || 'Boutique').replace(/\s+/g, '_')}`, headers, rows)
  }

  const handleExportPDF = async () => {
    if (clients.length === 0) {
      alert('Aucun client enregistré dans le carnet.')
      return
    }

    const clientsComplets = await obtenirClientsAvecHistorique()

    const summaryHtml = `
      <div style="margin-bottom:20px; padding:16px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; font-size:13px; color:#0f172a;">
        <p style="margin:0 0 6px; font-size:15px; font-weight:bold; color:#15803d;">📊 Synthèse Globale du Carnet — ${boutique.nom}</p>
        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-top:8px;">
          <div><strong>Total Créances à Encaisser :</strong> <span style="color:#dc2626; font-weight:bold;">${fcfa(totalDettesAEncaisser)}</span></div>
          <div><strong>Total Avances Clients :</strong> <span style="color:#16a34a; font-weight:bold;">${fcfa(totalAvancesClients)}</span></div>
          <div><strong>Nombre de Clients Débiteurs :</strong> <span>${nbClientsDebiteurs} client(s)</span></div>
        </div>
      </div>
    `

    const clientsSectionsHtml = clientsComplets.map(c => {
      const listHist = c.historique || []
      const soldeColor = c.solde > 0 ? '#dc2626' : c.solde < 0 ? '#16a34a' : '#475569'
      const soldeBadge = c.solde > 0 ? 'Dette client' : c.solde < 0 ? 'Avance client' : 'Solde nul'

      const histRowsHtml = listHist.length > 0
        ? listHist.map(h => {
            const typeLabel = h.type === 'vente_credit' ? 'Vente à crédit' : h.type === 'remboursement' ? 'Remboursement' : 'Dépôt / Avance'
            const detailsStr = h.note || (h.produits && h.produits.length > 0 ? h.produits.map((p: any) => `${p.nom} x${p.qte || 1}`).join(', ') : '—')
            return `
              <tr>
                <td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:11.5px;">${fmtDateHeure(h.created_at)}</td>
                <td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:11.5px; font-weight:bold;">${typeLabel}</td>
                <td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:11.5px;">${h.mode_paiement || 'Espèces'}</td>
                <td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:11.5px;">${detailsStr}</td>
                <td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:11.5px; text-align:right; font-weight:bold;">${fcfa(h.montant)}</td>
              </tr>
            `
          }).join('')
        : `
          <tr>
            <td colspan="5" style="padding:10px; border:1px solid #e2e8f0; font-size:12px; text-align:center; color:#64748b; font-style:italic;">
              Aucune transaction enregistrée dans l'historique
            </td>
          </tr>
        `

      return `
        <div class="client-section">
          <div class="client-header">
            <div>
              <span style="font-size:15px; font-weight:bold; color:#0f172a;">👤 ${c.nom}</span>
              <span style="margin-left:12px; font-size:12.5px; color:#475569;">📱 ${c.telephone}</span>
              ${c.adresse ? `<span style="margin-left:12px; font-size:12px; color:#64748b;">📍 ${c.adresse}</span>` : ''}
            </div>
            <div>
              <span style="font-size:12px; padding:3px 8px; border-radius:12px; background:#f1f5f9; color:#334155; font-weight:600; margin-right:8px;">${soldeBadge}</span>
              <span style="font-size:14px; font-weight:bold; color:${soldeColor};">Solde : ${fcfa(c.solde)}</span>
            </div>
          </div>
          
          <table style="width:100%; border-collapse:collapse; margin-top:8px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:6px 10px; border:1px solid #cbd5e1; font-size:11px; text-align:left;">Date & Heure</th>
                <th style="padding:6px 10px; border:1px solid #cbd5e1; font-size:11px; text-align:left;">Type Opération</th>
                <th style="padding:6px 10px; border:1px solid #cbd5e1; font-size:11px; text-align:left;">Mode Paiement</th>
                <th style="padding:6px 10px; border:1px solid #cbd5e1; font-size:11px; text-align:left;">Détails / Description</th>
                <th style="padding:6px 10px; border:1px solid #cbd5e1; font-size:11px; text-align:right;">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${histRowsHtml}
            </tbody>
          </table>
        </div>
      `
    }).join('')

    printPDFReport(
      `Carnet de Dettes & Crédits (Détaillé) — ${boutique.nom}`,
      `Rapport complet des comptes et historiques clients`,
      [],
      [],
      summaryHtml,
      clientsSectionsHtml
    )
  }

  const handleExportReleveClientPDF = () => {
    if (!clientSelectionne) return
    const headers = ['Date & Heure', 'Type Opération', 'Mode Paiement', 'Détails / Description', 'Montant (FCFA)']
    const rows = historique.map(h => [
      fmtDateHeure(h.created_at),
      h.type === 'vente_credit' ? 'Vente à crédit' : h.type === 'remboursement' ? 'Remboursement' : 'Dépôt / Avance',
      h.mode_paiement || 'Espèces',
      h.note || (h.produits && h.produits.length > 0 ? h.produits.map((p: any) => `${p.nom} x${p.qte || 1}`).join(', ') : '—'),
      fcfa(h.montant)
    ])
    const summaryHtml = `
      <div style="margin-bottom:20px; padding:14px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; font-size:13px; color:#0f172a;">
        <p style="margin:0 0 6px;"><strong>Client :</strong> ${clientSelectionne.nom}</p>
        <p style="margin:0 0 6px;"><strong>Téléphone WhatsApp :</strong> ${clientSelectionne.telephone}</p>
        <p style="margin:0 0 6px;"><strong>Adresse :</strong> ${clientSelectionne.adresse || '—'}</p>
        <p style="margin:0;"><strong>Solde Actuel :</strong> <span style="color:${clientSelectionne.solde > 0 ? '#dc2626' : '#16a34a'}; font-weight:bold; font-size:15px;">${fcfa(clientSelectionne.solde)}</span></p>
      </div>
    `
    printPDFReport(
      `Relevé de Compte Client — ${clientSelectionne.nom}`,
      `Boutique ${boutique.nom} · Récapitulatif des opérations`,
      headers,
      rows,
      summaryHtml
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* En-tête Synthétique Harmonisé (Couleurs Claires du Site) */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        padding: isMobile ? '16px 18px' : '22px 24px',
        color: '#0f172a',
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: 14
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 24 }}>📒</span>
              <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                Carnet de Crédits & Dettes Clients
              </h1>
              <span style={{
                background: '#FFF3E8',
                color: 'var(--accent)',
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 11.5,
                fontWeight: 800,
                border: '1px solid #FED7AA'
              }}>
                Tous forfaits
              </span>
            </div>
            {!isMobile && (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                Gestion simplifiée des créances, avances clients, modifications de profil et relances WhatsApp.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
            <button
              onClick={() => setShowModalNouveauClient(true)}
              style={{
                flex: isMobile ? 1 : 'none',
                background: 'var(--navy)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                padding: '10px 16px',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(28, 43, 74, 0.20)',
                minHeight: 42
              }}
            >
              👤 + Nouveau Client
            </button>

            <button
              onClick={handleExportCSV}
              style={{
                flex: isMobile ? 1 : 'none',
                background: 'var(--card)',
                color: 'var(--navy)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '10px 14px',
                fontWeight: 800,
                fontSize: 12.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                minHeight: 42
              }}
              title="Exporter toutes les dettes au format CSV Excel"
            >
              📥 Export CSV
            </button>

            <button
              onClick={handleExportPDF}
              style={{
                flex: isMobile ? 1 : 'none',
                background: 'var(--card)',
                color: 'var(--navy)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '10px 14px',
                fontWeight: 800,
                fontSize: 12.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                minHeight: 42
              }}
              title="Imprimer ou sauvegarder le rapport PDF du carnet"
            >
              🖨️ Imprimer PDF
            </button>

            <button
              onClick={() => ouvrirModalTransaction('vente_credit')}
              style={{
                flex: isMobile ? 1 : 'none',
                background: 'var(--red)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                padding: '10px 16px',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(185, 28, 28, 0.25)',
                minHeight: 42
              }}
            >
              ⚡ + Donner Crédit
            </button>
          </div>
        </div>

        {/* Cartes KPI Claires sur Fond Blanc */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: isMobile ? 8 : 12
        }}>
          {/* Card 1: On me doit */}
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: isMobile ? '10px 10px' : '14px'
          }}>
            <span style={{ fontSize: isMobile ? 9.5 : 11, color: '#991b1b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
              🔴 TOTAL DETTES
            </span>
            <div style={{ fontSize: isMobile ? 15 : 22, fontWeight: 900, color: '#dc2626', marginTop: 2 }}>
              {fcfa(totalDettesAEncaisser)}
            </div>
            {!isMobile && (
              <div style={{ fontSize: 11.5, color: '#7f1d1d', marginTop: 4, fontWeight: 600 }}>
                {nbClientsDebiteurs} client(s) débiteur(s)
              </div>
            )}
          </div>

          {/* Card 2: Avances Clients */}
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 12,
            padding: isMobile ? '10px 10px' : '14px'
          }}>
            <span style={{ fontSize: isMobile ? 9.5 : 11, color: '#166534', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
              🟢 TOTAL AVANCES
            </span>
            <div style={{ fontSize: isMobile ? 15 : 22, fontWeight: 900, color: '#16a34a', marginTop: 2 }}>
              {fcfa(totalAvancesClients)}
            </div>
            {!isMobile && (
              <div style={{ fontSize: 11.5, color: '#14532d', marginTop: 4, fontWeight: 600 }}>
                Fonds d&apos;avances enregistrés
              </div>
            )}
          </div>

          {/* Card 3: Clients Registre */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: isMobile ? '10px 10px' : '14px'
          }}>
            <span style={{ fontSize: isMobile ? 9.5 : 11, color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
              👥 CLIENTS REGISTRE
            </span>
            <div style={{ fontSize: isMobile ? 15 : 22, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
              {clients.length} Client(s)
            </div>
            {!isMobile && (
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4, fontWeight: 600 }}>
                Comptes de crédits actifs
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barre de Recherche & Filtres */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: '1 1 220px', position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Rechercher client, téléphone ou quartier..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              background: '#ffffff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              minHeight: 42
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, WebkitOverflowScrolling: 'touch' }}>
          {[
            { id: 'tous', label: `Tous (${clients.length})` },
            { id: 'retard', label: `🔴 Débiteurs (${nbClientsDebiteurs})` },
            { id: 'credits', label: `🟢 En Avance` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltreStatus(f.id as any)}
              style={{
                padding: '7px 14px',
                borderRadius: 20,
                border: filtreStatus === f.id ? '2px solid var(--navy)' : '1px solid var(--border)',
                background: filtreStatus === f.id ? 'var(--navy)' : 'var(--card)',
                color: filtreStatus === f.id ? '#ffffff' : 'var(--text2)',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: 36
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Layout Master/Detail Réactif pour Mobile & Desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: (isMobile || !clientSelectionne) ? '1fr' : '1.05fr 1fr',
        gap: 16
      }}>
        
        {/* LISTE DES CLIENTS : Cachée sur mobile si un client est sélectionné */}
        {(!isMobile || !clientSelectionne) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 14 }}>Chargement du carnet...</div>
            ) : clientsFiltres.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px 16px',
                background: '#ffffff',
                borderRadius: 16,
                border: '2px dashed #cbd5e1',
                color: '#64748b'
              }}>
                <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>📒</span>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Aucun client trouvé dans le carnet</p>
                <p style={{ margin: '4px 0 14px', fontSize: 12.5, color: '#94a3b8' }}>
                  Ajoutez votre premier client pour enregistrer ses crédits et avances.
                </p>
                <button
                  onClick={() => setShowModalNouveauClient(true)}
                  style={{
                    background: '#0f172a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 16px',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  + Créer un client
                </button>
              </div>
            ) : (
              clientsFiltres.map(c => {
                const soldeNum = Number(c.solde)
                const estDebiteur = soldeNum > 0
                const estAvance = soldeNum < 0
                const estActif = clientSelectionne?.id === c.id

                return (
                  <div
                    key={c.id}
                    style={{
                      background: estActif ? '#f0f9ff' : '#ffffff',
                      border: estActif ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      borderRadius: 14,
                      padding: '14px 16px',
                      boxShadow: estActif ? '0 4px 14px rgba(2, 132, 199, 0.12)' : '0 2px 4px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}
                  >
                    {/* Infos Client Top */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{c.nom}</span>
                          {c.adresse && (
                            <span style={{ fontSize: 10.5, background: '#f1f5f9', color: '#475569', padding: '2px 7px', borderRadius: 8, fontWeight: 600 }}>
                              📍 {c.adresse}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                          📞 {c.telephone} {c.plafond_max > 0 ? `• Plafond: ${fcfa(c.plafond_max)}` : ''}
                        </div>
                        {c.note_client && (
                          <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 2 }}>
                            Note: {c.note_client}
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                          fontSize: 15,
                          fontWeight: 900,
                          color: estDebiteur ? '#dc2626' : estAvance ? '#16a34a' : '#64748b'
                        }}>
                          {estDebiteur ? `+ ${fcfa(soldeNum)}` : estAvance ? `- ${fcfa(Math.abs(soldeNum))}` : '0 FCFA'}
                        </div>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 10,
                          display: 'inline-block',
                          marginTop: 4,
                          background: estDebiteur ? '#fef2f2' : estAvance ? '#f0fdf4' : '#f8fafc',
                          color: estDebiteur ? '#991b1b' : estAvance ? '#166534' : '#64748b',
                          border: estDebiteur ? '1px solid #fecaca' : estAvance ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
                        }}>
                          {estDebiteur ? '🔴 Doit la boutique' : estAvance ? '🟢 Avance client' : '⚪ Solde nul'}
                        </span>
                      </div>
                    </div>

                    {/* Barre d'Actions Intégrée */}
                    <div style={{
                      display: 'flex',
                      gap: 6,
                      flexWrap: 'wrap',
                      paddingTop: 8,
                      borderTop: '1px solid #f1f5f9',
                      alignItems: 'center',
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        onClick={() => handleRelancerWhatsApp(c)}
                        style={{
                          background: '#25D366',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 10px',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        📱 WA Relance
                      </button>

                      <button
                        onClick={() => ouvrirModalEditClient(c)}
                        style={{
                          background: 'var(--card)',
                          color: 'var(--navy)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: '6px 10px',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        ✏️ Modifier
                      </button>

                      <button
                        onClick={() => ouvrirFicheClient(c)}
                        style={{
                          background: 'var(--card)',
                          color: 'var(--navy)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        📜 Fiche Client
                      </button>

                      <button
                        onClick={() => ouvrirModalTransaction('remboursement', c)}
                        style={{
                          background: 'var(--price)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        💵 Rembourser
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* FICHE DÉTAILLÉE DU CLIENT SÉLECTIONNÉ */}
        {clientSelectionne && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 18,
            padding: isMobile ? '16px' : '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 4px 16px rgba(15,23,42,0.06)'
          }}>
            {/* Bouton Retour Liste sur Mobile */}
            {isMobile && (
              <button
                onClick={() => setClientSelectionne(null)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  alignSelf: 'flex-start',
                  minHeight: 38
                }}
              >
                ← Retour à la liste des clients
              </button>
            )}

            {/* En-tête Fiche Client */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{clientSelectionne.nom}</h2>
                  <button
                    onClick={() => ouvrirModalEditClient(clientSelectionne)}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#475569',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ Modifier
                  </button>
                  {!isMobile && (
                    <button
                      onClick={() => setClientSelectionne(null)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748b' }}>
                  📞 {clientSelectionne.telephone} {clientSelectionne.adresse ? `• 📍 ${clientSelectionne.adresse}` : ''}
                </p>
                {clientSelectionne.note_client && (
                  <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic' }}>
                    Note: {clientSelectionne.note_client}
                  </p>
                )}
              </div>

              <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Solde Actuel</span>
                <div style={{
                  fontSize: 19,
                  fontWeight: 900,
                  color: Number(clientSelectionne.solde) > 0 ? '#dc2626' : Number(clientSelectionne.solde) < 0 ? '#16a34a' : '#0f172a'
                }}>
                  {fcfa(clientSelectionne.solde)}
                </div>
              </div>
            </div>

            {/* Actions Rapides */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => ouvrirModalTransaction('vente_credit')}
                style={{
                  flex: 1,
                  minWidth: 120,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  minHeight: 42
                }}
              >
                + Crédit (Dette)
              </button>

              <button
                onClick={() => ouvrirModalTransaction('remboursement')}
                style={{
                  flex: 1,
                  minWidth: 120,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  minHeight: 42
                }}
              >
                💸 Rembourser
              </button>

              <button
                onClick={handleExportReleveClientPDF}
                style={{
                  flex: 1,
                  minWidth: 140,
                  background: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  minHeight: 42
                }}
                title="Imprimer ou enregistrer le relevé de compte de ce client en PDF"
              >
                🖨️ Imprimer Relevé PDF
              </button>

              {Number(clientSelectionne.solde) > 0 && (
                <button
                  onClick={() => handleRelancerWhatsApp(clientSelectionne)}
                  style={{
                    flex: isMobile ? 1 : 'none',
                    minWidth: isMobile ? 120 : 'auto',
                    background: '#25D366',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontWeight: 800,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    minHeight: 42
                  }}
                >
                  📱 Relance WA
                </button>
              )}
            </div>

            {/* Historique des opérations */}
            <div>
              <h3 style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                📜 Historique des Opérations
              </h3>

              {loadingHist ? (
                <div style={{ fontSize: 13, color: '#64748b' }}>Chargement de l&apos;historique...</div>
              ) : historique.length === 0 ? (
                <div style={{ fontSize: 12.5, color: '#94a3b8', fontStyle: 'italic', padding: '12px 0' }}>
                  Aucune transaction enregistrée pour ce client.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
                  {historique.map(h => {
                    const estVente = h.type === 'vente_credit'
                    const dateEch = h.date_echeance ? new Date(h.date_echeance) : null
                    const estEnRetard = dateEch && dateEch < new Date() && estVente

                    return (
                      <div
                        key={h.id}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: 10,
                          padding: '10px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: 6,
                              background: estVente ? '#fef2f2' : '#f0fdf4',
                              color: estVente ? '#991b1b' : '#166534',
                              border: estVente ? '1px solid #fecaca' : '1px solid #bbf7d0'
                            }}>
                              {estVente ? '🔴 Achat à crédit' : '🟢 Remboursement'}
                            </span>
                            <span style={{ fontSize: 11.5, color: '#64748b' }}>
                              {fmtDateHeure(h.created_at)}
                            </span>
                          </div>

                          {h.note && (
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginTop: 3 }}>
                              {h.note}
                            </div>
                          )}

                          {Array.isArray(h.produits) && h.produits.length > 0 && (
                            <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {h.produits.map((item: any, idx: number) => (
                                <span key={idx} style={{ fontSize: 10, background: '#e2e8f0', color: '#334155', padding: '2px 6px', borderRadius: 4 }}>
                                  {item.nom} (x{item.quantite})
                                </span>
                              ))}
                            </div>
                          )}

                          {h.date_echeance && (
                            <div style={{ fontSize: 11, marginTop: 4, color: estEnRetard ? '#dc2626' : '#0284c7', fontWeight: 700 }}>
                              📅 Échéance : {fmtDate(h.date_echeance)} {estEnRetard ? ' (🔴 En retard)' : ''}
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{
                            fontSize: 14,
                            fontWeight: 900,
                            color: estVente ? '#dc2626' : '#16a34a'
                          }}>
                            {estVente ? `+ ${fcfa(h.montant)}` : `- ${fcfa(h.montant)}`}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
                            {h.mode_paiement || 'Espèces'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* MODALE 1 : NOUVEAU CLIENT CARNET */}
      {showModalNouveauClient && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            maxWidth: 480,
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: isMobile ? 18 : 24,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a' }}>
                👤 Créer une nouvelle fiche client
              </h3>
              <button
                type="button"
                onClick={() => setShowModalNouveauClient(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#0f172a',
                  borderRadius: '50%',
                  width: 34,
                  height: 34,
                  fontSize: 18,
                  fontWeight: 900,
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Fermer la fenêtre"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreerClient} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Nom complet du client *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fatou Sow, Modou Ndiaye"
                  value={nomClient}
                  onChange={e => setNomClient(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Numéro Téléphone (WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: 771234567"
                  value={telClient}
                  onChange={e => setTelClient(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Adresse / Quartier</label>
                  <input
                    type="text"
                    placeholder="Ex: Medina, Rue 10"
                    value={adresseClient}
                    onChange={e => setAdresseClient(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Plafond Crédit (FCFA)</label>
                  <input
                    type="number"
                    placeholder="200000"
                    value={plafondClient}
                    onChange={e => setPlafondClient(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Note / Remarque confidentielle</label>
                <input
                  type="text"
                  placeholder="Ex: Voisine d'en face, confiance 100%"
                  value={noteClient}
                  onChange={e => setNoteClient(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: 6,
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px',
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: 'pointer',
                  minHeight: 44
                }}
              >
                ✓ Enregistrer le Client
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 2 : MODIFIER UN CLIENT */}
      {showModalEditClient && clientAEditer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            maxWidth: 480,
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: isMobile ? 18 : 24,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a' }}>
                ✏️ Modifier la fiche client
              </h3>
              <button
                type="button"
                onClick={() => setShowModalEditClient(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#0f172a',
                  borderRadius: '50%',
                  width: 34,
                  height: 34,
                  fontSize: 18,
                  fontWeight: 900,
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Fermer la fenêtre"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnregistrerEditClient} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Nom complet du client *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fatou Sow"
                  value={editNom}
                  onChange={e => setEditNom(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Numéro Téléphone (WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: 771234567"
                  value={editTel}
                  onChange={e => setEditTel(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Adresse / Quartier</label>
                  <input
                    type="text"
                    placeholder="Ex: Medina Rue 11"
                    value={editAdresse}
                    onChange={e => setEditAdresse(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Plafond Crédit (FCFA)</label>
                  <input
                    type="number"
                    placeholder="200000"
                    value={editPlafond}
                    onChange={e => setEditPlafond(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Note / Remarque confidentielle</label>
                <input
                  type="text"
                  placeholder="Note confidentielle..."
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingEdit}
                style={{
                  marginTop: 6,
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px',
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: 'pointer',
                  minHeight: 44,
                  opacity: submittingEdit ? 0.7 : 1
                }}
              >
                {submittingEdit ? 'Enregistrement...' : '✓ Enregistrer les modifications'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 3 : TRANSACTION (CREDIT / REMBOURSEMENT) */}
      {showModalTransaction && clientSelectionne && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            maxWidth: 640,
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: isMobile ? 16 : 22,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: isMobile ? 15.5 : 18, fontWeight: 900, color: '#0f172a' }}>
                  {typeTransaction === 'vente_credit' ? '⚡ Nouvelle Vente à Crédit' : '💸 Encaisser un Remboursement'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  Client : <strong>{clientSelectionne.nom}</strong> ({clientSelectionne.telephone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModalTransaction(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#0f172a',
                  borderRadius: '50%',
                  width: 34,
                  height: 34,
                  fontSize: 18,
                  fontWeight: 900,
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Fermer la fenêtre"
              >
                ✕
              </button>
            </div>

            {typeTransaction === 'vente_credit' && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, background: '#f1f5f9', padding: 4, borderRadius: 12 }}>
                <button
                  type="button"
                  onClick={() => setModeSaisie('catalogue')}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: modeSaisie === 'catalogue' ? '#ffffff' : 'transparent',
                    fontWeight: modeSaisie === 'catalogue' ? 800 : 600,
                    color: modeSaisie === 'catalogue' ? '#0f172a' : '#64748b',
                    fontSize: 12.5,
                    cursor: 'pointer',
                    boxShadow: modeSaisie === 'catalogue' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  🛍️ Catalogue
                </button>
                <button
                  type="button"
                  onClick={() => setModeSaisie('manuel')}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: modeSaisie === 'manuel' ? '#ffffff' : 'transparent',
                    fontWeight: modeSaisie === 'manuel' ? 800 : 600,
                    color: modeSaisie === 'manuel' ? '#0f172a' : '#64748b',
                    fontSize: 12.5,
                    cursor: 'pointer',
                    boxShadow: modeSaisie === 'manuel' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  ✍️ Saisie Libre
                </button>
              </div>
            )}

            {/* Mode Catalogue */}
            {typeTransaction === 'vente_credit' && modeSaisie === 'catalogue' && (() => {
              const categoriesModal = Array.from(new Set(produits.map((p: any) => p.categorie).filter(Boolean))) as string[]
              const qModal = rechercheProduitModal.trim().toLowerCase()
              const produitsFiltresModal = produits.filter((p: any) => {
                const matchCat = categorieProduitModal === 'tous' || p.categorie === categorieProduitModal
                const matchText = !qModal ||
                  p.nom?.toLowerCase().includes(qModal) ||
                  p.categorie?.toLowerCase().includes(qModal) ||
                  p.barcode?.toLowerCase().includes(qModal) ||
                  p.sku?.toLowerCase().includes(qModal)
                return matchCat && matchText
              })

              return (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', margin: 0 }}>
                      Cliquez sur les articles commandés par le client :
                    </label>
                    {Object.keys(panierProduits).some(k => panierProduits[k] > 0) && (
                      <button
                        type="button"
                        onClick={() => setPanierProduits({})}
                        style={{ fontSize: 11, color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontWeight: 700 }}
                      >
                        🗑️ Vider le panier
                      </button>
                    )}
                  </div>

                  {/* Champ de recherche rapide + Filtres catégories */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={rechercheProduitModal}
                        onChange={e => setRechercheProduitModal(e.target.value)}
                        placeholder="🔍 Rechercher un produit (nom, réference, catégorie)..."
                        style={{
                          width: '100%',
                          padding: '8px 30px 8px 12px',
                          borderRadius: 8,
                          border: '1px solid #cbd5e1',
                          fontSize: 13,
                          fontWeight: 600,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      {rechercheProduitModal && (
                        <button
                          type="button"
                          onClick={() => setRechercheProduitModal('')}
                          style={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            fontSize: 14
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {categoriesModal.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                        <button
                          type="button"
                          onClick={() => setCategorieProduitModal('tous')}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            background: categorieProduitModal === 'tous' ? '#0284c7' : '#f1f5f9',
                            color: categorieProduitModal === 'tous' ? '#ffffff' : '#475569'
                          }}
                        >
                          Tous ({produits.length})
                        </button>
                        {categoriesModal.map(cat => {
                          const count = produits.filter((p: any) => p.categorie === cat).length
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setCategorieProduitModal(cat)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                background: categorieProduitModal === cat ? '#0284c7' : '#f1f5f9',
                                color: categorieProduitModal === cat ? '#ffffff' : '#475569'
                              }}
                            >
                              {cat} ({count})
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: 8,
                    maxHeight: 240,
                    overflowY: 'auto',
                    padding: 2
                  }}>
                    {produitsFiltresModal.length === 0 ? (
                      <div style={{ gridColumn: '1 / -1', fontSize: 12.5, color: '#94a3b8', textAlign: 'center', padding: 20 }}>
                        {produits.length === 0
                          ? 'Aucun produit dans le catalogue. Utilisez la saisie libre.'
                          : 'Aucun produit ne correspond à la recherche.'}
                      </div>
                    ) : (
                      produitsFiltresModal.map((p: any) => {
                        const qte = panierProduits[p.id] || 0
                        const prixAff = Number(p.prix_promo || p.prix || 0)

                        return (
                          <div
                            key={p.id}
                            style={{
                              background: qte > 0 ? '#f0f9ff' : '#f8fafc',
                              border: qte > 0 ? '2px solid #0284c7' : '1px solid #e2e8f0',
                              borderRadius: 10,
                              padding: '8px 6px',
                              textAlign: 'center',
                              position: 'relative',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div
                              onClick={() => setPanierProduits(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))}
                              style={{ cursor: 'pointer' }}
                            >
                              <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.nom}>
                                {p.nom}
                              </div>
                              <div style={{ fontSize: 11.5, color: '#0284c7', fontWeight: 900, marginTop: 2 }}>
                                {fcfa(prixAff)}
                              </div>
                            </div>

                            {qte > 0 ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 6, paddingTop: 4, borderTop: '1px dashed #bae6fd' }}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPanierProduits(prev => {
                                      const copy = { ...prev }
                                      if (copy[p.id] > 1) {
                                        copy[p.id] -= 1
                                      } else {
                                        delete copy[p.id]
                                      }
                                      return copy
                                    })
                                  }}
                                  style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: '#fee2e2', color: '#ef4444', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title="Diminuer la quantité (-1) ou supprimer"
                                >
                                  -
                                </button>

                                <span style={{ fontSize: 12, fontWeight: 900, color: '#0369a1', minWidth: 16, textAlign: 'center' }}>
                                  {qte}
                                </span>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPanierProduits(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))
                                  }}
                                  style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: '#e0f2fe', color: '#0284c7', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title="Augmenter la quantité (+1)"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPanierProduits(prev => ({ ...prev, [p.id]: 1 }))}
                                style={{ marginTop: 4, padding: '3px 6px', fontSize: 10.5, fontWeight: 700, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, color: '#475569', cursor: 'pointer' }}
                              >
                                ➕ Ajouter
                              </button>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Résumé clair du panier sélectionné avec suppression unitaire ou globale */}
                  {Object.keys(panierProduits).some(k => panierProduits[k] > 0) && (
                    <div style={{ marginTop: 12, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#0369a1' }}>
                          🛒 Articles ajoutés à la vente ({Object.values(panierProduits).reduce((a, b) => a + b, 0)}) :
                        </span>
                        <button
                          type="button"
                          onClick={() => setPanierProduits({})}
                          style={{ fontSize: 11, color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 800 }}
                        >
                          🗑️ Vider tout le panier
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 110, overflowY: 'auto' }}>
                        {Object.entries(panierProduits).filter(([_, qte]) => qte > 0).map(([pId, qte]) => {
                          const prodObj = produits.find((p: any) => p.id === pId)
                          if (!prodObj) return null
                          const unitPrice = Number(prodObj.prix_promo || prodObj.prix || 0)
                          const subtotal = unitPrice * qte

                          return (
                            <div key={pId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '4px 8px', borderRadius: 6, border: '1px solid #e0f2fe', fontSize: 12 }}>
                              <span style={{ fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                                {prodObj.nom}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: '#0284c7', fontWeight: 800 }}>
                                  {qte} × {fcfa(unitPrice)} = {fcfa(subtotal)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPanierProduits(prev => {
                                    const copy = { ...prev }
                                    delete copy[pId]
                                    return copy
                                  })}
                                  style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: 4, width: 18, height: 18, cursor: 'pointer', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title="Supprimer cet article du panier"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Mode Manuel / Remboursement */}
            {(modeSaisie === 'manuel' || typeTransaction === 'remboursement') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Montant de l&apos;opération (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 5000"
                    value={montantManuel}
                    onChange={e => setMontantManuel(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, fontWeight: 800, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Description / Note libre
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 2 sacs de riz 25kg + 1L huile"
                    value={descriptionManuelle}
                    onChange={e => setDescriptionManuelle(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

            {/* Échéance & Relance WA */}
            {typeTransaction === 'vente_credit' && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, marginBottom: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                      📅 Date d&apos;échéance
                    </label>
                    <input
                      type="date"
                      value={dateEcheance}
                      onChange={e => setDateEcheance(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                      Règlement / Mode
                    </label>
                    <select
                      value={modePaiement}
                      onChange={e => setModePaiement(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                    >
                      <option value="especes">💵 Crédit simple</option>
                      <option value="wave">🌊 Wave</option>
                      <option value="orange_money">🍊 Orange Money</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="relanceWaCheck"
                    checked={relanceAutoWa}
                    onChange={e => setRelanceAutoWa(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="relanceWaCheck" style={{ fontSize: 11.5, color: '#0f172a', fontWeight: 700, cursor: 'pointer' }}>
                    🔔 Relance automatique WhatsApp à l&apos;échéance
                  </label>
                </div>
              </div>
            )}

            {/* Total et Bouton de Validation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>TOTAL TRANSACTION</span>
                <div style={{ fontSize: 19, fontWeight: 900, color: typeTransaction === 'vente_credit' ? '#dc2626' : '#16a34a' }}>
                  {fcfa(totalTransactionCourante)}
                </div>
              </div>

              <button
                disabled={submittingTrans}
                onClick={handleValiderTransaction}
                style={{
                  background: typeTransaction === 'vente_credit' ? '#dc2626' : '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 18px',
                  fontWeight: 900,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  opacity: submittingTrans ? 0.6 : 1,
                  minHeight: 44
                }}
              >
                {submittingTrans ? 'Enregistrement...' : typeTransaction === 'vente_credit' ? '✓ Valider Dette' : '✓ Encaisser'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
