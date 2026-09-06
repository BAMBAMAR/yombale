'use client'
import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { fcfa } from '@/lib/format'
import ExternalImg from '@/components/ExternalImg'
import { useTranslation } from '@/i18n/context'
import {
  ShoppingBag, Trash2, Plus, Minus, Store, MapPin, Phone,
  MessageCircle, CreditCard, Check, X, ShieldCheck, Tag, Zap,
  ArrowRight, AlertCircle, Banknote
} from 'lucide-react'

interface Zone { id: string; nom: string; prix: number }

interface OrderSuccessData {
  boutiqueNom: string
  boutiqueId: string
  whatsapp?: string | null
  reference: string
  total: number
  sousTotal: number
  fraisLivraison: number
  reduction: number
  codePromo?: string
  methodePaiement: string
  clientNom: string
  clientTel: string
  clientAdresse?: string
  items: Array<{ nom: string; quantite: number; prix: number; detailsVariante?: string | null }>
}

const DEFAULT_ZONES: Zone[] = [
  { id: 'dakar-intra', nom: 'Dakar Intra-Muros (Plateau, Almadies, Medina, Fann...)', prix: 1500 },
  { id: 'dakar-banlieue', nom: 'Banlieue Dakar (Pikine, Guédiawaye, Keur Massar, Rufisque...)', prix: 2500 },
  { id: 'regions-senegal', nom: 'Expédition Régions (Thiès, St-Louis, Mbour, Kaolack...)', prix: 3500 },
  { id: 'retrait-boutique', nom: 'Retrait gratuit en boutique', prix: 0 },
]

