import React from 'react'
import { Zap, Rocket, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react'
import { ShopifyResult } from './types'

interface MigrationShopifyTabProps {
  shopifyUrl: string
  onShopifyUrlChange: (url: string) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  shopifyResult: ShopifyResult | null
}

export default function MigrationShopifyTab({
  shopifyUrl,
  onShopifyUrlChange,
  onSubmit,
  loading,
  shopifyResult,
}: MigrationShopifyTabProps) {
  return (
    <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--border, #e2e8f0)', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ padding: 8, borderRadius: 8, background: '#f0fdf4', color: '#16a34a' }}>
          <Zap size={24} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>
            Aspiration Intégrale de Catalogue Shopify
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
            Collez l&apos;URL de n&apos;importe quel site Shopify (ex: <code>maboutique.com</code> ou{' '}
            <code>maboutique.myshopify.com</code>). Nopalou extrait automatiquement jusqu&apos;à 250 produits avec
            descriptions, photos HD et prix convertis en FCFA.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
            Lien du Site Shopify :
          </label>
          <input
            type="text"
            value={shopifyUrl}
            onChange={e => onShopifyUrlChange(e.target.value)}
            placeholder="https://exempleshop.myshopify.com ou mondomaine.com"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 15,
              fontWeight: 500,
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !shopifyUrl.trim()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#0284c7',
            color: '#ffffff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <Rocket size={18} />}
          {loading ? 'Aspiration du catalogue en cours…' : "Lancer l'Aspiration Shopify"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      {shopifyResult && (
        <div style={{ marginTop: 24, padding: 16, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 700, fontSize: 15 }}>
            <CheckCircle2 size={20} />
            Aspiration Réussie ! {shopifyResult.ajoutes} produits injectés dans la boutique.
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#15803d' }}>
            Source analysée : <code>{shopifyResult.source}</code> ({shopifyResult.totalDetectes} produits détectés)
          </p>
        </div>
      )}
    </div>
  )
}
