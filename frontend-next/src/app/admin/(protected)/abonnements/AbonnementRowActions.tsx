'use client'
import { useState, useTransition } from 'react'
import { annulerAbonnement, prolongerAbonnement } from './actions'

interface Props {
  id: string
  statut: 'actif' | 'expire' | 'annule'
  plan: string
}

export default function AbonnementRowActions({ id, statut, plan }: Props) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [showProlonger, setShowProlonger] = useState(false)
  const [jours, setJours] = useState(30)

  function flash(ok: boolean, text: string) {
    setMsg({ ok, text })
    setTimeout(() => setMsg(null), 4000)
  }

  function handleAnnuler() {
    if (!confirm(`Annuler cet abonnement ${plan.toUpperCase()} ?`)) return
    startTransition(async () => {
      const res = await annulerAbonnement(id)
      flash(!!res.success, res.info ?? res.error ?? '…')
    })
  }

  function handleProlonger() {
    startTransition(async () => {
      const res = await prolongerAbonnement(id, jours)
      flash(!!res.success, res.info ?? res.error ?? '…')
      if (res.success) setShowProlonger(false)
    })
  }

  return (
    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>

        {/* Message flash */}
        {msg && (
          <div style={{
            fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 6,
            background: msg.ok ? '#f0fdf4' : '#fef2f2',
            color: msg.ok ? '#16a34a' : '#dc2626',
            border: `1px solid ${msg.ok ? '#bbf7d0' : '#fecaca'}`,
          }}>
            {msg.ok ? '✅' : '❌'} {msg.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {/* Prolonger */}
          <button
            onClick={() => setShowProlonger(v => !v)}
            disabled={isPending}
            style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
              background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
              cursor: 'pointer',
            }}
          >
            ⏱ Prolonger
          </button>

          {/* Annuler — seulement si actif */}
          {statut === 'actif' && (
            <button
              onClick={handleAnnuler}
              disabled={isPending}
              style={{
                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                cursor: isPending ? 'not-allowed' : 'pointer',
              }}
            >
              🚫 Annuler
            </button>
          )}

          {/* Réactiver — si annulé ou expiré */}
          {statut !== 'actif' && (
            <button
              onClick={() => {
                startTransition(async () => {
                  const res = await prolongerAbonnement(id, 30)
                  flash(!!res.success, res.info ?? res.error ?? '…')
                })
              }}
              disabled={isPending}
              style={{
                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
                cursor: isPending ? 'not-allowed' : 'pointer',
              }}
            >
              ▶ Réactiver 30j
            </button>
          )}
        </div>

        {/* Formulaire prolonger inline */}
        {showProlonger && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginTop: 2,
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 8, padding: '6px 10px',
          }}>
            <input
              type="number"
              min={1} max={365}
              value={jours}
              onChange={e => setJours(Number(e.target.value))}
              style={{
                width: 52, padding: '3px 6px', border: '1px solid #d1d5db',
                borderRadius: 6, fontSize: 12, textAlign: 'center',
              }}
            />
            <span style={{ fontSize: 11, color: '#64748b' }}>jours</span>
            <button
              onClick={handleProlonger}
              disabled={isPending}
              style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                background: '#1d4ed8', color: '#fff', border: 'none',
                cursor: isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? '…' : 'OK'}
            </button>
            <button
              onClick={() => setShowProlonger(false)}
              style={{ fontSize: 12, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 2px' }}
            >✕</button>
          </div>
        )}
      </div>
    </td>
  )
}
