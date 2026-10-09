'use client'

import React from 'react'
import { X, Save } from 'lucide-react'

interface AdminVideoSourceModalProps {
  isOpen: boolean
  editionId: string | null
  formNom: string
  formChaine: string
  formType: 'SERIE' | 'LUTTE'
  formFlux: string
  formActif: boolean
  sauvegardeEnCours: boolean
  onClose: () => void
  onChangeNom: (val: string) => void
  onChangeChaine: (val: string) => void
  onChangeType: (val: 'SERIE' | 'LUTTE') => void
  onChangeFlux: (val: string) => void
  onChangeActif: (val: boolean) => void
  onSubmit: (e: React.FormEvent) => void
}

export default function AdminVideoSourceModal({
  isOpen,
  editionId,
  formNom,
  formChaine,
  formType,
  formFlux,
  formActif,
  sauvegardeEnCours,
  onClose,
  onChangeNom,
  onChangeChaine,
  onChangeType,
  onChangeFlux,
  onChangeActif,
  onSubmit,
}: AdminVideoSourceModalProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(11, 19, 43, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
            {editionId ? 'Modifier la Source Vidéo' : 'Ajouter une Chaîne / Série'}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 5 }}>
              Nom d affichage :
            </label>
            <input
              type="text"
              value={formNom}
              onChange={(e) => onChangeNom(e.target.value)}
              placeholder="Ex: Marodi TV (Séries & Fictions)"
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 5 }}>
              Nom de la chaîne officielle :
            </label>
            <input
              type="text"
              value={formChaine}
              onChange={(e) => onChangeChaine(e.target.value)}
              placeholder="Ex: Marodi TV Sénégal"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 5 }}>
                Catégorie :
              </label>
              <select
                value={formType}
                onChange={(e) => onChangeType(e.target.value as any)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              >
                <option value="SERIE">SÉRIE TV</option>
                <option value="LUTTE">LUTTE SÉNÉGALAISE</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 5 }}>
                Statut :
              </label>
              <select
                value={formActif ? '1' : '0'}
                onChange={(e) => onChangeActif(e.target.value === '1')}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              >
                <option value="1">Actif (Collecté)</option>
                <option value="0">Inactif (Mis en pause)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 5 }}>
              Identifiant YouTube (Channel ID ou Playlist ID) :
            </label>
            <input
              type="text"
              value={formFlux}
              onChange={(e) => onChangeFlux(e.target.value)}
              placeholder="Ex: UCt7g3Z1YF67-Yc7_N8j9bXw ou PL..."
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontFamily: 'monospace' }}
            />
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
              Le flux Atom officiel YouTube sera généré automatiquement sans quota API payant.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={sauvegardeEnCours}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#F59E0B', color: '#0F172A', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Save size={14} />
              <span>{sauvegardeEnCours ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
