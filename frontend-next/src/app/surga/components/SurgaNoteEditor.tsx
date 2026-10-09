'use client'

import React, { useEffect, useState } from 'react'
import {
  X,
  Save,
  Pin,
  CheckSquare,
  FileText,
  ShoppingCart,
  Briefcase,
  User,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import {
  type SurgaNote,
  type SurgaNoteCategorie,
  type SurgaNoteCouleur,
  type SurgaChecklistItem,
} from '@/lib/surga-offline-sync'
import SurgaChecklistEditor from './SurgaChecklistEditor'
import { lireBrouillonNote, garderBrouillonNote, effacerBrouillonNote } from '@/lib/surga-brouillon-note'

interface SurgaNoteEditorProps {
  noteInitiale?: SurgaNote | null
  onEnregistrer: (data: {
    id?: string
    titre: string
    contenu: string
    categorie: SurgaNoteCategorie
    couleur: SurgaNoteCouleur
    epingle: boolean
    is_checklist: boolean
    checklist: SurgaChecklistItem[]
  }) => void
  onFermer: () => void
}

const CATEGORIES: Array<{ key: SurgaNoteCategorie; label: string; icon: LucideIcon }> = [
  { key: 'general', label: 'Mémo', icon: FileText },
  { key: 'courses', label: 'Courses', icon: ShoppingCart },
  { key: 'travail', label: 'Travail', icon: Briefcase },
  { key: 'personnel', label: 'Perso', icon: User },
  { key: 'urgent', label: 'Urgent', icon: AlertTriangle },
]

const COULEURS: Array<{ key: SurgaNoteCouleur; label: string; bg: string; border: string }> = [
  { key: 'creme', label: 'Crème', bg: '#FFFFFF', border: '#E8DDD2' },
  { key: 'ambre', label: 'Ambre', bg: '#FFFBEB', border: '#FDE68A' },
  { key: 'vert', label: 'Sauge', bg: '#F0FDF4', border: '#BBF7D0' },
  { key: 'bleu', label: 'Ciel', bg: '#F0F9FF', border: '#BAE6FD' },
  { key: 'violet', label: 'Lavande', bg: '#FAF5FF', border: '#E9D5FF' },
]

export default function SurgaNoteEditor({
  noteInitiale,
  onEnregistrer,
  onFermer,
}: SurgaNoteEditorProps) {
  // SRG-A3-007 : un brouillon gardé pour cette même note (ou pour une nouvelle note) est repris à l'ouverture.
  const [brouillon] = useState(() => {
    const b = lireBrouillonNote()
    return b && b.id === (noteInitiale?.id ?? null) ? b : null
  })
  const depart = brouillon || noteInitiale
  const [repris, setRepris] = useState<boolean>(Boolean(brouillon))
  const [titre, setTitre] = useState<string>(depart?.titre || '')
  const [contenu, setContenu] = useState<string>(depart?.contenu || '')
  const [categorie, setCategorie] = useState<SurgaNoteCategorie>(depart?.categorie || 'general')
  const [couleur, setCouleur] = useState<SurgaNoteCouleur>(depart?.couleur || 'creme')
  const [epingle, setEpingle] = useState<boolean>(Boolean(depart?.epingle))
  const [isChecklist, setIsChecklist] = useState<boolean>(Boolean(depart?.is_checklist))
  const [checklist, setChecklist] = useState<SurgaChecklistItem[]>(depart?.checklist && depart.checklist.length > 0 ? depart.checklist : [])

  // Le brouillon suit la saisie. Une note ouverte puis laissée telle quelle n'en crée pas.
  useEffect(() => {
    const inchangee = !repris && titre === (noteInitiale?.titre || '') && contenu === (noteInitiale?.contenu || '') &&
      JSON.stringify(checklist) === JSON.stringify(noteInitiale?.checklist || [])
    if (inchangee) return
    garderBrouillonNote({ id: noteInitiale?.id ?? null, titre, contenu, categorie, couleur, epingle, is_checklist: isChecklist, checklist })
  }, [titre, contenu, categorie, couleur, epingle, isChecklist, checklist, repris, noteInitiale])

  const abandonnerBrouillon = () => {
    effacerBrouillonNote()
    setRepris(false)
    setTitre(noteInitiale?.titre || '')
    setContenu(noteInitiale?.contenu || '')
    setCategorie(noteInitiale?.categorie || 'general')
    setCouleur(noteInitiale?.couleur || 'creme')
    setEpingle(Boolean(noteInitiale?.epingle))
    setIsChecklist(Boolean(noteInitiale?.is_checklist))
    setChecklist(noteInitiale?.checklist || [])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!titre.trim()) return

    effacerBrouillonNote()
    onEnregistrer({
      id: noteInitiale?.id,
      titre: titre.trim(),
      contenu: isChecklist ? '' : contenu,
      categorie,
      couleur,
      epingle,
      is_checklist: isChecklist,
      checklist,
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
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
          {noteInitiale ? 'Modifier la note' : 'Nouvelle note'}
        </span>
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer l'éditeur de note"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <X size={18} color="var(--text2, #5A4E42)" />
        </button>
      </div>

      {repris && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', padding: '8px 10px', borderRadius: 8, backgroundColor: 'var(--surga-bg, #F8FAFC)', border: '1px solid var(--surga-border, #E2E8F0)', fontSize: 12, color: 'var(--surga-text2, #475569)' }}>
          <span>Brouillon repris : ce texte n’avait pas été enregistré.</span>
          <button type="button" onClick={abandonnerBrouillon} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--surga-accent-text, #92400E)' }}>
            Effacer le brouillon
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
            Titre de la note *
          </label>
          <input
            type="text"
            placeholder="Ex : Courses du week-end"
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

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setIsChecklist(false)}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: !isChecklist ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
              backgroundColor: !isChecklist ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
              color: !isChecklist ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <FileText size={14} />
            <span>Texte libre</span>
          </button>

          <button
            type="button"
            onClick={() => setIsChecklist(true)}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: isChecklist ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
              backgroundColor: isChecklist ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
              color: isChecklist ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <CheckSquare size={14} />
            <span>Liste de tâches / Courses</span>
          </button>
        </div>

        {isChecklist ? (
          <SurgaChecklistEditor checklist={checklist} onChange={setChecklist} />
        ) : (
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
              Contenu de la note
            </label>
            <textarea
              placeholder="Idées, mémos, compte-rendu…"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13,
                lineHeight: 1.5,
                outline: 'none',
                resize: 'vertical',
                backgroundColor: '#F8F5F0',
              }}
            />
          </div>
        )}

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
                    fontSize: 12,
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3, #73675E)', display: 'block', marginBottom: 4 }}>
              Couleur
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              {COULEURS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCouleur(c.key)}
                  title={c.label}
                  aria-label={`Couleur ${c.label}`}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    backgroundColor: c.bg,
                    border: couleur === c.key ? '2px solid var(--navy, #1C2B4A)' : `1px solid ${c.border}`,
                    cursor: 'pointer',
                    boxShadow: couleur === c.key ? '0 0 0 1px #FFFFFF' : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEpingle(!epingle)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: epingle ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)',
              backgroundColor: epingle ? 'rgba(199, 91, 0, 0.1)' : '#FFFFFF',
              color: epingle ? 'var(--surga-accent-ink, #A64B08)' : 'var(--text2, #5A4E42)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Pin size={13} />
            <span>{epingle ? 'Épinglée en tête' : 'Épingler'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button
            type="button"
            onClick={onFermer}
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
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Save size={15} />
            <span>Enregistrer</span>
          </button>
        </div>
      </form>
    </div>
  )
}
