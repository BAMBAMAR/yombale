'use client'

import React from 'react'
import { Search, Camera, AlignJustify, LayoutGrid, Barcode, X, Store, Smartphone } from 'lucide-react'
import { CATEGORIES } from '@/lib/categories'
import { fcfa } from '@/lib/format'
import PosVoiceInput from './PosVoiceInput'
import PosProductCard from './PosProductCard'

export interface ProduitCaisse {
  id: string
  nom: string
  prix: number
  code_barre?: string
  photo?: string
  categorie?: string
  stock: number
}

export interface LignePanier {
  produit: ProduitCaisse
  quantite: number
  prixUnitaire: number
}

interface PosCatalogueSectionProps {
  tabMobile: 'catalogue' | 'ticket'
  searchInputRef: React.RefObject<HTMLInputElement>
  recherche: string
  setRecherche: (val: string) => void
  t: (key: string) => string
  demarrerScannerCamera: () => void
  setModalPairageSmartphone: (val: boolean) => void
  produits: ProduitCaisse[]
  produitsFiltres: ProduitCaisse[]
  panier: LignePanier[]
  ajouterAuPanier: (p: ProduitCaisse) => void
  vueCatalogue: 'mosaique' | 'liste'
  setVueCatalogue: React.Dispatch<React.SetStateAction<'mosaique' | 'liste'>>
  categorieFiltre: string
  setCategorieFiltre: (val: string) => void
  loadingProduits: boolean
  roleActif: 'caissier' | 'superviseur'
  setModalImportBatch: (val: boolean) => void
  genererImprimerEtiquetteCodeBarre: (e: React.MouseEvent, p: ProduitCaisse) => void
}

