'use client'

import React, { useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'

interface ProduitFormMagicImportProps {
  onImportSuccess: (data: {
    titre?: string
    prix?: number
    prix_achat?: number
    prix_barre?: number
    description?: string
    categorie?: string
    images?: string[]
  }) => void
}

export function ProduitFormMagicImport({ onImportSuccess }: ProduitFormMagicImportProps) {
  const [magicUrl, setMagicUrl] = useState<string>('')
  const [magicLoading, setMagicLoading] = useState<boolean>(false)
  const [magicResult, setMagicResult] = useState<any>(null)
  const [magicFeedback, setMagicFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function executerMagicImport() {
    const url = magicUrl.trim()
    if (!url) {
      setMagicFeedback({ type: 'error', text: 'Veuillez coller un lien de produit (AliExpress, Shein, Amazon, etc.)' })
      return
    }
    setMagicLoading(true)
    setMagicFeedback(null)
    try {
      const res = await fetch('/api/boutiques/magic-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (res.ok && data) {
        onImportSuccess(data)
        const nbImgs = data.images?.length || 0
        setMagicResult(data)
        setMagicFeedback({
          type: 'success',
          text:
            nbImgs > 0
              ? `Produit importé avec succès ! ${nbImgs} photo(s) ajoutée(s).`
              : `Fiche importée avec succès ! (Titre, Prix & Description remplis — ajoutez vos photos ci-dessous).`,
        })
      } else {
        setMagicFeedback({ type: 'error', text: data.error || "Impossible d'importer les détails depuis ce lien." })
      }
    } catch {
      setMagicFeedback({ type: 'error', text: 'Erreur réseau lors de la communication avec le serveur.' })
    } finally {
      setMagicLoading(false)
    }
  }

  return (
    <div
      style={{
        background: '#f0fdf4',
        padding: 16,
        borderRadius: 14,
        border: '1.5px dashed #22c55e',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
        <label
          style={{
            fontSize: 13.5,
            fontWeight: 800,
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Sparkles size={16} color="#16a34a" />
          <span>Baguette Magique (Import Rapide URL)</span>
        </label>
        <span
          style={{
            fontSize: 11,
            background: '#dcfce7',
            color: '#166534',
            padding: '2px 8px',
            borderRadius: 12,
            fontWeight: 700,
          }}
        >
          AliExpress • SHEIN • Amazon • Shopify
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%' }}>
        <input
          id="magic-url"
          type="url"
          value={magicUrl}
          onChange={e => setMagicUrl(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              executerMagicImport()
            }
          }}
          placeholder="Collez le lien du produit (AliExpress, Shein, Amazon, Alibaba, etc.)..."
          className="npl-input-airy"
          style={{ flex: '1 1 220px', minHeight: 44, fontSize: 13 }}
        />
        <button
          type="button"
          onClick={executerMagicImport}
          disabled={magicLoading}
          className="npl-btn npl-btn-success npl-btn-md"
          style={{
            flex: '0 0 auto',
            color: '#ffffff',
            whiteSpace: 'nowrap',
            padding: '0 18px',
            borderRadius: 10,
            fontWeight: 800,
            height: 44,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {magicLoading ? (
            <>
              <RefreshCw size={14} className="spin" />
              <span>Analyse en cours...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>Importer</span>
            </>
          )}
        </button>
      </div>

      {magicFeedback && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 600,
            background: magicFeedback.type === 'success' ? '#dcfce7' : '#fef2f2',
            color: magicFeedback.type === 'success' ? '#166534' : '#dc2626',
            border: `1px solid ${magicFeedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {magicFeedback.text}
        </div>
      )}

      {magicResult && (
        <div
          style={{
            marginTop: 12,
            background: '#ffffff',
            padding: 12,
            borderRadius: 10,
            border: '1px solid #bbf7d0',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: '#64748b' }}>
            <span>
              Source détectée : <strong style={{ color: '#0f172a' }}>{magicResult.source_name || 'E-commerce'}</strong>
            </span>
            {magicResult.categorie && magicResult.categorie !== 'divers' && (
              <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, color: '#334155', fontWeight: 700 }}>
                Catégorie : {magicResult.categorie}
              </span>
            )}
          </div>

          {magicResult.images && magicResult.images.length > 0 && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {magicResult.images.map((imgUrl: string, idx: number) => (
                <img
                  key={idx}
                  src={imgUrl}
                  alt={`Aperçu ${idx + 1}`}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 6,
                    objectFit: 'cover',
                    border: '1px solid #e2e8f0',
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          )}

          <div style={{ fontSize: 12, color: '#15803d', fontWeight: 700 }}>
            Prix de vente suggéré : {magicResult.prix?.toLocaleString('fr-FR')} FCFA
            {magicResult.prix_achat > 0 && (
              <span style={{ color: '#64748b', fontWeight: 500, marginLeft: 6 }}>
                (Coût d&apos;achat estimé : {magicResult.prix_achat?.toLocaleString('fr-FR')} FCFA)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
