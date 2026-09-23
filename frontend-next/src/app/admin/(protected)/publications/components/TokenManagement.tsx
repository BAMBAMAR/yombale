'use client'

import { useState, useEffect } from 'react'
import {
  Key,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'

export interface TokenStatus {
  status: 'ok' | 'expired' | 'missing' | 'error'
  message?: string
  name?: string
  expires_at?: string | null
  is_page_token?: boolean
  type?: string
}

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`/admin-proxy/fb/${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...((opts.headers as Record<string, string>) || {}) },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur')
  return data
}

export function TokenBanner({ onRenew }: { onRenew: () => void }) {
  const [ts, setTs] = useState<TokenStatus | null>(null)
  const [loading, setL] = useState(true)

  useEffect(() => {
    api('token-status')
      .then(setTs)
      .catch(() => setTs({ status: 'error', message: 'Impossible de vérifier' }))
      .finally(() => setL(false))
  }, [])

  if (loading) return null

  const expired = ts?.status === 'expired' || ts?.status === 'missing'
  const bg = expired ? '#FEF2F2' : ts?.status === 'ok' ? '#F0FDF4' : '#FFFBEB'
  const border = expired ? '#FECACA' : ts?.status === 'ok' ? '#BBF7D0' : '#FDE68A'
  const color = expired ? '#DC2626' : ts?.status === 'ok' ? '#166534' : '#92400E'

  let label = ''
  if (ts?.status === 'missing') label = 'Aucun token Meta / Facebook configuré'
  else if (ts?.status === 'expired') label = `Token expiré — ${ts.message?.split('on ')[1]?.split('.')[0] || 'session terminée'}`
  else if (ts?.status === 'ok') {
    const exp = ts.expires_at ? new Date(ts.expires_at) : null
    const days = exp ? Math.ceil((exp.getTime() - Date.now()) / 86400000) : null
    label = `Token actif${ts.name ? ` · ${ts.name}` : ''}${days !== null ? ` · expire dans ${days}j` : ' · sans expiration'}`
  } else label = ts?.message || 'Statut inconnu'

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color, fontWeight: 600 }}>
        {expired ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
        <span>{label}</span>
      </div>
      <button
        onClick={onRenew}
        style={{ padding: '6px 14px', background: expired ? '#DC2626' : '#1877F2', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <RefreshCw size={13} />
        {expired ? 'Renouveler le token' : 'Modifier le token'}
      </button>
    </div>
  )
}

export function TokenModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [mode, setMode] = useState<'exchange' | 'direct'>('exchange')
  const [token, setToken] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')
  const [msg, setMsg] = useState('')

  async function save() {
    if (!token.trim()) return
    setStatus('loading')
    setMsg('')
    try {
      const endpoint = mode === 'exchange' ? 'token-exchange' : 'token'
      const body = mode === 'exchange' ? { user_token: token.trim() } : { token: token.trim() }
      const res = await api(endpoint, { method: 'POST', body: JSON.stringify(body) })
      const label = mode === 'exchange'
        ? `Token permanent enregistré · Page : ${res.name}`
        : `Token enregistré · Page : ${res.name}`
      setStatus('ok')
      setMsg(label)
      setTimeout(() => { onSaved(); onClose() }, 1800)
    } catch (e: unknown) {
      setStatus('err')
      setMsg(e instanceof Error ? e.message : 'Erreur')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, maxWidth: 580, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1C2B4A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Key size={18} color="#1877F2" />
          Renouveler le token Facebook & Instagram
        </h2>

        {/* Sélecteur de mode */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => { setMode('exchange'); setToken(''); setMsg(''); setStatus('idle') }}
            style={{ flex: 1, padding: '10px 12px', border: `2px solid ${mode === 'exchange' ? '#1877F2' : '#E2E8F0'}`, borderRadius: 8, background: mode === 'exchange' ? '#EFF6FF' : '#F8FAFC', color: mode === 'exchange' ? '#1D4ED8' : '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <ShieldCheck size={15} />
            Token permanent (Recommandé)
          </button>
          <button
            onClick={() => { setMode('direct'); setToken(''); setMsg(''); setStatus('idle') }}
            style={{ flex: 1, padding: '10px 12px', border: `2px solid ${mode === 'direct' ? '#1877F2' : '#E2E8F0'}`, borderRadius: 8, background: mode === 'direct' ? '#EFF6FF' : '#F8FAFC', color: mode === 'direct' ? '#1D4ED8' : '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Clock size={15} />
            Token de page direct (~60j)
          </button>
        </div>

        {mode === 'exchange' ? (
          <>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#166534' }}>
              Cette méthode génère un token qui <strong>n&apos;expire jamais</strong> — plus besoin de renouveler régulièrement.
            </div>
            <ol style={{ fontSize: 13, color: '#1C2B4A', lineHeight: 2.2, paddingLeft: 20, marginBottom: 16 }}>
              <li>Aller sur <strong>developers.facebook.com/tools/explorer</strong></li>
              <li>Sélectionner l&apos;application <strong>Nopalou</strong></li>
              <li>Cliquer <strong>Générer un token d&apos;accès</strong> (token <em>utilisateur</em>, pas de page)</li>
              <li>Cocher : <code>pages_manage_posts</code>, <code>pages_read_engagement</code>, <code>instagram_basic</code>, <code>instagram_content_publish</code></li>
              <li>Copier le token <strong>utilisateur</strong> généré</li>
              <li>Coller ci-dessous — le serveur l&apos;échange automatiquement en token de page permanent</li>
            </ol>
            <textarea
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="EAAxxxxx... (token utilisateur Facebook — le serveur fait l'échange)"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, minHeight: 80, resize: 'vertical', boxSizing: 'border-box', marginBottom: 12, fontFamily: 'monospace' }}
            />
          </>
        ) : (
          <>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
              Ce token expire dans ~60 jours. Préférez la méthode <strong>Token permanent</strong> pour éviter les interruptions.
            </div>
            <ol style={{ fontSize: 13, color: '#1C2B4A', lineHeight: 2.2, paddingLeft: 20, marginBottom: 16 }}>
              <li>Aller sur <strong>developers.facebook.com/tools/explorer</strong></li>
              <li>Sélectionner l&apos;application <strong>Nopalou</strong> → <strong>Obtenir un token d&apos;accès de Page</strong></li>
              <li>Cocher : <code>pages_manage_posts</code>, <code>pages_read_engagement</code></li>
              <li>Copier le token de Page généré et coller ci-dessous</li>
            </ol>
            <textarea
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="EAAxxxxx... (token de page Facebook)"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, minHeight: 80, resize: 'vertical', boxSizing: 'border-box', marginBottom: 12, fontFamily: 'monospace' }}
            />
          </>
        )}

        {msg && (
          <p style={{ fontSize: 13, color: status === 'ok' ? '#10B981' : '#EF4444', marginBottom: 12 }}>
            {msg}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={save}
            disabled={status === 'loading' || !token.trim()}
            style={{ padding: '8px 18px', background: '#1877F2', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
          >
            {status === 'loading' ? (mode === 'exchange' ? 'Échange en cours...' : 'Vérification...') : (mode === 'exchange' ? 'Échanger et enregistrer' : 'Enregistrer le token')}
          </button>
        </div>
      </div>
    </div>
  )
}
