'use client'

import { useState, useEffect } from 'react'
import { getBoutiqueProduits, getBoutiquesMine, getPosHistorique } from '../../actions'
import {
  sauvegarderProduitsLocaux,
  obtenirProduitsLocaux,
  sauvegarderClientsLocaux,
  obtenirClientsLocaux,
} from '@/lib/db-offline'
import type { ProduitCaisse } from '../components/PosCatalogueSection'
import type { BoutiquePOS, SessionCaisse } from '../types'
export type { BoutiquePOS, SessionCaisse }

export function useCaisseData({
  initialToken,
  initialBoutiqueId,
  userId,
  isReallyOnline,
  onOpenConfigObligatoire,
}: {
  initialToken?: string | null
  initialBoutiqueId?: string | null
  userId: string
  isReallyOnline: boolean
  onOpenConfigObligatoire?: () => void
}) {
  const [boutiques, setBoutiques] = useState<BoutiquePOS[]>([])
  const [boutiqueActiveId, setBoutiqueActiveId] = useState<string>('')
  const [terminalPlan, setTerminalPlan] = useState<string | null>('pro')
  const [loadingProduits, setLoadingProduits] = useState<boolean>(true)
  const [produits, setProduits] = useState<ProduitCaisse[]>([])
  const [clientsCredits, setClientsCredits] = useState<any[]>([])
  const [caissiersList, setCaissiersList] = useState<any[]>([])
  const [caissierNom, setCaissierNom] = useState<string>('Caissier 1 (Bamba)')
  const [caissierSelectionneId, setCaissierSelectionneId] = useState<string>('')
  const [roleActif, setRoleActif] = useState<'caissier' | 'superviseur'>('caissier')
  const [session, setSession] = useState<SessionCaisse | null>(null)
  const [historiqueVentes, setHistoriqueVentes] = useState<any[]>([])
  const [conflitSessionMessage, setConflitSessionMessage] = useState<string | null>(null)

  const activeBoutiqueObj = boutiques.find((b) => b.id === boutiqueActiveId)

  // 1. Initialisation des PINs & Sessions sauvegardées
  useEffect(() => {
    if (typeof window !== 'undefined' && boutiqueActiveId) {
      const savedSession = localStorage.getItem(`nopalou_pos_session_${boutiqueActiveId}`)
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession)
          if (parsed && parsed.statut === 'ouverte') {
            setSession(parsed)
          }
        } catch (e) {
          console.warn('[POS DATA] Erreur restauration session:', e)
        }
      }
    }
  }, [boutiqueActiveId])

  useEffect(() => {
    if (typeof window !== 'undefined' && boutiqueActiveId) {
      if (session) {
        localStorage.setItem(`nopalou_pos_session_${boutiqueActiveId}`, JSON.stringify(session))
      } else {
        localStorage.removeItem(`nopalou_pos_session_${boutiqueActiveId}`)
      }
    }
  }, [session, boutiqueActiveId])

  const CODES_PIN_TRIVIAUX = ['1234', '0000', '9999', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '1212']

  function verifierSiConfigObligatoire(caissiers: any[], bId?: string): boolean {
    if (!caissiers || caissiers.length === 0) return false
    const aCodeTrivial = caissiers.some(
      (c) => c.actif !== false && (!c.code_pin || CODES_PIN_TRIVIAUX.includes(String(c.code_pin).trim()))
    )
    const hasSuperviseur = caissiers.some(
      (c) =>
        (c.role === 'superviseur' || c.role === 'admin') &&
        c.code_pin &&
        !CODES_PIN_TRIVIAUX.includes(String(c.code_pin).trim())
    )
    return aCodeTrivial || !hasSuperviseur
  }

  async function chargerReglesRemises(bId: string) {
    if (!bId) return
    try {
      const res = await fetch(`/api/boutiques/${bId}/pos-regles-remises`)
      if (res.ok) {
        const data = await res.json()
        if (data.regles) {
          setBoutiques((prev) => prev.map((b) => (b.id === bId ? { ...b, ...data.regles } : b)))
        }
      }
    } catch (e) {
      console.warn('[chargerReglesRemises warn]', e)
    }
  }

  async function chargerClientsCredits(bId: string) {
    if (!bId) return
    try {
      const res = await fetch(`/api/boutiques/${bId}/credits-clients`)
      if (res.ok) {
        const data = await res.json()
        if (data.clients) {
          setClientsCredits(data.clients)
          sauvegarderClientsLocaux(data.clients, bId, userId).catch(() => {})
        }
      } else {
        const cached = await obtenirClientsLocaux(bId, userId).catch(() => [])
        if (cached && cached.length > 0) setClientsCredits(cached)
      }
    } catch (e) {
      console.error('Erreur chargement carnet credits:', e)
      const cached = await obtenirClientsLocaux(bId, userId).catch(() => [])
      if (cached && cached.length > 0) setClientsCredits(cached)
    }
  }

  async function chargerCaissiersEtSession(bId: string) {
    try {
      const resCaissiers = await fetch(`/api/boutiques/${bId}/caissiers`)
      if (resCaissiers.ok) {
        const data = await resCaissiers.json()
        if (data.caissiers && Array.isArray(data.caissiers)) {
          const actifs = data.caissiers.filter((c: any) => c.actif !== false)
          if (actifs.length > 0) {
            setCaissiersList(actifs)
            setCaissierSelectionneId((prev) => {
              if (prev && actifs.some((c: any) => c.id === prev)) return prev
              const defCaissier = actifs.find((c: any) => c.role === 'caissier') || actifs[0]
              return defCaissier.id
            })
            setCaissierNom((prev) => {
              if (prev && prev !== 'Caissier 1 (Bamba)') return prev
              const defCaissier = actifs.find((c: any) => c.role === 'caissier') || actifs[0]
              return `${defCaissier.prenom || ''} ${defCaissier.nom || ''}`.trim() || defCaissier.nom
            })
            if (verifierSiConfigObligatoire(actifs, bId) && onOpenConfigObligatoire) {
              onOpenConfigObligatoire()
            }
          }
        }
      }

      const resSession = await fetch(`/api/boutiques/${bId}/pos-sessions/active`)
      if (resSession.ok) {
        const data = await resSession.json()
        if (data.session) {
          const dbSession = data.session
          const dbTotal = Number(dbSession.ventes_total || 0)
          const dbNb = Number(dbSession.nb_ventes || 0)
          const dbEspeces = Number(dbSession.ventes_especes || 0)
          const dbWave = Number(dbSession.ventes_wave || 0)
          const dbOM = Number(dbSession.ventes_orange_money || 0)
          const dbCarte = Number(dbSession.ventes_carte || 0)

          setSession((prev) => {
            const localTotal = prev?.ventes?.total || 0
            const localNb = prev?.ventes?.nbVentes || 0
            const localEspeces = prev?.ventes?.especes || 0
            const localWave = prev?.ventes?.wave || 0
            const localOM = prev?.ventes?.orangeMoney || 0
            const localCarte = prev?.ventes?.carte || 0
            const localMixte = prev?.ventes?.mixte || 0

            return {
              id: dbSession.id,
              dateOuverture:
                prev?.dateOuverture ||
                (dbSession.date_ouverture
                  ? new Date(dbSession.date_ouverture).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })),
              fondDeCaisse: Number(dbSession.fond_caisse_initial || prev?.fondDeCaisse || 0),
              caissierNom: dbSession.caissier_nom || caissierNom,
              statut: 'ouverte',
              ventes: {
                total: Math.max(dbTotal, localTotal),
                especes: Math.max(dbEspeces, localEspeces),
                wave: Math.max(dbWave, localWave),
                orangeMoney: Math.max(dbOM, localOM),
                carte: Math.max(dbCarte, localCarte),
                mixte: localMixte,
                nbVentes: Math.max(dbNb, localNb),
              },
            }
          })
        }
      }
    } catch (err) {
      console.error('[chargerCaissiersEtSession err]', err)
    }
  }

  async function chargerProduitsBoutique(bId: string) {
    if (!bId) return
    setLoadingProduits(true)

    // 1. Restaurer depuis cache local
    const localHist = localStorage.getItem(`nopalou_pos_historique_${bId}`)
    if (localHist) {
      try {
        const parsed = JSON.parse(localHist)
        if (Array.isArray(parsed) && parsed.length > 0) setHistoriqueVentes(parsed)
      } catch (err) {
        console.warn('[POS DATA] Hist cache parse err', err)
      }
    }

    const localProds = localStorage.getItem(`nopalou_pos_produits_${bId}`)
    if (localProds) {
      try {
        const parsedP = JSON.parse(localProds)
        if (Array.isArray(parsedP) && parsedP.length > 0) setProduits(parsedP)
      } catch (err) {
        console.warn('[POS DATA] Prods cache parse err', err)
      }
    }

    // 2. Charger historique distant
    getPosHistorique(bId)
      .then((dataHist) => {
        if (dataHist && dataHist.length > 0) {
          setHistoriqueVentes(dataHist)
          localStorage.setItem(`nopalou_pos_historique_${bId}`, JSON.stringify(dataHist))
        }
      })
      .catch(() => {})

    // 3. Charger le catalogue
    try {
      const rawProds = await getBoutiqueProduits(bId)
      if (rawProds && Array.isArray(rawProds) && rawProds.length > 0) {
        const prodsFormates: ProduitCaisse[] = rawProds.map((p: any) => {
          let stockVal = Number(p.stock ?? p.quantite_stock ?? p.stock_quantite)
          if (isNaN(stockVal)) stockVal = 10
          return {
            ...p,
            id: p.id,
            nom: p.nom,
            prix: Number(p.prix),
            code_barre: p.code_barre || p.id.slice(0, 8),
            photo: p.images?.[0] || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
            categorie: p.categorie || 'alimentation',
            stock: stockVal,
          }
        })
        setProduits(prodsFormates)
        localStorage.setItem(`nopalou_pos_produits_${bId}`, JSON.stringify(prodsFormates))
        sauvegarderProduitsLocaux(prodsFormates, bId, userId).catch(() => {})
      } else if (rawProds && Array.isArray(rawProds) && rawProds.length === 0) {
        if (isReallyOnline) {
          const cachedExistants = await obtenirProduitsLocaux(bId, userId).catch(() => [])
          if (!cachedExistants || cachedExistants.length === 0) {
            setProduits([])
            localStorage.setItem(`nopalou_pos_produits_${bId}`, JSON.stringify([]))
            sauvegarderProduitsLocaux([], bId, userId).catch(() => {})
          } else {
            setProduits(cachedExistants)
          }
        } else {
          const cached = await obtenirProduitsLocaux(bId, userId).catch(() => [])
          if (cached && cached.length > 0) setProduits(cached)
        }
      }
    } catch (e) {
      console.warn('[POS DATA] Erreur fetch produits, fallback IndexedDB', e)
      const cached = await obtenirProduitsLocaux(bId, userId).catch(() => [])
      if (cached && cached.length > 0) setProduits(cached)
    } finally {
      setLoadingProduits(false)
    }
  }

  // 4. Initialisation principale des boutiques
  useEffect(() => {
    async function initBoutiques() {
      try {
        setLoadingProduits(true)
        if (initialToken) {
          const res = await fetch(`/api/boutiques/caisse-terminal/${initialToken}`)
          const data = await res.json().catch(() => ({}))
          if (data?.boutique) {
            const bqObj: BoutiquePOS = {
              ...data.boutique,
              plan_actif: data.planActif || data.boutique?.plan_actif || 'pro',
            }
            setBoutiques([bqObj])
            setBoutiqueActiveId(bqObj.id)
            if (data.planActif) setTerminalPlan(data.planActif)

            if (data.caissiers && Array.isArray(data.caissiers)) {
              const actifs = data.caissiers.filter((c: any) => c.actif !== false)
              if (actifs.length > 0) {
                setCaissiersList(actifs)
                const defCaissier = actifs.find((c: any) => c.role === 'caissier') || actifs[0]
                setCaissierSelectionneId(defCaissier.id)
                setCaissierNom(`${defCaissier.prenom || ''} ${defCaissier.nom || ''}`.trim() || defCaissier.nom)
                const isSuper = defCaissier.role === 'superviseur' || defCaissier.role === 'admin'
                setRoleActif(isSuper ? 'superviseur' : 'caissier')
              }
            }

            await chargerCaissiersEtSession(bqObj.id)
            await chargerProduitsBoutique(bqObj.id)
            await chargerClientsCredits(bqObj.id)
            await chargerReglesRemises(bqObj.id)
            setLoadingProduits(false)
            return
          }
        }

        let merchantBoutiques: any[] = []
        try {
          const mine = await getBoutiquesMine()
          merchantBoutiques = mine || []
        } catch (e) {
          console.warn('[POS DATA] Reseau indisponible getBoutiquesMine', e)
        }

        if (merchantBoutiques.length > 0) {
          setBoutiques(merchantBoutiques)
          const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
          const queryBId =
            urlParams?.get('b') ||
            urlParams?.get('boutique') ||
            urlParams?.get('manage') ||
            urlParams?.get('id') ||
            initialBoutiqueId
          const savedBId = typeof window !== 'undefined' ? localStorage.getItem('nopalou_pos_active_boutique_id') : null
          const targetBId = queryBId || savedBId
          const validTarget = merchantBoutiques.find(
            (b) => b.id === targetBId || b.slug === targetBId || b.nom?.toLowerCase() === targetBId?.toLowerCase()
          )
          const bId = validTarget ? validTarget.id : (boutiqueActiveId || merchantBoutiques[0].id)
          setBoutiqueActiveId(bId)
          await chargerCaissiersEtSession(bId)
          await chargerProduitsBoutique(bId)
          await chargerClientsCredits(bId)
          await chargerReglesRemises(bId)
        } else {
          setBoutiques([])
        }
      } catch (err) {
        console.error('[POS DATA] initBoutiques error', err)
      } finally {
        setLoadingProduits(false)
      }
    }
    initBoutiques()
  }, [initialToken, initialBoutiqueId])

  async function changerBoutiqueActive(newBId: string) {
    if (session) {
      alert(
        'Vous avez une session de caisse en cours sur cette boutique. Veuillez clôturer votre caisse (Clôture Z) avant de changer de boutique.'
      )
      return
    }
    setBoutiqueActiveId(newBId)
    if (typeof window !== 'undefined') {
      localStorage.setItem('nopalou_pos_active_boutique_id', newBId)
      const url = new URL(window.location.href)
      url.searchParams.set('b', newBId)
      window.history.replaceState({}, '', url.toString())
    }
    setSession(null)
    setConflitSessionMessage(null)
    await chargerCaissiersEtSession(newBId)
    await chargerProduitsBoutique(newBId)
    await chargerClientsCredits(newBId)
    await chargerReglesRemises(newBId)
  }

  return {
    boutiques,
    setBoutiques,
    boutiqueActiveId,
    setBoutiqueActiveId,
    activeBoutiqueObj,
    terminalPlan,
    setTerminalPlan,
    loadingProduits,
    setLoadingProduits,
    produits,
    setProduits,
    clientsCredits,
    setClientsCredits,
    caissiersList,
    setCaissiersList,
    caissierNom,
    setCaissierNom,
    caissierSelectionneId,
    setCaissierSelectionneId,
    roleActif,
    setRoleActif,
    session,
    setSession,
    historiqueVentes,
    setHistoriqueVentes,
    conflitSessionMessage,
    setConflitSessionMessage,
    changerBoutiqueActive,
    chargerCaissiersEtSession,
    chargerProduitsBoutique,
    chargerClientsCredits,
    chargerReglesRemises,
  }
}
