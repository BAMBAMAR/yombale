'use client'

import React from 'react'
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Circle,
  Info,
  Globe2,
} from 'lucide-react'
import { fcfa, getMontantDevise } from './types'

interface CommanderPaymentSectionProps {
  paiement: string
  setPaiement: (mode: string) => void
  deviseStripe: 'EUR' | 'USD' | 'XOF'
  setDeviseStripe: (devise: 'EUR' | 'USD' | 'XOF') => void
  cardNumber: string
  setCardNumber: (val: string) => void
  cardExp: string
  setCardExp: (val: string) => void
  cardCvc: string
  setCardCvc: (val: string) => void
  total: number
}

const MODES_PAIEMENT = [
  { value: 'wave', label: 'Wave', badge: 'Pay Safe Séquestre', activeClass: 'active-wave' },
  { value: 'cash', label: 'Espèces', badge: 'À la livraison', activeClass: 'active-cash' },
  { value: 'manuel', label: 'Wave / OM Manuel', badge: 'Pay Safe Séquestre', activeClass: 'active-om' },
  { value: 'credit', label: 'Achat à Crédit', badge: 'Carnet Client', activeClass: 'active-wave' },
  { value: 'carte_bancaire', label: 'Carte Bancaire', badge: 'Stripe International', activeClass: 'active-wave' },
]

export default function CommanderPaymentSection({
  paiement,
  setPaiement,
  deviseStripe,
  setDeviseStripe,
  cardNumber,
  setCardNumber,
  cardExp,
  setCardExp,
  cardCvc,
  setCardCvc,
  total,
}: CommanderPaymentSectionProps) {
  return (
    <div>
      <label className="npl-label-airy" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <CreditCard size={16} color="var(--accent, #C75B00)" />
        <span>3. Mode de Paiement</span>
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        {MODES_PAIEMENT.map(m => {
          const isSelected = paiement === m.value
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setPaiement(m.value)}
              className={`npl-tile-payment ${isSelected ? m.activeClass : ''}`}
              style={{ textAlign: 'left' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isSelected ? (
                  <CheckCircle2 size={18} color="var(--accent, #C75B00)" />
                ) : (
                  <Circle size={18} color="#94a3b8" />
                )}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>{m.label}</div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{m.badge}</div>
              </div>
            </button>
          )
        })}
      </div>

      <div
        style={{
          marginTop: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 12,
          padding: '10px 14px',
        }}
      >
        <ShieldCheck size={20} color="#166534" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.4 }}>
          <strong>Protection Nopalou Pay Safe incluse :</strong> vos fonds restent sécurisés sous séquestre et ne sont transmis au vendeur que lorsque vous confirmez la bonne réception de votre colis.
        </div>
      </div>

      {paiement === 'credit' && (
        <div
          style={{
            marginTop: 8,
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 12,
            color: '#0369a1',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Info size={16} color="#0369a1" style={{ flexShrink: 0 }} />
          <span>Votre demande d&apos;achat à crédit sera transmise directement au commerçant pour inscription dans son Carnet client.</span>
        </div>
      )}

      {paiement === 'carte_bancaire' && (
        <div
          style={{
            marginTop: 10,
            background: '#f8fafc',
            border: '1.5px solid #cbd5e1',
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: 10,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CreditCard size={18} color="var(--accent, #C75B00)" />
              <span>Paiement Carte Bancaire International (Diaspora)</span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#166534',
                background: '#dcfce7',
                padding: '2px 8px',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <ShieldCheck size={13} />
              <span>Stripe 3D-Secure</span>
            </span>
          </div>

          {/* Sélecteur de Devise Diaspora */}
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 6,
              }}
            >
              <Globe2 size={13} color="var(--accent, #C75B00)" />
              <span>Devise de Facturation</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { code: 'EUR' as const, label: 'Euro (€)', desc: 'Europe' },
                { code: 'USD' as const, label: 'Dollar ($)', desc: 'USA / Monde' },
                { code: 'XOF' as const, label: 'FCFA', desc: 'UEMOA' },
              ].map(d => {
                const isCurSelected = deviseStripe === d.code
                return (
                  <button
                    key={d.code}
                    type="button"
                    onClick={() => setDeviseStripe(d.code)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: isCurSelected ? '2px solid var(--accent, #C75B00)' : '1px solid #cbd5e1',
                      background: isCurSelected ? '#fff7ed' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: isCurSelected ? '#9a3412' : '#1e293b' }}>
                      {d.label}
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{d.desc}</div>
                  </button>
                )
              })}
            </div>

            {/* Parité & Montant Final Débité */}
            <div
              style={{
                marginTop: 8,
                background: '#f1f5f9',
                borderRadius: 8,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
              }}
            >
              <span style={{ color: '#475569' }}>
                {deviseStripe === 'EUR' && 'Taux fixe officiel : 1 EUR = 655,957 FCFA'}
                {deviseStripe === 'USD' && 'Taux de référence : 1 USD ≈ 600 FCFA'}
                {deviseStripe === 'XOF' && 'Monnaie locale FCFA sans conversion'}
              </span>
              <span style={{ fontWeight: 900, color: 'var(--accent, #C75B00)', fontSize: 13 }}>
                {deviseStripe === 'EUR' && `${getMontantDevise(total, 'EUR')} €`}
                {deviseStripe === 'USD' && `${getMontantDevise(total, 'USD')} $`}
                {deviseStripe === 'XOF' && fcfa(total)}
              </span>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
              Numéro de carte
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={e => setCardNumber(e.target.value)}
              className="commander-premium-input"
              style={{ fontFamily: 'monospace' }}
              placeholder="4242 4242 4242 4242"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
                Expiration (MM/AA)
              </label>
              <input
                type="text"
                value={cardExp}
                onChange={e => setCardExp(e.target.value)}
                className="commander-premium-input"
                style={{ fontFamily: 'monospace' }}
                placeholder="12/28"
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
                CVC
              </label>
              <input
                type="text"
                value={cardCvc}
                onChange={e => setCardCvc(e.target.value)}
                className="commander-premium-input"
                style={{ fontFamily: 'monospace' }}
                placeholder="123"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
