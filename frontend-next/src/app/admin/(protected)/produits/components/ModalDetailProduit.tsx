'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  X,
  Package,
  Store,
  Layers,
  Phone,
  Mail,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  User,
  ExternalLink,
  Edit,
  MessageSquare,
  AlertTriangle,
  Trash2,
} from 'lucide-react'
import { fcfa, fmtDate } from '@/lib/format'
import { adminGetProduitDetail } from '@/app/actions/admin'

interface ModalDetailProduitProps {
  produitId: string
  onClose: () => void
  onOpenModeration: (prod: any) => void
  onOpenContact: (prod: any) => void
  onOpenEdit: (prod: any) => void
  onOpenDelete: (prod: any) => void
}

export default function ModalDetailProduit({
  produitId,
  onClose,
  onOpenModeration,
  onOpenContact,
  onOpenEdit,
  onOpenDelete,
}: ModalDetailProduitProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [imageIndex, setImageIndex] = useState(0)

  useEffect(() => {
    let mounted = true
    adminGetProduitDetail(produitId)
      .then((res) => {
        if (mounted && res.success) {
          setData(res)
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [produitId])

  const p = data?.produit
  const images = Array.isArray(p?.images) ? p.images : []
  const isSuspendu = p?.statut_moderation === 'suspendu' || (p?.en_stock === false && p?.motif_moderation)

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal"
        style={{ maxWidth: 680, padding: '24px 28px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--bg, #f8f5f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--navy)',
              }}
            >
              <Package size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--navy)' }}>
                Fiche Inspection Produit 360°
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                ID : {produitId}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
            Chargement des détails de l&apos;article...
          </div>
        ) : !p ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: '#b91c1c', fontSize: 13 }}>
            Produit introuvable ou erreur de chargement.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Statut de Modération Actuel */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: isSuspendu ? '1px solid #fca5a5' : '1px solid #a7f3d0',
                background: isSuspendu ? '#fef2f2' : '#ecfdf5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isSuspendu ? (
                  <ShieldAlert size={18} style={{ color: '#b91c1c' }} />
                ) : (
                  <CheckCircle2 size={18} style={{ color: '#047857' }} />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: isSuspendu ? '#991b1b' : '#065f46' }}>
                    {isSuspendu ? 'Article Suspendu / Hors-Ligne' : 'Article Actif & Conforme'}
                  </div>
                  {p.motif_moderation && (
                    <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 2 }}>
                      <strong>Motif :</strong> {p.motif_moderation}
                    </div>
                  )}
                  {p.modere_le && (
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                      Modéré le {fmtDate(p.modere_le)} {p.modere_par ? `par ${p.modere_par}` : ''}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenModeration(p)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSuspendu ? '1px solid #047857' : '1px solid #b91c1c',
                  background: isSuspendu ? '#047857' : '#b91c1c',
                  color: '#ffffff',
                }}
              >
                {isSuspendu ? 'Réactiver' : 'Suspendre'}
              </button>
            </div>

            {/* Photos & Informations Générales */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16 }}>
              {/* Galerie Photos */}
              <div>
                <div
                  style={{
                    width: '100%',
                    height: 180,
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: '#f1f5f9',
                    position: 'relative',
                    border: '1px solid var(--border)',
                  }}
                >
                  {images[imageIndex] ? (
                    <Image
                      src={images[imageIndex]}
                      alt={p.nom}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
                      <Package size={32} />
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto' }}>
                    {images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageIndex(idx)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 4,
                          overflow: 'hidden',
                          position: 'relative',
                          border: imageIndex === idx ? '2px solid var(--accent)' : '1px solid var(--border)',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <Image src={img} alt="" fill style={{ objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fiche Produit */}
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>
                  {p.nom}
                </h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>
                    {fcfa(p.prix)}
                  </span>
                  {p.prix_barre && (
                    <span style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'line-through' }}>
                      {fcfa(p.prix_barre)}
                    </span>
                  )}
                  {p.prix_achat && (
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                      (Achat: {fcfa(p.prix_achat)})
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, marginBottom: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text3)' }}>Catégorie : </span>
                    <strong>{p.categorie || 'Général'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text3)' }}>Stock disponible : </span>
                    <strong>{p.stock_quantite !== null ? `${p.stock_quantite} unités` : 'Illimité'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text3)' }}>Unité de vente : </span>
                    <strong>{p.unite_vente || 'Pièce'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text3)' }}>Code-barres : </span>
                    <strong>{p.code_barre || 'Aucun'}</strong>
                  </div>
                </div>

                {p.description && (
                  <div style={{ fontSize: 12, color: 'var(--text2)', background: '#f8fafc', padding: '8px 12px', borderRadius: 6, maxHeight: 90, overflowY: 'auto' }}>
                    {p.description}
                  </div>
                )}
              </div>
            </div>

            {/* Infos Boutique & Propriétaire */}
            <div
              style={{
                background: 'var(--bg, #f8f5f0)',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>
                  <Store size={14} style={{ color: 'var(--accent)' }} />
                  <span>{p.boutique_nom}</span>
                  <a
                    href={`/boutiques/${p.boutique_slug}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11 }}
                  >
                    <span>Voir vitrine</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 12, marginTop: 4, color: 'var(--text2)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <User size={12} /> {p.proprietaire_nom || 'Non renseigné'}
                  </span>
                  {(p.proprietaire_tel || p.boutique_tel) && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={12} /> {p.proprietaire_tel || p.boutique_tel}
                    </span>
                  )}
                  {p.proprietaire_email && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Mail size={12} /> {p.proprietaire_email}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenContact(p)}
                className="btn-npl"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  background: 'var(--navy)',
                  color: '#ffffff',
                }}
              >
                <MessageSquare size={13} />
                <span>Contacter</span>
              </button>
            </div>

            {/* Variantes si présentes */}
            {data?.variantes && data.variantes.length > 0 && (
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Layers size={13} /> Variantes configurées ({data.variantes.length})
                </span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                  {data.variantes.map((v: any) => (
                    <div
                      key={v.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid var(--border)',
                        padding: '6px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                      }}
                    >
                      <strong>{v.sku || 'Variante'} : </strong>
                      <span>{fcfa(v.prix)}</span>
                      <span style={{ color: 'var(--text3)', marginLeft: 4 }}>({v.stock_quantite} dispo)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historique Audit Logs */}
            {data?.auditLogs && data.auditLogs.length > 0 && (
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Historique de modération & modifications :
                </span>
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.auditLogs.map((log: any) => (
                    <div
                      key={log.id}
                      style={{
                        fontSize: 11,
                        background: '#f8fafc',
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ color: 'var(--navy)' }}>{log.description}</span>
                      <span style={{ color: 'var(--text3)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                        {fmtDate(log.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Barre d'Actions Inférieure */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border)',
                paddingTop: 16,
                marginTop: 8,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={() => onOpenDelete(p)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  color: '#b91c1c',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <Trash2 size={13} />
                <span>Supprimer l&apos;article</span>
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => onOpenEdit(p)}
                  className="btn-npl"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    background: '#ffffff',
                    border: '1px solid var(--border)',
                    color: 'var(--navy)',
                  }}
                >
                  <Edit size={13} />
                  <span>Édition rapide</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenModeration(p)}
                  className="btn-npl"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    background: isSuspendu ? '#047857' : '#b91c1c',
                    color: '#ffffff',
                    border: 'none',
                  }}
                >
                  <ShieldAlert size={13} />
                  <span>{isSuspendu ? 'Réactiver' : 'Suspendre'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
