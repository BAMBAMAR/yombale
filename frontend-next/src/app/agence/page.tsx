'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Plus, MapPin, ArrowRight, ShieldCheck, Home, Users, CheckCircle2, AlertCircle } from 'lucide-react'
import './agence.css'

interface AgenceItem {
  id: string
  nom: string
  slug: string
  description?: string
  ville: string
  quartier?: string
  telephone?: string
  statut: string
  mon_role: string
  is_owner: boolean
  nb_biens: number
  nb_prospects_actifs: number
}

export default function AgencesHubPage() {
  const router = useRouter()
  const [agences, setAgences] = useState<AgenceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nom: '',
    ville: 'Dakar',
    quartier: '',
    telephone: '',
    whatsapp: '',
    description: '',
  })

  async function chargerAgences() {
    try {
      setLoading(true)
      const res = await fetch('/api/agences/mine')
      if (res.status === 401) {
        router.push('/connexion?redirect=/agence')
        return
      }
      const data = await res.json()
      if (data.success) {
        setAgences(data.agences || [])
      }
    } catch (err) {
      console.error('[CHARGER_AGENCES_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chargerAgences()
  }, [])

  async function handleCreerAgence(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!formData.nom.trim()) {
      setFormError("Le nom de l'agence est obligatoire.")
      return
    }

    try {
      setCreating(true)
      const res = await fetch('/api/agences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setFormError(data.error || "Erreur lors de la création de l'agence.")
        return
      }
      setShowModal(false)
      router.push(`/agence/${data.agence.slug}`)
    } catch (err) {
      console.error('[CREER_AGENCE_ERR]', err)
      setFormError('Erreur de connexion au serveur.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="agence-container">
      {/* ── En-tête de la page ── */}
      <div className="agence-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--navy, #1C2B4A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="agence-title">Nopalou Immobilier Pro</h1>
              <p className="agence-subtitle">
                Gérez vos agences, votre portefeuille de biens, vos prospects CRM et vos baux locatifs.
              </p>
            </div>
          </div>
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
            fontWeight: 700,
            background: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          Créer une agence
        </button>
      </div>

      {/* ── Liste des agences ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
          <p>Chargement de vos agences...</p>
        </div>
      ) : agences.length === 0 ? (
        <div
          className="agence-card"
          style={{
            textAlign: 'center',
            padding: '50px 24px',
            maxWidth: 600,
            margin: '40px auto',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(199, 91, 0, 0.08)',
              color: 'var(--accent, #C75B00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Building2 size={32} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginBottom: 8 }}>
            Vous n'avez pas encore d'agence immobilière
          </h2>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
            Digitalisez votre agence immobilière au Sénégal : catalogue de biens, multidiffusion d'annonces, CRM
            prospects, gestion des visites, baux et encaissement des loyers.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 8,
              fontWeight: 700,
              background: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={18} />
            Démarrer mon agence maintenant
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {agences.map(agence => (
            <div
              key={agence.id}
              className="agence-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 24,
                position: 'relative',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #1C2B4A 0%, #2A3F6D 100%)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 18,
                      }}
                    >
                      {agence.nom.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                        {agence.nom}
                      </h3>
                      <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <MapPin size={13} />
                        {agence.quartier ? `${agence.quartier}, ${agence.ville}` : agence.ville}
                      </span>
                    </div>
                  </div>

                  <span className={`status-badge ${agence.statut}`}>
                    {agence.statut === 'actif' ? 'Active' : agence.statut}
                  </span>
                </div>

                {agence.description && (
                  <p
                    style={{
                      fontSize: 13,
                      color: '#475569',
                      lineHeight: 1.5,
                      marginBottom: 16,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {agence.description}
                  </p>
                )}

                {/* Badges compteurs */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <div
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      background: '#FAF8F5',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Biens</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{agence.nb_biens}</div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      background: '#FAF8F5',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Prospects</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{agence.nb_prospects_actifs}</div>
                  </div>
                </div>
              </div>

              <Link
                href={`/agence/${agence.slug}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '11px 16px',
                  background: 'var(--navy, #1C2B4A)',
                  color: '#FFFFFF',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13.5,
                  textDecoration: 'none',
                  transition: 'opacity 0.15s ease',
                }}
              >
                Accéder à l'espace Agence
                <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ── Modale Création d'Agence ── */}
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
              maxWidth: 520,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'rgba(199, 91, 0, 0.1)',
                    color: 'var(--accent, #C75B00)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 size={20} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                  Créer une agence immobilière
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  color: '#94A3B8',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#FEE2E2',
                  color: '#991B1B',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <AlertCircle size={16} />
                {formError}
              </div>
            )}

            <form onSubmit={handleCreerAgence}>
              <div className="form-group">
                <label className="form-label">Nom de l'agence *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Teranga Immo, Almadies Prestige..."
                  value={formData.nom}
                  onChange={e => setFormData({ ...formData, nom: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Ville *</label>
                  <select
                    value={formData.ville}
                    onChange={e => setFormData({ ...formData, ville: e.target.value })}
                    className="form-select"
                  >
                    <option value="Dakar">Dakar</option>
                    <option value="Thiès">Thiès</option>
                    <option value="Saly">Saly / Mbour</option>
                    <option value="Saint-Louis">Saint-Louis</option>
                    <option value="Ziguinchor">Ziguinchor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quartier</label>
                  <input
                    type="text"
                    placeholder="Ex: Almadies, Mermoz, Plateau..."
                    value={formData.quartier}
                    onChange={e => setFormData({ ...formData, quartier: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input
                    type="tel"
                    placeholder="+221 77 000 00 00"
                    value={formData.telephone}
                    onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">WhatsApp Pro</label>
                  <input
                    type="tel"
                    placeholder="+221 77 000 00 00"
                    value={formData.whatsapp}
                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Brève description</label>
                <textarea
                  rows={3}
                  placeholder="Spécialiste de la location et vente résidentielle à Dakar..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    background: '#FAF8F5',
                    border: '1px solid var(--border, #E8DDD2)',
                    color: 'var(--navy, #1C2B4A)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    background: 'var(--accent, #C75B00)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    cursor: creating ? 'not-allowed' : 'pointer',
                    opacity: creating ? 0.7 : 1,
                  }}
                >
                  {creating ? 'Création...' : 'Créer mon agence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
