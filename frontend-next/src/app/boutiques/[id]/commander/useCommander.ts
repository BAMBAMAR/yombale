'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Produit,
  Zone,
  ClubVipData,
  PromoApplique,
  DEFAULT_ZONES,
  getMontantDevise,
} from './types'

export function useCommander({
  boutiqueId,
  produit,
  noteInitiale,
}: {
  boutiqueId: string
  produit: Produit
  noteInitiale?: string
}) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  const [mode, setMode] = useState<'whatsapp' | 'formulaire'>('whatsapp')
  const [nom, setNom] = useState('')
  const [tel, setTel] = useState('')
  const [adresse, setAdresse] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [note, setNote] = useState(noteInitiale ?? '')
  const [paiement, setPaiement] = useState('wave')
  const [zones, setZones] = useState<Zone[]>(DEFAULT_ZONES)
  const [zoneId, setZoneId] = useState<string>('dakar-intra')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const nextStep = () => setStep(prev => Math.min(prev + 1, 3) as 1 | 2 | 3)
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1) as 1 | 2 | 3)

  const [crossSell, setCrossSell] = useState<Produit[]>([])
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({})

  const [codePromo, setCodePromo] = useState('')
  const [promoApplique, setPromoApplique] = useState<PromoApplique | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)

  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
  const [cardExp, setCardExp] = useState('12/28')
  const [cardCvc, setCardCvc] = useState('123')
  const [deviseStripe, setDeviseStripe] = useState<'EUR' | 'USD' | 'XOF'>('EUR')

  const [formuleEchelonnement, setFormuleEchelonnement] = useState<{
    apport: number
    nb_echeances: number
    frequence: string
    calcul: any
  } | null>(null)

  const [clubVip, setClubVip] = useState<ClubVipData | null>(null)

  // Capture des paramètres UTM depuis l'URL (attribution social commerce)
  const utmRef = useRef<{ utm_source?: string; utm_medium?: string; utm_campaign?: string }>({})
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      const src = sp.get('utm_source') || undefined
      const med = sp.get('utm_medium') || undefined
      const cam = sp.get('utm_campaign') || undefined
      if (src || med || cam) {
        utmRef.current = { utm_source: src, utm_medium: med, utm_campaign: cam }
      }
    }
  }, [])

  useEffect(() => {
    fetch(`${backendUrl}/api/comptabilite/${boutiqueId}/zones/public`)
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setZones(data)
        else setZones(DEFAULT_ZONES)
      })
      .catch(() => setZones(DEFAULT_ZONES))

    // Chargement du pré-remplissage automatique des coordonnées
    try {
      const savedNom = localStorage.getItem('nopalou_client_nom')
      const savedTel = localStorage.getItem('nopalou_client_tel')
      const savedAdresse = localStorage.getItem('nopalou_client_adresse')
      if (savedNom) setNom(savedNom)
      if (savedTel) setTel(savedTel)
      if (savedAdresse) setAdresse(savedAdresse)
    } catch (err) {
      console.warn('[Nopalou:useCommander:localStorage]', err)
    }

    // Chargement des suggestions Cross-Sell
    fetch(`${backendUrl}/api/boutiques/${boutiqueId}/produits/${produit.id}/cross-sell`)
      .then(r => (r.ok ? r.json() : { produits: [] }))
      .then(data => {
        if (Array.isArray(data.produits)) setCrossSell(data.produits)
      })
      .catch(() => {})
  }, [boutiqueId, produit.id, backendUrl])

  useEffect(() => {
    const cleanDigits = tel.replace(/\D/g, '')
    if (cleanDigits.length >= 9) {
      fetch(`${backendUrl}/api/boutiques/club-vip/statut?telephone=${cleanDigits}`)
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (data && data.success && data.reduction_livraison > 0) {
            setClubVip(data)
          } else {
            setClubVip(null)
          }
        })
        .catch(() => setClubVip(null))
    } else {
      setClubVip(null)
    }
  }, [tel, backendUrl])

  // Calculs financiers
  const zoneSelectionnee = zoneId ? zones.find(z => z.id === zoneId) || null : null
  const fraisLivraisonBrut = zoneSelectionnee ? Number(zoneSelectionnee.prix || 0) : 0
  const reductionClubVip = clubVip ? Math.min(fraisLivraisonBrut, clubVip.reduction_livraison) : 0
  const fraisLivraison = Math.max(0, fraisLivraisonBrut - reductionClubVip)
  const sousTotalMain = produit.prix ? produit.prix * quantite : 0
  const sousTotalAddons = Object.entries(selectedAddons).reduce((acc, [pId, qte]) => {
    const item = crossSell.find(c => c.id === pId)
    return acc + (item && item.prix ? item.prix * qte : 0)
  }, 0)
  const sousTotal = sousTotalMain + sousTotalAddons
  const totalSansReduction = sousTotal + fraisLivraison
  const total = Math.max(0, totalSansReduction - (promoApplique ? promoApplique.reduction : 0))

  function toggleAddon(pId: string) {
    setSelectedAddons(prev => {
      const next = { ...prev }
      if (next[pId]) delete next[pId]
      else next[pId] = 1
      return next
    })
  }

  async function appliquerCodePromo() {
    if (!codePromo.trim()) {
      setPromoError('Veuillez saisir un code promo')
      setPromoApplique(null)
      return
    }
    setPromoLoading(true)
    setPromoError(null)
    try {
      const res = await fetch(`${backendUrl}/api/boutiques/promotions/valider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutique_id: boutiqueId,
          code: codePromo,
          total_panier: sousTotal,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.valide) {
        setPromoError(data.error || 'Code promo invalide')
        setPromoApplique(null)
      } else {
        setPromoApplique({ code: data.code, reduction: data.montant_reduction })
      }
    } catch {
      setPromoError('Impossible de vérifier le code promo')
    } finally {
      setPromoLoading(false)
    }
  }

  function removePromo() {
    setPromoApplique(null)
    setCodePromo('')
  }

  const recordAbConversion = () => {
    try {
      const storageKey = `nopalou_ab_${boutiqueId}`
      const abRaw = sessionStorage.getItem(storageKey)
      if (abRaw) {
        const abData = JSON.parse(abRaw)
        if (abData?.testId && abData?.variant) {
          fetch(`${backendUrl}/api/boutiques/${boutiqueId}/ab-test/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              testId: abData.testId,
              variant: abData.variant,
              eventType: 'conversion',
            }),
          }).catch(() => {})
        }
      }
    } catch {
      // Ignorer silencieusement
    }
  }

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setError(null)
    setLoading(true)

    const articlesPayload = [
      { produit_id: produit.id, nom_produit: produit.nom, quantite, prix_unitaire: produit.prix || 0 },
    ]

    Object.entries(selectedAddons).forEach(([pId, qte]) => {
      const addon = crossSell.find(c => c.id === pId)
      if (addon) {
        articlesPayload.push({
          produit_id: addon.id,
          nom_produit: addon.nom,
          quantite: qte,
          prix_unitaire: addon.prix || 0,
        })
      }
    })

    try {
      if (paiement === 'carte_bancaire') {
        const montantFinal = deviseStripe === 'XOF' ? total : Number(getMontantDevise(total, deviseStripe))
        const stripeRes = await fetch(`${backendUrl}/api/boutiques/paiements/stripe/simuler`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            boutique_id: boutiqueId,
            montant: montantFinal,
            devise: deviseStripe,
            card_number: cardNumber,
            exp_month: 12,
            exp_year: 2028,
            cvc: cardCvc,
          }),
        })
        const stripeData = await stripeRes.json()
        if (!stripeRes.ok || !stripeData.success) {
          setError(stripeData.error || 'Erreur lors du traitement de votre carte bancaire')
          setLoading(false)
          return
        }
      }

      const res = await fetch(`${backendUrl}/api/boutiques/commandes/express`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutique_id: boutiqueId,
          client_nom: nom,
          client_telephone: tel,
          client_adresse: adresse || undefined,
          note: note || undefined,
          methode_paiement: paiement,
          frais_livraison: fraisLivraison,
          articles: articlesPayload,
          code_promo: promoApplique?.code || undefined,
          montant_reduction: promoApplique?.reduction || undefined,
          formule_echelonnement: paiement === 'credit' ? formuleEchelonnement : undefined,
          ...utmRef.current,
        }),
      })
      const data = await res.json()
      if (!res.ok && !data.fallback_manuel) {
        setError(data.error ?? 'Erreur lors de la commande')
        setLoading(false)
        return
      }

      if (data.wave_url) {
        window.location.href = data.wave_url
        return
      }

      if (data.fallback_manuel) {
        setPaiement('manuel')
        setError("L'API Wave direct étant momentanément indisponible, votre commande a été enregistrée. Effectuez votre transfert manuel vers le 77 720 20 86 (Wave/OM).")
        setLoading(false)
        return
      }

      // Sauvegarde Zero-Effort des coordonnées client
      try {
        if (nom) localStorage.setItem('nopalou_client_nom', nom)
        if (tel) localStorage.setItem('nopalou_client_tel', tel)
        if (adresse) localStorage.setItem('nopalou_client_adresse', adresse)
      } catch (err) {
        console.warn('[Nopalou:useCommander:storage]', err)
      }

      recordAbConversion()
      try {
        if (typeof window !== 'undefined') {
          if (window.fbq) {
            window.fbq('track', 'Purchase', {
              value: total,
              currency: 'XOF',
              content_name: produit.nom,
            })
          }
          if (window.ttq) {
            window.ttq.track('CompletePayment', {
              value: total,
              currency: 'XOF',
              content_name: produit.nom,
            })
          }
          if (window.gtag) {
            window.gtag('event', 'purchase', {
              value: total,
              currency: 'XOF',
              items: [{ item_name: produit.nom, price: produit.prix, quantity: quantite }],
            })
          }
        }
      } catch (pixErr) {
        console.warn('[PIXEL TRACKING WARN]:', pixErr)
      }
      setSuccess(true)
      setStep(3)
    } catch {
      setError('Impossible de joindre le serveur')
    } finally {
      setLoading(false)
    }
  }

  return {
    mode,
    setMode,
    step,
    setStep,
    nextStep,
    prevStep,
    nom,
    setNom,
    tel,
    setTel,
    adresse,
    setAdresse,
    quantite,
    setQuantite,
    note,
    setNote,
    paiement,
    setPaiement,
    zones,
    zoneId,
    setZoneId,
    loading,
    success,
    error,
    crossSell,
    selectedAddons,
    toggleAddon,
    codePromo,
    setCodePromo,
    promoApplique,
    promoLoading,
    promoError,
    appliquerCodePromo,
    removePromo,
    cardNumber,
    setCardNumber,
    cardExp,
    setCardExp,
    cardCvc,
    setCardCvc,
    deviseStripe,
    setDeviseStripe,
    formuleEchelonnement,
    setFormuleEchelonnement,
    clubVip,
    zoneSelectionnee,
    reductionClubVip,
    fraisLivraison,
    sousTotalMain,
    sousTotalAddons,
    sousTotal,
    total,
    recordAbConversion,
    submit,
  }
}
