'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Calculator, BadgePercent } from 'lucide-react'

interface Props {
  prixTafTaf?: number
}

export default function MerchantRoiSimulator({ prixTafTaf = 2500 }: Props) {
  const [caMensuel, setCaMensuel] = useState<number>(1200000)
  const commissionClassique = Math.round(caMensuel * 0.12) // 12% moyenne plateformes
  const coutNopalou = prixTafTaf
  const economieCommercant = commissionClassique - coutNopalou

  return (
    <div>
      {/* En-tête de section rentabilité */}
      <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 28px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#DCFCE7',
            color: '#15803D',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 11.5,
            fontWeight: 900,
            marginBottom: 8
          }}
        >
          <BadgePercent size={13} />
          <span>0% DE COMMISSION • 30 JOURS 100% OFFERTS SANS ENGAGEMENT</span>
        </div>

        <h2
          style={{
            fontSize: 'clamp(22px, 2.5vw, 30px)',
            fontWeight: 900,
            color: 'var(--navy, #1C2B4A)',
            margin: '0 0 6px',
            letterSpacing: '-0.02em'
          }}
        >
          Rentabilité Immédiate &amp; Tarifs Sans Frais Cachés
        </h2>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.5 }}>
          Calculez précisément ce que vous économisez avec le 0% de commission, puis choisissez le forfait adapté à votre taille.
        </p>
      </div>

      {/* Boîte interactive du Simulateur */}
      <div
        style={{
          background: '#F8FAFC',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          padding: '20px',
          marginBottom: 32
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'var(--accent, #C75B00)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Calculator size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              Simulateur de Gains : Comparez Nopalou aux Plateformes Traditionnelles
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text2, #5A4E42)' }}>
              Les marketplaces prélèvent entre 10% et 15% sur votre chiffre d&apos;affaires. Sur Nopalou, vous gardez 100%.
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            alignItems: 'center'
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
              Votre chiffre d&apos;affaires mensuel estimé :
            </label>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent, #C75B00)', marginBottom: 8 }}>
              {caMensuel.toLocaleString('fr-FR')} FCFA / mois
            </div>
            <input
              type="range"
              min={200000}
              max={5000000}
              step={100000}
              value={caMensuel}
              onChange={(e) => setCaMensuel(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent, #C75B00)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginTop: 4 }}>
              <span>200 000 F</span>
              <span>2 500 000 F</span>
              <span>5 000 000 F</span>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: '14px 18px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: '#DC2626' }}>Commission prélevée ailleurs (12%) :</span>
              <strong style={{ color: '#DC2626' }}>- {commissionClassique.toLocaleString('fr-FR')} F</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12 }}>
              <span style={{ color: '#16A34A' }}>Abonnement Nopalou Taf-Taf :</span>
              <strong style={{ color: '#16A34A' }}>{coutNopalou.toLocaleString('fr-FR')} F (Fixe)</strong>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text2, #5A4E42)', textTransform: 'uppercase' }}>
                  Gain net conservé dans votre poche :
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#16A34A' }}>
                  + {economieCommercant.toLocaleString('fr-FR')} FCFA / mois
                </div>
              </div>

              <Link
                href="/creer-boutique"
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: '#16A34A',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 900,
                  textDecoration: 'none'
                }}
              >
                En profiter →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
