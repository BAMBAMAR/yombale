'use client'

import { useState, useEffect } from 'react'
import { fcfa, fmtDate, fmtDateHeure } from '@/lib/format'

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
    slug: string
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
  const [filtreStatus, setFiltreStatus] = useState<'tous' | 'retard' | 'aujourdhui' | 'credits'>('tous')
  
  // Client sélectionné & Historique
  const [clientSelectionne, setClientSelectionne] = useState<ClientCredit | null>(null)
  const [historique, setHistorique] = useState<TransactionCredit[]>([])
  const [loadingHist, setLoadingHist] = useState(false)

  // Modales
  const [showModalNouveauClient, setShowModalNouveauClient] = useState(false)
  const [showModalTransaction, setShowModalTransaction] = useState(false)
  const [typeTransaction, setTypeTransaction] = useState<'vente_credit' | 'remboursement'>('vente_credit')

  // Formulaire Nouveau Client
  const [nomClient, setNomClient] = useState('')
  const [telClient, setTelClient] = useState('')
  const [adresseClient, setAdresseClient] = useState('')
  const [plafondClient, setPlafondClient] = useState('200000')
  const [noteClient, setNoteClient] = useState('')

  // Formulaire Transaction & Sélecteur Catalogue
  const [modeSaisie, setModeSaisie] = useState<'catalogue' | 'manuel'>('catalogue')
  const [panierProduits, setPanierProduits] = useState<Record<string, number>>({}) // produitId -> qte
  const [montantManuel, setMontantManuel] = useState('')
  const [descriptionManuelle, setDescriptionManuelle] = useState('')
  const [modePaiement, setModePaiement] = useState('especes')
  const [dateEcheance, setDateEcheance] = useState('')
  const [relanceAutoWa, setRelanceAutoWa] = useState(true)
  const [submittingTrans, setSubmittingTrans] = useState(false)

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

  const totalTransactionCourante = modeSaisie === 'catalogue' 
    ? totalPanierCatalogue 
    : (Number(montantManuel) || 0)

  // Gestion Ajout Client
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

    // Préparer la liste des produits
    let produitsListe: any[] = []
    if (modeSaisie === 'catalogue') {
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
      produitsListe = [{ nom: descriptionManuelle.trim() || 'Vente directe', quantite: 1, prix: montantFinal }]
    }

    setSubmittingTrans(true)
    try {
      const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${clientSelectionne.id}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: typeTransaction,
          montant: montantFinal,
          mode_paiement: modePaiement,
          note: modeSaisie === 'manuel' ? descriptionManuelle.trim() : `Achat catalogue (${produitsListe.length} article(s))`,
          produits: produitsListe,
          date_echeance: dateEcheance || null,
          relance_auto_whatsapp: relanceAutoWa,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // Réinitialiser la modale
        setShowModalTransaction(false)
        setPanierProduits({})
        setMontantManuel('')
        setDescriptionManuelle('')
        setDateEcheance('')
        
        // Mettre à jour le solde local et recharger l'historique
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
    // Filtre texte
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* En-tête & Banner Synthétique */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 20,
        padding: '24px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26 }}>📒</span>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#ffffff', tracking: '-0.02em' }}>
                Carnet de Dettes & Crédits
              </h1>
              <span style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#38bdf8',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 800
              }}>
                Disponible tous forfaits
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94a3b8' }}>
              Gestion simplifiée des crédits clients et achats fournisseurs. Relances WhatsApp automatiques à échéance.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowModalNouveauClient(true)}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 18px',
                fontWeight: 800,
                fontSize: 13.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              👤 + Nouveau Client
            </button>

            <button
              onClick={() => {
                if (!clientSelectionne && clients.length > 0) {
                  setClientSelectionne(clients[0])
                }
                setTypeTransaction('vente_credit')
                setShowModalTransaction(true)
              }}
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 18px',
                fontWeight: 800,
                fontSize: 13.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}
            >
              ⚡ + Donner Crédit (Vente)
            </button>
          </div>
        </div>

        {/* Cartes KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          
          {/* Card 1: On me doit */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 14,
            padding: '16px',
            backdropFilter: 'blur(10px)'
          }}>
            <span style={{ fontSize: 12, color: '#fca5a5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🔴 ON ME DOIT (Créances Clients)
            </span>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#f87171', marginTop: 4 }}>
              {fcfa(totalDettesAEncaisser)}
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>
              {nbClientsDebiteurs} client(s) débiteur(s)
            </div>
          </div>

          {/* Card 2: Avances Clients */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 14,
            padding: '16px',
            backdropFilter: 'blur(10px)'
          }}>
            <span style={{ fontSize: 12, color: '#6ee7b7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🟢 AVANCES CLIENTS (Dépôts)
            </span>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#34d399', marginTop: 4 }}>
              {fcfa(totalAvancesClients)}
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>
              Fonds d&apos;avances enregistrés
            </div>
          </div>

          {/* Card 3: Relance Auto WhatsApp */}
          <div style={{
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 14,
            padding: '16px',
            backdropFilter: 'blur(10px)'
          }}>
            <span style={{ fontSize: 12, color: '#7dd3fc', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🔔 RELANCE AUTO WHATSAPP
            </span>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#38bdf8', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✓ Activé (Échéance J)</span>
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>
              Rappels automatiques à la date due
            </div>
          </div>

        </div>
      </div>

      {/* Barre de Recherche & Filtres */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Rechercher un client par nom, téléphone ou adresse..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              background: '#ffffff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { id: 'tous', label: `Tous (${clients.length})` },
            { id: 'retard', label: `🔴 Débiteurs (${nbClientsDebiteurs})` },
            { id: 'credits', label: `🟢 En Avance` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltreStatus(f.id as any)}
              style={{
                padding: '8px 14px',
                borderRadius: 20,
                border: filtreStatus === f.id ? '2px solid #0f172a' : '1px solid #cbd5e1',
                background: filtreStatus === f.id ? '#0f172a' : '#ffffff',
                color: filtreStatus === f.id ? '#ffffff' : '#475569',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Disposition Principale : Grille des Clients & Panneau Fiche Client */}
      <div style={{ display: 'grid', gridTemplateColumns: clientSelectionne ? '1fr 1fr' : '1fr', gap: 20 }}>
        
        {/* Liste des Fiches Clients */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Chargement du carnet...</div>
          ) : clientsFiltres.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: '#f8fafc',
              borderRadius: 16,
              border: '2px dashed #cbd5e1',
              color: '#64748b'
            }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>📒</span>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Aucun client trouvé dans le carnet</p>
              <p style={{ margin: '4px 0 16px', fontSize: 13, color: '#94a3b8' }}>
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
                  onClick={() => ouvrirFicheClient(c)}
                  style={{
                    background: estActif ? '#f0f9ff' : '#ffffff',
                    border: estActif ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    borderRadius: 16,
                    padding: '16px 20px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: estActif ? '0 4px 14px rgba(2, 132, 199, 0.12)' : '0 2px 4px rgba(0,0,0,0.02)',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    gap: 16
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{c.nom}</span>
                      {c.adresse && (
                        <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                          📍 {c.adresse}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>
                      📞 {c.telephone} {c.plafond_max > 0 ? `• Plafond: ${fcfa(c.plafond_max)}` : ''}
                    </div>
                    {c.note_client && (
                      <div style={{ fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic', marginTop: 2 }}>
                        Note: {c.note_client}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: 16,
                      fontWeight: 900,
                      color: estDebiteur ? '#dc2626' : estAvance ? '#16a34a' : '#64748b'
                    }}>
                      {estDebiteur ? `+ ${fcfa(soldeNum)}` : estAvance ? `- ${fcfa(Math.abs(soldeNum))}` : '0 FCFA'}
                    </div>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 10,
                      display: 'inline-block',
                      marginTop: 4,
                      background: estDebiteur ? '#fef2f2' : estAvance ? '#f0fdf4' : '#f8fafc',
                      color: estDebiteur ? '#991b1b' : estAvance ? '#166534' : '#64748b'
                    }}>
                      {estDebiteur ? '🔴 Doit la boutique' : estAvance ? '🟢 Avance client' : '⚪ Solde nul'}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Fiche Détaillée & Historique du Client Sélectionné */}
        {clientSelectionne && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 20,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 8px 20px -4px rgba(0,0,0,0.06)'
          }}>
            {/* Header Fiche Client */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{clientSelectionne.nom}</h2>
                  <button
                    onClick={() => setClientSelectionne(null)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}
                  >
                    ✕
                  </button>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                  📞 {clientSelectionne.telephone} {clientSelectionne.adresse ? `• 📍 ${clientSelectionne.adresse}` : ''}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Solde Actuel</span>
                <div style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: Number(clientSelectionne.solde) > 0 ? '#dc2626' : Number(clientSelectionne.solde) < 0 ? '#16a34a' : '#0f172a'
                }}>
                  {fcfa(clientSelectionne.solde)}
                </div>
              </div>
            </div>

            {/* Actions Rapides pour ce client */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setTypeTransaction('vente_credit')
                  setShowModalTransaction(true)
                }}
                style={{
                  flex: 1,
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: 'pointer'
                }}
              >
                + Crédit (Dette)
              </button>

              <button
                onClick={() => {
                  setTypeTransaction('remboursement')
                  setShowModalTransaction(true)
                }}
                style={{
                  flex: 1,
                  background: '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: 'pointer'
                }}
              >
                💸 Rembourser / Encaisser
              </button>

              {Number(clientSelectionne.solde) > 0 && (
                <button
                  onClick={() => handleRelancerWhatsApp(clientSelectionne)}
                  style={{
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
                    gap: 6
                  }}
                >
                  📱 Relance WhatsApp
                </button>
              )}
            </div>

            {/* Historique des opérations du client */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                📜 Historique des Opérations
              </h3>

              {loadingHist ? (
                <div style={{ fontSize: 13, color: '#64748b' }}>Chargement de l&apos;historique...</div>
              ) : historique.length === 0 ? (
                <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', padding: '12px 0' }}>
                  Aucune transaction enregistrée pour ce client.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 350, overflowY: 'auto' }}>
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
                          borderRadius: 12,
                          padding: '12px 14px',
                          display: 'flex',
                          justify: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: 6,
                              background: estVente ? '#fef2f2' : '#f0fdf4',
                              color: estVente ? '#991b1b' : '#166534'
                            }}>
                              {estVente ? '🔴 Achat à crédit' : '🟢 Remboursement'}
                            </span>
                            <span style={{ fontSize: 12, color: '#64748b' }}>
                              {fmtDateHeure(h.created_at)}
                            </span>
                          </div>

                          {h.note && (
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>
                              {h.note}
                            </div>
                          )}

                          {/* Affichage des produits s'il s'agit d'un achat catalogue */}
                          {Array.isArray(h.produits) && h.produits.length > 0 && (
                            <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {h.produits.map((item: any, idx: number) => (
                                <span key={idx} style={{ fontSize: 11, background: '#e2e8f0', color: '#334155', padding: '2px 6px', borderRadius: 4 }}>
                                  {item.nom} (x{item.quantite})
                                </span>
                              ))}
                            </div>
                          )}

                          {h.date_echeance && (
                            <div style={{ fontSize: 11.5, marginTop: 4, color: estEnRetard ? '#dc2626' : '#0284c7', fontWeight: 700 }}>
                              📅 Échéance : {fmtDate(h.date_echeance)} {estEnRetard ? ' (🔴 En retard)' : ''}
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: 15,
                            fontWeight: 900,
                            color: estVente ? '#dc2626' : '#16a34a'
                          }}>
                            {estVente ? `+ ${fcfa(h.montant)}` : `- ${fcfa(h.montant)}`}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>
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
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            maxWidth: 480,
            width: '100%',
            padding: 24,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
                👤 Créer une nouvelle fiche client
              </h3>
              <button onClick={() => setShowModalNouveauClient(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <form onSubmit={handleCreerClient} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Nom complet du client *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fatou Sow, Modou Ndiaye"
                  value={nomClient}
                  onChange={e => setNomClient(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Numéro Téléphone (WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: 771234567"
                  value={telClient}
                  onChange={e => setTelClient(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Adresse / Quartier</label>
                  <input
                    type="text"
                    placeholder="Ex: Medina, Rue 10"
                    value={adresseClient}
                    onChange={e => setAdresseClient(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Plafond Crédit (FCFA)</label>
                  <input
                    type="number"
                    placeholder="200000"
                    value={plafondClient}
                    onChange={e => setPlafondClient(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Note / Remarque confidentielle</label>
                <input
                  type="text"
                  placeholder="Ex: Voisine d'en face, confiance 100%"
                  value={noteClient}
                  onChange={e => setNoteClient(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: 10,
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px',
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                ✓ Enregistrer le Client
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 2 : TRANSACTION (CREDIT / REMBOURSEMENT) AVEC SELECTEUR CATALOGUE */}
      {showModalTransaction && clientSelectionne && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            maxWidth: 640,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 24,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
                  {typeTransaction === 'vente_credit' ? '⚡ Nouvelle Vente à Crédit' : '💸 Encaisser un Remboursement'}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748b' }}>
                  Client : <strong>{clientSelectionne.nom}</strong> ({clientSelectionne.telephone})
                </p>
              </div>
              <button onClick={() => setShowModalTransaction(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            {typeTransaction === 'vente_credit' && (
              /* Choix du mode de saisie : Catalogue ou Manuel */
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, background: '#f1f5f9', padding: 4, borderRadius: 12 }}>
                <button
                  type="button"
                  onClick={() => setModeSaisie('catalogue')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: modeSaisie === 'catalogue' ? '#ffffff' : 'transparent',
                    fontWeight: modeSaisie === 'catalogue' ? 800 : 600,
                    color: modeSaisie === 'catalogue' ? '#0f172a' : '#64748b',
                    fontSize: 13,
                    cursor: 'pointer',
                    boxShadow: modeSaisie === 'catalogue' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  🛍️ Produits du Catalogue
                </button>
                <button
                  type="button"
                  onClick={() => setModeSaisie('manuel')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: modeSaisie === 'manuel' ? '#ffffff' : 'transparent',
                    fontWeight: modeSaisie === 'manuel' ? 800 : 600,
                    color: modeSaisie === 'manuel' ? '#0f172a' : '#64748b',
                    fontSize: 13,
                    cursor: 'pointer',
                    boxShadow: modeSaisie === 'manuel' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  ✍️ Saisie Libre (Hors catalogue)
                </button>
              </div>
            )}

            {/* Mode Catalogue : Grille des produits */}
            {typeTransaction === 'vente_credit' && modeSaisie === 'catalogue' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                  Cliquez sur les articles commandés par le client :
                </label>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, maxHeight: 220, overflowY: 'auto', padding: 4 }}>
                  {produits.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: 20 }}>
                      Aucun produit dans le catalogue. Utilisez la saisie libre.
                    </div>
                  ) : (
                    produits.map(p => {
                      const qte = panierProduits[p.id] || 0
                      const prixAff = Number(p.prix_promo || p.prix || 0)

                      return (
                        <div
                          key={p.id}
                          onClick={() => setPanierProduits(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))}
                          style={{
                            background: qte > 0 ? '#f0f9ff' : '#f8fafc',
                            border: qte > 0 ? '2px solid #0284c7' : '1px solid #e2e8f0',
                            borderRadius: 12,
                            padding: 10,
                            cursor: 'pointer',
                            textAlign: 'center',
                            position: 'relative'
                          }}
                        >
                          {qte > 0 && (
                            <span style={{
                              position: 'absolute',
                              top: -6,
                              right: -6,
                              background: '#0284c7',
                              color: '#fff',
                              borderRadius: 10,
                              width: 22,
                              height: 22,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 900
                            }}>
                              {qte}
                            </span>
                          )}
                          <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.nom}
                          </div>
                          <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 900, marginTop: 4 }}>
                            {fcfa(prixAff)}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* Mode Manuel / Remboursement */}
            {(modeSaisie === 'manuel' || typeTransaction === 'remboursement') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Montant de l&apos;opération (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 5000"
                    value={montantManuel}
                    onChange={e => setMontantManuel(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, fontWeight: 800, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Description / Note libre
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 2 sacs de riz 25kg + 1L huile"
                    value={descriptionManuelle}
                    onChange={e => setDescriptionManuelle(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

            {/* Sélecteur de Date d'échéance & Option Relance Auto WhatsApp (uniquement pour Vente à crédit) */}
            {typeTransaction === 'vente_credit' && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                      📅 Date d&apos;échéance de paiement
                    </label>
                    <input
                      type="date"
                      value={dateEcheance}
                      onChange={e => setDateEcheance(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                      Règlement / Mode
                    </label>
                    <select
                      value={modePaiement}
                      onChange={e => setModePaiement(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                    >
                      <option value="especes">💵 Crédit simple</option>
                      <option value="wave">🌊 Wave</option>
                      <option value="orange_money">🍊 Orange Money</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="relanceWaCheck"
                    checked={relanceAutoWa}
                    onChange={e => setRelanceAutoWa(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="relanceWaCheck" style={{ fontSize: 12.5, color: '#0f172a', fontWeight: 700, cursor: 'pointer' }}>
                    🔔 Activer la relance automatique WhatsApp si l&apos;échéance est atteinte
                  </label>
                </div>
              </div>
            )}

            {/* Total et Bouton de Validation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>TOTAL TRANSACTION</span>
                <div style={{ fontSize: 22, fontWeight: 900, color: typeTransaction === 'vente_credit' ? '#dc2626' : '#16a34a' }}>
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
                  borderRadius: 12,
                  padding: '12px 24px',
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: 'pointer',
                  opacity: submittingTrans ? 0.6 : 1
                }}
              >
                {submittingTrans ? 'Enregistrement...' : typeTransaction === 'vente_credit' ? '✓ Valider la Dette' : '✓ Encaisser'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
