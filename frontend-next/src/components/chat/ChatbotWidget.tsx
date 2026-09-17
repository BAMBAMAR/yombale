'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import ChatbotMessageItem, { type ChatMessage } from './ChatbotMessageItem'

const WA_OFFICIAL_URL = 'https://wa.me/221708717942?text=' + encodeURIComponent('Bonjour Nopalou')

function getCurrentTime(): string {
  const now = new Date()
  return now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'msg-init',
  sender: 'bot',
  text: "Bonjour et bienvenue sur Nopalou ! Je suis l'assistant interactif. Vous pouvez me poser une question, rechercher un article ou trouver un logement :",
  time: getCurrentTime(),
  chips: [
    { label: 'Rechercher un smartphone', url: 'iPhone 13' },
    { label: 'Locations Almadies', url: '/annonces/immo' },
    { label: 'Créer ma boutique', url: '/creer-boutique' },
    { label: 'Frais de livraison', url: 'Quels sont les délais de livraison ?' },
  ],
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, messages])

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim()
    if (!query || isLoading) return

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: query,
      time: getCurrentTime(),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      })
      const data = await res.json()

      const botMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: data.reply || "J'ai bien reçu votre demande.",
        time: getCurrentTime(),
        items: data.items || [],
        chips: data.chips || [],
        whatsappUrl: data.whatsappUrl,
      }

      setMessages((prev) => [...prev, botMsg])
    } catch {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'bot',
        text: "Nos serveurs sont momentanément occupés. Vous pouvez poursuivre directement avec notre équipe sur WhatsApp :",
        time: getCurrentTime(),
        whatsappUrl: `https://wa.me/221708717942?text=${encodeURIComponent(query)}`,
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Bouton Flottant Déclencheur */}
      <button
        type="button"
        className="npl-chat-floating-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Fermer l'assistant" : "Ouvrir l'assistant Nopalou"}
        title="Assistant Nopalou"
      >
        <span className="npl-chat-status-dot" />
        {isOpen ? (
          <X size={18} />
        ) : (
          <MessageCircle size={18} />
        )}
        <span className="npl-chat-floating-label">
          {isOpen ? 'Fermer' : 'Aide & Recherche'}
        </span>
      </button>

      {/* Fenêtre Panel de Chat */}
      {isOpen && (
        <aside className="npl-chat-panel" aria-label="Assistant interactif Nopalou">
          {/* Header */}
          <div className="npl-chat-header">
            <div className="npl-chat-header-info">
              <div className="npl-chat-header-avatar">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="npl-chat-header-title">Assistant Nopalou</div>
                <div className="npl-chat-header-sub">
                  <span className="npl-chat-status-dot" />
                  <span>En ligne • IA & WhatsApp</span>
                </div>
              </div>
            </div>

            <div className="npl-chat-header-actions">
              <a
                href={WA_OFFICIAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="npl-chat-btn-icon"
                title="Ouvrir WhatsApp officiel"
                aria-label="Ouvrir WhatsApp officiel"
              >
                <ExternalLink size={15} />
              </a>
              <button
                type="button"
                className="npl-chat-btn-icon"
                onClick={() => setIsOpen(false)}
                title="Fermer"
                aria-label="Fermer la boîte de chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="npl-chat-body">
            {messages.map((m) => (
              <ChatbotMessageItem
                key={m.id}
                msg={m}
                onChipClick={(label) => handleSendMessage(label)}
              />
            ))}
            {isLoading && (
              <div className="npl-chat-msg bot">
                <div className="npl-chat-bubble" style={{ fontStyle: 'italic', color: '#6b7280' }}>
                  Recherche en cours...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="npl-chat-footer">
            <input
              ref={inputRef}
              type="text"
              className="npl-chat-input"
              placeholder="Posez votre question (ex: iPhone, livraison...)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              type="button"
              className="npl-chat-send-btn"
              onClick={() => handleSendMessage()}
              disabled={isLoading || !input.trim()}
              aria-label="Envoyer"
            >
              <Send size={15} />
            </button>
          </div>
        </aside>
      )}
    </>
  )
}