export default function PosCatalogueSection({
  tabMobile,
  searchInputRef,
  recherche,
  setRecherche,
  t,
  demarrerScannerCamera,
  setModalPairageSmartphone,
  produits,
  produitsFiltres,
  panier,
  ajouterAuPanier,
  vueCatalogue,
  setVueCatalogue,
  categorieFiltre,
  setCategorieFiltre,
  loadingProduits,
  roleActif,
  setModalImportBatch,
  genererImprimerEtiquetteCodeBarre,
}: PosCatalogueSectionProps) {
  return (
    <div
      className={`caisse-catalogue-section ${tabMobile === 'catalogue' ? 'mobile-active' : 'mobile-hidden'}`}
      style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        overflowY: 'auto',
        background: 'var(--pos-surface2)',
        borderRight: '1px solid var(--pos-border)',
      }}
    >
      {/* Barre de Recherche Code-Barres & Nom + Scanner Caméra */}
      <div className="caisse-search-row" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--pos-text3)',
            }}
          >
            <Search size={18} />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('caisse.searchPlaceholder')}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{
              width: '100%',
              height: 38,
              padding: '8px 14px 8px 36px',
              borderRadius: 10,
              border: '1.5px solid var(--pos-border)',
              background: 'var(--pos-surface)',
              color: 'var(--pos-text)',
              fontSize: 13.5,
              fontWeight: 600,
              boxSizing: 'border-box',
              boxShadow: 'var(--pos-shadow)',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--pos-primary)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--pos-border)'
            }}
          />
          {recherche && (
            <button
              type="button"
              onClick={() => setRecherche('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--pos-surface2)',
                border: 'none',
                borderRadius: '50%',
                width: 20,
                height: 20,
                color: 'var(--pos-text2)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="caisse-search-row-btns" style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          <button
            type="button"
            onClick={demarrerScannerCamera}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '0 10px',
              height: 38,
              borderRadius: 10,
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              fontWeight: 750,
              fontSize: 12.5,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(2,132,199,0.25)',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            title="Scanner avec la caméra (Code-barres EAN / QR)"
          >
            <Camera size={16} />
            <span className="caisse-search-btn-label">Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => setModalPairageSmartphone(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '0 10px',
              height: 38,
              borderRadius: 10,
              background: 'var(--pos-surface)',
              color: 'var(--pos-text)',
              border: '1.5px solid var(--pos-border)',
              fontWeight: 750,
              fontSize: 12.5,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: 'var(--pos-shadow)',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            title="Connecter la caméra de votre smartphone comme douchette sans fil gratuite"
          >
            <Smartphone size={16} style={{ color: '#C75B00' }} />
            <span className="caisse-search-btn-label">Douchette</span>
          </button>

          <PosVoiceInput
            produits={produits}
            onAjouterProduit={(p, q) => {
              for (let i = 0; i < q; i++) {
                ajouterAuPanier(p as any)
              }
            }}
            onAjoutRapideLibre={(nom, montant, qte) => {
              const itemLibre: ProduitCaisse = {
                id: `vocal-${Date.now()}`,
                nom: nom || 'Article Comptoir',
                prix: montant,
                stock: 9999,
                categorie: 'divers',
              }
              for (let i = 0; i < qte; i++) {
                ajouterAuPanier(itemLibre)
              }
            }}
          />
        </div>
      </div>

      {/* Filtre Catégories et Toggle Vue */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 6 }}>
        <button
          onClick={() => setVueCatalogue((prev) => (prev === 'mosaique' ? 'liste' : 'mosaique'))}
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 40,
            borderRadius: 10,
            background: 'var(--pos-surface)',
            color: 'var(--pos-text)',
            border: '1.5px solid var(--pos-border)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: 'var(--pos-shadow)',
          }}
          title={`Passer en vue ${vueCatalogue === 'mosaique' ? 'liste' : 'mosaïque'}`}
        >
          {vueCatalogue === 'mosaique' ? <AlignJustify size={18} /> : <LayoutGrid size={18} />}
        </button>

        <div
          className="nopalou-scroll-tabs caisse-categories-bar"
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            flex: 1,
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {[
            { id: 'tous', label: t('caisse.allArticles') },
            ...CATEGORIES.filter((c) => c.value !== 'mixte').map((c) => {
              const catKey = `caisse.cat_${c.value.replace(/-/g, '_')}` as any
              const translated = t(catKey)
              return {
                id: c.value,
                label: translated && translated !== catKey ? translated : c.label,
              }
            }),
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setCategorieFiltre(c.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                background: categorieFiltre === c.id ? 'var(--pos-primary)' : 'var(--pos-surface)',
                color: categorieFiltre === c.id ? '#ffffff' : 'var(--pos-text)',
                fontWeight: categorieFiltre === c.id ? 800 : 600,
                fontSize: 13,
                cursor: 'pointer',
                border: categorieFiltre === c.id ? '1px solid var(--pos-primary)' : '1px solid var(--pos-border)',
                boxShadow: categorieFiltre === c.id ? '0 3px 8px rgba(249,115,22,0.35)' : 'none',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille des produits Réels */}
      {loadingProduits ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--pos-text3)', fontSize: 14 }}>
          Chargement du catalogue de la boutique…
        </div>
      ) : produitsFiltres.length === 0 ? (
        <div
          style={{
            background: 'var(--pos-surface)',
            border: '1px dashed var(--pos-border)',
            borderRadius: 16,
            padding: 40,
            textAlign: 'center',
          }}
        >
          <Store size={44} style={{ color: 'var(--pos-primary)', margin: '0 auto 8px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: 'var(--pos-text)' }}>
            Aucun produit dans le catalogue de cette boutique
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--pos-text2)' }}>
            Importez des articles modèles ou créez vos produits dans votre catalogue.
          </p>
          {roleActif === 'superviseur' && (
            <button
              onClick={() => setModalImportBatch(true)}
              style={{
                background: 'var(--pos-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              + Importer des Produits Modèle (Batch Intake) →
            </button>
          )}
        </div>
      ) : (
        <div
          className="produits-grid"
          style={{
            display: vueCatalogue === 'mosaique' ? 'grid' : 'flex',
            gridTemplateColumns: vueCatalogue === 'mosaique' ? 'repeat(auto-fill, minmax(140px, 1fr))' : undefined,
            flexDirection: vueCatalogue === 'liste' ? 'column' : undefined,
            gap: 10,
          }}
        >
          {produitsFiltres.map((p) => (
            <PosProductCard
              key={p.id}
              produit={p}
              qteAuPanier={panier.find((i) => i.produit.id === p.id)?.quantite || 0}
              vueCatalogue={vueCatalogue}
              onAjouter={ajouterAuPanier}
              onImprimerEtiquette={genererImprimerEtiquetteCodeBarre}
            />
          ))}
        </div>
      )}
    </div>
  )
}
