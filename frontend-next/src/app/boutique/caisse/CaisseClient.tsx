'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import { exportToCSV, printPDFReport } from '@/lib/export'
import BatchImportModal from '@/app/boutique/BatchImportModal'
import { getBoutiqueProduits, getBoutiquesMine, getPosHistorique, creerPosVente, declarerIncident } from '../actions'
import { Settings, Download, History, Book, Unlock, Lock, ShieldAlert, User, Shield, Search, ArrowLeft, Store } from 'lucide-react'

interface ProduitCaisse {
  id: string
  nom: string
  prix: number
  code_barre?: string
  photo?: string
  categorie?: string
  stock: number
}

interface LignePanier {
  produit: ProduitCaisse
  quantite: number
  prixUnitaire: number
}

interface SessionCaisse {
  id: string
  dateOuverture: string
  fondDeCaisse: number
  caissierNom: string
  statut: 'ouverte' | 'fermee'
  ventes: {
    total: number
    especes: number
    wave: number
    orangeMoney: number
    carte: number
    mixte: number
    nbVentes: number
  }
}

interface VenteHistorique {
  id: string
  date: string
  heure: string
  caissier: string
  modePaiement: string
  total: number
  statut: 'validee' | 'annulee'
  motifAnnulation?: string
  detailPaiementMixte?: { especes: number; autreMode: string; autreMontant: number }
  ticket: LignePanier[]
}

interface TicketEnAttente {
  id: string
  clientLabel: string
  heure: string
  panier: LignePanier[]
}

