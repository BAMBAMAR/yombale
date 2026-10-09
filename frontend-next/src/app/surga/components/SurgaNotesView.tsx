'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Plus,
  Search,
  X,
  Pin,
  CheckSquare,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react'
import {
  type SurgaNote,
  type SurgaNoteCategorie,
  type SurgaNoteCouleur,
  type SurgaChecklistItem,
  getLocalNotes,
  saveLocalNote,
  deleteLocalNote,
  synchroniserSurga,
} from '@/lib/surga-offline-sync'
import SurgaNoteCard from './SurgaNoteCard'
import SurgaNoteEditor from './SurgaNoteEditor'
import { lireBrouillonNote, garderBrouillonNote, effacerBrouillonNote, type BrouillonNote } from '@/lib/surga-brouillon-note'

type FiltreCategorie = 'toutes' | 'epingles' | SurgaNoteCategorie

const ONGLETS_FILTRES: Array<{ key: FiltreCategorie; label: string }> = [
  { key: 'toutes', label: 'Toutes' },
  { key: 'epingles', label: 'Épinglées' },
  { key: 'courses', label: 'Courses' },
  { key: 'travail', label: 'Travail' },
  { key: 'personnel', label: 'Personnel' },
  { key: 'general', label: 'Mémos' },
  { key: 'urgent', label: 'Urgentes' },
]

