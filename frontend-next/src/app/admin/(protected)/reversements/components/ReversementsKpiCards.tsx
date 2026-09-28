import React from 'react'
import { Wallet, Clock, ShieldCheck } from 'lucide-react'

interface ReversementsKpiCardsProps {
  totalNetGlobal: number
  totalCommandes: number
  totalCommissionsGlobal: number
}

export function ReversementsKpiCards({
  totalNetGlobal,
  totalCommandes,
  totalCommissionsGlobal,
}: ReversementsKpiCardsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          padding: '18px 20px',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Total Net à Reverser
          </span>
          <Wallet size={18} color="#0A5C36" />
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#0A5C36' }}>
          {totalNetGlobal.toLocaleString('fr-FR')} FCFA
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
          Net vendeur après déduction des commissions et frais Wave (2%)
        </div>
      </div>

      <div
        style={{
          background: '#ffffff',
          padding: '18px 20px',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Commandes en Attente
          </span>
          <Clock size={18} color="#1d4ed8" />
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#1e293b' }}>
          {totalCommandes} commande(s)
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
          Encaissements Wave confirmés prêts pour le reversement
        </div>
      </div>

      <div
        style={{
          background: '#ffffff',
          padding: '18px 20px',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Commissions Nopalou Retenues
          </span>
          <ShieldCheck size={18} color="#C75B00" />
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#C75B00' }}>
          {totalCommissionsGlobal.toLocaleString('fr-FR')} FCFA
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
          Revenus de commissions acquis pour la plateforme
        </div>
      </div>
    </div>
  )
}
