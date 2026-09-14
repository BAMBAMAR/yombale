import React from 'react'
import { UserCheck } from 'lucide-react'

interface KitComAgentIdentityProps {
  nomAgent: string
  onNomAgentChange: (val: string) => void
  phoneAgent: string
  onPhoneAgentChange: (val: string) => void
  codeAgent: string
  onCodeAgentChange: (val: string) => void
}

export default function KitComAgentIdentity({
  nomAgent,
  onNomAgentChange,
  phoneAgent,
  onPhoneAgentChange,
  codeAgent,
  onCodeAgentChange
}: KitComAgentIdentityProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        padding: '24px',
        marginBottom: 32,
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <UserCheck size={20} color="var(--accent, #C75B00)" />
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#0f172a' }}>Identité Apporteur</h3>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Personnalisez les scripts avec vos informations.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Votre Prénom</label>
          <input
            type="text"
            placeholder="Ex: Modou"
            value={nomAgent}
            onChange={e => onNomAgentChange(e.target.value)}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Numéro WhatsApp</label>
          <div style={{ display: 'flex' }}>
            <span
              style={{
                background: '#e2e8f0',
                border: '1px solid #cbd5e1',
                borderRight: 'none',
                padding: '10px 12px',
                borderRadius: '8px 0 0 8px',
                fontSize: 14,
                color: '#475569',
                fontWeight: 600
              }}
            >
              +221
            </span>
            <input
              type="text"
              placeholder="708717942"
              value={phoneAgent}
              onChange={e => onPhoneAgentChange(e.target.value)}
              style={{
                flex: 1,
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '0 8px 8px 0',
                padding: '10px 14px',
                fontSize: 14,
                outline: 'none',
                minWidth: 0,
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Code Promo</label>
          <input
            type="text"
            placeholder="Ex: MODOU20"
            value={codeAgent}
            onChange={e => onCodeAgentChange(e.target.value.toUpperCase())}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 14,
              outline: 'none',
              fontWeight: 700,
              color: '#C75B00',
              fontFamily: 'inherit'
            }}
          />
        </div>
      </div>
    </div>
  )
}
