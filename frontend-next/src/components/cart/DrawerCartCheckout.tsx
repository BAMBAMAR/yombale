'use client'
import React from 'react'
import { fcfa } from '@/lib/format'
import { useTranslation } from '@/i18n/context'
import {
  MapPin, Zap, CreditCard, MessageCircle, Phone, Check
} from 'lucide-react'
import { Zone } from './types'
import DrawerCartPromoCode from './DrawerCartPromoCode'
import DrawerCartSummary from './DrawerCartSummary'
import DrawerCartOnlineOrderForm from './DrawerCartOnlineOrderForm'

interface DrawerCartCheckoutProps {
  zones: Zone[]
  zoneId: string
  setZoneId: (id: string) => void
  codePromo: string
  setCodePromo: (val: string) => void
  promoApplique: { code: string; reduction: number; type_remise?: string; message?: string } | null
  promoLoading: boolean
  promoError: string | null
  appliquerCodePromo: () => void
  retirerCodePromo: () => void
  sousTotal: number
  reductionMontant: number
  fraisLivraison: number
  totalGlobal: number
  checkoutMode: 'whatsapp' | 'formulaire'
  setCheckoutMode: (mode: 'whatsapp' | 'formulaire') => void
  handleCommanderViaWhatsappDirect: () => void
  validerCommandeEnLigne: (e: React.FormEvent) => void
  loadingCheckout: boolean
  whatsappNumber?: string | null
  clientNom: string
  setClientNom: (val: string) => void
  clientTel: string
  setClientTel: (val: string) => void
  clientAdresse: string
  setClientAdresse: (val: string) => void
  methodePaiement: string
  setMethodePaiement: (val: string) => void
  errorMsg: string | null
  boutiqueId?: string
  onFormuleChoisie?: (val: any) => void
}

