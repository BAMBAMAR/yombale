import React from 'react'
import { Users, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react'
import { DettesResult } from './types'

interface MigrationDettesTabProps {
  dettesText: string
  onDettesTextChange: (text: string) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  dettesResult: DettesResult | null
}

export default function MigrationDettesTab({
  dettesText,
  onDettesTextChange,
  onSubmit,
  loading,
  dettesResult,
}: MigrationDettesTabProps) {
  return (
    <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--border, #e2e8f0)', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ padding: 8, borderRadius: 8, background: '#fef3c7', color: '#d97706' }}>
          <Users size={24} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>
            Migration du Carnet de Dettes & Clients Fidèles (POS)
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
            Permet au marchand physique de basculer son cahier de dettes vers sa caisse tactile Nopalou.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
            Format : <code>Nom | Téléphone | Dette Actuelle FCFA | Plafond Crédit</code> (un par ligne)
          </label>
          <textarea
            value={dettesText}
            onChange={e => onDettesTextChange(e.target.value)}
            placeholder={
              'Moussa Diop | 77 123 45 67 | 15000 | 50000\nFatou Ndiaye | 76 987 65 43 | 0 | 100000\nIbrahima Ba | 70 555 44 33 | 35000 | 50000'
            }
            rows={6}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              fontFamily: 'monospace',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !dettesText.trim()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#d97706',
            color: '#ffffff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <Users size={18} />}
          {loading ? 'Migration des créances…' : 'Migrer les Clients & Créances'}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      {dettesResult && (
        <div style={{ marginTop: 24, padding: 16, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 700, fontSize: 15 }}>
            <CheckCircle2 size={20} />
            {dettesResult.ajoutes} clients enregistrés dans la Caisse POS du marchand !
          </div>
        </div>
      )}
    </div>
  )
}
