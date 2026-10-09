'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Newspaper,
  Plus,
  Trash2,
  Calendar,
  X,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'

export interface AdminUneItem {
  id: string
  nom_journal: string
  date_parution: string
  url_image?: string
  image_url?: string
  titre_principal?: string
  description_courte?: string
  description?: string
  actif?: boolean
}

const JOURNAUX_POPULAIRES = [
  'Le Soleil',
  'L Observateur',
  'Sud Quotidien',
  'Libération',
  'Enquête',
  'Le Quotidien',
  'Yoor-Yoor',
  'Record',
  'L As',
  'Source A',
]

export default function AdminUnesTab() {
  const [unes, setUnes] = useState<AdminUneItem[]>([])
  const [chargement, setChargement] = useState<boolean>(true)
  const [modalOuverte, setModalOuverte] = useState<boolean>(false)
  const [envoiEnCours, setEnvoiEnCours] = useState<boolean>(false)
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  // Formulaire
  const [formJournal, setFormJournal] = useState('Le Soleil')
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10))
  const [formUrlImage, setFormUrlImage] = useState('')
  const [formTitre, setFormTitre] = useState('')

  const chargerUnes = useCallback(async () => {
    setChargement(true)
    try {
      const res = await fetch('/api/admin/surga/unes')
      const data = await res.json()
      if (data.success && Array.isArray(data.unes)) {
        setUnes(data.unes)
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Impossible de charger les Unes' })
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    chargerUnes()
  }, [chargerUnes])

  const handleAjouter = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnvoiEnCours(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/surga/unes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom_journal: formJournal,
          date_parution: formDate,
          url_image: formUrlImage,
          titre_principal: formTitre,
          actif: true,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setModalOuverte(false)
        setFormUrlImage('')
        setFormTitre('')
        chargerUnes()
        setMessage({ type: 'succes', texte: 'Une de presse ajoutée au kiosque' })
      } else {
        setMessage({ type: 'erreur', texte: data.error || 'Erreur lors de l ajout' })
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Erreur réseau' })
    } finally {
      setEnvoiEnCours(false)
    }
  }

  const handleSupprimer = async (id: string) => {
    if (!window.confirm('Supprimer cette Une du kiosque ?')) return
    try {
      const res = await fetch(`/api/admin/surga/unes/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        chargerUnes()
        setMessage({ type: 'succes', texte: 'Une retirée du kiosque' })
      }
    } catch {}
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Barre d'action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          padding: '14px 16px',
          borderRadius: 12,
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Kiosque des Unes de la Presse Sénégalaise
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text3, #73675E)', margin: '2px 0 0 0' }}>
            Publication et mise à jour quotidienne des Unes des quotidiens nationaux
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOuverte(true)}
          className="btn-npl"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          <span>Publier une Une</span>
        </button>
      </div>

      {/* Message notification */}
      {message && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            backgroundColor: message.type === 'succes' ? 'rgba(10, 92, 54, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'succes' ? 'var(--price, #0A5C36)' : '#DC2626',
            border: `1px solid ${message.type === 'succes' ? 'rgba(10, 92, 54, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          }}
        >
          {message.texte}
        </div>
      )}

      {/* Grille des Unes */}
      {chargement ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3, #73675E)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', display: 'block' }} />
          Chargement des Unes...
        </div>
      ) : unes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3, #73675E)', fontSize: 13 }}>
          Aucune Une publiée pour le moment.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {unes.map((une) => (
            <div
              key={une.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid var(--border, #E8DDD2)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  height: 220,
                  backgroundColor: 'var(--bg, #F8F5F0)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={une.url_image || une.image_url || ''}
                  alt={une.nom_journal}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    ;(e.target as any).src = '/surga/icon-512.png'
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleSupprimer(une.id)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: 6,
                    padding: 6,
                    cursor: 'pointer',
                    color: '#DC2626',
                  }}
                  title="Supprimer cette Une"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 14 }}>
                  {une.nom_journal}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text3, #73675E)' }}>
                  <Calendar size={12} />
                  <span>{new Date(une.date_parution).toLocaleDateString('fr-SN')}</span>
                </div>
                {une.titre_principal && (
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--text2, #5A4E42)',
                      margin: '4px 0 0 0',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {une.titre_principal}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale d'ajout */}
      {modalOuverte && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(28, 43, 74, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setModalOuverte(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border, #E8DDD2)',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                Publier une Une du Jour
              </h3>
              <button
                type="button"
                onClick={() => setModalOuverte(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3, #73675E)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAjouter} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                  Nom du Quotidien *
                </label>
                <select
                  value={formJournal}
                  onChange={(e) => setFormJournal(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
                >
                  {JOURNAUX_POPULAIRES.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                  Date de Parution *
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                  URL de la photo de couverture (Une) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={formUrlImage}
                  onChange={(e) => setFormUrlImage(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                  Grand Titre de la Une
                </label>
                <input
                  type="text"
                  placeholder="Ex: Conseil Présidentiel sur l Emploi..."
                  value={formTitre}
                  onChange={(e) => setFormTitre(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setModalOuverte(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--border, #E8DDD2)',
                    background: '#FFFFFF',
                    color: 'var(--navy, #1C2B4A)',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={envoiEnCours}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: 'var(--accent, #C75B00)',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {envoiEnCours ? 'Envoi...' : 'Publier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
