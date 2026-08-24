'use client'
import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { fcfa } from '@/lib/format'
import ExternalImg from '@/components/ExternalImg'
import { useTranslation } from '@/i18n/context'

interface Zone { id: string; nom: string; prix: number }

const DEFAULT_ZONES: Zone[] = [
  { id: 'dakar-intra', nom: '📍 Dakar Intra-Muros (Plateau, Almadies, Medina, Fann...)', prix: 1500 },
  { id: 'dakar-banlieue', nom: '📍 Banlieue Dakar (Pikine, Guédiawaye, Keur Massar, Rufisque...)', prix: 2500 },
  { id: 'regions-senegal', nom: '🚚 Expédition Régions (Thiès, St-Louis, Mbour, Kaolack...)', prix: 3500 },
  { id: 'retrait-boutique', nom: '🏬 Retrait gratuit en boutique', prix: 0 },
]

export default function DrawerCart() {
  const { t, isRtl } = useTranslation()
  const { carts, activeBoutiqueId, isCartOpen, openCart, closeCart, updateQuantity, removeFromCart, clearCart, getCartTotal, getCartItemCount } = useCart()
  const [zones, setZones] = useState<Zone[]>(DEFAULT_ZONES)
  const [zoneId, setZoneId] = useState<string>('dakar-intra')
  const [loadingCheckout, setLoadingCheckout] = useState<boolean>(false)
  const [checkoutMode, setCheckoutMode] = useState<'options' | 'formulaire' | 'succes'>('options')

  // Champs du formulaire de commande en ligne
  const [clientNom, setClientNom] = useState('')
  const [clientTel, setClientTel] = useState('')
  const [clientAdresse, setClientAdresse] = useState('')
  const [methodePaiement, setMethodePaiement] = useState('wave')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const activeCart = activeBoutiqueId ? carts[activeBoutiqueId] : null
  const items = activeCart?.items || []
  const sousTotal = activeBoutiqueId ? getCartTotal(activeBoutiqueId) : 0
  const zoneSelectionnee = zones.find(z => z.id === zoneId) || DEFAULT_ZONES[0]
  const fraisLivraison = zoneSelectionnee ? zoneSelectionnee.prix : 1500
  const totalGlobal = sousTotal + fraisLivraison

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

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

  if (!activeCart || items.length === 0) return null

  if (!isCartOpen) {
    return (
      <button
        onClick={() => activeBoutiqueId && openCart(activeBoutiqueId)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          background: '#C75B00', color: '#fff', border: 'none', borderRadius: 30,
          padding: '14px 22px', fontWeight: 900, fontSize: 15, cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(199,91,0,0.4)', display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <span style={{ fontSize: 18 }}>🛒</span>
        <span>{t('shop.cartTitle')} ({getCartItemCount(activeBoutiqueId!)})</span>
        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: 12, fontSize: 13 }}>
          {fcfa(sousTotal)}
        </span>
      </button>
    )
  }

  // Construire le message WhatsApp complet multi-produits
  const lignedDetailles = items.map(i => `• ${i.quantite}x ${i.nom}${i.detailsVariante ? ` [${i.detailsVariante}]` : ''} (${fcfa(i.prix * i.quantite)})`).join('\n')
  const messageWhatsappGrouped = `Bonjour ${activeCart.boutiqueNom} ! Je souhaite passer la commande suivante :\n\n${lignedDetailles}\n\n` +
    `Sous-total: ${fcfa(sousTotal)}\n` +
    `${fraisLivraison > 0 ? `Livraison (${zoneSelectionnee?.nom}): ${fcfa(fraisLivraison)}\n` : ''}` +
    `TOTAL: ${fcfa(totalGlobal)}\n\nPouvons-nous organiser la livraison ?`

  function getLienWhatsapp() {
    const rawNumber = activeCart?.whatsapp || '221777202086'
    const digits = rawNumber.replace(/\D/g, '')
    const clean = digits.length === 9 ? '221' + digits : (digits || '221777202086')
    return `https://wa.me/${clean}?text=${encodeURIComponent(messageWhatsappGrouped)}`
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
      // Envoyer la commande détaillée avec décomposition des articles
      const formattedItems = items.map(i => ({
        produit_id: (i.produitId || i.id.split('_')[0]).length === 36 ? (i.produitId || i.id.split('_')[0]) : null,
        variante_id: i.varianteId || null,
        nom_produit: i.nom,
        details_variante: i.detailsVariante || null,
        prix_unitaire: i.prix,
        quantite: i.quantite,
      }))

      const res = await fetch(`${backendUrl}/api/comptabilite/${activeBoutiqueId}/commandes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom_produit: items.map(i => `${i.quantite}x ${i.nom}${i.detailsVariante ? ` (${i.detailsVariante})` : ''}`).join(', '),
          prix_unitaire: sousTotal,
          quantite: 1,
          client_nom: clientNom.trim(),
          client_telephone: clientTel.trim(),
          client_adresse: clientAdresse.trim() || undefined,
          methode_paiement: methodePaiement,
          zone_livraison_id: (zoneId && zoneId.length === 36) ? zoneId : undefined,
          frais_livraison: fraisLivraison,
          source: 'web_panier',
          items: formattedItems,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erreur lors de la validation')
        setLoadingCheckout(false)
        return
      }

      if (data.wave_url) {
        clearCart(activeBoutiqueId!)
        window.location.href = data.wave_url
        return
      }

      setCheckoutMode('succes')
      clearCart(activeBoutiqueId!)
    } catch {
      setErrorMsg('Impossible de joindre le serveur')
    } finally {
      setLoadingCheckout(false)
    }
  }

  async function handleCommanderViaWhatsappDirect() {
    setLoadingCheckout(true)
    try {
      const formattedItems = items.map(i => ({
        produit_id: (i.produitId || i.id.split('_')[0]).length === 36 ? (i.produitId || i.id.split('_')[0]) : null,
        variante_id: i.varianteId || null,
        nom_produit: i.nom,
        details_variante: i.detailsVariante || null,
        prix_unitaire: i.prix,
        quantite: i.quantite,
      }))

      await fetch(`${backendUrl}/api/comptabilite/${activeBoutiqueId}/commandes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom_produit: items.map(i => `${i.quantite}x ${i.nom}${i.detailsVariante ? ` (${i.detailsVariante})` : ''}`).join(', '),
          prix_unitaire: sousTotal,
          quantite: 1,
          client_nom: clientNom.trim() || 'Client WhatsApp',
          client_telephone: clientTel.trim() || 'Via WhatsApp',
          client_adresse: clientAdresse.trim() || undefined,
          methode_paiement: methodePaiement,
          zone_livraison_id: (zoneId && zoneId.length === 36) ? zoneId : undefined,
          frais_livraison: fraisLivraison,
          source: 'whatsapp_panier',
          items: formattedItems,
        }),
      }).catch(() => {})
    } finally {
      setLoadingCheckout(false)
      window.open(getLienWhatsapp(), '_blank')
      setCheckoutMode('succes')
      clearCart(activeBoutiqueId!)
    }
  }

  return (
    <div className="drawer-cart-overlay" onClick={closeCart}>
      <div className="drawer-cart-container" onClick={e => e.stopPropagation()}>
        <style jsx global>{`
          .drawer-cart-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            justify-content: flex-end;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(4px);
          }
          .drawer-cart-container {
            width: 100%;
            max-width: 450px;
            background: #fff;
            height: 100%;
            display: flex;
            flex-direction: column;
            box-shadow: -10px 0 30px rgba(0,0,0,0.25);
            animation: slideLeft 0.25s ease-out;
          }
          .mobile-cart-handle {
            display: none;
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
              max-height: 85vh;
              border-top-left-radius: 24px;
              border-top-right-radius: 24px;
              animation: slideUp 0.25s ease-out;
            }
            .mobile-cart-handle {
              display: block;
              width: 40px;
              height: 5px;
              border-radius: 3px;
              background: #cbd5e1;
              margin: 8px auto 4px;
            }
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
          }
        `}</style>

        {/* Header Drawer */}
        <div style={{ padding: '14px 20px 16px', borderBottom: '1px solid #e5e7eb', background: '#fafafa', borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}>
          <div className="mobile-cart-handle" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, color: '#111827', fontWeight: 800 }}>
                🛒 {t('caisse.cart')} — {activeCart.boutiqueNom}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
                {items.length} {t('shop.selectedProductsCountText')}
              </p>
            </div>
            <button
              onClick={closeCart}
              style={{
                width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0',
                border: 'none', fontSize: 16, cursor: 'pointer', color: '#475569',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
              }}
              title={t('common.close')}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Contenu principal Scrollable (Articles + Formulaires) */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          {/* Liste des Articles */}
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {checkoutMode === 'succes' ? (
              /* Modale de notification centrée sur la page web pour la confirmation de demande */
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(4px)',
                zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
              }}>
                <div style={{
                  background: '#ffffff', borderRadius: 20, padding: '32px 24px', width: '100%', maxWidth: 440,
                  textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', display: 'flex',
                  flexDirection: 'column', alignItems: 'center', gap: 16
                }}>
                  <span style={{ fontSize: 60, display: 'block', margin: '0 auto' }}>
                    {methodePaiement === 'credit' ? '💳' : '🎉'}
                  </span>
                  <h3 style={{ margin: 0, fontSize: 20, color: methodePaiement === 'credit' ? '#0369a1' : '#166534', fontWeight: 900 }}>
                    {methodePaiement === 'credit' ? t('caisse.creditRequestSentTitle') : t('caisse.orderSuccessTitle')}
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: '#334155', lineHeight: 1.5 }}>
                    {methodePaiement === 'credit' ? (
                      <>
                        Votre demande d&apos;achat à crédit de <strong style={{ color: '#0284c7', fontSize: 16 }}>{fcfa(totalGlobal)}</strong> auprès de <strong>{activeCart.boutiqueNom}</strong> a été enregistrée avec succès. Le commerçant la validera dans son Carnet client !
                      </>
                    ) : (
                      <>
                        Votre commande a été transmise avec succès au marchand <strong>{activeCart.boutiqueNom}</strong>. Il prendra contact avec vous rapidement pour la livraison !
                      </>
                    )}
                  </p>
                  {methodePaiement === 'credit' && (
                    <p style={{ margin: 0, fontSize: 12.5, color: '#0284c7', background: '#f0f9ff', padding: '10px 14px', borderRadius: 12, border: '1px solid #bae6fd', fontWeight: 600 }}>
                      ℹ️ Votre demande est en attente d&apos;approbation par la boutique. Vous pouvez également contacter le vendeur sur WhatsApp pour confirmation directe.
                    </p>
                  )}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                    <a
                      href={getLienWhatsapp()}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: '100%', padding: '13px 16px', borderRadius: 12, background: '#25D366', color: '#fff',
                        fontWeight: 800, fontSize: 14, textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(37,211,102,0.35)'
                      }}
                    >
                      {t('shop.notifyVendorWhatsApp')}
                    </a>
                    <button
                      onClick={() => { setCheckoutMode('options'); closeCart(); }}
                      style={{ width: '100%', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
                    >
                      {t('common.close')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: 12, paddingBottom: 14, borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f8fafc' }}>
                      <ExternalImg src={item.images?.[0]} alt={item.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
  
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nom}</p>
                      {item.detailsVariante && (
                        <span style={{ display: 'inline-block', fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: 4, fontWeight: 600, marginBottom: 4 }}>
                          {item.detailsVariante}
                        </span>
                      )}
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#C75B00' }}>{fcfa(item.prix)}</span>
                      </div>
                    </div>
  
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f3f4f6', padding: '2px 6px', borderRadius: 8 }}>
                      <button onClick={() => updateQuantity(activeBoutiqueId!, item.id, -1)} style={{ background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer', minWidth: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }} aria-label="Réduire la quantité">-</button>
                      <span style={{ fontSize: 13, fontWeight: 800, minWidth: 18, textAlign: 'center' }}>{item.quantite}</span>
                      <button onClick={() => updateQuantity(activeBoutiqueId!, item.id, 1)} style={{ background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer', minWidth: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }} aria-label="Augmenter la quantité">+</button>
                    </div>
  
                    <button onClick={() => removeFromCart(activeBoutiqueId!, item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, padding: 4 }}>🗑️</button>
                  </div>
                ))}
              </>
            )}
          </div>
  
          {/* Footer avec TOUTES LES OPTIONS d'achat */}
          {items.length > 0 && checkoutMode !== 'succes' && (
            <div style={{ padding: 20, borderTop: '1px solid #e5e7eb', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
            
            {/* Choix zone de livraison */}
            {zones.length > 0 && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{t('shop.deliveryZoneLabel')}</label>
                <select
                  value={zoneId}
                  onChange={e => setZoneId(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, background: '#fff' }}
                >
                  <option value="">{t('shop.freeShopPickup')}</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.nom} ({z.prix > 0 ? fcfa(z.prix) : 'Gratuit'})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Récapitulatif Prix */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                <span>{t('common.subtotal')}</span>
                <span>{fcfa(sousTotal)}</span>
              </div>
              {fraisLivraison > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                  <span>{t('shop.deliveryLabel')}</span>
                  <span>{fcfa(fraisLivraison)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: '#C75B00', borderTop: '1px solid #e5e7eb', paddingTop: 8, marginTop: 2 }}>
                <span>{t('common.total')}</span>
                <span>{fcfa(totalGlobal)}</span>
              </div>
            </div>

            {/* Affichage des Formulaires / Options */}
            {checkoutMode === 'formulaire' ? (
              <form onSubmit={validerCommandeEnLigne} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#fff', border: '1px solid #fed7aa', padding: 14, borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: '#92400e' }}>{t('shop.directOnlineOrder')}</p>
                  <button type="button" onClick={() => setCheckoutMode('options')} style={{ background: 'none', border: 'none', fontSize: 12, color: '#6b7280', cursor: 'pointer' }}>← {t('common.back')}</button>
                </div>

                {errorMsg && <p style={{ margin: 0, color: '#ef4444', fontSize: 12, fontWeight: 600 }}>{errorMsg}</p>}

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: 2 }}>{t('account.fullName')} *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Babacar Ndiaye"
                    value={clientNom}
                    onChange={e => setClientNom(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: 2 }}>{t('common.phone')} *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 77 123 45 67"
                    value={clientTel}
                    onChange={e => setClientTel(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: 2 }}>{t('shop.deliveryAddress')}</label>
                  <input
                    type="text"
                    placeholder="Ex: Sacré-Cœur 3, près du rond-point"
                    value={clientAdresse}
                    onChange={e => setClientAdresse(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: 2 }}>{t('common.paymentMethod')}</label>
                  <select
                    value={methodePaiement}
                    onChange={e => setMethodePaiement(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff' }}
                  >
                    <option value="wave">{t('caisse.paymentWave')}</option>
                    <option value="orange_money">{t('caisse.paymentOrangeMoney')}</option>
                    <option value="especes">{t('caisse.paymentCashOnDelivery')}</option>
                    <option value="credit">{t('caisse.paymentCreditRequest')}</option>
                  </select>
                  {methodePaiement === 'credit' && (
                    <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#0369a1', fontWeight: 600, background: '#e0f2fe', padding: '6px 8px', borderRadius: 6 }}>
                      ℹ️ Votre demande sera transmise au commerçant pour approbation et ajout à votre carnet client.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loadingCheckout}
                  style={{
                    marginTop: 6, background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8,
                    padding: '12px', fontWeight: 800, fontSize: 14, cursor: 'pointer', textAlign: 'center',
                  }}
                >
                  {loadingCheckout ? t('common.pleaseWait') : t('shop.validateAndPayBtn')}
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {t('shop.chooseOrderMode')}
                </p>

                {/* Option 1: WhatsApp */}
                <button
                  type="button"
                  onClick={handleCommanderViaWhatsappDirect}
                  disabled={loadingCheckout}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 14px',
                    fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 3px 10px rgba(37,211,102,.25)', width: '100%'
                  }}
                >
                  <span>💬</span> {t('shop.orderViaWhatsAppDirect')}
                </button>

                {/* Option 2: Formulaire en Ligne Direct */}
                <button
                  type="button"
                  onClick={() => setCheckoutMode('formulaire')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 14px',
                    fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 3px 10px rgba(28,43,74,.25)',
                  }}
                >
                  <span>📋</span> {t('shop.onlineFormOption')}
                </button>

                {/* Option 3: Appeler la boutique */}
                <a
                  href={`tel:${(activeCart.whatsapp || '777202086').replace(/\D/g, '')}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 10, padding: '10px 14px',
                    fontWeight: 700, fontSize: 13, textDecoration: 'none', textAlign: 'center',
                  }}
                >
                  <span>📞</span> {t('shop.callSellerDirect')}
                </a>
              </div>
            )}

          </div>
        )}
        </div>
      </div>
    </div>
  )
}
