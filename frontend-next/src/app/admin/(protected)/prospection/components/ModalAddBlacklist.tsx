import React from 'react'
import { ShieldAlert, X } from 'lucide-react'
import type { AddBlacklistFormState } from './types'

interface Props {
  isOpen: boolean
  onClose: () => void
  blacklistAddForm: AddBlacklistFormState
  setBlacklistAddForm: React.Dispatch<React.SetStateAction<AddBlacklistFormState>>
  isAddingBlacklist: boolean
  onAddBlacklist: (e: React.FormEvent) => Promise<void>
}

export default function ModalAddBlacklist({
  isOpen,
  onClose,
  blacklistAddForm,
  setBlacklistAddForm,
  isAddingBlacklist,
  onAddBlacklist,
}: Props) {
  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-blacklist-title"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 20, padding: '28px', maxWidth: 480, width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3
            id="modal-blacklist-title"
            style={{ fontSize: 20, fontWeight: 900, color: 'var(--red-600, #DC2626)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <ShieldAlert size={22} aria-hidden="true" /> Inscrire un Numéro sur la Blacklist
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre modale"
            title="Fermer"
            style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#64748B' }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={onAddBlacklist} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              htmlFor="blacklist-phone-input"
              style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}
            >
              Numéro de Téléphone *
            </label>
            <input
              id="blacklist-phone-input"
              type="text"
              required
              placeholder="Ex: 77 123 45 67 ou 221771234567"
              value={blacklistAddForm.phone}
              onChange={(e) => setBlacklistAddForm({ ...blacklistAddForm, phone: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
            />
          </div>

          <div>
            <label
              htmlFor="blacklist-reason-select"
              style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}
            >
              Motif / Raison du blocage
            </label>
            <select
              id="blacklist-reason-select"
              value={blacklistAddForm.reason}
              onChange={(e) => setBlacklistAddForm({ ...blacklistAddForm, reason: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600 }}
            >
              <option value="STOP / Opt-Out (WhatsApp)">STOP / Opt-Out (Demande WhatsApp)</option>
              <option value="Plainte / Refus explicite">Plainte / Refus explicite</option>
              <option value="Numéro erroné / Invalide">Numéro erroné / Invalide</option>
              <option value="Désinscription manuelle Admin">Désinscription manuelle Admin</option>
              <option value="Hors Cible">Hors Cible / Particulier</option>
            </select>
          </div>

          <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
            Ce numéro sera immédiatement exclu de toutes les campagnes futures, relances et notifications WhatsApp.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 16px', background: '#F1F5F9', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isAddingBlacklist}
              style={{
                padding: '10px 18px', background: 'var(--red-600, #DC2626)', color: '#fff', border: 'none',
                borderRadius: 8, fontWeight: 800, cursor: isAddingBlacklist ? 'not-allowed' : 'pointer',
              }}
            >
              {isAddingBlacklist ? 'Ajout...' : 'Inscrire en Blacklist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
