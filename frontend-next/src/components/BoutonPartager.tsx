'use client'
import { useState } from 'react'

interface Props {
  lien: string
  message: string
  lienVisuel: string
}

export default function BoutonPartager({ lien, message, lienVisuel }: Props) {
  const [ouvert, setOuvert] = useState(false)
  const [copie, setCopie] = useState(false)

  function copierLien() {
    navigator.clipboard.writeText(lien).then(() => {
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    })
  }

  const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(message)}`

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOuvert(o => !o)}
        style={{
          padding: '8px 16px', background: '#fff', color: '#374151',
          border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}
      >
        📤 Partager
      </button>
      {ouvert && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, zIndex: 10,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: 8, minWidth: 220, maxWidth: 'calc(100vw - 24px)',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <button
            onClick={copierLien}
            style={{ padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 6 }}
          >
            {copie ? '✓ Copié' : '📋 Copier le lien'}
          </button>
          <a
            href={urlWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '8px 12px', textDecoration: 'none', color: '#111827', fontSize: 13, fontWeight: 600, borderRadius: 6 }}
          >
            💬 Partager sur WhatsApp
          </a>
          <a
            href={lienVisuel}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '8px 12px', textDecoration: 'none', color: '#111827', fontSize: 13, fontWeight: 600, borderRadius: 6 }}
          >
            🖼 Télécharger le visuel
          </a>
        </div>
      )}
    </div>
  )
}
