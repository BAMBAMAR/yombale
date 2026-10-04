'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Save,
  X,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import {
  type SurgaNote,
  getLocalNotes,
  saveLocalNote,
  deleteLocalNote,
  synchroniserSurga,
} from '@/lib/surga-offline-sync'

export default function SurgaNotesView() {
  const [notes, setNotes] = useState<SurgaNote[]>([])
  const [recherche, setRecherche] = useState<string>('')
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [titre, setTitre] = useState<string>('')
  const [contenu, setContenu] = useState<string>('')
  const [notification, setNotification] = useState<string | null>(null)

  const chargerNotes = () => {
    const data = getLocalNotes()
    setNotes(data)
  }

  useEffect(() => {
    chargerNotes()
    // Tentative de synchronisation en arrière-plan
    synchroniserSurga().then((synced) => {
      if (synced) chargerNotes()
    })
  }, [])

  const notesFiltrees = useMemo(() => {
    if (!recherche.trim()) return notes
    const q = recherche.toLowerCase()
    return notes.filter(
      (n) => n.titre.toLowerCase().includes(q) || n.contenu.toLowerCase().includes(q)
    )
  }, [notes, recherche])

  const handleOuvrirNouveau = () => {
    setCurrentId(null)
    setTitre('')
    setContenu('')
    setIsEditing(true)
  }

  const handleOuvrirEdition = (note: SurgaNote) => {
    setCurrentId(note.id)
    setTitre(note.titre)
    setContenu(note.contenu)
    setIsEditing(true)
  }

  const handleEnregistrer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titre.trim()) return

    saveLocalNote({
      id: currentId || undefined,
      titre: titre.trim(),
      contenu,
    })

    setIsEditing(false)
    setTitre('')
    setContenu('')
    setCurrentId(null)
    chargerNotes()

    setNotification('Note enregistrée avec succès')
    setTimeout(() => setNotification(null), 3000)

    // Synchronisation vers backend si connecté
    await synchroniserSurga()
    chargerNotes()
  }

  const handleSupprimer = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Voulez-vous supprimer cette note ?')) {
      deleteLocalNote(id)
      chargerNotes()
      // Appel API en arrière-plan si en ligne
      if (navigator.onLine) {
        try {
          await fetch(`/api/surga/notes/${id}`, { method: 'DELETE' })
        } catch {}
      }
    }
  }

  const formaterDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Barre d'action et recherche */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 10,
            padding: '8px 12px',
            border: '1px solid var(--border, #E8DDD2)',
            gap: 8,
          }}
        >
          <Search size={16} color="var(--text3, #73675E)" />
          <input
            type="text"
            placeholder="Rechercher une note..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: 14,
              backgroundColor: 'transparent',
              color: 'var(--navy, #1C2B4A)',
            }}
          />
          {recherche && (
            <button
              type="button"
              onClick={() => setRecherche('')}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <X size={14} color="var(--text3, #73675E)" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleOuvrirNouveau}
          className="btn-npl"
          style={{
            backgroundColor: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <Plus size={16} />
          <span>Nouvelle</span>
        </button>
      </div>

      {/* Message de confirmation */}
      {notification && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'rgba(10,92,54,0.1)',
            color: 'var(--price, #0A5C36)',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* Modale d'édition / création de note */}
      {isEditing && (
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
              {currentId ? 'Modifier la note' : 'Nouvelle note'}
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <X size={18} color="var(--text2, #5A4E42)" />
            </button>
          </div>

          <form onSubmit={handleEnregistrer} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="text"
              placeholder="Titre de la note *"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 15,
                fontWeight: 600,
                outline: 'none',
              }}
            />

            <textarea
              placeholder="Contenu de votre note (idées, listes, courses, mémos)..."
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 14,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
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
                  backgroundColor: 'var(--accent, #C75B00)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Save size={14} />
                <span>Enregistrer</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des notes */}
      {notesFiltrees.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 30,
            textAlign: 'center',
            border: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <FileText size={32} color="var(--text3, #73675E)" style={{ margin: '0 auto 10px auto' }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Aucune note enregistrée
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2, #5A4E42)', marginTop: 4 }}>
            Appuyez sur "Nouvelle" pour rédiger votre premier mémo.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notesFiltrees.map((n) => (
            <div
              key={n.id}
              onClick={() => handleOuvrirEdition(n)}
              className="surga-item-row"
              style={{ cursor: 'pointer', width: '100%' }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: 'rgba(28,43,74,0.08)',
                  color: 'var(--navy, #1C2B4A)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FileText size={18} />
              </div>

              <div className="surga-item-content">
                <div className="surga-item-line1" style={{ fontWeight: 700 }}>
                  {n.titre}
                </div>
                <div className="surga-item-line2">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} />
                    <span>{formaterDate(n.updated_at || n.created_at)}</span>
                  </span>
                  {n.contenu && (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      • {n.contenu.slice(0, 45)}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleSupprimer(n.id, e)}
                aria-label="Supprimer la note"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 8,
                  cursor: 'pointer',
                  color: 'var(--text3, #73675E)',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
