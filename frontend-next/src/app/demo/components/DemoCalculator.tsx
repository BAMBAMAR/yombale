import React from 'react'
import { Calculator } from 'lucide-react'

interface DemoCalculatorProps {
  tauxCommissionPourcent: number
  labelPro: string
  prixPro: number
  nbBoutiquesPro: number
  onNbBoutiquesProChange: (val: number) => void
  commissionProParUnite: number
  labelBusiness: string
  prixBusiness: number
  nbBoutiquesBusiness: number
  onNbBoutiquesBusinessChange: (val: number) => void
  commissionBusinessParUnite: number
  commissionMensuelle: number
  commissionAnnuelle: number
  onBecomeApporteur: () => void
}

export default function DemoCalculator({
  tauxCommissionPourcent,
  labelPro,
  prixPro,
  nbBoutiquesPro,
  onNbBoutiquesProChange,
  commissionProParUnite,
  labelBusiness,
  prixBusiness,
  nbBoutiquesBusiness,
  onNbBoutiquesBusinessChange,
  commissionBusinessParUnite,
  commissionMensuelle,
  commissionAnnuelle,
  onBecomeApporteur
}: DemoCalculatorProps) {
  return (
    <section
      style={{
        background: 'var(--card)',
        borderRadius: 12,
        padding: '28px 20px',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        boxShadow: 'var(--shadow)'
      }}
    >
      <div>
        <span
          style={{
            background: '#CCFBF1',
            color: '#0D9488',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5
          }}
        >
          <Calculator size={13} />
          <span>SIMULATEUR DE REVENUS PASSIFS DYNAMIQUE ({tauxCommissionPourcent}% COMMISSION)</span>
        </span>
        <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 900, color: 'var(--navy)', margin: '8px 0 4px 0' }}>
          Combien pouvez-vous gagner en tant qu&apos;Apporteur ?
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}>
          Déplacez les curseurs pour calculer vos commissions récurrentes mensuelles calculées en direct.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, alignItems: 'center' }}>
        {/* Sliders */}
        <div
          style={{
            background: 'var(--bg)',
            padding: 16,
            borderRadius: 10,
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--navy)', marginBottom: 4 }}>
              <span>{labelPro} ({prixPro.toLocaleString()} FCFA/m) :</span>
              <strong style={{ color: 'var(--accent)' }}>{nbBoutiquesPro} boutiques</strong>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={nbBoutiquesPro}
              onChange={e => onNbBoutiquesProChange(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
              Commission {tauxCommissionPourcent}% = {commissionProParUnite.toLocaleString()} FCFA / boutique / mois
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--navy)', marginBottom: 4 }}>
              <span>{labelBusiness} ({prixBusiness.toLocaleString()} FCFA/m) :</span>
              <strong style={{ color: '#0D9488' }}>{nbBoutiquesBusiness} boutiques</strong>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={nbBoutiquesBusiness}
              onChange={e => onNbBoutiquesBusinessChange(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
              Commission {tauxCommissionPourcent}% = {commissionBusinessParUnite.toLocaleString()} FCFA / boutique / mois
            </div>
          </div>
        </div>

        {/* Results Box */}
        <div
          style={{
            background: 'var(--navy)',
            padding: 20,
            borderRadius: 10,
            border: '1px solid var(--navy)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            color: '#FFFFFF'
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
              Vos Commissions Mensuelles Récurrentes
            </span>
            <div style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, color: '#10B981', marginTop: 4 }}>
              {commissionMensuelle.toLocaleString()} FCFA{' '}
              <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 400 }}>/ mois</span>
            </div>
          </div>

          <div style={{ background: '#0F172A', padding: 10, borderRadius: 8, fontSize: 12, color: '#CBD5E1' }}>
            Chaque année : <strong style={{ color: '#F59E0B' }}>{commissionAnnuelle.toLocaleString()} FCFA</strong> de revenus passifs récurrents.
          </div>

          <button
            type="button"
            onClick={onBecomeApporteur}
            style={{
              background: '#10B981',
              color: '#020617',
              border: 'none',
              padding: '11px 18px',
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Devenir Apporteur Maintenant
          </button>
        </div>
      </div>
    </section>
  )
}