export default function SurgaNotesView() {
  const [notes, setNotes] = useState<SurgaNote[]>([])
  const [recherche, setRecherche] = useState<string>('')
  const [filtreActif, setFiltreActif] = useState<FiltreCategorie>('toutes')
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [noteEnEdition, setNoteEnEdition] = useState<SurgaNote | null>(null)
  // SRG-A3-007 : note en cours d'écriture laissée sans enregistrement (rechargement, retour, changement d'onglet).
  const [brouillon, setBrouillon] = useState<BrouillonNote | null>(null)
  useEffect(() => { if (!isEditing) setBrouillon(lireBrouillonNote()) }, [isEditing])
  const [notification, setNotification] = useState<string | null>(null)

  const chargerNotes = () => {
    const data = getLocalNotes()
    setNotes(data)
  }

  useEffect(() => {
    chargerNotes()
    synchroniserSurga().then((synced) => {
      if (synced) chargerNotes()
    })
  }, [])

  const notesFiltrees = useMemo(() => {
    return notes
      .filter((n) => {
        // Filtre catégorie
        if (filtreActif === 'epingles' && !n.epingle) return false
        if (
          filtreActif !== 'toutes' &&
          filtreActif !== 'epingles' &&
          (n.categorie || 'general') !== filtreActif
        ) {
          return false
        }

        // Filtre recherche
        if (recherche.trim()) {
          const q = recherche.toLowerCase()
          const matchTitre = n.titre.toLowerCase().includes(q)
          const matchContenu = (n.contenu || '').toLowerCase().includes(q)
          const matchChecklist = (n.checklist || []).some((i) =>
            i.texte.toLowerCase().includes(q)
          )
          if (!matchTitre && !matchContenu && !matchChecklist) return false
        }

        return true
      })
      .sort((a, b) => {
        // Priorité aux épinglées
        if (Boolean(a.epingle) !== Boolean(b.epingle)) {
          return a.epingle ? -1 : 1
        }
        const dateA = a.updated_at || a.created_at
        const dateB = b.updated_at || b.created_at
        return dateB.localeCompare(dateA)
      })
  }, [notes, filtreActif, recherche])

  // Statistiques rapides
  const stats = useMemo(() => {
    const total = notes.length
    const epingles = notes.filter((n) => n.epingle).length
    const checklists = notes.filter((n) => n.is_checklist).length
    return { total, epingles, checklists }
  }, [notes])

  const handleOuvrirNouveau = () => {
    setNoteEnEdition(null)
    setIsEditing(true)
  }

  const handleOuvrirEdition = (note: SurgaNote) => {
    setNoteEnEdition(note)
    setIsEditing(true)
  }

  const handleReprendreBrouillon = () => {
    if (!brouillon) return
    const note = brouillon.id ? notes.find((n) => n.id === brouillon.id) || null : null
    // La note d'origine n'existe plus : son brouillon devient celui d'une nouvelle note.
    if (brouillon.id && !note) garderBrouillonNote({ ...brouillon, id: null })
    setNoteEnEdition(note)
    setIsEditing(true)
  }

  const handleEnregistrer = async (data: {
    id?: string
    titre: string
    contenu: string
    categorie: SurgaNoteCategorie
    couleur: SurgaNoteCouleur
    epingle: boolean
    is_checklist: boolean
    checklist: SurgaChecklistItem[]
  }) => {
    saveLocalNote(data)
    setIsEditing(false)
    setNoteEnEdition(null)
    chargerNotes()

    setNotification(data.id ? 'Note mise à jour avec succès' : 'Note enregistrée avec succès')
    setTimeout(() => setNotification(null), 3000)

    await synchroniserSurga()
    chargerNotes()
  }

  const handleSupprimer = async (id: string) => {
    if (confirm('Voulez-vous supprimer cette note ?')) {
      deleteLocalNote(id)
      chargerNotes()
      if (navigator.onLine) {
        try {
          await fetch(`/api/surga/notes/${id}`, { method: 'DELETE' })
        } catch {}
      }
    }
  }

  const handleTogglePin = async (id: string) => {
    const target = notes.find((n) => n.id === id)
    if (!target) return

    saveLocalNote({
      ...target,
      epingle: !target.epingle,
    })
    chargerNotes()
    await synchroniserSurga()
  }

  const handleToggleCheckItem = (noteId: string, itemId: string) => {
    const target = notes.find((n) => n.id === noteId)
    if (!target || !target.checklist) return

    const updatedChecklist = target.checklist.map((item) =>
      item.id === itemId ? { ...item, fait: !item.fait } : item
    )

    saveLocalNote({
      ...target,
      checklist: updatedChecklist,
    })
    chargerNotes()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            placeholder="Rechercher dans vos notes et listes..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: 13,
              backgroundColor: 'transparent',
              color: 'var(--navy, #1C2B4A)',
            }}
          />
          {recherche && (
            <button
              type="button"
              onClick={() => setRecherche('')}
              aria-label="Effacer la recherche"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} color="var(--text3, #73675E)" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleOuvrirNouveau}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 10,
            padding: '9px 14px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(28, 43, 74, 0.15)',
          }}
        >
          <Plus size={16} />
          <span>Nouvelle</span>
        </button>
      </div>

      {/* Bandeau de synthèse visuelle */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          padding: '10px 12px',
          backgroundColor: '#FFFFFF',
          borderRadius: 10,
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{stats.total}</div>
          <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', textTransform: 'uppercase', letterSpacing: 0.3 }}>Notes au total</div>
        </div>
        <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border, #E8DDD2)', borderRight: '1px solid var(--border, #E8DDD2)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--surga-accent-ink, #A64B08)' }}>{stats.epingles}</div>
          <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', textTransform: 'uppercase', letterSpacing: 0.3 }}>Épinglées</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--price, #0A5C36)' }}>{stats.checklists}</div>
          <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', textTransform: 'uppercase', letterSpacing: 0.3 }}>Checklists</div>
        </div>
      </div>

      {/* Onglets de filtrage rapide */}
      <div
        className="surga-scroll-tabs"
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {ONGLETS_FILTRES.map((tab) => {
          const estActif = filtreActif === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFiltreActif(tab.key)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: estActif ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
                backgroundColor: estActif ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                color: estActif ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                fontSize: 12,
                fontWeight: estActif ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#DCFCE7',
            color: 'var(--price, #0A5C36)',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <CheckCircle2 size={15} />
          <span>{notification}</span>
        </div>
      )}

      {!isEditing && brouillon && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', padding: '10px 12px', borderRadius: 10, backgroundColor: 'var(--surga-surface, #FFFFFF)', border: '1px solid var(--surga-border, #E2E8F0)', fontSize: 13, color: 'var(--surga-text1, #0F172A)' }}>
          <span style={{ minWidth: 0, wordBreak: 'break-word' }}>Une note n’a pas été enregistrée{brouillon.titre.trim() ? ` : « ${brouillon.titre.trim()} »` : ''}.</span>
          <span style={{ display: 'inline-flex', gap: 14, flexShrink: 0 }}>
            <button type="button" onClick={handleReprendreBrouillon} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--surga-accent-text, #92400E)' }}>Reprendre</button>
            <button type="button" onClick={() => { effacerBrouillonNote(); setBrouillon(null) }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, color: 'var(--surga-text2, #475569)' }}>Effacer</button>
          </span>
        </div>
      )}

      {/* Éditeur de Note (création ou modification) */}
      {isEditing && (
        <SurgaNoteEditor
          noteInitiale={noteEnEdition}
          onEnregistrer={handleEnregistrer}
          onFermer={() => {
            setIsEditing(false)
            setNoteEnEdition(null)
          }}
        />
      )}

      {/* Grille / Liste des Notes */}
      {notesFiltrees.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 32,
            textAlign: 'center',
            border: '1px dashed var(--border, #E8DDD2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: '#F8F5F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text3, #73675E)',
            }}
          >
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
              {recherche ? 'Aucune note ne correspond à votre recherche' : 'Votre carnet de notes est vide'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', marginTop: 4 }}>
              {recherche
                ? 'Essayez avec un autre mot-clé ou réinitialisez la recherche.'
                : 'Créez votre première note, liste de courses ou mémo dès maintenant.'}
            </div>
          </div>
          {!recherche && (
            <button
              type="button"
              onClick={handleOuvrirNouveau}
              style={{
                marginTop: 6,
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid var(--navy, #1C2B4A)',
                backgroundColor: 'transparent',
                color: 'var(--navy, #1C2B4A)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + Rédiger une note
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notesFiltrees.map((note) => (
            <SurgaNoteCard
              key={note.id}
              note={note}
              onEditer={handleOuvrirEdition}
              onSupprimer={handleSupprimer}
              onTogglePin={handleTogglePin}
              onToggleCheckItem={handleToggleCheckItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}
