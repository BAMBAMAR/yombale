'use client'

import React, { useState, useEffect } from 'react'
import { X, Check, User, Phone, MapPin, CreditCard, FileText } from 'lucide-react'

export interface ClientCarnetEditer {
  id: string
  nom: string
  telephone: string
  adresse?: string | null
  plafond_max?: number
  note_client?: string | null
}

interface PosEditClientCarnetModalProps {
  isOpen: boolean
  onClose: () => void
  client: ClientCarnetEditer | null
  boutiqueId: string
  onSuccess: () => void
}

export default function PosEditClientCarnetModal({
  isOpen,
  onClose,
  client,
  boutiqueId,
  onSuccess,
}: PosEditClientCarnetModalProps) {
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [adresse, setAdresse] = useState('')
  const [plafondMax, setPlafondMax] = useState<number | string>(0)
  const [noteClient, setNoteClient] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    if (client) {
      setNom(client.nom || '')
      setTelephone(client.telephone || '')
      setAdresse(client.adresse || '')
      setPlafondMax(client.plafond_max || 0)
      setNoteClient(client.note_client || '')
      setErreur(null)
    }
  }, [client])

  if (!isOpen || !client) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nom.trim() || !telephone.trim()) {
      setErreur('Le nom et le numéro de téléphone sont obligatoires.')
      return
    }

    setIsSubmitting(true)
    setErreur(null)

    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/credits-clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: nom.trim(),
          telephone: telephone.trim(),
          adresse: adresse.trim(),
          plafond_max: Number(plafondMax) || 0,
          note_client: noteClient.trim(),
        }),
      })

      if (res.ok) {
        onSuccess()
        onClose()
      } else {
        const errData = await res.json().catch(() => ({}))
        setErreur(errData.error || 'Erreur lors de la modification du client.')
      }
    } catch (err: any) {
      setErreur('Impossible de joindre le serveur. Vérifiez votre connexion.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          maxWidth: 480,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: 24,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a' }}>
              Modifier la Fiche Client
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {erreur && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {erreur}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 5,
              }}
            >
              <User size={14} />
              <span>Nom complet *</span>
            </label>
            <input
              type="text"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid #cbd5e1',
                fontSize: 15,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 5,
              }}
            >
              <Phone size={14} />
              <span>Téléphone (WhatsApp) *</span>
            </label>
            <input
              type="tel"
              required
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid #cbd5e1',
                fontSize: 15,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 5,
                }}
              >
                <MapPin size={14} />
                <span>Adresse / Quartier</span>
              </label>
              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 5,
                }}
              >
                <CreditCard size={14} />
                <span>Plafond Crédit (FCFA)</span>
              </label>
              <input
                type="number"
                value={plafondMax}
                onChange={(e) => setPlafondMax(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 5,
              }}
            >
              <FileText size={14} />
              <span>Note / Remarque confidentielle</span>
            </label>
            <input
              type="text"
              value={noteClient}
              onChange={(e) => setNoteClient(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid #cbd5e1',
                fontSize: 14,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: 10,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 2,
                padding: '12px',
                background: '#1C2B4A',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                fontWeight: 800,
                cursor: 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer les Modifications'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
