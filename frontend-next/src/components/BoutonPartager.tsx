'use client'
import { useState } from 'react'

interface Props {
  lien: string
  message: string
  lienVisuel: string
  onPartage?: () => void
}

export default function BoutonPartager({ lien, message, lienVisuel, onPartage }: Props) {
  const [ouvert, setOuvert] = useState(false)
  const [copie, setCopie] = useState(false)

  const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(message)}`

  function partagerWhatsApp() {
    window.open(urlWhatsApp, '_blank', 'noopener,noreferrer')
    onPartage?.()
  }

  function copierLien() {
    navigator.clipboard.writeText(lien).then(() => {
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
      onPartage?.()
    })
    setOuvert(false)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', gap: 4 }}>
      <button
        onClick={partagerWhatsApp}
        style={{
          padding: '8px 16px', background: '#25D366', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}
      >
        💬 Partager
      </button>
      <button
        onClick={() => setOuvert(o => !o)}
        aria-label="Plus d'options de partage"
        style={{
          padding: '8px 10px', background: '#fff', color: '#374151',
          border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, cursor: 'pointer',
        }}
      >
        ⋯
      </button>
      {ouvert && (
        <>
          <div
            onClick={() => setOuvert(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
          />
          <div style={{
            position: 'absolute', top: '110%', right: 0, zIndex: 9999,
            background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: 8, minWidth: 190, maxWidth: 'calc(100vw - 32px)',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
          <button
            onClick={copierLien}
            style={{ padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 6 }}
          >
            {copie ? '✓ Copié' : '📋 Copier le lien'}
          </button>
          <a
            href={lienVisuel}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOuvert(false)}
            style={{ padding: '8px 12px', textDecoration: 'none', color: '#111827', fontSize: 13, fontWeight: 600, borderRadius: 6 }}
          >
            🖼 Télécharger le visuel
          </a>
        </div>
      )}
    </div>
  )
}