export default function DrawerCartCheckout({
  zones,
  zoneId,
  setZoneId,
  codePromo,
  setCodePromo,
  promoApplique,
  promoLoading,
  promoError,
  appliquerCodePromo,
  retirerCodePromo,
  sousTotal,
  reductionMontant,
  fraisLivraison,
  totalGlobal,
  checkoutMode,
  setCheckoutMode,
  handleCommanderViaWhatsappDirect,
  validerCommandeEnLigne,
  loadingCheckout,
  whatsappNumber,
  clientNom,
  setClientNom,
  clientTel,
  setClientTel,
  clientAdresse,
  setClientAdresse,
  methodePaiement,
  setMethodePaiement,
  errorMsg,
  boutiqueId,
  onFormuleChoisie,
}: DrawerCartCheckoutProps) {
  const { t } = useTranslation()

  return (
    <div
      style={{
        padding: '16px 20px 24px',
        borderTop: '1px solid var(--border, #E8DDD2)',
        background: 'var(--bg, #F8F5F0)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        marginTop: 'auto',
      }}
    >
      {/* Choix zone de livraison */}
      {zones.length > 0 && (
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--text1, #1A1612)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 6,
            }}
          >
            <MapPin size={14} color="var(--accent, #C75B00)" />
            <span>{t('shop.deliveryZoneLabel')}</span>
          </label>
          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="input-npl"
            style={{
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nom} ({Number(z.prix) > 0 ? fcfa(Number(z.prix)) : t('shop.freeShopPickup')})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Code promotionnel */}
      <DrawerCartPromoCode
        codePromo={codePromo}
        setCodePromo={setCodePromo}
        promoApplique={promoApplique}
        promoLoading={promoLoading}
        promoError={promoError}
        onApply={appliquerCodePromo}
        onRemove={retirerCodePromo}
      />

      {/* Récapitulatif financier */}
      <DrawerCartSummary
        sousTotal={sousTotal}
        reductionMontant={reductionMontant}
        fraisLivraison={fraisLivraison}
        totalGlobal={totalGlobal}
        promoCode={promoApplique?.code}
      />

      {/* SÉLECTEUR D'ONGLETS / MODE DE COMMANDE */}
      <div>
        <p
          style={{
            margin: '0 0 10px',
            fontSize: 12,
            fontWeight: 800,
            color: 'var(--text2, #6B5E52)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Zap size={14} style={{ color: 'var(--accent, #C75B00)' }} />
          <span>{t('shop.chooseOrderMode')} :</span>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {/* Onglet 1: WhatsApp Direct */}
          <button
            type="button"
            onClick={() => setCheckoutMode('whatsapp')}
            className={`cart-mode-card ${checkoutMode === 'whatsapp' ? 'active-wa' : ''}`}
            style={{
              padding: '12px',
              borderRadius: 12,
              border:
                checkoutMode === 'whatsapp'
                  ? '2px solid #16a34a'
                  : '1.5px solid var(--border, #E8DDD2)',
              background: checkoutMode === 'whatsapp' ? '#f0fdf4' : '#ffffff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              boxShadow:
                checkoutMode === 'whatsapp' ? '0 2px 8px rgba(22,163,74,0.15)' : 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 6,
                  background: checkoutMode === 'whatsapp' ? '#16a34a' : 'var(--bg, #F8F5F0)',
                  color: checkoutMode === 'whatsapp' ? '#ffffff' : 'var(--text2, #6B5E52)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Zap size={10} />
                <span>1-CLIC</span>
              </span>
              <span
                style={{
                  fontSize: 11,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: checkoutMode === 'whatsapp' ? '#16a34a' : 'transparent',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  border:
                    checkoutMode === 'whatsapp' ? 'none' : '1.5px solid #cbd5e1',
                }}
              >
                {checkoutMode === 'whatsapp' ? <Check size={11} strokeWidth={3} /> : ''}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageCircle
                size={20}
                style={{ color: checkoutMode === 'whatsapp' ? '#16a34a' : 'var(--text2)' }}
              />
              <div>
                <strong
                  style={{
                    fontSize: 13,
                    color: checkoutMode === 'whatsapp' ? '#15803d' : 'var(--navy, #1C2B4A)',
                    display: 'block',
                  }}
                >
                  WhatsApp
                </strong>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: checkoutMode === 'whatsapp' ? '#166534' : 'var(--text2, #6B5E52)',
                  }}
                >
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
              padding: '12px',
              borderRadius: 12,
              border:
                checkoutMode === 'formulaire'
                  ? '2px solid var(--accent, #C75B00)'
                  : '1.5px solid var(--border, #E8DDD2)',
              background: checkoutMode === 'formulaire' ? '#fff7ed' : '#ffffff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              boxShadow:
                checkoutMode === 'formulaire' ? '0 2px 8px rgba(199,91,0,0.15)' : 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 6,
                  background:
                    checkoutMode === 'formulaire'
                      ? 'var(--accent, #C75B00)'
                      : 'var(--bg, #F8F5F0)',
                  color: checkoutMode === 'formulaire' ? '#ffffff' : 'var(--text2, #6B5E52)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <CreditCard size={10} />
                <span>PAIEMENT</span>
              </span>
              <span
                style={{
                  fontSize: 11,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background:
                    checkoutMode === 'formulaire' ? 'var(--accent, #C75B00)' : 'transparent',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  border:
                    checkoutMode === 'formulaire' ? 'none' : '1.5px solid #cbd5e1',
                }}
              >
                {checkoutMode === 'formulaire' ? <Check size={11} strokeWidth={3} /> : ''}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard
                size={20}
                style={{ color: checkoutMode === 'formulaire' ? 'var(--accent)' : 'var(--text2)' }}
              />
              <div>
                <strong
                  style={{
                    fontSize: 13,
                    color:
                      checkoutMode === 'formulaire'
                        ? 'var(--accent, #C75B00)'
                        : 'var(--navy, #1C2B4A)',
                    display: 'block',
                  }}
                >
                  En Ligne
                </strong>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: checkoutMode === 'formulaire' ? '#c2410c' : 'var(--text2, #6B5E52)',
                  }}
                >
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '14px 16px',
              fontWeight: 900,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(22,163,74,.35)',
              width: '100%',
              transition: 'background 0.15s ease',
            }}
          >
            <MessageCircle size={18} />
            <span>
              {t('shop.orderViaWhatsAppDirect')} ({fcfa(totalGlobal)}) →
            </span>
          </button>

          {whatsappNumber && (
            <a
              href={`tel:${whatsappNumber.replace(/\D/g, '')}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: '#fff',
                color: 'var(--text2, #6B5E52)',
                border: '1.5px solid var(--border, #E8DDD2)',
                borderRadius: 12,
                padding: '10px 14px',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              <Phone size={15} />
              <span>{t('shop.callSellerDirect')}</span>
            </a>
          )}
        </div>
      ) : (
        <DrawerCartOnlineOrderForm
          clientNom={clientNom}
          setClientNom={setClientNom}
          clientTel={clientTel}
          setClientTel={setClientTel}
          clientAdresse={clientAdresse}
          setClientAdresse={setClientAdresse}
          methodePaiement={methodePaiement}
          setMethodePaiement={setMethodePaiement}
          errorMsg={errorMsg}
          loadingCheckout={loadingCheckout}
          totalGlobal={totalGlobal}
          onSubmit={validerCommandeEnLigne}
        />
      )}
    </div>
  )
}
