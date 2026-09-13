'use client'
import React from 'react'
import { fcfa } from '@/lib/format'
import { useTranslation } from '@/i18n/context'
import { AlertCircle } from 'lucide-react'

interface DrawerCartOnlineOrderFormProps {
  clientNom: string
  setClientNom: (val: string) => void
  clientTel: string
  setClientTel: (val: string) => void
  clientAdresse: string
  setClientAdresse: (val: string) => void
  methodePaiement: string
  setMethodePaiement: (val: string) => void
  errorMsg: string | null
  loadingCheckout: boolean
  totalGlobal: number
  onSubmit: (e: React.FormEvent) => void
}

const PAYMENT_METHODS = [
  { value: 'wave', label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'especes', label: 'Espèces' },
  { value: 'credit', label: 'Carnet Crédit' },
]

export default function DrawerCartOnlineOrderForm({
  clientNom,
  setClientNom,
  clientTel,
  setClientTel,
  clientAdresse,
  setClientAdresse,
  methodePaiement,
  setMethodePaiement,
  errorMsg,
  loadingCheckout,
  totalGlobal,
  onSubmit,
}: DrawerCartOnlineOrderFormProps) {
  const { t } = useTranslation()

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        background: '#fff',
        border: '1.5px solid var(--border, #E8DDD2)',
        padding: 14,
        borderRadius: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontWeight: 900,
            fontSize: 13,
            color: 'var(--navy, #1C2B4A)',
          }}
        >
          {t('shop.directOnlineOrder')}
        </p>
        <span style={{ fontSize: 11, color: 'var(--text3, #9C8E84)', fontWeight: 600 }}>
          Remplissez vos infos ci-dessous
        </span>
      </div>

      {errorMsg && (
        <p
          style={{
            margin: 0,
            color: '#dc2626',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </p>
      )}

      <div>
        <label
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: 'var(--text2, #6B5E52)',
            display: 'block',
            marginBottom: 2,
          }}
        >
          {t('account.fullName')} *
        </label>
        <input
          type="text"
          required
          placeholder="Ex: Babacar Ndiaye"
          value={clientNom}
          onChange={(e) => setClientNom(e.target.value)}
          className="input-npl"
        />
      </div>

      <div>
        <label
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: 'var(--text2, #6B5E52)',
            display: 'block',
            marginBottom: 2,
          }}
        >
          {t('common.phone')} *
        </label>
        <input
          type="tel"
          required
          placeholder="Ex: 77 123 45 67"
          value={clientTel}
          onChange={(e) => setClientTel(e.target.value)}
          className="input-npl"
        />
      </div>

      <div>
        <label
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: 'var(--text2, #6B5E52)',
            display: 'block',
            marginBottom: 2,
          }}
        >
          {t('shop.deliveryAddress')}
        </label>
        <input
          type="text"
          placeholder="Ex: Sacré-Cœur 3, près du rond-point"
          value={clientAdresse}
          onChange={(e) => setClientAdresse(e.target.value)}
          className="input-npl"
        />
      </div>

      <div>
        <label
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: 'var(--text2, #6B5E52)',
            display: 'block',
            marginBottom: 4,
          }}
        >
          {t('common.paymentMethod')}
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {PAYMENT_METHODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setMethodePaiement(p.value)}
              className={`payment-chip-btn ${methodePaiement === p.value ? 'selected' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 10px',
                borderRadius: 8,
                border:
                  methodePaiement === p.value
                    ? '1.5px solid var(--accent, #C75B00)'
                    : '1px solid var(--border, #E8DDD2)',
                background:
                  methodePaiement === p.value ? 'var(--orange2, #FFF3E8)' : '#ffffff',
                color:
                  methodePaiement === p.value
                    ? 'var(--accent, #C75B00)'
                    : 'var(--text1, #1A1612)',
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  border: '1.5px solid currentColor',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: methodePaiement === p.value ? 'currentColor' : 'transparent',
                }}
              />
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {methodePaiement === 'credit' && (
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 11.5,
              color: '#0369a1',
              fontWeight: 600,
              background: '#e0f2fe',
              padding: '6px 8px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>
              Votre demande sera transmise au commerçant pour inscription au Carnet client.
            </span>
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loadingCheckout}
        className="btn-npl btn-npl-primary btn-npl-lg"
        style={{
          marginTop: 6,
          width: '100%',
          fontSize: 14.5,
        }}
      >
        {loadingCheckout
          ? t('common.pleaseWait')
          : `${t('shop.validateAndPayBtn')} • ${fcfa(totalGlobal)} →`}
      </button>
    </form>
  )
}
