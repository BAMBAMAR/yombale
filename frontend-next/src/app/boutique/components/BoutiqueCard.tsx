'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ExternalImg from '@/components/ExternalImg'
import { Store, Monitor, Edit, Eye, Trash2, Tag, MapPin, Phone, ArrowRight } from 'lucide-react'
import { useTranslation } from '@/i18n/context'
import type { Boutique } from '../types'

interface BoutiqueCardProps {
  boutique: Boutique
  planActif: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null
  onEdit: () => void
  onDelete: () => void
  onManage: () => void
}

export default function BoutiqueCard({
  boutique,
  planActif,
  onEdit,
  onDelete,
  onManage,
}: BoutiqueCardProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [togglingStatut, setTogglingStatut] = useState(false)

  const handleToggleStatut = async () => {
    const nouveauStatut = !boutique.actif
    const msg = nouveauStatut 
      ? 'Voulez-vous réactiver votre boutique et la rendre visible dans l’annuaire Nopalou ?' 
      : 'Voulez-vous désactiver (masquer) votre boutique du catalogue public Nopalou ?'
    if (!confirm(msg)) return

    setTogglingStatut(true)
    try {
      const res = await fetch(`/api/boutiques/${boutique.id}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: nouveauStatut }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        alert('Erreur lors de la modification du statut.')
      }
    } catch {
      alert('Erreur de réseau')
    } finally {
      setTogglingStatut(false)
    }
  }

  return (
    <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', background: '#fff', overflow: 'hidden' }}>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* En-tête : Logo, Nom, Statut, et Actions secondaires */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 20, flexWrap: 'wrap', minWidth: 0, overflow: 'hidden' }}>
          {/* Logo et Nom */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: '1 1 200px', minWidth: 0 }}>
            {boutique.logo_url ? (
              <ExternalImg src={boutique.logo_url} alt={boutique.nom} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 12, flexShrink: 0, border: '1px solid #e2e8f0' }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg, #fff8f2 0%, #fdf0e6 100%)', border: '1px solid #ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Store size={28} style={{ color: '#C75B00' }} />
              </div>
            )}
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <h2 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontWeight: 800, fontSize: 18, margin: '0 0 6px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{boutique.nom}</h2>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {boutique.is_trial ? (
                  <span className="badge-premium" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', fontSize: 10, padding: '2px 8px', border: 'none' }}>
                    1er mois Offert (VIP)
                  </span>
                ) : (
                  <>
                    {planActif === 'business' && <span className="badge-premium" style={{ background: '#1e3a8a', color: '#fff', fontSize: 10, padding: '2px 6px', border: 'none' }}>Business</span>}
                    {planActif === 'pro'      && <span className="badge-premium" style={{ background: '#C75B00', color: '#fff', fontSize: 10, padding: '2px 6px', border: 'none' }}>Pro</span>}
                    {(planActif === 'decouverte' || planActif === 'taf_taf') && <span className="badge-premium" style={{ background: '#22c55e', color: '#064e3b', fontSize: 10, padding: '2px 6px', border: 'none' }}>Taf Taf</span>}
                    {(!planActif || (planActif as any) === 'gratuit') && <span className="badge-premium" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontSize: 10, padding: '2px 6px' }}>Gratuit</span>}
                  </>
                )}
                {boutique.mode_fonctionnement === 'pure_player' ? (
                  <span className="badge-premium" style={{ background: '#fff7ed', color: '#c75b00', borderColor: '#ffedd5', fontSize: 10, padding: '2px 6px' }}>Web</span>
                ) : (
                  <span className="badge-premium" style={{ background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0', fontSize: 10, padding: '2px 6px' }}>POS</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions Secondaires (Icônes) et Statut */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0, maxWidth: '100%' }}>
            <button
              onClick={handleToggleStatut}
              disabled={togglingStatut}
              title={boutique.actif ? "Cliquez pour désactiver (masquer) votre boutique du catalogue public" : "Cliquez pour réactiver et rendre visible votre boutique"}
              style={{
                background: boutique.actif !== false ? '#f0fdf4' : '#f8fafc',
                border: `1px solid ${boutique.actif !== false ? '#bbf7d0' : '#e2e8f0'}`,
                color: boutique.actif !== false ? '#15803d' : '#64748b',
                fontSize: 11,
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: boutique.actif !== false ? '#22c55e' : '#94a3b8', display: 'inline-block' }}></span>
              {boutique.actif !== false ? 'Active' : 'Inactive'}
            </button>
            <div style={{ display: 'flex', gap: 6 }}>
              <a href={`/boutiques/${boutique.slug || boutique.id}`} target="_blank" rel="noreferrer" title="Voir la boutique" style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid #e2e8f0' }}>
                <Eye size={16} />
              </a>
              <button onClick={onEdit} title="Modifier" style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }}>
                <Edit size={16} />
              </button>
              <button onClick={onDelete} title="Supprimer" style={{ width: 32, height: 32, borderRadius: 8, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fecaca', cursor: 'pointer', transition: 'all 0.2s' }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Corps de la carte */}
        {boutique.description && (
          <p style={{ fontSize: 13, color: '#475569', margin: '0 0 16px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{boutique.description}</p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 'auto' }}>
          {boutique.categorie && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
              <Tag size={14} style={{ color: '#94a3b8', flexShrink: 0 }} /> <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{boutique.categorie}</span>
            </div>
          )}
          {boutique.ville && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
              <MapPin size={14} style={{ color: '#94a3b8', flexShrink: 0 }} /> <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{boutique.ville}</span>
            </div>
          )}
          {boutique.telephone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
              <Phone size={14} style={{ color: '#94a3b8', flexShrink: 0 }} /> {boutique.telephone}
            </div>
          )}
        </div>

        {/* Actions Principales et Liens de Gestion (Bas de carte) */}
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Rangée 1 : Services Boutique */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link
              href={`/payer-sponsoring-boutique/${boutique.id}`}
              style={{
                flex: 1,
                minWidth: 110,
                padding: '7px 10px',
                fontSize: 12,
                color: '#475569',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'none',
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                transition: 'all 0.15s ease'
              }}
            >
              <span>Mettre en avant</span>
            </Link>
            <Link
              href="/boutique/abonnement"
              style={{
                flex: 1,
                minWidth: 110,
                padding: '7px 10px',
                fontSize: 12,
                color: '#475569',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'none',
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                transition: 'all 0.15s ease'
              }}
            >
              <span>{t('shop.subscription')}</span>
            </Link>
          </div>

          {/* Rangée 2 : CTA Dominant */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {boutique.mode_fonctionnement !== 'pure_player' && (
              <a
                href={`/boutique/caisse?b=${boutique.id}`}
                style={{
                  flex: 1,
                  minWidth: 110,
                  minHeight: 42,
                  padding: '9px 14px',
                  fontSize: 13,
                  fontWeight: 800,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 6,
                  alignItems: 'center',
                  background: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  color: '#16a34a',
                  borderRadius: 10,
                  textDecoration: 'none',
                  boxShadow: '0 1px 3px rgba(22,163,74,0.08)'
                }}
                onClick={() => typeof window !== 'undefined' && localStorage.setItem('nopalou_pos_active_boutique_id', boutique.id)}
              >
                <Monitor size={15} />
                <span>{t('shop.pos')}</span>
              </a>
            )}
            <button
              onClick={onManage}
              style={{
                flex: boutique.mode_fonctionnement !== 'pure_player' ? 1.5 : 1,
                minWidth: 130,
                minHeight: 42,
                padding: '9px 14px',
                fontSize: 13.5,
                fontWeight: 800,
                display: 'flex',
                justifyContent: 'center',
                gap: 6,
                alignItems: 'center',
                background: 'linear-gradient(135deg, var(--accent, #C75B00) 0%, #ea580c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(199,91,0,0.22)'
              }}
            >
              <span>{t('shop.manageShop')}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
