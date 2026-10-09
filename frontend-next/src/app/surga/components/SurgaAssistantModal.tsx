'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, X, Loader2, Send } from 'lucide-react'
import SurgaAssistantContent from './SurgaAssistantContent'

export interface SurgaAssistantResultat {
  type: 'LLM_REPLY' | 'ACTION_DEPENSE' | 'ACTION_RAPPEL' | 'ACTION_NOTE' | 'CALCUL' | 'NAVIGATION' | 'DATA_TRAFIC' | 'DATA_CONCOURS' | 'DATA_METEO' | 'INFO'
  query?: string
  texte?: string
  titreSuggere?: string
  expression?: string
  resultat?: number
  formatFCFA?: string
  action?: string
  data?: any
  message?: string
  navigation?: {
    tab: string
    modal?: string
  }
}

interface SurgaAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
  initialResultat?: SurgaAssistantResultat | null
  isLoading?: boolean
  onExecuterQuery: (query: string) => Promise<SurgaAssistantResultat | null>
  onConfirmerDepense?: (depense: { montant: number; categorie: string; note: string }) => Promise<void>
  onConfirmerNote?: (note: { titre: string; contenu: string }) => Promise<void>
  onConfirmerRappel?: (rappel: { titre: string; date: string; heure: string }) => Promise<void>
  onNavigateTab?: (tab: 'notes' | 'depenses' | 'agenda' | 'aujourdhui' | 'services') => void
  onOpenModal?: (modal: string) => void
}

export default function SurgaAssistantModal({
  isOpen,
  onClose,
  initialQuery = '',
  initialResultat = null,
  isLoading = false,
  onExecuterQuery,
  onConfirmerDepense,
  onConfirmerNote,
  onConfirmerRappel,
  onNavigateTab,
  onOpenModal,
}: SurgaAssistantModalProps) {
  const [query, setQuery] = useState(initialQuery)
  const [resultat, setResultat] = useState<SurgaAssistantResultat | null>(initialResultat)
  const [chargement, setChargement] = useState(isLoading)
  const [aCopie, setACopie] = useState(false)
  const [noteEnregistree, setNoteEnregistree] = useState(false)
  const [actionValidee, setActionValidee] = useState(false)

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery)
    if (initialResultat) setResultat(initialResultat)
    setChargement(isLoading)
    setACopie(false)
    setNoteEnregistree(false)
    setActionValidee(false)
  }, [initialQuery, initialResultat, isLoading])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q || chargement) return

    setChargement(true)
    setACopie(false)
    setNoteEnregistree(false)
    setActionValidee(false)

    try {
      const res = await onExecuterQuery(q)
      setResultat(res)
    } finally {
      setChargement(false)
    }
  }

  const handleCopier = () => {
    if (!resultat?.texte) return
    navigator.clipboard.writeText(resultat.texte)
    setACopie(true)
    setTimeout(() => setACopie(false), 2200)
  }

  const handleSauvegarderNote = async () => {
    if (!resultat?.texte || !onConfirmerNote) return
    await onConfirmerNote({
      titre: resultat.titreSuggere || 'Note Surga',
      contenu: resultat.texte,
    })
    setNoteEnregistree(true)
    setTimeout(() => setNoteEnregistree(false), 2500)
  }

  const handlePartagerWhatsApp = () => {
    if (!resultat?.texte) return
    const url = `https://wa.me/?text=${encodeURIComponent(resultat.texte)}`
    window.open(url, '_blank')
  }

  const handleValiderAction = async () => {
    if (!resultat) return
    if (resultat.type === 'ACTION_DEPENSE' && resultat.data && onConfirmerDepense) {
      await onConfirmerDepense(resultat.data)
      setActionValidee(true)
    } else if (resultat.type === 'ACTION_RAPPEL' && resultat.data && onConfirmerRappel) {
      await onConfirmerRappel(resultat.data)
      setActionValidee(true)
    } else if (resultat.type === 'ACTION_NOTE' && resultat.data && onConfirmerNote) {
      await onConfirmerNote(resultat.data)
      setActionValidee(true)
    } else if (resultat.type === 'NAVIGATION' && resultat.navigation && onNavigateTab) {
      onNavigateTab(resultat.navigation.tab as any)
      if (resultat.navigation.modal && onOpenModal) {
        onOpenModal(resultat.navigation.modal)
      }
      onClose()
    }
  }

  return (
    <div
      className="surga-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="surga-assistant-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 620,
          backgroundColor: '#FFFFFF',
          borderRadius: 18,
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.22)',
          border: '1px solid var(--surga-border, #E2E8F0)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
        }}
      >
        {/* En-tête Assistant */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FAFAF8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'rgba(217, 119, 6, 0.12)',
                color: 'var(--surga-accent-ink, #A64B08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--surga-primary, #0F172A)' }}>
                Surga AI Assistant
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Rédaction, questions, navigation & actions locales
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
            }}
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulaire de saisie active */}
        <form onSubmit={handleSubmit} style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: reformule ce texte, fais un discours de bienvenue, note 2 500 FCFA..."
              autoFocus
              style={{
                flex: 1,
                border: '1px solid var(--surga-border, #CBD5E1)',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 14,
                outline: 'none',
                backgroundColor: '#FFFFFF',
              }}
            />
            <button
              type="submit"
              disabled={chargement || !query.trim()}
              style={{
                backgroundColor: 'var(--surga-accent, #D97706)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                padding: '0 16px',
                fontWeight: 700,
                cursor: chargement || !query.trim() ? 'not-allowed' : 'pointer',
                opacity: chargement || !query.trim() ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {chargement ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </form>

        {/* Corps de la réponse */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <SurgaAssistantContent
            chargement={chargement}
            resultat={resultat}
            aCopie={aCopie}
            noteEnregistree={noteEnregistree}
            actionValidee={actionValidee}
            onCopier={handleCopier}
            onSauvegarderNote={handleSauvegarderNote}
            onPartagerWhatsApp={handlePartagerWhatsApp}
            onValiderAction={handleValiderAction}
          />
        </div>
      </div>
    </div>
  )
}
