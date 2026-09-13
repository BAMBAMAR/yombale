'use client'

import React from 'react'
import { PRODUIT_CATEGORIES } from '@/lib/categories'
import { Sparkles, Scan } from 'lucide-react'
import { ProduitFormMagicImport } from './ProduitFormMagicImport'
import { CaracteristiquesFields } from './CaracteristiquesFields'
import { ProduitFormVariantesSection } from './ProduitFormVariantesSection'
import type { Produit } from '../boutiqueTypes'

interface ProduitFormAdvancedOptionsProps {
  produit?: Produit
  cat: string
  setCat: (c: string) => void
  setCarac: React.Dispatch<React.SetStateAction<Record<string, string>>>
  carac: Record<string, string>
  handleCarac: (k: string, v: string) => void
  hasCaracFields: boolean | string | null
  codeBarreForm: string
  setCodeBarreForm: (c: string) => void
  stockQuantiteForm: string
  setStockQuantiteForm: (q: string) => void
  prixAchatForm: string
  setPrixAchatForm: (p: string) => void
  prixBarreForm: string
  setPrixBarreForm: (p: string) => void
  prixForm: string
  enStock: boolean
  setEnStock: (b: boolean) => void
  descForm: string
  setDescForm: (d: string) => void
  scanners: {
    genererCodeBarreForm: () => void
    demarrerFormScanner: (target: 'nom' | 'ean') => Promise<void>
  }
  handleMagicImportSuccess: (data: any) => void
  variantesState: any
  t: (key: string) => string
}

export function ProduitFormAdvancedOptions({
  produit,
  cat,
  setCat,
  setCarac,
  carac,
  handleCarac,
  hasCaracFields,
  codeBarreForm,
  setCodeBarreForm,
  stockQuantiteForm,
  setStockQuantiteForm,
  prixAchatForm,
  setPrixAchatForm,
  prixBarreForm,
  setPrixBarreForm,
  prixForm,
  enStock,
  setEnStock,
  descForm,
  setDescForm,
  scanners,
  handleMagicImportSuccess,
  variantesState,
  t,
}: ProduitFormAdvancedOptionsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: '#f8fafc', padding: 18, borderRadius: 16, border: '1px solid #e2e8f0' }}>
      {!produit && <ProduitFormMagicImport onImportSuccess={handleMagicImportSuccess} />}

      {/* Catégorie */}
      <div>
        <label className="npl-label-airy">{t('shop.productCategory')}</label>
        <select
          value={cat}
          onChange={e => {
            setCat(e.target.value)
            setCarac({})
          }}
          className="npl-input-airy"
        >
          <option value="">— {t('shop.productCategory')} —</option>
          {PRODUIT_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Code-Barres EAN-13 */}
      <div>
        <label className="npl-label-airy">Code-Barres EAN-13 (Optionnel)</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={codeBarreForm}
            onChange={e => setCodeBarreForm(e.target.value)}
            className="npl-input-airy"
            style={{ flex: '1 1 200px' }}
            placeholder="Ex: 600123456789 (Scannez ou tapez)"
          />
          <button
            type="button"
            onClick={scanners.genererCodeBarreForm}
            className="npl-btn npl-btn-secondary npl-btn-md"
            style={{ flex: '0 0 auto', height: 48, whiteSpace: 'nowrap', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Générer un code EAN-13 valide automatiquement"
          >
            <Sparkles size={14} />
            <span>Générer EAN</span>
          </button>
          <button
            type="button"
            onClick={() => scanners.demarrerFormScanner('ean')}
            className="npl-btn npl-btn-secondary npl-btn-md"
            style={{ flex: '0 0 auto', height: 48, whiteSpace: 'nowrap', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Scanner le code-barres EAN avec la caméra"
          >
            <Scan size={14} />
            <span>Scan EAN</span>
          </button>
        </div>
      </div>

      {/* Stock, Coût d'achat & Prix barré promo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <div>
          <label className="npl-label-airy">Quantité en stock</label>
          <input
            name="stock_quantite"
            type="number"
            min={0}
            value={stockQuantiteForm}
            onChange={e => {
              setStockQuantiteForm(e.target.value)
              if (Number(e.target.value) > 0) setEnStock(true)
              else if (e.target.value === '0') setEnStock(false)
            }}
            className="npl-input-airy"
            placeholder="Ex: 50"
          />
        </div>
        <div>
          <label className="npl-label-airy">Prix d&apos;achat / Coût (FCFA)</label>
          <input
            name="prix_achat"
            type="number"
            min={0}
            value={prixAchatForm}
            onChange={e => setPrixAchatForm(e.target.value)}
            className="npl-input-airy"
            placeholder="Ex: 10 000"
          />
        </div>
        <div>
          <label className="npl-label-airy">{t('shop.productPriceStrikethrough')}</label>
          <input
            name="prix_barre"
            type="number"
            min={0}
            value={prixBarreForm}
            onChange={e => setPrixBarreForm(e.target.value)}
            className="npl-input-airy"
            placeholder="Ex: 20 000"
          />
        </div>
      </div>

      {/* Toggle En stock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
        <button
          type="button"
          onClick={() => setEnStock(!enStock)}
          style={{
            width: 44,
            height: 26,
            borderRadius: 13,
            border: 'none',
            cursor: 'pointer',
            background: enStock ? '#16a34a' : '#d1d5db',
            transition: 'background .2s',
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: enStock ? 21 : 3,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#fff',
              transition: 'left .2s',
              display: 'block',
            }}
          />
        </button>
        <span style={{ fontSize: 13.5, color: '#334155', fontWeight: 700 }}>
          {enStock
            ? stockQuantiteForm && Number(stockQuantiteForm) > 0
              ? `En stock (${stockQuantiteForm} pcs)`
              : `${t('shop.inStock')}`
            : `${t('shop.outOfStock')}`}
        </span>
      </div>

      {/* Caractéristiques dynamiques */}
      {hasCaracFields && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Caractéristiques
          </p>
          <CaracteristiquesFields slug={cat} values={carac} onChange={handleCarac} typesVarianteActifs={variantesState.typesDejaUtilises} />
        </div>
      )}

      {/* Variantes & SKU Matrix */}
      <ProduitFormVariantesSection
        variantes={variantesState.variantes}
        typesDisponibles={variantesState.typesDisponibles}
        nomsPersonnalises={variantesState.nomsPersonnalises}
        ajouterOption={variantesState.ajouterOption}
        renommerOptionPersonnalisee={variantesState.renommerOptionPersonnalisee}
        retirerOption={variantesState.retirerOption}
        toggleValeur={variantesState.toggleValeur}
        variantesSkus={variantesState.variantesSkus}
        prixForm={prixForm}
        stockQuantiteForm={stockQuantiteForm}
        alignerTousLesPrix={variantesState.alignerTousLesPrix}
        alignerTousLesStocks={variantesState.alignerTousLesStocks}
        regenererTousLesSkus={variantesState.regenererTousLesSkus}
        updateVarianteSku={variantesState.updateVarianteSku}
        genererEanPourVariante={variantesState.genererEanPourVariante}
      />

      {/* Description */}
      <div>
        <label className="npl-label-airy">{t('shop.descriptionLabel')}</label>
        <textarea
          name="description"
          rows={3}
          value={descForm}
          onChange={e => setDescForm(e.target.value)}
          className="npl-input-airy"
          style={{ minHeight: 80, resize: 'vertical' }}
          placeholder="Détails supplémentaires, conseils d'utilisation, garantie…"
        />
      </div>
    </div>
  )
}
