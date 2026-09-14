'use client'
import React from 'react'
import { fcfa } from '@/lib/format'
import { useTranslation } from '@/i18n/context'
import { CheckCircle, CreditCard, MessageCircle, AlertCircle } from 'lucide-react'
import { OrderSuccessData } from './types'

interface DrawerCartSuccessModalProps {
  orderSuccessData: OrderSuccessData
  onClose: () => void
}

export default function DrawerCartSuccessModal({
  orderSuccessData,
  onClose,
}: DrawerCartSuccessModalProps) {
  const { t } = useTranslation()
  const isCredit = orderSuccessData.methodePaiement === 'credit'
  const isWa = orderSuccessData.methodePaiement === 'whatsapp'

  const waMsgSuccess = `Bonjour ${orderSuccessData.boutiqueNom} ! Je viens de valider ma commande réf: *${orderSuccessData.reference}* d'un montant de *${fcfa(orderSuccessData.total)}* sur votre boutique Nopalou.\n\nPouvons-nous confirmer les détails de livraison ?`
  const waLinkDirect = `https://wa.me/${(orderSuccessData.whatsapp || '221777202086').replace(/\D/g, '')}?text=${encodeURIComponent(waMsgSuccess)}`

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28,43,74,0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: '32px 26px',
          width: '100%',
          maxWidth: 480,
          textAlign: 'center',
          boxShadow: '0 25px 60px -12px rgba(28,43,74,0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          animation: 'fadeInScale 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style jsx global>{`
          @keyframes fadeInScale {
            from {
              transform: scale(0.92);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>

        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: isCredit ? '#e0f2fe' : isWa ? '#dcfce7' : '#ecfdf5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isCredit
              ? '0 8px 20px rgba(2,132,199,0.2)'
              : '0 8px 20px rgba(22,163,74,0.2)',
          }}
        >
          {isCredit ? (
            <CreditCard size={36} color="#0284c7" />
          ) : isWa ? (
            <MessageCircle size={36} color="#16a34a" />
          ) : (
            <CheckCircle size={36} color="#059669" />
          )}
        </div>

        <div>
          <span
            style={{
              display: 'inline-block',
              fontSize: 12,
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: 20,
              background: '#f1f5f9',
              color: '#475569',
              marginBottom: 8,
              letterSpacing: '0.04em',
            }}
          >
            RÉF : {orderSuccessData.reference}
          </span>
          <h3
            style={{
              margin: '2px 0 6px',
              fontSize: 21,
              fontWeight: 900,
              color: isCredit ? '#0369a1' : isWa ? '#15803d' : '#166534',
            }}
          >
            {isCredit
              ? t('caisse.creditRequestSentTitle')
              : isWa
              ? 'Commande transmise sur WhatsApp !'
              : t('caisse.orderSuccessTitle')}
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: '#334155', lineHeight: 1.5 }}>
            {isCredit ? (
              <>
                Votre demande d&apos;achat à crédit de{' '}
                <strong style={{ color: '#0284c7', fontSize: 15 }}>
                  {fcfa(orderSuccessData.total)}
                </strong>{' '}
                auprès de <strong>{orderSuccessData.boutiqueNom}</strong> a été enregistrée avec
                succès. Le commerçant la validera dans son Carnet client !
              </>
            ) : (
              <>
                Votre commande auprès de <strong>{orderSuccessData.boutiqueNom}</strong> a été
                transmise avec succès ! Le vendeur prendra contact avec vous très vite pour la
                livraison.
              </>
            )}
          </p>
        </div>

        {/* Récapitulatif Box */}
        <div
          style={{
            width: '100%',
            background: 'var(--bg, #F8F5F0)',
            border: '1px solid var(--border, #E8DDD2)',
            borderRadius: 14,
            padding: '14px 16px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              color: 'var(--text2, #6B5E52)',
            }}
          >
            <span>Boutique</span>
            <strong style={{ color: 'var(--navy, #1C2B4A)' }}>
              {orderSuccessData.boutiqueNom}
            </strong>
          </div>
          {orderSuccessData.codePromo && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                color: '#16a34a',
                fontWeight: 700,
              }}
            >
              <span>Code promo ({orderSuccessData.codePromo})</span>
              <span>-{fcfa(orderSuccessData.reduction)}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 15,
              fontWeight: 900,
              color: 'var(--accent, #C75B00)',
              borderTop: '1px solid var(--border, #E8DDD2)',
              paddingTop: 6,
              marginTop: 2,
            }}
          >
            <span>Total {isCredit ? 'à inscrire' : 'à régler'}</span>
            <span>{fcfa(orderSuccessData.total)}</span>
          </div>
        </div>

        {isCredit && (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: '#0284c7',
              background: '#f0f9ff',
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid #bae6fd',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>
              Votre demande est en attente d&apos;approbation par la boutique. Vous pouvez également
              contacter le commerçant sur WhatsApp pour confirmation directe.
            </span>
          </p>
        )}

        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginTop: 6,
          }}
        >
          <a
            href={waLinkDirect}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 14,
              background: '#22c55e',
              color: '#fff',
              fontWeight: 900,
              fontSize: 15,
              textDecoration: 'none',
              textAlign: 'center',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(34,197,94,0.35)',
            }}
          >
            <MessageCircle size={18} />
            <span>{t('shop.notifyVendorWhatsApp')}</span>
          </a>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              background: 'var(--navy, #1C2B4A)',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              padding: '13px 20px',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
