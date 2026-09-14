'use client'
import { useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { useTranslation } from '@/i18n/context'
import { ShoppingBag, Trash2, Store, X } from 'lucide-react'
import DrawerCartSuccessModal from './cart/DrawerCartSuccessModal'
import DrawerCartItemList from './cart/DrawerCartItemList'
import DrawerCartCheckout from './cart/DrawerCartCheckout'
import { useDrawerCartCheckout } from './cart/useDrawerCartCheckout'

export default function DrawerCart() {
  const { t } = useTranslation()
  const {
    carts,
    activeBoutiqueId,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setActiveBoutiqueId,
    getCartItemCount,
  } = useCart()

  const {
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
  } = useDrawerCartCheckout()

  // Interception du bouton Retour Mobile (Android / iOS) et touche Échap Desktop
  useEffect(() => {
    const isVisible = isCartOpen || !!orderSuccessData
    if (!isVisible || typeof window === 'undefined') return

    window.history.pushState({ modal: 'nopalou_cart' }, '')

    const handlePopState = () => {
      if (orderSuccessData) setOrderSuccessData(null)
      closeCart()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (orderSuccessData) setOrderSuccessData(null)
        closeCart()
      }
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('keydown', handleKeyDown)
      if (window.history.state?.modal === 'nopalou_cart') {
        window.history.back()
      }
    }
  }, [isCartOpen, !!orderSuccessData, closeCart, setOrderSuccessData])

  // 1. Modale de confirmation / succès de commande
  if (orderSuccessData) {
    return (
      <DrawerCartSuccessModal
        orderSuccessData={orderSuccessData}
        onClose={() => {
          setOrderSuccessData(null)
          setCheckoutMode('whatsapp')
          closeCart()
        }}
      />
    )
  }

  // 2. Si le tiroir n'est pas ouvert, ne rien afficher
  if (!isCartOpen) return null

  const boutiquesWithItems = Object.keys(carts).filter((id) => (carts[id]?.items || []).length > 0)

  return (
    <div className="drawer-cart-overlay" onClick={closeCart}>
      <div className="drawer-cart-container" onClick={(e) => e.stopPropagation()}>
        {/* Header Drawer */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            background: '#faf8f5',
            borderTopLeftRadius: 'inherit',
            borderTopRightRadius: 'inherit',
          }}
        >
          <div className="mobile-cart-handle" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {activeCart?.boutiqueNom && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'var(--accent, #C75B00)',
                      background: 'var(--orange2, #FFF3E8)',
                      padding: '2px 8px',
                      borderRadius: 6,
                      textTransform: 'uppercase',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Store size={12} />
                    <span>{activeCart.boutiqueNom}</span>
                  </span>
                </div>
              )}
              <h2
                style={{
                  margin: 0,
                  fontSize: 17,
                  color: 'var(--navy, #1C2B4A)',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <ShoppingBag size={18} style={{ color: 'var(--accent)' }} />
                <span>
                  {t('caisse.cart')} ({activeBoutiqueId ? getCartItemCount(activeBoutiqueId) : 0})
                </span>
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
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#DC2626',
                    borderRadius: 8,
                    padding: '5px 8px',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
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
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'var(--bg, #F8F5F0)',
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 16,
                  cursor: 'pointer',
                  color: 'var(--text2, #6B5E52)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                }}
                title={t('common.close')}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Contenu Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <DrawerCartItemList
            items={items}
            activeBoutiqueId={activeBoutiqueId}
            carts={carts}
            boutiquesWithItems={boutiquesWithItems}
            setActiveBoutiqueId={setActiveBoutiqueId}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            closeCart={closeCart}
          />

          {items.length > 0 && (
            <DrawerCartCheckout
              zones={zones}
              zoneId={zoneId}
              setZoneId={setZoneId}
              codePromo={codePromo}
              setCodePromo={setCodePromo}
              promoApplique={promoApplique}
              promoLoading={promoLoading}
              promoError={promoError}
              appliquerCodePromo={appliquerCodePromo}
              retirerCodePromo={retirerCodePromo}
              sousTotal={sousTotal}
              reductionMontant={reductionMontant}
              fraisLivraison={fraisLivraison}
              totalGlobal={totalGlobal}
              checkoutMode={checkoutMode}
              setCheckoutMode={setCheckoutMode}
              handleCommanderViaWhatsappDirect={handleCommanderViaWhatsappDirect}
              validerCommandeEnLigne={validerCommandeEnLigne}
              loadingCheckout={loadingCheckout}
              whatsappNumber={activeCart?.whatsapp}
              clientNom={clientNom}
              setClientNom={setClientNom}
              clientTel={clientTel}
              setClientTel={setClientTel}
              clientAdresse={clientAdresse}
              setClientAdresse={setClientAdresse}
              methodePaiement={methodePaiement}
              setMethodePaiement={setMethodePaiement}
              errorMsg={errorMsg}
              boutiqueId={activeBoutiqueId || undefined}
              onFormuleChoisie={setFormuleEchelonnement}
            />
          )}
        </div>
      </div>
    </div>
  )
}
