'use client'

import React, { useState, useTransition } from 'react'
import {
  Check,
  X,
  Pause,
  RotateCcw,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { modererAnnonce, supprimerAnnonce, boosterAnnonce } from '@/app/actions/admin'
import ExternalImg from '@/components/ExternalImg'
import { Annonce, CATEGORIES_LABELS, formatDate, formatPrix, statutClass } from './types'
import AnnonceStatutBadge from './AnnonceStatutBadge'

interface AdminAnnonceRowProps {
  annonce: Annonce
  isSelected: boolean
  onToggleSelect: () => void
  onAction?: () => void
  onUpdate?: (updates: Partial<Annonce>) => void
  onDelete?: () => void
}

export default function AdminAnnonceRow({
  annonce,
  isSelected,
  onToggleSelect,
  onAction,
  onUpdate,
  onDelete,
}: AdminAnnonceRowProps) {
  const [pending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)

  function handleAction(action: 'approuver' | 'rejeter') {
    startTransition(async () => {
      try {
        const res = await modererAnnonce(annonce.id, action)
        if (res.error) {
          alert('Erreur : ' + res.error)
          return
        }
        if (action === 'approuver') {
          onUpdate ? onUpdate({ actif: true, rejete: false }) : onAction?.()
        } else {
          onUpdate ? onUpdate({ actif: false, rejete: true }) : onAction?.()
        }
      } catch (err: any) {
        alert('Erreur inattendue : ' + (err?.message || String(err)))
      }
    })
  }

  function handleBoost(jours = 7) {
    startTransition(async () => {
      try {
        const res = await boosterAnnonce(annonce.id, jours)
        if (res.error) {
          alert('Erreur : ' + res.error)
          return
        }
        const boostUntil = res.boost_until || new Date(Date.now() + jours * 86400000).toISOString()
        onUpdate ? onUpdate({ boost_until: boostUntil, actif: true, rejete: false }) : onAction?.()
      } catch (err: any) {
        alert('Erreur inattendue : ' + (err?.message || String(err)))
      }
    })
  }

  function handleSupprimer() {
    if (!window.confirm('Supprimer définitivement cette annonce ?')) return
    startTransition(async () => {
      try {
        const res = await supprimerAnnonce(annonce.id)
        if (res.error) {
          alert('Erreur : ' + res.error)
          return
        }
        onDelete ? onDelete() : onAction?.()
      } catch (err: any) {
        alert('Erreur inattendue : ' + (err?.message || String(err)))
      }
    })
  }

  const allPhotos = Array.isArray(annonce.photos) ? annonce.photos : []
  const photo = allPhotos[0] ?? null
  const prix = formatPrix(annonce.prix)
  const isBooste = Boolean(annonce.boost_until && new Date(annonce.boost_until) > new Date())

  return (
    <div
      className={`admin-annonce-row ${statutClass(annonce)}${pending ? ' admin-annonce-row--loading' : ''}`}
      style={{ position: 'relative' }}
    >
      {/* Checkbox de sélection */}
      <div style={{ padding: '12px 0 0 16px', display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }}
        />
      </div>

      {/* Corps principal */}
      <div className="admin-annonce-body">
        {/* Photo */}
        <div className="admin-annonce-thumb">
          {photo ? (
            <ExternalImg
              src={photo}
              alt={annonce.titre}
              className="admin-annonce-img"
              fallback={<div className="admin-annonce-img--vide" />}
            />
          ) : (
            <div className="admin-annonce-img--vide" />
          )}
        </div>

        {/* Infos */}
        <div className="admin-annonce-info">
          <div className="admin-annonce-header-row">
            <p className="admin-annonce-titre">{annonce.titre}</p>
            {prix && <span className="admin-annonce-prix">{prix}</span>}
          </div>

          <div className="admin-annonce-badges">
            <AnnonceStatutBadge annonce={annonce} />
            {annonce.payee && <span className="admin-annonce-payee">Payée</span>}
          </div>

          <div className="admin-annonce-meta">
            <span style={{ fontWeight: 600, color: '#1e3a5f' }}>
              {CATEGORIES_LABELS[annonce.categorie_slug] || annonce.categorie_slug}
            </span>
            <span className="admin-annonce-meta-sep">·</span>
            <span>{annonce.ville || 'Dakar'}</span>
          </div>

          <div className="admin-annonce-meta">
            <span>{annonce.auteur_nom || 'Anonyme'}</span>
            <span className="admin-annonce-meta-sep">·</span>
            <span>{annonce.auteur_email || '—'}</span>
            <span className="admin-annonce-meta-sep">·</span>
            <span>{annonce.contact_tel}</span>
          </div>

          <p className="admin-annonce-date">Déposée le {formatDate(annonce.created_at)}</p>
        </div>

        {/* Actions */}
        <div className="admin-annonce-actions-col">
          {!annonce.actif && !annonce.rejete && (
            <>
              <button
                type="button"
                onClick={() => handleAction('approuver')}
                disabled={pending}
                className="admin-btn admin-btn--approuver"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
              >
                <Check size={14} />
                <span>Approuver</span>
              </button>
              <button
                type="button"
                onClick={() => handleAction('rejeter')}
                disabled={pending}
                className="admin-btn admin-btn--rejeter"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
              >
                <X size={14} />
                <span>Rejeter</span>
              </button>
            </>
          )}
          {annonce.actif && (
            <button
              type="button"
              onClick={() => handleAction('rejeter')}
              disabled={pending}
              className="admin-btn admin-btn--desactiver"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
            >
              <Pause size={14} />
              <span>Désactiver</span>
            </button>
          )}
          {!annonce.actif && annonce.rejete && (
            <button
              type="button"
              onClick={() => handleAction('approuver')}
              disabled={pending}
              className="admin-btn admin-btn--reactiver"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
            >
              <RotateCcw size={14} />
              <span>Réactiver</span>
            </button>
          )}

          {/* Action Booster / Prolonger Boost */}
          <button
            type="button"
            onClick={() => handleBoost(7)}
            disabled={pending}
            className="admin-btn"
            style={{
              background: isBooste ? '#fef3c7' : '#fffbeb',
              color: '#b45309',
              border: '1px solid #fcd34d',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5
            }}
          >
            <Sparkles size={13} />
            <span>{isBooste ? '+7j Boost' : 'Booster 7j'}</span>
          </button>

          <button
            type="button"
            onClick={handleSupprimer}
            disabled={pending}
            className="admin-btn admin-btn--rejeter"
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fca5a5',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5
            }}
          >
            <Trash2 size={13} />
            <span>Supprimer</span>
          </button>
        </div>
      </div>

      {/* Toggle détails */}
      <button
        type="button"
        className="admin-annonce-toggle"
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <span>{expanded ? 'Masquer les détails' : 'Voir détails & photos'}</span>
      </button>

      {/* Détails dépliés */}
      {expanded && (
        <div className="admin-annonce-details">
          {annonce.description ? (
            <p className="admin-annonce-desc">{annonce.description}</p>
          ) : (
            <p className="admin-annonce-no-detail">Aucune description.</p>
          )}
          {allPhotos.length > 0 && (
            <div className="admin-annonce-photos">
              {allPhotos.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noreferrer">
                  <ExternalImg
                    src={src}
                    alt={`Photo ${i + 1}`}
                    className="admin-annonce-photo-thumb"
                    fallback={<div className="admin-annonce-img--vide" style={{ width: 64, height: 64 }} />}
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
