'use client'

import React, { useState } from 'react'
import { X, Bell, Clock, Calendar, Repeat } from 'lucide-react'

interface SurgaAgendaFormProps {
  onClose: () => void
  onSubmit: (data: {
    titre: string
    description?: string
    date_evenement: string
    heure_evenement?: string
    est_rappel: boolean
    repetition: 'AUCUNE' | 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'MENSUEL'
  }) => void
}

export default function SurgaAgendaForm({ onClose, onSubmit }: SurgaAgendaFormProps) {
  const [titre, setTitre] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [dateEvenement, setDateEvenement] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  )

  // Heure par défaut = dans 5 minutes (aligné sur le critère de démonstration)
  const [heureEvenement, setHeureEvenement] = useState<string>(() => {
    const d = new Date(Date.now() + 5 * 60 * 1000)
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  })

  const [estRappel, setEstRappel] = useState<boolean>(true)
  const [repetition, setRepetition] = useState<'AUCUNE' | 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'MENSUEL'>('AUCUNE')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!titre.trim()) return

    onSubmit({
      titre: titre.trim(),
      description: description.trim() || undefined,
      date_evenement: dateEvenement,
      heure_evenement: heureEvenement || undefined,
      est_rappel: estRappel,
      repetition,
    })
  }

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        border: '1px solid var(--border, #E8DDD2)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
          Nouveau rappel ou événement
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le formulaire"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <X size={18} color="var(--text2, #5A4E42)" />
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
            Titre du rappel ou rendez-vous *
          </label>
          <input
            type="text"
            placeholder="Ex : Récupérer commande, Rendez-vous médecin..."
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 14,
              fontWeight: 600,
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
              Date
            </label>
            <input
              type="date"
              value={dateEvenement}
              onChange={(e) => setDateEvenement(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
              Heure
            </label>
            <input
              type="time"
              value={heureEvenement}
              onChange={(e) => setHeureEvenement(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
            Répétition
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['AUCUNE', 'QUOTIDIEN', 'HEBDOMADAIRE'] as const).map((rep) => (
              <button
                key={rep}
                type="button"
                onClick={() => setRepetition(rep)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: repetition === rep ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
                  backgroundColor: repetition === rep ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                  color: repetition === rep ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {rep === 'AUCUNE' ? 'Une fois' : rep === 'QUOTIDIEN' ? 'Tous les jours' : 'Chaque semaine'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
            Détail / Note (optionnel)
          </label>
          <input
            type="text"
            placeholder="Ex : Appeler Moussa avant..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <input
            type="checkbox"
            id="estRappelCheck"
            checked={estRappel}
            onChange={(e) => setEstRappel(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <label htmlFor="estRappelCheck" style={{ fontSize: 13, color: 'var(--navy, #1C2B4A)', fontWeight: 600, cursor: 'pointer' }}>
            Activer l’alerte notification à l’heure prévue
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              backgroundColor: '#FFFFFF',
              color: 'var(--text2, #5A4E42)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-npl"
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'var(--navy, #1C2B4A)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Enregistrer le rappel
          </button>
        </div>
      </form>
    </div>
  )
}
