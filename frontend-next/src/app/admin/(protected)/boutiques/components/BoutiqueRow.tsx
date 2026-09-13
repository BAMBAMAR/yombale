import React, { useTransition } from 'react'
import { Store, MessageSquare, ExternalLink, Trash2 } from 'lucide-react'
import { modererBoutique, supprimerBoutique } from '@/app/actions/admin'
import ExternalImg from '@/components/ExternalImg'
import { Boutique, isSponsorActif, formatDate, genererMessageGuide } from './types'

interface BoutiqueRowProps {
  boutique: Boutique
  isSelected: boolean
  onToggleSelect: () => void
  onAction: () => void
  onOpenGestion: (b: Boutique) => void
  onOpenRelance: (b: Boutique) => void
}

export default function BoutiqueRow({
  boutique,
  isSelected,
  onToggleSelect,
  onAction,
  onOpenGestion,
  onOpenRelance,
}: BoutiqueRowProps) {
  const [pending, startTransition] = useTransition()
  const sponsorActif = isSponsorActif(boutique)
  const nbProduits = boutique.nb_produits ?? 0

  function handleToggleActif() {
    startTransition(async () => {
      await modererBoutique(boutique.id, !boutique.actif)
      onAction()
    })
  }

  function handleSupprimer() {
    if (!window.confirm(`Supprimer définitivement la boutique "${boutique.nom}" ?`)) return
    startTransition(async () => {
      await supprimerBoutique(boutique.id)
      onAction()
    })
  }

  const tel = boutique.whatsapp || boutique.telephone || boutique.proprietaire_telephone || ''
  const cleanPhone = tel.replace(/\D/g, '')
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`}?text=${encodeURIComponent(genererMessageGuide(boutique))}`
    : null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        background: '#fff',
        border: '1px solid var(--border)',
        borderLeft:
          boutique.plan_actif === 'business'
            ? '4px solid #1e3a5f'
            : boutique.plan_actif === 'pro'
              ? '4px solid var(--accent, #C75B00)'
              : sponsorActif
                ? '4px solid #D97706'
                : '4px solid var(--border)',
        borderRadius: 10,
        padding: '12px 16px',
        opacity: pending ? 0.5 : 1,
        transition: 'opacity .2s',
      }}
    >
      {/* Checkbox */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }}
        />
      </div>

      {/* Logo */}
      <div
        style={{
          flexShrink: 0,
          width: 52,
          height: 52,
          borderRadius: 8,
          overflow: 'hidden',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {boutique.logo_url ? (
          <ExternalImg
            src={boutique.logo_url}
            alt={boutique.nom}
            style={{ width: 52, height: 52, objectFit: 'cover' }}
            fallback={<Store size={22} color="#94a3b8" />}
          />
        ) : (
          <Store size={22} color="#94a3b8" />
        )}
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{boutique.nom}</span>
          {boutique.plan_actif === 'business' && (
            <span style={{ fontSize: 10, background: '#1e3a5f', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
              BUSINESS
            </span>
          )}
          {boutique.plan_actif === 'pro' && (
            <span style={{ fontSize: 10, background: 'var(--accent, #C75B00)', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
              PRO
            </span>
          )}
          {sponsorActif && (
            <span style={{ fontSize: 10, background: '#D97706', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
              SPONSOR
            </span>
          )}

          {/* Badge Nombre de Produits */}
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 6,
              background:
                nbProduits === 0 ? '#fee2e2' : nbProduits === 1 ? '#ffedd5' : nbProduits <= 3 ? '#fef9c3' : '#dcfce7',
              color:
                nbProduits === 0 ? '#991b1b' : nbProduits === 1 ? '#9a3412' : nbProduits <= 3 ? '#854d0e' : '#166534',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {nbProduits === 0
              ? '0 produit (vide)'
              : nbProduits === 1
                ? '1 produit'
                : `${nbProduits} produits`}
          </span>

          {boutique.nb_relances_catalogue && boutique.nb_relances_catalogue > 0 ? (
            <span
              title={
                boutique.derniere_relance_catalogue_at
                  ? `Dernière relance le ${formatDate(boutique.derniere_relance_catalogue_at)}`
                  : ''
              }
              style={{ fontSize: 10, background: '#ede9fe', color: '#5b21b6', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}
            >
              {boutique.nb_relances_catalogue} relance{boutique.nb_relances_catalogue > 1 ? 's' : ''}
            </span>
          ) : null}

          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{boutique.categorie ?? ''}</span>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 1 }}>
          {boutique.proprietaire_nom || '—'} · {boutique.proprietaire_email || '—'}
          {boutique.telephone ? ` · ${boutique.telephone}` : ''}
          {boutique.whatsapp && boutique.whatsapp !== boutique.telephone ? ` · ${boutique.whatsapp}` : ''}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
          {[boutique.adresse, boutique.ville].filter(Boolean).join(', ') || 'Dakar'}
          {' · '}Créée le {formatDate(boutique.created_at)}
          {boutique.plan_actif && boutique.plan_fin && (
            <span style={{ color: boutique.plan_actif === 'business' ? '#1e3a5f' : 'var(--accent, #C75B00)', fontWeight: 600 }}>
              {' · '}Plan jusqu&apos;au {formatDate(boutique.plan_fin)}
            </span>
          )}
          {sponsorActif && boutique.sponsor_jusqu_au && (
            <span style={{ color: '#D97706', fontWeight: 600 }}>
              {' · '}Sponsor jusqu&apos;au {formatDate(boutique.sponsor_jusqu_au)}
            </span>
          )}
        </div>
      </div>

      {/* Statut */}
      <div style={{ flexShrink: 0 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 20,
            background: boutique.actif ? '#dcfce7' : '#f1f5f9',
            color: boutique.actif ? '#16a34a' : '#94a3b8',
          }}
        >
          {boutique.actif ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Actions */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 150 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={() => onOpenRelance(boutique)}
            style={{
              flex: 1,
              background: 'var(--accent, #C75B00)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 11,
              padding: '6px 8px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
            title="Envoyer le guide d'ajout de produits au marchand"
          >
            Relancer
          </button>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                background: '#25D366',
                color: '#fff',
                borderRadius: 6,
                padding: '6px 8px',
                fontSize: 12,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Ouvrir directement dans WhatsApp Web avec message pré-rempli"
            >
              <MessageSquare size={14} />
            </a>
          )}
        </div>

        <button
          type="button"
          onClick={() => onOpenGestion(boutique)}
          style={{
            background: '#1e3a5f',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 11,
            padding: '6px 10px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Gérer le marchand
        </button>

        <a
          href="/admin/migration"
          style={{
            background: '#0284c7',
            color: '#fff',
            border: 'none',
            textDecoration: 'none',
            borderRadius: 6,
            fontSize: 11,
            padding: '6px 10px',
            fontWeight: 700,
            textAlign: 'center',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          Migrer Catalogue
        </a>

        <div style={{ display: 'flex', gap: 6 }}>
          <a
            href={`/boutiques/${boutique.slug || boutique.id}`}
            target="_blank"
            rel="noreferrer"
            className="admin-btn"
            style={{
              fontSize: 11,
              flex: 1,
              textAlign: 'center',
              textDecoration: 'none',
              background: '#f8fafc',
              color: 'var(--navy)',
              border: '1px solid var(--border)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            Voir <ExternalLink size={10} />
          </a>
          <button
            type="button"
            onClick={handleToggleActif}
            disabled={pending}
            className={`admin-btn ${boutique.actif ? 'admin-btn--rejeter' : 'admin-btn--approuver'}`}
            style={{ fontSize: 11, flex: 1 }}
          >
            {pending ? '…' : boutique.actif ? 'Désact.' : 'Réact.'}
          </button>
          <button
            type="button"
            onClick={handleSupprimer}
            disabled={pending}
            className="admin-btn admin-btn--rejeter"
            style={{
              fontSize: 11,
              background: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fca5a5',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Supprimer la boutique"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
