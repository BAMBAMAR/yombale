'use client'
import { useFormState, useFormStatus } from 'react-dom'
import { activerPlanTest, type ActionState } from './actions'

function Btn() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} style={{
      padding: '9px 20px', background: pending ? '#94a3b8' : '#16a34a',
      color: '#fff', border: 'none', borderRadius: 8,
      fontWeight: 700, fontSize: 14, cursor: pending ? 'not-allowed' : 'pointer',
    }}>
      {pending ? 'Activation…' : '✅ Activer'}
    </button>
  )
}

const inp = {
  padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8,
  fontSize: 14, background: '#fff',
} as const

export default function ActiverPlanClient() {
  const [state, action] = useFormState<ActionState, FormData>(activerPlanTest, {})

  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 32,
    }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🧪 Activer un plan test (sans paiement)</h2>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
        Crée un abonnement Pro ou Business directement en base — utile pour tester les fonctionnalités.
      </p>

      {state.success && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', color: '#16a34a', fontWeight: 600, marginBottom: 12 }}>
          ✅ {state.info}
        </div>
      )}
      {state.error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', marginBottom: 12 }}>
          ❌ {state.error}
        </div>
      )}

      <form action={action} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Email utilisateur</label>
          <input name="email" type="email" required style={{ ...inp, width: 240 }} placeholder="user@example.com" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Plan</label>
          <select name="plan" style={inp}>
            <option value="pro">Pro (15 000 FCFA)</option>
            <option value="business">Business (35 000 FCFA)</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Durée (jours)</label>
          <input name="jours" type="number" min={1} max={365} defaultValue={30} style={{ ...inp, width: 90 }} />
        </div>
        <Btn />
      </form>
    </div>
  )
}
