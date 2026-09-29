'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2, Sparkles, X, Check } from 'lucide-react'

export interface ProduitCaisseVoice {
  id: string
  nom: string
  prix: number
  stock?: number
}

interface PosVoiceInputProps {
  produits: ProduitCaisseVoice[]
  onAjouterProduit: (produit: ProduitCaisseVoice, quantite: number) => void
  onAjoutRapideLibre?: (nom: string, montant: number, quantite: number) => void
}

import { NOMBRES_MAPPING, DEVISES_WOLOF, normaliserTexteVocal, extraireMontantCFA } from '@/lib/voice-assistant'

export default function PosVoiceInput({
  produits,
  onAjouterProduit,
  onAjoutRapideLibre,
}: PosVoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        setIsSupported(false)
        return
      }
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'fr-FR'

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript.trim()
        setTranscript(text)
        traiterCommandeVocale(text)
        setIsListening(false)
      }

      recognition.onerror = (event: any) => {
        console.warn('[VOICE POS] Erreur reco vocale:', event.error)
        setIsListening(false)
        if (event.error !== 'no-speech') {
          setFeedback({ type: 'error', text: `Erreur micro (${event.error}). Réessayez.` })
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [produits])

  const toggleListen = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setFeedback(null)
      setTranscript('')
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.error('Erreur démarrage reconnaissance', err)
      }
    }
  }

  // Analyse intelligente de la commande vocale (Wolof & Français)
  const traiterCommandeVocale = (texte: string) => {
    const clean = normaliserTexteVocal(texte)
    const mots = clean.split(/\s+/)

    // 1. Détection de quantité
    let quantite = 1
    for (const [mot, val] of Object.entries(NOMBRES_MAPPING)) {
      const regex = new RegExp(`\\b${mot}\\b`, 'i')
      if (regex.test(clean)) {
        quantite = val
        break
      }
    }

    // 2. Détection de montant en Franc CFA / Wolof (ex: "téemeer" = 500, "junni" = 5000, "5000 FCFA", "10k")
    const montantDetecte = extraireMontantCFA(clean)

    // 3. Recherche du produit le plus proche dans le catalogue
    let meilleurProduit: ProduitCaisseVoice | null = null
    let scoreMax = 0

    for (const p of produits) {
      const nomP = normaliserTexteVocal(p.nom)
      const motsP = nomP.split(/\s+/)

      let score = 0
      for (const mot of mots) {
        if (mot.length >= 3 && motsP.some(mp => mp.includes(mot) || mot.includes(mp))) {
          score += 2
        }
      }

      if (nomP.includes(clean) || clean.includes(nomP)) {
        score += 5
      }

      if (score > scoreMax) {
        scoreMax = score
        meilleurProduit = p
      }
    }

    if (meilleurProduit && scoreMax >= 2) {
      onAjouterProduit(meilleurProduit, quantite)
      setFeedback({
        type: 'success',
        text: `✓ Ajouté : ${quantite}x ${meilleurProduit.nom} (${(meilleurProduit.prix * quantite).toLocaleString()} FCFA)`,
      })
      setTimeout(() => setFeedback(null), 4000)
      return
    }

    // 4. Si pas de produit exact trouvé mais montant libre détecté
    if (montantDetecte && onAjoutRapideLibre) {
      onAjoutRapideLibre('Article Vocal Comptoir', montantDetecte, quantite)
      setFeedback({
        type: 'success',
        text: `✓ Ajout Vente Rapide : ${montantDetecte.toLocaleString()} FCFA (${quantite} unité)`,
      })
      setTimeout(() => setFeedback(null), 4000)
      return
    }

    // Si non reconnu
    setFeedback({
      type: 'info',
      text: `🎤 Entendu : "${texte}". Dites par exemple : "2 Café Touba" ou "5000 FCFA".`,
    })
    setTimeout(() => setFeedback(null), 5000)
  }

  if (!isSupported) return null

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
      <button
        type="button"
        onClick={toggleListen}
        title={isListening ? 'Arrêter écoute vocale' : 'Assistant vocal caisse (Wolof & Français) : Dites un produit ou un montant'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          height: 38,
          padding: isListening ? '0 14px' : '0 12px',
          borderRadius: 10,
          border: isListening ? '2px solid var(--danger, #DC2626)' : '1.5px solid var(--border, #E8DDD2)',
          background: isListening ? 'var(--danger-bg, #FEF2F2)' : 'var(--card-bg, #FFFFFF)',
          color: isListening ? 'var(--danger, #DC2626)' : 'var(--navy, #1C2B4A)',
          fontSize: 13,
          fontWeight: 750,
          cursor: 'pointer',
          boxShadow: isListening ? '0 0 12px rgba(220, 38, 38, 0.4)' : '0 1px 2px rgba(0,0,0,0.04)',
          transition: 'all 0.2s ease',
        }}
      >
        {isListening ? (
          <>
            <span style={{
              width: 10, height: 10, borderRadius: '50%', background: 'var(--danger, #DC2626)',
              animation: 'pulse 1s infinite alternate'
            }} />
            <Mic size={16} />
            <span>J&apos;écoute...</span>
          </>
        ) : (
          <>
            <Mic size={16} style={{ color: 'var(--accent, #C75B00)' }} />
            <span className="hidden sm:inline">Vocal</span>
          </>
        )}
      </button>

      {/* Guide vocal en cours d'écoute */}
      {isListening && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 6,
          zIndex: 9998,
          background: 'var(--navy, #1C2B4A)',
          color: '#FFFFFF',
          padding: '6px 10px',
          borderRadius: 8,
          fontSize: 11.5,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          pointerEvents: 'none'
        }}>
          « Dites : 2 Café Touba ou 5000 FCFA »
        </div>
      )}

      {/* Popover de confirmation / feedback vocal */}
      {feedback && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 8,
          zIndex: 9999,
          background: feedback.type === 'success' ? 'var(--price, #0A5C36)' : feedback.type === 'error' ? 'var(--danger, #991B1B)' : 'var(--navy, #1C2B4A)',
          color: '#FFFFFF',
          padding: '10px 14px',
          borderRadius: 12,
          fontSize: 12.5,
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          maxWidth: 320,
        }}>
          {feedback.type === 'success' && <Check size={16} />}
          <span style={{ whiteSpace: 'normal', lineHeight: 1.3 }}>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: 2, marginLeft: 'auto' }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
