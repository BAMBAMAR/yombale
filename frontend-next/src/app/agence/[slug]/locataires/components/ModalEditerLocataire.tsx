'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  UserCheck
} from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'
import { BienOption } from './ModalNouveauLocataire'
import { TabBiensLocataire } from './TabBiensLocataire'

export interface BailData {
  bail_id: string
  bien_id: string
  bien_titre: string
  type_bien?: string
  quartier?: string
  ville?: string
  loyer_mensuel: number
  charges?: number
  depot_garantie?: number
  date_debut?: string
  date_fin?: string
  jour_echeance?: number
  statut: string
  nb_impayes?: number
}

export interface LocataireEditData {
  id: string
  nom: string
  prenom?: string
  telephone?: string
  whatsapp?: string
  email?: string
  profession?: string
  notes?: string
  baux?: BailData[]
  bien_titre?: string
  loyer_mensuel?: number
  nb_impayes?: number
}

interface ModalEditerLocataireProps {
  slug: string
  locataire: LocataireEditData | null
  isOpen: boolean
  biensDispo?: BienOption[]
  onClose: () => void
  onSuccess: () => void
}

export function ModalEditerLocataire({
  slug,
  locataire,
  isOpen,
  biensDispo = [],
  onClose,
  onSuccess,
}: ModalEditerLocataireProps) {
  const [activeTab, setActiveTab] = useState<'profil' | 'biens'>('profil')
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    whatsapp: '',
    email: '',
    profession: '',
    notes: '',
  })
  const [bauxList, setBauxList] = useState<BailData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  useEffect(() => {
    if (locataire) {
      setForm({
        nom: locataire.nom || '',
        prenom: locataire.prenom || '',
        telephone: locataire.telephone || '',
        whatsapp: locataire.whatsapp || locataire.telephone || '',
        email: locataire.email || '',
        profession: locataire.profession || '',
        notes: locataire.notes || '',
      })
      setBauxList(Array.isArray(locataire.baux) ? locataire.baux : [])
      setError(null)
      setSuccess(false)
      setToastMsg(null)
    }
  }, [locataire])

  if (!isOpen || !locataire) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) {
      setError('Le nom de famille est obligatoire.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/crm-immo/agence/${slug}/contacts/${locataire?.id}`, {
        method: 'PUT',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          nom: form.nom.trim(),
          prenom: form.prenom.trim() || null,
          telephone: form.telephone.trim() || null,
          whatsapp: form.whatsapp.trim() || form.telephone.trim() || null,
          email: form.email.trim() || null,
          profession: form.profession.trim() || null,
          notes: form.notes.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la mise à jour du locataire.')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 700)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 43, 74, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 14,
          maxWidth: 620,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
      >
        {/* En-tête */}
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--border, #E8DDD2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                {locataire.prenom ? `${locataire.prenom} ` : ''}{locataire.nom}
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748B' }}>
                Fiche locataire & Gestion des biens loués sous contrat
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Onglets Profil vs Biens associés */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button
              type="button"
              onClick={() => setActiveTab('profil')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'profil' ? 'var(--navy, #1C2B4A)' : '#F1EBE4',
                color: activeTab === 'profil' ? '#FFFFFF' : '#475569',
              }}
            >
              Coordonnées & Contact
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('biens')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'biens' ? 'var(--navy, #1C2B4A)' : '#F1EBE4',
                color: activeTab === 'biens' ? '#FFFFFF' : '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Building2 size={13} />
              <span>Biens & Baux rattachés ({bauxList.length})</span>
            </button>
          </div>
        </div>

        {/* Corps avec scroll */}
        <div style={{ padding: '18px 24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#FEE2E2',
                color: '#DC2626',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
              }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                padding: '10px 14px',
                background: '#DCFCE7',
                color: '#166534',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
              }}
            >
              <CheckCircle2 size={16} />
              Coordonnées mises à jour avec succès !
            </div>
          )}

          {toastMsg && (
            <div
              style={{
                padding: '10px 14px',
                background: '#DCFCE7',
                color: '#166534',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
              }}
            >
              <CheckCircle2 size={16} />
              {toastMsg}
            </div>
          )}

          {/* Onglet 1 : Profil & Coordonnées */}
          {activeTab === 'profil' && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Nom de famille *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nom}
                    onChange={e => setForm({ ...form, nom: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '9px 12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={e => setForm({ ...form, prenom: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '9px 12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Téléphone principal
                  </label>
                  <input
                    type="tel"
                    value={form.telephone}
                    onChange={e => setForm({ ...form, telephone: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '9px 12px' }}
                    placeholder="+221 77..."
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '9px 12px' }}
                    placeholder="+221 77..."
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '9px 12px' }}
                    placeholder="locataire@email.com"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Profession
                  </label>
                  <input
                    type="text"
                    value={form.profession}
                    onChange={e => setForm({ ...form, profession: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '9px 12px' }}
                    placeholder="Architecte, Salarié..."
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Notes confidentielles agence
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '9px 12px', resize: 'vertical' }}
                  placeholder="Observations sur le profil du locataire..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 8,
                    background: '#FAF8F5',
                    border: '1px solid var(--border, #E8DDD2)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-npl"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '9px 18px',
                    borderRadius: 8,
                    background: 'var(--accent, #C75B00)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Save size={16} />
                  {loading ? 'Enregistrement...' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          )}

          {/* Onglet 2 : Biens & Baux rattachés */}
          {activeTab === 'biens' && (
            <TabBiensLocataire
              slug={slug}
              locataireId={locataire.id}
              bauxList={bauxList}
              biensDispo={biensDispo}
              onBailCreated={() => {
                setToastMsg('Nouveau bail enregistré et bien associé au locataire.')
                onSuccess()
                setTimeout(() => setToastMsg(null), 4000)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}