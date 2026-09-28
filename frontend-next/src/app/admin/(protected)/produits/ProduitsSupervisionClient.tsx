'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  Search,
  RefreshCw,
  EyeOff,
  Eye,
  Store,
  Layers,
  MessageSquare,
  ShieldAlert,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  Phone,
} from 'lucide-react'
import { fcfa } from '@/lib/format'
import {
  ModalModererProduit,
  ModalMessageMarchand,
  ModalDetailProduit,
  ModalEditionRapideProduit,
  ModalSupprimerProduit,
} from './components'

interface ProduitsSupervisionClientProps {
  initialData: {
    produits: any[]
    total: number
    stats: any
  }
}

export default function ProduitsSupervisionClient({ initialData }: ProduitsSupervisionClientProps) {
  const [produits, setProduits] = useState<any[]>(initialData.produits || [])
  const [filterStock, setFilterStock] = useState<'tous' | 'stock' | 'rupture' | 'suspendu'>('tous')
  const [search, setSearch] = useState('')

  // Modales d'actions
  const [modalModerationProd, setModalModerationProd] = useState<any | null>(null)
  const [modalContactProd, setModalContactProd] = useState<any | null>(null)
  const [modalDetailId, setModalDetailId] = useState<string | null>(null)
  const [modalEditProd, setModalEditProd] = useState<any | null>(null)
  const [modalDeleteProd, setModalDeleteProd] = useState<any | null>(null)

  // Menu déroulant par ligne
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  const handleUpdateProduit = (updated: any) => {
    setProduits((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
    setModalModerationProd(null)
    setModalEditProd(null)
  }

  const handleDeleteSuccess = (deletedId: string) => {
    setProduits((prev) => prev.filter((p) => p.id !== deletedId))
    setModalDeleteProd(null)
    setModalDetailId(null)
  }

  const filtered = produits.filter((p) => {
    const isSusp = p.statut_moderation === 'suspendu' || (p.en_stock === false && p.motif_moderation)
    if (filterStock === 'stock' && (!p.en_stock || isSusp)) return false
    if (filterStock === 'rupture' && p.en_stock && (p.stock_quantite === null || p.stock_quantite > 0)) return false
    if (filterStock === 'suspendu' && !isSusp) return false

    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        p.nom?.toLowerCase().includes(q) ||
        p.boutique_nom?.toLowerCase().includes(q) ||
        p.proprietaire_nom?.toLowerCase().includes(q) ||
        p.proprietaire_tel?.includes(q) ||
        p.boutique_tel?.includes(q) ||
        p.categorie?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const countTous = produits.length
  const countStock = produits.filter((p) => {
    const isSusp = p.statut_moderation === 'suspendu' || (p.en_stock === false && p.motif_moderation)
    return p.en_stock && !isSusp
  }).length
  const countSuspendus = produits.filter((p) => {
    return p.statut_moderation === 'suspendu' || (p.en_stock === false && p.motif_moderation)
  }).length
  const countRuptures = produits.filter((p) => {
    return !p.en_stock || (p.stock_quantite !== null && p.stock_quantite <= 0)
  }).length

  const stats = initialData.stats || {}

  return (
    <div className="admin-page-container">
      {/* En-tête Métier */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', margin: '0 0 4px' }}>
            Catalogue Marchands & Modération Produits
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
            Supervision qualitative, détection des non-conformités, échanges directs avec les marchands et gestion des suspensions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-npl"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}
        >
          <RefreshCw size={14} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Cartes KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Articles Référencés</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: '6px 0 2px' }}>
            {countTous || stats.total_produits || initialData.total || 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            Catalogue global des boutiques
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>En Vente Active</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#047857', margin: '6px 0 2px' }}>
            {countStock}
          </div>
          <div style={{ fontSize: 12, color: '#047857', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={13} />
            <span>Disponibles aux acheteurs</span>
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Articles Suspendus</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: countSuspendus > 0 ? '#b91c1c' : 'var(--navy)', margin: '6px 0 2px' }}>
            {countSuspendus}
          </div>
          <div style={{ fontSize: 12, color: countSuspendus > 0 ? '#b91c1c' : 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldAlert size={13} />
            <span>Modérés avec motif</span>
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Ruptures de Stock</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: countRuptures > 0 ? '#ea580c' : 'var(--navy)', margin: '6px 0 2px' }}>
            {countRuptures}
          </div>
          <div style={{ fontSize: 12, color: '#ea580c', display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={13} />
            <span>Quantité nulle ou épuisée</span>
          </div>
        </div>
      </div>

      {/* Barre de Filtres & Recherche */}
      <div style={{ background: '#ffffff', padding: 14, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'tous', label: `Tous (${countTous})` },
            { id: 'stock', label: `En vente (${countStock})` },
            { id: 'suspendu', label: `Suspendus / Modérés (${countSuspendus})` },
            { id: 'rupture', label: `Ruptures de stock (${countRuptures})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStock(tab.id as any)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: filterStock === tab.id ? 'var(--navy)' : '#ffffff',
                color: filterStock === tab.id ? '#ffffff' : 'var(--text1)',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: 280 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input
            type="text"
            placeholder="Rechercher produit, boutique, marchand, tel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 12px 7px 32px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid var(--border)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Tableau des Produits */}
      <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                <th style={{ padding: '12px 14px' }}>Article & Variantes</th>
                <th style={{ padding: '12px 14px' }}>Boutique & Marchand</th>
                <th style={{ padding: '12px 14px' }}>Prix Marchand</th>
                <th style={{ padding: '12px 14px' }}>Disponibilité</th>
                <th style={{ padding: '12px 14px' }}>Statut Modération</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text3)' }}>
                    Aucun article correspondant aux critères.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const imgUrl = Array.isArray(p.images) && p.images[0] ? p.images[0] : null
                  const isSusp = p.statut_moderation === 'suspendu' || (p.en_stock === false && p.motif_moderation)
                  const isStock = p.en_stock !== false && (p.stock_quantite === null || p.stock_quantite > 0)
                  const tel = p.proprietaire_tel || p.boutique_tel

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: isSusp ? '#fffafa' : '#ffffff',
                      }}
                    >
                      {/* 1. Article */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            onClick={() => setModalDetailId(p.id)}
                            style={{ cursor: 'pointer', flexShrink: 0 }}
                          >
                            {imgUrl ? (
                              <Image
                                src={imgUrl}
                                alt=""
                                width={42}
                                height={42}
                                style={{ borderRadius: 6, objectFit: 'cover', background: '#f1f5f9' }}
                              />
                            ) : (
                              <div style={{ width: 42, height: 42, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
                                <Package size={18} />
                              </div>
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              onClick={() => setModalDetailId(p.id)}
                              style={{ fontWeight: 600, color: 'var(--navy)', cursor: 'pointer', lineHeight: 1.3 }}
                              title="Cliquer pour voir la fiche 360°"
                            >
                              {p.nom}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                                {p.categorie || 'Général'}
                              </span>
                              {p.nb_variantes > 0 && (
                                <span style={{ fontSize: 10, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                  <Layers size={9} /> {p.nb_variantes} var.
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Boutique & Marchand */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.boutique_nom}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: 11 }}>
                          <span style={{ color: 'var(--text2)' }}>
                            {p.proprietaire_nom || 'Propriétaire'}
                          </span>
                          {tel && (
                            <a
                              href={`tel:${tel}`}
                              style={{ color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}
                            >
                              <Phone size={10} />
                              <span>{tel}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* 3. Prix */}
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--navy)' }}>
                        {fcfa(p.prix)}
                        {p.prix_barre && (
                          <div style={{ fontSize: 11, color: 'var(--text3)', textDecoration: 'line-through', fontWeight: 400 }}>
                            {fcfa(p.prix_barre)}
                          </div>
                        )}
                      </td>

                      {/* 4. Disponibilité Stock */}
                      <td style={{ padding: '12px 14px' }}>
                        {isStock ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#047857', background: '#ecfdf5', padding: '3px 8px', borderRadius: 12 }}>
                            <CheckCircle2 size={11} />
                            {p.stock_quantite !== null ? `${p.stock_quantite} en stock` : 'En stock'}
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#ea580c', background: '#fff7ed', padding: '3px 8px', borderRadius: 12 }}>
                            <AlertTriangle size={11} />
                            Rupture
                          </span>
                        )}
                      </td>

                      {/* 5. Statut Modération & Motif */}
                      <td style={{ padding: '12px 14px' }}>
                        {isSusp ? (
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#b91c1c', background: '#fef2f2', padding: '3px 8px', borderRadius: 12, border: '1px solid #fecaca' }}>
                              <ShieldAlert size={12} />
                              Suspendu
                            </span>
                            {p.motif_moderation && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: '#7f1d1d',
                                  marginTop: 3,
                                  maxWidth: 220,
                                  lineHeight: 1.2,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                                title={`Motif : ${p.motif_moderation}`}
                              >
                                {p.motif_moderation}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#047857', background: '#ecfdf5', padding: '3px 8px', borderRadius: 12 }}>
                            <CheckCircle2 size={11} />
                            Conforme
                          </span>
                        )}
                      </td>

                      {/* 6. Actions */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                          {/* Bouton Modération Principal */}
                          <button
                            type="button"
                            onClick={() => setModalModerationProd(p)}
                            title={isSusp ? 'Réactiver l\'article' : 'Suspendre l\'article et notifier'}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              color: isSusp ? '#047857' : '#b91c1c',
                              background: isSusp ? '#ecfdf5' : '#fef2f2',
                              border: `1px solid ${isSusp ? '#a7f3d0' : '#fecaca'}`,
                              padding: '5px 9px',
                              borderRadius: 6,
                              cursor: 'pointer',
                            }}
                          >
                            {isSusp ? <Eye size={12} /> : <EyeOff size={12} />}
                            <span>{isSusp ? 'Réactiver' : 'Modérer'}</span>
                          </button>

                          {/* Bouton Contacter Marchand */}
                          <button
                            type="button"
                            onClick={() => setModalContactProd(p)}
                            title="Contacter directement le marchand (WhatsApp / Email)"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              border: '1px solid var(--border)',
                              background: '#ffffff',
                              color: '#0284c7',
                              cursor: 'pointer',
                            }}
                          >
                            <MessageSquare size={13} />
                          </button>

                          {/* Menu Complémentaire (Détail, Édition rapide, Suppression) */}
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              border: '1px solid var(--border)',
                              background: '#ffffff',
                              color: 'var(--text2)',
                              cursor: 'pointer',
                            }}
                          >
                            <MoreVertical size={13} />
                          </button>

                          {/* Dropdown Menu */}
                          {activeMenuId === p.id && (
                            <div
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: 32,
                                background: '#ffffff',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                zIndex: 50,
                                minWidth: 160,
                                padding: '4px 0',
                                textAlign: 'left',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null)
                                  setModalDetailId(p.id)
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  width: '100%',
                                  padding: '7px 12px',
                                  fontSize: 12,
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--navy)',
                                }}
                              >
                                <Package size={13} />
                                <span>Fiche 360°</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null)
                                  setModalEditProd(p)
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  width: '100%',
                                  padding: '7px 12px',
                                  fontSize: 12,
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--navy)',
                                }}
                              >
                                <Edit size={13} />
                                <span>Édition rapide</span>
                              </button>
                              <a
                                href={`/boutiques/${p.boutique_slug}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setActiveMenuId(null)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  width: '100%',
                                  padding: '7px 12px',
                                  fontSize: 12,
                                  textDecoration: 'none',
                                  color: 'var(--accent)',
                                  boxSizing: 'border-box',
                                }}
                              >
                                <ExternalLink size={13} />
                                <span>Voir vitrine</span>
                              </a>
                              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null)
                                  setModalDeleteProd(p)
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  width: '100%',
                                  padding: '7px 12px',
                                  fontSize: 12,
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#b91c1c',
                                }}
                              >
                                <Trash2 size={13} />
                                <span>Supprimer</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales Fonctionnelles */}
      {modalModerationProd && (
        <ModalModererProduit
          produit={modalModerationProd}
          onClose={() => setModalModerationProd(null)}
          onSuccess={handleUpdateProduit}
        />
      )}

      {modalContactProd && (
        <ModalMessageMarchand
          produit={modalContactProd}
          onClose={() => setModalContactProd(null)}
        />
      )}

      {modalDetailId && (
        <ModalDetailProduit
          produitId={modalDetailId}
          onClose={() => setModalDetailId(null)}
          onOpenModeration={(prod) => {
            setModalDetailId(null)
            setModalModerationProd(prod)
          }}
          onOpenContact={(prod) => {
            setModalDetailId(null)
            setModalContactProd(prod)
          }}
          onOpenEdit={(prod) => {
            setModalDetailId(null)
            setModalEditProd(prod)
          }}
          onOpenDelete={(prod) => {
            setModalDetailId(null)
            setModalDeleteProd(prod)
          }}
        />
      )}

      {modalEditProd && (
        <ModalEditionRapideProduit
          produit={modalEditProd}
          onClose={() => setModalEditProd(null)}
          onSuccess={handleUpdateProduit}
        />
      )}

      {modalDeleteProd && (
        <ModalSupprimerProduit
          produit={modalDeleteProd}
          onClose={() => setModalDeleteProd(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  )
}
