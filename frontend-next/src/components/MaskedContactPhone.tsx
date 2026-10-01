'use client'

import { useState } from 'react'
import { Eye } from 'lucide-react'

// AUD-137 : le numéro n'est plus présent dans la page. Le serveur fournit la version masquée ; un clic appelle
// POST /api/annonces/:id/contact (limité par IP et par compte, journalisé) qui renvoie le numéro.
interface MaskedContactPhoneProps {
  masque: string | null
  annonceId: string | number
  titre?: string
  prix?: number
  baseUrl?: string
}

export default function MaskedContactPhone({
  masque,
  annonceId,
  titre = '',
  prix,
  baseUrl = 'https://nopalou.com',
}: MaskedContactPhoneProps) {
  const [tel, setTel] = useState<{ telephone: string; whatsapp: string } | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)
  const formatPrix = (p?: number) => (p ? `${p.toLocaleString('fr-FR')} FCFA` : '')

  async function reveler() {
    setErreur(null)
    setChargement(true)
    try {
      const res = await fetch(`/api/annonces/${annonceId}/contact`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setErreur(data.error || 'Numéro indisponible pour le moment.')
        return
      }
      setTel({ telephone: data.telephone, whatsapp: data.whatsapp })
      try {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          ;(window as any).gtag('event', 'show_phone_number', { event_category: 'Contact', event_label: titre })
        }
      } catch (err) {
        console.warn('[Nopalou:MaskedContactPhone]', err)
      }
    } catch {
      setErreur('Connexion impossible, réessayez.')
    } finally {
      setChargement(false)
    }
  }

  if (!tel) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        <button
          type="button"
          onClick={reveler}
          disabled={chargement}
          className="annonce-contact-tel"
          style={{
            cursor: chargement ? 'wait' : 'pointer',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontWeight: 700,
          }}
          title="Cliquez pour afficher le numéro de téléphone complet"
        >
          {masque || 'Voir le numéro'}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, opacity: 0.85, fontWeight: 500, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 12 }}>
            <Eye size={12} />
            Afficher
          </span>
        </button>
        {erreur && (
          <p role="alert" style={{ margin: 0, fontSize: 12, color: 'var(--danger, #B42318)' }}>
            {erreur}
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <a href={`tel:+${tel.whatsapp}`} className="annonce-contact-tel">
        {tel.telephone}
      </a>
      <a
        href={`https://wa.me/${tel.whatsapp}?text=${encodeURIComponent(
          `Bonjour, je suis intéressé(e) par votre annonce :\n\n*${titre}*${prix ? ` — ${formatPrix(prix)}` : ''}\n\n${baseUrl}/annonces/${annonceId}`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="annonce-contact-whatsapp"
      >
        WhatsApp
      </a>
    </>
  )
}
