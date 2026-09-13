'use client'

import React from 'react'
import { Eye, EyeOff, Plus, UserPlus } from 'lucide-react'

interface CaissierAddFormProps {
  handleAddCaissier: (e: React.FormEvent) => void
  newNom: string
  setNewNom: (nom: string) => void
  newPrenom: string
  setNewPrenom: (prenom: string) => void
  newPin: string
  setNewPin: (pin: string) => void
  showNewPin: boolean
  setShowNewPin: (show: boolean) => void
  newRole: string
  setNewRole: (role: string) => void
  adding: boolean
  t: (key: string) => string
}

export default function CaissierAddForm({
  handleAddCaissier,
  newNom,
  setNewNom,
  newPrenom,
  setNewPrenom,
  newPin,
  setNewPin,
  showNewPin,
  setShowNewPin,
  newRole,
  setNewRole,
  adding,
  t,
}: CaissierAddFormProps) {
  return (
    <form
      onSubmit={handleAddCaissier}
      style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '16px 18px',
        marginBottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}
    >
      <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <UserPlus size={15} />
        <span>{t('shop.addCashier')}</span>
      </label>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 10,
          width: '100%',
        }}
      >
        <input
          type="text"
          placeholder={t('shop.lastNamePlaceholder')}
          value={newNom}
          onChange={(e) => setNewNom(e.target.value)}
          required
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 13.5,
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
        <input
          type="text"
          placeholder={t('shop.firstNamePlaceholder')}
          value={newPrenom}
          onChange={(e) => setNewPrenom(e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 13.5,
            width: '100%',
            boxSizing: 'border-box',
          }}
        />

        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type={showNewPin ? 'text' : 'password'}
            inputMode="numeric"
            maxLength={6}
            placeholder="Code PIN (4 à 6 chiffres)"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
            required
            style={{
              padding: '10px 40px 10px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13.5,
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="button"
            onClick={() => setShowNewPin(!showNewPin)}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
            title="Afficher/Masquer le code PIN"
          >
            {showNewPin ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 13.5,
            background: '#ffffff',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <option value="caissier">{t('shop.roleCashierStandard')}</option>
          <option value="superviseur">{t('shop.roleCashierSupervisor')}</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={adding || !newNom || !newPin || newPin.length < 4}
        className="npl-btn npl-btn-primary npl-btn-md"
        style={{
          width: '100%',
          color: '#ffffff',
          justifySelf: 'stretch',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <Plus size={16} />
        <span>{adding ? t('common.loading') : t('shop.addCashier')}</span>
      </button>
    </form>
  )
}
