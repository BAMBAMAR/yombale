'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, CheckCircle2, AlertCircle, Building2, User, Trash2 } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

export interface BailleurEditData {
  id: string
  nom: string
  prenom?: string
  telephone?: string
  whatsapp?: string
  email?: string
  type_bailleur?: string
  adresse?: string
  iban?: string
  notes?: string
}

interface ModalEditerBailleurProps {
  slug: string
  bailleur: BailleurEditData | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onDelete?: (id: string, nom: string) => void
}

interface BienBailleur {
  id: string
  titre: string
  type_bien: string
  statut_occupation: string
  loyer_mensuel: number
  charges_mensuelles: number
  quartier?: string
  ville?: string
  bail_actif_id?: string
  bail_loyer?: number
  locataire_nom?: string
  locataire_prenom?: string
  locataire_telephone?: string
}

export function ModalEditerBailleur({
  slug,
  bailleur,
  isOpen,
  onClose,
  onSuccess,
  onDelete,
}: ModalEditerBailleurProps) {
  const [tab, setTab] = useState<'infos' | 'biens'>('infos')
  const [biens, setBiens] = useState<BienBailleur[]>([])
  const [loadingBiens, setLoadingBiens] = useState(false)
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    whatsapp: '',
    email: '',
    type_bailleur: 'particulier',
    adresse: '',
    iban: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (bailleur && isOpen) {
      setForm({
        nom: bailleur.nom || '',
        prenom: bailleur.prenom || '',
        telephone: bailleur.telephone || '',
        whatsapp: bailleur.whatsapp || bailleur.telephone || '',
        email: bailleur.email || '',
        type_bailleur: bailleur.type_bailleur || 'particulier',
        adresse: bailleur.adresse || '',
        iban: bailleur.iban || '',
        notes: bailleur.notes || '',
      })
      setError(null)
      setSuccess(false)
      setTab('infos')

      // Charger les biens rattachés
      setLoadingBiens(true)
      fetch(`/api/crm-immo/agence/${slug}/proprietaires/${bailleur.id}/biens`, {
        headers: getImmoAuthHeaders(),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setBiens(data.biens || [])
          }
        })
        .catch(err => console.error('[LOAD_BAILLEUR_BIENS_ERR]', err))
        .finally(() => setLoadingBiens(false))
    }
  }, [bailleur, isOpen, slug])

  if (!isOpen || !bailleur) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) {
      setError('Le nom du bailleur est obligatoire.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/crm-immo/agence/${slug}/proprietaires/${bailleur?.id}`, {
        method: 'PUT',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          nom: form.nom.trim(),
          prenom: form.prenom.trim() || null,
          telephone: form.telephone.trim() || null,
          whatsapp: form.whatsapp.trim() || form.telephone.trim() || null,
          email: form.email.trim() || null,
          type_bailleur: form.type_bailleur,
          adresse: form.adresse.trim() || null,
          iban: form.iban.trim() || null,
          notes: form.notes.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la modification du bailleur.')
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
          maxWidth: 520,
          width: '100%',
          padding: 24,
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Fiche Propriétaire / Mandant
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748B' }}>
              Coordonnées, mandat et portefeuille des biens confiés.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Onglets */}
        <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border, #E8DDD2)', marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setTab('infos')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              border: 'none',
              background: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              color: tab === 'infos' ? 'var(--accent, #C75B00)' : '#64748B',
              borderBottom: tab === 'infos' ? '2px solid var(--accent, #C75B00)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            <User size={15} />
            <span>Coordonnées</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('biens')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              border: 'none',
              background: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              color: tab === 'biens' ? 'var(--accent, #C75B00)' : '#64748B',
              borderBottom: tab === 'biens' ? '2px solid var(--accent, #C75B00)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            <Building2 size={15} />
            <span>Biens confiés ({biens.length})</span>
          </button>
        </div>

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
            Bailleur mis à jour avec succès !
          </div>
        )}

        {tab === 'infos' ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Nom / Raison Sociale *
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
                  placeholder="bailleur@email.com"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Type de bailleur
                </label>
                <select
                  value={form.type_bailleur}
                  onChange={e => setForm({ ...form, type_bailleur: e.target.value })}
                  className="form-select"
                  style={{ width: '100%', padding: '9px 12px' }}
                >
                  <option value="particulier">Particulier</option>
                  <option value="societe">Société / SCI</option>
                  <option value="institutionnel">Institutionnel</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                Coordonnées bancaires (IBAN / RIB pour reversements)
              </label>
              <input
                type="text"
                value={form.iban}
                onChange={e => setForm({ ...form, iban: e.target.value })}
                className="form-input"
                style={{ width: '100%', padding: '9px 12px' }}
                placeholder="SN08 SN01..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(bailleur.id, `${bailleur.prenom ? `${bailleur.prenom} ` : ''}${bailleur.nom}`)
                    onClose()
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: '#FEE2E2',
                    border: '1px solid #FECACA',
                    color: '#DC2626',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Trash2 size={14} />
                  <span>Supprimer / Archiver</span>
                </button>
              ) : <div />}

              <div style={{ display: 'flex', gap: 10 }}>
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
                  Annuler
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
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loadingBiens ? (
              <p style={{ textAlign: 'center', color: '#64748B', padding: '20px 0' }}>Chargement des biens...</p>
            ) : biens.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748B' }}>
                <Building2 size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', margin: '0 0 4px' }}>Aucun bien rattaché</p>
                <p style={{ fontSize: 13 }}>Ce bailleur n&apos;a pas encore de bien enregistré sous son mandat.</p>
              </div>
            ) : (
              <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {biens.map(bien => (
                  <div
                    key={bien.id}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      background: '#FAF8F5',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 13.5 }}>
                        {bien.titre}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', textTransform: 'capitalize' }}>
                        {bien.type_bien} {bien.quartier ? `· ${bien.quartier}` : ''}
                      </div>
                      {bien.locataire_nom && (
                        <div style={{ fontSize: 11.5, color: '#166534', fontWeight: 600, marginTop: 3 }}>
                          Locataire : {bien.locataire_prenom || ''} {bien.locataire_nom} ({bien.locataire_telephone || 'N/A'})
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontWeight: 700,
                          background: bien.statut_occupation === 'loue' ? '#DCFCE7' : '#E0E7FF',
                          color: bien.statut_occupation === 'loue' ? '#166534' : '#3730A3',
                        }}
                      >
                        {bien.statut_occupation === 'loue' ? 'Loué' : 'Disponible'}
                      </span>
                      <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 13, marginTop: 4 }}>
                        {Number(bien.loyer_mensuel || 0).toLocaleString('fr-FR')} F
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: '#FAF8F5',
                  border: '1px solid var(--border, #E8DDD2)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
