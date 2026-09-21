'use client'
import { useState, useEffect } from 'react'
import { Zone, OrderSuccessData } from './types'
import { useCart } from '@/context/CartContext'
import { fcfa } from '@/lib/format'
import { getSavedUtm, trackAnalyticsEvent } from '@/lib/analytics'

const DEFAULT_ZONES: Zone[] = [
  { id: 'dakar-intra', nom: 'Dakar Intra-Muros (Plateau, Almadies, Medina, Fann...)', prix: 1500 },
  { id: 'dakar-banlieue', nom: 'Banlieue Dakar (Pikine, Guédiawaye, Keur Massar, Rufisque...)', prix: 2500 },
  { id: 'regions-senegal', nom: 'Expédition Régions (Thiès, St-Louis, Mbour, Kaolack...)', prix: 3500 },
  { id: 'retrait-boutique', nom: 'Retrait gratuit en boutique', prix: 0 },
]

export function useDrawerCartCheckout() {
  const {
    carts,
    activeBoutiqueId,
    clearCart,
    getCartTotal,
  } = useCart()

  const [zones, setZones] = useState<Zone[]>(DEFAULT_ZONES)
  const [zoneId, setZoneId] = useState<string>('dakar-intra')
  const [loadingCheckout, setLoadingCheckout] = useState<boolean>(false)
  const [checkoutMode, setCheckoutMode] = useState<'whatsapp' | 'formulaire'>('whatsapp')
  const [orderSuccessData, setOrderSuccessData] = useState<OrderSuccessData | null>(null)

  // Coordonnées client
  const [clientNom, setClientNom] = useState('')
  const [clientTel, setClientTel] = useState('')
  const [clientAdresse, setClientAdresse] = useState('')
  const [methodePaiement, setMethodePaiement] = useState('wave')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [formuleEchelonnement, setFormuleEchelonnement] = useState<any>(null)

  // Codes promo
  const [codePromo, setCodePromo] = useState('')
  const [promoApplique, setPromoApplique] = useState<{
    code: string
    reduction: number
    type_remise?: string
    message?: string
  } | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)

  const activeCart = activeBoutiqueId ? carts[activeBoutiqueId] : null
  const items = activeCart?.items || []
  const sousTotal = activeBoutiqueId ? getCartTotal(activeBoutiqueId) : 0
  const zoneSelectionnee = zones.find((z) => z.id === zoneId) || (zoneId === '' ? null : DEFAULT_ZONES[0])
  const fraisLivraison = zoneSelectionnee ? Number(zoneSelectionnee.prix || 0) : 0
  const reductionMontant = promoApplique ? Number(promoApplique.reduction || 0) : 0
  const totalGlobal = Math.max(0, sousTotal + fraisLivraison - reductionMontant)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  // Chargement des zones de livraison
  useEffect(() => {
    if (activeBoutiqueId) {
      fetch(`${backendUrl}/api/comptabilite/${activeBoutiqueId}/zones/public`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) setZones(data)
          else setZones(DEFAULT_ZONES)
        })
        .catch(() => setZones(DEFAULT_ZONES))
    }
  }, [activeBoutiqueId, backendUrl])

  // Pré-remplissage automatique des coordonnées (Zero-Effort Acheteur)
  useEffect(() => {
    try {
      const savedNom = localStorage.getItem('nopalou_client_nom')
      const savedTel = localStorage.getItem('nopalou_client_tel')
      const savedAdresse = localStorage.getItem('nopalou_client_adresse')
      if (savedNom) setClientNom(savedNom)
      if (savedTel) setClientTel(savedTel)
      if (savedAdresse) setClientAdresse(savedAdresse)
    } catch (err) {
      console.warn('[Nopalou:DrawerCart:Prefill]', err)
    }
  }, [])

  // Tracking de l'étape checkout_initie dans le funnel Nopalou
  useEffect(() => {
    if (activeBoutiqueId && items.length > 0) {
      trackAnalyticsEvent('checkout_initie', activeBoutiqueId, { valeur: totalGlobal })
    }
  }, [activeBoutiqueId])

  // Sauvegarde automatique du panier non finalisé (Panier Abandonné pour relance commerçant)
  useEffect(() => {
    const cleanTel = clientTel.replace(/\D/g, '')
    if (cleanTel.length < 9 || items.length === 0 || !activeBoutiqueId) return

    const timer = setTimeout(() => {
      fetch(`${backendUrl}/api/boutiques/${activeBoutiqueId}/paniers-abandonnes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_nom: clientNom.trim() || undefined,
          client_tel: cleanTel,
          articles: items.map((i) => ({
            id: i.produitId || i.id,
            nom: i.nom,
            prix: i.prix,
            quantite: i.quantite,
            detailsVariante: i.detailsVariante,
          })),
          total: totalGlobal,
        }),
      }).catch(() => {})
    }, 1500)

    return () => clearTimeout(timer)
  }, [clientTel, clientNom, activeBoutiqueId, items, totalGlobal, backendUrl])

  // Validation du code promo
  async function appliquerCodePromo() {
    if (!codePromo.trim()) {
      setPromoError('Veuillez saisir un code promo')
      setPromoApplique(null)
      return
    }
    if (!activeBoutiqueId) return
    setPromoLoading(true)
    setPromoError(null)

    try {
      const res = await fetch(`${backendUrl}/api/boutiques/promotions/valider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutique_id: activeBoutiqueId,
          code: codePromo.trim(),
          total_panier: sousTotal,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.valide) {
        setPromoError(data.error || 'Code promo expiré ou invalide')
        setPromoApplique(null)
      } else {
        setPromoApplique({
          code: data.code,
          reduction: Number(data.montant_reduction) || 0,
          type_remise: data.type_remise,
          message: data.message,
        })
        setPromoError(null)
      }
    } catch {
      setPromoError('Impossible de vérifier le code promo')
    } finally {
      setPromoLoading(false)
    }
  }

  function retirerCodePromo() {
    setPromoApplique(null)
    setCodePromo('')
    setPromoError(null)
  }

  function getMessageWhatsapp(
    nomBoutique: string,
    currentItems: typeof items,
    currentSousTotal: number,
    currentFraisLivraison: number,
    currentReduction: number,
    currentPromoCode?: string,
    currentTotal?: number,
    reference?: string
  ) {
    const lignedDetailles = currentItems
      .map(
        (i) =>
          `• ${i.quantite}x ${i.nom}${i.detailsVariante ? ` [${i.detailsVariante}]` : ''} (${fcfa(i.prix * i.quantite)})`
      )
      .join('\n')
    let msg = `Bonjour ${nomBoutique} ! Je souhaite passer la commande suivante${reference ? ` (Réf: *${reference}*)` : ''} :\n\n${lignedDetailles}\n\nSous-total: ${fcfa(currentSousTotal)}\n`
    if (currentReduction > 0 && currentPromoCode) {
      msg += `Code Promo (${currentPromoCode}): -${fcfa(currentReduction)}\n`
    }
    if (currentFraisLivraison > 0) {
      msg += `Livraison (${zoneSelectionnee?.nom || 'Zone choisie'}): ${fcfa(currentFraisLivraison)}\n`
    }
    msg += `TOTAL: ${fcfa(currentTotal !== undefined ? currentTotal : currentSousTotal + currentFraisLivraison - currentReduction)}\n\nPouvons-nous organiser la livraison ?`
    return msg
  }

  function getLienWhatsapp(rawNumber?: string | null, customMsg?: string) {
    const targetNumber = rawNumber || activeCart?.whatsapp || '221777202086'
    const digits = targetNumber.replace(/\D/g, '')
    const clean = digits.length === 9 ? '221' + digits : digits || '221777202086'
    const message =
      customMsg ||
      getMessageWhatsapp(
        activeCart?.boutiqueNom || 'la boutique',
        items,
        sousTotal,
        fraisLivraison,
        reductionMontant,
        promoApplique?.code,
        totalGlobal
      )
    return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
  }

  async function validerCommandeEnLigne(e: React.FormEvent) {
    e.preventDefault()
    if (!clientNom.trim() || !clientTel.trim()) {
      setErrorMsg('Veuillez saisir votre nom et numéro de téléphone')
      return
    }
    setErrorMsg(null)
    setLoadingCheckout(true)

    try {
      try {
        if (clientNom.trim()) localStorage.setItem('nopalou_client_nom', clientNom.trim())
        if (clientTel.trim()) localStorage.setItem('nopalou_client_tel', clientTel.trim())
        if (clientAdresse.trim()) localStorage.setItem('nopalou_client_adresse', clientAdresse.trim())
      } catch (err) {
        console.warn('[Nopalou:DrawerCart:Storage]', err)
      }

      const currentBoutiqueId = activeBoutiqueId!
      const currentBoutiqueNom = activeCart?.boutiqueNom || 'Boutique'
      const currentWhatsapp = activeCart?.whatsapp || null
      const currentItems = [...items]
      const currentSousTotal = sousTotal
      const currentFraisLiv = fraisLivraison
      const currentReduction = reductionMontant
      const currentPromoCode = promoApplique?.code
      const currentTotal = totalGlobal
      const currentMethode = methodePaiement

      const formattedItems = currentItems.map((i) => ({
        produit_id: (i.produitId || i.id.split('_')[0]).length === 36 ? i.produitId || i.id.split('_')[0] : null,
        variante_id: i.varianteId || null,
        nom_produit: i.nom,
        details_variante: i.detailsVariante || null,
        prix_unitaire: i.prix,
        quantite: i.quantite,
      }))

      const res = await fetch(`${backendUrl}/api/comptabilite/${currentBoutiqueId}/commandes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom_produit: currentItems
            .map((i) => `${i.quantite}x ${i.nom}${i.detailsVariante ? ` (${i.detailsVariante})` : ''}`)
            .join(', '),
          prix_unitaire: currentSousTotal,
          quantite: 1,
          client_nom: clientNom.trim(),
          client_telephone: clientTel.trim(),
          client_adresse: clientAdresse.trim() || undefined,
          methode_paiement: currentMethode,
          zone_livraison_id: zoneId && zoneId.length === 36 ? zoneId : undefined,
          frais_livraison: currentFraisLiv,
          source: 'web_panier',
          items: formattedItems,
          code_promo: currentPromoCode || undefined,
          montant_reduction: currentReduction > 0 ? currentReduction : undefined,
          formule_echelonnement: currentMethode === 'credit' ? formuleEchelonnement : undefined,
          ...getSavedUtm(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erreur lors de la validation')
        setLoadingCheckout(false)
        return
      }

      if (data.wave_url) {
        trackAnalyticsEvent('commande_confirmee', currentBoutiqueId, { valeur: currentTotal })
        clearCart(currentBoutiqueId)
        window.location.href = data.wave_url
        return
      }

      setOrderSuccessData({
        boutiqueNom: currentBoutiqueNom,
        boutiqueId: currentBoutiqueId,
        whatsapp: currentWhatsapp,
        reference: data.commande?.reference || `CMD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        total: currentTotal,
        sousTotal: currentSousTotal,
        fraisLivraison: currentFraisLiv,
        reduction: currentReduction,
        codePromo: currentPromoCode,
        methodePaiement: currentMethode,
        clientNom: clientNom.trim(),
        clientTel: clientTel.trim(),
        clientAdresse: clientAdresse.trim() || undefined,
        items: currentItems.map((i) => ({
          nom: i.nom,
          quantite: i.quantite,
          prix: i.prix,
          detailsVariante: i.detailsVariante,
        })),
      })

      trackAnalyticsEvent('commande_confirmee', currentBoutiqueId, { valeur: currentTotal })

      clearCart(currentBoutiqueId)
    } catch {
      setErrorMsg('Impossible de joindre le serveur')
    } finally {
      setLoadingCheckout(false)
    }
  }

  async function handleCommanderViaWhatsappDirect() {
    setLoadingCheckout(true)
    const currentBoutiqueId = activeBoutiqueId!
    const currentBoutiqueNom = activeCart?.boutiqueNom || 'Boutique'
    const currentWhatsapp = activeCart?.whatsapp || null
    const currentItems = [...items]
    const currentSousTotal = sousTotal
    const currentFraisLiv = fraisLivraison
    const currentReduction = reductionMontant
    const currentPromoCode = promoApplique?.code
    const currentTotal = totalGlobal

    try {
      try {
        if (clientNom.trim()) localStorage.setItem('nopalou_client_nom', clientNom.trim())
        if (clientTel.trim()) localStorage.setItem('nopalou_client_tel', clientTel.trim())
        if (clientAdresse.trim()) localStorage.setItem('nopalou_client_adresse', clientAdresse.trim())
      } catch (err) {
        console.warn('[Nopalou:DrawerCart:StorageWA]', err)
      }

      const formattedItems = currentItems.map((i) => ({
        produit_id: (i.produitId || i.id.split('_')[0]).length === 36 ? i.produitId || i.id.split('_')[0] : null,
        variante_id: i.varianteId || null,
        nom_produit: i.nom,
        details_variante: i.detailsVariante || null,
        prix_unitaire: i.prix,
        quantite: i.quantite,
      }))

      let finalReference: string | null = null
      try {
        const res = await fetch(`${backendUrl}/api/comptabilite/${currentBoutiqueId}/commandes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom_produit: currentItems
              .map((i) => `${i.quantite}x ${i.nom}${i.detailsVariante ? ` (${i.detailsVariante})` : ''}`)
              .join(', '),
            prix_unitaire: currentSousTotal,
            quantite: 1,
            client_nom: clientNom.trim() || 'Client WhatsApp',
            client_telephone: clientTel.trim() || 'Via WhatsApp',
            client_adresse: clientAdresse.trim() || undefined,
            methode_paiement: 'wave',
            zone_livraison_id: zoneId && zoneId.length === 36 ? zoneId : undefined,
            frais_livraison: currentFraisLiv,
            source: 'whatsapp_panier',
            items: formattedItems,
            code_promo: currentPromoCode || undefined,
            montant_reduction: currentReduction > 0 ? currentReduction : undefined,
            ...getSavedUtm(),
          }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data?.commande?.reference) {
            finalReference = data.commande.reference
          }
        }
      } catch (err) {
        console.warn('[Nopalou:DrawerCart:StorageWA:API]', err)
      }

      const activeRef = finalReference || `CMD-WA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

      const waLink = getLienWhatsapp(
        currentWhatsapp,
        getMessageWhatsapp(currentBoutiqueNom, currentItems, currentSousTotal, currentFraisLiv, currentReduction, currentPromoCode, currentTotal, activeRef)
      )
      window.open(waLink, '_blank')

      setOrderSuccessData({
        boutiqueNom: currentBoutiqueNom,
        boutiqueId: currentBoutiqueId,
        whatsapp: currentWhatsapp,
        reference: activeRef,
        total: currentTotal,
        sousTotal: currentSousTotal,
        fraisLivraison: currentFraisLiv,
        reduction: currentReduction,
        codePromo: currentPromoCode,
        methodePaiement: 'whatsapp',
        clientNom: clientNom.trim() || 'Client WhatsApp',
        clientTel: clientTel.trim() || '',
        clientAdresse: clientAdresse.trim() || undefined,
        items: currentItems.map((i) => ({
          nom: i.nom,
          quantite: i.quantite,
          prix: i.prix,
          detailsVariante: i.detailsVariante,
        })),
      })

      trackAnalyticsEvent('commande_confirmee', currentBoutiqueId, { valeur: currentTotal })
      clearCart(currentBoutiqueId)
    } finally {
      setLoadingCheckout(false)
    }
  }

  return {
    zones,
    zoneId,
    setZoneId,
    loadingCheckout,
    checkoutMode,
    setCheckoutMode,
    orderSuccessData,
    setOrderSuccessData,
    clientNom,
    setClientNom,
    clientTel,
    setClientTel,
    clientAdresse,
    setClientAdresse,
    methodePaiement,
    setMethodePaiement,
    formuleEchelonnement,
    setFormuleEchelonnement,
    errorMsg,
    codePromo,
    setCodePromo,
    promoApplique,
    promoLoading,
    promoError,
    appliquerCodePromo,
    retirerCodePromo,
    validerCommandeEnLigne,
    handleCommanderViaWhatsappDirect,
    activeCart,
    items,
    sousTotal,
    fraisLivraison,
    reductionMontant,
    totalGlobal,
  }
}
