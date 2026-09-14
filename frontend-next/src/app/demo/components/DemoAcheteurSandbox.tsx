'use client'

import React from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { ChatMessage } from './types'

interface DemoAcheteurSandboxProps {
  chatMessages: ChatMessage[]
  chatInput: string
  onChatInputChange: (val: string) => void
  onSendChat: (e: React.FormEvent) => void
}

export default function DemoAcheteurSandbox({
  chatMessages,
  chatInput,
  onChatInputChange,
  onSendChat
}: DemoAcheteurSandboxProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          background: '#020617',
          padding: 14,
          borderRadius: 10,
          border: '1px solid #1E293B',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 6 }}>
          <MessageCircle size={15} color="#25D366" />
          <span>Assistant Chatbot WhatsApp Meta Commerce</span>
        </div>

        {/* Chat simulation box */}
        <div
          style={{
            background: '#0F172A',
            borderRadius: 8,
            padding: 10,
            maxHeight: 220,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          {chatMessages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              <div
                style={{
                  background: m.sender === 'user' ? '#059669' : '#1E293B',
                  color: '#FFF',
                  padding: '8px 12px',
                  borderRadius: 10,
                  fontSize: 12,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={onSendChat} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={chatInput}
            onChange={e => onChatInputChange(e.target.value)}
            placeholder="Tapez un message (ex: Riz 50kg, iPhone 15)..."
            style={{
              flex: 1,
              background: '#0F172A',
              border: '1px solid #334155',
              padding: '8px 12px',
              borderRadius: 8,
              color: '#FFF',
              fontSize: 12
            }}
          />
          <button
            type="submit"
            style={{
              background: '#059669',
              color: '#FFF',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <Send size={13} />
            <span>Envoyer</span>
          </button>
        </form>
      </div>
    </div>
  )
}
