'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { UserCheck, Plus, Phone, Mail, Home, MapPin, CheckCircle2 } from 'lucide-react'

interface Proprietaire {
  id: string
  nom: string
  prenom?: string
  telephone?: string
  whatsapp?: string
  email?: string
  type_bailleur: string
  nb_biens_total: number
  nb_biens_loues: number
}

export default function BailleursPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [proprietaires, setProprietaires] = useState<Proprietaire[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    whatsapp: '',
    email: '',
    type_bailleur: 'particulier',
  })

  async function chargerBailleurs() {
    try {
      setLoading(true)
      const res = await fetch(`/api/crm-immo/agence/${slug}/proprietaires`)
      const data = await res.json()
      if (data.success) {
        setProprietaires(data.proprietaires || [])
      }
    } catch (err) {
      console.error('[LOAD_BAILLEURS_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerBailleurs()
  }, [slug])

  async function handleCreerBailleur(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) return

    try {
      setSaving(true)
      const res = await fetch(`/api/crm-immo/agence/${slug}/proprietaires`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        setForm({ nom: '', prenom: '', telephone: '', whatsapp: '', email: '', type_bailleur: 'particulier' })
        chargerBailleurs()
      }
    } catch (err) {
      console.error('[CREATE_BAILLEUR_ERR]', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Bailleurs & Propriétaires</h1>
          <p className="agence-subtitle">Gérez les propriétaires mandants et leurs biens confiés à l'agence.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="btn-npl"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            background: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          Ajouter un propriétaire
        </button>
      </div>

      {/* ── Liste des Bailleurs ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement des propriétaires mandants...</p>
        </div>
      ) : proprietaires.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          <UserCheck size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucun propriétaire enregistré</p>
          <p style={{ fontSize: 13.5 }}>Enregistrez vos bailleurs pour rattacher leurs biens et mandats de gestion.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {proprietaires.map(p => (
            <div key={p.id} className="agence-card" style={{ padding: 18, marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 15 }}>
                    {p.nom} {p.prenom || ''}
                  </div>
                  <span style={{ fontSize: 11.5, color: '#64748B', textTransform: 'capitalize' }}>
                    {p.type_bailleur}
                  </span>
                </div>
                <div
                  style={{
                    padding: '4px 8px',
                    borderRadius: 8,
                    background: '#FAF8F5',
                    border: '1px solid var(--border, #E8DDD2)',
                    fontSize: 12,
                    fontWeight: 750,
                    color: 'var(--navy, #1C2B4A)',
                  }}
                >
                  {p.nb_biens_total} bien(s)
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: '#475569' }}>
                {p.telephone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={13} />
                    <a href={`tel:${p.telephone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {p.telephone}
                    </a>
                  </div>
                )}
                {p.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={13} />
                    <span>{p.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modale Ajout Propriétaire ── */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28, 43, 74, 0.5)',
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
              maxWidth: 460,
              width: '100%',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                Ajouter un propriétaire / bailleur
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreerBailleur}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Nom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sarr"
                    value={form.nom}
                    onChange={e => setForm({ ...form, nom: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input
                    type="text"
                    placeholder="Fatou"
                    value={form.prenom}
                    onChange={e => setForm({ ...form, prenom: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Téléphone / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="+221 77 000 00 00"
                  value={form.telephone}
                  onChange={e => setForm({ ...form, telephone: e.target.value, whatsapp: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  placeholder="bailleur@exemple.sn"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  disabled={saving}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    background: 'var(--accent, #C75B00)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
