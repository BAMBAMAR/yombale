'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Produit } from '../types'
import { fcfa } from '../utils'
import { useTranslation } from '@/i18n/context'

interface ComptaSaisieExpressCatalogueProps {
  produits: Produit[]
  panierProduits: Record<string, number>
  onAjouterProduitCatalogue: (p: any, delta?: number) => void
}

export function ComptaSaisieExpressCatalogue({
  produits,
  panierProduits,
  onAjouterProduitCatalogue,
}: ComptaSaisieExpressCatalogueProps) {
  const { t } = useTranslation()
  const [rechercheProduit, setRechercheProduit] = useState('')
  const [categorieFiltre, setCategorieFiltre] = useState('tous')

  const categoriesCatalogue = Array.from(
    new Set(produits.map((p: any) => p.categorie).filter(Boolean))
  ) as string[]

  const qModal = rechercheProduit.trim().toLowerCase()
  const produitsFiltres = produits.filter((p: any) => {
    const matchCat = categorieFiltre === 'tous' || p.categorie === categorieFiltre
    const matchText =
      !qModal ||
      p.nom?.toLowerCase().includes(qModal) ||
      p.categorie?.toLowerCase().includes(qModal) ||
      p.barcode?.toLowerCase().includes(qModal) ||
      p.sku?.toLowerCase().includes(qModal)
    return matchCat && matchText
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      {/* Barre de recherche pleine largeur */}
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          id="express-vente-recherche"
          type="text"
          value={rechercheProduit}
          onChange={(e) => setRechercheProduit(e.target.value)}
          placeholder={t('shop.searchProductPrompt') || 'Rechercher un produit...'}
          style={{
            width: '100%',
            padding: '9px 36px 9px 12px',
            borderRadius: 10,
            border: '1.5px solid var(--border, #E8DDD2)',
            background: '#ffffff',
            color: 'var(--navy, #1C2B4A)',
            fontSize: 13,
            fontWeight: 600,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {rechercheProduit && (
          <button
            type="button"
            onClick={() => setRechercheProduit('')}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text3, #8C7E74)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Effacer la recherche"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Puces Catégories défilantes */}
      {categoriesCatalogue.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 4,
            scrollbarWidth: 'none',
            width: '100%',
          }}
        >
          <button
            type="button"
            onClick={() => setCategorieFiltre('tous')}
            style={{
              padding: '5px 12px',
              borderRadius: 12,
              fontSize: 11.5,
              fontWeight: 700,
              border:
                categorieFiltre === 'tous'
                  ? '1px solid var(--navy, #1C2B4A)'
                  : '1px solid var(--border, #E8DDD2)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background:
                categorieFiltre === 'tous'
                  ? 'var(--navy, #1C2B4A)'
                  : 'var(--bg, #F8F5F0)',
              color: categorieFiltre === 'tous' ? '#ffffff' : 'var(--text2, #5A4E42)',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
          >
            {t('common.all') || 'Tous'} ({produits.length})
          </button>
          {categoriesCatalogue.map((cat) => {
            const count = produits.filter((p: any) => p.categorie === cat).length
            const isSel = categorieFiltre === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategorieFiltre(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 12,
                  fontSize: 11.5,
                  fontWeight: 700,
                  border: isSel
                    ? '1px solid var(--navy, #1C2B4A)'
                    : '1px solid var(--border, #E8DDD2)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: isSel
                    ? 'var(--navy, #1C2B4A)'
                    : 'var(--bg, #F8F5F0)',
                  color: isSel ? '#ffffff' : 'var(--text2, #5A4E42)',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Liste Produits (Format LISTE pleine largeur sans espace vide à droite) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxHeight: 280,
          overflowY: 'auto',
          padding: '2px 0',
          width: '100%',
        }}
      >
        {produitsFiltres.length === 0 ? (
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--text3, #8C7E74)',
              textAlign: 'center',
              padding: '20px 10px',
              background: 'var(--bg, #F8F5F0)',
              borderRadius: 10,
              border: '1px dashed var(--border, #E8DDD2)',
            }}
          >
            {produits.length === 0
              ? t('shop.noProductsInCatalog') || 'Aucun produit dans le catalogue'
              : t('shop.noProductsMatchSearch') || 'Aucun produit ne correspond à la recherche'}
          </div>
        ) : (
          produitsFiltres.map((p: any) => {
            const qte = panierProduits[p.id] || 0
            const prixAff = Number(p.prix_promo || p.prix || 0)
            const stock = p.stock_quantite ?? p.quantite_stock

            return (
              <div
                key={p.id}
                onClick={() => {
                  if (qte === 0) onAjouterProduitCatalogue(p, 1)
                }}
                style={{
                  width: '100%',
                  background: qte > 0 ? '#F0FDF4' : '#ffffff',
                  border:
                    qte > 0
                      ? '1.5px solid var(--price, #0A5C36)'
                      : '1px solid var(--border, #E8DDD2)',
                  borderRadius: 10,
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  boxShadow:
                    qte > 0
                      ? '0 2px 8px rgba(10, 92, 54, 0.08)'
                      : '0 1px 3px rgba(28, 43, 74, 0.03)',
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box',
                  cursor: qte === 0 ? 'pointer' : 'default',
                }}
              >
                {/* Colonne Gauche : Nom clair en haut + Prix et Stock inséparables en bas */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {/* Nom complet du produit - lisible et clair sans être tronqué prématurément */}
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 800,
                      color: 'var(--navy, #1C2B4A)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.25,
                    }}
                    title={p.nom}
                  >
                    {p.nom}
                  </div>

                  {/* Ligne 2 : Prix FCFA et Stock sur une ligne propre sans saut */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: 'var(--price, #0A5C36)',
                        fontWeight: 900,
                        whiteSpace: 'nowrap',
                        lineHeight: 1.2,
                      }}
                    >
                      {fcfa(prixAff)}
                    </span>

                    {stock !== undefined && stock !== null && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: stock > 0 ? '#15803D' : 'var(--red, #B91C1C)',
                          background: stock > 0 ? '#DCFCE7' : '#FEE2E2',
                          padding: '1px 6px',
                          borderRadius: 6,
                          whiteSpace: 'nowrap',
                          lineHeight: 1.2,
                        }}
                      >
                        {stock > 0
                          ? `${stock} ${t('shop.inStockLabel') || 'en stock'}`
                          : t('shop.outOfStockBadge') || 'Épuisé'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions Droite : Bouton + Ajouter ou Compteur calibré sans débordement */}
                <div style={{ flexShrink: 0 }}>
                  {qte > 0 ? (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#ffffff',
                        border: '1px solid var(--price, #0A5C36)',
                        borderRadius: 8,
                        padding: '2px 4px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAjouterProduitCatalogue(p, -1)
                        }}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          border: 'none',
                          background: '#FEE2E2',
                          color: 'var(--red, #B91C1C)',
                          fontWeight: 900,
                          fontSize: 13,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Diminuer"
                      >
                        -
                      </button>
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 900,
                          color: 'var(--price, #0A5C36)',
                          minWidth: 18,
                          textAlign: 'center',
                        }}
                      >
                        {qte}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAjouterProduitCatalogue(p, 1)
                        }}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          border: 'none',
                          background: '#DCFCE7',
                          color: 'var(--price, #0A5C36)',
                          fontWeight: 900,
                          fontSize: 13,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Augmenter"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAjouterProduitCatalogue(p, 1)
                      }}
                      style={{
                        padding: '6px 11px',
                        fontSize: 12,
                        fontWeight: 800,
                        background: 'var(--navy, #1C2B4A)',
                        border: 'none',
                        borderRadius: 8,
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>+ {t('common.add') || 'Ajouter'}</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
