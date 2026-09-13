'use client'

import React from 'react'
import { X } from 'lucide-react'

interface ModalEntrepotFormProps {
  isOpen: boolean
  onClose: () => void
  editingId: string | null
  nom: string
  setNom: (val: string) => void
  adresse: string
  setAdresse: (val: string) => void
  ville: string
  setVille: (val: string) => void
  responsable: string
  setResponsable: (val: string) => void
  telephone: string
  setTelephone: (val: string) => void
  estDefaut: boolean
  setEstDefaut: (val: boolean) => void
  saving: boolean
  handleSubmit: (e: React.FormEvent) => void
}

export default function ModalEntrepotForm({
  isOpen,
  onClose,
  editingId,
  nom,
  setNom,
  adresse,
  setAdresse,
  ville,
  setVille,
  responsable,
  setResponsable,
  telephone,
  setTelephone,
  estDefaut,
  setEstDefaut,
  saving,
  handleSubmit,
}: ModalEntrepotFormProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          maxWidth: 460,
          width: '100%',
          padding: 24,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            {editingId ? 'Modifier l’entrepôt' : 'Ajouter un nouveau dépôt'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              Nom du site *
            </label>
            <input
              type="text"
              placeholder="Ex: Entrepôt Keur Massar, Dépôt Sandaga..."
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                Ville
              </label>
              <input
                type="text"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                Téléphone
              </label>
              <input
                type="text"
                placeholder="Ex: 77 123 45 67"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              Adresse détaillée
            </label>
            <input
              type="text"
              placeholder="Ex: Rond-Point Colobane, Magasin N°12"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              Responsable du site
            </label>
            <input
              type="text"
              placeholder="Ex: Moussa Diop"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            <input
              type="checkbox"
              checked={estDefaut}
              onChange={(e) => setEstDefaut(e.target.checked)}
            />
            <span style={{ fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
              Définir comme dépôt principal par défaut
            </span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                background: '#f1f5f9',
                border: 'none',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                background: 'var(--accent, #C75B00)',
                color: '#fff',
                border: 'none',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
