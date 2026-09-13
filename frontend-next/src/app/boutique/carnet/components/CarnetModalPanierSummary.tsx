'use client'

import React from 'react'
import { fcfa } from '@/lib/format'
import type { ProduitBoutique } from '../types'

interface CarnetModalPanierSummaryProps {
  produits: ProduitBoutique[]
  panierProduits: Record<string, number>
  setPanierProduits: React.Dispatch<React.SetStateAction<Record<string, number>>>
  itemsCustomPanier: Array<{ id: string; nom: string; prix: number; quantite: number }>
  setItemsCustomPanier: React.Dispatch<React.SetStateAction<Array<{ id: string; nom: string; prix: number; quantite: number }>>>
  t: (key: string) => string
}

export default function CarnetModalPanierSummary({
  produits,
  panierProduits,
  setPanierProduits,
  itemsCustomPanier,
  setItemsCustomPanier,
  t,
}: CarnetModalPanierSummaryProps) {
  const hasItems = Object.keys(panierProduits).some((k) => panierProduits[k] > 0) || itemsCustomPanier.length > 0
  if (!hasItems) return null

  const totalArticles =
    Object.values(panierProduits).reduce((a, b) => a + b, 0) +
    itemsCustomPanier.reduce((a, b) => a + b.quantite, 0)

  return (
    <div
      style={{
        marginTop: 12,
        background: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: 10,
        padding: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 800, color: '#0369a1' }}>
          {t('shop.articlesInSale')} ({totalArticles}) :
        </span>
        <button
          type="button"
          onClick={() => {
            setPanierProduits({})
            setItemsCustomPanier([])
          }}
          style={{
            fontSize: 11,
            color: '#ef4444',
            background: '#fee2e2',
            border: 'none',
            borderRadius: 6,
            padding: '3px 8px',
            cursor: 'pointer',
            fontWeight: 800,
          }}
        >
          {t('shop.emptyAllCartBtn')}
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          maxHeight: 130,
          overflowY: 'auto',
        }}
      >
        {/* 1. Produits Catalogue */}
        {Object.entries(panierProduits)
          .filter(([_, qte]) => qte > 0)
          .map(([pId, qte]) => {
            const prodObj = produits.find((p: any) => p.id === pId)
            if (!prodObj) return null
            const unitPrice = Number(prodObj.prix_promo || prodObj.prix || 0)
            const subtotal = unitPrice * qte

            return (
              <div
                key={pId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#ffffff',
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid #e0f2fe',
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color: '#0f172a',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 180,
                  }}
                >
                  {prodObj.nom}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#0284c7', fontWeight: 800 }}>
                    {qte} × {fcfa(unitPrice)} = {fcfa(subtotal)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPanierProduits((prev) => {
                        const copy = { ...prev }
                        delete copy[pId]
                        return copy
                      })
                    }
                    style={{
                      background: '#fee2e2',
                      border: 'none',
                      color: '#ef4444',
                      borderRadius: 4,
                      width: 18,
                      height: 18,
                      cursor: 'pointer',
                      fontWeight: 900,
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={t('shop.deleteItemTitle')}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}

        {/* 2. Articles Hors Catalogue / Saisie libre */}
        {itemsCustomPanier.map((item, idx) => {
          const subtotal = item.prix * item.quantite
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px dashed #0284c7',
                fontSize: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                <span
                  style={{
                    fontSize: 9.5,
                    background: '#e0f2fe',
                    color: '#0369a1',
                    fontWeight: 800,
                    padding: '1px 4px',
                    borderRadius: 4,
                  }}
                >
                  {t('shop.freeItemBadge')}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    color: '#0f172a',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 160,
                  }}
                >
                  {item.nom}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#0284c7', fontWeight: 800 }}>
                  {item.quantite} × {fcfa(item.prix)} = {fcfa(subtotal)}
                </span>
                <button
                  type="button"
                  onClick={() => setItemsCustomPanier((prev) => prev.filter((_, i) => i !== idx))}
                  style={{
                    background: '#fee2e2',
                    border: 'none',
                    color: '#ef4444',
                    borderRadius: 4,
                    width: 18,
                    height: 18,
                    cursor: 'pointer',
                    fontWeight: 900,
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={t('shop.deleteItemTitle')}
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