export default function CaisseClient() {
  // ── Charte Graphique Nopalou Thème Lumineux ─────────────────────────────────

  // ── État Boutiques du Marchand & Synchronisation Catalogue ───────────────────
  const [boutiques, setBoutiques] = useState<{ id: string; nom: string }[]>([])
  const [boutiqueActiveId, setBoutiqueActiveId] = useState<string>('')
  const [loadingProduits, setLoadingProduits] = useState<boolean>(true)
  const [modalImportBatch, setModalImportBatch] = useState<boolean>(false)

  // ── État Rôles & Authentification PIN Sécurisée ──────────────────────────────
  const [verrouille, setVerrouille] = useState<boolean>(true)
  const [codePinSaisi, setCodePinSaisi] = useState<string>('')
  const [pinError, setPinError] = useState<string | null>(null)
  
  // Rôle Actif de la Session ('caissier' ou 'superviseur')
  const [roleActif, setRoleActif] = useState<'caissier' | 'superviseur'>('caissier')

  // Codes PIN secrets (Stockés de façon masquée et sécurisée)
  const [pinCaissier, setPinCaissier] = useState<string>('1234')
  const [pinSuperviseur, setPinSuperviseur] = useState<string>('9999')
  const [modalConfigPin, setModalConfigPin] = useState<boolean>(false)

  // Formulaire de modification des PINs (Masqué type=password)
  const [ancienPinSuperviseur, setAncienPinSuperviseur] = useState<string>('')
  const [nouveauPinCaissier, setNouveauPinCaissier] = useState<string>('')
  const [nouveauPinSuperviseur, setNouveauPinSuperviseur] = useState<string>('')
  const [msgConfigPin, setMsgConfigPin] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── État Session & Caissier ──────────────────────────────────────────────────
  const [caissierNom, setCaissierNom] = useState<string>('Caissier 1 (Bamba)')
  const [session, setSession] = useState<SessionCaisse | null>(null)
  const [modalSessionOuverture, setModalSessionOuverture] = useState<boolean>(false)
  const [modalClotureZ, setModalClotureZ] = useState<boolean>(false)
  const [modalHistorique, setModalHistorique] = useState<boolean>(false)
  const [fondDeCaisseSaisi, setFondDeCaisseSaisi] = useState<string>('50000')
  const [especesComptees, setEspecesComptees] = useState<string>('')

  // ── Multi-Tickets (File d'attente 1, 2, 3 clients simultanés) ───────────────
  const [ticketsEnAttente, setTicketsEnAttente] = useState<TicketEnAttente[]>([])

  // ── Validation Superviseur Modal ───────────────────────────────────────────
  const [modalSuperviseur, setModalSuperviseur] = useState<boolean>(false)
  const [pinSuperviseurSaisi, setPinSuperviseurSaisi] = useState<string>('')
  const [superviseurAction, setSuperviseurAction] = useState<(() => void) | null>(null)
  const [superviseurTitre, setSuperviseurTitre] = useState<string>('')
  const [superviseurError, setSuperviseurError] = useState<string | null>(null)

  // ── État Catalogue & Panier & Paiement Mixte ─────────────────────────────────
  const [recherche, setRecherche] = useState<string>('')
  const [categorieFiltre, setCategorieFiltre] = useState<string>('tous')
  const [panier, setPanier] = useState<LignePanier[]>([])
  const [remisePourcentage, setRemisePourcentage] = useState<number>(0)

  const [modePaiement, setModePaiement] = useState<'especes' | 'wave' | 'orange_money' | 'carte' | 'credit_client' | 'mixte'>('especes')
  const [montantRecu, setMontantRecu] = useState<string>('')
  
  const [montantEspecesMixte, setMontantEspecesMixte] = useState<string>('')
  const [secondModeMixte, setSecondModeMixte] = useState<'wave' | 'orange_money' | 'carte'>('wave')

  const [derniereVente, setDerniereVente] = useState<{
    id: string
    date: string
    heure: string
    total: number
    remise: number
    recu: number
    monnaie: number
    ticket: LignePanier[]
    mode: string
    caissier: string
    detailMixte?: { especes: number; autreMode: string; autreMontant: number }
  } | null>(null)

  const [clientsCredits, setClientsCredits] = useState<{ id: string; nom: string; telephone: string; solde: number; plafond_max: number }[]>([
    { id: 'cli-1', nom: 'Moustapha Ndiaye', telephone: '77 123 45 67', solde: 15000, plafond_max: 200000 },
    { id: 'cli-2', nom: 'Fatou Diop', telephone: '78 987 65 43', solde: -5000, plafond_max: 150000 },
  ])
  const [modalCarnet, setModalCarnet] = useState<boolean>(false)
  const [nouveauClientNom, setNouveauClientNom] = useState<string>('')
  const [nouveauClientTel, setNouveauClientTel] = useState<string>('')

  // ── Historique des opérations & Incidents ────────────────────────────────────
  const [historiqueVentes, setHistoriqueVentes] = useState<VenteHistorique[]>([])

  // ── Produits Réels de la Boutique ────────────────────────────────────────────
  const [produits, setProduits] = useState<ProduitCaisse[]>([])

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  // ── Initialisation des PINs depuis LocalStorage ──────────────────────────────
  useEffect(() => {
    const savedCaissier = localStorage.getItem('nopalou_pin_caissier')
    if (savedCaissier) setPinCaissier(savedCaissier)

    const savedSuperviseur = localStorage.getItem('nopalou_pin_superviseur')
    if (savedSuperviseur) setPinSuperviseur(savedSuperviseur)
  }, [])

  // ── Synchroniser la sauvegarde locale de l'historique des ventes ──────────────
  useEffect(() => {
    if (boutiqueActiveId && historiqueVentes.length > 0) {
      localStorage.setItem(`nopalou_pos_historique_${boutiqueActiveId}`, JSON.stringify(historiqueVentes))
    }
  }, [historiqueVentes, boutiqueActiveId])

  // ── Charger les boutiques du marchand et le catalogue réel de produits ───────
  useEffect(() => {
    async function chargerBoutiquesEtProduits() {
      try {
        setLoadingProduits(true)
        const mine = await getBoutiquesMine()
        const activeBoutiques = mine ? mine.filter((b: any) => b.actif === true) : []
        if (activeBoutiques.length > 0) {
          setBoutiques(activeBoutiques)
          const bId = boutiqueActiveId || activeBoutiques[0].id
          setBoutiqueActiveId(bId)
          await chargerProduitsBoutique(bId)
        } else {
          setBoutiques([])
          setLoadingProduits(false)
        }
      } catch (e) {
        console.error('Erreur chargement boutiques caisse:', e)
        setLoadingProduits(false)
      }
    }
    chargerBoutiquesEtProduits()
  }, [])

  async function chargerProduitsBoutique(bId: string) {
    if (!bId) return
    setLoadingProduits(true)

    // 1. Restaurer immédiatement depuis LocalStorage si présent
    const localHist = localStorage.getItem(`nopalou_pos_historique_${bId}`)
    if (localHist) {
      try {
        const parsed = JSON.parse(localHist)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistoriqueVentes(parsed)
        }
      } catch {}
    }

    const localProds = localStorage.getItem(`nopalou_pos_produits_${bId}`)
    if (localProds) {
      try {
        const parsedP = JSON.parse(localProds)
        if (Array.isArray(parsedP) && parsedP.length > 0) {
          setProduits(parsedP)
        }
      } catch {}
    }

    // 2. Charger depuis l'API backend via Action Serveur
    getPosHistorique(bId)
      .then(dataHist => {
        if (dataHist && dataHist.length > 0) {
          setHistoriqueVentes(dataHist)
          localStorage.setItem(`nopalou_pos_historique_${bId}`, JSON.stringify(dataHist))
        }
      })
      .catch(() => {})

    // 3. Charger le catalogue produits
    try {
      const produits = await getBoutiqueProduits(bId)
      if (produits && Array.isArray(produits)) {
        const prodsFormates: ProduitCaisse[] = produits.map((p: any) => ({
          id: p.id,
          nom: p.nom,
          prix: Number(p.prix),
          code_barre: p.code_barre || p.id.slice(0, 8),
          photo: p.images?.[0] || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
          categorie: p.categorie || 'alimentation',
          stock: Number(p.stock_quantite ?? p.quantite_stock ?? 10),
        }))
        setProduits(prodsFormates)
        localStorage.setItem(`nopalou_pos_produits_${bId}`, JSON.stringify(prodsFormates))
      } else if (!localProds) {
        setProduits([])
      }
    } catch (e) {
      console.error('Erreur chargement produits caisse:', e)
      if (!localProds) setProduits([])
    } finally {
      setLoadingProduits(false)
    }
  }

  function changerBoutiqueActive(newBId: string) {
    setBoutiqueActiveId(newBId)
    chargerProduitsBoutique(newBId)
    viderPanier()
  }

  // ── Listener Douchette Code-barres USB/Bluetooth ────────────────────────────
  const bufferScan = useRef<string>('')
  const dernierTempsScan = useRef<number>(Date.now())

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (verrouille || modalSuperviseur || modalConfigPin) return
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return
      }

      const maintenant = Date.now()
      if (maintenant - dernierTempsScan.current > 100) {
        bufferScan.current = ''
      }
      dernierTempsScan.current = maintenant

      if (e.key === 'Enter') {
        if (bufferScan.current.length > 3) {
          const codeScanne = bufferScan.current
          bufferScan.current = ''
          ajouterParCodeBarre(codeScanne)
        }
      } else if (e.key.length === 1) {
        bufferScan.current += e.key
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [produits, verrouille, modalSuperviseur, modalConfigPin])

  function ajouterParCodeBarre(code: string) {
    const p = produits.find(item => item.code_barre === code || item.id === code)
    if (p) {
      ajouterAuPanier(p)
    }
  }

  // ── Ouvrir la modale de modification des PINs (Réservé au Gérant) ─────────────
  function ouvrirConfigPin() {
    demanderValidationSuperviseur('Accès aux Paramètres de Modification des Codes PIN', () => {
      setModalConfigPin(true)
      setMsgConfigPin(null)
    })
  }

  function enregistrerNouveauxPins() {
    setMsgConfigPin(null)
    if (ancienPinSuperviseur !== pinSuperviseur) {
      setMsgConfigPin({ type: 'error', text: '⚠️ Code PIN Superviseur actuel incorrect.' })
      return
    }

    let aChange = false
    if (nouveauPinCaissier.trim().length === 4) {
      setPinCaissier(nouveauPinCaissier.trim())
      localStorage.setItem('nopalou_pin_caissier', nouveauPinCaissier.trim())
      aChange = true
    }

    if (nouveauPinSuperviseur.trim().length === 4) {
      setPinSuperviseur(nouveauPinSuperviseur.trim())
      localStorage.setItem('nopalou_pin_superviseur', nouveauPinSuperviseur.trim())
      aChange = true
    }

    if (aChange) {
      setMsgConfigPin({ type: 'success', text: '✅ Vos nouveaux codes PIN secrets ont été mis à jour avec succès !' })
      setAncienPinSuperviseur('')
      setNouveauPinCaissier('')
      setNouveauPinSuperviseur('')
      setTimeout(() => setModalConfigPin(false), 1500)
    } else {
      setMsgConfigPin({ type: 'error', text: 'Veuillez saisir un code PIN valide à 4 chiffres.' })
    }
  }

  // ── Validation par Superviseur / Gérant ────────────────────────────────────
  function demanderValidationSuperviseur(titreAction: string, actionValidee: () => void) {
    setSuperviseurTitre(titreAction)
    setSuperviseurAction(() => actionValidee)
    setPinSuperviseurSaisi('')
    setSuperviseurError(null)
    setModalSuperviseur(true)
  }

  function validerSuperviseurPin() {
    if (pinSuperviseurSaisi === pinSuperviseur) {
      setModalSuperviseur(false)
      if (superviseurAction) superviseurAction()
    } else {
      setSuperviseurError('Code PIN Superviseur incorrect.')
    }
  }

  // ── Authentification et Déverrouillage par Rôle ─────────────────────────────
  function deverrouillerPin() {
    if (codePinSaisi === pinSuperviseur || codePinSaisi === pinCaissier) {
      setRoleActif(codePinSaisi === pinSuperviseur ? 'superviseur' : 'caissier')
      setVerrouille(false)
      setCodePinSaisi('')
      setPinError(null)
      if (!session) {
        setModalSessionOuverture(true)
      }
    } else {
      setPinError('Code PIN incorrect. Veuillez vérifier votre saisie.')
    }
  }

  // ── Actions Multi-Tickets / File d'attente Client ───────────────────────────
  function mettrePanierEnAttente() {
    if (panier.length === 0) return
    const nouveauTicket: TicketEnAttente = {
      id: `T-${Date.now().toString().slice(-4)}`,
      clientLabel: `Client ${ticketsEnAttente.length + 1}`,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      panier: [...panier],
    }
    setTicketsEnAttente(prev => [...prev, nouveauTicket])
    viderPanier()
  }

  function reprendreTicketEnAttente(ticketId: string) {
    const t = ticketsEnAttente.find(x => x.id === ticketId)
    if (t) {
      if (panier.length > 0) {
        setTicketsEnAttente(prev => [
          ...prev.filter(x => x.id !== ticketId),
          {
            id: `T-${Date.now().toString().slice(-4)}`,
            clientLabel: `Client ${ticketsEnAttente.length + 1}`,
            heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            panier: [...panier],
          }
        ])
      } else {
        setTicketsEnAttente(prev => prev.filter(x => x.id !== ticketId))
      }
      setPanier(t.panier)
    }
  }

  // ── Actions Caisse & Vente POS (CONTRÔLE STRICT DU STOCK DISPONIBLE !) ───────
  function ouvrirSession() {
    const fond = Number(fondDeCaisseSaisi) || 0
    setSession({
      id: `SES-${Date.now().toString().slice(-6)}`,
      dateOuverture: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      fondDeCaisse: fond,
      caissierNom,
      statut: 'ouverte',
      ventes: { total: 0, especes: 0, wave: 0, orangeMoney: 0, carte: 0, mixte: 0, nbVentes: 0 },
    })
    setModalSessionOuverture(false)
  }

  // AJOUT AU PANIER AVEC CONTRÔLE ET AUTORISATION SUPERVISEUR EN CAS DE DÉPASSEMENT
  function ajouterAuPanier(p: ProduitCaisse) {
    const itemExist = panier.find(item => item.produit.id === p.id)
    const qteActuelle = itemExist ? itemExist.quantite : 0

    // Vérifier si la quantité dans le panier atteint ou dépasse le stock physique
    if (qteActuelle >= p.stock) {
      demanderValidationSuperviseur(`Autoriser Vente Hors-Stock (${p.nom} : Stock disponible ${p.stock})`, () => {
        setPanier(prev => {
          const index = prev.findIndex(item => item.produit.id === p.id)
          if (index >= 0) {
            const copi = [...prev]
            copi[index].quantite += 1
            return copi
          }
          return [...prev, { produit: p, quantite: 1, prixUnitaire: p.prix }]
        })
      })
      return
    }

    setPanier(prev => {
      const index = prev.findIndex(item => item.produit.id === p.id)
      if (index >= 0) {
        const copi = [...prev]
        copi[index].quantite += 1
        return copi
      }
      return [...prev, { produit: p, quantite: 1, prixUnitaire: p.prix }]
    })
  }

  // MODIFICATION QUANTITÉ AVEC VÉRIFICATION DU STOCK MAXIMAL
  function modifierQuantite(id: string, delta: number) {
    const itemTarget = panier.find(i => i.produit.id === id)
    if (!itemTarget) return

    if (delta > 0 && itemTarget.quantite >= itemTarget.produit.stock) {
      demanderValidationSuperviseur(`Autoriser Augmentation Hors-Stock (${itemTarget.produit.nom} : Max Stock ${itemTarget.produit.stock})`, () => {
        setPanier(prev => prev.map(item => {
          if (item.produit.id === id) {
            return { ...item, quantite: item.quantite + delta }
          }
          return item
        }))
      })
      return
    }

    setPanier(prev => prev.map(item => {
      if (item.produit.id === id) {
        const nouvelleQte = item.quantite + delta
        return nouvelleQte > 0 ? { ...item, quantite: nouvelleQte } : null
      }
      return item
    }).filter(Boolean) as LignePanier[])
  }

  function viderPanier() {
    setPanier([])
    setMontantRecu('')
    setMontantEspecesMixte('')
    setRemisePourcentage(0)
  }

  const sousTotalPanier = panier.reduce((acc, item) => acc + (item.prixUnitaire * item.quantite), 0)
  const montantRemise = Math.round((sousTotalPanier * remisePourcentage) / 100)
  const totalPanier = Math.max(0, sousTotalPanier - montantRemise)

  const especesMixteNum = Number(montantEspecesMixte) || 0
  const resteAPayerMixte = Math.max(0, totalPanier - especesMixteNum)

  const recu = Number(montantRecu) || totalPanier
  const monnaieARendre = Math.max(0, recu - totalPanier)

  async function encaisserVente() {
    if (totalPanier === 0) return
    if (!session) {
      setModalSessionOuverture(true)
      return
    }

    const ticketId = `TICK-${Math.floor(10000 + Math.random() * 90000)}`
    const dateStr = new Date().toLocaleDateString('fr-FR')
    const heureStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

    const nouvelleVenteHist: VenteHistorique = {
      id: ticketId,
      date: dateStr,
      heure: heureStr,
      caissier: caissierNom,
      modePaiement,
      total: totalPanier,
      statut: 'validee',
      detailPaiementMixte: modePaiement === 'mixte' ? {
        especes: especesMixteNum,
        autreMode: secondModeMixte.toUpperCase(),
        autreMontant: resteAPayerMixte,
      } : undefined,
      ticket: [...panier],
    }

    setHistoriqueVentes(prev => [nouvelleVenteHist, ...prev])

    if (boutiqueActiveId) {
      try {
        await creerPosVente(boutiqueActiveId, {
          items: panier.map(i => ({ id: i.produit.id, quantite: i.quantite, nom: i.produit.nom, prix: i.prixUnitaire })),
          caissier: caissierNom,
          modePaiement,
          total: totalPanier,
        })
      } catch (e) {
        console.error('Erreur mise à jour stock backend:', e)
      }
    }

    setSession(prev => {
      if (!prev) return null
      const stats = { ...prev.ventes }
      stats.total += totalPanier
      stats.nbVentes += 1
      if (modePaiement === 'especes') stats.especes += totalPanier
      if (modePaiement === 'wave') stats.wave += totalPanier
      if (modePaiement === 'orange_money') stats.orangeMoney += totalPanier
      if (modePaiement === 'carte') stats.carte += totalPanier
      if (modePaiement === 'mixte') {
        stats.especes += especesMixteNum
        if (secondModeMixte === 'wave') stats.wave += resteAPayerMixte
        if (secondModeMixte === 'orange_money') stats.orangeMoney += resteAPayerMixte
        if (secondModeMixte === 'carte') stats.carte += resteAPayerMixte
        stats.mixte += totalPanier
      }
      return { ...prev, ventes: stats }
    })

    // Décrémenter le stock localement après encaissement, persister dans LocalStorage et recharger depuis le backend
    setProduits(prev => {
      const updated = prev.map(p => {
        const itemPanier = panier.find(i => i.produit.id === p.id)
        if (itemPanier) {
          return { ...p, stock: Math.max(0, p.stock - itemPanier.quantite) }
        }
        return p
      })
      if (boutiqueActiveId) {
        localStorage.setItem(`nopalou_pos_produits_${boutiqueActiveId}`, JSON.stringify(updated))
      }
      return updated
    })

    if (boutiqueActiveId) {
      setTimeout(() => {
        chargerProduitsBoutique(boutiqueActiveId)
      }, 500)
    }

    const venteImprimee = {
      id: ticketId,
      date: dateStr,
      heure: heureStr,
      total: totalPanier,
      remise: montantRemise,
      recu,
      monnaie: monnaieARendre,
      ticket: [...panier],
      mode: modePaiement.toUpperCase(),
      caissier: caissierNom,
      detailMixte: modePaiement === 'mixte' ? {
        especes: especesMixteNum,
        autreMode: secondModeMixte.toUpperCase(),
        autreMontant: resteAPayerMixte,
      } : undefined,
    }

    setDerniereVente(venteImprimee)

    setTimeout(() => {
      window.print()
    }, 300)

    viderPanier()
  }

  // Incident de caisse : Annulation / Remboursement d'une vente par le Superviseur
  function annulerRembourserVente(venteId: string) {
    const targetVente = historiqueVentes.find(v => v.id === venteId)
    if (!targetVente || targetVente.statut === 'annulee') return

    demanderValidationSuperviseur(`Annulation et Remboursement du Ticket ${venteId}`, () => {
      const motif = prompt(`Motif de l'annulation pour le ticket ${venteId} :`, 'Erreur de frappe / Produit retourné') || 'Annulation caisse'

      setProduits(prev => prev.map(p => {
        const itemVente = targetVente.ticket.find(i => i.produit.id === p.id)
        if (itemVente) {
          return { ...p, stock: p.stock + itemVente.quantite }
        }
        return p
      }))

      setHistoriqueVentes(prev => prev.map(v => v.id === venteId ? { ...v, statut: 'annulee', motifAnnulation: motif } : v))

      if (boutiqueActiveId) {
        declarerIncident(boutiqueActiveId, {
          ticketId: targetVente.id,
          type: 'annulation',
          items: targetVente.ticket.map(i => ({ id: i.produit.id, quantite: i.quantite })),
        }).catch(() => {})
      }

      setSession(prev => {
        if (!prev) return null
        const stats = { ...prev.ventes }
        stats.total = Math.max(0, stats.total - targetVente.total)
        stats.nbVentes = Math.max(0, stats.nbVentes - 1)
        if (targetVente.modePaiement === 'especes') stats.especes = Math.max(0, stats.especes - targetVente.total)
        if (targetVente.modePaiement === 'wave') stats.wave = Math.max(0, stats.wave - targetVente.total)
        if (targetVente.modePaiement === 'orange_money') stats.orangeMoney = Math.max(0, stats.orangeMoney - targetVente.total)
        if (targetVente.modePaiement === 'carte') stats.carte = Math.max(0, stats.carte - targetVente.total)
        return { ...prev, ventes: stats }
      })

      alert(`✅ Ticket ${venteId} annulé et remboursé avec succès ! Les stocks ont été réintégrés.`)
    })
  }

  // ── Fonctions d'Exportation Excel & PDF ────────────────────────────────────
  function exporterHistoriqueCSV() {
    const headers = ['ID Ticket', 'Date', 'Heure', 'Caissier', 'Mode Paiement', 'Total (FCFA)', 'Statut']
    const rows = historiqueVentes.map(v => [
      v.id,
      v.date,
      v.heure,
      v.caissier,
      v.modePaiement.toUpperCase(),
      v.total,
      v.statut === 'annulee' ? 'ANNULÉE' : 'VALIDÉE'
    ])
    exportToCSV(`historique_ventes_caisse_${boutiqueActiveId || 'pos'}`, headers, rows)
  }

  function exporterHistoriquePDF() {
    const headers = ['ID Ticket', 'Date & Heure', 'Caissier', 'Mode Paiement', 'Total (FCFA)', 'Statut']
    const rows = historiqueVentes.map(v => [
      v.id,
      `${v.date} ${v.heure}`,
      v.caissier,
      v.modePaiement.toUpperCase(),
      `${v.total.toLocaleString('fr-FR')} FCFA`,
      v.statut === 'annulee' ? '❌ ANNULÉE' : '✅ VALIDÉE'
    ])
    const totalCA = historiqueVentes.filter(v => v.statut !== 'annulee').reduce((s, v) => s + v.total, 0)
    const summaryHtml = `
      <div class="summary">
        <h3 style="margin:0 0 6px; color:#1e293b;">Résumé du Journal de Caisse</h3>
        <p style="margin:0; font-size:14px; font-weight:bold; color:#16a34a;">Chiffre d'Affaires Encaissé : ${totalCA.toLocaleString('fr-FR')} FCFA (${historiqueVentes.length} tickets)</p>
      </div>
    `
    printPDFReport('Journal & Historique des Ventes POS', `Boutique ${boutiqueActiveId || 'Nopalou'}`, headers, rows, summaryHtml)
  }

  function exporterClotureCSV() {
    if (!session) return
    const headers = ['Session ID', 'Date Ouverture', 'Caissier', 'Fond Initial', 'Ventes Espèces', 'Wave', 'Orange Money', 'Carte', 'Total Ventes']
    const rows = [[
      session.id,
      session.dateOuverture,
      session.caissierNom,
      session.fondDeCaisse,
      session.ventes.especes,
      session.ventes.wave,
      session.ventes.orangeMoney,
      session.ventes.carte,
      session.ventes.total
    ]]
    exportToCSV(`cloture_session_${session.id}`, headers, rows)
  }

  function exporterCloturePDF() {
    if (!session) return
    const totalEspecesFinal = session.fondDeCaisse + session.ventes.especes
    const headers = ['Rubrique', 'Détail / Montant (FCFA)']
    const rows = [
      ['Caissier connecté', session.caissierNom],
      ['Heure d\'Ouverture', session.dateOuverture],
      ['Fond de Caisse Initial', `${session.fondDeCaisse.toLocaleString('fr-FR')} FCFA`],
      ['Encaissements Espèces', `${session.ventes.especes.toLocaleString('fr-FR')} FCFA`],
      ['Encaissements Wave', `${session.ventes.wave.toLocaleString('fr-FR')} FCFA`],
      ['Encaissements Orange Money', `${session.ventes.orangeMoney.toLocaleString('fr-FR')} FCFA`],
      ['Encaissements Carte Bancaire', `${session.ventes.carte.toLocaleString('fr-FR')} FCFA`],
      ['Nombre Total de Ventes', `${session.ventes.nbVentes} vente(s)`],
      ['Total Chiffre d\'Affaires Session', `${session.ventes.total.toLocaleString('fr-FR')} FCFA`],
      ['TOTAL ESPÈCES À RETROUVER DANS LE TIROIR', `${totalEspecesFinal.toLocaleString('fr-FR')} FCFA`]
    ]
    printPDFReport(`Rapport de Clôture Z — Session ${session.id}`, `Boutique ${boutiqueActiveId || 'Nopalou'}`, headers, rows)
  }

  // Produits filtrés
  const produitsFiltres = produits.filter(p => {
    const matchCat = categorieFiltre === 'tous' || p.categorie === categorieFiltre
    const matchSearch = !recherche || p.nom.toLowerCase().includes(recherche.toLowerCase()) || p.code_barre?.includes(recherche)
    return matchCat && matchSearch
  })

  // ── ÉCRAN DE VERROUILLAGE PIN SÉCURISÉ ─────────────────────────────────────
  if (verrouille) {
    return (
      <div style={{ background: '#f1f5f9', color: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}>
        <div style={{ background: '#ffffff', border: '2px solid #C75B00', borderRadius: 20, padding: 32, width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 20px 40px rgba(199,91,0,0.15)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: '#0f172a' }}>Caisse POS Nopalou</h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>Entrez votre code PIN secret pour accéder à la caisse.</p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6, textAlign: 'left' }}>IDENTIFICATION CAISSIER</label>
            <select
              value={caissierNom}
              onChange={e => setCaissierNom(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: 14, fontWeight: 700 }}
            >
              <option value="Caissier 1 (Bamba)">👤 Caissier 1 (Bamba)</option>
              <option value="Caissier 2 (Aminata)">👤 Caissier 2 (Aminata)</option>
              <option value="Superviseur / Gérant">👑 Gérant / Superviseur</option>
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <input
              type="password"
              maxLength={4}
              placeholder="••••"
              value={codePinSaisi}
              onChange={e => setCodePinSaisi(e.target.value)}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: '2px solid #C75B00',
                background: '#f8fafc', color: '#0f172a', fontSize: 24, letterSpacing: '0.4em', textAlign: 'center', boxSizing: 'border-box',
              }}
            />
            {pinError && <p style={{ margin: '8px 0 0', color: '#dc2626', fontSize: 12, fontWeight: 600 }}>{pinError}</p>}
          </div>

          {/* Clavier Numérique PIN Pad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
            {['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(val => (
              <button
                key={val}
                onClick={() => {
                  if (val === 'C') setCodePinSaisi('')
                  else if (val === '⌫') setCodePinSaisi(prev => prev.slice(0, -1))
                  else if (codePinSaisi.length < 4) setCodePinSaisi(prev => prev + val)
                }}
                style={{
                  padding: '16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 10,
                  color: '#0f172a', fontWeight: 800, fontSize: 18, cursor: 'pointer',
                }}
              >
                {val}
              </button>
            ))}
          </div>

          <button
            onClick={deverrouillerPin}
            style={{
              width: '100%', padding: '14px', background: 'linear-gradient(135deg, #C75B00 0%, #ea580c 100%)', color: '#fff', border: 'none',
              borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 14px rgba(199,91,0,0.3)',
            }}
          >
            🔓 Déverrouiller la Caisse →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Styles d'impression Thermique 80mm */}
      <style jsx global>{`
        @media screen {
          .ticket-print-container {
            display: none !important;
          }
        }
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          .ticket-print-container, .ticket-print-container * {
            visibility: visible !important;
          }
          .ticket-print-container {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            color: #000000 !important;
            background: #ffffff !important;
            padding: 10px !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {/* En-tête RE-DESIGNÉ & ULTRA-CLEAN NOPALOU POS */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--border)',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow)',
        whiteSpace: 'nowrap',
        overflowX: 'auto',
      }}>
        {/* Côté Gauche : Logo Brand + Boutique Selector + Role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href={boutiqueActiveId ? `/boutique?manage=${boutiqueActiveId}` : '/boutique'} className="btn-premium btn-premium-secondary" style={{ padding: '6px 12px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> Menu Boutique
          </Link>

          <div style={{ height: 20, width: 1, background: 'var(--border)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: 'var(--accent)', color: '#fff', padding: '5px 10px', borderRadius: 8, fontWeight: 800, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Store size={14} /> POS
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>Nopalou</span>
          </div>

          {/* Sélecteur de Boutique Marchand */}
          {boutiques.length > 0 && (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <select
                value={boutiqueActiveId}
                onChange={e => changerBoutiqueActive(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: '#ffffff', color: 'var(--text1)', fontWeight: 700, fontSize: 13, cursor: 'pointer', outline: 'none' }}
              >
                {boutiques.map(b => (
                  <option key={b.id} value={b.id}>🏬 {b.nom}</option>
                ))}
              </select>
            </div>
          )}

          {/* Badge Rôle Actif */}
          <span className="badge-premium" style={{ color: roleActif === 'superviseur' ? '#b45309' : '#0369a1', background: roleActif === 'superviseur' ? '#fffbeb' : '#f0f9ff', borderColor: roleActif === 'superviseur' ? '#fde047' : '#bae6fd' }}>
            <User size={13} style={{ color: roleActif === 'superviseur' ? '#b45309' : '#0369a1' }} />
            {roleActif === 'superviseur' ? 'Gérant' : 'Caissier'}
          </span>
        </div>

        {/* Côté Droit : Actions & Sessions avec Boutons Compacts et Propres */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Modif PINs Gérant */}
          <button
            onClick={ouvrirConfigPin}
            title="Modifier les codes PIN secrets (Gérant)"
            className="btn-premium btn-premium-secondary"
            style={{ padding: '6px 12px', fontSize: 12, border: '1.5px solid var(--border)' }}
          >
            <Settings size={14} /> PINs
          </button>

          {/* Importer produits Batch */}
          <button
            onClick={() => setModalImportBatch(true)}
            className="btn-premium btn-premium-secondary"
            style={{ padding: '6px 12px', fontSize: 12, border: '1.5px solid var(--border)' }}
          >
            <Download size={14} /> Import
          </button>

          {/* Historique */}
          <button
            onClick={() => setModalHistorique(true)}
            className="btn-premium btn-premium-secondary"
            style={{ padding: '6px 12px', fontSize: 12, border: '1.5px solid var(--border)' }}
          >
            <History size={14} /> Historique ({historiqueVentes.length})
          </button>

          {/* Carnet Crédits */}
          <button
            onClick={() => setModalCarnet(true)}
            className="btn-premium btn-premium-secondary"
            style={{ padding: '6px 12px', fontSize: 12, border: '1.5px solid var(--border)' }}
          >
            <Book size={14} /> Carnet ({clientsCredits.length})
          </button>

          {/* Session de caisse Status & Controls */}
          {session ? (
            <span className="badge-premium" style={{ color: '#16a34a', background: '#f0fdf4', borderColor: '#bbf7d0', padding: '6px 12px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
              Session Ouverte
            </span>
          ) : (
            <button
              onClick={() => setModalSessionOuverture(true)}
              className="btn-premium btn-premium-success"
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              <Unlock size={14} /> Ouvrir Session
            </button>
          )}

          {session && (
            <button
              onClick={() => setModalClotureZ(true)}
              className="btn-premium btn-premium-danger"
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              <Lock size={13} /> Clôture Z
            </button>
          )}

          {/* Bouton Verrouiller Caisse */}
          <button
            onClick={() => setVerrouille(true)}
            title="Verrouiller la caisse"
            className="btn-premium"
            style={{ background: 'var(--navy)', color: '#ffffff', padding: '6px 12px', fontSize: 12 }}
          >
            <Lock size={13} /> Verrouiller
          </button>
        </div>
      </header>

      {/* Main Grid Caisse */}
      <div className="caisse-main-layout">

        {/* Côté Gauche : Recherche & Catalogue Produits Réel avec Décrémentation Dynamique du Stock */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', background: '#f8fafc', borderRight: '1px solid #e2e8f0' }}>
          
          {/* File d'attente Multi-Clients (1, 2, 3 clients simultanés) */}
          {ticketsEnAttente.length > 0 && (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#c2410c', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>👥</span> Clients en file d&apos;attente ({ticketsEnAttente.length}) :
                </span>
                <span style={{ fontSize: 11, color: '#9a3412' }}>Cliquez pour reprendre un panier</span>
              </div>

              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                {ticketsEnAttente.map(t => (
                  <button
                    key={t.id}
                    onClick={() => reprendreTicketEnAttente(t.id)}
                    style={{
                      background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px',
                      fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                    }}
                  >
                    <span>▶️</span> {t.clientLabel} ({t.panier.length} art. • {t.heure})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Barre de Recherche Code-Barres & Nom */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 Scannez à la douchette ou tapez le nom / code-barres…"
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 10, border: '1px solid #cbd5e1',
                  background: '#ffffff', color: '#0f172a', fontSize: 15, fontWeight: 600, boxSizing: 'border-box',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                }}
              />
            </div>
          </div>

          {/* Filtre Catégories */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { id: 'tous', label: 'Tous les articles' },
              { id: 'alimentation', label: '🥗 Alimentation' },
              { id: 'smartphones', label: '📱 Téléphonie' },
              { id: 'mode', label: '👗 Mode' },
              { id: 'tv-electro', label: '📺 Électro' },
              { id: 'beaute', label: '💄 Beauté' },
              { id: 'quincaillerie', label: '🧱 Quincaillerie' },
            ].map(c => (
              <button
                key={c.id}
                onClick={() => setCategorieFiltre(c.id)}
                style={{
                  padding: '8px 16px', borderRadius: 20, whiteSpace: 'nowrap',
                  background: categorieFiltre === c.id ? '#C75B00' : '#ffffff',
                  color: categorieFiltre === c.id ? '#ffffff' : '#475569',
                  fontWeight: categorieFiltre === c.id ? 800 : 600, fontSize: 13, cursor: 'pointer',
                  border: categorieFiltre === c.id ? '1px solid #C75B00' : '1px solid #e2e8f0',
                  boxShadow: categorieFiltre === c.id ? '0 3px 8px rgba(199,91,0,0.25)' : 'none',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Grille des produits Réels avec Affichage Dynamique du Stock Restant */}
          {loadingProduits ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#64748b', fontSize: 14 }}>
              Chargement du catalogue de la boutique…
            </div>
          ) : produitsFiltres.length === 0 ? (
            <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>📦</div>
              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                Aucun produit dans le catalogue de cette boutique
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
                Importez des articles modèles ou créez vos produits dans votre catalogue.
              </p>
              <button
                onClick={() => setModalImportBatch(true)}
                style={{ background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
              >
                + Importer des Produits Modèle (Batch Intake) →
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {produitsFiltres.map(p => {
                // Déduire la quantité déjà placée dans le panier en direct
                const qteAuPanier = panier.find(i => i.produit.id === p.id)?.quantite || 0
                const stockRestant = Math.max(0, p.stock - qteAuPanier)
                const estHorsStock = stockRestant === 0

                return (
                  <div
                    key={p.id}
                    onClick={() => ajouterAuPanier(p)}
                    style={{
                      background: '#ffffff', border: estHorsStock ? '1px solid #fecaca' : '1px solid #e2e8f0', borderRadius: 12, padding: 12,
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      transition: 'transform 0.1s, border-color 0.1s', userSelect: 'none', minHeight: 110,
                      boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>{p.nom}</p>
                      <p style={{ margin: 0, fontSize: 10, color: '#64748b' }}>CB: {p.code_barre || 'N/A'}</p>
                    </div>

                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#C75B00' }}>{fcfa(p.prix)}</span>
                      <span style={{
                        fontSize: 10,
                        background: estHorsStock ? '#fef2f2' : stockRestant <= 3 ? '#fff7ed' : '#f0fdf4',
                        color: estHorsStock ? '#991b1b' : stockRestant <= 3 ? '#c2410c' : '#166534',
                        border: estHorsStock ? '1px solid #fecaca' : stockRestant <= 3 ? '1px solid #fed7aa' : '1px solid #bbf7d0',
                        padding: '2px 6px', borderRadius: 4, fontWeight: 700
                      }}>
                        {estHorsStock ? 'Max Panier' : `Stock ${stockRestant}`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Côté Droit : Ticket Panier & Encaissement POS */}
        <div style={{ background: '#ffffff', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>🛒 Ticket en cours</h2>

            <div style={{ display: 'flex', gap: 8 }}>
              {panier.length > 0 && (
                <button
                  onClick={mettrePanierEnAttente}
                  title="Mettre en attente le ticket pour servir le client suivant"
                  style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  ⏸️ En Attente
                </button>
              )}
              {panier.length > 0 && (
                <button onClick={viderPanier} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Vider
                </button>
              )}
            </div>
          </div>

          {/* Contenu Panier */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {panier.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>🧾</span>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#475569' }}>Le ticket de caisse est vide</p>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>Scannez un code-barres ou cliquez sur un article.</p>
              </div>
            ) : (
              panier.map(item => (
                <div key={item.produit.id} style={{ background: '#f8fafc', border: item.quantite > item.produit.stock ? '1px solid #fde047' : '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.produit.nom}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#C75B00', fontWeight: 800 }}>{fcfa(item.prixUnitaire)}</span>
                      {item.quantite > item.produit.stock && (
                        <span style={{ fontSize: 10, background: '#fef08a', color: '#854d0e', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                          👑 Dépassement de Stock Autorisé
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#ffffff', padding: '2px 6px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                      <button onClick={() => modifierQuantite(item.produit.id, -1)} style={{ background: 'none', border: 'none', color: '#0f172a', fontWeight: 800, cursor: 'pointer' }}>-</button>
                      <span style={{ fontSize: 13, fontWeight: 800, minWidth: 16, textAlign: 'center', color: '#0f172a' }}>{item.quantite}</span>
                      <button onClick={() => modifierQuantite(item.produit.id, 1)} style={{ background: 'none', border: 'none', color: '#0f172a', fontWeight: 800, cursor: 'pointer' }}>+</button>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', minWidth: 60, textAlign: 'right' }}>{fcfa(item.prixUnitaire * item.quantite)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mode de Paiement */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>MODE DE RÈGLEMENT</label>
              {panier.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    demanderValidationSuperviseur('Application d’une Remise Client Exceptionnelle', () => {
                      const pourcent = prompt('Pourcentage de remise exceptionnel (ex: 5, 10, 15 %) :')
                      const val = Number(pourcent)
                      if (val > 0 && val <= 50) setRemisePourcentage(val)
                    })
                  }}
                  style={{ background: 'none', border: 'none', color: '#C75B00', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                >
                  🏷️ Remise Superviseur ({remisePourcentage}%)
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[
                { id: 'especes', label: '💵 Espèces' },
                { id: 'wave', label: '🌊 Wave' },
                { id: 'orange_money', label: '🍊 OM' },
                { id: 'carte', label: '💳 Carte' },
                { id: 'mixte', label: '🔀 Mixte (Partagé)' },
                { id: 'credit_client', label: '📝 Crédit Client' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setModePaiement(m.id as any)}
                  style={{
                    padding: '8px 4px', borderRadius: 8,
                    background: modePaiement === m.id ? '#C75B00' : '#f8fafc',
                    color: modePaiement === m.id ? '#fff' : '#334155',
                    fontWeight: modePaiement === m.id ? 800 : 600, fontSize: 11, cursor: 'pointer',
                    border: modePaiement === m.id ? '1px solid #C75B00' : '1px solid #cbd5e1',
                    boxShadow: modePaiement === m.id ? '0 2px 8px rgba(199,91,0,0.25)' : 'none',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Saisie Espèces Standard */}
            {modePaiement === 'especes' && totalPanier > 0 && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', padding: 8, borderRadius: 8 }}>
                <input
                  type="number"
                  placeholder="Montant reçu (Espèces)..."
                  value={montantRecu}
                  onChange={e => setMontantRecu(e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: 13, fontWeight: 700 }}
                />
                <div style={{ fontSize: 12, textAlign: 'right' }}>
                  <span style={{ color: '#64748b', display: 'block' }}>Monnaie à rendre:</span>
                  <span style={{ fontWeight: 900, color: '#16a34a', fontSize: 14 }}>{fcfa(monnaieARendre)}</span>
                </div>
              </div>
            )}

            {/* Paiement Mixte Partagé */}
            {modePaiement === 'mixte' && totalPanier > 0 && (
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#c2410c' }}>🔀 Répartition Paiement Mixte</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: '#9a3412', display: 'block', marginBottom: 2 }}>Montant Espèces (FCFA)</label>
                    <input
                      type="number"
                      placeholder="Ex: 5000"
                      value={montantEspecesMixte}
                      onChange={e => setMontantEspecesMixte(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: 13, fontWeight: 700, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: '#9a3412', display: 'block', marginBottom: 2 }}>Second Mode</label>
                    <select
                      value={secondModeMixte}
                      onChange={e => setSecondModeMixte(e.target.value as any)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: 13, fontWeight: 700, boxSizing: 'border-box' }}
                    >
                      <option value="wave">🌊 Wave</option>
                      <option value="orange_money">🍊 Orange Money</option>
                      <option value="carte">💳 Carte Bancaire</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid #fed7aa', paddingTop: 6 }}>
                  <span style={{ color: '#9a3412' }}>Reste en {secondModeMixte.toUpperCase()} :</span>
                  <span style={{ fontWeight: 900, color: '#0284c7' }}>{fcfa(resteAPayerMixte)}</span>
                </div>
              </div>
            )}

            {/* Récapitulatif Total & Remise */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
              <div>
                <span style={{ fontSize: 13, color: '#475569', display: 'block' }}>Total à payer</span>
                {remisePourcentage > 0 && (
                  <span style={{ fontSize: 11, color: '#dc2626' }}>Remise: -{fcfa(montantRemise)} ({remisePourcentage}%)</span>
                )}
              </div>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#C75B00' }}>{fcfa(totalPanier)}</span>
            </div>

            <button
              onClick={encaisserVente}
              disabled={totalPanier === 0}
              style={{
                width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                background: totalPanier > 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#cbd5e1',
                color: totalPanier > 0 ? '#fff' : '#64748b',
                fontWeight: 900, fontSize: 16, cursor: totalPanier > 0 ? 'pointer' : 'not-allowed',
                boxShadow: totalPanier > 0 ? '0 4px 14px rgba(16,185,129,0.3)' : 'none',
              }}
            >
              ⚡ ENCAISSER ET TICKET (80mm) →
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Impression Thermique 80mm */}
      {derniereVente && (
        <div className="ticket-print-container">
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 'bold' }}>NOPALOU POS — SUPÉRETTE</h3>
            <p style={{ margin: '2px 0 0', fontSize: 10 }}>Boutique N° {boutiqueActiveId || 'DFD'}</p>
            <p style={{ margin: '2px 0 0', fontSize: 10 }}>Ticket N° {derniereVente.id}</p>
            <p style={{ margin: '2px 0 0', fontSize: 10 }}>Date : {derniereVente.date} à {derniereVente.heure}</p>
            <p style={{ margin: '2px 0 0', fontSize: 10 }}>Caissier : {derniereVente.caissier}</p>
          </div>

          <div style={{ borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 6 }}>
            {derniereVente.ticket.map((i, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <span>{i.quantite}x {i.produit.nom.slice(0, 18)}</span>
                <span style={{ fontWeight: 'bold' }}>{fcfa(i.prixUnitaire * i.quantite)}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 6 }}>
            {derniereVente.remise > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>REMISE APPLIQUÉE :</span>
                <span>-{fcfa(derniereVente.remise)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 'bold' }}>
              <span>TOTAL NET :</span>
              <span>{fcfa(derniereVente.total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>MODE RÈGLEMENT :</span>
              <span style={{ fontWeight: 'bold' }}>{derniereVente.mode}</span>
            </div>

            {derniereVente.detailMixte ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 8 }}>
                  <span>- Espèces :</span>
                  <span>{fcfa(derniereVente.detailMixte.especes)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 8 }}>
                  <span>- {derniereVente.detailMixte.autreMode} :</span>
                  <span>{fcfa(derniereVente.detailMixte.autreMontant)}</span>
                </div>
              </>
            ) : derniereVente.mode === 'ESPECES' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Montant Reçu :</span>
                  <span>{fcfa(derniereVente.recu)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>Monnaie Rendue :</span>
                  <span>{fcfa(derniereVente.monnaie)}</span>
                </div>
              </>
            ) : null}
          </div>

          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 10 }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Merci de votre confiance !</p>
            <p style={{ margin: '2px 0 0' }}>Nopalou POS • www.nopalou.sn</p>
          </div>
        </div>
      )}

      {/* Modal d'importation par lot pour la caisse */}
      {modalImportBatch && (
        <BatchImportModal
          boutiqueId={boutiqueActiveId}
          onClose={() => setModalImportBatch(false)}
          onSuccess={() => {
            setModalImportBatch(false)
            chargerProduitsBoutique(boutiqueActiveId)
          }}
        />
      )}

      {/* Modale Paramètres des Codes PIN (Strictement Protégée par Mot de Passe Gérant) */}
      {modalConfigPin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 440, border: '2px solid #C75B00', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 800 }}>👑 Modification Sécurisée des Codes PIN</h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Espace restreint au Gérant / Superviseur de la boutique.</p>
              </div>
              <button onClick={() => setModalConfigPin(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {msgConfigPin && (
              <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, marginBottom: 16, background: msgConfigPin.type === 'success' ? '#f0fdf4' : '#fef2f2', border: msgConfigPin.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca', color: msgConfigPin.type === 'success' ? '#166534' : '#991b1b' }}>
                {msgConfigPin.text}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div style={{ background: '#fff7ed', padding: 12, borderRadius: 10, border: '1px solid #fed7aa' }}>
                <label style={{ fontSize: 12, color: '#9a3412', display: 'block', fontWeight: 800, marginBottom: 4 }}>
                  1. Saisir le Code PIN Superviseur Actuel (Obligatoire)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="•••• (PIN Master Gérant)"
                  value={ancienPinSuperviseur}
                  onChange={e => setAncienPinSuperviseur(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #fed7aa', background: '#ffffff', color: '#0f172a', fontSize: 18, fontWeight: 700, letterSpacing: '0.3em', boxSizing: 'border-box', textAlign: 'center' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#475569', display: 'block', fontWeight: 700, marginBottom: 4 }}>
                  Nouveau Code PIN Caissier (4 chiffres secrets)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="•••• (ex: 1234)"
                  value={nouveauPinCaissier}
                  onChange={e => setNouveauPinCaissier(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: 16, fontWeight: 700, letterSpacing: '0.2em', boxSizing: 'border-box', textAlign: 'center' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#475569', display: 'block', fontWeight: 700, marginBottom: 4 }}>
                  Nouveau Code PIN Superviseur Gérant (4 chiffres secrets)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="•••• (ex: 9999)"
                  value={nouveauPinSuperviseur}
                  onChange={e => setNouveauPinSuperviseur(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: 16, fontWeight: 700, letterSpacing: '0.2em', boxSizing: 'border-box', textAlign: 'center' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalConfigPin(false)} style={{ flex: 1, padding: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={enregistrerNouveauxPins} style={{ flex: 1, padding: '12px', background: '#C75B00', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>
                🔒 Valider et Masquer les PINs →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de Validation Superviseur */}
      {modalSuperviseur && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380, border: '2px solid #ea580c', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>👑</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, color: '#0f172a', fontWeight: 800 }}>Autorisation Superviseur Requis</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#c2410c', fontWeight: 600 }}>{superviseurTitre}</p>

            <div style={{ marginBottom: 16 }}>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={pinSuperviseurSaisi}
                onChange={e => setPinSuperviseurSaisi(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #ea580c', background: '#f8fafc', color: '#0f172a', fontSize: 20, textAlign: 'center', letterSpacing: '0.3em', boxSizing: 'border-box' }}
              />
              {superviseurError && <p style={{ margin: '6px 0 0', color: '#dc2626', fontSize: 12 }}>{superviseurError}</p>}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalSuperviseur(false)} style={{ flex: 1, padding: '10px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={validerSuperviseurPin} style={{ flex: 1, padding: '10px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Historique des Opérations */}
      {modalHistorique && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 740, border: '1px solid #e2e8f0', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 800 }}>📜 Historique des Opérations & Incidents de Caisse</h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Journal des encaissements, annulations et remboursements.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={exporterHistoriqueCSV}
                  style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  📥 Excel (CSV)
                </button>
                <button
                  onClick={exporterHistoriquePDF}
                  style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  📄 Imprimer PDF
                </button>
                <button onClick={() => setModalHistorique(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {historiqueVentes.map(v => (
                <div key={v.id} style={{ background: '#f8fafc', border: v.statut === 'annulee' ? '1px solid #fecaca' : '1px solid #e2e8f0', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{v.id}</span>
                      <span style={{ fontSize: 11, background: v.statut === 'annulee' ? '#fef2f2' : '#eff6ff', color: v.statut === 'annulee' ? '#991b1b' : '#1d4ed8', border: v.statut === 'annulee' ? '1px solid #fecaca' : '1px solid #bfdbfe', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                        {v.statut === 'annulee' ? '❌ ANNULÉ / REMBOURSÉ' : v.modePaiement.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                      📅 {v.date} à {v.heure} • {v.caissier}
                    </p>
                    {v.motifAnnulation && (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#dc2626', fontStyle: 'italic' }}>
                        Motif: {v.motifAnnulation}
                      </p>
                    )}
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#334155' }}>
                      Articles: {v.ticket.map(i => `${i.quantite}x ${i.produit.nom}`).join(', ')}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: v.statut === 'annulee' ? '#dc2626' : '#16a34a' }}>
                      {v.statut === 'annulee' ? `-${fcfa(v.total)}` : fcfa(v.total)}
                    </span>

                    <div style={{ display: 'flex', gap: 6 }}>
                      {v.statut !== 'annulee' && (
                        <button
                          onClick={() => annulerRembourserVente(v.id)}
                          style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          ❌ Annuler / Rembourser
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setDerniereVente({
                            id: v.id,
                            date: v.date,
                            heure: v.heure,
                            total: v.total,
                            remise: 0,
                            recu: v.total,
                            monnaie: 0,
                            ticket: v.ticket,
                            mode: v.modePaiement.toUpperCase(),
                            caissier: v.caissier,
                          })
                          setTimeout(() => window.print(), 300)
                        }}
                        style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        🖨 Ticket
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modale Ouverture Session avec Fond de Caisse & PIN */}
      {modalSessionOuverture && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 440, border: '2px solid #16a34a', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 24 }}>🔑</span>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 800 }}>Ouverture de Session POS</h2>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Identifiez-vous et saisissez le fond de caisse initial.</p>
              </div>
            </div>

            <div style={{ marginBottom: 14, marginTop: 14 }}>
              <label style={{ fontSize: 12, color: '#334155', display: 'block', marginBottom: 4, fontWeight: 700 }}>Caissier Connecté</label>
              <select
                value={caissierNom}
                onChange={e => setCaissierNom(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: 14, fontWeight: 700 }}
              >
                <option value="Caissier 1 (Bamba)">👤 Caissier 1 (Bamba)</option>
                <option value="Caissier 2 (Aminata)">👤 Caissier 2 (Aminata)</option>
                <option value="Superviseur / Gérant">👑 Gérant / Superviseur</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#334155', display: 'block', marginBottom: 6, fontWeight: 700 }}>Fond de Caisse de Départ (en FCFA)</label>
              <input
                type="number"
                value={fondDeCaisseSaisi}
                onChange={e => setFondDeCaisseSaisi(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: 8, border: '2px solid #16a34a', background: '#f0fdf4', color: '#166534', fontSize: 18, fontWeight: 800, boxSizing: 'border-box', textAlign: 'center' }}
              />

              {/* Présélections Rapides */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 8 }}>
                {['10000', '25000', '50000', '100000'].map(montant => (
                  <button
                    key={montant}
                    onClick={() => setFondDeCaisseSaisi(montant)}
                    style={{
                      padding: '6px 4px', fontSize: 11, fontWeight: 800, borderRadius: 6, border: '1px solid #cbd5e1',
                      background: fondDeCaisseSaisi === montant ? '#16a34a' : '#f8fafc',
                      color: fondDeCaisseSaisi === montant ? '#fff' : '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    {new Intl.NumberFormat('fr-FR').format(Number(montant))} F
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalSessionOuverture(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={ouvrirSession} style={{ flex: 1.5, padding: '12px', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
                🚀 Démarrer la Session →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Clôture Z */}
      {modalClotureZ && session && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 460, border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 800 }}>🔒 Clôture Z — Fin de Journée</h2>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={exporterClotureCSV} title="Exporter Excel" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  📥 Excel
                </button>
                <button onClick={exporterCloturePDF} title="Imprimer Rapport PDF" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  📄 PDF
                </button>
              </div>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Session {session.id} • Caissier: {session.caissierNom}</p>

            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, border: '1px solid #e2e8f0', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Fond de Caisse Départ:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{fcfa(session.fondDeCaisse)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Ventes Espèces:</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>{fcfa(session.ventes.especes)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Ventes Wave:</span>
                <span style={{ fontWeight: 700, color: '#0284c7' }}>{fcfa(session.ventes.wave)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Ventes Orange Money:</span>
                <span style={{ fontWeight: 700, color: '#ea580c' }}>{fcfa(session.ventes.orangeMoney)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: 8, fontWeight: 800, fontSize: 15 }}>
                <span>Total Théorique Espèces:</span>
                <span style={{ color: '#C75B00' }}>{fcfa(session.fondDeCaisse + session.ventes.especes)}</span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 4, fontWeight: 600 }}>Comptage Espèces Réel Tiroir-Caisse</label>
              <input
                type="number"
                placeholder={String(session.fondDeCaisse + session.ventes.especes)}
                value={especesComptees}
                onChange={e => setEspecesComptees(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: 15, fontWeight: 700, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalClotureZ(false)} style={{ flex: 1, padding: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                Annuler
              </button>
              <button
                onClick={() => {
                  exporterCloturePDF()
                  alert('Session de caisse fermée avec succès ! Rapport imprimé.')
                  setSession(null)
                  setModalClotureZ(false)
                }}
                style={{ flex: 1, padding: '12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}
              >
                Clôturer la session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Carnet de Crédits Clients */}
      {modalCarnet && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 640, border: '1px solid #e2e8f0', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 800 }}>📒 Carnet de Crédits & Prêts Clients</h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Suivi des carnets de dette et avances des clients de quartier.</p>
              </div>
              <button onClick={() => setModalCarnet(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Ajouter un client */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Nom du client (ex: Ousmane Sow)"
                value={nouveauClientNom}
                onChange={e => setNouveauClientNom(e.target.value)}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: 13 }}
              />
              <input
                type="text"
                placeholder="Téléphone (ex: 77 000 00 00)"
                value={nouveauClientTel}
                onChange={e => setNouveauClientTel(e.target.value)}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: 13 }}
              />
              <button
                onClick={() => {
                  if (nouveauClientNom.trim() && nouveauClientTel.trim()) {
                    setClientsCredits(prev => [
                      ...prev,
                      { id: `cli-${Date.now()}`, nom: nouveauClientNom.trim(), telephone: nouveauClientTel.trim(), solde: 0, plafond_max: 200000 }
                    ])
                    setNouveauClientNom('')
                    setNouveauClientTel('')
                  }
                }}
                style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                + Ajouter Client
              </button>
            </div>

            {/* Liste des clients & balances */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {clientsCredits.map(c => (
                <div key={c.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{c.nom}</p>
                    <span style={{ fontSize: 12, color: '#64748b' }}>📞 {c.telephone} • Plafond: {fcfa(c.plafond_max)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Solde Carnet</span>
                      <span style={{ fontSize: 15, fontWeight: 900, color: c.solde > 0 ? '#dc2626' : c.solde < 0 ? '#16a34a' : '#64748b' }}>
                        {c.solde > 0 ? `Dette: ${fcfa(c.solde)}` : c.solde < 0 ? `Avance: ${fcfa(Math.abs(c.solde))}` : '0 FCFA (Solder)'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        const recu = prompt(`Montant du remboursement de dette pour ${c.nom} (FCFA) :`)
                        const num = Number(recu)
                        if (num > 0) {
                          setClientsCredits(prev => prev.map(item => item.id === c.id ? { ...item, solde: item.solde - num } : item))
                          alert(`Remboursement de ${fcfa(num)} enregistré pour ${c.nom} !`)
                        }
                      }}
                      style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      💵 Encaisser Remboursement
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
