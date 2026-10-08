'use client'

import React, { useState } from 'react'
import { MapPin, ExternalLink, Route } from 'lucide-react'
import { CARTE_TRAFIC_EXTERNE, lienItineraire } from '@/lib/surga-trafic'

// D73 : trajet libre. L'utilisateur donne son départ et son arrivée ; Surga ouvre Google Maps sur cet itinéraire
// (l'application sur un téléphone, le site sinon). Lien gratuit, sans clé : le résultat s'affiche chez Google,
// Surga n'en reçoit rien.
export default function SurgaTraficTrajet() {
  const [depart, setDepart] = useState<string>('')
  const [arrivee, setArrivee] = useState<string>('')
  const pret = arrivee.trim().length >= 2

  const ouvrir = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pret) return
    window.open(lienItineraire(depart, arrivee), '_blank', 'noopener,noreferrer')
  }

  const champ: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid var(--surga-border, #E2E8F0)',
    fontSize: 14,
    color: 'var(--surga-text1, #0F172A)',
    backgroundColor: 'var(--surga-surface, #FFFFFF)',
    boxSizing: 'border-box',
  }

  return (
    <form
      onSubmit={ouvrir}
      style={{ padding: '10px 14px', borderBottom: '1px solid var(--surga-border, #E2E8F0)', display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'var(--surga-primary, #0F172A)' }}>
        <Route size={14} color="var(--surga-accent-text, #92400E)" />
        <span>Mon trajet</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={depart}
          onChange={(e) => setDepart(e.target.value)}
          placeholder="Départ (vide : ma position)"
          aria-label="Départ"
          autoComplete="off"
          style={{ ...champ, flexBasis: 140 }}
        />
        <input
          type="text"
          value={arrivee}
          onChange={(e) => setArrivee(e.target.value)}
          placeholder="Arrivée, ex. Colobane"
          aria-label="Arrivée"
          autoComplete="off"
          style={{ ...champ, flexBasis: 140 }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="submit"
          disabled={!pret}
          className="surga-btn-primary"
          style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', opacity: pret ? 1 : 0.55 }}
        >
          <span>Ouvrir dans Google Maps</span>
          <ExternalLink size={14} />
        </button>
        <a
          href={CARTE_TRAFIC_EXTERNE}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'var(--surga-accent-text, #92400E)', textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          <MapPin size={13} />
          <span>Carte du trafic</span>
        </a>
      </div>
      <div style={{ fontSize: 11, color: 'var(--surga-text3, #64748B)' }}>
        L’itinéraire et le trafic s’affichent dans Google Maps, service externe.
      </div>
    </form>
  )
}
