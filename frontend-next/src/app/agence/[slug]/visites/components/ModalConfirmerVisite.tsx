'use client'

import React, { useState } from 'react'
import { X, CheckCircle2, MessageCircle, Calendar, Clock, MapPin, User } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface VisiteAConfirmer {
  id: string
  bien_id: string
  bien_titre: string
  bien_quartier?: string
  bien_ville?: string
  contact_id: string
  contact_nom: string
  contact_prenom?: string
  contact_tel?: string
  contact_wa?: string
  date_visite: string
  duree_min?: number
  lieu_rdv?: string
  notes?: string
}

interface ModalConfirmerVisiteProps {
  slug: string
  visite: VisiteAConfirmer
  onClose: () => void
  onSuccess: () => void
}

export default function ModalConfirmerVisite({ slug, visite, onClose, onSuccess }: ModalConfirmerVisiteProps) {
  const initialDate = visite.date_visite ? new Date(visite.date_visite).toISOString().slice(0, 16) : ''
  const [dateVisite, setDateVisite] = useState(initialDate)
  const [dureeMin, setDureeMin] = useState(String(visite.duree_min || 30))
  const [lieuRdv, setLieuRdv] = useState(visite.lieu_rdv || `Directement sur place (${visite.bien_titre})`)
  const [notes, setNotes] = useState(visite.notes || '')
  const [saving, setSaving] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const clientTel = (visite.contact_wa || visite.contact_tel || '').replace(/[^0-9]/g, '')
  const dateFormatted = dateVisite ? new Date(dateVisite).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }) : 'prochainement'

  const waMessage = `Bonjour ${visite.contact_nom}, votre agence immobilière confirme votre visite pour le bien "${visite.bien_titre}".\n\nDate & Heure : ${dateFormatted}\nLieu de rendez-vous : ${lieuRdv}\n\nUn agent sera sur place pour vous accueillir. À très bientôt !`

  async function handleConfirmer(e: React.FormEvent) {
    e.preventDefault()
    if (!dateVisite) return

    try {
      setSaving(true)
      const res = await fetch(`/api/crm-immo/agence/${slug}/visites/${visite.id}`, {
        method: 'PUT',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          statut: 'confirmee',
          date_visite: dateVisite,
          duree_min: parseInt(dureeMin, 10) || 30,
          lieu_rdv: lieuRdv,
          notes,
        }),
      })

      if (res.ok) {
        setConfirmed(true)
        onSuccess()
      }
    } catch (err) {
      console.error('[CONFIRM_VISITE_ERR]', err)
    } finally {
      setSaving(false)
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
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            {confirmed ? 'Visite confirmée avec succès !' : 'Confirmer le rendez-vous de visite'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {confirmed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: '#DCFCE7',
                color: '#15803D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <p style={{ fontSize: 14, color: '#334155', margin: 0 }}>
              Le créneau est désormais fixé dans votre agenda d'agence pour le{' '}
              <strong>{dateFormatted}</strong>.
            </p>

            {clientTel && (
              <a
                href={`https://wa.me/${clientTel}?text=${encodeURIComponent(waMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: '#16A34A',
                  color: '#FFFFFF',
                  padding: '12px 18px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: 'none',
                  marginTop: 6,
                }}
              >
                <MessageCircle size={18} />
                <span>Envoyer la confirmation au client sur WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#FAF8F5',
                border: '1px solid var(--border, #E8DDD2)',
                borderRadius: 8,
                padding: '9px 16px',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleConfirmer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#FAF8F5', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)' }}>
              <div style={{ fontWeight: 750, color: 'var(--navy, #1C2B4A)', fontSize: 14 }}>
                {visite.bien_titre}
              </div>
              <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
                Prospect : <strong>{visite.contact_nom} {visite.contact_prenom || ''}</strong> ({visite.contact_tel || 'Tel non renseigné'})
              </div>
              {visite.notes && (
                <div style={{ fontSize: 12, color: '#B45309', background: '#FEF3C7', padding: '6px 8px', borderRadius: 6, marginTop: 8 }}>
                  {visite.notes}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Date & Heure définitives du RDV *</label>
              <input
                type="datetime-local"
                required
                value={dateVisite}
                onChange={e => setDateVisite(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Durée estimée (min)</label>
                <input
                  type="number"
                  value={dureeMin}
                  onChange={e => setDureeMin(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Lieu du rendez-vous</label>
                <input
                  type="text"
                  value={lieuRdv}
                  onChange={e => setLieuRdv(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Consignes internes pour l'agent</label>
              <textarea
                rows={2}
                placeholder="Ex: Clés auprès du gardien, apporter fiche de visite..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="form-textarea"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  background: '#FAF8F5',
                  border: '1px solid var(--border, #E8DDD2)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving || !dateVisite}
                style={{
                  padding: '9px 20px',
                  borderRadius: 8,
                  background: 'var(--accent, #C75B00)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Validation...' : 'Valider & Confirmer le RDV'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
