import React from 'react'
import { Wand2, Sparkles, RefreshCw, ArrowRight } from 'lucide-react'
import { fcfa } from '@/lib/format'
import { MagicResult } from './types'

interface MigrationMagicUrlTabProps {
  magicUrl: string
  onMagicUrlChange: (url: string) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  magicResult: MagicResult | null
}

export default function MigrationMagicUrlTab({
  magicUrl,
  onMagicUrlChange,
  onSubmit,
  loading,
  magicResult,
}: MigrationMagicUrlTabProps) {
  return (
    <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--border, #e2e8f0)', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ padding: 8, borderRadius: 8, background: '#faf5ff', color: '#9333ea' }}>
          <Wand2 size={24} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>
            Baguette Magique par Lien (AliExpress, Amazon, SHEIN, Jumia, CoinAfrique)
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
            Extrait automatiquement les photos HD, traduit en français et convertit les devises en FCFA.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
            URL du Produit :
          </label>
          <input
            type="text"
            value={magicUrl}
            onChange={e => onMagicUrlChange(e.target.value)}
            placeholder="https://fr.aliexpress.com/item/... ou https://www.jumia.sn/..."
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 15,
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !magicUrl.trim()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#9333ea',
            color: '#ffffff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? 'Extraction IA en cours…' : 'Extraire & Ajouter le Produit'}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      {magicResult && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 8,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            display: 'flex',
            gap: 16,
            alignItems: 'center',
          }}
        >
          {magicResult.scraped?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={magicResult.scraped.image}
              alt={magicResult.produit?.nom || 'Produit'}
              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
            />
          )}
          <div>
            <div style={{ color: '#16a34a', fontWeight: 700, fontSize: 15 }}>{magicResult.produit?.nom}</div>
            <div style={{ fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
              Prix calculé : {fcfa(magicResult.produit?.prix || 0)}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>Enregistré dans la boutique cible.</p>
          </div>
        </div>
      )}
    </div>
  )
}
