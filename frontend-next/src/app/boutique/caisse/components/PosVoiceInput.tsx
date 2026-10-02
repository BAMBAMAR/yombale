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

import { normaliserTexteVocal, separerQuantiteEtMontant } from '@/lib/voice-assistant'

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

  // Analyse de la commande vocale (Français + mots wolof).
  // AUD-200 : le montant est extrait d'abord ; la quantité n'est cherchée que dans le reste de la phrase.
  const traiterCommandeVocale = (texte: string) => {
    const propre = (texte || '').trim()
    if (!propre) {
      setFeedback({ type: 'info', text: "Je n'ai rien compris. Réessayez en parlant plus près du micro." })
      setTimeout(() => setFeedback(null), 5000)
      return
    }
    const { quantite, montant: montantDetecte, reste } = separerQuantiteEtMontant(propre)

    if (quantite > 50) {
      setFeedback({ type: 'info', text: `Quantité inhabituelle (${quantite}) non appliquée. Dites par exemple : « 2 Café Touba ».` })
      setTimeout(() => setFeedback(null), 5000)
      return
    }

    // Recherche du produit : uniquement sur des mots utiles (>= 3 lettres, hors mots vides)
    const MOTS_VIDES = new Set(['vente', 'ventes', 'ajoute', 'ajouter', 'mets', 'mettre', 'donne', 'donner', 'prends', 'prendre', 'veux', 'encaisser', 'francs', 'franc', 'fcfa', 'cfa', 'pour', 'avec', 'les', 'des', 'une', 'aussi', 'svp', 'stp', 'plait'])
    const motsUtiles = reste.split(/\s+/).filter(m => m.length >= 3 && !MOTS_VIDES.has(m) && !/^\d+$/.test(m))
    let meilleurProduit: ProduitCaisseVoice | null = null
    let meilleurRatio = 0
    if (motsUtiles.length > 0) {
      for (const p of produits) {
        const motsP = normaliserTexteVocal(p.nom).split(/\s+/).filter(mp => mp.length >= 3)
        let trouves = 0
        for (const mot of motsUtiles) {
          if (motsP.some(mp => mp === mot || (mot.length >= 4 && mp.length >= 4 && (mp.startsWith(mot) || mot.startsWith(mp))))) trouves++
        }
        const ratio = trouves / motsUtiles.length
        if (trouves >= 1 && ratio > meilleurRatio) { meilleurRatio = ratio; meilleurProduit = p }
      }
    }

    if (meilleurProduit && meilleurRatio >= 0.5) {
      onAjouterProduit(meilleurProduit, quantite)
      setFeedback({ type: 'success', text: `Ajouté : ${quantite}x ${meilleurProduit.nom} (${(meilleurProduit.prix * quantite).toLocaleString()} FCFA)` })
      setTimeout(() => setFeedback(null), 4000)
      return
    }

    // Pas de produit reconnu mais un montant libre : confirmation au-delà d'un seuil
    if (montantDetecte && onAjoutRapideLibre) {
      if (montantDetecte * quantite > 200000) {
        setFeedback({ type: 'info', text: `Montant très élevé (${(montantDetecte * quantite).toLocaleString()} FCFA) : saisissez-le au clavier pour confirmer.` })
        setTimeout(() => setFeedback(null), 6000)
        return
      }
      onAjoutRapideLibre('Article Vocal Comptoir', montantDetecte, quantite)
      setFeedback({ type: 'success', text: `Ajout Vente Rapide : ${montantDetecte.toLocaleString()} FCFA${quantite > 1 ? ` x ${quantite}` : ''}` })
      setTimeout(() => setFeedback(null), 4000)
      return
    }

    setFeedback({ type: 'info', text: `Entendu : « ${propre} ». Dites par exemple : « 2 Café Touba » ou « 5000 FCFA ».` })
    setTimeout(() => setFeedback(null), 5000)
  }
  if (!isSupported) return null

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
      <button
        type="button"
        onClick={toggleListen}
        title={isListening ? 'Arrêter écoute vocale' : 'Assistant vocal caisse (Français + mots wolof) : Dites un produit ou un montant'}
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
