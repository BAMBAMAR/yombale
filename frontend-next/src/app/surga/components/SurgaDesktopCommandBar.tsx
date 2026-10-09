'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Search, Mic } from 'lucide-react'

interface SurgaDesktopCommandBarProps {
  onOpenVoice: () => void
  onSubmitQuery?: (query: string) => void
}

export default function SurgaDesktopCommandBar({
  onOpenVoice,
  onSubmitQuery,
}: SurgaDesktopCommandBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [valeur, setValeur] = useState('')

  // Raccourci global Ctrl+K / Cmd+K pour activer la barre
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const texteNettoye = valeur.trim()
    if (!texteNettoye) return
    if (onSubmitQuery) {
      onSubmitQuery(texteNettoye)
      setValeur('')
    } else {
      // Par défaut, redirige vers la modale vocale ou d'action
      onOpenVoice()
    }
  }

  return (
    <form
      className="surga-desktop-command-bar"
      onSubmit={handleSubmit}
      role="search"
      aria-label="Barre de commande Surga"
    >
      <div className="surga-command-left">
        <Search size={16} className="surga-command-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="surga-command-input"
          placeholder="Demandez à Surga : note 2 500 FCFA de taxi, rappelle rdv..."
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
        />
      </div>

      <div className="surga-command-right">
        <kbd className="surga-kbd-shortcut">Ctrl K</kbd>
        <button
          type="button"
          className="surga-command-mic-btn"
          onClick={onOpenVoice}
          title="Parler à Surga (vocal direct)"
          aria-label="Parler à Surga"
        >
          <Mic size={16} />
        </button>
      </div>
    </form>
  )
}
