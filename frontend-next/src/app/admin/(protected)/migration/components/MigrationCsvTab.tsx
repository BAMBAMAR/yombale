import React from 'react'
import { FileSpreadsheet, Upload, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react'
import { CsvResult } from './types'

interface MigrationCsvTabProps {
  csvText: string
  onCsvTextChange: (text: string) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  csvResult: CsvResult | null
}

export default function MigrationCsvTab({
  csvText,
  onCsvTextChange,
  onSubmit,
  loading,
  csvResult,
}: MigrationCsvTabProps) {
  return (
    <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--border, #e2e8f0)', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ padding: 8, borderRadius: 8, background: '#eff6ff', color: '#2563eb' }}>
          <FileSpreadsheet size={24} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>
            Import Universel CSV / Excel
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
            Compatible avec les exports Shopify, WooCommerce, PrestaShop ou votre tableur Excel (colonnes reconnues :{' '}
            <code>nom/title</code>, <code>prix/price</code>, <code>stock/qty</code>, <code>description</code>,{' '}
            <code>image/photo</code>).
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
            Collez les données CSV ou le contenu de votre tableur :
          </label>
          <textarea
            value={csvText}
            onChange={e => onCsvTextChange(e.target.value)}
            placeholder={
              'nom;prix;stock;description;image\nSmartphone Galaxy S23;450000;5;Superbe état 128Go;https://image.url/1.jpg\nRobe Soie Dakar;25000;12;Taille unique;https://image.url/2.jpg'
            }
            rows={8}
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
          disabled={loading || !csvText.trim()}
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
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <Upload size={18} />}
          {loading ? 'Importation en cours…' : 'Importer le Catalogue CSV'}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      {csvResult && (
        <div style={{ marginTop: 24, padding: 16, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 700, fontSize: 15 }}>
            <CheckCircle2 size={20} />
            {csvResult.ajoutes} / {csvResult.totalSoumis} produits ajoutés avec succès !
          </div>
        </div>
      )}
    </div>
  )
}