export default function DrawerCart() {
  const { t } = useTranslation()
  const { carts, activeBoutiqueId, isCartOpen, openCart, closeCart, updateQuantity, removeFromCart, clearCart, clearAllCarts, setActiveBoutiqueId, getCartTotal, getCartItemCount } = useCart()
  const [zones, setZones] = useState<Zone[]>(DEFAULT_ZONES)
  const [zoneId, setZoneId] = useState<string>('dakar-intra')
  const [loadingCheckout, setLoadingCheckout] = useState<boolean>(false)
  const [checkoutMode, setCheckoutMode] = useState<'whatsapp' | 'formulaire'>('whatsapp')
  const [orderSuccessData, setOrderSuccessData] = useState<OrderSuccessData | null>(null)

  // Champs du formulaire de commande en ligne
  const [clientNom, setClientNom] = useState('')
  const [clientTel, setClientTel] = useState('')
  const [clientAdresse, setClientAdresse] = useState('')
  const [methodePaiement, setMethodePaiement] = useState('wave')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Gestion des Codes Promo
  const [codePromo, setCodePromo] = useState('')
  const [promoApplique, setPromoApplique] = useState<{ code: string; reduction: number; type_remise?: string; message?: string } | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)

  const activeCart = activeBoutiqueId ? carts[activeBoutiqueId] : null
  const items = activeCart?.items || []
  const sousTotal = activeBoutiqueId ? getCartTotal(activeBoutiqueId) : 0
  const zoneSelectionnee = zones.find(z => z.id === zoneId) || (zoneId === '' ? null : DEFAULT_ZONES[0])
  const fraisLivraison = zoneSelectionnee ? Number(zoneSelectionnee.prix || 0) : 0
  const reductionMontant = promoApplique ? Number(promoApplique.reduction || 0) : 0
  const totalGlobal = Math.max(0, sousTotal + fraisLivraison - reductionMontant)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  // Chargement des zones de livraison
  useEffect(() => {
    if (activeBoutiqueId) {
      fetch(`${backendUrl}/api/comptabilite/${activeBoutiqueId}/zones/public`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
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
    } catch {}
  }, [])

  // Validation du code promo
  async function appliquerCodePromo() {
    if (!codePromo.trim()) {
      setPromoError('⚠️ Veuillez saisir un code promo')
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

  // Construire le message WhatsApp groupé complet
  function getMessageWhatsapp(nomBoutique: string, currentItems: typeof items, currentSousTotal: number, currentFraisLivraison: number, currentReduction: number, currentPromoCode?: string, currentTotal?: number) {
    const lignedDetailles = currentItems.map(i => `• ${i.quantite}x ${i.nom}${i.detailsVariante ? ` [${i.detailsVariante}]` : ''} (${fcfa(i.prix * i.quantite)})`).join('\n')
    let msg = `Bonjour ${nomBoutique} ! Je souhaite passer la commande suivante :\n\n${lignedDetailles}\n\n` +
      `Sous-total: ${fcfa(currentSousTotal)}\n`
    if (currentReduction > 0 && currentPromoCode) {
      msg += `🎉 Code Promo (${currentPromoCode}): -${fcfa(currentReduction)}\n`
    }
    if (currentFraisLivraison > 0) {
      msg += `Livraison (${zoneSelectionnee?.nom || 'Zone choisie'}): ${fcfa(currentFraisLivraison)}\n`
    }
    msg += `TOTAL: ${fcfa(currentTotal !== undefined ? currentTotal : (currentSousTotal + currentFraisLivraison - currentReduction))}\n\nPouvons-nous organiser la livraison ?`
    return msg
  }

  function getLienWhatsapp(rawNumber?: string | null, customMsg?: string) {
    const targetNumber = rawNumber || activeCart?.whatsapp || '221777202086'
    const digits = targetNumber.replace(/\D/g, '')
    const clean = digits.length === 9 ? '221' + digits : (digits || '221777202086')
    const message = customMsg || getMessageWhatsapp(activeCart?.boutiqueNom || 'la boutique', items, sousTotal, fraisLivraison, reductionMontant, promoApplique?.code, totalGlobal)
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
      // Sauvegarder dans localStorage pour les prochaines commandes
      try {
        if (clientNom.trim()) localStorage.setItem('nopalou_client_nom', clientNom.trim())
        if (clientTel.trim()) localStorage.setItem('nopalou_client_tel', clientTel.trim())
        if (clientAdresse.trim()) localStorage.setItem('nopalou_client_adresse', clientAdresse.trim())
      } catch {}

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

      // Formater la décomposition des articles
      const formattedItems = currentItems.map(i => ({
        produit_id: (i.produitId || i.id.split('_')[0]).length === 36 ? (i.produitId || i.id.split('_')[0]) : null,
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
          nom_produit: currentItems.map(i => `${i.quantite}x ${i.nom}${i.detailsVariante ? ` (${i.detailsVariante})` : ''}`).join(', '),
          prix_unitaire: currentSousTotal,
          quantite: 1,
          client_nom: clientNom.trim(),
          client_telephone: clientTel.trim(),
          client_adresse: clientAdresse.trim() || undefined,
          methode_paiement: currentMethode,
          zone_livraison_id: (zoneId && zoneId.length === 36) ? zoneId : undefined,
          frais_livraison: currentFraisLiv,
          source: 'web_panier',
          items: formattedItems,
          code_promo: currentPromoCode || undefined,
          montant_reduction: currentReduction > 0 ? currentReduction : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erreur lors de la validation')
        setLoadingCheckout(false)
        return
      }

      if (data.wave_url) {
        clearCart(currentBoutiqueId)
        window.location.href = data.wave_url
        return
      }

      // Stocker les données de succès pour garder la modale active
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
        items: currentItems.map(i => ({ nom: i.nom, quantite: i.quantite, prix: i.prix, detailsVariante: i.detailsVariante })),
      })

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
      } catch {}

      const formattedItems = currentItems.map(i => ({
        produit_id: (i.produitId || i.id.split('_')[0]).length === 36 ? (i.produitId || i.id.split('_')[0]) : null,
        variante_id: i.varianteId || null,
        nom_produit: i.nom,
        details_variante: i.detailsVariante || null,
        prix_unitaire: i.prix,
        quantite: i.quantite,
      }))

      // Enregistrer en base la commande passée via WhatsApp
      await fetch(`${backendUrl}/api/comptabilite/${currentBoutiqueId}/commandes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom_produit: currentItems.map(i => `${i.quantite}x ${i.nom}${i.detailsVariante ? ` (${i.detailsVariante})` : ''}`).join(', '),
          prix_unitaire: currentSousTotal,
          quantite: 1,
          client_nom: clientNom.trim() || 'Client WhatsApp',
          client_telephone: clientTel.trim() || 'Via WhatsApp',
          client_adresse: clientAdresse.trim() || undefined,
          methode_paiement: 'wave',
          zone_livraison_id: (zoneId && zoneId.length === 36) ? zoneId : undefined,
          frais_livraison: currentFraisLiv,
          source: 'whatsapp_panier',
          items: formattedItems,
          code_promo: currentPromoCode || undefined,
          montant_reduction: currentReduction > 0 ? currentReduction : undefined,
        }),
      }).catch(() => {})
    } finally {
      setLoadingCheckout(false)
      const waLink = getLienWhatsapp(currentWhatsapp, getMessageWhatsapp(currentBoutiqueNom, currentItems, currentSousTotal, currentFraisLiv, currentReduction, currentPromoCode, currentTotal))
      window.open(waLink, '_blank')

      setOrderSuccessData({
        boutiqueNom: currentBoutiqueNom,
        boutiqueId: currentBoutiqueId,
        whatsapp: currentWhatsapp,
        reference: `CMD-WA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        total: currentTotal,
        sousTotal: currentSousTotal,
        fraisLivraison: currentFraisLiv,
        reduction: currentReduction,
        codePromo: currentPromoCode,
        methodePaiement: 'whatsapp',
        clientNom: clientNom.trim() || 'Client WhatsApp',
        clientTel: clientTel.trim() || '',
        clientAdresse: clientAdresse.trim() || undefined,
        items: currentItems.map(i => ({ nom: i.nom, quantite: i.quantite, prix: i.prix, detailsVariante: i.detailsVariante })),
      })

      clearCart(currentBoutiqueId)
    }
  }

  // 1. Si une commande a été validée avec succès, afficher la modale de notification
  if (orderSuccessData) {
    const isCredit = orderSuccessData.methodePaiement === 'credit'
    const isWa = orderSuccessData.methodePaiement === 'whatsapp'

    const waMsgSuccess = `Bonjour ${orderSuccessData.boutiqueNom} ! Je viens de valider ma commande réf: *${orderSuccessData.reference}* d'un montant de *${fcfa(orderSuccessData.total)}* sur votre boutique Nopalou.\n\nPouvons-nous confirmer les détails de livraison ?`
    const waLinkDirect = `https://wa.me/${(orderSuccessData.whatsapp || '221777202086').replace(/\D/g, '')}?text=${encodeURIComponent(waMsgSuccess)}`

    return (
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(28,43,74,0.6)', backdropFilter: 'blur(8px)',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}
        onClick={() => { setOrderSuccessData(null); setCheckoutMode('whatsapp'); closeCart(); }}
      >
        <div
          style={{
            background: '#ffffff', borderRadius: 24, padding: '32px 26px', width: '100%', maxWidth: 480,
            textAlign: 'center', boxShadow: '0 25px 60px -12px rgba(28,43,74,0.3)', display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: 16, animation: 'fadeInScale 0.25s ease-out'
          }}
          onClick={e => e.stopPropagation()}
        >
          <style jsx global>{`
            @keyframes fadeInScale {
              from { transform: scale(0.92); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>

          <div style={{
            width: 76, height: 76, borderRadius: '50%',
            background: isCredit ? '#e0f2fe' : (isWa ? '#dcfce7' : '#ecfdf5'),
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38,
            boxShadow: isCredit ? '0 8px 20px rgba(2,132,199,0.2)' : '0 8px 20px rgba(22,163,74,0.2)'
          }}>
            {isCredit ? '💳' : (isWa ? '💬' : '🎉')}
          </div>

          <div>
            <span style={{
              display: 'inline-block', fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 20,
              background: '#f1f5f9', color: '#475569', marginBottom: 8, letterSpacing: '0.04em'
            }}>
              RÉF : {orderSuccessData.reference}
            </span>
            <h3 style={{
              margin: '2px 0 6px', fontSize: 21, fontWeight: 900,
              color: isCredit ? '#0369a1' : (isWa ? '#15803d' : '#166534')
            }}>
              {isCredit ? t('caisse.creditRequestSentTitle') : (isWa ? 'Commande transmise sur WhatsApp !' : t('caisse.orderSuccessTitle'))}
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: '#334155', lineHeight: 1.5 }}>
              {isCredit ? (
                <>
                  Votre demande d&apos;achat à crédit de <strong style={{ color: '#0284c7', fontSize: 15 }}>{fcfa(orderSuccessData.total)}</strong> auprès de <strong>{orderSuccessData.boutiqueNom}</strong> a été enregistrée avec succès. Le commerçant la validera dans son Carnet client !
                </>
              ) : (
                <>
                  Votre commande auprès de <strong>{orderSuccessData.boutiqueNom}</strong> a été transmise avec succès ! Le vendeur prendra contact avec vous très vite pour la livraison.
                </>
              )}
            </p>
          </div>

          {/* Récapitulatif Box */}
          <div style={{ width: '100%', background: 'var(--bg, #F8F5F0)', border: '1px solid var(--border, #E8DDD2)', borderRadius: 14, padding: '14px 16px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2, #6B5E52)' }}>
              <span>Boutique</span>
              <strong style={{ color: 'var(--navy, #1C2B4A)' }}>{orderSuccessData.boutiqueNom}</strong>
            </div>
            {orderSuccessData.codePromo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a', fontWeight: 700 }}>
                <span>Code promo ({orderSuccessData.codePromo})</span>
                <span>-{fcfa(orderSuccessData.reduction)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900, color: 'var(--accent, #C75B00)', borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: 6, marginTop: 2 }}>
              <span>Total {isCredit ? 'à inscrire' : 'à régler'}</span>
              <span>{fcfa(orderSuccessData.total)}</span>
            </div>
          </div>

          {isCredit && (
            <p style={{ margin: 0, fontSize: 12, color: '#0284c7', background: '#f0f9ff', padding: '10px 14px', borderRadius: 12, border: '1px solid #bae6fd', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>Votre demande est en attente d&apos;approbation par la boutique. Vous pouvez également contacter le commerçant sur WhatsApp pour confirmation directe.</span>
            </p>
          )}

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
            <a
              href={waLinkDirect}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 14, background: '#22c55e', color: '#fff',
                fontWeight: 900, fontSize: 15, textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(34,197,94,0.35)'
              }}
            >
              <MessageCircle size={18} />
              <span>{t('shop.notifyVendorWhatsApp')}</span>
            </a>
            <button
              onClick={() => { setOrderSuccessData(null); setCheckoutMode('whatsapp'); closeCart(); }}
              style={{
                width: '100%', background: 'var(--navy, #1C2B4A)', color: '#fff', border: 'none', borderRadius: 14,
                padding: '13px 20px', fontWeight: 800, fontSize: 14, cursor: 'pointer'
              }}
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 2. Si le tiroir n'est pas ouvert et pas de confirmation de commande, ne rien afficher
  // (Suppression définitive du bouton flottant pour éliminer toute superposition et redondance)
  if (!isCartOpen) return null

  const boutiquesWithItems = Object.keys(carts).filter(id => (carts[id]?.items || []).length > 0)

  return (
    <div className="drawer-cart-overlay" onClick={closeCart}>
      <div className="drawer-cart-container" onClick={e => e.stopPropagation()}>
        <style jsx global>{`
          .drawer-cart-floating-btn {
            display: flex;
          }
          @media (max-width: 768px) {
            .drawer-cart-floating-btn {
              display: none !important;
            }
          }
          .drawer-cart-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            justify-content: flex-end;
            background: rgba(28, 43, 74, 0.45);
            backdrop-filter: blur(8px);
          }
          .drawer-cart-container {
            width: 100%;
            max-width: 480px;
            background: #ffffff;
            height: 100%;
            display: flex;
            flex-direction: column;
            box-shadow: -10px 0 40px rgba(28,43,74,0.18);
            animation: slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .mobile-cart-handle {
            display: none;
          }
          .premium-cart-input {
            width: 100%;
            padding: 11px 13px;
            border: 1.5px solid var(--border, #E8DDD2);
            border-radius: 12px;
            font-size: 13.5px;
            color: var(--text1, #1A1612);
            background: #ffffff;
            transition: all 0.2s ease;
            box-sizing: border-box;
            outline: none;
          }
          .premium-cart-input:focus {
            border-color: var(--accent, #C75B00);
            box-shadow: 0 0 0 3px rgba(199, 91, 0, 0.12);
          }
          .cart-mode-card {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 12px 14px;
            border-radius: 14px;
            border: 1.5px solid var(--border, #E8DDD2);
            background: #ffffff;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: left;
          }
          .cart-mode-card:hover {
            border-color: #cbd5e1;
          }
          .cart-mode-card.active-wa {
            border-color: #22c55e;
            background: #f0fdf4;
            box-shadow: 0 4px 14px -2px rgba(34, 197, 94, 0.2);
          }
          .cart-mode-card.active-form {
            border-color: var(--accent, #C75B00);
            background: #fff7ed;
            box-shadow: 0 4px 14px -2px rgba(199, 91, 0, 0.2);
          }
          .payment-chip-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
            border-radius: 10px;
            border: 1.5px solid var(--border, #E8DDD2);
            background: #ffffff;
            font-size: 13px;
            font-weight: 600;
            color: var(--text2, #6B5E52);
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .payment-chip-btn.selected {
            border-color: var(--accent, #C75B00);
            background: var(--orange2, #FFF3E8);
            color: var(--accent, #C75B00);
            box-shadow: 0 0 0 2px rgba(199, 91, 0, 0.15);
          }
          @keyframes slideLeft {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @media (max-width: 640px) {
            .drawer-cart-overlay {
              align-items: flex-end;
            }
            .drawer-cart-container {
              max-width: 100%;
              height: auto;
              max-height: 90vh;
              border-top-left-radius: 24px;
              border-top-right-radius: 24px;
              animation: slideUp 0.25s ease-out;
            }
            .mobile-cart-handle {
              display: block;
              width: 40px;
              height: 4px;
              border-radius: 3px;
              background: var(--border, #E8DDD2);
              margin: 4px auto 10px;
            }
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
          }
        `}</style>

        {/* Header Drawer */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border, #E8DDD2)', background: '#faf8f5', borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}>
          <div className="mobile-cart-handle" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {activeCart?.boutiqueNom && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent, #C75B00)', background: 'var(--orange2, #FFF3E8)', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Store size={12} />
                    <span>{activeCart.boutiqueNom}</span>
                  </span>
                </div>
              )}
              <h2 style={{ margin: 0, fontSize: 17, color: 'var(--navy, #1C2B4A)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingBag size={18} style={{ color: 'var(--accent)' }} />
                <span>{t('caisse.cart')} ({activeBoutiqueId ? getCartItemCount(activeBoutiqueId) : 0})</span>
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeBoutiqueId) {
                      clearCart(activeBoutiqueId)
                    }
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626',
                    borderRadius: 8, padding: '5px 8px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer'
                  }}
                  title="Vider ce panier"
                >
                  <Trash2 size={13} />
                  <span>Vider</span>
                </button>
              )}
              <button
                onClick={closeCart}
                style={{
                  width: 34, height: 34, borderRadius: '50%', background: 'var(--bg, #F8F5F0)',
                  border: '1px solid var(--border, #E8DDD2)', fontSize: 16, cursor: 'pointer', color: 'var(--text2, #6B5E52)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
                }}
                title={t('common.close')}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Multi-boutiques Switcher Tabs si articles dans plusieurs boutiques */}
        {boutiquesWithItems.length > 1 && (
          <div style={{ padding: '8px 16px', background: '#F1F5F9', borderBottom: '1px solid var(--border, #E8DDD2)', display: 'flex', gap: 6, overflowX: 'auto' }}>
            {boutiquesWithItems.map(bId => {
              const bCart = carts[bId]
              const isSelected = activeBoutiqueId === bId
              const bCount = (bCart?.items || []).reduce((s, it) => s + (it.quantite || 0), 0)
              return (
                <button
                  key={bId}
                  type="button"
                  onClick={() => setActiveBoutiqueId(bId)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    borderRadius: 8, border: isSelected ? '1.5px solid var(--accent, #C75B00)' : '1px solid #CBD5E1',
                    background: isSelected ? '#FFF7ED' : '#FFFFFF', color: isSelected ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                    fontWeight: 800, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap'
                  }}
                >
                  <Store size={13} />
                  <span>{bCart?.boutiqueNom || 'Boutique'}</span>
                  <span style={{
                    background: isSelected ? 'var(--accent, #C75B00)' : '#E2E8F0',
                    color: isSelected ? '#FFFFFF' : '#475569',
                    padding: '1px 6px', borderRadius: 8, fontSize: 10.5, fontWeight: 900
                  }}>
                    {bCount}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Contenu Scrollable (Articles + Options + Formulaires) */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {items.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--orange2, #FFF3E8)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <ShoppingBag size={32} style={{ color: 'var(--accent, #C75B00)' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 8px' }}>Votre panier est vide</h3>
              <p style={{ fontSize: 13, color: 'var(--text2, #6B5E52)', margin: '0 0 24px', maxWidth: 280, lineHeight: 1.5 }}>
                Parcourez nos boutiques partenaires pour ajouter des articles et commander rapidement.
              </p>
              <a
                href="/boutiques"
                onClick={closeCart}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'var(--accent, #C75B00)', color: '#fff', textDecoration: 'none',
                  padding: '12px 22px', borderRadius: 12, fontWeight: 800, fontSize: 13.5,
                  boxShadow: '0 4px 12px rgba(199,91,0,0.25)'
                }}
              >
                <Store size={16} />
                <span>Explorer les boutiques</span>
              </a>
            </div>
          ) : (
            <>
              {/* Liste des Articles du Panier */}
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: 12, padding: '12px', background: '#ffffff', borderRadius: 14, border: '1px solid var(--border, #E8DDD2)', alignItems: 'center', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--bg, #F8F5F0)' }}>
                  <ExternalImg src={item.images?.[0]} alt={item.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 800, fontSize: 13.5, color: 'var(--navy, #1C2B4A)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nom}</p>
                  {item.detailsVariante && (
                    <span style={{ display: 'inline-block', fontSize: 11, background: 'var(--bg, #F8F5F0)', color: 'var(--text2, #6B5E52)', padding: '1px 6px', borderRadius: 4, fontWeight: 700, marginBottom: 4, border: '1px solid var(--border, #E8DDD2)' }}>
                      {item.detailsVariante}
                    </span>
                  )}
                  <div>
                    <span style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--accent, #C75B00)' }}>{fcfa(item.prix)}</span>
                  </div>
                </div>

                {/* Sélecteur de Quantité */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#ffffff', border: '1.5px solid var(--border, #E8DDD2)', padding: '2px 4px', borderRadius: 8 }}>
                  <button onClick={() => updateQuantity(activeBoutiqueId!, item.id, -1)} style={{ background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer', minWidth: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }} aria-label="Réduire">
                    <Minus size={13} />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 900, minWidth: 18, textAlign: 'center', color: 'var(--navy, #1C2B4A)' }}>{item.quantite}</span>
                  <button onClick={() => updateQuantity(activeBoutiqueId!, item.id, 1)} style={{ background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer', minWidth: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }} aria-label="Augmenter">
                    <Plus size={13} />
                  </button>
                </div>

                <button onClick={() => removeFromCart(activeBoutiqueId!, item.id)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Supprimer">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Section Options & Finalisation de commande */}
          <div style={{ padding: '16px 20px 24px', borderTop: '1px solid var(--border, #E8DDD2)', background: 'var(--bg, #F8F5F0)', display: 'flex', flexDirection: 'column', gap: 14, marginTop: 'auto' }}>
            
            {/* Choix zone de livraison */}
            {zones.length > 0 && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text1, #1A1612)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span>📍</span> {t('shop.deliveryZoneLabel')}
                </label>
                <select
                  value={zoneId}
                  onChange={e => setZoneId(e.target.value)}
                  className="premium-cart-input"
                  style={{ height: 42 }}
                >
                  <option value="">{t('shop.freeShopPickup')}</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.nom} ({z.prix > 0 ? fcfa(z.prix) : 'Gratuit'})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Section Code Promo */}
            <div style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 14, padding: '12px 14px' }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text1, #1A1612)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span>🏷️</span> Code Promo (optionnel)
              </label>

              {promoApplique ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>✅</span>
                    <div>
                      <strong style={{ fontSize: 13, color: '#166534' }}>{promoApplique.code}</strong>
                      <span style={{ fontSize: 12.5, color: '#15803d', marginLeft: 6, fontWeight: 700 }}>(-{fcfa(promoApplique.reduction)})</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={retirerCodePromo}
                    style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12, fontWeight: 800, cursor: 'pointer', padding: '2px 6px' }}
                  >
                    Retirer ✕
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={codePromo}
                    onChange={e => setCodePromo(e.target.value.toUpperCase())}
                    placeholder="Ex: SOLDE20"
                    className="premium-cart-input"
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace', flex: 1, padding: '9px 12px' }}
                  />
                  <button
                    type="button"
                    onClick={appliquerCodePromo}
                    disabled={promoLoading || !codePromo.trim()}
                    style={{
                      background: 'var(--navy, #1C2B4A)', color: '#fff', border: 'none', borderRadius: 10,
                      padding: '9px 14px', fontSize: 13, fontWeight: 800, cursor: (promoLoading || !codePromo.trim()) ? 'not-allowed' : 'pointer',
                      opacity: (promoLoading || !codePromo.trim()) ? 0.6 : 1, whiteSpace: 'nowrap'
                    }}
                  >
                    {promoLoading ? '...' : 'Appliquer'}
                  </button>
                </div>
              )}

              {promoError && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#dc2626', fontWeight: 700 }}>{promoError}</p>
              )}
            </div>

            {/* Récapitulatif Prix */}
            <div style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2, #6B5E52)' }}>
                <span>{t('common.subtotal')}</span>
                <strong style={{ color: 'var(--navy, #1C2B4A)' }}>{fcfa(sousTotal)}</strong>
              </div>
              {reductionMontant > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a', fontWeight: 700 }}>
                  <span>Code Promo ({promoApplique?.code})</span>
                  <span>-{fcfa(reductionMontant)}</span>
                </div>
              )}
              {fraisLivraison > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2, #6B5E52)' }}>
                  <span>{t('shop.deliveryLabel')}</span>
                  <span>{fcfa(fraisLivraison)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16.5, fontWeight: 900, color: 'var(--accent, #C75B00)', borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: 8, marginTop: 2 }}>
                <span>{t('common.total')}</span>
                <span>{fcfa(totalGlobal)}</span>
              </div>
            </div>

            {/* SÉLECTEUR D'ONGLETS / MODE DE COMMANDE (100% VISIBLE & EXPLICITE) */}
            <div>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: 'var(--text2, #6B5E52)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={14} style={{ color: 'var(--accent)' }} />
                <span>{t('shop.chooseOrderMode')} :</span>
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Onglet 1: WhatsApp Direct */}
                <button
                  type="button"
                  onClick={() => setCheckoutMode('whatsapp')}
                  className={`cart-mode-card ${checkoutMode === 'whatsapp' ? 'active-wa' : ''}`}
                  style={{
                    padding: '12px', borderRadius: 12, border: checkoutMode === 'whatsapp' ? '2px solid #16a34a' : '1.5px solid var(--border, #E8DDD2)',
                    background: checkoutMode === 'whatsapp' ? '#f0fdf4' : '#ffffff', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s ease', boxShadow: checkoutMode === 'whatsapp' ? '0 2px 8px rgba(22,163,74,0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6,
                      background: checkoutMode === 'whatsapp' ? '#16a34a' : 'var(--bg, #F8F5F0)',
                      color: checkoutMode === 'whatsapp' ? '#ffffff' : 'var(--text2, #6B5E52)',
                      display: 'inline-flex', alignItems: 'center', gap: 3
                    }}>
                      <Zap size={10} />
                      <span>1-CLIC</span>
                    </span>
                    <span style={{
                      fontSize: 11, width: 18, height: 18, borderRadius: '50%',
                      background: checkoutMode === 'whatsapp' ? '#16a34a' : 'transparent',
                      color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, border: checkoutMode === 'whatsapp' ? 'none' : '1.5px solid #cbd5e1'
                    }}>
                      {checkoutMode === 'whatsapp' ? <Check size={11} strokeWidth={3} /> : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MessageCircle size={20} style={{ color: checkoutMode === 'whatsapp' ? '#16a34a' : 'var(--text2)' }} />
                    <div>
                      <strong style={{ fontSize: 13, color: checkoutMode === 'whatsapp' ? '#15803d' : 'var(--navy, #1C2B4A)', display: 'block' }}>
                        WhatsApp
                      </strong>
                      <p style={{ margin: 0, fontSize: 11, color: checkoutMode === 'whatsapp' ? '#166534' : 'var(--text2, #6B5E52)' }}>
                        Sans formulaire
                      </p>
                    </div>
                  </div>
                </button>

                {/* Onglet 2: Commande en Ligne Direct */}
                <button
                  type="button"
                  onClick={() => setCheckoutMode('formulaire')}
                  className={`cart-mode-card ${checkoutMode === 'formulaire' ? 'active-form' : ''}`}
                  style={{
                    padding: '12px', borderRadius: 12, border: checkoutMode === 'formulaire' ? '2px solid var(--accent, #C75B00)' : '1.5px solid var(--border, #E8DDD2)',
                    background: checkoutMode === 'formulaire' ? '#fff7ed' : '#ffffff', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s ease', boxShadow: checkoutMode === 'formulaire' ? '0 2px 8px rgba(199,91,0,0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6,
                      background: checkoutMode === 'formulaire' ? 'var(--accent, #C75B00)' : 'var(--bg, #F8F5F0)',
                      color: checkoutMode === 'formulaire' ? '#ffffff' : 'var(--text2, #6B5E52)',
                      display: 'inline-flex', alignItems: 'center', gap: 3
                    }}>
                      <CreditCard size={10} />
                      <span>PAIEMENT</span>
                    </span>
                    <span style={{
                      fontSize: 11, width: 18, height: 18, borderRadius: '50%',
                      background: checkoutMode === 'formulaire' ? 'var(--accent, #C75B00)' : 'transparent',
                      color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, border: checkoutMode === 'formulaire' ? 'none' : '1.5px solid #cbd5e1'
                    }}>
                      {checkoutMode === 'formulaire' ? <Check size={11} strokeWidth={3} /> : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard size={20} style={{ color: checkoutMode === 'formulaire' ? 'var(--accent)' : 'var(--text2)' }} />
                    <div>
                      <strong style={{ fontSize: 13, color: checkoutMode === 'formulaire' ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)', display: 'block' }}>
                        En Ligne
                      </strong>
                      <p style={{ margin: 0, fontSize: 11, color: checkoutMode === 'formulaire' ? '#c2410c' : 'var(--text2, #6B5E52)' }}>
                        Wave, OM, Cash
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* CONTENU SELON LE MODE CHOISI */}
            {checkoutMode === 'whatsapp' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleCommanderViaWhatsappDirect}
                  disabled={loadingCheckout}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#16a34a', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 16px',
                    fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 14px rgba(22,163,74,.35)', width: '100%',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <MessageCircle size={18} />
                  <span>{t('shop.orderViaWhatsAppDirect')} ({fcfa(totalGlobal)}) →</span>
                </button>

                {activeCart?.whatsapp && (
                  <a
                    href={`tel:${activeCart.whatsapp.replace(/\D/g, '')}`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: '#fff', color: 'var(--text2, #6B5E52)', border: '1.5px solid var(--border, #E8DDD2)', borderRadius: 12, padding: '10px 14px',
                      fontWeight: 700, fontSize: 13, textDecoration: 'none', textAlign: 'center',
                    }}
                  >
                    <Phone size={15} />
                    <span>{t('shop.callSellerDirect')}</span>
                  </a>
                )}
              </div>
            ) : (
              <form onSubmit={validerCommandeEnLigne} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#fff', border: '1.5px solid var(--border, #E8DDD2)', padding: 14, borderRadius: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, fontWeight: 900, fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>{t('shop.directOnlineOrder')}</p>
                  <span style={{ fontSize: 11, color: 'var(--text3, #9C8E84)', fontWeight: 600 }}>Remplissez vos infos ci-dessous</span>
                </div>

                {errorMsg && (
                  <p style={{ margin: 0, color: '#dc2626', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={14} />
                    <span>{errorMsg}</span>
                  </p>
                )}

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text2, #6B5E52)', display: 'block', marginBottom: 2 }}>{t('account.fullName')} *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Babacar Ndiaye"
                    value={clientNom}
                    onChange={e => setClientNom(e.target.value)}
                    className="input-npl"
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text2, #6B5E52)', display: 'block', marginBottom: 2 }}>{t('common.phone')} *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 77 123 45 67"
                    value={clientTel}
                    onChange={e => setClientTel(e.target.value)}
                    className="input-npl"
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text2, #6B5E52)', display: 'block', marginBottom: 2 }}>{t('shop.deliveryAddress')}</label>
                  <input
                    type="text"
                    placeholder="Ex: Sacré-Cœur 3, près du rond-point"
                    value={clientAdresse}
                    onChange={e => setClientAdresse(e.target.value)}
                    className="input-npl"
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text2, #6B5E52)', display: 'block', marginBottom: 4 }}>{t('common.paymentMethod')}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      { value: 'wave', label: 'Wave ⚡' },
                      { value: 'orange_money', label: 'Orange Money' },
                      { value: 'especes', label: 'Espèces' },
                      { value: 'credit', label: 'Carnet Crédit' },
                    ].map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setMethodePaiement(p.value)}
                        className={`payment-chip-btn ${methodePaiement === p.value ? 'selected' : ''}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px',
                          borderRadius: 8, border: methodePaiement === p.value ? '1.5px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                          background: methodePaiement === p.value ? 'var(--orange2, #FFF3E8)' : '#ffffff',
                          color: methodePaiement === p.value ? 'var(--accent, #C75B00)' : 'var(--text1, #1A1612)',
                          fontSize: 12, fontWeight: 750, cursor: 'pointer'
                        }}
                      >
                        <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid currentColor', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: methodePaiement === p.value ? 'currentColor' : 'transparent' }} />
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>

                  {methodePaiement === 'credit' && (
                    <p style={{ margin: '6px 0 0', fontSize: 11.5, color: '#0369a1', fontWeight: 600, background: '#e0f2fe', padding: '6px 8px', borderRadius: 8 }}>
                      ℹ️ Votre demande sera transmise au commerçant pour inscription au Carnet client.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loadingCheckout}
                  className="btn-npl btn-npl-primary btn-npl-lg"
                  style={{
                    marginTop: 6, width: '100%', fontSize: 14.5,
                  }}
                >
                  {loadingCheckout ? t('common.pleaseWait') : `${t('shop.validateAndPayBtn')} • ${fcfa(totalGlobal)} →`}
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  </div>
</div>
  )
}
