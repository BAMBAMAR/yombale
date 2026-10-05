'use client'

import React, { useState } from 'react'
import {
  X,
  Clock,
  Calendar,
  MapPin,
  Briefcase,
  User,
  HeartPulse,
  Landmark,
  type LucideIcon,
} from 'lucide-react'
import {
  type SurgaEvenementPriorite,
  type SurgaEvenementCategorie,
} from '@/lib/surga-offline-sync'
import SurgaAgendaPresets, { type AgendaPresetType } from './SurgaAgendaPresets'

interface SurgaAgendaFormProps {
  onClose: () => void
  onSubmit: (data: {
    titre: string
    description?: string
    date_evenement: string
    heure_evenement?: string
    priorite: SurgaEvenementPriorite
    categorie: SurgaEvenementCategorie
    lieu?: string
    est_rappel: boolean
    repetition: 'AUCUNE' | 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'MENSUEL'
  }) => void
}

const CATEGORIES: Array<{ key: SurgaEvenementCategorie; label: string; icon: LucideIcon }> = [
  { key: 'rdv', label: 'RDV', icon: Calendar },
  { key: 'travail', label: 'Travail', icon: Briefcase },
  { key: 'sante', label: 'Santé', icon: HeartPulse },
  { key: 'demarche', label: 'Démarche', icon: Landmark },
  { key: 'famille', label: 'Famille', icon: User },
  { key: 'perso', label: 'Personnel', icon: User },
]

export default function SurgaAgendaForm({ onClose, onSubmit }: SurgaAgendaFormProps) {
  const [titre, setTitre] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [lieu, setLieu] = useState<string>('')
  const [priorite, setPriorite] = useState<SurgaEvenementPriorite>('normale')
  const [categorie, setCategorie] = useState<SurgaEvenementCategorie>('rdv')

  const [dateEvenement, setDateEvenement] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  )

  const [heureEvenement, setHeureEvenement] = useState<string>(() => {
    const d = new Date(Date.now() + 15 * 60 * 1000)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })

  const [estRappel, setEstRappel] = useState<boolean>(true)
  const [repetition, setRepetition] = useState<'AUCUNE' | 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'MENSUEL'>('AUCUNE')

  const appliquerRaccourci = (type: AgendaPresetType) => {
    const now = new Date()
    if (type === '15min') {
      const d = new Date(now.getTime() + 15 * 60 * 1000)
      setDateEvenement(d.toISOString().slice(0, 10))
      setHeureEvenement(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
    } else if (type === '1h') {
      const d = new Date(now.getTime() + 60 * 60 * 1000)
      setDateEvenement(d.toISOString().slice(0, 10))
      setHeureEvenement(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
    } else if (type === 'ce_soir') {
      setDateEvenement(now.toISOString().slice(0, 10))
      setHeureEvenement('18:00')
    } else if (type === 'demain_matin') {
      const d = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      setDateEvenement(d.toISOString().slice(0, 10))
      setHeureEvenement('09:00')
    } else if (type === 'apres_demain') {
      const d = new Date(now.getTime() + 48 * 60 * 60 * 1000)
      setDateEvenement(d.toISOString().slice(0, 10))
      setHeureEvenement('10:00')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!titre.trim()) return

    onSubmit({
      titre: titre.trim(),
      description: description.trim() || undefined,
      lieu: lieu.trim() || undefined,
      date_evenement: dateEvenement,
      heure_evenement: heureEvenement || undefined,
      priorite,
      categorie,
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
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
          Nouveau rappel ou événement
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le formulaire de rappel"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <X size={18} color="var(--text2, #5A4E42)" />
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
            Titre du rappel ou rendez-vous *
          </label>
          <input
            type="text"
            placeholder="Ex : Récupérer commande, Rendez-vous médecin, Payer facture Senelec..."
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            required
            autoFocus
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--navy, #1C2B4A)',
              outline: 'none',
              backgroundColor: '#F8F5F0',
            }}
          />
        </div>

        <SurgaAgendaPresets onSelect={appliquerRaccourci} />

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
            Niveau de priorité
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {(
              [
                { key: 'normale', label: 'Normale', color: 'var(--price, #0A5C36)' },
                { key: 'importante', label: 'Importante', color: 'var(--accent, #C75B00)' },
                { key: 'urgente', label: 'Urgente', color: '#DC2626' },
              ] as const
            ).map((p) => {
              const estActive = priorite === p.key
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPriorite(p.key)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid',
                    borderColor: estActive ? p.color : 'var(--border, #E8DDD2)',
                    backgroundColor: estActive ? p.color : '#FFFFFF',
                    color: estActive ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
            Catégorie
          </label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map((c) => {
              const estActive = categorie === c.key
              const Icon = c.icon
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategorie(c.key)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 16,
                    border: '1px solid',
                    borderColor: estActive ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
                    backgroundColor: estActive ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                    color: estActive ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                    fontSize: 11,
                    fontWeight: estActive ? 700 : 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Icon size={12} />
                  <span>{c.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
            Lieu ou contact (optionnel)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F8F5F0', borderRadius: 8, padding: '0 10px', border: '1px solid var(--border, #E8DDD2)' }}>
            <MapPin size={14} color="var(--text3, #73675E)" style={{ marginRight: 6 }} />
            <input
              type="text"
              placeholder="Ex : Clinique Madeleine, Plateau, Appeler Moussa..."
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 0',
                border: 'none',
                background: 'transparent',
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
            {(
              [
                { key: 'AUCUNE', label: 'Une fois' },
                { key: 'QUOTIDIEN', label: 'Tous les jours' },
                { key: 'HEBDOMADAIRE', label: 'Chaque semaine' },
                { key: 'MENSUEL', label: 'Chaque mois' },
              ] as const
            ).map((rep) => (
              <button
                key={rep.key}
                type="button"
                onClick={() => setRepetition(rep.key)}
                style={{
                  flex: 1,
                  padding: '6px 4px',
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: repetition === rep.key ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
                  backgroundColor: repetition === rep.key ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                  color: repetition === rep.key ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {rep.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
            Détail / Note (optionnel)
          </label>
          <textarea
            placeholder="Informations utiles, pièces à emporter..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 13,
              outline: 'none',
              resize: 'none',
              backgroundColor: '#F8F5F0',
            }}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--navy, #1C2B4A)', cursor: 'pointer', marginTop: 2 }}>
          <input
            type="checkbox"
            checked={estRappel}
            onChange={(e) => setEstRappel(e.target.checked)}
            style={{ accentColor: 'var(--accent, #C75B00)', width: 16, height: 16 }}
          />
          <span>Activer l’alerte notification à l’heure prévue</span>
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 14px',
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
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'var(--navy, #1C2B4A)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Clock size={15} />
            <span>Enregistrer le rappel</span>
          </button>
        </div>
      </form>
    </div>
  )
}
