'use client'

import React from 'react'
import { Eye, EyeOff, Trash2 } from 'lucide-react'

export interface Caissier {
  id: string
  nom: string
  prenom: string
  code_pin: string
  role: string
  actif: boolean
}

interface CaissierCardItemProps {
  caissier: Caissier
  isTrivial: boolean
  isEditing: boolean
  editPin: string
  setEditPin: (pin: string) => void
  showEditPin: boolean
  setShowEditPin: (show: boolean) => void
  savingEdit: boolean
  handleSavePin: (id: string) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  handleToggleActif: (caissier: Caissier) => void
  handleDelete: (id: string) => void
  t: (key: string) => string
}

export default function CaissierCardItem({
  caissier,
  isTrivial,
  isEditing,
  editPin,
  setEditPin,
  showEditPin,
  setShowEditPin,
  savingEdit,
  handleSavePin,
  onStartEdit,
  onCancelEdit,
  handleToggleActif,
  handleDelete,
  t,
}: CaissierCardItemProps) {
  return (
    <div
      className="npl-card-subtle"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        padding: '14px 16px',
        background: '#ffffff',
        border: isTrivial ? '1.5px solid #fed7aa' : '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: caissier.actif
              ? caissier.role === 'superviseur'
                ? '#fef3c7'
                : '#eff6ff'
              : '#f1f5f9',
            border: caissier.actif
              ? caissier.role === 'superviseur'
                ? '1px solid #fde68a'
                : '1px solid #bfdbfe'
              : '1px solid #cbd5e1',
            color: caissier.actif
              ? caissier.role === 'superviseur'
                ? '#b45309'
                : '#1d4ed8'
              : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          {(caissier.nom || 'C').charAt(0).toUpperCase()}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--navy)' }}>
              {caissier.prenom} {caissier.nom}
            </span>
            <span
              className={`npl-badge ${caissier.actif ? 'npl-badge-success' : 'npl-badge-neutral'}`}
              style={{ fontSize: 11 }}
            >
              <span className="npl-badge-dot" />
              <span>{caissier.actif ? t('shop.activeStatus') : t('shop.inactiveStatus')}</span>
            </span>
            {caissier.role === 'superviseur' && (
              <span className="npl-badge npl-badge-warning" style={{ fontSize: 11 }}>
                {t('shop.roleCashierSupervisor')}
              </span>
            )}
            {isTrivial && (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: '#dc2626',
                  background: '#fef2f2',
                  padding: '2px 8px',
                  borderRadius: 6,
                  border: '1px solid #fecaca',
                }}
              >
                PIN d&apos;usine à changer
              </span>
            )}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
            {isEditing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showEditPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={6}
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Nouveau PIN"
                    style={{
                      width: 130,
                      padding: '6px 30px 6px 8px',
                      fontSize: 13,
                      borderRadius: 6,
                      border: '1.5px solid #ea580c',
                      fontWeight: 800,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPin(!showEditPin)}
                    style={{
                      position: 'absolute',
                      right: 6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showEditPin ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button
                  onClick={() => handleSavePin(caissier.id)}
                  disabled={savingEdit || editPin.length < 4}
                  className="npl-btn npl-btn-primary npl-btn-sm"
                  style={{ padding: '6px 12px', fontSize: 12, color: '#ffffff' }}
                >
                  {savingEdit ? '...' : t('common.save')}
                </button>
                <button
                  onClick={onCancelEdit}
                  className="npl-btn npl-btn-secondary npl-btn-sm"
                  style={{ padding: '6px 10px', fontSize: 12 }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>
                  Code PIN : <strong>••••</strong>
                </span>
                <button
                  onClick={onStartEdit}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ea580c',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: '0 4px',
                  }}
                >
                  Modifier le PIN
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => handleToggleActif(caissier)}
          className={`npl-btn ${caissier.actif ? 'npl-btn-secondary' : 'npl-btn-success'} npl-btn-sm`}
        >
          {caissier.actif ? t('shop.inactiveStatus') : t('shop.activeStatus')}
        </button>
        <button
          type="button"
          onClick={() => handleDelete(caissier.id)}
          className="npl-btn npl-btn-danger npl-btn-sm"
          title="Supprimer ce caissier"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
