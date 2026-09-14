'use client'

import React, { useState } from 'react'
import { Plus, Search, AlertTriangle, MessageCircle, Edit2, Trash2, Users } from 'lucide-react'
import type { Fournisseur } from './types'

interface FournisseursListProps {
  fournisseurs: Fournisseur[]
  produits: any[]
  loading: boolean
  onNouveauFournisseur: () => void
  onEditerFournisseur: (f: Fournisseur) => void
  onSupprimerFournisseur: (fId: string, nom: string) => void
  onEnvoyerBonCommandeWhatsApp: (fournisseur: Fournisseur, articles: any[]) => void
  t: (key: string) => string
}

export default function FournisseursList({
  fournisseurs,
  produits,
  loading,
  onNouveauFournisseur,
  onEditerFournisseur,
  onSupprimerFournisseur,
  onEnvoyerBonCommandeWhatsApp,
  t,
}: FournisseursListProps) {
  const [rechercheFournisseur, setRechercheFournisseur] = useState<string>('')

  const prodsCritiques = produits.filter(
    (p: any) => p.stock_quantite != null && p.stock_quantite <= (p.seuil_alerte_stock || 5)
  )

  const qFou = rechercheFournisseur.trim().toLowerCase()
  const fournisseursFiltres = fournisseurs.filter(
    (f) =>
      !qFou ||
      f.nom?.toLowerCase().includes(qFou) ||
      f.telephone?.includes(qFou) ||
      f.email?.toLowerCase().includes(qFou) ||
      f.adresse?.toLowerCase().includes(qFou)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Outils & Recherche Fournisseur */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={rechercheFournisseur}
            onChange={(e) => setRechercheFournisseur(e.target.value)}
            placeholder={t('shop.searchSupplierPlaceholder')}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              outline: 'none',
              background: '#ffffff',
            }}
          />
        </div>
        <button
          onClick={onNouveauFournisseur}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: 'var(--price, #0A5C36)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={15} />
          <span>{t('shop.newSupplierBtn')}</span>
        </button>
      </div>

      {/* Bannière Alerte Réassort Critique & Bon de Commande Grossiste 1-Clic */}
      {prodsCritiques.length > 0 && (
        <div
          style={{
            background: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderRadius: 14,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#fef3c7',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: '#92400e' }}>
                  {prodsCritiques.length} article(s) en stock critique
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#b45309' }}>
                  Ces produits risquent la rupture. Générez un bon de commande direct vers vos grossistes.
                </p>
              </div>
            </div>
            {fournisseurs.length > 0 && (
              <button
                type="button"
                onClick={() => onEnvoyerBonCommandeWhatsApp(fournisseurs[0], prodsCritiques)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#25D366',
                  color: '#ffffff',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <MessageCircle size={14} />
                <span>Bon de commande WhatsApp ({fournisseurs[0].nom})</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {prodsCritiques.slice(0, 6).map((p: any) => (
              <span
                key={p.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #fcd34d',
                  borderRadius: 8,
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#78350f',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{p.nom}</span>
                <span style={{ color: '#dc2626', fontWeight: 800 }}>({p.stock_quantite ?? 0} restant)</span>
              </span>
            ))}
            {prodsCritiques.length > 6 && (
              <span style={{ fontSize: 12, color: '#92400e', alignSelf: 'center', fontWeight: 600 }}>
                +{prodsCritiques.length - 6} autres…
              </span>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#6b7280', fontSize: 14 }}>{t('common.loading')}</p>
      ) : fournisseursFiltres.length === 0 ? (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '40px 20px',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <Users size={32} style={{ margin: '0 auto 8px', color: '#94a3b8', display: 'block' }} />
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>{t('common.noData')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {fournisseursFiltres.map((f) => (
            <div
              key={f.id}
              style={{
                background: '#ffffff',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                padding: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{f.nom}</div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px 16px',
                      fontSize: 13,
                      color: '#6b7280',
                    }}
                  >
                    {f.telephone && <span>{f.telephone}</span>}
                    {f.email && <span>{f.email}</span>}
                    {f.adresse && <span>{f.adresse}</span>}
                    {!f.telephone && !f.email && !f.adresse && <span style={{ fontStyle: 'italic' }}>—</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => onEditerFournisseur(f)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: '#f0f9ff',
                      color: '#0284c7',
                      border: '1px solid #bae6fd',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Edit2 size={13} />
                    <span>{t('common.edit')}</span>
                  </button>
                  <button
                    onClick={() => onSupprimerFournisseur(f.id, f.nom)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    title="Supprimer"
                  >
                    <Trash2 size={13} />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
